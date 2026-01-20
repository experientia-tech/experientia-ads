import { NextResponse } from "next/server";
import { sendOtp } from "@/services/auth.services";

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();
        if (!phone) {
            return NextResponse.json(
                { error: "Phone number is required" },
                { status: 400 }
            );
        }

        await sendOtp(phone);

        return NextResponse.json({
            success: true,
            message: "OTP sent successfully",
        });
        } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to send OTP" },
            { status: 500 }
        );
    }
}
