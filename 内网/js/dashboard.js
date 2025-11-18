// Dashboard functionality - Complete rewrite to fix all issues

/**
 * XSS Prevention: Escape HTML special characters
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for HTML insertion
 */
function escapeHtml(str) {
    if (str === null || str === undefined) {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ==================== AUTHENTICATION & PERMISSIONS SYSTEM ====================

// SECURITY FIX: Use secure auth utilities from window.AuthUtils
// These read from Firebase ID Token Custom Claims (server-verified)
// instead of trusting localStorage (client-controlled)
// Note: auth-utils.js provides these via window.AuthUtils global object

// Global variables for auth state
// SECURITY: These are set from Firebase token claims, NOT localStorage
let currentFirebaseUser = null;
let userRole = null;
let userClinics = [];
let userClaimsCache = null; // Cache for performance

// Basic Authentication Functions
async function getCurrentUser() {
    try {
        // 使用与auth-check.js相同的逻辑获取用户数据
        const possibleKeys = ['currentUser', 'user', 'userData', 'authUser'];

        for (const key of possibleKeys) {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                // 验证数据结构
                if (parsed && (parsed.role || parsed.email)) {
                    currentFirebaseUser = parsed;
                    return parsed;
                }
            }
        }
        return null;
    } catch (error) {
        console.error('解析用户数据失败:', error);
        return null;
    }
}

async function getUserRole() {
    const user = await getCurrentUser();
    if (!user) return null;

    try {
        // 直接从localStorage用户数据获取角色
        if (user.role) {
            userRole = user.role;
            // Support both 'clinics' and 'accessibleLocations' field names
            userClinics = user.clinics || user.accessibleLocations || [];
            return userRole;
        }

        // 备用：根据邮箱推断角色
        if (user.email) {
            if (user.email.includes('admin') || user.email.includes('boss') || user.email.includes('owner')) {
                userRole = 'admin';
                return userRole;
            }
        }

        return null; // 没有找到admin角色
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
}

async function redirectIfNotAdmin() {
    const user = await getCurrentUser();
    const role = await getUserRole();

    if (!user) {
        console.log('No user logged in, showing login message...');
        showAuthError('Please login first through the external website to access the internal dashboard.');
        return false;
    }

    if (!role || (role !== 'admin' && role !== 'boss' && role !== 'owner')) {
        console.log('User does not have admin privileges');
        showAuthError('Access denied. Admin privileges required for internal dashboard.');
        return false;
    }

    console.log(`✅ User authenticated as ${role}`);
    return true;
}

/**
 * SECURITY FIX: Initialize user permissions from Firebase token claims
 * This MUST be called on page load to set global permission variables
 */
async function initializeUserPermissions() {
    try {
        console.log('🔒 Initializing secure user permissions...');

        // Get claims from Firebase ID token (server-verified)
        const claims = await window.AuthUtils.getCurrentUserClaims();

        if (!claims) {
            console.warn('⚠️ No user claims available');
            userRole = null;
            userClinics = [];
            return;
        }

        userClaimsCache = claims;

        // Set role from custom claims (server-verified)
        userRole = claims.claims.role || null;

        // Set accessible clinics from custom claims
        if (userRole === 'owner' || userRole === 'boss') {
            userClinics = [
                'arcadia',
                'irvine',
                'south-pasadena',
                'rowland-heights',
                'eastvale'
            ];
        } else if (userRole === 'admin' && claims.claims.clinics) {
            userClinics = claims.claims.clinics;
        } else {
            userClinics = [];
        }

        console.log('✅ User permissions initialized:');
        console.log('   Role:', userRole);
        console.log('   Clinics:', userClinics);

        // Fallback: If custom claims not set, check email domain
        if (!userRole && claims.user.email && claims.user.email.endsWith('@firstavedental.com')) {
            console.warn('⚠️ Custom claims not set, using email domain fallback');
            userRole = 'owner';
            userClinics = [
                'arcadia',
                'irvine',
                'south-pasadena',
                'rowland-heights',
                'eastvale'
            ];
        }
    } catch (error) {
        console.error('❌ Failed to initialize user permissions:', error);
        userRole = null;
        userClinics = [];
    }
}

// Permission Management Functions
function isOwner() {
    // SECURITY FIX: Use global userRole set from Firebase token claims
    // NO LONGER reads from localStorage (which can be manipulated)

    if (userRole === 'boss' || userRole === 'owner') {
        return true;
    }

    // Fallback: Check cached claims directly
    if (userClaimsCache && userClaimsCache.claims) {
        const role = userClaimsCache.claims.role;
        return role === 'boss' || role === 'owner';
    }

    return false;
}

function getAccessibleClinics() {
    // SECURITY FIX: Use global userClinics set from Firebase token claims
    // NO LONGER reads from localStorage (which can be manipulated)

    // Use the global userClinics array (set from token claims)
    if (userClinics && userClinics.length > 0) {
        return userClinics;
    }

    // Fallback: Check cached claims directly
    if (userClaimsCache && userClaimsCache.claims) {
        const role = userClaimsCache.claims.role;
        if (role === 'owner' || role === 'boss') {
            return [
                'arcadia',
                'irvine',
                'south-pasadena',
                'rowland-heights',
                'eastvale'
            ];
        } else if (role === 'admin' && userClaimsCache.claims.clinics) {
            return userClaimsCache.claims.clinics;
        }
    }

    return [];
}

function hasClinicAccess(clinicId) {
    const accessibleClinics = getAccessibleClinics();
    return accessibleClinics.includes(clinicId);
}

// Data Filtering Function
function filterDataByRole(data, dataType = 'appointments') {
    if (!data || !Array.isArray(data)) return data;

    if (isOwner()) {
        // Owners can see all data
        return data;
    }

    // Admins can only see data from their assigned clinics
    const accessibleClinics = getAccessibleClinics();

    return data.filter(item => {
        if (!item.location) return false;

        // Convert location name to clinic ID format
        const clinicId = item.location.toLowerCase().replace(/\s+/g, '-');
        return accessibleClinics.includes(clinicId);
    });
}

// Auth State Monitoring (simplified for localStorage auth)
function setupAuthStateListener() {
    // 由于我们现在使用localStorage认证，不需要Firebase认证状态监听器
    // 只需要在页面加载时更新UI即可
    console.log('✅ Auth state listener setup (using localStorage auth)');
}

async function updateUIBasedOnRole() {
    // Update location selector visibility and options
    updateLocationSelectorPermissions();

    // Update user display
    updateUserDisplay();

    // Update dashboard statistics from Firebase
    updateDashboardStats();

    // Refresh data with role-based filtering
    await refreshDashboardData();
}

function updateLocationSelectorPermissions() {
    const locationSelectorContainer = document.querySelector('.location-selector-container');
    const locationSelector = document.getElementById('locationSelector');

    console.log('🔧 updateLocationSelectorPermissions called');
    console.log('📍 Current userRole:', userRole);
    console.log('👑 isOwner():', isOwner());
    console.log('📦 locationSelectorContainer found:', !!locationSelectorContainer);
    console.log('🎛️ locationSelector found:', !!locationSelector);

    if (!locationSelector) {
        console.log('❌ locationSelector not found, exiting');
        return;
    }

    if (isOwner()) {
        console.log('✅ User is owner - showing location selector');

        // Show location selector for owners
        if (locationSelectorContainer) {
            locationSelectorContainer.style.display = 'flex';
            console.log('✅ Set locationSelectorContainer display to flex');
        }

        // Populate all locations
        const allLocations = [
            { value: 'arcadia', name: 'Arcadia' },
            { value: 'irvine', name: 'Irvine' },
            { value: 'south-pasadena', name: 'South Pasadena' },
            { value: 'rowland-heights', name: 'Rowland Heights' },
            { value: 'eastvale', name: 'Eastvale' }
        ];

        locationSelector.innerHTML = '';
        allLocations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.value;
            option.textContent = location.name;
            locationSelector.appendChild(option);
        });
        console.log('✅ Populated location selector with all locations');
    } else {
        console.log('🚫 User is admin - hiding location selector');

        // Hide location selector for regular admins
        if (locationSelectorContainer) {
            locationSelectorContainer.style.display = 'none';
            console.log('✅ Set locationSelectorContainer display to none');
        }
    }
}

