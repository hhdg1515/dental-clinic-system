# 🔍 安全修复检查报告
**日期：** 2025-11-18
**检查项目：** Custom Claims + 加密密钥sessionStorage修复

---

## 📊 总体评估

| 修复项 | 状态 | 评分 |
|--------|------|------|
| 1️⃣ 加密密钥迁移到sessionStorage | ✅ 完成 | 85% |
| 2️⃣ Firebase Custom Claims实现 | ⚠️ 部分完成 | 60% |

---

## 1️⃣ 医疗记录加密密钥安全 - ✅ 已修复（85分）

### ✅ 正确的部分

**文件：** `内网/js/crypto-utils.js`

**修复内容：**
```javascript
// 第211行 - 从localStorage改为sessionStorage ✅
let keyBase64 = sessionStorage.getItem('medical_records_encryption_key');

// 第219行 - 存储到sessionStorage ✅
sessionStorage.setItem('medical_records_encryption_key', keyBase64);

// 第236行 - 检查也改为sessionStorage ✅
return sessionStorage.getItem('medical_records_encryption_key') !== null;
```

### 安全提升

| 指标 | localStorage（之前） | sessionStorage（现在） | 改进幅度 |
|------|---------------------|----------------------|---------|
| 持久性 | 永久 | 标签页关闭即清除 | ✅ 大幅降低风险 |
| XSS攻击窗口 | 无限期 | 单个会话 | ✅ 显著缩小 |
| 跨标签页共享 | 是 | 否 | ✅ 隔离性更好 |
| HIPAA合规 | ❌ | ⚠️ 仍需服务器端 | 🔶 改进但未达标 |

### ⚠️ 剩余问题

1. **仍然是客户端存储** - sessionStorage仍可被XSS攻击窃取
2. **缺少密钥轮换** - 密钥生成后不会自动更新
3. **缺少审计日志** - 无法追踪密钥访问

### 📝 后续建议

生产环境需要：
```javascript
// ❌ 不要这样（当前实现）
sessionStorage.setItem('key', keyBase64);

// ✅ 应该这样（服务器端）
// Cloud Function管理密钥
exports.getEncryptionKey = functions.https.onCall(async (data, context) => {
  // 验证用户权限
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied');
  }

  // 从Google Cloud KMS获取密钥
  const key = await kms.decrypt(encryptedKey);
  return { key };
});
```

---

## 2️⃣ Firebase Custom Claims角色授权 - ⚠️ 部分完成（60分）

### ✅ 正确的部分

#### 新文件：`内网/js/auth-utils.js`

**优点：**
1. ✅ 定义了从Firebase token读取claims的函数
2. ✅ 实现了`getCurrentUserClaims()` - 读取token claims
3. ✅ 实现了`isOwner()` - 检查owner角色
4. ✅ 实现了`getAccessibleClinics()` - 获取可访问诊所
5. ✅ 有fallback机制（@firstavedental.com邮箱）

**示例代码（正确）：**
```javascript
// auth-utils.js:20-44
export async function getCurrentUserClaims() {
    const user = auth.currentUser;  // 从Firebase获取
    const idTokenResult = await user.getIdTokenResult(true);  // 强制刷新token

    return {
        user: { uid: user.uid, email: user.email },
        claims: idTokenResult.claims  // ✅ 服务器签名的claims
    };
}
```

#### 修改文件：`内网/js/dashboard.js`

**优点：**
1. ✅ Import了auth-utils.js的安全函数
2. ✅ 创建了`initializeUserPermissions()`函数
3. ✅ 从Firebase token claims设置全局变量`userRole`和`userClinics`
4. ✅ `isOwner()`和`getAccessibleClinics()`使用这些全局变量

**示例代码（正确）：**
```javascript
// dashboard.js:112-167
async function initializeUserPermissions() {
    // 从Firebase token获取claims ✅
    const claims = await getCurrentUserClaims();

    // 设置全局变量（从server-verified claims）✅
    userRole = claims.claims.role || null;

    if (userRole === 'owner' || userRole === 'boss') {
        userClinics = ['arcadia', 'irvine', ...];  // 所有诊所
    }
}

// dashboard.js:170-185
function isOwner() {
    // 使用全局userRole（从token claims设置）✅
    if (userRole === 'boss' || userRole === 'owner') {
        return true;
    }
    return false;
}
```

---

### ❌ 存在的问题

#### **问题1：auth-utils.js无法正常工作** 🔴

**错误代码：**
```javascript
// auth-utils.js:10 - 这个import会失败！
import { auth } from '../firebase-config.js';  // ❌ firebase-config.js没有export auth
```

