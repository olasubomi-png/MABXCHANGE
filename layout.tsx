import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MABXCHANGE | Crypto, made clearer",
  description:
    "Explore a thoughtfully designed crypto exchange experience. Demo only; real-money trading is not enabled.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
