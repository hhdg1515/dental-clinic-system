import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useI18n } from '../i18n';
import {
  getAllAppointments,
  updateAppointmentStatus,
  updateAppointment,
  addAppointment,
} from '../services/admin-data-service';
import type { Appointment, AppointmentStatus } from '../types';
import PatientAccountModal from '../components/PatientAccountModal';
import { SERVICES, CLINICS, getStatusLabel } from '../constants';

// New modular calendar components
import {
  CalendarToolbar,
  CalendarGrid,
  TIME_SLOTS,
} from '../components/calendar';
import type { ViewType } from '../components/calendar';

interface AppointmentFormData {
  patientName: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  location: string;
  notes: string;
}

export default function Appointments() {
  const { userData, accessibleClinics: userClinics } = useAuth();
  const { t, lang } = useI18n();
  const { query } = useSearch();
  const [currentView, setCurrentView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Modal states
  const [showNewModal, setShowNewModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientName: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    service: '',
    location: '',
    notes: '',
  });

  // Get accessible clinics for dropdown
  const isOwner = userData?.role === 'owner';
  const accessibleClinics = useMemo(() => {
    return isOwner
      ? CLINICS
      : CLINICS.filter(c => userClinics?.includes(c.value));
  }, [isOwner, userClinics]);

  // Set default location for admin (single clinic) - only once
  const hasSetDefaultLocation = useRef(false);
  useEffect(() => {
    if (!hasSetDefaultLocation.current && !isOwner && accessibleClinics.length === 1) {
      setFormData(prev => ({ ...prev, location: accessibleClinics[0].value }));
      hasSetDefaultLocation.current = true;
    }
  }, [isOwner, accessibleClinics]);

  // Load appointments
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const userRole = userData?.role || null;
      const clinics = userClinics || [];
      const all = await getAllAppointments(userRole, clinics, true);
      setAppointments(all);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [userData?.role, userClinics]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = useMemo(() => {
    if (!query.trim()) return appointments;
    const normalizedQuery = query.toLowerCase();
    const queryDigits = normalizedQuery.replace(/\D/g, '');
    return appointments.filter((appointment) => {
      const name = appointment.patientName?.toLowerCase() || '';
      const phone = (appointment.phone || appointment.patientPhone || '').replace(/\D/g, '');
      return name.includes(normalizedQuery) || (queryDigits && phone.includes(queryDigits));
    });
  }, [appointments, query]);

  // Navigation handlers
  const handleNavigatePrev = useCallback(() => {
    const newDate = new Date(currentDate);
    if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  const handleNavigateNext = useCallback(() => {
    const newDate = new Date(currentDate);
    if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  const handleGoToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Appointment click handlers
  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowProcessModal(true);
  }, []);

  const handleViewPatient = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowPatientModal(true);
  }, []);

  // Slot click for quick appointment creation
  const handleSlotClick = useCallback((date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    setFormData(prev => ({
      ...prev,
      date: dateStr,
      time: timeStr,
    }));
    setShowNewModal(true);
  }, []);

  // Process appointment action
  const handleProcessAction = async (action: AppointmentStatus | 'edit') => {
    if (!selectedAppointment) return;

    // Edit action - open edit modal with pre-filled data
    if (action === 'edit') {
      setFormData({
        patientName: selectedAppointment.patientName,
        phone: selectedAppointment.phone || selectedAppointment.patientPhone || '',
        date: selectedAppointment.dateKey || selectedAppointment.appointmentDate || '',
        time: selectedAppointment.time,
        service: selectedAppointment.service || selectedAppointment.serviceType || '',
        location: selectedAppointment.clinicLocation || selectedAppointment.location || '',
        notes: selectedAppointment.notes || '',
      });
      setEditingAppointmentId(selectedAppointment.id);
      setShowProcessModal(false);
      setShowNewModal(true);
      return;
    }

    // Status change actions
    try {
      await updateAppointmentStatus(selectedAppointment.id, action, {
        [`${action}At`]: new Date().toISOString(),
        [`${action}By`]: userData?.displayName || 'Admin',
      }, userData?.role ?? null, userClinics ?? []);
      setShowProcessModal(false);
      setSelectedAppointment(null);
      await loadAppointments();
    } catch (error) {
      console.error('Error processing appointment:', error);
      alert(t('calendar.processError'));
    }
  };

  // New/Edit appointment submit
  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAppointmentId) {
        // Update existing appointment
        await updateAppointment(editingAppointmentId, {
          patientName: formData.patientName,
          phone: formData.phone,
          dateKey: formData.date,
          appointmentDate: formData.date,
          time: formData.time,
          service: formData.service,
          serviceType: formData.service,
          clinicLocation: formData.location,
          location: formData.location,
          notes: formData.notes,
          updatedAt: new Date().toISOString(),
          updatedBy: userData?.displayName || 'Admin',
        }, userData?.role ?? null, userClinics ?? []);
      } else {
        // Create new appointment
        const userRole = userData?.role || null;
        const clinics = userClinics || [];
        await addAppointment(
          {
            patientName: formData.patientName,
            phone: formData.phone,
            date: formData.date,
            time: formData.time,
            service: formData.service,
            location: formData.location,
            notes: formData.notes,
          },
          userRole,
          clinics
        );
      }

      // Reset form and close modal
      setShowNewModal(false);
      setEditingAppointmentId(null);
      setSelectedAppointment(null);
      setFormData({
        patientName: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        service: '',
        location: accessibleClinics[0]?.value || '',
        notes: '',
      });
      await loadAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert(editingAppointmentId ? t('calendar.saveErrorUpdate') : t('calendar.saveErrorCreate'));
    }
  };

  // Reset form when closing modal
  const handleCloseNewModal = () => {
    setShowNewModal(false);
    setEditingAppointmentId(null);
    setSelectedAppointment(null);
    setFormData({
      patientName: '',
      phone: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      service: '',
      location: accessibleClinics[0]?.value || '',
      notes: '',
    });
  };

  // Format helper
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Calendar Container */}
      <div className="calendar-grid-wrapper">
        {/* Toolbar */}
        <CalendarToolbar
          currentDate={currentDate}
          currentView={currentView}
          onNavigatePrev={handleNavigatePrev}
          onNavigateNext={handleNavigateNext}
          onGoToday={handleGoToday}
          onViewChange={setCurrentView}
          onNewAppointment={() => setShowNewModal(true)}
        />

        {/* Calendar Grid */}
        {loading ? (
          <div className="calendar-loading">
            <div className="spinner"></div>
            <span className="loading-text">{t('calendar.loading')}</span>
          </div>
        ) : (
          <CalendarGrid
            appointments={filteredAppointments}
            currentDate={currentDate}
            currentView={currentView}
            onAppointmentClick={handleAppointmentClick}
            onViewPatient={handleViewPatient}
            onSlotClick={handleSlotClick}
          />
        )}
      </div>

      {/* Process Modal - Glass Style */}
      {showProcessModal && selectedAppointment && (
        <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-modal-content max-w-md w-full animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-white/20 relative z-10">
              <h3 className="text-xl font-bold text-gray-800">{t('calendar.processAppointment')}</h3>
              <button
                onClick={() => { setShowProcessModal(false); setSelectedAppointment(null); }}
                className="p-2 text-gray-400 hover:bg-gray-100/80 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 relative z-10">
              {/* Appointment Summary */}
              <div className="mb-6 p-4 glass-card">
                <h4 className="font-bold text-gray-800 mb-2">{selectedAppointment.patientName}</h4>
                <div className="text-sm text-gray-600 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <i className="far fa-calendar text-admin-primary w-4"></i>
                    {t('calendar.date')}: {selectedAppointment.dateKey}
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="far fa-clock text-admin-primary w-4"></i>
                    {t('calendar.time')}: {formatTime(selectedAppointment.time)}
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-tooth text-admin-primary w-4"></i>
                    {t('calendar.service')}: {selectedAppointment.service || selectedAppointment.serviceType || t('calendar.unspecified')}
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-info-circle text-admin-primary w-4"></i>
                    {t('calendar.status')}: <span className={`badge badge-${selectedAppointment.status === 'completed' ? 'success' : selectedAppointment.status === 'no-show' ? 'danger' : selectedAppointment.status === 'pending' ? 'warning' : 'info'}`}>
                      {getStatusLabel(selectedAppointment.status, lang)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setShowProcessModal(false); handleViewPatient(selectedAppointment); }}
                  className="mt-4 text-admin-primary hover:underline text-sm flex items-center gap-2 font-medium"
                >
                  <i className="fas fa-user"></i>
                  {t('calendar.viewPatientAccount')}
                </button>
              </div>

              {/* Action Buttons - 3x2 Grid */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  {t('calendar.selectAction')}:
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {/* Row 1: 已到达 | 已完成 */}
                  <button
                    onClick={() => handleProcessAction('arrived')}
                    className={`px-3 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm backdrop-blur-sm ${
                      selectedAppointment.status === 'arrived'
                        ? 'border-blue-500 bg-blue-50/80 text-blue-700 shadow-md'
                        : 'border-gray-200/60 hover:border-blue-300 hover:bg-blue-50/50 bg-white/40'
                    }`}
                  >
                    <i className="fas fa-check-circle"></i>
                    <span className="font-medium">{t('calendar.arrived')}</span>
                  </button>

                  <button
                    onClick={() => handleProcessAction('completed')}
                    className={`px-3 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm backdrop-blur-sm ${
                      selectedAppointment.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-700 shadow-md'
                        : 'border-gray-200/60 hover:border-emerald-300 hover:bg-emerald-50/50 bg-white/40'
                    }`}
                  >
                    <i className="fas fa-check-double"></i>
                    <span className="font-medium">{t('calendar.completed')}</span>
                  </button>

                  {/* Row 2: 编辑 | 暂挂 */}
                  <button
                    onClick={() => handleProcessAction('edit')}
                    className="px-3 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm backdrop-blur-sm border-gray-200/60 hover:border-violet-300 hover:bg-violet-50/50 bg-white/40"
                  >
                    <i className="fas fa-edit"></i>
                    <span className="font-medium">{t('calendar.editAppointment')}</span>
                  </button>

                  <button
                    onClick={() => handleProcessAction('pending')}
                    className={`px-3 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm backdrop-blur-sm ${
                      selectedAppointment.status === 'pending'
                        ? 'border-amber-500 bg-amber-50/80 text-amber-700 shadow-md'
                        : 'border-gray-200/60 hover:border-amber-300 hover:bg-amber-50/50 bg-white/40'
                    }`}
                  >
                    <i className="fas fa-pause-circle"></i>
                    <span className="font-medium">{t('calendar.pending')}</span>
                  </button>

                  {/* Row 3: 未到场 | 取消预约 */}
                  <button
                    onClick={() => handleProcessAction('no-show')}
                    className={`px-3 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm backdrop-blur-sm ${
                      selectedAppointment.status === 'no-show'
                        ? 'border-red-500 bg-red-50/80 text-red-700 shadow-md'
                        : 'border-gray-200/60 hover:border-red-300 hover:bg-red-50/50 bg-white/40'
                    }`}
                  >
                    <i className="fas fa-user-times"></i>
                    <span className="font-medium">{t('calendar.noShow')}</span>
                  </button>

                  <button
                    onClick={() => handleProcessAction('cancelled')}
                    className={`px-3 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm backdrop-blur-sm ${
                      selectedAppointment.status === 'cancelled'
                        ? 'border-gray-500 bg-gray-100/80 text-gray-700 shadow-md'
                        : 'border-gray-200/60 hover:border-gray-400 hover:bg-gray-100/50 bg-white/40'
                    }`}
                  >
                    <i className="fas fa-times-circle"></i>
                    <span className="font-medium">{t('calendar.cancelAppointment')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Account Modal */}
      <PatientAccountModal
        isOpen={showPatientModal}
        onClose={() => {
          setShowPatientModal(false);
          setSelectedAppointment(null);
        }}
        patientData={selectedAppointment ? {
          patientName: selectedAppointment.patientName,
          phone: selectedAppointment.phone || selectedAppointment.patientPhone,
          email: selectedAppointment.email,
          userId: selectedAppointment.userId,
          clinicLocation: selectedAppointment.clinicLocation || selectedAppointment.location,
        } : null}
        onScheduleNew={() => setShowNewModal(true)}
      />

      {/* New/Edit Appointment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-modal-content max-w-lg w-full max-h-[90vh] overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-white/20 relative z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {editingAppointmentId ? t('calendar.editTitle') : t('calendar.createTitle')}
              </h3>
              <button
                onClick={handleCloseNewModal}
                className="p-2 text-gray-400 hover:bg-gray-100/80 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleNewSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)] relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.patientName')} *</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                  placeholder="(XXX) XXX-XXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.appointmentDate')} *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.appointmentTime')} *</label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">{t('calendar.selectTime')}</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.serviceType')} *</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="">{t('calendar.selectService')}</option>
                    {SERVICES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {lang === 'zh' ? s.labelZh || s.label : s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.clinic')} *</label>
                  {accessibleClinics.length === 1 ? (
                    <div className="form-input bg-gray-50 text-gray-700 cursor-not-allowed">
                      {accessibleClinics[0].label}
                    </div>
                  ) : (
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="form-input"
                      required
                    >
                      <option value="">{t('calendar.selectClinic')}</option>
                      {accessibleClinics.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  rows={3}
                  placeholder={t('calendar.notesPlaceholder')}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseNewModal}
                  className="btn-secondary flex-1"
                >
                  {t('calendar.cancel')}
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingAppointmentId ? t('calendar.saveChanges') : t('calendar.createAppointment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
