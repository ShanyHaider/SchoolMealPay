import { Section, Text } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface NewsletterNotificationEmailProps {
    email: string;
}

export function NewsletterNotificationEmail({ email }: NewsletterNotificationEmailProps) {
    return (
        <BaseLayout preview={`New newsletter subscriber: ${email}`}>
            <Text style={heading}>New subscriber</Text>
            <Section style={metaBox}>
                <Text style={metaLabel}>Email</Text>
                <Text style={metaValue}>{email}</Text>
            </Section>
        </BaseLayout>
    );
}

export default NewsletterNotificationEmail;

const heading: CSSProperties = { color: "#09090b", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.02em", margin: "0 0 20px" };
const metaBox: CSSProperties = { backgroundColor: "#f4f4f5", borderRadius: "10px", padding: "14px 16px" };
const metaLabel: CSSProperties = { color: "#71717a", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" };
const metaValue: CSSProperties = { color: "#09090b", fontSize: "13px", fontWeight: "600", margin: 0 };