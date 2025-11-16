# Firestore 规则 - 快速修复

## 问题
登录成功但无法读取预约、患者档案等数据，错误：`Missing or insufficient permissions`

## 根本原因
Firebase Console 中的 Firestore 规则限制了访问权限。用户认证成功但没有读取数据的权限。

---

## 快速修复 (开发/测试阶段)

### 临时规则 (完全许可)
用于快速诊断问题，**生产环境不要用**！

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 临时开发规则 - 允许所有认证用户读写
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 部署步骤

### Step 1: 打开 Firebase Console
```
1. https://console.firebase.google.com
2. 选择项目: dental-clinic-demo-ce94b
3. 左侧菜单 → Build → Firestore Database
4. 点击 "Rules" 标签页
```

### Step 2: 替换规则
```
1. 复制上面的 "临时规则" 代码
2. 粘贴到 Firebase Console 的规则编辑器中
3. 点击 "Publish" 按钮
4. 等待部署完成 (1-2分钟)
```

### Step 3: 在应用中测试
```
1. 刷新应用 (Ctrl+F5)
2. 再次尝试查看预约
3. 检查是否显示患者数据
```

### 预期结果
- ✅ 预约数据加载成功
- ✅ 患者历史显示
- ✅ 医疗记录显示
- ✅ 无权限错误

---

## 如果测试成功...

说明问题是规则权限配置，不是代码问题。

### 后续步骤
1. 分析用户数据中是否缺少 `role` 和 `clinics` 字段
2. 创建正确的 RBAC 规则
3. 确保所有用户都有正确的角色和诊所分配

---

## 如果测试失败...

如果即使用完全许可规则仍然失败，说明问题更深层：

1. 检查 Firestore 中是否有数据
2. 检查应用是否连接到正确的 Firebase 项目
3. 检查 Network 标签中的请求/响应

---

## 关键提示

⚠️ **不要在生产环境使用 `allow read, write: if request.auth != null` 这样的规则！**

应该使用更严格的规则来保护患者数据（HIPAA 合规）。

---

**状态**: 🔧 快速修复指南
**用途**: 诊断权限问题
**预计成功率**: 95%+ (如果问题是规则权限)
