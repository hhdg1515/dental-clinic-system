/*
 * Dynamic CSS classes used in this file:
 * .week-appointment, .week-patient, .week-more-indicator
 * .day-appointment-card, .concurrent-appointments-container
 * Defined in appointments.css
 */
// Appointments Page Functionality - Updated to use Global Data Manager
import { escapeHtml } from './security-utils.js';

// Current view and date state
let currentView = 'week';
let currentDate = new Date(); // Use current actual date
let currentAppointmentData = null;

// History View Pagination State - Ensure correct initialization
let historyCurrentPage = 1;
let historyItemsPerPage = 8; // Explicitly set to 8
let historyFilteredData = [];
let historyAllData = [];

// Real-time listener variables
let appointmentRealtimeListener = null;

// Wait for Firebase service to be ready
function waitForFirebaseService() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds maximum wait

        const checkInterval = setInterval(() => {
            attempts++;

            if (window.dataManager &&
                window.dataManager.firebaseService &&
                window.dataManager.useFirebase) {
                clearInterval(checkInterval);
                console.log('✅ Firebase service ready after', attempts * 100, 'ms');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('Firebase service initialization timeout'));
            }
        }, 100);
    });
}

// Real-time listeners DISABLED to reduce Firebase reads
// Appointments page now uses manual refresh (F5) to see updates
// This saves ~500-1000 Firebase reads per day
async function initializeRealtimeListeners() {
    // Disabled - no longer using onSnapshot real-time listeners
    console.log('ℹ️ Real-time listeners disabled. Use F5 to refresh appointments.');
}

// Cleanup real-time listeners
function cleanupRealtimeListeners() {
    if (appointmentRealtimeListener && typeof appointmentRealtimeListener === 'function') {
        appointmentRealtimeListener();
        appointmentRealtimeListener = null;
        console.log('🧹 Appointments page real-time listeners cleaned up');
    }
}

// Initialize service dropdowns with internal services
function initializeServiceDropdowns() {
    if (window.ServiceMapping) {
        // Initialize edit modal service dropdown
        const editServiceSelect = document.getElementById('editService');
        if (editServiceSelect) {
            window.ServiceMapping.populateInternalServiceDropdown(editServiceSelect);
        }

        // Initialize new appointment modal service dropdown
        const appointmentServiceSelect = document.getElementById('appointmentService');
        if (appointmentServiceSelect) {
            window.ServiceMapping.populateInternalServiceDropdown(appointmentServiceSelect);
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set currentDate to proper July 2, 2025 for testing
    //currentDate = new Date(2025, 6, 2, 12, 0, 0);

    // Initialize service dropdowns with internal services
    initializeServiceDropdowns();

    initializeViewToggle();
    initializeHistoryIcon();
    initializeNewAppointmentModal();
    initializeProcessModal();
    initializeEditModal();
    initializeCancellationModal();
    initializeAppointmentDetailsModal();
    initializeLiveTimeIndicator();
    initializeHistoryPagination();
    updateDayDate();
    generateMonthCalendar();
    setupFormValidation();
    // Search functionality is now handled by shared.js globally

    // Ensure notification bell is in normal state (not active)
    ensureNotificationBellNormalState();

    // Wait for Firebase service to be ready before loading data
    waitForFirebaseService().then(async () => {
        console.log('✅ Firebase service ready, loading calendar data...');

        try {
            // Initial render of all views with unified data
            await refreshAllViews();

            // Set up real-time listeners
            await initializeRealtimeListeners();

            // Update notification badge
            updateNotificationBadge(dataManager.getPendingConfirmations().length > 0);

        } catch (error) {
            console.error('Error initializing appointments page:', error);
        }
    }).catch(async (error) => {
        console.error('Firebase service failed to initialize:', error);
        // Fallback to localStorage data if available
        await refreshAllViews();
    });

    // Global search is now handled by shared.js
    // No need for local search handling here

    // Handle URL parameters and hash navigation from other pages
    // IMPORTANT: Capture URL params BEFORE any navigation happens
    const fullURL = window.location.href;
    console.log('🔍 Appointments: Full URL on load:', fullURL);

    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const hasHistoryHash = window.location.hash === '#history';
    const hasOpenAccountHash = window.location.hash === '#open-account';

    console.log('🔍 Appointments: URL params:', {
        search: searchParam,
        hasHistoryHash,
        hasOpenAccountHash,
        fullSearch: window.location.search,
        fullHash: window.location.hash
    });

    if (hasOpenAccountHash) {
        // Handle opening patient account from other pages
        setTimeout(() => {
            const patientDataStr = sessionStorage.getItem('openPatientAccount');
            if (patientDataStr) {
                try {
                    const patientData = JSON.parse(patientDataStr);
                    showPatientAccountModal(patientData);
                    sessionStorage.removeItem('openPatientAccount');
                } catch (error) {
                    console.error('Failed to open patient account:', error);
                }
            }
            // Clear hash
            window.history.replaceState(null, null, window.location.pathname);
        }, 800);
    } else if (hasHistoryHash || searchParam) {
        console.log('🔍 Appointments: Detected navigation with search/history hash');
        console.log('🔍 Search param:', searchParam);
        console.log('🔍 Has history hash:', hasHistoryHash);

        // Store search parameter for later use
        if (searchParam) {
            sessionStorage.setItem('pendingSearch', searchParam);
            console.log('🔍 Stored search parameter for later:', searchParam);
        }

        // Create a custom event listener for when history data is loaded
        const handleHistoryDataLoaded = () => {
            console.log('🔍 History data loaded event received');

            const storedSearch = sessionStorage.getItem('pendingSearch');
            if (storedSearch) {
                console.log('🔍 Processing stored search parameter:', storedSearch);
                const searchInputElement = document.getElementById('globalSearchInput');

                if (searchInputElement) {
                    searchInputElement.value = storedSearch;
                    console.log('🔍 Set search input value to:', storedSearch);

                    // Trigger the search filter
                    console.log('🔍 Triggering applyHistoryFilter and renderHistoryView...');
                    applyHistoryFilter(true);
                    renderHistoryView(false);
                    console.log('✅ Search triggered successfully');

                    // Clear the stored search
                    sessionStorage.removeItem('pendingSearch');
                }
            }

            // Remove the event listener after use
            window.removeEventListener('historyDataLoaded', handleHistoryDataLoaded);
        };

        // Add event listener
        window.addEventListener('historyDataLoaded', handleHistoryDataLoaded);

        // Switch to history view immediately (much faster!)
        setTimeout(() => {
            const historyIcon = document.getElementById('historyIcon');
            if (historyIcon) {
                console.log('🔍 Clicking history icon to switch view...');
                historyIcon.click();
            }

            // Clear URL parameters and hash to keep URL clean
            window.history.replaceState(null, null, window.location.pathname);
        }, 300); // Reduced to 300ms - just enough for DOM to be ready
    }
});

// Cleanup listeners on page unload
window.addEventListener('beforeunload', cleanupRealtimeListeners);

// Also cleanup when page becomes hidden (user switches tabs/pages)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        cleanupRealtimeListeners();
    }
});

// ================================
// EDIT PERMISSION SYSTEM
// ================================

/**
 * Determines if an appointment can be edited based on business rules
 * @param {Object} appointment - The appointment object to check
 * @param {Object} currentUser - The current user object with role information
 * @returns {Object} Permission result with canEdit flag and reason
 */
function canEditAppointment(appointment, currentUser) {
    if (!appointment || !currentUser) {
        return {
            canEdit: false,
            reason: 'Invalid appointment or user data',
            restrictedFields: []
        };
    }

    const appointmentDate = new Date(appointment.dateKey);
    const now = new Date();
    const timeDiff = now.getTime() - appointmentDate.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    const status = appointment.status || 'scheduled';

    // Business rule: Protect completed historical appointments
    const isCompleted = status === 'completed';
    const isHistorical = hoursDiff > 48; // More than 48 hours ago

    // For Boss role - can edit anything but with audit requirements
    if (currentUser.role === 'boss') {
        if (isCompleted && isHistorical) {
            return {
                canEdit: true,
                reason: 'Boss override - audit trail required',
                requiresAudit: true,
                restrictedFields: []
            };
        }
        return {
            canEdit: true,
            reason: 'Boss has full edit permissions',
            restrictedFields: []
        };
    }

    // For Admin role - stricter restrictions
    if (currentUser.role === 'admin') {
        // Prevent editing completed historical appointments
        if (isCompleted && isHistorical) {
            return {
                canEdit: false,
                reason: `Cannot edit completed appointments from more than 48 hours ago. Contact management if changes are needed.`,
                restrictedFields: ['service', 'date', 'time', 'location']
            };
        }

        // Allow editing recent completed appointments with restrictions
        if (isCompleted && hoursDiff <= 48) {
            return {
                canEdit: true,
                reason: 'Limited edit permissions for recent completed appointments',
                restrictedFields: ['service'], // Can't change service type for billing integrity
                warnings: ['Service changes are restricted for completed appointments']
            };
        }

        // Allow full editing for non-completed appointments
        return {
            canEdit: true,
            reason: 'Full edit permissions for non-completed appointments',
            restrictedFields: []
        };
    }

    // Default deny for unknown roles
    return {
        canEdit: false,
        reason: 'Insufficient permissions',
        restrictedFields: []
    };
}

/**
 * Applies visual restrictions to edit form fields based on permissions
 * @param {Object} permissions - Result from canEditAppointment()
 */
function applyEditFieldRestrictions(permissions) {
    const restrictedFields = permissions.restrictedFields || [];
    const warnings = permissions.warnings || [];

    // Field mapping for form elements
    const fieldMappings = {
        service: 'editService',
        date: 'editDate',
        time: 'editTime',
        location: 'editLocation',
        notes: 'editNotes'
    };

    // Reset all fields to enabled first
    Object.values(fieldMappings).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = false;
            field.style.backgroundColor = '';
            field.style.opacity = '';
            field.removeAttribute('title');
        }
    });

    // Apply restrictions
    restrictedFields.forEach(fieldName => {
        const fieldId = fieldMappings[fieldName];
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = true;
            field.style.backgroundColor = '#f3f4f6';
            field.style.opacity = '0.7';
            field.setAttribute('title', 'This field cannot be modified due to business rules');
        }
    });

    // Show warnings if any
    if (warnings.length > 0) {
        const warningContainer = document.getElementById('editWarnings');
        if (warningContainer) {
            warningContainer.innerHTML = warnings.map(warning =>
                `<div class="edit-warning">${warning}</div>`
            ).join('');
            warningContainer.style.display = 'block';
        }
    }
}

/**
 * Logs audit trail for protected appointment modifications
 * @param {Object} appointment - The appointment being modified
 * @param {Object} changes - Object containing the changes made
 * @param {Object} currentUser - The user making the changes
 */
function logAppointmentAudit(appointment, changes, currentUser) {
    const auditEntry = {
        timestamp: new Date().toISOString(),
        appointmentId: appointment.id || appointment.appointmentId,
        patientName: appointment.patientName,
        originalDate: appointment.dateKey,
        modifiedBy: currentUser.username || currentUser.email,
        userRole: currentUser.role,
        changes: changes,
        reason: 'Historical appointment modification',
        businessJustification: 'Boss override for completed historical record'
    };

    console.log('🔒 AUDIT TRAIL - Protected Appointment Modified:', auditEntry);

    // Store audit trail (implement persistent storage as needed)
    const auditLog = JSON.parse(localStorage.getItem('appointment_audit_log') || '[]');
    auditLog.push(auditEntry);
    localStorage.setItem('appointment_audit_log', JSON.stringify(auditLog));
}

// Ensure notification bell is in normal state for appointments
function ensureNotificationBellNormalState() {
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
        notificationBell.classList.remove('active');
    }
}

// Smart name truncation function for Week view - FIXED VERSION
function truncatePatientName(fullName) {
    if (!fullName || typeof fullName !== 'string') return 'Unknown';
    
    const trimmedName = fullName.trim();
    
    // Card width is 120px, with padding that leaves ~100px for text
    // Rough estimate: 1 character ≈ 6-7px in 11px font
    const maxChars = 14; // Conservative estimate for ~100px width
    
    // If name fits within the character limit, return as-is
    if (trimmedName.length <= maxChars) {
        return trimmedName;
    }
    
    // If name is too long, truncate with ellipsis
    return trimmedName.substring(0, maxChars - 3) + '...';
}

// ================================
// DATE AND TIME FORMATTING
// ================================

