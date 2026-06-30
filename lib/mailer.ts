import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import { ReactElement } from "react";

// ─── Transport (lazily created) ───────────────────────────────────────────────

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
    if (!_transporter) {
        const user = process.env.EMAIL_FROM;
        const pass = process.env.GMAIL_APP_PASSWORD;

        if (!user || !pass) {
            throw new Error("EMAIL_FROM and GMAIL_APP_PASSWORD must be set");
        }

        _transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass },
        });
    }
    return _transporter;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    /** React Email element — rendered to HTML automatically */
    template: ReactElement;
}

export interface SendEmailResult {
    id?: string;
    error?: string;
}

export async function sendEmail({
    to,
    subject,
    template,
}: SendEmailOptions): Promise<SendEmailResult> {
    try {
        const html = await render(template);
        const text = await render(template, { plainText: true });

        const info = await getTransporter().sendMail({
            from: `"SchoolMealPay" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html,
            text,
        });

        return { id: info.messageId };
    } catch (err: any) {
        console.error("[mailer] Error:", err);
        return { error: err?.message ?? "Failed to send email" };
    }
}