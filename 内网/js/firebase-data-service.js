// Firebase Data Service - Handles all Firestore operations for appointment data
// Guard against accidental global patientName usage from legacy/minified code
if (typeof patientName === 'undefined') {
    // eslint-disable-next-line no-var
    var patientName = null;
}
// Replaces localStorage operations with Firebase Firestore

if (typeof window !== 'undefined' && !window.__intranetDebugLog) {
    window.__intranetDebugLog = [];
}

function recordDebugLog(label, payload) {
    try {
        if (typeof window === 'undefined') {
            return;
        }
        if (!window.__intranetDebugLog) {
            window.__intranetDebugLog = [];
        }
        window.__intranetDebugLog.push({
            ts: new Date().toISOString(),
            label,
            payload
        });
    } catch (_error) {
        // ignore
    }
}

class FirebaseDataService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.isInitialized = false;
        this.clinicLocations = [
            'arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale'
        ];
        this.init();
    }

    // Initialize Firebase services
    async init() {
        try {
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            this.db = window.firebase.db;
            this.auth = window.firebase.auth;
            this.storage = window.firebase.storage;
            this.isInitialized = true;
            console.log('✅ FirebaseDataService initialized with Storage');
        } catch (error) {
            console.error('❌ FirebaseDataService initialization failed:', error);
            this.isInitialized = false;
        }
    }

    // Wait for Firebase services to be available
    waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100;

            const checkFirebase = () => {
                if (window.firebase && window.firebase.db && window.firebase.auth && window.firebase.storage) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase services not available'));
                } else {
                    attempts++;
                    setTimeout(checkFirebase, 100);
                }
            };

            checkFirebase();
        });
    }

    // Ensure Firebase is ready for operations with retry mechanism
    async ensureReady() {
        if (!this.isInitialized) {
            await this.init();
        }

        // Additional check for Firebase being properly initialized
        let retryCount = 0;
        const maxRetries = 10;

        while ((!this.isInitialized || !window.firebase?.db) && retryCount < maxRetries) {
            console.log(`Waiting for Firebase initialization (attempt ${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 300));
            if (!this.isInitialized) {
                await this.init();
            }
            retryCount++;
        }

        if (!this.isInitialized || !window.firebase?.db) {
            console.warn('Firebase services not available after multiple retry attempts, operations will fail gracefully');
            throw new Error('Firebase services not available after multiple retry attempts');
        }
    }

    // Validate Firebase database connection before operations
    validateDatabase() {
        // Always use the latest reference from window.firebase.db
        const db = window.firebase?.db;
        if (!db) {
            throw new Error('Firebase database not available - window.firebase.db is null or undefined');
        }

        // Basic validation - just check if it's an object with app property
        // Firebase v9 Firestore instances should have an app property
        if (typeof db !== 'object' || !db.app) {
            console.error('Invalid Firebase database object:', db);
            throw new Error('Firebase database object is invalid - missing app property');
        }

        return db;
    }

    // Get current user's accessible clinic IDs based on role
    getAccessibleClinics(userRole, userClinics) {
        const clinics = (userRole === 'boss' || userRole === 'owner')
            ? this.clinicLocations
            : (userClinics || []);

        const normalized = clinics
            .map(clinic => this.normalizeClinicId(clinic))
            .filter(Boolean);

        // Ensure uniqueness to avoid Firestore "in" query errors
        return Array.from(new Set(normalized));
    }

    // Normalize status field between internal and external bookings
    normalizeStatus(status) {
        if (!status) return 'scheduled';

        // Convert external booking statuses to internal equivalents
        const statusMap = {
            'confirmed': 'scheduled',   // External: confirmed → Internal: scheduled
            'scheduled': 'scheduled',
            'completed': 'completed',
            'cancelled': 'cancelled',
            'pending': 'pending',
            'declined': 'declined',
            'arrived': 'arrived',
            'no-show': 'no-show'
        };

        const normalized = statusMap[status.toLowerCase()] || 'scheduled';
        return normalized;
    }

    normalizeClinicId(value) {
        if (!value) {
            return null;
        }
        if (typeof value !== 'string') {
            value = String(value);
        }

        const raw = value.trim().toLowerCase();
        if (!raw) {
            return null;
        }

        if (raw.includes('arcadia')) return 'arcadia';
        if (raw.includes('rowland')) return 'rowland-heights';
        if (raw.includes('pasadena')) return 'south-pasadena';
        if (raw.includes('irvine')) return 'irvine';
        if (raw.includes('eastvale')) return 'eastvale';

        return raw
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s_]+/g, '-');
    }

    resolveClinicInfo(data) {
        const rawLocation = data?.clinicLocation ??
            data?.clinicId ??
            data?.location ??
            data?.clinic ??
            data?.clinicName ??
            '';
        const clinicKey = this.normalizeClinicId(rawLocation);

        return {
            key: clinicKey,
            label: clinicKey ? this.getLocationFromClinicId(clinicKey) : rawLocation || ''
        };
    }

    // === APPOINTMENT METHODS ===

    // Get appointments for a specific date
    async getAppointmentsForDate(dateKey, userRole = null, userClinics = [], includeAllStatuses = false) {
        try {
            await this.ensureReady();

            // Validate database connection before proceeding
            let db;
            try {
                db = this.validateDatabase();
            } catch (dbError) {
                console.warn('Firebase database not ready, returning empty appointments array for date:', dbError.message);
                return [];
            }

            const { collection, getDocs, query, where, orderBy, Timestamp } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);

            // Query appointments for specific date with WHERE clause to minimize Firebase reads
            const appointmentsRef = collection(db, 'appointments');

            console.log(`🔍 Querying appointments for date: ${dateKey}`);
            const q = query(
                appointmentsRef,
                where('appointmentDate', '==', dateKey)
            );

            const querySnapshot = await getDocs(q);
            const appointments = [];
            let totalDocs = 0;
            let filteredByClinic = 0;
            let filteredByStatus = 0;
            let filteredByDate = 0;

            // Convert accessibleClinics to Set for faster lookup (case-insensitive)
            const clinicSet = new Set(accessibleClinics);

            querySnapshot.forEach((doc) => {
                totalDocs++;
                const data = doc.data();

                // Filter by accessible clinics (case-insensitive)
                const clinicInfo = this.resolveClinicInfo(data);
                if (!clinicInfo.key) {
                    filteredByClinic++;
                    return;
                }

                if (!clinicSet.has(clinicInfo.key)) {
                    filteredByClinic++;
                    return; // Skip appointments from inaccessible clinics
                }

                // Filter out cancelled and declined appointments for Calendar views (keep pending if includeAllStatuses)
                if (!includeAllStatuses && (data.status === 'cancelled' || data.status === 'declined')) {
                    filteredByStatus++;
                    return; // Skip these statuses for calendar
                }

                // Smart extraction of date and time from mixed data formats
                let extractedTime = '';
                let extractedDateKey = dateKey; // Default to query date

                // Extract TIME first
                if (data.appointmentTime) {
                    // Format 2: Has dedicated appointmentTime string (already in HH:MM format)
                    extractedTime = data.appointmentTime;
                } else if (data.appointmentDateTime) {
                    // Format 1: Extract time from timestamp
                    const dateObj = data.appointmentDateTime.toDate();
                    const hours = String(dateObj.getHours()).padStart(2, '0');
                    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                    extractedTime = `${hours}:${minutes}`;
                }

                // Extract DATE with proper timezone handling
                if (data.appointmentDate) {
                    extractedDateKey = data.appointmentDate;
                } else if (data.appointmentDateTime) {
                    const dateObj = data.appointmentDateTime.toDate();
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    extractedDateKey = `${year}-${month}-${day}`;
                }

                // Only include appointments that match the requested date
                if (extractedDateKey === dateKey) {
                    // Normalize field names between internal and external bookings
                    const normalizedStatus = this.normalizeStatus(data.status);
                    const normalizedService = data.service || data.serviceType || data.serviceName || 'General Consultation';

                    const legacyId = data.id || data.appointmentId || null;

                    appointments.push({
                        ...data,
                        legacyId,
                        id: doc.id,
                        clinicLocation: clinicInfo.key,
                        clinicId: clinicInfo.key,
                        location: clinicInfo.label || data.location || data.clinicLocation || '',
                        time: extractedTime,
                        dateKey: extractedDateKey,
                        date: extractedDateKey,
                        // Normalize status field (external bookings use "confirmed", internal use "scheduled")
                        status: normalizedStatus,
                        // Normalize service field (external: serviceType, internal: service)
                        service: normalizedService
                    });
                }
            });

            // Log summary statistics
            console.log(`📊 Query Summary for ${dateKey}:`, {
                totalDocuments: totalDocs,
                filteredByClinic: filteredByClinic,
                filteredByStatus: filteredByStatus,
                filteredByDate: filteredByDate,
                finalResults: appointments.length
            });

            return appointments;
        } catch (error) {
            console.error('Error getting appointments for date:', error);
            return [];
        }
    }

    // Get appointments for a date range (optimized for calendar views)
    async getAppointmentsForDateRange(startDateKey, endDateKey, userRole = null, userClinics = []) {
        try {
            await this.ensureReady();

            // Validate database connection before proceeding
            let db;
            try {
                db = this.validateDatabase();
            } catch (dbError) {
                console.warn('Firebase database not ready, returning empty appointments for date range:', dbError.message);
                return {};
            }

            console.log(`Calendar: Getting appointments for date range: ${startDateKey} to ${endDateKey}`);

            const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);

            // Query appointments within date range using WHERE clauses
            const appointmentsRef = collection(db, 'appointments');

            const q = query(
                appointmentsRef,
                where('appointmentDate', '>=', startDateKey),
                where('appointmentDate', '<=', endDateKey)
            );

            const querySnapshot = await getDocs(q);
            const appointmentsByDate = {};

            // Convert accessibleClinics to Set for faster lookup (case-insensitive)
            const clinicSet = new Set(accessibleClinics);

            querySnapshot.forEach((doc) => {
                const data = doc.data();

                // Filter by accessible clinics (case-insensitive)
                const clinicInfo = this.resolveClinicInfo(data);
                if (!clinicInfo.key || !clinicSet.has(clinicInfo.key)) {
                    return; // Skip appointments from inaccessible clinics
                }

                // Filter out pending, cancelled, and declined appointments for Calendar views
                if (data.status === 'pending' || data.status === 'cancelled' || data.status === 'declined') {
                    return; // Skip these statuses for calendar
                }

                // Process appointments with acceptable status
                // Smart extraction of date and time from mixed data formats
                let extractedTime = '';
                let extractedDateKey = '';

                // Extract TIME first
                if (data.appointmentTime) {
                    // Format 2: Has dedicated appointmentTime string (already in HH:MM format)
                    extractedTime = data.appointmentTime;
                } else if (data.appointmentDateTime) {
                    // Format 1: Extract time from timestamp
                    const dateObj = data.appointmentDateTime.toDate();
                    const hours = String(dateObj.getHours()).padStart(2, '0');
                    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                    extractedTime = `${hours}:${minutes}`;
                }

                // Extract DATE with proper timezone handling
                if (data.appointmentDate) {
                    // Format 2: Has dedicated appointmentDate string (YYYY-MM-DD format)
                    extractedDateKey = data.appointmentDate;
                } else if (data.appointmentDateTime) {
                    // Format 1: Extract date from timestamp with LOCAL timezone
                    const dateObj = data.appointmentDateTime.toDate();
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    extractedDateKey = `${year}-${month}-${day}`;
                }

                // Only include appointments that fall within the requested date range
                if (extractedDateKey >= startDateKey && extractedDateKey <= endDateKey) {
                    // Initialize date array if it doesn't exist
                    if (!appointmentsByDate[extractedDateKey]) {
                        appointmentsByDate[extractedDateKey] = [];
                    }

                    // Normalize field names
                    const normalizedStatus = this.normalizeStatus(data.status);
                    const normalizedService = data.service || data.serviceType || data.serviceName || 'General Consultation';

                    const legacyId = data.id || data.appointmentId || null;

                    appointmentsByDate[extractedDateKey].push({
                        ...data,
                        legacyId,
                        id: doc.id,
                        clinicLocation: clinicInfo.key,
                        clinicId: clinicInfo.key,
                        time: extractedTime,
                        dateKey: extractedDateKey,
                        date: extractedDateKey,
                        location: clinicInfo.label || data.location || data.clinicLocation || '',
                        status: normalizedStatus,
                        service: normalizedService
                    });
                }
            });

            console.log(`Calendar: Found appointments for ${Object.keys(appointmentsByDate).length} days in range`);
            return appointmentsByDate;
        } catch (error) {
            console.error('Error getting appointments for date range:', error);
            return {};
        }
    }

    // Get all appointments across all dates and clinics
    async getAllAppointments(userRole = null, userClinics = [], includeAllStatuses = true) {
        try {
            await this.ensureReady();

            // Validate database connection before proceeding
            let db;
            try {
                db = this.validateDatabase();
            } catch (dbError) {
                console.warn('Firebase database not ready, returning empty appointments array:', dbError.message);
                return [];
            }

            const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);

            // Query appointments within last 3 months to current date + 1 year to reduce reads
            const today = new Date();
            const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
            const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

            const startDateKey = threeMonthsAgo.toISOString().split('T')[0];
            const endDateKey = oneYearLater.toISOString().split('T')[0];

            console.log(`📅 getAllAppointments: Querying range ${startDateKey} to ${endDateKey} (includeAllStatuses: ${includeAllStatuses})`);

            const appointmentsRef = collection(db, 'appointments');
            const q = query(
                appointmentsRef,
                where('appointmentDate', '>=', startDateKey),
                where('appointmentDate', '<=', endDateKey)
            );

            const querySnapshot = await getDocs(q);
            const appointments = [];

            // Convert accessibleClinics to Set for faster lookup (case-insensitive)
            const clinicSet = new Set(accessibleClinics);

            querySnapshot.forEach((doc) => {
                const data = doc.data();

                // Filter by accessible clinics (case-insensitive)
                const clinicInfo = this.resolveClinicInfo(data);
                if (!clinicInfo.key || !clinicSet.has(clinicInfo.key)) {
                    return; // Skip appointments from inaccessible clinics
                }

                // Filter by status if needed (by default include all statuses for getAllAppointments)
                if (!includeAllStatuses && (data.status === 'cancelled' || data.status === 'declined')) {
                    return; // Skip cancelled/declined if not including all statuses
                }

                // Extract time and date with LOCAL timezone (matching other queries)
                let appointmentTime = '';
                let appointmentDateKey = '';

                if (data.appointmentTime) {
                    appointmentTime = data.appointmentTime;
                } else if (data.appointmentDateTime) {
                    const dateObj = data.appointmentDateTime.toDate();
                    const hours = String(dateObj.getHours()).padStart(2, '0');
                    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                    appointmentTime = `${hours}:${minutes}`;
                }

                if (data.appointmentDate) {
                    appointmentDateKey = data.appointmentDate;
                } else if (data.appointmentDateTime) {
                    // Use LOCAL timezone date extraction (NOT UTC!)
                    const dateObj = data.appointmentDateTime.toDate();
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    appointmentDateKey = `${year}-${month}-${day}`;
                }

                // Normalize field names
                const normalizedStatus = this.normalizeStatus(data.status);
                const normalizedService = data.service || data.serviceType || data.serviceName || 'General Consultation';

                const legacyId = data.id || data.appointmentId || null;

                appointments.push({
                    ...data,
                    legacyId,
                    id: doc.id,
                    clinicLocation: clinicInfo.key,
                    clinicId: clinicInfo.key,
                    time: appointmentTime,
                    dateKey: appointmentDateKey,
                    location: clinicInfo.label || data.location || data.clinicLocation || '',
                    status: normalizedStatus,
                    service: normalizedService
                });
            });

            console.log(`📊 getAllAppointments Summary: Retrieved ${appointments.length} total appointments`);
            return appointments;
        } catch (error) {
            console.error('Error getting all appointments:', error);
            return [];
        }
    }

    // Helper method to create proper appointment timestamp
    async createAppointmentTimestamp(dateString, timeString) {
        try {
            const { Timestamp } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            // Parse date (YYYY-MM-DD format) and time (HH:MM format)
            const [year, month, day] = dateString.split('-').map(Number);
            const [hours, minutes] = timeString.split(':').map(Number);

            // Create Date object in local timezone
            const appointmentDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

            // Create Firestore timestamp
            return Timestamp.fromDate(appointmentDate);
        } catch (error) {
            console.error('Error creating appointment timestamp:', error);
            // Fallback to current time if parsing fails
            const { Timestamp } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            return Timestamp.fromDate(new Date());
        }
    }

    // Add new appointment
    async addAppointment(appointmentData, userRole = null, userClinics = []) {
        try {
            await this.ensureReady();
            const { collection, addDoc, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            // Normalize clinic location to lowercase format
            const clinicId = this.getClinicIdFromLocation(appointmentData.location);

            // STRICT permission check - must have exact access
            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);
            if (!accessibleClinics.includes(clinicId)) {
                console.error(`Access denied: User clinics [${accessibleClinics.join(', ')}] does not include "${clinicId}"`);
                throw new Error(`Access denied: You don't have permission to create appointments for ${clinicId}`);
            }

            // Create proper appointment timestamp from date and time
            const appointmentDateTime = await this.createAppointmentTimestamp(appointmentData.date, appointmentData.time);

            // Get current user ID for Firebase Rules compliance
            const currentUserId = this.auth?.currentUser?.uid || 'system';

            const appointment = {
                userId: currentUserId, // REQUIRED by Firebase Rules
                patientName: appointmentData.patientName,
                patientPhone: appointmentData.phone || '', // REQUIRED by Firebase Rules
                service: appointmentData.service,
                appointmentTime: appointmentData.time, // Keep original time string for display
                appointmentDate: appointmentData.date, // Keep original date string for display
                appointmentDateTime: appointmentDateTime, // Add proper timestamp for queries
                status: 'scheduled',
                clinicLocation: clinicId, // IMPORTANT: Store normalized lowercase format
                phone: appointmentData.phone || '', // Keep for backward compatibility
                email: appointmentData.email || `${appointmentData.patientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
                notes: appointmentData.notes || '',
                dateKey: appointmentData.date, // Keep for backward compatibility
                createdAt: new Date().toISOString(),
                clinicId: clinicId
            };

            // Use flat appointments collection structure to match read methods
            const db = this.validateDatabase();
            const appointmentsRef = collection(db, 'appointments');
            const docRef = await addDoc(appointmentsRef, appointment);

            return {
                id: docRef.id,
                ...appointment
            };
        } catch (error) {
            console.error('Error adding appointment:', error);
            throw error;
        }
    }

    // Update appointment status
    async updateAppointmentStatus(appointmentId, newStatus, additionalData = {}, userRole = null, userClinics = [], appointmentContext = null) {
        try {
            await this.ensureReady();
            const { doc, updateDoc, deleteDoc, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            recordDebugLog('firebase.updateAppointmentStatus.start', {
                appointmentId,
                newStatus,
                additionalData,
                userRole,
                userClinics,
                appointmentContext
            });

            // First find the appointment to get clinic and date info
            const appointment = await this.findAppointmentById(appointmentId, userRole, userClinics, appointmentContext);
            recordDebugLog('firebase.updateAppointmentStatus.found', appointment);

            if (appointment && appointment.appointmentDateTime) {
                const appointmentDate = appointment.appointmentDateTime.toDate();
                const dateKey = appointmentDate.toISOString().split('T')[0];
                console.log('Appointment date:', appointmentDate);
                console.log('Appointment dateKey:', dateKey);
            }

            if (!appointment) {
                console.error('Appointment not found with ID:', appointmentId);
                throw new Error('Appointment not found');
            }

            const clinicLocation = appointment.clinicLocation || appointment.location;
            const dateKey = appointment.dateKey || (appointment.appointmentDateTime ?
                appointment.appointmentDateTime.toDate().toISOString().split('T')[0] :
                new Date().toISOString().split('T')[0]);

            // STRICT permission check - exact match required
            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);
            const normalizedClinicLocation = this.normalizeClinicId(clinicLocation);
            if (!normalizedClinicLocation || !accessibleClinics.includes(normalizedClinicLocation)) {
                console.error(`Access denied: User clinics [${accessibleClinics.join(', ')}] does not include "${normalizedClinicLocation}"`);
                throw new Error(`Access denied to clinic: ${normalizedClinicLocation}`);
            }

            if (newStatus === 'cancelled') {
                // Move to cancelled appointments
                const cancelledData = {
                    ...appointment,
                    status: 'cancelled',
                    cancelledAt: new Date().toISOString(),
                    cancelReason: additionalData.reason || 'Unknown',
                    cancelNotes: additionalData.notes || ''
                };

                // Add to cancelled collection (flat structure)
                const db = this.validateDatabase();
                const cancelledRef = collection(db, 'cancelledAppointments');
                await addDoc(cancelledRef, cancelledData);

                // Remove from active appointments (flat structure)
                await deleteDoc(doc(db, 'appointments', appointmentId));
            } else {
                // Update status in flat structure
                const updateData = {
                    status: newStatus,
                    ...additionalData,
                    lastUpdated: new Date().toISOString()
                };

                const db = this.validateDatabase();
                await updateDoc(doc(db, 'appointments', appointmentId), updateData);
            }

            return true;
        } catch (error) {
            console.error('Error updating appointment status:', error);
            throw error;
        }
    }

    // Update appointment data (not just status)
    async updateAppointment(appointmentId, updatedData, userRole = null, userClinics = []) {
        try {
            await this.ensureReady();
            const { doc, updateDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            // First find the appointment to get clinic and date info
            const appointment = await this.findAppointmentById(appointmentId, userRole, userClinics);
            if (!appointment) {
                throw new Error('Appointment not found');
            }

            // STRICT permission check
            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);
            const normalizedClinicLocation = this.normalizeClinicId(appointment.clinicLocation || appointment.location);
            if (!normalizedClinicLocation || !accessibleClinics.includes(normalizedClinicLocation)) {
                console.error(`Update denied: User clinics [${accessibleClinics.join(', ')}] does not include "${normalizedClinicLocation}"`);
                throw new Error(`No permission to update appointments for ${normalizedClinicLocation}`);
            }

            // Validate database connection
            const db = this.validateDatabase();

            // Prepare update data
            const updatePayload = {
                ...updatedData,
                lastUpdated: new Date().toISOString()
            };

            // Handle patientName field specially - update the field used for searching
            if (updatedData.name) {
                updatePayload.patientName = updatedData.name;
                delete updatePayload.name; // Remove the name field, use patientName consistently
            }

            // Update in flat structure
            await updateDoc(doc(db, 'appointments', appointmentId), updatePayload);

            return true;
        } catch (error) {
            console.error('Error updating appointment:', error);
            throw error;
        }
    }

    // Delete appointment
    async deleteAppointment(appointmentId, userRole = null, userClinics = []) {
        try {
            await this.ensureReady();
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            // Find appointment first
            const appointment = await this.findAppointmentById(appointmentId, userRole, userClinics);
            if (!appointment) {
                throw new Error('Appointment not found');
            }

            const clinicLocation = appointment.clinicLocation || appointment.location;

            // STRICT permission check
            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);
            const normalizedClinicLocation = this.normalizeClinicId(clinicLocation);
            if (!normalizedClinicLocation || !accessibleClinics.includes(normalizedClinicLocation)) {
                console.error(`Delete denied: User clinics [${accessibleClinics.join(', ')}] does not include "${normalizedClinicLocation}"`);
                throw new Error(`Access denied to delete appointments for ${normalizedClinicLocation}`);
            }

            // Delete from flat structure
            const db = this.validateDatabase();
            await deleteDoc(doc(db, 'appointments', appointmentId));

            return true;
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw error;
        }
    }

    // Find appointment by ID in flat structure
    async findAppointmentById(appointmentId, userRole = null, userClinics = [], appointmentContext = null) {
        try {
            await this.ensureReady();
            const { doc, getDoc, collection, getDocs, query, where, limit } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);
            const db = this.validateDatabase();

            const tryLoadById = async (docId, label = 'primary') => {
                if (!docId) {
                    return null;
                }
                    recordDebugLog('firebase.findAppointmentById.tryId', { label, docId });
                const appointmentRef = doc(db, 'appointments', docId);
                const appointmentSnap = await getDoc(appointmentRef);

                if (!appointmentSnap.exists()) {
                    return null;
                }

                const appointmentData = appointmentSnap.data();
                const normalizedClinicLocation = this.normalizeClinicId(appointmentData.clinicLocation || appointmentData.location);
                if (!normalizedClinicLocation || !accessibleClinics.includes(normalizedClinicLocation)) {
                    console.error(`Find denied: User clinics [${accessibleClinics.join(', ')}] does not include "${normalizedClinicLocation}"`);
                    throw new Error('No permission to access this appointment');
                }

                return {
                    id: appointmentSnap.id,
                    ...appointmentData
                };
            };

            let found = await tryLoadById(appointmentId, 'primary');
            if (found) {
                return found;
            }

            // Fallback: try legacy identifiers stored on the appointment context
            const legacyId = appointmentContext?.legacyId || appointmentContext?.appointmentId || null;
            if (!found && legacyId && legacyId !== appointmentId) {
                try {
                    found = await tryLoadById(legacyId, 'legacy');
                    if (found) {
                        return found;
                    }
                } catch (legacyError) {
                    console.warn('Legacy ID lookup failed:', legacyError);
                }
            }

            // Fallback query disabled for legacy data

            recordDebugLog('firebase.findAppointmentById.failed', {
                appointmentId,
                appointmentContext
            });
            return null;
        } catch (error) {
            console.error('Error finding appointment by ID:', error);
            return null;
        }
    }

    // === PENDING CONFIRMATIONS METHODS ===

    async getPendingConfirmations(userRole = null, userClinics = []) {
        try {
            await this.ensureReady();
            const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const db = this.validateDatabase();
            const confirmationsRef = collection(db, 'pendingConfirmations');
            const q = query(confirmationsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const confirmations = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Filter by clinic access
                const clinicId = this.getClinicIdFromLocation(data.location);
                const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);

                if (accessibleClinics.includes(clinicId)) {
                    confirmations.push({
                        ...data,
                        legacyId: data.id || data.appointmentId || null,
                        id: doc.id
                    });
                }
            });

            return confirmations;
        } catch (error) {
            console.error('Error getting pending confirmations:', error);
            return [];
        }
    }

    async addPendingConfirmation(confirmationData) {
        try {
            await this.ensureReady();
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const confirmation = {
                ...confirmationData,
                createdAt: new Date().toISOString()
            };

            const db = this.validateDatabase();
            const confirmationsRef = collection(db, 'pendingConfirmations');
            const docRef = await addDoc(confirmationsRef, confirmation);

            return {
                id: docRef.id,
                ...confirmation
            };
        } catch (error) {
            console.error('Error adding pending confirmation:', error);
            throw error;
        }
    }

    async removePendingConfirmation(confirmationId) {
        try {
            await this.ensureReady();
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const db = this.validateDatabase();
            await deleteDoc(doc(db, 'pendingConfirmations', confirmationId));
            return true;
        } catch (error) {
            console.error('Error removing pending confirmation:', error);
            throw error;
        }
    }

    // === CANCELLED APPOINTMENTS METHODS ===

    async getCancelledAppointments(userRole = null, userClinics = []) {
        try {
            await this.ensureReady();

            // Validate database connection before proceeding
            let db;
            try {
                db = this.validateDatabase();
            } catch (dbError) {
                console.warn('Firebase database not ready, returning empty cancelled appointments array:', dbError.message);
                return [];
            }

            const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const appointments = [];
            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);

            for (const clinicId of accessibleClinics) {
                const cancelledRef = collection(db, 'cancelledAppointments', clinicId, 'appointments');
                const q = query(cancelledRef, orderBy('cancelledAt', 'desc'));
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    appointments.push({
                        ...data,
                        legacyId: data.id || data.appointmentId || null,
                        id: doc.id
                    });
                });
            }

            return appointments;
        } catch (error) {
            console.error('Error getting cancelled appointments:', error);
            return [];
        }
    }

    // === PATIENT PROFILES METHODS ===

    async getPatientProfile(patientName) {
        try {
            await this.ensureReady();
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const patientId = patientName.toLowerCase().replace(/\s+/g, '_');
            const db = this.validateDatabase();
            const patientRef = doc(db, 'patientProfiles', patientId);
            const patientSnap = await getDoc(patientRef);

            if (patientSnap.exists()) {
                return patientSnap.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting patient profile:', error);
            return null;
        }
    }

    async setPatientProfile(patientName, profileData) {
        try {
            await this.ensureReady();
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const patientId = patientName.toLowerCase().replace(/\s+/g, '_');
            const db = this.validateDatabase();
            const patientRef = doc(db, 'patientProfiles', patientId);

            const profile = {
                patientName,
                detailedInfo: profileData,
                lastUpdated: new Date().toISOString()
            };

            await setDoc(patientRef, profile, { merge: true });
            return profile;
        } catch (error) {
            console.error('Error setting patient profile:', error);
            throw error;
        }
    }

    // === UTILITY METHODS ===

    // Convert location name to clinic ID
    getClinicIdFromLocation(locationName) {
        const normalized = this.normalizeClinicId(locationName);
        return normalized || 'arcadia';
    }

    // Convert clinic ID back to location name
    getLocationFromClinicId(clinicId) {
        return clinicId.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Generate unique appointment ID (fallback if needed)
    generateAppointmentId() {
        return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // === REAL-TIME NOTIFICATION METHODS ===

    /**
     * Subscribe to new appointments (pending status) for real-time notifications
     * @param {string} userRole - User role ('admin', 'boss', etc.)
     * @param {Array} userClinics - Array of clinic IDs user has access to
     * @param {Function} callback - Callback function to handle new appointments
     * @returns {Function} Unsubscribe function
     */
    async subscribeToNewAppointments(userRole, userClinics, callback) {
        try {
            await this.ensureReady();
            const { collection, query, where, orderBy, onSnapshot } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);

            // Query the flat appointments collection for pending appointments
            const db = this.validateDatabase();
            const appointmentsRef = collection(db, 'appointments');
            const q = query(
                appointmentsRef,
                where('clinicLocation', 'in', accessibleClinics),
                where('status', '==', 'pending'),
                orderBy('appointmentDateTime', 'asc')
            );

            // Set up real-time listener
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const pendingAppointments = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const appointmentDate = data.appointmentDateTime ? data.appointmentDateTime.toDate() : new Date();
                    const clinicInfo = this.resolveClinicInfo(data);

                    pendingAppointments.push({
                        ...data,
                        legacyId: data.id || data.appointmentId || null,
                        id: doc.id,
                        clinicLocation: clinicInfo.key,
                        clinicId: clinicInfo.key,
                        // Convert Firebase timestamp to readable format
                        time: appointmentDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false}),
                        dateKey: appointmentDate.toISOString().split('T')[0], // YYYY-MM-DD format
                        location: clinicInfo.label || data.location || data.clinicLocation || '',
                        appointmentDateTime: appointmentDate
                    });
                });

                // Call the callback with the pending appointments
                callback(pendingAppointments);

            }, (error) => {
                console.error('Error listening to new appointments:', error);
                callback([]); // Return empty array on error
            });

            return unsubscribe;

        } catch (error) {
            console.error('Error setting up new appointments listener:', error);
            return () => {}; // Return empty unsubscribe function
        }
    }

    /**
     * Get count of pending appointments for notification badge
     * @param {string} userRole - User role
     * @param {Array} userClinics - User's accessible clinics
     * @returns {Promise<number>} Count of pending appointments
     */
    async getPendingAppointmentsCount(userRole, userClinics) {
        try {
            await this.ensureReady();
            const { collection, query, where, getCountFromServer } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);

            const db = this.validateDatabase();
            const appointmentsRef = collection(db, 'appointments');
            const q = query(
                appointmentsRef,
                where('clinicLocation', 'in', accessibleClinics),
                where('status', '==', 'pending')
            );

            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;

        } catch (error) {
            console.error('Error getting pending appointments count:', error);
            return 0;
        }
    }

    // Medical Records Storage Methods

    // Upload medical record file using Base64 storage
    async uploadMedicalRecord(userId, file, progressCallback = null) {
        try {
            await this.ensureReady();
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            // Debug auth state
            console.log('🔍 Upload Debug - Auth current user:', this.auth.currentUser);
            console.log('🔍 Upload Debug - Auth state:', this.auth.currentUser ? 'Authenticated' : 'Not authenticated');

            // Simulate progress for user feedback
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 20;
                if (progressCallback) {
                    progressCallback(Math.min(progress, 90));
                }
            }, 100);

            // Convert file to Base64
            const base64Data = await this.fileToBase64(file);

            // Clear progress interval
            clearInterval(progressInterval);
            if (progressCallback) {
                progressCallback(95);
            }

            // Save file data to Firestore
            const db = this.validateDatabase();
            const recordsRef = collection(db, 'medicalRecords');
            const recordData = {
                userId: userId,
                filename: file.name,
                originalName: file.name,
                size: file.size,
                type: file.type,
                base64Data: base64Data,
                uploadedAt: new Date()
            };

            const docRef = await addDoc(recordsRef, recordData);

            if (progressCallback) {
                progressCallback(100);
            }

            return {
                id: docRef.id,
                ...recordData
            };

        } catch (error) {
            console.error('Error uploading medical record:', error);
            throw error;
        }
    }

    // Convert file to Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Get medical records for a user
    async getMedicalRecords(userId) {
        try {
            await this.ensureReady();
            const { collection, query, where, getDocs, orderBy } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const db = this.validateDatabase();
            const recordsRef = collection(db, 'medicalRecords');
            const q = query(
                recordsRef,
                where('userId', '==', userId),
                orderBy('uploadedAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const records = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                records.push({
                    ...data,
                    legacyId: data.id || null,
                    id: doc.id
                });
            });

            return records;
        } catch (error) {
            console.error('Error getting medical records:', error);
            throw error;
        }
    }

    // Delete medical record
    async deleteMedicalRecord(recordId) {
        try {
            await this.ensureReady();
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            // Delete record from Firestore (Base64 data included)
            const db = this.validateDatabase();
            await deleteDoc(doc(db, 'medicalRecords', recordId));

            console.log('Medical record deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting medical record:', error);
            throw error;
        }
    }

    // Rename medical record
    async renameMedicalRecord(recordId, newName) {
        try {
            await this.ensureReady();
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const db = this.validateDatabase();
            const recordRef = doc(db, 'medicalRecords', recordId);

            await updateDoc(recordRef, {
                originalName: newName,
                updatedAt: new Date()
            });

            console.log('Medical record renamed successfully');
            return true;
        } catch (error) {
            console.error('Error renaming medical record:', error);
            throw error;
        }
    }

    // Download medical record from Base64 data
    async downloadMedicalRecord(base64Data, filename) {
        try {
            // Convert Base64 to Blob
            const byteCharacters = atob(base64Data.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // Determine MIME type from Base64 data
            const mimeType = base64Data.substring(base64Data.indexOf(':') + 1, base64Data.indexOf(';'));
            const blob = new Blob([byteArray], { type: mimeType });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return true;
        } catch (error) {
            console.error('Error downloading medical record:', error);
            throw error;
        }
    }

    // ==================== DENTAL CHART METHODS ====================

    // Get dental chart for a patient (Universal numbering 1-32)
    async getDentalChart(userId) {
        await this.ensureReady();
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const chartRef = doc(db, 'dentalCharts', userId);
        const chartSnap = await getDoc(chartRef);

        if (chartSnap.exists()) {
            return { id: chartSnap.id, ...chartSnap.data() };
        }
        return null;
    }

    // Validate tooth number (1-32)
    validateToothNumber(toothNum) {
        const num = parseInt(toothNum);
        if (isNaN(num) || num < 1 || num > 32) {
            throw new Error(`Invalid tooth number: ${toothNum}. Must be 1-32.`);
        }
        return num;
    }

    // Validate tooth status
    validateToothStatus(status) {
        const validStatuses = ['healthy', 'monitor', 'cavity', 'filled', 'missing', 'implant', 'root-canal', 'post-op', 'urgent'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid tooth status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
        }
        return status;
    }

    // Validate file upload
    validateFileUpload(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

        if (!file) {
            throw new Error('No file provided');
        }

        if (file.size > maxSize) {
            throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum 5MB allowed.`);
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, and PDF allowed.`);
        }

        return true;
    }

    // Update tooth status (e.g., healthy, cavity, filled, missing, etc.)
    async updateToothStatus(userId, toothNum, statusData) {
        await this.ensureReady();

        // Validate inputs
        const validToothNum = this.validateToothNumber(toothNum);
        const validStatus = this.validateToothStatus(statusData.status);

        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const chartRef = doc(db, 'dentalCharts', userId);

        await updateDoc(chartRef, {
            [`teeth.${validToothNum}.status`]: validStatus,
            [`teeth.${validToothNum}.lastUpdated`]: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });

        return true;
    }

    // Add treatment record to a tooth
    async addToothTreatment(userId, toothNum, treatment) {
        await this.ensureReady();

        // Validate tooth number
        const validToothNum = this.validateToothNumber(toothNum);

        const { doc, getDoc, updateDoc, arrayUnion } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const chartRef = doc(db, 'dentalCharts', userId);

        // Ensure tooth exists
        const chartSnap = await getDoc(chartRef);
        if (!chartSnap.exists()) {
            throw new Error('Dental chart not found');
        }

        const entry = {
            id: `treatment-${Date.now()}`,
            date: new Date().toISOString(),
            createdBy: this.auth.currentUser?.uid || 'unknown',
            ...treatment
        };

        // Ensure teeth object and tooth entry exist
        const chartData = chartSnap.data();
        if (!chartData.teeth) {
            chartData.teeth = {};
        }
        if (!chartData.teeth[validToothNum]) {
            chartData.teeth[validToothNum] = { status: 'healthy', treatments: [] };
        }
        if (!chartData.teeth[validToothNum].treatments) {
            chartData.teeth[validToothNum].treatments = [];
        }

        // Add treatment entry
        chartData.teeth[validToothNum].treatments.push(entry);

        await updateDoc(chartRef, {
            [`teeth.${validToothNum}.treatments`]: chartData.teeth[validToothNum].treatments,
            [`teeth.${validToothNum}.lastUpdated`]: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });

        return entry;
    }

    // Upload file for tooth attachment (hybrid: <50KB Base64, >50KB Storage)
    async uploadToothAttachment(userId, toothNum, file) {
        await this.ensureReady();

        // Validate inputs
        const validToothNum = this.validateToothNumber(toothNum);
        this.validateFileUpload(file);

        const MAX_BASE64_SIZE = 50 * 1024; // 50 KB threshold

        if (file.size < MAX_BASE64_SIZE) {
            // Small file: Store as Base64 in Firestore
            const base64 = await this.fileToBase64(file);
            return {
                type: 'base64',
                filename: file.name,
                mimeType: file.type,
                fileSize: file.size,
                base64Data: base64
            };
        } else {
            // Large file: Upload to Firebase Storage
            const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js');

            const storage = this.storage;
            const storagePath = `dentalCharts/${userId}/tooth_${validToothNum}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);

            // Upload file
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
                type: 'storage',
                filename: file.name,
                mimeType: file.type,
                fileSize: file.size,
                storagePath: storagePath,
                downloadURL: downloadURL
            };
        }
    }

    // Delete tooth treatment entry
    async deleteToothTreatment(userId, toothNum, treatmentId) {
        await this.ensureReady();

        // Validate tooth number
        const validToothNum = this.validateToothNumber(toothNum);

        const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const chartRef = doc(db, 'dentalCharts', userId);
        const chartSnap = await getDoc(chartRef);

        if (chartSnap.exists()) {
            const chartData = chartSnap.data();
            const tooth = chartData.teeth?.[validToothNum];

            if (tooth?.treatments) {
                const updatedTreatments = tooth.treatments.filter(t => t.id !== treatmentId);
                await updateDoc(chartRef, {
                    [`teeth.${validToothNum}.treatments`]: updatedTreatments,
                    [`teeth.${validToothNum}.lastUpdated`]: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                });
            }
        }

        return true;
    }

    // Initialize empty dental chart for new patient
    async initializeDentalChart(userId, patientName) {
        await this.ensureReady();
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const chartRef = doc(db, 'dentalCharts', userId);

        // Create 32 teeth with Universal numbering (1-32)
        const teeth = {};
        for (let i = 1; i <= 32; i++) {
            teeth[i.toString()] = {
                status: 'healthy',
                treatments: [],
                lastUpdated: new Date().toISOString()
            };
        }

        await setDoc(chartRef, {
            userId: userId,
            patientName: patientName,
            lastUpdated: new Date().toISOString(),
            teeth: teeth
        });

        return true;
    }

    // ==================== DETAILED STATUS CLASSIFICATION METHODS ====================

    validateDetailedStatus(statusData) {
        // statusData should have: condition, severity, affectedSurfaces, clinicalNotes
        const validConditions = ['healthy', 'monitor', 'cavity', 'filled', 'missing', 'implant', 'root-canal', 'post-op'];
        const validSeverities = ['none', 'mild', 'moderate', 'severe', 'urgent'];
        const validSurfaces = ['occlusal', 'buccal', 'lingual', 'mesial', 'distal'];

        if (!statusData.condition || !validConditions.includes(statusData.condition)) {
            throw new Error(`Invalid condition. Must be one of: ${validConditions.join(', ')}`);
        }

        if (!statusData.severity || !validSeverities.includes(statusData.severity)) {
            throw new Error(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`);
        }

        if (!Array.isArray(statusData.affectedSurfaces)) {
            throw new Error('affectedSurfaces must be an array');
        }

        for (const surface of statusData.affectedSurfaces) {
            if (!validSurfaces.includes(surface)) {
                throw new Error(`Invalid surface. Must be one of: ${validSurfaces.join(', ')}`);
            }
        }

        return true;
    }

    // Update detailed tooth status
    async updateDetailedToothStatus(userId, toothNum, statusData) {
        await this.ensureReady();
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const validToothNum = this.validateToothNumber(toothNum);
        this.validateDetailedStatus(statusData);

        const db = this.validateDatabase();
        const chartRef = doc(db, 'dentalCharts', userId);

        const detailedStatus = {
            condition: statusData.condition,
            severity: statusData.severity,
            affectedSurfaces: statusData.affectedSurfaces || [],
            clinicalNotes: statusData.clinicalNotes || '',
            updatedAt: new Date().toISOString()
        };

        await updateDoc(chartRef, {
            [`teeth.${validToothNum}.detailedStatus`]: detailedStatus,
            [`teeth.${validToothNum}.status`]: detailedStatus.condition,
            [`teeth.${validToothNum}.lastUpdated`]: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });

        return detailedStatus;
    }

    // Get detailed tooth status
    async getDetailedToothStatus(userId, toothNum) {
        await this.ensureReady();
        const validToothNum = this.validateToothNumber(toothNum);

        const chartData = await this.getDentalChart(userId);
        if (!chartData || !chartData.teeth) return null;

        const tooth = chartData.teeth[validToothNum.toString()];
        return tooth ? tooth.detailedStatus : null;
    }

    // ==================== PERIODONTAL DATA METHODS ====================

    // Validate periodontal depth (0-15mm)
    validatePeriodontalDepth(depth) {
        const num = parseInt(depth);
        if (isNaN(num) || num < 0 || num > 15) {
            throw new Error(`Invalid periodontal depth: ${depth}. Must be 0-15mm.`);
        }
        return num;
    }

    // Validate periodontal data structure
    validatePeriodontalData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid periodontal data: must be an object');
        }

        // Validate buccal measurements
        if (!data.buccal || typeof data.buccal !== 'object') {
            throw new Error('Invalid periodontal data: buccal measurements required');
        }
        this.validatePeriodontalDepth(data.buccal.mesial);
        this.validatePeriodontalDepth(data.buccal.mid);
        this.validatePeriodontalDepth(data.buccal.distal);

        // Validate lingual measurements
        if (!data.lingual || typeof data.lingual !== 'object') {
            throw new Error('Invalid periodontal data: lingual measurements required');
        }
        this.validatePeriodontalDepth(data.lingual.mesial);
        this.validatePeriodontalDepth(data.lingual.mid);
        this.validatePeriodontalDepth(data.lingual.distal);

        // Validate bleeding points (optional)
        if (data.bleedingPoints && !Array.isArray(data.bleedingPoints)) {
            throw new Error('Invalid periodontal data: bleedingPoints must be an array');
        }

        return true;
    }

    // Update periodontal data for a specific tooth
    async updatePeriodontalData(userId, toothNum, periodontalData) {
        await this.ensureReady();

        // Validate inputs
        const validToothNum = this.validateToothNumber(toothNum);
        this.validatePeriodontalData(periodontalData);

        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const chartRef = doc(db, 'dentalCharts', userId);

        const periodontalRecord = {
            buccal: {
                mesial: parseInt(periodontalData.buccal.mesial),
                mid: parseInt(periodontalData.buccal.mid),
                distal: parseInt(periodontalData.buccal.distal)
            },
            lingual: {
                mesial: parseInt(periodontalData.lingual.mesial),
                mid: parseInt(periodontalData.lingual.mid),
                distal: parseInt(periodontalData.lingual.distal)
            },
            bleedingPoints: periodontalData.bleedingPoints || [],
            measuredAt: new Date().toISOString()
        };

        await updateDoc(chartRef, {
            [`teeth.${validToothNum}.periodontal`]: periodontalRecord,
            [`teeth.${validToothNum}.lastUpdated`]: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });

        return periodontalRecord;
    }

    // Get periodontal data for a specific tooth
    async getPeriodontalData(userId, toothNum) {
        await this.ensureReady();

        // Validate tooth number
        const validToothNum = this.validateToothNumber(toothNum);

        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const chartRef = doc(db, 'dentalCharts', userId);
        const chartSnap = await getDoc(chartRef);

        if (chartSnap.exists()) {
            const chartData = chartSnap.data();
            const tooth = chartData.teeth?.[validToothNum];
            return tooth?.periodontal || null;
        }

        return null;
    }

    // Delete periodontal data for a specific tooth
    async deletePeriodontalData(userId, toothNum) {
        await this.ensureReady();

        // Validate tooth number
        const validToothNum = this.validateToothNumber(toothNum);

        const { doc, updateDoc, deleteField } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const chartRef = doc(db, 'dentalCharts', userId);

        await updateDoc(chartRef, {
            [`teeth.${validToothNum}.periodontal`]: deleteField(),
            [`teeth.${validToothNum}.lastUpdated`]: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });

        return true;
    }

    // Get periodontal summary for entire dental chart
    async getPeriodontalSummary(userId) {
        await this.ensureReady();

        const chartData = await this.getDentalChart(userId);
        if (!chartData || !chartData.teeth) {
            return null;
        }

        const summary = {
            teethWithData: 0,
            averageDepth: 0,
            maxDepth: 0,
            teethWithBleeding: 0,
            problemAreas: [] // teeth with depth > 4mm
        };

        let totalMeasurements = 0;
        let sumDepth = 0;

        for (let i = 1; i <= 32; i++) {
            const tooth = chartData.teeth[i.toString()];
            if (tooth?.periodontal) {
                summary.teethWithData++;

                const { buccal, lingual, bleedingPoints } = tooth.periodontal;
                const depths = [
                    buccal.mesial, buccal.mid, buccal.distal,
                    lingual.mesial, lingual.mid, lingual.distal
                ];

                depths.forEach(depth => {
                    sumDepth += depth;
                    totalMeasurements++;
                    if (depth > summary.maxDepth) {
                        summary.maxDepth = depth;
                    }
                });

                // Check for problem areas (depth > 4mm)
                const maxToothDepth = Math.max(...depths);
                if (maxToothDepth > 4) {
                    summary.problemAreas.push({
                        toothNum: i,
                        maxDepth: maxToothDepth,
                        status: tooth.status
                    });
                }

                // Check for bleeding
                if (bleedingPoints && bleedingPoints.length > 0) {
                    summary.teethWithBleeding++;
                }
            }
        }

        if (totalMeasurements > 0) {
            summary.averageDepth = (sumDepth / totalMeasurements).toFixed(1);
        }

        return summary;
    }

    // ==================== DENTAL CHART HISTORY & SNAPSHOTS ====================

    /**
     * Create a snapshot of the current dental chart state
     */
    async createDentalChartSnapshot(userId, description = '') {
        await this.ensureReady();
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();

        // Get current chart data
        const currentChart = await this.getDentalChart(userId);
        if (!currentChart) {
            throw new Error('No dental chart found for this user');
        }

        // Create snapshot document
        const snapshotData = {
            userId: userId,
            patientName: currentChart.patientName,
            description: description || 'Chart snapshot',
            chartData: currentChart.teeth, // Store teeth data
            createdAt: new Date().toISOString(),
            timestamp: serverTimestamp()
        };

        const snapshotsRef = collection(db, 'dentalChartSnapshots');
        const docRef = await addDoc(snapshotsRef, snapshotData);

        console.log('✅ Snapshot created:', docRef.id);
        return { id: docRef.id, ...snapshotData };
    }

    /**
     * Get all snapshots for a user
     */
    async getDentalChartSnapshots(userId) {
        await this.ensureReady();
        const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const snapshotsRef = collection(db, 'dentalChartSnapshots');
        const q = query(
            snapshotsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        try {
            const querySnapshot = await getDocs(q);
            const snapshots = [];

            querySnapshot.forEach((doc) => {
                snapshots.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return snapshots;
        } catch (error) {
            // If no snapshots exist or permission denied, return empty array
            if (error.code === 'permission-denied' || error.code === 'not-found') {
                console.log('📝 No snapshots found or access denied (this is normal if none exist yet)');
                return [];
            }
            // Re-throw other errors
            throw error;
        }
    }

    // ==================== MEDICAL IMAGES ====================

    /**
     * Get all medical images for a patient
     */
    async getPatientImages(patientId) {
        await this.ensureReady();
        const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const imagesRef = collection(db, 'medicalImages');
        const q = query(
            imagesRef,
            where('patientId', '==', patientId),
            orderBy('date', 'desc')
        );

        try {
            const querySnapshot = await getDocs(q);
            const images = [];

            querySnapshot.forEach((doc) => {
                images.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`✅ Loaded ${images.length} images for patient ${patientId}`);
            return images;
        } catch (error) {
            // If no images exist or permission denied, return empty array
            if (error.code === 'permission-denied' || error.code === 'not-found') {
                console.log('📝 No images found or access denied');
                return [];
            }
            throw error;
        }
    }

    /**
     * Save a medical image metadata
     */
    async saveMedicalImage(patientId, imageData) {
        await this.ensureReady();
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const imagesRef = collection(db, 'medicalImages');

        const docData = {
            patientId,
            url: imageData.url,
            date: imageData.date || new Date().toISOString(),
            type: imageData.type || '全景片',
            fileName: imageData.fileName || 'unknown',
            size: imageData.size || 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(imagesRef, docData);
        console.log('✅ Medical image saved:', docRef.id);
        return { id: docRef.id, ...docData };
    }

    /**
     * Delete a medical image
     */
    async deleteMedicalImage(imageId) {
        await this.ensureReady();
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const imageRef = doc(db, 'medicalImages', imageId);
        await deleteDoc(imageRef);

        console.log('✅ Medical image deleted:', imageId);
        return true;
    }

    /**
     * Get a specific snapshot by ID
     */
    async getSnapshot(snapshotId) {
        await this.ensureReady();
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const snapshotRef = doc(db, 'dentalChartSnapshots', snapshotId);

        try {
            const snapshotDoc = await getDoc(snapshotRef);

            if (!snapshotDoc.exists()) {
                return null;
            }

            return {
                id: snapshotDoc.id,
                ...snapshotDoc.data()
            };
        } catch (error) {
            // Handle permission errors gracefully
            if (error.code === 'permission-denied') {
                console.log('⚠️ Permission denied accessing snapshot');
                return null;
            }
            throw error;
        }
    }

    /**
     * Delete a snapshot
     */
    async deleteSnapshot(snapshotId) {
        await this.ensureReady();
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

        const db = this.validateDatabase();
        const snapshotRef = doc(db, 'dentalChartSnapshots', snapshotId);
        await deleteDoc(snapshotRef);

        console.log('✅ Snapshot deleted:', snapshotId);
        return true;
    }

    /**
     * Compare current chart with a snapshot
     * Returns array of changes
     */
    async compareWithSnapshot(userId, snapshotId) {
        await this.ensureReady();

        // Get current chart
        const currentChart = await this.getDentalChart(userId);
        if (!currentChart) {
            throw new Error('No current chart found');
        }

        // Get snapshot
        const snapshot = await this.getSnapshot(snapshotId);
        if (!snapshot) {
            throw new Error('Snapshot not found');
        }

        const changes = [];

        // Compare each tooth
        for (let i = 1; i <= 32; i++) {
            const toothNum = i.toString();
            const currentTooth = currentChart.teeth[toothNum];
            const snapshotTooth = snapshot.chartData[toothNum];

            if (!currentTooth || !snapshotTooth) continue;

            const toothChanges = {
                toothNum: i,
                changes: []
            };

            // Compare status
            if (currentTooth.status !== snapshotTooth.status) {
                toothChanges.changes.push({
                    field: 'status',
                    old: snapshotTooth.status,
                    new: currentTooth.status
                });
            }

            // Compare detailed status
            if (currentTooth.detailedStatus || snapshotTooth.detailedStatus) {
                const currentDS = currentTooth.detailedStatus || {};
                const snapshotDS = snapshotTooth.detailedStatus || {};

                if (currentDS.condition !== snapshotDS.condition) {
                    toothChanges.changes.push({
                        field: 'condition',
                        old: snapshotDS.condition,
                        new: currentDS.condition
                    });
                }

                if (currentDS.severity !== snapshotDS.severity) {
                    toothChanges.changes.push({
                        field: 'severity',
                        old: snapshotDS.severity,
                        new: currentDS.severity
                    });
                }
            }

            // Compare periodontal data
            if (currentTooth.periodontal || snapshotTooth.periodontal) {
                const currentPerio = currentTooth.periodontal;
                const snapshotPerio = snapshotTooth.periodontal;

                if (currentPerio && snapshotPerio) {
                    // Calculate average depths
                    const currentAvg = this.calculateAvgDepth(currentPerio);
                    const snapshotAvg = this.calculateAvgDepth(snapshotPerio);

                    if (Math.abs(currentAvg - snapshotAvg) > 0.5) {
                        toothChanges.changes.push({
                            field: 'periodontal',
                            old: `${snapshotAvg.toFixed(1)}mm`,
                            new: `${currentAvg.toFixed(1)}mm`
                        });
                    }
                } else if (currentPerio && !snapshotPerio) {
                    toothChanges.changes.push({
                        field: 'periodontal',
                        old: 'No data',
                        new: 'Data added'
                    });
                } else if (!currentPerio && snapshotPerio) {
                    toothChanges.changes.push({
                        field: 'periodontal',
                        old: 'Data existed',
                        new: 'Data removed'
                    });
                }
            }

            // Compare treatment count
            const currentTreatments = currentTooth.treatments?.length || 0;
            const snapshotTreatments = snapshotTooth.treatments?.length || 0;

            if (currentTreatments > snapshotTreatments) {
                toothChanges.changes.push({
                    field: 'treatments',
                    old: `${snapshotTreatments} records`,
                    new: `${currentTreatments} records (+${currentTreatments - snapshotTreatments})`
                });
            }

            if (toothChanges.changes.length > 0) {
                changes.push(toothChanges);
            }
        }

        return {
            snapshotDate: snapshot.createdAt,
            snapshotDescription: snapshot.description,
            currentDate: new Date().toISOString(),
            totalChanges: changes.length,
            changes: changes
        };
    }

    /**
     * Helper: Calculate average periodontal depth
     */
    calculateAvgDepth(periodontalData) {
        if (!periodontalData) return 0;

        const depths = [
            periodontalData.buccal.mesial,
            periodontalData.buccal.mid,
            periodontalData.buccal.distal,
            periodontalData.lingual.mesial,
            periodontalData.lingual.mid,
            periodontalData.lingual.distal
        ];

        return depths.reduce((sum, d) => sum + d, 0) / 6;
    }
}

// Create global instance
let firebaseDataService = null;

// Initialize when Firebase is ready
if (typeof window !== 'undefined') {
    // Wait for Firebase to be ready before creating instance
    const initializeFirebaseDataService = () => {
        if (window.firebase && window.firebase.db) {
            firebaseDataService = new FirebaseDataService();
            window.firebaseDataService = firebaseDataService;
            console.log('✅ FirebaseDataService instance created');
        } else {
            // Retry after a short delay
            setTimeout(initializeFirebaseDataService, 100);
        }
    };

    // Start initialization
    initializeFirebaseDataService();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseDataService;
} else if (typeof window !== 'undefined') {
    window.FirebaseDataService = FirebaseDataService;
}
