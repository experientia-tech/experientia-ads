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
  console.log(`Sending OTP ${otp} to phone number ${phone}`);
}
