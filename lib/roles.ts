// src/lib/roles.ts
export const ROLES = {
  ADMIN: "ADMIN",
  EXECUTOR: "EXECUTOR",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
