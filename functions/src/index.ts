import {setGlobalOptions} from "firebase-functions/v2";

setGlobalOptions({maxInstances: 10});

export {createReport} from "./reports/createReport";
export {confirmReport} from "./reports/confirmReport";
export {rejectReport} from "./reports/rejectReport";
export {archiveReport} from "./reports/archiveReport";
export {getMyReports} from "./reports/getMyReports";
export {deleteMyReport} from "./reports/deleteMyReport";
export {addComment} from "./reports/addComment";
export {getReportComments} from "./reports/getReportComments";
export {deleteComment} from "./reports/deleteComment";
export {getReportsInArea} from "./reports/getReportsInArea";

export {classifyBarrierCallable} from "./gemini/classifyBarrier";
export {detectSpamCallable} from "./gemini/detectSpam";

export {generateHeatmap} from "./analytics/generateHeatmap";
export {generateAccessibleRoute} from "./analytics/generateAccessibleRoute";
export {updateStatistics} from "./analytics/updateStatistics";

export {getDashboardStats} from "./dashboard/getDashboardStats";
export {exportCsv} from "./dashboard/exportCsv";

export {registerUserProfile} from "./users/registerUserProfile";
export {setUserRole} from "./users/setUserRole";
export {getCurrentUserProfile} from "./users/getCurrentUserProfile";
export {getUsers} from "./users/getUsers";
export {onUserCreate} from "./users/onAuthCreate";
export {migrateUsersHttp} from "./users/migrateUsersHttp";
