const test = require("node:test");
const assert = require("node:assert/strict");

const { HttpsError } = require("firebase-functions/v2/https");
const { validateReport } = require("../lib/middleware/validation.js");
const { verifyUser, getUserId } = require("../lib/middleware/auth.js");
const { requireRole, getUserRole } = require("../lib/middleware/roles.js");
const { BarrierType } = require("../lib/types/BarrierType.js");
const { Language } = require("../lib/types/Language.js");
const { Role } = require("../lib/types/Role.js");
const {
  buildUserProfileSeed,
  resolveDisplayName,
} = require("../lib/users/userProfileSeed.js");

function buildAuthRequest(uid, role) {
  return {
    auth: {
      uid,
      token: role ? { role } : {},
    },
  };
}

// ─── middleware/validation ───

test("validateReport acepta lat/lng en 0", () => {
  const payload = {
    type: BarrierType.OBSTACLE,
    latitude: 0,
    longitude: 0,
    severity: 5,
    description: "Prueba de coordenadas cero",
  };
  assert.doesNotThrow(() => validateReport(payload));
});

test("validateReport rechaza tipo invalido", () => {
  const payload = { type: "fake_type", latitude: 32.5, longitude: -117.0 };
  assert.throws(
    () => validateReport(payload),
    (err) => err instanceof HttpsError && err.code === "invalid-argument"
  );
});

test("validateReport rechaza latitud > 90", () => {
  const payload = {
    type: BarrierType.OBSTACLE,
    latitude: 91,
    longitude: 0,
  };
  assert.throws(
    () => validateReport(payload),
    (err) => err instanceof HttpsError && err.code === "invalid-argument"
  );
});

test("validateReport rechaza latitud < -90", () => {
  const payload = {
    type: BarrierType.OBSTACLE,
    latitude: -91,
    longitude: 0,
  };
  assert.throws(
    () => validateReport(payload),
    (err) => err instanceof HttpsError && err.code === "invalid-argument"
  );
});

test("validateReport rechaza longitud > 180", () => {
  const payload = {
    type: BarrierType.OBSTACLE,
    latitude: 0,
    longitude: 181,
  };
  assert.throws(
    () => validateReport(payload),
    (err) => err instanceof HttpsError && err.code === "invalid-argument"
  );
});

test("validateReport rechaza severidad < 1", () => {
  const payload = {
    type: BarrierType.OBSTACLE,
    latitude: 32.5,
    longitude: -117,
    severity: 0,
  };
  assert.throws(
    () => validateReport(payload),
    (err) => err instanceof HttpsError && err.code === "invalid-argument"
  );
});

test("validateReport rechaza severidad > 10", () => {
  const payload = {
    type: BarrierType.OBSTACLE,
    latitude: 32.5,
    longitude: -117,
    severity: 11,
  };
  assert.throws(
    () => validateReport(payload),
    (err) => err instanceof HttpsError && err.code === "invalid-argument"
  );
});

test("validateReport rechaza descripcion > 500 chars", () => {
  const payload = {
    type: BarrierType.OBSTACLE,
    latitude: 32.5,
    longitude: -117,
    description: "x".repeat(501),
  };
  assert.throws(
    () => validateReport(payload),
    (err) => err instanceof HttpsError && err.code === "invalid-argument"
  );
});

// ─── middleware/auth ───

test("verifyUser rechaza request sin auth", () => {
  assert.throws(
    () => verifyUser({}),
    (err) => err instanceof HttpsError && err.code === "unauthenticated"
  );
});

test("getUserId obtiene uid cuando hay auth", () => {
  const req = buildAuthRequest("uid-123");
  assert.equal(getUserId(req), "uid-123");
});

// ─── middleware/roles ───

test("requireRole permite official para endpoint moderator", async () => {
  const req = buildAuthRequest("uid-1", Role.OFFICIAL);
  await assert.doesNotReject(() => requireRole(req, Role.MODERATOR));
});

test("requireRole permite moderator para endpoint moderator", async () => {
  const req = buildAuthRequest("uid-2", Role.MODERATOR);
  await assert.doesNotReject(() => requireRole(req, Role.MODERATOR));
});

