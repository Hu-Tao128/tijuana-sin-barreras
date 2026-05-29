import {onCall} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import {getUserId} from "../middleware/auth";
import type {Report} from "../types/Report";

export const getMyReports = onCall(
  {maxInstances: 10},
  async (request) => {
    const userId = getUserId(request);

    const db = getDatabase();
    const reportsRef = db.ref("reports");
    const snapshot = await reportsRef
      .orderByChild("userId")
      .equalTo(userId)
      .once("value");

    const reports: Report[] = [];

    snapshot.forEach((child) => {
      reports.push(child.val() as Report);
    });

    reports.sort((a, b) => b.createdAt - a.createdAt);

    return {success: true, reports};
  }
);
