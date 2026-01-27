import { create } from "zustand";
import {
  IProfile,
  ISendOtpResponse,
  IVerifyOtpResponse,
} from "../constants/interface";
import { setToken, removeToken } from "../constants/auth";
import { authenticatedFetch } from "../constants/api";

// --- Zustand Store ---

interface AuthState {
  user: IProfile | null;
  isLoading: boolean;
  error: string | null;

  sendOtp: (phone: string) => Promise<ISendOtpResponse>;
  verifyOtp: (phone: string, otp: string) => Promise<IVerifyOtpResponse>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
  setUser: (user: IProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  sendOtp: async (phone: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      set({ isLoading: false });

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to send OTP" };
      }

      return {
        success: true,
        message: data.message || "OTP sent successfully",
      };
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      return {
        success: false,
        error: error.message || "Network error occurred",
      };
    }
  },

  verifyOtp: async (phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        set({ isLoading: false, error: data.error || "Invalid OTP" });
        return { success: false, error: data.error || "Invalid OTP" };
      }

      const token = data.token || data.tokenData;
      if (token) {
        setToken(token);
        // Fetch profile immediately after login success
        await get().fetchProfile();
      }

      set({ isLoading: false });
      return {
        success: true,
        message: data.message || "Login successful",
        token,
      };
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      return {
        success: false,
        error: error.message || "Network error occurred",
      };
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch("/api/profile", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get profile");
      }

      set({ user: data, isLoading: false });
    } catch (error: any) {
      set({ user: null, error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    removeToken();
    set({ user: null, error: null });

    if (typeof document !== "undefined") {
      document.cookie =
        "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }
  },

  clearAuth: () => set({ user: null, error: null, isLoading: false }),
}));

export const sendOtp = (phone: string) =>
  useAuthStore.getState().sendOtp(phone);
export const verifyOtp = (phone: string, otp: string) =>
  useAuthStore.getState().verifyOtp(phone, otp);
export const getProfile = () => useAuthStore.getState().fetchProfile();
export const logout = () => useAuthStore.getState().logout();
