// shared-utils.js
// 通用工具函数模块 - 用于所有外网页面

/**
 * DOM元素获取辅助函数
 * @param {string} element - 元素ID
 * @returns {HTMLElement|null}
 */
const get = element => document.getElementById(element);

/**
 * 初始化返回顶部按钮功能
 * @param {string} buttonId - 按钮元素ID (默认: 'back-to-top-btn')
 */
function initializeBackToTop(buttonId = 'back-to-top-btn') {
    const backToTopBtn = get(buttonId);

    if (!backToTopBtn) {
        console.warn(`Back to top button with id "${buttonId}" not found`);
        return;
    }

    // 点击返回顶部
    backToTopBtn.addEventListener('click', function() {
        scrollToTop();
    });

    // 键盘支持 (Enter 和 Space)
    backToTopBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            scrollToTop();
        }
    });

    console.log('Back to top button initialized');
}

/**
 * 平滑滚动到页面顶部
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * 平滑滚动到指定元素
 * @param {string|HTMLElement} target - CSS选择器或DOM元素
 * @param {string} block - 垂直对齐方式 ('start', 'center', 'end', 'nearest')
 */
function scrollToElement(target, block = 'center') {
    const element = typeof target === 'string' ?
        document.querySelector(target) : target;

    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: block
        });
    } else {
        console.warn('Scroll target not found:', target);
    }
}

/**
 * 初始化"Book Now"按钮 - 滚动到登录/预约区域
 * @param {string} buttonSelector - 按钮选择器 (默认: '.cta, .book-now')
 * @param {string} targetSelector - 目标区域选择器
 */
function initializeBookNowButtons(
    buttonSelector = '.cta, .book-now, .nav-link.book-now, .trip-book-btn',
    targetSelector = '.login-container, .last-container'
) {
    const bookNowButtons = document.querySelectorAll(buttonSelector);

    bookNowButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetElement = document.querySelector(targetSelector);
            if (targetElement) {
                scrollToElement(targetElement, 'center');
            }
        });
    });

    if (bookNowButtons.length > 0) {
        console.log(`Initialized ${bookNowButtons.length} book now buttons`);
    }
}

/**
 * GSAP动画初始化辅助函数
 * 检查GSAP是否可用并执行回调
 * @param {Function} callback - GSAP动画回调函数
 */
function initGSAPAnimations(callback) {
    if (typeof gsap !== 'undefined') {
        callback(gsap);
    } else {
        console.warn('GSAP library not loaded');
    }
}

/**
 * 防抖函数 - 限制函数执行频率
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间(毫秒)
 * @returns {Function}
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数 - 确保函数在指定时间内只执行一次
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制(毫秒)
 * @returns {Function}
 */
function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 添加键盘导航支持到按钮
 * @param {string} selector - 按钮选择器
 */
function addKeyboardNavigation(selector) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => {
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

/**
 * 初始化页脚导航功能
 * 处理导航链接点击和页面存在性检查
 */
function initializeFooterNavigation() {
    const footerLinks = document.querySelectorAll('.nav-link');
    const existingPages = ['landingpage.html', 'service.html', 'faq.html'];

    footerLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.endsWith('.html')) {
            link.addEventListener('click', function(e) {
                if (!existingPages.includes(href)) {
                    e.preventDefault();
                    alert(
                        typeof currentLanguage !== 'undefined' && currentLanguage === 'zh' ?
                        '此页面正在建设中，敬请期待' :
                        'This page is under construction, coming soon'
                    );
                }
            });
        }
    });
}

/**
 * 将所有工具函数挂载到window对象，供全局使用
 */
if (typeof window !== 'undefined') {
    window.sharedUtils = {
        get,
        scrollToTop,
        scrollToElement,
        initializeBackToTop,
        initializeBookNowButtons,
        initGSAPAnimations,
        debounce,
        throttle,
        addKeyboardNavigation,
        initializeFooterNavigation
    };
}

console.log('Shared utilities module loaded');
