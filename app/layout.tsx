import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Experientia",
  description: "Developed by Dealberg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
