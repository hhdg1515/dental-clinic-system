// Appointment service for React app
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const logDev = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

const logDevError = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

const normalizeDate = (value: unknown): Date => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  throw new Error('Invalid date value');
};

// Appointment status enum
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show'
} as const;

// Service types configuration
export const SERVICE_TYPES: Record<string, string> = {
  'general-family': 'General & Family',
  'cosmetic': 'Cosmetic',
  'orthodontics': 'Orthodontics',
  'root-canals': 'Root Canals',
  'periodontics': 'Periodontics',
  'restorations': 'Restorations',
  'preventive-care': 'Preventive Care',
  'oral-surgery': 'Oral Surgery'
};

// Clinic locations configuration
export const CLINIC_LOCATIONS: Record<string, string> = {
  'arcadia': 'Arcadia',
  'rowland-heights': 'Rowland Heights',
  'irvine': 'Irvine',
  'south-pasadena': 'South Pasadena',
  'eastvale': 'Eastvale'
};

// Appointment data interface
export interface AppointmentData {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  isNewPatient?: boolean;
  appointmentDate: string;
  appointmentTime: string;
  clinicLocation: string;
  serviceType: string;
  description?: string;
}

// Appointment document interface
export interface AppointmentDoc {
  id?: string;
  userId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDateTime: Date;
  service: string;
  serviceType: string;
  clinicLocation: string;
  location: string;
  phone: string;
  email: string;
  notes: string;
  status: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  appointmentData: AppointmentData,
  userId: string
): Promise<string> {
  try {
    // Validate appointment data
    const validationResult = validateAppointmentData(appointmentData);
    if (!validationResult.isValid) {
      throw new Error(`预约数据验证失败: ${validationResult.errors.join(', ')}`);
    }

    // Check for time conflicts
    const hasConflict = await checkTimeConflict(
      appointmentData.appointmentDate,
      appointmentData.appointmentTime,
      appointmentData.clinicLocation
    );

    if (hasConflict) {
      throw new Error('该时间段已被预约，请选择其他时间');
    }

    // Build appointment document - matching internal system format
    const appointmentDateTime = createAppointmentDateTime(
      appointmentData.appointmentDate,
      appointmentData.appointmentTime
    );

    const now = new Date().toISOString();

    const appointmentDoc = {
      // User and patient info
      userId: userId,
      patientName: appointmentData.patientName.trim(),
      patientPhone: appointmentData.patientPhone.trim(),
      patientEmail: appointmentData.patientEmail || '',
      email: appointmentData.patientEmail || '',
      phone: appointmentData.patientPhone.trim(),

      // Appointment date/time in multiple formats for compatibility
      appointmentDate: appointmentData.appointmentDate, // "2025-10-18"
      appointmentTime: appointmentData.appointmentTime, // "09:00"
      appointmentDateTime: Timestamp.fromDate(appointmentDateTime),
      dateKey: appointmentData.appointmentDate, // For indexing

      // Clinic info
      clinicLocation: appointmentData.clinicLocation,
      clinicId: appointmentData.clinicLocation, // Same as clinicLocation
      location: CLINIC_LOCATIONS[appointmentData.clinicLocation] || appointmentData.clinicLocation,

      // Service info
      serviceType: appointmentData.serviceType,
      service: appointmentData.serviceType, // Use serviceType key for consistency

      // Notes and description
      notes: appointmentData.description || '',
      description: appointmentData.description || '',

      // Status
      status: APPOINTMENT_STATUS.PENDING,

      // Timestamps - use ISO strings for compatibility
      createdAt: now,
      updatedAt: now,
      lastUpdated: now
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'appointments'), appointmentDoc);
    logDev('预约创建成功:', docRef.id);
    return docRef.id;
  } catch (error) {
    logDevError('创建预约失败:', error);
    throw error;
  }
}

/**
 * Get all appointments for a user
 */
export async function getUserAppointments(
  userId: string,
  limitCount: number = 10
): Promise<AppointmentDoc[]> {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId),
      orderBy('appointmentDateTime', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const appointments: AppointmentDoc[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      appointments.push({
        id: doc.id,
        ...data,
        appointmentDateTime: data.appointmentDateTime?.toDate ? data.appointmentDateTime.toDate() : new Date(data.appointmentDateTime),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as AppointmentDoc);
    });

    return appointments;
  } catch (error) {
    logDevError('获取用户预约失败:', error);
    throw error;
  }
}

/**
 * Get upcoming appointments - simplified to avoid index requirements
 */
