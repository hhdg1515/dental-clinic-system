// Firebase Configuration Template
// INSTRUCTIONS:
// 1. Copy this file to firebase-config.js
// 2. Replace the placeholder values with your actual Firebase configuration
// 3. DO NOT commit firebase-config.js to version control
// 4. firebase-config.js should be in .gitignore

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
    // REPLACE THESE VALUES WITH YOUR ACTUAL FIREBASE CONFIG
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY_HERE",
        authDomain: "YOUR_PROJECT.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT.firebasestorage.app"
    };

    // Validate configuration
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket'];
    const missingFields = requiredFields.filter(field =>
        !firebaseConfig[field] || firebaseConfig[field].includes('YOUR_')
    );

    if (missingFields.length > 0) {
        console.error('❌ Firebase configuration incomplete!');
        console.error('Missing or placeholder values for:', missingFields);
        throw new Error(
            'Firebase configuration not set. Please copy firebase-config.template.js ' +
            'to firebase-config.js and fill in your actual configuration values.'
        );
    }

    // Initialize Firebase services
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    if (import.meta?.env?.DEV) {
        console.log('Firebase Firestore initialized:', db);
        console.log('Firebase Storage initialized:', storage);
    }

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
