# Medical Records Encryption Implementation Guide

## ⚠️ CRITICAL #8 修复: 医疗记录加密

本指南说明如何为医疗记录实现符合 HIPAA 标准的加密。

---

## 🎯 目标

- ✅ 实现 AES-256-GCM 加密算法
- ✅ 符合 HIPAA 对 PHI (Protected Health Information) 的加密要求
- ✅ 使用 Web Crypto API 实现客户端加密
- ⚠️ 生产环境需要服务器端密钥管理

---

## 📋 当前实现 (开发/演示)

### 已创建的文件

**`内网/js/crypto-utils.js`**
- AES-256-GCM 加密/解密函数
- 文件加密/解密工具
- Base64 编码/解码
- 密钥生成和导入/导出

### 关键功能

```javascript
// 初始化加密系统
const { key, keyBase64 } = await initializeEncryption();

// 加密医疗记录
const encrypted = await encryptMedicalRecord(file, patientId, key);
// 返回: { encryptedData, iv, metadata }

// 解密医疗记录
const decryptedBlob = await decryptMedicalRecord(
    encrypted.encryptedData,
    encrypted.iv,
    key,
    encrypted.metadata
);
```

### 加密算法

- **算法**: AES-256-GCM (Galois/Counter Mode)
- **密钥长度**: 256 bits
- **IV 长度**: 96 bits (12 bytes)
- **认证**: GCM 提供内置的完整性验证

---

## ⚠️ 当前限制 (开发实现)

### 密钥存储

**问题**: 主密钥存储在 `localStorage` 中

```javascript
localStorage.setItem('medical_records_encryption_key', keyBase64);
```

**风险**:
- ❌ localStorage 不加密
- ❌ XSS 攻击可以窃取密钥
- ❌ 不符合 HIPAA 密钥管理要求
- ❌ 浏览器清除数据会丢失密钥（导致数据永久丢失）

**适用场景**:
- ✅ 开发环境测试
- ✅ 演示加密功能
- ❌ **绝对不能用于生产环境**

---

## 🔒 生产环境实现 (必需)

### 方案 A: Firebase Functions + Google Cloud KMS (推荐)

#### 1. 架构

```
客户端 → Firebase Functions → Google Cloud KMS → Firestore/Storage
```

#### 2. 实现步骤

**启用 Google Cloud KMS**:

```bash
# 1. 启用 Cloud KMS API
gcloud services enable cloudkms.googleapis.com

# 2. 创建 key ring
gcloud kms keyrings create medical-records \
    --location global

# 3. 创建加密密钥
gcloud kms keys create master-key \
    --location global \
    --keyring medical-records \
    --purpose encryption
```

**创建 Firebase Function**:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { KeyManagementServiceClient } = require('@google-cloud/kms');

admin.initializeApp();
const kms = new KeyManagementServiceClient();

// Encrypt medical record
exports.encryptMedicalRecord = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated and authorized
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userDoc = await admin.firestore()
        .collection('users')
        .doc(context.auth.uid)
        .get();

    const userRole = userDoc.data().role;
    if (userRole !== 'owner' && userRole !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Encrypt file data using Cloud KMS
    const name = kms.cryptoKeyPath(
        'dental-clinic-demo-ce94b',
        'global',
        'medical-records',
        'master-key'
    );

    const [encryptResult] = await kms.encrypt({
        name,
        plaintext: Buffer.from(data.fileData, 'base64')
    });

    return {
        encryptedData: encryptResult.ciphertext.toString('base64'),
        kmsKeyName: name
    };
});

// Decrypt medical record
exports.decryptMedicalRecord = functions.https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Ownership check
    const recordDoc = await admin.firestore()
        .collection('medicalRecords')
        .doc(data.recordId)
        .get();

    const patientId = recordDoc.data().patientId;
    const userDoc = await admin.firestore()
        .collection('users')
        .doc(context.auth.uid)
        .get();

    const isOwner = context.auth.uid === patientId;
    const isAdmin = ['owner', 'admin'].includes(userDoc.data().role);

    if (!isOwner && !isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }

    // Decrypt using Cloud KMS
    const [decryptResult] = await kms.decrypt({
        name: data.kmsKeyName,
        ciphertext: Buffer.from(data.encryptedData, 'base64')
    });

    return {
        decryptedData: decryptResult.plaintext.toString('base64')
    };
});
```

**客户端调用**:

```javascript
// 加密
const encryptMedicalRecord = firebase.functions().httpsCallable('encryptMedicalRecord');
const result = await encryptMedicalRecord({
    fileData: base64FileData,
    patientId: patientId
});

