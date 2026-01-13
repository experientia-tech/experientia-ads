"use client";

import { usePathname } from "next/navigation";
import "../executor/layout.scss";

export default function ExecutorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/executor" || pathname === "/executor/login";

  return (
    <div className="executor-app-container">
      <div className="executor-mobile-frame">
        <main className={`executor-content ${isLoginPage ? "login-view" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
