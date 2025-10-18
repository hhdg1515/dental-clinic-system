/**
 * 内网认证守卫模块
 * 使用 Firebase Auth + Firestore users/{uid} 进行身份验证和权限控制
 *
 * 核心原则：
 * 1. 不依赖 localStorage 存储敏感身份信息（uid/role/clinics）
 * 2. 直接从 Firebase Auth + Firestore 读取用户数据
 * 3. 在数据加载完成前阻断页面渲染（防止数据泄露）
 * 4. 只允许 owner/admin 角色访问内网
 */

class IntranetAuthGuard {
    constructor() {
        this.currentUserProfile = null; // 存储当前用户的完整 profile
        this.isAuthReady = false;
        this.authCallbacks = []; // 认证完成后的回调队列

        // 允许访问内网的角色
        this.allowedRoles = ['owner', 'admin'];

        // 外网登录页路径
        this.loginPageUrl = '/app/login';
    }

    /**
     * 初始化认证守卫
     * 必须在页面加载时尽早调用
     */
    async initialize() {
        try {
            console.log('🔒 Intranet Auth Guard: Initializing...');

            // 显示加载遮罩（阻断渲染）
            this.showLoadingOverlay();

            // 等待 Firebase 初始化
            await this.waitForFirebase();

            // 监听 Auth 状态变化
            await this.setupAuthStateListener();

        } catch (error) {
            console.error('❌ Auth Guard initialization failed:', error);
            this.handleAuthFailure('Authentication system initialization failed');
        }
    }

    /**
     * 等待 Firebase 初始化完成
     */
    waitForFirebase() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 50; // 最多等待 5 秒
            let attempts = 0;

