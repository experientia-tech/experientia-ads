interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  data?: string;
  token?: string;
  error?: string;
}

// Token management
const TOKEN_KEY = "token";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Check authentication before API calls
export const checkAuth = (): boolean => {
  if (!isAuthenticated()) {
    // Clear any stale data
    logout();
    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/signin";
    }
    return false;
  }
  return true;
};

// Send OTP API call
export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  try {
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to send OTP",
      };
    }

    return {
      success: true,
      message: data.message || "OTP sent successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Network error occurred",
    };
  }
};

// Verify OTP API call
export const verifyOtp = async (
  phone: string,
  otp: string,
): Promise<VerifyOtpResponse> => {
  try {
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, otp }),
      credentials: "include", // Important for cookies
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Invalid OTP",
      };
    }

    console.log(data.token, "The Data");

    // Extract token from response
    const token = data.token || data.tokenData;

    // Store token in localStorage if present
    if (token) {
      setToken(token);
    }

    return {
      success: true,
      message: data.message || "Login successful",
      token,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Network error occurred",
    };
  }
};

// Logout function
export const logout = () => {
  // Clear token from localStorage
  removeToken();

  // Clear the auth cookie
  if (typeof document !== "undefined") {
    document.cookie =
      "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }
};

// Generic authenticated API call wrapper
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  // Check if user is authenticated
  if (!checkAuth()) {
    throw new Error("Not authenticated");
  }

  const token = getToken();

  // Add authorization header
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // If unauthorized, logout and redirect
    if (response.status === 401) {
      logout();
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
      throw new Error("Session expired. Please login again.");
    }

    return response;
  } catch (error: any) {
    // Handle network errors
    if (error.message === "Session expired. Please login again.") {
      throw error;
    }
    throw new Error(error.message || "Network error occurred");
  }
};
