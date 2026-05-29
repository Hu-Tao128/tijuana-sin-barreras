import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getDatabase, type Database } from 'firebase/database'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import {
  connectFunctionsEmulator,
  getFunctions,
  type Functions,
} from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Las Cloud Functions v2 se despliegan por defecto en us-central1.
const FUNCTIONS_REGION = 'us-central1'

function createFirebase(): {
  app: FirebaseApp
  auth: Auth
  database: Database
  storage: FirebaseStorage
  functions: Functions
} {
  const app = initializeApp(firebaseConfig)
  const functions = getFunctions(app, FUNCTIONS_REGION)

  if (import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true') {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  }

  return {
    app,
    auth: getAuth(app),
    database: getDatabase(app),
    storage: getStorage(app),
    functions,
  }
}

export const { app, auth, database, storage, functions } = createFirebase()
