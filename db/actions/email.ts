"use server";

import { createElement } from "react";

import { ContactFormEmail } from "@/emails/ContactFormEmail";
import { ContactConfirmationEmail } from "@/emails/ContactConfirmationEmail";
import { DemoBookingEmail } from "@/emails/DemoBookingEmail";
import { DemoConfirmationEmail } from "@/emails/DemoConfirmationEmail";
import { NewsletterConfirmationEmail } from "@/emails/NewsletterConfirmationEmail";
import { NewsletterNotificationEmail } from "@/emails/NewsletterNotificationEmail";
import { db } from "@/drizzle/db";
import { contactSubmissionsTable, demoRequestsTable, newsletterSubscribersTable } from "@/drizzle/schema/marketing";
import { sendEmail } from "@/lib/mailer";

export async function submitContactForm(data: {
    name: string; email: string; topic: string; message: string;
}) {
    await Promise.all([
        // Persist
        db.insert(contactSubmissionsTable).values({
            name: data.name,
            email: data.email,
            topic: data.topic,
            message: data.message,
        }),
        // Notify you
        sendEmail({
            to: process.env.EMAIL_FROM!,
            subject: `[Contact] ${data.topic} — ${data.name}`,
            template: createElement(ContactFormEmail, data),
        }),
        // Confirm to user
        sendEmail({
            to: data.email,
            subject: "We got your message — SchoolMealPay",
            template: createElement(ContactConfirmationEmail, { name: data.name, topic: data.topic }),
        }),
    ]);
}

export async function submitDemoForm(data: {
    name: string; email: string; school: string; phone: string;
    role: string; date: string; slot: string;
}) {
    await Promise.all([
        // Persist
        db.insert(demoRequestsTable).values({
            name: data.name,
            email: data.email,
            school: data.school,
            role: data.role,
            phone: data.phone || null,
            preferredDate: data.date || null,
            preferredSlot: data.slot,
        }),
        // Notify you
        sendEmail({
            to: process.env.EMAIL_FROM!,
            subject: `[Demo] ${data.name} — ${data.school}`,
            template: createElement(DemoBookingEmail, data),
        }),
        // Confirm to user
        sendEmail({
            to: data.email,
            subject: "Demo confirmed — SchoolMealPay",
            template: createElement(DemoConfirmationEmail, {
                name: data.name, school: data.school, slot: data.slot, date: data.date,
            }),
        }),
    ]);
}

export async function submitNewsletterForm(email: string) {
    const result = await db
        .insert(newsletterSubscribersTable)
        .values({ email })
        .onConflictDoNothing()
        .returning({ id: newsletterSubscribersTable.id });

    // Already subscribed — do nothing, don't send emails
    if (result.length === 0) return;

    await Promise.all([
        sendEmail({
            to: process.env.EMAIL_FROM!,
            subject: `[Newsletter] New subscriber: ${email}`,
            template: createElement(NewsletterNotificationEmail, { email }),
        }),
        sendEmail({
            to: email,
            subject: "You're subscribed — SchoolMealPay",
            template: createElement(NewsletterConfirmationEmail, {}),
        }),
    ]);
}