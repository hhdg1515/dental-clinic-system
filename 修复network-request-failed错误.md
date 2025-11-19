# 修复 auth/network-request-failed 错误

## 🔴 当前错误
```
FirebaseError: Firebase: Error (auth/network-request-failed)
```

## 📊 问题分析

错误已经从 `auth/requests-from-referer-*-are-blocked` 变成 `auth/network-request-failed`。

**这说明**:
- ✅ HTTP Referrer限制已经正确配置（你加的 `http://localhost:5174/*` 生效了）
- ❌ 但API Key的**API restrictions**（API限制）配置有问题

---

## ✅ 解决方案

### 步骤1: 检查API Restrictions

1. 访问 Google Cloud Console:
   ```
   https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b
   ```

2. 找到你的API Key（包含 `AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c`）

3. 点击编辑，滚动到 **"API restrictions"** 部分

4. **查看当前配置**：

   **如果是 "Restrict key"**（限制密钥）:
   - 检查"Select APIs"列表
   - **必须包含以下APIs**：
     ```
     ✅ Identity Toolkit API
     ✅ Token Service API
     ✅ Cloud Firestore API
     ✅ Firebase Authentication API (可选，但推荐)
     ```

   **如果缺少任何一个** → 这就是问题原因！

---

### 步骤2: 修复API Restrictions（推荐2选1）

#### 🟢 方案A: 添加缺失的APIs（生产推荐）

在"API restrictions"中：
1. 保持选择 **"Restrict key"**
2. 点击 **"Select APIs"** 下拉菜单
3. **搜索并勾选以下APIs**：

   **必需的APIs**:
   ```
   ✅ Identity Toolkit API
   ✅ Token Service API
   ✅ Cloud Firestore API
   ```

   **推荐的APIs**（如果你用到这些功能）:
   ```
   ✅ Firebase Management API
   ✅ Cloud Storage for Firebase API
   ✅ Firebase Rules API
   ```

4. 点击 **"Save"**
5. **等待1-2分钟**让更改生效

---

#### 🟡 方案B: 临时移除API限制（开发快速方案）

在"API restrictions"中：
1. 选择 **"Don't restrict key"**（不限制密钥）
2. 点击 **"Save"**
3. **等待1分钟**生效

⚠️ **注意**:
- 这样配置后，API Key可以访问项目中的**所有API**
- 开发阶段可以这样配置（方便调试）
- 生产环境建议用方案A（只允许必要的APIs）

---

### 步骤3: 验证修复

保存后等待1-2分钟，然后：

1. **刷新浏览器**（硬刷新: `Ctrl + Shift + R`）
2. **重试登录**
3. 打开浏览器Console，检查是否还有错误

如果看到类似这样的成功信息：
```javascript
✅ User signed in successfully
```

说明修复成功！

---

## 🔍 完整的API Key配置检查清单

### Application restrictions（应用限制）
```
✅ HTTP referrers (web sites)

Website restrictions:
  ✅ http://localhost:*/*
  ✅ http://127.0.0.1:*/*
  ✅ https://your-domain.com/*  (如果有生产域名)
```

### API restrictions（API限制）

**开发环境推荐**:
```
⭕ Don't restrict key
```

**生产环境推荐**:
```
✅ Restrict key

Select APIs:
  ✅ Identity Toolkit API
  ✅ Token Service API
  ✅ Cloud Firestore API
  ✅ Cloud Storage for Firebase API (如果用到存储)
```

---

## 🛠️ 如果还是不行，试试这个

### 方法1: 启用所需的APIs

有些API可能在项目中未启用，需要手动启用：

1. 访问 API Library:
   ```
   https://console.cloud.google.com/apis/library?project=dental-clinic-demo-ce94b
   ```

2. 搜索并**启用**以下APIs（如果未启用）:
   - **Identity Toolkit API**
   - **Token Service API**
   - **Cloud Firestore API**

3. 点击每个API，然后点击 **"ENABLE"**（启用）

---

### 方法2: 检查Firebase项目配置

1. 访问 Firebase Console:
   ```
   https://console.firebase.google.com/project/dental-clinic-demo-ce94b/settings/general
   ```

2. 确认 **Authentication** 已启用:
   - 左侧菜单 → Authentication → Sign-in method
   - 确保 **Email/Password** 登录方式已启用

---

### 方法3: 检查浏览器Console的详细错误

在浏览器Console中运行：
```javascript
// 查看完整的Firebase配置
console.log('Firebase Config:', firebase.app().options);

// 尝试手动登录测试
firebase.auth().signInWithEmailAndPassword('test@test.com', 'testpassword')
  .then(user => console.log('✅ 登录成功:', user))
  .catch(err => {
    console.log('❌ 错误代码:', err.code);
    console.log('❌ 错误消息:', err.message);
    console.log('❌ 完整错误:', err);
  });
```

把输出的错误信息发给我，我可以进一步诊断。

---

## 📋 快速排查流程

```
1. Referrer限制配置正确？
   ✅ YES (你已经加了 http://localhost:5174/*)

2. API restrictions 是 "Don't restrict key"？
   ❓ 需要检查 → 去Google Cloud Console确认

3. Identity Toolkit API 已启用？
   ❓ 需要检查 → 去API Library确认

4. Firebase Authentication 已启用？
   ❓ 需要检查 → 去Firebase Console确认
```

---

## 🎯 最快的解决方案

**立即执行**（2分钟）:

1. Google Cloud Console → API Credentials
2. 编辑你的API Key
3. API restrictions → 选择 **"Don't restrict key"**
4. 保存
5. 等待1分钟
6. 刷新浏览器重试登录

**如果这样还不行**，说明问题不在API Key配置，而是：
- Firebase项目本身的配置问题
- 或者网络/防火墙问题
- 或者Firebase服务本身的问题

---

## 🔗 相关链接

- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b)
- [Google Cloud Console - API Library](https://console.cloud.google.com/apis/library?project=dental-clinic-demo-ce94b)
- [Firebase Console - Authentication](https://console.firebase.google.com/project/dental-clinic-demo-ce94b/authentication/users)

---

**生成时间**: 2025-11-17
**问题**: auth/network-request-failed
**推荐方案**: API restrictions → "Don't restrict key"
**预计时间**: 2分钟
