# API Key 完整设置指南

**最后更新**: 2025-11-20

---

## 📋 目录

1. [概述](#概述)
2. [API Key 安全基础](#api-key-安全基础)
3. [当前 API Key 配置](#当前-api-key-配置)
4. [HTTP Referrer 限制配置](#http-referrer-限制配置)
5. [API 限制配置](#api-限制配置)
6. [问题排查](#问题排查)
7. [最佳实践](#最佳实践)
8. [Key 轮换流程](#key-轮换流程)

---

## 概述

本指南涵盖：
- 🔑 Firebase API Key 的安全配置
- 🌐 HTTP Referrer 限制（防止滥用）
- 🔒 API 级别限制（限制可用服务）
- 🚀 不同环境的配置策略
- 🔄 Key 轮换和更新流程

---

## API Key 安全基础

### ⚠️ 重要事实

1. **Firebase API Keys 是公开的**
   - 存储在客户端代码中（前端 JavaScript）
   - 会出现在网络请求和浏览器开发者工具中
   - 这是正常的，不应该被视为秘密

2. **API Key 的作用**
   - 用于 Firebase 服务的身份识别（不是身份验证）
   - 帮助 Firebase 区分来自不同项目的请求
   - 不能直接访问用户数据（由 Security Rules 控制）

3. **真正的安全来自于**
   - ✅ Firebase Security Rules（Firestore/Realtime DB）
   - ✅ Firebase Storage Rules
   - ✅ HTTP Referrer 限制
   - ✅ API 级别限制
   - ❌ API Key 本身的保密性

---

## 当前 API Key 配置

### 🔴 警告：已暴露的 API Key

```
API Key: AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c
```

**为什么暴露**:
- 存储在 React 项目的 `src/config/firebase.ts` 中
- 曾经提交到 Git 历史中
- 可能在 GitHub/公开代码库中被爬虫记录

**当前状态**: ✅ 已通过 Referrer 限制保护

**需要做的**:
1. ✅ 已完成：配置 HTTP Referrer 限制
2. ⏳ 建议：生成新的 Key 并轮换（参见 [Key 轮换流程](#key-轮换流程)）

---

## HTTP Referrer 限制配置

### 📍 访问 Google Cloud Console

```
https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b
```

### 🔧 配置步骤

#### 1. 找到并编辑 API Key

- 在 "API keys" 列表中找到你的 Browser Key
- 点击密钥名称或右侧的"编辑"（铅笔图标）

#### 2. 配置 Application Restrictions

在 "Application restrictions" 部分，选择 **"HTTP referrers (web sites)"**

#### 3. 设置 Website Restrictions

在 "Website restrictions" 中，根据环境添加以下规则：

**开发环境配置**:
```
http://localhost:*/*
http://127.0.0.1:*/*
```

💡 **为什么用通配符**：允许开发服务器使用任意端口（Vite 会随机分配）

**生产环境配置**:
```
https://dental-clinic-demo-ce94b.firebaseapp.com/*
https://dental-clinic-demo-ce94b.web.app/*
```

⚠️ **HTTPS 只用于生产**：确保生产 URL 使用 HTTPS

**完整推荐配置**:
```
# 本地开发
http://localhost:*/*
http://127.0.0.1:*/*

# Firebase Hosting（生产）
https://dental-clinic-demo-ce94b.firebaseapp.com/*
https://dental-clinic-demo-ce94b.web.app/*

# 如果有自定义域名（添加你的实际域名）
https://yourdomain.com/*
```

#### 4. 保存并测试

1. 点击 "Save" 按钮
2. **等待 1-2 分钟**让 Google Cloud 处理更改
3. 刷新浏览器测试登录

---

## API 限制配置

### 🔒 限制可用的 API

在同一个 Google Cloud Console 页面，向下滚动找 "API restrictions" 部分。

#### 开发环境（不限制）

选择 **"Don't restrict key"**

✅ 优点：开发调试方便
❌ 缺点：任何人都可以使用这个 Key 调用任何 Google API

#### 生产环境（建议限制）

选择 **"Restrict key"**，然后只启用必要的 API：

```
✅ Cloud Firestore API
✅ Firebase Authentication API
✅ Identity Toolkit API
✅ Token Service API
✅ Firebase Storage API (如果使用)
✅ Google Geolocation API (可选)

❌ 关闭: 其他所有不需要的 API
```

### 为什么要限制 API？

1. **安全性**：即使 Key 被盗，也只能调用授权的 API
2. **成本**：防止意外使用其他 Google API 产生费用
3. **防御**：减小攻击面

---

## 问题排查

### ❌ 403 Forbidden 错误

**错误信息**:
```
Firebase: Error (auth/requests-from-referer-{YOUR-DOMAIN}-are-blocked.)
```

**原因**:
- 你的域名/localhost 不在 Referrer 限制列表中

**解决方案**:
1. 进入 Google Cloud Console
2. 编辑 API Key 的 Referrer 限制
3. 添加你的当前域名 (如 `http://localhost:5173/*`)
4. 保存并等待 1-2 分钟生效
5. 刷新浏览器重试

### ❌ 403 Forbidden (API 限制)

**错误信息**:
```
API Geolocation API has not been used in project {PROJECT_ID} before or it is disabled.
```

**原因**:
- 你启用了 "Restrict key" 但没有勾选需要的 API

**解决方案**:
1. 进入 Google Cloud Console
2. 编辑 API Key 的 API restrictions
3. 添加缺失的 API
4. 保存

### ⚠️ 网络请求失败 (auth/network-request-failed)

**可能原因**:
1. 🔥 防火墙阻止了 Firebase 服务
2. 🌏 地理位置限制（如中国大陆）
3. 🔌 ISP 限制
4. 🧩 浏览器扩展干扰

**诊断步骤**:
1. 打开隐身模式（禁用所有扩展）
2. 尝试访问 https://firebase.google.com
3. 如果能访问 Firebase 但不能登录，问题在网络防火墙
4. 如果连 firebase.google.com 都打不开，问题可能是 ISP/GFW 限制

**解决方案**:
- ✅ 关闭 Windows 防火墙或配置允许列表
- ✅ 检查路由器防火墙设置
- ✅ 在中国大陆：使用 VPN 或科学上网工具
- ✅ 尝试其他网络（如移动热点）

---

## 最佳实践

### 1. 区分开发和生产 Key

**开发环境**:
```javascript
// .env.local (不提交到 Git)
VITE_FIREBASE_API_KEY=AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c
```

**生产环境**:
```javascript
// Firebase Console 部署时使用不同的 Key
// 或使用相同 Key 但配置不同的 Referrer 限制
```

### 2. 定期轮换 Key

建议每 3-6 个月轮换一次 API Key（参见 [Key 轮换流程](#key-轮换流程)）

### 3. 监控 API 使用

```
Google Cloud Console → APIs & Services → Quotas
```

检查：
- 📊 API 调用次数（异常增长？）
- 💰 成本（超出预算？）
- ⚠️ 错误率（高错误率？）

### 4. 配置告警

```
Google Cloud Console → Monitoring → Alerting
```

设置告警：
- API 调用异常增长（可能 Key 被盗）
- 成本超过阈值
- 高错误率

### 5. 不要在 Git 历史中保存 Key

**检查 Git 历史**:
```bash
# 查看 Git 历史中是否有敏感信息
git log -p --all -S "AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c"

# 如果找到，需要从历史中删除
git filter-branch --tree-filter 'rm -f sensitive-file' HEAD
```

---

## Key 轮换流程

### 📋 步骤 1: 生成新 API Key

1. 进入 Google Cloud Console
2. 导航到 **APIs & Services** → **Credentials**
3. 点击 **"+ Create Credentials"** → **"API Key"**
4. 选择 **"Browser key"**
5. 配置 Referrer 限制（同开发 Key）
6. 创建 Key

新 Key 格式：`AIzaSy...` (复制备用)

### 📋 步骤 2: 更新应用配置

**React 项目**:
```typescript
// src/config/firebase.ts
export const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSy...", // ← 新 Key
  authDomain: "dental-clinic-demo-ce94b.firebaseapp.com",
  projectId: "dental-clinic-demo-ce94b",
  // ... 其他配置
};
```

**更新 .env.local**:
```
VITE_FIREBASE_API_KEY=AIzaSy...新key...
```

### 📋 步骤 3: 在生产环境部署新 Key

```bash
# 部署到 Firebase Hosting
firebase deploy
```

### 📋 步骤 4: 监控和验证

部署后 5-10 分钟，监控：
1. ✅ 登录是否正常
2. ✅ Firestore 查询是否正常
3. ✅ 没有 403 错误
4. ✅ 没有新的网络错误

### 📋 步骤 5: 禁用旧 Key

等待 24 小时确保没有问题后：

1. 进入 Google Cloud Console
2. 找到旧 API Key
3. 点击"删除"（或先点"禁用"测试）
4. 确认删除

### ⚠️ 回滚计划

如果新 Key 出问题：

1. **立即**：恢复代码使用旧 Key
2. **重新部署**：
   ```bash
   git revert <commit-with-new-key>
   firebase deploy
   ```
3. **检查问题**：为什么新 Key 不工作？
4. **修复后重试**

---

## 常见问题 (FAQ)

### Q1: API Key 泄露了怎么办？

**A**:
1. 不用慌张，这是预期的（Key 是公开的）
2. 立即启用 HTTP Referrer 限制
3. 启用 API 级别限制
4. 监控使用异常（Google Cloud Console）
5. 如果有异常使用，删除 Key 并生成新的

### Q2: 为什么我的 localhost 有不同的端口？

**A**: Vite 开发服务器可能使用：
- 5173（默认）
- 5174（如果 5173 被占用）
- 其他（如果多个被占用）

**解决方案**：使用 `*` 通配符允许所有端口
```
http://localhost:*/*
```

### Q3: 生产环境需要不同的 Key 吗？

**A**: 不需要，但建议：
- 使用相同的 Key（简化管理）
- 但配置不同的 Referrer 限制（开发 vs 生产）
- 或使用完全不同的 Key（更高安全性）

### Q4: Key 会过期吗？

**A**: 不会，Firebase API Keys 永不过期。但建议定期轮换：
- 开发环境：每 3 个月
- 生产环境：每 6 个月

### Q5: 我能在移动应用中使用同一个 Key 吗？

**A**: 不建议，应该：
1. 为 iOS 生成单独的 Key
2. 为 Android 生成单独的 Key
3. 为 Web 生成单独的 Key

每个 Key 都有不同的 Referrer 限制。

---

## 相关资源

- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Security Rules](FIREBASE-CONFIGURATION-GUIDE.md)
- [Firebase 故障排除](FIREBASE-TROUBLESHOOTING-GUIDE.md)

---

**版本**: 1.0
**最后更新**: 2025-11-20
**维护者**: Claude Code
