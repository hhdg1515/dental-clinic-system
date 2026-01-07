// auth.js
import { auth, googleProvider, db } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 预定义的管理员账户
const ADMIN_ACCOUNTS = {
    'admin@firstavedental.com': { role: 'owner', clinics: [] }, // 老板账号 - 可访问所有门店
    'manager1@firstavedental.com': { role: 'admin', clinics: ['arcadia'] }, // Arcadia店管理员
    'manager2@firstavedental.com': { role: 'admin', clinics: ['irvine'] }, // Irvine店管理员
    'manager3@firstavedental.com': { role: 'admin', clinics: ['south-pasadena'] }, // South Pasadena店管理员
    'manager4@firstavedental.com': { role: 'admin', clinics: ['rowland-heights'] }, // Rowland Heights店管理员
    'manager5@firstavedental.com': { role: 'admin', clinics: ['eastvale'] }  // Eastvale店管理员
};

/**
 * 获取用户角色和门店配置
 * @param {string} email
 * @returns {Object} { role, clinics }
 */
function getUserConfig(email) {
    const config = ADMIN_ACCOUNTS[email?.toLowerCase()];
    if (config) {
        return config;
    }
    // 默认customer角色，无门店访问权限
    return { role: 'customer', clinics: [] };
}

/**
 * 创建新用户账户
 * @param {string} email 
 * @param {string} password 
 * @param {Object} additionalInfo - 额外用户信息
 * @returns {Promise<any>}
 */
export async function signUpUser(email, password, additionalInfo = {}) {
    try {
        console.log('=== Starting user registration ===');
        console.log('Email:', email);
        console.log('Password length:', password.length);
        
        console.log('Calling createUserWithEmailAndPassword...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('createUserWithEmailAndPassword completed');
        console.log('userCredential:', userCredential);
        
        const user = userCredential.user;
        console.log('user object:', user);
        console.log('user.uid:', user ? user.uid : 'USER IS NULL');
        
        if (!user) {
            throw new Error('User object is null after authentication');
        }
        
        console.log('Firebase Auth successful, UID:', user.uid);
        // 确定用户角色和门店配置
        const userConfig = getUserConfig(email);
        console.log('User config determined:', userConfig);

        // 创建用户文档到Firestore
        const userData = {
            uid: user.uid,
            email: email.toLowerCase(),
            role: userConfig.role,
            clinics: userConfig.clinics,
            assignedLocation: userConfig.clinics[0] || null, // 第一个门店作为默认位置
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isFirstLogin: true,
            ...additionalInfo
        };
        
        console.log('Attempting to create Firestore document...');
        console.log('User data:', userData);
        await setDoc(doc(db, "users", user.uid), userData);
        console.log('✓ Firestore document created successfully');
        // 立即验证文档是否真的被创建
        console.log('Verifying document was actually created...');
        try {
            const verifyDoc = await getDoc(doc(db, "users", user.uid));
            if (verifyDoc.exists()) {
                console.log('✅ VERIFICATION SUCCESS: Document exists in Firestore');
                console.log('Document data:', verifyDoc.data());
            } else {
                console.log('❌ VERIFICATION FAILED: Document does NOT exist in Firestore');
                console.log('This means setDoc failed silently');
            }
        } catch (verifyError) {
            console.log('❌ VERIFICATION ERROR:', verifyError.message);
            console.log('Verification error code:', verifyError.code);
        }

        console.log('✓ Firestore document created successfully');
        // 如果有显示名称，更新用户profile
        if (additionalInfo.displayName) {
            await updateProfile(user, { displayName: additionalInfo.displayName });
        }

        console.log("User signed up successfully:", user.uid, "Role:", userConfig.role, "Clinics:", userConfig.clinics);
        return { user, userData };
    } catch (error) {
        console.error('❌ Registration error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        throw error;
    }
}

/**
 * 用户登录
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<any>}
 */
export async function signInUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // 获取用户数据
        const userData = await getUserData(user.uid);
        
        // 更新最后登录时间
        if (userData) {
            await updateUserLastLogin(user.uid);
        }
        
        console.log("User signed in:", user.uid, "Role:", userData?.role);
        return { user, userData };
    } catch (error) {
        console.error("Sign in failed:", error.message);
        throw error;
    }
}

