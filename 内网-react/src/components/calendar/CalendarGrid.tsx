import { useMemo, useCallback } from 'react';
import type { Appointment } from '../../types';
import {
  TIME_SLOTS,
  DAYS_ZH,
  DAYS_EN,
  formatDateKey,
  getWeekDates,
  getMonthDates,
  STATUS_STYLES,
  formatTime,
} from './types';
import type { ViewType } from './types';
import { WeekHeaderRow } from './DayHeader';
import AppointmentBlock, { StackedIndicator } from './AppointmentBlock';
import { useI18n } from '../../i18n';

interface CalendarGridProps {
  appointments: Appointment[];
  currentDate: Date;
  currentView: ViewType;
  onAppointmentClick: (appointment: Appointment) => void;
  onViewPatient: (appointment: Appointment) => void;
  onSlotClick?: (date: Date, hour: number) => void;
}

export default function CalendarGrid({
  appointments,
  currentDate,
  currentView,
  onAppointmentClick,
  onViewPatient,
  onSlotClick,
}: CalendarGridProps) {
  const { lang, locale, t } = useI18n();
  const dayNames = lang === 'zh' ? DAYS_ZH : DAYS_EN;
  // Note: Hover preview removed - click on appointment directly opens process modal

  // Date calculations
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const monthDates = useMemo(() => getMonthDates(currentDate), [currentDate]);
  const todayKey = formatDateKey(new Date());

  // Current time for indicator
  const currentHour = new Date().getHours();

  // Get appointments for a specific date
  const getAppointmentsForDate = useCallback(
    (dateKey: string) => appointments.filter((app) => app.dateKey === dateKey),
    [appointments]
  );

  // Get appointments for a specific hour
  const getAppointmentsForHour = useCallback(
    (dateKey: string, hour: number) =>
      appointments.filter((app) => {
        if (app.dateKey !== dateKey) return false;
        const appHour = parseInt(app.time.split(':')[0]);
        return appHour === hour;
      }),
    [appointments]
  );

  // Count appointments per day
  const appointmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach((app) => {
      counts[app.dateKey] = (counts[app.dateKey] || 0) + 1;
    });
    return counts;
  }, [appointments]);


  // Render Week View
  const renderWeekView = () => (
    <div className="calendar-week-view">
      {/* Header Row */}
      <WeekHeaderRow dates={weekDates} appointmentCounts={appointmentCounts} />

      {/* Time Grid */}
      <div className="week-grid-container">
        {/* Current time indicator line */}
        {currentHour >= 9 && currentHour < 17 && (
          <div
            className="current-time-line"
            style={{
              top: `${(currentHour - 9) * 72 + (new Date().getMinutes() / 60) * 72}px`,
            }}
          >
            <span className="time-badge">
              {new Date().toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="time-line-bar"></div>
          </div>
        )}

        {TIME_SLOTS.map((slot) => (
          <div
            key={slot.hour}
            className={`time-row ${currentHour === slot.hour ? 'is-current-hour' : ''}`}
          >
            {/* Time label */}
            <div className="time-label">
              <span className="hour">{slot.label}</span>
            </div>

            {/* Day columns */}
            {weekDates.map((date) => {
              const dateKey = formatDateKey(date);
              const hourAppointments = getAppointmentsForHour(dateKey, slot.hour);
              const isToday = dateKey === todayKey;
              const isCurrentSlot = isToday && currentHour === slot.hour;
              return (
                <div
                  key={dateKey}
                  className={`day-cell ${isToday ? 'is-today' : ''} ${isCurrentSlot ? 'is-current' : ''}`}
                  onClick={() => onSlotClick?.(date, slot.hour)}
                >
                  {hourAppointments.slice(0, 2).map((app) => (
                    <AppointmentBlock
                      key={app.id}
                      appointment={app}
                      compact
                      onClick={() => onAppointmentClick(app)}
                    />
                  ))}
                  {hourAppointments.length > 2 && (
                    <StackedIndicator
                      count={hourAppointments.length - 2}
                      onClick={() => onAppointmentClick(hourAppointments[0])}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  // Render Day View
  const renderDayView = () => {
    const dateKey = formatDateKey(currentDate);

    return (
      <div className="calendar-day-view">
        {/* Day header */}
        <div className="day-view-header">
          <div className="day-info">
            <span className="day-name">{dayNames[currentDate.getDay()]}</span>
            <span className="day-date">
              {currentDate.toLocaleDateString(locale, {
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="day-stats">
            <span className="stat">
              <i className="fas fa-calendar-check"></i>
              {t('calendar.appointmentsCount', {
                count: getAppointmentsForDate(dateKey).length,
              })}
            </span>
          </div>
        </div>

        {/* Time slots */}
        <div className="day-grid-container">
          {/* Current time indicator */}
          {dateKey === todayKey && currentHour >= 9 && currentHour < 17 && (
            <div
              className="current-time-line"
              style={{
                top: `${(currentHour - 9) * 88 + (new Date().getMinutes() / 60) * 88}px`,
              }}
            >
              <span className="time-badge">
                {new Date().toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <div className="time-line-bar"></div>
            </div>
          )}

          {TIME_SLOTS.map((slot) => {
            const hourAppointments = getAppointmentsForHour(dateKey, slot.hour);
            const isCurrentSlot = dateKey === todayKey && currentHour === slot.hour;

            return (
              <div
                key={slot.hour}
                className={`day-time-row ${isCurrentSlot ? 'is-current' : ''}`}
              >
                <div className="time-label">
                  <span className="hour">{slot.label}</span>
                </div>
                <div
                  className="appointments-container"
                  onClick={() => onSlotClick?.(currentDate, slot.hour)}
                >
                  {hourAppointments.map((app) => (
                    <AppointmentBlock
                      key={app.id}
                      appointment={app}
                      showTime
                      onClick={() => onAppointmentClick(app)}
                    />
                  ))}
                  {hourAppointments.length === 0 && (
                    <div className="empty-slot">
                      <i className="fas fa-plus"></i>
                      <span>{t('calendar.addAppointment')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Month View
  const renderMonthView = () => (
    <div className="calendar-month-view">
      {/* Weekday headers */}
      <div className="month-header-row">
        {dayNames.map((day) => (
          <div key={day} className="month-day-header">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="month-grid">
        {monthDates.map((date) => {
          const dateKey = formatDateKey(date);
          const dayAppointments = getAppointmentsForDate(dateKey);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = dateKey === todayKey;

          return (
            <div
              key={dateKey}
              className={`month-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`}
            >
              <div className={`date-number ${isToday ? 'today-badge' : ''}`}>
                {date.getDate()}
              </div>

              <div className="month-appointments">
                {dayAppointments.slice(0, 3).map((app) => {
                  const styles = STATUS_STYLES[app.status] || STATUS_STYLES.scheduled;
                  return (
                    <div
                      key={app.id}
                      className={`month-apt-item ${styles.bg} ${styles.text}`}
                      onClick={() => onAppointmentClick(app)}
                    >
                      <span className="time">{formatTime(app.time)}</span>
                      <span className="name">{app.patientName}</span>
                    </div>
                  );
                })}
                {dayAppointments.length > 3 && (
                  <div className="more-indicator">
                    {t('calendar.moreAppointments', { count: dayAppointments.length - 3 })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="calendar-grid-wrapper">
      {currentView === 'week' && renderWeekView()}
      {currentView === 'day' && renderDayView()}
      {currentView === 'month' && renderMonthView()}

    </div>
  );
}
