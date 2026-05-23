import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Food Stop — Online bestellen",
  description: "Bestel frieten, snacks en burgers online. Afhalen of leveren.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${sans.variable} h-full`}>
      <body className="min-h-full bg-pattern antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
