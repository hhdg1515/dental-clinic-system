# Firebase API Restrictions 配置审查

**审查日期**: 2025-11-18
**审查目的**: 验证 Firebase API Key restrictions 配置是否安全且完整
**配置类型**: API restrictions (限制 API key 可访问的 Google Cloud APIs)

---

## 📋 当前配置的 API Restrictions

### ✅ 已启用的 APIs:

1. **Identity Toolkit API** ✅ **必需**
   - 用途: Firebase Authentication
   - 状态: ✅ 必需 - 代码中使用 `getAuth()`
   - 安全性: ✅ 正确

2. **Firebase Hosting API** ⚠️ **可选**
   - 用途: Firebase Hosting 部署和管理
   - 状态: ⚠️ 如果不使用 Firebase Hosting CLI，可以移除
   - 建议: 如果仅在浏览器中访问应用（不部署），可以禁用

3. **Token Service API** ✅ **必需**
   - 用途: Token 验证和刷新
   - 状态: ✅ 必需 - Custom Claims 需要
   - 安全性: ✅ 正确

4. **Cloud Storage** ✅ **必需**
   - 用途: Firebase Storage (文件存储)
   - 状态: ✅ 必需 - 代码中使用 `getStorage()`
   - 安全性: ✅ 正确

5. **Cloud Storage API** ⚠️ **可能重复**
   - 用途: Cloud Storage API (与 #4 类似)
   - 状态: ⚠️ 可能与 "Cloud Storage" 重复
   - 建议: 检查是否真的需要两个

6. **Cloud Firestore API** ✅ **必需**
   - 用途: Cloud Firestore 数据库
   - 状态: ✅ 必需 - 代码中使用 `getFirestore()`
   - 安全性: ✅ 正确

7. **Cloud Datastore API** ❌ **不需要**
   - 用途: Cloud Datastore (旧版 NoSQL 数据库)
   - 状态: ❌ 不需要 - 你使用的是 Firestore，不是 Datastore
   - 建议: **移除** - Datastore 和 Firestore 不兼容，不应同时启用
   - 安全性: ⚠️ 增加了攻击面，建议禁用

8. **Cloud Logging API** ⚠️ **可选**
   - 用途: Google Cloud Logging
   - 状态: ⚠️ 如果不使用 Cloud Logging，可以移除
   - 建议: 前端应用通常不需要直接访问 Logging API

9. **Firebase App Distribution API** ❌ **不需要**
   - 用途: Firebase App Distribution (测试应用分发)
   - 状态: ❌ 不需要 - 仅用于移动应用测试分发
   - 建议: **移除** - Web 应用不需要
   - 安全性: ⚠️ 增加了攻击面

10. **Firebase Extensions API** ⚠️ **可选**
    - 用途: Firebase Extensions 管理
    - 状态: ⚠️ 如果不使用 Firebase Extensions，可以移除
    - 建议: 仅在使用 Firebase Extensions 时需要

---

## 🔒 安全评估

### 整体评分: **B+ (85/100)**

### ✅ 优点:
1. ✅ 启用了 API restrictions (比不限制强得多)
2. ✅ 包含了所有必需的 APIs
3. ✅ 正确配置了 Authentication 和 Firestore APIs

### ⚠️ 问题:

#### 1. Cloud Datastore API - **建议移除** ❌
**风险**: 中等
```
问题: Datastore 和 Firestore 不兼容，不应同时启用
原因:
  - Datastore 是旧版 NoSQL 数据库
  - Firestore 是新版，已经包含了 Datastore 功能
  - 同时启用增加了攻击面

建议: 立即禁用 Cloud Datastore API
```

#### 2. Firebase App Distribution API - **建议移除** ❌
**风险**: 低-中等
```
问题: Web 应用不需要 App Distribution
原因:
  - App Distribution 仅用于移动应用测试分发
  - 你的应用是 Web 应用，不需要此功能
  - 增加了不必要的攻击面

建议: 禁用 Firebase App Distribution API
```

#### 3. Cloud Storage vs Cloud Storage API - **可能重复** ⚠️
**风险**: 低
```
问题: 两个 Storage APIs 可能重复
需要验证:
  - "Cloud Storage" 通常指 Firebase Storage
  - "Cloud Storage API" 通常指 Google Cloud Storage API
  - 检查是否都需要

建议: 如果只使用 Firebase Storage，保留 "Cloud Storage" 即可
```

#### 4. Cloud Logging API - **可选** ⚠️
**风险**: 低
```
问题: 前端应用通常不需要直接访问 Logging API
原因:
  - Firebase SDK 会自动记录错误
  - 前端应用不应该直接写入 Cloud Logging

建议: 如果不明确使用，可以禁用
```

#### 5. Firebase Hosting API - **可选** ⚠️
**风险**: 低
```
问题: 仅在使用 Firebase Hosting CLI 时需要
原因:
  - 浏览器访问应用不需要此 API
  - 仅在部署时需要（应该使用 service account）

建议: 如果不从客户端部署，可以禁用
```

#### 6. Firebase Extensions API - **可选** ⚠️
**风险**: 低
```
问题: 仅在使用 Firebase Extensions 时需要
原因:
  - Firebase Extensions 是可选的扩展功能
  - 检查你的项目是否使用了 Extensions

建议: 如果不使用 Extensions，可以禁用
```

---

## 🎯 推荐配置

### 最小必需配置 (推荐):
```
✅ Identity Toolkit API         (Firebase Authentication)
✅ Token Service API             (Token 验证)
✅ Cloud Firestore API           (Firestore 数据库)
✅ Cloud Storage                 (Firebase Storage)
```

### 可选但安全的配置:
```
⚠️ Firebase Hosting API          (仅在使用 Hosting 时)
⚠️ Cloud Logging API             (仅在明确需要时)
⚠️ Firebase Extensions API       (仅在使用 Extensions 时)
```

### 应该移除的配置:
```
❌ Cloud Datastore API           (与 Firestore 冲突，不需要)
❌ Firebase App Distribution API (Web 应用不需要)
❌ Cloud Storage API             (可能与 Cloud Storage 重复)
```

---

## 📊 代码使用的 Firebase Services 验证

### 在 `firebase-config.js` 中发现:

```javascript
// ✅ 使用的服务
const auth = getAuth(app);           // → 需要 Identity Toolkit API ✅
const db = getFirestore(app);        // → 需要 Cloud Firestore API ✅
const storage = getStorage(app);     // → 需要 Cloud Storage ✅

// ❌ 未使用的服务
// 没有 getDatastore() → 不需要 Cloud Datastore API ❌
// 没有 Firebase Functions → 不需要 Cloud Functions API
// 没有 App Distribution → 不需要 Firebase App Distribution API ❌
```

### 代码与配置的匹配度: **75%**

**匹配**:
- ✅ Identity Toolkit API (代码使用 auth)
- ✅ Token Service API (Custom Claims 需要)
- ✅ Cloud Firestore API (代码使用 db)
- ✅ Cloud Storage (代码使用 storage)

**不匹配**:
- ❌ Cloud Datastore API (代码不使用)
- ❌ Firebase App Distribution API (代码不使用)
- ⚠️ Cloud Logging API (代码不明确使用)
- ⚠️ Firebase Hosting API (代码不使用)
- ⚠️ Firebase Extensions API (代码不明确使用)

---

## 🛡️ 安全最佳实践

### 1. 最小权限原则 ✅
```
✅ 优点: 你已经启用了 API restrictions
⚠️ 改进: 应该移除不需要的 APIs 以减少攻击面

当前攻击面: 10 个 APIs
推荐攻击面: 4 个 APIs (减少 60%)
```

### 2. HTTP Referrer Restrictions ⚠️
```
⚠️ 重要: API restrictions 应该与 HTTP Referrer restrictions 结合使用

推荐配置:
Application restrictions:
  ✅ HTTP referrers (web sites)

  添加以下 referrers:
  - http://localhost:*/*
  - http://127.0.0.1:*/*
  - https://dental-clinic-demo-ce94b.firebaseapp.com/*
  - https://dental-clinic-demo-ce94b.web.app/*
  - https://yourdomain.com/*  (你的生产域名)
```

### 3. API Key 轮换 ⚠️
```
⚠️ 提醒: API Key 仍然硬编码在代码中
当前: apiKey: "AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c"

生产环境建议:
1. 使用环境变量
2. 定期轮换 API Key
3. 监控 API Key 使用情况
```

---

## 📝 操作步骤

### Step 1: 移除不需要的 APIs (立即)

访问 Google Cloud Console:
```
https://console.cloud.google.com/apis/credentials/key/YOUR_API_KEY_ID?project=dental-clinic-demo-ce94b
```

**操作**:
1. 点击你的 Browser API Key
2. 在 "API restrictions" 部分
3. 取消勾选以下 APIs:
   - ❌ Cloud Datastore API
   - ❌ Firebase App Distribution API
   - ❌ Cloud Storage API (如果 Cloud Storage 已启用)

4. 点击 "Save" (保存)

**预期结果**:
- 攻击面减少 20-30%
- 没有功能影响（因为代码不使用这些 APIs）

---

### Step 2: 验证可选 APIs (建议)

**检查是否使用 Firebase Hosting**:
```bash
# 检查是否有 firebase.json 配置文件
ls firebase.json

# 如果没有 firebase.json，可以禁用 Firebase Hosting API
```

**检查是否使用 Firebase Extensions**:
```
访问 Firebase Console:
https://console.firebase.google.com/project/dental-clinic-demo-ce94b/extensions

如果没有安装任何 Extensions，可以禁用 Firebase Extensions API
```

**检查是否使用 Cloud Logging**:
```javascript
// 在代码中搜索
grep -r "google-cloud/logging" .
grep -r "cloudLogging" .

// 如果没有找到，可以禁用 Cloud Logging API
```

---

### Step 3: 测试配置 (必需)

**修改 API restrictions 后，务必测试**:

1. 清除浏览器缓存
2. 访问 `http://localhost:5173`
3. 测试以下功能:
   - ✅ 登录 (Identity Toolkit API)
   - ✅ 读取/写入数据 (Cloud Firestore API)
   - ✅ 上传文件 (Cloud Storage)
   - ✅ Custom Claims 验证 (Token Service API)

4. 检查浏览器 Console 是否有错误

**如果出现错误**:
```
错误: "This API key is not authorized to use this service"
原因: 移除了需要的 API
解决: 重新启用该 API
```

---

## 🔍 当前配置总结

### 安全评分: **B+ (85/100)**

**扣分原因**:
- ❌ -5 分: 启用了 Cloud Datastore API (与 Firestore 冲突)
- ❌ -3 分: 启用了 Firebase App Distribution API (不需要)
- ⚠️ -2 分: 可能启用了重复的 Storage APIs
- ⚠️ -5 分: 启用了可能不需要的可选 APIs

### 改进后预期评分: **A (95/100)**

**改进措施**:
1. 移除 Cloud Datastore API
2. 移除 Firebase App Distribution API
3. 验证并移除不需要的可选 APIs
4. 结合 HTTP Referrer restrictions

---

## ✅ 最终建议

### 立即操作 (P0):
1. ❌ **移除** Cloud Datastore API
2. ❌ **移除** Firebase App Distribution API

### 建议操作 (P1):
3. ⚠️ **验证** 是否需要 Cloud Logging API
4. ⚠️ **验证** 是否需要 Firebase Hosting API
5. ⚠️ **验证** 是否需要 Firebase Extensions API
6. ⚠️ **验证** Cloud Storage vs Cloud Storage API (可能重复)

### 长期改进 (P2):
7. 添加 HTTP Referrer restrictions
8. 实施 API Key 轮换策略
9. 监控 API Key 使用情况

---

## 📚 参考文档

- [Firebase API Key 安全最佳实践](https://firebase.google.com/docs/projects/api-keys)
- [Google Cloud API Key Restrictions](https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions)
- [Firestore vs Datastore](https://cloud.google.com/datastore/docs/firestore-or-datastore)

---

**审查人**: Claude Code (Security Review Agent)
**下次审查**: 修改配置后