// Format date with leading zeros (MM/DD/YYYY)
function formatDateWithLeadingZeros(dateObj) {
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }
    
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${month}/${day}/${year}`;
}

// Format time with leading zeros (HH:MM)
function formatTimeWithLeadingZeros(timeString) {
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeString);
    if (!timeMatch) {
        return 'Invalid Time';
    }
    
    const hours = String(timeMatch[1]).padStart(2, '0');
    const minutes = String(timeMatch[2]).padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

// Format complete date time for history view (MM/DD/YYYY, HH:MM)
function formatHistoryDateTime(dateObj, timeString) {
    const formattedDate = formatDateWithLeadingZeros(dateObj);
    const formattedTime = formatTimeWithLeadingZeros(timeString);
    return `${formattedDate}, ${formattedTime}`;
}

// Format phone number to (XXX) XXX-XXXX format
function formatPhoneToDisplay(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone; // Return original if not 10 digits
}

// ================================
// HISTORY VIEW FUNCTIONS
// ================================

// Initialize History Pagination
function initializeHistoryPagination() {
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            
            if (historyCurrentPage > 1) {
                historyCurrentPage--;
                renderHistoryView(false); // Don't reload data, just re-render with new page
                updateHistoryPaginationControls();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(historyFilteredData.length / historyItemsPerPage);
            
            if (historyCurrentPage < totalPages) {
                historyCurrentPage++;
                renderHistoryView(false); // Don't reload data, just re-render with new page
                updateHistoryPaginationControls();
            }
        });
    }
}

// Update pagination controls
function updateHistoryPaginationControls() {
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    const totalPages = Math.ceil(historyFilteredData.length / historyItemsPerPage);
    
    if (prevPageBtn) {
        prevPageBtn.disabled = historyCurrentPage === 1;
    }
    
    if (nextPageBtn) {
        const shouldDisable = historyCurrentPage >= totalPages || totalPages === 0;
        nextPageBtn.disabled = shouldDisable;
    }
    
}

// Refresh all views with current data
async function refreshAllViews() {
    console.log('Calendar: Refreshing all views with current date:', currentDate);
    await renderWeekView();
    await renderDayView();
    await renderMonthView();
    updateCurrentDateDisplay();
    await renderHistoryView(true); // Force reload data for history view
    console.log('Calendar: All views refreshed');
}

// Optimized functions for individual view rendering
async function refreshCurrentViewOnly() {
    console.log(`Calendar: Refreshing ${currentView} view only`);

    switch(currentView) {
        case 'week':
            await renderWeekView();
            break;
        case 'day':
            await renderDayViewOptimized();
            break;
        case 'month':
            await generateMonthCalendar(); // Use optimized month generation directly
            break;
        case 'history':
            await renderHistoryView(true);
            break;
        default:
            console.warn('Unknown view type:', currentView);
            await refreshAllViews();
            return;
    }

    updateCurrentDateDisplay();
    console.log(`Calendar: ${currentView} view refreshed`);
}

// Fast day view rendering (no other views involved)
async function renderDayViewOptimized() {
    console.log('Calendar: Fast day view rendering started');
    const startTime = performance.now();

    const appointmentsArea = document.getElementById('dayAppointmentsArea');
    if (!appointmentsArea) return;

    // Get current day appointments with optimized query
    const appointments = await getAppointmentsForDateOptimized(currentDate);

    // Clear existing appointments (keep live time indicator)
    const liveIndicator = appointmentsArea.querySelector('.live-time-indicator');
    appointmentsArea.innerHTML = '';
    if (liveIndicator) {
        appointmentsArea.appendChild(liveIndicator);
    }

    // Group appointments by time slot
    const appointmentsByTime = {};
    appointments.forEach(appointment => {
        const timeKey = appointment.time;
        if (!appointmentsByTime[timeKey]) {
            appointmentsByTime[timeKey] = [];
        }
        appointmentsByTime[timeKey].push(appointment);
    });

    // Render appointments (copied from original renderDayView)
    Object.keys(appointmentsByTime).forEach(timeKey => {
        const timeAppointments = appointmentsByTime[timeKey];
        const topPosition = getTimePosition(timeKey);

        if (timeAppointments.length === 1) {
            // Single appointment
            const appointment = timeAppointments[0];
            const appointmentElement = document.createElement('div');
            const status = appointment.status || 'scheduled'; // Default to 'scheduled' if no status
            appointmentElement.className = `day-appointment-card ${status}`;
            appointmentElement.style.top = `${topPosition}px`;
            appointmentElement.style.height = '56px';
            appointmentElement.onclick = () => openProcessModal(appointmentElement, appointment);

            const patientDiv = document.createElement('div');
            patientDiv.className = 'patient-name';
            patientDiv.textContent = appointment.patientName;

            const serviceDiv = document.createElement('div');
            serviceDiv.className = 'service-type';
            serviceDiv.textContent = appointment.service;

            appointmentElement.appendChild(patientDiv);
            appointmentElement.appendChild(serviceDiv);
            appointmentsArea.appendChild(appointmentElement);
        } else {
            // Multiple concurrent appointments
            const containerElement = document.createElement('div');
            containerElement.className = 'concurrent-appointments-container';
            containerElement.style.top = `${topPosition}px`;
            containerElement.style.height = '56px';

            const maxVisible = 4;
            const visibleAppointments = timeAppointments.slice(0, maxVisible);
            const hiddenAppointments = timeAppointments.slice(maxVisible);

            // Render visible appointments
            visibleAppointments.forEach(appointment => {
                const appointmentElement = document.createElement('div');
                const status = appointment.status || 'scheduled'; // Default to 'scheduled' if no status
                appointmentElement.className = `day-appointment-card ${status}`;
                appointmentElement.onclick = () => openProcessModal(appointmentElement, appointment);

                const patientDiv = document.createElement('div');
                patientDiv.className = 'patient-name';
                patientDiv.textContent = appointment.patientName;

                const serviceDiv = document.createElement('div');
                serviceDiv.className = 'service-type';
                serviceDiv.textContent = appointment.service;

                appointmentElement.appendChild(patientDiv);
                appointmentElement.appendChild(serviceDiv);
                containerElement.appendChild(appointmentElement);
            });

            // Add "more" button if there are hidden appointments
            if (hiddenAppointments.length > 0) {
                const moreButton = document.createElement('div');
                moreButton.className = 'more-appointments-btn';
                moreButton.textContent = `+${hiddenAppointments.length} more`;
                moreButton.onclick = (e) => {
                    e.stopPropagation();
                    showMoreAppointmentsPopup(hiddenAppointments, e.target);
                };
                containerElement.appendChild(moreButton);
            }

            appointmentsArea.appendChild(containerElement);
        }
    });

    const endTime = performance.now();
    console.log(`Calendar: Fast day view rendering completed in ${(endTime - startTime).toFixed(2)}ms`);
}

// ===== SMART CACHING SYSTEM FOR DAY VIEW =====

// NOTE: Cache is now managed by GlobalCacheManager (cache-manager.js)
// Prefetch tracking still needed for background loading optimization
let prefetchInProgress = new Set(); // Track which dates are being prefetched
const PREFETCH_RANGE_DAYS = 3; // Prefetch 3 days before and after current date

// Optimized data fetching with smart caching for Day View
// Now uses GlobalCacheManager instead of local cache
async function getAppointmentsForDateOptimized(date) {
    const startTime = performance.now();
    const dateKey = formatDateToKey(date);

    try {
        // Data Manager now handles caching internally via GlobalCacheManager
        const appointments = await dataManager.getAppointmentsForDate(dateKey);

        const endTime = performance.now();
        console.log(`Calendar: Data fetch for ${dateKey} in ${(endTime - startTime).toFixed(2)}ms, found ${(appointments || []).length} appointments`);

        // Trigger background prefetch for adjacent dates
        prefetchAdjacentDates(date);

        return appointments || [];
    } catch (error) {
        console.error('Error in optimized day data fetch:', error);
        return [];
    }
}

// Prefetch adjacent dates in background for smooth navigation
async function prefetchAdjacentDates(currentDate) {
    console.log('Calendar: Starting background prefetch for adjacent dates');

    const prefetchPromises = [];

    // Prefetch previous dates
    for (let i = 1; i <= PREFETCH_RANGE_DAYS; i++) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(currentDate.getDate() - i);
        const prevDateKey = formatDateToKey(prevDate);

        // Check if already in cache via GlobalCacheManager
        const hasCached = window.cacheManager && window.cacheManager.getDateCache(prevDateKey);

        if (!hasCached && !prefetchInProgress.has(prevDateKey)) {
            prefetchInProgress.add(prevDateKey);
            prefetchPromises.push(prefetchSingleDate(prevDateKey));
        }
    }

    // Prefetch next dates
    for (let i = 1; i <= PREFETCH_RANGE_DAYS; i++) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + i);
        const nextDateKey = formatDateToKey(nextDate);

        // Check if already in cache via GlobalCacheManager
        const hasCached = window.cacheManager && window.cacheManager.getDateCache(nextDateKey);

        if (!hasCached && !prefetchInProgress.has(nextDateKey)) {
            prefetchInProgress.add(nextDateKey);
            prefetchPromises.push(prefetchSingleDate(nextDateKey));
        }
    }

    // Execute all prefetch operations in background
    if (prefetchPromises.length > 0) {
        Promise.all(prefetchPromises).then(() => {
            console.log(`Calendar: Background prefetch completed for ${prefetchPromises.length} dates`);
        }).catch(error => {
            console.warn('Calendar: Some background prefetch operations failed:', error);
        });
    }
}

// Prefetch single date data
async function prefetchSingleDate(dateKey) {
    try {
        console.log(`Calendar: Background prefetching ${dateKey}`);
        // DataManager will cache it via GlobalCacheManager
        const appointments = await dataManager.getAppointmentsForDate(dateKey);

        console.log(`Calendar: Background prefetch completed for ${dateKey}: ${(appointments || []).length} appointments`);
    } catch (error) {
        console.warn(`Calendar: Background prefetch failed for ${dateKey}:`, error);
    } finally {
        // Remove from in-progress tracking
        prefetchInProgress.delete(dateKey);
    }
}

// NOTE: Old local cache management functions removed
// All caching is now handled by GlobalCacheManager (cache-manager.js)

// Expose global cache stats for debugging
window.getCacheStats = () => {
    if (window.cacheManager) {
        return window.cacheManager.getStats();
    }
    return { error: 'CacheManager not available' };
};

// Helper function to print cache stats to console
window.printCacheStats = () => {
    if (window.cacheManager) {
        window.cacheManager.printStats();
    } else {
        console.warn('CacheManager not available');
    }
};

// Format date to database key format (YYYY-MM-DD)
// Uses LOCAL timezone to ensure consistency with Firebase data
function formatDateToKey(date, debug = false) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date passed to formatDateToKey:', date);
        return '';
    }

    // Use getFullYear(), getMonth(), getDate() to get LOCAL timezone date components
    // This ensures we're always working with the user's local date, not UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const dateKey = `${year}-${month}-${day}`;

    // Optional debug logging (disabled by default to reduce console noise)
    if (debug) {
        console.log('📅 formatDateToKey:', {
            inputDate: date.toString(),
            year: year,
            month: month,
            day: day,
            outputKey: dateKey,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    }

    return dateKey;
}
// Get appointments for a specific date
async function getAppointmentsForDate(date) {
    const dateKey = formatDateToKey(date);
    console.log('Calendar: Getting appointments for date:', dateKey);
    const appointments = await dataManager.getAppointmentsForDate(dateKey);
    console.log('Calendar: Found appointments:', appointments);
    return appointments;
}

// Synchronous wrapper for backward compatibility (will be removed later)
function getAppointmentsForDateSync(date) {
    const dateKey = formatDateToKey(date);
    console.log('Calendar SYNC: Getting appointments for date:', dateKey);

    // Try to use cached data or fallback to localStorage
    if (dataManager.data && dataManager.data.appointments && dataManager.data.appointments[dateKey]) {
        const appointments = dataManager.getAppointmentsForDateLocal(dateKey);
        console.log('Calendar SYNC: Found appointments:', appointments);
        return appointments;
    }
    console.log('Calendar SYNC: No appointments found for date:', dateKey);
    return [];
}

// Get appointments count for a specific date
async function getAppointmentCountForDate(date) {
    const appointments = await getAppointmentsForDateOptimized(date);
    return appointments.length;
}

// Get all appointments including cancelled (History view only)
async function getAllAppointmentsForDate(date) {
    try {
        const dateKey = formatDateToKey(date);
        const activeAppointments = await dataManager.getAppointmentsForDate(dateKey) || [];
        const cancelledAppointments = await dataManager.getCancelledAppointments() || [];
        const filteredCancelled = cancelledAppointments.filter(app => app.dateKey === dateKey);
        return [...activeAppointments, ...filteredCancelled];
    } catch (error) {
        console.error('Error getting appointments for date:', error);
        return [];
    }
}

// Render History View with unified data and new 5-column format - PATIENT GROUPED
async function renderHistoryView(forceReload = false) {
    const historyTableBody = document.getElementById('historyTableBody');
    if (!historyTableBody) return;

    // Only reload data if historyAllData is empty or forced reload
    if (historyAllData.length === 0 || forceReload) {
        try {
            // Get all appointments for history with error handling
            const activeAppointments = await dataManager.getAllAppointments() || [];

            // Filter to only show confirmed appointments (exclude pending, declined)
            // Account Management should only show patients with confirmed appointments
            const confirmedAppointments = activeAppointments.filter(app =>
                app.status !== 'pending' &&
                app.status !== 'declined'
            );

            const cancelledAppointments = await dataManager.getCancelledAppointments() || [];
            const allAppointments = [...confirmedAppointments, ...cancelledAppointments];
        
        // Add date objects for sorting
        allAppointments.forEach(appointment => {
            appointment.dateObj = new Date(appointment.dateKey);
        });
        
        // GROUP BY PATIENT - Use userId first, fallback to patientName
        const patientMap = new Map();
        console.log('📋 Account Management: Processing', allAppointments.length, 'appointments for consolidation');

        allAppointments.forEach(appointment => {
            // Use userId as primary identifier if available, fallback to patientName
            const patientIdentifier = appointment.userId || appointment.patientName;

            // Debug logging for userId consolidation
            if (appointment.userId) {
                console.log(`👤 Found appointment with userId: ${appointment.userId} for patient: ${appointment.patientName}`);
            }

            if (!patientMap.has(patientIdentifier)) {
                patientMap.set(patientIdentifier, []);
            }
            patientMap.get(patientIdentifier).push(appointment);
        });

        console.log(`📊 Account Management: Consolidated into ${patientMap.size} unique patient accounts`);

        // Log detailed consolidation info
        patientMap.forEach((appointments, identifier) => {
            const hasUserId = appointments[0].userId;
            console.log(`${hasUserId ? '🔗' : '📝'} Patient "${identifier}": ${appointments.length} appointments ${hasUserId ? '(grouped by userId)' : '(grouped by name)'}`);
        });

        // Convert to unique patients with enhanced account information
        const uniquePatients = Array.from(patientMap.entries()).map(([patientIdentifier, appointments]) => {
            // FIXED: Sort by dateKey string to avoid timezone issues
            const sortedByDateAsc = [...appointments].sort((a, b) => a.dateKey.localeCompare(b.dateKey)); // Oldest first
            const sortedByDateDesc = [...appointments].sort((a, b) => b.dateKey.localeCompare(a.dateKey)); // Newest first

            const mostRecentAppointment = sortedByDateDesc[0];
            const firstAppointment = sortedByDateAsc[0]; // Now correctly gets the earliest appointment

            console.log('🗓️ First Visit Debug:', {
                patientIdentifier: patientIdentifier,
                allAppointmentDates: appointments.map(apt => apt.dateKey),
                sortedDates: sortedByDateAsc.map(apt => apt.dateKey),
                firstAppointmentDate: firstAppointment.dateKey,
                mostRecentDate: mostRecentAppointment.dateKey
            });

            // Calculate account status based on future appointments
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time for date comparison

            // FIXED: Use string comparison for future appointments to avoid timezone issues
            const todayString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const hasFutureAppointments = appointments.some(appointment => {
                return appointment.dateKey >= todayString;
            });

            const accountStatus = hasFutureAppointments ? 'active' : 'inactive';

            // Find the best phone number from all appointments
            // Check multiple possible phone field names
            const getPhoneFromAppointment = (apt) => {
                const phoneFields = ['phone', 'phoneNumber', 'tel', 'mobile', 'contactNumber', 'patientPhone', 'userPhone', 'clientPhone'];
                for (const field of phoneFields) {
                    if (apt[field] && apt[field].trim()) {
                        return apt[field].trim();
                    }
                }
                return '';
            };

            let bestPhone = '';

            // First try to find the most recent appointment with a valid phone
            for (const appointment of sortedByDateDesc) {
                const phone = getPhoneFromAppointment(appointment);
                if (phone) {
                    bestPhone = phone;
                    break;
                }
            }

            // If no recent phone found, try any appointment with valid phone
            if (!bestPhone) {
                for (const appointment of appointments) {
                    const phone = getPhoneFromAppointment(appointment);
                    if (phone) {
                        bestPhone = phone;
                        break;
                    }
                }
            }

            // Debug logging for phone data tracking with all possible phone fields
            const phoneDebugInfo = appointments.map(apt => {
                const phoneFields = {
                    phone: apt.phone,
                    phoneNumber: apt.phoneNumber,
                    tel: apt.tel,
                    mobile: apt.mobile,
                    contactNumber: apt.contactNumber,
                    patientPhone: apt.patientPhone,
                    userPhone: apt.userPhone,
                    clientPhone: apt.clientPhone
                };
                const availableFields = Object.entries(phoneFields)
                    .filter(([key, value]) => value && value.trim())
                    .map(([key, value]) => `${key}:"${value}"`)
                    .join(',');

                return `${apt.dateKey}: [${availableFields || 'no phone fields'}]`;
            }).join(', ');
            console.log(`📞 Patient "${mostRecentAppointment.patientName}" phone data: [${phoneDebugInfo}] → Selected: "${bestPhone}"`);

            // Also log the raw appointment object for debugging
            console.log(`🔍 Raw appointment object for debugging:`, appointments[0]);

            // Debug logging for account status calculation
            console.log(`📊 Patient "${mostRecentAppointment.patientName}": ${accountStatus} (${appointments.length} appointments, future: ${hasFutureAppointments})`);

            return {
                ...mostRecentAppointment,
                phone: bestPhone, // Override with best available phone
                appointmentCount: appointments.length,
                firstVisitDate: firstAppointment.dateKey, // Correct string-based date
                firstVisitDateObj: firstAppointment.dateObj, // Legacy - do not use (timezone issues)
                accountStatus: accountStatus,
                isPatientRecord: true, // Flag to distinguish from appointment records
                allAppointments: appointments, // Store all appointments for this patient
                patientIdentifier: patientIdentifier, // Store the identifier used for grouping
                groupedByUserId: !!mostRecentAppointment.userId, // Flag to indicate if grouped by userId
                userId: mostRecentAppointment.userId // Ensure userId is available for filtering
            };
        });
        
        // Sort patients by their most recent appointment date (newest first)
        uniquePatients.sort((a, b) => b.dateObj - a.dateObj);
        
            // Store all data and apply initial filter (with page reset)
            historyAllData = uniquePatients;
            applyHistoryFilter(true); // Reset page on data reload

            // Trigger event to notify that history data is loaded
            console.log('🔥 Dispatching historyDataLoaded event');
            window.dispatchEvent(new Event('historyDataLoaded'));
        } catch (error) {
            console.error('Error loading appointment history data:', error);
            // Fallback to empty array if Firebase fails
            historyAllData = [];
            applyHistoryFilter(true);

            // Still dispatch event even on error
            window.dispatchEvent(new Event('historyDataLoaded'));
        }
    } else {
        // Just re-apply current filter without resetting page
        applyHistoryFilter(false);
    }
    
    // Clear existing rows
    historyTableBody.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (historyCurrentPage - 1) * historyItemsPerPage;
    const endIndex = startIndex + historyItemsPerPage;
    const paginatedData = historyFilteredData.slice(startIndex, endIndex);
    
    // Debug information
    
    // Render patients with new 5-column format
    paginatedData.forEach(patient => {
        const row = document.createElement('tr');
        row.onclick = () => showPatientAccountModal(patient);
        
        // Column 1: Patient Name
        const patientCell = document.createElement('td');
        patientCell.className = 'patient-name';
        patientCell.textContent = patient.patientName;

        // Column 2: Phone Number ((XXX) XXX-XXXX format)
        const phoneCell = document.createElement('td');
        phoneCell.className = 'phone';
        phoneCell.textContent = formatPhoneToDisplay(patient.phone);

        // Column 3: First Visit Date (MM/DD/YYYY)
        const firstVisitCell = document.createElement('td');
        firstVisitCell.className = 'first-visit';
        // FIXED: Use string-based date to avoid timezone issues
        const [year, month, day] = patient.firstVisitDate.split('-');
        firstVisitCell.textContent = `${month}/${day}/${year}`;

        // Column 4: Total Visits Count
        const totalVisitsCell = document.createElement('td');
        totalVisitsCell.className = 'total-visits';
        totalVisitsCell.textContent = patient.appointmentCount;

        // Column 5: Account Status (Active/Inactive)
        const accountStatusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${patient.accountStatus}`;
        statusBadge.textContent = capitalizeFirst(patient.accountStatus);
        accountStatusCell.appendChild(statusBadge);

        row.appendChild(patientCell);
        row.appendChild(phoneCell);
        row.appendChild(firstVisitCell);
        row.appendChild(totalVisitsCell);
        row.appendChild(accountStatusCell);
        
        historyTableBody.appendChild(row);
    });
    
    // Update pagination controls
    updateHistoryPaginationControls();
}

// Apply current search filter to history data
function applyHistoryFilter(resetPage = true) {
    const searchInput = document.getElementById('globalSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (searchTerm === '') {
        historyFilteredData = [...historyAllData];
    } else {
        historyFilteredData = historyAllData.filter(appointment => {
            const patientName = appointment.patientName.toLowerCase();
            const phone = appointment.phone.replace(/\D/g, '').toLowerCase(); // Remove formatting for search
            
            return patientName.includes(searchTerm) || phone.includes(searchTerm);
        });
    }
    
    // Only reset to first page when explicitly requested (e.g., when search term changes)
    if (resetPage) {
        historyCurrentPage = 1;
    } else {
    }
}

