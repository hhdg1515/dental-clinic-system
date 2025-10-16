# Firestore 审计字段（前端写入约定｜外网-react）
必填（写入/更新/取消时一并携带）：
- audit.actorUid (string)
- audit.actorRole (customer|admin|owner)
- audit.clinicId (string)
- audit.sourceApp (**web-public / 外网-react**)
- audit.ts (ISO string)
- audit.requestId (uuid)
示例：
{
  "userId":"uid_x",
  "clinicId":"arcadia",
  "status":"pending",
  "audit":{
    "actorUid":"uid_x",
    "actorRole":"customer",
    "clinicId":"arcadia",
    "sourceApp":"web-public",
    "ts":"2025-10-14T23:55:06.231Z",
    "requestId":"00000000-0000-0000-0000-000000000000"
  }
}
说明：不在 localStorage 存 UID/role/email/clinics；UI 偏好另存。

## 字段生成规则
- **requestId 生成**：crypto.randomUUID()；同一端到端操作复用同一个 requestId，重试保持幂等。
- **actorRole 来源**：以 Firebase Claims/后端返回为准，禁止从 localStorage 派生。
- **失败写入策略**：若写入失败，前端应记录 requestId 并向用户提示，可在支持后端审计时用于对账。

## 适用集合
- **appointments**（必填全部）：创建、修改、取消预约时必须携带完整 audit.* 字段。
- **appointmentLogs**（仅审计流转）：记录预约状态变更历史，同样需要 audit.* 字段。
- **（将来）chatSessions**（只存会话元数据，不存原文）：仅记录会话发起/结束时间与计数，不存储聊天内容。

## 字段不可包含内容
不记录 PII 自由文本（如聊天内容/病状原文），这些只在受控域（后端）决定是否留存与脱敏。
