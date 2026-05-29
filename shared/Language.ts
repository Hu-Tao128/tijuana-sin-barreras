export const Language = {
  ES: "es",
  EN: "en",
} as const;
export type Language = (typeof Language)[keyof typeof Language];
