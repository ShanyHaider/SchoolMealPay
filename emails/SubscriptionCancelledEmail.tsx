import { Section, Text } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface SubscriptionCancelledEmailProps {
    name: string;
    planName: string;
    accessUntil: string;
}

export function SubscriptionCancelledEmail({
    name,
    planName,
    accessUntil,
}: SubscriptionCancelledEmailProps) {
    return (
        <BaseLayout preview={`Your ${planName} subscription has been cancelled`}>
            <Text style={heading}>Subscription cancelled.</Text>
            <Text style={subtext}>
                Hi {name}, your <strong>{planName}</strong> subscription has been
                cancelled. You'll retain full access until{" "}
                <strong>{accessUntil}</strong>, after which your account will revert
                to the free plan.
            </Text>

            <Section style={infoBox}>
                <Text style={infoText}>
                    Changed your mind? You can resubscribe anytime from your billing page
                    before your access expires.
                </Text>
            </Section>

            <Text style={hint}>
                Thanks for being a SchoolMealPay customer. If there's anything we could
                have done better, reply to this email — we read every message.
            </Text>
        </BaseLayout>
    );
}

export default SubscriptionCancelledEmail;

const heading: CSSProperties = { color: "#09090b", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.02em", margin: "0 0 8px" };
const subtext: CSSProperties = { color: "#52525b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" };
const infoBox: CSSProperties = { backgroundColor: "#f4f4f5", borderRadius: "10px", border: "1px solid #e4e4e7", padding: "14px 16px", marginBottom: "20px" };
const infoText: CSSProperties = { color: "#3f3f46", fontSize: "13px", lineHeight: "1.6", margin: 0 };
const hint: CSSProperties = { color: "#a1a1aa", fontSize: "12px", margin: 0 };