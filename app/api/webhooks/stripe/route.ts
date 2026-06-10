import { headers } from "next/headers";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/drizzle/db";
import { eq, sql } from "drizzle-orm";
import {
  stripeWebhookEventsTable,
  parentProSubscriptionsTable,
  subscriptionInvoicesTable,
  schoolSubscriptionTable,
  transactionsTable,
  parentWalletsTable,
} from "@/drizzle/schema";
import {
  revalidateParentProSubscriptionCache,
  revalidateSchoolSubscriptionCache,
  revalidateInvoices,
  revalidateWallet,
  revalidateTransactionCache,
} from "@/lib/cacheRevalidation";

// ─────────────────────────────────────────────────────────────────────────────
// Stripe sends the same event multiple times on network failure.
// We log every processed event ID in stripeWebhookEventsTable and skip
// duplicates — idempotency is non-negotiable for billing.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  // ── 1. Verify the webhook came from Stripe ──────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error(
      "[Stripe Webhook] Signature verification failed:",
      err.message,
    );
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // ── 2. Idempotency check ────────────────────────────────────────────────
  // Stripe retries on any non-2xx response. Check before processing.
  try {
    const alreadyProcessed = await db.query.stripeWebhookEventsTable.findFirst({
      where: eq(stripeWebhookEventsTable.id, event.id),
    });

    if (alreadyProcessed) {
      return new Response("Already processed", { status: 200 });
    }
  } catch (err) {
    console.error("[Stripe Webhook] Idempotency check failed:", err);
    return new Response("Database error", { status: 500 });
  }

  // ── 3. Handle events ────────────────────────────────────────────────────
  try {
    switch (event.type) {
      // ── Wallet top-up completed ───────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};

        if (meta.transactionType === "wallet_topup") {
          await handleWalletTopup(session, meta);
        }
        // Subscriptions activate via customer.subscription.created — handled below.
        break;
      }

      // ── Subscription created (first checkout) ─────────────────────────
      // Routes to parent Pro or school handler based on metadata.
      case "customer.subscription.created":
      // ── Subscription updated (renewal, status change, plan change) ────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        if (sub.metadata?.parentId) {
          await upsertParentProSubscription(sub);
        } else if (sub.metadata?.schoolAdminId) {
          await upsertSchoolSubscription(sub);
        } else {
          console.warn(
            "[Stripe Webhook] subscription missing known metadata — skipping:",
            sub.id,
          );
        }
        break;
      }

      // ── Subscription cancelled ────────────────────────────────────────
      // Stripe fires "deleted" for both user-initiated cancels and hard
      // expiries. We store "cancelled" + record cancelledAt timestamp.
      // "expired" stays reserved for time-based lapse in our own logic.
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        if (sub.metadata?.parentId) {
          await db
            .update(parentProSubscriptionsTable)
            .set({ status: "cancelled", cancelledAt: new Date() })
            .where(
              eq(parentProSubscriptionsTable.parentId, sub.metadata.parentId),
            );
          revalidateParentProSubscriptionCache(sub.metadata.parentId);
        } else if (sub.metadata?.schoolAdminId) {
          await db
            .update(schoolSubscriptionTable)
            .set({
              status: "cancelled",
              cancelledAt: new Date(),
              updatedAt: new Date(),
            })
            .where(
              eq(schoolSubscriptionTable.stripeSubscriptionId, sub.id),
            );
          revalidateSchoolSubscriptionCache();
        } else {
          console.warn(
            "[Stripe Webhook] subscription.deleted missing known metadata — skipping:",
            sub.id,
          );
        }
        break;
      }

      // ── Invoice paid — record billing history ─────────────────────────
      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      // ── Invoice failed — mark past_due ────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        // Stripe Basil API 2025: subscription reference lives under invoice.parent
        const subId =
          invoice.parent?.type === "subscription_details" ?
            (invoice.parent.subscription_details?.subscription as string | null)
            : null;

        if (subId) {
          // Check parent Pro first
          const parentRow = await db.query.parentProSubscriptionsTable.findFirst(
            {
              where: eq(
                parentProSubscriptionsTable.stripeSubscriptionId,
                subId,
              ),
            },
          );

          if (parentRow) {
            await db
              .update(parentProSubscriptionsTable)
              .set({ status: "past_due" })
              .where(
                eq(parentProSubscriptionsTable.stripeSubscriptionId, subId),
              );
            revalidateParentProSubscriptionCache(parentRow.parentId);
            break;
          }

          // Check school subscription
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
    }

    // ── 4. Mark event as processed ────────────────────────────────────────
    await db.insert(stripeWebhookEventsTable).values({
      id: event.id,
      type: event.type,
      processedAt: new Date(),
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(`[Stripe Webhook] Handler failed for ${event.type}:`, err);
    // Return 500 so Stripe retries. Idempotency check prevents double-processing
    // if the handler succeeded but the processedAt insert failed.
    return new Response("Internal error", { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function handleWalletTopup(
  session: Stripe.Checkout.Session,
  meta: Record<string, string>,
) {
  const parentId = meta.parentId;
  const amountStr =
    session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";

  // Atomic: log transaction + increment wallet balance in one DB transaction.
  // sql`... + amount::numeric` is concurrency-safe — avoids read-modify-write race.
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

// ── Parent Pro subscription upsert ────────────────────────────────────────────
// Handles both created and updated events for parent subscriptions.
// Uses onConflictDoUpdate so it's safe to call for either event type.
async function upsertParentProSubscription(sub: Stripe.Subscription) {
  const parentId = sub.metadata?.parentId;
  if (!parentId) {
    console.warn(
      "[Stripe Webhook] subscription missing parentId metadata:",
      sub.id,
    );
    return;
  }

  // NOTE — Stripe Basil API (2025-03-31) breaking change:
  // current_period_start and current_period_end were removed from the
  // top-level Subscription object and moved to each SubscriptionItem.
  // See: https://docs.stripe.com/changelog/basil/2025-03-31/deprecate-subscription-current-period-start-and-end
  const item = sub.items?.data?.[0];
  if (!item?.current_period_start || !item?.current_period_end) {
    console.warn(
      "[Stripe Webhook] Missing period dates on subscription item:",
      sub.id,
    );
    return;
  }

  const values = {
    parentId,
    status:
      sub.status as (typeof parentProSubscriptionsTable.$inferInsert)["status"],
    stripeCustomerId: sub.customer as string,
    stripeSubscriptionId: sub.id,
    currentPeriodStart: new Date(item.current_period_start * 1000), // ✅ from item
    currentPeriodEnd: new Date(item.current_period_end * 1000), // ✅ from item
    trialStartedAt: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    // trialUsed = true once Stripe sets a trial_start, even if it has since ended
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

// ── School subscription upsert ────────────────────────────────────────────────
// Single-row table — always updates the one seeded row by its primary key.
// Never inserts; if there's no row the seed script hasn't been run yet.
async function upsertSchoolSubscription(sub: Stripe.Subscription) {
  // Stripe Basil API 2025: period dates live on the subscription item, not the
  // top-level subscription object.
  const item = sub.items?.data?.[0];
  if (!item?.current_period_start || !item?.current_period_end) {
    console.warn(
      "[Stripe Webhook] Missing period dates on school subscription item:",
      sub.id,
    );
    return;
  }

  // Single-row table — find the one existing row (seeded at setup time).
  // We match by stripeSubscriptionId first (handles renewals / updates),
  // then fall back to the first row (handles the very first creation event
  // before we've written the Stripe IDs into the DB).
  const existing =
    (await db.query.schoolSubscriptionTable.findFirst({
      where: eq(schoolSubscriptionTable.stripeSubscriptionId, sub.id),
    })) ?? (await db.query.schoolSubscriptionTable.findFirst());

  if (!existing) {
    console.warn(
      "[Stripe Webhook] No school subscription row found — run the seed script.",
    );
    return;
  }

  await db
    .update(schoolSubscriptionTable)
    .set({
      status:
        sub.status as (typeof schoolSubscriptionTable.$inferInsert)["status"],
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
  // Stripe Basil API 2025: subscription reference lives under invoice.parent
  const subId =
    invoice.parent?.type === "subscription_details" ?
      (invoice.parent.subscription_details?.subscription as string | null)
      : null;

  if (!subId) return;

  const amountStr =
    invoice.amount_paid ? (invoice.amount_paid / 100).toFixed(2) : "0.00";

  const periodStart =
    invoice.period_start ? new Date(invoice.period_start * 1000) : null;
  const periodEnd =
    invoice.period_end ? new Date(invoice.period_end * 1000) : null;

  // ── Parent Pro invoice ──────────────────────────────────────────────────
  // subscriptionInvoicesTable.subscriptionId FKs to schoolSubscriptionTable only.
  // Parent Pro billing history is represented by the transaction record written
  // at checkout — there is no separate invoice table for parent subscriptions.
  // On renewal we just update the subscription row's period so the UI shows
  // the accurate "active until" date.
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

  // ── School subscription invoice ─────────────────────────────────────────
  const schoolSub =
    (await db.query.schoolSubscriptionTable.findFirst({
      where: eq(schoolSubscriptionTable.stripeSubscriptionId, subId),
    })) ?? (await db.query.schoolSubscriptionTable.findFirst());

  if (!schoolSub) {
    // Unknown subscription — log and skip rather than writing bad FK data
    console.warn(
      "[Stripe Webhook] invoice.payment_succeeded: no school subscription row — run seed script",
    );
    return;
  }

  // Update the school subscription status to active and refresh period dates.
  // The subscription.updated event also does this, but doing it here too ensures
  // the billing page reflects "active" immediately after the invoice is paid,
  // even if the subscription event arrives out of order.
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

  // Avoid duplicate invoice rows on retry — stripeInvoiceId has a unique constraint
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
    });
  }

  revalidateSchoolSubscriptionCache();
  revalidateInvoices();
}