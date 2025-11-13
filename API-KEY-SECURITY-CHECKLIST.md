# Firebase API Key 安全配置检查清单

## ✅ 已完成的配置

- ✅ **API Key 已轮换**: 新 key 已配置到 `.env.local` 和 `firebase-config.js`
- ✅ **环境变量配置**: 使用 `VITE_FIREBASE_API_KEY` 而非硬编码
- ✅ **Git 保护**: `.env.local` 和 `firebase-config.js` 在 `.gitignore` 中

---

## 🔒 你需要在 Firebase Console 完成的配置

### 1. 配置 API Key 使用限制（推荐）

API key 限制可以防止未授权的应用使用你的 Firebase 项目。

#### 步骤：

1. **访问 Google Cloud Console**:
   ```
   https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b
   ```

2. **找到你的 Web API Key**:
   - 在 "API keys" 列表中，找到名为 "Browser key (auto created by Firebase)" 或类似的 key
   - 点击 key 名称进行编辑

3. **设置应用程序限制 (Application restrictions)**:
   - 选择 **"HTTP referrers (web sites)"**
   - 点击 **"ADD AN ITEM"**
   - 添加以下 referrers:

   **开发环境**:
   ```
   http://localhost:5173/*
   http://localhost:3000/*
   http://127.0.0.1:5173/*
   ```

   **生产环境** (部署后添加):
   ```
   https://yourdomain.com/*
   https://*.yourdomain.com/*
   ```

4. **设置 API 限制 (API restrictions)**:
   - 选择 **"Restrict key"**
   - 勾选以下 APIs（只启用需要的）:
     - ✅ Cloud Firestore API
     - ✅ Firebase Authentication API
     - ✅ Cloud Storage for Firebase API
     - ✅ Identity Toolkit API (Firebase Auth 需要)
     - ❌ 其他 API 都不勾选

5. **保存配置**:
   - 点击 **"Save"** 按钮
   - 等待几分钟让配置生效

---

### 2. 删除旧的 API Key（重要！）

旧的 key 已经暴露在 git 历史中，需要删除。

#### 步骤：

1. **在同一个 API Keys 页面**:
   ```
   https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b
   ```

2. **找到旧的 API Key**:
   - 旧 key 开头: `AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI`
   - 如果看到多个 key，检查创建时间（旧的会更早）

3. **删除旧 Key**:
   - 点击旧 key 右侧的 **垃圾桶图标** 🗑️
   - 确认删除

⚠️ **注意**: 删除前确保新 key 已经在代码中使用并测试通过！

---

### 3. 启用 Firebase App Check（可选但强烈推荐）

App Check 为你的 Firebase 资源提供额外保护层。

#### 步骤：

1. **访问 Firebase Console**:
   ```
   https://console.firebase.google.com/project/dental-clinic-demo-ce94b/appcheck
   ```

2. **注册你的应用**:
   - 点击 **"Get started"** 或 **"Register"**
   - 选择你的 Web 应用

3. **选择提供商**:
   - **reCAPTCHA v3** (推荐用于生产)
   - 或 **reCAPTCHA Enterprise** (更高级)

4. **配置 reCAPTCHA**:
   - 访问 https://www.google.com/recaptcha/admin
   - 创建新的 reCAPTCHA v3 site key
   - 添加你的域名

5. **在代码中启用 App Check** (需要添加代码):

   在 `外网-react/src/config/firebase.ts` 添加:
   ```typescript
   import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

   // 在 initializeApp 之后
   if (import.meta.env.PROD) {
     initializeAppCheck(app, {
       provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
       isTokenAutoRefreshEnabled: true
     });
   }
   ```

---

## 🧪 测试配置

### 测试 1: 验证新 API Key 工作正常

1. **重启开发服务器**:
   ```bash
   cd 外网-react
   npm run dev
   ```

2. **测试功能**:
   - ✅ 用户登录
   - ✅ 用户注册
   - ✅ 创建预约
   - ✅ 查看预约

3. **检查控制台**:
   - 不应该有 Firebase 初始化错误
   - 不应该有 API key 错误

### 测试 2: 验证旧 Key 已失效（删除后）

1. **临时改回旧 key** (测试用):
   ```
   VITE_FIREBASE_API_KEY=AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI
   ```

2. **重启服务器并测试**:
   - 应该看到 Firebase 错误
   - 功能应该无法使用

3. **改回新 key**:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyDP2CRExRah28R374Dq2eibeX-yg5cWqtA
   ```

### 测试 3: 验证 HTTP Referrer 限制（配置后）

如果你配置了 referrer 限制:

1. **从允许的域名访问** - 应该正常工作
2. **从其他域名访问** - 应该被拒绝

---

## 📋 安全配置检查清单

完成以下所有步骤以确保最大安全性:

### 必须完成:
- [x] ✅ 新 API key 已配置到代码中
- [ ] ⏳ 在 Google Cloud Console 配置 API Key 限制
  - [ ] 设置 HTTP Referrers
  - [ ] 限制只启用需要的 APIs
- [ ] ⏳ 删除旧的暴露 API Key
- [x] ✅ `.env.local` 和 `firebase-config.js` 在 `.gitignore` 中
- [ ] ⏳ 测试新 key 工作正常

### 推荐完成:
- [ ] 📌 启用 Firebase App Check
- [ ] 📌 配置 Firebase Security Rules（已在 Phase 1 完成）
- [ ] 📌 启用 Firebase Authentication 的用户枚举保护
- [ ] 📌 为生产环境配置 referrer 限制

### 生产部署时:
- [ ] 在部署平台配置环境变量
- [ ] 更新 API key referrers 包含生产域名
- [ ] 启用 App Check
- [ ] 监控 Firebase 使用量和异常请求

---

## 🔐 额外安全建议

### 1. 定期轮换 API Key
- 建议每 6-12 个月轮换一次
- 在安全事件后立即轮换

### 2. 监控 Firebase 使用
- 在 Firebase Console 查看使用量
- 设置配额警报
- 检查异常的读写模式

### 3. 使用 Firebase Security Rules
- 已在 Phase 1 完成 ✅
- 定期审查和更新规则

### 4. 备份 API Key
- 将新 key 安全存储在密码管理器中
- 团队成员需要访问时使用安全方式共享

---

## 📞 问题排查

### 问题: "Firebase: Error (auth/api-key-not-valid)"

**原因**: API key 配置错误或已被删除

**解决**:
1. 检查 `.env.local` 中的 key 是否正确
2. 检查 key 在 Google Cloud Console 中是否存在
3. 确认 key 没有被限制

### 问题: "This domain is not authorized"

**原因**: HTTP Referrer 限制阻止了访问

**解决**:
1. 在 Google Cloud Console 添加当前域名到 referrers
2. 检查是否包含通配符 `/*`
3. 等待几分钟让配置生效

### 问题: 部署后 API 无法访问

**原因**: 生产环境的环境变量未配置

**解决**:
1. 在 Vercel/Netlify 等平台配置环境变量
2. 添加 `VITE_FIREBASE_API_KEY` 等所有变量
3. 重新部署

---

## ✅ 完成确认

当你完成所有配置后:
1. ✅ 新 API key 在本地正常工作
2. ✅ HTTP Referrer 限制已配置
3. ✅ API 限制已配置
4. ✅ 旧 key 已删除
5. ✅ 所有功能测试通过

**恭喜！你的 Firebase API Key 现在是安全的！** 🎉
