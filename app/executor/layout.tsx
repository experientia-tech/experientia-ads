"use client";
import type { Metadata } from "next";
import { usePathname } from "next/navigation";
import "../globals.css";
import "./layout.scss";
import BottomNav from "./components/bottom-nav";

export default function ExecutorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // Hide bottom nav on login page (which is the root /executor now)
  const isLoginPage =
    pathname === "/executor" || pathname === "/executor/login";

  return (
    <html lang="en">
      <body>
        <div className="executor-app-container">
          <div className="executor-mobile-frame">
            <main
              className={`executor-content ${isLoginPage ? "login-view" : ""}`}
            >
              {children}
            </main>
            {!isLoginPage && <BottomNav />}
          </div>
        </div>
      </body>
    </html>
  );
}
