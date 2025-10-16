# Frontend Security Baseline（仅外网-react）
- 不在 localStorage 存 UID/role/email/clinics
- 生产隐藏详细错误；统一用户可见文案
- hash 导航 ID 白名单
- 外链用 HTTPS；_blank 搭配 rel="noopener noreferrer"
- 无 innerHTML / dangerouslySetInnerHTML
- 锁版本；生产 sourcemap=false
- 将来用托管层下发 CSP（响应头），非 meta
> 说明：本文件只约束外网-react，不涵盖旧版静态外网或内网。
