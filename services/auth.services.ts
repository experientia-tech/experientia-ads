import { sendOtpSms } from "@/services/msg91";

export async function sendOtp(phone: string) {
  // Basic validation
  if (!phone) {
    throw new Error("Invalid phone number");
  }

  // MSG91 generates and SMSes the OTP, and stores it for later verification.
  await sendOtpSms(phone);
}
