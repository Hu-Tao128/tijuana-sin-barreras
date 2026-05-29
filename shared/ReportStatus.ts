export const ReportStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  ARCHIVED: "archived",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];
