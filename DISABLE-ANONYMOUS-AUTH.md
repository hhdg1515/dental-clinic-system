# 禁用匿名认证指南

## ⚠️ CRITICAL #7 修复

匿名认证允许任何人无需凭证即可访问内网系统,这是一个严重的安全漏洞。

---

## 🔒 已完成的代码修复

✅ 已删除以下文件:
- `内网/firebase-auth-setup.js`
- `外网-react/public/内网/firebase-auth-setup.js`

这些文件包含了不安全的匿名认证功能。

---

## 📋 在 Firebase Console 中禁用匿名认证

### 步骤 1: 访问 Firebase Authentication 设置

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目: `dental-clinic-demo-ce94b`
3. 左侧菜单选择 **Authentication**
4. 点击 **Sign-in method** 标签

### 步骤 2: 禁用匿名认证

1. 在 Sign-in providers 列表中找到 **Anonymous**
2. 如果状态显示为 "Enabled" (已启用):
   - 点击 Anonymous 行
   - 点击右上角的 **Disable** 按钮
   - 确认禁用

3. 确认状态变为 "Disabled" (已禁用)

---

## ✅ 验证匿名认证已禁用

### 测试 1: 尝试匿名登录 (应该失败)

在浏览器控制台运行:

```javascript
const { signInAnonymously } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js');

try {
  const result = await signInAnonymously(window.firebase.auth);
  console.error('❌ Anonymous auth still enabled!', result);
} catch (error) {
  console.log('✅ Anonymous auth properly disabled:', error.message);
  // 应该看到: "auth/operation-not-allowed" 错误
}
```

### 测试 2: 检查 Security Rules

匿名用户不应该有任何数据访问权限。在 Firebase Console 的 Rules Playground 测试:

```javascript
// 应该 DENY
Service: Cloud Firestore
Location: /appointments/any_id
Auth: Unauthenticated
Operation: get
```

---

## 🔐 内网认证策略

内网管理系统应该只允许以下认证方式:

### 推荐的认证方式:

#### 1. Email/Password (当前使用)

内网应该要求管理员使用 email/password 登录:

```javascript
// 在内网 dashboard 中
import { signInWithEmailAndPassword } from 'firebase/auth';

async function loginAdmin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 验证用户角色
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    if (userData.role !== 'owner' && userData.role !== 'admin') {
      await signOut(auth);
      throw new Error('Access denied - admin access required');
    }

    return userCredential;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

#### 2. Google OAuth (推荐添加)

为了更好的安全性和用户体验,可以启用 Google OAuth:

**在 Firebase Console 中启用**:
1. Authentication > Sign-in method
2. 点击 Google
3. 点击 Enable
4. 设置 Project support email
5. 保存

**限制到公司域名** (可选):
```javascript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  hd: 'firstavedental.com'  // 只允许公司域名
});

async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  // 验证用户角色...
}
```

---

## 🚫 不允许的认证方式

### ❌ 匿名认证 (已禁用)

- 无法追踪用户身份
- 无法实施访问控制
- 违反 HIPAA 合规要求

### ❌ 客户端角色检查

不要依赖客户端代码来验证管理员权限:

```javascript
// ❌ 不安全 - 客户端检查可以被绕过
if (localStorage.getItem('isAdmin') === 'true') {
  showAdminPanel();
}

// ✅ 安全 - 服务器端验证
const userData = await getDoc(doc(db, 'users', auth.currentUser.uid));
if (userData.data().role === 'admin') {
  showAdminPanel();
}
```

---

## 📝 内网访问控制检查清单

确保内网系统实施以下安全措施:

### Authentication (认证)

- [ ] 禁用 Firebase 匿名认证
- [ ] 删除了 `firebase-auth-setup.js` 文件
- [ ] 要求 email/password 或 Google OAuth 登录
- [ ] 实施会话超时(建议 1-2 小时)
- [ ] 启用 MFA (多因素认证) - 可选但推荐

### Authorization (授权)

- [ ] 验证用户角色 (owner/admin) 后才允许访问
- [ ] 使用 Firebase Security Rules 进行服务器端验证
- [ ] 实施基于诊所的访问控制 (admin 只能访问自己的诊所)
- [ ] 不依赖客户端代码进行权限检查

### Audit (审计)

- [ ] 记录所有登录尝试
- [ ] 记录所有数据修改操作
- [ ] 记录管理员访问敏感数据的行为
- [ ] 定期审查访问日志

---

## 🔄 迁移现有匿名用户 (如果有)

如果已经有匿名用户在系统中:

### 查找匿名用户

在 Firebase Console:
1. Authentication > Users
2. 查找 "Provider" 列显示为 "Anonymous" 的用户
3. 或者使用 Firebase Admin SDK:

```javascript
// 在服务器端运行
const listAllUsers = async () => {
  const listUsersResult = await admin.auth().listUsers();
  const anonymousUsers = listUsersResult.users.filter(user =>
    user.providerData.length === 0
  );
  console.log('Anonymous users:', anonymousUsers.length);
  return anonymousUsers;
};
```

### 删除匿名用户

⚠️ **警告**: 删除用户会同时删除其关联数据

```bash
# 使用 Firebase CLI
firebase auth:export users.json
# 手动筛选匿名用户
# 然后删除他们的 Firestore 数据
```

或者在 Firebase Console 手动删除:
1. Authentication > Users
2. 选择匿名用户
3. 点击 "Delete user"

---

## ✅ 完成检查清单

- [ ] 在 Firebase Console 禁用了匿名认证
- [ ] 删除了匿名认证代码文件
- [ ] 验证了匿名登录尝试会失败
- [ ] 内网要求真实认证 (email/password 或 OAuth)
- [ ] 实施了角色验证 (owner/admin)
- [ ] 清理了现有的匿名用户 (如果有)
- [ ] 更新了 Firebase Security Rules (在 CRITICAL #1 中完成)
- [ ] 测试了内网登录流程

---

## 📞 需要帮助?

如果内网登录出现问题:

1. 检查 Firebase Console 中启用的认证方式
2. 确认用户在 Firestore `users` 集合中有正确的 `role` 字段
3. 检查浏览器控制台的错误信息
4. 验证 Firebase Security Rules 允许认证用户访问
