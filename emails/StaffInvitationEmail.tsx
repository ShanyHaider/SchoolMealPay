import { Section, Text, Link, Hr } from "@react-email/components";
import { CSSProperties } from "react";
import { BaseLayout } from "./components/BaseLayout";

interface StaffInvitationEmailProps {
    inviteeName?: string;
    invitationUrl: string;
    canteenName?: string;
    invitedByName?: string;
}

export function StaffInvitationEmail({
    inviteeName,
    invitationUrl,
    canteenName,
    invitedByName,
}: StaffInvitationEmailProps) {
    return (
        <BaseLayout preview="You're invited to join SchoolMealPay as canteen staff">
            <Text style={heading}>You're invited!</Text>
            <Text style={subtext}>
                {invitedByName ? `${invitedByName} has` : "You've been"} invited you to
                join SchoolMealPay as a canteen staff member
                {canteenName ? ` at ${canteenName}` : ""}.
                {inviteeName ? ` Hi ${inviteeName} —` : ""} click the button below to
                set up your account.
            </Text>

            {/* CTA button — inline table for max email client compatibility */}
            <Section style={buttonWrapper}>
                <Link href={invitationUrl} style={button}>
                    Accept invitation →
                </Link>
            </Section>

            <Hr style={divider} />

            <Text style={fallbackLabel}>Or copy this link into your browser:</Text>
            <Text style={fallbackUrl}>{invitationUrl}</Text>

            <Text style={hint}>
                This invitation expires in 30 days. If you weren't expecting this, you
                can safely ignore it.
            </Text>
        </BaseLayout>
    );
}

export default StaffInvitationEmail;

const heading: CSSProperties = {
    color: "#09090b",
    fontSize: "22px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
    margin: "0 0 10px",
};

const subtext: CSSProperties = {
    color: "#52525b",
    fontSize: "14px",
    lineHeight: "1.65",
    margin: "0 0 28px",
};

const buttonWrapper: CSSProperties = {
    marginBottom: "24px",
};

const button: CSSProperties = {
    backgroundColor: "#09090b",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    padding: "13px 28px",
    textDecoration: "none",
    display: "inline-block",
};

const divider: CSSProperties = {
    borderColor: "#e4e4e7",
    margin: "24px 0",
};

const fallbackLabel: CSSProperties = {
    color: "#71717a",
    fontSize: "11px",
    margin: "0 0 4px",
};

const fallbackUrl: CSSProperties = {
    color: "#3b82f6",
    fontSize: "11px",
    wordBreak: "break-all",
    margin: "0 0 20px",
};

const hint: CSSProperties = {
    color: "#a1a1aa",
    fontSize: "11px",
    margin: "0",
    lineHeight: "1.5",
};