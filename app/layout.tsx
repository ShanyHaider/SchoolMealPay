import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { PushSubscriber } from "@/components/PushSubscriber";

// Import Geist directly from the installed package to fix the Turbopack network error
import { GeistSans } from "geist/font/sans";
import { Suspense } from "react";

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
        // Switched from geist.variable to GeistSans.variable
        className={cn("dark", "font-sans", GeistSans.variable)}
        suppressHydrationWarning
      >
        <head>
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body>
          <ThemeProvider defaultTheme="dark">
            <Suspense fallback={null}>
              <main>{children}</main>
              <Toaster
                position="top-right"
                richColors
                closeButton
                theme="system"
              />
              <PushSubscriber vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!} />
            </Suspense>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}