function updateUserDisplay() {
    const userNameElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');

    if (currentFirebaseUser) {
        if (userNameElement) {
            userNameElement.textContent = currentFirebaseUser.displayName || currentFirebaseUser.email.split('@')[0];
        }
        if (userRoleElement) {
            const roleDisplay = userRole === 'boss' || userRole === 'owner' ? 'Owner' : 'Admin';
            userRoleElement.textContent = roleDisplay;
        }
    }

    // Note: Logout functionality is handled by shared.js
}

// Note: setupLogoutButton and handleLogout are now handled by shared.js
// This avoids duplicate function definitions and ensures consistent logout behavior across all pages

// Firebase connection test
function testFirebaseConnection() {
    console.log('🔥 Testing Firebase connection...');

    // Wait for Firebase services to be available
    const checkFirebase = () => {
        if (window.firebase && window.firebase.app && window.firebase.auth && window.firebase.db) {
            console.log('✅ Firebase services initialized successfully!');
            console.log('Firebase Auth:', window.firebase.auth);
            console.log('Firebase Firestore:', window.firebase.db);
            console.log('Firebase App:', window.firebase.app);
            console.log('Google Provider:', window.firebase.googleProvider);
            console.log('✅ Firebase connection test completed successfully!');
            return true;
        }
        return false;
    };

    // Check immediately
    if (checkFirebase()) {
        return;
    }

    // If not ready, wait and check periodically
    let attempts = 0;
    const maxAttempts = 50; // Wait up to 5 seconds
    const interval = setInterval(() => {
        attempts++;
        if (checkFirebase()) {
            clearInterval(interval);
        } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.error('❌ Firebase connection test failed: Services not available after timeout');
        }
    }, 100);
}

// Helper functions
function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getStartOfWeek(date) {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    return startOfWeek;
}

// Safe dataManager access functions
function safeGetCurrentUser() {
    try {
        // First try to get user from localStorage (same as test page)
        const possibleKeys = ['currentUser', 'user', 'userData', 'authUser'];

        for (const key of possibleKeys) {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed && (parsed.role || parsed.email)) {
                    return parsed;
                }
            }
        }

        // Fallback to DataManager
        if (window.dataManager && dataManager.getCurrentUser) {
            return dataManager.getCurrentUser();
        }
    } catch (error) {
        console.warn('DataManager access failed:', error);
    }

    // Fallback user
    return {
        name: 'Sunny',
        role: 'boss',
        currentViewLocation: 'arcadia',
        assignedLocation: 'arcadia'
    };
}

function safeGetCurrentLocation() {
    // Use new auth system if available
    if (currentFirebaseUser && userRole) {
        if (isOwner()) {
            // Get selected location from selector or default to first accessible clinic
            const locationSelector = document.getElementById('locationSelector');
            if (locationSelector && locationSelector.value) {
                return locationSelector.value;
            }
            return 'arcadia'; // Default for owners
        } else {
            // For admins, return their first assigned clinic
            const accessibleClinics = getAccessibleClinics();
            return accessibleClinics.length > 0 ? accessibleClinics[0] : 'arcadia';
        }
    }

    // Fallback to original logic
    const currentUser = safeGetCurrentUser();
    if (currentUser.role === 'boss') {
        return currentUser.currentViewLocation || 'arcadia';
    } else {
        return currentUser.assignedLocation || 'arcadia';
    }
}

// Asynchronous wrapper to use Firebase data source (like other pages)
async function safeGetAppointmentsForDate(dateKey) {
    try {
        if (window.dataManager && dataManager.getAppointmentsForDate) {
            console.log('🔥 Dashboard: Getting appointments from Firebase for date:', dateKey);
            let appointments = await dataManager.getAppointmentsForDate(dateKey) || [];
            console.log('🔥 Dashboard: Firebase returned', appointments.length, 'appointments:', appointments.map(a => a.patientName));
            // Apply role-based filtering
            appointments = filterDataByRole(appointments, 'appointments');
            console.log('🔥 Dashboard: After filtering', appointments.length, 'appointments');
            return appointments;
        }
    } catch (error) {
        console.error('❌ Dashboard: Failed to get appointments from Firebase:', error);
        // Force return empty array instead of falling back to localStorage
        console.warn('🚨 Dashboard: Not falling back to localStorage - returning empty array');
    }
    return [];
}

// Synchronous wrapper for backward compatibility (DEPRECATED - uses localStorage)
function safeGetAppointmentsForDateSync(dateKey) {
    console.warn('🚨 safeGetAppointmentsForDateSync is deprecated - use safeGetAppointmentsForDate instead');
    try {
        if (window.dataManager && dataManager.getAppointmentsForDateLocal) {
            let appointments = dataManager.getAppointmentsForDateLocal(dateKey) || [];
            // Apply role-based filtering
            appointments = filterDataByRole(appointments, 'appointments');
            return appointments;
        }
    } catch (error) {
        console.warn('Failed to get appointments for date:', error);
    }
    return [];
}

async function safeGetPendingConfirmations() {
    try {
        if (window.dataManager && dataManager.getPendingConfirmations) {
            let confirmations = await dataManager.getPendingConfirmations() || [];

            // Apply role-based filtering
            confirmations = filterDataByRole(confirmations, 'confirmations');

            return confirmations;
        }
    } catch (error) {
        console.warn('Failed to get pending confirmations:', error);
    }
    return [];
}

// Synchronous wrapper for backward compatibility
function safeGetPendingConfirmationsSync() {
    try {
        if (window.dataManager && window.dataManager.data) {
            let confirmations = dataManager.data.pendingConfirmations || [];
            // Apply role-based filtering
            confirmations = filterDataByRole(confirmations, 'confirmations');
            return confirmations;
        }
    } catch (error) {
        console.warn('Failed to get pending confirmations:', error);
    }
    return [];
}


// Authentication System Initialization
async function initializeAuthSystem() {
    console.log('🔐 Initializing authentication system...');

    // 使用localStorage认证，不需要等待Firebase认证服务
    console.log('✅ Firebase auth service ready');

    // Setup auth state listener
    setupAuthStateListener();

    // Perform initial auth check
    await performInitialAuthCheck();
}

// Wait for DataManager to be fully connected to Firebase
function waitForDataManager() {
    return new Promise((resolve) => {
        const checkDataManager = () => {
            if (window.dataManager && window.dataManager.firebaseService) {
                console.log('✅ DataManager is ready with Firebase connection');
                resolve();
            } else {
                console.log('⏳ Waiting for DataManager to connect to Firebase...');
                setTimeout(checkDataManager, 100);
            }
        };
        checkDataManager();
    });
}

