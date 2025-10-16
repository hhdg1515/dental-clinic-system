// ui-functions.js - 增强版UI状态管理
/**
 * UI状态管理和界面切换功能
 */

// UI状态枚举
const UI_STATES = {
    LOGIN: 'login',
    REGISTER: 'register', 
    LOGGED_IN_DASHBOARD: 'loggedInDashboard',
    APPOINTMENT_FORM: 'appointmentForm',
    APPOINTMENT_PREVIEW: 'appointmentPreview', 
    APPOINTMENT_SUCCESS: 'appointmentSuccess',
    ADMIN_REDIRECT: 'adminRedirect'
};

import { initializeChatAssistant, showChatAssistant, hideChatAssistant } from './chat-assistant.js';
// Add this import at the top of the file
import { createAppointment } from './appointment.js';
// 全局状态
let currentUIState = UI_STATES.LOGIN;
let currentUser = null;
let currentUserData = null;
let appointmentData = {};

/**
 * 显示加载状态
 */
export function showLoadingState() {
    const loginBtn = document.getElementById('login');
    const registerBtn = document.getElementById('register-btn');
    
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
    }
    
    if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
    }
}

/**
 * 隐藏加载状态
 */
export function hideLoadingState() {
    const loginBtn = document.getElementById('login');
    const registerBtn = document.getElementById('register-btn');
    
    if (loginBtn) {
        loginBtn.disabled = false;
        updateLoginButtonText();
    }
    
    if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.textContent = currentLanguage === 'zh' ? '创建账户' : 'Create Account';
    }
}

/**
 * 更新登录按钮文字
 */
function updateLoginButtonText() {
    const loginBtn = document.getElementById('login');
    if (loginBtn) {
        if (currentUIState === UI_STATES.REGISTER) {
            loginBtn.textContent = currentLanguage === 'zh' ? '创建账户' : 'Create Account';
        } else {
            loginBtn.textContent = currentLanguage === 'zh' ? '登录' : 'Login';
        }
    }
}

/**
 * 切换到注册模式
 */
export function switchToRegisterMode() {
    currentUIState = UI_STATES.REGISTER;
    
    const loginCard = document.querySelector('.login-card');
    const cardTitle = loginCard.querySelector('h2 p');
    const loginBtn = document.getElementById('login');
    const registerText = document.querySelector('.register-text');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // 更新标题
    if (cardTitle) {
        cardTitle.textContent = currentLanguage === 'zh' ? '创建新账户' : 'Create New Account';
    }
    
    // 更新按钮
    if (loginBtn) {
        loginBtn.textContent = currentLanguage === 'zh' ? '创建账户' : 'Create Account';
        loginBtn.id = 'register-btn';
    }
    
    // 更新底部链接
    if (registerText) {
        registerText.innerHTML = `
            <span data-lang="form-have-account">${currentLanguage === 'zh' ? '已有账户？' : 'Already have an account?'}</span>
            <a href="#" id="back-to-login" data-lang="form-login-link">${currentLanguage === 'zh' ? '点击登录' : 'Sign in here'}</a>
        `;
    }
    
    // 清空表单
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    console.log('Switched to register mode');
}

/**
 * 切换到登录模式
 */
export function switchToLoginMode() {
    currentUIState = UI_STATES.LOGIN;
    
    const loginCard = document.querySelector('.login-card');
    const cardTitle = loginCard.querySelector('h2 p');
    const registerBtn = document.getElementById('register-btn');
    const registerText = document.querySelector('.register-text');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // 更新标题
    if (cardTitle) {
        cardTitle.textContent = currentLanguage === 'zh' ? '预约您的就诊时间' : 'Schedule your appointment';
    }
    
    // 更新按钮
    if (registerBtn) {
        registerBtn.textContent = currentLanguage === 'zh' ? '登录' : 'Login';
        registerBtn.id = 'login';
    }
    
    // 更新底部链接
    if (registerText) {
        registerText.innerHTML = `
            <span data-lang="form-no-account">${currentLanguage === 'zh' ? '还没有账户？' : "Don't have an account?"}</span>
            <a href="#" id="register-link" data-lang="form-link">${currentLanguage === 'zh' ? '点击注册' : 'Register here'}</a>
        `;
    }
     // *** 新增：重新绑定注册链接事件 ***
    setTimeout(() => {
        const newRegisterLink = document.getElementById('register-link');
        if (newRegisterLink) {
            console.log('Re-binding register link event');
            newRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Register link clicked after rebind');
                switchToRegisterMode();
            });
        }
    }, 100);
    // 清空表单
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    console.log('Switched to login mode');
}

/**
 * 显示用户登录后的仪表盘（普通客户）
 */
export function showLoggedInView(user, userData) {
    currentUser = user;
    currentUserData = userData;
    currentUIState = UI_STATES.LOGGED_IN_DASHBOARD;
    
    // 初始化聊天助手
    initializeChatAssistant(user, userData.isVIP);
    // 更新页面标题区域
    updatePageHeaderForLoggedInUser(user);
    
    // 更新右侧卡片为用户仪表盘
    showUserDashboard(user, userData);
    // 初始化聊天助手（新增）
    if (userData.isVIP) {
        console.log('Initializing chat assistant for VIP user');
        initializeChatAssistant(user, true);
    }
    console.log('Showed logged-in dashboard for customer:', user.email);
}

