// Shared functionality across all pages
// Initialize shared functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeNotificationBell();
    initializeKeyboardShortcuts();
    initializeHistoryIconNavigation();
    initializeGlobalSearch();
});

// Navigation functionality
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Handle logout
            if (this.classList.contains('logout')) {
                e.preventDefault();
                handleLogout();
                return;
            }
            
            // Handle hash links (like #logout)
            if (href && href.startsWith('#')) {
                e.preventDefault();
                return;
            }
            
            // For normal navigation, let the browser handle the page navigation
            // The page will load and the active state will be set by the HTML
        });
    });
}

// Notification Bell functionality
function initializeNotificationBell() {
    const notificationBell = document.getElementById('notificationBell');
    
    if (notificationBell) {
        notificationBell.addEventListener('click', function(e) {
            e.preventDefault();
            // Navigate to patients.html with pending tab
            window.location.href = 'patients.html#pending';
        });
        
        // Set cursor to pointer to indicate it's clickable
        notificationBell.style.cursor = 'pointer';
    }
}

async function handleLogout(event) {
    if (event) {
        event.preventDefault();
    }

    if (!confirm('Are you sure you want to logout?')) {
        return;
    }

    try {
        // Step 1: Sign out from Firebase Auth (most important!)
        if (window.firebase && window.firebase.auth) {
            // Import signOut function from Firebase Auth
            const { signOut } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js');
            await signOut(window.firebase.auth);
            console.log('✅ Firebase Auth signed out successfully');
        } else {
            console.warn('⚠️ Firebase auth not available, skipping Firebase signOut');
        }

        // Step 2: Clear localStorage
        const possibleKeys = ['currentUser', 'user', 'userData', 'authUser'];
        possibleKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        // Step 3: Clear session storage
        sessionStorage.removeItem('internal_auth_checked');

        // Step 4: Show success message
        showSuccessMessage('Logged out successfully. Redirecting...');

        // Step 5: Redirect to React app home page
        setTimeout(() => {
            window.location.href = '/'; // 跳转到React应用首页
        }, 1000);
    } catch (error) {
        console.error('❌ Logout failed:', error);
        alert('Logout failed. Please try again.');
    }
}

// Make handleLogout globally available
window.handleLogout = handleLogout;

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Close modals with Escape key
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-overlay.show');
            openModals.forEach(modal => {
                modal.classList.remove('show');
                document.body.style.overflow = 'auto';
                
                // Reset any open forms in modals
                const forms = modal.querySelectorAll('.modify-form, .hold-form');
                forms.forEach(form => {
                    form.style.display = 'none';
                });
                
                // Reset action buttons
                const actionButtons = modal.querySelectorAll('.btn-action');
                actionButtons.forEach(btn => {
                    btn.style.display = 'flex';
                });
            });
        }
        
        // Quick add appointment (Ctrl/Cmd + N) - works on all pages with new appointment buttons
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            const quickAddBtn = document.getElementById('quickAddBtn') || 
                              document.getElementById('newAppointmentBtn') ||
                              document.querySelector('.new-appointment-btn');
            if (quickAddBtn) {
                e.preventDefault();
                quickAddBtn.click();
            }
        }
    });
}

// Success message function (used across pages)
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.opacity = '0';
        successDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 300);
    }, 3000);
}

// Phone number formatting function (used in forms)
function formatPhoneNumber(input) {
    const value = input.value.replace(/\D/g, '');
    const formattedValue = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    
    if (value.length <= 10) {
        input.value = formattedValue;
    }
}

// Patient name validation (only English letters and spaces)
function initializePatientNameValidation(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.addEventListener('input', function() {
            // Remove any non-English characters
            this.value = this.value.replace(/[^A-Za-z\s]/g, '');
        });
        
        input.addEventListener('keypress', function(e) {
            // Only allow English letters and spaces
            const char = String.fromCharCode(e.which);
            if (!/[A-Za-z\s]/.test(char)) {
                e.preventDefault();
            }
        });
    }
}

// Initialize phone formatting for any phone input
function initializePhoneFormatting(inputId) {
    const phoneInput = document.getElementById(inputId);
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }
}

