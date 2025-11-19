# 如何设置 Firebase Custom Claims

我已经为你准备好了脚本，只需要3个步骤！

---

## 📋 步骤1: 下载 Service Account Key（5分钟）

### 1.1 访问 Firebase Console
```
https://console.firebase.google.com/project/dental-clinic-demo-ce94b/settings/serviceaccounts/adminsdk
```

### 1.2 生成新的私钥
1. 点击页面中的 **"Generate new private key"** 按钮
2. 会弹出确认对话框，点击 **"Generate key"**
3. 会自动下载一个 JSON 文件（类似 `dental-clinic-demo-ce94b-firebase-adminsdk-xxxxx.json`）

### 1.3 重命名并移动文件
```bash
# 将下载的文件重命名为 firebase-service-account.json
# 并放到项目根目录
```

**重要**: 确保这个文件的路径是：
```
dental-clinic-system/firebase-service-account.json
```

⚠️ **安全提醒**: 这个文件包含敏感信息，不要提交到Git！
（我已经在脚本中帮你添加到 .gitignore 了）

---

## 📋 步骤2: 安装依赖并运行脚本（2分钟）

### 2.1 安装 firebase-admin
```bash
cd scripts
npm install
```

### 2.2 运行脚本
```bash
npm run set-claims
```

或者直接：
```bash
node set-custom-claims.js
```

你应该看到类似这样的输出：
```
🚀 开始设置 Custom Claims...

✅ manager1@firstavedental.com
   UID: S8dYx5E7rXe2oEWMzzA4unEglAi1
   Role: owner
   Clinics: arcadia, irvine, south-pasadena, rowland-heights, eastvale

✅ manager3@firstavedental.com
   UID: 4dF1sX8D6vXOM3bjmv9IqjyNF1f2
   Role: admin
   Clinics: south-pasadena

🎉 Custom Claims 设置完成！
```

---

## 📋 步骤3: 用户重新登录（1分钟）

Custom Claims设置完成后，**用户必须重新登录**才能获取新的claims。

### 方法1: 退出并重新登录
1. 在应用中点击"退出登录"
2. 重新登录

### 方法2: 强制刷新Token（如果不想退出）
在浏览器Console运行：
```javascript
firebase.auth().currentUser.getIdToken(true).then(() => {
  console.log('✅ Token已刷新，刷新页面即可');
  location.reload();
});
```

---

## 🔍 验证是否成功

重新登录后，再次访问测试页面：
```
测试Firestore数据读取.html
```

登录后应该看到：
```
✅ 登录成功！
用户: manager1@firstavedental.com
UID: S8dYx5E7rXe2oEWMzzA4unEglAi1
Role (从claims): owner  ✅ (不再是"未设置")
Clinics (从claims): ["arcadia","irvine","south-pasadena","rowland-heights","eastvale"]  ✅
```

---

## 📝 自定义用户配置

如果你想为其他用户设置claims，编辑 `scripts/set-custom-claims.js`：

```javascript
const users = [
  {
    email: 'your-admin@firstavedental.com',
    role: 'owner',  // 'owner' | 'admin' | 'customer'
    clinics: ['arcadia', 'irvine', ...]  // 可访问的诊所
  },
  {
    email: 'another-admin@firstavedental.com',
    role: 'admin',
    clinics: ['arcadia']  // admin只能访问指定的诊所
  },
  // 添加更多用户...
];
```

然后重新运行：
```bash
npm run set-claims
```

---

## ⚠️ 常见问题

### Q: 脚本报错 "Cannot find module 'firebase-admin'"
**A**: 进入 scripts 目录运行 `npm install`

### Q: 脚本报错 "Cannot find module '../firebase-service-account.json'"
**A**: 确保Service Account Key文件在正确的位置：
```
dental-clinic-system/firebase-service-account.json
```

### Q: 设置了claims但还是显示"未设置"
**A**: 用户需要**重新登录**！Custom Claims存储在JWT token中，只有重新登录才会获取新token。

### Q: 怎么删除某个用户的claims？
**A**: 设置为null即可：
```javascript
await admin.auth().setCustomUserClaims(uid, null);
```

---

## 🎯 完整流程总结

```
1. 下载 Service Account Key
   ↓
2. 重命名为 firebase-service-account.json
   ↓
3. 放到项目根目录
   ↓
4. cd scripts && npm install
   ↓
5. npm run set-claims
   ↓
6. 用户重新登录
   ↓
7. ✅ Claims生效！
```

预计总时间：**10分钟**

---

**准备好了吗？从步骤1开始吧！如果遇到任何问题随时告诉我。**
