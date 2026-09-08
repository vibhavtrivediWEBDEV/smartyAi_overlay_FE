import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "SmartyAI Demo | Conversation workspace preview",
    template: "%s | SmartyAI",
  },
  description:
    "An interactive, non-production preview of the intended SmartyAI conversation workspace.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SmartyAI Demo",
    description: "Interactive product preview. Do not submit sensitive data.",
    type: "website",
    siteName: "SmartyAI",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="luxury-app min-h-full">
        {children}
      </body>
    </html>
  );
}
