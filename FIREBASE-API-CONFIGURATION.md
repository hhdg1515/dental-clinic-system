# 🔧 Firebase API 和网站限制配置指南

**项目**: Dental Clinic System
**更新日期**: 2025-11-16

---

## 📋 必需启用的 Firebase APIs

根据你的代码分析，以下是**必须启用**的 Firebase APIs：

### ✅ 必需的 4 个 APIs (100% 确认)

| API | 使用位置 | 原因 | 优先级 |
|-----|---------|------|--------|
| **Identity Toolkit API** | `firebase/auth` | 用户认证（Google OAuth, Email/Password） | ⭐⭐⭐⭐⭐ |
| **Token Service API** | Custom Claims | Role-based access control (admin/owner) | ⭐⭐⭐⭐⭐ |
| **Cloud Firestore API** | `firebase/firestore` | 存储预约、患者数据 | ⭐⭐⭐⭐⭐ |
| **Cloud Storage API** | `firebase/storage` | 文件上传（牙齿图片、X光片等） | ⭐⭐⭐⭐⭐ |

### 🔍 代码位置证明

#### 1. Identity Toolkit API (Authentication)

**外网 React 应用** - `外网-react/src/config/firebase.ts:55`
```typescript
const auth = authModule.getAuth(app);  // ✅ 使用 getAuth
const googleProvider = new authModule.GoogleAuthProvider();  // ✅ Google OAuth
```

**内网系统** - `外网-react/public/内网/firebase-config.js:32`
```javascript
const auth = getAuth(app);  // ✅ 使用 getAuth
const googleProvider = new GoogleAuthProvider();  // ✅ Google OAuth
```

#### 2. Cloud Firestore API

**外网 React 应用** - `外网-react/src/config/firebase.ts:56`
```typescript
const db = firestoreModule.getFirestore(app);  // ✅ 使用 getFirestore
```

**内网系统** - `外网-react/public/内网/firebase-config.js:33`
```javascript
const db = getFirestore(app);  // ✅ 使用 getFirestore
```

**数据操作**:
- 预约管理 (`appointments` collection)
- 患者记录 (`patients` collection)
- 用户管理 (`users` collection)
- 取消记录 (`cancelled_appointments` collection)

#### 3. Cloud Storage API

**外网 React 应用** - `外网-react/.env.example:8`
```env
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app  # ✅ Storage bucket 配置
```

**内网系统** - `外网-react/public/内网/firebase-config.js:34`
```javascript
const storage = getStorage(app);  // ✅ 使用 getStorage
window.firebase.storage = storage;  // ✅ 全局可用
```

**用途**:
- 牙齿照片上传
- X光片存储
- 医疗记录附件

#### 4. Token Service API (Custom Claims)

**用途**:
- 实现 Role-based Access Control (RBAC)
- 区分 `owner` 和 `admin` 角色
- 控制诊所数据访问权限

**代码证明** - Security Rules 中检查 `request.auth.token`

---

## 🌐 网站限制 (Website Restrictions)

### ✅ 必需的网站域名

根据你的项目配置，需要添加以下域名到 Firebase API Key 的 **Website restrictions**：

| 域名 | 用途 | 优先级 |
|------|------|--------|
| `http://localhost:5173/*` | Vite 开发服务器 (默认端口) | ⭐⭐⭐⭐⭐ |
| `http://localhost:5174/*` | 备用开发端口 | ⭐⭐⭐⭐ |
| `http://localhost:4173/*` | Vite 生产预览服务器 | ⭐⭐⭐⭐ |
| `https://dental-clinic-demo-ce94b.firebaseapp.com/*` | Firebase Hosting (默认域名) | ⭐⭐⭐⭐⭐ |
| `https://dental-clinic-demo-ce94b.web.app/*` | Firebase Hosting (备用域名) | ⭐⭐⭐⭐ |
| `https://firstavedentalortho.com/*` | 生产环境自定义域名 | ⭐⭐⭐⭐⭐ |
| `https://www.firstavedentalortho.com/*` | WWW 子域名 | ⭐⭐⭐⭐ |

### 📝 完整清单

```
开发环境:
http://localhost:5173/*
http://localhost:5174/*
http://localhost:4173/*
http://127.0.0.1:5173/*

Firebase Hosting:
https://dental-clinic-demo-ce94b.firebaseapp.com/*
https://dental-clinic-demo-ce94b.web.app/*

生产环境:
https://firstavedentalortho.com/*
https://www.firstavedentalortho.com/*
```

---

## 🔧 配置步骤

### Step 1: 启用 Firebase APIs

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目: `dental-clinic-demo-ce94b`
3. 导航到 **APIs & Services** → **Library**
4. 逐个搜索并启用以下 APIs:

#### 启用 Identity Toolkit API
```
搜索: "Identity Toolkit API"
点击: "ENABLE"
```

#### 启用 Token Service API
```
搜索: "Token Service API"
点击: "ENABLE"
```

#### 启用 Cloud Firestore API
```
搜索: "Cloud Firestore API"
点击: "ENABLE"
```

