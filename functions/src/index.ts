import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ maxInstances: 10 });

export { createReport } from "./reports/createReport";
export { confirmReport } from "./reports/confirmReport";
export { rejectReport } from "./reports/rejectReport";
export { archiveReport } from "./reports/archiveReport";

export { classifyBarrierCallable } from "./gemini/classifyBarrier";
export { calculateSeverityCallable } from "./gemini/calculateSeverity";

export { generateHeatmap } from "./analytics/generateHeatmap";
export { updateStatistics } from "./analytics/updateStatistics";

export { getDashboardStats } from "./dashboard/getDashboardStats";
export { exportCsv } from "./dashboard/exportCsv";
