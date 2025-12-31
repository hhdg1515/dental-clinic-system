// ==================== APPOINTMENT TYPES ====================

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'pending'
  | 'declined'
  | 'arrived'
  | 'no-show';

export type ClinicId =
  | 'arcadia'
  | 'irvine'
  | 'south-pasadena'
  | 'rowland-heights'
  | 'eastvale';

export interface Appointment {
  id: string;
  legacyId?: string | null;
  userId?: string;
  patientName: string;
  patientPhone?: string;
  phone?: string;
  email?: string;
  service: string;
  serviceType?: string;
  appointmentTime: string;
  appointmentDate: string;
  appointmentDateTime?: Date;
  status: AppointmentStatus;
  clinicLocation: ClinicId;
  clinicId?: ClinicId;
  location?: string;
  notes?: string;
  dateKey: string;
  date?: string;
  time: string;
  createdAt?: string;
  lastUpdated?: string;
}

export interface AppointmentInput {
  patientName: string;
  phone?: string;
  email?: string;
  service: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
}

export interface AppointmentsByDate {
  [dateKey: string]: Appointment[];
}

// ==================== PENDING CONFIRMATION TYPES ====================

export interface PendingConfirmation {
  id: string;
  legacyId?: string | null;
  patientName: string;
  phone?: string;
  email?: string;
  service: string;
  appointmentTime: string;
  appointmentDate: string;
  location: string;
  createdAt: string;
}

// ==================== CANCELLED APPOINTMENT TYPES ====================

export interface CancelledAppointment extends Appointment {
  cancelledAt: string;
  cancelReason?: string;
  cancelNotes?: string;
}

// ==================== PATIENT TYPES ====================

export interface PatientProfile {
  patientName: string;
  detailedInfo: Record<string, unknown>;
  lastUpdated: string;
}

// ==================== DENTAL CHART TYPES ====================

export type ToothStatus =
  | 'healthy'
  | 'monitor'
  | 'cavity'
  | 'filled'
  | 'missing'
  | 'implant'
  | 'root-canal'
  | 'post-op'
  | 'urgent';

export type ToothCondition =
  | 'healthy'
  | 'monitor'
  | 'cavity'
  | 'filled'
  | 'missing'
  | 'implant'
  | 'root-canal'
  | 'post-op';

export type ToothSeverity = 'none' | 'mild' | 'moderate' | 'severe' | 'urgent';

export type ToothSurface = 'occlusal' | 'buccal' | 'lingual' | 'mesial' | 'distal';

export interface TreatmentRecord {
  id: string;
  date: string;
  createdBy: string;
  type?: string;
  description?: string;
  notes?: string;
  attachment?: ToothAttachment;
}

export interface ToothAttachment {
  type: 'base64' | 'storage';
  filename: string;
  mimeType: string;
  fileSize: number;
  base64Data?: string;
  storagePath?: string;
  downloadURL?: string;
}

export interface DetailedToothStatus {
  condition: ToothCondition;
  severity: ToothSeverity;
  affectedSurfaces: ToothSurface[];
  clinicalNotes: string;
  updatedAt: string;
}

export interface PeriodontalMeasurement {
  mesial: number;
  mid: number;
  distal: number;
}

export interface PeriodontalData {
  buccal: PeriodontalMeasurement;
  lingual: PeriodontalMeasurement;
  bleedingPoints: string[];
  measuredAt: string;
}

export interface ToothData {
  status: ToothStatus;
  treatments: TreatmentRecord[];
  lastUpdated: string;
  detailedStatus?: DetailedToothStatus;
  periodontal?: PeriodontalData;
}

export type TeethData = Record<string, ToothData>;

export interface DentalChart {
  id: string;
  userId: string;
  patientName: string;
  lastUpdated: string;
  teeth: {
    [toothNum: string]: ToothData;
  };
}

export interface PeriodontalSummary {
  teethWithData: number;
  averageDepth: number | string;
  maxDepth: number;
  teethWithBleeding: number;
  problemAreas: {
    toothNum: number;
    maxDepth: number;
    status: ToothStatus;
  }[];
}

// ==================== DENTAL CHART SNAPSHOT TYPES ====================

export interface DentalChartSnapshot {
  id: string;
  userId: string;
  patientName: string;
  description: string;
  chartData: {
    [toothNum: string]: ToothData;
  };
  createdAt: string;
}

export interface ToothChange {
  field: string;
  old: string | undefined;
  new: string | undefined;
}

export interface ToothChanges {
  toothNum: number;
  changes: ToothChange[];
}

export interface ChartComparison {
  snapshotDate: string;
  snapshotDescription: string;
  currentDate: string;
  totalChanges: number;
  changes: ToothChanges[];
}

// ==================== MEDICAL RECORD TYPES ====================

export interface MedicalRecord {
  id: string;
  legacyId?: string | null;
  userId: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  base64Data: string;
  uploadedAt: Date | string;
  updatedAt?: Date | string;
}

export interface MedicalImage {
  id: string;
  patientId: string;
  url: string;
  date: string;
  type: string;
  fileName: string;
  size: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ==================== TREATMENT PLAN TYPES ====================

export type TreatmentPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TreatmentPlanStatus = 'draft' | 'proposed' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';

export interface TreatmentPlanItem {
  id: string;
  toothNum?: number;
  procedure: string;
  description?: string;
  estimatedCost?: number;
  estimatedDuration?: string; // e.g., "30 min", "1 hour"
  priority: TreatmentPriority;
  status: 'pending' | 'scheduled' | 'completed';
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
}

export interface TreatmentPlan {
  id: string;
  userId: string;
  patientName: string;
  title: string;
  description?: string;
  status: TreatmentPlanStatus;
  items: TreatmentPlanItem[];
  totalEstimatedCost?: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
  acceptedAt?: string;
  completedAt?: string;
}

// ==================== FILTER TYPES ====================

export interface AppointmentFilters {
  clinics: ClinicId[];
  services: string[];
  statuses: AppointmentStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

export interface PatientFilters {
  clinic: ClinicId | 'all';
  status: 'active' | 'inactive' | 'all';
  searchQuery?: string;
}

// ==================== CALENDAR TYPES ====================

export type CalendarViewType = 'day' | 'week' | 'month';

// ==================== NOTIFICATION TYPES ====================

export type NotificationType = 'new_appointment' | 'reminder' | 'status_change' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  appointmentId?: string;
  data?: Record<string, unknown>;
}

// ==================== UTILITY TYPES ====================

export interface ClinicInfo {
  key: ClinicId | null;
  label: string;
}

export type UserRole = 'owner' | 'admin' | 'boss' | 'customer';

// Generic pagination type
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