// Utility function to close any modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Utility function to open any modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Utility function to capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Debounce function for search inputs
function debounce(func, wait) {
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

// Format time from 24-hour to 12-hour format
function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const displayMinutes = minutes.toString().padStart(2, '0');
    const formattedHours = displayHours.toString().padStart(2, '0'); // Add leading zero
    return `${formattedHours}:${displayMinutes} ${period}`;
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Set minimum date to today for date inputs
function setMinDateToToday(inputId) {
    const dateInput = document.getElementById(inputId);
    if (dateInput) {
        dateInput.min = getCurrentDate();
    }
}

// Common form validation functions
function validatePatientName(name) {
    return /^[A-Za-z\s]+$/.test(name) && name.trim().length > 0;
}

function validatePhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Common service display names mapping
const serviceDisplayMap = {
    'general': 'General',
    'implant': 'Implant',
    'extraction': 'Extraction',
    'preventive': 'Preventive',
    'cosmetic': 'Cosmetic',
    'orthodontics': 'Orthodontics',
    'root-canals': 'Root Canals',
    'restorations': 'Restorations',
    'periodontics': 'Periodontics'
};

// Get service display name
function getServiceDisplayName(service) {
    return serviceDisplayMap[service] || service;
}

// Location display names mapping
const locationDisplayMap = {
    'arcadia': 'Arcadia',
    'irvine': 'Irvine',
    'south-pasadena': 'South Pasadena',
    'rowland-heights': 'Rowland Heights',
    'eastvale': 'Eastvale'
};

// Get location display name
function getLocationDisplayName(location) {
    return locationDisplayMap[location] || location;
}

// Time slot options for appointments
const timeSlotOptions = {
    '09:00-10:00': '09:00 AM - 10:00 AM',
    '10:00-11:00': '10:00 AM - 11:00 AM',
    '11:00-12:00': '11:00 AM - 12:00 PM',
    '12:00-13:00': '12:00 PM - 01:00 PM',
    '13:00-14:00': '01:00 PM - 02:00 PM',
    '14:00-15:00': '02:00 PM - 03:00 PM',
    '15:00-16:00': '03:00 PM - 04:00 PM',
    '16:00-17:00': '04:00 PM - 05:00 PM'
};

// Get time slot display name
function getTimeSlotDisplayName(timeSlot) {
    return timeSlotOptions[timeSlot] || timeSlot;
}

// Extract time from time slot (e.g., "09:00-10:00" -> "09:00")
function extractTimeFromSlot(timeSlot) {
    return timeSlot.split('-')[0];
}

// Common appointment status classes and colors
const appointmentStatusConfig = {
    'scheduled': {
        class: 'scheduled',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        label: 'Scheduled'
    },
    'arrived': {
        class: 'arrived',
        color: '#1e40af',
        bgColor: '#dbeafe',
        label: 'Arrived'
    },
    'completed': {
        class: 'completed',
        color: 'white',
        bgColor: '#1e40af',
        label: 'Completed'
    },
    'no-show': {
        class: 'no-show',
        color: '#dc2626',
        bgColor: '#fecaca',
        label: 'No-Show'
    },
    'cancelled': {
        class: 'cancelled',
        color: 'white',
        bgColor: '#dc2626',
        label: 'Cancelled'
    },
    'held': {
        class: 'held',
        color: 'white',
        bgColor: '#a855f7',
        label: 'Held'
    }
};

// Get status configuration
function getStatusConfig(status) {
    return appointmentStatusConfig[status] || appointmentStatusConfig['scheduled'];
}

// Format date for display (e.g., "2025-07-01" -> "July 1, 2025")
function formatDateForDisplay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Format date and time for display
function formatDateTimeForDisplay(dateStr, timeStr) {
    const formattedDate = formatDateForDisplay(dateStr);
    const formattedTime = formatTime(timeStr);
    return `${formattedDate} ${formattedTime}`;
}

// Storage helpers for session data
function saveToSessionStorage(key, data) {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
    }
}

function getFromSessionStorage(key, defaultValue = null) {
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

function removeFromSessionStorage(key) {
    try {
        sessionStorage.removeItem(key);
    } catch (error) {
    }
}

// Generate unique ID for new appointments/patients
function generateUniqueId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Common error message display
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 300);
    }, 4000); // Show error messages slightly longer
}

// Update notification badge (show/hide blue dot)
function updateNotificationBadge(hasPendingConfirmations) {
    const notificationBadges = document.querySelectorAll('.notification-badge');
    notificationBadges.forEach(badge => {
        if (hasPendingConfirmations) {
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
    });
}

// Mobile menu toggle for responsive design
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
}

// Initialize mobile menu on page load
document.addEventListener('DOMContentLoaded', initializeMobileMenu);

