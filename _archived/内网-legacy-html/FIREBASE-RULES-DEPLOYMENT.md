# Firebase Security Rules 部署指南

## ⚠️ 重要提示

这是 **CRITICAL #1** 安全漏洞的修复。当前的 Firebase 规则允许任何认证用户访问所有数据，必须立即更新。

## 📋 部署步骤

### 1. 备份当前规则

在 Firebase Console 中备份当前规则（以防需要回滚）：

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目: `dental-clinic-demo-ce94b`
3. 左侧菜单选择 **Firestore Database**
4. 点击 **Rules** 标签
5. 复制当前规则并保存到本地文件

### 2. 部署新的安全规则

#### 选项 A: 通过 Firebase Console (推荐)

1. 打开 `firebase-rules-secure.txt` 文件
2. 复制全部内容
3. 在 Firebase Console 的 Rules 标签中
4. 粘贴新规则
5. 点击 **Publish** 发布规则

#### 选项 B: 通过 Firebase CLI

```bash
# 1. 安装 Firebase CLI (如果还没安装)
npm install -g firebase-tools

# 2. 登录 Firebase
firebase login

# 3. 初始化项目 (如果还没初始化)
firebase init firestore

# 4. 将 firebase-rules-secure.txt 复制到 firestore.rules
cp 内网/firebase-rules-secure.txt firestore.rules

# 5. 部署规则
firebase deploy --only firestore:rules
```

### 3. 测试新规则

部署后，在 Firebase Console 的 Rules 标签中使用 **Rules Playground** 测试：

#### 测试场景 1: 普通用户读取自己的预约
```javascript
// 应该 ALLOW
Service: Cloud Firestore
Location: /appointments/appointment_123
Auth:
  - Provider: Custom
  - UID: user_abc
  - Token: { "email": "customer@example.com" }
Operation: get
Data (resource):
  - userId: user_abc
  - clinicLocation: arcadia
```

#### 测试场景 2: 普通用户读取他人预约
```javascript
// 应该 DENY
Service: Cloud Firestore
Location: /appointments/appointment_123
Auth:
  - Provider: Custom
  - UID: user_xyz
  - Token: { "email": "hacker@example.com" }
Operation: get
Data (resource):
  - userId: user_abc  // 不是自己的
  - clinicLocation: arcadia
```

#### 测试场景 3: Admin 读取自己诊所的预约
```javascript
// 应该 ALLOW
Service: Cloud Firestore
Location: /appointments/appointment_123
Auth:
  - Provider: Custom
  - UID: admin_user
  - Token: { "email": "manager1@firstavedental.com" }
Operation: get
Data (resource):
  - userId: customer_123
  - clinicLocation: arcadia

Data (users/admin_user):
  - role: admin
  - clinics: ['arcadia']
```

#### 测试场景 4: Admin 读取其他诊所的预约
```javascript
// 应该 DENY
Service: Cloud Firestore
Location: /appointments/appointment_123
Auth:
  - Provider: Custom
  - UID: admin_user
  - Token: { "email": "manager1@firstavedental.com" }
Operation: get
Data (resource):
  - userId: customer_123
  - clinicLocation: irvine  // 不是 admin 的诊所

Data (users/admin_user):
  - role: admin
  - clinics: ['arcadia']  // 只有 arcadia 权限
```

### 4. 验证规则生效

部署后，使用以下脚本验证规则是否正确工作：

```javascript
// 在浏览器控制台运行
const testSecurityRules = async () => {
  const db = getFirestore();

  try {
    // 尝试获取所有预约 (应该失败)
    const allAppointments = await getDocs(collection(db, 'appointments'));
    console.error('❌ Security rules NOT working - got all appointments');
  } catch (error) {
    console.log('✅ Security rules working - cannot get all appointments');
  }

  try {
    // 尝试获取自己的预约 (应该成功)
    const myQuery = query(
      collection(db, 'appointments'),
      where('userId', '==', auth.currentUser.uid)
    );
    const myAppointments = await getDocs(myQuery);
    console.log('✅ Can access own appointments:', myAppointments.size);
  } catch (error) {
    console.error('❌ Cannot access own appointments:', error);
  }
};

testSecurityRules();
```

## 🔒 新规则的关键安全特性

### 1. 基于角色的访问控制 (RBAC)

- **Owner**: 可以访问所有诊所的所有数据
- **Admin**: 只能访问被分配的诊所数据
- **Customer**: 只能访问自己创建的预约

### 2. 防止权限提升

- 用户不能修改自己的 `role` 和 `clinics` 字段
- 所有角色检查都通过服务器端数据 (`getUserData()`)

### 3. 数据完整性保护

- 必须包含必填字段 (`userId`, `clinicLocation`, `patientName`, `patientPhone`)
- 诊所位置必须是有效值
- 不能修改预约的 `userId` (所有者)

### 4. 患者隐私保护 (HIPAA)

- 患者档案只能被患者本人或授权管理员访问
- 医疗记录只有管理员可以访问
- 审计日志不可修改或删除

### 5. 默认拒绝

- 所有未明确允许的操作都会被拒绝
- 包括未定义的集合

## ⚠️ 部署后必须修复的问题

部署这些规则后，你还需要修复以下代码问题才能让应用正常工作：

### 问题 1: 客户端角色分配 (CRITICAL #3)

当前代码在客户端设置角色，这不安全。你需要：

1. 使用 Firebase Admin SDK 设置 Custom Claims (在后端)
2. 或者确保 Firestore `users` 集合中的角色字段在用户注册时由受信任的流程设置

### 问题 2: 查询需要添加过滤条件

当前代码可能使用类似这样的查询：
```javascript
// ❌ 不再工作 - 会被规则拒绝
const allAppointments = await getDocs(collection(db, 'appointments'));
```

需要修改为：
```javascript
// ✅ 添加用户过滤
const myAppointments = await getDocs(
  query(collection(db, 'appointments'), where('userId', '==', currentUser.uid))
);
```

## 📞 需要帮助?

如果部署过程中遇到问题：

1. 检查 Firebase Console 中的错误日志
2. 使用 Rules Playground 调试具体的访问场景
3. 查看浏览器控制台的错误信息
4. 确保用户数据包含正确的 `role` 和 `clinics` 字段

## ✅ 完成检查清单

- [ ] 备份了当前的 Firebase 规则
- [ ] 在 Firebase Console 中部署了新规则
- [ ] 使用 Rules Playground 测试了各种场景
- [ ] 验证了规则在生产环境中生效
- [ ] 修复了应用代码中的查询逻辑
- [ ] 实施了 Custom Claims 或安全的角色管理
