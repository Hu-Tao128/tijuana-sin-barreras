import {onCall} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import {verifyUser} from "../middleware/auth";
import type {Comment} from "@tijuanasinbarreras/shared";

export const getReportComments = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);

    const {reportId} = request.data as {reportId: string};

    if (!reportId) {
      return {success: true, comments: []};
    }

    const db = getDatabase();
    const commentsRef = db.ref("comments");
    const snapshot = await commentsRef
      .orderByChild("reportId")
      .equalTo(reportId)
      .once("value");

    const comments: Comment[] = [];

    snapshot.forEach((child) => {
      comments.push(child.val() as Comment);
    });

    comments.sort((a, b) => a.createdAt - b.createdAt);

    return {success: true, comments};
  }
);
