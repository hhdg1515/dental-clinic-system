// Firebase Data Service for Admin Panel
// Handles all Firestore operations for appointment and patient data

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getCountFromServer,
  Timestamp,
  deleteField,
  serverTimestamp,
  type QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';
import {
  appointmentsCache,
  patientsCache,
  dentalChartsCache,
  cacheKeys,
  cachedQuery,
  invalidateAppointmentCaches,
  invalidatePatientCaches,
  invalidateDentalChartCaches
} from '../utils/queryCache';
import type {
  Appointment,
  AppointmentInput,
  AppointmentsByDate,
  AppointmentStatus,
  ClinicId,
  ClinicInfo,
  PendingConfirmation,
  CancelledAppointment,
  PatientProfile,
  DentalChart,
  ToothData,
  ToothStatus,
  ToothCondition,
  ToothSeverity,
  ToothSurface,
  TreatmentRecord,
  ToothAttachment,
  DetailedToothStatus,
  PeriodontalData,
  PeriodontalSummary,
  DentalChartSnapshot,
  ChartComparison,
  MedicalRecord,
  MedicalImage,
  UserRole
} from '../types';

// ==================== CONSTANTS ====================

export const CLINIC_LOCATIONS: ClinicId[] = [
  'arcadia',
  'irvine',
  'south-pasadena',
  'rowland-heights',
  'eastvale'
];

export const CLINIC_DISPLAY_NAMES: Record<ClinicId, string> = {
  'arcadia': 'Arcadia',
  'irvine': 'Irvine',
  'south-pasadena': 'South Pasadena',
  'rowland-heights': 'Rowland Heights',
  'eastvale': 'Eastvale'
};

const VALID_TOOTH_STATUSES: ToothStatus[] = [
  'healthy', 'monitor', 'cavity', 'filled', 'missing', 'implant', 'root-canal', 'post-op', 'urgent'
];

const VALID_CONDITIONS: ToothCondition[] = [
  'healthy', 'monitor', 'cavity', 'filled', 'missing', 'implant', 'root-canal', 'post-op'
];

const VALID_SEVERITIES: ToothSeverity[] = ['none', 'mild', 'moderate', 'severe', 'urgent'];

const VALID_SURFACES: ToothSurface[] = ['occlusal', 'buccal', 'lingual', 'mesial', 'distal'];

// ==================== UTILITY FUNCTIONS ====================

/**
 * Normalize clinic ID from various formats
 */
export function normalizeClinicId(value: string | null | undefined): ClinicId | null {
  if (!value) return null;

  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;

  if (raw.includes('arcadia')) return 'arcadia';
  if (raw.includes('rowland')) return 'rowland-heights';
  if (raw.includes('pasadena')) return 'south-pasadena';
  if (raw.includes('irvine')) return 'irvine';
  if (raw.includes('eastvale')) return 'eastvale';

  // Check if it's already a valid clinic ID
  if (CLINIC_LOCATIONS.includes(raw as ClinicId)) {
    return raw as ClinicId;
  }

  return null;
}

/**
 * Get display name from clinic ID
 */
