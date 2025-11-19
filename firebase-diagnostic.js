// 🔍 Firebase API Key 诊断脚本
// 在浏览器控制台运行此脚本来诊断问题

console.log('=== Firebase 配置诊断 ===\n');

// 1. 检查当前加载的 Firebase 配置
if (window.firebase && window.firebase.app) {
  console.log('✅ Firebase App 配置:');
  console.log('   API Key:', window.firebase.app().options.apiKey);
  console.log('   Project ID:', window.firebase.app().options.projectId);
  console.log('   Auth Domain:', window.firebase.app().options.authDomain);
} else {
  console.log('❌ Firebase App 未初始化');
}

// 2. 检查所有已加载的脚本
console.log('\n=== 已加载的脚本 ===');
const scripts = document.querySelectorAll('script');
scripts.forEach((script, index) => {
  const src = script.src || script.innerHTML.substring(0, 100);
  if (src.includes('firebase') || src.includes('AIzaSy')) {
    console.log(`${index + 1}. ${script.src || '(inline script)'}`);
    if (src.includes('AIzaSy')) {
      console.log('   ⚠️ 包含 API Key!');
    }
  }
});

// 3. 检查所有 iframes（这可能是 403 错误的来源）
console.log('\n=== IFrames ===');
const iframes = document.querySelectorAll('iframe');
iframes.forEach((iframe, index) => {
  console.log(`${index + 1}. ${iframe.src || '(no src)'}`);
  if (iframe.src.includes('AIzaSy')) {
    const match = iframe.src.match(/key=([^&]+)/);
    if (match) {
      console.log('   🔑 API Key:', match[1]);
    }
  }
});

// 4. 检查 localStorage 和 sessionStorage
console.log('\n=== Storage ===');
console.log('localStorage keys:', Object.keys(localStorage));
console.log('sessionStorage keys:', Object.keys(sessionStorage));

// 搜索包含 API key 的存储项
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  if (value && value.includes('AIzaSy')) {
    console.log(`⚠️ localStorage['${key}'] 包含 API Key`);
  }
}

// 5. 检查 IndexedDB
console.log('\n=== IndexedDB ===');
indexedDB.databases().then(dbs => {
  console.log('数据库:', dbs.map(db => db.name));
});

// 6. 检查当前页面URL
console.log('\n=== 当前页面 ===');
console.log('URL:', window.location.href);
console.log('Protocol:', window.location.protocol);
console.log('Host:', window.location.host);

// 7. 最重要：检查是否有多个 Firebase App 实例
console.log('\n=== Firebase Apps ===');
try {
  const apps = firebase.apps || window.firebase.apps;
  if (apps && apps.length > 0) {
    console.log(`找到 ${apps.length} 个 Firebase App 实例:`);
    apps.forEach((app, index) => {
      console.log(`${index + 1}. ${app.name}:`);
      console.log('   API Key:', app.options.apiKey);
      console.log('   Project:', app.options.projectId);
    });
  } else {
    console.log('只有一个默认 Firebase App');
  }
} catch (e) {
  console.log('无法获取 Firebase Apps 列表');
}

console.log('\n=== 诊断完成 ===');
console.log('如果发现旧的 API Key (AIzaSyCCJbTwnqQo4CcUM-jDSaTC-hdpMcBTX4c)，');
console.log('请查看上面的输出，找出它来自哪里。');
