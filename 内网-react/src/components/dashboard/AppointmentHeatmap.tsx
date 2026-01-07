import { useMemo, Fragment } from 'react';
import { useI18n } from '../../i18n';
import type { Appointment } from '../../types';

interface HeatmapProps {
  appointments: Appointment[];
}

interface HeatmapCell {
  day: number; // 0-5 (Mon-Sat)
  hour: number; // 8-18
  count: number;
  level: number; // 0-5 intensity
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_ZH = ['一', '二', '三', '四', '五', '六'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function AppointmentHeatmap({ appointments }: HeatmapProps) {
  const { t, lang } = useI18n();

  const heatmapData = useMemo(() => {
    // Count appointments by day and hour
    const counts = new Map<string, number>();
    let maxCount = 0;

    // Get last 4 weeks of data
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    appointments.forEach(appointment => {
      const dateKey = appointment.appointmentDate || appointment.dateKey;
      if (!dateKey) return;

      const date = new Date(dateKey);
      if (date < fourWeeksAgo) return;

      const dayOfWeek = date.getDay();
      // Skip Sunday (0)
      if (dayOfWeek === 0) return;
      const dayIndex = dayOfWeek - 1; // 0=Mon, 5=Sat

      const time = appointment.time || appointment.appointmentTime;
      if (!time) return;

      const hour = parseInt(time.split(':')[0]);
      if (hour < 9 || hour > 17) return;

      const key = `${dayIndex}-${hour}`;
      const currentCount = (counts.get(key) || 0) + 1;
      counts.set(key, currentCount);
      if (currentCount > maxCount) maxCount = currentCount;
    });

    // Generate heatmap cells with intensity levels
    const cells: HeatmapCell[] = [];
    for (let day = 0; day < 6; day++) {
      for (let hour = 9; hour <= 17; hour++) {
        const key = `${day}-${hour}`;
        const count = counts.get(key) || 0;
        const level = maxCount > 0 ? Math.min(5, Math.ceil((count / maxCount) * 5)) : 0;
        cells.push({ day, hour, count, level });
      }
    }

    return { cells, maxCount };
  }, [appointments]);

  const dayLabels = lang === 'zh' ? DAYS_ZH : DAYS;

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h3 className="heatmap-title">
          <div className="w-9 h-9 bg-[var(--color-primary-50)] rounded-xl flex items-center justify-center">
            <i className="fas fa-th text-[var(--color-primary)]"></i>
          </div>
          {t('dashboard.appointmentHeatmap')}
        </h3>
        <span className="text-xs text-[var(--color-text-muted)] font-medium">
          {t('dashboard.last4Weeks')}
        </span>
      </div>

      <div className="heatmap-grid">
        {/* Day headers */}
        <div className="heatmap-day-label"></div>
        {dayLabels.map((day, i) => (
          <div key={i} className="heatmap-day-label">{day}</div>
        ))}

        {/* Hour rows */}
        {HOURS.map(hour => (
          <Fragment key={`row-${hour}`}>
            <div className="heatmap-hour-label">
              {hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`}
            </div>
            {[0, 1, 2, 3, 4, 5].map(day => {
              const cell = heatmapData.cells.find(c => c.day === day && c.hour === hour);
              return (
                <div
                  key={`${day}-${hour}`}
                  className={`heatmap-cell level-${cell?.level || 0}`}
                  title={`${dayLabels[day]} ${hour}:00 - ${cell?.count || 0} ${t('dashboard.appointments')}`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span>{t('dashboard.less')}</span>
        <div className="heatmap-legend-item level-0"></div>
        <div className="heatmap-legend-item level-1"></div>
        <div className="heatmap-legend-item level-2"></div>
        <div className="heatmap-legend-item level-3"></div>
        <div className="heatmap-legend-item level-4"></div>
        <div className="heatmap-legend-item level-5"></div>
        <span>{t('dashboard.more')}</span>
      </div>
    </div>
  );
}