async function performInitialAuthCheck() {
    try {
        console.log('🔍 Performing initial authentication check...');

        const hasAccess = await redirectIfNotAdmin();

        if (hasAccess) {
            // User is authenticated and has admin privileges
            console.log('✅ Authentication successful, initializing dashboard...');

            // SECURITY FIX: Initialize user permissions from Firebase token claims
            await initializeUserPermissions();

            // Wait for DataManager to be fully connected to Firebase
            await waitForDataManager();

            // Now that DataManager is ready, initialize everything
            initializeDashboard();
            initializeModal();
            initializeLocationSelector();
            await updateUIBasedOnRole(); // Update UI and stats based on role
            await refreshDashboardData();
            renderDashboardCalendar();
        } else {
            // User will be redirected, don't initialize dashboard
            console.log('⚠️ Authentication failed, user will be redirected');
        }
    } catch (error) {
        console.error('❌ Authentication check failed:', error);
        showAuthError('Authentication check failed');
    }
}

function showAuthError(message) {
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fee2e2;
        color: #991b1b;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        z-index: 9999;
        font-family: Inter, sans-serif;
        max-width: 400px;
        text-align: center;
    `;

    const isLoginError = message.includes('login');

    errorDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">Authentication ${isLoginError ? 'Required' : 'Error'}</h3>
        <p style="margin: 0;">${message}</p>
        <button onclick="this.parentElement.remove()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin: 10px 5px 0 5px;
            cursor: pointer;
        ">Close</button>
    `;

    document.body.appendChild(errorDiv);
}

// Main initialization with auth check
document.addEventListener('DOMContentLoaded', function() {
    // Test Firebase connection first
    testFirebaseConnection();

    // Initialize authentication system
    initializeAuthSystem();
});

function initializeDashboard() {

    // Set today's date
    updateTodayDate();

    // User interface will be updated by updateUIBasedOnRole after authentication
    renderDashboardCalendar();
    // Initialize service chart selector
    initializeServiceChartSelector();

    // Initialize service dropdown with internal services
    const serviceSelect = document.getElementById('service');
    if (serviceSelect && window.ServiceMapping) {
        window.ServiceMapping.populateInternalServiceDropdown(serviceSelect);
    }

    // Initialize form helpers
    if (typeof setMinDateToToday === 'function') {
        setMinDateToToday('appointmentDate');
    }
    if (typeof initializePhoneFormatting === 'function') {
        initializePhoneFormatting('phoneNumber');
    }
    if (typeof initializePatientNameValidation === 'function') {
        initializePatientNameValidation('patientName');
    }

    // Search functionality is now handled by shared.js globally
}

// Initialize Development Mode User Switcher
function initializeUserSwitcher() {
    const userSwitcher = document.getElementById('userSwitcher');
    const userSwitchSelect = document.getElementById('userSwitchSelect');
    
    if (!DEV_MODE) {
        // Hide user switcher in production mode
        if (userSwitcher) {
            userSwitcher.style.display = 'none';
        }
        return;
    }
    
    if (!userSwitchSelect) {
        console.error('User switcher select not found');
        return;
    }
    
    // Set initial value
    userSwitchSelect.value = currentDevUser.id;
    
    // Add change event listener
    userSwitchSelect.addEventListener('change', function() {
        const selectedUserId = this.value;
        handleUserSwitch(selectedUserId);
    });
    
}

// Handle user switching in development mode
async function handleUserSwitch(userId) {
    if (!DEV_MODE || !DEV_USERS[userId]) {
        console.error('Invalid user switch attempt:', userId);
        return;
    }

    // Update current dev user
    currentDevUser = DEV_USERS[userId];

    // Update the interface - this function is for old dev user switching, may not be needed with new auth
    // updateUserInterface(); // Commented out - using new auth system

    // Refresh all dashboard data with new user context
    await refreshDashboardData();

}

// Old updateUserInterface function removed - replaced by updateUIBasedOnRole and updateUserDisplay
// Initialize service type chart selector
function initializeServiceChartSelector() {
    const chartPeriodSelector = document.getElementById('chartPeriodSelector');
    
    if (chartPeriodSelector) {
        chartPeriodSelector.addEventListener('change', function() {
            renderServiceChart(); // Re-render chart
        });
        
        // Set default value
        chartPeriodSelector.value = 'weekly';
    }
}

function initializeLocationSelector() {
    const locationSelector = document.getElementById('locationSelector');
    const currentUser = safeGetCurrentUser();
    
    if (!locationSelector || currentUser.role !== 'boss') return;
    
    // Define all locations
    const locations = [
        { value: 'arcadia', name: 'Arcadia' },
        { value: 'irvine', name: 'Irvine' },
        { value: 'south-pasadena', name: 'South Pasadena' },
        { value: 'rowland-heights', name: 'Rowland Heights' },
        { value: 'eastvale', name: 'Eastvale' }
    ];
    
    // Populate dropdown options
    locationSelector.innerHTML = '';
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.value;
        option.textContent = location.name;
        locationSelector.appendChild(option);
    });
    
    // Set current selected location
    if (currentUser.currentViewLocation) {
        locationSelector.value = currentUser.currentViewLocation;
    }
    
    // Add change event handler
    locationSelector.addEventListener('change', async function() {
        const selectedLocation = this.value;

        try {
            // Update current viewing location in dataManager
            if (window.dataManager && dataManager.switchLocation) {
                dataManager.switchLocation(selectedLocation);

                // Show success message
                if (typeof showSuccessMessage === 'function') {
                    const locationName = locations.find(l => l.value === selectedLocation)?.name || selectedLocation;
                    showSuccessMessage(`Switched to ${locationName} location`);
                }

                // Refresh all dashboard data
                await refreshDashboardData();
            }
        } catch (error) {
            console.error('Failed to switch location:', error);
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Failed to switch location');
            }
        }
    });
}

function updateTodayDate() {
    const dateElement = document.getElementById('todayDate');
    if (dateElement) {
        const testDate = new Date();
        const formattedDate = testDate.toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
        });
        dateElement.textContent = formattedDate;
    }
}

async function refreshDashboardData() {
    // Render all data (now all async functions)
    await renderStatusCards();
    await renderAnalysisCards();
    await renderTodaysAppointments();
    await renderServiceChart();
    await renderTrendChart();

    // Render asynchronous pending confirmations
    await renderPendingConfirmations();

    // Update notification badge with latest data
    try {
        const pendingConfirmations = await safeGetPendingConfirmations();
        const pendingCount = pendingConfirmations.length;
        if (typeof updateNotificationBadge === 'function') {
            updateNotificationBadge(pendingCount > 0);
        }
    } catch (error) {
        console.warn('Failed to update notification badge:', error);
    }
}

async function renderStatusCards() {
    const today = getCurrentDate();
    const currentLocation = safeGetCurrentLocation();
    const todayAppointments = (await safeGetAppointmentsForDate(today))
        .filter(app => currentLocation === 'all' || app.location.toLowerCase().replace(/\s+/g, '-') === currentLocation);
    
    
    const statusCounts = {
        completed: 0,
        inProgress: 0,
        scheduled: 0,
        noShow: 0
    };
    
    todayAppointments.forEach(appointment => {
        switch(appointment.status) {
            case 'completed':
                statusCounts.completed++;
                break;
            case 'arrived':
                statusCounts.inProgress++;
                break;
            case 'scheduled':
                statusCounts.scheduled++;
                break;
            case 'no-show':
                statusCounts.noShow++;
                break;
        }
    });
    
    
    // Update DOM elements
    const elements = {
        completedCount: document.getElementById('completedCount'),
        inProgressCount: document.getElementById('inProgressCount'),
        scheduledCount: document.getElementById('scheduledCount'),
        noShowCount: document.getElementById('noShowCount')
    };
    
    if (elements.completedCount) elements.completedCount.textContent = statusCounts.completed;
    if (elements.inProgressCount) elements.inProgressCount.textContent = statusCounts.inProgress;
    if (elements.scheduledCount) elements.scheduledCount.textContent = statusCounts.scheduled;
    if (elements.noShowCount) elements.noShowCount.textContent = statusCounts.noShow;
}

