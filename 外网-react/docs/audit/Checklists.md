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

---

## 审计日志 - 2025-10-17

### 任务：内网认证重构 - 移除localStorage身份存储，迁移至Firebase Auth + Firestore

**背景**：
外网refactor至React后，内网HTML页面出现两个问题：
1. 从外网登录跳转到内网时弹出"Authentication Required"
2. 5个管理员账号看到相同数据，缺少诊所隔离

**根本原因**：
- 外网React应用只在Context存储用户，未写入localStorage
- 内网HTML页面尝试从localStorage读取用户身份，失败导致无法获取role/clinics

**安全要求**（见docs/security.md）：
- 移除localStorage存储用户身份数据（uid/role/clinics）
- 使用Firebase Auth + Firestore users/{uid}作为单一身份源
- localStorage仅存UI偏好（intranet:view-location等）
- 内网页面阻断渲染直至auth+users/{uid}加载完成

**修改文件**：

1. **新增**：`外网-react/public/内网/js/intranet-auth-guard.js`
   - 实现IntranetAuthGuard类
   - onAuthStateChanged监听Firebase Auth
   - 从Firestore users/{uid}读取role/clinics至内存
   - 阻断渲染直至认证完成（loading overlay）
   - 更新clinic selector dropdown（owner=全部，admin=仅允许的诊所且禁用）

2. **修改**：`外网-react/public/内网/dashboard.html`
   - 引入intranet-auth-guard.js（最先加载）

3. **修改**：`外网-react/public/内网/patients.html`
   - 引入intranet-auth-guard.js（最先加载）

4. **修改**：`外网-react/public/内网/appointments.html`
   - 引入intranet-auth-guard.js（最先加载）

5. **修改**：`外网-react/public/内网/js/data-manager.js`
   - getCurrentUser()：从window.intranetAuthGuard获取用户，不再读localStorage
   - getUserClinics()：支持owner/boss角色，使用user.clinics数组

6. **修改**：`外网-react/public/内网/js/dashboard.js`
   - redirectIfNotAdmin()：委托给intranetAuthGuard
   - isOwner()：委托给intranetAuthGuard
   - getAccessibleClinics()：委托给intranetAuthGuard
   - safeGetCurrentUser()：移除localStorage读取，使用dataManager/authGuard

7. **修改**：`外网-react/public/内网/js/shared.js`
   - handleLogout()：简化localStorage清理，仅清UI偏好

8. **删除**：`外网-react/public/内网/js/auth-check.js`
   - 旧的localStorage认证模块已被intranet-auth-guard.js取代

**验证结果**（用户确认）：
- ✅ 数据隔离成功：owner看全部数据，admin仅看自己诊所
- ✅ 认证遮罩正确：未登录直接访问内网会显示loading遮罩+重定向至登录
- ✅ 登出清理正确：登出后清理Firebase Auth，返回外网
- ✅ localStorage检查：无currentUser/user/userData/authUser等身份键

**localStorage最终状态**：
- ✅ 仅存UI偏好：intranet:view-location, sidebarCollapsed
- ✅ 审计日志：appointment_audit_log（非身份数据）
- ✅ 数据缓存：data-manager内部存储键（非身份数据）
- ❌ 无身份数据：uid/email/role/clinics全部存于内存（来自Firestore）

**验证结果**（用户确认）：
- ✅ 数据隔离成功：owner看全部数据，admin仅看自己诊所
- ✅ 认证遮罩正确：未登录直接访问内网会显示loading遮罩+重定向至登录
- ✅ 登出清理正确：登出后清理Firebase Auth，返回外网
- ✅ localStorage检查：无currentUser/user/userData/authUser等身份键
- ✅ Dashboard数据加载：修复时序竞争bug后，所有统计数据正常显示

**Bug修复 - Dashboard无法加载数据**（2025-10-17）：
- **问题**：Dashboard显示所有数据为0，但appointments/patients页面数据正常
- **根因**：
  1. 时序竞争：dashboard.js的initializeAuthSystem()在auth guard完成前运行
  2. 缺失函数：两处调用已删除的getUserRole()函数
- **修复**：
  1. redirectIfNotAdmin()添加await window.intranetAuthGuard.waitForAuth()
  2. pollPendingAppointments()和updateDashboardStats()使用userRole变量替代getUserRole()
- **验证**：用户确认dashboard数据正常显示

**待办**：
- [ ] 公司Firebase迁移后部署firestore.rules
- [ ] 生产环境测试5个管理员账号权限隔离
