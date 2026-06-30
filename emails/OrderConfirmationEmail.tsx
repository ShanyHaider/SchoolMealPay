import { Column, Row, Section, Text, Hr } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface OrderItem {
    name: string;
    quantity: number;
    unitPrice: string;
}

interface OrderConfirmationEmailProps {
    parentName: string;
    studentName: string;
    orderRef: string;
    orderDate: string;
    items: OrderItem[];
    total: string;
    canteenName: string;
    scheduledDate?: string;
}

export function OrderConfirmationEmail({
    parentName,
    studentName,
    orderRef,
    orderDate,
    items,
    total,
    canteenName,
    scheduledDate,
}: OrderConfirmationEmailProps) {
    return (
        <BaseLayout
            preview={`Order confirmed for ${studentName} — ${orderRef}`}
        >
            <Text style={heading}>Order confirmed</Text>
            <Text style={subtext}>
                Hi {parentName}, your order for <strong>{studentName}</strong> has been
                placed successfully.
            </Text>

            {/* Order meta */}
            <Section style={metaBox}>
                <Row>
                    <Column>
                        <Text style={metaLabel}>Order ref</Text>
                        <Text style={metaValue}>{orderRef}</Text>
                    </Column>
                    <Column>
                        <Text style={metaLabel}>Canteen</Text>
                        <Text style={metaValue}>{canteenName}</Text>
                    </Column>
                    <Column>
                        <Text style={metaLabel}>
                            {scheduledDate ? "Scheduled for" : "Placed on"}
                        </Text>
                        <Text style={metaValue}>{scheduledDate ?? orderDate}</Text>
                    </Column>
                </Row>
            </Section>

            {/* Line items */}
            <Section style={itemsSection}>
                {items.map((item, i) => (
                    <Row key={i} style={itemRow}>
                        <Column>
                            <Text style={itemName}>
                                {item.name}{" "}
                                <span style={itemQty}>×{item.quantity}</span>
                            </Text>
                        </Column>
                        <Column style={priceCol}>
                            <Text style={itemPrice}>
                                PKR {(
                                    parseFloat(item.unitPrice) * item.quantity
                                ).toFixed(2)}
                            </Text>
                        </Column>
                    </Row>
                ))}

                <Hr style={totalDivider} />

                <Row>
                    <Column>
                        <Text style={totalLabel}>Total</Text>
                    </Column>
                    <Column style={priceCol}>
                        <Text style={totalValue}>PKR {total}</Text>
                    </Column>
                </Row>
            </Section>

            <Text style={hint}>
                Your wallet was debited PKR {total}. If you have any questions, contact
                your school administrator.
            </Text>
        </BaseLayout>
    );
}

export default OrderConfirmationEmail;

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
    margin: "0 0 20px",
};

const metaBox: CSSProperties = {
    backgroundColor: "#f4f4f5",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "20px",
};

const metaLabel: CSSProperties = {
    color: "#71717a",
    fontSize: "10px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 2px",
};

const metaValue: CSSProperties = {
    color: "#09090b",
    fontSize: "13px",
    fontWeight: "600",
    margin: 0,
};

const itemsSection: CSSProperties = {
    marginBottom: "20px",
};

const itemRow: CSSProperties = {
    marginBottom: "8px",
};

const itemName: CSSProperties = {
    color: "#3f3f46",
    fontSize: "13px",
    margin: 0,
};

const itemQty: CSSProperties = {
    color: "#a1a1aa",
    fontSize: "12px",
};

const priceCol: CSSProperties = {
    textAlign: "right",
};

const itemPrice: CSSProperties = {
    color: "#3f3f46",
    fontSize: "13px",
    margin: 0,
};

const totalDivider: CSSProperties = {
    borderColor: "#e4e4e7",
    margin: "12px 0",
};

const totalLabel: CSSProperties = {
    color: "#09090b",
    fontSize: "14px",
    fontWeight: "800",
    margin: 0,
};

const totalValue: CSSProperties = {
    color: "#09090b",
    fontSize: "14px",
    fontWeight: "800",
    margin: 0,
};

const hint: CSSProperties = {
    color: "#a1a1aa",
    fontSize: "12px",
    margin: 0,
};