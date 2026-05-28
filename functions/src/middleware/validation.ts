import {HttpsError} from "firebase-functions/v2/https";
import {Report} from "../types/Report";
import {BarrierType} from "../types/BarrierType";

const VALID_BARRIER_TYPES = Object.values(BarrierType);

export function validateReport(report: Partial<Report>): asserts report is Report {
  const errors: string[] = [];

  if (report.latitude === undefined || typeof report.latitude !== "number") {
    errors.push("Latitud es requerida y debe ser un número.");
  } else if (report.latitude < -90 || report.latitude > 90) {
    errors.push("Latitud debe estar entre -90 y 90.");
  }

  if (report.longitude === undefined || typeof report.longitude !== "number") {
    errors.push("Longitud es requerida y debe ser un número.");
  } else if (report.longitude < -180 || report.longitude > 180) {
    errors.push("Longitud debe estar entre -180 y 180.");
  }

  if (!report.type || !VALID_BARRIER_TYPES.includes(report.type)) {
    errors.push(
      `Tipo de barrera inválido. Valores permitidos: ${VALID_BARRIER_TYPES.join(", ")}.`
    );
  }

  if (
    report.severity !== undefined &&
    (typeof report.severity !== "number" ||
      report.severity < 1 ||
      report.severity > 10)
  ) {
    errors.push("La severidad debe ser un número entre 1 y 10.");
  }

  if (
    report.description !== undefined &&
    (typeof report.description !== "string" ||
      report.description.length > 500)
  ) {
    errors.push("La descripción debe ser texto de máximo 500 caracteres.");
  }

  if (errors.length > 0) {
    throw new HttpsError(
      "invalid-argument",
      errors.join(" ")
    );
  }
}
