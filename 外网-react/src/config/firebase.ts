// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Using environment variables for better configuration management
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dental-clinic-demo-ce94b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dental-clinic-demo-ce94b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dental-clinic-demo-ce94b.firebasestorage.app"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Auth Providers
const googleProvider = new GoogleAuthProvider();

// Export the initialized services and providers
export { app, auth, db, googleProvider };
