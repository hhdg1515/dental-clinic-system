# Firebase 完整配置指南

**最后更新**: 2025-11-20

---

## 📋 目录

1. [概述](#概述)
2. [基本配置](#基本配置)
3. [Firebase 初始化](#firebase-初始化)
4. [Firestore 配置](#firestore-配置)
5. [Firebase Storage 配置](#firebase-storage-配置)
6. [Firebase Authentication](#firebase-authentication)
7. [自定义声明 (Custom Claims)](#自定义声明-custom-claims)
8. [部署 Security Rules](#部署-security-rules)
9. [监控和调试](#监控和调试)

---

## 概述

本指南涵盖：
- 📦 Firebase 项目基本配置
- 🔐 Security Rules 设置
- 👤 自定义声明 (Custom Claims) 实现
- 📁 Firebase Storage 配置
- 🔒 安全性最佳实践

**项目信息**:
```
项目名称: dental-clinic-demo
Project ID: dental-clinic-demo-ce94b
Region: us-central1
```

---

## 基本配置

### 📍 Firebase Console 访问

```
https://console.firebase.google.com/project/dental-clinic-demo-ce94b
```

### 🔧 核心服务配置

| 服务 | 状态 | 文档 |
|-----|------|------|
| Authentication | ✅ 启用 | [详见](#firebase-authentication) |
| Firestore Database | ✅ 启用 | [详见](#firestore-配置) |
| Realtime Database | ⚠️ 可选 | 根据需要启用 |
| Firebase Storage | ✅ 启用 | [详见](#firebase-storage-配置) |
| Cloud Functions | ✅ 推荐 | 用于服务端逻辑 |
| Hosting | ✅ 启用 | 用于部署 React 应用 |

---

## Firebase 初始化

### 🚀 React 中的初始化

**文件**: `外网-react/src/config/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase 配置 (从 Firebase Console 获取)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "dental-clinic-demo-ce94b.firebaseapp.com",
  projectId: "dental-clinic-demo-ce94b",
  storageBucket: "dental-clinic-demo-ce94b.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef1234567890",
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化各个服务
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 仅在开发环境连接到模拟器（可选）
if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    // 模拟器已连接或其他错误
  }
}
```

### 🔑 环境变量配置

**文件**: `外网-react/.env.local` (不提交到 Git)

```bash
# Firebase API Key (从 Google Cloud Console 获取)
VITE_FIREBASE_API_KEY=AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c

# 其他配置（如需要）
VITE_FIREBASE_AUTH_DOMAIN=dental-clinic-demo-ce94b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dental-clinic-demo-ce94b
```

---

## Firestore 配置

### 📊 数据库模式

#### 集合结构

```
appointments/
├── {appointmentId}
│   ├── patientName
│   ├── patientId
│   ├── date
│   ├── time
│   ├── service
│   ├── status
│   ├── clinicLocation
│   └── createdAt

patientProfiles/
├── {patientId}
│   ├── patientName
│   ├── email
│   ├── phone
│   ├── clinicLocation
│   └── detailedInfo

userConfig/
├── {userId}
│   ├── uid
│   ├── email
│   ├── role (owner|boss|admin|staff)
│   ├── clinics (可访问的诊所列表)
│   ├── lastLogin
│   └── displayName

dentalCharts/
├── {patientId}
│   ├── patientName
│   ├── clinicLocation
│   ├── teeth (tooth status data)
│   └── lastUpdated

medicalRecords/
├── {patientId}
│   ├── content (加密)
│   ├── encryptedKey
│   └── lastUpdated

auditLogs/
├── {logId}
│   ├── userId
│   ├── action
│   ├── targetCollection
│   ├── targetId
│   ├── timestamp
│   └── details
```

### 🔒 Security Rules

**部署方式 1: 通过 Firebase Console**

1. 进入 Firebase Console
2. 导航到 **Firestore Database** → **Rules**
3. 复制下面的规则代码
4. 点击 "Publish"

**部署方式 2: 通过 Firebase CLI**

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 登录
firebase login

# 部署规则
firebase deploy --only firestore:rules
```

**规则文件**: `内网/firebase-rules-secure.txt`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 认证检查函数
    function isAuthenticated() {
      return request.auth != null;
    }

    // 获取用户配置
    function getUserConfig(userId) {
      return get(/databases/$(database)/documents/userConfig/$(userId)).data;
    }

    // 检查用户是否为 Owner 或 Boss
    function isOwnerOrBoss(userId) {
      let userConfig = getUserConfig(userId);
      return userConfig != null && userConfig.role in ['owner', 'boss'];
    }

    // 检查用户是否有该诊所访问权限
    function hasClinicAccess(clinicId, userId) {
      let userConfig = getUserConfig(userId);
      return userConfig != null && (
        userConfig.role in ['owner', 'boss'] ||
        (userConfig.get('clinics', []).size() > 0 && clinicId in userConfig.get('clinics', []))
      );
    }

    // ===== Appointments Collection =====
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (
        request.resource.data.keys().hasAll(['patientName', 'patientId', 'date', 'time', 'service', 'clinicLocation'])
      );
      allow update: if isAuthenticated() && (
        request.resource.data.patientId == resource.data.patientId &&
        request.resource.data.clinicLocation == resource.data.clinicLocation
      );
      allow delete: if isAuthenticated() && isOwnerOrBoss(request.auth.uid);
    }

    // ===== Patient Profiles Collection =====
    match /patientProfiles/{patientId} {
      allow read: if isAuthenticated() && hasClinicAccess(resource.data.clinicLocation, request.auth.uid);
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && hasClinicAccess(resource.data.clinicLocation, request.auth.uid);
      allow delete: if isAuthenticated() && isOwnerOrBoss(request.auth.uid);
    }

    // ===== User Config Collection =====
    match /userConfig/{userId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == userId || isOwnerOrBoss(request.auth.uid)
      );
      allow write: if isAuthenticated() && request.auth.uid == userId && (
        // 允许更新非关键字段
        (request.resource.data.role == resource.data.role) &&
        (request.resource.data.clinics == resource.data.clinics) &&
        (request.resource.data.uid == resource.data.uid) &&
        (request.resource.data.email == resource.data.email)
      );
      allow write: if isOwnerOrBoss(request.auth.uid);
    }

    // ===== Dental Charts Collection =====
    match /dentalCharts/{patientId} {
      allow read: if isAuthenticated() && hasClinicAccess(resource.data.clinicLocation, request.auth.uid);
      allow create, update: if isAuthenticated() && (
        hasClinicAccess(request.resource.data.clinicLocation, request.auth.uid) &&
        request.resource.data.patientId == patientId &&
        request.resource.size() < 1000000
      );
      allow delete: if isOwnerOrBoss(request.auth.uid);
    }

    // ===== Medical Records Collection =====
    match /medicalRecords/{patientId} {
      allow read: if isAuthenticated() && hasClinicAccess(resource.data.clinicLocation, request.auth.uid);
      allow create, update: if isAuthenticated() && (
        hasClinicAccess(request.resource.data.clinicLocation, request.auth.uid) &&
        request.resource.data.keys().hasAll(['content', 'encryptedKey'])
      );
      allow delete: if isOwnerOrBoss(request.auth.uid);
    }

    // ===== Audit Logs Collection =====
    match /auditLogs/{logId} {
      allow read: if isOwnerOrBoss(request.auth.uid);
      allow write: if false; // 只由 Cloud Functions 写入
    }

    // ===== Default Deny =====
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Firebase Storage 配置

### 📁 存储结构

```
gs://dental-clinic-demo-ce94b.appspot.com/
├── dentalCharts/
│   ├── {patientId}/
│   │   ├── tooth_{toothId}/
│   │   │   ├── consent.pdf
│   │   │   ├── xray.jpg
│   │   │   └── photo.png
│   │   └── ...
│   └── ...
├── patientPhotos/
│   ├── {patientId}/
│   │   ├── profile.jpg
│   │   └── ...
│   └── ...
└── documents/
    ├── legal/
    ├── policies/
    └── ...
```

### 🔒 Storage Rules

**文件**: Firebase Console → Storage → Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return get(/databases/(default)/documents/userConfig/$(request.auth.uid)).data.role;
    }

    // Dental charts uploads
    match /dentalCharts/{patientId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() &&
        request.resource.size < 10 * 1024 * 1024 && // 10 MB max
        request.resource.contentType.matches('image/.*') ||
        request.resource.contentType == 'application/pdf';
      allow delete: if getUserRole() in ['owner', 'boss'];
    }

    // Patient photos
    match /patientPhotos/{patientId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() &&
        request.resource.size < 5 * 1024 * 1024; // 5 MB max
      allow delete: if getUserRole() in ['owner', 'boss'];
    }

    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Firebase Authentication

### 🔐 启用的认证方式

1. **Email/Password** ✅ 启用
2. **Google** ⚠️ 可选
3. **Anonymous** ❌ 禁用（已移除）

### 📧 Email/Password 配置

**文件**: `外网-react/src/services/auth.ts`

```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';

// 登录
export async function login(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw new Error(`登录失败: ${error.message}`);
  }
}

// 注册
export async function signup(email: string, password: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw new Error(`注册失败: ${error.message}`);
  }
}

// 登出
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(`登出失败: ${error.message}`);
  }
}
```

### 🔒 禁用匿名认证

**已完成**: Anonymous authentication 已在 Firebase Console 中禁用

**验证方法**:
1. 进入 Firebase Console
2. Authentication → Sign-in method
3. 确认 "Anonymous" 显示为禁用 ❌

---

## 自定义声明 (Custom Claims)

### 👤 什么是 Custom Claims?

自定义声明允许你在 Firebase ID token 中添加额外信息（如用户角色），然后在 Security Rules 中使用这些信息进行访问控制。

### 🔧 设置方式

#### 方式 1: Firebase Cloud Functions (推荐)

**文件**: `functions/setCustomClaims.js`

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

exports.setCustomClaims = admin.https.onCall(async (data, context) => {
  // 检查调用者是否为 Admin
  const uid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('userConfig').doc(uid).get();

  if (!callerDoc.exists || callerDoc.data().role !== 'owner') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only owner can set custom claims'
    );
  }

  // 设置目标用户的自定义声明
  const targetUid = data.targetUid;
  const claims = data.claims; // { role: 'admin', clinics: ['location1'] }

  try {
    await admin.auth().setCustomUserClaims(targetUid, claims);
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

#### 方式 2: Firebase CLI

```bash
# 登录
firebase login

# 设置自定义声明
firebase auth:set-custom-claims <uid> '{"role":"admin","clinics":["location1"]}'

# 查看自定义声明
firebase auth:get <uid>

# 删除自定义声明
firebase auth:set-custom-claims <uid> --delete
```

#### 方式 3: Admin SDK (服务器端)

```javascript
// 在你的后端服务中运行
const admin = require('firebase-admin');
admin.initializeApp();

async function setUserClaims(uid, claims) {
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`✅ Set custom claims for ${uid}`);
  } catch (error) {
    console.error(`❌ Failed to set custom claims:`, error);
  }
}

// 使用示例
setUserClaims('user-123', {
  role: 'admin',
  clinics: ['rowland-heights', 'downtown'],
  isMember: true
});
```

### 📝 在 Security Rules 中使用

```javascript
// 检查自定义声明
function hasRole(expectedRole) {
  return request.auth.token.role == expectedRole;
}

function hasClinicAccess(clinicId) {
  return clinicId in request.auth.token.clinics;
}

// 在规则中使用
match /appointments/{appointmentId} {
  allow read: if request.auth.token.role in ['owner', 'boss', 'admin'];
}
```

---

## 部署 Security Rules

### 🚀 部署方法

#### 方法 1: Firebase Console (最简单)

1. 进入 Firebase Console
2. **Firestore Database** → **Rules**
3. 复制规则代码（见上文）
4. 点击 **"Publish"**

#### 方法 2: Firebase CLI (推荐)

```bash
# 1. 首次项目设置（如果还没做）
firebase init

# 2. 部署规则
firebase deploy --only firestore:rules,storage:rules

# 3. 查看部署历史
firebase firestore:indexes --delete-indexes

# 4. 回滚到之前的版本（如需要）
# 在 Firebase Console 中手动编辑和发布
```

### ⚠️ 部署前检查清单

在部署到生产环境前：

- [ ] 所有规则都已测试 (使用模拟器)
- [ ] 没有 `allow read, write: if true` (过度开放)
- [ ] 有适当的身份验证检查
- [ ] 有适当的授权检查 (role, clinic 等)
- [ ] 集合和字段名称与代码匹配

---

## 监控和调试

### 📊 Firestore 监控

**Firebase Console** → **Firestore** → **Usage**

监控指标：
- 📈 读取操作数
- 📝 写入操作数
- 🗑️ 删除操作数
- 💾 存储使用量
- 📊 索引管理

### 🐛 调试

#### 使用 Firestore 模拟器

```bash
# 启动 Firebase 模拟器
firebase emulators:start

# 应用会自动连接到本地模拟器
# 数据不会写入真实的 Firestore
```

#### 查看详细日志

**Chrome DevTools**:
1. 打开开发者工具 (F12)
2. **Console** 标签
3. 搜索 "firestore" 日志

**Firebase Console**:
1. **Cloud Logging** → **Logs Explorer**
2. 过滤 `resource.type="cloud_firestore_database"`

### 🔍 常见问题排查

| 问题 | 原因 | 解决方案 |
|-----|------|---------|
| "Missing or insufficient permissions" | Security Rules 拒绝访问 | 检查 Rules 中的访问控制 |
| "Document not found" | 集合或文档不存在 | 检查集合名称和文档 ID |
| "Field does not exist" | 数据模式不匹配 | 检查 Firestore 中的实际数据结构 |
| 写入失败但没有错误 | 连接问题或超时 | 检查网络，增加超时时间 |

---

## 相关资源

- [Firestore 官方文档](https://firebase.google.com/docs/firestore)
- [Security Rules 指南](https://firebase.google.com/docs/firestore/security/get-started)
- [API Key 配置](API-KEY-SETUP-COMPLETE-GUIDE.md)
- [故障排除](FIREBASE-TROUBLESHOOTING-GUIDE.md)

---

**版本**: 1.0
**最后更新**: 2025-11-20
**维护者**: Claude Code
