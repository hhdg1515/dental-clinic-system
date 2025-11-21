# 本地开发调试完整指南

**最后更新**: 2025-11-20
**语言**: 中文 / English

---

## 📋 目录

1. [概述](#概述)
2. [常见问题速查](#常见问题速查)
3. [403 Forbidden 错误](#403-forbidden-错误)
4. [network-request-failed 错误](#network-request-failed-错误)
5. [其他调试技巧](#其他调试技巧)

---

## 概述

本指南用于排查本地开发（localhost）环境中的 Firebase 和网络相关问题。

**常见症状**:
- ❌ 登录失败
- ❌ 无法读取 Firestore 数据
- ❌ API Key 受限
- ❌ 网络超时

---

## 常见问题速查

| 错误 | 原因 | 解决方案 |
|-----|------|--------|
| `403 Forbidden` | API Key Referrer 限制 | [跳转](#403-forbidden-错误) |
| `network-request-failed` | 网络无法连接 | [跳转](#network-request-failed-错误) |
| `permission-denied` | Firebase Rules 拒绝 | 见 [FIREBASE-TROUBLESHOOTING-GUIDE.md](FIREBASE-TROUBLESHOOTING-GUIDE.md) |
| `auth/wrong-password` | 密码错误 | 检查邮箱密码 |
| `auth/user-not-found` | 用户不存在 | 注册新账户或检查邮箱 |

---

## 403 Forbidden 错误

### 🔴 错误信息

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSy... 403 (Forbidden)

Firebase: Error (auth/requests-from-referer-http://localhost:5174-are-blocked.)
```

### 📊 问题原因

Firebase API Key 在 Google Cloud Console 中设置了 **HTTP Referrer 限制**。当前 localhost 端口不在允许列表中。

**为什么会这样**:
- 开发服务器可能在不同的端口运行 (5173, 5174, 5175 等)
- API Key 的配置可能很严格，只允许特定端口

### ✅ 解决方案（三选一）

#### 🟢 方案 1: 修改 API Key 的 Referrer 限制（推荐）

**适用**: 你有 Google Cloud Console 访问权限

**步骤**:

1. **打开 Google Cloud Console**
   ```
   https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b
   ```

2. **找到 API Key**
   - 在 "API keys" 列表中找到 Browser Key
   - 通常是：`AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c`

3. **编辑 API Key**
   - 点击密钥名称或右侧的铅笔图标

4. **修改 "Application restrictions"**
   - 找到 "Application restrictions" 部分
   - 选择 **"HTTP referrers (web sites)"**

5. **配置 Website restrictions**
   - 在 "Website restrictions" 中添加以下规则：

   ```
   http://localhost:*/*
   http://127.0.0.1:*/*
   ```

   💡 **解释**: `*` 通配符表示允许所有 localhost 端口

6. **保存**
   - 点击 "Save" 按钮
   - 等待 **1-2 分钟**

7. **测试**
   - 刷新浏览器
   - 尝试登录

---

#### 🟡 方案 2: 临时移除 API Key 限制（快速）

**适用**: 需要快速修复，注意安全风险

**步骤**:

1. 进入 [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b)
2. 编辑 API Key
3. 在 "Application restrictions" 中选择 **"None"**
4. 点击 "Save"

⚠️ **安全警告**:
- 任何人都可以使用这个 Key
- 仅用于开发环境
- 完成开发后立即恢复限制

---

#### 🟠 方案 3: 使用固定端口（临时）

**适用**: 无法修改 API Key 配置

**步骤**:

1. **停止开发服务器**
   ```bash
   # 按 Ctrl + C
   ```

2. **杀掉占用 5173 端口的进程**

   **Windows PowerShell**:
   ```powershell
   # 查找占用 5173 的进程
   Get-Process | Where-Object { $_.ProcessName -like '*node*' } | Stop-Process -Force
   ```

   **或者更安全的方式**:
   ```powershell
   # 查看哪个进程占用了 5173
   netstat -ano | findstr :5173

   # 杀掉该进程（替换 PID）
   taskkill /PID <PID> /F
   ```

3. **重启开发服务器**
   ```bash
   cd 外网-react
   npm run dev
   ```

   现在应该会使用 5173 端口

⚠️ **局限**:
- 只是临时解决，端口还是可能被占用
- 建议长期使用方案 1

---

### 🎯 推荐执行顺序

```
✅ 你能访问 Google Cloud Console？
  ├─ YES → 使用【方案 1】(最好的解决方案)
  └─ NO  → 使用【方案 2】(快速临时方案)

⏳ 如果方案 1 不工作
  └─ 尝试【方案 3】(作为备选)
```

---

### 🔍 验证修复

修复后，在浏览器控制台运行：

```javascript
// 测试 Firebase 连接
firebase.auth().signInWithEmailAndPassword('test@firstavedental.com', 'test123')
  .then(() => console.log('✅ Firebase 工作正常'))
  .catch(err => console.log('❌ 错误:', err.message));
```

如果不再看到 `requests-from-referer-*-are-blocked` 错误，说明修复成功！

---

## network-request-failed 错误

### 🔴 错误信息

```
Firebase: Error (auth/network-request-failed)
```

### 📊 问题原因

无法连接到 Firebase 服务（不是 API Key 问题）

**最可能的原因** (按概率排序):

1. 🔥 **防火墙阻止** (60%)
2. 🌏 **地理位置限制** (20%)
3. 🧩 **浏览器扩展干扰** (10%)
4. 🌐 **DNS 问题** (5%)
5. 其他 (5%)

### ✅ 诊断步骤

#### 步骤 1: 检查网络连接

在浏览器地址栏输入以下地址，看能否打开：

| 地址 | 说明 |
|-----|------|
| https://firebase.google.com | Firebase 主页 |
| https://identitytoolkit.googleapis.com | Firebase Auth API |
| https://firestore.googleapis.com | Firestore API |

**能打开？**
- ✅ **是** → Firebase 服务可访问，问题可能在其他地方
- ❌ **否** → Firebase 被阻止，可能是防火墙或地理位置限制

---

#### 步骤 2: 检查浏览器控制台 Network 标签

1. 打开 DevTools (F12)
2. 切换到 **Network** 标签
3. 勾选 **"Preserve log"** (保留日志)
4. 尝试登录
5. 查看失败的请求（红色）

**查找发往 `identitytoolkit.googleapis.com` 或 `firestore.googleapis.com` 的失败请求**

点击失败的请求，查看：
- **Status Code**: 通常是 0 (网络错误) 或 timeout
- **Timing**: 是否超时
- **Response**: 错误信息

---

#### 步骤 3: 检查防火墙

**Windows Defender 防火墙**:

```powershell
# 在 PowerShell 中运行
Get-NetFirewallProfile | Select-Object Name, Enabled

# 查看出站规则
Get-NetFirewallRule -Direction Outbound | Where-Object { $_.Name -like '*Chrome*' }
```

---

#### 步骤 4: 检查是否在中国大陆

**如果你在中国大陆**:
- Firebase 被 GFW (Great Firewall) 阻止
- 需要使用 VPN 或科学上网工具

**诊断**:
```powershell
# 尝试 ping Firebase
ping firebase.google.com

# 如果显示 "Request timed out"
# 说明网络被阻止（可能是 GFW）
```

---

#### 步骤 5: 禁用浏览器扩展测试

**某些扩展可能阻止了请求**：
- AdBlock
- uBlock Origin
- Privacy Badger
- Ghostery

**测试方法**:
1. 打开隐身模式 (Ctrl + Shift + N)
2. 在隐身模式中尝试登录
3. 如果隐身模式成功，问题是扩展导致

**解决方案**:
- 将 localhost 添加到扩展的白名单
- 或临时禁用扩展

---

### ✅ 解决方案

#### 如果是防火墙阻止

**Windows Defender 防火墙**:

```
1. 控制面板 → Windows Defender 防火墙
2. 高级设置 → 出站规则
3. 新建规则
4. 选择"程序"
5. 选择程序路径：
   - Chrome: C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
   - 或 Node.exe: C:\Program Files\nodejs\node.exe
6. 完成规则
```

**路由器防火墙**:
- 进入路由器管理页面 (通常 192.168.1.1)
- 找到防火墙设置
- 临时关闭或添加允许列表

---

#### 如果是 DNS 问题

**更换 DNS 服务器**:

```powershell
# Windows: 清除 DNS 缓存
ipconfig /flushdns

# 更改 DNS:
# 1. 控制面板 → 网络和 Internet → 网络连接
# 2. 右键你的网络连接 → 属性
# 3. Internet 协议版本 4 (TCP/IPv4) → 属性
# 4. 选择"使用下面的 DNS 服务器地址"
#    首选: 8.8.8.8 (Google DNS)
#    备用: 8.8.4.4
```

---

#### 如果在中国大陆

**使用 VPN 或代理**:

选项：
1. 使用 VPN 应用
2. 使用代理服务
3. 使用其他网络 (移动热点)

---

#### 如果是浏览器扩展

1. 临时禁用可疑扩展
2. 或使用隐身模式
3. 尝试其他浏览器（如 Firefox）

---

## 其他调试技巧

### 🐛 启用 Firebase 调试日志

```typescript
// 在 firebase.ts 中添加
import { enableLogging } from 'firebase/firestore';

enableLogging(true); // 打印详细日志
```

### 📊 检查 LocalStorage 中的 Firebase 数据

```javascript
// 在浏览器控制台运行
// 查看 localStorage 中的所有 Firebase 相关数据
Object.keys(localStorage)
  .filter(key => key.includes('firebase'))
  .forEach(key => {
    console.log(`${key}:`, localStorage.getItem(key));
  });

// 查看当前认证信息
firebase.auth().currentUser // 显示当前登录的用户
```

### 🔄 清除所有本地 Firebase 数据

```javascript
// 在浏览器控制台运行，会删除所有 localStorage 中的 Firebase 数据
Object.keys(localStorage)
  .filter(key => key.includes('firebase'))
  .forEach(key => localStorage.removeItem(key));

// 然后刷新页面
location.reload();
```

### 🧪 使用 Firebase 模拟器进行本地开发

**优点**:
- 不需要真实的 Firebase 项目
- 快速测试
- 无成本

**步骤**:

```bash
# 1. 安装 Firebase CLI
npm install -g firebase-tools

# 2. 初始化项目
firebase init emulators

# 3. 启动模拟器
firebase emulators:start

# 4. 在你的代码中连接到本地模拟器
# 见前面 firebase.ts 中的示例
```

---

## 快速检查清单

遇到 403 或网络错误时，按顺序检查：

```
□ API Key 的 Referrer 限制是否包括 localhost:*/*？
□ 能直接访问 https://firebase.google.com 吗？
□ 能直接访问 https://identitytoolkit.googleapis.com 吗？
□ 在浏览器隐身模式下能工作吗？(测试扩展是否干扰)
□ 在其他浏览器中能工作吗？
□ 使用其他网络（如移动热点）能工作吗？
□ 在中国大陆吗？(需要 VPN)
□ VPN 已开启吗？
□ 防火墙是否完全关闭过?
□ 其他网络请求正常吗？(如访问 google.com)
```

---

## 相关资源

- [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials?project=dental-clinic-demo-ce94b)
- [Firebase Console](https://console.firebase.google.com/project/dental-clinic-demo-ce94b)
- [API Key 完整指南](API-KEY-SETUP-COMPLETE-GUIDE.md)
- [Firebase 故障排除指南](FIREBASE-TROUBLESHOOTING-GUIDE.md)
- [Firebase 配置指南](FIREBASE-CONFIGURATION-GUIDE.md)

---

**版本**: 1.0
**最后更新**: 2025-11-20
**维护者**: Claude Code

---

## 问题反馈

如果本指南没有解决你的问题：

1. 查看 [FIREBASE-TROUBLESHOOTING-GUIDE.md](FIREBASE-TROUBLESHOOTING-GUIDE.md) 了解更多细节
2. 检查 [Firebase 官方文档](https://firebase.google.com/docs)
3. 在浏览器控制台复制完整的错误堆栈跟踪
4. 检查网络 (Network) 标签中失败请求的详细信息

**包含以下信息会更有帮助**:
- 完整的错误信息
- Browser + OS
- Network 标签的截图
- 已尝试的解决方案
