import "server-only";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export type AuthUser = {
  userId: string;
  orgId: string;
  role: "ADMIN" | "EXECUTOR" | "SUPERVISOR";
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      userId: payload.sub,
      orgId: payload.orgId,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