// Show appointment details
function showAppointmentDetails(element, appointmentData = null) {
    let patientName, datetime, service, location, status, tel, additionalInfo = '';
    
    if (appointmentData) {
        patientName = appointmentData.patientName;
        datetime = formatHistoryDateTime(appointmentData.dateObj, appointmentData.time);
        service = appointmentData.service;
        location = appointmentData.location;
        status = capitalizeFirst(appointmentData.status.replace('-', ' '));
        tel = formatPhoneToDisplay(appointmentData.phone);
        
        // Add cancellation details if appointment is cancelled
        if (appointmentData.status === 'cancelled') {
            const cancelReason = appointmentData.cancelReason || 'Not specified';
            const cancelNotes = appointmentData.cancelNotes || '';
            const cancelledAt = appointmentData.cancelledAt ? 
                new Date(appointmentData.cancelledAt).toLocaleString() : 'Unknown';
            
            additionalInfo = `
                <div class="detail-row">
                    <span class="detail-label">Cancel Reason:</span>
                    <span class="detail-value">${cancelReason}</span>
                </div>
                ${cancelNotes ? `
                <div class="detail-row">
                    <span class="detail-label">Cancel Notes:</span>
                    <span class="detail-value">${cancelNotes}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Cancelled At:</span>
                    <span class="detail-value">${cancelledAt}</span>
                </div>
            `;
        }
    } else {
        // Extract from DOM element (fallback)
        patientName = element.querySelector('.patient-name')?.textContent || 'Unknown';
        datetime = element.querySelector('.time')?.textContent || 'Unknown';
        service = element.querySelector('.service')?.textContent || 'Unknown';
        location = 'Unknown';
        status = element.querySelector('.status-badge')?.textContent || 'Unknown';
        tel = element.querySelector('.tel')?.textContent || '';
    }
    
    const detailsContent = document.getElementById('appointmentDetailsContent');
    if (detailsContent) {
        detailsContent.innerHTML = `
            <h4>${escapeHtml(patientName)}</h4>
            <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${escapeHtml(datetime)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${escapeHtml(service)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${escapeHtml(location)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${escapeHtml(tel)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${escapeHtml(status)}</span>
            </div>
            ${additionalInfo}
        `;
    }
    
    openModal('appointmentDetailsModal');
}

async function renderWeekView() {
    const weekDays = document.querySelectorAll('.week-day');
    const startOfWeek = getStartOfWeek(currentDate);

    // Dynamically get all actual appointment times from Firebase
    const allTimeSlotsSet = new Set();

    // First scan to get all time slots using async Firebase calls
    for (let index = 0; index < weekDays.length; index++) {
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + index);
        const appointments = await getAppointmentsForDateOptimized(currentDay);
        appointments.forEach(app => {
            allTimeSlotsSet.add(app.time);
        });
    }
    
    // Add standard time slots to ensure completeness
    ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].forEach(time => {
        allTimeSlotsSet.add(time);
    });
    
    // Convert to sorted array
    const timeSlots = Array.from(allTimeSlotsSet).sort();

    // Second pass to render appointments using async Firebase calls
    for (let index = 0; index < weekDays.length; index++) {
        const dayElement = weekDays[index];
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + index);

        const dayAppointmentsContainer = dayElement.querySelector('.day-appointments');
        const appointments = await getAppointmentsForDateOptimized(currentDay);
        // Add debug logging代码
        // Clear existing appointments
        
        dayAppointmentsContainer.innerHTML = '';
        
        // Group appointments by time slot
        const appointmentsByTime = {};
        appointments.forEach(appointment => {
            const timeKey = appointment.time;
            if (!appointmentsByTime[timeKey]) {
                appointmentsByTime[timeKey] = [];
            }
            appointmentsByTime[timeKey].push(appointment);
        });
        // Create containers for each time slot in order (whether there are appointments or not)
        timeSlots.forEach(timeSlot => {
            const timeSlotContainer = document.createElement('div');
            timeSlotContainer.className = 'week-time-slot-container';
            timeSlotContainer.setAttribute('data-time', timeSlot);
            
            const timeAppointments = appointmentsByTime[timeSlot] || [];
            if (timeAppointments.length > 0) {
            }
            if (timeAppointments.length === 0) {
                // Empty time slot - still create container for proper alignment
                // Container will be empty but maintains the layout structure
            } else if (timeAppointments.length === 1) {
                // 1 appointment: show 1 name card
                const appointment = timeAppointments[0];
                const appointmentElement = createWeekAppointmentCard(appointment);
                timeSlotContainer.appendChild(appointmentElement);
                
            } else if (timeAppointments.length === 2) {
                // 2 appointments: show 2 name cards (perfect fit)
                timeAppointments.forEach(appointment => {
                    const appointmentElement = createWeekAppointmentCard(appointment);
                    timeSlotContainer.appendChild(appointmentElement);
                });
                
            } else if (timeAppointments.length >= 3) {
                // 3+ appointments: show 1 name card + 1 "more" card
                const firstAppointment = timeAppointments[0];
                const appointmentElement = createWeekAppointmentCard(firstAppointment);
                timeSlotContainer.appendChild(appointmentElement);
                
                // Add "+N more" indicator
                const hiddenCount = timeAppointments.length - 1;
                const moreElement = document.createElement('div');
                moreElement.className = 'week-more-indicator';
                moreElement.textContent = `+${hiddenCount} more`;
                moreElement.onclick = (e) => {
                    e.stopPropagation();
                    showWeekMoreAppointments(timeAppointments.slice(1), currentDay, timeSlot);
                };
                timeSlotContainer.appendChild(moreElement);
            }
            
            // Always append the container to maintain time slot alignment
            dayAppointmentsContainer.appendChild(timeSlotContainer);
        });
        
        // Update day number
        const dayNumber = dayElement.querySelector('.day-number');
        if (dayNumber) {
            dayNumber.textContent = currentDay.getDate();
            // Check if it's today
            const today = new Date();
            const dayHeader = dayElement.querySelector('.day-header');
            if (currentDay.toDateString() === today.toDateString()) {
                dayHeader.classList.add('today');
            } else {
                dayHeader.classList.remove('today');
            }
        }
    }

    // Update week range display
    updateWeekRangeDisplay();
}

// Create individual week appointment card
function createWeekAppointmentCard(appointment) {
    const appointmentElement = document.createElement('div');
    const status = appointment.status || 'scheduled'; // Default to 'scheduled' if no status
    appointmentElement.className = `week-appointment ${status}`;
    appointmentElement.onclick = () => openProcessModal(appointmentElement, appointment);
    
    // Show patient name (with smart truncation)
    const patientDiv = document.createElement('div');
    patientDiv.className = 'week-patient';
    patientDiv.textContent = truncatePatientName(appointment.patientName);
    patientDiv.title = appointment.patientName; // Show full name on hover
    
    appointmentElement.appendChild(patientDiv);
    return appointmentElement;
}

// Show more appointments popup for week view
function showWeekMoreAppointments(hiddenAppointments, date, timeSlot) {
    // Remove existing popup if any
    const existingPopup = document.querySelector('.week-more-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'week-more-popup';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'popup-header';
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedTime = formatTime(timeSlot);
    header.textContent = `${formattedDate} at ${formattedTime} (+${hiddenAppointments.length})`;
    popup.appendChild(header);
    
    // Create appointments list
    const appointmentsList = document.createElement('div');
    appointmentsList.className = 'popup-appointments-list';
    
    hiddenAppointments.forEach(appointment => {
        const appointmentItem = document.createElement('div');
        appointmentItem.className = `popup-appointment-item ${appointment.status}`;
        appointmentItem.onclick = () => {
            popup.remove();
            openProcessModal(appointmentItem, appointment);
        };
        
        const leftContent = document.createElement('div');
        leftContent.className = 'popup-left-content';
        
        const patientDiv = document.createElement('div');
        patientDiv.className = 'popup-patient-name';
        patientDiv.textContent = appointment.patientName; // Full name in popup
        
        const serviceDiv = document.createElement('div');
        serviceDiv.className = 'popup-service';
        serviceDiv.textContent = appointment.service;
        
        leftContent.appendChild(patientDiv);
        leftContent.appendChild(serviceDiv);
        
        const statusDiv = document.createElement('div');
        const status = appointment.status || 'scheduled'; // Default to 'scheduled' if no status
        statusDiv.className = `popup-status ${status}`;
        statusDiv.textContent = capitalizeFirst(status);
        
        appointmentItem.appendChild(leftContent);
        appointmentItem.appendChild(statusDiv);
        appointmentsList.appendChild(appointmentItem);
    });
    
    popup.appendChild(appointmentsList);
    
    // Position and show popup
    document.body.appendChild(popup);
    
    // Simple center positioning
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.zIndex = '1000';
    
    // Close popup when clicking outside
    const closePopup = (e) => {
        if (!popup.contains(e.target)) {
            popup.remove();
            document.removeEventListener('click', closePopup);
        }
    };
    
    // Delay adding the event listener to prevent immediate closure
    setTimeout(() => {
        document.addEventListener('click', closePopup);
    }, 100);
}

// Render Day View with unified data
async function renderDayView() {
    const appointmentsArea = document.getElementById('dayAppointmentsArea');
    if (!appointmentsArea) return;

    // Get current day appointments from Firebase using optimized method
    const appointments = await getAppointmentsForDateOptimized(currentDate);
    
    // Clear existing appointments (keep live time indicator)
    const liveIndicator = appointmentsArea.querySelector('.live-time-indicator');
    appointmentsArea.innerHTML = '';
    if (liveIndicator) {
        appointmentsArea.appendChild(liveIndicator);
    }
    
    // Group appointments by time slot
    const appointmentsByTime = {};
    appointments.forEach(appointment => {
        const timeKey = appointment.time;
        if (!appointmentsByTime[timeKey]) {
            appointmentsByTime[timeKey] = [];
        }
        appointmentsByTime[timeKey].push(appointment);
    });
    
    // Render appointments
    Object.keys(appointmentsByTime).forEach(timeKey => {
        const timeAppointments = appointmentsByTime[timeKey];
        const topPosition = getTimePosition(timeKey);
        
        if (timeAppointments.length === 1) {
            // Single appointment
            const appointment = timeAppointments[0];
            const appointmentElement = document.createElement('div');
            const status = appointment.status || 'scheduled'; // Default to 'scheduled' if no status
            appointmentElement.className = `day-appointment-card ${status}`;
            appointmentElement.style.top = `${topPosition}px`;
            appointmentElement.style.height = '56px';
            appointmentElement.onclick = () => openProcessModal(appointmentElement, appointment);
            
            const patientDiv = document.createElement('div');
            patientDiv.className = 'patient-name';
            patientDiv.textContent = appointment.patientName;
            
            const serviceDiv = document.createElement('div');
            serviceDiv.className = 'service-type';
            serviceDiv.textContent = appointment.service;
            
            appointmentElement.appendChild(patientDiv);
            appointmentElement.appendChild(serviceDiv);
            appointmentsArea.appendChild(appointmentElement);
        } else {
            // Multiple concurrent appointments
            const containerElement = document.createElement('div');
            containerElement.className = 'concurrent-appointments-container';
            containerElement.style.top = `${topPosition}px`;
            containerElement.style.height = '56px';
            
            const maxVisible = 4;
            const visibleAppointments = timeAppointments.slice(0, maxVisible);
            const hiddenAppointments = timeAppointments.slice(maxVisible);
            
            // Render visible appointments
            visibleAppointments.forEach(appointment => {
                const appointmentElement = document.createElement('div');
                const status = appointment.status || 'scheduled'; // Default to 'scheduled' if no status
                appointmentElement.className = `day-appointment-card ${status}`;
                appointmentElement.onclick = () => openProcessModal(appointmentElement, appointment);
                
                const patientDiv = document.createElement('div');
                patientDiv.className = 'patient-name';
                patientDiv.textContent = appointment.patientName;
                
                const serviceDiv = document.createElement('div');
                serviceDiv.className = 'service-type';
                serviceDiv.textContent = appointment.service;
                
                appointmentElement.appendChild(patientDiv);
                appointmentElement.appendChild(serviceDiv);
                containerElement.appendChild(appointmentElement);
            });
            
            // Add "more" button if there are hidden appointments
            if (hiddenAppointments.length > 0) {
                const moreButton = document.createElement('div');
                moreButton.className = 'more-appointments-btn';
                moreButton.textContent = `+${hiddenAppointments.length} more`;
                moreButton.onclick = (e) => {
                    e.stopPropagation();
                    showMoreAppointmentsPopup(hiddenAppointments, e.target);
                };
                containerElement.appendChild(moreButton);
            }
            
            appointmentsArea.appendChild(containerElement);
        }
    });
}

// Render Month View with unified data
async function renderMonthView() {
    await generateMonthCalendar();
}

// Helper function to get time position in pixels
function getTimePosition(timeString) {
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeString);
    if (!timeMatch) return 0;

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return 0;

    const startHour = 9; // 09:00 AM start
    const hourHeight = 80; // 80px per hour (updated from 60px)
    const cardHeight = 56; // Appointment card height
    const verticalOffset = (hourHeight - cardHeight) / 2; // Center the card vertically

    if (hours < startHour) return 0;

    const hoursFromStart = hours - startHour;
    const minuteOffset = (minutes / 60) * hourHeight;

    return (hoursFromStart * hourHeight) + minuteOffset + verticalOffset;
}

// Helper function to get start of week
function getStartOfWeek(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return new Date();
    }
    
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    return startOfWeek;
}

// Update week range display
function updateWeekRangeDisplay() {
    const weekRangeElement = document.getElementById('weekRange');
    if (!weekRangeElement) return;
    
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    weekRangeElement.textContent = 
        `${startOfWeek.toLocaleDateString('en-US', options)} - ${endOfWeek.toLocaleDateString('en-US', options)}`;
}

// View Toggle Functionality
function initializeViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const viewContents = document.querySelectorAll('.view-content');
    const mainViewToggle = document.getElementById('mainViewToggle');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetView = this.dataset.view;
            
            // Validate view type
            if (!['week', 'day', 'month'].includes(targetView)) {
                return;
            }
            
            // Update active button
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update active view content
            viewContents.forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById(targetView + '-view');
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Hide history view and show main toggle when switching to main views
            const historyView = document.getElementById('history-view');
            const historyIcon = document.getElementById('historyIcon');
            if (historyView && historyView.classList.contains('active')) {
                historyView.classList.remove('active');
                historyIcon.classList.remove('active');
            }
            
            // Show main view toggle
            if (mainViewToggle) {
                mainViewToggle.style.display = 'flex';
            }
            
            currentView = targetView;

            // Refresh view when switching to ensure latest data
            if (targetView === 'day') {
                renderDayViewOptimized();
                updateLiveTimeIndicator();
            } else if (targetView === 'week') {
                renderWeekView();
            } else if (targetView === 'month') {
                generateMonthCalendar();
            }

            // Update date display for current view
            updateCurrentDateDisplay();
        });
    });
}

// History Icon Functionality
function initializeHistoryIcon() {
    const historyIcon = document.getElementById('historyIcon');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const historyView = document.getElementById('history-view');
    const mainViewToggleContainer = document.querySelector('.view-toggle-container');
    
    if (historyIcon) {
        historyIcon.addEventListener('click', () => {
            // Hide all other views
            document.querySelectorAll('.view-content').forEach(view => {
                view.classList.remove('active');
            });
            
            // Show history view
            historyView.classList.add('active');
            historyIcon.classList.add('active');
            currentView = 'history';
            
            // Hide main view toggle container when in history
            if (mainViewToggleContainer) {
                mainViewToggleContainer.style.display = 'none';
            }
            
            // Reset view toggle buttons
            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
             const pageTitle = document.querySelector('.page-title h1');
            if (pageTitle) {
                pageTitle.textContent = 'Accounts';
            }
            // Reset pagination state and refresh history view
            historyCurrentPage = 1;
            renderHistoryView(true); // Force reload data when entering history view
        });
    }
    
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', () => {
            // Hide history view and return to week view
            historyView.classList.remove('active');
            historyIcon.classList.remove('active');
            document.getElementById('week-view').classList.add('active');
            currentView = 'week';
            
            // Show main view toggle container
            if (mainViewToggleContainer) {
                mainViewToggleContainer.style.display = 'flex';
            }
            const pageTitle = document.querySelector('.page-title h1');
            if (pageTitle) {
                pageTitle.textContent = 'Calendar';
            }
            // Reset view toggle
            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('[data-view="week"]').classList.add('active');
            const viewToggleContainer = document.querySelector('.view-toggle-container');
                if (viewToggleContainer) {
                    viewToggleContainer.style.display = 'none';
                    setTimeout(() => {
                        viewToggleContainer.style.display = 'grid';
                    }, 10);
                }
        });
    }
}

// ==================== SEARCH FUNCTIONALITY ====================
// Search functionality is now handled globally by shared.js
// The global search provides:
// - Real-time search dropdown with patient results
// - Direct opening of patient account modal
// - No page navigation required

function triggerAppointmentsSearch(searchTerm) {
    const currentView = getCurrentView(); // Need to expose this variable
    
    if (currentView === 'history') {
        // Update history search
        applyHistoryFilter(true);
        renderHistoryView(false);
    }
}


// Process Modal functionality
function initializeProcessModal() {
    const processModal = document.getElementById('processModal');
    const processModalClose = document.getElementById('processModalClose');
    const arrivedBtn = document.getElementById('arrivedBtn');
    const noShowBtn = document.getElementById('noShowBtn');
    const editBtn = document.getElementById('editBtn');
    const holdBtn = document.getElementById('holdBtn');
    const completedBtn = document.getElementById('completedBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    function closeProcessModal(clearData = true) {
        closeModal('processModal');
        if (clearData) {
            currentAppointmentData = null;
        }
    }
    
    if (processModalClose) {
        processModalClose.addEventListener('click', () => closeProcessModal(true));
    }
    
    processModal?.addEventListener('click', function(e) {
        if (e.target === processModal) {
            closeProcessModal(true);
        }
    });
    
    // Status update handlers
    arrivedBtn?.addEventListener('click', () => {
        updateAppointmentStatus('arrived');
    });
    
    noShowBtn?.addEventListener('click', () => {
        updateAppointmentStatus('no-show');
    });
    
    completedBtn?.addEventListener('click', () => {
        updateAppointmentStatus('completed');
    });
    
    holdBtn?.addEventListener('click', () => {
        updateAppointmentStatus('held');
    });
    
    // Edit handler
editBtn?.addEventListener('click', async () => {
    closeProcessModal(false);

    // Ensure current appointment data is available for editing
    if (currentAppointmentData) {
        // Find complete appointment information
        const appointment = await findAppointmentById(currentAppointmentData.appointmentId);

        // If information found, start populating form
        if (appointment) {
            console.log('Edit: Found appointment data:', appointment);

            // Fill in all fields: date, time, service, notes, etc.
            document.getElementById('editDate').value = appointment.dateKey || appointment.date || '';

            // Handle time field with validation
            if (appointment.time && typeof appointment.time === 'string') {
                const timeSlot = `${appointment.time}-${getEndTime(appointment.time)}`;
                document.getElementById('editTime').value = timeSlot;
            } else {
                console.warn('Edit: Missing or invalid time data:', appointment.time);
                // Try alternative time field names
                const timeValue = appointment.appointmentTime || appointment.timeSlot || '';
                if (timeValue) {
                    const timeSlot = `${timeValue}-${getEndTime(timeValue)}`;
                    document.getElementById('editTime').value = timeSlot;
                } else {
                    document.getElementById('editTime').value = '';
                    console.warn('Edit: No valid time field found in appointment data');
                }
            }

            // Handle service field with validation
            const serviceValue = appointment.service || appointment.serviceName || appointment.serviceType || '';
            document.getElementById('editService').value = getServiceValue(serviceValue);

            document.getElementById('editNotes').value = appointment.notes || '';
            
            // Fill location and handle permissions
            const currentUser = dataManager.getCurrentUser();
            const locationSelect = document.getElementById('editLocation');

            // Handle location field with validation
            const locationValue = appointment.location || appointment.clinicLocation || appointment.clinicName || '';
            locationSelect.value = getLocationValue(locationValue);
            
            // Check edit permissions before allowing access to form
            const editPermissions = canEditAppointment(appointment, currentUser);

            if (!editPermissions.canEdit) {
                alert(`Edit Restricted: ${editPermissions.reason}`);
                return; // Prevent opening the edit modal
            }

            // Apply field restrictions based on permissions
            applyEditFieldRestrictions(editPermissions);

            // Set location field disabled state based on user role
            if (currentUser.role === 'admin') {
                // Front desk admin can only select their own clinic
                locationSelect.disabled = true;
                locationSelect.style.backgroundColor = '#f3f4f6';
            } else if (currentUser.role === 'boss') {
                // Boss can select any clinic
                locationSelect.disabled = false;
                locationSelect.style.backgroundColor = 'white';
            }

            // Store permission info for save handler
            currentAppointmentData.editPermissions = editPermissions;
        } else {
            console.error('Edit: Appointment not found for ID:', currentAppointmentData.appointmentId);
            alert('Error: Appointment data not found. Please try again.');
            return;
        }
    } else {
        console.error('Edit: No current appointment data available');
        alert('Error: No appointment selected. Please try again.');
        return;
    }

    // Open edit modal
    openModal('editModal');
});
    
    // Cancel handler - Preserve data during transition
    cancelBtn?.addEventListener('click', () => {
        closeProcessModal(false);
        openModal('cancellationModal');
    });
}

function openProcessModal(element, appointmentData = null) {
    let patientName, service, status, appointmentId;
    
    if (appointmentData) {
        // Data passed directly (unified data source)
        patientName = appointmentData.patientName;
        service = appointmentData.service;
        status = appointmentData.status;
        appointmentId = appointmentData.id;
    } else {
        // Extract data from DOM element (fallback)
        if (element.querySelector('.patient-name')) {
            patientName = element.querySelector('.patient-name').textContent;
            service = element.querySelector('.service-type')?.textContent || element.querySelector('.service')?.textContent || '';
        } else if (element.querySelector('.week-patient')) {
            patientName = element.querySelector('.week-patient').textContent;
            service = element.querySelector('.week-service')?.textContent || 'Service not available';
        } else {
            patientName = element.querySelector('.patient-name')?.textContent || 'Unknown Patient';
            service = element.querySelector('.service')?.textContent || 'Unknown Service';
        }
        status = getStatusFromCard(element);
        appointmentId = null;
    }
    
    currentAppointmentData = { 
        patientName, 
        service, 
        status, 
        element, 
        appointmentId,
        phone: appointmentData?.phone || '',
        rawAppointment: appointmentData || null
    };
    if (typeof window !== 'undefined') {
        window.__currentAppointmentData = currentAppointmentData;
    }
    
    // Populate modal
    const summary = document.getElementById('appointmentSummary');
    if (summary) {
        // Safely get phone information
        let phone = 'Phone not available';
        if (appointmentData && appointmentData.phone) {
            phone = appointmentData.phone;
        }
        summary.innerHTML = `
            <h4>${escapeHtml(patientName)}</h4>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${escapeHtml(phone)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${escapeHtml(service)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${escapeHtml(capitalizeFirst(status.replace('-', ' ')))}</span>
            </div>
        `;
    }
    // Set button selection state
    updateButtonSelection(status);
    openModal('processModal');
}

// Edit Modal functionality
function initializeEditModal() {
    const editModal = document.getElementById('editModal');
    const editModalClose = document.getElementById('editModalClose');
    const editCancel = document.getElementById('editCancel');
    const editForm = document.getElementById('editForm');
    
    function closeEditModal() {
        closeModal('editModal');
        if (editForm) editForm.reset();
        currentAppointmentData = null;
    }
    
    if (editModalClose) {
        editModalClose.addEventListener('click', closeEditModal);
    }
    
    if (editCancel) {
        editCancel.addEventListener('click', closeEditModal);
    }
    
    editModal?.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
    
    if (editForm) {
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentAppointmentData || !currentAppointmentData.appointmentId) {
            showErrorMessage('No appointment data found');
            return;
        }
        
        // Get form data
        const newDate = document.getElementById('editDate')?.value;
        const newTimeSlot = document.getElementById('editTime')?.value;
        const newService = document.getElementById('editService')?.value;
        const newLocation = document.getElementById('editLocation')?.value;
        const newNotes = document.getElementById('editNotes')?.value || '';
        
        if (!newDate || !newTimeSlot || !newService || !newLocation) {
            showErrorMessage('Please fill in all required fields');
            return;
        }
        
        const currentUser = dataManager.getCurrentUser();
        const locationSelect = document.getElementById('editLocation');

        if (currentUser.role === 'admin') {
            // Front desk admin can only select their own clinic
            locationSelect.value = currentUser.assignedLocation;
            locationSelect.disabled = true;
            locationSelect.style.backgroundColor = '#f3f4f6'; // Visual hint
        } else if (currentUser.role === 'boss') {
            // Boss can select any clinic
            locationSelect.disabled = false;
            locationSelect.style.backgroundColor = 'white';
        }
        
        const newTime = extractTimeFromSlot(newTimeSlot);
        
        try {
            // Delete original appointment
            await dataManager.deleteAppointment(currentAppointmentData.appointmentId);
            
            // Create new appointment
            const updatedAppointment = {
                patientName: currentAppointmentData.patientName,
                date: newDate,
                time: newTime,
                service: getServiceDisplayName(newService),
                location: getLocationDisplayName(newLocation),
                phone: currentAppointmentData.phone || '',
                notes: newNotes
            };
            
            try {
                // Log audit trail for protected appointments if required
                const editPermissions = currentAppointmentData.editPermissions;
                if (editPermissions && editPermissions.requiresAudit) {
                    // Find original appointment data for comparison
                    const originalAppointment = await findAppointmentById(currentAppointmentData.appointmentId);

                    const changes = {
                        date: { from: originalAppointment.dateKey, to: newDate },
                        time: { from: originalAppointment.time, to: newTime },
                        service: { from: originalAppointment.service, to: getServiceDisplayName(newService) },
                        location: { from: originalAppointment.location, to: getLocationDisplayName(newLocation) },
                        notes: { from: originalAppointment.notes, to: newNotes }
                    };

                    // Filter out unchanged fields
                    Object.keys(changes).forEach(key => {
                        if (changes[key].from === changes[key].to) {
                            delete changes[key];
                        }
                    });

                    if (Object.keys(changes).length > 0) {
                        logAppointmentAudit(originalAppointment, changes, currentUser);
                    }
                }

                await dataManager.addAppointment(updatedAppointment);
                showSuccessMessage('Appointment updated successfully!');
                closeEditModal();
            } catch (error) {
                console.error('Error updating appointment:', error);
                showErrorMessage('Failed to update appointment');
            }
            await refreshCurrentViewOnly();
            
        } catch (error) {
            showErrorMessage('Failed to update appointment');
        }
    });
  }
}

// Find appointment information
async function findAppointmentById(appointmentId) {
    const allAppointments = await dataManager.getAllAppointments();
    return allAppointments.find(app => app.id === appointmentId);
}

// Get end time (assuming each appointment is 1 hour)
function getEndTime(startTime) {
    // Input validation
    if (!startTime || typeof startTime !== 'string') {
        console.warn('getEndTime: Invalid startTime:', startTime);
        return ''; // Return empty string for invalid input
    }

    // Check if time format is valid (HH:MM)
    const timePattern = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timePattern.test(startTime)) {
        console.warn('getEndTime: Invalid time format:', startTime);
        return startTime; // Return original value if format is invalid
    }

    try {
        const timeParts = startTime.split(':');
        if (timeParts.length !== 2) {
            console.warn('getEndTime: Unexpected time format:', startTime);
            return startTime;
        }

        const [hours, minutes] = timeParts.map(Number);

        // Validate parsed values
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            console.warn('getEndTime: Invalid hour/minute values:', hours, minutes);
            return startTime;
        }

        const endHours = hours + 1;

        // Handle hour overflow (though unlikely in appointment context)
        const finalHours = endHours > 23 ? endHours - 24 : endHours;

        return `${String(finalHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (error) {
        console.error('getEndTime: Error processing time:', error);
        return startTime; // Return original value on error
    }
}

// Convert service name to option value
function getServiceValue(serviceName) {
    // Input validation
    if (!serviceName || typeof serviceName !== 'string') {
        console.warn('getServiceValue: Invalid serviceName:', serviceName);
        return 'general'; // Default to general service
    }

    const serviceMap = {
        'General': 'general',
        'Implant': 'implant',
        'Extraction': 'extraction',
        'Preventive': 'preventive',
        'Cosmetic': 'cosmetic',
        'Orthodontics': 'orthodontics',
        'Root Canals': 'root-canals',
        'Restorations': 'restorations',
        'Periodontics': 'periodontics'
    };

    return serviceMap[serviceName] || serviceName.toLowerCase();
}

// Convert location name to option value
function getLocationValue(locationName) {
    // Input validation
    if (!locationName || typeof locationName !== 'string') {
        console.warn('getLocationValue: Invalid locationName:', locationName);
        return 'arcadia'; // Default to arcadia location
    }

    const locationMap = {
        'Arcadia': 'arcadia',
        'Irvine': 'irvine',
        'South Pasadena': 'south-pasadena',
        'Rowland Heights': 'rowland-heights',
        'Eastvale': 'eastvale'
    };

    return locationMap[locationName] || locationName.toLowerCase();
}

// Cancellation Reason Modal functionality
function initializeCancellationModal() {
    const cancellationModal = document.getElementById('cancellationModal');
    const cancellationModalClose = document.getElementById('cancellationModalClose');
    const cancelBack = document.getElementById('cancelBack');
    const confirmCancellation = document.getElementById('confirmCancellation');
    
    function closeCancellationModal() {
        closeModal('cancellationModal');
        // Clear form
        document.querySelectorAll('input[name="cancelReason"]').forEach(radio => {
            radio.checked = false;
        });
        const cancelNotes = document.getElementById('cancelNotes');
        if (cancelNotes) cancelNotes.value = '';
        currentAppointmentData = null;
    }
    
    if (cancellationModalClose) {
        cancellationModalClose.addEventListener('click', closeCancellationModal);
    }
    
    if (cancelBack) {
        cancelBack.addEventListener('click', closeCancellationModal);
    }
    
    cancellationModal?.addEventListener('click', function(e) {
        if (e.target === cancellationModal) {
            closeCancellationModal();
        }
    });
    
    if (confirmCancellation) {
        confirmCancellation.addEventListener('click', function() {
            const reason = document.querySelector('input[name="cancelReason"]:checked')?.value;
            const notes = document.getElementById('cancelNotes')?.value || '';
            
            if (!reason || !['patient-cancelled', 'clinic-cancelled'].includes(reason)) {
                alert('Please select a valid cancellation reason.');
                return;
            }
            
            updateAppointmentStatus('cancelled', { 
                reason: reason === 'patient-cancelled' ? 'Patient Cancelled' : 'Clinic Cancelled',
                notes: notes
            });
            
            closeCancellationModal();
        });
    }
}

// Appointment Details Modal functionality
function initializeAppointmentDetailsModal() {
    const detailsModal = document.getElementById('appointmentDetailsModal');
    const detailsModalClose = document.getElementById('appointmentDetailsClose');
    const detailsOk = document.getElementById('appointmentDetailsOk');
    
    function closeDetailsModal() {
        closeModal('appointmentDetailsModal');
    }
    
    if (detailsModalClose) {
        detailsModalClose.addEventListener('click', closeDetailsModal);
    }
    
    if (detailsOk) {
        detailsOk.addEventListener('click', closeDetailsModal);
    }
    
    detailsModal?.addEventListener('click', function(e) {
        if (e.target === detailsModal) {
            closeDetailsModal();
        }
    });
}

// New Appointment Modal functionality
function initializeNewAppointmentModal() {
    const newAppointmentBtn = document.getElementById('newAppointmentBtn');
    const newAppointmentModal = document.getElementById('newAppointmentModal');
    const newAppointmentClose = document.getElementById('newAppointmentClose');
    const newAppointmentCancel = document.getElementById('newAppointmentCancel');
    const newAppointmentForm = document.getElementById('newAppointmentForm');
    
    // In the new appointment modal close functions, add this reset:
    function closeNewAppointmentModal() {
        closeModal('newAppointmentModal');
        const form = document.getElementById('newAppointmentForm');
        const patientNameInput = document.getElementById('appointmentPatientName');
        
        if (form) {
            form.reset();
        }
        
        // Reset patient name field to editable state
        if (patientNameInput) {
            patientNameInput.readOnly = false;
            patientNameInput.style.backgroundColor = 'white';
        }
    }
    
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', () => {
            openNewAppointmentModal();
        });
    }
    
    if (newAppointmentClose) {
        newAppointmentClose.addEventListener('click', closeNewAppointmentModal);
    }
    
    if (newAppointmentCancel) {
        newAppointmentCancel.addEventListener('click', closeNewAppointmentModal);
    }
    
    if (newAppointmentModal) {
        newAppointmentModal.addEventListener('click', function(e) {
            if (e.target === newAppointmentModal) {
                closeNewAppointmentModal();
            }
        });
    }
    
    if (newAppointmentForm) {
        newAppointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleNewAppointmentSubmission();
            closeNewAppointmentModal();
        });
    }
}

function openNewAppointmentModal(selectedDate = null) {
    console.log('🔵 openNewAppointmentModal called');

    const dateInput = document.getElementById('appointmentDate');
    const today = new Date().toISOString().split('T')[0];

    if (dateInput) {
        dateInput.min = today;
        dateInput.value = selectedDate ? selectedDate.toISOString().split('T')[0] : today;
    }

    // Apply location permissions using shared function
    applyLocationPermissionsToNewAppointmentModal();

    console.log('✅ Location permissions applied. Opening modal...');
    openModal('newAppointmentModal');
}

async function handleNewAppointmentSubmission() {
    try {
        const formData = {
            patientName: document.getElementById('appointmentPatientName')?.value || '',
            date: document.getElementById('appointmentDate')?.value || '',
            time: extractTimeFromSlot(document.getElementById('appointmentTime')?.value || ''),
            service: getServiceDisplayName(document.getElementById('appointmentService')?.value || ''),
            location: getLocationDisplayName(document.getElementById('appointmentLocation')?.value || ''),
            phone: document.getElementById('appointmentPhone')?.value || '',
            notes: document.getElementById('appointmentNotes')?.value || ''
        };
        
        // Validate required fields
        if (!formData.patientName || !formData.date || !formData.time || 
            !formData.service || !formData.location) {
            showErrorMessage('Please fill in all required fields');
            return;
        }
        
        // Add appointment using global data manager
        try {
            await dataManager.addAppointment(formData);
            showSuccessMessage('New appointment created successfully!');
        } catch (error) {
            console.error('Error adding appointment:', error);
            showErrorMessage('Failed to add appointment');
        }
        
        // Refresh current view only for performance
        await refreshCurrentViewOnly();
        
    } catch (error) {
        showErrorMessage('Failed to create appointment. Please check all fields and try again.');
    }
}

// Form Validation functionality
function setupFormValidation() {
    // Patient name validation
    const patientNameInputs = document.querySelectorAll('#appointmentPatientName');
    patientNameInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function(e) {
                try {
                    this.value = this.value.replace(/[^A-Za-z\s'\-\.]/g, '').substring(0, 50);
                } catch (error) {
                }
            });
            
            input.addEventListener('change', function(e) {
                try {
                    if (this.value && !validatePatientName(this.value)) {
                        this.value = this.value.replace(/[^A-Za-z\s'\-\.]/g, '').substring(0, 50);
                    }
                } catch (error) {
                }
            });
        }
    });

    // Phone number formatting
    const phoneInputs = document.querySelectorAll('#appointmentPhone');
    phoneInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                try {
                    formatPhoneNumber(this);
                } catch (error) {
                }
            });
        }
    });
}


