# PII 日志记录策略（外网-react）
前端 console 及未来引入的错误监控（如 Sentry）禁止记录敏感 PII。

## 禁止记录内容
- UID / Firebase User ID
- 邮箱地址
- 电话号码
- 用户姓名
- 自由文本（预约备注、聊天内容、症状描述等）
- 完整的 Firebase Auth Token / ID Token

## 允许记录内容
- requestId（用于追踪）
- 通用错误代码（如 "AUTH_FAILED", "APPOINTMENT_CREATE_ERROR"）
- 业务状态（如 "pending", "confirmed", "cancelled"）
- clinicId（门店标识，非用户个人信息）
- 前端路由路径（如 "/app/appointment"）

## 错误提示规范
- **生产环境**：仅显示用户友好的通用文案（如"操作失败，请稍后重试"），隐藏详细错误信息。
- **开发环境**：可局部放行详细日志，但不可入构建产物（通过 `import.meta.env.DEV` 控制）。

## 示例（正确 vs 错误）
### ❌ 错误示例
```js
console.error('预约失败', { uid: user.uid, email: user.email, note: appointmentNote });
```

### ✅ 正确示例
```js
console.error('预约失败', { requestId, clinicId, errorCode: 'APPOINTMENT_CREATE_ERROR' });
```

## 未来集成 Sentry
- 配置 `beforeSend` hook 过滤敏感字段
- 使用自定义面包屑（breadcrumbs）记录 requestId 和业务状态
- 禁止自动捕获 localStorage / sessionStorage
