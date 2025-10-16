// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI",
  authDomain: "dental-clinic-demo-ce94b.firebaseapp.com",
  projectId: "dental-clinic-demo-ce94b",
  storageBucket: "dental-clinic-demo-ce94b.firebasestorage.app"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Auth Providers
const googleProvider = new GoogleAuthProvider();

// Export the initialized services and providers
export { app, auth, db, googleProvider };
