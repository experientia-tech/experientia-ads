import { prisma } from "@/lib/prisma";
import { response } from "@/utils/response";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { isMsg91Configured, verifyOtpSms } from "@/services/msg91";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }
    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    // Fail closed until MSG91 credentials are configured.
    if (!isMsg91Configured()) {
      console.error("MSG91 is not configured; rejecting all logins.");
      return NextResponse.json(
        { error: "Login is temporarily unavailable" },
        { status: 503 }
      );
    }

    const isValid = await verifyOtpSms(phone, otp);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
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

    const res = NextResponse.json(
      response(true, 200, token, "Login successful", {})
    );

    // 🔒 HTTP-only cookie
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
