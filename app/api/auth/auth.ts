import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { phone, otp } = await req.json();

  // Make this const later
  let user = await prisma.user.findUnique({
    where: { phone },
  });

  // -----------------Remove these lines in production-----------------
  if (otp !== "123456") {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
  }

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      orgId: user.organizationId,
      role: "ADMIN",
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  const res = NextResponse.json({ success: true });

  // 🔒 HTTP-only cookie
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
