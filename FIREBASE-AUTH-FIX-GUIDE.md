# Firebase 认证 403 错误修复指南

## 问题症状
```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDP2CRExRah28R374Dq2eibeX-yg5cWqtA
403 (Forbidden)
```

用户无法使用邮箱/密码登录内网系统

---

## 根本原因分析

### 🔴 最可能的原因 (80% 概率)
**密码认证 (Email/Password) 未在 Firebase Console 中启用**

项目检查发现：
- ✅ Firebase 项目已创建 (dental-clinic-demo-ce94b)
- ✅ API 密钥已配置
- ❓ 密码认证状态未确认

### 🟡 其他可能原因
1. API 密钥限制配置不当
2. HTTP Referrer 限制拒绝了请求
3. 项目配额已超出

---

## 完整修复步骤

### 📍 Step 1: 启用 Email/Password 认证 (5分钟) **[必做]**

#### 1.1 打开 Firebase Console

```
URL: https://console.firebase.google.com
1. 登录你的 Google 账户
2. 选择项目: dental-clinic-demo-ce94b
3. 如果看不到项目，点击 "创建项目" 或 "导入项目"
```

#### 1.2 进入 Authentication 页面

```
左侧导航菜单:
├─ Build (或 Develop)
│  └─ Authentication
│     └─ (点击)
```

#### 1.3 启用 Email/Password

```
顶部标签页: Sign-in method

找到 "Email/Password" 行:
┌─────────────────────────────────────────┐
│ Email/Password                          │
│ ├─ 状态: [已禁用] 或 [已启用]           │
│ └─ 三点菜单 → 编辑 → 启用               │
└─────────────────────────────────────────┘

点击 "Email/Password" 卡片:
┌─────────────────────────────────────────┐
│ Email/Password                          │
│ ☐ Enable email/password sign-in         │
│   (点击勾选)                             │
│                                         │
│ ☐ Enable email link sign-in (可选)      │
│   (可以跳过)                            │
│                                         │
│ [Save]                                  │
└─────────────────────────────────────────┘

3. 点击 "Save" 按钮
4. 等待通知: "Authentication method updated"
```

#### ✅ 验证启用成功
```
Sign-in method 页面应该显示:
✅ Email/Password 状态为 "已启用"
```

---

### 📍 Step 2: 检查 API 密钥限制 (5分钟) **[强烈建议]**

#### 2.1 打开 API 密钥管理

```
Firebase Console:
1. 点击左下角 ⚙️ "Project settings" (齿轮图标)
2. 点击上方标签 "API keys"
```

#### 2.2 找到你的 Web API 密钥

```
列表中应该看到:
┌─────────────────────────────────────────┐
│ API Key (Web)                           │
│ Key: AIzaSyDP2CRExRah28R374Dq2eibeX... │
│ Created: ...                            │
│ [点击查看详情]                          │
└─────────────────────────────────────────┘

点击它打开详细页面
```

#### 2.3 设置 API 限制

```
在详情页面中:

找到 "API restrictions" 部分:
┌─────────────────────────────────────────┐
│ API restrictions                        │
│ ☐ Unrestricted (限制所有 API)           │
│ ☑ Restrict key (推荐)                   │
│    ├─ Cloud Firestore API         ✓    │
│    ├─ Cloud Storage API           ✓    │
│    ├─ Identity Toolkit API        ✓    │
│    ├─ Firebase Authentication API ✓    │
│    └─ [其他需要的 API]            ✓    │
│                                         │
│ [Save]                                  │
└─────────────────────────────────────────┘

必须包含的 API:
- ✓ Identity Toolkit API (用于登录)
- ✓ Firebase Authentication API (新版)
- ✓ Cloud Firestore API
- ✓ Cloud Storage API

4. 点击 [Save]
```

#### 2.4 设置 Application 限制 (可选但推荐)

```
找到 "Application restrictions" 部分:

选项 1: HTTP Referrer (推荐用于 Web)
┌─────────────────────────────────────────┐
│ ☑ HTTP referrers (websites)             │
│   添加允许的来源:                       │
│   • localhost:5173                      │
│   • localhost:3000                      │
│   • your-domain.com                     │
│   • *.your-domain.com                   │
│                                         │
│ [Save]                                  │
└─────────────────────────────────────────┘

选项 2: 不限制 (仅用于测试)
┌─────────────────────────────────────────┐
│ ☐ (None)                                │
│   密钥可从任何地方使用 (不安全)        │
│                                         │
│ [Save]                                  │
└─────────────────────────────────────────┘
```

---

### 📍 Step 3: 验证 Firebase 配置 (3分钟) **[必做]**

检查你的代码是否使用了正确的配置:

#### 内网系统 (内网/firebase-config.js)

```javascript
// 验证配置是否正确
const firebaseConfig = {
  apiKey: "AIzaSyDP2CRExRah28R374Dq2eibeX-yg5cWqtA",  // ← 检查这个密钥
  authDomain: "dental-clinic-demo-ce94b.firebaseapp.com",
  projectId: "dental-clinic-demo-ce94b",
  storageBucket: "dental-clinic-demo-ce94b.firebasestorage.app",
  messagingSenderId: "123456789",  // 可选
  appId: "1:123456789:web:abc123"   // 可选
};
```

**⚠️ 注意**: 内网和外网使用了不同的 API 密钥！
```
内网: AIzaSyDP2CRExRah28R374Dq2eibeX-yg5cWqtA
外网: AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI
```

这没有问题，但确保两个密钥都启用了密码认证。

---

### 📍 Step 4: 清除浏览器缓存并测试 (2分钟) **[必做]**

