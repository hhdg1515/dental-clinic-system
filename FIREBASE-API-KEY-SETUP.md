# Firebase API Key 安全配置指南

## ⚠️ CRITICAL #2 修复

这个指南将帮助你完成 Firebase API Key 的安全迁移,从硬编码到环境变量。

---

## 🚨 立即行动 - API Key 已泄露

**当前暴露的 API Key**: `AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI`

### 步骤 1: 轮换 Firebase API Key (必须立即执行)

⚠️ **重要**: 旧的 API key 已经提交到 git 历史记录中,必须轮换!

#### 在 Firebase Console 中轮换 API Key:

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目: `dental-clinic-demo-ce94b`
3. 点击左侧 **Project Settings** (设置图标)
4. 在 **General** 标签下,找到 "Web API Key"
5. 点击 **Add API key** 生成新的 Web API key
6. **暂时不要删除旧 key** (等新配置测试成功后再删除)
7. 复制新的 API key

#### 可选: 限制 API Key 使用范围

为了额外的安全性,你可以在 [Google Cloud Console](https://console.cloud.google.com/) 中限制 API key:

1. 访问: `https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b`
2. 找到你的 Web API key
3. 点击编辑
4. 在 "Application restrictions" 下:
   - 选择 "HTTP referrers (web sites)"
   - 添加你的域名 (例如: `https://yourdomain.com/*`)
5. 在 "API restrictions" 下:
   - 选择 "Restrict key"
   - 只启用需要的服务:
     - Firebase Authentication API
     - Cloud Firestore API
     - Firebase Storage API
6. 点击 **Save**

---

## 📝 步骤 2: 配置外网 React 应用

### 2.1 创建 `.env.local` 文件

```bash
cd 外网-react
cp .env.example .env.local
```

### 2.2 编辑 `.env.local` 文件

使用文本编辑器打开 `外网-react/.env.local`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=你的新API_KEY
VITE_FIREBASE_AUTH_DOMAIN=dental-clinic-demo-ce94b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dental-clinic-demo-ce94b
VITE_FIREBASE_STORAGE_BUCKET=dental-clinic-demo-ce94b.firebasestorage.app
```

### 2.3 测试外网应用

```bash
cd 外网-react
npm run dev
```

访问 `http://localhost:5173` 并测试:
- ✅ 用户注册
- ✅ 用户登录
- ✅ 预约创建
- ✅ 数据读取

---

## 📝 步骤 3: 配置内网管理系统

### 3.1 创建 `firebase-config.js` 文件

```bash
cd 内网
cp firebase-config.template.js firebase-config.js
```

### 3.2 编辑 `firebase-config.js` 文件

使用文本编辑器打开 `内网/firebase-config.js`,找到这部分:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",  // 替换为你的新 API Key
    authDomain: "YOUR_PROJECT.firebaseapp.com",  // 替换
    projectId: "YOUR_PROJECT_ID",  // 替换
    storageBucket: "YOUR_PROJECT.firebasestorage.app"  // 替换
};
```

替换为:

```javascript
const firebaseConfig = {
    apiKey: "你的新API_KEY",
    authDomain: "dental-clinic-demo-ce94b.firebaseapp.com",
    projectId: "dental-clinic-demo-ce94b",
    storageBucket: "dental-clinic-demo-ce94b.firebasestorage.app"
};
```

### 3.3 测试内网应用

打开 `内网/index.html` 在浏览器中测试:
- ✅ 管理员登录
- ✅ 预约管理
- ✅ 患者档案访问

---

## ✅ 步骤 4: 验证配置

### 4.1 验证 `.gitignore` 配置

确保这些文件不会被提交:

```bash
git status
```

应该看到:
- `外网-react/.env.local` - **未被追踪** (not tracked)
- `内网/firebase-config.js` - **未被追踪** (not tracked)

如果这些文件显示为 "Changes to be committed" 或 "Changes not staged":

```bash
# 从暂存区移除
git rm --cached 外网-react/.env.local
git rm --cached 内网/firebase-config.js

# 确认 .gitignore 包含这些文件
cat .gitignore | grep -E "\.env\.local|firebase-config\.js"
```

### 4.2 验证环境变量加载

在浏览器控制台运行:

```javascript
// 外网 React (开发模式下)
console.log('API Key loaded:', !!import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Config complete:',
  !!import.meta.env.VITE_FIREBASE_API_KEY &&
  !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  !!import.meta.env.VITE_FIREBASE_PROJECT_ID
);

