# 数据删除与脱敏策略（外网-react）
当用户请求删除数据时，哪些原文删，哪些审计元数据保留。

## 删除原则
- **原文删除**：用户可见的业务数据（预约详情、聊天内容、备注等）应按请求删除或脱敏。
- **审计元数据保留**：保留 requestId、时间戳（audit.ts）、业务状态变更记录，无原文内容。
- **合规要求**：符合 GDPR/CCPA 等法规的"被遗忘权"，同时满足审计留痕要求。

## 保留字段（删除后仍存在）
- audit.requestId
- audit.ts
- audit.actorUid（可脱敏为匿名 ID）
- audit.actorRole
- audit.clinicId
- audit.sourceApp
- 业务状态变更（如：pending → cancelled → deleted）

## 删除字段（不再可见）
- 用户姓名、联系方式
- 预约备注、症状描述
- 聊天会话原文
- 任何自由文本字段

## 实施方式
- 前端：标记为"已删除"，UI 不再展示。
- 后端（将来）：软删除（status: "deleted"），保留审计元数据；或定期归档到冷存储。
