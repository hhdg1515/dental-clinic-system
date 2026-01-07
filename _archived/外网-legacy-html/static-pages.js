// static-pages.js - 静态页面的轻量级功能(Service/FAQ等)
// 不包含Firebase/认证功能,只有导航和语言切换
// 重构版 - 使用共享模块

// ============ 使用共享导航模块 ============
// shared-navigation.js 会自动初始化移动端菜单
// 不需要在这里重复代码

// ============ GSAP动画 (如果需要) ============
if (typeof gsap !== 'undefined') {
    // Hero标题动画
    const spanElements = document.querySelectorAll('h1 span');
    if (spanElements.length > 0) {
        gsap.to(spanElements, {
            duration: 1,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
            y: 0,
            opacity: 1,
            stagger: 0.2,
            ease: 'power4.inOut'
        });
    }
}

console.log('Static page script loaded (using shared modules)');
