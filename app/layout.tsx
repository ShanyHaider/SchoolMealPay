// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/Components/ThemeProvider";
import { Navbar } from "@/Components/Navbar/Navbar";
import "./globals.css";
import "./styles/homePageStyles.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

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
  const { userId } = await auth();

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={cn("dark", "font-sans", geist.variable)}
        suppressHydrationWarning
      >
        <head>
          {/* <script
            dangerouslySetInnerHTML={{
              __html: `
            (function() {
              try {
                var stored = localStorage.getItem('theme') || 'dark';
                var resolved = stored;
                if (stored === 'system') {
                  resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(resolved);
                document.documentElement.setAttribute('data-theme', resolved);
              } catch(e) {}
            })();
          `,
            }}
          /> */}
        </head>
        <body>
          <ThemeProvider defaultTheme="dark">
            {/* <Navbar initialSignedIn={!!userId} /> */}
            <main>{children}</main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
