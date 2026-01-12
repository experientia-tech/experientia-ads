"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiMail,
  FiHelpCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiArrowRight,
} from "react-icons/fi";
import "./login.scss";

const ExecutorLogin = () => {
  const router = useRouter();
  const [email, setEmail] = useState("nevil@gmail.com");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isError, setIsError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setIsError(false);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = () => {
    const enteredOtp = otp.join("");
    if (email === "nevil@gmail.com" && enteredOtp === "123456") {
      router.push("/executor/dashboard");
    } else {
      setIsError(true);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <span className="brand">Experientia</span>
        <FiHelpCircle size={24} className="help-icon" />
      </header>

      <div className="login-form-container">
        <h1 className="form-title">Log in to manage your gigs.</h1>
        <p className="form-subtitle">
          Enter your registered email or phone number to receive a verification
          code.
        </p>

        <div className="input-field">
          <label>Email or Phone Number</label>
          <div className="input-wrapper">
            <FiMail className="field-icon" />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            {email === "nevil@gmail.com" && (
              <FiCheckCircle className="valid-icon" />
            )}
          </div>
        </div>

        <button className="secondary-btn sent-status">
          Code sent to email <FiRefreshCw size={18} />
        </button>

        <div className="security-check">
          <div className="divider-row">
            <div className="line"></div>
            <span>SECURITY CHECK</span>
            <div className="line"></div>
          </div>

          <div className="otp-header">
            <span className="label">Enter Code</span>
            <span className="timer">00:45</span>
          </div>

          <div className="otp-inputs">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`otp-digit ${digit ? "filled" : ""} ${
                  isError ? "error" : ""
                }`}
              />
            ))}
          </div>

          {isError && (
            <p
              style={{
                color: "#EF4444",
                fontSize: "14px",
                fontWeight: "600",
                textAlign: "center",
                marginTop: "-12px",
                marginBottom: "24px",
              }}
            >
              Invalid code. Try 123456
            </p>
          )}

          <p className="resend-text">
            Didn&apos;t receive the code?{" "}
            <button className="resend-link">Resend</button>
          </p>
        </div>
      </div>

      <div className="login-footer">
        <button
          className="primary-button login-btn"
          onClick={handleLogin}
          disabled={otp.some((d) => d === "")}
        >
          Verify & Login <FiArrowRight size={20} />
        </button>
      </div>

      <style jsx>{`
        .otp-digit.error {
          border-color: #ef4444 !important;
          background: #fef2f2;
        }
        .otp-digit.filled {
          border-color: #1e88e5;
        }
      `}</style>
    </div>
  );
};

export default ExecutorLogin;