/**
 * 显示管理员已登录状态
 */
export function showLoggedInViewAsAdmin(user, userData) {
    currentUser = user;
    currentUserData = userData;
    currentUIState = UI_STATES.ADMIN_REDIRECT;

    const loginContainer = document.querySelector('.login-container');
    const loginCard = document.querySelector('.login-card');

    if (loginCard) {
        loginCard.innerHTML = `
            <div class="admin-redirect">
                <div class="admin-welcome">
                    <i class="fas fa-shield-alt admin-icon"></i>
                    <h3>${currentLanguage === 'zh' ? '管理员登录成功' : 'Admin Login Success'}</h3>
                    <p>${currentLanguage === 'zh' ? '正在跳转到管理系统...' : 'Redirecting to admin dashboard...'}</p>
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            </div>
        `;
    }

    // Store user data in localStorage for internal system authentication
    // Owner can access all clinics, Admin uses their assigned clinics from userData
    const accessibleLocations = userData.role === 'owner' ?
        ['arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale'] :
        (userData.clinics || ['arcadia']); // Use clinics from Firebase, fallback to arcadia

    const internalUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: userData.role, // 'owner' or 'admin'
        accessibleLocations: accessibleLocations,
        clinics: accessibleLocations, // Add clinics field for compatibility
        currentViewLocation: accessibleLocations[0] || 'arcadia',
        assignedLocation: userData.assignedLocation || accessibleLocations[0] || 'arcadia',
        photoURL: user.photoURL || null
    };

    console.log('📍 User clinic access configured:', {
        email: user.email,
        role: userData.role,
        clinics: accessibleLocations
    });

    localStorage.setItem('currentUser', JSON.stringify(internalUserData));
    console.log('✅ User data saved to localStorage for internal system:', internalUserData);

    // 3秒后跳转到内网dashboard
    setTimeout(() => {
        window.location.href = '../内网/dashboard.html';
    }, 3000);

    console.log('Showed admin redirect for:', user.email, 'Role:', userData.role);
}

/**
 * 更新页面头部信息（登录后）- 完全移除用户信息显示
 */
function updatePageHeaderForLoggedInUser(user) {
    // 移除任何现有的用户信息显示
    const header = document.querySelector('header');
    if (header) {
        const userInfo = header.querySelector('.user-header-info');
        if (userInfo) {
            userInfo.remove();
        }
    }
    // Header保持原始状态，不添加任何用户相关信息
}

/**
 * 显示用户仪表盘 - 清理UI，移除不需要的元素
 */