/**
 * Google登录
 * @returns {Promise<any>}
 */
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // 检查用户是否已存在
        let userData = await getUserData(user.uid);
        
        if (!userData) {
            // 新用户，创建用户文档
            const userConfig = getUserConfig(user.email);
            userData = {
                uid: user.uid,
                email: user.email.toLowerCase(),
                role: userConfig.role,
                clinics: userConfig.clinics,
                assignedLocation: userConfig.clinics[0] || null,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isFirstLogin: true,
                signInMethod: 'google'
            };

            await setDoc(doc(db, "users", user.uid), userData);
        } else {
            // 现有用户，更新最后登录
            await updateUserLastLogin(user.uid);
        }
        
        console.log("Signed in with Google:", user.uid, "Role:", userData.role);
        return { user, userData };
    } catch (error) {
        console.error("Google sign-in failed:", error.message);
        throw error;
    }
}

/**
 * 用户登出
 * @returns {Promise<void>}
 */
export async function signOutUser() {
    try {
        await signOut(auth);
        console.log("User signed out successfully.");
    } catch (error) {
        console.error("Sign out failed:", error.message);
        throw error;
    }
}

/**
 * 监听认证状态变化
 * @param {Function} callback 
 */
export function listenForAuthStateChange(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userData = await getUserData(user.uid);
            callback({ user, userData });
        } else {
            callback(null);
        }
    });
}

/**
 * 更新用户profile
 * @param {string} displayName 
 */
export async function updateUserProfile(displayName) {
    try {
        await updateProfile(auth.currentUser, { displayName });
        
        // 同时更新Firestore中的用户文档
        await updateUserData(auth.currentUser.uid, { displayName });
        
        console.log("Profile updated successfully.");
    } catch (error) {
        console.error("Profile update failed:", error.message);
        throw error;
    }
}

/**
 * 获取用户数据
 * @param {string} uid 
 * @returns {Promise<Object|null>}
 */
export async function getUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error("Error getting user data:", error.message);
        return null;
    }
}

/**
 * 更新用户数据
 * @param {string} uid 
 * @param {Object} updateData 
 * @returns {Promise<void>}
 */
export async function updateUserData(uid, updateData) {
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, updateData, { merge: true });
        console.log("User data updated successfully.");
    } catch (error) {
        console.error("Error updating user data:", error.message);
        throw error;
    }
}

/**
 * 更新用户最后登录时间
 * @param {string} uid 
 * @returns {Promise<void>}
 */
async function updateUserLastLogin(uid) {
    try {
        await updateUserData(uid, { 
            lastLogin: new Date().toISOString(),
            isFirstLogin: false
        });
    } catch (error) {
        console.error("Error updating last login:", error.message);
    }
}

/**
 * 检查用户是否为管理员
 * @param {string} email 
 * @returns {boolean}
 */
export function isAdminUser(email) {
    return email && ADMIN_ACCOUNTS.hasOwnProperty(email.toLowerCase());
}

/**
 * 获取用户角色
 * @param {string} email
 * @returns {string}
 */
export function getUserRole(email) {
    const config = getUserConfig(email);
    return config.role;
}

/**
 * 验证邮箱格式
 * @param {string} email 
 * @returns {boolean}
 */
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 验证密码强度
 * @param {string} password 
 * @returns {Object}
 */
export function validatePassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    const isValid = password.length >= minLength;
    
    return {
        isValid,
        errors: [
            password.length < minLength ? `密码至少需要${minLength}个字符` : null,
        ].filter(Boolean)
    };
}

/**
 * 获取当前用户的完整信息
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUserInfo() {
    const user = auth.currentUser;
    if (!user) return null;
    
    const userData = await getUserData(user.uid);
    return { user, userData };
}