// History Icon functionality for Dashboard and Patients pages
function initializeHistoryIconNavigation() {
    const historyIcon = document.getElementById('historyIcon');
    
    if (historyIcon) {
        historyIcon.addEventListener('click', () => {
            // Navigate to appointments page and show history
            window.location.href = 'appointments.html#history';
        });
    }
}

// Sticky header scroll effect
function initializeStickyHeader() {
    const header = document.querySelector('.top-header');
    if (!header) return;

    let ticking = false;

    function updateHeaderOnScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const threshold = 50; // Scroll threshold 50px

        if (scrollTop > threshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateHeaderOnScroll);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick, { passive: true });
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initializeStickyHeader();
  
});

// Sidebar collapse functionality
function initializeSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const toggleIcon = toggleBtn?.querySelector('i');
    
    if (!sidebar || !toggleBtn) return;

    // Read saved state from localStorage
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
        if (toggleIcon) {
            toggleIcon.className = 'fas fa-chevron-right'; // Change to simple right arrow
        }
    } else {
        if (toggleIcon) {
            toggleIcon.className = 'fas fa-chevron-left'; // Change to simple left arrow
        }
    }

// Click toggle logic also needs modification
    toggleBtn.addEventListener('click', () => {
        const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCurrentlyCollapsed) {
            // Expand
            sidebar.classList.remove('collapsed');
            document.body.classList.remove('sidebar-collapsed');
            toggleIcon.className = 'fas fa-chevron-left'; // 
            localStorage.setItem('sidebarCollapsed', 'false');
        } else {
            // Collapse
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
            toggleIcon.className = 'fas fa-chevron-right'; // >
            localStorage.setItem('sidebarCollapsed', 'true');
        }
    });
}

// Update DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    initializeStickyHeader();
    initializeSidebarToggle(); // Add this line
});

// ==================== GLOBAL SEARCH FUNCTIONALITY ====================

/**
 * Initialize global search with dropdown results
 * Works across all pages (Dashboard, Patients, Calendar)
 * Opens patient account modal directly without page navigation
 */