// Live Time Indicator functionality
function initializeLiveTimeIndicator() {
    updateLiveTimeIndicator();
    setInterval(updateLiveTimeIndicator, 60000);
}

function updateLiveTimeIndicator() {
    const indicator = document.getElementById('liveTimeIndicator');
    if (!indicator || currentView !== 'day') return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour < 9 || currentHour >= 16) {
        indicator.style.display = 'none';
        return;
    }
    
    const minutesFromStart = (currentHour - 9) * 60 + currentMinute;
    const totalMinutes = 7 * 60;
    const percentage = (minutesFromStart / totalMinutes) * 100;
    
    indicator.style.top = percentage + '%';
    indicator.style.display = 'block';
}

// Update day view date display
function updateDayDate() {
    const dayDateElement = document.getElementById('dayDate');
    if (dayDateElement) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dayDateElement.textContent = currentDate.toLocaleDateString('en-US', options);
    }
}

function updateCurrentDateDisplay() {
    
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (!dateDisplay) return;
    
    let displayText = '';
    if (currentView === 'week') {
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        displayText = `${startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    } else if (currentView === 'day') {
        displayText = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } else if (currentView === 'month') {
        displayText = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    dateDisplay.textContent = displayText;
}

// Month Calendar Generation
// Month Calendar Generation - Optimized with batch queries
async function generateMonthCalendar() {
    const monthDatesElement = document.getElementById('monthDates');

    if (!monthDatesElement) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    console.log('Calendar: Starting optimized month calendar generation');

    // Clear previous dates
    monthDatesElement.innerHTML = '';

    // Calculate calendar layout
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    // Previous month info
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDate = prevMonth.getDate();
    const prevMonthYear = prevMonth.getFullYear();
    const prevMonthIndex = prevMonth.getMonth();

    // OPTIMIZATION: Batch query for the entire month
    console.log(`Calendar: Fetching appointments for month ${year}-${(month + 1).toString().padStart(2, '0')}`);
    const appointmentsByDate = await dataManager.getAppointmentsForMonth(year, month + 1);
    console.log('Calendar: Batch query completed, appointments found for', Object.keys(appointmentsByDate).length, 'days');

    // Add previous month's trailing dates
    for (let i = adjustedStartingDay - 1; i >= 0; i--) {
        const date = prevMonthLastDate - i;
        const prevDateObj = new Date(prevMonthYear, prevMonthIndex, date, 12, 0, 0);
        // Use formatDateToKey for consistency with other calendar views
        const dateKey = formatDateToKey(prevDateObj);
        const appointments = appointmentsByDate[dateKey] || [];
        console.log(`📅 Month calendar - Previous month date ${dateKey}: ${appointments.length} appointments`);
        const dateElement = createMonthDateElementOptimized(date, true, false, prevDateObj, appointments);
        monthDatesElement.appendChild(dateElement);
    }

    // Add current month's dates
    const today = new Date();
    for (let date = 1; date <= daysInMonth; date++) {
        const currentDateObj = new Date(year, month, date, 12, 0, 0);
        const isToday = currentDateObj.toDateString() === today.toDateString();
        // Use formatDateToKey for consistency with other calendar views
        const dateKey = formatDateToKey(currentDateObj);
        const appointments = appointmentsByDate[dateKey] || [];
        console.log(`📅 Month calendar - Current month date ${dateKey}: ${appointments.length} appointments`);
        const dateElement = createMonthDateElementOptimized(date, false, isToday, currentDateObj, appointments);
        monthDatesElement.appendChild(dateElement);
    }

    // Add next month's leading dates
    const remainingCells = 42 - monthDatesElement.children.length;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonthIndex = month === 11 ? 0 : month + 1;

    for (let date = 1; date <= remainingCells; date++) {
        const nextDateObj = new Date(nextMonthYear, nextMonthIndex, date, 12, 0, 0);
        // Use formatDateToKey for consistency with other calendar views
        const dateKey = formatDateToKey(nextDateObj);
        const appointments = appointmentsByDate[dateKey] || [];
        console.log(`📅 Month calendar - Next month date ${dateKey}: ${appointments.length} appointments`);
        const dateElement = createMonthDateElementOptimized(date, true, false, nextDateObj, appointments);
        monthDatesElement.appendChild(dateElement);
    }

    pruneTrailingOtherMonthRows(monthDatesElement);

    // Default sidebar selection (prefer today's date if visible)
    let defaultDateObj;
    let defaultAppointments;
    if (year === today.getFullYear() && month === today.getMonth()) {
        defaultDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
        defaultAppointments = appointmentsByDate[formatDateToKey(defaultDateObj)] || [];
        const todayElement = monthDatesElement.querySelector('.month-date.today');
        if (todayElement) {
            todayElement.classList.add('selected');
        }
    } else {
        defaultDateObj = new Date(year, month, 1, 12, 0, 0);
        defaultAppointments = appointmentsByDate[formatDateToKey(defaultDateObj)] || [];
        const firstCurrent = monthDatesElement.querySelector('.month-date:not(.other-month)');
        if (firstCurrent) {
            firstCurrent.classList.add('selected');
        }
    }

    if (defaultDateObj) {
        updateMonthSidebar(defaultDateObj, defaultAppointments);
    }

    console.log('Calendar: Optimized month calendar generation completed');
}

function pruneTrailingOtherMonthRows(container) {
    const cells = Array.from(container.children);
    if (cells.length % 7 !== 0) return;

    let rows = cells.length / 7;
    while (rows > 0) {
        const startIndex = (rows - 1) * 7;
        const rowCells = cells.slice(startIndex, startIndex + 7);
        const allOther = rowCells.every(cell => cell.classList.contains('other-month'));

        if (allOther) {
            rowCells.forEach(cell => container.removeChild(cell));
            cells.splice(startIndex, 7);
            rows--;
        } else {
            break;
        }
    }
}

let currentMonthSidebarDate = null;

// Optimized version that uses pre-fetched appointment data
function createMonthDateElementOptimized(date, isOtherMonth = false, isToday = false, dateObj = null, appointments = []) {
    const dateElement = document.createElement('div');
    dateElement.className = 'month-date';

    if (isOtherMonth) {
        dateElement.classList.add('other-month');
    }

    if (isToday) {
        dateElement.classList.add('today');
    }

    // Use pre-fetched appointment data (no async call needed!)
    const appointmentCount = appointments.length;

    // Create content
    const dateNumber = document.createElement('div');
    dateNumber.className = 'date-number';
    dateNumber.textContent = date.toString();
    dateElement.appendChild(dateNumber);

    // Only show add icon for current month dates
    if (!isOtherMonth) {
        const addIcon = document.createElement('div');
        addIcon.className = 'add-appointment-icon';
        addIcon.innerHTML = '<i class="fas fa-plus"></i>';
        dateElement.appendChild(addIcon);
    }

    // Show appointment count for all dates
    if (appointmentCount > 0) {
        const countBadge = document.createElement('div');
        countBadge.className = 'appointment-count';
        countBadge.textContent = appointmentCount.toString();
        dateElement.appendChild(countBadge);
    }

    // Allow clicking on all dates
    if (dateObj) {
        dateElement.addEventListener('click', (e) => {
            // Check if clicked on add appointment icon
            if (!isOtherMonth && e.target.closest('.add-appointment-icon')) {
                e.stopPropagation();
                openNewAppointmentModal(dateObj);
                return;
            }

            // Highlight selected day in month view
            document.querySelectorAll('.month-date.selected').forEach(el => el.classList.remove('selected'));
            dateElement.classList.add('selected');

            // Update sidebar with this day's appointments
            updateMonthSidebar(dateObj, appointments);
        });

        dateElement.addEventListener('dblclick', (e) => {
            if (!isOtherMonth && e.target.closest('.add-appointment-icon')) {
                return;
            }
            switchToDayView(dateObj);
        });
    }

    return dateElement;
}

function updateMonthSidebar(dateObj, appointments) {
    const sidebarDateEl = document.getElementById('monthSidebarDate');
    const sidebarCountEl = document.getElementById('monthSidebarCount');
    const sidebarEmptyEl = document.getElementById('monthSidebarEmpty');
    const sidebarListEl = document.getElementById('monthSidebarList');

    if (!sidebarDateEl || !sidebarCountEl || !sidebarEmptyEl || !sidebarListEl) {
        return;
    }

    currentMonthSidebarDate = dateObj;

    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    sidebarDateEl.textContent = dateObj.toLocaleDateString('en-US', options);

    const count = appointments.length;
    if (count === 0) {
        sidebarCountEl.textContent = '';
        sidebarEmptyEl.style.display = 'block';
        sidebarListEl.innerHTML = '';
        return;
    }

    sidebarCountEl.textContent = count === 1 ? '1 appointment' : `${count} appointments`;
    sidebarEmptyEl.style.display = 'none';

    // Sort appointments by time (HH:MM)
    const sorted = [...appointments].sort((a, b) => {
        const ta = (a.time || '00:00').padStart(5, '0');
        const tb = (b.time || '00:00').padStart(5, '0');
        return ta.localeCompare(tb);
    });

    sidebarListEl.innerHTML = '';

    sorted.forEach(app => {
        const card = document.createElement('div');
        const status = (app.status || 'scheduled').toLowerCase();
        card.className = `month-sidebar-card status-${status}`;

        const timeText = app.time ? app.time : 'Time TBC';
        const serviceText = app.service || 'Dental visit';
        const locationText = app.location || '';

        card.innerHTML = `
            <div class="month-sidebar-card-header">
                <div class="month-sidebar-time">${timeText}</div>
                <div class="month-sidebar-status">${status}</div>
            </div>
            <div class="month-sidebar-title">${app.patientName || 'Unnamed patient'}</div>
            <div class="month-sidebar-subtitle">${serviceText}${locationText ? ' · ' + locationText : ''}</div>
        `;

        sidebarListEl.appendChild(card);
    });
}

async function createMonthDateElement(date, isOtherMonth = false, isToday = false, dateObj = null) {
    const dateElement = document.createElement('div');
    dateElement.className = 'month-date';

    if (isOtherMonth) {
        dateElement.classList.add('other-month');
    }

    if (isToday) {
        dateElement.classList.add('today');
    }

    // Get appointment count from Firebase using optimized async call
    const appointments = dateObj ? await getAppointmentsForDateOptimized(dateObj) : [];
    const appointmentCount = appointments.length;
    
    // Create content
    const dateNumber = document.createElement('div');
    dateNumber.className = 'date-number';
    dateNumber.textContent = date.toString();
    dateElement.appendChild(dateNumber);
    
    // Only show add icon for current month dates
    if (!isOtherMonth) {
        const addIcon = document.createElement('div');
        addIcon.className = 'add-appointment-icon';
        addIcon.innerHTML = '<i class="fas fa-plus"></i>';
        dateElement.appendChild(addIcon);
    }
    
    // Show appointment count for all dates
    if (appointmentCount > 0) {
        const countBadge = document.createElement('div');
        countBadge.className = 'appointment-count';
        countBadge.textContent = appointmentCount.toString();
        dateElement.appendChild(countBadge);
    }
    
    // Allow clicking on all dates
    if (dateObj) {
        dateElement.addEventListener('click', (e) => {
            // Check if clicked on add appointment icon
            if (!isOtherMonth && e.target.closest('.add-appointment-icon')) {
                e.stopPropagation();
                openNewAppointmentModal(dateObj);
                return;
            }
            
            // Navigate to Day View with selected date
            switchToDayView(dateObj);
        });
    }
    
    return dateElement;
}

function switchToDayView(selectedDate) {
    if (!(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
        return;
    }
    
    // Create a clean date object
    const cleanDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12, 0, 0);
    
    // Update current date
    currentDate = cleanDate;
    
    // Update day view with selected date
    const dayDateElement = document.getElementById('dayDate');
    if (dayDateElement) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = cleanDate.toLocaleDateString('en-US', options);
        dayDateElement.textContent = formattedDate;
    }
    
    // Switch to day view
    document.querySelectorAll('.view-content').forEach(content => content.classList.remove('active'));
    document.getElementById('day-view').classList.add('active');
    
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-view="day"]').classList.add('active');
    
    currentView = 'day';
    
    // Render day view with unified data
    renderDayView();
    
    // Update live time indicator
    updateLiveTimeIndicator();
}

// Status Update Function
async function updateAppointmentStatus(newStatus, additionalData = {}) {
    if (!currentAppointmentData) {
        showErrorMessage('Error: No appointment data found. Please try again.');
        return;
    }
    
    try {
        const appointmentContext = currentAppointmentData?.rawAppointment || null;
        const success = await dataManager.updateAppointmentStatus(
            currentAppointmentData.appointmentId,
            newStatus,
            additionalData,
            appointmentContext
        );
        
        if (!success) {
            showErrorMessage('Appointment not found in database');
            return;
        }
        
        let message = '';
        switch(newStatus) {
            case 'arrived':
                message = 'Patient marked as arrived';
                break;
            case 'completed':
                message = 'Appointment marked as completed';
                break;
            case 'no-show':
                message = 'Appointment marked as no-show';
                break;
            case 'cancelled':
                message = 'Appointment cancelled and removed from schedule';
                break;
            case 'held':
                message = 'Appointment put on hold';
                break;
        }
        
        // Update status display in popup
        if (currentAppointmentData) {
            currentAppointmentData.status = newStatus;
            updateProcessModalDisplay(currentAppointmentData);
        }
        
        // Save appointment date before clearing data
        const appointmentDate = currentAppointmentData.date;

        // NOTE: Cache invalidation is now handled by data-manager.js via GlobalCacheManager
        // No need to manually clear cache here

        showSuccessMessage(message);

        // Close the process modal immediately using proper closeModal function
        closeModal('processModal');

        // Clear current appointment data
        currentAppointmentData = null;

        // Refresh current view to show updated status
        console.log('Calendar: Refreshing view after status update');
        await refreshCurrentViewOnly();
        console.log('Calendar: View refresh completed');

    } catch (error) {
        showErrorMessage('Failed to update appointment status');
    }
}

// Update status display in Process Modal
function updateProcessModalDisplay(appointmentData) {
    const summary = document.getElementById('appointmentSummary');
    if (summary && appointmentData) {
        summary.innerHTML = `
            <h4>Appointment Details</h4>
            <div class="detail-row">
                <span class="detail-label">Patient:</span>
                <span class="detail-value">${escapeHtml(appointmentData.patientName)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${escapeHtml(appointmentData.service)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${escapeHtml(capitalizeFirst(appointmentData.status.replace('-', ' ')))}</span>
            </div>
        `;
    }
    // Update button selection state
    updateButtonSelection(appointmentData.status);
}

// Update button selection state
function updateButtonSelection(currentStatus) {
    // Clear all selection states
    document.querySelectorAll('.btn-action').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Set selection based on current state
    let selectedButtonId = null;
    switch(currentStatus) {
        case 'arrived':
            selectedButtonId = 'arrivedBtn';
            break;
        case 'completed':
            selectedButtonId = 'completedBtn';
            break;
        case 'no-show':
            selectedButtonId = 'noShowBtn';
            break;
        case 'cancelled':
            selectedButtonId = 'cancelBtn';
            break;
        case 'held':
            selectedButtonId = 'holdBtn';
            break;
        // 'scheduled' status doesn't select any button
    }
    
    if (selectedButtonId) {
        const selectedBtn = document.getElementById(selectedButtonId);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }
}

function getStatusFromCard(element) {
    const statusClasses = ['scheduled', 'arrived', 'completed', 'no-show', 'cancelled', 'held'];
    for (let status of statusClasses) {
        if (element.classList.contains(status)) {
            return status;
        }
    }
    return 'scheduled';
}

// Navigation handlers - Optimized for performance
document.getElementById('prevWeek')?.addEventListener('click', async () => {
    console.log(`Calendar: Previous navigation in ${currentView} view`);

    if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() - 7);
        await refreshCurrentViewOnly();
    } else if (currentView === 'day') {
        currentDate.setDate(currentDate.getDate() - 1);
        // Use optimized day view rendering for instant response
        await refreshCurrentViewOnly();
    } else if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() - 1);
        await refreshCurrentViewOnly();
    } else {
        // Fallback for unknown views
        await refreshAllViews();
        updateCurrentDateDisplay();
    }
});

document.getElementById('nextWeek')?.addEventListener('click', async () => {
    console.log(`Calendar: Next navigation in ${currentView} view`);

    if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
        await refreshCurrentViewOnly();
    } else if (currentView === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
        // Use optimized day view rendering for instant response
        await refreshCurrentViewOnly();
    } else if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + 1);
        await refreshCurrentViewOnly();
    } else {
        // Fallback for unknown views
        await refreshAllViews();
        updateCurrentDateDisplay();
    }
});

// Show more appointments popup with smart positioning
function showMoreAppointmentsPopup(hiddenAppointments, buttonElement) {
    // Remove existing popup if any
    const existingPopup = document.querySelector('.more-appointments-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'more-appointments-popup';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'popup-header';
    header.textContent = `Additional Appointments (${hiddenAppointments.length})`;
    popup.appendChild(header);
    
    // Create appointments list
    const appointmentsList = document.createElement('div');
    appointmentsList.className = 'popup-appointments-list';
    
    hiddenAppointments.forEach(appointment => {
        const appointmentItem = document.createElement('div');
        appointmentItem.className = `popup-appointment-item ${appointment.status}`;
        appointmentItem.onclick = () => {
            popup.remove();
            openProcessModal(appointmentItem, appointment);
        };
        
        const leftContent = document.createElement('div');
        leftContent.className = 'popup-left-content';
        
        const patientDiv = document.createElement('div');
        patientDiv.className = 'popup-patient-name';
        patientDiv.textContent = appointment.patientName;
        
        const serviceDiv = document.createElement('div');
        serviceDiv.className = 'popup-service';
        serviceDiv.textContent = appointment.service;
        
        leftContent.appendChild(patientDiv);
        leftContent.appendChild(serviceDiv);
        
        const statusDiv = document.createElement('div');
        const status = appointment.status || 'scheduled'; // Default to 'scheduled' if no status
        statusDiv.className = `popup-status ${status}`;
        statusDiv.textContent = capitalizeFirst(status);
        
        appointmentItem.appendChild(leftContent);
        appointmentItem.appendChild(statusDiv);
        appointmentsList.appendChild(appointmentItem);
    });
    
    popup.appendChild(appointmentsList);
    
    // Add to DOM temporarily to measure dimensions
    popup.style.visibility = 'hidden';
    popup.style.position = 'fixed';
    document.body.appendChild(popup);
    
    // Get dimensions and position popup
    const buttonRect = buttonElement.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Smart positioning logic
    let left = buttonRect.left;
    let top = buttonRect.bottom + 5;
    
    // Check if popup would overflow right edge
    if (left + popupRect.width > viewportWidth - 10) {
        left = buttonRect.right - popupRect.width;
    }
    
    // Ensure popup doesn't go beyond left edge
    if (left < 10) {
        left = 10;
    }
    
    // Check if popup would overflow bottom edge
    if (top + popupRect.height > viewportHeight - 10) {
        top = buttonRect.top - popupRect.height - 5;
    }
    
    // Ensure popup doesn't go beyond top edge
    if (top < 10) {
        top = 10;
    }
    
    // Apply final position
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.visibility = 'visible';
    popup.style.zIndex = '1000';
    
    // Close popup when clicking outside
    const closePopup = (e) => {
        if (!popup.contains(e.target) && e.target !== buttonElement) {
            popup.remove();
            document.removeEventListener('click', closePopup);
        }
    };
    
    // Delay adding the event listener to prevent immediate closure
    setTimeout(() => {
        document.addEventListener('click', closePopup);
    }, 100);
}

function validatePatientName(name) {
    if (typeof name !== 'string') return false;
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length === 0) return false;
    const namePattern = /^[A-Za-z\s'\-\.]{1,50}$/;
    return namePattern.test(trimmedName);
}



// Add this function at the end of appointments.js
function fixAppointmentTimeOptions() {
    // Wait for DOM to load
    setTimeout(() => {
        const timeSelect = document.getElementById('appointmentTime');
        if (timeSelect && timeSelect.options.length === 8) {
            // Add missing time options
            const option4to5 = new Option('04:00 PM - 05:00 PM', '16:00-17:00');
            timeSelect.add(option4to5);
        }
    }, 200);
}

// Listen for New Appointment button click
document.addEventListener('click', function(e) {
    if (e.target && (
        e.target.id === 'newAppointmentBtn' ||
        e.target.textContent?.includes('New Appointment') ||
        e.target.closest('#newAppointmentBtn')
    )) {
        fixAppointmentTimeOptions();
    }
});

// Also execute once when page loads
document.addEventListener('DOMContentLoaded', fixAppointmentTimeOptions);

// Patient Account Modal Functions
let currentAccountPatient = null;

async function showPatientAccountModal(patientData) {
    currentAccountPatient = patientData;

    // Make patient data globally accessible for PDF export
    window._currentAccountPatient = patientData;

    // DEBUG: Log the patient data structure
    console.log('🔍 showPatientAccountModal - patientData:', patientData);
    console.log('🔍 patientData.userId:', patientData.userId);
    console.log('🔍 patientData keys:', Object.keys(patientData));

    // Update header info
    document.getElementById('accountPatientName').textContent = patientData.patientName;
    
    // Update status toggle
    const statusToggle = document.getElementById('patientStatusToggle');
    const hasUpcomingAppointments = await checkHasUpcomingAppointments(patientData);
    
    if (hasUpcomingAppointments) {
        statusToggle.classList.add('active');
        statusToggle.classList.remove('inactive');
        statusToggle.querySelector('.status-text').textContent = 'Active';
    } else {
        statusToggle.classList.add('inactive');
        statusToggle.classList.remove('active');
        statusToggle.querySelector('.status-text').textContent = 'Inactive';
    }
    
    // Load appointment history - pass full patient data for userId access
    loadAccountHistory(patientData);

    // Load medical records
    loadAccountRecords(patientData);

    // Load dental chart
    loadDentalChart(patientData);

    // Load next treatments - pass full patient data for userId access
    loadNextTreatments(patientData);
    
    openModal('patientAccountModal');
    
   // In showPatientAccountModal function, replace the setTimeout at the end with:
    setTimeout(() => {
    initializePatientInfoEdit();
    
    // Check if element exists before calling the function
    const displayDiv = document.getElementById('patientInfoDisplay');
    
    if (displayDiv) {
        loadPatientInfoDisplay(patientData);
    } else {
        // Try again after another delay
        setTimeout(() => {
            loadPatientInfoDisplay(patientData);
        }, 300);
    }
}, 200);
}

async function checkHasUpcomingAppointments(patientData) {
    const allAppointments = await dataManager.getAllAppointments() || [];
    const todayString = new Date().toISOString().split('T')[0];

    return allAppointments.some(appointment => {
        const samePatient = (patientData.userId && appointment.userId)
            ? appointment.userId === patientData.userId
            : appointment.patientName === patientData.patientName;

        if (!samePatient) return false;
        return appointment.dateKey >= todayString;
    });
}

async function loadAccountHistory(patientData) {
    try {
        const historyContainer = document.getElementById('accountHistoryList');
        const allAppointments = await dataManager.getAllAppointments() || [];
        const cancelledAppointments = await dataManager.getCancelledAppointments() || [];

        // DEBUG: Log filtering logic
        console.log('🔍 loadAccountHistory - patientData:', patientData);
        console.log('🔍 loadAccountHistory - userId:', patientData.userId);
        console.log('🔍 loadAccountHistory - patientName:', patientData.patientName);

        const patientAppointments = [...allAppointments, ...cancelledAppointments]
        .filter(app => {
            // Use userId if available, fallback to patientName
            if (patientData.userId && app.userId) {
                return app.userId === patientData.userId;
            } else {
                return app.patientName === patientData.patientName;
            }
        })
        .sort((a, b) => b.dateKey.localeCompare(a.dateKey)); // String comparison for dates (newest first)
    
    historyContainer.innerHTML = '';
    
    patientAppointments.forEach(appointment => {
        const historyItem = document.createElement('div');
        historyItem.className = 'account-history-item';
        // Remove this line: historyItem.onclick = () => showAppointmentDetails(null, appointment);

        // DEBUG: Log Account Management date processing
        console.log('📅 Account Management History - RAW data:', {
            dateKey: appointment.dateKey,
            appointmentDateTime: appointment.appointmentDateTime,
            rawAppointment: appointment
        });

        // FIXED: Use string parsing instead of Date object to avoid timezone issues
        const [year, month, day] = appointment.dateKey.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
        const formattedDate = `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;

        console.log('📅 Account Management FIXED string parsing:', {
            dateKey: appointment.dateKey,
            year, month, day,
            formattedDate: formattedDate,
            comparison: 'This should now show correct dates'
        });
        const formattedTime = formatTime(appointment.time);
        
        historyItem.innerHTML = `
            <div class="account-history-header">
                <span class="account-history-date">${escapeHtml(formattedDate)} - ${escapeHtml(formattedTime)}</span>
                <span class="status-badge ${appointment.status}">${escapeHtml(capitalizeFirst(appointment.status))}</span>
            </div>
            <div class="account-history-details">
                <div><strong>Service:</strong> ${escapeHtml(appointment.serviceType || appointment.service || 'Unknown Service')}</div>
                <div><strong>Location:</strong> ${escapeHtml(appointment.location)}</div>
                <div><strong>Duration:</strong> 60 minutes</div>
            </div>
            ${appointment.notes ? `<div class="account-history-notes"><strong>Notes:</strong> ${escapeHtml(appointment.notes)}</div>` : ''}
        `;
        
        historyContainer.appendChild(historyItem);
        });
    } catch (error) {
        console.error('Error loading account history:', error);
        const historyContainer = document.getElementById('accountHistoryList');
        if (historyContainer) {
            historyContainer.innerHTML = '<div class="error-message">Failed to load appointment history</div>';
        }
    }
}

