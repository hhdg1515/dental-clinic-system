# 迁移到公司 Firebase（占位｜外网-react）
准备：
- 在公司项目创建 Web App（public）
- 配置 .env.production 的 VITE_FIREBASE_*
切换步骤：
1) 切 env，不动前端代码逻辑
2) 影子环境全链路验证
3) 切 DNS/Hosting（如用）
4) （可选）开 Cloud Audit Logs / BigQuery Sink
切换后核验：关键写入含 audit.*；按用户/门店检索正确；/kb 可访问（mock）。
