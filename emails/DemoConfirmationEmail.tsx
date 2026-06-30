import { Section, Text } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface DemoConfirmationEmailProps {
    name: string;
    school: string;
    slot: string;
    date: string;
}

export function DemoConfirmationEmail({ name, school, slot, date }: DemoConfirmationEmailProps) {
    return (
        <BaseLayout preview={`Demo confirmed — ${slot}${date ? ` on ${date}` : ""}`}>
            <Text style={heading}>You're booked.</Text>
            <Text style={subtext}>
                Hi {name}, your SchoolMealPay demo is confirmed. You'll receive a Zoom link within the hour.
            </Text>

            <Section style={metaBox}>
                {[
                    { label: "School", value: school },
                    { label: "Time", value: `${slot}${date ? ` on ${date}` : ""}` },
                    { label: "Duration", value: "20 minutes" },
                    { label: "Format", value: "Zoom — screen share" },
                ].map(({ label, value }) => (
                    <Text key={label} style={metaRow}>
                        <span style={metaLabel}>{label}: </span>
                        <span style={metaValue}>{value}</span>
                    </Text>
                ))}
            </Section>

            <Text style={hint}>— The SchoolMealPay Team, Rawalpindi</Text>
        </BaseLayout>
    );
}

export default DemoConfirmationEmail;

const heading: CSSProperties = { color: "#09090b", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.02em", margin: "0 0 8px" };
const subtext: CSSProperties = { color: "#52525b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" };
const metaBox: CSSProperties = { backgroundColor: "#f4f4f5", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px" };
const metaRow: CSSProperties = { margin: "4px 0", fontSize: "13px" };
const metaLabel: CSSProperties = { color: "#71717a", fontWeight: "700" };
const metaValue: CSSProperties = { color: "#09090b", fontWeight: "600" };
const hint: CSSProperties = { color: "#a1a1aa", fontSize: "12px", margin: 0 };