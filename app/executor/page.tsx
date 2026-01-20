"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExecutorIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.replace("/executor/login");
  }, [router]);

  return null;
}
