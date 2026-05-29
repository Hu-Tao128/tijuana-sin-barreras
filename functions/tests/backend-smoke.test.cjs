const test = require('node:test');
const assert = require('node:assert/strict');

const { HttpsError } = require('firebase-functions/v2/https');
const { validateReport } = require('../lib/middleware/validation.js');
const { verifyUser, getUserId } = require('../lib/middleware/auth.js');
const { requireRole } = require('../lib/middleware/roles.js');
const { BarrierType } = require('../lib/types/BarrierType.js');
const { Language } = require('../lib/types/Language.js');
const { Role } = require('../lib/types/Role.js');
const {
  buildUserProfileSeed,
  resolveDisplayName,
} = require('../lib/users/userProfileSeed.js');

function buildAuthRequest(uid, role) {
  return {
    auth: {
      uid,
      token: role ? { role } : {},
    },
  };
}

test('validateReport acepta lat/lng en 0', () => {
  const payload = {
    type: BarrierType.OBSTACLE,
    latitude: 0,
    longitude: 0,
    severity: 5,
    description: 'Prueba de coordenadas cero',
  };

  assert.doesNotThrow(() => validateReport(payload));
});

test('validateReport rechaza tipo inválido', () => {
  const payload = {
    type: 'fake_type',
    latitude: 32.5,
    longitude: -117.0,
  };

  assert.throws(
    () => validateReport(payload),
    (err) => err instanceof HttpsError && err.code === 'invalid-argument'
  );
});

test('verifyUser rechaza request sin auth', () => {
  assert.throws(
    () => verifyUser({}),
    (err) => err instanceof HttpsError && err.code === 'unauthenticated'
  );
});

test('getUserId obtiene uid cuando hay auth', () => {
  const req = buildAuthRequest('uid-123');
  assert.equal(getUserId(req), 'uid-123');
});

test('requireRole permite official para endpoint moderator', async () => {
  const req = buildAuthRequest('uid-1', Role.OFFICIAL);
  await assert.doesNotReject(() => requireRole(req, Role.MODERATOR));
});

test('requireRole bloquea citizen para endpoint moderator', async () => {
  const req = buildAuthRequest('uid-2', Role.CITIZEN);

  await assert.rejects(
    () => requireRole(req, Role.MODERATOR),
    (err) => err instanceof HttpsError && err.code === 'permission-denied'
  );
});

test('resolveDisplayName usa email cuando no hay displayName', () => {
  assert.equal(resolveDisplayName(null, 'ana.lopez@example.com'), 'ana.lopez');
});

test('buildUserProfileSeed crea perfil base citizen', () => {
  const profile = buildUserProfileSeed(
    {
      uid: 'uid-3',
      email: 'nuevo@example.com',
      photoURL: 'https://example.com/avatar.jpg',
    },
    {},
    1717000000000
  );

  assert.equal(profile.uid, 'uid-3');
  assert.equal(profile.displayName, 'nuevo');
  assert.equal(profile.role, Role.CITIZEN);
  assert.equal(profile.preferredLanguage, Language.ES);
  assert.equal(profile.reportCount, 0);
  assert.equal(profile.verifiedReportCount, 0);
  assert.equal(profile.createdAt.toMillis(), 1717000000000);
  assert.equal(profile.lastLoginAt.toMillis(), 1717000000000);
});