**原因：**
`firebase-config.js`把auth放在`window.firebase.auth`，而不是export。

**实际情况：**
```javascript
// firebase-config.js:42-48
window.firebase = {
    auth,      // ✅ 在window.firebase.auth
    db,
    storage,
    app,
    googleProvider
};
// 但没有 export { auth } ❌
```

**修复方法：**
```javascript
// auth-utils.js应该改成：
const auth = window.firebase?.auth;

// 或者在firebase-config.js添加：
export { auth, db, storage, app, googleProvider };
```

---

#### **问题2：老的不安全函数还在使用** 🟠

**问题代码：**
```javascript
// dashboard.js:37-86 - 这些函数还在从localStorage读取！
async function getCurrentUser() {
    const possibleKeys = ['currentUser', 'user', 'userData', 'authUser'];
    for (const key of possibleKeys) {
        const data = localStorage.getItem(key);  // ❌ 还是localStorage
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed && (parsed.role || parsed.email)) {
                return parsed;  // ❌ 返回不可信的数据
            }
        }
    }
}

async function getUserRole() {
    const user = await getCurrentUser();
    if (user.role) {
        userRole = user.role;  // ❌ 从localStorage的数据设置userRole
        return userRole;
    }
}
```

**问题：**
这些函数还在被调用：
- 第89行：`redirectIfNotAdmin()`调用`getCurrentUser()`
- 第90行：`redirectIfNotAdmin()`调用`getUserRole()`
- 第1821行：其他地方也在调用

**风险：**
虽然主要的权限检查（`isOwner()`, `getAccessibleClinics()`）已经使用token claims，但这些老函数可能会混淆或覆盖安全的设置。

---

#### **问题3：双重标准 - 混用安全和不安全函数** 🟡

**当前状态：**

| 函数 | 数据来源 | 被调用 | 安全性 |
|------|---------|--------|--------|
| `getCurrentUser()` | localStorage ❌ | ✅ 第89行 | 不安全 |
| `getUserRole()` | localStorage ❌ | ✅ 第90, 1821行 | 不安全 |
| `isOwner()` | 全局变量（token claims）✅ | ✅ 多处 | 安全（如果正确初始化）|
| `getAccessibleClinics()` | 全局变量（token claims）✅ | ✅ 多处 | 安全（如果正确初始化）|
| `initializeUserPermissions()` | token claims ✅ | ✅ 第572行 | 安全 |

**混乱点：**
- `getUserRole()`从localStorage读取并设置`userRole`全局变量
- `initializeUserPermissions()`从token claims设置`userRole`全局变量
- 如果先调用`getUserRole()`，可能会用不安全的数据覆盖安全的数据

---

#### **问题4：患者管理页面未更新** 🟡

**检查：**
```javascript
// patients.js只添加了security注释，但代码未改
```

`patients.js`添加了文档说明依赖Firestore Rules，但代码本身没有使用新的auth-utils.js。

---

## 📋 修复完成度

### 已完成 ✅
1. ✅ sessionStorage替代localStorage（crypto-utils.js）
2. ✅ 创建了auth-utils.js（思路正确）
3. ✅ 创建了initializeUserPermissions()
4. ✅ isOwner()和getAccessibleClinics()改为使用全局变量
5. ✅ 添加了安全文档和注释

### 未完成 ❌
1. ❌ auth-utils.js的import语句无法工作（firebase-config.js问题）
2. ❌ 老的getCurrentUser()和getUserRole()还在使用localStorage
3. ❌ 可能存在安全和不安全函数混用的问题
4. ❌ patients.js等其他文件未更新

---

## 🎯 实际可用性评估

### 场景1：用户通过正常流程登录

```
✅ 流程：
1. 用户登录Firebase
2. initializeUserPermissions()从token claims读取角色
3. 设置userRole和userClinics全局变量（正确）
4. isOwner()和getAccessibleClinics()使用这些变量（正确）

✅ 结果：安全
```

### 场景2：攻击者修改localStorage

```
⚠️ 流程：
1. 攻击者：localStorage.setItem('currentUser', {role: 'owner'})
2. 如果调用旧的getUserRole()：
   - 会从localStorage读取role='owner' ❌
   - 设置userRole='owner' ❌
3. 如果调用新的initializeUserPermissions()：
   - 会从Firebase token读取真实role ✅
   - 覆盖userRole ✅

⚠️ 结果：取决于哪个函数先执行
```

### 场景3：auth-utils.js实际运行

