# Rate Limiting Implementation Guide

## ⚠️ CRITICAL #10 修复: 认证速率限制

防止暴力破解攻击和凭证填充攻击。

---

## 🎯 目标

- ✅ 防止暴力破解密码攻击
- ✅ 防止凭证填充 (Credential Stuffing)
- ✅ 防止账户枚举攻击
- ✅ 减轻 DoS 攻击风险

---

## 📋 已实现功能

### 客户端速率限制

**文件**: `外网-react/src/services/auth.ts`

**配置**:
```typescript
const LOGIN_ATTEMPT_LIMIT = 5;           // 最多5次失败尝试
const LOCKOUT_DURATION = 15 * 60 * 1000; // 锁定15分钟
```

### 功能特性

#### 1. 失败尝试跟踪
- 每个邮箱地址独立跟踪
- 存储在 `localStorage` 中
- 包含尝试次数和锁定时间

#### 2. 账户锁定
- 5次失败后自动锁定15分钟
- 锁定期间完全阻止登录尝试
- 显示剩余等待时间

#### 3. 成功登录重置
- 成功登录后清除所有失败记录
- 立即解锁账户

#### 4. 用户友好提示
- 显示剩余尝试次数
- 双语错误消息（中文/英文）
- 明确的锁定时间提示

---

## 💻 使用示例

### 正常登录流程

```typescript
import { signInUser, getRemainingAttempts } from './services/auth';

async function handleLogin(email: string, password: string) {
    try {
        const { user, userData } = await signInUser(email, password);
        console.log('✅ 登录成功:', user.uid);
        // 继续应用流程...
    } catch (error) {
        const message = error.message;

        // 检查是否为锁定错误
        if (message.includes('账号已被锁定') || message.includes('Account locked')) {
            alert(message);
        }
        // 检查是否有剩余尝试
        else if (message.includes('剩余尝试次数') || message.includes('Remaining attempts')) {
            alert(message);
        }
        // 其他错误（密码错误等）
        else {
            alert('登录失败，请检查您的邮箱和密码');
        }
    }
}
```

### 检查剩余尝试次数

```typescript
import { getRemainingAttempts } from './services/auth';

function checkLoginStatus(email: string) {
    const remaining = getRemainingAttempts(email);
    console.log(`还可以尝试 ${remaining} 次`);

    if (remaining === 0) {
        console.log('账号已被锁定');
    } else if (remaining <= 2) {
        console.warn('⚠️ 警告: 只剩下少量尝试机会');
    }
}
```

---

## 🔒 技术实现细节

### 数据结构

```typescript
interface RateLimitData {
    attempts: number;        // 失败尝试次数
    lockoutUntil: number | null;  // 锁定到期时间 (timestamp)
    email: string;          // 邮箱地址（小写）
}
```

### localStorage 存储

```
Key: auth_rate_limit_user@example.com
Value: {
    "attempts": 3,
    "lockoutUntil": null,
    "email": "user@example.com"
}
```

### 核心函数

#### 1. checkRateLimit()
检查账户是否被锁定
```typescript
const check = checkRateLimit('user@example.com');
if (check.isLocked) {
    console.log(`锁定中，还需等待 ${check.remainingMinutes} 分钟`);
}
```

#### 2. recordFailedAttempt()
记录失败尝试
```typescript
recordFailedAttempt('user@example.com');
// 自动检查是否达到限制并设置锁定
```

#### 3. resetRateLimit()
重置速率限制（成功登录时）
```typescript
resetRateLimit('user@example.com');
// 清除所有失败记录
```

---

## 🛡️ 安全特性

### 1. 账户枚举保护

**问题**: 攻击者可以通过错误消息判断账户是否存在

```typescript
// ❌ 不安全 - 泄露账户信息
if (userNotFound) {
    throw new Error('此邮箱未注册');
} else if (wrongPassword) {
    throw new Error('密码错误');
}

// ✅ 安全 - 统一错误消息
throw new Error('邮箱或密码错误');
```

**实现**: Firebase Authentication 默认使用统一错误消息

### 2. 时间戳验证

```typescript
// 检查锁定是否过期
if (data.lockoutUntil && Date.now() >= data.lockoutUntil) {
    resetRateLimit(email);  // 自动解锁
}
```

### 3. 大小写不敏感

```typescript
// 统一转换为小写避免绕过
const email = userInput.toLowerCase();
getRateLimitData(email);
```

---

## 🚀 增强建议

### 短期改进 (1-2周)

#### 1. IP 地址追踪

**目的**: 防止使用不同邮箱从同一 IP 攻击

```typescript
interface IPRateLimitData {
    ip: string;
    attempts: number;
    lockoutUntil: number | null;
}

// 记录每个 IP 的尝试次数
function recordIPAttempt(ip: string) {
    const data = getIPRateLimitData(ip);
    data.attempts += 1;

    if (data.attempts >= 20) {  // IP 级别更宽松的限制
        data.lockoutUntil = Date.now() + (60 * 60 * 1000); // 锁定1小时
    }

    saveIPRateLimitData(data);
}
```