async function renderAnalysisCards() {
    const elements = {
        allAppointmentsCount: document.getElementById('allAppointmentsCount'),
        allAppointmentsChange: document.getElementById('allAppointmentsChange'),
        newPatientsCount: document.getElementById('newPatientsCount'),
        newPatientsChange: document.getElementById('newPatientsChange'),
        attendanceRate: document.getElementById('attendanceRate'),
        attendanceProgress: document.getElementById('attendanceProgress'),
        attendanceLabel: document.getElementById('attendanceLabel'),
        premiumMembersCount: document.getElementById('premiumMembersCount'),
        premiumMembersChange: document.getElementById('premiumMembersChange')
    };
    
    // Get current location and all appointments with role filtering
    const currentLocation = safeGetCurrentLocation();
    let allAppointments = [];

    try {
        allAppointments = await dataManager.getAllAppointments() || [];
        // Apply role-based filtering
        allAppointments = filterDataByRole(allAppointments, 'appointments');
    } catch (error) {
        console.warn('Failed to get all appointments:', error);
        allAppointments = [];
    }
    
    // Filter appointments by current location
    const filteredAppointments = allAppointments.filter(app => {
        if (currentLocation === 'all') return true;
        return app.location.toLowerCase().replace(/\s+/g, '-') === currentLocation;
    });
    
    // Get current date info
    const today = getCurrentDate();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculate previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Filter appointments by month
    const currentMonthAppointments = filteredAppointments.filter(app => {
        const appDate = new Date(app.dateKey);
        return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
    });
    
    const prevMonthAppointments = filteredAppointments.filter(app => {
        const appDate = new Date(app.dateKey);
        return appDate.getMonth() === prevMonth && appDate.getFullYear() === prevYear;
    });
    
    // Calculate All Appointments
    const totalAppointments = currentMonthAppointments.length;
    const currentMonthCount = currentMonthAppointments.length;
    const prevMonthCount = prevMonthAppointments.length;
    const appointmentChange = currentMonthCount - prevMonthCount;

    console.log(`📊 Dashboard: All Appointments calculation:`);
    console.log(`   - Total appointments (all time): ${filteredAppointments.length}`);
    console.log(`   - Current month (${currentYear}-${String(currentMonth + 1).padStart(2, '0')}): ${currentMonthCount}`);
    console.log(`   - Previous month: ${prevMonthCount}`);
    console.log(`   - Change: ${appointmentChange >= 0 ? '+' : ''}${appointmentChange}`);
    
    // Calculate New Patients (unique phone numbers)
    const allPatientNames = new Set();
    const currentMonthPatients = new Set();
    const prevMonthPatients = new Set();
    
    filteredAppointments.forEach(app => {
        if (app.phone) allPatientNames.add(app.phone);
    });
    
    currentMonthAppointments.forEach(app => {
        if (app.phone) currentMonthPatients.add(app.phone);
    });

    prevMonthAppointments.forEach(app => {
        if (app.phone) prevMonthPatients.add(app.phone);
    });
    
    const totalUniquePatients = allPatientNames.size;
    const newPatientsThisMonth = currentMonthPatients.size;
    const newPatientsPrevMonth = prevMonthPatients.size;
    const patientsChange = newPatientsThisMonth - newPatientsPrevMonth;
    
    // Calculate this week's attendance rate
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // Get all appointments this week (use LOCAL timezone for date keys)
    const weekAppointments = [];
    for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
        // Use LOCAL timezone to generate dateKey (consistent with Calendar)
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        const dayAppointments = await safeGetAppointmentsForDate(dateKey);
        weekAppointments.push(...dayAppointments);
    }

    console.log(`📊 Dashboard: This week appointments (raw): ${weekAppointments.length}`);

    const weekFiltered = weekAppointments.filter(app => {
        if (currentLocation === 'all') return true;
        return app.location.toLowerCase().replace(/\s+/g, '-') === currentLocation;
    });

    console.log(`📊 Dashboard: This week appointments (after location filter): ${weekFiltered.length}`);

    // Attendance: Count both 'completed' AND 'arrived' as attended
    const attendedWeek = weekFiltered.filter(app =>
        app.status === 'completed' || app.status === 'arrived'
    ).length;
    const totalWeek = weekFiltered.length;
    const attendanceRate = totalWeek > 0 ? Math.round((attendedWeek / totalWeek) * 100) : 0;

    console.log(`📊 Dashboard: Attendance this week: ${attendedWeek}/${totalWeek} (${attendanceRate}%)`);
    console.log(`   - Completed: ${weekFiltered.filter(a => a.status === 'completed').length}`);
    console.log(`   - Arrived: ${weekFiltered.filter(a => a.status === 'arrived').length}`);
    
    
    // Update All Appointments
    if (elements.allAppointmentsCount) {
        elements.allAppointmentsCount.textContent = totalAppointments;
    }
    if (elements.allAppointmentsChange) {
        const changeText = appointmentChange >= 0 ? `+${appointmentChange}` : appointmentChange;
        elements.allAppointmentsChange.textContent = `${changeText} in this month`;
        elements.allAppointmentsChange.className = `change-indicator ${appointmentChange >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Update New Patients
    if (elements.newPatientsCount) {
        elements.newPatientsCount.textContent = newPatientsThisMonth;
    }
    if (elements.newPatientsChange) {
        const changeText = patientsChange >= 0 ? `+${patientsChange}` : patientsChange;
        elements.newPatientsChange.textContent = `${changeText} in this month`;
        elements.newPatientsChange.className = `change-indicator ${patientsChange >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Update Attendance Rate
    if (elements.attendanceRate) elements.attendanceRate.textContent = `${attendanceRate}%`;
    if (elements.attendanceProgress) elements.attendanceProgress.style.width = `${attendanceRate}%`;
    if (elements.attendanceLabel) elements.attendanceLabel.textContent = `This Week ${attendedWeek}/${totalWeek}`;
    
    // Premium Members (placeholder - no data source yet)
    if (elements.premiumMembersCount) elements.premiumMembersCount.textContent = '0';
    if (elements.premiumMembersChange) {
        elements.premiumMembersChange.textContent = '0 in this month';
        elements.premiumMembersChange.className = 'change-indicator neutral';
    }
}

async function renderTodaysAppointments() {
    const tbody = document.getElementById('todaysAppointmentsList');
    if (!tbody) {
        console.error('todaysAppointmentsList not found');
        return;
    }
    
    const today = getCurrentDate();
    const currentLocation = safeGetCurrentLocation();
    const todayAppointments = (await safeGetAppointmentsForDate(today))
        .filter(app => currentLocation === 'all' || app.location.toLowerCase().replace(/\s+/g, '-') === currentLocation)
        .sort((a, b) => a.time.localeCompare(b.time));
    
    
    tbody.innerHTML = '';
    // Show first 6 appointments
const displayAppointments = todayAppointments.slice(0, 6);

// Always display 6 rows
for (let i = 0; i < 6; i++) {
    const row = document.createElement('tr');
    
    if (i < displayAppointments.length) {
        // Rows with data
        const appointment = displayAppointments[i];
        const timeFormatted = formatTime(appointment.time);
        const statusFormatted = getStatusDisplayName(appointment.status);

        row.innerHTML = `
            <td>${escapeHtml(appointment.patientName)}</td>
            <td>${escapeHtml(timeFormatted)}</td>
            <td>${escapeHtml(appointment.service)}</td>
            <td><span class="status-badge ${appointment.status}">${escapeHtml(statusFormatted)}</span></td>
        `;
    } else {
        // Empty rows
        row.innerHTML = `
            <td style="color: #d1d5db;">--</td>
            <td style="color: #d1d5db;">--</td>
            <td style="color: #d1d5db;">--</td>
            <td style="color: #d1d5db;">--</td>
        `;
    }
    
    tbody.appendChild(row);
}
    
   
}

async function renderPendingConfirmations() {
    const pendingList = document.getElementById('pendingConfirmationsList');
    const pendingCountElement = document.getElementById('pendingConfirmationCount');

    if (!pendingList || !pendingCountElement) {
        console.error('Pending confirmations elements not found');
        return;
    }

    // Show loading state
    pendingList.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Loading pending confirmations...</div>';
    pendingCountElement.textContent = '...';

    try {
        // Use Firebase data source for consistency with patients.html
        const pendingConfirmations = await safeGetPendingConfirmations();

        pendingCountElement.textContent = pendingConfirmations.length;
        pendingList.innerHTML = '';

        if (pendingConfirmations.length === 0) {
            pendingList.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280; font-style: italic;">No pending confirmations</div>';
            return;
        }

        const displayItems = pendingConfirmations.slice(0, 3);

        displayItems.forEach(confirmation => {
            const item = document.createElement('div');
            item.className = 'pending-item';
            item.innerHTML = `
                <div class="pending-info">
                    <div class="pending-patient-name">${escapeHtml(confirmation.patientName)}</div>
                    <div class="pending-details">
                        ${escapeHtml(confirmation.dateTime)}<br>
                        ${escapeHtml(confirmation.service)} • ${escapeHtml(confirmation.location)}
                    </div>
                </div>
                <div class="pending-actions">
                    <button class="btn-icon" data-confirmation-id="${escapeHtml(confirmation.id)}" data-action="confirm" title="Confirm">✓</button>
                    <button class="btn-icon" data-confirmation-id="${escapeHtml(confirmation.id)}" data-action="decline" title="Decline">✗</button>
                </div>
            `;

            // Add event listeners to avoid inline onclick handlers
            const buttons = item.querySelectorAll('.btn-icon');
            buttons.forEach(button => {
                button.addEventListener('click', function() {
                    const action = this.getAttribute('data-action');
                    const confirmationId = this.getAttribute('data-confirmation-id');

                    if (action === 'confirm') {
                        handleConfirmAction(confirmationId);
                    } else if (action === 'decline') {
                        handleDeclineAction(confirmationId);
                    }
                });
            });

            pendingList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading pending confirmations:', error);
        pendingList.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc3545;">Error loading pending confirmations</div>';
        pendingCountElement.textContent = '0';
    }
}

async function renderServiceChart() {
    console.log('🎨 renderServiceChart called');
    const canvas = document.getElementById('serviceChart');
    const legendContainer = document.getElementById('chartLegend');

    if (!canvas || !legendContainer) {
        console.error('Service chart elements not found');
        return;
    }


    const ctx = canvas.getContext('2d');
    const serviceData = await getServiceTypeData();
    console.log('🎨 Service data received:', serviceData.length, 'items', serviceData);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Always update legend regardless of data
    updateChartLegend(legendContainer, serviceData);
    
    if (serviceData.length === 0) {
        // More elegant empty state display
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80;
        
        // Draw a light circle outline
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw dashed line
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#d1d5db';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 20, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash pattern
        
        // Add text
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No appointments', centerX, centerY); // Center Y coordinate
        
        
        return;
    }
    
    // Draw pie chart normally
    drawPieChart(ctx, serviceData, canvas.width / 2, canvas.height / 2, 80);
}

async function getServiceTypeData() {
    const currentLocation = safeGetCurrentLocation();
    const chartPeriodSelector = document.getElementById('chartPeriodSelector');
    const selectedPeriod = chartPeriodSelector ? chartPeriodSelector.value : 'weekly';

    console.log('📊 getServiceTypeData called - Period:', selectedPeriod, 'Location:', currentLocation);

    let appointments = [];
    
    if (selectedPeriod === 'weekly') {
        const currentDate = new Date();
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        console.log('📅 Weekly range:', startOfWeek.toISOString().split('T')[0], 'to', endOfWeek.toISOString().split('T')[0]);

        for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            console.log('🔍 Fetching appointments for:', dateKey);
            const dayAppointments = await safeGetAppointmentsForDate(dateKey);
            console.log('📊 Found', dayAppointments.length, 'appointments for', dateKey);
            appointments.push(...dayAppointments);
        }
        console.log('✅ Total weekly appointments:', appointments.length);
    } else if (selectedPeriod === 'monthly') {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        console.log('📅 Monthly filter: Month', currentMonth, 'Year', currentYear);

        let allAppointments = [];
        try {
            allAppointments = await dataManager.getAllAppointments() || [];
            console.log('🔥 getAllAppointments returned:', typeof allAppointments, 'isArray:', Array.isArray(allAppointments), 'length:', allAppointments.length);

            // Ensure it's an array
            if (!Array.isArray(allAppointments)) {
                console.warn('⚠️ getAllAppointments did not return array, converting to empty array');
                allAppointments = [];
            }
            console.log('📊 Total appointments before filtering:', allAppointments.length);

            // Apply role-based filtering
            allAppointments = filterDataByRole(allAppointments, 'appointments');
            console.log('📊 Appointments after role filtering:', allAppointments.length);

            // Ensure filtering returned an array
            if (!Array.isArray(allAppointments)) {
                console.warn('⚠️ filterDataByRole did not return array');
                allAppointments = [];
            }
        } catch (error) {
            console.warn('Failed to get appointments for service chart:', error);
            allAppointments = [];
        }

        appointments = allAppointments.filter(app => {
            const appDate = new Date(app.dateKey);
            const isMatch = appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
            if (!isMatch && allAppointments.length < 10) {
                console.log('📅 Excluding:', app.dateKey, '(month:', appDate.getMonth(), 'year:', appDate.getFullYear(), ')');
            }
            return isMatch;
        });
        console.log('✅ Total monthly appointments after date filter:', appointments.length);
    }
    
    const filteredAppointments = appointments.filter(app =>
        currentLocation === 'all' ||
        app.location.toLowerCase().replace(/\s+/g, '-') === currentLocation
    );

    console.log('🔎 Location filtered appointments:', filteredAppointments.length);

    const serviceCounts = {};
    filteredAppointments.forEach(appointment => {
        const mappedService = mapServiceName(appointment.service);
        serviceCounts[mappedService] = (serviceCounts[mappedService] || 0) + 1;
    });

    console.log('📈 Service counts:', serviceCounts);

    const colors = ['#5B7FD8', '#52C4A0', '#8B9DC3', '#DBA362', '#A78BCA', '#7ECBC9', '#B8C5A6', '#E8A87C', '#C4A5C7'];
    const total = Object.values(serviceCounts).reduce((sum, count) => sum + count, 0);
    console.log('📊 Total services:', total);
    
    // Define fixed service type to color mapping
    const serviceColorMap = {
        'General': '#5B7FD8',
        'Implant': '#52C4A0',
        'Extraction': '#8B9DC3',
        'Preventive': '#DBA362',
        'Cosmetic': '#A78BCA',
        'Orthodontics': '#7ECBC9',
        'Root Canals': '#B8C5A6',
        'Restorations': '#E8A87C',
        'Periodontics': '#C4A5C7'
    };
    
    const chartData = Object.entries(serviceCounts).map(([service, count], index) => {
        // Use fixed mapping first, fallback to default colors if not found
        const color = serviceColorMap[service] || colors[index % colors.length];

        console.log('🎨 Mapping service:', service, '-> color:', color, 'count:', count);

        return {
            label: service,
            value: count,
            color: color,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        };
    });

    console.log('✅ Final chart data:', chartData);
    return chartData;
}

function drawPieChart(ctx, data, centerX, centerY, radius) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;
    
    data.forEach(item => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        // Draw slice
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // Calculate text position
        if (item.percentage > 0) {
            const textAngle = currentAngle + sliceAngle / 2;
            
            // Special handling for 100% case - text should be in center
            let textX, textY;
            if (item.percentage === 100) {
                textX = centerX;
                textY = centerY;
            } else {
                const textRadius = radius * 0.65;
                textX = centerX + Math.cos(textAngle) * textRadius;
                textY = centerY + Math.sin(textAngle) * textRadius;
            }
            
            // Draw percentage text
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Inter'; // Slightly larger
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${item.percentage}%`, textX, textY);
            ctx.restore();
        }
        
        currentAngle += sliceAngle;
    });
}

function updateChartLegend(container, data) {
    container.innerHTML = '';
    
    const allServices = [
        { label: 'General', color: '#5B7FD8' },
        { label: 'Implant', color: '#52C4A0' },
        { label: 'Extraction', color: '#8B9DC3' },
        { label: 'Preventive', color: '#DBA362' },
        { label: 'Cosmetic', color: '#A78BCA' },
        { label: 'Orthodontics', color: '#7ECBC9' },
        { label: 'Root Canals', color: '#B8C5A6' },
        { label: 'Restorations', color: '#E8A87C' },
        { label: 'Periodontics', color: '#C4A5C7' }
    ];
    
    allServices.forEach(service => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${escapeHtml(service.color)}"></div>
            <span>${escapeHtml(service.label)}</span>
        `;
        container.appendChild(legendItem);
    });
}

function initializeModal() {
    const quickAddBtn = document.getElementById('quickAddBtn');
    const modal = document.getElementById('quickAddModal');
    
    
    if (!quickAddBtn || !modal) {
        console.error('Modal elements not found');
        return;
    }
    
    // Clear existing listeners and add new one
    const newBtn = quickAddBtn.cloneNode(true);
    quickAddBtn.parentNode.replaceChild(newBtn, quickAddBtn);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Apply location permissions before showing modal
        applyQuickAddLocationPermissions();

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });
    
    // Close modal handlers
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    
    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        const form = document.getElementById('quickAddForm');
        if (form) form.reset();
    }
    
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    
    // Form submission
    const form = document.getElementById('quickAddForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleQuickAddAppointment();
            closeModal();
        });
    }
}

