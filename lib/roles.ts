export const ROLES = {
  ADMIN: "ADMIN",
  EXECUTOR: "EXECUTOR",
  SUPERVISOR: "SUPERVISOR",
  CAMPAIGN_MANAGER: "CAMPAIGN_MANAGER",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
