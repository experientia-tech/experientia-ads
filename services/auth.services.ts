export async function sendOtp(phone: string) {
  // Basic validation
  if (!phone) {
    throw new Error("Invalid phone number");
  }

  // No SMS provider is wired up. Login uses static dummy OTPs
  // (ADMIN_DUMMY_OTP / EXECUTOR_DUMMY_OTP) verified in the verify-otp routes,
  // so there is nothing to send here.
  if (process.env.NODE_ENV !== "production") {
    console.log(`sendOtp called for ${phone} (dummy OTP mode; nothing sent).`);
  }
}
