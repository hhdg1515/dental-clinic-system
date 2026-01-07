import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import {
  getAppointmentsForDate,
  getAllAppointments,
  getPendingConfirmations,
  CLINIC_DISPLAY_NAMES
} from '../services/admin-data-service';
import { getStatusLabel } from '../constants';
import { useAnimatedNumber, useAnimatedPercentage } from '../hooks';
import { useI18n } from '../i18n';
import { AppointmentHeatmap, PatientCarePanel } from '../components/dashboard';
import type { Appointment, PendingConfirmation, ClinicId, UserRole, AppointmentStatus } from '../types';

type ServicePeriod = 'weekly' | 'monthly';

const SERVICE_COLOR_MAP: Record<string, string> = {
  'General': '#5B7FD8',
  'Implant': '#52C4A0',
  'Extraction': '#8B9DC3',
  'Preventive': '#DBA362',
  'Cosmetic': '#A78BCA',
  'Orthodontics': '#7ECBC9',
  'Root Canals': '#B8C5A6',
  'Restorations': '#E8A87C',
  'Periodontics': '#C4A5C7'
};

const SERVICE_ALIASES: Record<string, string> = {
  cleaning: 'Preventive',
  examination: 'Preventive',
  'root canal': 'Root Canals',
  'root canals': 'Root Canals',
  'root-canals': 'Root Canals',
  filling: 'Restorations',
  restorative: 'Restorations',
  orthodontics: 'Orthodontics',
  'teeth whitening': 'Cosmetic',
  cosmetic: 'Cosmetic',
  periodontics: 'Periodontics',
  periodontal: 'Periodontics',
  extraction: 'Extraction',
  implant: 'Implant',
  general: 'General'
};

const SERVICE_FALLBACK_COLORS = [
  '#5B7FD8',
  '#52C4A0',
  '#8B9DC3',
  '#DBA362',
  '#A78BCA',
  '#7ECBC9',
  '#B8C5A6',
  '#E8A87C',
  '#C4A5C7'
];

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatShortDate = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const getStartOfWeek = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

const normalizeServiceName = (raw: string | undefined) => {
  if (!raw) return 'General';
  const trimmed = raw.trim();
  if (!trimmed) return 'General';
  const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
  const alias = SERVICE_ALIASES[normalized];
  if (alias) return alias;
  const withSpaces = normalized.replace(/-/g, ' ');
  return withSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getServiceColor = (name: string) => {
  if (SERVICE_COLOR_MAP[name]) {
    return SERVICE_COLOR_MAP[name];
  }
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SERVICE_FALLBACK_COLORS.length;
  return SERVICE_FALLBACK_COLORS[index];
};

// Stats card component with animated numbers
interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  colorClass: string;
  bgClass: string;
  delay?: number;
}