async function loadAccountRecords(patientData) {
    const recordsList = document.getElementById('accountRecordsList');

    if (!patientData) {
        recordsList.innerHTML = '<div style="text-align: center; color: #64748b; padding: 40px;">No patient selected</div>';
        return;
    }

    if (!window.firebaseDataService) {
        recordsList.innerHTML = '<div style="text-align: center; color: #64748b; padding: 40px;">Firebase service not available</div>';
        return;
    }

    // Use userId if available, otherwise generate a fallback ID based on patient name
    const userId = patientData.userId ||
                   `patient_${patientData.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    console.log('📥 Loading records for patient:', patientData.patientName, 'using ID:', userId);

    try {
        recordsList.innerHTML = '<div style="text-align: center; color: #64748b; padding: 40px;">Loading medical records...</div>';

        const records = await window.firebaseDataService.getMedicalRecords(userId);

        recordsList.innerHTML = '';

        if (records.length === 0) {
            recordsList.innerHTML = '<div style="text-align: center; color: #64748b; padding: 40px;">No medical records found</div>';
            return;
        }

        records.forEach(record => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';

            // Determine icon based on file type
            let iconClass = 'fas fa-file';
            if (record.type.includes('pdf')) {
                iconClass = 'fas fa-file-pdf';
            } else if (record.type.includes('image')) {
                iconClass = 'fas fa-file-image';
            } else if (record.type.includes('word') || record.type.includes('document')) {
                iconClass = 'fas fa-file-word';
            }

            // Format upload date
            const uploadDate = record.uploadedAt.toDate ?
                record.uploadedAt.toDate() :
                new Date(record.uploadedAt);
            const formattedDate = uploadDate.toLocaleDateString();

            recordItem.innerHTML = `
                <div class="record-info">
                    <i class="${iconClass} record-icon"></i>
                    <div class="record-details">
                        <div class="record-name">${escapeHtml(record.originalName)}</div>
                        <div class="record-date">Uploaded: ${escapeHtml(formattedDate)}</div>
                    </div>
                </div>
                <div class="record-actions">
                    <button class="record-action" data-record-id="${escapeHtml(record.id)}" data-record-name="${escapeHtml(record.originalName)}" data-action="download" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="record-action" data-record-id="${escapeHtml(record.id)}" data-record-name="${escapeHtml(record.originalName)}" data-action="rename" title="Rename">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="record-action" data-record-id="${escapeHtml(record.id)}" data-record-name="${escapeHtml(record.originalName)}" data-action="delete" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Add event listeners to buttons (safer than inline onclick)
            const buttons = recordItem.querySelectorAll('.record-action');
            buttons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const action = this.getAttribute('data-action');
                    const recordId = this.getAttribute('data-record-id');
                    const recordName = this.getAttribute('data-record-name');

                    if (action === 'download') {
                        downloadRecord(recordId, record.base64Data, recordName);
                    } else if (action === 'rename') {
                        renameRecord(recordId, recordName);
                    } else if (action === 'delete') {
                        deleteRecord(recordId, recordName);
                    }
                });
            });

            recordsList.appendChild(recordItem);
        });

    } catch (error) {
        console.error('Error loading medical records:', error);
        recordsList.innerHTML = '<div style="text-align: center; color: #e74c3c; padding: 40px;">Failed to load medical records</div>';
    }
}

