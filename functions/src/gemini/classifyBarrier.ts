import {onCall, HttpsError} from "firebase-functions/v2/https";
import {GoogleGenAI} from "@google/genai";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {BarrierType} from "../types/BarrierType";

const VALID_BARRIER_TYPES = Object.values(BarrierType);

interface ClassificationResult {
  type: BarrierType;
  confidence: number;
}

export async function classifyBarrier(text: string): Promise<ClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new HttpsError("internal", "GEMINI_API_KEY no configurada.");
  }

  const genAI = new GoogleGenAI({apiKey});

  const prompt = `
Eres un clasificador de barreras de accesibilidad urbana.
Clasifica la siguiente descripción en uno de estos tipos:

${VALID_BARRIER_TYPES.map((t) => `- ${t}: describe una barrera de este tipo`).join("\n")}

Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{"type": "tipo_seleccionado", "confidence": 0.95}

Descripción del usuario:
"${text}"
`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const responseText = result.text?.trim() ?? "";

  if (!responseText) {
    throw new HttpsError("internal", "Gemini no devolvió respuesta.");
  }

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new HttpsError(
      "internal",
      `Respuesta de Gemini no contiene JSON válido: ${responseText.substring(0, 200)}`
    );
  }

  let parsed: { type: string; confidence: number };

  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new HttpsError(
      "internal",
      `Error al parsear respuesta de Gemini: ${responseText.substring(0, 200)}`
    );
  }

  if (
    typeof parsed.type !== "string" ||
    !VALID_BARRIER_TYPES.includes(parsed.type as BarrierType) ||
    typeof parsed.confidence !== "number"
  ) {
    throw new HttpsError(
      "internal",
      "Gemini devolvió datos inválidos."
    );
  }

  logger.info("Clasificación de barrera", {
    type: parsed.type,
    confidence: parsed.confidence,
  });

  return {
    type: parsed.type as BarrierType,
    confidence: parsed.confidence,
  };
}

export const classifyBarrierCallable = onCall(
  {maxInstances: 5},
  async (request) => {
    await verifyUser(request);

    const {description} = request.data as { description: string };

    if (!description || typeof description !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Se requiere una descripción de texto."
      );
    }

    return classifyBarrier(description);
  }
);