#### 启用 Cloud Storage API
```
搜索: "Cloud Storage for Firebase" 或 "Google Cloud Storage JSON API"
点击: "ENABLE"
```

---

### Step 2: 配置 API Key 网站限制

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 导航到 **APIs & Services** → **Credentials**
3. 找到你的 Browser API Key (通常名称类似 "Browser key (auto created by Firebase)")
4. 点击编辑 (铅笔图标)
5. 在 **Application restrictions** 部分:
   - 选择 **HTTP referrers (web sites)**
   - 点击 **ADD AN ITEM**
   - 逐个添加上面列出的所有域名
6. 点击 **SAVE**

---

## ✅ 验证配置

### 验证 APIs 已启用

```bash
# 在浏览器控制台 (F12) 检查错误
# 如果 API 未启用，会看到类似错误:
# "Identity Toolkit API has not been used in project ..."
# "Cloud Firestore API has not been used in project ..."
```

### 验证网站限制

```bash
# 访问你的应用
# 如果域名未添加到白名单，会看到错误:
# "This API key is not valid for this domain"
```

---

## 🚨 常见错误

### ❌ 错误 1: API 未启用

**错误信息**:
```
Identity Toolkit API has not been used in project
dental-clinic-demo-ce94b before or it is disabled.
```

**解决方案**: 按照 Step 1 启用相应的 API

---

### ❌ 错误 2: 域名限制错误

**错误信息**:
```
This API key is not valid for this domain.
Referer: http://localhost:5173/
```

**解决方案**:
1. 检查 API Key 的 Website restrictions
2. 确保 `http://localhost:5173/*` 已添加
3. 注意末尾的 `/*` 通配符

---

### ❌ 错误 3: Storage 权限错误

**错误信息**:
```
FirebaseError: Missing or insufficient permissions.
```

**解决方案**:
1. 确保 Cloud Storage API 已启用
2. 检查 Firebase Storage Security Rules
3. 确认用户已认证

---

## 📊 API 使用统计 (预估)

| API | 月度调用量 (估算) | 免费额度 | 超出成本 |
|-----|------------------|---------|---------|
| **Identity Toolkit** | ~5,000 认证 | 50,000/月 免费 | ✅ 免费范围内 |
| **Firestore** | ~50,000 读取 | 50,000/天 免费 | ✅ 免费范围内 |
| **Storage** | ~10GB 存储 | 5GB 免费 | 💰 $0.026/GB/月 |
| **Token Service** | ~100 Custom Claims | 无限制 | ✅ 完全免费 |

**预计月度成本**: $0 - $5 (取决于 Storage 使用量)

---

## 🔐 安全最佳实践

### 1. API Key 保护

✅ **正确做法**:
- API Key 存储在 `.env.local` (已实施 ✅)
- `.env.local` 已添加到 `.gitignore` (已实施 ✅)
- 使用 Website restrictions (待配置)

❌ **错误做法**:
- ❌ 硬编码 API Key (内网 firebase-config.js 需修复)
- ❌ 提交 API Key 到 GitHub
- ❌ 不设置域名限制

### 2. Firestore Security Rules

✅ **已实施**:
```javascript
// 基于角色的访问控制
match /clinics/{clinicId} {
  allow read: if isOwner() || isAdminForClinic(clinicId);
  allow write: if isOwner();
}
```

### 3. Storage Security Rules

🔧 **建议配置**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 只允许认证用户上传
    match /uploads/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024; // 限制 10MB
    }
  }
}
```

---

## 📚 参考资料

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

## ✅ 配置检查清单

完成配置后，请检查以下项目:

### APIs (必须全部启用)
- [ ] Identity Toolkit API 已启用
- [ ] Token Service API 已启用
- [ ] Cloud Firestore API 已启用
- [ ] Cloud Storage API 已启用

### 网站限制 (必须全部添加)
- [ ] `http://localhost:5173/*` 已添加
- [ ] `http://localhost:5174/*` 已添加
- [ ] `http://localhost:4173/*` 已添加
- [ ] `https://dental-clinic-demo-ce94b.firebaseapp.com/*` 已添加
- [ ] `https://dental-clinic-demo-ce94b.web.app/*` 已添加
- [ ] `https://firstavedentalortho.com/*` 已添加
- [ ] `https://www.firstavedentalortho.com/*` 已添加

### 安全配置
- [ ] Firestore Security Rules 已部署
- [ ] Storage Security Rules 已配置
- [ ] `.env.local` 已从版本控制中排除
- [ ] 内网 API Key 已迁移到环境变量 (待修复)

---

## 🎯 总结

**必需的 APIs**: 4 个
- ✅ Identity Toolkit API (认证)
- ✅ Token Service API (Custom Claims)
- ✅ Cloud Firestore API (数据库)
- ✅ Cloud Storage API (文件存储)

**必需的网站域名**: 7 个
- 3 个 localhost (开发)
- 2 个 Firebase Hosting
- 2 个自定义域名 (生产)

**预计成本**: $0-5/月 (主要是 Storage 超出 5GB 后)

**安全等级**: ⭐⭐⭐⭐ (已实施大部分安全措施)

---

**创建日期**: 2025-11-16
**作者**: Claude Code