function initializeGlobalSearch() {
    console.log('🔍 Global Search: initializeGlobalSearch called');
    const searchContainer = document.querySelector('.global-search-container');
    const searchInput = document.getElementById('globalSearchInput');

    console.log('🔍 Global Search: searchContainer found:', !!searchContainer);
    console.log('🔍 Global Search: searchInput found:', !!searchInput);

    if (!searchContainer || !searchInput) {
        console.error('❌ Global Search: Cannot initialize - missing elements', {
            hasContainer: !!searchContainer,
            hasInput: !!searchInput
        });
        return;
    }

    // Create results dropdown element
    let resultsDropdown = searchContainer.querySelector('.global-search-results');
    if (!resultsDropdown) {
        resultsDropdown = document.createElement('div');
        resultsDropdown.className = 'global-search-results';
        searchContainer.appendChild(resultsDropdown);
    }

    // DEBUG: Add global click listener to dropdown container
    resultsDropdown.addEventListener('click', function(e) {
        console.log('🔍 Global Search: 🎯 DROPDOWN CONTAINER CLICKED!');
        console.log('🔍 Global Search: Target:', e.target);
        console.log('🔍 Global Search: Target classList:', e.target.classList);
        console.log('🔍 Global Search: CurrentTarget:', e.currentTarget);
    });

    // DEBUG: Mouse tracking
    resultsDropdown.addEventListener('mouseenter', function(e) {
        console.log('🔍 Global Search: 🖱️ Mouse ENTERED dropdown');
    });
    resultsDropdown.addEventListener('mouseleave', function(e) {
        console.log('🔍 Global Search: 🖱️ Mouse LEFT dropdown');
    });

    // Search state
    let searchTimeout = null;
    let allPatients = [];
    let isLoadingPatients = false;
    let hasAttemptedLoad = false; // Track if we've tried to load data
    let retryCount = 0;
    const MAX_RETRIES = 20; // Max 10 seconds wait

    // Load all patients data
    async function loadPatientsForSearch() {
        if (isLoadingPatients) return; // Prevent duplicate loading

        try {
            // Check retry limit
            if (retryCount >= MAX_RETRIES) {
                console.error('❌ Global Search: Exceeded max retries waiting for data manager');
                console.error('Debug info:', {
                    hasWindow: typeof window !== 'undefined',
                    hasDataManager: !!window.dataManager,
                    dataManagerType: typeof window.dataManager,
                    hasGetAllAppointments: window.dataManager ? typeof window.dataManager.getAllAppointments : 'no dataManager'
                });
                return;
            }

            // Wait for dataManager to be ready
            if (!window.dataManager || typeof window.dataManager.getAllAppointments !== 'function') {
                console.log(`🔍 Global Search: Waiting for data manager... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                console.log('Current state:', {
                    hasDataManager: !!window.dataManager,
                    dataManagerType: typeof window.dataManager,
                    hasGetAllAppointments: window.dataManager ? typeof window.dataManager.getAllAppointments : 'N/A'
                });
                retryCount++;
                setTimeout(loadPatientsForSearch, 500);
                return;
            }

            isLoadingPatients = true;
            console.log('🔍 Global Search: Data manager ready, loading patients...');

            // Debug: Check current user
            const currentUser = window.dataManager.getCurrentUser();
            console.log('🔍 Global Search: Current user:', currentUser);

            const appointments = await window.dataManager.getAllAppointments();
            console.log('🔍 Global Search: Raw appointments returned:', appointments);
            console.log('🔍 Global Search: Is array?', Array.isArray(appointments));
            console.log('🔍 Global Search: Loaded appointments count:', appointments?.length || 0);

            if (appointments && appointments.length > 0) {
                console.log('🔍 Global Search: First appointment sample:', appointments[0]);
            }

            if (!appointments || appointments.length === 0) {
                console.warn('⚠️ Global Search: No appointments found');
                console.warn('Possible reasons: 1) No data in Firebase, 2) User permission issue, 3) Firebase not ready');
                isLoadingPatients = false;
                allPatients = []; // Set to empty array so we know data loaded (just empty)
                return;
            }

            // Extract unique patients
            const patientsMap = new Map();
            appointments.forEach((apt) => {
                if (apt.patientName && apt.phone) {
                    const key = apt.phone; // Use phone as unique identifier
                    if (!patientsMap.has(key)) {
                        patientsMap.set(key, {
                            patientName: apt.patientName,
                            phone: apt.phone,
                            email: apt.email || '',
                            userId: apt.userId || null,
                            // Store full appointment data for modal
                            fullData: apt
                        });
                    }
                }
            });

            allPatients = Array.from(patientsMap.values());
            console.log('✅ Global Search: Successfully loaded unique patients:', allPatients.length);
            if (allPatients.length > 0) {
                console.log('Sample patient:', allPatients[0]);
            }
            isLoadingPatients = false;

            // If search input has content, re-trigger search with loaded data
            if (searchInput && searchInput.value.trim().length >= 2) {
                console.log('🔍 Global Search: Data loaded, re-triggering search...');
                performSearch(searchInput.value);
            }
        } catch (error) {
            console.error('❌ Failed to load patients for search:', error);
            console.error('Error stack:', error.stack);
            isLoadingPatients = false;
        }
    }

    // Perform search
    function performSearch(searchTerm) {
        if (!searchTerm || searchTerm.length < 2) {
            hideResults();
            return;
        }

        // Trigger data load if not attempted yet
        if (!hasAttemptedLoad) {
            hasAttemptedLoad = true;
            console.log('🔍 Global Search: First search, triggering data load...');
            loadPatientsForSearch();
        }

        // Show loading if patients not loaded yet
        if (allPatients.length === 0 && isLoadingPatients) {
            resultsDropdown.innerHTML = '<div class="search-loading">Loading patients...</div>';
            showResults();
            return;
        }

        // If data loaded but still no patients, show appropriate message
        if (allPatients.length === 0 && !isLoadingPatients && hasAttemptedLoad) {
            resultsDropdown.innerHTML = '<div class="search-no-results">No patients found in database</div>';
            showResults();
            return;
        }

        const term = searchTerm.toLowerCase().trim();
        const results = allPatients.filter(patient => {
            const name = patient.patientName.toLowerCase();
            const phone = patient.phone.replace(/\D/g, '');
            return name.includes(term) || phone.includes(term);
        });

        displayResults(results);
    }

    // Display search results
    function displayResults(results) {
        console.log('🔍 Global Search: displayResults called with', results.length, 'results');

        if (results.length === 0) {
            resultsDropdown.innerHTML = '<div class="search-no-results">No patients found</div>';
        } else {
            resultsDropdown.innerHTML = results.map(patient => `
                <div class="search-result-item" data-phone="${patient.phone}">
                    <span class="search-result-name">${patient.patientName}</span>
                    <span class="search-result-phone">${formatPhoneForDisplay(patient.phone)}</span>
                </div>
            `).join('');

            console.log('🔍 Global Search: HTML populated, checking for items...');
            const items = resultsDropdown.querySelectorAll('.search-result-item');
            console.log('🔍 Global Search: Found', items.length, 'items to attach listeners to');

            // Add click handlers
            items.forEach((item, index) => {
                console.log(`🔍 Global Search: Attaching listener to item ${index + 1}`);
                item.addEventListener('click', function(e) {
                    console.log('🔍 Global Search: ✅ Result item clicked!');
                    console.log('🔍 Global Search: Event:', e);
                    console.log('🔍 Global Search: This:', this);
                    const patientName = this.querySelector('.search-result-name').textContent;
                    console.log('🔍 Global Search: Patient name:', patientName);
                    console.log('🔍 Global Search: Calling goToAccountManagement...');
                    hideResults();
                    goToAccountManagement(patientName);
                });
            });

            console.log('🔍 Global Search: All click listeners attached');
        }

        showResults();
    }

    // Show results dropdown
    function showResults() {
        console.log('🔍 Global Search: 📢 showResults() called');
        console.log('🔍 Global Search: Dropdown element:', resultsDropdown);
        console.log('🔍 Global Search: Before - display:', window.getComputedStyle(resultsDropdown).display);
        resultsDropdown.classList.add('show');
        console.log('🔍 Global Search: After - display:', window.getComputedStyle(resultsDropdown).display);
        console.log('🔍 Global Search: Dropdown position:', resultsDropdown.getBoundingClientRect());
    }

    // Hide results dropdown
    function hideResults() {
        console.log('🔍 Global Search: 📢 hideResults() called');
        resultsDropdown.classList.remove('show');
    }

    // Navigate to Account Management (History View) with search term
    // This function always navigates to appointments.html history view with search parameter
    function goToAccountManagement(searchTerm) {
        console.log('🔍 Global Search: Processing search for term:', searchTerm);

        // Always navigate to appointments.html History view with search parameter
        // This ensures consistent behavior from all pages (dashboard, patients, appointments)
        console.log('🔍 Global Search: Navigating to appointments page with search...');
        window.location.href = `appointments.html?search=${encodeURIComponent(searchTerm)}#history`;
    }

    // Format phone for display
    function formatPhoneForDisplay(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    }

    // Event listeners
    searchInput.addEventListener('input', function() {
        console.log('🔍 Global Search: Input event fired, value:', this.value);
        clearTimeout(searchTimeout);
        const value = this.value.trim();

        if (value.length < 2) {
            console.log('🔍 Global Search: Value too short, hiding results');
            hideResults();
            return;
        }

        console.log('🔍 Global Search: Scheduling search for:', value);
        searchTimeout = setTimeout(() => {
            console.log('🔍 Global Search: Executing search for:', value);
            performSearch(value);
        }, 300);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        console.log('🔍 Global Search: Document click detected');
        console.log('🔍 Global Search: Click target:', e.target);
        console.log('🔍 Global Search: Is inside search container?', searchContainer.contains(e.target));

        // Check if click is on a result item - don't hide if so
        if (e.target.closest('.search-result-item')) {
            console.log('🔍 Global Search: Click is on result item, NOT hiding dropdown');
            return;
        }

        if (!searchContainer.contains(e.target)) {
            console.log('🔍 Global Search: Click outside, hiding dropdown');
            hideResults();
        }
    });

    // Handle keyboard events
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideResults();
            this.blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const searchTerm = this.value.trim();
            console.log('🔍 Global Search: Enter key pressed');
            console.log('🔍 Global Search: Search term:', searchTerm);
            console.log('🔍 Global Search: Search term length:', searchTerm.length);
            if (searchTerm.length >= 2) {
                console.log('🔍 Global Search: Enter pressed, navigating to Account Management with:', searchTerm);
                hideResults();
                goToAccountManagement(searchTerm);
            } else {
                console.log('❌ Global Search: Search term too short, not navigating');
            }
        }
    });

    // Don't load immediately - wait for user to search
    // This allows Firebase time to initialize properly
    console.log('🔍 Global Search: Initialized, will load data on first search');

    // Reload patients when Firebase data changes
    if (window.addEventListener) {
        window.addEventListener('firebase-data-updated', function() {
            console.log('🔍 Global Search: Firebase data updated, reloading patients...');
            hasAttemptedLoad = true;
            retryCount = 0; // Reset retry count
            isLoadingPatients = false; // Reset loading flag
            loadPatientsForSearch();
        });
    }
}

// Make function globally available
window.initializeGlobalSearch = initializeGlobalSearch;