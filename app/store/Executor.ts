import { create } from "zustand";
import {
  ICampaign,
  ISendOtpResponse,
  IVerifyOtpResponse,
} from "../constants/interface";

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
    if (typeof window !== "undefined") {
      window.location.href = "/executor/login";
    }
    return false;
  }
  return true;
};

// --- Zustand Store ---

interface ExecutorProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ExecutorState {
  isLoading: boolean;
  error: string | null;
  token: string | null;
  campaigns: Partial<ICampaign>[];
  profile: ExecutorProfile | null;

  sendOtp: (phone: string) => Promise<ISendOtpResponse>;
  verifyOtp: (phone: string, otp: string) => Promise<IVerifyOtpResponse>;
  logout: () => void;
  clearError: () => void;
  getCampaigns: () => Promise<{
    success: boolean;
    campaigns: Partial<ICampaign>[];
    error?: string;
  }>;
  getProfile: () => Promise<{
    success: boolean;
    profile?: ExecutorProfile;
    error?: string;
  }>;
}

export const useExecutorStore = create<ExecutorState>((set, get) => ({
  isLoading: false,
  error: null,
  token:
    typeof window !== "undefined"
      ? localStorage.getItem(EXECUTOR_TOKEN_KEY)
      : null,
  campaigns: [],
  profile: null,

  clearError: () => set({ error: null }),

  sendOtp: async (phone: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/auth/executor/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      set({ isLoading: false });

      if (!response.ok) {
        set({ error: data.error || "Failed to send OTP" });
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
      const errorMessage = error.message || "Network error occurred";
      set({ isLoading: false, error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  verifyOtp: async (phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/auth/executor/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, otp }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Invalid OTP";
        set({ isLoading: false, error: errorMsg });
        return {
          success: false,
          error: errorMsg,
        };
      }

      // Extract token from response
      const token = data.token || data.tokenData;

      // Store token in localStorage if present
      if (token) {
        setExecutorToken(token);
        set({ token, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      return {
        success: true,
        message: data.message || "Login successful",
        token,
      };
    } catch (error: any) {
      const errorMessage = error.message || "Network error occurred";
      set({ isLoading: false, error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  logout: () => {
    removeExecutorToken();
    set({ token: null, error: null });

    // Clear the auth cookie if it exists
    if (typeof document !== "undefined") {
      document.cookie =
        "executor_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }

    if (typeof window !== "undefined") {
      window.location.href = "/executor/login";
    }
  },
  getCampaigns: async () => {
    // Check authentication first
    if (!checkExecutorAuth()) {
      return {
        success: false,
        campaigns: [],
        error: "Not authenticated",
      };
    }

    const token = getExecutorToken();

    try {
      const response = await fetch("/api/executor/campaigns", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        get().logout();
        return {
          success: false,
          campaigns: [],
          error: "Session expired. Please login again.",
        };
      }

      if (!response.ok) {
        return {
          success: false,
          campaigns: [],
          error: data.error || "Failed to fetch campaigns",
        };
      }

      const campaigns = data.data || [];
      set({ campaigns });

      return {
        success: true,
        campaigns,
        message: data.message || "Campaigns fetched successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        campaigns: [],
        error: error.message || "Network error occurred",
      };
    }
  },

  getProfile: async () => {
    // Check authentication first
    if (!checkExecutorAuth()) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const token = getExecutorToken();

    try {
      const response = await fetch("/api/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        get().logout();
        return {
          success: false,
          error: "Session expired. Please login again.",
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to fetch profile",
        };
      }

      set({ profile: data });

      return {
        success: true,
        profile: data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Network error occurred",
      };
    }
  },
}));

// Export standard functions for compatibility with non-React code or simpler usage
export const sendOtp = (phone: string) =>
  useExecutorStore.getState().sendOtp(phone);
export const verifyOtp = (phone: string, otp: string) =>
  useExecutorStore.getState().verifyOtp(phone, otp);
export const logoutExecutor = () => useExecutorStore.getState().logout();
export const getCampaigns = () => useExecutorStore.getState().getCampaigns();