export function getClinicDisplayName(clinicId: ClinicId): string {
  return CLINIC_DISPLAY_NAMES[clinicId] || clinicId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalize appointment status
 */
export function normalizeStatus(status: string | null | undefined): AppointmentStatus {
  if (!status) return 'scheduled';

  const statusMap: Record<string, AppointmentStatus> = {
    'confirmed': 'scheduled',
    'scheduled': 'scheduled',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'pending': 'pending',
    'declined': 'declined',
    'arrived': 'arrived',
    'no-show': 'no-show'
  };

  return statusMap[status.toLowerCase()] || 'scheduled';
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;

function toCleanString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function looksLikeDate(value: string): boolean {
  return DATE_PATTERN.test(value);
}

function looksLikeTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

function extractTimeToken(value: string): string {
  const match = value.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
  return match ? match[0] : '';
}

function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7;
}

function looksLikeName(value: string): boolean {
  if (!value) return false;
  if (looksLikeDate(value) || looksLikeTime(value)) return false;
  if (looksLikePhone(value)) return false;
  return /[A-Za-z\u4e00-\u9fff]/.test(value);
}

function resolvePatientName(data: Record<string, unknown>): string {
  const candidates = [
    data.patientName,
    data.name,
    data.fullName,
    data.customerName,
    data.patient,
    data.contactName,
    data.patient_name,
    data.dateKey,
    data.appointmentDate,
    data.date
  ]
    .map(toCleanString)
    .filter(Boolean);

  const named = candidates.find(looksLikeName);
  if (named) return named;

  return candidates.find(value => !looksLikeDate(value) && !looksLikeTime(value)) || '';
}

function resolvePatientPhone(data: Record<string, unknown>): string {
  const candidates = [
    data.phone,
    data.patientPhone,
    data.contactPhone,
    data.mobile,
    data.tel,
    data.phoneNumber
  ]
    .map(toCleanString)
    .filter(Boolean);

  const phone = candidates.find(looksLikePhone);
  return phone || '';
}

function resolveAppointmentTime(data: Record<string, unknown>): string {
  const candidates = [
    data.time,
    data.appointmentTime,
    data.timeSlot,
    data.appointment_time,
    data.patientName,
    data.phone
  ]
    .map(toCleanString)
    .filter(Boolean);

  for (const candidate of candidates) {
    if (looksLikeTime(candidate)) return candidate;
    const extracted = extractTimeToken(candidate);
    if (extracted) return extracted;
  }

  const dateTime = data.appointmentDateTime as { toDate?: () => Date } | Date | string | undefined;
  if (dateTime && typeof (dateTime as { toDate?: () => Date }).toDate === 'function') {
    const dateObj = (dateTime as { toDate: () => Date }).toDate();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  if (dateTime instanceof Date) {
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  if (typeof dateTime === 'string' && dateTime.trim()) {
    const parsed = new Date(dateTime);
    if (!Number.isNaN(parsed.getTime())) {
      const hours = String(parsed.getHours()).padStart(2, '0');
      const minutes = String(parsed.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }

  return '';
}

function resolveAppointmentDateKey(data: Record<string, unknown>): string {
  const candidates = [
    data.dateKey,
    data.appointmentDate,
    data.date,
    data.appointment_date,
    data.patientName,
    data.name
  ]
    .map(toCleanString)
    .filter(Boolean);

  for (const candidate of candidates) {
    if (looksLikeDate(candidate)) return candidate;
    const parsedCandidate = new Date(candidate);
    if (!Number.isNaN(parsedCandidate.getTime())) {
      const year = parsedCandidate.getFullYear();
      const month = String(parsedCandidate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedCandidate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  const dateTime = data.appointmentDateTime as { toDate?: () => Date } | Date | string | undefined;
  if (dateTime && typeof (dateTime as { toDate?: () => Date }).toDate === 'function') {
    const dateObj = (dateTime as { toDate: () => Date }).toDate();
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (dateTime instanceof Date) {
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof dateTime === 'string' && dateTime.trim()) {
    const parsed = new Date(dateTime);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return '';
}

/**
 * Get accessible clinics based on user role
 */
export function getAccessibleClinics(userRole: UserRole | null, userClinics: string[]): ClinicId[] {
  if (userRole === 'boss' || userRole === 'owner') {
    return CLINIC_LOCATIONS;
  }

  const normalized = userClinics
    .map(clinic => normalizeClinicId(clinic))
    .filter((clinic): clinic is ClinicId => clinic !== null);

  return Array.from(new Set(normalized));
}

/**
 * Resolve clinic info from appointment data
 */
function resolveClinicInfo(data: Record<string, unknown>): ClinicInfo {
  const rawLocation =
    data?.clinicLocation ??
    data?.clinicId ??
    data?.location ??
    data?.clinic ??
    data?.clinicName ??
    '';

  const clinicKey = normalizeClinicId(rawLocation as string);

  return {
    key: clinicKey,
    label: clinicKey ? getClinicDisplayName(clinicKey) : String(rawLocation || '')
  };
}

/**
 * Validate tooth number (1-32)
 */
function validateToothNumber(toothNum: number | string): number {
  const num = typeof toothNum === 'string' ? parseInt(toothNum, 10) : toothNum;
  if (isNaN(num) || num < 1 || num > 32) {
    throw new Error(`Invalid tooth number: ${toothNum}. Must be 1-32.`);
  }
  return num;
}

/**
 * Validate tooth status
 */
function validateToothStatus(status: string): ToothStatus {
  if (!VALID_TOOTH_STATUSES.includes(status as ToothStatus)) {
    throw new Error(`Invalid tooth status: ${status}. Must be one of: ${VALID_TOOTH_STATUSES.join(', ')}`);
  }
  return status as ToothStatus;
}

/**
 * Validate periodontal depth (0-15mm)
 */
function validatePeriodontalDepth(depth: number | string): number {
  const num = typeof depth === 'string' ? parseInt(depth, 10) : depth;
  if (isNaN(num) || num < 0 || num > 15) {
    throw new Error(`Invalid periodontal depth: ${depth}. Must be 0-15mm.`);
  }
  return num;
}

/**
 * Convert file to Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Create appointment timestamp from date and time strings
 */
function createAppointmentTimestamp(dateString: string, timeString: string): Timestamp {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  const appointmentDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Timestamp.fromDate(appointmentDate);
}

// ==================== APPOINTMENT SERVICE ====================

/**
 * Get appointments for a specific date
 */
export async function getAppointmentsForDate(
  dateKey: string,
  userRole: UserRole | null = null,
  userClinics: string[] = [],
  includeAllStatuses = false
): Promise<Appointment[]> {
  try {
    const accessibleClinics = getAccessibleClinics(userRole, userClinics);
    const clinicSet = new Set(accessibleClinics);

    const appointmentsRef = collection(db, 'appointments');
    const q = query(appointmentsRef, where('appointmentDate', '==', dateKey));
    const querySnapshot = await getDocs(q);

    const appointments: Appointment[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Filter by accessible clinics
      const clinicInfo = resolveClinicInfo(data);
      if (!clinicInfo.key || !clinicSet.has(clinicInfo.key)) {
        return;
      }

      // Filter out cancelled and declined unless including all
      if (!includeAllStatuses && (data.status === 'cancelled' || data.status === 'declined')) {
        return;
      }

      // Extract time and date
      let extractedTime = '';
      let extractedDateKey = dateKey;

      if (data.appointmentTime) {
        extractedTime = data.appointmentTime;
      } else if (data.appointmentDateTime) {
        const dateObj = data.appointmentDateTime.toDate();
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        extractedTime = `${hours}:${minutes}`;
      }

      if (data.appointmentDate) {
        extractedDateKey = data.appointmentDate;
      } else if (data.appointmentDateTime) {
        const dateObj = data.appointmentDateTime.toDate();
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        extractedDateKey = `${year}-${month}-${day}`;
      }

      if (extractedDateKey === dateKey) {
        const normalizedStatus = normalizeStatus(data.status);
        const normalizedService = data.service || data.serviceType || data.serviceName || 'General Consultation';

        appointments.push({
          ...data,
          legacyId: data.id || data.appointmentId || null,
          id: docSnap.id,
          clinicLocation: clinicInfo.key!,
          clinicId: clinicInfo.key!,
          location: clinicInfo.label || data.location || data.clinicLocation || '',
          time: extractedTime,
          dateKey: extractedDateKey,
          date: extractedDateKey,
          status: normalizedStatus,
          service: normalizedService,
          patientName: data.patientName || '',
          appointmentTime: extractedTime,
          appointmentDate: extractedDateKey
        } as Appointment);
      }
    });

    return appointments;
  } catch (error) {
    console.error('Error getting appointments for date:', error);
    return [];
  }
}

/**
 * Get appointments for a date range
 */
export async function getAppointmentsForDateRange(
  startDateKey: string,
  endDateKey: string,
  userRole: UserRole | null = null,
  userClinics: string[] = []
): Promise<AppointmentsByDate> {
  try {
    const accessibleClinics = getAccessibleClinics(userRole, userClinics);
    const clinicSet = new Set(accessibleClinics);

    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('appointmentDate', '>=', startDateKey),
      where('appointmentDate', '<=', endDateKey)
    );

    const querySnapshot = await getDocs(q);
    const appointmentsByDate: AppointmentsByDate = {};

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Filter by clinic
      const clinicInfo = resolveClinicInfo(data);
      if (!clinicInfo.key || !clinicSet.has(clinicInfo.key)) {
        return;
      }

      // Filter out pending, cancelled, declined for calendar
      if (data.status === 'pending' || data.status === 'cancelled' || data.status === 'declined') {
        return;
      }

      // Extract time and date
      let extractedTime = '';
      let extractedDateKey = '';

      if (data.appointmentTime) {
        extractedTime = data.appointmentTime;
      } else if (data.appointmentDateTime) {
        const dateObj = data.appointmentDateTime.toDate();
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        extractedTime = `${hours}:${minutes}`;
      }

      if (data.appointmentDate) {
        extractedDateKey = data.appointmentDate;
      } else if (data.appointmentDateTime) {
        const dateObj = data.appointmentDateTime.toDate();
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        extractedDateKey = `${year}-${month}-${day}`;
      }

      if (extractedDateKey >= startDateKey && extractedDateKey <= endDateKey) {
        if (!appointmentsByDate[extractedDateKey]) {
          appointmentsByDate[extractedDateKey] = [];
        }

        const normalizedStatus = normalizeStatus(data.status);
        const normalizedService = data.service || data.serviceType || data.serviceName || 'General Consultation';

        appointmentsByDate[extractedDateKey].push({
          ...data,
          legacyId: data.id || data.appointmentId || null,
          id: docSnap.id,
          clinicLocation: clinicInfo.key!,
          clinicId: clinicInfo.key!,
          time: extractedTime,
          dateKey: extractedDateKey,
          date: extractedDateKey,
          location: clinicInfo.label || data.location || data.clinicLocation || '',
          status: normalizedStatus,
          service: normalizedService,
          patientName: data.patientName || '',
          appointmentTime: extractedTime,
          appointmentDate: extractedDateKey
        } as Appointment);
      }
    });

    return appointmentsByDate;
  } catch (error) {
    console.error('Error getting appointments for date range:', error);
    return {};
  }
}

/**
 * Get all appointments (with caching)
 */
export async function getAllAppointments(
  userRole: UserRole | null = null,
  userClinics: string[] = [],
  includeAllStatuses = true,
  skipCache = false
): Promise<Appointment[]> {
  const accessibleClinics = getAccessibleClinics(userRole, userClinics);
  const cacheKey = cacheKeys.appointments.all(accessibleClinics, includeAllStatuses ? 'all' : 'active');

  // Use cache unless explicitly skipped
  if (!skipCache) {
    const cached = appointmentsCache.get<Appointment[]>(cacheKey);
    if (cached) return cached;
  }

  try {
    const clinicSet = new Set(accessibleClinics);

    // Query last 3 months to 1 year ahead
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    const startDateKey = threeMonthsAgo.toISOString().split('T')[0];
    const endDateKey = oneYearLater.toISOString().split('T')[0];

    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('appointmentDate', '>=', startDateKey),
      where('appointmentDate', '<=', endDateKey)
    );

    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Filter by clinic
      const clinicInfo = resolveClinicInfo(data);
      if (!clinicInfo.key || !clinicSet.has(clinicInfo.key)) {
        return;
      }

      // Filter by status if needed
      if (!includeAllStatuses && (data.status === 'cancelled' || data.status === 'declined')) {
        return;
      }

      const appointmentTime = resolveAppointmentTime(data);
      const appointmentDateKey = resolveAppointmentDateKey(data);

      const normalizedStatus = normalizeStatus(data.status);
      const normalizedService = data.service || data.serviceType || data.serviceName || 'General Consultation';

      appointments.push({
        ...data,
        legacyId: data.id || data.appointmentId || null,
        id: docSnap.id,
        clinicLocation: clinicInfo.key!,
        clinicId: clinicInfo.key!,
        time: appointmentTime,
        dateKey: appointmentDateKey,
        location: clinicInfo.label || data.location || data.clinicLocation || '',
        status: normalizedStatus,
        service: normalizedService,
        patientName: resolvePatientName(data),
        phone: resolvePatientPhone(data),
        appointmentTime,
        appointmentDate: appointmentDateKey
      } as Appointment);
    });

    // Cache results for 2 minutes
    appointmentsCache.set(cacheKey, appointments, 2 * 60 * 1000);

    return appointments;
  } catch (error) {
    console.error('Error getting all appointments:', error);
    return [];
  }
}

// Re-export cache invalidation for use by components
export { invalidateAppointmentCaches, invalidatePatientCaches, invalidateDentalChartCaches };

/**
 * Add new appointment
 */
export async function addAppointment(
  appointmentData: AppointmentInput,
  userRole: UserRole | null = null,
  userClinics: string[] = []
): Promise<Appointment> {
  const clinicId = normalizeClinicId(appointmentData.location);

  if (!clinicId) {
    throw new Error('Invalid clinic location');
  }

  // Permission check
  const accessibleClinics = getAccessibleClinics(userRole, userClinics);
  if (!accessibleClinics.includes(clinicId)) {
    throw new Error(`Access denied: You don't have permission to create appointments for ${clinicId}`);
  }

  // Create timestamp
  const appointmentDateTime = createAppointmentTimestamp(appointmentData.date, appointmentData.time);

  // Get current user ID
  const currentUserId = auth.currentUser?.uid || 'system';

  const appointment = {
    userId: currentUserId,
    patientName: appointmentData.patientName,
    patientPhone: appointmentData.phone || '',
    service: appointmentData.service,
    appointmentTime: appointmentData.time,
    appointmentDate: appointmentData.date,
    appointmentDateTime,
    status: 'scheduled' as AppointmentStatus,
    clinicLocation: clinicId,
    phone: appointmentData.phone || '',
    email: appointmentData.email || `${appointmentData.patientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
    notes: appointmentData.notes || '',
    dateKey: appointmentData.date,
    createdAt: new Date().toISOString(),
    clinicId
  };

  const appointmentsRef = collection(db, 'appointments');
  const docRef = await addDoc(appointmentsRef, appointment);

  // Invalidate cache after mutation
  invalidateAppointmentCaches();

  return {
    id: docRef.id,
    ...appointment,
    time: appointment.appointmentTime,
    date: appointment.appointmentDate,
    location: getClinicDisplayName(clinicId)
  } as Appointment;
}

/**
 * Find appointment by ID
 */
export async function findAppointmentById(
  appointmentId: string,
  userRole: UserRole | null = null,
  userClinics: string[] = []
): Promise<Appointment | null> {
  try {
    const accessibleClinics = getAccessibleClinics(userRole, userClinics);

    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);

    if (!appointmentSnap.exists()) {
      return null;
    }

    const data = appointmentSnap.data();
    const normalizedClinic = normalizeClinicId(data.clinicLocation || data.location);

    if (!normalizedClinic || !accessibleClinics.includes(normalizedClinic)) {
      throw new Error('No permission to access this appointment');
    }

    return {
      id: appointmentSnap.id,
      ...data
    } as Appointment;
  } catch (error) {
    console.error('Error finding appointment by ID:', error);
    return null;
  }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
  additionalData: Record<string, unknown> = {},
  userRole: UserRole | null = null,
  userClinics: string[] = []
): Promise<boolean> {
  const appointment = await findAppointmentById(appointmentId, userRole, userClinics);

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  const clinicLocation = appointment.clinicLocation || appointment.location;
  const accessibleClinics = getAccessibleClinics(userRole, userClinics);
  const normalizedClinic = normalizeClinicId(clinicLocation);

  if (!normalizedClinic || !accessibleClinics.includes(normalizedClinic)) {
    throw new Error(`Access denied to clinic: ${normalizedClinic}`);
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

    const cancelledRef = collection(db, 'cancelledAppointments');
    await addDoc(cancelledRef, cancelledData);
    await deleteDoc(doc(db, 'appointments', appointmentId));
  } else {
    const updateData = {
      status: newStatus,
      ...additionalData,
      lastUpdated: new Date().toISOString()
    };

    await updateDoc(doc(db, 'appointments', appointmentId), updateData);
  }

  // Invalidate cache after mutation
  invalidateAppointmentCaches();

  return true;
}

/**
 * Update appointment data
 */
export async function updateAppointment(
  appointmentId: string,
  updatedData: Partial<Appointment>,
  userRole: UserRole | null = null,
  userClinics: string[] = []
): Promise<boolean> {
  const appointment = await findAppointmentById(appointmentId, userRole, userClinics);

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  const accessibleClinics = getAccessibleClinics(userRole, userClinics);
  const normalizedClinic = normalizeClinicId(appointment.clinicLocation || appointment.location);

  if (!normalizedClinic || !accessibleClinics.includes(normalizedClinic)) {
    throw new Error(`No permission to update appointments for ${normalizedClinic}`);
  }

  const updatePayload: Record<string, unknown> = {
    ...updatedData,
    lastUpdated: new Date().toISOString()
  };

  const updatedRecord = updatedData as Record<string, unknown>;
  const dateCandidate = toCleanString(
    updatedRecord.appointmentDate ?? updatedRecord.dateKey ?? updatedRecord.date ?? ''
  );
  const timeCandidate = toCleanString(
    updatedRecord.appointmentTime ?? updatedRecord.time ?? ''
  );
  const shouldSyncDate = 'appointmentDate' in updatedRecord || 'dateKey' in updatedRecord || 'date' in updatedRecord;
  const shouldSyncTime = 'appointmentTime' in updatedRecord || 'time' in updatedRecord;
  const resolvedDate = dateCandidate || appointment.appointmentDate || appointment.dateKey || appointment.date || '';
  const resolvedTime = timeCandidate || appointment.appointmentTime || appointment.time || '';

  if (shouldSyncDate && resolvedDate) {
    updatePayload.appointmentDate = resolvedDate;
    updatePayload.dateKey = resolvedDate;
  }

  if (shouldSyncTime && resolvedTime) {
    updatePayload.appointmentTime = resolvedTime;
    updatePayload.time = resolvedTime;
  }

  if ((shouldSyncDate || shouldSyncTime) && resolvedDate && resolvedTime) {
    updatePayload.appointmentDateTime = createAppointmentTimestamp(resolvedDate, resolvedTime);
  }

  // Handle name field mapping
  if ('name' in updatedData) {
    updatePayload.patientName = (updatedData as Record<string, unknown>).name;
    delete updatePayload.name;
  }

  await updateDoc(doc(db, 'appointments', appointmentId), updatePayload);

  // Invalidate cache after mutation
  invalidateAppointmentCaches();

  return true;
}

/**
 * Delete appointment
 */
export async function deleteAppointment(
  appointmentId: string,
  userRole: UserRole | null = null,
  userClinics: string[] = []
): Promise<boolean> {
  const appointment = await findAppointmentById(appointmentId, userRole, userClinics);

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  const accessibleClinics = getAccessibleClinics(userRole, userClinics);
  const normalizedClinic = normalizeClinicId(appointment.clinicLocation || appointment.location);

  if (!normalizedClinic || !accessibleClinics.includes(normalizedClinic)) {
    throw new Error(`Access denied to delete appointments for ${normalizedClinic}`);
  }

  await deleteDoc(doc(db, 'appointments', appointmentId));

  // Invalidate cache after mutation
  invalidateAppointmentCaches();

  return true;
}

// ==================== PENDING CONFIRMATIONS ====================

/**
 * Get pending confirmations
 */
export async function getPendingConfirmations(
  userRole: UserRole | null = null,
  userClinics: string[] = []
): Promise<PendingConfirmation[]> {
  try {
    const confirmationsRef = collection(db, 'pendingConfirmations');
    const q = query(confirmationsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const accessibleClinics = getAccessibleClinics(userRole, userClinics);
    const confirmations: PendingConfirmation[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const clinicId = normalizeClinicId(data.location);

      if (clinicId && accessibleClinics.includes(clinicId)) {
        confirmations.push({
          ...data,
          legacyId: data.id || data.appointmentId || null,
          id: docSnap.id
        } as PendingConfirmation);
      }
    });

    return confirmations;
  } catch (error) {
    console.error('Error getting pending confirmations:', error);
    return [];
  }
}

/**
 * Add pending confirmation
 */
export async function addPendingConfirmation(
  confirmationData: Omit<PendingConfirmation, 'id' | 'createdAt'>
): Promise<PendingConfirmation> {
  const confirmation = {
    ...confirmationData,
    createdAt: new Date().toISOString()
  };

  const confirmationsRef = collection(db, 'pendingConfirmations');
  const docRef = await addDoc(confirmationsRef, confirmation);

  return {
    id: docRef.id,
    ...confirmation
  } as PendingConfirmation;
}

/**
 * Remove pending confirmation
 */
export async function removePendingConfirmation(confirmationId: string): Promise<boolean> {
  await deleteDoc(doc(db, 'pendingConfirmations', confirmationId));
  return true;
}

// ==================== CANCELLED APPOINTMENTS ====================

/**
 * Get cancelled appointments
 */
export async function getCancelledAppointments(
  userRole: UserRole | null = null,
  userClinics: string[] = []
): Promise<CancelledAppointment[]> {
  try {
    const accessibleClinics = getAccessibleClinics(userRole, userClinics);
    const appointments: CancelledAppointment[] = [];

    for (const clinicId of accessibleClinics) {
      const cancelledRef = collection(db, 'cancelledAppointments', clinicId, 'appointments');
      const q = query(cancelledRef, orderBy('cancelledAt', 'desc'));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        appointments.push({
          ...data,
          legacyId: data.id || data.appointmentId || null,
          id: docSnap.id
        } as CancelledAppointment);
      });
    }

    return appointments;
  } catch (error) {
    console.error('Error getting cancelled appointments:', error);
    return [];
  }
}

// ==================== REAL-TIME NOTIFICATIONS ====================

/**
 * Subscribe to new appointments (pending status)
 */
export function subscribeToNewAppointments(
  userRole: UserRole,
  userClinics: string[],
  callback: (appointments: Appointment[]) => void
): () => void {
  const accessibleClinics = getAccessibleClinics(userRole, userClinics);

  if (accessibleClinics.length === 0) {
    callback([]);
    return () => {};
  }

  const appointmentsRef = collection(db, 'appointments');
  const q = query(
    appointmentsRef,
    where('clinicLocation', 'in', accessibleClinics),
    where('status', '==', 'pending'),
    orderBy('appointmentDateTime', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const pendingAppointments: Appointment[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const appointmentDate = data.appointmentDateTime?.toDate() || new Date();
        const clinicInfo = resolveClinicInfo(data);

        pendingAppointments.push({
          ...data,
          legacyId: data.id || data.appointmentId || null,
          id: docSnap.id,
          clinicLocation: clinicInfo.key!,
          clinicId: clinicInfo.key!,
          time: appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          dateKey: appointmentDate.toISOString().split('T')[0],
          location: clinicInfo.label || data.location || data.clinicLocation || '',
          appointmentDateTime: appointmentDate
        } as unknown as Appointment);
      });

      callback(pendingAppointments);
    },
    (error) => {
      console.error('Error listening to new appointments:', error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Get count of pending appointments
 */
export async function getPendingAppointmentsCount(
  userRole: UserRole,
  userClinics: string[]
): Promise<number> {
  try {
    const accessibleClinics = getAccessibleClinics(userRole, userClinics);

    if (accessibleClinics.length === 0) {
      return 0;
    }

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

/**
 * Get all pending appointments (status = 'pending')
 */
export async function getPendingAppointments(
  clinicId: ClinicId | null = null
): Promise<Appointment[]> {
  try {
    const appointmentsRef = collection(db, 'appointments');
    let q;

    if (clinicId) {
      q = query(
        appointmentsRef,
        where('clinicLocation', '==', clinicId),
        where('status', '==', 'pending'),
        orderBy('dateKey', 'asc'),
        orderBy('time', 'asc')
      );
    } else {
      q = query(
        appointmentsRef,
        where('status', '==', 'pending'),
        orderBy('dateKey', 'asc'),
        orderBy('time', 'asc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const clinicInfo = resolveClinicInfo(data);
      const appointmentTime = resolveAppointmentTime(data);
      const appointmentDateKey = resolveAppointmentDateKey(data);
      const normalizedService = data.service || data.serviceType || data.serviceName || 'General Consultation';
      const clinicKey = clinicInfo.key || normalizeClinicId(String(data.clinicLocation || data.clinicId || ''));

      return {
        ...data,
        id: docSnap.id,
        clinicLocation: clinicKey as ClinicId,
        clinicId: clinicKey as ClinicId,
        location: clinicInfo.label || data.location || data.clinicLocation || '',
        status: normalizeStatus(data.status),
        service: normalizedService,
        patientName: resolvePatientName(data),
        phone: resolvePatientPhone(data),
        appointmentTime,
        appointmentDate: appointmentDateKey,
        dateKey: appointmentDateKey,
        time: appointmentTime
      } as Appointment;
    });
  } catch (error) {
    console.error('Error getting pending appointments:', error);
    return [];
  }
}

// ==================== PATIENT PROFILES ====================

/**
 * Get patient profile
 */
export async function getPatientProfile(patientName: string): Promise<PatientProfile | null> {
  try {
    const patientId = patientName.toLowerCase().replace(/\s+/g, '_');
    const patientRef = doc(db, 'patientProfiles', patientId);
    const patientSnap = await getDoc(patientRef);

    if (patientSnap.exists()) {
      return patientSnap.data() as PatientProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting patient profile:', error);
    return null;
  }
}

/**
 * Set patient profile
 */
export async function setPatientProfile(
  patientName: string,
  profileData: Record<string, unknown>
): Promise<PatientProfile> {
  const patientId = patientName.toLowerCase().replace(/\s+/g, '_');
  const patientRef = doc(db, 'patientProfiles', patientId);

  const profile: PatientProfile = {
    patientName,
    detailedInfo: profileData,
    lastUpdated: new Date().toISOString()
  };

  await setDoc(patientRef, profile, { merge: true });
  return profile;
}

// ==================== DENTAL CHART ====================

/**
 * Get dental chart for a patient
 */
export async function getDentalChart(userId: string): Promise<DentalChart | null> {
  const chartRef = doc(db, 'dentalCharts', userId);
  const chartSnap = await getDoc(chartRef);

  if (chartSnap.exists()) {
    return { id: chartSnap.id, ...chartSnap.data() } as DentalChart;
  }
  return null;
}

/**
 * Initialize dental chart for new patient
 */
export async function initializeDentalChart(userId: string, patientName: string): Promise<boolean> {
  const chartRef = doc(db, 'dentalCharts', userId);

  // Create 32 teeth with Universal numbering (1-32)
  const teeth: Record<string, ToothData> = {};
  for (let i = 1; i <= 32; i++) {
    teeth[i.toString()] = {
      status: 'healthy',
      treatments: [],
      lastUpdated: new Date().toISOString()
    };
  }

  await setDoc(chartRef, {
    userId,
    patientName,
    lastUpdated: new Date().toISOString(),
    teeth
  });

  return true;
}

/**
 * Update tooth status
 */
export async function updateToothStatus(
  userId: string,
  toothNum: number | string,
  statusData: { status: ToothStatus }
): Promise<boolean> {
  const validToothNum = validateToothNumber(toothNum);
  const validStatus = validateToothStatus(statusData.status);

  const chartRef = doc(db, 'dentalCharts', userId);

  await updateDoc(chartRef, {
    [`teeth.${validToothNum}.status`]: validStatus,
    [`teeth.${validToothNum}.lastUpdated`]: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });

  return true;
}

/**
 * Add treatment record to a tooth
 */
export async function addToothTreatment(
  userId: string,
  toothNum: number | string,
  treatment: Omit<TreatmentRecord, 'id' | 'date' | 'createdBy'>
): Promise<TreatmentRecord> {
  const validToothNum = validateToothNumber(toothNum);

  const chartRef = doc(db, 'dentalCharts', userId);
  const chartSnap = await getDoc(chartRef);

  if (!chartSnap.exists()) {
    throw new Error('Dental chart not found');
  }

  const entry: TreatmentRecord = {
    id: `treatment-${Date.now()}`,
    date: new Date().toISOString(),
    createdBy: auth.currentUser?.uid || 'unknown',
    ...treatment
  };

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

  chartData.teeth[validToothNum].treatments.push(entry);

  await updateDoc(chartRef, {
    [`teeth.${validToothNum}.treatments`]: chartData.teeth[validToothNum].treatments,
    [`teeth.${validToothNum}.lastUpdated`]: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });

  return entry;
}

/**
 * Update detailed tooth status
 */
export async function updateDetailedToothStatus(
  userId: string,
  toothNum: number | string,
  statusData: {
    condition: ToothCondition;
    severity: ToothSeverity;
    affectedSurfaces: ToothSurface[];
    clinicalNotes?: string;
  }
): Promise<DetailedToothStatus> {
  const validToothNum = validateToothNumber(toothNum);

  // Validate condition
  if (!VALID_CONDITIONS.includes(statusData.condition)) {
    throw new Error(`Invalid condition. Must be one of: ${VALID_CONDITIONS.join(', ')}`);
  }

  // Validate severity
  if (!VALID_SEVERITIES.includes(statusData.severity)) {
    throw new Error(`Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`);
  }

  // Validate surfaces
  for (const surface of statusData.affectedSurfaces) {
    if (!VALID_SURFACES.includes(surface)) {
      throw new Error(`Invalid surface. Must be one of: ${VALID_SURFACES.join(', ')}`);
    }
  }

  const chartRef = doc(db, 'dentalCharts', userId);

  const detailedStatus: DetailedToothStatus = {
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

/**
 * Get detailed tooth status
 */
export async function getDetailedToothStatus(
  userId: string,
  toothNum: number | string
): Promise<DetailedToothStatus | null> {
  const validToothNum = validateToothNumber(toothNum);

  const chartData = await getDentalChart(userId);
  if (!chartData?.teeth) return null;

  const tooth = chartData.teeth[validToothNum.toString()];
  return tooth?.detailedStatus || null;
}

// ==================== PERIODONTAL DATA ====================

/**
 * Update periodontal data for a tooth
 */
export async function updatePeriodontalData(
  userId: string,
  toothNum: number | string,
  periodontalData: {
    buccal: { mesial: number; mid: number; distal: number };
    lingual: { mesial: number; mid: number; distal: number };
    bleedingPoints?: string[];
  }
): Promise<PeriodontalData> {
  const validToothNum = validateToothNumber(toothNum);

  // Validate depths
  validatePeriodontalDepth(periodontalData.buccal.mesial);
  validatePeriodontalDepth(periodontalData.buccal.mid);
  validatePeriodontalDepth(periodontalData.buccal.distal);
  validatePeriodontalDepth(periodontalData.lingual.mesial);
  validatePeriodontalDepth(periodontalData.lingual.mid);
  validatePeriodontalDepth(periodontalData.lingual.distal);

  const chartRef = doc(db, 'dentalCharts', userId);

  const periodontalRecord: PeriodontalData = {
    buccal: {
      mesial: parseInt(String(periodontalData.buccal.mesial)),
      mid: parseInt(String(periodontalData.buccal.mid)),
      distal: parseInt(String(periodontalData.buccal.distal))
    },
    lingual: {
      mesial: parseInt(String(periodontalData.lingual.mesial)),
      mid: parseInt(String(periodontalData.lingual.mid)),
      distal: parseInt(String(periodontalData.lingual.distal))
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

/**
 * Get periodontal data for a tooth
 */
export async function getPeriodontalData(
  userId: string,
  toothNum: number | string
): Promise<PeriodontalData | null> {
  const validToothNum = validateToothNumber(toothNum);

  const chartRef = doc(db, 'dentalCharts', userId);
  const chartSnap = await getDoc(chartRef);

  if (chartSnap.exists()) {
    const chartData = chartSnap.data();
    const tooth = chartData.teeth?.[validToothNum];
    return tooth?.periodontal || null;
  }

  return null;
}

/**
 * Get periodontal summary for entire chart
 */
export async function getPeriodontalSummary(userId: string): Promise<PeriodontalSummary | null> {
  const chartData = await getDentalChart(userId);
  if (!chartData?.teeth) {
    return null;
  }

  const summary: PeriodontalSummary = {
    teethWithData: 0,
    averageDepth: 0,
    maxDepth: 0,
    teethWithBleeding: 0,
    problemAreas: []
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

// ==================== DENTAL CHART SNAPSHOTS ====================

/**
 * Create a snapshot of the current dental chart
 */
export async function createDentalChartSnapshot(
  userId: string,
  description = ''
): Promise<DentalChartSnapshot> {
  const currentChart = await getDentalChart(userId);
  if (!currentChart) {
    throw new Error('No dental chart found for this user');
  }

  const snapshotData = {
    userId,
    patientName: currentChart.patientName,
    description: description || 'Chart snapshot',
    chartData: currentChart.teeth,
    createdAt: new Date().toISOString(),
    timestamp: serverTimestamp()
  };

  const snapshotsRef = collection(db, 'dentalChartSnapshots');
  const docRef = await addDoc(snapshotsRef, snapshotData);

  return { id: docRef.id, ...snapshotData } as DentalChartSnapshot;
}

/**
 * Get all snapshots for a user
 */
export async function getDentalChartSnapshots(userId: string): Promise<DentalChartSnapshot[]> {
  try {
    const snapshotsRef = collection(db, 'dentalChartSnapshots');
    const q = query(
      snapshotsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const snapshots: DentalChartSnapshot[] = [];

    querySnapshot.forEach((docSnap) => {
      snapshots.push({
        id: docSnap.id,
        ...docSnap.data()
      } as DentalChartSnapshot);
    });

    return snapshots;
  } catch (error) {
    // Handle permission errors gracefully
    console.log('No snapshots found or access denied');
    return [];
  }
}

/**
 * Get a specific snapshot
 */
export async function getSnapshot(snapshotId: string): Promise<DentalChartSnapshot | null> {
  try {
    const snapshotRef = doc(db, 'dentalChartSnapshots', snapshotId);
    const snapshotDoc = await getDoc(snapshotRef);

    if (!snapshotDoc.exists()) {
      return null;
    }

    return {
      id: snapshotDoc.id,
      ...snapshotDoc.data()
    } as DentalChartSnapshot;
  } catch (error) {
    console.log('Permission denied accessing snapshot');
    return null;
  }
}

/**
 * Delete a snapshot
 */
export async function deleteSnapshot(snapshotId: string): Promise<boolean> {
  const snapshotRef = doc(db, 'dentalChartSnapshots', snapshotId);
  await deleteDoc(snapshotRef);
  return true;
}

/**
 * Compare current chart with a snapshot
 */
export async function compareWithSnapshot(
  userId: string,
  snapshotId: string
): Promise<ChartComparison> {
  const currentChart = await getDentalChart(userId);
  if (!currentChart) {
    throw new Error('No current chart found');
  }

  const snapshot = await getSnapshot(snapshotId);
  if (!snapshot) {
    throw new Error('Snapshot not found');
  }

  const changes: { toothNum: number; changes: { field: string; old: string | undefined; new: string | undefined }[] }[] = [];

  // Compare each tooth
  for (let i = 1; i <= 32; i++) {
    const toothNum = i.toString();
    const currentTooth = currentChart.teeth[toothNum];
    const snapshotTooth = snapshot.chartData[toothNum];

    if (!currentTooth || !snapshotTooth) continue;

    const toothChanges: { field: string; old: string | undefined; new: string | undefined }[] = [];

    // Compare status
    if (currentTooth.status !== snapshotTooth.status) {
      toothChanges.push({
        field: 'status',
        old: snapshotTooth.status,
        new: currentTooth.status
      });
    }

    // Compare detailed status
    if (currentTooth.detailedStatus || snapshotTooth.detailedStatus) {
      const currentDS = currentTooth.detailedStatus || {} as DetailedToothStatus;
      const snapshotDS = snapshotTooth.detailedStatus || {} as DetailedToothStatus;

      if (currentDS.condition !== snapshotDS.condition) {
        toothChanges.push({
          field: 'condition',
          old: snapshotDS.condition,
          new: currentDS.condition
        });
      }

      if (currentDS.severity !== snapshotDS.severity) {
        toothChanges.push({
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
        const calculateAvg = (p: PeriodontalData) => {
          const depths = [
            p.buccal.mesial, p.buccal.mid, p.buccal.distal,
            p.lingual.mesial, p.lingual.mid, p.lingual.distal
          ];
          return depths.reduce((sum, d) => sum + d, 0) / 6;
        };

        const currentAvg = calculateAvg(currentPerio);
        const snapshotAvg = calculateAvg(snapshotPerio);

        if (Math.abs(currentAvg - snapshotAvg) > 0.5) {
          toothChanges.push({
            field: 'periodontal',
            old: `${snapshotAvg.toFixed(1)}mm`,
            new: `${currentAvg.toFixed(1)}mm`
          });
        }
      } else if (currentPerio && !snapshotPerio) {
        toothChanges.push({
          field: 'periodontal',
          old: 'No data',
          new: 'Data added'
        });
      } else if (!currentPerio && snapshotPerio) {
        toothChanges.push({
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
      toothChanges.push({
        field: 'treatments',
        old: `${snapshotTreatments} records`,
        new: `${currentTreatments} records (+${currentTreatments - snapshotTreatments})`
      });
    }

    if (toothChanges.length > 0) {
      changes.push({ toothNum: i, changes: toothChanges });
    }
  }

  return {
    snapshotDate: snapshot.createdAt,
    snapshotDescription: snapshot.description,
    currentDate: new Date().toISOString(),
    totalChanges: changes.length,
    changes
  };
}

// ==================== MEDICAL RECORDS ====================

/**
 * Upload medical record
 */
export async function uploadMedicalRecord(
  userId: string,
  file: File,
  progressCallback?: (progress: number) => void
): Promise<MedicalRecord> {
  // Simulate progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 20;
    if (progressCallback) {
      progressCallback(Math.min(progress, 90));
    }
  }, 100);

  // Convert to Base64
  const base64Data = await fileToBase64(file);

  clearInterval(progressInterval);
  if (progressCallback) {
    progressCallback(95);
  }

  // Save to Firestore
  const recordsRef = collection(db, 'medicalRecords');
  const recordData = {
    userId,
    filename: file.name,
    originalName: file.name,
    size: file.size,
    type: file.type,
    base64Data,
    uploadedAt: new Date()
  };

  const docRef = await addDoc(recordsRef, recordData);

  if (progressCallback) {
    progressCallback(100);
  }

  return {
    id: docRef.id,
    ...recordData
  } as MedicalRecord;
}

/**
 * Get medical records for a user
 */
export async function getMedicalRecords(userId: string): Promise<MedicalRecord[]> {
  const recordsRef = collection(db, 'medicalRecords');
  const q = query(
    recordsRef,
    where('userId', '==', userId),
    orderBy('uploadedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const records: MedicalRecord[] = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    records.push({
      ...data,
      legacyId: data.id || null,
      id: docSnap.id
    } as MedicalRecord);
  });

  return records;
}

/**
 * Delete medical record
 */
export async function deleteMedicalRecord(recordId: string): Promise<boolean> {
  await deleteDoc(doc(db, 'medicalRecords', recordId));
  return true;
}

/**
 * Rename medical record
 */
export async function renameMedicalRecord(recordId: string, newName: string): Promise<boolean> {
  const recordRef = doc(db, 'medicalRecords', recordId);
  await updateDoc(recordRef, {
    originalName: newName,
    updatedAt: new Date()
  });
  return true;
}

/**
 * Download medical record from Base64
 */
export function downloadMedicalRecord(base64Data: string, filename: string): boolean {
  try {
    // Convert Base64 to Blob
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Get MIME type
    const mimeType = base64Data.substring(base64Data.indexOf(':') + 1, base64Data.indexOf(';'));
    const blob = new Blob([byteArray], { type: mimeType });

    // Create download
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

// ==================== MEDICAL IMAGES ====================

/**
 * Get all medical images for a patient
 */
export async function getPatientImages(patientId: string): Promise<MedicalImage[]> {
  try {
    const imagesRef = collection(db, 'medicalImages');
    const q = query(
      imagesRef,
      where('patientId', '==', patientId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const images: MedicalImage[] = [];

    querySnapshot.forEach((docSnap) => {
      images.push({
        id: docSnap.id,
        ...docSnap.data()
      } as MedicalImage);
    });

    return images;
  } catch (error) {
    console.log('No images found or access denied');
    return [];
  }
}

/**
 * Save a medical image metadata
 */
export async function saveMedicalImage(
  patientId: string,
  imageData: Partial<MedicalImage>
): Promise<MedicalImage> {
  const imagesRef = collection(db, 'medicalImages');

  const docData = {
    patientId,
    url: imageData.url || '',
    date: imageData.date || new Date().toISOString(),
    type: imageData.type || '全景片',
    fileName: imageData.fileName || 'unknown',
    size: imageData.size || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(imagesRef, docData);
  return { id: docRef.id, ...docData } as MedicalImage;
}

/**
 * Delete a medical image
 */
export async function deleteMedicalImage(imageId: string): Promise<boolean> {
  const imageRef = doc(db, 'medicalImages', imageId);
  await deleteDoc(imageRef);
  return true;
}
