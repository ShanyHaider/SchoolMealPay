import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { PushSubscriber } from "@/components/PushSubscriber"; // 👈 add this

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SchoolMealPay",
  description: "Your application",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={cn("dark", "font-sans", geist.variable)}
        suppressHydrationWarning
      >
        <head>
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body>
          <ThemeProvider defaultTheme="dark">
            <main>{children}</main>
            <Toaster
              position="top-right"
              richColors
              closeButton
              theme="system"
            />
            <PushSubscriber vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!} /> {/* 👈 add this */}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}