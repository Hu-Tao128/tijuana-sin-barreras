import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase, ServerValue} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {verifyUser, getUserId} from "../middleware/auth";
import type {Confirmation} from "../types/Confirmation";

export const rejectReport = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);
    const userId = getUserId(request);

    const {reportId} = request.data as { reportId: string };

    if (!reportId) {
      throw new HttpsError(
        "invalid-argument",
        "reportId es requerido."
      );
    }

    const db = getDatabase();
    const reportRef = db.ref(`reports/${reportId}`);
    const reportSnapshot = await reportRef.once("value");

    if (!reportSnapshot.exists()) {
      throw new HttpsError("not-found", "El reporte no existe.");
    }

    const voteKey = `${reportId}_${userId}`;
    const voteRef = db.ref(`confirmations/${voteKey}`);
    const existingVote = await voteRef.once("value");

    if (existingVote.exists()) {
      const prevVote = existingVote.val() as Confirmation;
      if (!prevVote.isConfirmed) {
        throw new HttpsError(
          "already-exists",
          "Ya has emitido un voto de rechazo para este reporte."
        );
      }

      await voteRef.update({isConfirmed: false, createdAt: Date.now()});
      await reportRef.child("rejections").set(ServerValue.increment(1));
      await reportRef.child("confirmations").set(ServerValue.increment(-1));

      logger.info("Voto cambiado a rechazo", {reportId, userId});
      return {
        success: true,
        confirmation: {...prevVote, isConfirmed: false, createdAt: Date.now()},
      };
    }

    const now = Date.now();
    const confirmation: Confirmation = {
      id: voteKey,
      reportId,
      userId,
      isConfirmed: false,
      createdAt: now,
    };

    await voteRef.set(confirmation);
    await reportRef.child("rejections").set(ServerValue.increment(1));

    logger.info("Rechazo registrado", {reportId, userId});

    return {success: true, confirmation};
  }
);