function showUserDashboard(user, userData) {
    const loginCard = document.querySelector('.login-card');
    
    if (loginCard) {
        loginCard.innerHTML = `
            <div class="user-dashboard">
                <div class="dashboard-header">
                    <div class="user-welcome" style="border-bottom: none !important;">
                        <div class="welcome-text">
                            <h3>Hi ${getUserDisplayName(user)}</h3>
                        </div>
                        <button id="dashboard-logout" class="logout-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            ${currentLanguage === 'zh' ? '登出' : 'Logout'}
                        </button>
                    </div>
                </div>
                
                <div class="dashboard-content">
                    <div id="user-appointments-summary">
                        <!-- 预约概览将通过JavaScript加载 -->
                    </div>
                    
                    <div class="dashboard-actions">
                        <button class="primary-btn" id="new-appointment-btn">
                            <i class="fas fa-calendar-plus"></i>
                            <span>${currentLanguage === 'zh' ? '预约新的就诊' : 'New Appointment'}</span>
                        </button>
                        
                        <button class="chat-assistant-btn ${userData.isVIP ? 'vip-enabled' : 'vip-disabled'}" id="chat-assistant-btn">
                            <i class="fas fa-comments"></i>
                            <span>${currentLanguage === 'zh' ? '在线咨询助理' : 'Chat Assistant'}</span>
                            ${userData.isVIP ? `<span class="vip-badge">VIP</span>` : ''}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        bindDashboardEvents(user, userData);
        
        // 绑定登出按钮事件
        const logoutBtn = document.getElementById('dashboard-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // 加载用户预约概览
        loadUserAppointmentsSummary(user.uid);
    }
}

/**
 * 绑定仪表盘事件 - 移除view appointments按钮的绑定
 */
function bindDashboardEvents(user, userData) {
    // 新预约按钮
    const newAppointmentBtn = document.getElementById('new-appointment-btn');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', () => {
            showAppointmentForm();
        });
    }

    // 聊天助理按钮
    const chatAssistantBtn = document.getElementById('chat-assistant-btn');
    
    if (chatAssistantBtn) {
        chatAssistantBtn.addEventListener('click', () => {
            console.log('Chat assistant button clicked, isVIP:', userData.isVIP);
            if (userData.isVIP) {
               showChatAssistant(); // 现在会调用真正的聊天界面
            } else {
                showVIPUpgradePrompt();
            }
        });
    }
}

/**
 * 预填预约表单信息
 */
async function prefillAppointmentForm() {
    if (!currentUser) return;
    
    try {
        // 动态导入appointment模块
        const appointmentModule = await import('./appointment.js');
        const lastAppointment = await appointmentModule.getLastUserAppointment(currentUser.uid);
        
        if (lastAppointment) {
            // 预填姓名
            const patientNameInput = document.getElementById('patient-name');
            if (patientNameInput && lastAppointment.patientName) {
                patientNameInput.value = lastAppointment.patientName;
            }
            
            // 预填电话
            const patientPhoneInput = document.getElementById('patient-phone');
            if (patientPhoneInput && lastAppointment.patientPhone) {
                patientPhoneInput.value = lastAppointment.patientPhone;
            }
            
            console.log('Pre-filled form with last appointment data');
        } else {
            console.log('No previous appointment found, showing empty form');
        }
    } catch (error) {
        console.error('Error pre-filling appointment form:', error);
        // 失败也不影响表单使用
    }
}


/**
 * 显示预约表单
 */
export function showAppointmentForm() {
    currentUIState = UI_STATES.APPOINTMENT_FORM;
    
    // 隐藏聊天助理按钮（预约过程中不可用）
    hideChatAssistant();
    
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.innerHTML = `
            <div class="appointment-form-container">
                <div class="form-header">
                    <button class="back-btn" id="back-to-dashboard">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h3>${currentLanguage === 'zh' ? '预约新的就诊' : 'Schedule New Appointment'}</h3>
                </div>
                
                <div class="appointment-form">
                    <div class="form-step active" id="step-1">
                        
                        <div class="form-group">
                            <label for="patient-name">${currentLanguage === 'zh' ? '患者姓名' : 'Patient Name'} *</label>
                            <input type="text" id="patient-name" required 
                                   placeholder="${currentLanguage === 'zh' ? '请输入患者姓名' : 'Enter patient name'}">
                        </div>
                        
                        <div class="form-group">
                            <label for="patient-phone">${currentLanguage === 'zh' ? '联系电话' : 'Phone Number'} *</label>
                            <input type="tel" id="patient-phone" required 
                                placeholder="${currentLanguage === 'zh' ? '请输入联系电话' : 'Enter phone number'}">
                            <small class="form-hint">${currentLanguage === 'zh' ? '信息如有变化请直接修改' : 'Please modify if information has changed'}</small>
                        </div>
                                                
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="is-new-patient">
                                <span class="checkbox-custom"></span>
                                ${currentLanguage === 'zh' ? '我是新患者' : 'I am a new patient'}
                            </label>
                        </div>
                        
                        <button class="primary-btn next-step-btn" onclick="nextFormStep(2)">
                            ${currentLanguage === 'zh' ? '下一步' : 'Next Step'}
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                    
                    <div class="form-step" id="step-2">          
                        <div class="form-group">
                            <label for="appointment-date">${currentLanguage === 'zh' ? '预约日期' : 'Appointment Date'} *</label>
                            <input type="date" id="appointment-date" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="appointment-time">${currentLanguage === 'zh' ? '预约时间' : 'Appointment Time'} *</label>
                            <select id="appointment-time" required>
                                <option value="">${currentLanguage === 'zh' ? '请选择时间' : 'Select time'}</option>
                                <option value="09:00">9:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="11:00">11:00 AM</option>
                                <option value="12:00">12:00 PM</option>
                                <option value="13:00">1:00 PM</option>
                                <option value="14:00">2:00 PM</option>
                                <option value="15:00">3:00 PM</option>
                                <option value="16:00">4:00 PM</option>
                                <option value="17:00">5:00 PM</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="clinic-location">${currentLanguage === 'zh' ? '就诊门店' : 'Clinic Location'} *</label>
                            <select id="clinic-location" required>
                                <option value="">${currentLanguage === 'zh' ? '请选择门店' : 'Select clinic'}</option>
                                <option value="arcadia">Arcadia</option>
                                <option value="rowland-heights">Rowland Heights</option>
                                <option value="irvine">Irvine</option>
                                <option value="south-pasadena">South Pasadena</option>
                                <option value="eastvale">Eastvale</option>
                            </select>
                        </div>
                        
                        <div class="form-navigation">
                            <button class="secondary-btn prev-step-btn" onclick="prevFormStep(1)">
                                <i class="fas fa-arrow-left"></i>
                                ${currentLanguage === 'zh' ? '上一步' : 'Previous'}
                            </button>
                            <button class="primary-btn next-step-btn" onclick="nextFormStep(3)">
                                ${currentLanguage === 'zh' ? '下一步' : 'Next Step'}
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-step" id="step-3">
                        <div class="form-group">
                            <label for="service-type">${currentLanguage === 'zh' ? '服务类型' : 'Service Type'} *</label>
                            <select id="service-type" required>
                                <option value="">${currentLanguage === 'zh' ? '请选择服务类型' : 'Select service type'}</option>
                                <option value="general-family">General & Family</option>
                                <option value="cosmetic">Cosmetic</option>
                                <option value="orthodontics">Orthodontics</option>
                                <option value="root-canals">Root Canals</option>
                                <option value="periodontics">Periodontics</option>
                                <option value="restorations">Restorations</option>
                                <option value="preventive-care">Preventive Care</option>
                                <option value="oral-surgery">Oral Surgery</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="patient-description">${currentLanguage === 'zh' ? '问题描述（可选）' : 'Problem Description (Optional)'}</label>
                            <textarea id="patient-description" rows="4" 
                                      placeholder="${currentLanguage === 'zh' ? '请简要描述您的牙齿问题或需求...' : 'Please briefly describe your dental concerns or needs...'}"></textarea>
                        </div>
                        
                        <div class="form-navigation">
                            <button class="secondary-btn prev-step-btn" onclick="prevFormStep(2)">
                                <i class="fas fa-arrow-left"></i>
                                ${currentLanguage === 'zh' ? '上一步' : 'Previous'}
                            </button>
                            <button class="primary-btn review-btn" onclick="showAppointmentPreview()">
                                ${currentLanguage === 'zh' ? '预览预约' : 'Review Appointment'}
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        // 然后预填信息
        prefillAppointmentForm();
        // 绑定返回按钮事件
        const backBtn = document.getElementById('back-to-dashboard');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                showLoggedInView(currentUser, currentUserData);
            });
        }
        
        // 预填用户信息
        prefillUserInfo();
    }
}

