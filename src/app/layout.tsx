import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dylanaday.com"),
  title: "Dylan a Day",
  description: "A new Dylan photo every day with Ken Burns animation",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Dylan a Day",
    description: "A new Dylan photo every day with Ken Burns animation",
    type: "website",
    images: [
      {
        url: "/images/0.jpg",
        width: 1920,
        height: 1080,
        alt: "Dylan a Day",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dylan a Day",
    description: "A new Dylan photo every day with Ken Burns animation",
    images: ["/images/0.jpg"],
  },
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
