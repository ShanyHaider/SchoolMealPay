import { Text } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface ContactConfirmationEmailProps {
    name: string;
    topic: string;
}

export function ContactConfirmationEmail({ name, topic }: ContactConfirmationEmailProps) {
    return (
        <BaseLayout preview="We got your message — SchoolMealPay">
            <Text style={heading}>We got your message.</Text>
            <Text style={subtext}>
                Hi {name}, thanks for reaching out about <strong>{topic}</strong>.
                We'll get back to you within one business day.
            </Text>
            <Text style={hint}>— The SchoolMealPay Team, Rawalpindi</Text>
        </BaseLayout>
    );
}

export default ContactConfirmationEmail;

const heading: CSSProperties = { color: "#09090b", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.02em", margin: "0 0 8px" };
const subtext: CSSProperties = { color: "#52525b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" };
const hint: CSSProperties = { color: "#a1a1aa", fontSize: "12px", margin: 0 };