// shared-navigation.js
// 共享的导航功能模块 - 用于所有外网页面

/**
 * 初始化移动端导航菜单
 * 处理菜单打开/关闭、导航链接点击等
 */
function initializeMobileNavigation() {
    const menuBtn = document.getElementById('menu-btn');
    const nav = document.getElementById('nav');
    const exitBtn = document.getElementById('exit-btn');

    if (!menuBtn || !nav || !exitBtn) {
        console.warn('Navigation elements not found');
        return;
    }

    // 打开菜单
    menuBtn.addEventListener('click', function() {
        nav.classList.add('open-nav');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    });

    // 关闭菜单
    exitBtn.addEventListener('click', function() {
        closeNavigation(nav);
    });

    // 点击导航链接时关闭菜单
    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            closeNavigation(nav);
        });
    });

    // 点击导航外部关闭菜单
    nav.addEventListener('click', function(e) {
        if (e.target === nav) {
            closeNavigation(nav);
        }
    });

    console.log('Mobile navigation initialized');
}

/**
 * 关闭导航菜单的辅助函数
 * @param {HTMLElement} nav - 导航元素
 */
function closeNavigation(nav) {
    nav.classList.remove('open-nav');
    document.body.style.overflow = 'auto';
}

/**
 * 非模块化环境使用 - 自动初始化
 * (为了向后兼容和简化使用)
 */
if (typeof module === 'undefined' && typeof window !== 'undefined') {
    // 如果不是在模块环境中，将函数挂载到window对象
    window.initializeMobileNavigation = initializeMobileNavigation;

    // 自动初始化（DOM加载完成后）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMobileNavigation);
    } else {
        initializeMobileNavigation();
    }
}

console.log('Shared navigation module loaded');
