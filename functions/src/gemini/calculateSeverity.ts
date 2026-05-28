import {onCall, HttpsError} from "firebase-functions/v2/https";
import {GoogleGenAI} from "@google/genai";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";

export async function calculateSeverity(
  description: string,
  barrierType: string
): Promise<number> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new HttpsError("internal", "GEMINI_API_KEY no configurada.");
  }

  const genAI = new GoogleGenAI({apiKey});

  const prompt = `
Eres un evaluador de severidad de barreras de accesibilidad urbana.
Califica la severidad de la siguiente barrera en una escala del 1 al 10
(donde 1 es leve y 10 es extremadamente grave).

Considera:
- Impacto en personas con discapacidad
- Riesgo de accidente
- Urgencia de reparación

Tipo de barrera: ${barrierType}
Descripción: "${description}"

Responde ÚNICAMENTE con un número entero del 1 al 10.
`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const responseText = result.text?.trim() ?? "";

  const severityMatch = responseText.match(/\b(10|[1-9])\b/);

  if (!severityMatch) {
    logger.warn("Gemini no devolvió severidad numérica, usando valor por defecto.", {
      response: responseText.substring(0, 200),
    });
    return 5;
  }

  const severity = parseInt(severityMatch[1], 10);

  const clampedSeverity = Math.min(10, Math.max(1, severity));

  logger.info("Severidad calculada", {
    barrierType,
    severity: clampedSeverity,
  });

  return clampedSeverity;
}

export const calculateSeverityCallable = onCall(
  {maxInstances: 5},
  async (request) => {
    await verifyUser(request);

    const {description, barrierType} = request.data as {
      description: string;
      barrierType: string;
    };

    if (!description || typeof description !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Se requiere una descripción de texto."
      );
    }

    const severity = await calculateSeverity(description, barrierType);

    return {severity};
  }
);
