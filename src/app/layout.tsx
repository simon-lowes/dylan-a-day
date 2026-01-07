import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dylan a Day",
  description: "A new Dylan photo every day",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
