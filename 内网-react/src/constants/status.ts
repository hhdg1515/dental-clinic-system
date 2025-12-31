// Appointment status configuration
import type { AppointmentStatus } from '../types';

export interface StatusStyle {
  bg: string;
  border: string;
  text: string;
  gradient: string;
  glow: string;
  badgeClass: string;
}

export interface StatusConfig {
  value: AppointmentStatus;
  label: string;
  labelZh: string;
  icon: string;
  style: StatusStyle;
}

export const STATUS_CONFIGS: Record<AppointmentStatus, StatusConfig> = {
  pending: {
    value: 'pending',
    label: 'Pending',
    labelZh: '待确认',
    icon: 'fa-clock',
    style: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-700',
      gradient: 'from-amber-50 to-amber-100/50',
      glow: 'shadow-amber-200/50',
      badgeClass: 'badge-warning',
    },
  },
  scheduled: {
    value: 'scheduled',
    label: 'Scheduled',
    labelZh: '已预约',
    icon: 'fa-calendar-check',
    style: {
      bg: 'bg-sky-50',
      border: 'border-sky-300',
      text: 'text-sky-700',
      gradient: 'from-sky-50 to-sky-100/50',
      glow: 'shadow-sky-200/50',
      badgeClass: 'badge-info',
    },
  },
  confirmed: {
    value: 'confirmed',
    label: 'Confirmed',
    labelZh: '已确认',
    icon: 'fa-check-circle',
    style: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-700',
      gradient: 'from-emerald-50 to-emerald-100/50',
      glow: 'shadow-emerald-200/50',
      badgeClass: 'badge-success',
    },
  },
  arrived: {
    value: 'arrived',
    label: 'Arrived',
    labelZh: '已到达',
    icon: 'fa-user-check',
    style: {
      bg: 'bg-violet-50',
      border: 'border-violet-300',
      text: 'text-violet-700',
      gradient: 'from-violet-50 to-violet-100/50',
      glow: 'shadow-violet-200/50',
      badgeClass: 'badge-info',
    },
  },
  completed: {
    value: 'completed',
    label: 'Completed',
    labelZh: '已完成',
    icon: 'fa-check-double',
    style: {
      bg: 'bg-teal-50',
      border: 'border-teal-300',
      text: 'text-teal-700',
      gradient: 'from-teal-50 to-teal-100/50',
      glow: 'shadow-teal-200/50',
      badgeClass: 'badge-success',
    },
  },
  'no-show': {
    value: 'no-show',
    label: 'No Show',
    labelZh: '未到场',
    icon: 'fa-user-times',
    style: {
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      text: 'text-rose-700',
      gradient: 'from-rose-50 to-rose-100/50',
      glow: 'shadow-rose-200/50',
      badgeClass: 'badge-danger',
    },
  },
  cancelled: {
    value: 'cancelled',
    label: 'Cancelled',
    labelZh: '已取消',
    icon: 'fa-times-circle',
    style: {
      bg: 'bg-slate-50',
      border: 'border-slate-300',
      text: 'text-slate-500',
      gradient: 'from-slate-50 to-slate-100/50',
      glow: 'shadow-slate-200/50',
      badgeClass: 'badge-secondary',
    },
  },
  declined: {
    value: 'declined',
    label: 'Declined',
    labelZh: '已拒绝',
    icon: 'fa-ban',
    style: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-600',
      gradient: 'from-red-50 to-red-100/50',
      glow: 'shadow-red-200/50',
      badgeClass: 'badge-danger',
    },
  },
};

// Legacy format for backward compatibility
export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(STATUS_CONFIGS).map(config => [config.value, config.labelZh])
);

export const STATUS_LABELS_EN: Record<string, string> = Object.fromEntries(
  Object.values(STATUS_CONFIGS).map(config => [config.value, config.label])
);

export const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = Object.fromEntries(
  Object.values(STATUS_CONFIGS).map(config => [
    config.value,
    { bg: config.style.bg, border: config.style.border, text: config.style.text }
  ])
);

// Helpers
export const getStatusConfig = (status: AppointmentStatus): StatusConfig => {
  return STATUS_CONFIGS[status] || STATUS_CONFIGS.scheduled;
};

export const getStatusLabel = (status: AppointmentStatus, lang: 'zh' | 'en' = 'zh'): string => {
  const config = getStatusConfig(status);
  return lang === 'zh' ? config.labelZh : config.label;
};

export const getStatusStyle = (status: AppointmentStatus): StatusStyle => {
  return getStatusConfig(status).style;
};

export const getStatusIcon = (status: AppointmentStatus): string => {
  return getStatusConfig(status).icon;
};

// Status flow helpers
export const ACTIVE_STATUSES: AppointmentStatus[] = ['pending', 'scheduled', 'confirmed', 'arrived'];
export const COMPLETED_STATUSES: AppointmentStatus[] = ['completed'];
export const INACTIVE_STATUSES: AppointmentStatus[] = ['no-show', 'cancelled', 'declined'];

export const isActiveStatus = (status: AppointmentStatus): boolean => {
  return ACTIVE_STATUSES.includes(status);
};

export const isCompletedStatus = (status: AppointmentStatus): boolean => {
  return COMPLETED_STATUSES.includes(status);
};

export const isInactiveStatus = (status: AppointmentStatus): boolean => {
  return INACTIVE_STATUSES.includes(status);
};
