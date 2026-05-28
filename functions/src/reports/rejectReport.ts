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

    const existingRejectionsRef = db.ref("confirmations");
    const existingSnapshot = await existingRejectionsRef
      .orderByChild("reportId")
      .equalTo(reportId)
      .once("value");

    let alreadyRejected = false;

    existingSnapshot.forEach((child) => {
      const confirmation = child.val() as Confirmation;
      if (confirmation.userId === userId && !confirmation.isConfirmed) {
        alreadyRejected = true;
      }
    });

    if (alreadyRejected) {
      throw new HttpsError(
        "already-exists",
        "Ya has rechazado este reporte."
      );
    }

    const confirmationsRef = db.ref("confirmations");
    const newConfirmationRef = confirmationsRef.push();

    const now = Date.now();

    const confirmation: Confirmation = {
      id: newConfirmationRef.key as string,
      reportId,
      userId,
      isConfirmed: false,
      createdAt: now,
    };

    await newConfirmationRef.set(confirmation);

    await reportRef.child("rejections").set(ServerValue.increment(1));

    logger.info("Rechazo registrado", {reportId, userId});

    return {success: true, confirmation};
  }
);
