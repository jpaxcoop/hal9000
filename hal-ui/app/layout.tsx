import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HAL9000",
  description: "Speak with the HAL9000"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
