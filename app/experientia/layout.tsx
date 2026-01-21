import type { Metadata } from "next";
import "./globals.css";
import SideMenu from "./side_menu/page";
import Navbar from "./navbar/page";

export const metadata: Metadata = {
  title: "Experientia",
  description: "devloped by Dealberg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="app-layout">
          <SideMenu />
          <Navbar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
