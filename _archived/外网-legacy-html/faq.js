// FAQ页面专用JavaScript功能

// 注册GSAP ScrollTrigger插件
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('FAQ page loaded');

    // 初始化所有功能
    initFAQPage();
    initNavigationHandlers();
    initScrollEffects();
    initResponsiveHandlers();
    checkURLParams();

    // 延迟加载装饰图片
    setTimeout(() => {
        loadDecorativeImages();
    }, 300);
});

// =================== 主要初始化函数 ===================

function initFAQPage() {
    // 移动端导航功能 - 使用 shared-navigation.js (已自动初始化)

    // 返回顶部按钮 - 增强版本（带滚动显示/隐藏）
    setupBackToTopWithVisibility();

    // 页脚导航功能
    setupFooterNavigation();

    // 动画效果初始化
    initAnimations();

    console.log('FAQ page initialized (using shared modules)');
}

// =================== 移动端导航 ===================
// 已移至 shared-navigation.js - 自动初始化

// =================== 返回顶部功能 (增强版) ===================

function setupBackToTopWithVisibility() {
    const backToTopBtn = document.getElementById('back-to-top-btn');

    if (!backToTopBtn) return;

    // 使用shared-utils的基础功能
    if (typeof window.sharedUtils !== 'undefined') {
        window.sharedUtils.initializeBackToTop();
    }

    // 添加滚动显示/隐藏功能 (FAQ页面特有)
    let isVisible = false;
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldShow = scrollTop > 300;

        if (shouldShow && !isVisible) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.pointerEvents = 'auto';
            isVisible = true;
        } else if (!shouldShow && isVisible) {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.pointerEvents = 'none';
            isVisible = false;
        }
    });

    // 初始状态
    backToTopBtn.style.opacity = '0';
    backToTopBtn.style.pointerEvents = 'none';
    backToTopBtn.style.transition = 'opacity 0.3s ease';
}

// =================== 页脚导航功能 ===================

function setupFooterNavigation() {
    // Book Now 按钮功能
    const bookNowLinks = document.querySelectorAll('.book-now');
    bookNowLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 跳转到landingpage的预约区域
            window.location.href = 'landingpage.html#appointment-section';
        });
    });
    
    // FAQ链接（当前页面，滚动到顶部）
    const faqLinks = document.querySelectorAll('a[href="faq.html"], a[href="#"]');
    faqLinks.forEach(link => {
        if (link.getAttribute('href') === 'faq.html' || 
            (link.getAttribute('href') === '#' && link.textContent.toLowerCase().includes('faq'))) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    });
}

// =================== 导航处理器 ===================

function initNavigationHandlers() {
    // 处理来自landingpage的导航
    handleIncomingNavigation();
    
    // 设置内部锚点导航
    setupAnchorNavigation();
}

function handleIncomingNavigation() {
    // 检查是否从landingpage特定按钮跳转而来
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const hash = window.location.hash;
    
    if (source || hash) {
        // 延迟滚动，确保页面完全加载
        setTimeout(() => {
            if (hash) {
                scrollToSection(hash.substring(1)); // 移除#号
            } else if (source === 'things-to-bring') {
                scrollToSection('things-to-bring-section');
            } else if (source === 'things-to-know') {
                scrollToSection('amenities-section');
            }
        }, 500);
    }
}

function setupAnchorNavigation() {
    // 为内部链接添加平滑滚动
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
}

function scrollToSection(sectionId) {
    const targetElement = document.getElementById(sectionId) || 
                         document.querySelector(`[data-section="${sectionId}"]`) ||
                         document.querySelector('.content-section'); // 默认滚动到内容区域
    
    if (targetElement) {
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 80;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth'
        });
        
        // 添加高亮效果
        highlightSection(targetElement);
    }
}

