import {onCall, HttpsError} from "firebase-functions/v2/https";
import {GoogleGenAI} from "@google/genai";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";
import {BarrierType} from "../types/BarrierType";

const VALID_TYPES = Object.values(BarrierType);

async function fetchImageAsBase64(url: string): Promise<{base64: string; mimeType: string}> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new HttpsError(
      "invalid-argument",
      `No se pudo descargar la imagen: ${response.status}`
    );
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {base64, mimeType: contentType};
}

interface ClassificationResult {
  type: BarrierType;
  severity: number;
  confidence: number;
  description: string;
  isBarrier: boolean;
}

export async function classifyBarrier(photoUrl: string): Promise<ClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new HttpsError("internal", "GEMINI_API_KEY no configurada.");
  }

  const {base64, mimeType} = await fetchImageAsBase64(photoUrl);

  const genAI = new GoogleGenAI({apiKey});

  const prompt = `Eres un inspector de accesibilidad urbana en Tijuana, México.

Analiza esta foto y determina:

1. ¿Muestra una barrera de accesibilidad urbana? (banqueta rota, rampa bloqueada, obstáculo, etc.)
2. Si SÍ es una barrera, clasifícala en uno de estos tipos:
   ${VALID_TYPES.map((t) => `- ${t}`).join("\n")}
3. Severidad del 1 al 10 (donde 10 es extremadamente grave e impide el paso).
4. Genera una descripción breve en español (máximo 200 caracteres) explicando qué se ve en la foto.

Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "isBarrier": true,
  "type": "broken_sidewalk",
  "severity": 8,
  "confidence": 0.95,
  "description": "Banqueta con grietas profundas que dificultan el paso de silla de ruedas."
}

Si NO es una barrera, usa:
{
  "isBarrier": false,
  "type": "other",
  "severity": 1,
  "confidence": 1.0,
  "description": "La imagen no muestra una barrera de accesibilidad."
}`;

  const result = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{
      role: "user",
      parts: [
        {text: prompt},
        {inlineData: {mimeType, data: base64}},
      ],
    }],
  });

  const responseText = result.text?.trim() ?? "";

  if (!responseText) {
    throw new HttpsError("internal", "Gemini no devolvió respuesta.");
  }

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new HttpsError(
      "internal",
      `Respuesta de Gemini no contiene JSON: ${responseText.substring(0, 200)}`
    );
  }

  let parsed: ClassificationResult;

  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new HttpsError(
      "internal",
      `Error al parsear respuesta: ${responseText.substring(0, 200)}`
    );
  }

  if (
    typeof parsed.isBarrier !== "boolean" ||
    typeof parsed.type !== "string" ||
    typeof parsed.severity !== "number" ||
    typeof parsed.confidence !== "number" ||
    typeof parsed.description !== "string"
  ) {
    throw new HttpsError("internal", "Gemini devolvió datos inválidos.");
  }

  if (
    parsed.isBarrier &&
    !VALID_TYPES.includes(parsed.type as BarrierType)
  ) {
    parsed.type = BarrierType.OTHER;
  }

  parsed.severity = Math.min(10, Math.max(1, Math.round(parsed.severity)));
  parsed.confidence = Math.min(1, Math.max(0, parsed.confidence));

  logger.info("Clasificación de barrera por visión", {
    isBarrier: parsed.isBarrier,
    type: parsed.type,
    severity: parsed.severity,
    confidence: parsed.confidence,
  });

  return parsed;
}

export const classifyBarrierCallable = onCall(
  {maxInstances: 5, timeoutSeconds: 60},
  async (request) => {
    await verifyUser(request);

    const {photoUrl} = request.data as {photoUrl: string};

    if (!photoUrl) {
      throw new HttpsError(
        "invalid-argument",
        "photoUrl es requerida (URL de Firebase Storage)."
      );
    }

    return classifyBarrier(photoUrl);
  }
);