/**
 * Updated showAppointmentPreview function - unified sections and cancel button
 */
export function showAppointmentPreview() {
    // 验证所有步骤
    if (!validateFormStep(1) || !validateFormStep(2) || !validateFormStep(3)) {
        return; // 有未完成的必填项
    }
    
    currentUIState = UI_STATES.APPOINTMENT_PREVIEW;
    
    // 收集表单数据
    collectAppointmentData();
    
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.innerHTML = `
            <div class="appointment-preview-container">
                <div class="form-header-clean">
                    <h3>${currentLanguage === 'zh' ? '确认预约信息' : 'Review Your Appointment'}</h3>
                </div>
                
                <div class="preview-content-clean">
                    <div class="preview-section-unified">
                        <h4>${currentLanguage === 'zh' ? '预约详情' : 'Appointment Details'}</h4>
                        
                        <div class="info-row">
                            <span class="label">${currentLanguage === 'zh' ? '患者姓名:' : 'Patient Name:'}</span>
                            <span class="value">${appointmentData.patientName}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">${currentLanguage === 'zh' ? '联系电话:' : 'Phone:'}</span>
                            <span class="value">${appointmentData.patientPhone}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">${currentLanguage === 'zh' ? '日期:' : 'Date:'}</span>
                            <span class="value">${formatDate(appointmentData.appointmentDate)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">${currentLanguage === 'zh' ? '时间:' : 'Time:'}</span>
                            <span class="value">${formatTime(appointmentData.appointmentTime)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">${currentLanguage === 'zh' ? '门店:' : 'Clinic:'}</span>
                            <span class="value">${formatClinicName(appointmentData.clinicLocation)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">${currentLanguage === 'zh' ? '服务类型:' : 'Service:'}</span>
                            <span class="value">${formatServiceType(appointmentData.serviceType)}</span>
                        </div>
                        ${appointmentData.description ? `
                            <div class="info-row">
                                <span class="label">${currentLanguage === 'zh' ? '问题描述:' : 'Description:'}</span>
                                <span class="value description">${appointmentData.description}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="preview-actions-clean">
                        <button class="secondary-btn cancel-btn" onclick="cancelAppointment()">
                            <i class="fas fa-times"></i>
                            ${currentLanguage === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button class="primary-btn confirm-btn" id="confirm-appointment">
                            <i class="fas fa-check"></i>
                            ${currentLanguage === 'zh' ? '确认预约' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定事件
        const backBtn = document.getElementById('back-to-form');
        if (backBtn) {
            backBtn.addEventListener('click', showAppointmentForm);
        }
        
        const confirmBtn = document.getElementById('confirm-appointment');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', confirmAppointment);
        }
    }
}

/**
 * 显示预约成功页面
 */
