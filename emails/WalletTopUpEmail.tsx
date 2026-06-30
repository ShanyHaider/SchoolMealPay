import { Section, Text } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface WalletTopUpEmailProps {
    parentName: string;
    amount: string;
    newBalance: string;
    date: string;
}

export function WalletTopUpEmail({
    parentName,
    amount,
    newBalance,
    date,
}: WalletTopUpEmailProps) {
    return (
        <BaseLayout
            preview={`Wallet topped up — PKR ${amount} added to your SchoolMealPay wallet`}
        >
            <Text style={heading}>Wallet top-up confirmed</Text>
            <Text style={subtext}>
                Hi {parentName}, your SchoolMealPay wallet has been credited
                successfully.
            </Text>

            <Section style={amountBox}>
                <Text style={amountLabel}>Amount added</Text>
                <Text style={amountValue}>PKR {amount}</Text>
                <Text style={balanceText}>New balance: PKR {newBalance}</Text>
            </Section>

            <Text style={date_}>Transaction date: {date}</Text>

            <Text style={hint}>
                If you didn't initiate this top-up, please contact your school
                administrator immediately.
            </Text>
        </BaseLayout>
    );
}

export default WalletTopUpEmail;

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
    margin: "0 0 24px",
};

const amountBox: CSSProperties = {
    backgroundColor: "#f0fdf4",
    borderRadius: "12px",
    border: "1px solid #bbf7d0",
    padding: "20px",
    textAlign: "center",
    marginBottom: "20px",
};

const amountLabel: CSSProperties = {
    color: "#16a34a",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 4px",
};

const amountValue: CSSProperties = {
    color: "#15803d",
    fontSize: "32px",
    fontWeight: "900",
    letterSpacing: "-0.02em",
    margin: "0 0 6px",
};

const balanceText: CSSProperties = {
    color: "#166534",
    fontSize: "13px",
    fontWeight: "600",
    margin: 0,
};

const date_: CSSProperties = {
    color: "#71717a",
    fontSize: "12px",
    margin: "0 0 20px",
};

const hint: CSSProperties = {
    color: "#a1a1aa",
    fontSize: "12px",
    margin: 0,
};