**获取客户端 IP**:
```javascript
// 使用第三方服务
fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => {
        const ip = data.ip;
        recordIPAttempt(ip);
    });
```

#### 2. CAPTCHA 集成

**在多次失败后要求 CAPTCHA**:

```typescript
const CAPTCHA_THRESHOLD = 3;  // 3次失败后显示 CAPTCHA

async function signInUser(email: string, password: string, captchaToken?: string) {
    const data = getRateLimitData(email);

    // 如果尝试次数超过阈值，要求 CAPTCHA
    if (data.attempts >= CAPTCHA_THRESHOLD && !captchaToken) {
        throw new Error('请完成人机验证 / Please complete CAPTCHA');
    }

    // 验证 CAPTCHA
    if (captchaToken) {
        const isValid = await verifyCaptcha(captchaToken);
        if (!isValid) {
            throw new Error('CAPTCHA 验证失败');
        }
    }

    // 继续正常登录流程...
}
```

**使用 reCAPTCHA v3**:
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

<script>
async function handleLogin() {
    const token = await grecaptcha.execute('YOUR_SITE_KEY', {action: 'login'});
    await signInUser(email, password, token);
}
</script>
```

#### 3. 指数退避

**逐渐增加锁定时间**:

```typescript
const LOCKOUT_DURATIONS = [
    5 * 60 * 1000,    // 第1次锁定: 5分钟
    15 * 60 * 1000,   // 第2次锁定: 15分钟
    60 * 60 * 1000,   // 第3次锁定: 1小时
    24 * 60 * 60 * 1000  // 第4次及以上: 24小时
];

function calculateLockoutDuration(lockoutCount: number): number {
    const index = Math.min(lockoutCount - 1, LOCKOUT_DURATIONS.length - 1);
    return LOCKOUT_DURATIONS[index];
}
```

---

### 中期改进 (1-2月)

#### 1. Firebase App Check

**启用 App Check 防止自动化攻击**:

```typescript
// src/config/firebase.ts
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const app = initializeApp(firebaseConfig);

if (import.meta.env.PROD) {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
        isTokenAutoRefreshEnabled: true
    });
}
```

#### 2. Firebase Authentication 设置

**在 Firebase Console 中启用**:

1. Authentication > Settings > User enumeration protection
   - ✅ Enable "Protect against enumeration attacks"

2. Authentication > Settings > Email enumeration protection
   - ✅ Enable "Prevent accidental account enumeration"

3. Authentication > Sign-in method > Email/Password
   - ✅ Enable "Email link (passwordless sign-in)" (可选)
   - ✅ Configure password policy

#### 3. 服务器端速率限制

**使用 Firebase Functions**:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// 使用 Firestore 跟踪尝试次数
exports.checkRateLimit = functions.https.onCall(async (data, context) => {
    const email = data.email.toLowerCase();
    const rateLimitRef = admin.firestore()
        .collection('rateLimits')
        .doc(email);

    const doc = await rateLimitRef.get();
    const now = Date.now();

    if (doc.exists) {
        const { attempts, lockoutUntil } = doc.data();

        // 检查锁定
        if (lockoutUntil && now < lockoutUntil) {
            const remaining = Math.ceil((lockoutUntil - now) / 1000 / 60);
            throw new functions.https.HttpsError(
                'resource-exhausted',
                `Account locked. Try again in ${remaining} minutes.`
            );
        }

        // 增加尝试次数
        if (attempts >= 5) {
            await rateLimitRef.update({
                lockoutUntil: now + (15 * 60 * 1000)
            });
            throw new functions.https.HttpsError(
                'resource-exhausted',
                'Too many failed attempts. Account locked for 15 minutes.'
            );
        }
    }

    return { allowed: true };
});

// 在登录失败时记录
exports.recordFailedLogin = functions.https.onCall(async (data, context) => {
    const email = data.email.toLowerCase();
    const rateLimitRef = admin.firestore()
        .collection('rateLimits')
        .doc(email);

    await rateLimitRef.set({
        attempts: admin.firestore.FieldValue.increment(1),
        lastAttempt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
});
```

---

## 📊 监控和分析

### 1. 记录锁定事件

```typescript
function recordLockoutEvent(email: string) {
    // 发送到分析平台
    analytics.logEvent('account_locked', {
        email_hash: hashEmail(email),  // 不记录明文邮箱
        timestamp: new Date().toISOString(),
        lockout_duration: LOCKOUT_DURATION
    });

    // 记录到服务器日志
    console.warn(`🔒 Account locked: ${email}`);
}
```

### 2. 监控指标

跟踪以下指标:
- 每小时失败登录次数
- 账户锁定事件数量
- 平均尝试次数
- IP 地址分布
- 时间模式（攻击可能集中在特定时间）

