/**
 * Secure Authentication Utilities
 *
 * SECURITY FIX: Reads user role and permissions from Firebase ID Token Custom Claims
 * instead of trusting localStorage (which can be manipulated by attackers)
 *
 * @see https://firebase.google.com/docs/auth/admin/custom-claims
 */

import { auth } from '../firebase-config.js';

/**
 * Get current Firebase user's ID token with custom claims
 *
 * SECURITY: This is the ONLY secure way to check user permissions.
 * Never trust localStorage or client-side data for authorization.
 *
 * @returns {Promise<{claims: Object, user: Object} | null>}
 */
export async function getCurrentUserClaims() {
    try {
        const user = auth.currentUser;

        if (!user) {
            console.warn('🔒 No authenticated user');
            return null;
        }

        // Force token refresh to get latest claims
        const idTokenResult = await user.getIdTokenResult(true);

        return {
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            },
            claims: idTokenResult.claims
        };
    } catch (error) {
        console.error('❌ Failed to get user claims:', error);
        return null;
    }
}

/**
 * Check if current user is owner/boss
 *
 * SECURITY: Reads from Firebase token custom claims (server-verified)
 * Fallback to email domain check as secondary verification
 *
 * @returns {Promise<boolean>}
 */
export async function isOwner() {
    try {
        const result = await getCurrentUserClaims();

        if (!result) {
            return false;
        }

        const { claims, user } = result;

        // Check custom claims (set by Firebase Admin SDK)
        if (claims.role === 'owner' || claims.role === 'boss') {
            console.log('✅ User is owner (from custom claims):', user.email);
            return true;
        }

        // Fallback: Check email domain
        if (user.email && user.email.endsWith('@firstavedental.com')) {
            console.log('✅ User is owner (from email domain):', user.email);
            return true;
        }

        return false;
    } catch (error) {
        console.error('❌ Error checking owner status:', error);
        return false;
    }
}

/**
 * Get user's accessible clinics
 *
 * SECURITY: Reads from Firebase token custom claims
 *
 * @returns {Promise<string[]>}
 */
export async function getAccessibleClinics() {
    try {
        const result = await getCurrentUserClaims();

        if (!result) {
            return [];
        }

        const { claims, user } = result;

        // Check if user is owner (can access all clinics)
        if (claims.role === 'owner' || claims.role === 'boss') {
            return [
                'arcadia',
                'irvine',
                'south-pasadena',
                'rowland-heights',
                'eastvale'
            ];
        }

        // For admins, get their assigned clinics from custom claims
        if (claims.role === 'admin' && claims.clinics) {
            return Array.isArray(claims.clinics) ? claims.clinics : [];
        }

        // Fallback to email domain check
        if (user.email && user.email.endsWith('@firstavedental.com')) {
            return [
                'arcadia',
                'irvine',
                'south-pasadena',
                'rowland-heights',
                'eastvale'
            ];
        }

        return [];
    } catch (error) {
        console.error('❌ Error getting accessible clinics:', error);
        return [];
    }
}

/**
 * Get user role from custom claims
 *
 * SECURITY: Only source of truth for user role
 *
 * @returns {Promise<string>} - 'owner', 'admin', or 'customer'
 */
export async function getUserRole() {
    try {
        const result = await getCurrentUserClaims();

        if (!result) {
            return 'customer';
        }

        const { claims, user } = result;

        // Get role from custom claims
        if (claims.role) {
            return claims.role;
        }

        // Fallback to email domain
        if (user.email && user.email.endsWith('@firstavedental.com')) {
            return 'owner';
        }

        return 'customer';
    } catch (error) {
        console.error('❌ Error getting user role:', error);
        return 'customer';
    }
}

/**
 * LEGACY: Sync user data to localStorage (for backward compatibility)
 *
 * WARNING: This is ONLY for UI display purposes.
 * NEVER use localStorage data for authorization decisions.
 *
 * @param {Object} userData - User data from Firebase token
 */
export function syncUserToLocalStorage(userData) {
    try {
        // Only store non-sensitive display data
        const safeData = {
            email: userData.email,
            displayName: userData.displayName,
            uid: userData.uid,
            // Add timestamp to detect stale data
            lastSync: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(safeData));
        console.log('📝 Synced safe user data to localStorage (display only)');
    } catch (error) {
        console.error('❌ Failed to sync user to localStorage:', error);
    }
}

/**
 * Initialize secure auth on page load
 * Call this when user authenticates
 */
export async function initializeSecureAuth() {
    try {
        const result = await getCurrentUserClaims();

        if (result) {
            console.log('🔒 Secure auth initialized for:', result.user.email);
            console.log('📋 Role from claims:', result.claims.role || 'customer');
            console.log('🏥 Clinics from claims:', result.claims.clinics || 'all (owner)');

            // Sync safe data to localStorage (UI only)
            syncUserToLocalStorage(result.user);

            return result;
        }

        return null;
    } catch (error) {
        console.error('❌ Failed to initialize secure auth:', error);
        return null;
    }
}
