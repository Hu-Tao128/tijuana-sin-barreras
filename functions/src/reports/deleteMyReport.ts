import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {verifyUser, getUserId} from "../middleware/auth";
import type {Report} from "../types/Report";

export const deleteMyReport = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);
    const userId = getUserId(request);

    const {reportId} = request.data as {reportId: string};

    if (!reportId) {
      throw new HttpsError("invalid-argument", "reportId es requerido.");
    }

    const db = getDatabase();
    const reportRef = db.ref(`reports/${reportId}`);
    const reportSnapshot = await reportRef.once("value");

    if (!reportSnapshot.exists()) {
      throw new HttpsError("not-found", "El reporte no existe.");
    }

    const report = reportSnapshot.val() as Report;

    if (report.userId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Solo puedes eliminar tus propios reportes."
      );
    }

    await reportRef.remove();

    const confirmationsRef = db.ref("confirmations");
    const confirmationsSnapshot = await confirmationsRef
      .orderByChild("reportId")
      .equalTo(reportId)
      .once("value");

    const deleteOps: Promise<void>[] = [];

    confirmationsSnapshot.forEach((child) => {
      deleteOps.push(child.ref!.remove());
    });

    const commentsRef = db.ref("comments");
    const commentsSnapshot = await commentsRef
      .orderByChild("reportId")
      .equalTo(reportId)
      .once("value");

    commentsSnapshot.forEach((child) => {
      deleteOps.push(child.ref!.remove());
    });

    await Promise.all(deleteOps);

    try {
      const firestore = getFirestore();
      await firestore.collection("users").doc(userId).update({
        reportCount: FieldValue.increment(-1),
      });
    } catch {
      logger.warn("No se pudo decrementar reportCount", {userId});
    }

    logger.info("Reporte eliminado por su creador", {reportId, userId});

    return {success: true};
  }
);
