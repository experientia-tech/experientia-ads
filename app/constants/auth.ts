// Token management helpers

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

export const getTokenPayload = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64));
    return payload;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};
