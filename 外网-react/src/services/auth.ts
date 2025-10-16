// Authentication service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';

// User data interface
export interface UserData {
  uid: string;
  email: string;
  role: 'owner' | 'admin' | 'customer';
  clinics: string[];
  assignedLocation: string | null;
  createdAt: string;
  lastLogin: string;
  isFirstLogin: boolean;
  displayName?: string;
  photoURL?: string;
  isVIP?: boolean;
  signInMethod?: string;
  registrationSource?: string;
}

// Admin accounts configuration
const ADMIN_ACCOUNTS: Record<string, { role: 'owner' | 'admin'; clinics: string[] }> = {
  'admin@firstavedental.com': { role: 'owner', clinics: [] }, // Owner - can access all clinics
  'manager1@firstavedental.com': { role: 'admin', clinics: ['arcadia'] },
  'manager2@firstavedental.com': { role: 'admin', clinics: ['irvine'] },
  'manager3@firstavedental.com': { role: 'admin', clinics: ['south-pasadena'] },
  'manager4@firstavedental.com': { role: 'admin', clinics: ['rowland-heights'] },
  'manager5@firstavedental.com': { role: 'admin', clinics: ['eastvale'] }
};

const logDev = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

const logDevError = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

/**
 * Get user role and clinic configuration
 */
function getUserConfig(email: string): { role: 'owner' | 'admin' | 'customer'; clinics: string[] } {
  const config = ADMIN_ACCOUNTS[email?.toLowerCase()];
  if (config) {
    return config;
  }
  // Default customer role, no clinic access
  return { role: 'customer', clinics: [] };
}

/**
 * Sign up a new user
 */
export async function signUpUser(
  email: string,
  password: string,
  additionalInfo: Partial<UserData> = {}
): Promise<{ user: User; userData: UserData }> {
  try {
    logDev('=== Starting user registration ===');
    logDev('Email:', email);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user) {
      throw new Error('User object is null after authentication');
    }

    logDev('Firebase Auth successful, UID:', user.uid);

    // Determine user role and clinic configuration
    const userConfig = getUserConfig(email);
    logDev('User config determined:', userConfig);

    // Create user document in Firestore
    const userData: UserData = {
      uid: user.uid,
      email: email.toLowerCase(),
      role: userConfig.role,
      clinics: userConfig.clinics,
      assignedLocation: userConfig.clinics[0] || null,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isFirstLogin: true,
      isVIP: false,
      ...additionalInfo
    };

    logDev('Attempting to create Firestore document...');
    await setDoc(doc(db, 'users', user.uid), userData);
    logDev('✓ Firestore document created successfully');

    // Verify document was created
    const verifyDoc = await getDoc(doc(db, 'users', user.uid));
    if (verifyDoc.exists()) {
      logDev('✅ VERIFICATION SUCCESS: Document exists in Firestore');
    } else {
      logDev('❌ VERIFICATION FAILED: Document does NOT exist in Firestore');
    }

    // Update user profile if displayName provided
    if (additionalInfo.displayName) {
      await updateProfile(user, { displayName: additionalInfo.displayName });
    }

    logDev('User signed up successfully:', user.uid, 'Role:', userConfig.role);
    return { user, userData };
  } catch (error) {
    logDevError('❌ Registration error:', error);
    throw error;
  }
}

/**
 * Sign in an existing user
 */
export async function signInUser(
  email: string,
  password: string
): Promise<{ user: User; userData: UserData | null }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userData = await getUserData(user.uid);

    // Update last login time
    if (userData) {
      await updateUserLastLogin(user.uid);
    }

    logDev('User signed in:', user.uid, 'Role:', userData?.role);
    return { user, userData };
  } catch (error) {
    logDevError('Sign in failed:', error);
    throw error;
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<{ user: User; userData: UserData }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user already exists
    let userData = await getUserData(user.uid);

    if (!userData) {
      // New user, create user document
      const userConfig = getUserConfig(user.email || '');
      userData = {
        uid: user.uid,
        email: (user.email || '').toLowerCase(),
        role: userConfig.role,
        clinics: userConfig.clinics,
        assignedLocation: userConfig.clinics[0] || null,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isFirstLogin: true,
        isVIP: false,
        signInMethod: 'google'
      };

      await setDoc(doc(db, 'users', user.uid), userData);
    } else {
      // Existing user, update last login
      await updateUserLastLogin(user.uid);
    }

    logDev('Signed in with Google:', user.uid, 'Role:', userData.role);
    return { user, userData };
  } catch (error) {
    logDevError('Google sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    logDev('User signed out successfully.');
  } catch (error) {
    logDevError('Sign out failed:', error);
    throw error;
  }
}

/**
 * Listen for authentication state changes
 */
export function listenForAuthStateChange(
  callback: (authData: { user: User; userData: UserData | null } | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userData = await getUserData(user.uid);
      callback({ user, userData });
    } else {
      callback(null);
    }
  });
}

/**
 * Update user profile
 */
export async function updateUserProfile(displayName: string): Promise<void> {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }

    await updateProfile(auth.currentUser, { displayName });

    // Also update Firestore user document
    await updateUserData(auth.currentUser.uid, { displayName });

    logDev('Profile updated successfully.');
  } catch (error) {
    logDevError('Profile update failed:', error);
    throw error;
  }
}

/**
 * Get user data from Firestore
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    logDevError('Error getting user data:', error);
    return null;
  }
}

/**
 * Update user data in Firestore
 */
export async function updateUserData(uid: string, updateData: Partial<UserData>): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, updateData, { merge: true });
    logDev('User data updated successfully.');
  } catch (error) {
    logDevError('Error updating user data:', error);
    throw error;
  }
}

/**
 * Update user last login time
 */
async function updateUserLastLogin(uid: string): Promise<void> {
  try {
    await updateUserData(uid, {
      lastLogin: new Date().toISOString(),
      isFirstLogin: false
    });
  } catch (error) {
    logDevError('Error updating last login:', error);
  }
}

/**
 * Check if user is admin
 */
export function isAdminUser(email: string): boolean {
  if (!email) {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(ADMIN_ACCOUNTS, email.toLowerCase());
}

/**
 * Get user role
 */
export function getUserRole(email: string): 'owner' | 'admin' | 'customer' {
  const config = getUserConfig(email);
  return config.role;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const minLength = 6;
  const isValid = password.length >= minLength;

  return {
    isValid,
    errors: isValid ? [] : [`Password must be at least ${minLength} characters`]
  };
}

/**
 * Get current user info
 */
export async function getCurrentUserInfo(): Promise<{ user: User; userData: UserData | null } | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const userData = await getUserData(user.uid);
  return { user, userData };
}
