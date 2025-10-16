// Global Data Manager - Unified data source for all pages
// Now integrated with Firebase for real-time data

class GlobalDataManager {
    constructor() {
        this.storageKey = 'dental_clinic_data';
        this.useFirebase = true;
        this.firebaseService = null;
        this.init();
    }

    // Initialize data structure
    init() {
        // Initialize localStorage fallback data
        const stored = this.loadFromStorage();
        if (!stored) {
            this.data = this.getDefaultData();
            this.saveToStorage();
        } else {
            // Check if data needs to be updated for hourly time slots
            const currentVersion = stored.metadata?.version;
            const requiresTimeUpdate = currentVersion !== '1.2.0'; // New version for multi-appointment testing

            if (requiresTimeUpdate) {
                this.data = this.getDefaultData(); // Use new data with hourly slots
                this.data.metadata.version = '1.2.0'; // Update version
                this.saveToStorage();
            } else {
                this.data = stored;
            }
        }

        // Initialize Firebase service when available
        this.initFirebaseService();
    }

    // Initialize Firebase service
    initFirebaseService() {
        // Wait for Firebase service to be available
        const checkFirebaseService = () => {
            if (window.firebaseDataService) {
                this.firebaseService = window.firebaseDataService;
                console.log('✅ GlobalDataManager connected to Firebase');
            } else {
                // Check again after a short delay
                setTimeout(checkFirebaseService, 200);
            }
        };
        checkFirebaseService();
    }

    // Default data structure - Fixed to use only hourly time slots
    getDefaultData() {
        return {
            patientProfiles: {
                 'Sarah Johnson': {
                     detailedInfo: {
                        address: '123 Main St',
                         emergency: 'John Doe (626) 555-0111', 
                         dateOfBirth: '1985-03-15',
                         age: '39',
                         gender: 'Female',
                         firstVisit: '2023-01-12',
                         allergies: 'Penicillin',
                         medications: 'Lisinopril 10mg',
                         conditions: 'Hypertension',
                         medicalNotes: 'Patient notes from consultations'
                     },
                     lastUpdated: '2025-09-11T10:00:00Z'
                 }
            },
            
            appointments: {
                // Example appointment data structure:
                // 'YYYY-MM-DD': [
                //     {
                //         id: 'unique_id',
                //         patientName: 'Patient Name',
                //         service: 'Service Type',
                //         time: 'HH:MM',
                //         status: 'scheduled|arrived|completed|no-show|cancelled|held',
                //         location: 'Location Name',
                //         phone: '(XXX) XXX-XXXX',
                //         email: 'patient@email.com',
                //         notes: 'Additional notes',
                //         createdAt: 'ISO timestamp'
                //     }
                // ]
            },
            pendingConfirmations: [
                // Example pending confirmation structure:
                // {
                //     id: 'unique_id',
                //     patientName: 'Patient Name',
                //     dateTime: 'Display format',
                //     service: 'Service Type',
                //     location: 'Location Name',
                //     phone: '(XXX) XXX-XXXX',
                //     email: 'patient@email.com',
                //     notes: 'Request notes',
                //     createdAt: 'ISO timestamp'
                // }
            ],
            cancelledAppointments: {},
            patients: {}, // Will be populated as needed
            clinicInfo: {
                locations: ['Arcadia', 'Irvine', 'South Pasadena', 'Rowland Heights', 'Eastvale'],
                services: [
                    'General', 'Implant', 'Extraction', 
                    'Preventive', 'Cosmetic', 'Restorations', 
                    'Root Canals', 'Orthodontics', 'Periodontics'
                ],
                timeSlots: [
                    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
                    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
                ]
            },
            userConfig: {
                currentUser: 'boss',
                users: {
                boss: {
                    name: 'Sunnie',
                    role: 'boss',
                    accessibleLocations: ['arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale'],
                    currentViewLocation: 'arcadia'
                },
                admin_south_pasadena: {
                    name: 'Lisa',
                    role: 'admin',
                    assignedLocation: 'south-pasadena',
                    accessibleLocations: ['south-pasadena']
                },
                admin_rowland_heights: {
                    name: 'Lily', // Admin name
                    role: 'admin', 
                    assignedLocation: 'rowland-heights',
                    accessibleLocations: ['rowland-heights']
                },
                admin_arcadia: {
                    name: 'Lucy', // Admin name
                    role: 'admin',
                    assignedLocation: 'arcadia',
                    accessibleLocations: ['arcadia']
                },
                admin_irvine: {
                    name: 'Jane', // Admin name
                    role: 'admin',
                    assignedLocation: 'irvine', 
                    accessibleLocations: ['irvine']
                },
                admin_eastvale: {
                    name: 'Emma', // Admin name
                    role: 'admin',
                    assignedLocation: 'eastvale', 
                    accessibleLocations: ['eastvale']
                }
            }
        },
            metadata: {
                version: '1.2.0', // Updated version for multi-appointment testing
                lastUpdated: new Date().toISOString(),
                nextAppointmentId: 100
            }
        };
    }

