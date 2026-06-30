import { Section, Text } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface SubscriptionConfirmationEmailProps {
    name: string;
    planName: string;
    cycle: "monthly" | "annual";
    amount: string;
    nextBillingDate: string;
    isTrial?: boolean;
    trialEndsAt?: string;
}

export function SubscriptionConfirmationEmail({
    name,
    planName,
    cycle,
    amount,
    nextBillingDate,
    isTrial,
    trialEndsAt,
}: SubscriptionConfirmationEmailProps) {
    return (
        <BaseLayout preview={`You're subscribed to ${planName} — SchoolMealPay`}>
            <Text style={heading}>
                {isTrial ? "Your free trial has started." : "Subscription confirmed."}
            </Text>
            <Text style={subtext}>
                Hi {name},{" "}
                {isTrial
                    ? `your free trial of ${planName} is now active. You won't be charged until the trial ends.`
                    : `you're now subscribed to ${planName}. Here's a summary of your plan.`}
            </Text>

            <Section style={metaBox}>
                {[
                    { label: "Plan", value: planName },
                    { label: "Billing cycle", value: cycle === "monthly" ? "Monthly" : "Annual" },
                    { label: "Amount", value: `PKR ${amount}` },
                    ...(isTrial && trialEndsAt
                        ? [{ label: "Trial ends", value: trialEndsAt }]
                        : [{ label: "Next billing date", value: nextBillingDate }]),
                ].map(({ label, value }) => (
                    <Section key={label} style={metaRow}>
                        <Text style={metaLabel}>{label}</Text>
                        <Text style={metaValue}>{value}</Text>
                    </Section>
                ))}
            </Section>

            <Text style={hint}>
                You can manage your subscription anytime from your billing page.
                If you have any questions, reply to this email.
            </Text>
        </BaseLayout>
    );
}

export default SubscriptionConfirmationEmail;

const heading: CSSProperties = { color: "#09090b", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.02em", margin: "0 0 8px" };
const subtext: CSSProperties = { color: "#52525b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" };
const metaBox: CSSProperties = { backgroundColor: "#f4f4f5", borderRadius: "10px", padding: "4px 16px", marginBottom: "20px" };
const metaRow: CSSProperties = { padding: "8px 0", borderBottom: "1px solid #e4e4e7" };
const metaLabel: CSSProperties = { color: "#71717a", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" };
const metaValue: CSSProperties = { color: "#09090b", fontSize: "13px", fontWeight: "600", margin: 0 };
const hint: CSSProperties = { color: "#a1a1aa", fontSize: "12px", margin: 0 };