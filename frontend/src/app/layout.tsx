import type { Metadata } from "next";
import { Figtree, Noto_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { Toaster } from "sonner";

const fontHeading = Figtree({
  variable: "--font-heading",
  subsets: ["latin"],
});

const fontSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClearNote - Medical Transcription AI",
  description: "Advanced AI-powered medical documentation and transcription.",
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
      className={`${fontSans.variable} ${fontHeading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ReactQueryProvider>
          {/* <SmoothScroll> */}
            {children}
          {/* </SmoothScroll> */}
        </ReactQueryProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
    </ClerkProvider>
  );
}
