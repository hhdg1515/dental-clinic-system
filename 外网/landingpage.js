// landingpage.js - 重构版
// 使用共享模块减少代码重复
import { escapeHtml } from './js/security-utils.js';

// 导入DOM工具函数
const get = element => document.getElementById(element);

// 导入认证功能
import {
    signUpUser,
    signInUser,
    signOutUser,
    listenForAuthStateChange,
    isAdminUser,
    validateEmail,
    validatePassword
} from "./auth.js";

// 导入UI功能
import {
    showLoggedInView,
    showLoggedInViewAsAdmin,
    switchToRegisterMode,
    switchToLoginMode,
    showLoadingState,
    hideLoadingState,
    showError,
    showSuccess,
    validateForm,
    showFormErrors,
    getCurrentUIState
} from "./ui-functions.js";

// DOM元素引用
let emailInputEl = null;
let passwordInputEl = null;
let loginEl = null;
let registerLinkEl = null;

// 菜单导航功能 - 使用 shared-navigation.js (已自动初始化)

// GSAP动画（保留原有动画）
if (typeof gsap !== 'undefined') {
    var tl = gsap.timeline({defaults:{duration: 1}});
    
    tl.from(".main-copy", {y: 50, opacity: 0})
      .to("h1 span", {clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)"}, "-=.7")
      .from("ul.featured-cabins li", {y: 50, opacity: 0, stagger: .3}, "-=.7");
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page loaded, initializing...');
    
    // 初始化DOM元素引用
    initializeDOMElements();
    
    // 初始化认证状态监听
    initializeAuthListener();
    
    // 初始化表单事件
    initializeFormEvents();
    
    // 初始化其他功能
    initializeOtherFeatures();
});

/**
 * 初始化DOM元素引用
 */
function initializeDOMElements() {
    emailInputEl = get('email');
    passwordInputEl = get('password');
    loginEl = get('login');
    
    if (!emailInputEl || !passwordInputEl) {
        console.warn('Login form elements not found');
        return;
    }
    
    console.log('DOM elements initialized');
}

/**
 * 初始化认证状态监听
 */
function initializeAuthListener() {
    listenForAuthStateChange((authData) => {
        if (authData) {
            const { user, userData } = authData;
            console.log('User authenticated:', user.email, 'Role:', userData?.role);
            
            // 根据用户角色显示不同界面
            if (userData && isAdminUser(user.email)) {
                showLoggedInViewAsAdmin(user, userData);
            } else {
                showLoggedInView(user, userData);
            }
        } else {
            console.log('User not authenticated');
            // 确保显示登录界面
            switchToLoginMode();
        }
    });
}

/**
 * 初始化表单事件
 */
function initializeFormEvents() {
    // 注册链接事件（初始状态）
    console.log('=== Starting initializeFormEvents ===');
    
    const initialRegisterLink = document.querySelector('.register-text a');
    console.log('Register link found:', !!initialRegisterLink);
    console.log('Register link element:', initialRegisterLink);
    
    if (initialRegisterLink) {
        console.log('Attempting to attach event listener...');
        initialRegisterLink.addEventListener('click', (e) => {
            console.log('Register event fired!');
            e.preventDefault();
            switchToRegisterMode();
            rebindFormEvents(); // 重新绑定事件
        });
        console.log('Event listener attached successfully');
    } else {
        console.log('ERROR: Register link not found when trying to attach event');
    }
    
    // 登录按钮事件
    if (loginEl) {
        loginEl.addEventListener('click', handleLoginClick);
    }
    
    // 表单提交事件
    const form = document.querySelector('.login-card form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLoginClick();
        });
    }
    
    // 回车键提交
    if (emailInputEl) {
        emailInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (passwordInputEl) passwordInputEl.focus();
            }
        });
    }
    
    if (passwordInputEl) {
        passwordInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLoginClick();
            }
        });
    }
    
    console.log('Form events initialized');
}

/**
 * 重新绑定表单事件（UI状态切换后）
 */
function rebindFormEvents() {
    // 重新获取可能已变化的元素
    const currentLoginBtn = get('login') || get('register-btn');
    
    if (currentLoginBtn) {
        // 移除旧的事件监听器
        currentLoginBtn.removeEventListener('click', handleLoginClick);
        // 添加新的事件监听器
        currentLoginBtn.addEventListener('click', handleLoginClick);
    }
    
    // 重新绑定注册/登录切换链接
    const registerLink = get('register-link');
    const backToLoginLink = get('back-to-login');
    
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchToRegisterMode();
            rebindFormEvents();
        });
    }
    
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchToLoginMode();
            rebindFormEvents();
        });
    }
}

/**
 * 处理登录/注册按钮点击
 */