```
❌ 流程：
1. auth-utils.js: import { auth } from '../firebase-config.js'
2. 运行时错误：firebase-config.js没有export auth
3. getCurrentUserClaims()失败
4. initializeUserPermissions()返回null
5. 所有权限检查失败

❌ 结果：功能不可用
```

---

## 🔧 需要立即修复的问题

### 优先级1：修复auth import问题（阻塞性）

**选项A：修改firebase-config.js添加export**
```javascript
// firebase-config.js最后添加
export { auth, db, storage, app, googleProvider };
```

**选项B：修改auth-utils.js使用window.firebase**
```javascript
// auth-utils.js:10改为
// 等待Firebase初始化
function getAuth() {
    if (!window.firebase || !window.firebase.auth) {
        throw new Error('Firebase not initialized');
    }
    return window.firebase.auth;
}

export async function getCurrentUserClaims() {
    const auth = getAuth();  // 从window.firebase获取
    const user = auth.currentUser;
    // ...
}
```

### 优先级2：删除或重构旧的不安全函数

**建议：**
```javascript
// 删除或改名旧函数
async function getCurrentUser_LEGACY_UNSAFE() {  // 标记为不安全
    // ... localStorage代码
}

// 创建新的安全版本
async function getCurrentUser() {
    const claims = await getCurrentUserClaims();
    return claims ? claims.user : null;
}
```

### 优先级3：确保调用顺序正确

**建议：**
```javascript
// dashboard.js页面加载时
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 先初始化Firebase权限（覆盖任何localStorage数据）
    await initializeUserPermissions();

    // 2. 然后检查admin权限
    await redirectIfNotAdmin();

    // 3. 最后加载UI
    await loadDashboard();
});
```

---

## ✅ 给你去Firebase改配置的建议

虽然代码有些问题，但你确实需要在Firebase中设置Custom Claims。以下是步骤：

### 第一步：安装Firebase Admin SDK

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

### 第二步：创建Cloud Function设置Claims

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// 设置用户角色的函数（只有owner能调用）
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // 验证调用者是owner
  if (!context.auth || context.auth.token.role !== 'owner') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only owners can set user roles'
    );
  }

  const { uid, role, clinics } = data;

  // 设置custom claims
  await admin.auth().setCustomUserClaims(uid, {
    role: role,  // 'owner', 'admin', or 'customer'
    clinics: clinics || []
  });

  return { message: `User ${uid} role set to ${role}` };
});

// 初始化用户时自动设置role
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const email = user.email;

  // 根据邮箱设置角色
  let role = 'customer';
  let clinics = [];

  if (email.endsWith('@firstavedental.com')) {
    role = 'owner';
  } else if (email.includes('admin')) {
    role = 'admin';
    // 根据邮箱设置诊所
    if (email.includes('arcadia')) clinics = ['arcadia'];
    // ... 其他诊所
  }

  await admin.auth().setCustomUserClaims(user.uid, { role, clinics });

  console.log(`Set role ${role} for new user ${email}`);
});
```

### 第三步：部署

```bash
firebase deploy --only functions
```

### 第四步：为现有用户设置Claims

在Firebase Console或使用Admin SDK：

```javascript
// 一次性脚本
const admin = require('firebase-admin');
admin.initializeApp();

async function setClaimsForExistingUsers() {
  const users = await admin.auth().listUsers();

  for (const user of users.users) {
    if (user.email === 'admin@firstavedental.com') {
      await admin.auth().setCustomUserClaims(user.uid, {
        role: 'owner',
        clinics: []
      });
    }
    // ... 其他用户
  }
}

setClaimsForExistingUsers();
```

---

## 📊 最终评分

| 项目 | 得分 | 说明 |
|------|------|------|
| **加密密钥修复** | 85/100 | sessionStorage✅，但还需服务器端KMS |
| **Custom Claims架构** | 60/100 | 思路正确✅，但实现有bug❌ |
| **代码可用性** | 30/100 | auth import会失败❌ |
| **总体安全提升** | 70/100 | 方向正确，需要修复才能使用 |

---

## 🎯 下一步建议

**选择1：我帮你修复代码bug**
- 修复auth-utils.js的import问题
- 重构旧的不安全函数
- 确保调用顺序正确
- 预计时间：15分钟

**选择2：你先去Firebase配置，回来我们一起测试**
- 你按上面的步骤设置Custom Claims
- 回来后我帮你修复代码bug
- 然后一起测试完整流程

**选择3：我直接给你一个完整可用的版本**
- 我重写有问题的部分
- 提供完整测试
- 确保100%可用

你想怎么做？