// 内网 HTML/JS
console.log('Firebase initialized:', !!window.firebase);
console.log('Auth available:', !!window.firebase?.auth);
```

---

## 🔒 步骤 5: 删除旧的暴露配置

### 5.1 确认新配置工作正常

在两个应用中测试所有功能都正常后,删除旧的 API key。

### 5.2 在 Firebase Console 删除旧 API Key

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. Project Settings > General
3. 找到旧的 API key: `AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI`
4. 点击删除

### 5.3 清理 Git 历史 (高级,可选)

⚠️ **警告**: 这会重写 git 历史,如果有其他人克隆了仓库,会造成问题!

如果你想从 git 历史中完全移除暴露的 API key:

```bash
# 使用 git-filter-repo (推荐)
# 安装: pip install git-filter-repo

git-filter-repo --replace-text <(echo "AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI==>REDACTED_API_KEY")

# 强制推送到远程仓库 (谨慎!)
git push origin --force --all
```

**更简单的方法**: 如果仓库是新的,直接创建一个新仓库。

---

## 📋 生产环境部署

### Vercel / Netlify 部署外网应用

在部署平台的环境变量设置中添加:

```
VITE_FIREBASE_API_KEY=你的API_KEY
VITE_FIREBASE_AUTH_DOMAIN=dental-clinic-demo-ce94b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dental-clinic-demo-ce94b
VITE_FIREBASE_STORAGE_BUCKET=dental-clinic-demo-ce94b.firebasestorage.app
```

### Firebase Hosting 部署内网应用

1. 确保 `firebase-config.js` 不在部署目录
2. 在 Firebase Hosting 中使用自定义 header 注入配置
3. 或者使用 Firebase Hosting 的环境配置功能

---

## 🔐 安全最佳实践

### ✅ DO (应该做的)

- ✅ 使用环境变量存储 API keys
- ✅ 将 `.env.local` 和 `firebase-config.js` 加入 `.gitignore`
- ✅ 使用 API key 限制 (HTTP referrers 和 API restrictions)
- ✅ 定期轮换 API keys
- ✅ 使用 Firebase Security Rules 作为主要安全层
- ✅ 启用 Firebase App Check (额外保护)

### ❌ DON'T (不应该做的)

- ❌ 不要将 API keys 硬编码在源代码中
- ❌ 不要提交 `.env` 文件到 git
- ❌ 不要在客户端代码中使用 Firebase Admin SDK
- ❌ 不要依赖客户端验证作为唯一安全措施
- ❌ 不要在公共文档/截图中暴露 API keys

---

## 🆘 故障排除

### 问题: "Missing required environment variables"

**原因**: `.env.local` 文件不存在或配置不完整

**解决**:
```bash
cd 外网-react
cp .env.example .env.local
# 编辑 .env.local 填入正确的值
```

### 问题: "Firebase configuration not set"

**原因**: 内网的 `firebase-config.js` 使用了模板占位符

**解决**:
```bash
cd 内网
cp firebase-config.template.js firebase-config.js
# 编辑 firebase-config.js 替换 YOUR_XXX 占位符
```

### 问题: Vite 无法读取环境变量

**原因**: 环境变量名必须以 `VITE_` 开头

**解决**: 确保所有变量名以 `VITE_` 开头:
- ✅ `VITE_FIREBASE_API_KEY`
- ❌ `FIREBASE_API_KEY`

### 问题: 生产环境无法连接 Firebase

**原因**: 环境变量没有在部署平台配置

**解决**: 在 Vercel/Netlify/Firebase Hosting 的设置中添加环境变量

---

## ✅ 完成检查清单

- [ ] 在 Firebase Console 生成了新的 API key
- [ ] 创建了 `外网-react/.env.local` 并填入新配置
- [ ] 创建了 `内网/firebase-config.js` 并填入新配置
- [ ] 验证了 `.gitignore` 包含配置文件
- [ ] 测试了外网应用所有功能
- [ ] 测试了内网应用所有功能
- [ ] 确认敏感文件没有被 git 追踪
- [ ] 在 Firebase Console 删除了旧的 API key
- [ ] 配置了 API key 使用限制
- [ ] 在生产环境部署平台配置了环境变量

---

## 📞 需要帮助?

如果遇到问题:
1. 检查浏览器控制台的错误信息
2. 确认 Firebase Console 中 API key 状态
3. 验证环境变量名称拼写正确
4. 确认 `.env.local` 和 `firebase-config.js` 格式正确
