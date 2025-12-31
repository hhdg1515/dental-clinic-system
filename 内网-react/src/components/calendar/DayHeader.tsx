import { useMemo, memo } from 'react';
import { DAYS_ZH, DAYS_EN } from './types';
import { useI18n } from '../../i18n';

interface DayHeaderProps {
  date: Date;
  isToday?: boolean;
  isSelected?: boolean;
  appointmentCount?: number;
  onClick?: () => void;
}

// Memoized to prevent re-renders when parent state changes
const DayHeader = memo(function DayHeader({
  date,
  isToday = false,
  isSelected = false,
  appointmentCount = 0,
  onClick,
}: DayHeaderProps) {
  const { lang } = useI18n();
  const dayNames = lang === 'zh' ? DAYS_ZH : DAYS_EN;
  const dayName = useMemo(() => dayNames[date.getDay()], [date, dayNames]);
  const dayNumber = useMemo(() => date.getDate(), [date]);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return (
    <div
      className={`day-header ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${isWeekend ? 'is-weekend' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="day-name">{dayName}</span>
      <div className={`day-number ${isToday ? 'today-badge' : ''}`}>
        {dayNumber}
        {isToday && <span className="today-ring"></span>}
      </div>
      {appointmentCount > 0 && (
        <div className="appointment-indicator">
          <span className="indicator-dot"></span>
          <span className="indicator-count">{appointmentCount}</span>
        </div>
      )}
    </div>
  );
});

export default DayHeader;

// Week header row component
interface WeekHeaderRowProps {
  dates: Date[];
  appointmentCounts?: Record<string, number>;
  onDayClick?: (date: Date) => void;
}

// Memoized week header row
export const WeekHeaderRow = memo(function WeekHeaderRow({
  dates,
  appointmentCounts = {},
  onDayClick
}: WeekHeaderRowProps) {
  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="week-header-row">
      {/* Time column spacer */}
      <div className="time-column-spacer">
        <i className="far fa-clock text-slate-400"></i>
      </div>

      {/* Day columns */}
      {dates.map((date) => {
        const dateKey = date.toISOString().split('T')[0];
        return (
          <DayHeader
            key={dateKey}
            date={date}
            isToday={dateKey === todayKey}
            appointmentCount={appointmentCounts[dateKey] || 0}
            onClick={onDayClick ? () => onDayClick(date) : undefined}
          />
        );
      })}
    </div>
  );
});
