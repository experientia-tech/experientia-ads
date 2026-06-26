import { prisma } from "@/lib/prisma";
import { response } from "@/utils/response";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
// import { sendOtp } from "@/services/auth.services";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    // OTP verification against the configured static OTP.
    // Replace with a real OTP-provider lookup once SMS is integrated.
    const expectedOtp = process.env.AUTH_OTP;
    if (!expectedOtp) {
      console.error("AUTH_OTP env var is not set; rejecting all logins.");
      return NextResponse.json(
        { error: "Login is temporarily unavailable" },
        { status: 503 }
      );
    }
    if (!otp || otp !== expectedOtp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
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
        role: "EXECUTOR",
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
    console.error("Error verifying executor OTP:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
