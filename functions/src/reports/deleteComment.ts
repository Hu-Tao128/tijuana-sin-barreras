import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import {verifyUser, getUserId} from "../middleware/auth";
import {getUserRole} from "../middleware/roles";
import {Role} from "@tijuanasinbarreras/shared";
import type {Comment} from "@tijuanasinbarreras/shared";

export const deleteComment = onCall(
  {maxInstances: 10},
  async (request) => {
    await verifyUser(request);
    const userId = getUserId(request);

    const {commentId} = request.data as {commentId: string};

    if (!commentId) {
      throw new HttpsError("invalid-argument", "commentId es requerido.");
    }

    const db = getDatabase();
    const commentRef = db.ref(`comments/${commentId}`);
    const commentSnapshot = await commentRef.once("value");

    if (!commentSnapshot.exists()) {
      throw new HttpsError("not-found", "El comentario no existe.");
    }

    const comment = commentSnapshot.val() as Comment;
    const userRole = getUserRole(request);

    if (
      comment.userId !== userId &&
      userRole !== Role.MODERATOR &&
      userRole !== Role.OFFICIAL
    ) {
      throw new HttpsError(
        "permission-denied",
        "No tienes permiso para eliminar este comentario."
      );
    }

    await commentRef.remove();

    logger.info("Comentario eliminado", {
      commentId,
      reportId: comment.reportId,
      deletedBy: userId,
    });

    return {success: true};
  }
);
