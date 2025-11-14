// Wait for Firebase SDK to be loaded from CDN
function waitForFirebaseSDK() {
    return new Promise((resolve) => {
        if (window.firebaseSDK) {
            resolve(window.firebaseSDK);
        } else {
            // Check every 100ms for Firebase SDK to be loaded
            const checkInterval = setInterval(() => {
                if (window.firebaseSDK) {
                    clearInterval(checkInterval);
                    resolve(window.firebaseSDK);
                }
            }, 100);
        }
    });
}

// Initialize Firebase with loaded SDK
async function initializeFirebase() {
    const { initializeApp, getAuth, GoogleAuthProvider, getFirestore, getStorage } = await waitForFirebaseSDK();

    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c",
        authDomain: "dental-clinic-demo-ce94b.firebaseapp.com",
        projectId: "dental-clinic-demo-ce94b",
        storageBucket: "dental-clinic-demo-ce94b.firebasestorage.app"
    };

    // Initialize Firebase services
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    console.log('Firebase Firestore initialized:', db);
    console.log('Firebase Storage initialized:', storage);

    // Initialize Auth Providers
    const googleProvider = new GoogleAuthProvider();

    // Make services globally available
    window.firebase = {
        auth,
        db,
        storage,
        app,
        googleProvider
    };

    return {
        auth,
        db,
        storage,
        app,
        googleProvider
    };
}

// Auto-initialize Firebase when this script loads
initializeFirebase().then((services) => {
    console.log('✅ Firebase initialized successfully!');
}).catch((error) => {
    console.error('❌ Firebase initialization failed:', error);
});