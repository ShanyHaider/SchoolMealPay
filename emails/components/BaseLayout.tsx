import {
    Body,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Text,
    Hr,
} from "@react-email/components";
import { CSSProperties, ReactNode } from "react";

interface BaseLayoutProps {
    preview: string;
    children: ReactNode;
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Body style={body}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={logo}>SchoolMealPay</Text>
                    </Section>

                    {/* Content */}
                    <Section style={content}>{children}</Section>

                    {/* Footer */}
                    <Hr style={divider} />
                    <Section style={footer}>
                        <Text style={footerText}>
                            SchoolMealPay · School Canteen Management
                        </Text>
                        <Text style={footerMuted}>
                            You're receiving this email because an action was taken on your
                            account. If you didn't request this, you can safely ignore it.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const body: CSSProperties = {
    backgroundColor: "#f4f4f5",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: "0",
    padding: "32px 0",
};

const container: CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e4e4e7",
    maxWidth: "520px",
    margin: "0 auto",
    overflow: "hidden",
};

const header: CSSProperties = {
    backgroundColor: "#09090b",
    padding: "20px 32px",
};

const logo: CSSProperties = {
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
    margin: "0",
};

const content: CSSProperties = {
    padding: "32px",
};

const divider: CSSProperties = {
    borderColor: "#f4f4f5",
    margin: "0 32px",
};

const footer: CSSProperties = {
    padding: "20px 32px 28px",
};

const footerText: CSSProperties = {
    color: "#71717a",
    fontSize: "12px",
    margin: "0 0 4px",
};

const footerMuted: CSSProperties = {
    color: "#a1a1aa",
    fontSize: "11px",
    margin: "0",
    lineHeight: "1.5",
};