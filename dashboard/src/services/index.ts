export { app, auth, database, storage, functions } from './firebase'
export { signInWithGoogle, signInWithEmail, signOutUser } from './auth'
export {
  confirmReport,
  rejectReport,
  archiveReport,
  getDashboardStats,
  exportReportsCsv,
  generateHeatmap,
  classifyBarrier,
  calculateSeverity,
} from './functions'
export {
  subscribeToReports,
  createReport,
  deleteReport,
  setReportStatus,
  type NewReportInput,
} from './reports'
export {
  analyzeRouteAccessibility,
  analyzeRouteWithImages,
  type RouteAccessibilityReport,
  type RouteControlPoint,
} from './gemini'
export { findStreetImage, type StreetImage } from './mapillary'
