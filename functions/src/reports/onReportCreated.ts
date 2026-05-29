import {onValueCreated} from "firebase-functions/v2/database";
import * as logger from "firebase-functions/logger";
import {classifyBarrier} from "../gemini/classifyBarrier";
import {detectSpam} from "../gemini/detectSpam";
import {Report} from "@tijuanasinbarreras/shared";

export const onReportCreated = onValueCreated(
  {
    ref: "reports/{reportId}",
    region: "us-central1",
  },
  async (event) => {
    const report = event.data.val() as Report;
    const reportId = event.params.reportId;

    // Solo procesar si tiene foto y no ha sido procesado por IA antes
    // (usamos event.data.ref.parent para no re-disparar si ya tiene campos de IA)
    if (!report.photoUrl || (report as any).aiProcessed) {
      return;
    }

    try {
      logger.info(`Iniciando análisis de IA para reporte: ${reportId}`);

      // 1. Ejecutar anti-spam
      const spamResult = await detectSpam(report.photoUrl);

      if (!spamResult.isBarrier) {
        logger.info(`Reporte ${reportId} detectado como spam/no-barrera: ${spamResult.reason}`);
        await event.data.ref.update({
          status: "rejected",
          aiProcessed: true,
          aiNote: spamResult.reason,
        });
        return;
      }

      // 2. Clasificar barrera
      const classification = await classifyBarrier(report.photoUrl);

      // 3. Actualizar el reporte con los resultados de la IA
      // La IA puede corregir el tipo y la severidad sugerida por el usuario
      await event.data.ref.update({
        type: classification.type,
        severity: classification.severity,
        description: report.description || classification.description,
        aiProcessed: true,
        aiConfidence: classification.confidence,
        status: classification.severity >= 8 ? "verified" : report.status,
      });

      logger.info(`Análisis de IA completado para reporte: ${reportId}`, {
        type: classification.type,
        severity: classification.severity,
      });
    } catch (error) {
      logger.error(`Error procesando IA para reporte ${reportId}:`, error);
      await event.data.ref.update({
        aiProcessed: true,
        aiError: "No se pudo completar el análisis de IA automáticamente.",
      });
    }
  }
);
