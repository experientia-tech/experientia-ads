import { getToken, removeToken, isAuthenticated } from "./auth";

/**
 * Common utility for making authenticated API requests.
 * Automatically adds the Authorization header and handles 401 Unauthorized responses.
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  if (!isAuthenticated()) {
    // If not authenticated, redirect to signin
    if (typeof window !== "undefined") {
      removeToken(); // Clear any stale data
      window.location.href = "/signin";
    }
    throw new Error("Not authenticated");
  }

  const token = getToken();
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

    if (response.status === 401) {
      // If unauthorized, logout and redirect
      if (typeof window !== "undefined") {
        removeToken();
        // Clear any auth cookies if needed
        document.cookie =
          "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.location.href = "/signin";
      }
      throw new Error("Session expired. Please login again.");
    }

    return response;
  } catch (error: any) {
    throw new Error(error.message || "Network error occurred");
  }
};
