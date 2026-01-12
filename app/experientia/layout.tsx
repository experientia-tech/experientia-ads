import type { Metadata } from "next";
import "../globals.css";
import SideMenu from "../components/side_menu/page";
import Navbar from "../components/navbar/page";

export const metadata: Metadata = {
  title: "Experientia",
  description: "developed by Dealberg",
};

export default function ExperientiaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <SideMenu />
          <Navbar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
