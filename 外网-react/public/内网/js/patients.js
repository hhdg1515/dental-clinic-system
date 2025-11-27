// Patients Page Functionality - Updated to use Global Data Manager with Pagination

/**
 * SECURITY NOTE:
 * This file uses currentUser.role for UI filtering (e.g., hiding action buttons).
 * This is NOT a security vulnerability because:
 * - ✅ Firestore Security Rules provide real server-side authorization
 * - ✅ Unauthorized users cannot read/write data even if they bypass UI
 * - ⚠️  localStorage role checks are for UX only, not security
 *
 * See dashboard.js for enhanced token-based permission checking.
 */

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

// Global variables to store current processing data
let currentProcessingRow = null;
let currentPatientData = null;

// Pagination State Variables
let pendingCurrentPage = 1;
let confirmedCurrentPage = 1;
const patientsItemsPerPage = 8; // 8 items per page for both tabs
let pendingFilteredData = [];
let confirmedFilteredData = [];
let pendingAllData = [];
let confirmedAllData = [];

// Real-time listener variables
let appointmentRealtimeListener = null;

// Initialize page functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeModals();
    initializeProcessModal();
    initializePagination();
    initializeTopNewAppointmentButton();
    // Search functionality is now handled by shared.js globally
    initializeHistoryIconNavigation();
    // Initialize form validation
    setupFormValidation();
    
    // Activate notification bell for patients page
    activateNotificationBell();
    
    // Handle URL hash for notification bell navigation
    handleUrlHashNavigation();
    
    // Load and render data from global data manager after Firebase is ready
    waitForFirebaseService().then(async () => {
        console.log('Firebase service ready, loading patients data...');

        try {
            // Load initial data
            await refreshPatientsData();

            // Set up real-time listeners
            await initializeRealtimeListeners();

        } catch (error) {
            console.error('Error initializing patients data:', error);
        }
    }).catch(error => {
        console.error('Firebase service failed to initialize:', error);
        // Fallback to localStorage data if available
        refreshPatientsData();
    });
});

// Cleanup listeners on page unload
window.addEventListener('beforeunload', cleanupRealtimeListeners);

// Also cleanup when page becomes hidden (user switches tabs/pages)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        cleanupRealtimeListeners();
    }
});

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
// Patients page now uses manual refresh (F5) to see updates
// This saves ~500-1000 Firebase reads per day
async function initializeRealtimeListeners() {
    // Disabled - no longer using onSnapshot real-time listeners
    console.log('ℹ️ Real-time listeners disabled. Use F5 to refresh patient data.');
}

// Cleanup real-time listeners
function cleanupRealtimeListeners() {
    if (appointmentRealtimeListener && typeof appointmentRealtimeListener === 'function') {
        appointmentRealtimeListener();
        appointmentRealtimeListener = null;
        console.log('🧹 Patients page real-time listeners cleaned up');
    }
}

// Activate notification bell for patients page
function activateNotificationBell() {
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
        notificationBell.classList.add('active');
        
        // Update click handler for patients page
        notificationBell.onclick = function(e) {
            e.preventDefault();
            // If not on pending tab, switch to it
            const pendingTabButton = document.querySelector('[data-tab="pending"]');
            if (pendingTabButton && !pendingTabButton.classList.contains('active')) {
                pendingTabButton.click();
            }
        };
    }
}

// Handle URL hash navigation (for notification bell)
function handleUrlHashNavigation() {
    const hash = window.location.hash;
    if (hash === '#pending') {
        // Activate pending appointments tab
        const pendingTabButton = document.querySelector('[data-tab="pending"]');
        const confirmedTabButton = document.querySelector('[data-tab="confirmed"]');
        const pendingTabContent = document.getElementById('pending-tab');
        const confirmedTabContent = document.getElementById('confirmed-tab');
        
        if (pendingTabButton && pendingTabContent) {
            // Remove active from confirmed
            if (confirmedTabButton) confirmedTabButton.classList.remove('active');
            if (confirmedTabContent) confirmedTabContent.classList.remove('active');
            
            // Add active to pending
            pendingTabButton.classList.add('active');
            pendingTabContent.classList.add('active');
        }
        
        // Clear the hash to clean up the URL
        window.history.replaceState(null, null, window.location.pathname);
    }
}

// Initialize Pagination for both tabs
function initializePagination() {
    initializePendingPagination();
    initializeConfirmedPagination();
}

// Initialize Pending Appointments Pagination
function initializePendingPagination() {
    const prevBtn = document.getElementById('pendingPrevBtn');
    const nextBtn = document.getElementById('pendingNextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            
            if (pendingCurrentPage > 1) {
                pendingCurrentPage--;
                renderPendingAppointments(false); // Don't reload data, just re-render with new page
                updatePendingPaginationControls();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(pendingFilteredData.length / patientsItemsPerPage);
            
            if (pendingCurrentPage < totalPages) {
                pendingCurrentPage++;
                renderPendingAppointments(false); // Don't reload data, just re-render with new page
                updatePendingPaginationControls();
            }
        });
    }
}

