import { useMemo } from 'react';
import type { CalendarToolbarProps, ViewType } from './types';
import { useI18n } from '../../i18n';

export default function CalendarToolbar({
  currentDate,
  currentView,
  onNavigatePrev,
  onNavigateNext,
  onGoToday,
  onViewChange,
  onNewAppointment,
}: CalendarToolbarProps) {
  const { t, locale } = useI18n();

  const viewOptions: { value: ViewType; label: string; icon: string }[] = useMemo(() => ([
    { value: 'day', label: t('calendar.viewDay'), icon: 'fa-calendar-day' },
    { value: 'week', label: t('calendar.viewWeek'), icon: 'fa-calendar-week' },
    { value: 'month', label: t('calendar.viewMonth'), icon: 'fa-calendar-alt' },
  ]), [t]);

  const displayTitle = useMemo(() => {
    if (currentView === 'day') {
      return currentDate.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    }
    if (currentView === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startMonth = startOfWeek.toLocaleDateString(locale, { month: 'short' });
      const endMonth = endOfWeek.toLocaleDateString(locale, { month: 'short' });

      if (startMonth === endMonth) {
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${startMonth} ${currentDate.getFullYear()}`;
      }
      return `${startOfWeek.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth} ${currentDate.getFullYear()}`;
    }
    return currentDate.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
  }, [currentDate, currentView, locale]);

  const todayLabel = useMemo(() => {
    if (currentView === 'week') return t('calendar.thisWeek');
    if (currentView === 'month') return t('calendar.thisMonth');
    return t('calendar.today');
  }, [currentView, t]);

  const isCurrentPeriod = useMemo(() => {
    const today = new Date();
    if (currentView === 'month') {
      return (
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      );
    }
    if (currentView === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return today >= startOfWeek && today <= endOfWeek;
    }
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  }, [currentDate, currentView]);

  return (
    <div className="calendar-toolbar">
      {/* Left Section - Navigation */}
      <div className="toolbar-nav">
        <button
          onClick={onNavigatePrev}
          className="nav-btn"
          aria-label="Previous"
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        <button
          onClick={onGoToday}
          className={`today-btn ${isCurrentPeriod ? 'is-today' : ''}`}
        >
          <span className="today-dot"></span>
          {todayLabel}
        </button>

        <button
          onClick={onNavigateNext}
          className="nav-btn"
          aria-label="Next"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* Center - Title */}
      <h2 className="toolbar-title">{displayTitle}</h2>

      {/* Right Section - View Toggle & Actions */}
      <div className="toolbar-actions">
        {/* View Toggle Pills */}
        <div className="view-toggle-group">
          {viewOptions.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => onViewChange(value)}
              className={`view-toggle-btn ${currentView === value ? 'active' : ''}`}
              aria-pressed={currentView === value}
            >
              <i className={`fas ${icon}`}></i>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* New Appointment Button */}
        {onNewAppointment && (
          <button onClick={onNewAppointment} className="new-apt-btn">
            <i className="fas fa-plus"></i>
            <span>{t('calendar.newAppointment')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