```
1. 按 Ctrl+Shift+Del (或 Cmd+Shift+Del on Mac)
   打开清除浏览器数据对话框

2. 选择:
   ☑ Cookies and other site data
   ☑ Cached images and files
   时间范围: All time (全部时间)

3. 点击 Clear data

4. 关闭浏览器标签和重新打开应用
   或者: Ctrl+F5 (硬刷新)

5. 尝试登录
```

---

## 测试登录

### 使用预定义的管理员账户

```
账户列表 (外网/auth.js 中预定义):

1️⃣ Owner (可访问所有门店):
   Email: admin@firstavedental.com
   Password: [设置在 Firebase Console 中]

2️⃣ Managers (可访问指定门店):
   Email: manager1@firstavedental.com
   Email: manager2@firstavedental.com
   Email: manager3@firstavedental.com
   Password: [设置在 Firebase Console 中]

3️⃣ 创建新账户:
   如果没有密码，可以在 Firebase Console 中:
   Authentication → Users → Add user
   Email: test@test.com
   Password: TestPassword123!
```

### 测试步骤

```
1. 打开内网应用: http://localhost:5173 (或你的 URL)

2. 进入登录页面

3. 输入邮箱和密码

4. 点击 "Sign In" 或 "Login"

5. 预期结果:
   ✅ 登录成功 → 进入 Dashboard
   ❌ 仍然显示 403 → 继续下一步

6. 如果还是失败，打开 F12 Console 查看详细错误
```

---

## 调试 - 如果仍然失败

### 方法 1️⃣: 查看浏览器控制台错误

```
1. F12 打开开发者工具
2. 点击 Console (控制台) 标签
3. 尝试登录
4. 查找红色错误信息，复制完整的错误信息
5. 按照错误信息对应的解决方案处理
```

### 方法 2️⃣: 在 Firebase Console 验证用户

```
Firebase Console:
1. Authentication → Users
2. 检查用户是否存在
3. 如果用户不存在，点击 "Add user"
4. 创建测试用户
```

### 方法 3️⃣: 验证 Firebase SDK 初始化

```
F12 → Console 中执行:

console.log(window.firebase);
console.log(window.firebase.auth);
console.log(window.firebase.auth.currentUser);

应该看到:
✓ firebase 对象存在
✓ auth 模块已加载
✓ 如果没登录，currentUser 应该为 null
```

### 方法 4️⃣: 直接测试 Firebase Auth API

```
F12 → Console 中执行:

fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDP2CRExRah28R374Dq2eibeX-yg5cWqtA', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@firstavedental.com',
    password: 'your_password',
    returnSecureToken: true
  })
})
.then(r => r.json())
.then(d => {
  console.log('Response:', d);
  if (d.error) {
    console.error('错误:', d.error.message);
  }
})
.catch(e => console.error('网络错误:', e));
```

**预期结果**:
```
✅ 成功: { idToken: "...", email: "...", ... }
❌ 失败: { error: { code: "...", message: "..." } }
```

---

## 常见错误及解决方案

### ❌ 错误 1: "Email/Password sign-in is disabled"

```
原因: Email/Password 认证未启用
解决: 按照 Step 1 启用密码认证
```

### ❌ 错误 2: "Invalid API Key"

```
原因: API 密钥不正确或被删除
解决:
1. 确认配置中的 apiKey 值
2. Firebase Console → Project Settings → API Keys
3. 生成新密钥如果当前密钥丢失
```

### ❌ 错误 3: "User Disabled"

```
原因: 用户账户被禁用
解决:
1. Firebase Console → Authentication → Users
2. 找到该用户
3. 点击三点菜单 → 启用用户
```

### ❌ 错误 4: "Too many login attempts"

```
原因: 被速率限制 (React 版本有 5 次尝试限制)
解决:
1. 等待 15 分钟
2. 或者在 Firebase Console 清除用户的登录尝试
```

### ❌ 错误 5: "User Not Found"

```
原因: 用户账户不存在
解决:
1. Firebase Console → Authentication → Add user
2. 创建新账户后再试
3. 或者注册新用户
```

---

## 预防措施

### ✅ 最佳实践

```javascript
// 1. 检查 Auth 初始化
if (!window.firebase || !window.firebase.auth) {
  console.error('Firebase Auth 未初始化');
  throw new Error('Firebase not ready');
}

// 2. 添加错误处理
try {
  const result = await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  if (error.code === 'auth/invalid-api-key') {
    console.error('API 密钥无效或被禁用');
  } else if (error.code === 'auth/user-disabled') {
    console.error('用户账户已被禁用');
  } else if (error.code === 'auth/wrong-password') {
    console.error('密码错误');
  } else {
    console.error('登录失败:', error.message);
  }
}

// 3. 定期验证配置
console.assert(
  window.firebase.app?.options?.apiKey,
  'API Key 未配置'
);
```

---

## 快速参考清单

### 🟢 Go Through These Steps:

- [ ] Step 1: Firebase Console 中启用 Email/Password
- [ ] Step 2: 检查和配置 API 密钥限制
- [ ] Step 3: 验证本地 Firebase 配置
- [ ] Step 4: 清除浏览器缓存
- [ ] 测试登录功能
- [ ] 如果还失败，执行调试方法 1-4

### 完成后

- [ ] 登录成功
- [ ] 显示 Dashboard
- [ ] 所有功能正常工作

---

## 需要帮助?

如果按照所有步骤后仍然失败，请收集以下信息:

1. **完整的错误信息** (F12 Console 的红色文本)
2. **你在哪个系统遇到的问题** (内网/外网/React)
3. **Firebase 项目名称和 ID**
4. **使用的邮箱和密码** (不要分享真实密码，用 test@test.com)
5. **浏览器类型和版本**

---

**最后更新**: 2024-11-14
**适用版本**: Firebase SDK v9.22.1+
**状态**: ✅ 适用于所有系统
