import { Button, Section, Text } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface VerificationCodeEmailProps {
    code: string;
    /** e.g. "verify your email", "sign in", "confirm your identity" */
    purpose?: string;
    expiresInMinutes?: number;
}

export function VerificationCodeEmail({
    code,
    purpose = "verify your email",
    expiresInMinutes = 10,
}: VerificationCodeEmailProps) {
    return (
        <BaseLayout preview={`Your SchoolMealPay verification code: ${code}`}>
            <Text style={heading}>Your verification code</Text>
            <Text style={subtext}>
                Use the code below to {purpose}. It expires in{" "}
                {expiresInMinutes} minutes.
            </Text>

            <Section style={codeBox}>
                <Text style={codeText}>{code}</Text>
            </Section>

            <Text style={hint}>
                If you didn't request this, you can safely ignore this email.
            </Text>
        </BaseLayout>
    );
}

export default VerificationCodeEmail;

// ─── Styles ───────────────────────────────────────────────────────────────────

const heading: CSSProperties = {
    color: "#09090b",
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
    margin: "0 0 8px",
};

const subtext: CSSProperties = {
    color: "#52525b",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 28px",
};

const codeBox: CSSProperties = {
    backgroundColor: "#f4f4f5",
    borderRadius: "12px",
    border: "1px solid #e4e4e7",
    padding: "20px",
    textAlign: "center",
    marginBottom: "24px",
};

const codeText: CSSProperties = {
    color: "#09090b",
    fontSize: "36px",
    fontWeight: "900",
    letterSpacing: "0.25em",
    margin: 0,
    fontFamily: "monospace",
};

const hint: CSSProperties = {
    color: "#a1a1aa",
    fontSize: "12px",
    margin: 0,
};