// Initialize Confirmed Appointments Pagination
function initializeConfirmedPagination() {
    const prevBtn = document.getElementById('confirmedPrevBtn');
    const nextBtn = document.getElementById('confirmedNextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            
            if (confirmedCurrentPage > 1) {
                confirmedCurrentPage--;
                renderConfirmedAppointments(false); // Don't reload data, just re-render with new page
                updateConfirmedPaginationControls();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(confirmedFilteredData.length / patientsItemsPerPage);
            
            if (confirmedCurrentPage < totalPages) {
                confirmedCurrentPage++;
                renderConfirmedAppointments(false); // Don't reload data, just re-render with new page
                updateConfirmedPaginationControls();
            }
        });
    }
}

// Update Pending Pagination Controls
function updatePendingPaginationControls() {
    const prevBtn = document.getElementById('pendingPrevBtn');
    const nextBtn = document.getElementById('pendingNextBtn');
    
    const totalPages = Math.ceil(pendingFilteredData.length / patientsItemsPerPage);
    
    if (prevBtn) {
        prevBtn.disabled = pendingCurrentPage === 1;
    }
    
    if (nextBtn) {
        const shouldDisable = pendingCurrentPage >= totalPages || totalPages === 0;
        nextBtn.disabled = shouldDisable;
    }
    
}

// Update Confirmed Pagination Controls
function updateConfirmedPaginationControls() {
    const prevBtn = document.getElementById('confirmedPrevBtn');
    const nextBtn = document.getElementById('confirmedNextBtn');
    
    const totalPages = Math.ceil(confirmedFilteredData.length / patientsItemsPerPage);
    
    if (prevBtn) {
        prevBtn.disabled = confirmedCurrentPage === 1;
    }
    
    if (nextBtn) {
        const shouldDisable = confirmedCurrentPage >= totalPages || totalPages === 0;
        nextBtn.disabled = shouldDisable;
    }
    
}