function StatCard({ label, value, icon, colorClass, bgClass, delay = 0 }: StatCardProps) {
  const animatedValue = useAnimatedNumber(value, {
    duration: 1200,
    delay,
    easing: 'easeOut'
  });

  return (
    <div className="dashboard-stat-card glass-card stat-card p-6 hover:shadow-lg transition-all group">
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value stat-value-animated text-[var(--color-text-primary)] mt-2">
            {animatedValue}
          </p>
        </div>
        <div className={`w-14 h-14 ${bgClass} rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          <i className={`${icon} ${colorClass} text-2xl`}></i>
        </div>
      </div>
    </div>
  );
}

// Time range type for charts
type TimeRange = '7d' | '30d' | '90d';

// Time Range Selector component
function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (range: TimeRange) => void }) {
  const { t } = useI18n();
  return (
    <div className="time-range-selector">
      <button
        className={`time-range-btn ${value === '7d' ? 'active' : ''}`}
        onClick={() => onChange('7d')}
      >
        {t('dashboard.days7')}
      </button>
      <button
        className={`time-range-btn ${value === '30d' ? 'active' : ''}`}
        onClick={() => onChange('30d')}
      >
        {t('dashboard.days30')}
      </button>
      <button
        className={`time-range-btn ${value === '90d' ? 'active' : ''}`}
        onClick={() => onChange('90d')}
      >
        {t('dashboard.days90')}
      </button>
    </div>
  );
}

// Analysis card component with animated values
interface AnalysisCardProps {
  title: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  progress?: number;
  progressLabel?: string;
  delay?: number;
}

function AnalysisCard({ title, value, change, trend = 'up', progress, progressLabel, delay = 0 }: AnalysisCardProps) {
  // Handle both number and string values
  const numericValue = typeof value === 'number' ? value : 0;
  const isPercentage = typeof value === 'string' && value.endsWith('%');
  const percentValue = isPercentage ? parseInt(value as string) : 0;

  const animatedNumber = useAnimatedNumber(numericValue, {
    duration: 1500,
    delay,
    easing: 'easeOut'
  });

  const animatedPercent = useAnimatedPercentage(percentValue, {
    duration: 1500,
    delay,
    easing: 'easeOut'
  });

  const animatedProgress = useAnimatedNumber(progress ?? 0, {
    duration: 1800,
    delay: delay + 300,
    easing: 'easeOut'
  });

  const displayValue = typeof value === 'number'
    ? animatedNumber
    : isPercentage
      ? animatedPercent
      : value;

  return (
    <div className="dashboard-analysis-card glass-card stat-card p-6">
      <h3 className="stat-label mb-3">{title}</h3>
      <div className="stat-value stat-value-animated text-[var(--color-text-primary)]">
        {displayValue}
      </div>
      {change && (
        <div
          className={`text-sm mt-2 font-medium flex items-center gap-1.5 ${
            trend === 'down'
              ? 'text-[var(--color-error)]'
              : trend === 'neutral'
                ? 'text-[var(--color-text-muted)]'
                : 'text-[var(--color-success)]'
          }`}
        >
          {trend !== 'neutral' && (
            <i className={`fas fa-arrow-${trend === 'down' ? 'down' : 'up'} text-xs trend-icon`}></i>
          )}
          {change}
        </div>
      )}
      {progress !== undefined && (
        <div className="mt-4">
          <div className="progress-bar-container h-2.5 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
            <div
              className="progress-bar-fill h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-full"
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
          {progressLabel && (
            <p className="text-xs text-[var(--color-text-muted)] mt-2 font-medium">{progressLabel}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Quick stat card component with animation
interface QuickStatProps {
  value: number;
  label: string;
  colorClass?: string;
  delay?: number;
}

function QuickStatCard({ value, label, colorClass = 'text-gradient', delay = 0 }: QuickStatProps) {
  const animatedValue = useAnimatedNumber(value, {
    duration: 1000,
    delay,
    easing: 'easeOut'
  });

  return (
    <div className="dashboard-quick-stat glass-card p-6 text-center group hover:shadow-lg transition-all">
      <div className={`stat-value stat-value-animated ${colorClass}`}>
        {animatedValue}
      </div>
      <div className="stat-label mt-2">{label}</div>
    </div>
  );
}

// Mini calendar component
function MiniCalendar({ selectedDate, onDateSelect }: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}) {
  const { lang, locale } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty days for alignment
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekdays = useMemo(
    () => (lang === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']),
    [lang]
  );

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-[var(--color-text-primary)]">
          {currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="nav-arrow !p-2 !rounded-lg"
          >
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="nav-arrow !p-2 !rounded-lg"
          >
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {weekdays.map((day, i) => (
          <div key={i} className="text-xs font-semibold text-[var(--color-text-light)] py-2 uppercase tracking-wider">{day}</div>
        ))}
        {days.map((date, i) => (
          <button
            key={i}
            onClick={() => date && onDateSelect(date)}
            disabled={!date}
            className={`
              text-sm py-2 rounded-xl transition-all font-medium
              ${!date ? 'invisible' : ''}
              ${isToday(date) ? 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-lg glow-primary' : ''}
              ${isSelected(date) && !isToday(date) ? 'bg-[var(--color-primary-100)] text-[var(--color-primary)]' : ''}
              ${date && !isToday(date) && !isSelected(date) ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]' : ''}
            `}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { userData, accessibleClinics } = useAuth();
  const { t, locale, toggleLang, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<ClinicId | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Stats state
  const [todayStats, setTodayStats] = useState({
    completed: 0,
    inProgress: 0,
    scheduled: 0,
    noShow: 0
  });

  const [analysisStats, setAnalysisStats] = useState({
    allAppointments: 0,
    monthlyAppointments: 0,
    newPatients: 0,
    newPatientsChange: 0,
    newVips: 0,
    attendanceRate: 0,
    weeklyCompleted: 0,
    weeklyTotal: 0
  });

  // Data state
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [allAppointmentsData, setAllAppointmentsData] = useState<Appointment[]>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<PendingConfirmation[]>([]);
  const [servicePeriod, setServicePeriod] = useState<ServicePeriod>('weekly');
  const [trendTimeRange, setTrendTimeRange] = useState<TimeRange>('30d');

  // Get today's date key
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Determine user role for API calls
  const getUserRole = (): UserRole => {
    if (userData?.role === 'owner') return 'owner';
    if (userData?.role === 'admin') return 'admin';
    return 'admin';
  };

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const userRole = getUserRole();
      const clinics = accessibleClinics;

      // Load today's appointments
      const todayKey = getTodayKey();
      const appointments = await getAppointmentsForDate(todayKey, userRole, clinics, true);

      // Filter by selected clinic if not 'all'
      const filteredAppointments = selectedClinic === 'all'
        ? appointments
        : appointments.filter(a => a.clinicLocation === selectedClinic);

      setTodayAppointments(filteredAppointments);

      // Calculate today's stats
      const stats = {
        completed: filteredAppointments.filter(a => a.status === 'completed').length,
        inProgress: filteredAppointments.filter(a => a.status === 'arrived').length,
        scheduled: filteredAppointments.filter(a => a.status === 'scheduled').length,
        noShow: filteredAppointments.filter(a => a.status === 'no-show').length
      };
      setTodayStats(stats);

      // Load all appointments for analysis
      const allAppointments = await getAllAppointments(userRole, clinics, true);
      const filteredAll = selectedClinic === 'all'
        ? allAppointments
        : allAppointments.filter(a => a.clinicLocation === selectedClinic);
      setAllAppointmentsData(filteredAll);

      // Calculate this month's stats
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
      const thisMonthAppointments = filteredAll.filter(a => a.appointmentDate?.startsWith(thisMonth));

      const thisMonthPatients = new Set<string>();
      const lastMonthPatients = new Set<string>();

      filteredAll.forEach((appointment) => {
        const dateKey = appointment.appointmentDate || appointment.dateKey;
        if (!dateKey) return;

        const patientKey =
          appointment.userId ||
          appointment.patientPhone ||
          appointment.phone ||
          appointment.email ||
          appointment.patientName;

        if (!patientKey) return;

        if (dateKey.startsWith(thisMonth)) {
          thisMonthPatients.add(patientKey);
        } else if (dateKey.startsWith(lastMonth)) {
          lastMonthPatients.add(patientKey);
        }
      });

      const newPatients = thisMonthPatients.size;
      const newPatientsChange = newPatients - lastMonthPatients.size;

      // Calculate weekly stats
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const weeklyAppointments = filteredAll.filter(a => {
        const appointmentDate = new Date(a.appointmentDate);
        return appointmentDate >= startOfWeek && appointmentDate <= now;
      });

      const weeklyCompleted = weeklyAppointments.filter(a => a.status === 'completed').length;
      const weeklyTotal = weeklyAppointments.length;

      setAnalysisStats({
        allAppointments: filteredAll.length,
        monthlyAppointments: thisMonthAppointments.length,
        newPatients,
        newPatientsChange,
        newVips: Math.max(0, Math.round(newPatients * 0.1)),
        attendanceRate: weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0,
        weeklyCompleted,
        weeklyTotal
      });

      // Load pending confirmations
      const pending = await getPendingConfirmations(userRole, clinics);
      const filteredPending = selectedClinic === 'all'
        ? pending
        : pending.filter(p => {
            const clinicId = p.location?.toLowerCase().replace(/\s+/g, '-');
            return clinicId === selectedClinic;
          });
      setPendingConfirmations(filteredPending);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [userData, accessibleClinics, selectedClinic]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const trendData = useMemo(() => {
    const completedCounts = new Map<string, number>();
    allAppointmentsData.forEach((appointment) => {
      if (appointment.status !== 'completed') return;
      const dateKey = appointment.appointmentDate || appointment.dateKey;
      if (!dateKey) return;
      completedCounts.set(dateKey, (completedCounts.get(dateKey) || 0) + 1);
    });

    // Determine days based on time range
    const days = trendTimeRange === '7d' ? 7 : trendTimeRange === '30d' ? 30 : 90;

    const data = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = toDateKey(date);
      data.push({
        date: formatShortDate(dateKey),
        fullDate: dateKey,
        completed: completedCounts.get(dateKey) || 0
      });
    }
    return data;
  }, [allAppointmentsData, trendTimeRange]);

  const hasTrendData = useMemo(
    () => trendData.some(item => item.completed > 0),
    [trendData]
  );

  const serviceChartData = useMemo(() => {
    const now = new Date();
    const rangeStart = servicePeriod === 'weekly'
      ? getStartOfWeek(now)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeEnd = servicePeriod === 'weekly'
      ? new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + 6)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const counts = new Map<string, number>();

    allAppointmentsData.forEach((appointment) => {
      if (appointment.status === 'cancelled' || appointment.status === 'declined') return;
      const dateKey = appointment.appointmentDate || appointment.dateKey;
      if (!dateKey) return;
      const appointmentDate = parseDateKey(dateKey);
      if (appointmentDate < rangeStart || appointmentDate > rangeEnd) return;

      const serviceName = normalizeServiceName(appointment.service);
      counts.set(serviceName, (counts.get(serviceName) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: getServiceColor(name)
      }))
      .sort((a, b) => b.value - a.value);
  }, [allAppointmentsData, servicePeriod]);

  const serviceTotal = useMemo(
    () => serviceChartData.reduce((sum, item) => sum + item.value, 0),
    [serviceChartData]
  );

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get status badge class
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'completed': 'badge-success',
      'scheduled': 'badge-info',
      'arrived': 'badge-warning',
      'no-show': 'badge-danger',
      'cancelled': 'badge-gray',
      'pending': 'badge-warning'
    };
    return badges[status] || 'badge-gray';
  };

  // Get status display text
  const getStatusText = (status: string) => {
    return getStatusLabel(status as AppointmentStatus, lang);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto"></div>
          <p className="mt-6 text-[var(--color-text-muted)] font-medium">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-[var(--color-text-muted)] mt-2 font-medium">
            {new Date().toLocaleDateString(locale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Clinic Selector (for owners) */}
          {userData?.role === 'owner' && (
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value as ClinicId | 'all')}
              className="form-input w-auto py-2.5 min-w-[140px]"
            >
              <option value="all">{t('dashboard.clinicsAll')}</option>
              {accessibleClinics.map(clinic => (
                <option key={clinic} value={clinic}>
                  {CLINIC_DISPLAY_NAMES[clinic as ClinicId] || clinic}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={toggleLang}
            className="btn-secondary !px-3 !py-2"
            title={t('layout.languageToggleTitle')}
          >
            <i className="fas fa-globe mr-2"></i>
            <span className="text-sm font-semibold">{t('layout.languageToggleLabel')}</span>
          </button>

          <Link to="/appointments" className="btn-primary">
            <i className="fas fa-plus mr-2"></i>
            {t('dashboard.newAppointment')}
          </Link>
        </div>
      </div>

      {/* Status Cards Row */}
      <div className="dashboard-stats-grid grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label={t('dashboard.completed')}
          value={todayStats.completed}
          icon="fas fa-check-circle"
          colorClass="text-[var(--color-success)]"
          bgClass="bg-[var(--color-success-bg)]"
          delay={0}
        />
        <StatCard
          label={t('dashboard.inProgress')}
          value={todayStats.inProgress}
          icon="fas fa-clock"
          colorClass="text-[var(--color-info)]"
          bgClass="bg-[var(--color-info-bg)]"
          delay={100}
        />
        <StatCard
          label={t('dashboard.scheduled')}
          value={todayStats.scheduled}
          icon="fas fa-calendar-check"
          colorClass="text-[var(--color-primary)]"
          bgClass="bg-[var(--color-primary-50)]"
          delay={200}
        />
        <StatCard
          label={t('dashboard.noShow')}
          value={todayStats.noShow}
          icon="fas fa-times-circle"
          colorClass="text-[var(--color-error)]"
          bgClass="bg-[var(--color-error-bg)]"
          delay={300}
        />
      </div>

      {/* Analysis Cards Row */}
      <div className="dashboard-analysis-grid grid grid-cols-2 lg:grid-cols-4 gap-5">
        <AnalysisCard
          title={t('dashboard.totalAppointments')}
          value={analysisStats.allAppointments}
          change={t('dashboard.thisMonthCount', { count: analysisStats.monthlyAppointments })}
          trend="neutral"
          delay={400}
        />
        <AnalysisCard
          title={t('dashboard.newPatients')}
          value={analysisStats.newPatients}
          change={t('dashboard.vsLastMonth', {
            delta: analysisStats.newPatientsChange >= 0
              ? `+${analysisStats.newPatientsChange}`
              : analysisStats.newPatientsChange,
          })}
          trend={analysisStats.newPatientsChange < 0 ? 'down' : analysisStats.newPatientsChange === 0 ? 'neutral' : 'up'}
          delay={500}
        />
        <AnalysisCard
          title={t('dashboard.vipMembers')}
          value={analysisStats.newVips}
          change={t('dashboard.estimate')}
          trend="neutral"
          delay={600}
        />
        <AnalysisCard
          title={t('dashboard.attendanceRate')}
          value={`${analysisStats.attendanceRate}%`}
          progress={analysisStats.attendanceRate}
          progressLabel={t('dashboard.weeklyProgress', {
            completed: analysisStats.weeklyCompleted,
            total: analysisStats.weeklyTotal,
          })}
          delay={700}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Today's Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                <div className="w-9 h-9 bg-[var(--color-primary-50)] rounded-xl flex items-center justify-center">
                  <i className="fas fa-calendar-check text-[var(--color-primary)]"></i>
                </div>
                {t('dashboard.todaysAppointments')}
              </h2>
              <Link
                to="/appointments"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {t('dashboard.viewAll')} <i className="fas fa-arrow-right text-xs"></i>
              </Link>
            </div>

            {todayAppointments.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('dashboard.patientName')}</th>
                      <th>{t('dashboard.time')}</th>
                      <th>{t('dashboard.service')}</th>
                      <th>{t('dashboard.clinic')}</th>
                      <th>{t('dashboard.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppointments.slice(0, 8).map((appointment, index) => (
                      <tr key={appointment.id} className={`animate-slideIn stagger-${Math.min(index + 1, 5)}`}>
                        <td className="font-semibold text-[var(--color-text-primary)]">{appointment.patientName}</td>
                        <td className="font-medium">{formatTime(appointment.time)}</td>
                        <td>{appointment.service}</td>
                        <td className="text-[var(--color-text-muted)] text-sm">
                          {CLINIC_DISPLAY_NAMES[appointment.clinicLocation] || appointment.clinicLocation}
                        </td>
                        <td>
                          <span className={getStatusBadge(appointment.status)}>
                            {getStatusText(appointment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <i className="fas fa-calendar-times"></i>
                </div>
                <div className="empty-state-title">{t('dashboard.noAppointmentsToday')}</div>
                <div className="empty-state-description">{t('dashboard.createAppointmentPrompt')}</div>
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                <div className="w-9 h-9 bg-[var(--color-primary-50)] rounded-xl flex items-center justify-center">
                  <i className="fas fa-chart-area text-[var(--color-primary)]"></i>
                </div>
                {t('dashboard.completedTrend')}
              </h2>
              <TimeRangeSelector value={trendTimeRange} onChange={setTrendTimeRange} />
            </div>

            {hasTrendData ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--color-text-light)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(0,0,0,0.08)' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: 'var(--color-text-light)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(0,0,0,0.08)' }}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        t('dashboard.countAppointments', { count: value }),
                        t('dashboard.completedAppointmentsLabel'),
                      ]}
                      labelFormatter={(label: string, payload: Array<{ payload?: { fullDate?: string } }>) => {
                        const fullDate = payload?.[0]?.payload?.fullDate;
                        return fullDate || label;
                      }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: 'var(--shadow-md)',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(8px)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      fill="url(#colorCompleted)"
                      dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: 'white', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state-premium">
                <div className="empty-icon">
                  <i className="fas fa-chart-area"></i>
                </div>
                <div className="empty-title">{t('dashboard.noCompletedTitle')}</div>
                <div className="empty-description">{t('dashboard.noCompletedDesc')}</div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="dashboard-quick-stats grid grid-cols-3 gap-5">
            <QuickStatCard
              value={todayAppointments.length}
              label={t('dashboard.todayTotal')}
              colorClass="text-gradient"
              delay={0}
            />
            <QuickStatCard
              value={pendingConfirmations.length}
              label={t('dashboard.pendingConfirmations')}
              colorClass="text-[var(--color-warning)]"
              delay={100}
            />
            <QuickStatCard
              value={accessibleClinics.length}
              label={t('dashboard.accessibleClinics')}
              colorClass="text-[var(--color-primary)]"
              delay={200}
            />
          </div>

          {/* Appointment Heatmap - Full width in left column */}
          <AppointmentHeatmap appointments={allAppointmentsData} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pending Confirmations */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                {t('dashboard.pendingAppointments')}
                <span className="ml-1 px-2.5 py-1 bg-[var(--color-warning-bg)] text-[var(--color-warning)] rounded-full text-xs font-bold">
                  {pendingConfirmations.length}
                </span>
              </h3>
            </div>

            {pendingConfirmations.length > 0 ? (
              <div className="space-y-3">
                {pendingConfirmations.slice(0, 5).map((confirmation, index) => (
                  <div
                    key={confirmation.id}
                    className={`appointment-card pending animate-slideIn stagger-${Math.min(index + 1, 5)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="patient-name">{confirmation.patientName}</p>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                          {confirmation.appointmentDate} {confirmation.appointmentTime}
                        </p>
                        <p className="text-xs text-[var(--color-text-light)] mt-1">{confirmation.service}</p>
                      </div>
                      <Link
                        to="/patients"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/80 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-white transition-all shadow-sm"
                      >
                        <i className="fas fa-chevron-right text-xs"></i>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">
                <div className="empty-state-icon !w-12 !h-12 !mb-3">
                  <i className="fas fa-check-circle text-lg"></i>
                </div>
                <div className="empty-state-title text-sm">{t('dashboard.noPendingAppointments')}</div>
              </div>
            )}

            {pendingConfirmations.length > 0 && (
              <Link
                to="/patients"
                className="block text-center text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] text-sm mt-5 font-semibold transition-colors"
              >
                {t('dashboard.viewAllWithCount', { count: pendingConfirmations.length })}
              </Link>
            )}
          </div>

          {/* Mini Calendar */}
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-[var(--color-text-primary)]">
                {t('dashboard.serviceTypes')}
              </h3>
              <select
                value={servicePeriod}
                onChange={(e) => setServicePeriod(e.target.value as ServicePeriod)}
                className="form-input !py-2 !px-3 !text-xs !w-auto"
                aria-label={t('dashboard.selectServicePeriod')}
              >
                <option value="weekly">{t('dashboard.thisWeek')}</option>
                <option value="monthly">{t('dashboard.thisMonth')}</option>
              </select>
            </div>

            {serviceChartData.length > 0 ? (
              <>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {serviceChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          t('dashboard.countAppointments', { count: value }),
                          name,
                        ]}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          boxShadow: 'var(--shadow-md)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {serviceChartData.map((item) => {
                    const percent = serviceTotal > 0 ? Math.round((item.value / serviceTotal) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></span>
                          <span className="text-[var(--color-text-secondary)]">{item.name}</span>
                        </div>
                        <span className="text-[var(--color-text-light)]">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state !py-10">
                <div className="empty-state-icon">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <div className="empty-state-title">{t('dashboard.noServiceData')}</div>
                <div className="empty-state-description">{t('dashboard.noServiceDesc')}</div>
              </div>
            )}
          </div>

          {/* Patient Care Panel */}
          <PatientCarePanel appointments={allAppointmentsData} />

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="font-heading font-bold text-[var(--color-text-primary)] mb-5">
              {t('dashboard.quickActions')}
            </h3>
            <div className="space-y-3">
              <Link to="/appointments" className="btn-primary w-full justify-start">
                <i className="fas fa-calendar-plus mr-3"></i>
                {t('dashboard.newAppointment')}
              </Link>
              <Link to="/patients" className="btn-secondary w-full justify-start">
                <i className="fas fa-users mr-3"></i>
                {t('dashboard.managePatients')}
              </Link>
              <Link to="/appointments" className="btn-secondary w-full justify-start">
                <i className="fas fa-calendar-alt mr-3"></i>
                {t('dashboard.openCalendar')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
