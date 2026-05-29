export const Role = {
  CITIZEN: "citizen",
  MODERATOR: "moderator",
  OFFICIAL: "official",
} as const;
export type Role = (typeof Role)[keyof typeof Role];
