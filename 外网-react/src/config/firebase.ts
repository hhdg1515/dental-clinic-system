// Firebase configuration and initialization
import type { FirebaseApp } from 'firebase/app';
import type { Auth, GoogleAuthProvider } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Using environment variables for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
};

// Validate that all required environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n` +
    'Please copy .env.example to .env.local and fill in your Firebase configuration.'
  );
}

interface FirebaseDependencies {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  googleProvider: GoogleAuthProvider;
  authModule: typeof import('firebase/auth');
  firestoreModule: typeof import('firebase/firestore');
}

let firebasePromise: Promise<FirebaseDependencies> | null = null;

async function loadFirebase(): Promise<FirebaseDependencies> {
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore')
  ]);

  const app =
    appModule.getApps && appModule.getApps().length > 0
      ? appModule.getApps()[0]!
      : appModule.initializeApp(firebaseConfig);

  const auth = authModule.getAuth(app);
  const db = firestoreModule.getFirestore(app);
  const googleProvider = new authModule.GoogleAuthProvider();

  return {
    app,
    auth,
    db,
    googleProvider,
    authModule,
    firestoreModule
  };
}

export async function getFirebaseDependencies(): Promise<FirebaseDependencies> {
  if (!firebasePromise) {
    firebasePromise = loadFirebase();
  }
  return firebasePromise;
}
