/**
 * Endpoint HTTP para migración de usuarios.
 * Corre en contexto admin — no requiere ADC local.
 *
 * Uso local:
 *   curl "http://127.0.0.1:5001/tijuana-sin-barreras/us-central1/migrateUsersHttp?key=MIGRATE_SECRET_2026"
 *
 * Uso producción:
 *   curl "https://us-central1-tijuana-sin-barreras.cloudfunctions.net/migrateUsersHttp?key=MIGRATE_SECRET_2026"
 */

import {onRequest} from "firebase-functions/v2/https";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

const MIGRATION_KEY = process.env.MIGRATION_SECRET ?? "MIGRATE_SECRET_2026";

export const migrateUsersHttp = onRequest(
  {maxInstances: 1, timeoutSeconds: 540, invoker: "public"},
  async (req, res) => {
    if (req.query.key !== MIGRATION_KEY) {
      res.status(403).json({error: "Clave de migración inválida"});
      return;
    }

    const stats = {total: 0, created: 0, skipped: 0, errors: 0};

    const db = getFirestore();
    const usersCollection = db.collection("users");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.write("📋 Migración de usuarios Firebase Auth → Firestore\n");
    res.write("═══════════════════════════════════════════\n\n");

    let pageToken: string | undefined;

    do {
      const listResult = await getAuth().listUsers(1000, pageToken);
      pageToken = listResult.pageToken;

      for (const user of listResult.users) {
        stats.total++;

        try {
          const docRef = usersCollection.doc(user.uid);
          const existingDoc = await docRef.get();

          if (existingDoc.exists) {
            stats.skipped++;
            continue;
          }

          const now = Date.now();

          await docRef.set({
            uid: user.uid,
            displayName: user.displayName ?? "",
            email: user.email ?? "",
            phoneNumber: user.phoneNumber ?? null,
            photoURL: user.photoURL ?? null,
            emailVerified: user.emailVerified ?? false,
            disabled: user.disabled ?? false,
            edad: null,
            role: "citizen",
            isActive: true,
            mobilityProfile: null,
            maxWalkingMeters: null,
            canClimbStairs: null,
            maxStairSteps: null,
            visionProfile: null,
            transportModes: [],
            needsLowNoise: false,
            emergencyContact: null,
            preferredLanguage: "es",
            reportCount: 0,
            verifiedReportCount: 0,
            createdAt: Timestamp.fromMillis(now),
            lastLoginAt: Timestamp.fromMillis(now),
          });

          try {
            await getAuth().setCustomUserClaims(user.uid, {role: "citizen"});
          } catch {
            // claims ya existentes
          }

          stats.created++;

          if (stats.created % 50 === 0) {
            res.write(
              `   Procesados: ${stats.total} | Creados: ${stats.created} | Existentes: ${stats.skipped}\n`
            );
          }
        } catch (err) {
          stats.errors++;
          const message = err instanceof Error ? err.message : String(err);
          logger.error(`Error con usuario ${user.uid}`, message);
        }
      }
    } while (pageToken);

    res.write("\n═══ RESULTADOS ═══\n");
    res.write(`   Total usuarios Auth:  ${stats.total}\n`);
    res.write(`   Perfiles creados:     ${stats.created}\n`);
    res.write(`   Ya existían:          ${stats.skipped}\n`);
    res.write(`   Errores:              ${stats.errors}\n`);

    logger.info("Migración completada", stats);

    res.end();
  }
);