function highlightSection(element) {
    // 移除其他高亮
    document.querySelectorAll('.highlight-active').forEach(el => {
        el.classList.remove('highlight-active');
    });
    
    // 添加高亮效果
    element.classList.add('highlight-active');
    
    // 3秒后移除高亮
    setTimeout(() => {
        element.classList.remove('highlight-active');
    }, 3000);
}

// =================== 滚动效果 - 移除视差 ===================

function initScrollEffects() {
    // 移除视差滚动，只保留淡入动画
    let ticking = false;
    
    function updateScrollEffects() {
        // 移除了视差效果，只检查淡入动画
        checkFadeInElements();
        
        ticking = false;
    }
    
    function requestScrollUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }
    
    // 滚动监听
    window.addEventListener('scroll', requestScrollUpdate);
    
    // 初始检查
    checkFadeInElements();
}

function checkFadeInElements() {
    const fadeElements = document.querySelectorAll('.things-to-bring-card, .placeholder-section');
    const windowHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;
    
    fadeElements.forEach(element => {
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        
        // 元素进入视窗
        if (scrollTop + windowHeight > elementTop + 100 && 
            scrollTop < elementTop + elementHeight) {
            
            if (!element.classList.contains('fade-in-active')) {
                element.classList.add('fade-in-active');
                
                // 为列表项添加延迟动画
                const listItems = element.querySelectorAll('.card-item-list li');
                listItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('slide-in-active');
                    }, index * 50);
                });
            }
        }
    });
}

// =================== 动画初始化 ===================

function initAnimations() {
    // 添加CSS动画类 - 移到CSS文件中了
    
    // GSAP动画（如果可用）
    if (typeof gsap !== 'undefined') {
        initGSAPAnimations();
    }
}

function initGSAPAnimations() {
    // Hero区域动画
    gsap.timeline()
        .from('.breadcrumbs', { opacity: 0, y: -20, duration: 0.8 })
        .from('.hero-content h1', { opacity: 0, y: 30, duration: 1 }, '-=0.5')
        .from('.hero-description', { opacity: 0, y: 20, duration: 0.8 }, '-=0.7');
    
    // 章节标题动画
    gsap.from('.section-title-elegant', {
        opacity: 0,
        scale: 0.8,
        duration: 1,
        ease: "back.out(1.7)",
        scrollTrigger: {
            trigger: '.section-header',
            start: 'top 80%'
        }
    });
    
    gsap.from('.section-subtitle-bold', {
        opacity: 0,
        letterSpacing: '10px',
        duration: 0.8,
        delay: 0.3,
        scrollTrigger: {
            trigger: '.section-header',
            start: 'top 80%'
        }
    });
}

// =================== 响应式处理 ===================

function initResponsiveHandlers() {
    let resizeTimer;
    
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 250);
    });
    
    // 初始调用
    handleResize();
}

function handleResize() {
    const windowWidth = window.innerWidth;
    
    // 移动端特殊处理
    if (windowWidth <= 768) {
        adjustMobileLayout();
    } else {
        resetDesktopLayout();
    }
    
    // 重新计算动画元素
    checkFadeInElements();
}

function adjustMobileLayout() {
    // 调整hero区域高度
    const heroSection = document.querySelector('.hero-section');
    if (heroSection && window.innerWidth <= 480) {
        heroSection.style.minHeight = '50vh';
    }
    
    // 调整卡片间距
    const thingsToBringCard = document.querySelector('.things-to-bring-card');
    if (thingsToBringCard) {
        thingsToBringCard.style.marginBottom = '40px';
    }
}

function resetDesktopLayout() {
    // 重置hero区域
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.style.minHeight = '60vh';
    }
    
    // 重置卡片间距
    const thingsToBringCard = document.querySelector('.things-to-bring-card');
    if (thingsToBringCard) {
        thingsToBringCard.style.marginBottom = '';
    }
}

// =================== URL参数检查 ===================

