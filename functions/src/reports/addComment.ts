import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {verifyUser, getUserId} from "../middleware/auth";
import type {Comment} from "@tijuanasinbarreras/shared";

export const addComment = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);
    const userId = getUserId(request);

    const {reportId, text} = request.data as {
      reportId: string;
      text: string;
    };

    if (!reportId || !text) {
      throw new HttpsError(
        "invalid-argument",
        "reportId y text son requeridos."
      );
    }

    if (text.length > 1000) {
      throw new HttpsError(
        "invalid-argument",
        "El comentario no puede exceder 1000 caracteres."
      );
    }

    const db = getDatabase();

    const reportRef = db.ref(`reports/${reportId}`);
    const reportSnapshot = await reportRef.once("value");

    if (!reportSnapshot.exists()) {
      throw new HttpsError("not-found", "El reporte no existe.");
    }

    const displayName =
      request.auth?.token?.name ??
      request.auth?.token?.email ??
      "Usuario";

    const commentsRef = db.ref("comments");
    const newCommentRef = commentsRef.push();

    const now = Date.now();

    const comment: Comment = {
      id: newCommentRef.key as string,
      reportId,
      userId,
      displayName: typeof displayName === "string" ? displayName : "Usuario",
      text: text.trim(),
      createdAt: now,
    };

    await newCommentRef.set(comment);

    logger.info("Comentario agregado", {commentId: comment.id, reportId, userId});

    return {success: true, comment};
  }
);
