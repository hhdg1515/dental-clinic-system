// Calendar component shared types
import type { Appointment, AppointmentStatus, ClinicId } from '../../types';

export type ViewType = 'week' | 'day' | 'month';

export interface TimeSlot {
  value: string;
  label: string;
  hour: number;
}

export interface StatusStyle {
  bg: string;
  border: string;
  text: string;
  gradient: string;
  glow: string;
}

export interface CalendarProps {
  appointments: Appointment[];
  currentDate: Date;
  currentView: ViewType;
  loading?: boolean;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onSlotClick?: (date: Date, hour: number) => void;
}

export interface AppointmentBlockProps {
  appointment: Appointment;
  compact?: boolean;
  onClick?: () => void;
  onHover?: (appointment: Appointment | null) => void;
}

export interface DayHeaderProps {
  date: Date;
  isToday?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export interface CalendarToolbarProps {
  currentDate: Date;
  currentView: ViewType;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onGoToday: () => void;
  onViewChange: (view: ViewType) => void;
  onNewAppointment?: () => void;
}

export interface QuickPreviewCardProps {
  appointment: Appointment;
  position: { x: number; y: number };
  onClose: () => void;
  onViewPatient: () => void;
}

// Constants
export const TIME_SLOTS: TimeSlot[] = [
  { value: '09:00', label: '9:00 AM', hour: 9 },
  { value: '10:00', label: '10:00 AM', hour: 10 },
  { value: '11:00', label: '11:00 AM', hour: 11 },
  { value: '12:00', label: '12:00 PM', hour: 12 },
  { value: '13:00', label: '1:00 PM', hour: 13 },
  { value: '14:00', label: '2:00 PM', hour: 14 },
  { value: '15:00', label: '3:00 PM', hour: 15 },
  { value: '16:00', label: '4:00 PM', hour: 16 },
];

export const DAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const STATUS_LABELS: Record<string, string> = {
  pending: '待确认',
  scheduled: '已预约',
  confirmed: '已确认',
  arrived: '已到达',
  completed: '已完成',
  'no-show': '未到场',
  cancelled: '已取消',
  declined: '已拒绝',
};

export const STATUS_STYLES: Record<string, StatusStyle> = {
  pending: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    gradient: 'from-amber-50 to-amber-100/50',
    glow: 'shadow-amber-200/50',
  },
  scheduled: {
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-700',
    gradient: 'from-sky-50 to-sky-100/50',
    glow: 'shadow-sky-200/50',
  },
  confirmed: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    gradient: 'from-emerald-50 to-emerald-100/50',
    glow: 'shadow-emerald-200/50',
  },
  arrived: {
    bg: 'bg-violet-50',
    border: 'border-violet-300',
    text: 'text-violet-700',
    gradient: 'from-violet-50 to-violet-100/50',
    glow: 'shadow-violet-200/50',
  },
  completed: {
    bg: 'bg-teal-50',
    border: 'border-teal-300',
    text: 'text-teal-700',
    gradient: 'from-teal-50 to-teal-100/50',
    glow: 'shadow-teal-200/50',
  },
  'no-show': {
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-700',
    gradient: 'from-rose-50 to-rose-100/50',
    glow: 'shadow-rose-200/50',
  },
  cancelled: {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-500',
    gradient: 'from-slate-50 to-slate-100/50',
    glow: 'shadow-slate-200/50',
  },
  declined: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-600',
    gradient: 'from-red-50 to-red-100/50',
    glow: 'shadow-red-200/50',
  },
};

// Utility functions
export const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const getWeekDates = (currentDate: Date): Date[] => {
  const dates: Date[] = [];
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    dates.push(date);
  }
  return dates;
};

export const getMonthDates = (currentDate: Date): Date[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= lastDay || dates.length % 7 !== 0) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
    if (dates.length > 42) break;
  }
  return dates;
};