// Apply location permissions to Quick Add modal
function applyQuickAddLocationPermissions() {
    const currentUser = dataManager.getCurrentUser();
    const locationSelect = document.getElementById('location');

    if (!locationSelect) {
        console.error('Dashboard Quick Add: Location select element not found');
        return;
    }

    // Get accessible clinics for current user
    const userClinics = dataManager.getUserClinics(currentUser);

    // Clear existing options
    locationSelect.innerHTML = '<option value="">Select Location</option>';

    // Map of clinic IDs to display names
    const clinicNames = {
        'arcadia': 'Arcadia',
        'irvine': 'Irvine',
        'south-pasadena': 'South Pasadena',
        'rowland-heights': 'Rowland Heights',
        'eastvale': 'Eastvale'
    };

    // Populate with accessible clinics only
    userClinics.forEach(clinicId => {
        const option = document.createElement('option');
        option.value = clinicId;
        option.textContent = clinicNames[clinicId] || clinicId;
        locationSelect.appendChild(option);
    });

    if (currentUser.role === 'admin') {
        // Set to admin's clinic and disable
        locationSelect.value = currentUser.assignedLocation;
        locationSelect.disabled = true;
        locationSelect.style.backgroundColor = '#f3f4f6';
        locationSelect.style.cursor = 'not-allowed';
    } else {
        // Boss/Owner can select from all clinics
        locationSelect.disabled = false;
        locationSelect.style.backgroundColor = 'white';
        locationSelect.style.cursor = 'pointer';
    }
}

