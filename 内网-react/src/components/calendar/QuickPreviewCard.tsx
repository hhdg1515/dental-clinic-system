import { useEffect, useRef, useState } from 'react';
import type { Appointment } from '../../types';
import { STATUS_STYLES, formatTime } from './types';
import { getStatusLabel } from '../../constants';
import { useI18n } from '../../i18n';

interface QuickPreviewCardProps {
  appointment: Appointment | null;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onViewPatient: (appointment: Appointment) => void;
  onProcess: (appointment: Appointment) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function QuickPreviewCard({
  appointment,
  anchorRect,
  onClose,
  onViewPatient,
  onProcess,
  onMouseEnter,
  onMouseLeave,
}: QuickPreviewCardProps) {
  const { lang, t } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'right' as 'left' | 'right' });
  const [isVisible, setIsVisible] = useState(false);

  // Calculate position when appointment changes
  useEffect(() => {
    if (!appointment || !anchorRect) {
      setIsVisible(false);
      return;
    }

    // Small delay for animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    const cardWidth = 320;
    const cardHeight = 200;
    const padding = 12;

    // Determine if card should go left or right
    const spaceOnRight = window.innerWidth - anchorRect.right;
    const placement = spaceOnRight >= cardWidth + padding ? 'right' : 'left';

    // Calculate position
    let left: number;
    if (placement === 'right') {
      left = anchorRect.right + padding;
    } else {
      left = anchorRect.left - cardWidth - padding;
    }

    // Vertical centering with bounds checking
    let top = anchorRect.top + (anchorRect.height / 2) - (cardHeight / 2);
    top = Math.max(padding, Math.min(top, window.innerHeight - cardHeight - padding));

    setPosition({ top, left, placement });

    return () => clearTimeout(timer);
  }, [appointment, anchorRect]);

  if (!appointment || !anchorRect) return null;

  const status = appointment.status || 'scheduled';
  const styles = STATUS_STYLES[status] || STATUS_STYLES.scheduled;

  return (
    <div
      ref={cardRef}
      className={`quick-preview-card ${isVisible ? 'visible' : ''} placement-${position.placement}`}
      style={{
        top: position.top,
        left: position.left,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave || onClose}
    >
      {/* Arrow pointer */}
      <div className={`preview-arrow ${position.placement}`}></div>

      {/* Header */}
      <div className="preview-header">
        <div className="patient-info">
          <div className="patient-avatar">
            {appointment.patientName.charAt(0).toUpperCase()}
          </div>
          <div className="patient-details">
            <h4 className="patient-name">{appointment.patientName}</h4>
            <span className={`status-badge ${styles.text} ${styles.bg}`}>
              {getStatusLabel(status, lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="preview-content">
        <div className="info-grid">
          <div className="info-item">
            <i className="far fa-calendar"></i>
            <span>{appointment.dateKey}</span>
          </div>
          <div className="info-item">
            <i className="far fa-clock"></i>
            <span>{formatTime(appointment.time)}</span>
          </div>
          <div className="info-item">
            <i className="fas fa-tooth"></i>
            <span>{appointment.service || appointment.serviceType || t('calendar.unspecified')}</span>
          </div>
          {appointment.phone && (
            <div className="info-item">
              <i className="fas fa-phone"></i>
              <span>{appointment.phone}</span>
            </div>
          )}
        </div>

        {appointment.notes && (
          <div className="notes-section">
            <i className="far fa-sticky-note"></i>
            <p>{appointment.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="preview-actions">
        <button
          className="action-btn secondary"
          onClick={(e) => {
            e.stopPropagation();
            onViewPatient(appointment);
          }}
        >
          <i className="fas fa-user"></i>
          {t('calendar.viewPatientProfile')}
        </button>
        <button
          className="action-btn primary"
          onClick={(e) => {
            e.stopPropagation();
            onProcess(appointment);
          }}
        >
          <i className="fas fa-edit"></i>
          {t('calendar.processAppointment')}
        </button>
      </div>
    </div>
  );
}
