"use client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import "./executor/layout.scss";
import SideMenu from "./experientia/side_menu/page";
import Navbar from "./experientia/navbar/page";
import BottomNav from "./executor/components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Determine if we're in the executor section
  const isExecutorSection = pathname?.startsWith("/executor");

  // Determine if we're in the experientia section
  const isExperientiaSection = pathname?.startsWith("/experientia");

  // Check if we're on the executor login page
  const isExecutorLoginPage =
    pathname === "/executor" || pathname === "/executor/login";

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {isExecutorSection ? (
          // Executor Layout
          <div className="executor-app-container">
            <div className="executor-mobile-frame">
              <main
                className={`executor-content ${
                  isExecutorLoginPage ? "login-view" : ""
                }`}
              >
                {children}
              </main>
              {!isExecutorLoginPage && <BottomNav />}
            </div>
          </div>
        ) : isExperientiaSection ? (
          // Experientia Layout
          <div className="app-layout">
            <SideMenu />
            <Navbar />
            <main className="main-content">{children}</main>
          </div>
        ) : (
          // Default Layout (for root or other pages)
          children
        )}
      </body>
    </html>
  );
}