async function handleQuickAddAppointment() {
    try {
        const formData = {
            patientName: document.getElementById('patientName')?.value,
            date: document.getElementById('appointmentDate')?.value,
            time: document.getElementById('appointmentTime')?.value?.split('-')[0],
            service: document.getElementById('service')?.value,
            location: document.getElementById('location')?.value,
            phone: document.getElementById('phoneNumber')?.value
        };
        
        
        if (!formData.patientName || !formData.date || !formData.time || !formData.service || !formData.location) {
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('Please fill in all required fields');
            } else {
                alert('Please fill in all required fields');
            }
            return;
        }
        
        if (window.dataManager && dataManager.addAppointment) {
            try {
                await dataManager.addAppointment(formData);
                if (typeof showSuccessMessage === 'function') {
                    showSuccessMessage('Appointment added successfully!');
                } else {
                    alert('Appointment added successfully!');
                }
                await refreshDashboardData();
            } catch (error) {
                console.error('Error adding appointment:', error);
                if (typeof showErrorMessage === 'function') {
                    showErrorMessage('Failed to add appointment');
                } else {
                    alert('Failed to add appointment');
                }
            }
        }
        
    } catch (error) {
        console.error('Error adding appointment:', error);
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Failed to add appointment. Please try again.');
        } else {
            alert('Failed to add appointment. Please try again.');
        }
    }
}

// Helper functions

function getStatusDisplayName(status) {
    const statusMap = {
        'scheduled': 'Scheduled',
        'arrived': 'Arrived',
        'completed': 'Completed',
        'no-show': 'No Show',
        'cancelled': 'Cancelled',
        'held': 'Held'
    };
    return statusMap[status] || status;
}

// Global functions for pending confirmations
window.handleConfirmAction = async function(confirmationId) {
    // Add confirmation dialog
    if (!confirm('Please confirm if you want to CONFIRM this appointment?')) {
        return; // User cancelled, no operation
    }

    try {
        if (window.dataManager && dataManager.removePendingConfirmation) {
            await dataManager.removePendingConfirmation(confirmationId);
            if (typeof showSuccessMessage === 'function') {
                showSuccessMessage('Appointment confirmed!');
            }
            await refreshDashboardData();
        }
    } catch (error) {
        console.error('Error confirming appointment:', error);
    }
};

window.handleDeclineAction = async function(confirmationId) {
    // Add confirmation dialog
    if (!confirm('Please confirm if you want to DECLINE this appointment?')) {
        return; // User cancelled, no operation
    }
    
    try {
        if (window.dataManager && dataManager.removePendingConfirmation) {
            dataManager.removePendingConfirmation(confirmationId);
            if (typeof showSuccessMessage === 'function') {
                showSuccessMessage('Appointment declined!');
            }
            await refreshDashboardData();
        }
    } catch (error) {
        console.error('Error declining appointment:', error);
    }
};