export function showAppointmentSuccess() {
    currentUIState = UI_STATES.APPOINTMENT_SUCCESS;
    
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.innerHTML = `
            <div class="appointment-success-container">
                <div class="success-content">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>${currentLanguage === 'zh' ? '预约成功！' : 'Appointment Confirmed!'}</h3>
                    
                    <div class="success-message">
                        <p>${currentLanguage === 'zh' ? 
                            '感谢您选择我们的服务！我们已经收到您的预约申请。' : 
                            'Thank you for choosing our services! We have received your appointment request.'
                        }</p>
                        
                        <div class="appointment-summary">
                            <h4>${currentLanguage === 'zh' ? '预约信息' : 'Appointment Information'}</h4>
                            <div class="summary-item">
                                <strong>${formatDate(appointmentData.appointmentDate)} ${formatTime(appointmentData.appointmentTime)}</strong>
                            </div>
                            <div class="summary-item">
                                ${formatClinicName(appointmentData.clinicLocation)} - ${formatServiceType(appointmentData.serviceType)}
                            </div>
                        </div>
                        
                        <div class="next-steps">
                            <p><i class="fas fa-info-circle"></i>
                                ${currentLanguage === 'zh' ? 
                                '我们将在24小时内联系您确认具体时间。' : 
                                'We will contact you within 24 hours to confirm the exact time.'
                                }
                            </p>
                        </div>
                    </div>
                    
                    <div class="success-actions">
                        <button class="primary-btn" id="back-to-dashboard-success">
                            <i class="fas fa-home"></i>
                            ${currentLanguage === 'zh' ? '返回主页' : 'Back to Dashboard'}
                        </button>
                        
                        <button class="secondary-btn" id="new-appointment-success">
                            <i class="fas fa-plus"></i>
                            ${currentLanguage === 'zh' ? '预约其他服务' : 'Schedule Another'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 显示聊天助理（回到主状态）
        showChatAssistantIfVIP();
        if (currentUserData && currentUserData.isVIP) {
        showChatAssistant();
    }
        // 绑定事件
        const backToDashboardBtn = document.getElementById('back-to-dashboard-success');
        if (backToDashboardBtn) {
            backToDashboardBtn.addEventListener('click', () => {
                showLoggedInView(currentUser, currentUserData);
            });
        }
        
        const newAppointmentBtn = document.getElementById('new-appointment-success');
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', showAppointmentForm);
        }
    }
}

/**
 * Updated cancelAppointment function - returns to dashboard instead of edit
 */
window.cancelAppointment = function() {
    // Clear any unsaved appointment data
    appointmentData = {};
    
    // Return directly to user dashboard instead of edit mode
    showLoggedInView(currentUser, currentUserData);
    
    // Show cancellation message
    showMessage(
        currentLanguage === 'zh' ? '预约已取消' : 'Appointment cancelled',
        'info',
        3000
    );
};
// =================== 辅助函数 ===================

/**
 * 获取用户显示名称
 */
function getUserDisplayName(user) {
    return user.displayName || user.email.split('@')[0] || 'User';
}

/**
 * 预填用户信息
 */
function prefillUserInfo() {
    // 这里可以从用户profile或之前的预约中获取信息
    const patientNameInput = document.getElementById('patient-name');
    if (patientNameInput && currentUser) {
        patientNameInput.value = getUserDisplayName(currentUser);
    }
}

/**
 * 收集预约数据
 */
function collectAppointmentData() {
    console.log('=== Collecting Appointment Data ===');
    
    // Collect form data
    const patientName = document.getElementById('patient-name')?.value || '';
    const patientPhone = document.getElementById('patient-phone')?.value || '';
    const isNewPatient = document.getElementById('is-new-patient')?.checked || false;
    const appointmentDate = document.getElementById('appointment-date')?.value || '';
    const appointmentTime = document.getElementById('appointment-time')?.value || '';
    const clinicLocation = document.getElementById('clinic-location')?.value || '';
    const serviceType = document.getElementById('service-type')?.value || '';
    const description = document.getElementById('patient-description')?.value || '';
    
    appointmentData = {
        patientName,
        patientPhone,
        patientEmail: currentUser?.email || '', // Add user email
        isNewPatient,
        appointmentDate,
        appointmentTime,
        clinicLocation,
        serviceType,
        description
    };
    
    console.log('Collected appointment data:', appointmentData);
    
    // Validate required fields
    const requiredFields = ['patientName', 'patientPhone', 'appointmentDate', 'appointmentTime', 'clinicLocation', 'serviceType'];
    const missingFields = requiredFields.filter(field => !appointmentData[field]);
    
    if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
    } else {
        console.log('All required fields present ✓');
    }
    
    return appointmentData;
}

/**
 * 格式化日期显示
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US');
}

/**
 * 格式化时间显示
 */
function formatTime(timeString) {
    if (!timeString) return '';
    return timeString;
}

/**
 * 格式化门店名称
 */
function formatClinicName(clinicValue) {
    const clinicNames = {
        'arcadia': 'Arcadia',
        'rowland-heights': 'Rowland Heights',
        'irvine': 'Irvine',
        'south-pasadena': 'South Pasadena',
        'eastvale': 'Eastvale'
    };
    return clinicNames[clinicValue] || clinicValue;
}

/**
 * 格式化服务类型
 */
function formatServiceType(serviceValue) {
    const serviceNames = {
        'general-family': 'General & Family',
        'cosmetic': 'Cosmetic',
        'orthodontics': 'Orthodontics',
        'root-canals': 'Root Canals',
        'periodontics': 'Periodontics',
        'restorations': 'Restorations',
        'preventive-care': 'Preventive Care',
        'oral-surgery': 'Oral Surgery'
    };
    return serviceNames[serviceValue] || serviceValue;
}

/**
 * 加载用户预约概览 - Fixed version
 */
async function loadUserAppointmentsSummary(userId) {
    const summaryContainer = document.getElementById('user-appointments-summary');
    if (!summaryContainer) {
        console.warn('Summary container not found');
        return;
    }

    try {
        console.log('Loading appointments summary for user:', userId);

        // 显示加载状态
        summaryContainer.innerHTML = `
            <div class="appointments-summary loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${currentLanguage === 'zh' ? '加载预约信息...' : 'Loading appointments...'}</span>
            </div>
        `;
        
        // 导入appointment模块
        const appointmentModule = await import('./appointment.js');
        const getUserAppointments = appointmentModule.getUserAppointments;

        // 获取用户预约
        const appointments = await getUserAppointments(userId, 10);
        console.log('Retrieved appointments:', appointments.length);

        // 筛选出即将到来的预约
        const upcomingAppointments = appointments.filter(apt => apt.appointmentDateTime > new Date());

        // 根据预约数量显示不同的UI
        let appointmentsHTML = '';
        
        if (upcomingAppointments.length > 1) {
            // 多个预约 - 使用左右滑动
            appointmentsHTML = `
                <div class="appointments-summary has-appointments">
                    <div class="summary-header">
                        <i class="fas fa-calendar-alt"></i>
                        <span class="summary-title">${currentLanguage === 'zh' ? '即将到来的预约' : 'UPCOMING APPOINTMENTS'}</span>
                    </div>
                    <div class="appointments-slider-container">
                        <div class="appointments-slider" id="appointments-slider">
            `;
            
            upcomingAppointments.forEach((appointment, index) => {
                const appointmentDate = appointment.appointmentDateTime instanceof Date 
                    ? appointment.appointmentDateTime 
                    : appointment.appointmentDateTime.toDate();
                
                const formattedDate = appointmentDate.toLocaleDateString(
                    currentLanguage === 'zh' ? 'zh-CN' : 'en-US',
                    { year: 'numeric', month: 'short', day: 'numeric' }
                );
                
                const formattedTime = appointmentDate.toLocaleTimeString(
                    currentLanguage === 'zh' ? 'zh-CN' : 'en-US',
                    { hour: '2-digit', minute: '2-digit', hour12: true }
                );
                
                appointmentsHTML += `
                    <div class="appointment-slide ${index === 0 ? 'active' : ''}">
                        <div class="appointment-item">
                            <div class="appointment-details">
                                <div class="service-type">${formatServiceType(appointment.serviceType)}</div>
                                <div class="clinic-location">${formatClinicName(appointment.clinicLocation)}</div>
                            </div>
                            <div class="appointment-date">
                                <strong>${formattedDate}</strong>
                                <span>${formattedTime}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            appointmentsHTML += `
                        </div>
                        <button class="appointment-nav-btn appointment-prev" onclick="changeAppointmentSlide(-1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="appointment-nav-btn appointment-next" onclick="changeAppointmentSlide(1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        } else if (upcomingAppointments.length === 1) {
            // 单个预约 - 使用iOS风格布局
            const nextAppointment = upcomingAppointments[0];
            const appointmentDate = nextAppointment.appointmentDateTime instanceof Date 
                ? nextAppointment.appointmentDateTime 
                : nextAppointment.appointmentDateTime.toDate();
            
            const formattedDate = appointmentDate.toLocaleDateString(
                currentLanguage === 'zh' ? 'zh-CN' : 'en-US',
                { month: 'short', day: 'numeric', year: 'numeric' }
            );
            
            const formattedTime = appointmentDate.toLocaleTimeString(
                currentLanguage === 'zh' ? 'zh-CN' : 'en-US',
                { hour: '2-digit', minute: '2-digit', hour12: true }
            );
            
            appointmentsHTML = `
                <div class="appointments-summary has-appointments">
                    <div class="summary-header">
                        <i class="fas fa-calendar-alt"></i>
                        <span class="summary-title">${currentLanguage === 'zh' ? '即将到来的预约' : 'UPCOMING APPOINTMENT'}</span>
                    </div>
                    <div class="appointment-card-ios">
                        <div class="appointment-service">
                            <div class="service-name">${formatServiceType(nextAppointment.serviceType)}</div>
                            <div class="clinic-name">${formatClinicName(nextAppointment.clinicLocation)}</div>
                        </div>
                        <div class="appointment-time">
                            <div class="date-time">${formattedDate}</div>
                            <div class="time-only">${formattedTime}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (appointments.length > 0) {
            // 有历史预约但没有即将到来的
            appointmentsHTML = `
                <div class="appointments-summary">
                    <i class="fas fa-history"></i>
                    <span>${currentLanguage === 'zh' ? `您有 ${appointments.length} 条历史预约记录` : `You have ${appointments.length} past appointments`}</span>
                </div>
            `;
        } else {
            // 没有任何预约记录
            appointmentsHTML = `
                <div class="appointments-summary">
                    <i class="fas fa-calendar-check"></i>
                    <span>${currentLanguage === 'zh' ? '暂无预约记录' : 'No appointments yet'}</span>
                </div>
            `;
        }

        // 将生成的 HTML 插入到容器中
        summaryContainer.innerHTML = appointmentsHTML;

        // 如果有多个预约，初始化滑动功能 - MOVED TO AFTER DATA IS LOADED
        if (upcomingAppointments.length > 1) {
            setTimeout(() => {
                initializeAppointmentSlider();
            }, 100);
        }

    } catch (error) {
        console.error('Error loading user appointments summary:', error);
        
        summaryContainer.innerHTML = `
            <div class="appointments-summary error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${currentLanguage === 'zh' ? '加载预约信息时出错' : 'Error loading appointments'}</span>
            </div>
        `;
    }
}


