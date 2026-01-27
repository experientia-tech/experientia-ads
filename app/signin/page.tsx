"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/Auth";
import "./page.scss";

const SignIn = () => {
  const router = useRouter();

  // Local state
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtpState] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const {
    sendOtp,
    verifyOtp,
    isLoading: loading,
    error: storeError,
  } = useAuthStore();
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    const result = await sendOtp(phoneNumber);

    if (result.success) {
      setStep("otp");
      setResendTimer(30);
      // Auto-focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } else {
      setError(result.error || "Failed to send OTP");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtpState(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpState(newOtp);

    // Focus last filled input or next empty
    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }

    const result = await verifyOtp(phoneNumber, otpValue);

    if (result.success) {
      // Navigate to dashboard on success
      router.push("/experientia/dashboard");
    } else {
      setError(result.error || "Invalid OTP");
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setError("");
    setOtpState(["", "", "", "", "", ""]);

    const result = await sendOtp(phoneNumber);

    if (result.success) {
      setResendTimer(30);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } else {
      setError(result.error || "Failed to resend OTP");
    }
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setOtpState(["", "", "", "", "", ""]);
    setError("");
  };

  return (
    <div className="signin-container">
      {/* Header */}
      <header className="signin-header">
        <div className="logo">
          <span className="logo-text">Experientia</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="signin-content">
        <div className="signin-card">
          {step === "phone" ? (
            <div className="signin-step">
              <h1 className="signin-title">Welcome Back Admin</h1>
              <p className="signin-subtitle">
                Enter your phone number to receive a secure login code.
              </p>

              <form onSubmit={handlePhoneSubmit} className="signin-form">
                <div className="input-group">
                  <label htmlFor="phone" className="input-label">
                    Phone Number
                  </label>
                  <div className="phone-input-wrapper">
                    <span className="country-code">+91</span>
                    <input
                      id="phone"
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="XXX XXX XXXX"
                      className="phone-input"
                      autoFocus
                    />
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    <>
                      Send OTP
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M7.5 15L12.5 10L7.5 5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="signin-step">
              <div className="otp-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M28 10L16 17L4 10M28 10V22C28 22.5304 27.7893 23.0391 27.4142 23.4142C27.0391 23.7893 26.5304 24 26 24H6C5.46957 24 4.96086 23.7893 4.58579 23.4142C4.21071 23.0391 4 22.5304 4 22V10M28 10L16 3L4 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1 className="signin-title">Verify Code</h1>
              <p className="signin-subtitle">
                We've sent a 6-digit code to{" "}
                <strong>
                  +91 {phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}
                </strong>
              </p>

              <form onSubmit={handleOtpSubmit} className="signin-form">
                <div className="otp-input-group">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="otp-input"
                    />
                  ))}
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    <>
                      Verify OTP
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M16.25 6.25L7.5 15L3.75 11.25"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>

                <div className="resend-section">
                  {resendTimer > 0 ? (
                    <p className="resend-timer">
                      Didn't receive the code?{" "}
                      <span className="resend-countdown">
                        Resend code in {resendTimer}s
                      </span>
                    </p>
                  ) : (
                    <p className="resend-timer">
                      Didn't receive the code?{" "}
                      <button
                        type="button"
                        className="resend-button"
                        onClick={handleResendOtp}
                      >
                        Resend code
                      </button>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="back-button"
                  onClick={handleBackToPhone}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M10 12L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Back to phone sign-in
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="signin-footer">
        <p>© 2024 Experientia Technologies Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default SignIn;
