// MSG91 OTP API (v5) integration.
// MSG91 generates, stores, and verifies the OTP on its servers, so we do not
// persist OTPs locally. Docs: https://docs.msg91.com/otp
//
// Required env vars:
//   MSG91_AUTH_KEY          - MSG91 dashboard -> Auth Key
//   MSG91_OTP_TEMPLATE_ID   - MSG91 OTP template ID (DLT-approved)
// Optional env vars:
//   MSG91_OTP_EXPIRY            - OTP validity in minutes (default 5)
//   MSG91_DEFAULT_COUNTRY_CODE  - prepended to 10-digit numbers (default 91)

const MSG91_BASE_URL = "https://control.msg91.com/api/v5";

function getConfig() {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  if (!authKey || !templateId) {
    throw new Error("MSG91 is not configured");
  }
  return { authKey, templateId };
}

/** True only when both required MSG91 env vars are present. */
export function isMsg91Configured(): boolean {
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_OTP_TEMPLATE_ID);
}

/**
 * Normalize a phone number into MSG91's expected format: digits only, with a
 * country code. A bare 10-digit number gets the default country code prefixed.
 */
export function normalizeMobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const cc = process.env.MSG91_DEFAULT_COUNTRY_CODE || "91";
  if (digits.length === 10) return `${cc}${digits}`;
  return digits;
}

/** Ask MSG91 to generate and SMS an OTP to the given phone number. */
export async function sendOtpSms(phone: string): Promise<void> {
  const { authKey, templateId } = getConfig();
  const mobile = normalizeMobile(phone);
  const expiry = process.env.MSG91_OTP_EXPIRY || "5";

  const url = new URL(`${MSG91_BASE_URL}/otp`);
  url.searchParams.set("template_id", templateId);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("otp_expiry", expiry);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { authkey: authKey, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok || data?.type === "error") {
    throw new Error((data?.message as string) || "Failed to send OTP");
  }
}

/**
 * Verify an OTP with MSG91. Returns true only on a confirmed match; any error
 * (wrong, expired, already-used) resolves to false so callers can reject login.
 */
export async function verifyOtpSms(phone: string, otp: string): Promise<boolean> {
  const { authKey } = getConfig();
  const mobile = normalizeMobile(phone);

  const url = new URL(`${MSG91_BASE_URL}/otp/verify`);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("otp", otp);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { authkey: authKey },
  });

  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  return data?.type === "success";
}

/** Resend the current OTP via text or voice. */
export async function resendOtpSms(
  phone: string,
  retryType: "text" | "voice" = "text"
): Promise<void> {
  const { authKey } = getConfig();
  const mobile = normalizeMobile(phone);

  const url = new URL(`${MSG91_BASE_URL}/otp/retry`);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("retrytype", retryType);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { authkey: authKey },
  });

  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok || data?.type === "error") {
    throw new Error((data?.message as string) || "Failed to resend OTP");
  }
}
