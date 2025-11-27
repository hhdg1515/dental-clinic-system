# 部署 Chart History 权限规则

**日期：** 2025-11-27
**问题：** Chart History 快照功能报错 `Missing or insufficient permissions`
**原因：** Firestore 安全规则缺少对 `dentalChartSnapshots` 集合的访问权限

---

## 修复步骤

### 1️⃣ 已更新的规则文件

文件位置：`内网/firebase-rules-production.txt`

**新增规则：**
```javascript
// 牙科图表数据
match /dentalCharts/{userId} {
  allow read, write: if request.auth != null;
}

// 牙科图表快照 (Chart History)
match /dentalChartSnapshots/{snapshotId} {
  allow read, write: if request.auth != null;
}
```

### 2️⃣ 部署到 Firebase Console

#### 方法 1：通过 Firebase Console 网页（推荐）

1. **打开 Firebase Console**
   ```
   https://console.firebase.google.com/
   ```

2. **选择你的项目**
   - 找到你的牙科诊所项目

3. **进入 Firestore Database**
   - 左侧菜单 → Firestore Database

4. **打开规则编辑器**
   - 点击顶部 "Rules" 标签页

5. **复制新规则**
   - 打开文件：`内网/firebase-rules-production.txt`
   - 全选复制所有内容

6. **粘贴并发布**
   - 在 Firebase Console 中粘贴新规则
   - 点击 "Publish" 按钮
   - 等待部署完成（通常 10-30 秒）

#### 方法 2：通过 Firebase CLI（需要安装）

```bash
# 1. 安装 Firebase CLI（如果还没安装）
npm install -g firebase-tools

# 2. 登录 Firebase
firebase login

# 3. 初始化项目（如果还没初始化）
firebase init firestore

# 4. 复制规则文件
cp 内网/firebase-rules-production.txt firestore.rules

# 5. 部署规则
firebase deploy --only firestore:rules
```

---

## 3️⃣ 验证部署

### 测试步骤：

1. **刷新应用页面**
   - 按 `Ctrl + Shift + R` 强制刷新

2. **打开患者账户**
   - 选择任意患者（如 Liu Liu）

3. **进入 Chart History 标签**
   - 点击 "Chart History" 标签

4. **创建快照**
   - 点击 "Create Snapshot" 按钮
   - 输入描述（如："初诊基线"）
   - 点击确认

5. **查看结果**
   - ✅ 成功：看到通知 "✅ Snapshot created successfully"
   - ✅ 快照列表出现新创建的快照
   - ❌ 失败：仍然报错权限不足

### 调试检查：

如果仍然报错，检查以下内容：

1. **确认用户已登录**
   ```javascript
   // 在浏览器 Console 中运行
   console.log('Auth user:', firebase.auth().currentUser);
   ```

2. **确认规则已部署**
   - Firebase Console → Firestore → Rules
   - 查看是否包含 `dentalChartSnapshots` 规则

3. **检查 Console 错误**
   ```
   按 F12 → Console 标签
   查看详细错误信息
   ```

---

## 4️⃣ 完整的 Firestore 规则文件

**文件：** `内网/firebase-rules-production.txt`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允许认证用户读写自己的数据
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 预约数据：允许认证用户访问
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }

    // 嵌套预约数据（如果使用嵌套结构）
    match /appointments/{clinicId}/dates/{dateKey}/appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }

    match /appointments/{clinicId}/appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }

    // 取消的预约
    match /cancelledAppointments/{clinicId}/appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }

    // 待确认预约
    match /pendingConfirmations/{confirmationId} {
      allow read, write: if request.auth != null;
    }

    // 患者档案
    match /patientProfiles/{patientId} {
      allow read, write: if request.auth != null;
    }

    // 牙科图表数据
    match /dentalCharts/{userId} {
      allow read, write: if request.auth != null;
    }

    // 牙科图表快照 (Chart History)
    match /dentalChartSnapshots/{snapshotId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 5️⃣ 安全说明

### 当前权限级别：
- ✅ 要求用户登录认证 (`request.auth != null`)
- ⚠️ 所有认证用户可以访问所有快照数据

### 生产环境建议：

如果需要更严格的权限控制，可以修改规则：

```javascript
// 更严格的规则：只允许访问自己的快照
match /dentalChartSnapshots/{snapshotId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null &&
                   request.resource.data.userId == request.auth.uid;
  allow update, delete: if request.auth != null &&
                           resource.data.userId == request.auth.uid;
}
```

**但是**，因为你的系统是诊所管理系统，所有员工需要访问所有患者数据，所以当前规则是合适的。

---

## 6️⃣ 故障排查

### 问题：部署后仍然报错

**可能原因 1：浏览器缓存**
```bash
解决：Ctrl + Shift + R 强制刷新
```

**可能原因 2：规则未生效**
```bash
解决：等待 1-2 分钟，Firebase 规则传播需要时间
```

**可能原因 3：Firebase 项目配置错误**
```javascript
// 检查 firebase-config.js 中的项目 ID 是否正确
console.log('Firebase config:', firebase.app().options);
```

---

## 总结

**修改内容：**
- ✅ 更新了 `firebase-rules-production.txt`
- ✅ 添加了 `dentalCharts` 集合权限
- ✅ 添加了 `dentalChartSnapshots` 集合权限

**下一步：**
1. 按照上述步骤部署规则到 Firebase Console
2. 测试 Chart History 功能
3. 如果成功，即可正常使用快照功能

**预期结果：**
- ✅ 可以创建牙科图表快照
- ✅ 可以查看历史快照列表
- ✅ 可以对比不同快照
- ✅ 可以删除快照

---

*文档创建时间：2025-11-27*
*相关功能：Chart History (牙科图表版本控制)*
