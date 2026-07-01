// app/api/webhooks/clerk-email/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { processedClerkEmailsTable } from "@/drizzle/schema";

import VerificationCodeEmail from "@/emails/VerificationCodeEmail";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";
import StaffInvitationEmail from "@/emails/StaffInvitationEmail";

interface ClerkEmailPayload {
  id: string;
  object: "email";
  slug:
    | "verification_code"
    | "reset_password_code"
    | "magic_link"
    | "invitation"
    | "organization_invitation"
    | string;
  from_email_name: string;
  to_email_address: string;
  subject: string;
  body: string;
  delivered_by_clerk: boolean;
  data?: {
    otp_code?: string;
    token?: string;
    action_url?: string;
    inviter_name?: string;
  };
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkEmailPayload;
}

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

function extractOtp(body: string): string | null {
  const match = body.match(/\b([0-9]{6})\b/);
  return match?.[1] ?? null;
}

async function sendViaGmail(
  to: string,
  subject: string,
  template: React.ReactElement,
): Promise<void> {
  const html = await render(template);
  const text = await render(template, { plainText: true });

  await getTransporter().sendMail({
    from: `"SchoolMealPay" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text,
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.CLERK_EMAIL_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[clerk-email webhook] CLERK_EMAIL_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, headers) as ClerkWebhookEvent;
  } catch (err) {
    console.error("[clerk-email webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── DEBUG: log every email event Clerk fires ──────────────────────────────
  console.log(
    `[clerk-email webhook] type=${event.type} slug=${event.data?.slug} to=${event.data?.to_email_address} emailId=${event.data?.id}`,
  );

  if (event.type !== "email.created") {
    return NextResponse.json({ received: true });
  }

  const emailId = event.data.id;

  try {
    const alreadyProcessed = await db.query.processedClerkEmailsTable.findFirst(
      {
        where: eq(processedClerkEmailsTable.id, emailId),
      },
    );

    if (alreadyProcessed) {
      console.log(
        `[clerk-email webhook] emailId=${emailId} already processed, skipping`,
      );
      return NextResponse.json({ received: true, skipped: true });
    }

    await db.insert(processedClerkEmailsTable).values({
      id: emailId,
      slug: event.data.slug,
    });
  } catch (err) {
    console.warn(
      "[clerk-email webhook] Idempotency insert failed, likely duplicate:",
      err,
    );
    return NextResponse.json({ received: true, skipped: true });
  }

  const { slug, to_email_address, body, data } = event.data;

  console.log(
    `[clerk-email webhook] dispatching slug=${slug} to=${to_email_address} otp=${data?.otp_code ?? "(extracted from body)"}`,
  );

  try {
    switch (slug) {
      case "verification_code": {
        const code = data?.otp_code ?? extractOtp(body);
        if (!code) {
          console.warn("[clerk-email webhook] Could not extract OTP");
          break;
        }
        await sendViaGmail(
          to_email_address,
          "Your SchoolMealPay verification code",
          <VerificationCodeEmail code={code} purpose="verify your email" />,
        );
        console.log(
          `[clerk-email webhook] sent verification_code to ${to_email_address}`,
        );
        break;
      }

      case "reset_password_code": {
        const code = data?.otp_code ?? extractOtp(body);
        if (!code) {
          console.warn("[clerk-email webhook] Could not extract OTP");
          break;
        }
        await sendViaGmail(
          to_email_address,
          "Reset your SchoolMealPay password",
          <ResetPasswordEmail code={code} />,
        );
        console.log(
          `[clerk-email webhook] sent reset_password_code to ${to_email_address}`,
        );
        break;
      }

      case "invitation":
      case "organization_invitation": {
        const invitationUrl = data?.action_url;
        if (!invitationUrl) {
          console.warn(
            "[clerk-email webhook] Could not extract invitation URL",
          );
          break;
        }
        await sendViaGmail(
          to_email_address,
          "You're invited to join SchoolMealPay",
          <StaffInvitationEmail
            invitationUrl={invitationUrl}
            invitedByName={data?.inviter_name}
          />,
        );
        console.log(
          `[clerk-email webhook] sent invitation to ${to_email_address}`,
        );
        break;
      }

      default:
        console.log(`[clerk-email webhook] unhandled slug=${slug}`);
        break;
    }
  } catch (err) {
    console.error("[clerk-email webhook] Error sending email:", err);
  }

  return NextResponse.json({ received: true });
}
