import { useCallback, memo } from 'react';
import type { Appointment } from '../../types';
import { STATUS_STYLES, formatTime } from './types';
import { getStatusLabel } from '../../constants';
import { useI18n } from '../../i18n';

interface AppointmentBlockProps {
  appointment: Appointment;
  compact?: boolean;
  showTime?: boolean;
  onClick?: () => void;
}

// Memoized to prevent unnecessary re-renders in calendar grid
const AppointmentBlock = memo(function AppointmentBlock({
  appointment,
  compact = false,
  showTime = false,
  onClick,
}: AppointmentBlockProps) {
  const { lang, t } = useI18n();
  const status = appointment.status || 'scheduled';
  const styles = STATUS_STYLES[status] || STATUS_STYLES.scheduled;

  // Service icon mapping
  const getServiceIcon = (service: string): string => {
    const iconMap: Record<string, string> = {
      general: 'fa-tooth',
      implant: 'fa-screwdriver-wrench',
      extraction: 'fa-hand-holding-medical',
      preventive: 'fa-shield-heart',
      cosmetic: 'fa-sparkles',
      orthodontics: 'fa-teeth',
      'root-canals': 'fa-wave-pulse',
      restorations: 'fa-hammer',
      periodontics: 'fa-teeth-open',
    };
    return iconMap[service?.toLowerCase()] || 'fa-tooth';
  };

  // Handle click with event stop propagation to prevent bubble to parent (day-cell)
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onSlotClick on parent
    onClick?.();
  }, [onClick]);

  return (
    <div
      className={`appointment-block ${status} ${compact ? 'compact' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          onClick?.();
        }
      }}
    >
      {/* Status indicator bar */}
      <div className={`status-bar ${styles.bg}`}></div>

      {/* Content */}
      <div className="block-content">
        {/* Header with name and status badge */}
        <div className="block-header">
          <span className="patient-name">{appointment.patientName}</span>
          {!compact && (
            <span className={`status-badge ${styles.text} ${styles.bg}`}>
              {getStatusLabel(status, lang)}
            </span>
          )}
        </div>

        {/* Details */}
        {!compact && (
          <div className="block-details">
            {showTime && (
              <span className="detail-item time">
                <i className="far fa-clock"></i>
                {formatTime(appointment.time)}
              </span>
            )}
            <span className="detail-item service">
              <i className={`fas ${getServiceIcon(appointment.service || appointment.serviceType || '')}`}></i>
              {appointment.service || appointment.serviceType || t('calendar.unspecified')}
            </span>
          </div>
        )}

        {/* Compact: just show time */}
        {compact && showTime && (
          <span className="compact-time">{formatTime(appointment.time)}</span>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="hover-overlay"></div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.appointment.id === nextProps.appointment.id &&
    prevProps.appointment.status === nextProps.appointment.status &&
    prevProps.appointment.time === nextProps.appointment.time &&
    prevProps.appointment.patientName === nextProps.appointment.patientName &&
    prevProps.compact === nextProps.compact &&
    prevProps.showTime === nextProps.showTime
  );
});

export default AppointmentBlock;

// Stacked appointments indicator for when there are too many
interface StackedIndicatorProps {
  count: number;
  onClick?: () => void;
}

// Memoized stacked indicator
export const StackedIndicator = memo(function StackedIndicator({ count, onClick }: StackedIndicatorProps) {
  const { t } = useI18n();
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onSlotClick on parent
    onClick?.();
  };

  return (
    <button
      className="stacked-indicator"
      onClick={handleClick}
      aria-label={t('calendar.moreAppointmentsAria', { count })}
    >
      <span className="stacked-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </span>
      <span className="stacked-text">{t('calendar.moreAppointments', { count })}</span>
    </button>
  );
});
