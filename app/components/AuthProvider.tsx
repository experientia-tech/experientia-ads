"use client";

import { useEffect } from "react";
import { useAuthStore } from "../store/Auth";
import { getToken } from "../constants/auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const token = getToken();
    if (token && !user) {
      fetchProfile().catch((err) => {
        console.error("Auto-fetch profile failed:", err);
      });
    }
  }, [fetchProfile, user]);

  return <>{children}</>;
}
