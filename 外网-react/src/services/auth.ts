// Authentication service
import type { User } from 'firebase/auth';
import { getFirebaseDependencies } from '../config/firebase';

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

// ========== RATE LIMITING CONFIGURATION ==========
const LOGIN_ATTEMPT_LIMIT = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const RATE_LIMIT_STORAGE_KEY = 'auth_rate_limit';

interface RateLimitData {
  attempts: number;
  lockoutUntil: number | null;
  email: string;
}

/**
 * Get rate limit data for a specific email from localStorage
 */
function getRateLimitData(email: string): RateLimitData {
  try {
    const stored = localStorage.getItem(`${RATE_LIMIT_STORAGE_KEY}_${email.toLowerCase()}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    logDevError('Error reading rate limit data:', error);
  }
  return { attempts: 0, lockoutUntil: null, email: email.toLowerCase() };
}

/**
 * Save rate limit data for a specific email to localStorage
 */
function saveRateLimitData(data: RateLimitData): void {
  try {
    localStorage.setItem(
      `${RATE_LIMIT_STORAGE_KEY}_${data.email.toLowerCase()}`,
      JSON.stringify(data)
    );
  } catch (error) {
    logDevError('Error saving rate limit data:', error);
  }
}

/**
 * Reset rate limit for a specific email
 */
function resetRateLimit(email: string): void {
  try {
    localStorage.removeItem(`${RATE_LIMIT_STORAGE_KEY}_${email.toLowerCase()}`);
  } catch (error) {
    logDevError('Error resetting rate limit:', error);
  }
}

/**
 * Check if account is locked and return remaining time
 */
function checkRateLimit(email: string): { isLocked: boolean; remainingMinutes?: number } {
  const data = getRateLimitData(email);

  if (data.lockoutUntil && Date.now() < data.lockoutUntil) {
    const remainingMs = data.lockoutUntil - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);
    return { isLocked: true, remainingMinutes };
  }

  // Lockout expired, reset
  if (data.lockoutUntil && Date.now() >= data.lockoutUntil) {
    resetRateLimit(email);
  }

  return { isLocked: false };
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(email: string): void {
  const data = getRateLimitData(email);
  data.attempts += 1;

  if (data.attempts >= LOGIN_ATTEMPT_LIMIT) {
    data.lockoutUntil = Date.now() + LOCKOUT_DURATION;
    logDev(`Account locked for ${email} until`, new Date(data.lockoutUntil));
  }

  saveRateLimitData(data);
}

/**
 * Get remaining attempts before lockout
 */
export function getRemainingAttempts(email: string): number {
  const data = getRateLimitData(email);
  const remaining = LOGIN_ATTEMPT_LIMIT - data.attempts;
  return Math.max(0, remaining);
}
// ========== END RATE LIMITING ==========

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
    const { auth, db, authModule, firestoreModule } = await getFirebaseDependencies();
    const { createUserWithEmailAndPassword, updateProfile } = authModule;
    const { doc, setDoc, getDoc } = firestoreModule;

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
  // Check rate limit BEFORE attempting authentication
  const rateLimitCheck = checkRateLimit(email);
  if (rateLimitCheck.isLocked) {
    const message = `账号已被锁定。请在 ${rateLimitCheck.remainingMinutes} 分钟后重试。\n\nAccount locked. Please try again in ${rateLimitCheck.remainingMinutes} minutes.`;
    throw new Error(message);
  }

  try {
    const { auth, authModule } = await getFirebaseDependencies();
    const { signInWithEmailAndPassword } = authModule;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Successful login - reset rate limit
    resetRateLimit(email);

    // Get user data from Firestore
    let userData = await getUserData(user.uid);

    // Fallback: if Firestore is offline or document missing, synthesize userData from config
    if (!userData) {
      const userConfig = getUserConfig(user.email || email);
      userData = {
        uid: user.uid,
        email: (user.email || email).toLowerCase(),
        role: userConfig.role,
        clinics: userConfig.clinics,
        assignedLocation: userConfig.clinics[0] || null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isFirstLogin: false,
        isVIP: false
      };

      logDev('User data not found in Firestore or client offline, using fallback config:', {
        uid: userData.uid,
        email: userData.email,
        role: userData.role,
        clinics: userData.clinics
      });
    }

    // Update last login time
    if (userData) {
      await updateUserLastLogin(user.uid);
    }

    logDev('User signed in:', user.uid, 'Role:', userData?.role);
    return { user, userData };
  } catch (error) {
    logDevError('Sign in failed:', error);

    // Record failed attempt for rate limiting
    recordFailedAttempt(email);

    // Get remaining attempts and add to error message
    const remaining = getRemainingAttempts(email);
    if (remaining > 0 && remaining < LOGIN_ATTEMPT_LIMIT) {
      const originalMessage = error instanceof Error ? error.message : '登录失败 / Login failed';
      const enhancedMessage = `${originalMessage}\n\n剩余尝试次数: ${remaining}\nRemaining attempts: ${remaining}`;
      const enhancedError = new Error(enhancedMessage);
      // Preserve original error properties
      if (error instanceof Error) {
        Object.assign(enhancedError, error);
      }
      throw enhancedError;
    }

    throw error;
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<{ user: User; userData: UserData }> {
  try {
    const { auth, db, googleProvider, authModule, firestoreModule } = await getFirebaseDependencies();
    const { signInWithPopup } = authModule;
    const { doc, setDoc } = firestoreModule;
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
    const { auth, authModule } = await getFirebaseDependencies();
    const { signOut } = authModule;
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
  let unsubscribe: (() => void) | undefined;

  void getFirebaseDependencies().then(async ({ auth, db, authModule, firestoreModule }) => {
    const { onAuthStateChanged } = authModule;
    const { doc, getDoc } = firestoreModule;

    unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? (userDoc.data() as UserData) : null;
        callback({ user, userData });
      } else {
        callback(null);
      }
    });
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(displayName: string): Promise<void> {
  try {
    const { auth, authModule } = await getFirebaseDependencies();
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }

    const { updateProfile } = authModule;
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
    const { db, firestoreModule } = await getFirebaseDependencies();
    const { doc, getDoc } = firestoreModule;
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
    const { db, firestoreModule } = await getFirebaseDependencies();
    const { doc, setDoc } = firestoreModule;
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
 * Enforces strong password requirements to prevent brute force attacks
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Minimum length requirement (industry standard)
  const minLength = 12;
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  // Uppercase letter requirement
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  // Lowercase letter requirement
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }

  // Number requirement
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }

  // Special character requirement
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  // Check against common passwords
  const commonPasswords = [
    'password', 'password123', '12345678', '123456789', '1234567890',
    'qwerty', 'qwerty123', 'abc123', 'password1', 'admin123',
    'letmein', 'welcome', 'monkey', '1234', '12345', '123456', '1234567',
    'password!', 'password@', 'passw0rd', 'p@ssword', 'pass123',
    'admin', 'root', 'user', 'test', 'guest'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more unique password');
  }

  // Check for sequential characters
  const hasSequential = /012|123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password);
  if (hasSequential) {
    errors.push('Password should not contain sequential characters (e.g., 123, abc)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get current user info
 */
export async function getCurrentUserInfo(): Promise<{ user: User; userData: UserData | null } | null> {
  const { auth } = await getFirebaseDependencies();
  const user = auth.currentUser;
  if (!user) return null;

  const userData = await getUserData(user.uid);
  return { user, userData };
}
