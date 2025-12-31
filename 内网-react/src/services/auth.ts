// Authentication service for admin panel
import {
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
  signInMethod?: string;
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

// All available clinics
export const ALL_CLINICS = [
  'arcadia',
  'irvine',
  'south-pasadena',
  'rowland-heights',
  'eastvale'
];

// Clinic display names
export const CLINIC_NAMES: Record<string, string> = {
  'arcadia': 'Arcadia',
  'irvine': 'Irvine',
  'south-pasadena': 'South Pasadena',
  'rowland-heights': 'Rowland Heights',
  'eastvale': 'Eastvale'
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
  return { role: 'customer', clinics: [] };
}

/**
 * Get accessible clinics for a user
 */
export function getAccessibleClinics(email: string): string[] {
  const config = getUserConfig(email);
  // Owner can access all clinics
  if (config.role === 'owner') {
    return ALL_CLINICS;
  }
  return config.clinics;
}

/**
 * Sign in an existing user (admin only)
 */
export async function signInUser(
  email: string,
  password: string
): Promise<{ user: User; userData: UserData | null }> {
  try {
    // Check if user is admin before signing in
    const config = getUserConfig(email);
    if (config.role === 'customer') {
      throw new Error('只有管理员可以访问此系统');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get or create user data
    let userData = await getUserData(user.uid);

    if (!userData) {
      // Create user document if not exists
      userData = {
        uid: user.uid,
        email: email.toLowerCase(),
        role: config.role,
        clinics: config.clinics,
        assignedLocation: config.clinics[0] || null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isFirstLogin: true
      };
      await setDoc(doc(db, 'users', user.uid), userData);
    } else {
      // Update last login time
      await updateUserLastLogin(user.uid);
    }

    logDev('管理员登录成功:', user.uid, '角色:', userData.role);
    return { user, userData };
  } catch (error) {
    logDevError('登录失败:', error);
    throw error;
  }
}

/**
 * Sign in with Google (admin only)
 */
export async function signInWithGoogle(): Promise<{ user: User; userData: UserData }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user is admin
    const config = getUserConfig(user.email || '');
    if (config.role === 'customer') {
      await signOut(auth);
      throw new Error('只有管理员可以访问此系统');
    }

    // Check if user already exists
    let userData = await getUserData(user.uid);

    if (!userData) {
      // New admin user, create user document
      userData = {
        uid: user.uid,
        email: (user.email || '').toLowerCase(),
        role: config.role,
        clinics: config.clinics,
        assignedLocation: config.clinics[0] || null,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isFirstLogin: true,
        signInMethod: 'google'
      };

      await setDoc(doc(db, 'users', user.uid), userData);
    } else {
      await updateUserLastLogin(user.uid);
    }

    logDev('Google登录成功:', user.uid, '角色:', userData.role);
    return { user, userData };
  } catch (error) {
    logDevError('Google登录失败:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    logDev('用户已登出');
  } catch (error) {
    logDevError('登出失败:', error);
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
      throw new Error('当前没有用户登录');
    }

    await updateProfile(auth.currentUser, { displayName });
    await updateUserData(auth.currentUser.uid, { displayName });

    logDev('用户资料已更新');
  } catch (error) {
    logDevError('更新资料失败:', error);
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
    logDevError('获取用户数据失败:', error);
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
    logDev('用户数据已更新');
  } catch (error) {
    logDevError('更新用户数据失败:', error);
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
    logDevError('更新最后登录时间失败:', error);
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
 * Get current user info
 */
export async function getCurrentUserInfo(): Promise<{ user: User; userData: UserData | null } | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const userData = await getUserData(user.uid);
  return { user, userData };
}
