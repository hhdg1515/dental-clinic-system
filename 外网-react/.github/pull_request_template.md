# Pull Request

## 变更摘要
<!-- 简要描述本次改动的目的和主要变更点 -->

## 影响范围
<!-- 列出受影响的页面、组件、集合/字段 -->
- 页面/组件：
- 数据集合：
- 影响字段：

## 审计字段合规性检查
- [ ] 所有写操作携带完整 `audit.*` 字段（actorUid, actorRole, clinicId, sourceApp, ts, requestId）
- [ ] `requestId` 使用 `crypto.randomUUID()` 生成，端到端操作复用同一 requestId
- [ ] `audit.ts` 使用 `new Date().toISOString()` (UTC)
- [ ] `actorRole` 来源于 Firebase Claims/后端返回，**不从 localStorage 派生**
- [ ] 写入失败时记录 requestId 并向用户提示

## 数据变更协议（必填）
### 1) 变更摘要
<!-- 改动点、影响集合/字段 -->

### 2) 审计字段
- [ ] 完整（所有必填字段齐全）
- [ ] 部分缺失（列出缺口）：

### 3) 可复现步骤
<!-- 如何在本地演示新旧写入 -->
1.
2.
3.

### 4) 回滚步骤
<!-- 如何一键回退（tag/禁入口/还原路由） -->
- Git tag:
- 回滚操作：

### 5) 批处理修复方案（可选）
<!-- 如需批量修复旧数据，提供脚本/步骤（仅文档） -->

## 向后兼容性
- [ ] 未引入新审计字段（与 v0.4.0 兼容）
- [ ] 引入新审计字段但兼容旧数据
- [ ] 需要数据迁移（详细说明）：

## 安全检查
- [ ] 不在 localStorage 存储 UID/role/email/clinics
- [ ] 生产环境隐藏详细错误信息，使用通用文案
- [ ] 不记录 PII 自由文本到 console/日志
- [ ] 外链使用 HTTPS，`target="_blank"` 搭配 `rel="noopener noreferrer"`
- [ ] 无 `innerHTML` / `dangerouslySetInnerHTML`

## 测试验收
- [ ] 登录
- [ ] 预约创建
- [ ] 预约修改/取消
- [ ] Review 页面数据正确
- [ ] Dashboard 显示正确
- [ ] 5 门店过滤正常
- [ ] Chat（VIP gating）正常
- [ ] /app 在移动端可用

## 相关文档
- [ ] 已更新 [Release-Notes.md](docs/audit/Release-Notes.md)
- [ ] 已更新 [CHANGELOG.md](CHANGELOG.md)（如适用）
- [ ] 已审阅 [Data-Change-Protocol.md](docs/audit/Data-Change-Protocol.md)
- [ ] 已审阅 [Checklists.md](docs/audit/Checklists.md)

## 截图/录屏
<!-- 如有 UI 变更，请附上截图或录屏 -->

## 补充说明
<!-- 任何其他需要审阅者注意的信息 -->