function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    
    // 记录来源用于分析
    if (source) {
        console.log(`FAQ page accessed from: ${source}`);
        
        // 可以在这里添加Google Analytics等追踪代码
        // gtag('event', 'faq_access', { source: source });
    }
    
    // 处理特殊来源的页面定制
    if (source === 'things-to-bring') {
        customizeForThingsToBring();
    } else if (source === 'things-to-know') {
        customizeForThingsToKnow();
    }
}

function customizeForThingsToBring() {
    // 高亮Things to Bring部分
    setTimeout(() => {
        const thingsToBringSection = document.querySelector('.things-to-bring-card');
        if (thingsToBringSection) {
            highlightSection(thingsToBringSection);
        }
    }, 1000);
}

function customizeForThingsToKnow() {
    // 滚动到Amenities部分（当实现后）
    setTimeout(() => {
        const amenitiesSection = document.querySelector('.placeholder-section');
        if (amenitiesSection) {
            scrollToSection('amenities-section');
        }
    }, 1000);
}

// =================== 实用工具函数 ===================

// 节流函数
// throttle 和 debounce 函数已移至 shared-utils.js
// 使用 window.sharedUtils.throttle() 和 window.sharedUtils.debounce()

// 检查元素是否在视窗中
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// =================== 导出函数供其他脚本使用 ===================

if (typeof window !== 'undefined') {
    window.FAQUtils = {
        scrollToSection,
        highlightSection,
        checkFadeInElements,
        isInViewport
    };
}

// =================== 错误处理 ===================

window.addEventListener('error', function(e) {
    console.error('FAQ page error:', e.error);
});

// 浏览器兼容性检查
(function() {
    const isIE = navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > -1;
    if (isIE) {
        console.warn('Internet Explorer detected. Some features may not work properly.');
        
        // 为IE添加基本的polyfill
        if (!Element.prototype.classList) {
            // 简单的classList polyfill
            console.warn('classList not supported, adding basic polyfill');
        }
    }
})();

console.log('FAQ.js loaded successfully');

let currentSlide = 0;
const totalSlides = 6;

function showSlide(n) {
  const items = document.querySelectorAll('.carousel-item');
  const indicators = document.querySelectorAll('.indicator');

  // 隐藏所有轮播项
  items.forEach(item => item.classList.remove('active'));
  indicators.forEach(indicator => indicator.classList.remove('active'));

  // 显示当前轮播项
  items[n].classList.add('active');
  indicators[n].classList.add('active');
}

function changeSlide(direction) {
  currentSlide += direction;
  if (currentSlide >= totalSlides) currentSlide = 0;
  if (currentSlide < 0) currentSlide = totalSlides - 1;
  showSlide(currentSlide);
}

function goToSlide(n) {
  currentSlide = n;
  showSlide(currentSlide);
}

// 自动轮播
setInterval(() => {
  changeSlide(1);
}, 5000);


// Tips for Smooth Visits 轮播功能
let currentTipsSlide = 0;
const totalTipsSlides = 4;
let tipsAutoSlideInterval;

// DOM加载完成后初始化Tips轮播
document.addEventListener('DOMContentLoaded', function() {
    initTipsCarousel();
});

function initTipsCarousel() {
    // 显示第一个slide
    showTipsSlide(0);
    
    // 启动自动轮播
    startTipsAutoSlide();
    
    // 鼠标悬停时暂停自动播放
    const tipsCarousel = document.querySelector('.tips-carousel');
    if (tipsCarousel) {
        tipsCarousel.addEventListener('mouseenter', stopTipsAutoSlide);
        tipsCarousel.addEventListener('mouseleave', startTipsAutoSlide);
    }
    
    // 键盘导航支持
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            changeTipsSlide(-1);
        } else if (e.key === 'ArrowRight') {
            changeTipsSlide(1);
        }
    });
    
    console.log('Tips carousel initialized');
}

