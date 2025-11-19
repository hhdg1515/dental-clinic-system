/**
 * Firebase Custom Claims 设置脚本
 *
 * 用法:
 * node scripts/set-custom-claims.js
 */

const admin = require('firebase-admin');

// 初始化 Firebase Admin
// 注意：你需要先下载 Service Account Key
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'dental-clinic-demo-ce94b'
});

// 要设置Custom Claims的用户列表
const users = [
  {
    email: 'manager1@firstavedental.com',
    role: 'owner',
    clinics: ['arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale']
  },
  {
    email: 'manager2@firstavedental.com',
    role: 'owner',
    clinics: ['arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale']
  },
  {
    email: 'manager3@firstavedental.com',
    role: 'admin',
    clinics: ['south-pasadena']
  },
  // 添加更多用户...
];

async function setCustomClaims() {
  console.log('🚀 开始设置 Custom Claims...\n');

  for (const userData of users) {
    try {
      // 通过email查找用户
      const userRecord = await admin.auth().getUserByEmail(userData.email);

      // 设置Custom Claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: userData.role,
        clinics: userData.clinics
      });

      console.log(`✅ ${userData.email}`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Clinics: ${userData.clinics.join(', ')}`);
      console.log('');

    } catch (error) {
      console.error(`❌ ${userData.email} - 失败:`, error.message);
      console.log('');
    }
  }

  console.log('🎉 Custom Claims 设置完成！');
  console.log('\n⚠️ 重要提醒：');
  console.log('用户需要重新登录才能获取新的 claims。');
  console.log('或者在应用中调用 user.getIdToken(true) 强制刷新 token。');

  process.exit(0);
}

// 验证Custom Claims
async function verifyCustomClaims(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`\n📋 ${email} 的 Custom Claims:`);
    console.log(userRecord.customClaims);
  } catch (error) {
    console.error('验证失败:', error.message);
  }
}

// 运行
setCustomClaims()
  .catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