### 3. 告警规则

```typescript
// 检测异常活动
if (failedAttemptsLastHour > 100) {
    sendAlert('Possible brute force attack detected');
}

if (uniqueLockedAccountsLastHour > 10) {
    sendAlert('Multiple accounts locked - investigate');
}
```

---

## 🧪 测试指南

### 单元测试

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from './auth';

describe('Rate Limiting', () => {
    const testEmail = 'test@example.com';

    beforeEach(() => {
        // 清除 localStorage
        localStorage.clear();
    });

    it('should allow login before hitting limit', () => {
        const check = checkRateLimit(testEmail);
        expect(check.isLocked).toBe(false);
    });

    it('should lock account after 5 failed attempts', () => {
        // 记录5次失败
        for (let i = 0; i < 5; i++) {
            recordFailedAttempt(testEmail);
        }

        const check = checkRateLimit(testEmail);
        expect(check.isLocked).toBe(true);
        expect(check.remainingMinutes).toBeGreaterThan(0);
    });

    it('should reset after successful login', () => {
        // 记录失败
        recordFailedAttempt(testEmail);
        recordFailedAttempt(testEmail);

        // 重置
        resetRateLimit(testEmail);

        const check = checkRateLimit(testEmail);
        expect(check.isLocked).toBe(false);
    });

    it('should automatically unlock after duration', async () => {
        // 锁定账户
        for (let i = 0; i < 5; i++) {
            recordFailedAttempt(testEmail);
        }

        // 修改锁定时间为1秒钟（测试用）
        const data = getRateLimitData(testEmail);
        data.lockoutUntil = Date.now() + 1000;
        saveRateLimitData(data);

        // 等待锁定过期
        await new Promise(resolve => setTimeout(resolve, 1100));

        const check = checkRateLimit(testEmail);
        expect(check.isLocked).toBe(false);
    });
});
```

### 集成测试

```typescript
describe('Login Rate Limiting Integration', () => {
    it('should prevent login after 5 failures', async () => {
        const email = 'test@example.com';
        const wrongPassword = 'wrong-password';

        // 尝试5次错误密码
        for (let i = 0; i < 5; i++) {
            try {
                await signInUser(email, wrongPassword);
            } catch (error) {
                // 预期失败
            }
        }

        // 第6次应该被锁定
        await expect(signInUser(email, wrongPassword))
            .rejects
            .toThrow(/账号已被锁定|Account locked/);
    });
});
```

---

## 📋 部署检查清单

### 客户端实现
- [x] ✅ Rate limiting 代码已添加到 `auth.ts`
- [x] ✅ localStorage 存储失败尝试
- [x] ✅ 锁定消息双语显示
- [ ] ⏳ 添加 UI 指示器（剩余尝试次数）

### Firebase Console 配置
- [ ] ⏳ 启用用户枚举保护
- [ ] ⏳ 启用邮箱枚举保护
- [ ] ⏳ 配置密码策略
- [ ] 📌 启用 Firebase App Check (可选)

### 监控和日志
- [ ] ⏳ 添加锁定事件日志
- [ ] ⏳ 配置分析追踪
- [ ] ⏳ 设置告警规则

### 增强功能 (可选)
- [ ] 📌 添加 CAPTCHA 集成
- [ ] 📌 实现 IP 级别速率限制
- [ ] 📌 添加指数退避
- [ ] 📌 服务器端验证

---

## ⚠️ 重要注意事项

### 1. localStorage 限制

- ⚠️ 用户可以清除 localStorage 绕过限制
- ⚠️ 隐身模式下不共享 localStorage
- ⚠️ 不同浏览器不共享数据

**缓解**:
- 结合服务器端验证（Firebase Functions）
- 使用 Firebase App Check
- 添加 IP 级别限制

### 2. 时钟偏移

- ⚠️ 客户端时钟可能不准确
- ⚠️ 用户可能修改系统时间

**缓解**:
- 使用服务器时间戳（Firestore `serverTimestamp()`）

### 3. 分布式攻击

- ⚠️ 攻击者可以使用多个 IP
- ⚠️ 可以针对不同账户

**缓解**:
- 全局速率限制
- Firebase App Check
- 行为分析

---

## 📚 参考资源

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [CWE-307: Improper Restriction of Excessive Authentication Attempts](https://cwe.mitre.org/data/definitions/307.html)

---

## ✅ 当前状态

- ✅ **客户端速率限制**: 已实现
- ✅ **localStorage 持久化**: 已实现
- ✅ **双语错误消息**: 已实现
- ⏳ **Firebase Console 配置**: 需要手动完成
- 📌 **服务器端验证**: 推荐添加但非必须
- 📌 **CAPTCHA 集成**: 可选增强功能

**总体**: 基础保护已实现，可以有效防止简单的暴力破解攻击。建议在生产环境中添加服务器端验证以获得更强的保护。
