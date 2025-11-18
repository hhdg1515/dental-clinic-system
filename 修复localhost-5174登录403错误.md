# 修复 localhost:5174 登录 403 错误

## 🔴 错误信息
```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c 403 (Forbidden)

Firebase: Error (auth/requests-from-referer-http://localhost:5174-are-blocked.)
```

---

## 📊 问题原因

当前使用的API密钥 `AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c` 在Google Cloud Console中设置了**HTTP Referrer限制**，只允许特定的域名/端口访问。

由于开发服务器端口从5173改为5174，新端口不在允许列表中，因此被拒绝。

---

## ✅ 解决方案（3选1）

### 🟢 方案1：修改API Key的Referrer限制（推荐，5分钟）

**适用场景**: 你有Google Cloud Console访问权限

**步骤**:

#### 1. 访问Google Cloud Console
```
https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b
```

#### 2. 找到并编辑API密钥
- 在"API keys"列表中找到: `Browser key` 或包含 `AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c` 的密钥
- 点击密钥名称或右侧的"编辑"（铅笔图标）

#### 3. 修改Application restrictions
找到"Application restrictions"部分，选择"HTTP referrers (web sites)"

**在"Website restrictions"中添加或确保包含以下条目**:
```
http://localhost/*
http://localhost:*/*
http://127.0.0.1/*
http://127.0.0.1:*/*
```

⚠️ **重要**: 使用通配符 `*` 允许所有localhost端口

**完整的推荐配置**:
```
# 本地开发
http://localhost/*
http://localhost:*/*
http://127.0.0.1/*
http://127.0.0.1:*/*

# 生产环境（如果有）
https://your-domain.com/*
https://*.firebaseapp.com/*
https://*.web.app/*
```

#### 4. 保存并等待生效
- 点击"Save"按钮
- **等待1-2分钟**让更改生效
- 刷新浏览器重试登录

---

### 🟡 方案2：临时移除API Key限制（快速，2分钟）

**适用场景**: 开发阶段，需要快速解决问题

**步骤**:

1. 同样访问上述Google Cloud Console
2. 编辑API密钥
3. 在"Application restrictions"中选择 **"None"**
4. 保存

⚠️ **安全风险**:
- 移除限制后，任何人都可以使用这个API密钥
- **仅用于开发环境**
- **记得后续恢复限制**

---

### 🟠 方案3：使用固定端口5173（临时，30秒）

**适用场景**: 无法修改API Key配置，临时绕过

**步骤**:

#### 1. 停止当前的开发服务器
在终端按 `Ctrl + C`

#### 2. 杀掉占用5173端口的进程

**Windows**:
```bash
# 找到占用5173端口的进程
netstat -ano | findstr :5173

# 杀掉进程（替换<PID>为上面命令输出的进程ID）
taskkill /PID <PID> /F
```

**或者直接尝试杀掉所有Node进程**:
```bash
taskkill /IM node.exe /F
```

#### 3. 重新启动开发服务器
```bash
cd 外网-react
npm run dev
```

现在应该会使用5173端口（如果API Key允许这个端口）

⚠️ **缺点**:
- 只是绕过问题，没有真正解决
- 如果5173端口被其他应用占用，还是会换端口

---

## 🎯 推荐执行顺序

### 立即执行（选择其一）

**如果你能访问Google Cloud Console**:
→ 使用 **方案1** (修改Referrer限制)
  - 一劳永逸
  - 所有localhost端口都能用
  - 5分钟搞定

**如果你现在没有Console访问权限**:
→ 使用 **方案3** (杀掉5173占用)
  - 立即解决
  - 后续再配置API Key

**如果你想极速解决（不在意安全）**:
→ 使用 **方案2** (移除限制)
  - 2分钟搞定
  - 但记得后续恢复限制

---

## 🔍 验证修复

修复后，在浏览器Console运行：
```javascript
// 测试Firebase连接
firebase.auth().signInWithEmailAndPassword('test@example.com', 'password')
  .then(() => console.log('✅ Firebase API Key工作正常'))
  .catch(err => console.log('❌ 错误:', err.message));
```

如果不再看到 `requests-from-referer-*-are-blocked` 错误，说明修复成功！

---

## 📋 API Key配置最佳实践

### 开发环境配置
```
Application restrictions: HTTP referrers
Website restrictions:
  - http://localhost:*/*       (允许所有localhost端口)
  - http://127.0.0.1:*/*       (允许所有127.0.0.1端口)

API restrictions: Don't restrict key  (开发阶段方便调试)
```

### 生产环境配置
```
Application restrictions: HTTP referrers
Website restrictions:
  - https://yourdomain.com/*
  - https://*.firebaseapp.com/*

API restrictions: Restrict key
Allowed APIs:
  ✅ Cloud Firestore API
  ✅ Firebase Authentication API
  ✅ Identity Toolkit API
  ✅ Token Service API
```

---

## 🔗 相关链接

- [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b)
- [Firebase API Key安全指南](FIREBASE-API-KEY-SECURITY.md)
- [完整的API Key 403错误排查](API-KEY-403-CHECKLIST.md)

---

## ⚠️ 重要提醒

当前使用的API密钥 `AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c` **已经暴露在GitHub历史中**。

**强烈建议**:
1. ✅ 先用上述方案解决登录问题
2. 🔴 然后立即生成新的API密钥并轮换
3. 🔴 删除所有已暴露的旧密钥

详见: [本地代码拉取后的关键修复指南.md](本地代码拉取后的关键修复指南.md) - "轮换Firebase API密钥"部分

---

**生成时间**: 2025-11-17
**状态**: 待执行
**预计时间**: 2-5分钟