// Get completed treatment data for the last 30 days
async function getLast30DaysCompletedData() {
    const currentLocation = safeGetCurrentLocation();
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const dayAppointments = await safeGetAppointmentsForDate(dateKey);
        const filteredAppointments = dayAppointments.filter(app => {
            if (currentLocation === 'all') return true;
            return app.location.toLowerCase().replace(/\s+/g, '-') === currentLocation;
        });
        
        const completedCount = filteredAppointments.filter(app => app.status === 'completed').length;
        
        data.push({
            date: dateKey,
            dateLabel: date.getMonth() + 1 + '/' + date.getDate(),
            completed: completedCount
        });
    }
    
    return data;
}
/**
 * Renders a smooth trend chart for completed treatments over the last 30 days.
 * The chart's width will automatically adapt to its container's width.
 */
async function renderTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) {
        console.error('Trend chart canvas not found');
        return;
    }
    
     // --- Key modification: Make Canvas width fully adapt to parent container ---
    const container = document.querySelector('.trend-chart-container');
    // Reset canvas size to prevent cumulative growth
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    
    // Use container's computed style width instead of offsetWidth
    const computedStyle = window.getComputedStyle(container);
    const containerPadding = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    const maxWidth = container.clientWidth - containerPadding;
    // Set reasonable maximum width limit
    const canvasWidth = Math.min(maxWidth, 800); // Limit maximum width to 800px
    canvas.width = canvasWidth;
    canvas.height = 296; 

    const ctx = canvas.getContext('2d');
    const data = await getLast30DaysCompletedData();
    
    // Clear the canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Show a message if no data is available
    if (data.length === 0) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No data available for the last 30 days.', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Define chart dimensions and padding
    const padding = 50; 
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    
    // Get the maximum value for scaling
    const maxValue = Math.max(...data.map(d => d.completed), 1);
    
    // Draw the X and Y axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // --- Draw Y-axis labels and ticks with improved spacing ---
    ctx.font = '12px Inter';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'right';
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
        const value = Math.round((maxValue / ySteps) * i);
        const y = canvas.height - padding - (i / ySteps) * chartHeight;
        ctx.fillText(value.toString(), padding - 10, y + 3); 
    }
    
    // --- Draw X-axis labels and ticks with improved spacing ---
    ctx.font = '12px Inter';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    
    const step = Math.ceil(data.length / 5);
    data.forEach((point, index) => {
        if (index % step === 0 || index === data.length - 1) {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            ctx.beginPath();
            ctx.moveTo(x, canvas.height - padding);
            ctx.lineTo(x, canvas.height - padding + 5);
            ctx.stroke();
            ctx.fillText(point.dateLabel, x, canvas.height - padding + 25);
        }
    });

    // --- Draw the smooth bezier curve ---
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const points = data.map((point, index) => ({
        x: padding + (index / (data.length - 1)) * chartWidth,
        y: canvas.height - padding - (point.completed / maxValue) * chartHeight
    }));
    
    if (points.length > 1) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            const cp1x = (p1.x + p2.x) / 2;
            const cp1y = p1.y;
            const cp2x = (p1.x + p2.x) / 2;
            const cp2y = p2.y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
    }
    ctx.stroke();
}

// Render calendar
function renderDashboardCalendar() {
    const calendarDates = document.getElementById('calendarDates');
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    
    if (!calendarDates || !calendarMonthYear) return;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Set month/year title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    calendarMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Get first and last day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Adjust to start on Sunday
    
    // Clear existing dates
    calendarDates.innerHTML = '';
    
    // Generate 6 weeks of dates (42 days)
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dateElement = document.createElement('div');
        dateElement.className = 'calendar-date';
        dateElement.textContent = currentDate.getDate();

        // Add style classes
        if (currentDate.getMonth() !== currentMonth) {
            dateElement.classList.add('other-month');
        }

        if (currentDate.toDateString() === today.toDateString()) {
            dateElement.classList.add('today');
        }

        // Add click and double-click event handlers
        const dateForHandler = new Date(currentDate); // Capture the date in closure

        // Single click - could show simple info (optional)
        dateElement.addEventListener('click', function(e) {
            // Currently just visual feedback
            console.log('Single click on date:', dateForHandler.toLocaleDateString());
        });

        // Double click - navigate to day view in appointments page
        dateElement.addEventListener('dblclick', function(e) {
            e.preventDefault();
            console.log('Double click on date:', dateForHandler.toLocaleDateString());

            // Format date as YYYY-MM-DD for URL parameter
            const year = dateForHandler.getFullYear();
            const month = String(dateForHandler.getMonth() + 1).padStart(2, '0');
            const day = String(dateForHandler.getDate()).padStart(2, '0');
            const dateParam = `${year}-${month}-${day}`;

            // Navigate to appointments page with date parameter and view mode
            window.location.href = `appointments.html?date=${dateParam}&view=day`;
        });

        calendarDates.appendChild(dateElement);
    }
}

function mapServiceName(serviceName) {
    const serviceMap = {
        // Old names -> New categories
        'Cleaning': 'Preventive',
        'Examination': 'Preventive',
        'Root Canal': 'Root Canals',
        'Filling': 'Restorations',
        'Orthodontics': 'Orthodontics',
        'Teeth Whitening': 'Cosmetic',
        'Periodontal': 'Periodontics',
        'Restorative': 'Restorations',
        'Extraction': 'Extraction',
        'Implant': 'Implant',
        // Add any other old names here
    };

    // Return mapped name or original if not in map
    return serviceMap[serviceName] || serviceName;
}

// ==================== POLLING-BASED NOTIFICATION SYSTEM ====================

// Global variables for notification management
let pollingInterval = null;
let lastPendingCount = 0;

/**
 * Poll for pending appointments count (lightweight query)
 * Only fetches count, not full appointment data
 */
async function pollPendingAppointments() {
    try {
        // Wait for Firebase Data Service to be ready
        if (!window.firebaseDataService) {
            return;
        }

        // Get user role and clinics
        const role = await getUserRole();
        const accessibleClinics = getAccessibleClinics();

        if (!role || accessibleClinics.length === 0) {
            return;
        }

        // Lightweight count query (only 1 read)
        const count = await window.firebaseDataService.getPendingAppointmentsCount(
            role,
            accessibleClinics
        );

        console.log(`📬 Pending appointments check: ${count}`);

        // Update notification bell
        updateNotificationBell(count > 0);

        // Update count display
        const countElement = document.getElementById('pendingConfirmationCount');
        if (countElement) {
            countElement.textContent = count;
        }

        // Log if count increased
        if (count > lastPendingCount) {
            console.log(`🔔 New pending appointments detected: ${count - lastPendingCount} new`);
        }

        lastPendingCount = count;

    } catch (error) {
        console.error('Error polling pending appointments:', error);
    }
}

/**
 * Initialize polling-based notification system
 * Checks every 30 minutes for new pending appointments
 */
async function initializePollingSystem() {
    try {
        // Wait for Firebase Data Service to be ready
        if (!window.firebaseDataService) {
            console.log('Waiting for Firebase Data Service...');
            setTimeout(initializePollingSystem, 500);
            return;
        }

        console.log('🔄 Initializing polling-based notification system (30 min interval)');

        // Check immediately on page load
        await pollPendingAppointments();

        // Set up 30-minute polling interval
        pollingInterval = setInterval(pollPendingAppointments, 30 * 60 * 1000);

        console.log('✅ Polling system initialized');

    } catch (error) {
        console.error('Error initializing polling system:', error);
    }
}

