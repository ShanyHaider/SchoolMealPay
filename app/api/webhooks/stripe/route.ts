import { headers } from "next/headers";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/drizzle/db";
import { eq, sql } from "drizzle-orm";
import { createElement } from "react";
import {
  stripeWebhookEventsTable,
  parentProSubscriptionsTable,
  subscriptionInvoicesTable,
  schoolSubscriptionTable,
  transactionsTable,
  parentWalletsTable,
  usersTable,
} from "@/drizzle/schema";
import {
  revalidateParentProSubscriptionCache,
  revalidateSchoolSubscriptionCache,
  revalidateInvoices,
  revalidateWallet,
  revalidateTransactionCache,
} from "@/lib/cacheRevalidation";
import { sendEmail } from "@/lib/mailer";
import { SubscriptionConfirmationEmail } from "@/emails/SubscriptionConfirmationEmail";
import { TrialEndingEmail } from "@/emails/TrialEndingEmail";
import { SubscriptionCancelledEmail } from "@/emails/SubscriptionCancelledEmail";

// ─── Email helper ─────────────────────────────────────────────────────────────
// Looks up the user by DB id or clerkId, returns name + email.
// Never throws — email failure must not break billing.

async function getUserDetails(
  where: { parentId?: string; schoolAdminId?: string },
): Promise<{ name: string; email: string } | null> {
  try {
    const userId = where.parentId ?? where.schoolAdminId;
    if (!userId) return null;
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
      columns: { name: true, email: true },
    });
    return user ?? null;
  } catch {
    return null;
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function getPlanName(sub: Stripe.Subscription) {
  const priceId = sub.items?.data?.[0]?.price?.id ?? "";
  if (sub.metadata?.parentId) return "Parent Pro";
  if (sub.metadata?.schoolAdminId) return "Premium School";
  return "Premium";
}

function getCycle(sub: Stripe.Subscription): "monthly" | "annual" {
  const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
  return interval === "year" ? "annual" : "monthly";
}

function getAmount(sub: Stripe.Subscription) {
  const cents = sub.items?.data?.[0]?.price?.unit_amount ?? 0;
  return (cents / 100).toLocaleString();
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    const alreadyProcessed = await db.query.stripeWebhookEventsTable.findFirst({
      where: eq(stripeWebhookEventsTable.id, event.id),
    });
    if (alreadyProcessed) return new Response("Already processed", { status: 200 });
  } catch (err) {
    console.error("[Stripe Webhook] Idempotency check failed:", err);
    return new Response("Database error", { status: 500 });
  }

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        if (meta.transactionType === "wallet_topup") {
          await handleWalletTopup(session, meta);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        if (sub.metadata?.parentId) {
          await upsertParentProSubscription(sub);
        } else if (sub.metadata?.schoolAdminId) {
          await upsertSchoolSubscription(sub);
        } else {
          console.warn("[Stripe Webhook] subscription missing known metadata — skipping:", sub.id);
          break;
        }

        // ── Send confirmation email on first creation only ────────────────
        if (event.type === "customer.subscription.created") {
          const user = await getUserDetails({
            parentId: sub.metadata?.parentId,
            schoolAdminId: sub.metadata?.schoolAdminId,
          });

          if (user) {
            const item = sub.items?.data?.[0];
            const periodEnd = item?.current_period_end
              ? new Date(item.current_period_end * 1000)
              : new Date();
            const isTrial = sub.status === "trialing";
            const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;

            await sendEmail({
              to: user.email,
              subject: `Subscription confirmed — SchoolMealPay`,
              template: createElement(SubscriptionConfirmationEmail, {
                name: user.name,
                planName: getPlanName(sub),
                cycle: getCycle(sub),
                amount: getAmount(sub),
                nextBillingDate: formatDate(periodEnd),
                isTrial,
                trialEndsAt: trialEnd ? formatDate(trialEnd) : undefined,
              }),
            }).catch((err) =>
              console.error("[Stripe Webhook] Failed to send subscription confirmation email:", err)
            );
          }
        }
        break;
      }

      // ── Trial ending in 3 days — Stripe fires this automatically ─────────
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;

        const user = await getUserDetails({
          parentId: sub.metadata?.parentId,
          schoolAdminId: sub.metadata?.schoolAdminId,
        });

        if (user) {
          const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;

          await sendEmail({
            to: user.email,
            subject: `Your free trial ends soon — SchoolMealPay`,
            template: createElement(TrialEndingEmail, {
              name: user.name,
              planName: getPlanName(sub),
              trialEndsAt: trialEnd ? formatDate(trialEnd) : "soon",
              amount: getAmount(sub),
              cycle: getCycle(sub),
            }),
          }).catch((err) =>
            console.error("[Stripe Webhook] Failed to send trial ending email:", err)
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        if (sub.metadata?.parentId) {
          await db
            .update(parentProSubscriptionsTable)
            .set({ status: "cancelled", cancelledAt: new Date() })
            .where(eq(parentProSubscriptionsTable.parentId, sub.metadata.parentId));
          revalidateParentProSubscriptionCache(sub.metadata.parentId);
        } else if (sub.metadata?.schoolAdminId) {
          await db
            .update(schoolSubscriptionTable)
            .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
            .where(eq(schoolSubscriptionTable.stripeSubscriptionId, sub.id));
          revalidateSchoolSubscriptionCache();
        } else {
          console.warn("[Stripe Webhook] subscription.deleted missing known metadata — skipping:", sub.id);
          break;
        }

        // ── Send cancellation email ────────────────────────────────────────
        const user = await getUserDetails({
          parentId: sub.metadata?.parentId,
          schoolAdminId: sub.metadata?.schoolAdminId,
        });

        if (user) {
          const item = sub.items?.data?.[0];
          const accessUntil = item?.current_period_end
            ? formatDate(new Date(item.current_period_end * 1000))
            : "the end of your billing period";

          await sendEmail({
            to: user.email,
            subject: `Subscription cancelled — SchoolMealPay`,
            template: createElement(SubscriptionCancelledEmail, {
              name: user.name,
              planName: getPlanName(sub),
              accessUntil,
            }),
          }).catch((err) =>
            console.error("[Stripe Webhook] Failed to send cancellation email:", err)
          );
        }
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        const subId =
          invoice.parent?.type === "subscription_details"
            ? (invoice.parent.subscription_details?.subscription as string | null)
            : null;

        if (subId) {
          const parentRow = await db.query.parentProSubscriptionsTable.findFirst({
            where: eq(parentProSubscriptionsTable.stripeSubscriptionId, subId),
          });

          if (parentRow) {
            await db
              .update(parentProSubscriptionsTable)
              .set({ status: "past_due" })
              .where(eq(parentProSubscriptionsTable.stripeSubscriptionId, subId));
            revalidateParentProSubscriptionCache(parentRow.parentId);
            break;
          }

          const schoolRow = await db.query.schoolSubscriptionTable.findFirst({
            where: eq(schoolSubscriptionTable.stripeSubscriptionId, subId),
          });

          if (schoolRow) {
            await db
              .update(schoolSubscriptionTable)
              .set({ status: "past_due", updatedAt: new Date() })
              .where(eq(schoolSubscriptionTable.stripeSubscriptionId, subId));
            revalidateSchoolSubscriptionCache();
          }
        }
        break;
      }

      default:
        break;
    }

    await db.insert(stripeWebhookEventsTable).values({
      id: event.id,
      type: event.type,
      processedAt: new Date(),
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(`[Stripe Webhook] Handler failed for ${event.type}:`, err);
    return new Response("Internal error", { status: 500 });
  }
}

// ─── Helpers (unchanged) ─────────────────────────────────────────────────────

async function handleWalletTopup(
  session: Stripe.Checkout.Session,
  meta: Record<string, string>,
) {
  const parentId = meta.parentId;
  const amountStr =
    session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";

  const txRecord = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(transactionsTable)
      .values({
        orderId: null,
        parentId,
        transactionRef: session.id,
        amount: amountStr,
        paymentMethod: "stripe",
        status: "success",
        transactionType: "wallet_topup",
        processedAt: new Date(),
      })
      .returning();

    await tx
      .update(parentWalletsTable)
      .set({
        balance: sql`${parentWalletsTable.balance} + ${amountStr}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(parentWalletsTable.parentId, parentId));

    return inserted;
  });

  revalidateTransactionCache(txRecord.id, parentId);
  revalidateWallet(parentId);
}

async function upsertParentProSubscription(sub: Stripe.Subscription) {
  const parentId = sub.metadata?.parentId;
  if (!parentId) {
    console.warn("[Stripe Webhook] subscription missing parentId metadata:", sub.id);
    return;
  }

  const item = sub.items?.data?.[0];
  if (!item?.current_period_start || !item?.current_period_end) {
    console.warn("[Stripe Webhook] Missing period dates on subscription item:", sub.id);
    return;
  }

  const values = {
    parentId,
    status: sub.status as (typeof parentProSubscriptionsTable.$inferInsert)["status"],
    stripeCustomerId: sub.customer as string,
    stripeSubscriptionId: sub.id,
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    trialStartedAt: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    trialUsed: sub.trial_start != null,
  };

  await db
    .insert(parentProSubscriptionsTable)
    .values(values)
    .onConflictDoUpdate({
      target: parentProSubscriptionsTable.parentId,
      set: {
        status: values.status,
        stripeSubscriptionId: values.stripeSubscriptionId,
        currentPeriodStart: values.currentPeriodStart,
        currentPeriodEnd: values.currentPeriodEnd,
        trialStartedAt: values.trialStartedAt,
        trialEndsAt: values.trialEndsAt,
        trialUsed: values.trialUsed,
      },
    });

  revalidateParentProSubscriptionCache(parentId);
}

async function upsertSchoolSubscription(sub: Stripe.Subscription) {
  const item = sub.items?.data?.[0];
  if (!item?.current_period_start || !item?.current_period_end) {
    console.warn("[Stripe Webhook] Missing period dates on school subscription item:", sub.id);
    return;
  }

  const existing =
    (await db.query.schoolSubscriptionTable.findFirst({
      where: eq(schoolSubscriptionTable.stripeSubscriptionId, sub.id),
    })) ?? (await db.query.schoolSubscriptionTable.findFirst());

  if (!existing) {
    console.warn("[Stripe Webhook] No school subscription row found — run the seed script.");
    return;
  }

  await db
    .update(schoolSubscriptionTable)
    .set({
      status: sub.status as (typeof schoolSubscriptionTable.$inferInsert)["status"],
      tier: "premium_school",
      stripeCustomerId: sub.customer as string,
      stripeSubscriptionId: sub.id,
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      trialStartedAt: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
      trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      trialUsed: sub.trial_start != null,
      updatedAt: new Date(),
    })
    .where(eq(schoolSubscriptionTable.id, existing.id));

  revalidateSchoolSubscriptionCache();
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subId =
    invoice.parent?.type === "subscription_details"
      ? (invoice.parent.subscription_details?.subscription as string | null)
      : null;

  if (!subId) return;

  // ✅ Fetch the live subscription to get the correct current_period_end
  const stripeSub = await stripe.subscriptions.retrieve(subId);
  const item = stripeSub.items?.data?.[0];

  const periodStart = item?.current_period_start
    ? new Date(item.current_period_start * 1000)
    : null;
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;

  const amountStr =
    invoice.amount_paid ? (invoice.amount_paid / 100).toFixed(2) : "0.00";

  const parentProRow = await db.query.parentProSubscriptionsTable.findFirst({
    where: eq(parentProSubscriptionsTable.stripeSubscriptionId, subId),
  });

  if (parentProRow) {
    await db
      .update(parentProSubscriptionsTable)
      .set({
        status: "active",
        currentPeriodStart: periodStart ?? undefined,
        currentPeriodEnd: periodEnd ?? undefined,
      })
      .where(eq(parentProSubscriptionsTable.stripeSubscriptionId, subId));

    revalidateParentProSubscriptionCache(parentProRow.parentId);
    return;
  }

  const schoolSub =
    (await db.query.schoolSubscriptionTable.findFirst({
      where: eq(schoolSubscriptionTable.stripeSubscriptionId, subId),
    })) ?? (await db.query.schoolSubscriptionTable.findFirst());

  if (!schoolSub) {
    console.warn("[Stripe Webhook] invoice.payment_succeeded: no school subscription row — run seed script");
    return;
  }

  await db
    .update(schoolSubscriptionTable)
    .set({
      status: "active",
      tier: "premium_school",
      stripeSubscriptionId: subId,
      currentPeriodStart: periodStart ?? undefined,
      currentPeriodEnd: periodEnd ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(schoolSubscriptionTable.id, schoolSub.id));

  const existingInvoice = await db.query.subscriptionInvoicesTable.findFirst({
    where: eq(subscriptionInvoicesTable.stripeInvoiceId, invoice.id),
  });

  if (!existingInvoice) {
    await db.insert(subscriptionInvoicesTable).values({
      subscriptionId: schoolSub.id,
      stripeInvoiceId: invoice.id,
      amount: amountStr,
      currency: invoice.currency.toUpperCase(),
      status: "paid",
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      paidAt: new Date(),
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    });
  }

  revalidateSchoolSubscriptionCache();
  revalidateInvoices();
}