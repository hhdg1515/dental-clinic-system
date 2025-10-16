import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
console.log(db)
// Initialize Auth Providers
const googleProvider = new GoogleAuthProvider();

// Export the initialized services and providers
export { auth, db, app, googleProvider };