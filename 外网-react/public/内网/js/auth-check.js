// 内网认证检查模块
// 基于localStorage的用户角色验证，确保只有admin/owner能访问内网

class InternalAuthChecker {
    constructor() {
        this.allowedRoles = ['admin', 'owner'];
        this.loginPagePath = '/'; // 跳转到React应用首页
        this.authCheckKey = 'internal_auth_checked';
    }

    /**
     * 主要认证检查函数
     * @returns {boolean} 是否通过认证
     */
    checkAuth() {
        try {
            // 避免重复检查
            if (sessionStorage.getItem(this.authCheckKey) === 'true') {
                return true;
            }

            const userData = this.getUserData();

            if (!userData) {
                this.handleAuthFailure('用户未登录');
                return false;
            }

            if (!this.isValidRole(userData.role)) {
                this.handleAuthFailure(`用户角色 "${userData.role}" 无权访问内网管理系统`);
                return false;
            }

            // 标记已通过认证检查
            sessionStorage.setItem(this.authCheckKey, 'true');
            this.onAuthSuccess(userData);
            return true;

        } catch (error) {
            console.error('认证检查失败:', error);
            this.handleAuthFailure('认证检查过程中出现错误');
            return false;
        }
    }

    /**
     * 从localStorage获取用户数据
     * @returns {Object|null} 用户数据或null
     */
    getUserData() {
        try {
            // 检查多个可能的localStorage键
            const possibleKeys = ['currentUser', 'user', 'userData', 'authUser'];

            for (const key of possibleKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    // 验证数据结构
                    if (parsed && (parsed.role || parsed.email)) {
                        return parsed;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('解析用户数据失败:', error);
            return null;
        }
    }

    /**
     * 验证用户角色是否允许访问内网
     * @param {string} role 用户角色
     * @returns {boolean} 是否为有效角色
     */
    isValidRole(role) {
        return role && this.allowedRoles.includes(role.toLowerCase());
    }

    /**
     * 处理认证失败情况
     * @param {string} reason 失败原因
     */
    handleAuthFailure(reason) {
        console.warn('内网访问被拒绝:', reason);

        // 显示友好的错误提示
        this.showAuthMessage(reason);

        // 延迟重定向，让用户看到提示信息
        setTimeout(() => {
            this.redirectToLogin();
        }, 2000);
    }

    /**
     * 认证成功处理
     * @param {Object} userData 用户数据
     */
    onAuthSuccess(userData) {
        console.log('✅ 内网认证成功:', userData.email, '角色:', userData.role);

        // 更新页面用户信息显示
        this.updateUserDisplay(userData);
    }

    /**
     * 重定向到登录页面
     */
    redirectToLogin() {
        try {
            window.location.href = this.loginPagePath;
        } catch (error) {
            console.error('重定向失败:', error);
            // 备用重定向方法
            window.location.replace(this.loginPagePath);
        }
    }

    /**
     * 显示认证消息
     * @param {string} message 消息内容
     */
    showAuthMessage(message) {
        // 创建临时消息显示
        const messageDiv = document.createElement('div');
        messageDiv.id = 'auth-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 9999;
            font-family: Arial, sans-serif;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        messageDiv.innerHTML = `
            <div style="margin-bottom: 10px;">
                <i style="font-size: 24px;">🔒</i>
            </div>
            <div>${message}</div>
            <div style="margin-top: 10px; font-size: 12px;">
                正在重定向到登录页面...
            </div>
        `;

        document.body.appendChild(messageDiv);

        // 2秒后移除消息
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 2000);
    }

    /**
     * 更新页面用户信息显示
     * @param {Object} userData 用户数据
     */
    updateUserDisplay(userData) {
        // 查找页面中的用户信息显示元素
        const userNameElement = document.querySelector('.user-name');
        const userRoleElement = document.querySelector('.user-role');

        if (userNameElement) {
            userNameElement.textContent = userData.displayName || userData.email || 'Admin';
        }

        if (userRoleElement) {
            const roleDisplay = userData.role === 'owner' ? 'Boss' : 'Admin';
            userRoleElement.textContent = roleDisplay;
        }
    }

    /**
     * 注销用户
     */
    logout() {
        // 清除认证状态
        sessionStorage.removeItem(this.authCheckKey);

        // 清除所有用户相关的localStorage数据
        const possibleKeys = ['currentUser', 'user', 'userData', 'authUser'];
        possibleKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        // 重定向到登录页面
        this.redirectToLogin();
    }

    /**
     * 获取当前用户角色
     * @returns {string|null} 用户角色
     */
    getCurrentUserRole() {
        const userData = this.getUserData();
        return userData ? userData.role : null;
    }

    /**
     * 检查是否为boss角色
     * @returns {boolean} 是否为boss
     */
    isBoss() {
        return this.getCurrentUserRole() === 'owner';
    }

    /**
     * 检查是否为admin角色
     * @returns {boolean} 是否为admin
     */
    isAdmin() {
        const role = this.getCurrentUserRole();
        return role === 'admin' || role === 'owner';
    }
}

// 创建全局认证检查器实例
window.authChecker = new InternalAuthChecker();

/**
 * 页面加载时自动执行认证检查
 * 这个函数应该在页面头部尽早调用
 */
function initializeAuth() {
    // 等待DOM基础结构加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.authChecker.checkAuth();
        });
    } else {
        window.authChecker.checkAuth();
    }
}

// 导出主要函数供页面使用
window.initializeAuth = initializeAuth;

// 为向后兼容，提供简化的全局函数
window.checkAuth = () => window.authChecker.checkAuth();
window.logout = () => window.authChecker.logout();
window.getCurrentUserRole = () => window.authChecker.getCurrentUserRole();
window.isBoss = () => window.authChecker.isBoss();
window.isAdmin = () => window.authChecker.isAdmin();