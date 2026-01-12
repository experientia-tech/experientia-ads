import { redirect } from "next/navigation";

export default function RootPage() {
  // This page should never be reached due to middleware
  // But as a fallback, redirect to experientia
  redirect("/experientia");
}