async function handleLoginClick(e) {
    if (e) e.preventDefault();
    
    const email = emailInputEl?.value.trim();
    const password = passwordInputEl?.value.trim();
    const currentState = getCurrentUIState();
    
    console.log('Handle login click:', { email, currentState });
    
    // 表单验证
    const validation = validateForm(email, password, currentState === 'register');
    if (!validation.isValid) {
        showFormErrors(validation.errors);
        return;
    }
    
    try {
        showLoadingState();
        
        if (currentState === 'register') {
            // 注册流程
            await handleRegistration(email, password);
        } else {
            // 登录流程
            await handleLogin(email, password);
        }
        
    } catch (error) {
        console.error('Authentication error:', error);
        handleAuthError(error);
    } finally {
        hideLoadingState();
    }
}

/**
 * 处理用户注册
 */
async function handleRegistration(email, password) {
    try {
        const { user, userData } = await signUpUser(email, password, {
            registrationSource: 'landing_page',
            userAgent: navigator.userAgent,
            registrationIP: 'client_side' // 实际项目中可能需要服务器端获取
        });
        
        console.log('Registration successful:', user.email);
        
        // 显示注册成功消息
        showSuccess(
            currentLanguage === 'zh' ? 
            '注册成功！欢迎加入我们' : 
            'Registration successful! Welcome to our family'
        );
        
        // 注册成功后根据角色跳转
        if (isAdminUser(email)) {
            showLoggedInViewAsAdmin(user, userData);
        } else {
            showLoggedInView(user, userData);
        }
        
    } catch (error) {
        console.error('Registration failed:', error);
        throw error;
    }
}

/**
 * 处理用户登录
 */
