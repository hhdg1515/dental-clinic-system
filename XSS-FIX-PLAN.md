# XSS 修复计划 (CRITICAL #4)

## 🎯 目标

替换所有不安全的 `innerHTML` 使用，防止 XSS 攻击。

---

## 📊 发现的问题文件

共 18 个文件使用 `innerHTML`，按优先级排序：

### 🔴 HIGH PRIORITY (用户输入直接显示)

1. **外网/ui-functions.js** - 15+ 处
   - 行 832: 预约摘要（包含患者姓名、电话等）
   - 行 961: 预约列表
   - 行 1210: 消息显示

2. **外网/chat-assistant.js** - 4处
   - 行 213, 222: 用户消息显示
   - 行 468: Chat widget HTML
   - 行 625: 聊天历史

3. **内网/js/dashboard.js** - 多处
   - 预约信息显示（患者姓名等）

4. **内网/js/patients.js** - 多处
   - 患者信息显示

5. **内网/js/appointments.js** - 多处
   - 预约详情显示

### 🟡 MEDIUM PRIORITY (静态内容为主)

6. **外网/landingpage.js**
   - 行 534: 诊所距离显示

7. **内网/js/shared.js**
8. **内网/js/service-mapping.js**
9. **内网/js/auth-check.js**

### 🟢 LOW PRIORITY (文档/模板)

10. **SECURITY-AUDIT-REPORT.md**
11. **外网-react/.github/pull_request_template.md**
12. **外网-react/docs/SECURITY.md**

---

## 🔧 修复策略

### 策略 A: 使用 `textContent` (最安全)

对于纯文本内容，使用 `textContent`:

```javascript
// ❌ 不安全
element.innerHTML = `<p>${userInput}</p>`;

// ✅ 安全
const p = document.createElement('p');
p.textContent = userInput;
element.appendChild(p);
```

### 策略 B: 使用 `escapeHtml()` 辅助函数

对于需要HTML结构的内容：

```javascript
import { escapeHtml } from './js/security-utils.js';

// ❌ 不安全
element.innerHTML = `<div class="card"><h3>${user.name}</h3></div>`;

// ✅ 安全
element.innerHTML = `<div class="card"><h3>${escapeHtml(user.name)}</h3></div>`;
```

### 策略 C: 使用 `createSafeElement()` 工厂函数

对于重复的模式：

```javascript
import { createAppointmentCard } from './js/security-utils.js';

// ❌ 不安全
container.innerHTML = appointments.map(apt => `
  <div><h3>${apt.patientName}</h3></div>
`).join('');

// ✅ 安全
appointments.forEach(apt => {
  const card = createAppointmentCard(apt);
  container.appendChild(card);
});
```

---

## 📝 修复清单

### Phase 2A: 外网关键文件 ✅ COMPLETED

- [x] ✅ 创建 `外网/js/security-utils.js`
- [x] ✅ 修复 `外网/ui-functions.js`
  - [x] 行 885-890: 预约滑块显示 🔴 HIGH
  - [x] 行 933-938: 单个预约卡片 🔴 HIGH
- [x] ✅ 修复 `外网/chat-assistant.js`
  - [x] 已验证安全 - 已有 escapeHtml 并正确使用 ✅
- [x] ✅ 修复 `外网/landingpage.js`
  - [x] 行 537-540: 诊所距离列表（已修复）

### Phase 2B: 内网关键文件 ✅ COMPLETED

- [x] ✅ 创建 `内网/js/security-utils.js`
- [x] ✅ 修复 `内网/js/dashboard.js` 🔴 HIGH (Phase 2 完成)
- [x] ✅ 修复 `内网/js/patients.js` 🔴 HIGH
  - [x] 行 467-472: 患者表格行
  - [x] 行 725-741: 预约历史卡片
  - [x] 行 782-795: 预约处理模态框
- [x] ✅ 修复 `内网/js/appointments.js` 🔴 HIGH + CRITICAL
  - [x] 行 1159-1181: 预约详情模态框
  - [x] 行 1891-1904: 处理模态框摘要
  - [x] 行 2704-2714: 处理模态框显示
  - [x] 行 3075-3084: 账户历史记录
  - [x] 行 3148-3185: **CRITICAL** 医疗记录按钮 (移除 inline onclick)
  - [x] 行 3275-3281: 治疗卡片

### Phase 2C: 其他文件 ✅ COMPLETED

- [x] ✅ `内网/js/shared.js` - 验证无用户输入的 innerHTML
- [x] ✅ `内网/js/service-mapping.js` - 低风险静态内容
- [x] ✅ `内网/js/auth-check.js` - 低风险静态内容

---

## 🧪 测试计划

修复后需要测试：

### XSS 测试向量

在以下输入字段测试这些payload:

```javascript
const xssTests = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(\'XSS\')">',
  '<svg onload="alert(\'XSS\')">',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')">',
  '"><script>alert("XSS")</script>',
  '\'"--><script>alert("XSS")</script>',
];
```

### 测试位置

1. **患者姓名输入**
2. **电话号码输入**
3. **预约备注**
4. **聊天消息**

### 预期行为

- ✅ Payload应该显示为普通文本
- ✅ 不应该执行任何JavaScript
- ✅ 页面不应该弹出alert对话框
- ✅ HTML标签应该被转义显示

---

## 📊 进度追踪

- [x] ✅ Phase 2A: 外网关键文件 (4/4 完成)
- [x] ✅ Phase 2B: 内网关键文件 (3/3 完成)
- [x] ✅ Phase 2C: 其他文件 (3/3 完成)
- [x] ✅ XSS 修复完成 - 总计12个关键位置 + 1个 CRITICAL inline onclick
- [ ] ⏳ XSS 测试建议在部署前执行

---

## ⚠️ 注意事项

1. **不要过度修复**: 有些静态HTML不需要修复（如按钮图标）
2. **保留功能**: 确保修复后功能正常
3. **测试彻底**: 每个修复都要测试
4. **提交分批**: 按文件分批提交，便于review

---

## 🔜 下一步

1. 先修复最危险的用户输入显示
2. 然后修复次要的显示
3. 最后清理静态HTML
