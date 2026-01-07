import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import type { Appointment } from '../../types';

interface BirthdayPatient {
  id: string;
  name: string;
  dateOfBirth: string;
  daysUntil: number;
  phone?: string;
}

interface PatientCarePanelProps {
  appointments: Appointment[];
  birthdayPatients?: BirthdayPatient[];
}

// Helper to get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Helper to format birthday display
function formatBirthdayDisplay(dateOfBirth: string, daysUntil: number, lang: string): string {
  if (daysUntil === 0) return lang === 'zh' ? '今天生日!' : 'Today!';
  if (daysUntil === 1) return lang === 'zh' ? '明天' : 'Tomorrow';
  if (daysUntil <= 7) return lang === 'zh' ? `${daysUntil}天后` : `In ${daysUntil} days`;

  const date = new Date(dateOfBirth);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

export default function PatientCarePanel({ appointments, birthdayPatients = [] }: PatientCarePanelProps) {
  const { t, lang } = useI18n();

  // Calculate recent no-shows that need follow-up
  const recentNoShows = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return appointments
      .filter(apt => {
        if (apt.status !== 'no-show') return false;
        const aptDate = new Date(apt.appointmentDate || apt.dateKey);
        return aptDate >= sevenDaysAgo;
      })
      .slice(0, 3);
  }, [appointments]);

  // Calculate inactive patients (no appointments in last 3 months)
  const inactivePatientCount = useMemo(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentPatients = new Set<string>();
    const allPatients = new Set<string>();

    appointments.forEach(apt => {
      const patientKey = apt.userId || apt.patientName;
      allPatients.add(patientKey);

      const aptDate = new Date(apt.appointmentDate || apt.dateKey);
      if (aptDate >= threeMonthsAgo) {
        recentPatients.add(patientKey);
      }
    });

    return Math.max(0, allPatients.size - recentPatients.size);
  }, [appointments]);

  // Today and this week birthdays
  const todayBirthdays = birthdayPatients.filter(p => p.daysUntil === 0);
  const weekBirthdays = birthdayPatients.filter(p => p.daysUntil > 0 && p.daysUntil <= 7);

  const hasBirthdays = birthdayPatients.length > 0;
  const hasNoShows = recentNoShows.length > 0;
  const hasInactive = inactivePatientCount > 0;
  const hasContent = hasBirthdays || hasNoShows || hasInactive;

  if (!hasContent) {
    return (
      <div className="patient-care-panel">
        <div className="care-panel-header">
          <h3 className="care-panel-title">
            <div className="care-panel-icon birthday">
              <i className="fas fa-heart"></i>
            </div>
            {t('dashboard.patientCare')}
          </h3>
        </div>
        <div className="empty-state-premium">
          <div className="empty-icon">
            <i className="fas fa-heart"></i>
          </div>
          <div className="empty-title">{t('dashboard.allPatientsHealthy')}</div>
          <div className="empty-description">{t('dashboard.noAlertsToday')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-care-panel">
      <div className="care-panel-header">
        <h3 className="care-panel-title">
          <div className="care-panel-icon birthday">
            <i className="fas fa-heart"></i>
          </div>
          {t('dashboard.patientCare')}
        </h3>
      </div>

      {/* Birthday Section */}
      {hasBirthdays && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-birthday-cake text-pink-500 text-sm"></i>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {t('dashboard.birthdays')}
            </span>
            {todayBirthdays.length > 0 && (
              <span className="birthday-badge today">{todayBirthdays.length}</span>
            )}
          </div>

          {todayBirthdays.map(patient => (
            <div key={patient.id} className="birthday-item">
              <div className="birthday-avatar">
                {getInitials(patient.name)}
              </div>
              <div className="birthday-info">
                <div className="birthday-name">{patient.name}</div>
                <div className="birthday-date">{formatBirthdayDisplay(patient.dateOfBirth, patient.daysUntil, lang)}</div>
              </div>
              <span className="birthday-badge today">{t('dashboard.today')}</span>
            </div>
          ))}

          {weekBirthdays.slice(0, 2).map(patient => (
            <div key={patient.id} className="birthday-item" style={{ background: 'linear-gradient(135deg, #fef3f2 0%, #fee2e2 100%)', borderLeftColor: '#fca5a5' }}>
              <div className="birthday-avatar" style={{ background: 'linear-gradient(135deg, #fca5a5 0%, #f87171 100%)' }}>
                {getInitials(patient.name)}
              </div>
              <div className="birthday-info">
                <div className="birthday-name">{patient.name}</div>
                <div className="birthday-date" style={{ color: '#dc2626' }}>{formatBirthdayDisplay(patient.dateOfBirth, patient.daysUntil, lang)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No-Show Follow-ups */}
      {hasNoShows && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-phone-alt text-orange-500 text-sm"></i>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {t('dashboard.followUpNeeded')}
            </span>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
              {recentNoShows.length}
            </span>
          </div>

          {recentNoShows.map(apt => (
            <Link
              key={apt.id}
              to={`/patients`}
              className="care-alert-item"
            >
              <div className="care-alert-icon warning">
                <i className="fas fa-user-times"></i>
              </div>
              <div className="care-alert-content">
                <div className="care-alert-title">{apt.patientName}</div>
                <div className="care-alert-subtitle">
                  {apt.appointmentDate} - {apt.service}
                </div>
              </div>
              <i className="fas fa-chevron-right text-xs text-[var(--color-text-muted)]"></i>
            </Link>
          ))}
        </div>
      )}

      {/* Inactive Patients Alert */}
      {hasInactive && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-clock text-yellow-500 text-sm"></i>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {t('dashboard.inactivePatients')}
            </span>
          </div>

          <Link to="/patients" className="care-alert-item">
            <div className="care-alert-icon warning">
              <i className="fas fa-user-clock"></i>
            </div>
            <div className="care-alert-content">
              <div className="care-alert-title">
                {t('dashboard.inactiveCount', { count: inactivePatientCount })}
              </div>
              <div className="care-alert-subtitle">
                {t('dashboard.noVisitIn3Months')}
              </div>
            </div>
            <i className="fas fa-chevron-right text-xs text-[var(--color-text-muted)]"></i>
          </Link>
        </div>
      )}
    </div>
  );
}
