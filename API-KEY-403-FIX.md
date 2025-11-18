# API Key 403 错误诊断和修复指南

## 🔴 错误信息
```
GET https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c
403 (Forbidden)
```

## 📊 当前状态

**你的配置文件中的 API Keys：**
- ✅ `内网/firebase-config.js`: `AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI`
- ✅ `外网/firebase-config.js`: `AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI`
- ✅ `外网-react/public/内网/firebase-config.js`: `AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI`

**错误中出现的 API Key：**
- ❌ `AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c` (浏览器缓存的旧版本)

## ✅ 解决步骤

### 步骤1：清除浏览器缓存（最重要！）

#### 方法A：硬刷新
- **Windows/Linux:** `Ctrl + Shift + R` 或 `Ctrl + F5`
- **Mac:** `Cmd + Shift + R`

#### 方法B：开发者工具清除
1. 打开开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"（Empty Cache and Hard Reload）

#### 方法C：手动清除
```javascript
// 在浏览器控制台运行：
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### 步骤2：验证加载的 API Key

刷新后，在控制台运行：
```javascript
console.log('Firebase API Key:', firebase.app().options.apiKey);
// 应该显示: AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI
```

### 步骤3：如果还是 403 错误

说明当前的 API key (`AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI`) 有限制。

#### 检查 Firebase Console 中的 API Key 限制：

1. **访问 Google Cloud Console：**
   https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b

2. **找到你的 API Key** (`AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI`)

3. **检查并修改限制：**

   **A. Application restrictions（应用限制）：**
   - 选择"HTTP referrers (web sites)"
   - 添加允许的 URL：
     ```
     http://localhost:*/*
     http://127.0.0.1:*/*
     https://yourdomain.com/*
     https://*.firebaseapp.com/*
     https://*.web.app/*
     ```

   **B. API restrictions（API 限制）：**
   - 如果选择了"Restrict key"，确保启用了这些 API：
     ```
     ✅ Cloud Firestore API
     ✅ Identity Toolkit API
     ✅ Token Service API
     ✅ Cloud Storage for Firebase API
     ```
   - **或者暂时选择"Don't restrict key"**（开发阶段）

4. **保存更改**，等待 1-2 分钟生效

### 步骤4：如果所有 API Key 都有问题

生成一个全新的 API Key：

1. 在 Google Cloud Console → APIs & Services → Credentials
2. 点击"+ CREATE CREDENTIALS" → "API key"
3. 复制新的 API key
4. 暂时不设置任何限制（选择"Don't restrict key"）
5. 更新所有配置文件

**更新这些文件：**
```bash
内网/firebase-config.js
外网/firebase-config.js
外网-react/public/内网/firebase-config.js
```

在每个文件中，将：
```javascript
apiKey: "AIzaSyB5kla1coph39gz60jOhAw9ce3Trp9myHI",
```

改为新的 API key。

## 🔍 诊断命令

### 检查当前使用的 API Key
```javascript
// 在控制台运行
console.log('Firebase config:', {
  apiKey: firebase.app().options.apiKey,
  projectId: firebase.app().options.projectId,
  authDomain: firebase.app().options.authDomain
});
```

### 检查认证状态
```javascript
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    console.log('✅ 已登录:', user.email);
  } else {
    console.log('❌ 未登录');
  }
});
```

### 测试 Firestore 连接
```javascript
firebase.firestore().collection('appointments').limit(1).get()
  .then(snap => console.log('✅ Firestore 连接成功'))
  .catch(err => console.error('❌ Firestore 错误:', err.message));
```

## 📝 常见原因总结

| 错误原因 | 解决方案 | 优先级 |
|---------|---------|--------|
| 浏览器缓存了旧的 JS 文件 | 硬刷新 (Ctrl+Shift+R) | 🔴 最高 |
| API Key 有 HTTP Referrer 限制 | 添加 localhost 和你的域名到白名单 | 🟡 中等 |
| API Key 有 API 限制 | 启用所需的 Firebase APIs | 🟡 中等 |
| API Key 被删除 | 生成新的 API Key | 🟢 低（如果其他方法无效） |

## ⚠️ 重要提示

1. **首先尝试硬刷新**，这解决了 90% 的缓存问题
2. **不要立即生成新 key**，先检查现有 key 的限制设置
3. **如果生成了新 key**，记得更新所有配置文件（3个文件）

## ✅ 验证修复成功

修复后，你应该看到：
- ✅ 控制台没有 403 错误
- ✅ 可以正常登录
- ✅ 可以看到 appointments 数据
- ✅ Dashboard 正常显示

如果还有问题，请提供：
1. 控制台的完整错误信息
2. `firebase.app().options.apiKey` 的输出
3. 你当前使用的 URL（localhost:多少？）