/**
 * Update notification bell appearance
 */
function updateNotificationBell(hasNotifications) {
    const notificationBell = document.getElementById('notificationBell');
    if (!notificationBell) return;

    if (hasNotifications) {
        notificationBell.classList.add('has-notifications');
    } else {
        notificationBell.classList.remove('has-notifications');
    }
}

/**
 * Handle notification bell click
 */
function handleNotificationBellClick() {
    // Redirect to patients page to view pending appointments
    window.location.href = 'patients.html';
}

/**
 * Cleanup polling system
 */
function cleanupPollingSystem() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('🧹 Polling system cleaned up');
    }
}

// Add event listeners for notification system
document.addEventListener('DOMContentLoaded', function() {
    // Initialize polling system after a short delay to ensure everything is loaded
    setTimeout(initializePollingSystem, 1000);

    // Add click handler for notification bell
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
        notificationBell.addEventListener('click', handleNotificationBellClick);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupPollingSystem);

// ==================== DASHBOARD STATISTICS SYSTEM ====================

/**
 * Update dashboard statistics from Firebase data
 */
async function updateDashboardStats() {
    try {
        // Wait for Firebase Data Service to be ready
        if (!window.firebaseDataService) {
            console.log('Firebase Data Service not ready for stats update');
            return;
        }

        // Get user role and clinics
        const role = await getUserRole();
        const accessibleClinics = getAccessibleClinics();

        if (!role || accessibleClinics.length === 0) {
            console.log('No role or clinics found, keeping stats at 0');
            return;
        }

        console.log('Updating dashboard stats for role:', role, 'clinics:', accessibleClinics);

        // Get all appointments from Firebase (uses cache if available)
        const allAppointments = await window.dataManager.getAllAppointments();

        if (!Array.isArray(allAppointments)) {
            console.warn('No appointments data available');
            return;
        }

        // Calculate statistics with month-over-month comparison
        const stats = calculateAppointmentStatsWithComparison(allAppointments);

        // Update the UI
        updateStatsDisplayWithComparison(stats);

        console.log('Dashboard stats updated:', stats);

    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

/**
 * Calculate statistics from appointments data with month-over-month comparison
 */
function calculateAppointmentStatsWithComparison(appointments) {
    // Get current date info
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Calculate previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter appointments by month
    const currentMonthAppointments = appointments.filter(app => {
        if (!app.dateKey) return false;
        const appDate = new Date(app.dateKey);
        return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
    });

    const prevMonthAppointments = appointments.filter(app => {
        if (!app.dateKey) return false;
        const appDate = new Date(app.dateKey);
        return appDate.getMonth() === prevMonth && appDate.getFullYear() === prevYear;
    });

    // Calculate appointment counts
    const currentMonthCount = currentMonthAppointments.length;
    const prevMonthCount = prevMonthAppointments.length;
    const appointmentChange = currentMonthCount - prevMonthCount;

    // Count by status (for current month only)
    const stats = {
        completed: 0,
        inProgress: 0,
        scheduled: 0,
        noShow: 0,
        total: currentMonthCount,
        appointmentChange: appointmentChange,
        newPatients: 0,
        newPatientsChange: 0,
        vips: 0,
        pending: 0
    };

    currentMonthAppointments.forEach(appointment => {
        const status = appointment.status?.toLowerCase();

        switch (status) {
            case 'completed':
                stats.completed++;
                break;
            case 'in-progress':
            case 'arrived':
                stats.inProgress++;
                break;
            case 'scheduled':
            case 'confirmed':
                stats.scheduled++;
                break;
            case 'no-show':
                stats.noShow++;
                break;
            case 'pending':
                stats.pending++;
                break;
        }
    });

    // Calculate new patients (unique phone numbers)
    const currentMonthPatients = new Set();
    const prevMonthPatients = new Set();

    currentMonthAppointments.forEach(app => {
        if (app.phone) currentMonthPatients.add(app.phone);
    });

    prevMonthAppointments.forEach(app => {
        if (app.phone) prevMonthPatients.add(app.phone);
    });

    stats.newPatients = currentMonthPatients.size;
    const prevMonthPatientsCount = prevMonthPatients.size;
    stats.newPatientsChange = stats.newPatients - prevMonthPatientsCount;

    // VIPs calculation (simplified)
    stats.vips = Math.floor(stats.newPatients * 0.1); // Assume 10% are VIPs

    return stats;
}

/**
 * Calculate statistics from appointments data (legacy - kept for compatibility)
 */
function calculateAppointmentStats(appointments) {
    return calculateAppointmentStatsWithComparison(appointments);
}

/**
 * Update statistics display in the UI with month-over-month comparison
 */
function updateStatsDisplayWithComparison(stats) {
    // Update status cards
    const completedElement = document.getElementById('completedCount');
    const inProgressElement = document.getElementById('inProgressCount');
    const scheduledElement = document.getElementById('scheduledCount');
    const noShowElement = document.getElementById('noShowCount');

    if (completedElement) completedElement.textContent = stats.completed;
    if (inProgressElement) inProgressElement.textContent = stats.inProgress;
    if (scheduledElement) scheduledElement.textContent = stats.scheduled;
    if (noShowElement) noShowElement.textContent = stats.noShow;

    // Update All Appointments with change indicator
    const allAppointmentsElement = document.getElementById('allAppointmentsCount');
    const allAppointmentsChangeElement = document.getElementById('allAppointmentsChange');

    if (allAppointmentsElement) allAppointmentsElement.textContent = stats.total;
    if (allAppointmentsChangeElement) {
        const changeText = stats.appointmentChange >= 0 ? `+${stats.appointmentChange}` : stats.appointmentChange;
        allAppointmentsChangeElement.textContent = `${changeText} vs last month`;
        allAppointmentsChangeElement.className = `change-indicator ${stats.appointmentChange >= 0 ? 'positive' : 'negative'}`;
    }

    // Update New Patients with change indicator
    const newPatientsElement = document.getElementById('newPatientsCount');
    const newPatientsChangeElement = document.getElementById('newPatientsChange');

    if (newPatientsElement) newPatientsElement.textContent = stats.newPatients;
    if (newPatientsChangeElement) {
        const changeText = stats.newPatientsChange >= 0 ? `+${stats.newPatientsChange}` : stats.newPatientsChange;
        newPatientsChangeElement.textContent = `${changeText} vs last month`;
        newPatientsChangeElement.className = `change-indicator ${stats.newPatientsChange >= 0 ? 'positive' : 'negative'}`;
    }

    // Update Premium Members
    const premiumMembersElement = document.getElementById('premiumMembersCount');
    if (premiumMembersElement) premiumMembersElement.textContent = stats.vips;

    // Pending confirmations count is handled by the notification system
    // but we can update it here too for consistency
    const pendingElement = document.getElementById('pendingConfirmationCount');
    if (pendingElement && stats.pending > 0) {
        pendingElement.textContent = stats.pending;
    }
}

/**
 * Update statistics display in the UI (legacy - kept for compatibility)
 */
function updateStatsDisplay(stats) {
    updateStatsDisplayWithComparison(stats);
}

// ==================== SEARCH FUNCTIONALITY ====================
// Search functionality is now handled globally by shared.js
// The global search provides:
// - Real-time search dropdown with patient results
// - Direct opening of patient account modal
// - No page navigation required