// Central export for all constants
// This provides a single import point for shared configuration

// Clinic locations
export {
  CLINICS,
  getClinicByValue,
  getClinicLabel,
} from './clinics';
export type { ClinicOption } from './clinics';

// Services
export {
  SERVICES,
  getServiceByValue,
  getServiceLabel,
  getServiceIcon,
  getServicesByCategory,
} from './services';
export type { ServiceOption } from './services';

// Time slots and date helpers
export {
  TIME_SLOTS,
  DAYS_ZH,
  DAYS_EN,
  DAYS_FULL_EN,
  formatTime12h,
  formatTime24h,
  getTimeSlotByValue,
  getTimeSlotByHour,
  getMorningSlots,
  getAfternoonSlots,
  formatDateKey,
  getWeekDates,
  getMonthDates,
} from './timeSlots';
export type { TimeSlot } from './timeSlots';

// Status configuration
export {
  STATUS_CONFIGS,
  STATUS_LABELS,
  STATUS_LABELS_EN,
  STATUS_COLORS,
  getStatusConfig,
  getStatusLabel,
  getStatusStyle,
  getStatusIcon,
  ACTIVE_STATUSES,
  COMPLETED_STATUSES,
  INACTIVE_STATUSES,
  isActiveStatus,
  isCompletedStatus,
  isInactiveStatus,
} from './status';
export type { StatusStyle, StatusConfig } from './status';
