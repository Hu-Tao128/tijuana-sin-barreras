import {setGlobalOptions} from "firebase-functions/v2";
import {getApps, initializeApp} from "firebase-admin/app";

setGlobalOptions({maxInstances: 10});

if (!getApps().length) {
  initializeApp();
}

export {createReport} from "./reports/createReport";
export {confirmReport} from "./reports/confirmReport";
export {rejectReport} from "./reports/rejectReport";
export {archiveReport} from "./reports/archiveReport";

export {classifyBarrierCallable} from "./gemini/classifyBarrier";
export {detectSpamCallable} from "./gemini/detectSpam";

export {generateHeatmap} from "./analytics/generateHeatmap";
export {updateStatistics} from "./analytics/updateStatistics";

export {getDashboardStats} from "./dashboard/getDashboardStats";
export {exportCsv} from "./dashboard/exportCsv";

export {registerUserProfile} from "./users/registerUserProfile";
export {setUserRole} from "./users/setUserRole";
export {getCurrentUserProfile} from "./users/getCurrentUserProfile";
export {getUsers} from "./users/getUsers";
