import {onCall, HttpsError} from "firebase-functions/v2/https";
import {GoogleGenAI} from "@google/genai";
import * as logger from "firebase-functions/logger";
import {verifyUser} from "../middleware/auth";

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

interface SpamResult {
  isBarrier: boolean;
  reason: string;
}

export async function detectSpam(photoUrl: string): Promise<SpamResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new HttpsError("internal", "GEMINI_API_KEY no configurada.");
  }

  const {base64, mimeType} = await fetchImageAsBase64(photoUrl);

  const genAI = new GoogleGenAI({apiKey});

  const prompt = `Eres un filtro anti-spam para una app de reportes de
barreras de accesibilidad urbana en Tijuana.

Analiza esta imagen y determina si muestra una barrera de accesibilidad REAL
o es contenido no válido (spam, selfie, meme, paisaje, animal, comida, etc.).

Responde ÚNICAMENTE con un JSON:
{
  "isBarrier": false,
  "reason": "La imagen es un paisaje sin ninguna barrera de accesibilidad visible."
}

O si SÍ es una barrera:
{
  "isBarrier": true,
  "reason": "Se observa una rampa bloqueada por escombros de construcción."
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

  let parsed: SpamResult;

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
    typeof parsed.reason !== "string"
  ) {
    throw new HttpsError("internal", "Gemini devolvió datos inválidos.");
  }

  logger.info("Detección de spam", {
    isBarrier: parsed.isBarrier,
    reason: parsed.reason.substring(0, 100),
  });

  return parsed;
}

export const detectSpamCallable = onCall(
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

    return detectSpam(photoUrl);
  }
);
