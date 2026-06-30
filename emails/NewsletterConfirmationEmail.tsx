import { Text } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

export function NewsletterConfirmationEmail() {
    return (
        <BaseLayout preview="You're subscribed — SchoolMealPay">
            <Text style={heading}>You're subscribed.</Text>
            <Text style={subtext}>
                Thanks for signing up! We'll send you updates on new features, improvements, and news from SchoolMealPay — no spam, ever.
            </Text>
            <Text style={hint}>— The SchoolMealPay Team, Rawalpindi</Text>
        </BaseLayout>
    );
}

export default NewsletterConfirmationEmail;

const heading: CSSProperties = { color: "#09090b", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.02em", margin: "0 0 8px" };
const subtext: CSSProperties = { color: "#52525b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" };
const hint: CSSProperties = { color: "#a1a1aa", fontSize: "12px", margin: 0 };