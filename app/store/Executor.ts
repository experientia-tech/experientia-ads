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

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  // Add other campaign fields as needed
}

interface GetCampaignsResponse {
  success: boolean;
  campaigns?: Campaign[];
  message?: string;
  error?: string;
}

// Token management for executor
const EXECUTOR_TOKEN_KEY = "executor_token";

export const getExecutorToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EXECUTOR_TOKEN_KEY);
};

export const setExecutorToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXECUTOR_TOKEN_KEY, token);
};

export const removeExecutorToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EXECUTOR_TOKEN_KEY);
};

export const isExecutorAuthenticated = (): boolean => {
  return !!getExecutorToken();
};

// Check authentication before API calls
export const checkExecutorAuth = (): boolean => {
  if (!isExecutorAuthenticated()) {
    // Clear any stale data
    logoutExecutor();
    // Redirect to executor login
    if (typeof window !== "undefined") {
      window.location.href = "/executor/login";
    }
    return false;
  }
  return true;
};

// Send OTP API call for executor
export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  try {
    const response = await fetch("/api/executor/send-otp", {
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

// Verify OTP API call for executor
export const verifyOtp = async (
  phone: string,
  otp: string,
): Promise<VerifyOtpResponse> => {
  try {
    const response = await fetch("/api/executor/verify-otp", {
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

    // Extract token from response
    const token = data.token || data.tokenData;

    // Store token in localStorage if present
    if (token) {
      setExecutorToken(token);
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

// Get campaigns for executor
export const getCampaigns = async (): Promise<GetCampaignsResponse> => {
  try {
    // Check authentication first
    if (!checkExecutorAuth()) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const token = getExecutorToken();

    const response = await fetch("/api/executor/campaigns", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: "include",
    });

    const data = await response.json();

    // If unauthorized, logout and redirect
    if (response.status === 401) {
      logoutExecutor();
      if (typeof window !== "undefined") {
        window.location.href = "/executor/login";
      }
      return {
        success: false,
        error: "Session expired. Please login again.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to fetch campaigns",
      };
    }

    return {
      success: true,
      campaigns: data.campaigns || data.data || [],
      message: data.message || "Campaigns fetched successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Network error occurred",
    };
  }
};

// Logout function for executor
export const logoutExecutor = () => {
  // Clear token from localStorage
  removeExecutorToken();

  // Clear the auth cookie
  if (typeof document !== "undefined") {
    document.cookie =
      "executor_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }
};

// Generic authenticated API call wrapper for executor
export const executorAuthenticatedFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  // Check if executor is authenticated
  if (!checkExecutorAuth()) {
    throw new Error("Not authenticated");
  }

  const token = getExecutorToken();

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
      logoutExecutor();
      if (typeof window !== "undefined") {
        window.location.href = "/executor/login";
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

// Get token payload for executor
export const getExecutorTokenPayload = () => {
  const token = getExecutorToken();
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64));
    return payload;
  } catch (error) {
    console.error("Error decoding executor token:", error);
    return null;
  }
};