// 预约滑动功能 - 简化版
let currentAppointmentIndex = 0;
let totalAppointments = 0;

function initializeAppointmentSlider() {
    const slides = document.querySelectorAll('.appointment-slide');
    totalAppointments = slides.length;
    currentAppointmentIndex = 0;
    showAppointmentSlide(0);
}

function changeAppointmentSlide(direction) {
    currentAppointmentIndex += direction;
    
    if (currentAppointmentIndex >= totalAppointments) {
        currentAppointmentIndex = 0;
    }
    if (currentAppointmentIndex < 0) {
        currentAppointmentIndex = totalAppointments - 1;
    }
    
    showAppointmentSlide(currentAppointmentIndex);
}

function showAppointmentSlide(index) {
    const slides = document.querySelectorAll('.appointment-slide');
    
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
        slide.style.transform = `translateX(${(i - index) * 100}%)`;
    });
}

// 导出到全局
window.changeAppointmentSlide = changeAppointmentSlide;

/**
 * 格式化预约状态显示
 */
function formatAppointmentStatus(status) {
    const statusMap = {
        'zh': {
            'pending': '等待确认',
            'confirmed': '已确认',
            'cancelled': '已取消',
            'completed': '已完成',
            'no_show': '未到场'
        },
        'en': {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'cancelled': 'Cancelled',
            'completed': 'Completed',
            'no_show': 'No Show'
        }
    };
    
    return statusMap[currentLanguage === 'zh' ? 'zh' : 'en'][status] || status;
}