    // Load data from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            return null;
        }
    }

    // Save data to localStorage
    saveToStorage() {
        try {
            this.data.metadata.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
        }
    }

    // Generate unique ID
    generateId(prefix = 'app') {
        const id = `${prefix}_${this.data.metadata.nextAppointmentId++}`;
        this.saveToStorage();
        return id;
    }

    // === APPOINTMENT METHODS ===
    
   // Get appointments for a specific date (with caching)
    async getAppointmentsForDate(dateKey) {
        if (this.useFirebase && this.firebaseService) {
            try {
                // 1. Check cache first
                if (window.cacheManager) {
                    const cached = window.cacheManager.getDateCache(dateKey);
                    if (cached) {
                        return cached;
                    }
                }

                // 2. Cache miss - query Firebase
                const currentUser = this.getCurrentUser();
                const userRole = currentUser.role;
                const userClinics = this.getUserClinics(currentUser);

                const data = await this.firebaseService.getAppointmentsForDate(dateKey, userRole, userClinics);

                // 3. Store in cache
                if (window.cacheManager && data) {
                    window.cacheManager.setDateCache(dateKey, data);
                }

                return data;
            } catch (error) {
                console.warn('Firebase failed, falling back to localStorage:', error);
                return this.getAppointmentsForDateLocal(dateKey);
            }
        } else {
            return this.getAppointmentsForDateLocal(dateKey);
        }
    }

    // Get appointments for an entire month (optimized for calendar views)
    async getAppointmentsForMonth(year, month) {
        // Calculate start and end dates for the month
        const startDate = new Date(year, month - 1, 1); // month is 1-based
        const endDate = new Date(year, month, 0); // Last day of the month

        const startDateKey = startDate.toISOString().split('T')[0];
        const endDateKey = endDate.toISOString().split('T')[0];

        if (this.useFirebase && this.firebaseService) {
            try {
                const currentUser = this.getCurrentUser();
                const userRole = currentUser.role;
                const userClinics = this.getUserClinics(currentUser);

                console.log(`Getting appointments for month: ${year}-${month.toString().padStart(2, '0')} (${startDateKey} to ${endDateKey})`);

                const appointmentsByDate = await this.firebaseService.getAppointmentsForDateRange(
                    startDateKey,
                    endDateKey,
                    userRole,
                    userClinics
                );

                return appointmentsByDate;
            } catch (error) {
                console.warn('Firebase failed, falling back to localStorage for month data:', error);
                return this.getAppointmentsForMonthLocal(year, month);
            }
        } else {
            return this.getAppointmentsForMonthLocal(year, month);
        }
    }

    // Local storage fallback for getAppointmentsForMonth
    getAppointmentsForMonthLocal(year, month) {
        const appointmentsByDate = {};
        const currentUser = this.getCurrentUser();

        // Generate all dates in the month
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayAppointments = this.getAppointmentsForDateLocal(dateKey);

            if (dayAppointments.length > 0) {
                appointmentsByDate[dateKey] = dayAppointments;
            }
        }

        console.log(`Local storage: Found appointments for ${Object.keys(appointmentsByDate).length} days in month ${year}-${month.toString().padStart(2, '0')}`);
        return appointmentsByDate;
    }

    // Local storage fallback for getAppointmentsForDate
    getAppointmentsForDateLocal(dateKey) {
        const appointments = this.data.appointments[dateKey] || [];
        const currentUser = this.getCurrentUser();

        // Filter out pending, cancelled, and declined appointments for Calendar views
        const filteredAppointments = appointments.filter(app =>
            app.status !== 'pending' &&
            app.status !== 'cancelled' &&
            app.status !== 'declined'
        );

        // If admin, only return appointments for their own clinic
        if (currentUser.role === 'admin') {
            const adminLocation = currentUser.assignedLocation;
            // Convert to title case format for matching
            const formattedLocation = adminLocation.split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            return filteredAppointments.filter(app => app.location === formattedLocation);
        }

        // Boss can see all appointments
        return filteredAppointments;
    }


    // Get all appointments (with caching)
    async getAllAppointments() {
        if (this.useFirebase && this.firebaseService) {
            try {
                // 1. Check cache first
                if (window.cacheManager) {
                    const cached = window.cacheManager.getAllCache();
                    if (cached) {
                        return cached;
                    }
                }

                // 2. Cache miss - query Firebase
                const currentUser = this.getCurrentUser();
                const userRole = currentUser.role;
                const userClinics = this.getUserClinics(currentUser);

                const appointments = await this.firebaseService.getAllAppointments(userRole, userClinics);

                // Ensure we return an array
                if (Array.isArray(appointments)) {
                    // 3. Store in cache
                    if (window.cacheManager) {
                        window.cacheManager.setAllCache(appointments);
                    }
                    return appointments;
                } else {
                    console.warn('Firebase getAllAppointments did not return an array:', appointments);
                    return this.getAllAppointmentsLocal();
                }
            } catch (error) {
                console.warn('Firebase failed, falling back to localStorage:', error);
                return this.getAllAppointmentsLocal();
            }
        } else {
            return this.getAllAppointmentsLocal();
        }
    }

    // Local storage fallback for getAllAppointments
    getAllAppointmentsLocal() {
        const all = [];
        const currentUser = this.getCurrentUser();

        Object.keys(this.data.appointments).forEach(dateKey => {
            let appointments = this.data.appointments[dateKey];

            // Ensure appointments is an array
            if (!Array.isArray(appointments)) {
                console.warn(`Appointments for date ${dateKey} is not an array:`, appointments);
                return;
            }

            // If admin, filter to show only their own clinic
            if (currentUser.role === 'admin') {
                const adminLocation = currentUser.assignedLocation;
                const formattedLocation = adminLocation.split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                appointments = appointments.filter(app => app.location === formattedLocation);
            }

            appointments.forEach(appointment => {
                all.push({ ...appointment, dateKey });
            });
        });
        return all;
    }

    // Get user clinics for Firebase filtering
    getUserClinics(user) {
        if (user.role === 'boss' || user.role === 'owner') {
            return ['arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale'];
        } else {
            return user.assignedLocation ? [user.assignedLocation] : [];
        }
    }

    // Add new appointment
    async addAppointment(appointmentData) {
        if (this.useFirebase && this.firebaseService) {
            try {
                const currentUser = this.getCurrentUser();
                const userRole = currentUser.role;
                const userClinics = this.getUserClinics(currentUser);

                const result = await this.firebaseService.addAppointment(appointmentData, userRole, userClinics);

                // Invalidate cache after adding
                if (window.cacheManager) {
                    window.cacheManager.onAppointmentCreated(appointmentData.date);
                }

                return result;
            } catch (error) {
                console.warn('Firebase failed, falling back to localStorage:', error);
                return this.addAppointmentLocal(appointmentData);
            }
        } else {
            return this.addAppointmentLocal(appointmentData);
        }
    }

    // Local storage fallback for addAppointment
    addAppointmentLocal(appointmentData) {
        try {
            const appointment = {
                id: this.generateId('app'),
                patientName: appointmentData.patientName,
                service: appointmentData.service,
                time: appointmentData.time,
                status: 'scheduled',
                location: appointmentData.location,
                phone: appointmentData.phone || '',
                email: appointmentData.email || `${appointmentData.patientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
                notes: appointmentData.notes || '',
                createdAt: new Date().toISOString()
            };

            const dateKey = appointmentData.date;
            if (!this.data.appointments[dateKey]) {
                this.data.appointments[dateKey] = [];
            }

            this.data.appointments[dateKey].push(appointment);
            this.saveToStorage();

            return appointment;
        } catch (error) {
            throw error;
        }
    }

    // Update appointment status
    async updateAppointmentStatus(appointmentId, newStatus, additionalData = {}) {
        if (this.useFirebase && this.firebaseService) {
            try {
                const currentUser = this.getCurrentUser();
                const userRole = currentUser.role;
                const userClinics = this.getUserClinics(currentUser);

                // Find the appointment to get its date before updating
                const appointment = await this.firebaseService.findAppointmentById(appointmentId, userRole, userClinics);
                const dateKey = appointment?.dateKey || appointment?.date;

                const result = await this.firebaseService.updateAppointmentStatus(appointmentId, newStatus, additionalData, userRole, userClinics);

                // Invalidate cache after updating
                if (window.cacheManager && dateKey) {
                    window.cacheManager.onAppointmentUpdated(dateKey, newStatus);
                }

                return result;
            } catch (error) {
                console.warn('Firebase failed, falling back to localStorage:', error);
                return this.updateAppointmentStatusLocal(appointmentId, newStatus, additionalData);
            }
        } else {
            return this.updateAppointmentStatusLocal(appointmentId, newStatus, additionalData);
        }
    }

    // Update appointment data (not just status)
    async updateAppointment(appointmentId, updatedData) {
        if (this.useFirebase && this.firebaseService) {
            try {
                const currentUser = this.getCurrentUser();
                const userRole = currentUser.role;
                const userClinics = this.getUserClinics(currentUser);

                // Find the appointment to get its date
                const appointment = await this.firebaseService.findAppointmentById(appointmentId, userRole, userClinics);
                const dateKey = appointment?.dateKey || appointment?.date || updatedData?.date;

                const result = await this.firebaseService.updateAppointment(appointmentId, updatedData, userRole, userClinics);

                // Invalidate cache after updating
                if (window.cacheManager && dateKey) {
                    window.cacheManager.onAppointmentUpdated(dateKey, updatedData.status || appointment?.status);
                }

                return result;
            } catch (error) {
                console.warn('Firebase failed, falling back to localStorage:', error);
                return this.updateAppointmentLocal(appointmentId, updatedData);
            }
        } else {
            return this.updateAppointmentLocal(appointmentId, updatedData);
        }
    }

    // Local storage fallback for updateAppointment
    updateAppointmentLocal(appointmentId, updatedData) {
        try {
            let found = false;

            // Find and update the appointment in regular appointments
            Object.keys(this.data.appointments).forEach(dateKey => {
                const appointments = this.data.appointments[dateKey];
                const index = appointments.findIndex(app => app.id === appointmentId);

                if (index !== -1) {
                    // Update the appointment with new data
                    this.data.appointments[dateKey][index] = {
                        ...this.data.appointments[dateKey][index],
                        ...updatedData,
                        lastUpdated: new Date().toISOString()
                    };
                    found = true;
                }
            });

            // If not found in regular appointments, check pending confirmations
            if (!found && this.data.pendingConfirmations) {
                const pendingIndex = this.data.pendingConfirmations.findIndex(conf => conf.id === appointmentId);
                if (pendingIndex !== -1) {
                    this.data.pendingConfirmations[pendingIndex] = {
                        ...this.data.pendingConfirmations[pendingIndex],
                        ...updatedData,
                        lastUpdated: new Date().toISOString()
                    };
                    found = true;
                }
            }

            if (found) {
                this.saveData();
                return true;
            } else {
                throw new Error('Appointment not found');
            }
        } catch (error) {
            console.error('Error updating appointment locally:', error);
            throw error;
        }
    }

    // Local storage fallback for updateAppointmentStatus
    updateAppointmentStatusLocal(appointmentId, newStatus, additionalData = {}) {
        try {
            let found = false;

            // Find and update the appointment
            Object.keys(this.data.appointments).forEach(dateKey => {
                const appointments = this.data.appointments[dateKey];
                const index = appointments.findIndex(app => app.id === appointmentId);

                if (index !== -1) {
                    if (newStatus === 'cancelled') {
                        // Move to cancelled appointments
                        const appointment = { ...appointments[index] };
                        appointment.status = 'cancelled';
                        appointment.cancelledAt = new Date().toISOString();
                        appointment.cancelReason = additionalData.reason || 'Unknown';
                        appointment.cancelNotes = additionalData.notes || '';

                        if (!this.data.cancelledAppointments[dateKey]) {
                            this.data.cancelledAppointments[dateKey] = [];
                        }
                        this.data.cancelledAppointments[dateKey].push(appointment);

                        // Remove from active appointments
                        appointments.splice(index, 1);
                    } else {
                        // Update status
                        appointments[index].status = newStatus;
                        appointments[index].lastUpdated = new Date().toISOString();
                    }
                    found = true;
                }
            });

            if (found) {
                this.saveToStorage();
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
     // New user management methods
    getCurrentUser() {
    // First check localStorage for mock login user (from mock-login.html)
    try {
        const mockUser = localStorage.getItem('currentUser');
        if (mockUser) {
            const parsedUser = JSON.parse(mockUser);
            console.log('🔍 Using mock login user:', parsedUser);
            return parsedUser;
        }
    } catch (error) {
        console.warn('Failed to parse mock user from localStorage:', error);
    }

    // Fallback to internal data-manager config
    if (!this.data || !this.data.userConfig || !this.data.userConfig.users) {
        console.warn('⚠️ No user config found, defaulting to boss');
        return {
            name: 'Sunny',
            role: 'boss',
            currentViewLocation: 'arcadia',
            assignedLocation: 'arcadia'
        };
    }

    const currentUserId = this.data.userConfig.currentUser;
    const user = this.data.userConfig.users[currentUserId];

    if (!user) {
        console.warn('⚠️ User not found in config, defaulting to boss');
        return this.data.userConfig.users.boss;
    }

    return user;
}

    switchUser(userId) {
        this.data.userConfig.currentUser = userId;
        this.saveToStorage();
    }

    switchLocation(locationId) {
        const user = this.getCurrentUser();
        if (user.role === 'boss') {
            user.currentViewLocation = locationId;
            this.saveToStorage();
        }
    }

    // Delete appointment
    async deleteAppointment(appointmentId) {
        if (this.useFirebase && this.firebaseService) {
            try {
                const currentUser = this.getCurrentUser();
                const userRole = currentUser.role;
                const userClinics = this.getUserClinics(currentUser);

                return await this.firebaseService.deleteAppointment(appointmentId, userRole, userClinics);
            } catch (error) {
                console.warn('Firebase failed, falling back to localStorage:', error);
                return this.deleteAppointmentLocal(appointmentId);
            }
        } else {
            return this.deleteAppointmentLocal(appointmentId);
        }
    }

    // Local storage fallback for deleteAppointment
    deleteAppointmentLocal(appointmentId) {
        try {
            let found = false;

            Object.keys(this.data.appointments).forEach(dateKey => {
                const appointments = this.data.appointments[dateKey];
                const index = appointments.findIndex(app => app.id === appointmentId);

                if (index !== -1) {
                    appointments.splice(index, 1);
                    found = true;
                }
            });

            if (found) {
                this.saveToStorage();
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // === PENDING CONFIRMATIONS METHODS ===
    
    // Get pending confirmations - Updated to use Firebase pending appointments
    async getPendingConfirmations() {
        if (this.useFirebase && this.firebaseService) {
            try {
                const currentUser = this.getCurrentUser();
                const userRole = currentUser.role;
                const userClinics = this.getUserClinics(currentUser);

                console.log('📋 getPendingConfirmations - Current user:', currentUser);
                console.log('📋 getPendingConfirmations - User clinics:', userClinics);

                // Get pending appointments from Firebase
                const pendingAppointments = await this.firebaseService.getAllAppointments(userRole, userClinics);
                console.log('📋 getPendingConfirmations - All appointments from Firebase:', pendingAppointments.length);

                // Filter for pending status
                const pending = pendingAppointments.filter(appointment => appointment.status === 'pending');
                console.log('📋 getPendingConfirmations - Pending appointments before conversion:', pending.length);

                if (pending.length > 0) {
                    console.log('📋 Sample pending appointment:', pending[0]);
                }

                // Convert to confirmation format
                const pendingConfirmations = pending.map(appointment => this.convertAppointmentToConfirmation(appointment));

                console.log('📋 getPendingConfirmations - Final confirmations:', pendingConfirmations.length);
                if (pendingConfirmations.length > 0) {
                    console.log('📋 Sample confirmation:', pendingConfirmations[0]);
                }

                return pendingConfirmations;
            } catch (error) {
                console.warn('Firebase failed, falling back to localStorage:', error);
                return this.data.pendingConfirmations || [];
            }
        } else {
            return this.data.pendingConfirmations || [];
        }
    }

    // Convert Firebase appointment to confirmation format
    convertAppointmentToConfirmation(appointment) {
        // Handle Firebase timestamp objects
        let appointmentDate;
        if (appointment.appointmentDateTime && appointment.appointmentDateTime.seconds) {
            // Firebase timestamp object - convert to JavaScript Date
            appointmentDate = new Date(appointment.appointmentDateTime.seconds * 1000);
        } else if (appointment.appointmentDateTime) {
            // Regular Date object or string
            appointmentDate = new Date(appointment.appointmentDateTime);
        } else {
            appointmentDate = new Date();
        }

        const dateStr = appointmentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const timeStr = appointment.appointmentTime || appointmentDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        // Get and normalize location - keep it in title case format for display
        let location = appointment.location || appointment.clinicLocation || appointment.clinicName || 'Unknown';

        // Normalize location format: "arcadia" -> "Arcadia", "south-pasadena" -> "South Pasadena"
        if (location && typeof location === 'string') {
            // Handle hyphenated locations like "south-pasadena"
            location = location.split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }

        console.log('🔄 convertAppointmentToConfirmation - location mapping:', {
            original: appointment.location || appointment.clinicLocation,
            normalized: location
        });

        return {
            id: appointment.id,
            patientName: appointment.patientName,
            dateTime: `${dateStr} ${timeStr}`,
            service: appointment.service || appointment.serviceType || appointment.serviceName || 'General',
            location: location,
            phone: appointment.phone || appointment.patientPhone || '',
            email: appointment.email || appointment.patientEmail || '',
            notes: appointment.notes || appointment.description || '',
            createdAt: appointment.createdAt || new Date().toISOString()
        };
    }

    // Add pending confirmation
    addPendingConfirmation(confirmationData) {
        try {
            const confirmation = {
                id: this.generateId('pending'),
                ...confirmationData,
                createdAt: new Date().toISOString()
            };

            this.data.pendingConfirmations.push(confirmation);
            this.saveToStorage();
            return confirmation;
        } catch (error) {
            throw error;
        }
    }

    // Remove pending confirmation
    async removePendingConfirmation(confirmationId) {
        if (this.useFirebase && this.firebaseService) {
            try {
                return await this.firebaseService.removePendingConfirmation(confirmationId);
            } catch (error) {
                console.warn('Firebase failed, falling back to localStorage:', error);
                return this.removePendingConfirmationLocal(confirmationId);
            }
        } else {
            return this.removePendingConfirmationLocal(confirmationId);
        }
    }

    // Local storage fallback for removePendingConfirmation
    removePendingConfirmationLocal(confirmationId) {
        try {
            const index = this.data.pendingConfirmations.findIndex(conf => conf.id === confirmationId);
            if (index !== -1) {
                this.data.pendingConfirmations.splice(index, 1);
                this.saveToStorage();
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // === CANCELLED APPOINTMENTS METHODS ===
    
    // Get cancelled appointments
    async getCancelledAppointments() {
        if (this.useFirebase && this.firebaseService) {
            try {
                // 1. Check cache first
                if (window.cacheManager) {
                    const cached = window.cacheManager.getCancelledCache();
                    if (cached) {
                        return cached;
                    }
                }

                // 2. Cache miss - query Firebase
                const currentUser = this.getCurrentUser();
                const userRole = currentUser.role;
                const userClinics = this.getUserClinics(currentUser);

                const data = await this.firebaseService.getCancelledAppointments(userRole, userClinics);

                // 3. Store in cache
                if (window.cacheManager && data) {
                    window.cacheManager.setCancelledCache(data);
                }

                return data;
            } catch (error) {
                console.warn('Firebase failed, falling back to localStorage:', error);
                return this.getCancelledAppointmentsLocal();
            }
        } else {
            return this.getCancelledAppointmentsLocal();
        }
    }

    // Local storage fallback for getCancelledAppointments
    getCancelledAppointmentsLocal() {
        const all = [];
        Object.keys(this.data.cancelledAppointments).forEach(dateKey => {
            this.data.cancelledAppointments[dateKey].forEach(appointment => {
                all.push({ ...appointment, dateKey });
            });
        });
        return all;
    }

    // === PATIENT METHODS ===
    
    // Get unique patients from appointments
    getPatients() {
        const patients = new Map();
        
        // Get from active appointments
        this.getAllAppointments().forEach(appointment => {
            const key = appointment.patientName.toLowerCase();
            if (!patients.has(key)) {
                patients.set(key, {
                    id: appointment.patientName.toLowerCase().replace(/\s+/g, '_'),
                    name: appointment.patientName,
                    phone: appointment.phone,
                    email: appointment.email,
                    appointments: []
                });
            }
            patients.get(key).appointments.push(appointment);
        });

        // Get from cancelled appointments
        this.getCancelledAppointments().forEach(appointment => {
            const key = appointment.patientName.toLowerCase();
            if (!patients.has(key)) {
                patients.set(key, {
                    id: appointment.patientName.toLowerCase().replace(/\s+/g, '_'),
                    name: appointment.patientName,
                    phone: appointment.phone,
                    email: appointment.email,
                    appointments: []
                });
            }
            patients.get(key).appointments.push(appointment);
        });

        return Array.from(patients.values());
    }

    // === UTILITY METHODS ===
    
    // Get clinic info
    getClinicInfo() {
        return this.data.clinicInfo;
    }

    // Clear all data (for testing)
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        this.init();
    }
    
    // Force reset to latest data structure (for updates)
    forceReset() {
        localStorage.removeItem(this.storageKey);
        this.data = this.getDefaultData();
        this.saveToStorage();
    }

    // Export data (for backup)
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    // Import data (for restore)
    importData(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            this.data = imported;
            this.saveToStorage();
            return true;
        } catch (error) {
            return false;
        }
    }

    // Get statistics
    getStatistics() {
        const allAppointments = this.getAllAppointments();
        const today = new Date().toISOString().split('T')[0];
        
        return {
            totalAppointments: allAppointments.length,
            todayAppointments: this.getAppointmentsForDate(today).length,
            pendingConfirmations: this.data.pendingConfirmations.length,
            cancelledAppointments: this.getCancelledAppointments().length,
            totalPatients: this.getPatients().length,
            statusBreakdown: this.getStatusBreakdown(),
            locationBreakdown: this.getLocationBreakdown()
        };
    }

    // Get status breakdown
    getStatusBreakdown() {
        const breakdown = {};
        this.getAllAppointments().forEach(appointment => {
            breakdown[appointment.status] = (breakdown[appointment.status] || 0) + 1;
        });
        return breakdown;
    }

    // Get location breakdown
    getLocationBreakdown() {
        const breakdown = {};
        this.getAllAppointments().forEach(appointment => {
            breakdown[appointment.location] = (breakdown[appointment.location] || 0) + 1;
        });
        return breakdown;
    }
}

// Create global instance
const dataManager = new GlobalDataManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalDataManager;
} else {
    window.dataManager = dataManager;
}

