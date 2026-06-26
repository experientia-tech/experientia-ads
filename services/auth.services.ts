import { generateOTP } from "@/utils/otp";

const OTP_TTL_SECONDS = 300; // 5 minutes

export async function sendOtp(phone: string) {
  // Basic validation
  if (!phone) {
    throw new Error("Invalid phone number");
  }

  // Generate OTP
  const otp = generateOTP();

  // Send OTP via SMS provider
  // await sendSms(phone, `Your login OTP is ${otp}`);
  // No SMS provider is wired up yet; login currently uses a static AUTH_OTP.
  // Only log the generated OTP outside of production to avoid leaking it in prod logs.
  if (process.env.NODE_ENV !== "production") {
    console.log(`Sending OTP ${otp} to phone number ${phone}`);
  }
}