            const checkInterval = setInterval(() => {
                attempts++;

                if (window.firebase && window.firebase.auth && window.firebase.db) {
                    clearInterval(checkInterval);
                    console.log('✅ Firebase services ready');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error('Firebase initialization timeout'));
                }
            }, 100);
        });
    }

    /**
     * 设置 Auth 状态监听器
     */
    async setupAuthStateListener() {
        // 动态导入 Firebase Auth 的 onAuthStateChanged
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js');

        return new Promise((resolve) => {
            onAuthStateChanged(window.firebase.auth, async (user) => {
                if (user) {
                    console.log('✅ User authenticated:', user.email);

                    // 从 Firestore 加载用户数据
                    await this.loadUserProfile(user.uid);

                } else {
                    console.log('❌ No authenticated user');
                    this.handleAuthFailure('Please login first through the external website');
                }

                resolve();
            });
        });
    }

    /**
     * 从 Firestore 加载用户 profile
     */
    async loadUserProfile(uid) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const userDocRef = doc(window.firebase.db, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                throw new Error('User profile not found in database');
            }

            const userData = userDocSnap.data();

            // 验证用户角色
            if (!this.allowedRoles.includes(userData.role)) {
                throw new Error(`Access denied. Role "${userData.role}" is not allowed to access the internal dashboard`);
            }

            // 存储用户 profile 到内存（不写 localStorage）
            this.currentUserProfile = {
                uid: uid,
                email: userData.email || '',
                displayName: userData.displayName || userData.email?.split('@')[0] || 'Admin',
                role: userData.role,
                clinics: userData.clinics || [],
                assignedLocation: userData.assignedLocation || null,
                photoURL: userData.photoURL || null
            };

            console.log('✅ User profile loaded:', {
                email: this.currentUserProfile.email,
                role: this.currentUserProfile.role,
                clinics: this.currentUserProfile.clinics
            });

            // 认证成功，隐藏加载遮罩
            this.hideLoadingOverlay();
            this.isAuthReady = true;

            // 执行所有等待认证完成的回调
            this.authCallbacks.forEach(callback => callback(this.currentUserProfile));
            this.authCallbacks = [];

            // 更新页面 UI（显示用户信息）
            this.updatePageUI();

        } catch (error) {
            console.error('❌ Failed to load user profile:', error);
            this.handleAuthFailure(error.message || 'Failed to load user account information');
        }
    }

    /**
     * 处理认证失败
     */
    handleAuthFailure(reason) {
        console.warn('🔒 Intranet access denied:', reason);

        // 显示错误提示
        this.showErrorMessage(reason);

        // 2 秒后重定向到外网登录页
        setTimeout(() => {
            const currentPath = window.location.pathname;
            const redirectUrl = `${this.loginPageUrl}?redirect=${encodeURIComponent(currentPath)}`;
            window.location.href = redirectUrl;
        }, 2000);
    }

    /**
     * 显示加载遮罩（阻断渲染）
     */
    showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'auth-loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.98);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
        `;
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <div style="font-size: 16px; color: #333;">Verifying authentication...</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(overlay);
    }

    /**
     * 隐藏加载遮罩
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        }
    }

    /**
     * 显示错误提示
     */
    showErrorMessage(message) {
        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div style="text-align: center; max-width: 400px; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
                    <div style="font-size: 18px; font-weight: bold; color: #e74c3c; margin-bottom: 10px;">Access Denied</div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 20px;">${message}</div>
                    <div style="font-size: 12px; color: #999;">Redirecting to login page...</div>
                </div>
            `;
        }
    }

    /**
     * 更新页面 UI（用户名、角色等）
     */
    updatePageUI() {
        if (!this.currentUserProfile) return;

        // 更新用户名显示
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = this.currentUserProfile.displayName;
        }

        // 更新用户角色显示
        const userRoleElement = document.querySelector('.user-role');
        if (userRoleElement) {
            const roleDisplay = this.currentUserProfile.role === 'owner' ? 'Owner' : 'Admin';
            userRoleElement.textContent = roleDisplay;
        }

        // 更新头像（如果有）
        const profileImgElement = document.querySelector('.profile-img');
        if (profileImgElement && this.currentUserProfile.photoURL) {
            profileImgElement.src = this.currentUserProfile.photoURL;
        }

        // 更新门店选择器
        this.updateClinicSelector();
    }

    /**
     * 更新门店选择器
     */
    updateClinicSelector() {
        const clinicSelector = document.getElementById('locationSelector');
        if (!clinicSelector) return;

        const profile = this.currentUserProfile;

        // 定义所有门店
        const allClinics = [
            { value: 'arcadia', label: 'Arcadia' },
            { value: 'irvine', label: 'Irvine' },
            { value: 'south-pasadena', label: 'South Pasadena' },
            { value: 'rowland-heights', label: 'Rowland Heights' },
            { value: 'eastvale', label: 'Eastvale' }
        ];

        // Owner 可以看所有门店
        const allowedClinics = profile.role === 'owner'
            ? allClinics
            : allClinics.filter(clinic => profile.clinics.includes(clinic.value));

        // 清空现有选项
        clinicSelector.innerHTML = '';

        // 添加允许的门店选项
        allowedClinics.forEach(clinic => {
            const option = document.createElement('option');
            option.value = clinic.value;
            option.textContent = clinic.label;
            clinicSelector.appendChild(option);
        });

        // 非 owner 禁用下拉框
        if (profile.role !== 'owner') {
            clinicSelector.disabled = true;
            clinicSelector.style.cursor = 'not-allowed';
            clinicSelector.style.opacity = '0.7';
        }

        // 设置默认选中的门店（从 localStorage UI 偏好读取）
        const savedViewLocation = localStorage.getItem('intranet:view-location');
        if (savedViewLocation && allowedClinics.some(c => c.value === savedViewLocation)) {
            clinicSelector.value = savedViewLocation;
        } else {
            clinicSelector.value = allowedClinics[0]?.value || 'arcadia';
            localStorage.setItem('intranet:view-location', clinicSelector.value);
        }

        // 监听门店切换（保存到 localStorage UI 偏好）
        clinicSelector.addEventListener('change', (e) => {
            localStorage.setItem('intranet:view-location', e.target.value);
            // 触发自定义事件，通知其他模块门店已切换
            window.dispatchEvent(new CustomEvent('clinic-changed', {
                detail: { clinicId: e.target.value }
            }));
        });
    }

    /**
     * 获取当前用户 profile
     */
    getUserProfile() {
        return this.currentUserProfile;
    }

    /**
     * 获取当前用户允许访问的门店列表
     */
    getAllowedClinics() {
        if (!this.currentUserProfile) return [];

        if (this.currentUserProfile.role === 'owner') {
            return ['arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale'];
        }

        return this.currentUserProfile.clinics || [];
    }

    /**
     * 获取当前选择的门店（从 UI 偏好）
     */
    getCurrentViewLocation() {
        return localStorage.getItem('intranet:view-location') || 'arcadia';
    }

    /**
     * 检查用户是否为 owner
     */
    isOwner() {
        return this.currentUserProfile?.role === 'owner';
    }

    /**
     * 检查用户是否为 admin（包括 owner）
     */
    isAdmin() {
        const role = this.currentUserProfile?.role;
        return role === 'owner' || role === 'admin';
    }

    /**
     * 等待认证完成
     */
    waitForAuth() {
        return new Promise((resolve) => {
            if (this.isAuthReady) {
                resolve(this.currentUserProfile);
            } else {
                this.authCallbacks.push(resolve);
            }
        });
    }

    /**
     * 登出
     */
    async logout() {
        try {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js');

            // 清除 UI 偏好
            localStorage.removeItem('intranet:view-location');

            // Firebase 登出
            await signOut(window.firebase.auth);

            console.log('✅ User logged out');

            // 重定向到外网登录页
            window.location.href = this.loginPageUrl;

        } catch (error) {
            console.error('❌ Logout failed:', error);
        }
    }
}

// 创建全局实例
window.intranetAuthGuard = new IntranetAuthGuard();

// 导出全局函数供页面使用
window.getAuthGuard = () => window.intranetAuthGuard;
window.getUserProfile = () => window.intranetAuthGuard.getUserProfile();
window.getAllowedClinics = () => window.intranetAuthGuard.getAllowedClinics();
window.getCurrentViewLocation = () => window.intranetAuthGuard.getCurrentViewLocation();
window.isOwner = () => window.intranetAuthGuard.isOwner();
window.isAdmin = () => window.intranetAuthGuard.isAdmin();
window.waitForAuth = () => window.intranetAuthGuard.waitForAuth();

// 页面加载时自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.intranetAuthGuard.initialize();
    });
} else {
    window.intranetAuthGuard.initialize();
}

// 导出 logout 函数供页面使用
window.handleLogout = async function(event) {
    if (event) {
        event.preventDefault();
    }
    await window.intranetAuthGuard.logout();
};
