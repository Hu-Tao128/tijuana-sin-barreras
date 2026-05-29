import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import {GoogleGenAI} from "@google/genai";
import {verifyUser} from "../middleware/auth";
import {Report} from "@tijuanasinbarreras/shared";

export const generateDashboardSummary = onCall(
  {maxInstances: 2, timeoutSeconds: 60, memory: "512MiB"},
  async (request) => {
    await verifyUser(request);

    // Solo moderadores u oficiales
    const token = request.auth?.token;
    if (token?.role !== "moderator" && token?.role !== "official") {
      throw new HttpsError("permission-denied", "Solo moderadores pueden generar resúmenes.");
    }

    const db = getDatabase();
    const reportsSnap = await db.ref("reports").limitToLast(100).once("value");
    const reports: Report[] = [];

    reportsSnap.forEach((child) => {
      const r = child.val() as Report;
      if (r.status !== "archived") {
        reports.push(r);
      }
    });

    if (reports.length === 0) {
      return {summary: "No hay reportes recientes para analizar."};
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new HttpsError("internal", "GEMINI_API_KEY no configurada.");

    const genAI = new GoogleGenAI({apiKey});

    const prompt = "Analiza los siguientes reportes de accesibilidad urbana en Tijuana y genera un resumen ejecutivo " +
      "para el dashboard de administración. Responde con un JSON que tenga los campos: summary (string), " +
      "criticalZones (string[]), mainBarrierType (string), recommendation (string).\n\n" +
      `Reportes:\n${reports.map((r) => `- [${r.type}] Severidad ${r.severity}: ${r.description || "Sin descripción"}`)
        .join("\n")}`;

    // Fix for @google/genai 2.x: use models.generateContent directly
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{role: "user", parts: [{text: prompt}]}],
    });
    const responseText = result.text?.trim() || "{}";

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch {
      return {
        summary: responseText,
        criticalZones: [],
        mainBarrierType: "unknown",
        recommendation: "Revisar logs para ver la respuesta completa.",
      };
    }
  }
);
