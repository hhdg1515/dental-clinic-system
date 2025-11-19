/**
 * Cryptographic Utilities for Medical Records Encryption
 *
 * Implements AES-256-GCM encryption using Web Crypto API for HIPAA compliance.
 * Medical records MUST be encrypted at rest to protect PHI (Protected Health Information).
 */

/**
 * Generate a secure encryption key
 * @returns {Promise<CryptoKey>} AES-256-GCM key
 */
export async function generateEncryptionKey() {
    return await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256 // 256-bit key for AES-256
        },
        true, // extractable
        ['encrypt', 'decrypt']
    );
}

/**
 * Export key to Base64 format for storage
 * @param {CryptoKey} key - The crypto key to export
 * @returns {Promise<string>} Base64-encoded key
 */
export async function exportKey(key) {
    const exported = await crypto.subtle.exportKey('raw', key);
    const exportedKeyBuffer = new Uint8Array(exported);
    const base64Key = btoa(String.fromCharCode.apply(null, exportedKeyBuffer));
    return base64Key;
}

/**
 * Import key from Base64 format
 * @param {string} base64Key - Base64-encoded key
 * @returns {Promise<CryptoKey>} Imported crypto key
 */
export async function importKey(base64Key) {
    const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        {
            name: 'AES-GCM',
            length: 256
        },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a file using AES-256-GCM
 * @param {File} file - The file to encrypt
 * @param {CryptoKey} key - The encryption key
 * @returns {Promise<{encrypted: ArrayBuffer, iv: Uint8Array}>}
 */
export async function encryptFile(file, key) {
    // Generate a random initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();

    // Encrypt the file data
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        fileData
    );

    return {
        encrypted,
        iv
    };
}

/**
 * Decrypt a file using AES-256-GCM
 * @param {ArrayBuffer} encryptedData - The encrypted data
 * @param {Uint8Array} iv - The initialization vector
 * @param {CryptoKey} key - The decryption key
 * @returns {Promise<ArrayBuffer>} Decrypted data
 */
export async function decryptFile(encryptedData, iv, key) {
    return await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encryptedData
    );
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {string} Base64 string
 */
export function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64 - Base64 string
 * @returns {ArrayBuffer} ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generate a patient-specific encryption key from master key
 * This allows per-patient encryption while deriving from a master key
 *
 * @param {string} masterKeyBase64 - Base64-encoded master key
 * @param {string} patientId - Patient ID for key derivation
 * @returns {Promise<CryptoKey>} Patient-specific encryption key
 */
export async function derivePatientKey(masterKeyBase64, patientId) {
    // Import master key
    const masterKey = await importKey(masterKeyBase64);

    // For this implementation, we use the master key directly
    // In production, you might want to use PBKDF2 or HKDF for key derivation
    // with patientId as salt for additional security

    return masterKey;
}

/**
 * Encrypt medical record file for storage
 * Combines encryption with metadata
 *
 * @param {File} file - File to encrypt
 * @param {string} patientId - Patient ID
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<{encryptedData: string, iv: string, metadata: object}>}
 */
export async function encryptMedicalRecord(file, patientId, key) {
    const { encrypted, iv } = await encryptFile(file, key);

    return {
        encryptedData: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv),
        metadata: {
            originalName: file.name,
            originalSize: file.size,
            mimeType: file.type,
            encryptedAt: new Date().toISOString(),
            algorithm: 'AES-256-GCM',
            patientId: patientId
        }
    };
}

/**
 * Decrypt medical record file for viewing/download
 *
 * @param {string} encryptedDataBase64 - Base64-encoded encrypted data
 * @param {string} ivBase64 - Base64-encoded IV
 * @param {CryptoKey} key - Decryption key
 * @param {object} metadata - File metadata
 * @returns {Promise<Blob>} Decrypted file as Blob
 */
export async function decryptMedicalRecord(encryptedDataBase64, ivBase64, key, metadata) {
    const encryptedData = base64ToArrayBuffer(encryptedDataBase64);
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

    const decryptedData = await decryptFile(encryptedData, iv, key);

    // Create Blob with original mime type
    return new Blob([decryptedData], { type: metadata.mimeType || 'application/octet-stream' });
}

/**
 * Initialize encryption system
 * Checks for existing master key or generates new one
 *
 * @returns {Promise<{key: CryptoKey, keyBase64: string}>}
 */
export async function initializeEncryption() {
    // SECURITY IMPROVEMENT: Using sessionStorage instead of localStorage
    // - sessionStorage clears when browser tab is closed (more secure)
    // - Reduces XSS attack window
    // - Still NOT production-ready for HIPAA compliance
    //
    // PRODUCTION REQUIREMENTS:
    // 1. Generate keys server-side
    // 2. Store in secure key management system (AWS KMS, Google Cloud KMS)
    // 3. Never expose keys to client
    // 4. Use envelope encryption for patient records

    let keyBase64 = sessionStorage.getItem('medical_records_encryption_key');

    if (!keyBase64) {
        // Generate new master key
        const key = await generateEncryptionKey();
        keyBase64 = await exportKey(key);

        // Store in sessionStorage (better than localStorage, but still client-side)
        sessionStorage.setItem('medical_records_encryption_key', keyBase64);

        console.warn('⚠️ Generated new encryption key (session only). For HIPAA compliance, use server-side key management!');

        return { key, keyBase64 };
    }

    // Import existing key
    const key = await importKey(keyBase64);
    return { key, keyBase64 };
}

/**
 * Check if encryption is initialized
 * @returns {boolean}
 */
export function isEncryptionInitialized() {
    return sessionStorage.getItem('medical_records_encryption_key') !== null;
}