/**
 * 显示VIP升级提示
 */
function showVIPUpgradePrompt() {
    const modal = document.createElement('div');
    modal.className = 'vip-upgrade-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${currentLanguage === 'zh' ? 'VIP会员专属功能' : 'VIP Member Exclusive'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="vip-icon">
                    <i class="fas fa-crown"></i>
                </div>
                <p>${currentLanguage === 'zh' ? 
                    '在线咨询助理是我们为VIP会员提供的专属服务。升级成为VIP会员，享受个性化的牙科咨询体验。' :
                    'Our Chat Assistant is an exclusive service for VIP members. Upgrade to VIP membership for personalized dental consultation experience.'
                }</p>
                <div class="vip-benefits">
                    <div class="benefit-item">
                        <i class="fas fa-check"></i>
                        <span>${currentLanguage === 'zh' ? '24/7在线咨询' : '24/7 Online Consultation'}</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-check"></i>
                        <span>${currentLanguage === 'zh' ? '个性化建议' : 'Personalized Recommendations'}</span>
                    </div>
                    <div class="benefit-item">
                        <i class="fas fa-check"></i>
                        <span>${currentLanguage === 'zh' ? '优先预约' : 'Priority Booking'}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="secondary-btn modal-cancel">${currentLanguage === 'zh' ? '稍后再说' : 'Maybe Later'}</button>
                <button class="primary-btn contact-upgrade">${currentLanguage === 'zh' ? '联系升级' : 'Contact for Upgrade'}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const backdrop = modal.querySelector('.modal-backdrop');
    const upgradeBtn = modal.querySelector('.contact-upgrade');
    
    [closeBtn, cancelBtn, backdrop].forEach(btn => {
        btn?.addEventListener('click', () => {
            modal.remove();
        });
    });
    
    upgradeBtn?.addEventListener('click', () => {
        modal.remove();
        // 这里可以打开联系表单或跳转到联系页面
        window.location.href = '#contact';
    });
}

// =================== 聊天助理相关函数 ===================

/**
 * 显示聊天助理（仅在主仪表盘状态）
 */
function showChatAssistantIfVIP() {
    if (currentUIState === UI_STATES.LOGGED_IN_DASHBOARD && currentUserData?.isVIP) {
        showChatAssistant();
    }
}
/**
 * 确认预约 - Fixed version that actually saves to Firebase
 */
async function confirmAppointment() {
    try {
        showLoadingState();
        
        // Validate appointment data before saving
        if (!appointmentData.patientName || !appointmentData.patientPhone || 
            !appointmentData.appointmentDate || !appointmentData.appointmentTime || 
            !appointmentData.clinicLocation || !appointmentData.serviceType) {
            throw new Error('Missing required appointment information');
        }
        
        console.log('Attempting to save appointment:', appointmentData);
        console.log('Current user:', currentUser?.uid);
        
        // Actually call the Firebase save function
        const appointmentId = await createAppointment(appointmentData, currentUser.uid);
        
        console.log('Appointment saved successfully with ID:', appointmentId);
        
        showAppointmentSuccess();
        showSuccess(
            currentLanguage === 'zh' ? '预约已确认！' : 'Appointment confirmed!'
        );
        
    } catch (error) {
        console.error('Error confirming appointment:', error);
        showError(
            currentLanguage === 'zh' ? 
            `预约失败：${error.message}` : 
            `Failed to confirm appointment: ${error.message}`
        );
    } finally {
        hideLoadingState();
    }
}

/**
 * 处理退出登录
 */
async function handleLogout() {
    try {
        const { signOutUser } = await import('./auth.js');
        await signOutUser();
        
        // 强制清理所有状态
        currentUser = null;
        currentUserData = null;
        appointmentData = {};
        
        // 隐藏聊天助手
        hideChatAssistant();
        
        // 强制重置UI
        resetUI();
        
        // 强制刷新到登录状态
        window.location.reload(); // 临时解决方案
        
        showMessage(
            currentLanguage === 'zh' ? '已成功退出登录' : 'Successfully signed out',
            'success'
        );
        
    } catch (error) {
        console.error('Logout error:', error);
        showMessage(
            currentLanguage === 'zh' ? '退出登录失败' : 'Sign out failed',
            'error'
        );
    }
}