export async function getUpcomingAppointments(userId: string): Promise<AppointmentDoc[]> {
  try {
    logDev('Fetching upcoming appointments for user:', userId);

    // Simplified query - just get all user appointments and filter in memory
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId),
      orderBy('appointmentDateTime', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    logDev('Found appointments:', querySnapshot.size);

    const appointments: AppointmentDoc[] = [];
    const now = new Date();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let appointmentDateTime: Date;

      try {
        appointmentDateTime = normalizeDate(data.appointmentDateTime);
      } catch {
        return;
      }

      logDev('Appointment:', {
        id: doc.id,
        dateTime: appointmentDateTime,
        status: data.status,
        isUpcoming: appointmentDateTime > now
      });

      // Filter for upcoming appointments in memory
      if (appointmentDateTime > now &&
          (data.status === APPOINTMENT_STATUS.PENDING || data.status === APPOINTMENT_STATUS.CONFIRMED)) {
        appointments.push({
          id: doc.id,
          ...data,
          appointmentDateTime: appointmentDateTime,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as AppointmentDoc);
      }
    });

    logDev('Filtered upcoming appointments:', appointments.length);
    // Sort by date ascending (earliest first)
    appointments.sort((a, b) => {
      return a.appointmentDateTime.getTime() - b.appointmentDateTime.getTime();
    });

    return appointments.slice(0, 5);
  } catch (error) {
    logDevError('获取即将到来的预约失败:', error);
    throw error;
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(appointmentId: string): Promise<AppointmentDoc> {
  try {
    const docRef = doc(db, 'appointments', appointmentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        appointmentDateTime: normalizeDate(data.appointmentDateTime),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as AppointmentDoc;
    } else {
      throw new Error('预约不存在');
    }
  } catch (error) {
    logDevError('获取预约详情失败:', error);
    throw error;
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  userId: string,
  reason: string = ''
): Promise<void> {
  try {
    const appointment = await getAppointmentById(appointmentId);

    if (appointment.userId !== userId) {
      throw new Error('无权限取消此预约');
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      throw new Error('已完成的预约无法取消');
    }

    const docRef = doc(db, 'appointments', appointmentId);
    await updateDoc(docRef, {
      status: APPOINTMENT_STATUS.CANCELLED,
      cancellationReason: reason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    logDev('预约取消成功:', appointmentId);
  } catch (error) {
    logDevError('取消预约失败:', error);
    throw error;
  }
}

/**
 * Check for time conflicts
 */
async function checkTimeConflict(
  date: string,
  time: string,
  clinicLocation: string
): Promise<boolean> {
  try {
    const appointmentDateTime = createAppointmentDateTime(date, time);

    if (!appointmentDateTime || isNaN(appointmentDateTime.getTime())) {
      return false;
    }

    const serviceDuration = 60; // minutes
    const endDateTime = new Date(appointmentDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + serviceDuration);

    const rangeStart = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000);
    const rangeEnd = new Date(endDateTime.getTime() + 30 * 60 * 1000);

    const q = query(
      collection(db, 'appointments'),
      where('clinicLocation', '==', clinicLocation),
      where('status', 'in', [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED]),
      where('appointmentDateTime', '>=', Timestamp.fromDate(rangeStart)),
      where('appointmentDateTime', '<=', Timestamp.fromDate(rangeEnd))
    );

    const querySnapshot = await getDocs(q);

    let hasConflict = false;
    querySnapshot.forEach((doc) => {
      const existingAppointment = doc.data();
      let existingStart: Date;
      try {
        existingStart = normalizeDate(existingAppointment.appointmentDateTime);
      } catch {
        return;
      }
      const existingEnd = new Date(existingStart.getTime() + serviceDuration * 60 * 1000);

      if (appointmentDateTime < existingEnd && endDateTime > existingStart) {
        hasConflict = true;
      }
    });

    return hasConflict;
  } catch (error) {
    logDevError('检查时间冲突失败:', error);
    return false;
  }
}

/**
 * Validate appointment data
 */
function validateAppointmentData(data: AppointmentData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.patientName || data.patientName.trim().length === 0) {
    errors.push('患者姓名不能为空');
  }

  if (!data.patientPhone || data.patientPhone.trim().length === 0) {
    errors.push('联系电话不能为空');
  }

  if (!data.appointmentDate) {
    errors.push('预约日期不能为空');
  }

  if (!data.appointmentTime) {
    errors.push('预约时间不能为空');
  }

  if (!data.clinicLocation || !CLINIC_LOCATIONS[data.clinicLocation]) {
    errors.push('请选择有效的诊所位置');
  }

  if (!data.serviceType || !SERVICE_TYPES[data.serviceType]) {
    errors.push('请选择有效的服务类型');
  }

  if (data.appointmentDate) {
    const appointmentDate = new Date(data.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      errors.push('预约日期不能是过去的日期');
    }

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    if (appointmentDate > maxDate) {
      errors.push('预约日期不能超过3个月');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Create appointment datetime object
 */
function createAppointmentDateTime(date: string, time: string): Date {
  try {
    if (!date || !time) {
      throw new Error('Date and time are required');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    if (!/^\d{2}:\d{2}$/.test(time)) {
      throw new Error('Invalid time format. Expected HH:MM');
    }

    const dateTimeString = `${date}T${time}:00`;
    const dateTime = new Date(dateTimeString);

    if (isNaN(dateTime.getTime())) {
      throw new Error(`Invalid datetime created from: ${dateTimeString}`);
    }

    return dateTime;
  } catch (error) {
    logDevError('Error in createAppointmentDateTime:', error);
    throw error;
  }
}

/**
 * Get user's last appointment
 */
export async function getLastUserAppointment(userId: string): Promise<AppointmentDoc | null> {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      return {
        id: querySnapshot.docs[0].id,
        ...data,
        appointmentDateTime: data.appointmentDateTime?.toDate ? data.appointmentDateTime.toDate() : new Date(data.appointmentDateTime),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as AppointmentDoc;
    }

    return null;
  } catch (error) {
    logDevError('Error fetching last appointment:', error);
    return null;
  }
}
