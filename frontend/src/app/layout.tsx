import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ClearNote - Clinical Documentation & Drug Safety Platform",
  description: "AI-assisted clinical consultation documentation, SOAP note extraction, and pharmacological safety guardrails.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ReactQueryProvider>
              {children}
            </ReactQueryProvider>
            <Toaster
              position="top-right"
              richColors
              closeButton
              theme="system"
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
