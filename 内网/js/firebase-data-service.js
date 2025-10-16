// Firebase Data Service - Handles all Firestore operations for appointment data
// Replaces localStorage operations with Firebase Firestore

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
        if (userRole === 'boss' || userRole === 'owner') {
            return this.clinicLocations;
        } else {
            return userClinics || [];
        }
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
            const clinicSet = new Set(accessibleClinics.map(c => c.toLowerCase()));

            querySnapshot.forEach((doc) => {
                totalDocs++;
                const data = doc.data();

                // Filter by accessible clinics (case-insensitive)
                if (!clinicSet.has((data.clinicLocation || '').toLowerCase())) {
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

                    appointments.push({
                        id: doc.id,
                        ...data,
                        time: extractedTime,
                        dateKey: extractedDateKey,
                        date: extractedDateKey,
                        location: data.clinicLocation,
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
            const clinicSet = new Set(accessibleClinics.map(c => c.toLowerCase()));

            querySnapshot.forEach((doc) => {
                const data = doc.data();

                // Filter by accessible clinics (case-insensitive)
                if (!clinicSet.has((data.clinicLocation || '').toLowerCase())) {
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

                    appointmentsByDate[extractedDateKey].push({
                        id: doc.id,
                        ...data,
                        time: extractedTime,
                        dateKey: extractedDateKey,
                        date: extractedDateKey,
                        location: data.clinicLocation,
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
            const clinicSet = new Set(accessibleClinics.map(c => c.toLowerCase()));

            querySnapshot.forEach((doc) => {
                const data = doc.data();

                // Filter by accessible clinics (case-insensitive)
                if (!clinicSet.has((data.clinicLocation || '').toLowerCase())) {
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

                appointments.push({
                    id: doc.id,
                    ...data,
                    time: appointmentTime,
                    dateKey: appointmentDateKey,
                    location: data.clinicLocation,
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

            const appointment = {
                patientName: appointmentData.patientName,
                service: appointmentData.service,
                appointmentTime: appointmentData.time, // Keep original time string for display
                appointmentDate: appointmentData.date, // Keep original date string for display
                appointmentDateTime: appointmentDateTime, // Add proper timestamp for queries
                status: 'scheduled',
                clinicLocation: clinicId, // IMPORTANT: Store normalized lowercase format
                phone: appointmentData.phone || '',
                email: appointmentData.email || `${appointmentData.patientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
                notes: appointmentData.notes || '',
                dateKey: appointmentData.date, // Keep for backward compatibility
                createdAt: new Date().toISOString(),
                clinicId: clinicId
            };

            // Fixed: Use flat appointments collection structure to match read methods
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
    async updateAppointmentStatus(appointmentId, newStatus, additionalData = {}, userRole = null, userClinics = []) {
        try {
            await this.ensureReady();
            const { doc, updateDoc, deleteDoc, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            console.log('Firebase updateAppointmentStatus - Appointment ID:', appointmentId, 'New status:', newStatus);

            // First find the appointment to get clinic and date info
            const appointment = await this.findAppointmentById(appointmentId, userRole, userClinics);
            console.log('Found appointment:', appointment);

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

            const clinicLocation = appointment.clinicLocation;
            const dateKey = appointment.dateKey || (appointment.appointmentDateTime ?
                appointment.appointmentDateTime.toDate().toISOString().split('T')[0] :
                new Date().toISOString().split('T')[0]);

            // STRICT permission check - exact match required
            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);
            // Normalize clinicLocation for legacy data compatibility
            const normalizedClinicLocation = (clinicLocation || '').toLowerCase().replace(/\s+/g, '-');
            if (!accessibleClinics.includes(normalizedClinicLocation)) {
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
            const normalizedClinicLocation = (appointment.clinicLocation || '').toLowerCase().replace(/\s+/g, '-');
            if (!accessibleClinics.includes(normalizedClinicLocation)) {
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

            const clinicLocation = appointment.clinicLocation;

            // STRICT permission check
            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);
            const normalizedClinicLocation = (clinicLocation || '').toLowerCase().replace(/\s+/g, '-');
            if (!accessibleClinics.includes(normalizedClinicLocation)) {
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
    async findAppointmentById(appointmentId, userRole = null, userClinics = []) {
        try {
            await this.ensureReady();
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

            const accessibleClinics = this.getAccessibleClinics(userRole, userClinics);
            const db = this.validateDatabase();

            // Get appointment from flat structure
            const appointmentRef = doc(db, 'appointments', appointmentId);
            const appointmentSnap = await getDoc(appointmentRef);

            if (appointmentSnap.exists()) {
                const appointmentData = appointmentSnap.data();

                // STRICT permission check
                const normalizedClinicLocation = (appointmentData.clinicLocation || '').toLowerCase().replace(/\s+/g, '-');

                if (accessibleClinics.includes(normalizedClinicLocation)) {
                    return {
                        id: appointmentSnap.id,
                        ...appointmentData
                    };
                } else {
                    console.error(`Find denied: User clinics [${accessibleClinics.join(', ')}] does not include "${normalizedClinicLocation}"`);
                    throw new Error('No permission to access this appointment');
                }
            }

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
                        id: doc.id,
                        ...data
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
                    appointments.push({
                        id: doc.id,
                        ...doc.data()
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
        if (!locationName) return 'arcadia'; // default
        return locationName.toLowerCase().replace(/\s+/g, '-');
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

                    pendingAppointments.push({
                        id: doc.id,
                        ...data,
                        // Convert Firebase timestamp to readable format
                        time: appointmentDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false}),
                        dateKey: appointmentDate.toISOString().split('T')[0], // YYYY-MM-DD format
                        location: data.clinicLocation,
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
                records.push({
                    id: doc.id,
                    ...doc.data()
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