// Add rename function
function renameRecord(recordId, currentName) {
    const newName = prompt('Enter new filename:', currentName);
    if (newName && newName !== currentName) {
        if (window.firebaseDataService) {
            window.firebaseDataService.renameMedicalRecord(recordId, newName)
                .then(() => {
                    console.log('File renamed successfully');
                    // Refresh the records list
                    if (currentAccountPatient) {
                        loadAccountRecords(currentAccountPatient);
                    }
                })
                .catch(error => {
                    console.error('Rename failed:', error);
                    alert('Failed to rename file. Please try again.');
                });
        }
    }
}

async function loadNextTreatments(patientData) {
    const treatmentContainer = document.getElementById('accountTreatmentList');
    const today = new Date();
    const allAppointments = await dataManager.getAllAppointments();

    // DEBUG: Log filtering logic
    console.log('🔍 loadNextTreatments - patientData:', patientData);
    console.log('🔍 loadNextTreatments - userId:', patientData.userId);
    console.log('🔍 loadNextTreatments - patientName:', patientData.patientName);

    const futureAppointments = allAppointments
        .filter(app => {
            // Use userId if available, fallback to patientName
            let isMatchingPatient = false;
            if (patientData.userId && app.userId) {
                isMatchingPatient = app.userId === patientData.userId;
            } else {
                isMatchingPatient = app.patientName === patientData.patientName;
            }
            if (!isMatchingPatient) return false;

            // FIXED: Use string date comparison to avoid timezone issues
            const todayString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            return app.dateKey >= todayString;
        })
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey)); // String comparison for dates
    
    treatmentContainer.innerHTML = '';
    
    futureAppointments.forEach(appointment => {
        const treatmentCard = document.createElement('div');
        treatmentCard.className = 'treatment-card';
        treatmentCard.onclick = () => showAppointmentDetails(null, appointment);

        // DEBUG: Log Next Treatment date processing
        console.log('🔮 Next Treatment - RAW data:', {
            dateKey: appointment.dateKey,
            appointmentDateTime: appointment.appointmentDateTime,
            rawAppointment: appointment
        });

        // FIXED: Use string parsing instead of Date object to avoid timezone issues
        const [year, month, day] = appointment.dateKey.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
        const formattedDate = `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;

        console.log('🔮 Next Treatment FIXED string parsing:', {
            dateKey: appointment.dateKey,
            year, month, day,
            formattedDate: formattedDate,
            comparison: 'This should now show correct dates'
        });
        const formattedTime = formatTime(appointment.time);
        
        treatmentCard.innerHTML = `
            <div class="treatment-header">
                <div class="treatment-info">
                    <h4>${escapeHtml(appointment.serviceType || appointment.service || 'Unknown Service')} - ${escapeHtml(appointment.location)}</h4>
                    <div class="treatment-date">${escapeHtml(formattedDate)} at ${escapeHtml(formattedTime)}</div>
                </div>
                <span class="status-badge ${appointment.status}">${escapeHtml(capitalizeFirst(appointment.status))}</span>
            </div>
            ${appointment.notes ? `<div class="treatment-desc">${escapeHtml(appointment.notes)}</div>` : ''}
        `;
        
        treatmentContainer.appendChild(treatmentCard);
    });
    
    if (futureAppointments.length === 0) {
        treatmentContainer.innerHTML = '<div style="text-align: center; color: #64748b; padding: 40px;">No upcoming treatments scheduled</div>';
    }
}

// Initialize Patient Account Modal
document.addEventListener('DOMContentLoaded', function() {
    // Account modal tab switching
    document.querySelectorAll('.account-tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.account-tab-item').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.account-tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Load snapshots when Chart History tab is opened
            if (tabId === 'chart-history' && window._currentAccountPatient) {
                const userId = window._currentAccountPatient.userId ||
                               `patient_${window._currentAccountPatient.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                loadChartSnapshots(userId);
            }
        });
    });
    
    // Account modal close
    document.getElementById('accountModalClose')?.addEventListener('click', () => {
        closeModal('patientAccountModal');
        currentAccountPatient = null;
    });
    
    // Schedule button
    document.getElementById('accountScheduleBtn')?.addEventListener('click', () => {
        closeModal('patientAccountModal');
        openNewAppointmentModalWithPatient(currentAccountPatient);
    });
    
    // Status toggle
    document.getElementById('patientStatusToggle')?.addEventListener('click', function() {
        // This is just visual - you might want to save status to database
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            this.classList.add('inactive');
            this.querySelector('.status-text').textContent = 'Inactive';
        } else {
            this.classList.remove('inactive');
            this.classList.add('active');
            this.querySelector('.status-text').textContent = 'Active';
        }
    });

    // Medical records file upload
    const accountFileInput = document.getElementById('accountFileInput');
    if (accountFileInput) {
        accountFileInput.addEventListener('change', handleFileUpload);
    }
});

// Helper functions for records
function downloadRecord(recordId, base64Data, filename) {
    if (window.firebaseDataService) {
        window.firebaseDataService.downloadMedicalRecord(base64Data, filename)
            .then(() => {
                console.log('File downloaded successfully');
            })
            .catch(error => {
                console.error('Download failed:', error);
                alert('Failed to download file. Please try again.');
            });
    }
}