function showTipsSlide(n) {
    const items = document.querySelectorAll('.tips-carousel-item');
    const indicators = document.querySelectorAll('.tips-indicator');
    
    if (!items.length || !indicators.length) {
        console.warn('Tips carousel elements not found');
        return;
    }
    
    // 隐藏所有轮播项
    items.forEach(item => item.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // 显示当前轮播项
    items[n].classList.add('active');
    indicators[n].classList.add('active');
    
    console.log(`Tips slide ${n} shown`);
}

function changeTipsSlide(direction) {
    currentTipsSlide += direction;
    
    // 循环处理
    if (currentTipsSlide >= totalTipsSlides) {
        currentTipsSlide = 0;
    }
    if (currentTipsSlide < 0) {
        currentTipsSlide = totalTipsSlides - 1;
    }
    
    showTipsSlide(currentTipsSlide);
    
    // 重启自动轮播
    restartTipsAutoSlide();
}

function goToTipsSlide(n) {
    if (n >= 0 && n < totalTipsSlides) {
        currentTipsSlide = n;
        showTipsSlide(currentTipsSlide);
        
        // 重启自动轮播
        restartTipsAutoSlide();
    }
}

// 自动轮播控制
function startTipsAutoSlide() {
    stopTipsAutoSlide(); // 清除现有的interval
    tipsAutoSlideInterval = setInterval(() => {
        changeTipsSlide(1);
    }, 6000); // 6秒切换一次
}

function stopTipsAutoSlide() {
    if (tipsAutoSlideInterval) {
        clearInterval(tipsAutoSlideInterval);
        tipsAutoSlideInterval = null;
    }
}

function restartTipsAutoSlide() {
    stopTipsAutoSlide();
    startTipsAutoSlide();
}

// 触摸支持（移动端滑动）
let tipsStartX = null;
let tipsStartY = null;

function initTipsTouch() {
    const tipsCarousel = document.querySelector('.tips-carousel');
    if (!tipsCarousel) return;
    
    tipsCarousel.addEventListener('touchstart', function(e) {
        tipsStartX = e.touches[0].clientX;
        tipsStartY = e.touches[0].clientY;
    });
    
    tipsCarousel.addEventListener('touchend', function(e) {
        if (!tipsStartX || !tipsStartY) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        
        const diffX = tipsStartX - endX;
        const diffY = tipsStartY - endY;
        
        // 只有水平滑动距离大于垂直滑动距离时才触发
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > 50) { // 最小滑动距离
                if (diffX > 0) {
                    // 向左滑动，显示下一个
                    changeTipsSlide(1);
                } else {
                    // 向右滑动，显示上一个
                    changeTipsSlide(-1);
                }
            }
        }
        
        tipsStartX = null;
        tipsStartY = null;
    });
}

// 在DOM加载后初始化触摸支持
document.addEventListener('DOMContentLoaded', initTipsTouch);

// 可见性API - 当页面不可见时暂停轮播
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopTipsAutoSlide();
    } else {
        startTipsAutoSlide();
    }
});

// 窗口失去/获得焦点时的处理
window.addEventListener('blur', stopTipsAutoSlide);
window.addEventListener('focus', startTipsAutoSlide);

// 错误处理
window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('tips')) {
        console.error('Tips carousel error:', e.error);
    }
});

// 导出函数供其他脚本使用
if (typeof window !== 'undefined') {
    window.TipsCarousel = {
        showSlide: showTipsSlide,
        changeSlide: changeTipsSlide,
        goToSlide: goToTipsSlide,
        start: startTipsAutoSlide,
        stop: stopTipsAutoSlide
    };
}

console.log('Tips carousel script loaded');

// =================== 装饰图片延迟加载 ===================

function loadDecorativeImages() {
    const maples = document.querySelector('.maples');

    if (maples) {
        // 延迟显示maples图片，避免加载时的突兀感
        maples.classList.add('loaded');
    }

    console.log('Decorative images loaded');
}