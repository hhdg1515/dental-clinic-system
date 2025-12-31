import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import {
  getPendingAppointments,
  getAllAppointments,
  getCancelledAppointments,
  updateAppointmentStatus,
  updateAppointment,
  addAppointment,
} from '../services/admin-data-service';
import type { Appointment, AppointmentStatus } from '../types';
import { TIME_SLOTS, SERVICES, CLINICS, STATUS_COLORS, getStatusLabel } from '../constants';
import { useI18n } from '../i18n';

type TabType = 'pending' | 'confirmed';

interface PatientFormData {
  patientName: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  time: string;
  location: string;
  notes: string;
}

const ITEMS_PER_PAGE = 8;

const DATE_YMD = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MDY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const TIME_24 = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const TIME_12 = /^([1-9]|1[0-2]):([0-5]\d)\s*([AaPp][Mm])$/;

const toCleanString = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const looksLikePhone = (value: string) => value.replace(/\D/g, '').length >= 7;
const normalizePhoneKey = (value: string) => value.replace(/\D/g, '');
const normalizeEmailKey = (value: string) => value.trim().toLowerCase();

const extractDateFromString = (value: string) => {
  const ymd = value.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (ymd) return ymd[0];
  const mdy = value.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
  if (mdy) {
    const [month, day, year] = mdy[0].split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
};

const extractTimeFromString = (value: string) => {
  const time24 = value.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
  if (time24) {
    const [hours, minutes] = time24[0].split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  const time12 = value.match(/\b([1-9]|1[0-2]):([0-5]\d)\s*([AaPp][Mm])\b/);
  if (time12) {
    const [, hours, minutes, meridiem] = time12;
    let hour = parseInt(hours, 10);
    const isPm = meridiem.toLowerCase() === 'pm';
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minutes}`;
  }
  return '';
};

const normalizeDateKey = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (DATE_YMD.test(trimmed)) return trimmed;
  const mdy = trimmed.match(DATE_MDY);
  if (mdy) {
    const [, month, day, year] = mdy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const extracted = extractDateFromString(trimmed);
  if (extracted) return extracted;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
};

const normalizeTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (TIME_24.test(trimmed)) {
    const [hours, minutes] = trimmed.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  const extracted = extractTimeFromString(trimmed);
  return extracted || '';
};

const looksLikeName = (value: string) => {
  if (!value) return false;
  if (extractDateFromString(value) || extractTimeFromString(value)) return false;
  if (looksLikePhone(value)) return false;
  return /[A-Za-z\u4e00-\u9fff]/.test(value);
};

const getDateFromDateTime = (value: unknown) => {
  if (!value) return '';
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'string') {
    return normalizeDateKey(value);
  }
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === 'function') {
      const dateObj = candidate.toDate();
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return '';
};

const getTimeFromDateTime = (value: unknown) => {
  if (!value) return '';
  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  if (typeof value === 'string') {
    return normalizeTime(value);
  }
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === 'function') {
      const dateObj = candidate.toDate();
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }
  return '';
};

type AppointmentDisplay = {
  patientName: string;
  dateKey: string;
  time: string;
  phone: string;
};

const getAppointmentDisplay = (appointment: Appointment): AppointmentDisplay => {
  const raw = appointment as Appointment & Record<string, unknown>;

  const nameCandidates = [
    raw.patientName,
    raw.name,
    raw.fullName,
    raw.customerName,
    raw.patient,
    raw.contactName,
    raw.patient_name,
  ].map(toCleanString).filter(Boolean);

  const phoneCandidates = [
    raw.phone,
    raw.patientPhone,
    raw.contactPhone,
    raw.mobile,
    raw.tel,
    raw.phoneNumber,
  ].map(toCleanString).filter(Boolean);

  const dateCandidates = [
    raw.dateKey,
    raw.appointmentDate,
    raw.date,
    raw.appointment_date,
  ].map(toCleanString).filter(Boolean);

  const timeCandidates = [
    raw.time,
    raw.appointmentTime,
    raw.timeSlot,
    raw.appointment_time,
  ].map(toCleanString).filter(Boolean);

  const patientName = nameCandidates.find(looksLikeName)
    || dateCandidates.find(looksLikeName)
    || timeCandidates.find(looksLikeName)
    || '';

  const phone = phoneCandidates.find(looksLikePhone)
    || timeCandidates.find(looksLikePhone)
    || dateCandidates.find(looksLikePhone)
    || '';

  const dateKey = dateCandidates.map(normalizeDateKey).find(Boolean)
    || normalizeDateKey(patientName)
    || getDateFromDateTime(raw.appointmentDateTime);

  const time = timeCandidates.map(normalizeTime).find(Boolean)
    || extractTimeFromString(dateCandidates.join(' '))
    || getTimeFromDateTime(raw.appointmentDateTime);

  return { patientName, dateKey, time, phone };
};

export default function Patients() {
  const { userData, accessibleClinics: userClinics, currentUser } = useAuth();
  const { t, lang } = useI18n();
  const { query, setQuery } = useSearch();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [loading, setLoading] = useState(true);

  // Data state
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [confirmedAppointments, setConfirmedAppointments] = useState<Appointment[]>([]);

  // Pagination state
  const [pendingPage, setPendingPage] = useState(1);
  const [confirmedPage, setConfirmedPage] = useState(1);

  // Modal state
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);
  const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([]);

  // Form state
  const [formData, setFormData] = useState<PatientFormData>({
    patientName: '',
    phone: '',
    email: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    notes: '',
  });

  // Get accessible clinics for dropdown
  const isOwner = userData?.role === 'owner';
  const accessibleClinics = isOwner
    ? CLINICS
    : CLINICS.filter(c => userClinics?.includes(c.value));

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userRole = userData?.role || null;
      const clinics = userClinics || [];
      const clinicId = isOwner ? null : (userClinics?.[0] as ClinicId || null);

      // Load pending appointments
      const pending = await getPendingAppointments(clinicId);
      setPendingAppointments(pending);

      // Load all appointments and filter for confirmed
      const all = await getAllAppointments(userRole, clinics, true);
      const confirmed = all.filter(
        app => app.status !== 'pending' && app.status !== 'cancelled' && app.status !== 'declined'
      );
      // Sort by date descending
      confirmed.sort((a, b) => b.dateKey.localeCompare(a.dateKey) || b.time.localeCompare(a.time));
      setConfirmedAppointments(confirmed);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [isOwner, userData?.role, userClinics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPendingPage(1);
    setConfirmedPage(1);
  }, [query]);

  // Filter data based on search
  const filterData = (data: Appointment[]) => {
    if (!query.trim()) return data;
    const normalizedQuery = query.toLowerCase();
    const queryDigits = normalizedQuery.replace(/\D/g, '');
    return data.filter((app) => {
      const display = getAppointmentDisplay(app);
      return display.patientName.toLowerCase().includes(normalizedQuery) ||
        (queryDigits && display.phone.replace(/\D/g, '').includes(queryDigits));
    });
  };

  // Get current page data
  const getCurrentPageData = (data: Appointment[], page: number) => {
    const filtered = filterData(data);
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  };

  const getTotalPages = (data: Appointment[]) => {
    return Math.ceil(filterData(data).length / ITEMS_PER_PAGE);
  };

  // Format date for display
  const formatDate = (dateKey: string) => {
    if (!dateKey) return '-';
    if (!DATE_YMD.test(dateKey)) {
      const normalized = normalizeDateKey(dateKey);
      if (!normalized) return dateKey;
      dateKey = normalized;
    }
    const [year, month, day] = dateKey.split('-');
    if (!year || !month || !day) return dateKey;
    return `${month}/${day}/${year}`;
  };

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return '-';
    if (TIME_12.test(time)) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    if (Number.isNaN(hour) || !minutes || /\D/.test(minutes)) return time;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Load appointment history for a patient
  const loadAppointmentHistory = async (appointment: Appointment) => {
    try {
      const userRole = userData?.role || null;
      const clinics = userClinics || [];
      const all = await getAllAppointments(userRole, clinics, true);
      const cancelled = await getCancelledAppointments(userRole, clinics);

      const adminUserId = currentUser?.uid || '';
      const getIdentifiers = (app: Appointment) => {
        const userId = app.userId?.trim() || '';
        return {
          userId: userId && userId !== adminUserId ? userId : '',
          phone: normalizePhoneKey(app.phone || app.patientPhone || ''),
          email: normalizeEmailKey(app.email || ''),
          name: app.patientName?.trim() || '',
        };
      };
      const selected = getIdentifiers(appointment);

      const history = [...all, ...cancelled].filter((app) => {
        const current = getIdentifiers(app);
        if (selected.userId) {
          return (current.userId && current.userId === selected.userId)
            || (selected.phone && current.phone === selected.phone)
            || (selected.email && current.email && current.email === selected.email);
        }
        if (selected.phone || selected.email) {
          const matchesContact = (selected.phone && current.phone === selected.phone)
            || (selected.email && current.email && current.email === selected.email);
          if (matchesContact) return true;
          return !current.phone && !current.email && current.name === selected.name;
        }
        return current.name === selected.name;
      });

      history.sort((a, b) => {
        const dateA = `${a.dateKey}T${a.time}`;
        const dateB = `${b.dateKey}T${b.time}`;
        return dateB.localeCompare(dateA);
      });

      setAppointmentHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
      setAppointmentHistory([]);
    }
  };

  // Handle confirm action
  const handleConfirm = async (appointment: Appointment) => {
    if (!confirm(t('patients.prompts.confirm', { name: appointment.patientName }))) return;

    try {
      await updateAppointmentStatus(appointment.id, 'confirmed', {
        confirmedAt: new Date().toISOString(),
        confirmedBy: userData?.displayName || 'Admin',
      }, userData?.role ?? null, userClinics ?? []);
      await loadData();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert(t('patients.errors.confirm'));
    }
  };

  // Handle decline action
  const handleDecline = async (appointment: Appointment) => {
    if (!confirm(t('patients.prompts.decline', { name: appointment.patientName }))) return;

    try {
      await updateAppointmentStatus(appointment.id, 'declined', {
        declinedAt: new Date().toISOString(),
        declinedBy: userData?.displayName || 'Admin',
      }, userData?.role ?? null, userClinics ?? []);
      await loadData();
    } catch (error) {
      console.error('Error declining appointment:', error);
      alert(t('patients.errors.decline'));
    }
  };

  // Handle process action
  const handleProcessAction = async (status: AppointmentStatus) => {
    if (!selectedPatient) return;

    try {
      await updateAppointmentStatus(selectedPatient.id, status, {
        [`${status}At`]: new Date().toISOString(),
        [`${status}By`]: userData?.displayName || 'Admin',
      }, userData?.role ?? null, userClinics ?? []);
      setShowProcessModal(false);
      setSelectedPatient(null);
      await loadData();
    } catch (error) {
      console.error('Error processing appointment:', error);
      alert(t('patients.errors.process'));
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      await updateAppointment(selectedPatient.id, {
        patientName: formData.patientName,
        phone: formData.phone,
        email: formData.email,
        service: formData.service,
      }, userData?.role ?? null, userClinics ?? []);
      setShowEditModal(false);
      setShowPatientModal(false);
      await loadData();
    } catch (error) {
      console.error('Error updating patient:', error);
      alert(t('patients.errors.update'));
    }
  };

  // Handle new appointment submit
  const handleNewAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addAppointment({
        patientName: formData.patientName,
        phone: formData.phone,
        email: formData.email,
        date: formData.date,
        time: formData.time,
        service: formData.service,
        location: formData.location,
        notes: formData.notes,
      }, userData?.role ?? null, userClinics ?? []);
      setShowNewAppointmentModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert(t('patients.errors.create'));
    }
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      phone: '',
      email: '',
      service: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: accessibleClinics[0]?.value || '',
      notes: '',
    });
  };

  // Open patient detail modal
  const openPatientModal = (appointment: Appointment) => {
    setSelectedPatient(appointment);
    loadAppointmentHistory(appointment);
    setShowPatientModal(true);
  };

  // Open process modal
  const openProcessModal = (appointment: Appointment) => {
    setSelectedPatient(appointment);
    setShowProcessModal(true);
  };

  // Open edit modal
  const openEditModal = () => {
    if (!selectedPatient) return;
    setFormData({
      patientName: selectedPatient.patientName,
      phone: selectedPatient.phone || selectedPatient.patientPhone || '',
      email: selectedPatient.email || '',
      service: selectedPatient.service || selectedPatient.serviceType || '',
      date: selectedPatient.dateKey,
      time: selectedPatient.time,
      location: selectedPatient.clinicLocation || '',
      notes: selectedPatient.notes || '',
    });
    setShowEditModal(true);
  };

  // Current data for display
  const currentPending = getCurrentPageData(pendingAppointments, pendingPage);
  const currentConfirmed = getCurrentPageData(confirmedAppointments, confirmedPage);
  const pendingTotalPages = getTotalPages(pendingAppointments);
  const confirmedTotalPages = getTotalPages(confirmedAppointments);
  const filteredPendingCount = filterData(pendingAppointments).length;
  const filteredConfirmedCount = filterData(confirmedAppointments).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('patients.title')}</h1>
          <p className="text-gray-500 mt-1">{t('patients.subtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowNewAppointmentModal(true);
          }}
        >
          <i className="fas fa-plus mr-2"></i>
          {t('patients.newAppointment')}
        </button>
      </div>

      {/* Main Card - Glass Style */}
      <div className="glass-card p-6">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setActiveTab('pending'); setPendingPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors border border-transparent ${
                activeTab === 'pending'
                  ? 'bg-primary-50 text-primary border-primary/20 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-hourglass-half mr-2"></i>
              {t('patients.tabs.pending')}
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                {pendingAppointments.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('confirmed'); setConfirmedPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors border border-transparent ${
                activeTab === 'confirmed'
                  ? 'bg-primary-50 text-primary border-primary/20 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-check-circle mr-2"></i>
              {t('patients.tabs.upcoming')}
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                {confirmedAppointments.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder={t('patients.searchPlaceholder')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPendingPage(1);
                setConfirmedPage(1);
              }}
              className="form-input pl-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-admin-primary mb-4"></i>
            <p className="text-gray-500">{t('patients.loading')}</p>
          </div>
        ) : (
          <>
            {/* Pending Tab */}
            {activeTab === 'pending' && (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('patients.table.patientName')}</th>
                        <th>{t('patients.table.appointmentDate')}</th>
                        <th>{t('patients.table.phone')}</th>
                        <th>{t('patients.table.serviceType')}</th>
                        <th>{t('patients.table.clinic')}</th>
                        <th className="text-center">{t('patients.table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPending.map((appointment) => {
                        const display = getAppointmentDisplay(appointment);
                        return (
                        <tr
                          key={appointment.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => openPatientModal(appointment)}
                        >
                          <td className="font-medium">{display.patientName || '-'}</td>
                          <td className="text-gray-500">
                            {formatDate(display.dateKey)} {formatTime(display.time)}
                          </td>
                          <td className="text-gray-500">{display.phone || '-'}</td>
                          <td className="text-gray-600">
                            {appointment.service || appointment.serviceType || t('patients.unspecified')}
                          </td>
                          <td className="text-gray-500">{appointment.location || appointment.clinicLocation || '-'}</td>
                          <td className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleConfirm(appointment)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title={t('patients.actions.confirm')}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                onClick={() => handleDecline(appointment)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title={t('patients.actions.decline')}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>

                {filteredPendingCount === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <i className="fas fa-inbox text-4xl mb-4"></i>
                    <p>{t('patients.empty.pending')}</p>
                  </div>
                )}

                {/* Pagination */}
                {pendingTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                      disabled={pendingPage === 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      <i className="fas fa-chevron-left mr-2"></i>
                      {t('patients.pagination.prev')}
                    </button>
                    <span className="text-gray-500">
                      {t('patients.pagination.page', { current: pendingPage, total: pendingTotalPages })}
                    </span>
                    <button
                      onClick={() => setPendingPage(p => Math.min(pendingTotalPages, p + 1))}
                      disabled={pendingPage === pendingTotalPages}
                      className="btn-secondary disabled:opacity-50"
                    >
                      {t('patients.pagination.next')}
                      <i className="fas fa-chevron-right ml-2"></i>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Confirmed Tab */}
            {activeTab === 'confirmed' && (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('patients.table.patientName')}</th>
                        <th>{t('patients.table.appointmentDate')}</th>
                        <th>{t('patients.table.phone')}</th>
                        <th>{t('patients.table.serviceType')}</th>
                        <th>{t('patients.table.clinic')}</th>
                        <th>{t('patients.table.status')}</th>
                        <th className="text-center">{t('patients.table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentConfirmed.map((appointment) => {
                        const display = getAppointmentDisplay(appointment);
                        return (
                        <tr
                          key={appointment.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => openPatientModal(appointment)}
                        >
                          <td className="font-medium">{display.patientName || '-'}</td>
                          <td className="text-gray-500">
                            {formatDate(display.dateKey)} {formatTime(display.time)}
                          </td>
                          <td className="text-gray-500">{display.phone || '-'}</td>
                          <td className="text-gray-600">
                            {appointment.service || appointment.serviceType || t('patients.unspecified')}
                          </td>
                          <td className="text-gray-500">{appointment.location || appointment.clinicLocation || '-'}</td>
                          <td className="text-gray-600">
                            {getStatusLabel(appointment.status, lang)}
                          </td>
                          <td className="text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openProcessModal(appointment)}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                              title={t('patients.actions.process')}
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>

                {filteredConfirmedCount === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <i className="fas fa-calendar-check text-4xl mb-4"></i>
                    <p>{t('patients.empty.upcoming')}</p>
                  </div>
                )}

                {/* Pagination */}
                {confirmedTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={() => setConfirmedPage(p => Math.max(1, p - 1))}
                      disabled={confirmedPage === 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      <i className="fas fa-chevron-left mr-2"></i>
                      {t('patients.pagination.prev')}
                    </button>
                    <span className="text-gray-500">
                      {t('patients.pagination.page', { current: confirmedPage, total: confirmedTotalPages })}
                    </span>
                    <button
                      onClick={() => setConfirmedPage(p => Math.min(confirmedTotalPages, p + 1))}
                      disabled={confirmedPage === confirmedTotalPages}
                      className="btn-secondary disabled:opacity-50"
                    >
                      {t('patients.pagination.next')}
                      <i className="fas fa-chevron-right ml-2"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Patient Details Modal - Glass Style */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-modal-content max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-white/20 relative z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedPatient.patientName}
              </h3>
              <button
                onClick={() => {
                  setShowPatientModal(false);
                  setSelectedPatient(null);
                }}
                className="p-2 text-gray-400 hover:bg-gray-100/80 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] relative z-10">
              {/* Basic Info Section */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-4">
                  {t('patients.patientModal.basicInfo')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-400 uppercase">{t('patients.patientModal.name')}</div>
                    <div className="text-gray-800">{selectedPatient.patientName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase">{t('patients.patientModal.phone')}</div>
                    <div className="text-gray-800">{selectedPatient.phone || selectedPatient.patientPhone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase">{t('patients.patientModal.email')}</div>
                    <div className="text-gray-800">{selectedPatient.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase">{t('patients.patientModal.clinic')}</div>
                    <div className="text-gray-800">{selectedPatient.location || selectedPatient.clinicLocation}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase">{t('patients.patientModal.service')}</div>
                    <div className="text-gray-800">
                      {selectedPatient.service || selectedPatient.serviceType || t('patients.unspecified')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedPatient.notes && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase mb-4">
                    {t('patients.patientModal.notes')}
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-gray-700">
                    {selectedPatient.notes}
                  </div>
                </div>
              )}

              {/* Appointment History Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-4">
                  {t('patients.patientModal.history')}
                </h4>
                {appointmentHistory.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {appointmentHistory.map((app) => (
                      <div key={app.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-800">
                            {formatDate(app.dateKey)}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[app.status] || 'bg-gray-100'}`}>
                            {getStatusLabel(app.status, lang)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>
                            {t('patients.patientModal.serviceLabel')}: {app.service || app.serviceType || t('patients.unspecified')}
                          </div>
                          <div>{t('patients.patientModal.timeLabel')}: {formatTime(app.time)}</div>
                          <div>{t('patients.patientModal.clinicLabel')}: {app.location || app.clinicLocation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">{t('patients.patientModal.noHistory')}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <button
                onClick={openEditModal}
                className="btn-secondary"
              >
                <i className="fas fa-edit mr-2"></i>
                {t('patients.actions.editInfo')}
              </button>
              <button
                onClick={() => {
                  setShowPatientModal(false);
                  setSelectedPatient(null);
                }}
                className="btn-primary"
              >
                {t('patients.actions.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Modal - Glass Style */}
      {showProcessModal && selectedPatient && (
        <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-modal-content max-w-md w-full animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-white/20 relative z-10">
              <h3 className="text-xl font-bold text-gray-800">{t('patients.processModal.title')}</h3>
              <button
                onClick={() => {
                  setShowProcessModal(false);
                  setSelectedPatient(null);
                }}
                className="p-2 text-gray-400 hover:bg-gray-100/80 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 relative z-10">
              {/* Appointment Summary */}
              <div className="mb-6 p-4 glass-card">
                <h4 className="font-bold text-gray-800 mb-2">{selectedPatient.patientName}</h4>
                <div className="text-sm text-gray-600 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-phone text-admin-primary w-4"></i>
                    {t('patients.processModal.phone')}: {selectedPatient.phone || selectedPatient.patientPhone || '-'}
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-tooth text-admin-primary w-4"></i>
                    {t('patients.processModal.service')}: {selectedPatient.service || selectedPatient.serviceType || t('patients.unspecified')}
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-info-circle text-admin-primary w-4"></i>
                    {t('patients.processModal.currentStatus')}: <span className={`badge badge-${selectedPatient.status === 'pending' ? 'warning' : 'info'}`}>
                      {getStatusLabel(selectedPatient.status, lang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-400 uppercase">
                  {t('patients.processModal.selectAction')}:
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleProcessAction('arrived')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedPatient.status === 'arrived'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <i className="fas fa-check-circle text-xl"></i>
                    <span>{t('patients.processModal.arrived')}</span>
                  </button>

                  <button
                    onClick={() => handleProcessAction('no-show')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedPatient.status === 'no-show'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <i className="fas fa-user-times text-xl"></i>
                    <span>{t('patients.processModal.noShow')}</span>
                  </button>

                  <button
                    onClick={() => handleProcessAction('completed')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedPatient.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <i className="fas fa-check-double text-xl"></i>
                    <span>{t('patients.processModal.completed')}</span>
                  </button>

                  <button
                    onClick={() => handleProcessAction('cancelled')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedPatient.status === 'cancelled'
                        ? 'border-gray-500 bg-gray-100 text-gray-700'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-times-circle text-xl"></i>
                    <span>{t('patients.processModal.cancelled')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Glass Style */}
      {showEditModal && selectedPatient && (
        <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-modal-content max-w-md w-full animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-white/20 relative z-10">
              <h3 className="text-xl font-bold text-gray-800">{t('patients.editModal.title')}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100/80 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.editModal.name')}</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.editModal.phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                  placeholder="(XXX) XXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.editModal.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.editModal.serviceType')}</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="form-input"
                >
                  <option value="">{t('patients.editModal.selectService')}</option>
                  {SERVICES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {lang === 'zh' ? s.labelZh || s.label : s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                >
                  {t('patients.editModal.cancel')}
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {t('patients.editModal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Appointment Modal - Glass Style */}
      {showNewAppointmentModal && (
        <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-modal-content max-w-lg w-full max-h-[90vh] overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-white/20 relative z-10">
              <h3 className="text-xl font-bold text-gray-800">{t('patients.newModal.title')}</h3>
              <button
                onClick={() => setShowNewAppointmentModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100/80 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleNewAppointmentSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)] relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.newModal.patientName')} *</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.newModal.phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input"
                    placeholder="(XXX) XXX-XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.newModal.email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.newModal.appointmentDate')} *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.newModal.appointmentTime')} *</label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">{t('patients.newModal.selectTime')}</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.newModal.serviceType')} *</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">{t('patients.newModal.selectService')}</option>
                    {SERVICES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {lang === 'zh' ? s.labelZh || s.label : s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.newModal.clinic')} *</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="form-input"
                    required
                    disabled={userData?.role === 'admin'}
                  >
                    <option value="">{t('patients.newModal.selectClinic')}</option>
                    {accessibleClinics.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.newModal.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  rows={3}
                  placeholder={t('patients.newModal.notesPlaceholder')}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewAppointmentModal(false)}
                  className="btn-secondary flex-1"
                >
                  {t('patients.newModal.cancel')}
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {t('patients.newModal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