function deleteRecord(recordId, filename) {
    if (confirm(`Delete ${filename}?`)) {
        if (window.firebaseDataService) {
            window.firebaseDataService.deleteMedicalRecord(recordId)
                .then(() => {
                    console.log('File deleted successfully');
                    // Refresh the records list
                    if (currentAccountPatient) {
                        loadAccountRecords(currentAccountPatient);
                    }
                })
                .catch(error => {
                    console.error('Delete failed:', error);
                    alert('Failed to delete file. Please try again.');
                });
        }
    }
}

// File upload handling
async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!currentAccountPatient) {
        alert('No patient selected');
        return;
    }

    // Use userId if available, otherwise generate a fallback ID based on patient name
    const userId = currentAccountPatient.userId ||
                   `patient_${currentAccountPatient.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    console.log('📤 File upload for patient:', currentAccountPatient.patientName, 'using ID:', userId);

    const uploadPromises = [];

    for (let file of files) {
        // Validate file
        if (!validateFile(file)) {
            continue;
        }

        // Compress image if needed
        const processedFile = await processFile(file);

        // Upload file
        uploadPromises.push(uploadFile(userId, processedFile));
    }

    try {
        await Promise.all(uploadPromises);
        console.log('All files uploaded successfully');

        // Refresh the records list
        if (currentAccountPatient) {
            loadAccountRecords(currentAccountPatient);
        }

        // Clear the file input
        event.target.value = '';
    } catch (error) {
        console.error('Upload failed:', error);
        alert('Some files failed to upload. Please try again.');
    }
}

// File validation (reduced size limit for Base64 storage)
function validateFile(file) {
    const maxSize = 500 * 1024; // 500KB (Base64 encoding increases size by ~33%)
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 500KB for Base64 storage.`);
        return false;
    }

    if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" has unsupported format. Allowed: PDF, JPG, PNG, DOC, DOCX`);
        return false;
    }

    return true;
}

// File processing (compression for images)
async function processFile(file) {
    // Only process images
    if (!file.type.startsWith('image/')) {
        return file;
    }

    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
            // More aggressive compression for Base64 storage
            let quality = 0.6; // Lower quality to reduce file size

            // Adjust quality based on file size
            if (file.size > 300 * 1024) { // Files larger than 300KB
                quality = 0.5; // More compression for larger files
            } else if (file.size < 100 * 1024) { // Small files
                quality = 0.7; // Less compression for small files
            }

            // Calculate new dimensions (max 800x600 for Base64 efficiency)
            let { width, height } = img;
            const maxWidth = 800;
            const maxHeight = 600;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                // Create new file with compressed data
                const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now()
                });
                resolve(compressedFile);
            }, file.type, quality);
        };

        img.src = URL.createObjectURL(file);
    });
}

// Upload file to Firebase Storage
async function uploadFile(userId, file) {
    return new Promise((resolve, reject) => {
        if (!window.firebaseDataService) {
            reject(new Error('Firebase service not available'));
            return;
        }

        // Create progress element
        const progressElement = createProgressElement(file.name);

        window.firebaseDataService.uploadMedicalRecord(userId, file, (progress) => {
            updateProgressElement(progressElement, progress);
        })
        .then((result) => {
            console.log('Upload successful:', result);
            removeProgressElement(progressElement);
            resolve(result);
        })
        .catch((error) => {
            console.error('Upload failed:', error);
            removeProgressElement(progressElement);
            reject(error);
        });
    });
}

// Progress UI helpers
function createProgressElement(filename) {
    const recordsList = document.getElementById('accountRecordsList');
    if (!recordsList) return null;

    const progressDiv = document.createElement('div');
    progressDiv.className = 'upload-progress';
    progressDiv.innerHTML = `
        <div class="progress-info">
            <span class="progress-filename">${filename}</span>
            <span class="progress-percentage">0%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
    `;

    recordsList.insertBefore(progressDiv, recordsList.firstChild);
    return progressDiv;
}

function updateProgressElement(element, progress) {
    if (!element) return;

    const percentage = Math.round(progress);
    const percentageSpan = element.querySelector('.progress-percentage');
    const progressFill = element.querySelector('.progress-fill');

    if (percentageSpan) percentageSpan.textContent = `${percentage}%`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
}

function removeProgressElement(element) {
    if (element && element.parentNode) {
        setTimeout(() => {
            try {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            } catch (error) {
                console.log('Progress element already removed');
            }
        }, 1000);
    }
}

// Remove the global document.addEventListener I provided earlier and replace with this:

function initializePatientInfoEdit() {
    const editBtn = document.getElementById('editPatientInfoBtn');
    const cancelBtn = document.getElementById('cancelEdit');
    const saveBtn = document.getElementById('saveEdit');
    
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleEditMode(true);
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            toggleEditMode(false);
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            savePatientInfo();
        });
    }
}
function toggleEditMode(isEdit) {
    const displayDiv = document.getElementById('patientInfoDisplay');
    const editDiv = document.getElementById('patientInfoEdit');
    const notesDisplay = document.getElementById('notesDisplay');
    const notesEdit = document.getElementById('notesEdit');
    const editActions = document.getElementById('editActions');
    console.log('DOM elements found:', {
        displayDiv: !!displayDiv,
        editDiv: !!editDiv,
        notesDisplay: !!notesDisplay,
        notesEdit: !!notesEdit,
        editActions: !!editActions
    });
    
    if (isEdit) {
        displayDiv.style.display = 'none';
        editDiv.style.display = 'flex';
        editDiv.style.flexDirection = 'column';
        notesDisplay.style.display = 'none';
        notesEdit.style.display = 'block';
        editActions.style.display = 'flex';
        
        if (currentAccountPatient) {
            // Basic information read from appointment records
            document.getElementById('editPhone').value = currentAccountPatient.phone || '';
            document.getElementById('editEmail').value = currentAccountPatient.email || '';
            
            // Detailed information read from patient profile
            let detailedInfo = {};
            if (dataManager.data.patientProfiles && dataManager.data.patientProfiles[currentAccountPatient.patientName]) {
                detailedInfo = dataManager.data.patientProfiles[currentAccountPatient.patientName].detailedInfo;
            }
            
            document.getElementById('editAddress').value = detailedInfo.address || '';
            document.getElementById('editEmergency').value = detailedInfo.emergency || '';
            document.getElementById('editDateOfBirth').value = detailedInfo.dateOfBirth || '';
            document.getElementById('editAge').value = detailedInfo.age || '';
            document.getElementById('editGender').value = detailedInfo.gender || '';
            document.getElementById('editFirstVisit').value = detailedInfo.firstVisit || '';
            document.getElementById('editAllergies').value = detailedInfo.allergies || '';
            document.getElementById('editMedications').value = detailedInfo.medications || '';
            document.getElementById('editConditions').value = detailedInfo.conditions || '';
            document.getElementById('notesEdit').value = detailedInfo.medicalNotes || '';
        }
    } else {
        displayDiv.style.display = 'flex';
        editDiv.style.display = 'none';
        notesDisplay.style.display = 'block';
        notesEdit.style.display = 'none';
        editActions.style.display = 'none';
    }
}

function savePatientInfo() {
    // Get values from input fields
    const phone = document.getElementById('editPhone').value;
    const email = document.getElementById('editEmail').value;
    const address = document.getElementById('editAddress').value;
    const emergency = document.getElementById('editEmergency').value;
    const dateOfBirth = document.getElementById('editDateOfBirth').value;
    const age = document.getElementById('editAge').value;
    const gender = document.getElementById('editGender').value;
    const firstVisit = document.getElementById('editFirstVisit').value;
    const allergies = document.getElementById('editAllergies').value;
    const medications = document.getElementById('editMedications').value;
    const conditions = document.getElementById('editConditions').value;
    const notesText = document.getElementById('notesEdit').value;
    
    if (currentAccountPatient) {
        // Update basic information in currentAccountPatient object
        currentAccountPatient.phone = phone;
        currentAccountPatient.email = email;
        
        // Update basic information in appointment records (phone, email)
        Object.keys(dataManager.data.appointments).forEach(dateKey => {
            dataManager.data.appointments[dateKey].forEach(appointment => {
                if (appointment.patientName === currentAccountPatient.patientName) {
                    appointment.phone = phone;
                    appointment.email = email;
                }
            });
        });
        
        // Update basic information in cancelled appointment records
        Object.keys(dataManager.data.cancelledAppointments || {}).forEach(dateKey => {
            dataManager.data.cancelledAppointments[dateKey].forEach(appointment => {
                if (appointment.patientName === currentAccountPatient.patientName) {
                    appointment.phone = phone;
                    appointment.email = email;
                }
            });
        });
        
        // Create/update detailed patient profile
        if (!dataManager.data.patientProfiles) {
            dataManager.data.patientProfiles = {};
        }
        
        dataManager.data.patientProfiles[currentAccountPatient.patientName] = {
            detailedInfo: {
                address: address,
                emergency: emergency,
                dateOfBirth: dateOfBirth,
                age: age,
                gender: gender,
                firstVisit: firstVisit,
                allergies: allergies,
                medications: medications,
                conditions: conditions,
                medicalNotes: notesText
            },
            lastUpdated: new Date().toISOString()
        };
        // Save to localStorage
        dataManager.saveToStorage();
    }
    
    showSuccessMessage('Patient information updated successfully!');
    
    // Reload patient information display (from latest saved data)
   // Reload patient information display
if (currentAccountPatient) {
    // Rebuild display from saved data
    let detailedInfo = {};
    if (dataManager.data.patientProfiles && dataManager.data.patientProfiles[currentAccountPatient.patientName]) {
        detailedInfo = dataManager.data.patientProfiles[currentAccountPatient.patientName].detailedInfo;
    }
    
    updatePatientInfoDisplay(
        phone, email, 
        detailedInfo.address || '', 
        detailedInfo.emergency || '', 
        detailedInfo.dateOfBirth || '', 
        detailedInfo.age || '', 
        detailedInfo.gender || '', 
        detailedInfo.firstVisit || '', 
        detailedInfo.allergies || '', 
        detailedInfo.medications || '', 
        detailedInfo.conditions || '', 
        detailedInfo.medicalNotes || ''
    );
}
    // Update display
    toggleEditMode(false);
    // Force refresh history view regardless of current view
    // Because user might have opened modal from accounts list
    renderHistoryView(true); // Remove if condition, always refresh
     // Add this line to close Modal
    closeModal('patientAccountModal'); 

    // Add this line to reset currentAccountPatient, avoiding data residue when opening Modal next time
    currentAccountPatient = null; 
    // Refresh history view
    if (currentView === 'history') {
        renderHistoryView(true);
    }
}

// Add when closing modal
document.getElementById('accountModalClose')?.addEventListener('click', () => {
    closeModal('patientAccountModal');
    renderHistoryView(true); // Refresh accounts list when closing modal
    currentAccountPatient = null;
});

function updatePatientInfoDisplay(phone, email, address, emergency, dateOfBirth, age, gender, firstVisit, allergies, medications, conditions, notesText) {
    const displayDiv = document.getElementById('patientInfoDisplay');
    displayDiv.innerHTML = `
        <div class="info-row"><span>Phone:</span> <span>${phone || ''}</span></div>
        <div class="info-row"><span>Email:</span> <span>${email || ''}</span></div>
        <div class="info-row"><span>Address:</span> <span>${address || ''}</span></div>
        <div class="info-row"><span>Emergency Contact:</span> <span>${emergency || ''}</span></div>
        <div class="info-row"><span>Date of Birth:</span> <span>${formatDateForDisplay(dateOfBirth) ||''}</span></div>
        <div class="info-row"><span>Age:</span> <span>${age ||''} years old</span></div>
        <div class="info-row"><span>Gender:</span> <span>${gender || ''}</span></div>
        <div class="info-row"><span>First Visit:</span> <span>${formatDateForDisplay(firstVisit) || ''}</span></div>
        <div class="info-row"><span>Allergies:</span> <span>${allergies || ''}</span></div>
        <div class="info-row"><span>Medications:</span> <span>${medications || ''}</span></div>
        <div class="info-row"><span>Medical Conditions:</span> <span>${conditions || ''}</span></div>
    `;
    
    // Update notes display
    const notesDisplay = document.getElementById('notesDisplay');
    if (notesDisplay) {
        notesDisplay.textContent = notesText || 'No notes available';
    }
}

function loadPatientInfoDisplay(patientData) {
    const displayDiv = document.getElementById('patientInfoDisplay');
    
    if (!displayDiv) {
        return;
    }
    
    // First get information from detailed profile, if none then display blank
    let detailedInfo = {};
    if (dataManager.data.patientProfiles && dataManager.data.patientProfiles[patientData.patientName]) {
        detailedInfo = dataManager.data.patientProfiles[patientData.patientName].detailedInfo;
    }
    
    displayDiv.innerHTML = `
        <div class="info-row"><span>Phone:</span> <span>${patientData.phone || ''}</span></div>
        <div class="info-row"><span>Email:</span> <span>${patientData.email || ''}</span></div>
        <div class="info-row"><span>Address:</span> <span>${detailedInfo.address || ''}</span></div>
        <div class="info-row"><span>Emergency Contact:</span> <span>${detailedInfo.emergency || ''}</span></div>
        <div class="info-row"><span>Date of Birth:</span> <span>${detailedInfo.dateOfBirth || ''}</span></div>
        <div class="info-row"><span>Age:</span> <span>${detailedInfo.age ? detailedInfo.age + ' years old' : ''}</span></div>
        <div class="info-row"><span>Gender:</span> <span>${detailedInfo.gender || ''}</span></div>
        <div class="info-row"><span>First Visit:</span> <span>${detailedInfo.firstVisit || (patientData.firstVisitDate ? (() => {
            const [year, month, day] = patientData.firstVisitDate.split('-');
            return `${month}/${day}/${year}`;
        })() : '')}</span></div>
        <div class="info-row"><span>Allergies:</span> <span>${detailedInfo.allergies || ''}</span></div>
        <div class="info-row"><span>Medications:</span> <span>${detailedInfo.medications || ''}</span></div>
        <div class="info-row"><span>Medical Conditions:</span> <span>${detailedInfo.conditions || ''}</span></div>
    `;
}

function openNewAppointmentModalWithPatient(patientData) {
    console.log('🔵 openNewAppointmentModalWithPatient called with patient:', patientData?.patientName);

    const dateInput = document.getElementById('appointmentDate');
    const patientNameInput = document.getElementById('appointmentPatientName');
    const phoneInput = document.getElementById('appointmentPhone');
    const today = new Date().toISOString().split('T')[0];

    if (dateInput) {
        dateInput.min = today;
        dateInput.value = today;
    }

    // Pre-fill patient information
    if (patientData && patientNameInput) {
        patientNameInput.value = patientData.patientName;
        patientNameInput.readOnly = true;
        patientNameInput.style.backgroundColor = '#f9fafb';
    }

    if (patientData && phoneInput) {
        phoneInput.value = patientData.phone || '';
    }

    // IMPORTANT: Apply location permissions before opening modal
    applyLocationPermissionsToNewAppointmentModal();

    openModal('newAppointmentModal');
}

// Shared function to apply location permissions
function applyLocationPermissionsToNewAppointmentModal() {
    const currentUser = dataManager.getCurrentUser();
    console.log('👤 Applying permissions for user:', currentUser.name, 'Role:', currentUser.role);

    const locationSelect = document.getElementById('appointmentLocation');

    if (!locationSelect) {
        console.error('Location select element not found');
        return;
    }

    // Get accessible clinics for current user
    const userClinics = dataManager.getUserClinics(currentUser);
    console.log('🏥 User clinics:', userClinics);

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
        console.log('🔒 Admin mode: Location locked to', currentUser.assignedLocation);
    } else {
        // Boss/Owner can select from all clinics
        locationSelect.disabled = false;
        locationSelect.style.backgroundColor = 'white';
        locationSelect.style.cursor = 'pointer';
        console.log('🔓 Boss mode: All locations accessible');
    }
}

// ==================== DENTAL CHART FUNCTIONS ====================

let currentDentalChart = null;

/**
 * Load and render dental chart for patient
 */
