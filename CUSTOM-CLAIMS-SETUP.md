# Firebase Custom Claims 角色管理实施指南

## ⚠️ CRITICAL #3 修复

当前系统在客户端设置用户角色,任何用户都可以通过修改 Firestore 文档将自己提升为管理员。

Custom Claims 是 Firebase 提供的服务器端权限管理机制,完全不可被客户端篡改。

---

## 🎯 问题分析

### 当前的不安全实现

**在客户端** ([auth.ts:32-39](外网-react/src/services/auth.ts#L32-L39)):

```typescript
// ❌ 客户端角色分配 - 不安全!
const ADMIN_ACCOUNTS = {
  'admin@firstavedental.com': { role: 'owner', clinics: [] },
  // ...
};

// 用户注册时在客户端设置角色
const userData: UserData = {
  role: userConfig.role,  // 客户端决定
  clinics: userConfig.clinics  // 客户端决定
};

await setDoc(doc(db, 'users', user.uid), userData);
```

### 攻击场景

攻击者可以在浏览器控制台运行:

```javascript
// 将自己提升为 owner
await updateDoc(doc(db, 'users', currentUser.uid), {
  role: 'owner',
  clinics: ['arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale']
});

// 现在拥有完全访问权限!
```

---

## ✅ 解决方案: Firebase Custom Claims

Custom Claims 在用户的 JWT token 中存储权限信息,**只能通过 Firebase Admin SDK 修改**。

### 方案比较

| 方案 | 难度 | 安全性 | 成本 | 推荐 |
|------|------|--------|------|------|
| **方案 1: Cloud Functions** | 中等 | ⭐⭐⭐⭐⭐ | 免费额度 | ✅ 推荐 |
| **方案 2: Firebase Extensions** | 简单 | ⭐⭐⭐⭐ | 免费 | ✅ 适合快速部署 |
| **方案 3: 独立后端服务器** | 困难 | ⭐⭐⭐⭐⭐ | 需要服务器 | 适合大型应用 |
| **方案 4: 手动 CLI 脚本** | 简单 | ⭐⭐⭐ | 免费 | 仅用于初始设置 |

---

## 🚀 方案 1: Cloud Functions (推荐)

使用 Firebase Cloud Functions 自动设置用户角色。

### 步骤 1: 安装 Firebase Tools

```bash
npm install -g firebase-tools
firebase login
```

### 步骤 2: 初始化 Functions

```bash
cd dental-clinic-system
firebase init functions
```

选择:
- 使用现有项目: `dental-clinic-demo-ce94b`
- 语言: JavaScript 或 TypeScript
- ESLint: Yes (推荐)
- 安装依赖: Yes

### 步骤 3: 创建角色管理 Function

创建文件 `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// 管理员账户配置 - 在服务器端定义
const ADMIN_ACCOUNTS = {
  'admin@firstavedental.com': { role: 'owner', clinics: [] },
  'manager1@firstavedental.com': { role: 'admin', clinics: ['arcadia'] },
  'manager2@firstavedental.com': { role: 'admin', clinics: ['irvine'] },
  'manager3@firstavedental.com': { role: 'admin', clinics: ['south-pasadena'] },
  'manager4@firstavedental.com': { role: 'admin', clinics: ['rowland-heights'] },
  'manager5@firstavedental.com': { role: 'admin', clinics: ['eastvale'] }
};

// 当新用户创建时自动设置 Custom Claims
exports.setUserRole = functions.auth.user().onCreate(async (user) => {
  const email = user.email?.toLowerCase();

  if (!email) {
    console.log('No email for user:', user.uid);
    return null;
  }

  // 检查是否是管理员账户
  const adminConfig = ADMIN_ACCOUNTS[email];

  if (adminConfig) {
    // 管理员账户 - 设置 custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      role: adminConfig.role,
      clinics: adminConfig.clinics
    });

    // 同时在 Firestore 中创建用户文档 (用于查询和显示)
    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: email,
      role: adminConfig.role,
      clinics: adminConfig.clinics,
      assignedLocation: adminConfig.clinics[0] || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      isFirstLogin: true
    });

    console.log(`✅ Set ${adminConfig.role} role for ${email}`);
  } else {
    // 普通用户 - 设置 customer role
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'customer',
      clinics: []
    });

    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: email,
      role: 'customer',
      clinics: [],
      assignedLocation: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      isFirstLogin: true
    });

    console.log(`✅ Set customer role for ${email}`);
  }

  return null;
});

// 手动设置用户角色的 HTTP Function (仅 owner 可调用)
exports.setCustomUserRole = functions.https.onCall(async (data, context) => {
  // 验证调用者是 owner
  if (!context.auth || context.auth.token.role !== 'owner') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only owners can set user roles'
    );
  }

  const { uid, role, clinics } = data;

  // 验证参数
  if (!uid || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required parameters: uid, role'
    );
  }

  if (!['owner', 'admin', 'customer'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid role. Must be: owner, admin, or customer'
    );
  }

  try {
    // 设置 custom claims
    await admin.auth().setCustomUserClaims(uid, {
      role: role,
      clinics: clinics || []
    });

    // 更新 Firestore
    await admin.firestore().collection('users').doc(uid).update({
      role: role,
      clinics: clinics || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: `Role updated to ${role} for user ${uid}`
    };
  } catch (error) {
    console.error('Error setting role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 刷新用户 token 以获取最新的 custom claims
exports.refreshUserToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // 强制刷新 token
  return {
    success: true,
    message: 'Token will be refreshed on next auth state change'
  };
});
```

### 步骤 4: 部署 Cloud Functions

```bash
cd functions
npm install firebase-admin firebase-functions

cd ..
firebase deploy --only functions
```

### 步骤 5: 更新客户端代码

更新 [auth.ts](外网-react/src/services/auth.ts):

```typescript
// 移除客户端角色配置
// ❌ 删除 ADMIN_ACCOUNTS 对象

// 更新 signUpUser 函数
export async function signUpUser(
  email: string,
  password: string,
  additionalInfo: Partial<UserData> = {}
): Promise<{ user: User; userData: UserData }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ 角色由 Cloud Function 自动设置
    // 等待 custom claims 被设置 (可能需要几秒钟)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 强制刷新 token 以获取 custom claims
    await user.getIdToken(true);
    const tokenResult = await user.getIdTokenResult();

    // 从 token claims 读取角色
    const role = tokenResult.claims.role || 'customer';
    const clinics = tokenResult.claims.clinics || [];

    // Firestore 文档已由 Cloud Function 创建
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data() as UserData;

    return { user, userData };
  } catch (error) {
    throw error;
  }
}

// 更新 getCurrentUserData 函数
export async function getCurrentUserData(): Promise<UserData | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    // 从 custom claims 获取角色
    const tokenResult = await user.getIdTokenResult();
    const role = tokenResult.claims.role as 'owner' | 'admin' | 'customer';
    const clinics = tokenResult.claims.clinics as string[];

    // 从 Firestore 获取其他用户数据
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();

    return {
      ...userData,
      role,  // ✅ 使用 custom claim 中的角色 (不可篡改)
      clinics  // ✅ 使用 custom claim 中的诊所列表
    } as UserData;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}
```

### 步骤 6: 更新 Firestore Security Rules

更新 [firebase-rules-secure.txt](内网/firebase-rules-secure.txt):

```javascript
// 使用 custom claims 进行授权检查
function getUserRole() {
  return request.auth.token.role;  // ✅ 从 token claims 读取,不可篡改
}

function getUserClinics() {
  return request.auth.token.clinics;  // ✅ 从 token claims 读取
}

function isOwner() {
  return isAuthenticated() && getUserRole() == 'owner';
}

function isAdmin() {
  return isAuthenticated() && getUserRole() in ['owner', 'admin'];
}

function hasClinicAccess(clinicId) {
  return getUserRole() == 'owner' || clinicId in getUserClinics();
}

// 防止客户端修改角色和诊所字段
match /users/{userId} {
  allow create: if isAuthenticated() && request.auth.uid == userId &&
    request.resource.data.uid == userId &&
    request.resource.data.email == request.auth.token.email;

  allow update: if isAuthenticated() && request.auth.uid == userId &&
    // ✅ 完全禁止修改 role 和 clinics (由 Cloud Function 管理)
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'clinics', 'uid', 'email']);

  allow read: if isAuthenticated() && (
    request.auth.uid == userId ||
    isAdmin()
  );

  allow delete: if isOwner();
}
```

---

## 🔧 方案 2: Firebase Extensions (最简单)

使用 Firebase 官方的 "Set User Roles" extension。

### 步骤 1: 安装 Extension

```bash
firebase ext:install firebase/firestore-user-roles
```

或者在 Firebase Console:
1. 左侧菜单选择 **Extensions**
2. 搜索 "user roles"
3. 安装 "Set User Roles from Firestore"

### 步骤 2: 配置 Extension

在 Firestore 创建 `admin_config` 集合:

```javascript
// 在 Firebase Console 或代码中创建
db.collection('admin_config').doc('roles').set({
  'admin@firstavedental.com': {
    role: 'owner',
    clinics: []
  },
  'manager1@firstavedental.com': {
    role: 'admin',
    clinics: ['arcadia']
  }
  // ...
});
```

Extension 会自动监听这个集合并设置 custom claims。

---

## 🛠️ 方案 3: 独立后端 (Node.js + Express)

适合需要更多自定义逻辑的场景。

创建 `backend/server.js`:

```javascript
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// 初始化 Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// 设置用户角色的 API
app.post('/api/setUserRole', async (req, res) => {
  try {
    const { uid, role, clinics } = req.body;
    const authHeader = req.headers.authorization;

    // 验证调用者的 token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 只有 owner 可以设置角色
    if (decodedToken.role !== 'owner') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // 设置 custom claims
    await admin.auth().setCustomUserClaims(uid, { role, clinics });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## 📝 方案 4: 手动 CLI 脚本 (用于初始设置)

创建 `scripts/set-admin-roles.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const ADMIN_ACCOUNTS = {
  'admin@firstavedental.com': { role: 'owner', clinics: [] },
  'manager1@firstavedental.com': { role: 'admin', clinics: ['arcadia'] },
  // ...
};

async function setAdminRoles() {
  for (const [email, config] of Object.entries(ADMIN_ACCOUNTS)) {
    try {
      // 通过 email 查找用户
      const user = await admin.auth().getUserByEmail(email);

      // 设置 custom claims
      await admin.auth().setCustomUserClaims(user.uid, config);

      // 更新 Firestore
      await admin.firestore().collection('users').doc(user.uid).update(config);

      console.log(`✅ Set ${config.role} for ${email}`);
    } catch (error) {
      console.error(`❌ Failed to set role for ${email}:`, error.message);
    }
  }
}

setAdminRoles()
  .then(() => console.log('Done'))
  .catch(console.error);
```

运行:

```bash
cd scripts
npm install firebase-admin
node set-admin-roles.js
```

---

## ✅ 验证 Custom Claims

### 在客户端验证

```javascript
const user = auth.currentUser;
const tokenResult = await user.getIdTokenResult();

console.log('Role:', tokenResult.claims.role);
console.log('Clinics:', tokenResult.claims.clinics);
console.log('Claims:', tokenResult.claims);
```

### 在 Security Rules Playground

```javascript
Auth:
  - Provider: Custom
  - UID: test_user_123
  - Token Claims:
      role: admin
      clinics: ['arcadia']
```

---

## 🔄 迁移现有用户

如果已有用户数据:

```javascript
// 批量更新脚本
const migrateUsers = async () => {
  const usersSnapshot = await admin.firestore().collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();

    // 设置 custom claims
    await admin.auth().setCustomUserClaims(doc.id, {
      role: userData.role,
      clinics: userData.clinics || []
    });

    console.log(`Migrated user: ${userData.email}`);
  }
};
```

---

## ⚠️ 注意事项

### Token 刷新

Custom claims 更改后,客户端需要刷新 token:

```typescript
// 强制刷新 token
await auth.currentUser.getIdToken(true);

// 或者强制用户重新登录
await signOut(auth);
```

### Token 缓存

Firebase tokens 会缓存 1 小时,更改 custom claims 后可能需要等待或强制刷新。

### 大小限制

Custom claims 总大小不能超过 1000 字节。

---

## ✅ 完成检查清单

- [ ] 选择了实施方案 (推荐方案 1: Cloud Functions)
- [ ] 部署了角色管理功能 (Cloud Function/Extension/Backend)
- [ ] 更新了客户端代码读取 custom claims
- [ ] 更新了 Firestore Security Rules 使用 token claims
- [ ] 迁移了现有用户的角色数据
- [ ] 测试了角色分配功能
- [ ] 验证了用户无法篡改自己的角色
- [ ] 实施了 owner 才能修改角色的限制

---

## 📞 下一步

完成 Custom Claims 设置后,请告诉我你选择了哪个方案,我将帮助你:
1. 更新客户端代码
2. 更新 Security Rules
3. 测试整个流程
