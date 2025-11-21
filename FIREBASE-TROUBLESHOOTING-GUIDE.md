# Firebase 故障排除完整指南

**最后更新**: 2025-11-20

---

## 📋 目录

1. [快速排查](#快速排查)
2. [认证相关问题](#认证相关问题)
3. [Firestore 权限问题](#firestore-权限问题)
4. [网络连接问题](#网络连接问题)
5. [存储相关问题](#存储相关问题)
6. [性能问题](#性能问题)

---

## 快速排查

### 🚨 遇到错误时的第一步

1. **打开浏览器控制台** (F12)
2. **查看完整错误信息** (不要只看错误代码)
3. **复制完整错误堆栈跟踪**
4. **搜索本指南** 或 [Firebase 官方文档](https://firebase.google.com/docs)

### 🔍 错误类型速查表

| 错误开头 | 可能的原因 | 跳转到 |
|---------|---------|--------|
| `auth/` | 认证相关 | [认证问题](#认证相关问题) |
| `firestore/` | Firestore 相关 | [Firestore 问题](#firestore-权限问题) |
| `storage/` | Storage 相关 | [存储问题](#存储相关问题) |
| `network-request-failed` | 网络问题 | [网络问题](#网络连接问题) |
| `permission-denied` | 权限问题 | [权限问题](#firestore-权限问题) |

---

## 认证相关问题

### ❌ `auth/invalid-email`

**含义**: 邮箱格式不正确

**原因**:
- 邮箱缺少 `@` 符号
- 邮箱格式不符合标准

**解决方案**:
```javascript
// ❌ 错误
await signInWithEmailAndPassword(auth, "testexample.com", "password");

// ✅ 正确
await signInWithEmailAndPassword(auth, "test@example.com", "password");
```

---

### ❌ `auth/wrong-password`

**含义**: 密码错误

**可能的原因**:
- 密码输入错误
- Caps Lock 键被激活
- 复制粘贴时包含了空格

**解决方案**:
1. 确认密码正确
2. 关闭 Caps Lock
3. 检查是否有额外的空格
4. 如果忘记密码，点击"忘记密码"重置

---

### ❌ `auth/user-not-found`

**含义**: 该邮箱对应的用户不存在

**可能的原因**:
- 邮箱从未注册过
- 邮箱有拼写错误
- 用户被删除

**解决方案**:
1. 检查邮箱拼写
2. 确认是否已注册
3. 如果需要，点击"创建账户"注册

---

### ❌ `auth/too-many-requests`

**含义**: 登录尝试过于频繁，账户已被暂时锁定

**可能的原因**:
- 暴力破解尝试
- 客户端实现了速率限制

**解决方案**:
1. **等待 15-30 分钟** (锁定会自动解除)
2. 确认邮箱和密码是否正确
3. 如果是合法用户，应该看到友好的错误提示

**代码示例**（客户端速率限制）:
```typescript
// 在 auth.ts 中实现的速率限制
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 分钟

// 用户看到的提示
catch (error) {
  if (error.code === 'auth/too-many-requests') {
    const remainingTime = getLockedOutMinutes(email);
    alert(`账户已被锁定。请在 ${remainingTime} 分钟后重试。`);
  }
}
```

---

### ❌ `auth/requests-from-referer-{YOUR-DOMAIN}-are-blocked`

**含义**: 当前域名/localhost 在 Firebase API Key 的 Referrer 限制列表中

**可能的原因**:
- 你的 localhost 端口不在允许列表中
- API Key 配置太严格

**快速解决方案**:

1. 进入 [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b)
2. 编辑 API Key 的 "Application restrictions"
3. 在 "Website restrictions" 中添加：
   ```
   http://localhost:*/*
   http://127.0.0.1:*/*
   ```
4. 保存并等待 1-2 分钟
5. 刷新浏览器重试

**详细指南**: 见 [API-KEY-SETUP-COMPLETE-GUIDE.md](API-KEY-SETUP-COMPLETE-GUIDE.md)

---

### ❌ `auth/network-request-failed`

**含义**: 无法连接到 Firebase 认证服务

**这通常是网络问题，见 [网络连接问题](#网络连接问题) 部分**

---

### ❌ `auth/weak-password`

**含义**: 密码过于简单

**Firebase 的最低要求**: 密码长度至少 6 个字符

**解决方案**:
```javascript
// ❌ 太短
await createUserWithEmailAndPassword(auth, "test@example.com", "123");

// ✅ 合适的长度
await createUserWithEmailAndPassword(auth, "test@example.com", "secure-password");
```

**建议**: 使用 8+ 个字符的强密码，混合大小写和特殊符号

---

## Firestore 权限问题

### ❌ `missing or insufficient permissions`

**含义**: Security Rules 拒绝了你的请求

**最常见的原因**:

#### 原因 1: 规则要求身份验证但用户未登录

```javascript
// 规则
allow read: if request.auth != null;

// 用户未登录时报错
```

**解决方案**: 确保在访问 Firestore 前已登录

```typescript
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  if (user) {
    // 用户已登录，现在可以安全地访问 Firestore
  } else {
    // 用户未登录，显示登录页面
  }
});
```

#### 原因 2: 规则检查诊所访问权限，但用户不在权限列表中

```javascript
// 规则
match /appointments/{appointmentId} {
  allow read: if hasClinicAccess(resource.data.clinicLocation, request.auth.uid);
}

// 如果用户的 userConfig 中没有对应的 clinic，就会被拒绝
```

**解决方案**: 检查用户的 `userConfig` 文档

1. 进入 Firebase Console
2. Firestore → Collections → `userConfig` → 找到你的用户 ID
3. 检查 `clinics` 字段是否包含你要访问的诊所
4. 如需修改，联系 Owner/Boss 用户

**示例**:
```javascript
// 正确的 userConfig 文档
{
  "uid": "user-123",
  "email": "admin@example.com",
  "role": "admin",  // ← 必须是 admin/boss/owner
  "clinics": ["rowland-heights", "downtown"],  // ← 必须包含要访问的诊所
  "lastLogin": "2025-11-20T10:00:00Z"
}
```

#### 原因 3: 规则限制了可以修改的字段

```javascript
// 规则：不允许修改 role 和 clinics
allow update: if request.auth.uid == userId && (
  request.resource.data.role == resource.data.role &&
  request.resource.data.clinics == resource.data.clinics
);

// 即使你尝试修改其他字段，这个规则也会阻止
```

**解决方案**: 检查规则是否真的允许你要做的操作

---

### ❌ `PERMISSION_DENIED: Missing or insufficient permissions`

**与上面的错误类似，但通常来自异步操作**

**排查方法**:

1. **打开 Chrome DevTools** → **Application** → **Local Storage**
2. 搜索 Firebase 相关信息
3. 检查 `currentUser` 是否存在
4. 如果 `currentUser` 为 null，说明用户未登录

```javascript
// 调试代码
import { auth } from './firebase';

auth.onAuthStateChanged((user) => {
  console.log('当前用户:', user);
  if (user) {
    console.log('用户 ID:', user.uid);
    console.log('邮箱:', user.email);
  } else {
    console.log('用户未登录');
  }
});
```

---

### ❌ `INVALID_ARGUMENT: One of the specified indexes is not found`

**含义**: 查询需要一个复合索引，但它不存在

**可能的原因**:
- 你的查询涉及多个字段和排序
- Firestore 自动建议创建索引，但还未创建

**解决方案**:

1. **自动创建**: 根据控制台中的错误链接，点击创建索引
2. **或手动创建**:
   - Firebase Console → Firestore → Indexes
   - 点击 "Create Index"
   - 填写集合名、字段和排序方式
   - 创建索引（通常需要几分钟）

**常见需要索引的查询**:
```typescript
// 这个查询需要索引
db.collection('appointments')
  .where('clinicLocation', '==', 'rowland-heights')
  .where('date', '>=', today)
  .orderBy('date', 'asc')
  .orderBy('time', 'asc');
```

---

## 网络连接问题

### ❌ `auth/network-request-failed`

**含义**: 无法连接到 Firebase 服务

**最可能的原因（按概率排序）**:

#### 1️⃣ 防火墙阻止 (60% 概率)

**可能的防火墙**:
- Windows Defender 防火墙
- 公司/学校网络防火墙
- 家庭 WiFi 路由器防火墙
- ISP 级别的防火墙

**诊断方法**:

```bash
# 在 PowerShell 中运行
ping firebase.google.com
ping identitytoolkit.googleapis.com
```

**如果显示 "Request timed out" → 网络被阻止**

**解决方案**:

**Windows 防火墙**:
```
1. 控制面板 → Windows Defender 防火墙
2. 高级设置 → 出站规则
3. 新建规则
4. 允许 chrome.exe 或 node.exe
```

**路由器防火墙**:
- 进入路由器管理界面 (通常 192.168.1.1)
- 找到防火墙设置
- 临时关闭或添加允许规则

---

#### 2️⃣ 地理位置限制 (20% 概率)

**中国大陆**:
- Firebase 被 GFW 阻止
- 需要使用 VPN 或科学上网工具

**诊断**:
```bash
# 尝试直接访问 Firebase
curl -I https://firebase.google.com

# 如果显示 timeout，可能是被墙
```

**解决方案**:
- 使用 VPN 或代理
- 或使用本地 Firebase 模拟器进行开发

---

#### 3️⃣ 浏览器扩展干扰 (10% 概率)

**常见干扰的扩展**:
- AdBlock / AdBlock Plus
- uBlock Origin
- Ghostery
- Privacy Badger

**诊断**:
1. 打开浏览器隐身模式 (Ctrl + Shift + N)
2. 在隐身模式中尝试登录
3. 如果隐身模式成功，问题就是扩展

**解决方案**:
- 临时禁用可疑扩展
- 或将 localhost 加入扩展的白名单

---

#### 4️⃣ DNS 问题 (5% 概率)

**症状**:
- 其他网站正常，但无法连接 Firebase
- DNS 查询超时

**解决方案 1: 更换 DNS**

```bash
# Windows：打开网络设置
# 网络和 Internet → 更改适配器选项
# 编辑 DNS 服务器地址

# 推荐使用 Google DNS:
首选: 8.8.8.8
备用: 8.8.4.4

# 清除 DNS 缓存
ipconfig /flushdns
```

**解决方案 2: 在 hosts 文件中手动指定**

```bash
# Windows: 编辑 C:\Windows\System32\drivers\etc\hosts
# 添加
142.251.41.1   firebase.google.com
142.251.41.1   identitytoolkit.googleapis.com
```

---

### ✅ 网络连接诊断清单

按顺序检查：

```
□ 能访问其他网站吗？(如 google.com)
□ 能 ping firebase.google.com 吗？
□ 在浏览器直接访问 https://firebase.google.com 能打开吗？
□ 浏览器控制台中有 CORS 错误吗？
□ 使用隐身模式能连接吗？
□ 尝试其他浏览器能连接吗？
□ 尝试其他网络（如移动热点）能连接吗？
□ 防火墙是否完全关闭过？
□ 在中国大陆吗？(需要 VPN)
□ 使用 VPN 后能连接吗？
```

---

## 存储相关问题

### ❌ `storage/unauthorized`

**含义**: Storage Rules 拒绝了上传/下载

**可能的原因**:
- 用户未登录
- Storage Rules 过于严格
- 文件路径不正确

**解决方案**:

1. 确保用户已登录
2. 检查 Storage Rules （Firebase Console → Storage → Rules）
3. 检查文件上传路径是否与规则匹配

**规则示例**:
```javascript
// 正确：允许认证用户在自己的文件夹上传
match /patientPhotos/{userId}/{allPaths=**} {
  allow write: if request.auth.uid == userId;
}

// 错误：这会拒绝所有写入
match /patientPhotos/{userId}/{allPaths=**} {
  allow write: if false;
}
```

---

### ❌ `storage/object-not-found`

**含义**: 文件不存在

**解决方案**:
1. 检查文件路径是否正确
2. 确认文件是否已上传
3. 检查文件是否被删除

---

## 性能问题

### 🐌 查询缓慢

**可能的原因**:
1. 查询没有适当的索引
2. 查询过于复杂
3. 集合数据过多

**解决方案**:

1. **添加索引** (见上文 `INVALID_ARGUMENT` 部分)
2. **简化查询**:
   ```typescript
   // ❌ 复杂
   db.collection('appointments')
     .where('clinicLocation', '==', clinic)
     .where('status', '==', 'confirmed')
     .where('date', '>=', today)
     .where('date', '<=', tomorrow)
     .orderBy('date')
     .orderBy('time');

   // ✅ 更简单
   db.collection('appointments')
     .where('clinicLocation', '==', clinic)
     .where('dateKey', '==', today) // 使用单个日期字段
     .orderBy('time');
   ```
3. **分页**:
   ```typescript
   // 只加载前 10 条
   query.limit(10)
   ```

---

### 💰 成本过高

**可能的原因**:
- 实时监听过多
- 查询过于频繁
- 索引过多

**解决方案**:

1. **减少实时监听**:
   ```typescript
   // ❌ 不好：监听每个用户的所有预约
   onSnapshot(
     query(collection(db, 'appointments'), where('userId', '==', userId)),
     (snapshot) => { /* update */ }
   );

   // ✅ 好：只在需要时查询
   const appointments = await getDocs(query(...));
   ```

2. **批量操作**:
   ```typescript
   // ❌ 10 次写入操作
   for (let i = 0; i < 10; i++) {
     await updateDoc(...);
   }

   // ✅ 1 次批量写入操作
   const batch = writeBatch(db);
   for (let i = 0; i < 10; i++) {
     batch.update(...);
   }
   await batch.commit();
   ```

3. **使用缓存**:
   ```typescript
   // 缓存结果，避免重复查询
   const cachedData = cache.get(key);
   if (cachedData) return cachedData;

   const data = await getDocs(query(...));
   cache.set(key, data);
   return data;
   ```

---

## 相关资源

- [Firebase 官方文档](https://firebase.google.com/docs)
- [Firebase 错误代码参考](https://firebase.google.com/docs/auth/manage-users#flutter_1)
- [API Key 配置指南](API-KEY-SETUP-COMPLETE-GUIDE.md)
- [Firebase 完整配置指南](FIREBASE-CONFIGURATION-GUIDE.md)

---

**版本**: 1.0
**最后更新**: 2025-11-20
**维护者**: Claude Code
