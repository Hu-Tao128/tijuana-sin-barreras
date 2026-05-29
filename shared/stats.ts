import type {Report} from "./Report.js";

export interface DashboardStats {
  totalReports: number;
  verifiedReports: number;
  pendingReports: number;
  rejectedReports: number;
  archivedReports: number;
  totalUsers: number;
  reportsByType: Record<string, number>;
  recentReports: Report[];
}

export interface HeatmapZone {
  zone: string;
  count: number;
}
