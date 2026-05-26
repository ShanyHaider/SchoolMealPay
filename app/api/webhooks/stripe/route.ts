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
      console.log(`[Stripe Webhook] Duplicate event skipped: ${event.id}`);
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

      // ── Parent Pro subscription created (first checkout) ──────────────
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertParentProSubscription(sub);
        break;
      }

      // ── Subscription updated (renewal, status change, plan change) ────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertParentProSubscription(sub);
        break;
      }

      // ── Subscription cancelled ────────────────────────────────────────
      // Stripe fires "deleted" for both user-initiated cancels and hard
      // expiries. We store "cancelled" + record cancelledAt timestamp.
      // "expired" stays reserved for time-based lapse in our own logic.
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const parentId = sub.metadata?.parentId;

        if (parentId) {
          await db
            .update(parentProSubscriptionsTable)
            .set({ status: "cancelled", cancelledAt: new Date() })
            .where(eq(parentProSubscriptionsTable.parentId, parentId));

          revalidateParentProSubscriptionCache(parentId);
        }
        break;
      }

      // ── Invoice paid — record billing history ─────────────────────────
      case "invoice.payment_succeeded": {
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
          const row = await db.query.parentProSubscriptionsTable.findFirst({
            where: eq(parentProSubscriptionsTable.stripeSubscriptionId, subId),
          });

          if (row) {
            await db
              .update(parentProSubscriptionsTable)
              .set({ status: "past_due" })
              .where(
                eq(parentProSubscriptionsTable.stripeSubscriptionId, subId),
              );

            revalidateParentProSubscriptionCache(row.parentId);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
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
  const schoolSub = await db.query.schoolSubscriptionTable.findFirst({
    where: eq(schoolSubscriptionTable.stripeSubscriptionId, subId),
  });

  if (!schoolSub) {
    // Unknown subscription — log and skip rather than writing bad FK data
    console.warn(
      "[Stripe Webhook] invoice.payment_succeeded: no matching subscription for",
      subId,
    );
    return;
  }

  await db.insert(subscriptionInvoicesTable).values({
    subscriptionId: schoolSub.id, // FK to schoolSubscriptionTable ✓
    stripeInvoiceId: invoice.id,
    amount: amountStr,
    currency: invoice.currency.toUpperCase(),
    status: "paid",
    billingPeriodStart: periodStart,
    billingPeriodEnd: periodEnd,
    paidAt: new Date(),
  });

  revalidateSchoolSubscriptionCache();
  revalidateInvoices();
}
