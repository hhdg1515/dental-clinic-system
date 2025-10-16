// Firebase 匿名认证设置
// 在 firebase-config.js 或 dashboard.js 中添加这段代码

async function setupAnonymousAuth() {
    try {
        if (window.firebase?.auth) {
            const auth = window.firebase.auth;

            // 检查当前是否已认证
            if (!auth.currentUser) {
                console.log('Setting up anonymous authentication...');

                // 导入认证函数
                const { signInAnonymously } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js');

                // 匿名登录
                const userCredential = await signInAnonymously(auth);
                console.log('✅ Anonymous authentication successful:', userCredential.user.uid);

                return userCredential.user;
            } else {
                console.log('✅ User already authenticated:', auth.currentUser.uid);
                return auth.currentUser;
            }
        } else {
            console.error('❌ Firebase auth not available');
            return null;
        }
    } catch (error) {
        console.error('❌ Anonymous authentication failed:', error);
        return null;
    }
}

// 在 Firebase 初始化后调用
window.setupAnonymousAuth = setupAnonymousAuth;