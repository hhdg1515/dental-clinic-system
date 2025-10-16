# 清单（外网-react）
开发前：
- [ ] 涉及写操作？audit.* 完整
- [ ] 不新增敏感 localStorage 键
- [ ] 错误提示无内部 message 泄露
预发布：
- [ ] 登录→预约→Review→保存→Dashboard
- [ ] 5 门店过滤正确
- [ ] Chat（VIP gating）命中/兜底均正常
- [ ] /app 在移动端可用；SW 仅生产注册
回滚：
- [ ] 有 tag/备份；有"禁入口或还原路由"的步骤
审计抽查（月度）：
- [ ] 抽 10 条写入，audit.* 齐全
- [ ] 预约与财务对账一致
