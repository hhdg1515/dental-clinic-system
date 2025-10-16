# Audit & Compliance Overview (v1.00)
**范围：仅"外网-react"React 前端**（public-facing SPA）。不包含旧版纯 HTML/CSS/JS 外网，也不包含内网。
- 目的：为外网-react 定义前端写入的审计字段；规范数据变更记录；预留迁移到公司 Firebase 的步骤。
- 文件：
  - Firestore-Audit-Fields.md
  - Data-Change-Protocol.md
  - Release-Notes.md
  - Migration-to-Company-Firebase.md
  - Checklists.md
  - Redaction-Policy.md
  - PII-Logging-Policy.md
  - ../SECURITY.md
  - ../../CHANGELOG.md
- 事件覆盖面：前端写入涉及的事件清单（创建预约、修改/取消预约、登录后首个写入、聊天上行消息元数据仅计数不存内容）。
- 时间源与时区：audit.ts 统一使用 new Date().toISOString()（UTC），后端以服务器时间为准时可覆写。
