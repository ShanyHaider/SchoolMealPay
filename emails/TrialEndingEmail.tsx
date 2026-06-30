import { Section, Text } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface TrialEndingEmailProps {
    name: string;
    planName: string;
    trialEndsAt: string;
    amount: string;
    cycle: "monthly" | "annual";
}

export function TrialEndingEmail({
    name,
    planName,
    trialEndsAt,
    amount,
    cycle,
}: TrialEndingEmailProps) {
    return (
        <BaseLayout preview={`Your ${planName} trial ends on ${trialEndsAt}`}>
            <Text style={heading}>Your free trial is ending soon.</Text>
            <Text style={subtext}>
                Hi {name}, your free trial of <strong>{planName}</strong> ends on{" "}
                <strong>{trialEndsAt}</strong>. After that, you'll be automatically
                charged <strong>PKR {amount}</strong> per{" "}
                {cycle === "monthly" ? "month" : "year"}.
            </Text>

            <Section style={infoBox}>
                <Text style={infoText}>
                    To avoid being charged, cancel your subscription from the billing page
                    before your trial ends. Otherwise, no action is needed — your plan
                    continues automatically.
                </Text>
            </Section>

            <Text style={hint}>
                Questions? Reply to this email and we'll help you out.
            </Text>
        </BaseLayout>
    );
}

export default TrialEndingEmail;

const heading: CSSProperties = { color: "#09090b", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.02em", margin: "0 0 8px" };
const subtext: CSSProperties = { color: "#52525b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" };
const infoBox: CSSProperties = { backgroundColor: "#fefce8", borderRadius: "10px", border: "1px solid #fde047", padding: "14px 16px", marginBottom: "20px" };
const infoText: CSSProperties = { color: "#713f12", fontSize: "13px", lineHeight: "1.6", margin: 0 };
const hint: CSSProperties = { color: "#a1a1aa", fontSize: "12px", margin: 0 };