// 解密
const decryptMedicalRecord = firebase.functions().httpsCallable('decryptMedicalRecord');
const decrypted = await decryptMedicalRecord({
    recordId: recordId,
    encryptedData: record.encryptedData,
    kmsKeyName: record.kmsKeyName
});
```

#### 3. 优势

- ✅ 密钥永不离开 Google Cloud KMS
- ✅ 符合 HIPAA/HITRUST 合规标准
- ✅ 密钥轮换和版本管理
- ✅ 访问审计日志
- ✅ IAM 权限控制

---

### 方案 B: Firebase Storage + 服务器端加密 (简单方案)

#### 1. 启用 Firebase Storage 加密

Firebase Storage 默认使用 Google 管理的密钥进行服务器端加密。

#### 2. 实现步骤

**Upload encrypted to Storage**:

```javascript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from './firebase-config';
import { doc, setDoc } from 'firebase/firestore';

async function uploadMedicalRecord(file, patientId, recordId) {
    // Upload to Firebase Storage (automatically encrypted at rest)
    const storageRef = ref(storage, `medical-records/${patientId}/${recordId}`);
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Store metadata in Firestore
    await setDoc(doc(db, 'medicalRecords', recordId), {
        patientId,
        originalName: file.name,
        mimeType: file.type,
        storagePath: storageRef.fullPath,
        downloadURL, // Only accessible with proper auth
        uploadedAt: new Date().toISOString(),
        encryptedAtRest: true,
        encryptionMethod: 'Google-managed server-side encryption'
    });
}
```

**配置 Storage Security Rules**:

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /medical-records/{patientId}/{recordId} {
      // Only authenticated users can read
      allow read: if request.auth != null && (
        // Patient owns the record
        request.auth.uid == patientId ||
        // Or user is admin/owner
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['owner', 'admin']
      );

      // Only admins can write
      allow write: if request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ['owner', 'admin'];
    }
  }
}
```

#### 3. 优势

- ✅ 简单实现
- ✅ 自动服务器端加密
- ✅ 不需要额外的密钥管理
- ⚠️ 使用 Google 管理的密钥（不是客户管理）

---

### 方案 C: 客户端加密 + 服务器端密钥管理 (高级)

结合客户端加密和服务器端密钥管理的优点。

#### 1. 流程

```
1. 客户端: 请求加密密钥 → Firebase Functions
2. Functions: 从 Cloud KMS 获取 DEK (Data Encryption Key)
3. 客户端: 使用 DEK 加密文件 (AES-256-GCM)
4. 客户端: 上传加密文件到 Firebase Storage
5. 客户端: 销毁内存中的 DEK
```

#### 2. 解密流程

```
1. 客户端: 请求解密密钥 → Firebase Functions
2. Functions: 验证权限 + 从 KMS 获取 DEK
3. 客户端: 下载加密文件
4. 客户端: 使用 DEK 解密文件
5. 客户端: 显示/下载文件 + 销毁 DEK
```

---

## 📊 方案对比

| 特性 | localStorage (当前) | Cloud KMS | Storage 自动加密 | 混合方案 |
|------|-------------------|-----------|----------------|----------|
| HIPAA 合规 | ❌ | ✅ | ⚠️ 部分 | ✅ |
| 密钥安全性 | ❌ 低 | ✅ 高 | ⚠️ 中 | ✅ 高 |
| 实现复杂度 | ✅ 简单 | ⚠️ 中等 | ✅ 简单 | ❌ 复杂 |
| 成本 | 免费 | 💰 按使用付费 | 免费 | 💰💰 较高 |
| 客户密钥控制 | ❌ | ✅ | ❌ | ✅ |
| 密钥轮换 | ❌ | ✅ | ✅ | ✅ |
| 推荐用于 | 开发测试 | 生产环境 | 小型项目 | 企业级 |

---

## 🚀 迁移步骤

### 从当前实现迁移到生产方案