// =================== 导出的消息和表单函数（保持向后兼容） ===================

export function showError(message) {
    showMessage(message, 'error');
}

export function showSuccess(message) {
    showMessage(message, 'success');
}

export function showMessage(message, type = 'info', duration = 5000) {
    const existingMessage = document.querySelector('.message-notification');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `message-notification ${type}`;
    messageEl.innerHTML = `
        <div class="message-content">
            <i class="fas ${getMessageIcon(type)}"></i>
            <span>${message}</span>
            <button class="message-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.classList.add('show');
    }, 100);
    
    if (duration > 0) {
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 300);
        }, duration);
    }
}

function getMessageIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

export function validateForm(email, password, isRegister = false) {
    const errors = [];
    
    if (!email) {
        errors.push(currentLanguage === 'zh' ? '请输入邮箱地址' : 'Please enter email address');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(currentLanguage === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email address');
    }
    
    if (!password) {
        errors.push(currentLanguage === 'zh' ? '请输入密码' : 'Please enter password');
    } else if (isRegister && password.length < 6) {
        errors.push(currentLanguage === 'zh' ? '密码至少需要6个字符' : 'Password must be at least 6 characters');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

export function showFormErrors(errors) {
    const existingErrors = document.querySelectorAll('.form-error');
    existingErrors.forEach(error => error.remove());
    
    if (errors.length > 0) {
        const errorMessage = errors.join('<br>');
        showError(errorMessage);
    }
}

export function getCurrentUIState() {
    return currentUIState;
}

export function getCurrentUser() {
    return { user: currentUser, userData: currentUserData };
}

export function resetUI() {
    currentUIState = UI_STATES.LOGIN;
    currentUser = null;
    currentUserData = null;
    appointmentData = {};
    
    // 移除用户头部信息
    const userHeaderInfo = document.querySelector('.user-header-info');
    if (userHeaderInfo) {
        userHeaderInfo.remove();
    }
     // 确保header恢复原始状态
    const header = document.querySelector('header');
    if (header) {
        const userInfo = header.querySelector('.user-header-info');
        if (userInfo) {
            userInfo.remove();
        }
    }
    // 隐藏聊天助理
    hideChatAssistant();
    
    switchToLoginMode();
}

/**
 * 验证表单步骤
 * @param {number} step - 要验证的步骤号
 * @returns {boolean} 验证是否通过
 */
function validateFormStep(step) {
    let isValid = true;
    const errors = [];
    
    if (step === 1) {
        // 验证基本信息
        const patientName = document.getElementById('patient-name')?.value.trim();
        const patientPhone = document.getElementById('patient-phone')?.value.trim();
        
        if (!patientName) {
            errors.push(currentLanguage === 'zh' ? '请输入患者姓名' : 'Please enter patient name');
            isValid = false;
        }
        
        if (!patientPhone) {
            errors.push(currentLanguage === 'zh' ? '请输入联系电话' : 'Please enter phone number');
            isValid = false;
        }
    }
    
    if (step === 2) {
        // 验证预约详情
        const appointmentDate = document.getElementById('appointment-date')?.value;
        const appointmentTime = document.getElementById('appointment-time')?.value;
        const clinicLocation = document.getElementById('clinic-location')?.value;
        
        if (!appointmentDate) {
            errors.push(currentLanguage === 'zh' ? '请选择预约日期' : 'Please select appointment date');
            isValid = false;
        }
        
        if (!appointmentTime) {
            errors.push(currentLanguage === 'zh' ? '请选择预约时间' : 'Please select appointment time');
            isValid = false;
        }
        
        if (!clinicLocation) {
            errors.push(currentLanguage === 'zh' ? '请选择就诊门店' : 'Please select clinic location');
            isValid = false;
        }
    }
    
    if (step === 3) {
        // 验证服务类型
        const serviceType = document.getElementById('service-type')?.value;
        
        if (!serviceType) {
            errors.push(currentLanguage === 'zh' ? '请选择服务类型' : 'Please select service type');
            isValid = false;
        }
    }
    
    if (!isValid) {
        showFormValidationErrors(errors);
    }
    
    return isValid;
}

/**
 * 显示表单验证错误（温和提示）
 */
function showFormValidationErrors(errors) {
    const errorMessage = errors.join('、');
    showMessage(errorMessage, 'info', 3000); // 使用info类型，不用error的红色
}

// 导出全局函数供HTML使用
window.nextFormStep = function(step) {
    const currentStepNum = document.querySelector('.form-step.active').id.split('-')[1];
    
    // 验证当前步骤
    if (!validateFormStep(parseInt(currentStepNum))) {
        return; // 验证失败，不允许进入下一步
    }
    
    const currentStep = document.querySelector('.form-step.active');
    const nextStep = document.getElementById(`step-${step}`);
    
    if (currentStep && nextStep) {
        currentStep.classList.remove('active');
        nextStep.classList.add('active');
    }
};

window.prevFormStep = function(step) {
    const currentStep = document.querySelector('.form-step.active');
    const prevStep = document.getElementById(`step-${step}`);
    
    if (currentStep && prevStep) {
        currentStep.classList.remove('active');
        prevStep.classList.add('active');
    }
};

window.showAppointmentPreview = showAppointmentPreview;