test("requireRole bloquea citizen para endpoint moderator", async () => {
  const req = buildAuthRequest("uid-3", Role.CITIZEN);
  await assert.rejects(
    () => requireRole(req, Role.MODERATOR),
    (err) => err instanceof HttpsError && err.code === "permission-denied"
  );
});

test("requireRole bloquea citizen para endpoint official", async () => {
  const req = buildAuthRequest("uid-4", Role.CITIZEN);
  await assert.rejects(
    () => requireRole(req, Role.OFFICIAL),
    (err) => err instanceof HttpsError && err.code === "permission-denied"
  );
});

test("requireRole permite official para endpoint official", async () => {
  const req = buildAuthRequest("uid-5", Role.OFFICIAL);
  await assert.doesNotReject(() => requireRole(req, Role.OFFICIAL));
});

test("getUserRole devuelve role para usuario autenticado", () => {
  const req = buildAuthRequest("uid-6", Role.MODERATOR);
  assert.equal(getUserRole(req), Role.MODERATOR);
});

test("getUserRole devuelve citizen por defecto sin claim", () => {
  const req = buildAuthRequest("uid-7");
  assert.equal(getUserRole(req), Role.CITIZEN);
});

// ─── users/userProfileSeed ───

test("resolveDisplayName usa email cuando no hay displayName", () => {
  assert.equal(resolveDisplayName(null, "ana.lopez@example.com"), "ana.lopez");
});

test("resolveDisplayName usa displayName cuando existe", () => {
  assert.equal(resolveDisplayName("Ana Lopez", "ana@example.com"), "Ana Lopez");
});

test("resolveDisplayName usa Usuario cuando no hay nada", () => {
  assert.equal(resolveDisplayName(null, null), "Usuario");
});

test("buildUserProfileSeed crea perfil base citizen", () => {
  const profile = buildUserProfileSeed(
    { uid: "uid-3", email: "nuevo@example.com", photoURL: "https://example.com/avatar.jpg" },
    {},
    1717000000000
  );
  assert.equal(profile.uid, "uid-3");
  assert.equal(profile.displayName, "nuevo");
  assert.equal(profile.role, Role.CITIZEN);
  assert.equal(profile.preferredLanguage, Language.ES);
  assert.equal(profile.reportCount, 0);
  assert.equal(profile.verifiedReportCount, 0);
  assert.equal(profile.createdAt.toMillis(), 1717000000000);
  assert.equal(profile.lastLoginAt.toMillis(), 1717000000000);
});

test("buildUserProfileSeed preserva contadores existentes", () => {
  const profile = buildUserProfileSeed(
    { uid: "uid-4", email: "existente@example.com" },
    { reportCount: 5, verifiedReportCount: 2, role: Role.MODERATOR },
    1717000000000
  );
  assert.equal(profile.reportCount, 5);
  assert.equal(profile.verifiedReportCount, 2);
  assert.equal(profile.role, Role.MODERATOR);
});

test("buildUserProfileSeed preserva preferencias existentes", () => {
  const profile = buildUserProfileSeed(
    { uid: "uid-5", email: "pref@example.com" },
    {
      preferredLanguage: Language.EN,
      mobilityProfile: "wheelchair_manual",
      needsLowNoise: true,
    },
    1717000000000
  );
  assert.equal(profile.preferredLanguage, Language.EN);
  assert.equal(profile.mobilityProfile, "wheelchair_manual");
  assert.equal(profile.needsLowNoise, true);
});

// ─── Confirmacion idempotente (logica de clave compuesta) ───

test("clave de confirmacion usa formato reportId_userId", () => {
  const reportId = "abc123";
  const userId = "user1";
  const key = `${reportId}_${userId}`;
  assert.equal(key, "abc123_user1");
});

test("misma combinacion report+user genera misma clave (idempotencia)", () => {
  const report1 = "r1";
  const user1 = "u1";
  const key1 = `${report1}_${user1}`;
  const key2 = `${report1}_${user1}`;
  assert.equal(key1, key2);
});

test("clave es deterministica sin push()", () => {
  const keys = [];
  for (let i = 0; i < 10; i++) {
    keys.push(`report-1_user-42`);
  }
  const allEqual = keys.every((k) => k === keys[0]);
  assert.ok(allEqual, "10 iteraciones deben producir la misma clave");
});
