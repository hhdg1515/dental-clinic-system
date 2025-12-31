// Time slots configuration for appointments

export interface TimeSlot {
  value: string;      // "09:00" format
  label: string;      // Display label
  hour: number;       // Hour as number (9-16)
  period: 'morning' | 'afternoon';
}

export const TIME_SLOTS: TimeSlot[] = [
  { value: '09:00', label: '9:00 AM', hour: 9, period: 'morning' },
  { value: '10:00', label: '10:00 AM', hour: 10, period: 'morning' },
  { value: '11:00', label: '11:00 AM', hour: 11, period: 'morning' },
  { value: '12:00', label: '12:00 PM', hour: 12, period: 'afternoon' },
  { value: '13:00', label: '1:00 PM', hour: 13, period: 'afternoon' },
  { value: '14:00', label: '2:00 PM', hour: 14, period: 'afternoon' },
  { value: '15:00', label: '3:00 PM', hour: 15, period: 'afternoon' },
  { value: '16:00', label: '4:00 PM', hour: 16, period: 'afternoon' },
];

// Day names
export const DAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;
export const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const DAYS_FULL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

// Time helpers
export const formatTime12h = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const formatTime24h = (time: string): string => {
  return time; // Already in 24h format
};

export const getTimeSlotByValue = (value: string): TimeSlot | undefined => {
  return TIME_SLOTS.find(slot => slot.value === value);
};

export const getTimeSlotByHour = (hour: number): TimeSlot | undefined => {
  return TIME_SLOTS.find(slot => slot.hour === hour);
};

export const getMorningSlots = (): TimeSlot[] => {
  return TIME_SLOTS.filter(slot => slot.period === 'morning');
};

export const getAfternoonSlots = (): TimeSlot[] => {
  return TIME_SLOTS.filter(slot => slot.period === 'afternoon');
};

// Date helpers
export const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
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
