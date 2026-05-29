/**
 * Script de migración: crea documentos en Firestore para todos los usuarios
 * existentes en Firebase Authentication.
 *
 * Uso:
 *   yarn migrate-users                         # producción (requiere ADC)
 *   yarn migrate-users --emulator              # emuladores locales
 *   yarn migrate-users --dry-run               # solo listar, no escribir
 *
 * Requisitos:
 *   - ADC configurado: gcloud auth application-default login
 *   - O bien: GOOGLE_APPLICATION_CREDENTIALS apuntando a una clave de servicio
 */

import {initializeApp, getApps, cert} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, Timestamp} from "firebase-admin/firestore";

const PROJECT_ID = "tijuana-sin-barreras";
const COLLECTION = "users";

interface MigrationStats {
  total: number;
  created: number;
  skipped: number;
  errors: number;
}

const stats: MigrationStats = {total: 0, created: 0, skipped: 0, errors: 0};

function parseArgs(): {dryRun: boolean; emulator: boolean} {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    emulator: args.includes("--emulator"),
  };
}

function getDefaults(user: {
  uid: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  emailVerified?: boolean;
  disabled?: boolean;
  providerData?: Array<{
    providerId: string;
    uid: string;
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    photoURL?: string;
  }>;
}) {
  const now = Date.now();

  return {
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
  };
}

async function migrateUsers(): Promise<void> {
  const {dryRun, emulator} = parseArgs();

  if (emulator) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
    process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  }

  if (!getApps().length) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath) {
      initializeApp({
        credential: cert(serviceAccountPath),
        projectId: PROJECT_ID,
      });
    } else {
      initializeApp({projectId: PROJECT_ID});
    }
  }

  const db = getFirestore();
  const usersCollection = db.collection(COLLECTION);

  console.log("\n--- Migracion de usuarios Firebase Auth -> Firestore ---");
  console.log(`   Proyecto: ${PROJECT_ID}`);
  console.log(`   Modo: ${dryRun ? "DRY-RUN (sin escritura)" : "ESCRITURA"}`);
  console.log(`   Emulador: ${emulator ? "SI" : "NO (produccion)"}\n`);

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
          process.stdout.write(".");
          continue;
        }

        const userData = getDefaults(user);

        if (!dryRun) {
          await docRef.set(userData);

          try {
            await getAuth().setCustomUserClaims(user.uid, {role: "citizen"});
          } catch {
            // el usuario ya puede tener claims establecidos
          }
        }

        stats.created++;
        process.stdout.write("+");

        if (stats.created % 50 === 0) {
          console.log(`\n   Procesados: ${stats.total} | Creados: ${stats.created} | Existentes: ${stats.skipped}`);
        }
      } catch (err) {
        stats.errors++;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\n   ERROR con usuario ${user.uid}: ${message}`);
      }
    }
  } while (pageToken);

  console.log("\n");
  console.log("=== RESULTADOS ===");
  console.log(`   Total usuarios Auth:  ${stats.total}`);
  console.log(`   Perfiles creados:     ${stats.created}`);
  console.log(`   Ya existían:          ${stats.skipped}`);
  console.log(`   Errores:              ${stats.errors}`);
  if (dryRun) {
    console.log("\n   [DRY-RUN] No se realizaron escrituras.");
    console.log("   Ejecuta sin --dry-run para aplicar los cambios.");
  }
  console.log();
}

migrateUsers().catch((err) => {
  console.error("Error fatal durante la migración:", err);
  process.exit(1);
});
