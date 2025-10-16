# Release Notes（外网-react）
## v0.4.0 — 2025-10-14
- Tailwind 清理（删未用 CSS）
- 路由懒加载（Landing/Services/FAQ…）
- Chat RAG 预留（public/kb，adapter，无外部 LLM）
- Chat 壳重构（桌面左侧玻璃面板；移动全屏；建议轮播改到输入框）
- 安全 Patch v1：localStorage 敏感键移除、错误提示收敛、hash 白名单、HTTP→HTTPS
- 安全 Patch v2：生产 sourcemap=false；CSP meta 方案移除（改为托管层再配）
- PWA 套壳：新增 /app（Login/Dashboard/Appointment/AI Chat），manifest+sw（仅生产注册）
数据/审计：前端写入携带 audit.* 字段；后端与安全规则未改。
回滚：移除 sw/manifest 与 /app 路由即可。
已知限制：/kb/*.json 目前为公开 mock，不含敏感/会员专属内容；迁移到公司 Firebase 后将改为受控下载。
---
## 模板（新增版本用）
- 版本号与日期
- 变更摘要 + 影响页面/组件
- 数据结构变化（如有）
- 审计字段合规性：✅/⛔
- 向后兼容（是否引入新审计字段/是否兼容旧数据）
- 风险与回滚
- 验收要点（登录→预约→Review→保存→Dashboard）