#### Phase 1: 准备 (1-2 天)
1. ✅ 启用 Google Cloud KMS
2. ✅ 创建密钥环和主密钥
3. ✅ 配置 Firebase Functions
4. ✅ 测试加密/解密流程

#### Phase 2: 实现 (3-5 天)
1. ✅ 创建 Firebase Functions (encrypt/decrypt)
2. ✅ 更新客户端代码调用 Functions
3. ✅ 配置 Storage Security Rules
4. ✅ 添加错误处理和日志

#### Phase 3: 迁移数据 (2-3 天)
1. ⚠️ **如果已有未加密数据**: 创建迁移脚本
2. ⚠️ 逐步迁移现有记录到加密存储
3. ⚠️ 验证所有记录可访问

#### Phase 4: 测试 (2-3 天)
1. ✅ 功能测试（上传/下载/查看）
2. ✅ 权限测试（RBAC）
3. ✅ 性能测试
4. ✅ 安全审计

---

## 📝 合规检查清单

### HIPAA 技术保护措施

- [ ] ✅ 加密传输中的 PHI (HTTPS)
- [ ] ✅ 加密静态 PHI (AES-256)
- [ ] ✅ 访问控制和授权
- [ ] ✅ 审计日志
- [ ] ✅ 密钥管理和轮换
- [ ] ⏳ 备份加密
- [ ] ⏳ 灾难恢复计划

### 实施状态

**已完成** ✅:
- AES-256-GCM 加密实现
- Web Crypto API 集成
- 客户端加密工具

**待完成** ⏳:
- 服务器端密钥管理
- Cloud KMS 集成
- Firebase Functions 实现
- 生产环境部署

---

## 💡 最佳实践

### 密钥管理

1. **永远不要**:
   - ❌ 将密钥硬编码在代码中
   - ❌ 将密钥提交到 git
   - ❌ 在客户端存储主密钥
   - ❌ 通过 URL 传递密钥

2. **始终**:
   - ✅ 使用密钥管理服务 (KMS)
   - ✅ 定期轮换密钥
   - ✅ 记录密钥访问日志
   - ✅ 使用最小权限原则

### 加密实践

1. **使用强算法**:
   - ✅ AES-256-GCM (推荐)
   - ⚠️ AES-128-CBC (可接受但不推荐)
   - ❌ DES, RC4 (已废弃)

2. **IV/Nonce 管理**:
   - ✅ 每次加密使用唯一的 IV
   - ✅ 使用加密安全的随机数生成器
   - ❌ 不要重复使用 IV

3. **完整性验证**:
   - ✅ 使用 AEAD 模式 (如 GCM)
   - ✅ 验证解密后的数据完整性

---

## 🔍 测试指南

### 加密功能测试

```javascript
// 测试加密和解密
async function testEncryption() {
    // 1. 初始化
    const { key } = await initializeEncryption();

    // 2. 创建测试文件
    const testFile = new File(['Test medical record content'], 'test-xray.jpg', {
        type: 'image/jpeg'
    });

    // 3. 加密
    const encrypted = await encryptMedicalRecord(testFile, 'patient-123', key);
    console.log('✅ Encrypted:', encrypted);

    // 4. 解密
    const decrypted = await decryptMedicalRecord(
        encrypted.encryptedData,
        encrypted.iv,
        key,
        encrypted.metadata
    );
    console.log('✅ Decrypted blob:', decrypted);

    // 5. 验证内容
    const decryptedText = await decrypted.text();
    console.log('✅ Content matches:', decryptedText === 'Test medical record content');
}
```

---

## 📞 支持和资源

### 文档
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Google Cloud KMS](https://cloud.google.com/kms/docs)
- [Firebase Storage Security](https://firebase.google.com/docs/storage/security)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)

### 示例代码
- `内网/js/crypto-utils.js` - 加密工具实现
- 本文档中的代码示例

---

## ⚠️ 重要提醒

**当前实现 (localStorage) 仅用于开发测试！**

在部署到生产环境之前，**必须**实现以下之一：
1. 方案 A: Firebase Functions + Cloud KMS
2. 方案 B: Firebase Storage 自动加密
3. 方案 C: 混合加密方案

**未完成生产级密钥管理的系统不符合 HIPAA 要求，不应处理真实的 PHI 数据。**