async function loadDentalChart(patientData) {
    try {
        const userId = patientData.userId || `patient_${patientData.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        console.log('📊 Loading dental chart for userId:', userId);

        // Check cache first
        let chartData = window.cacheManager.getDentalChartCache(userId);

        if (!chartData) {
            // Fetch from Firebase
            chartData = await window.firebaseDataService.getDentalChart(userId);

            if (!chartData) {
                // Initialize new chart if doesn't exist
                console.log('ℹ️ Dental chart not found, initializing new one...');
                await window.firebaseDataService.initializeDentalChart(userId, patientData.patientName);
                chartData = await window.firebaseDataService.getDentalChart(userId);
            }

            // Cache the chart
            if (chartData) {
                window.cacheManager.setDentalChartCache(userId, chartData);
            }
        }

        // Render dental chart
        const container = document.getElementById('dentalChartContainer');
        if (container && chartData) {
            currentDentalChart = new DentalChart('dentalChartContainer', {
                mode: 'edit',
                teethData: chartData.teeth || {},
                onToothSelect: (toothNum, toothData) => {
                    showToothDetails(userId, toothNum, toothData);
                }
            });
            console.log('✅ Dental chart rendered successfully');
        }
    } catch (error) {
        console.error('❌ Error loading dental chart:', error);
    }
}

/**
 * Show tooth details panel when tooth is selected
 */
function showToothDetails(userId, toothNum, toothData) {
    const panel = document.getElementById('toothDetailsPanel');
    const title = document.getElementById('selectedToothTitle');
    const treatmentsList = document.getElementById('treatmentsList');

    // Update title
    title.textContent = `Tooth ${toothNum}`;

    // Clear and populate treatments list
    treatmentsList.innerHTML = '';

    if (toothData.treatments && toothData.treatments.length > 0) {
        toothData.treatments.forEach((treatment, idx) => {
            const treatmentEl = document.createElement('div');
            treatmentEl.className = 'treatment-item';
            treatmentEl.innerHTML = `
                <div class="treatment-date">${new Date(treatment.date).toLocaleDateString()}</div>
                <div class="treatment-type">${treatment.type || 'Note'}</div>
                <div class="treatment-notes">${treatment.notes || ''}</div>
                <button class="btn-small btn-danger" onclick="deleteToothTreatment('${userId}', ${toothNum}, '${treatment.id}')">Delete</button>
            `;
            treatmentsList.appendChild(treatmentEl);
        });
    } else {
        treatmentsList.innerHTML = '<p class="treatment-placeholder">No treatment records yet</p>';
    }

    // Load periodontal data
    loadPeriodontalData(userId, toothNum, toothData);

    // Load detailed status data
    loadDetailedStatus(toothData);

    // Store current values for update
    window.currentToothData = {
        userId: userId,
        toothNum: toothNum
    };

    // Show panel
    panel.style.display = 'block';
}

/**
 * Close tooth details panel
 */
function closeToothDetails() {
    const panel = document.getElementById('toothDetailsPanel');
    const title = document.getElementById('selectedToothTitle');
    const treatmentsList = document.getElementById('treatmentsList');
    panel.style.display = 'none';
    window.currentToothData = null;

    if (title) {
        title.textContent = 'Select a tooth';
    }
    if (treatmentsList) {
        treatmentsList.innerHTML = '<p class="treatment-placeholder">Select a tooth to view history</p>';
    }
}


/**
 * Add treatment record to tooth
 */
async function addTreatmentRecord() {
    if (!window.currentToothData) return;

    const { userId, toothNum } = window.currentToothData;
    const notes = document.getElementById('treatmentNotes').value.trim();

    if (!notes) {
        showNotification('⚠️ Please enter treatment notes');
        return;
    }

    try {
        const treatment = {
            type: 'note',
            notes: notes
        };

        await window.firebaseDataService.addToothTreatment(userId, toothNum, treatment);

        // Update cache
        window.cacheManager.onDentalChartUpdated(userId);

        // Refresh chart
        await loadDentalChart({ userId });

        // Clear form
        document.getElementById('treatmentNotes').value = '';

        showNotification('✅ Treatment record added successfully');
    } catch (error) {
        console.error('❌ Error adding treatment record:', error);
        showNotification('❌ Failed to add treatment record');
    }
}

/**
 * Save treatment record
 */
async function saveToothUpdates() {
    if (!window.currentToothData) return;

    const notes = document.getElementById('treatmentNotes').value.trim();

    if (!notes) {
        showNotification('⚠️ Please enter treatment notes');
        return;
    }

    await addTreatmentRecord();
}

/**
 * Delete treatment record
 */
async function deleteToothTreatment(userId, toothNum, treatmentId) {
    if (!confirm('Are you sure you want to delete this treatment record?')) return;

    try {
        await window.firebaseDataService.deleteToothTreatment(userId, toothNum, treatmentId);

        // Update cache
        window.cacheManager.onDentalChartUpdated(userId);

        // Refresh details
        const chartData = await window.firebaseDataService.getDentalChart(userId);
        if (chartData) {
            const toothData = chartData.teeth[toothNum.toString()];
            showToothDetails(userId, toothNum, toothData);
        }

        showNotification('✅ Treatment record deleted');
    } catch (error) {
        console.error('❌ Error deleting treatment record:', error);
        showNotification('❌ Failed to delete treatment record');
    }
}

/**
 * ==================== PERIODONTAL DATA FUNCTIONS ====================
 */

/**
 * Get selected bleeding points from checkboxes
 */
function getSelectedBleedingPoints() {
    const checkboxes = document.querySelectorAll('.bleeding-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Set bleeding points checkboxes
 */
function setBleedingPoints(bleedingPoints = []) {
    const checkboxes = document.querySelectorAll('.bleeding-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = bleedingPoints.includes(cb.value);
    });
}

/**
 * Validate periodontal depth input (0-15mm) and apply visual warnings
 */
function validatePeriodontalInput(input) {
    const value = parseInt(input.value);

    // Remove previous warnings
    input.classList.remove('perio-warning', 'perio-danger');

    if (isNaN(value) || value < 0) {
        input.value = 0;
    } else if (value > 15) {
        input.value = 15;
    }

    const depth = parseInt(input.value);

    // Apply visual warnings based on depth
    if (depth >= 7) {
        input.classList.add('perio-danger'); // Red warning for severe
    } else if (depth >= 4) {
        input.classList.add('perio-warning'); // Yellow warning for moderate
    }
}

/**
 * Load periodontal data for selected tooth
 */
async function loadPeriodontalData(userId, toothNum, toothData) {
    const periodontalData = toothData.periodontal;

    if (periodontalData) {
        // Load buccal measurements
        document.getElementById('b-mesial').value = periodontalData.buccal.mesial;
        document.getElementById('b-mid').value = periodontalData.buccal.mid;
        document.getElementById('b-distal').value = periodontalData.buccal.distal;

        // Load lingual measurements
        document.getElementById('l-mesial').value = periodontalData.lingual.mesial;
        document.getElementById('l-mid').value = periodontalData.lingual.mid;
        document.getElementById('l-distal').value = periodontalData.lingual.distal;

        // Load bleeding points
        setBleedingPoints(periodontalData.bleedingPoints || []);

        // Update last measured date
        const lastMeasuredEl = document.getElementById('lastMeasured');
        if (periodontalData.measuredAt) {
            const measuredDate = new Date(periodontalData.measuredAt).toLocaleDateString();
            lastMeasuredEl.textContent = `Last measured: ${measuredDate}`;
        } else {
            lastMeasuredEl.textContent = 'No measurements yet';
        }

        // Apply visual warnings to all inputs
        document.querySelectorAll('.perio-input').forEach(input => {
            validatePeriodontalInput(input);
        });
    } else {
        // Reset to default values
        document.querySelectorAll('.perio-input').forEach(input => {
            input.value = 2;
            input.classList.remove('perio-warning', 'perio-danger');
        });
        setBleedingPoints([]);
        document.getElementById('lastMeasured').textContent = 'No measurements yet';
    }
}

/**
 * Save periodontal data for selected tooth
 */
async function savePeriodontalData() {
    if (!window.currentToothData) {
        showNotification('⚠️ Please select a tooth first');
        return;
    }

    const { userId, toothNum } = window.currentToothData;

    try {
        // Gather periodontal measurements
        const periodontalData = {
            buccal: {
                mesial: parseInt(document.getElementById('b-mesial').value),
                mid: parseInt(document.getElementById('b-mid').value),
                distal: parseInt(document.getElementById('b-distal').value)
            },
            lingual: {
                mesial: parseInt(document.getElementById('l-mesial').value),
                mid: parseInt(document.getElementById('l-mid').value),
                distal: parseInt(document.getElementById('l-distal').value)
            },
            bleedingPoints: getSelectedBleedingPoints()
        };

        // Validate all values are within range
        const allValues = [
            periodontalData.buccal.mesial,
            periodontalData.buccal.mid,
            periodontalData.buccal.distal,
            periodontalData.lingual.mesial,
            periodontalData.lingual.mid,
            periodontalData.lingual.distal
        ];

        const invalidValues = allValues.filter(v => isNaN(v) || v < 0 || v > 15);
        if (invalidValues.length > 0) {
            showNotification('⚠️ Please enter valid depths (0-15mm)');
            return;
        }

        // Save to Firebase
        await window.firebaseDataService.updatePeriodontalData(userId, toothNum, periodontalData);

        // Update cache
        window.cacheManager.onDentalChartUpdated(userId);

        // Update last measured display
        const lastMeasuredEl = document.getElementById('lastMeasured');
        lastMeasuredEl.textContent = `Last measured: ${new Date().toLocaleDateString()}`;

        showNotification('✅ Periodontal data updated successfully');

        console.log('📊 Periodontal data saved:', periodontalData);
    } catch (error) {
        console.error('❌ Error saving periodontal data:', error);
        showNotification('❌ Failed to save periodontal data: ' + error.message);
    }
}

// Attach input validation listeners when page loads
document.addEventListener('DOMContentLoaded', () => {
    const perioInputs = document.querySelectorAll('.perio-input');
    perioInputs.forEach(input => {
        input.addEventListener('input', (e) => validatePeriodontalInput(e.target));
        input.addEventListener('blur', (e) => validatePeriodontalInput(e.target));
    });
});

// Simple notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;

    // Set style based on type
    if (message.includes('✅') || message.includes('success')) {
        notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (message.includes('❌') || message.includes('error') || message.includes('Failed')) {
        notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (message.includes('⚠️')) {
        notification.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }

    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '10000',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '400px',
        animation: 'slideInRight 0.3s ease-out'
    });

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Load detailed status data for selected tooth
 */
function loadDetailedStatus(toothData) {
    const detailedStatus = toothData.detailedStatus || {};

    // Set condition
    const conditionSelect = document.getElementById('conditionSelect');
    if (conditionSelect) {
        conditionSelect.value = detailedStatus.condition || 'healthy';
    }

    // Set severity
    const severitySelect = document.getElementById('severitySelect');
    if (severitySelect) {
        severitySelect.value = detailedStatus.severity || 'none';
    }

    // Set affected surfaces
    const surfaceCheckboxes = document.querySelectorAll('.surface-checkbox');
    surfaceCheckboxes.forEach(checkbox => {
        checkbox.checked = detailedStatus.affectedSurfaces &&
                          detailedStatus.affectedSurfaces.includes(checkbox.value);
    });

    // Set clinical notes
    const clinicalNotes = document.getElementById('clinicalNotes');
    if (clinicalNotes) {
        clinicalNotes.value = detailedStatus.clinicalNotes || '';
    }
}

/**
 * Save detailed tooth status
 */
async function saveDetailedStatus() {
    if (!window.currentToothData) {
        showNotification('⚠️ Please select a tooth first');
        return;
    }

    const { userId, toothNum } = window.currentToothData;

    try {
        // Get selected values
        const condition = document.getElementById('conditionSelect').value;
        const severity = document.getElementById('severitySelect').value;
        const clinicalNotes = document.getElementById('clinicalNotes').value.trim();

        // Get selected surfaces
        const affectedSurfaces = [];
        document.querySelectorAll('.surface-checkbox:checked').forEach(checkbox => {
            affectedSurfaces.push(checkbox.value);
        });

        const statusData = {
            condition: condition,
            severity: severity,
            affectedSurfaces: affectedSurfaces,
            clinicalNotes: clinicalNotes
        };

        // Save to Firebase
        await window.firebaseDataService.updateDetailedToothStatus(userId, toothNum, statusData);

        // Update cache
        window.cacheManager.onDentalChartUpdated(userId);

        showNotification('✅ Tooth classification saved successfully');
    } catch (error) {
        console.error('❌ Error saving detailed status:', error);
        showNotification('❌ Failed to save classification: ' + error.message);
    }
}

// ==================== DENTAL CHART HISTORY & SNAPSHOTS ====================

/**
 * Load snapshots for current patient
 */
async function loadChartSnapshots(userId) {
    try {
        const snapshots = await window.firebaseDataService.getDentalChartSnapshots(userId);
        const snapshotsList = document.getElementById('snapshotsList');

        if (!snapshotsList) return;

        if (!snapshots || snapshots.length === 0) {
            snapshotsList.innerHTML = '<p class="placeholder-text">No snapshots created yet. Click "Create Snapshot" to save the current chart state.</p>';
            return;
        }

        snapshotsList.innerHTML = snapshots.map(snapshot => {
            const date = new Date(snapshot.createdAt);
            const formattedDate = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="snapshot-card" data-snapshot-id="${snapshot.id}">
                    <div class="snapshot-header">
                        <div class="snapshot-info">
                            <h4>${snapshot.description || 'Chart Snapshot'}</h4>
                            <div class="snapshot-date">${formattedDate}</div>
                        </div>
                        <div class="snapshot-actions">
                            <button class="btn-small btn-compare" onclick="compareWithSnapshot('${snapshot.id}')">
                                <i class="fas fa-exchange-alt"></i> Compare
                            </button>
                            <button class="btn-small btn-delete" onclick="deleteSnapshot('${snapshot.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    ${snapshot.description ? `<div class="snapshot-description">${snapshot.description}</div>` : ''}
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('❌ Error loading snapshots:', error);
        showNotification('❌ Failed to load snapshots');
    }
}

/**
 * Create a new snapshot
 */
async function createNewSnapshot() {
    if (!window._currentAccountPatient) {
        showNotification('⚠️ No patient selected');
        return;
    }

    const userId = window._currentAccountPatient.userId ||
                   `patient_${window._currentAccountPatient.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Prompt for description
    const description = prompt('Enter a description for this snapshot (optional):');
    if (description === null) return; // User cancelled

    try {
        showNotification('📸 Creating snapshot...');

        await window.firebaseDataService.createDentalChartSnapshot(userId, description || 'Chart snapshot');

        showNotification('✅ Snapshot created successfully');

        // Reload snapshots list
        await loadChartSnapshots(userId);

    } catch (error) {
        console.error('❌ Error creating snapshot:', error);
        showNotification('❌ Failed to create snapshot: ' + error.message);
    }
}

/**
 * Delete a snapshot
 */
async function deleteSnapshot(snapshotId) {
    if (!confirm('Are you sure you want to delete this snapshot? This cannot be undone.')) {
        return;
    }

    try {
        await window.firebaseDataService.deleteSnapshot(snapshotId);
        showNotification('✅ Snapshot deleted successfully');

        // Reload snapshots list
        if (window._currentAccountPatient) {
            const userId = window._currentAccountPatient.userId ||
                           `patient_${window._currentAccountPatient.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            await loadChartSnapshots(userId);
        }

    } catch (error) {
        console.error('❌ Error deleting snapshot:', error);
        showNotification('❌ Failed to delete snapshot');
    }
}

/**
 * Compare current chart with a snapshot
 */
async function compareWithSnapshot(snapshotId) {
    if (!window._currentAccountPatient) {
        showNotification('⚠️ No patient selected');
        return;
    }

    const userId = window._currentAccountPatient.userId ||
                   `patient_${window._currentAccountPatient.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    try {
        showNotification('📊 Comparing charts...');

        const comparison = await window.firebaseDataService.compareWithSnapshot(userId, snapshotId);

        // Display comparison in modal
        displayComparison(comparison);

        showNotification('✅ Comparison complete');

    } catch (error) {
        console.error('❌ Error comparing charts:', error);
        showNotification('❌ Failed to compare: ' + error.message);
    }
}

/**
 * Display comparison results in modal
 */
function displayComparison(comparison) {
    const modal = document.getElementById('comparisonModal');
    const body = document.getElementById('comparisonBody');

    if (!modal || !body) return;

    const snapshotDate = new Date(comparison.snapshotDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const currentDate = new Date(comparison.currentDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    if (comparison.totalChanges === 0) {
        body.innerHTML = `
            <div class="no-changes">
                <i class="fas fa-check-circle"></i>
                <div>No changes detected since snapshot</div>
                <div style="font-size: 14px; color: #64748b; margin-top: 8px;">
                    Snapshot: ${snapshotDate}
                </div>
            </div>
        `;
    } else {
        const changesHTML = comparison.changes.map(toothChange => `
            <div class="change-card">
                <div class="change-card-header">
                    <span class="tooth-number-badge">Tooth #${toothChange.toothNum}</span>
                    <span class="change-count">${toothChange.changes.length} change${toothChange.changes.length > 1 ? 's' : ''}</span>
                </div>
                <div class="change-items">
                    ${toothChange.changes.map(change => `
                        <div class="change-item">
                            <span class="change-field">${change.field}</span>
                            <span class="change-old">${change.old}</span>
                            <span class="change-arrow">→</span>
                            <span class="change-new">${change.new}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        body.innerHTML = `
            <div class="comparison-summary">
                <h4>Comparison Summary</h4>
                <div class="summary-row">
                    <span class="summary-label">Snapshot Date:</span>
                    <span class="summary-value">${snapshotDate}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Current Date:</span>
                    <span class="summary-value">${currentDate}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Changes:</span>
                    <span class="summary-value">${comparison.totalChanges} tooth/teeth</span>
                </div>
            </div>
            <div class="changes-list">
                ${changesHTML}
            </div>
        `;
    }

    modal.style.display = 'flex';
}

/**
 * Close comparison modal
 */
function closeComparisonModal() {
    const modal = document.getElementById('comparisonModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Export functions to global scope for HTML onclick handlers
window.showNotification = showNotification;
window.savePeriodontalData = savePeriodontalData;
window.deleteToothTreatment = deleteToothTreatment;
window.closeToothDetails = closeToothDetails;
window.saveDetailedStatus = saveDetailedStatus;
window.createNewSnapshot = createNewSnapshot;
window.deleteSnapshot = deleteSnapshot;
window.compareWithSnapshot = compareWithSnapshot;
window.closeComparisonModal = closeComparisonModal;
window.loadChartSnapshots = loadChartSnapshots;
