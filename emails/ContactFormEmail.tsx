import { Section, Text, Hr } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface ContactFormEmailProps {
    name: string;
    email: string;
    topic: string;
    message: string;
}

export function ContactFormEmail({ name, email, topic, message }: ContactFormEmailProps) {
    return (
        <BaseLayout preview={`New contact: ${topic} from ${name}`}>
            <Text style={heading}>New contact form submission</Text>

            <Section style={metaBox}>
                <Text style={metaLabel}>From</Text>
                <Text style={metaValue}>{name}</Text>
                <Text style={metaLabel}>Email</Text>
                <Text style={metaValue}>{email}</Text>
                <Text style={metaLabel}>Topic</Text>
                <Text style={metaValue}>{topic}</Text>
            </Section>

            <Text style={messageLabel}>Message</Text>
            <Section style={messageBox}>
                <Text style={messageText}>{message}</Text>
            </Section>
        </BaseLayout>
    );
}

export default ContactFormEmail;

const heading: CSSProperties = { color: "#09090b", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.02em", margin: "0 0 20px" };
const metaBox: CSSProperties = { backgroundColor: "#f4f4f5", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px" };
const metaLabel: CSSProperties = { color: "#71717a", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", margin: "8px 0 2px" };
const metaValue: CSSProperties = { color: "#09090b", fontSize: "13px", fontWeight: "600", margin: "0 0 4px" };
const messageLabel: CSSProperties = { color: "#71717a", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" };
const messageBox: CSSProperties = { backgroundColor: "#f4f4f5", borderRadius: "10px", padding: "14px 16px" };
const messageText: CSSProperties = { color: "#3f3f46", fontSize: "14px", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" };