// Apply filter for Pending Appointments
function applyPendingFilter(resetPage = true) {
    const searchInput = document.getElementById('globalSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // Ensure pendingAllData is an array
    if (!Array.isArray(pendingAllData)) {
        console.warn('pendingAllData is not an array:', pendingAllData);
        pendingAllData = [];
    }

    if (searchTerm === '') {
        pendingFilteredData = [...pendingAllData];
    } else {
        pendingFilteredData = pendingAllData.filter(confirmation => {
            if (!confirmation || !confirmation.patientName) return false;

            const patientName = confirmation.patientName.toLowerCase();
            const phone = (confirmation.phone || '').replace(/\D/g, '').toLowerCase();

            return patientName.includes(searchTerm) || phone.includes(searchTerm);
        });
    }
    
    if (resetPage) {
        pendingCurrentPage = 1;
    } else {
    }
}

// Apply filter for Confirmed Appointments
function applyConfirmedFilter(resetPage = true) {
    const searchInput = document.getElementById('globalSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // Ensure confirmedAllData is an array
    if (!Array.isArray(confirmedAllData)) {
        console.warn('confirmedAllData is not an array:', confirmedAllData);
        confirmedAllData = [];
    }

    if (searchTerm === '') {
        confirmedFilteredData = [...confirmedAllData];
    } else {
        confirmedFilteredData = confirmedAllData.filter(appointment => {
            if (!appointment || !appointment.patientName) return false;

            const patientName = appointment.patientName.toLowerCase();
            const phone = (appointment.phone || '').replace(/\D/g, '').toLowerCase();

            return patientName.includes(searchTerm) || phone.includes(searchTerm);
        });
    }
    
    if (resetPage) {
        confirmedCurrentPage = 1;
    } else {
    }
}

// Main function to refresh all patients data
async function refreshPatientsData() {
    await renderPendingAppointments(true); // Force reload data
    await renderConfirmedAppointments(true); // Force reload data
    // Note: Don't update notification badge on patients page - bell is always active
}

// Render pending appointments (from pending confirmations) with pagination
async function renderPendingAppointments(forceReload = false) {
    const tableBody = document.getElementById('pendingTableBody');
    if (!tableBody) return;

    // Only reload data if pendingAllData is empty or forced reload
    if (!Array.isArray(pendingAllData) || pendingAllData.length === 0 || forceReload) {
        try {
            // Get pending confirmations from global data manager
            const pendingConfirmations = await dataManager.getPendingConfirmations();

            // Ensure we have an array
            if (Array.isArray(pendingConfirmations)) {
                pendingAllData = pendingConfirmations;
            } else {
                console.warn('getPendingConfirmations did not return an array:', pendingConfirmations);
                pendingAllData = [];
            }

            applyPendingFilter(true); // Reset page on data reload
        } catch (error) {
            console.error('Error loading pending confirmations:', error);
            pendingAllData = [];
            applyPendingFilter(true);
        }
    } else {
        // Just re-apply current filter without resetting page
        applyPendingFilter(false);
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (pendingCurrentPage - 1) * patientsItemsPerPage;
    const endIndex = startIndex + patientsItemsPerPage;
    const paginatedData = pendingFilteredData.slice(startIndex, endIndex);
    
    
    // Create table rows for pending confirmations
    paginatedData.forEach(confirmation => {
        const row = createPatientTableRow(confirmation, 'pending');
        tableBody.appendChild(row);
    });
    
    // Update pagination controls (no notification badge update needed - bell is always active)
    updatePendingPaginationControls();
}

// Render confirmed appointments with pagination
async function renderConfirmedAppointments(forceReload = false) {
    const tableBody = document.getElementById('confirmedTableBody');
    if (!tableBody) return;

    // Only reload data if confirmedAllData is empty or forced reload
    if (!Array.isArray(confirmedAllData) || confirmedAllData.length === 0 || forceReload) {
        try {
            // Get all appointments from global data manager
            const allAppointments = await dataManager.getAllAppointments();

            // Ensure we have an array
            if (!Array.isArray(allAppointments)) {
                console.warn('getAllAppointments did not return an array:', allAppointments);
                confirmedAllData = [];
                applyConfirmedFilter(true);
                return;
            }

            // Filter for confirmed appointments (exclude pending, cancelled, and declined)
            const confirmedAppointments = allAppointments.filter(app =>
                app.status !== 'cancelled' &&
                app.status !== 'pending' &&
                app.status !== 'declined'
            );

            // Group appointments by userId to get unique patients
            // For each patient, keep only their EARLIEST (first) appointment
            const patientMap = {};
            confirmedAppointments.forEach(apt => {
                const userId = apt.userId || apt.patientName; // Fallback to name if no userId

                if (!patientMap[userId]) {
                    // First appointment for this patient
                    patientMap[userId] = apt;
                } else {
                    // Compare dates to keep the earliest appointment
                    const existingDate = patientMap[userId].dateKey || '';
                    const currentDate = apt.dateKey || '';

                    if (currentDate < existingDate) {
                        // This appointment is earlier, replace it
                        patientMap[userId] = apt;
                    }
                }
            });

            // Convert back to array and sort by date (newest first)
            const uniquePatients = Object.values(patientMap);
            uniquePatients.sort((a, b) => {
                // Compare dateKey strings first (YYYY-MM-DD format sorts correctly)
                const dateComparison = b.dateKey.localeCompare(a.dateKey);
                if (dateComparison !== 0) {
                    return dateComparison;
                }
                // If same date, compare time strings (HH:MM format sorts correctly)
                return b.time.localeCompare(a.time);
            });

            confirmedAllData = uniquePatients;
            applyConfirmedFilter(true); // Reset page on data reload
        } catch (error) {
            console.error('Error loading confirmed appointments:', error);
            confirmedAllData = [];
            applyConfirmedFilter(true);
        }
    } else {
        // Just re-apply current filter without resetting page
        applyConfirmedFilter(false);
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (confirmedCurrentPage - 1) * patientsItemsPerPage;
    const endIndex = startIndex + patientsItemsPerPage;
    const paginatedData = confirmedFilteredData.slice(startIndex, endIndex);
    
    
    // Create table rows for confirmed appointments
    paginatedData.forEach(appointment => {
        const row = createPatientTableRow(appointment, 'confirmed');
        tableBody.appendChild(row);
    });
    
    // Update pagination controls
    updateConfirmedPaginationControls();
}

// Create patient table row
function createPatientTableRow(data, type) {
    const row = document.createElement('tr');
    row.dataset.patientId = data.id;
    row.dataset.patientType = type;
    
    // Format date and time for display
    let displayDateTime;
    if (type === 'pending') {
        displayDateTime = data.dateTime;
    } else {
        // DEBUG: Compare correct date handling (Recent Appointments)
        console.log('✅ Recent Appointments - CORRECT date handling:', {
            dateKey: data.dateKey,
            type: type
        });

        // Avoid timezone issues, format dateKey string directly
        const [year, month, day] = data.dateKey.split('-');
        const formattedDate = `${month}/${day}/${year}`;
        console.log('✅ Recent Appointments - String parsing result:', {
            year, month, day,
            formattedDate: formattedDate
        });

        const formattedTime = formatTime(data.time);
        displayDateTime = `${formattedDate} ${formattedTime}`;
    }
    
    // Create the basic row structure
    row.innerHTML = `
        <td class="patient-name">${escapeHtml(data.patientName)}</td>
        <td class="appointment-date">${escapeHtml(displayDateTime)}</td>
        <td>${escapeHtml(data.phone || '(XXX) XXX-XXXX')}</td>
        <td><span class="treatment-type">${escapeHtml(data.service || data.serviceType || data.serviceName || data.treatment || 'Not specified')}</span></td>
        <td class="location-cell">${escapeHtml(data.location)}</td>
        <td id="actions-${escapeHtml(data.id)}"></td>
    `;
    
    // Add the appropriate actions based on type
    const actionsCell = row.querySelector(`#actions-${data.id}`);
    if (type === 'pending') {
        // Create pending actions (icon buttons)
        const pendingActions = document.createElement('div');
        pendingActions.className = 'pending-actions';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn-icon btn-confirm';
        confirmBtn.setAttribute('data-tooltip', 'Confirm');
        confirmBtn.textContent = '✓';
        confirmBtn.onclick = async (e) => {
            e.stopPropagation();
            await handleConfirmAction(data);
        };

        const declineBtn = document.createElement('button');
        declineBtn.className = 'btn-icon btn-decline';
        declineBtn.setAttribute('data-tooltip', 'Decline');
        declineBtn.textContent = '✗';
        declineBtn.onclick = async (e) => {
            e.stopPropagation();
            await handleDeclineAction(data);
        };
        
        pendingActions.appendChild(confirmBtn);
        pendingActions.appendChild(declineBtn);
        actionsCell.appendChild(pendingActions);
    } else {
        // Create confirmed actions (three dots menu)
        const actionIcon = document.createElement('i');
        actionIcon.className = 'fas fa-ellipsis-v action-icon';
        actionIcon.onclick = async (e) => {
            e.stopPropagation();
            await showProcessModal(actionIcon);
        };
        actionsCell.appendChild(actionIcon);
    }
    
    // Add click event for row (to show patient details)
    row.addEventListener('click', async function(e) {
        if (e.target.classList.contains('action-icon') || e.target.classList.contains('btn-icon')) {
            return;
        }
        await showPatientDetailsModal(data, type);
    });
    
    return row;
}

// Handle confirm action for pending appointments
async function handleConfirmAction(pendingData) {
    // Add confirmation prompt
    if (confirm(`Are you sure you want to confirm the appointment for ${pendingData.patientName}?`)) {
        try {
            console.log('Confirming appointment with ID:', pendingData.id);

            // Update the appointment status from 'pending' to 'confirmed'
            // No need to create a new appointment - just update the existing one
            const result = await dataManager.updateAppointmentStatus(pendingData.id, 'confirmed', {
                confirmedAt: new Date().toISOString(),
                confirmedBy: dataManager.getCurrentUser()?.name || 'Admin'
            });

            console.log('Update appointment status result:', result);

            if (result) {
                showSuccessMessage('Appointment confirmed successfully!');

                // Refresh data to reflect the status change
                refreshPatientsData();
            } else {
                throw new Error('Update returned false');
            }

        } catch (error) {
            console.error('Error confirming appointment:', error);
            showErrorMessage(`Failed to confirm appointment: ${error.message}`);
        }
    }
}

// Handle decline action for pending appointments
async function handleDeclineAction(pendingData) {
    if (confirm(`Are you sure you want to decline the appointment request for ${pendingData.patientName}?`)) {
        try {
            // Update the appointment status from 'pending' to 'declined'
            // Keep the record for tracking purposes instead of deleting
            await dataManager.updateAppointmentStatus(pendingData.id, 'declined', {
                declinedAt: new Date().toISOString(),
                declinedBy: dataManager.getCurrentUser()?.name || 'Admin'
            });

            showSuccessMessage('Appointment request declined.');

            // Refresh data to reflect the status change
            refreshPatientsData();

        } catch (error) {
            console.error('Error declining appointment:', error);
            showErrorMessage('Failed to decline appointment. Please try again.');
        }
    }
}

// Show patient details modal
async function showPatientDetailsModal(patientData, patientType = 'unknown') {
    // DEBUG: Log the patient data structure
    console.log('🔍 showPatientDetailsModal - patientData:', patientData);
    console.log('🔍 showPatientDetailsModal - patientType:', patientType);
    console.log('🔍 patientData.userId:', patientData.userId);
    console.log('🔍 patientData keys:', Object.keys(patientData));

    // Update modal title and basic info
    document.getElementById('patientDetailsTitle').textContent = patientData.patientName;
    document.getElementById('patientName').textContent = patientData.patientName;
    document.getElementById('patientPhone').textContent = patientData.phone || '(XXX) XXX-XXXX';
    document.getElementById('patientEmail').textContent = patientData.email || `${patientData.patientName.toLowerCase().replace(/\s+/g, '.')}@email.com`;
    document.getElementById('patientLocation').textContent = patientData.location;

    // Set service field - use service mapping for display
    const serviceElement = document.getElementById('patientService');
    if (serviceElement) {
        const serviceValue = patientData.service || patientData.serviceType || patientData.serviceName || patientData.treatment || '';
        if (serviceValue && window.ServiceMapping) {
            serviceElement.textContent = window.ServiceMapping.getServiceDisplayName(serviceValue);
        } else {
            serviceElement.textContent = serviceValue || 'Not specified';
        }
    }

    // Update self-description
    const selfDescText = document.getElementById('selfDescriptionText');
    selfDescText.textContent = patientData.notes || 'No additional notes provided.';

    // Load appointment history for this patient - prefer userId over patientName
    if (patientData.userId) {
        await loadAppointmentHistory(patientData.userId, true); // Use userId matching
    } else {
        await loadAppointmentHistory(patientData.patientName, false); // Fallback to patientName matching
    }

    // Store current patient data for editing, including ID and type
    window.currentPatientForEdit = {
        ...patientData,
        _editingId: patientData.id,
        _editingType: patientType // Get type from parameter
    };

    // Update button display based on patient type
    updateModalActionButtons(patientType);

    openModal('patientDetailsModal');
}

// Update modal action buttons based on patient type
function updateModalActionButtons(patientType) {
    const reviewedBtn = document.getElementById('reviewedBtn');

    if (!reviewedBtn) return;

    // Update button based on patient type
    if (patientType === 'pending') {
        reviewedBtn.textContent = 'Reviewed';
        reviewedBtn.title = 'Mark as reviewed and close';
        reviewedBtn.className = 'btn-secondary';
    } else if (patientType === 'confirmed') {
        reviewedBtn.textContent = 'Schedule Follow-up';
        reviewedBtn.title = 'Schedule a follow-up appointment';
        reviewedBtn.className = 'btn-primary';
    } else {
        // Default case (unknown status)
        reviewedBtn.textContent = 'Close';
        reviewedBtn.title = 'Close patient details';
        reviewedBtn.className = 'btn-secondary';
    }
}

// Load appointment history for a patient using userId or patientName
async function loadAppointmentHistory(identifier, useUserId = false) {
    const historyContainer = document.getElementById('appointmentHistory');
    if (!historyContainer) return;

    // Clear existing history
    historyContainer.innerHTML = '';

    // Get all appointments for this patient
    const allAppointments = await dataManager.getAllAppointments();
    const cancelledAppointments = await dataManager.getCancelledAppointments();

    // Filter appointments based on userId or patientName
    const patientAppointments = [...allAppointments, ...cancelledAppointments]
        .filter(app => {
            if (useUserId && app.userId) {
                // Primary: match by userId if available
                return app.userId === identifier;
            } else {
                // Fallback: match by patientName for backward compatibility
                return app.patientName === identifier;
            }
        })
        .sort((a, b) => {
            const dateA = new Date(a.dateKey + 'T' + a.time);
            const dateB = new Date(b.dateKey + 'T' + b.time);
            return dateB - dateA; // Most recent first
        });

    if (patientAppointments.length === 0) {
        historyContainer.innerHTML = '<p>No appointment history found.</p>';
        return;
    }

    // Create appointment cards
    patientAppointments.forEach(appointment => {
        const appointmentCard = createAppointmentHistoryCard(appointment);
        historyContainer.appendChild(appointmentCard);
    });
}

// Create appointment history card
function createAppointmentHistoryCard(appointment) {
    const card = document.createElement('div');
    card.className = 'appointment-card';

    // DEBUG: Log date processing to identify timezone issues
    console.log('🗓️ createAppointmentHistoryCard - RAW data:', {
        dateKey: appointment.dateKey,
        appointmentDateTime: appointment.appointmentDateTime,
        rawAppointment: appointment
    });

    // FIXED: Use string parsing instead of Date object to avoid timezone issues
    const [year, month, day] = appointment.dateKey.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedDate = `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;

    console.log('🗓️ FIXED string parsing result:', {
        dateKey: appointment.dateKey,
        year, month, day,
        formattedDate: formattedDate,
        comparison: 'This should now match Recent Appointments display'
    });
    const formattedTime = formatTime(appointment.time);
    
    const statusClass = `status-${appointment.status}`;
    const statusText = capitalizeFirst(appointment.status.replace('-', ' '));
    
    card.innerHTML = `
        <div class="appointment-card-header">
            <div class="appointment-date-time">${escapeHtml(formattedDate)}</div>
            <div class="appointment-status ${statusClass}">${escapeHtml(statusText)}</div>
        </div>
        <div class="appointment-details">
            <div class="detail-item">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${escapeHtml(appointment.service || appointment.serviceType || appointment.serviceName || appointment.treatment || 'Not specified')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${escapeHtml(appointment.location)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${escapeHtml(formattedTime)}</span>
            </div>
        </div>
    `;
    
    return card;
}

// Show process modal
async function showProcessModal(element) {
    refreshPatientsData();
    const row = element.closest('tr');
    const patientId = row.dataset.patientId;
    const patientType = row.dataset.patientType;
    let patientData;

    if (patientType === 'pending') {
        // Get from pending confirmations
        const pendingConfirmations = await dataManager.getPendingConfirmations();
        patientData = pendingConfirmations.find(conf => conf.id === patientId);
    } else {
        // Get from appointments - ensure latest data is retrieved
        const allAppointments = await dataManager.getAllAppointments();
        patientData = allAppointments.find(app => app.id === patientId);

        // If not found, might be in cancelled appointments
        if (!patientData) {
            const cancelledAppointments = await dataManager.getCancelledAppointments();
            patientData = cancelledAppointments.find(app => app.id === patientId);
        }
    }
    
    if (!patientData) {
        showErrorMessage('Patient data not found');
        return;
    }
    
    // Store current processing data
    setCurrentProcessData(row, patientData);
    // Populate modal
    const summary = document.getElementById('appointmentSummary');
    const phone = patientData.phone || 'Phone not available';
    summary.innerHTML = `
        <h4>${escapeHtml(patientData.patientName)}</h4>
        <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${escapeHtml(phone)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="detail-value">${escapeHtml(patientData.service || patientData.serviceType || patientData.serviceName || patientData.treatment || 'Not specified')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">${escapeHtml(capitalizeFirst(patientData.status.replace('-', ' ')))}</span>
        </div>
    `;

    // Set button selection state - add this line
    updateButtonSelection(patientData.status);
    openModal('processModal');
}

// Format appointment date and time for display
function formatAppointmentDateTime(appointment) {
    const date = new Date(appointment.dateKey);
    const formattedDate = date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
    });
    const formattedTime = formatTime(appointment.time);
    return `${formattedDate} ${formattedTime}`;
}

// Function to set current processing data
function setCurrentProcessData(row, patientData) {
    currentProcessingRow = row;
    currentPatientData = patientData;
}

// Tab navigation
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab + '-tab') {
                    content.classList.add('active');
                }
            });
            
            // Re-apply search if there's a search term
            const searchInput = document.getElementById('patientSearchInput');
            if (searchInput && searchInput.value) {
                searchInput.dispatchEvent(new Event('input'));
            }
        });
    });
}

// ==================== SEARCH FUNCTIONALITY ====================
// Search functionality is now handled globally by shared.js
// The global search provides:
// - Real-time search dropdown with patient results
// - Direct opening of patient account modal
// - No page navigation required

function triggerPatientsSearch(searchTerm) {
    // Set search input value (if there's still a local search box)
    const localSearchInput = document.getElementById('patientSearchInput');
    if (localSearchInput) {
        localSearchInput.value = searchTerm;
    }
    
    // Trigger search
    applyPendingFilter(true);
    applyConfirmedFilter(true);
    renderPendingAppointments(false);
    renderConfirmedAppointments(false);
}

// Initialize top New Appointment button
function initializeTopNewAppointmentButton() {
    const topNewAppointmentBtn = document.getElementById('topNewAppointmentBtn');
    if (topNewAppointmentBtn) {
        topNewAppointmentBtn.addEventListener('click', function() {
            showGenericNewAppointmentModal();
        });
    }
}

// Apply location permissions to new appointment modal
function applyLocationPermissionsToPatientsModal() {
    const currentUser = dataManager.getCurrentUser();
    console.log('👤 [Patients] Applying permissions for user:', currentUser.name, 'Role:', currentUser.role);

    const locationSelect = document.getElementById('newAppointmentLocation');

    if (!locationSelect) {
        console.error('[Patients] Location select element not found');
        return;
    }

    // Get accessible clinics for current user
    const userClinics = dataManager.getUserClinics(currentUser);
    console.log('🏥 [Patients] User clinics:', userClinics);

    // Clear existing options
    locationSelect.innerHTML = '<option value="">Select Location</option>';

    // Map of clinic IDs to display names (matching patients.html format)
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
        option.value = clinicNames[clinicId]; // Use display name as value
        option.textContent = clinicNames[clinicId];
        locationSelect.appendChild(option);
    });

    if (currentUser.role === 'admin') {
        // Set to admin's clinic and disable
        const displayName = clinicNames[currentUser.assignedLocation];
        locationSelect.value = displayName;
        locationSelect.disabled = true;
        locationSelect.style.backgroundColor = '#f3f4f6';
        locationSelect.style.cursor = 'not-allowed';
        console.log('🔒 [Patients] Admin mode: Location locked to', displayName);
    } else {
        // Boss/Owner can select from all clinics
        locationSelect.disabled = false;
        locationSelect.style.backgroundColor = 'white';
        locationSelect.style.cursor = 'pointer';
        console.log('🔓 [Patients] Boss mode: All locations accessible');
    }
}

// Show generic new appointment modal (for top button)
function showGenericNewAppointmentModal() {
    console.log('🔵 [Patients] showGenericNewAppointmentModal called');

    // Clear the form first
    document.getElementById('newAppointmentForm').reset();

    // Make all fields editable for generic appointment
    const nameField = document.getElementById('newPatientName');
    const phoneField = document.getElementById('newPatientPhone');
    const emailField = document.getElementById('newPatientEmail');

    nameField.readOnly = false;
    phoneField.readOnly = false;
    emailField.readOnly = false;
    nameField.style.backgroundColor = 'white';
    phoneField.style.backgroundColor = 'white';
    emailField.style.backgroundColor = 'white';

    nameField.placeholder = 'Enter patient name';
    phoneField.placeholder = '(XXX) XXX-XXXX';
    emailField.placeholder = 'Enter email address';

    // Set minimum date to today
    setMinDateToToday('newAppointmentDate');
    const dateInput = document.getElementById('newAppointmentDate');
    dateInput.value = getCurrentDate();

    // Apply location permissions
    applyLocationPermissionsToPatientsModal();

    openModal('newAppointmentModal');
}

// Initialize modals
function initializeModals() {
    // Patient Details Modal
    const patientDetailsModal = document.getElementById('patientDetailsModal');
    const patientDetailsClose = document.getElementById('patientDetailsClose');

    patientDetailsClose.addEventListener('click', function() {
        closeModal('patientDetailsModal');
    });

    patientDetailsModal.addEventListener('click', function(e) {
        if (e.target === patientDetailsModal) {
            closeModal('patientDetailsModal');
        }
    });

    // Edit Basic Info button
    document.getElementById('editBasicInfoBtn').addEventListener('click', function() {
        showEditBasicInfoModal();
    });

    // Reviewed button (with dynamic functionality based on patient type)
    document.getElementById('reviewedBtn').addEventListener('click', function() {
        const currentPatient = window.currentPatientForEdit;
        const patientType = currentPatient ? currentPatient._editingType : 'unknown';

        if (patientType === 'confirmed') {
            // For confirmed patients, could show follow-up appointment modal
            // For now, just close the modal
            closeModal('patientDetailsModal');
        } else {
            // For pending or other types, just close indicating reviewed
            closeModal('patientDetailsModal');
        }
    });

    // Initialize Edit Basic Info Modal
    initializeEditBasicInfoModal();
    
    // Initialize New Appointment Modal
    initializeNewAppointmentModal();
}

// Edit Basic Info Modal functionality
function initializeEditBasicInfoModal() {
    const editModal = document.getElementById('editBasicInfoModal');
    const editClose = document.getElementById('editBasicInfoClose');
    const editCancel = document.getElementById('editBasicInfoCancel');
    const editForm = document.getElementById('editBasicInfoForm');

    function closeEditModal() {
        closeModal('editBasicInfoModal');
        if (editForm) editForm.reset();
    }

    editClose.addEventListener('click', closeEditModal);
    editCancel.addEventListener('click', closeEditModal);

    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const updatedData = {
            name: document.getElementById('editPatientName').value,
            phone: document.getElementById('editPatientPhone').value,
            email: document.getElementById('editPatientEmail').value,
            service: window.ServiceMapping ? window.ServiceMapping.getServiceDisplayName(document.getElementById('editPatientService').value) : document.getElementById('editPatientService').value
        };

        try {
            // Get the current patient data with editing info
            const currentPatient = window.currentPatientForEdit;

            if (!currentPatient || !currentPatient._editingId) {
                throw new Error('No patient data found for editing');
            }

            // Save to Firebase/localStorage
            await dataManager.updateAppointment(currentPatient._editingId, updatedData);

            // Update the patient details modal display
            updatePatientDetailsDisplay(updatedData);

            // Refresh the patients data to reflect changes in the table
            refreshPatientsData();

            showSuccessMessage('Patient information updated successfully!');
            closeEditModal();
        } catch (error) {
            console.error('Error updating patient information:', error);
            showErrorMessage('Failed to update patient information. Please try again.');
        }
    });

    // Initialize form validation
    initializePhoneFormatting('editPatientPhone');
    initializePatientNameValidation('editPatientName');
}

// New Appointment Modal functionality
function initializeNewAppointmentModal() {
    const newModal = document.getElementById('newAppointmentModal');
    const newClose = document.getElementById('newAppointmentClose');
    const newCancel = document.getElementById('newAppointmentCancel');
    const newForm = document.getElementById('newAppointmentForm');

    function closeNewModal() {
        closeModal('newAppointmentModal');
        if (newForm) newForm.reset();
    }

    newClose.addEventListener('click', closeNewModal);
    newCancel.addEventListener('click', closeNewModal);

    newModal.addEventListener('click', function(e) {
        if (e.target === newModal) {
            closeNewModal();
        }
    });

    newForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const appointmentData = {
            patientName: document.getElementById('newPatientName').value,
            phone: document.getElementById('newPatientPhone').value,
            email: document.getElementById('newPatientEmail').value,
            date: document.getElementById('newAppointmentDate').value,
            time: extractTimeFromSlot(document.getElementById('newAppointmentTime').value),
            service: getServiceDisplayName(document.getElementById('newAppointmentService').value),
            location: document.getElementById('newAppointmentLocation').value,
            notes: document.getElementById('newAppointmentNotes').value
        };

        try {
            // Add appointment using global data manager
            const newAppointment = dataManager.addAppointment(appointmentData);
            
            showSuccessMessage('New appointment created successfully!');
            closeNewModal();
            
            // Refresh patients data
            refreshPatientsData();
            
        } catch (error) {
            showErrorMessage('Failed to create appointment. Please try again.');
        }
    });

    // Set minimum date to today
    setMinDateToToday('newAppointmentDate');
    
    // Initialize form validation
    initializePatientNameValidation('newPatientName');
    initializePhoneFormatting('newPatientPhone');
}

// Show Edit Basic Info Modal with current data
function showEditBasicInfoModal() {
    const currentPatientData = getCurrentPatientData();

    document.getElementById('editPatientName').value = currentPatientData.name;
    document.getElementById('editPatientPhone').value = currentPatientData.phone;
    document.getElementById('editPatientEmail').value = currentPatientData.email;

    // Populate service dropdown with internal services
    const serviceSelect = document.getElementById('editPatientService');
    if (serviceSelect && window.ServiceMapping) {
        window.ServiceMapping.populateInternalServiceDropdown(serviceSelect);
        // Set current service if available
        if (currentPatientData.service) {
            serviceSelect.value = currentPatientData.service.toLowerCase().replace(/\s+/g, '-');
        }
    }

    openModal('editBasicInfoModal');
}

// Show New Appointment Modal with pre-populated patient data
function showNewAppointmentModal() {
    console.log('🔵 [Patients] showNewAppointmentModal called');

    const currentPatientData = getCurrentPatientData();

    // Pre-populate and make patient fields readonly
    const nameField = document.getElementById('newPatientName');
    const phoneField = document.getElementById('newPatientPhone');
    const emailField = document.getElementById('newPatientEmail');

    nameField.value = currentPatientData.name;
    phoneField.value = currentPatientData.phone;
    emailField.value = currentPatientData.email;

    nameField.readOnly = true;
    phoneField.readOnly = true;
    emailField.readOnly = true;
    nameField.style.backgroundColor = '#f9fafb';
    phoneField.style.backgroundColor = '#f9fafb';
    emailField.style.backgroundColor = '#f9fafb';

    // Set date to today
    setMinDateToToday('newAppointmentDate');
    const dateInput = document.getElementById('newAppointmentDate');
    dateInput.value = getCurrentDate();

    // Apply location permissions
    applyLocationPermissionsToPatientsModal();

    openModal('newAppointmentModal');
}

// Get current patient data from the open patient details modal
function getCurrentPatientData() {
    return {
        name: document.getElementById('patientName').textContent,
        phone: document.getElementById('patientPhone').textContent,
        email: document.getElementById('patientEmail').textContent,
        location: document.getElementById('patientLocation').textContent,
        service: document.getElementById('patientService') ? document.getElementById('patientService').textContent : ''
    };
}

// Update patient details display after editing
function updatePatientDetailsDisplay(updatedData) {
    document.getElementById('patientName').textContent = updatedData.name;
    document.getElementById('patientPhone').textContent = updatedData.phone;
    document.getElementById('patientEmail').textContent = updatedData.email;
    if (document.getElementById('patientLocation')) {
        document.getElementById('patientLocation').textContent = updatedData.location || '';
    }
    if (document.getElementById('patientService')) {
        document.getElementById('patientService').textContent = updatedData.service || '';
    }
    document.getElementById('patientDetailsTitle').textContent = `Patient Profile: ${updatedData.name}`;
}

// Process Modal functionality
function initializeProcessModal() {
    const processModal = document.getElementById('processModal');
    const processModalClose = document.getElementById('processModalClose');
    const arrivedBtn = document.getElementById('arrivedBtn');
    const noShowBtn = document.getElementById('noShowBtn');
    const modifyDetailsBtn = document.getElementById('modifyDetailsBtn');
    const holdBtn = document.getElementById('holdBtn');
    const completedBtn = document.getElementById('completedBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const modifyForm = document.getElementById('modifyForm');
    const holdForm = document.getElementById('holdForm');

    function closeProcessModal() {
        closeModal('processModal');
        if (modifyForm) modifyForm.style.display = 'none';
        if (holdForm) holdForm.style.display = 'none';
        resetActionButtons();
        currentProcessingRow = null;
        currentPatientData = null;
    }

    function resetActionButtons() {
        const actionButtons = document.querySelectorAll('.btn-action');
        actionButtons.forEach(btn => {
            btn.style.display = 'flex';
        });
    }

    processModalClose.addEventListener('click', closeProcessModal);
    
    processModal.addEventListener('click', function(e) {
        if (e.target === processModal) {
            closeProcessModal();
        }
    });

    // Action button handlers
    arrivedBtn.addEventListener('click', async function() {
        await handleProcessAction('arrived');
    });

    noShowBtn.addEventListener('click', async function() {
        await handleProcessAction('no-show');
    });

    modifyDetailsBtn.addEventListener('click', function() {
        modifyForm.style.display = 'block';
        document.querySelectorAll('.btn-action').forEach(btn => btn.style.display = 'none');
        
        // Pre-populate form
        setMinDateToToday('modifyDate');
        const modifyDate = document.getElementById('modifyDate');
        if (modifyDate) modifyDate.value = getCurrentDate();
    });

    holdBtn.addEventListener('click', function() {
        holdForm.style.display = 'block';
        document.querySelectorAll('.btn-action').forEach(btn => btn.style.display = 'none');
    });

    completedBtn.addEventListener('click', async function() {
        await handleProcessAction('completed');
    });

    cancelBtn.addEventListener('click', async function() {
        await handleProcessAction('cancelled');
    });

    // Form handlers
    document.getElementById('cancelModify').addEventListener('click', function() {
        modifyForm.style.display = 'none';
        resetActionButtons();
    });

    document.getElementById('cancelHold').addEventListener('click', function() {
        holdForm.style.display = 'none';
        resetActionButtons();
    });

    document.getElementById('saveHold').addEventListener('click', async function() {
        await handleProcessAction('held');
    });

    document.getElementById('modifyAppointmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        showSuccessMessage('Appointment modified successfully!');
        closeProcessModal();
        refreshPatientsData();
    });
}

// Handle process actions
async function handleProcessAction(action) {
    if (!currentPatientData) {
        showErrorMessage('No patient data found');
        return;
    }

    try {
        if (currentPatientData.id && currentPatientData.id.startsWith('pending_')) {
            // This is a pending confirmation
            if (action === 'arrived' || action === 'completed') {
                // Convert to appointment first
                const appointmentData = {
                    patientName: currentPatientData.patientName,
                    date: new Date().toISOString().split('T')[0],
                    time: '10:00', // Default time
                    service: currentPatientData.service,
                    location: currentPatientData.location,
                    phone: currentPatientData.phone,
                    email: currentPatientData.email
                };

                const newAppointment = await dataManager.addAppointment(appointmentData);

                // Update status if needed
                if (action !== 'scheduled') {
                    await dataManager.updateAppointmentStatus(newAppointment.id, action);
                }
            }

            // Remove from pending confirmations
            await dataManager.removePendingConfirmation(currentPatientData.id);

        } else if (currentPatientData.id) {
            // This is an existing appointment
            await dataManager.updateAppointmentStatus(currentPatientData.id, action);
        }
        
        let message = '';
        switch(action) {
            case 'arrived':
                message = 'Patient marked as arrived';
                break;
            case 'completed':
                message = 'Appointment completed successfully';
                break;
            case 'no-show':
                message = 'Appointment marked as no-show';
                break;
            case 'cancelled':
                message = 'Appointment cancelled';
                break;
            case 'held':
                message = 'Appointment put on hold';
                break;
        }
        
        showSuccessMessage(message);
        
        // Remove row from UI if it was processed
        if (currentProcessingRow) {
            currentProcessingRow.remove();
        }
        
        // Close modal and refresh data
        closeModal('processModal');
        currentProcessingRow = null;
        currentPatientData = null;
        refreshPatientsData();
        
    } catch (error) {
        showErrorMessage('Failed to process appointment');
    }
}

// Form validation setup
function setupFormValidation() {
    // Patient name validation for all forms
    const patientNameInputs = [
        'newPatientName',
        'editPatientName'
    ];
    
    patientNameInputs.forEach(inputId => {
        initializePatientNameValidation(inputId);
    });
    
    // Phone formatting for all phone inputs
    const phoneInputs = [
        'newPatientPhone',
        'editPatientPhone'
    ];
    
    phoneInputs.forEach(inputId => {
        initializePhoneFormatting(inputId);
    });
}

// Update button selection state - copied from appointments.js
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