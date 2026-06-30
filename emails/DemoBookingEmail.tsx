import { Column, Row, Section, Text } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface DemoBookingEmailProps {
    name: string;
    email: string;
    school: string;
    role: string;
    phone: string;
    date: string;
    slot: string;
}

export function DemoBookingEmail({ name, email, school, role, phone, date, slot }: DemoBookingEmailProps) {
    const rows = [
        { label: "Name", value: name },
        { label: "Email", value: email },
        { label: "School", value: school },
        { label: "Role", value: role },
        { label: "Phone", value: phone || "—" },
        { label: "Date", value: date || "Flexible" },
        { label: "Time slot", value: slot },
    ];

    return (
        <BaseLayout preview={`New demo booking — ${name}, ${school}`}>
            <Text style={heading}>New demo booking</Text>
            <Section style={metaBox}>
                {rows.map(({ label, value }) => (
                    <Row key={label} style={row}>
                        <Column style={labelCol}><Text style={metaLabel}>{label}</Text></Column>
                        <Column><Text style={metaValue}>{value}</Text></Column>
                    </Row>
                ))}
            </Section>
        </BaseLayout>
    );
}

export default DemoBookingEmail;

const heading: CSSProperties = { color: "#09090b", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.02em", margin: "0 0 20px" };
const metaBox: CSSProperties = { backgroundColor: "#f4f4f5", borderRadius: "10px", padding: "14px 16px" };
const row: CSSProperties = { marginBottom: "6px" };
const labelCol: CSSProperties = { width: "100px" };
const metaLabel: CSSProperties = { color: "#71717a", fontSize: "11px", fontWeight: "700", margin: 0 };
const metaValue: CSSProperties = { color: "#09090b", fontSize: "13px", fontWeight: "600", margin: 0 };