async function handleLogin(email, password) {
    try {
        const { user, userData } = await signInUser(email, password);
        
        console.log('Login successful:', user.email);
        
        // 显示登录成功消息
        showSuccess(
            currentLanguage === 'zh' ? 
            '登录成功！' : 
            'Login successful!'
        );
        
        // 登录成功后根据角色跳转
        if (isAdminUser(email)) {
            showLoggedInViewAsAdmin(user, userData);
        } else {
            showLoggedInView(user, userData);
        }
        
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

/**
 * 处理认证错误
 */
function handleAuthError(error) {
    let errorMessage = '';
    
    switch (error.code) {
        case 'auth/user-not-found':
            errorMessage = currentLanguage === 'zh' ? 
                '用户不存在，请检查邮箱地址或注册新账户' : 
                'User not found. Please check your email or register a new account';
            break;
        case 'auth/wrong-password':
            errorMessage = currentLanguage === 'zh' ? 
                '密码错误，请重试' : 
                'Incorrect password. Please try again';
            break;
        case 'auth/email-already-in-use':
            errorMessage = currentLanguage === 'zh' ? 
                '此邮箱已被注册，请使用其他邮箱或直接登录' : 
                'Email already in use. Please use a different email or sign in';
            break;
        case 'auth/weak-password':
            errorMessage = currentLanguage === 'zh' ? 
                '密码过于简单，请使用至少6个字符' : 
                'Password is too weak. Please use at least 6 characters';
            break;
        case 'auth/invalid-email':
            errorMessage = currentLanguage === 'zh' ? 
                '邮箱格式不正确' : 
                'Invalid email format';
            break;
        case 'auth/too-many-requests':
            errorMessage = currentLanguage === 'zh' ? 
                '请求过于频繁，请稍后再试' : 
                'Too many requests. Please try again later';
            break;
        default:
            errorMessage = currentLanguage === 'zh' ? 
                `认证失败：${error.message}` : 
                `Authentication failed: ${error.message}`;
    }
    
    showError(errorMessage);
}

/**
 * 初始化其他功能
 */
function initializeOtherFeatures() {
    // 返回顶部功能
    initializeBackToTop();
    
    // 诊所地图功能
    initializeClinicMap();
    
    // 社区展示功能
    initializeCommunityShowcase();
    
    // 页脚导航功能
    initializeFooterNavigation();
    
    // 就诊规划按钮功能
    initializeAmenitiesButtons();
}

/**
 * 返回顶部功能 - 使用共享工具
 */
function initializeBackToTop() {
    // 使用shared-utils的返回顶部功能
    if (typeof window.sharedUtils !== 'undefined') {
        window.sharedUtils.initializeBackToTop();
        // 初始化Book Now按钮（包括MAP YOUR TRIP的按钮）
        window.sharedUtils.initializeBookNowButtons(
            '.nav-link.book-now, .cta, .trip-book-btn',
            '.login-container, .last-container'
        );
    }
}

/**
 * 就诊规划按钮功能
 */
function initializeAmenitiesButtons() {
    const amenitiesBtn = document.querySelector('.amenities-btn');
    const planBtn = document.querySelector('.plan-btn');
    const storyBtn = document.querySelector('.story-button');
    
    if (amenitiesBtn) {
        amenitiesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'faq.html?source=things-to-know#amenities-section';
        });
    }
    
    if (planBtn) {
        planBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'faq.html?source=things-to-bring#things-to-bring-section';
        });
    }
    
    if (storyBtn) {
        storyBtn.addEventListener('click', function() {
            const message = currentLanguage === 'zh' ? 
                '感谢您愿意分享您的经历！我们将很快推出在线表单。' : 
                'Thank you for wanting to share your experience! We will launch our online form soon.';
            alert(message);
        });
    }
    
    // 为按钮添加键盘导航支持
    const allButtons = document.querySelectorAll('.amenities-btn, .plan-btn, .story-button');
    allButtons.forEach(button => {
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

/**
 * 诊所地图功能
 */
function initializeClinicMap() {
    // 距离数据
    const clinicDistances = {
        arcadia: {
            name: 'Arcadia',
            distances: [
                { city: 'Downtown LA', miles: '18 miles' },
                { city: 'Pasadena', miles: '8 miles' },
                { city: 'San Gabriel', miles: '5 miles' },
                { city: 'Glendale', miles: '15 miles' },
                { city: 'Burbank', miles: '20 miles' },
                { city: 'Santa Monica', miles: '35 miles' },
                { city: 'Torrance', miles: '40 miles' },
                { city: 'Huntington Beach', miles: '45 miles' }
            ]
        },
        rowland: {
            name: 'Rowland Heights',
            distances: [
                { city: 'Downtown LA', miles: '28 miles' },
                { city: 'San Gabriel', miles: '12 miles' },
                { city: 'Pasadena', miles: '18 miles' },
                { city: 'Glendale', miles: '25 miles' },
                { city: 'Burbank', miles: '30 miles' },
                { city: 'Santa Monica', miles: '45 miles' },
                { city: 'Torrance', miles: '42 miles' },
                { city: 'Huntington Beach', miles: '35 miles' }
            ]
        },
        irvine: {
            name: 'Irvine',
            distances: [
                { city: 'Huntington Beach', miles: '12 miles' },
                { city: 'Torrance', miles: '25 miles' },
                { city: 'Downtown LA', miles: '42 miles' },
                { city: 'Santa Monica', miles: '38 miles' },
                { city: 'Pasadena', miles: '48 miles' },
                { city: 'San Gabriel', miles: '45 miles' },
                { city: 'Glendale', miles: '50 miles' },
                { city: 'Burbank', miles: '52 miles' }
            ]
        },
        'south-pasadena': {
            name: 'South Pasadena',
            distances: [
                { city: 'Downtown LA', miles: '8 miles' },
                { city: 'Pasadena', miles: '3 miles' },
                { city: 'Glendale', miles: '8 miles' },
                { city: 'San Gabriel', miles: '10 miles' },
                { city: 'Burbank', miles: '12 miles' },
                { city: 'Santa Monica', miles: '25 miles' },
                { city: 'Torrance', miles: '30 miles' },
                { city: 'Huntington Beach', miles: '45 miles' }
            ]
        },
        eastvale: {
            name: 'Eastvale',
            distances: [
                { city: 'Downtown LA', miles: '35 miles' },
                { city: 'San Gabriel', miles: '25 miles' },
                { city: 'Pasadena', miles: '35 miles' },
                { city: 'Glendale', miles: '40 miles' },
                { city: 'Burbank', miles: '45 miles' },
                { city: 'Santa Monica', miles: '55 miles' },
                { city: 'Torrance', miles: '40 miles' },
                { city: 'Huntington Beach', miles: '30 miles' }
            ]
        }
    };
    
    const mapSlider = get('map-slider');
    if (!mapSlider) return;
    
    let currentSlide = 0;
    const totalSlides = 5;
    const slides = document.querySelectorAll('.map-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = get('prev-clinic');
    const nextBtn = get('next-clinic');
    const distanceList = get('distance-list');
    
    function updateSlider() {
        slides.forEach((slide, index) => {
            slide.classList.remove('active', 'prev');
            if (index === currentSlide) {
                slide.classList.add('active');
            } else if (index < currentSlide) {
                slide.classList.add('prev');
            }
        });
        
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
        
        updateDistanceInfo();
    }
    
    function updateDistanceInfo() {
        if (!distanceList) return;
        
        const currentSlideElement = slides[currentSlide];
        const clinicKey = currentSlideElement?.getAttribute('data-clinic');
        const clinicData = clinicDistances[clinicKey];
        
        if (clinicData) {
            distanceList.innerHTML = clinicData.distances.map(item => `
                <div class="distance-item">
                    <span class="city-name">${escapeHtml(item.city)}</span>
                    <div class="distance-details">
                        <div class="distance-miles">${escapeHtml(item.miles)}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
            updateSlider();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = currentSlide === totalSlides - 1 ? 0 : currentSlide + 1;
            updateSlider();
        });
    }
    
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            updateSlider();
        });
    });
    
    updateSlider();
}

/**
 * 社区展示功能
 */
function initializeCommunityShowcase() {
    let currentCommunitySlide = 0;
    const totalCommunitySlides = 3;
    let communityAutoSlideInterval;
    
    function showCommunitySlide(n) {
        const slides = document.querySelectorAll('.community-slide');
        const indicators = document.querySelectorAll('.community-indicator');
        
        if (!slides.length || !indicators.length) return;
        
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        slides[n].classList.add('active');
        indicators[n].classList.add('active');
        
        slides.forEach((slide, index) => {
            if (index < n) {
                slide.style.transform = 'translateX(-100%)';
            } else if (index > n) {
                slide.style.transform = 'translateX(100%)';
            } else {
                slide.style.transform = 'translateX(0)';
            }
        });
    }
    
    function changeCommunitySlide(direction) {
        currentCommunitySlide += direction;
        
        if (currentCommunitySlide >= totalCommunitySlides) {
            currentCommunitySlide = 0;
        }
        if (currentCommunitySlide < 0) {
            currentCommunitySlide = totalCommunitySlides - 1;
        }
        
        showCommunitySlide(currentCommunitySlide);
        restartCommunityAutoSlide();
    }
    
    function goToCommunitySlide(n) {
        if (n >= 0 && n < totalCommunitySlides) {
            currentCommunitySlide = n;
            showCommunitySlide(currentCommunitySlide);
            restartCommunityAutoSlide();
        }
    }
    
    function startCommunityAutoSlide() {
        stopCommunityAutoSlide();
        communityAutoSlideInterval = setInterval(() => {
            changeCommunitySlide(1);
        }, 5000);
    }
    
    function stopCommunityAutoSlide() {
        if (communityAutoSlideInterval) {
            clearInterval(communityAutoSlideInterval);
            communityAutoSlideInterval = null;
        }
    }
    
    function restartCommunityAutoSlide() {
        stopCommunityAutoSlide();
        startCommunityAutoSlide();
    }
    
    // 绑定导航按钮
    const prevCommunityBtn = document.querySelector('.community-prev');
    const nextCommunityBtn = document.querySelector('.community-next');
    
    if (prevCommunityBtn) {
        prevCommunityBtn.addEventListener('click', () => changeCommunitySlide(-1));
    }
    
    if (nextCommunityBtn) {
        nextCommunityBtn.addEventListener('click', () => changeCommunitySlide(1));
    }
    
    // 绑定指示器
    const communityIndicators = document.querySelectorAll('.community-indicator');
    communityIndicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => goToCommunitySlide(index));
    });
    
    // 导出全局函数供HTML使用
    window.changeCommunitySlide = changeCommunitySlide;
    window.goToCommunitySlide = goToCommunitySlide;
    
    // 初始化显示
    showCommunitySlide(0);
    startCommunityAutoSlide();
    
    // 鼠标悬停控制
    const communityCarousel = document.querySelector('.community-carousel');
    if (communityCarousel) {
        communityCarousel.addEventListener('mouseenter', stopCommunityAutoSlide);
        communityCarousel.addEventListener('mouseleave', startCommunityAutoSlide);
    }
}

/**
 * 页脚导航功能
 */
function initializeFooterNavigation() {
    // 处理页脚导航链接
    const footerLinks = document.querySelectorAll('.nav-link');
    footerLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.endsWith('.html')) {
            link.addEventListener('click', function(e) {
                // 检查页面是否存在，不存在则阻止跳转
                if (!checkPageExists(href)) {
                    e.preventDefault();
                    showError(
                        currentLanguage === 'zh' ? 
                        '此页面正在建设中，敬请期待' : 
                        'This page is under construction, coming soon'
                    );
                }
            });
        }
    });
}

/**
 * 检查页面是否存在（简化版）
 */
function checkPageExists(url) {
    // 这里可以添加页面存在性检查逻辑
    // 目前假设某些页面已存在
    const existingPages = ['landingpage.html', 'service.html'];
    return existingPages.includes(url);
}

// 导出重要函数供其他脚本使用
if (typeof window !== 'undefined') {
    window.rebindFormEvents = rebindFormEvents;
    window.handleLoginClick = handleLoginClick;
}

console.log('Enhanced landing page script loaded successfully');