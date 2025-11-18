# Firebase API Key 403 错误 - 详细检查清单

## 🔍 问题
API Key: `AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c`
错误: 403 Forbidden when accessing Identity Toolkit API

## ✅ 需要检查的具体设置

### 1. Google Cloud Console - API Key 设置

访问: https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b

找到 API Key: `AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c`

点击编辑（铅笔图标），检查以下设置：

#### A. Application restrictions（应用限制）
**应该设置为以下之一：**

**选项1：开发阶段（推荐）**
```
○ None
```

**选项2：生产环境**
```
● HTTP referrers (web sites)

Accept requests from these HTTP referrers:
http://localhost/*
http://localhost:*/*
http://127.0.0.1:*/*
https://yourdomain.com/*
https://*.firebaseapp.com/*
https://*.web.app/*
```

#### B. API restrictions（API 限制）⚠️ 这个最关键！
**必须确保以下设置：**

**选项1：开发阶段（强烈推荐先试这个）**
```
○ Don't restrict key
```

**选项2：如果必须限制（生产环境）**
```
● Restrict key

必须勾选以下 API：
☑ Cloud Firestore API
☑ Identity Toolkit API ⚠️ 这个最重要！
☑ Token Service API
☑ Cloud Storage for Firebase API
☑ Firebase Installations API
```

### 2. 确认 Identity Toolkit API 已启用

访问: https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=dental-clinic-demo-ce94b

**检查：**
- 页面应该显示 "API enabled" 和绿色的 ✓
- 如果显示 "ENABLE" 按钮，点击启用

### 3. 确认 API 配额没有超限

访问: https://console.cloud.google.com/apis/api/identitytoolkit.googleapis.com/quotas?project=dental-clinic-demo-ce94b

**检查：**
- "Requests per day" 配额
- 是否有超限警告

### 4. 检查账单状态

访问: https://console.cloud.google.com/billing/linkedaccount?project=dental-clinic-demo-ce94b

**确认：**
- 项目已关联到账单账户
- 账单账户状态正常（没有欠费）

## 🎯 最可能的原因

基于 403 错误，**最可能的原因是 API restrictions**：

如果你设置了 "Restrict key" 但**没有勾选 "Identity Toolkit API"**，就会出现这个错误。

## 🔧 立即修复步骤

1. **打开 API Key 编辑页面：**
   https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b

2. **找到你的 key，点击铅笔图标**

3. **滚动到 "API restrictions" 部分**

4. **暂时选择 "Don't restrict key"**

5. **点击 SAVE**

6. **等待 2-3 分钟让修改生效**

7. **清除浏览器缓存，重新测试**

## 🔍 验证步骤

修改后，在浏览器控制台运行：

```javascript
// 测试 API key 是否能访问 Identity Toolkit
fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c')
  .then(res => {
    console.log('Status:', res.status);
    if (res.status === 200) {
      console.log('✅ API Key 工作正常！');
    } else if (res.status === 403) {
      console.log('❌ 还是 403，检查 API restrictions');
    } else {
      console.log('⚠️ 其他状态:', res.status);
    }
    return res.json();
  })
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Error:', err));
```

## 📊 常见配置错误

| 配置 | 错误设置 | 正确设置 |
|------|---------|---------|
| API restrictions | Restrict key（但没勾选 Identity Toolkit） | Don't restrict key |
| Application restrictions | IP addresses（不适用于浏览器） | None 或 HTTP referrers |
| Identity Toolkit API | 未启用 | 已启用 |

## ⚠️ 重要提示

**403 vs 401 的区别：**
- 401 Unauthorized = API key 无效或格式错误
- **403 Forbidden = API key 有效，但没有权限访问这个 API** ⚠️

你看到的是 403，说明 key 本身是有效的，只是权限设置有问题。

## 🎯 下一步

请按照"立即修复步骤"操作，然后：

1. 截图 API Key 编辑页面的 "API restrictions" 部分
2. 运行验证脚本
3. 告诉我结果

---

**如果设置 "Don't restrict key" 后还是 403，那可能是：**
1. Identity Toolkit API 未启用
2. 账单问题
3. API 配额超限
4. 项目级别的 IAM 权限问题
