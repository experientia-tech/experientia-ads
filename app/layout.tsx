import type { Metadata } from "next";
import "./globals.css";
import { ProfileProvider } from "./experientia/providers/ProfileProvider";
import { CampaignProvider } from "./experientia/providers/CampaignProvider";

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
        <ProfileProvider>
          <CampaignProvider>{children}</CampaignProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
