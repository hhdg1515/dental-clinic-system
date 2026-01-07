import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllAppointments,
  getCancelledAppointments,
  getPatientProfile,
  setPatientProfile,
  getMedicalRecords,
  uploadMedicalRecord,
  deleteMedicalRecord,
  getDentalChart,
  initializeDentalChart,
  updateToothStatus,
  updateDetailedToothStatus,
  addToothTreatment,
  getDentalChartSnapshots,
  createDentalChartSnapshot,
  compareWithSnapshot,
} from '../services/admin-data-service';
import type {
  Appointment,
  PatientProfile,
  MedicalRecord,
  DentalChart,
  ToothStatus,
  DentalChartSnapshot,
  ChartComparison,
  TeethData,
} from '../types';
// PDF export functions are dynamically imported when needed (saves ~290KB initial bundle)
// import { exportDentalChartPDF, exportPatientReportPDF } from '../utils/pdfExport';
import { useI18n } from '../i18n';
import { STATUS_COLORS, getStatusLabel } from '../constants';

// Lazy load DentalChart3D (Three.js is heavy)
const DentalChart3D = lazy(() => import('./DentalChart3D'));

// Loading component for 3D chart
function Chart3DLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-[400px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 rounded-full border-4 border-teal-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-500 animate-spin"></div>
          <i className="fas fa-tooth absolute inset-0 flex items-center justify-center text-teal-400 text-2xl"></i>
        </div>
        <p className="text-slate-400 text-sm">{label}</p>
      </div>
    </div>
  );
}

type TabType = 'information' | 'history' | 'records' | 'dental-chart' | 'chart-history' | 'treatment';

interface PatientAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: {
    patientName: string;
    phone?: string;
    email?: string;
    userId?: string;
    clinicLocation?: string;
  } | null;
  onScheduleNew?: () => void;
}

export default function PatientAccountModal({
  isOpen,
  onClose,
  patientData,
  onScheduleNew,
}: PatientAccountModalProps) {
  const { userData, accessibleClinics: userClinics } = useAuth();
  const { t, locale, lang } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('information');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Data states
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [dentalChart, setDentalChart] = useState<DentalChart | null>(null);
  const [snapshots, setSnapshots] = useState<DentalChartSnapshot[]>([]);
  const [comparison, setComparison] = useState<ChartComparison | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    allergies: '',
    medications: '',
    conditions: '',
    notes: '',
  });

  // Selected tooth for dental chart
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const toothStatusOptions = useMemo(() => ([
    { value: 'healthy', label: t('dentalChart.status.healthy') },
    { value: 'monitor', label: t('dentalChart.status.monitor') },
    { value: 'cavity', label: t('dentalChart.status.cavity') },
    { value: 'filled', label: t('dentalChart.status.filled') },
    { value: 'missing', label: t('dentalChart.status.missing') },
    { value: 'implant', label: t('dentalChart.status.implant') },
    { value: 'root-canal', label: t('dentalChart.status.root-canal') },
    { value: 'post-op', label: t('dentalChart.status.post-op') },
    { value: 'urgent', label: t('dentalChart.status.urgent') },
  ]), [t]);
  const patientRecordId = useMemo(() => {
    if (!patientData) return '';
    const userId = patientData.userId?.trim();
    if (userId) return userId;
    const phoneDigits = patientData.phone?.replace(/\D/g, '') || '';
    if (phoneDigits) return `phone:${phoneDigits}`;
    const email = patientData.email?.trim().toLowerCase() || '';
    if (email) return `email:${email.replace(/[\\/]/g, '_')}`;
    const name = patientData.patientName?.trim() || '';
    if (!name) return '';
    return `name:${name.toLowerCase().replace(/\s+/g, '_').replace(/[\\/]/g, '_')}`;
  }, [patientData]);

  // Load patient data
  const loadPatientData = useCallback(async () => {
    if (!patientData) return;

    setLoading(true);
    try {
      // Load profile
      const patientId = patientData.userId || patientData.patientName;
      const loadedProfile = await getPatientProfile(patientId);
      setProfile(loadedProfile);

      if (loadedProfile) {
        setEditForm({
          phone: patientData.phone || '',
          email: patientData.email || '',
          address: (loadedProfile.detailedInfo?.address as string) || '',
          emergencyContact: (loadedProfile.detailedInfo?.emergencyContact as string) || '',
          dateOfBirth: (loadedProfile.detailedInfo?.dateOfBirth as string) || '',
          age: (loadedProfile.detailedInfo?.age as string) || '',
          gender: (loadedProfile.detailedInfo?.gender as string) || '',
          allergies: (loadedProfile.detailedInfo?.allergies as string) || '',
          medications: (loadedProfile.detailedInfo?.medications as string) || '',
          conditions: (loadedProfile.detailedInfo?.conditions as string) || '',
          notes: (loadedProfile.detailedInfo?.notes as string) || '',
        });
      } else {
        setEditForm({
          phone: patientData.phone || '',
          email: patientData.email || '',
          address: '',
          emergencyContact: '',
          dateOfBirth: '',
          age: '',
          gender: '',
          allergies: '',
          medications: '',
          conditions: '',
          notes: '',
        });
      }

      // Load appointment history
      const userRole = userData?.role || null;
      const clinics = userClinics || [];
      const allAppts = await getAllAppointments(userRole, clinics, true);
      const cancelledAppts = await getCancelledAppointments(userRole, clinics);
      const patientAppts = [...allAppts, ...cancelledAppts].filter((app) => {
        if (patientData.userId && app.userId) {
          return app.userId === patientData.userId;
        }
        return app.patientName === patientData.patientName;
      });
      patientAppts.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
      setAppointments(patientAppts);

      // Load medical records
      if (patientRecordId) {
        const loadedRecords = await getMedicalRecords(patientRecordId);
        setRecords(loadedRecords);

        // Load dental chart
        let chart = await getDentalChart(patientRecordId);
        if (!chart) {
          await initializeDentalChart(patientRecordId, patientData.patientName);
          chart = await getDentalChart(patientRecordId);
        }
        setDentalChart(chart);

        // Load snapshots
        const loadedSnapshots = await getDentalChartSnapshots(patientRecordId);
        setSnapshots(loadedSnapshots);
      } else {
        setRecords([]);
        setDentalChart(null);
        setSnapshots([]);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  }, [patientData, patientRecordId, userData?.role, userClinics]);

  useEffect(() => {
    if (isOpen && patientData) {
      setActiveTab('information');
      setIsEditing(false);
      setSelectedTooth(null);
      setComparison(null);
      loadPatientData();
    }
  }, [isOpen, patientData, loadPatientData]);

  // Save profile
  const handleSaveProfile = async () => {
    if (!patientData) return;

    try {
      const patientId = patientData.userId || patientData.patientName;
      await setPatientProfile(patientId, patientData.patientName, {
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        emergencyContact: editForm.emergencyContact,
        dateOfBirth: editForm.dateOfBirth,
        age: editForm.age,
        gender: editForm.gender,
        allergies: editForm.allergies,
        medications: editForm.medications,
        conditions: editForm.conditions,
        notes: editForm.notes,
      });
      setIsEditing(false);
      await loadPatientData();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(t('accountModal.alerts.saveProfileFail'));
    }
  };

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !patientRecordId) return;

    for (const file of Array.from(files)) {
      try {
        await uploadMedicalRecord(patientRecordId, file);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(t('accountModal.alerts.uploadFail', { name: file.name }));
      }
    }

    // Reload records
    const loadedRecords = await getMedicalRecords(patientRecordId);
    setRecords(loadedRecords);
    e.target.value = '';
  };

  // Delete record
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm(t('accountModal.records.deleteConfirm'))) return;

    try {
      await deleteMedicalRecord(recordId);
      setRecords(records.filter((r) => r.id !== recordId));
    } catch (error) {
      console.error('Error deleting record:', error);
      alert(t('accountModal.alerts.deleteRecordFail'));
    }
  };

  // Update tooth status
  const handleToothStatusChange = async (toothNum: number, status: ToothStatus) => {
    if (!patientRecordId) return;

    try {
      await updateToothStatus(patientRecordId, toothNum, { status });
      const chart = await getDentalChart(patientRecordId);
      setDentalChart(chart);
    } catch (error) {
      console.error('Error updating tooth status:', error);
    }
  };

  // Create snapshot
  const handleCreateSnapshot = async () => {
    if (!patientRecordId) return;

    const description = prompt(t('accountModal.snapshots.prompt'));
    if (!description) return;

    try {
      await createDentalChartSnapshot(patientRecordId, patientData.patientName, description);
      const loadedSnapshots = await getDentalChartSnapshots(patientRecordId);
      setSnapshots(loadedSnapshots);
      alert(t('accountModal.snapshots.created'));
    } catch (error) {
      console.error('Error creating snapshot:', error);
      alert(t('accountModal.alerts.snapshotCreateFail'));
    }
  };

  // Compare with snapshot
  const handleCompareSnapshot = async (snapshotId: string) => {
    if (!patientRecordId) return;

    try {
      const result = await compareWithSnapshot(patientRecordId, snapshotId);
      setComparison(result);
    } catch (error) {
      console.error('Error comparing snapshot:', error);
    }
  };

  // Export dental chart to PDF (dynamically imported)
  const handleExportDentalChartPDF = async () => {
    if (!dentalChart || !patientData) return;

    try {
      const { exportDentalChartPDF } = await import('../utils/pdfExport');
      exportDentalChartPDF(dentalChart, patientData.patientName, {
        includePeriodontal: true,
        includeTreatments: true,
      });
    } catch (error) {
      console.error('Error exporting dental chart PDF:', error);
      alert(t('accountModal.alerts.exportPdfFail'));
    }
  };

  // Export patient report to PDF (dynamically imported)
  const handleExportPatientReportPDF = async () => {
    if (!patientData) return;

    try {
      const { exportPatientReportPDF } = await import('../utils/pdfExport');
      exportPatientReportPDF(
        patientData.patientName,
        patientData.phone,
        patientData.email,
        appointments,
        dentalChart || undefined
      );
    } catch (error) {
      console.error('Error exporting patient report PDF:', error);
      alert(t('accountModal.alerts.exportPdfFail'));
    }
  };

  // Format date
  const formatDate = (dateKey: string) => {
    const date = new Date(`${dateKey}T00:00:00`);
    return date.toLocaleDateString(locale);
  };

  if (!isOpen || !patientData) return null;

  return (
    <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="glass-modal-content w-[90vw] max-w-5xl h-[80vh] overflow-hidden flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{patientData.patientName}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              {patientData.userId && (
                <span>{t('accounts.table.idLabel')}: {patientData.userId.slice(0, 8)}...</span>
              )}
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                {t('accountModal.status.active')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPatientReportPDF}
              className="btn-secondary"
              title={t('accountModal.actions.exportReport')}
            >
              <i className="fas fa-file-pdf mr-2"></i>
              {t('accountModal.actions.exportReport')}
            </button>
            {onScheduleNew && (
              <button
                onClick={() => {
                  onClose();
                  onScheduleNew();
                }}
                className="btn-primary"
              >
                <i className="fas fa-plus mr-2"></i>
                {t('accountModal.actions.newAppointment')}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b px-6 bg-white">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: 'information', label: t('accountModal.tabs.information'), icon: 'fa-user' },
              { key: 'history', label: t('accountModal.tabs.history'), icon: 'fa-history' },
              { key: 'records', label: t('accountModal.tabs.records'), icon: 'fa-file-medical' },
              { key: 'dental-chart', label: t('accountModal.tabs.dentalChart'), icon: 'fa-tooth' },
              { key: 'chart-history', label: t('accountModal.tabs.chartHistory'), icon: 'fa-chart-line' },
              { key: 'treatment', label: t('accountModal.tabs.treatment'), icon: 'fa-calendar-plus' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap text-sm ${
                  activeTab === tab.key
                    ? 'border-admin-primary text-admin-primary font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <i className="fas fa-spinner fa-spin text-4xl text-admin-primary"></i>
            </div>
          ) : (
            <>
              {/* Patient Information Tab */}
              {activeTab === 'information' && (
                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">{t('accountModal.tabs.information')}</h3>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-2 text-gray-500 hover:text-admin-primary hover:bg-gray-100 rounded-lg"
                      >
                        <i className={`fas fa-${isEditing ? 'times' : 'edit'}`}></i>
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">{t('accountModal.fields.phone')}</label>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('accountModal.fields.email')}</label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('accountModal.fields.dateOfBirth')}</label>
                          <input
                            type="date"
                            value={editForm.dateOfBirth}
                            onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('accountModal.fields.gender')}</label>
                          <select
                            value={editForm.gender}
                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                            className="form-input"
                          >
                            <option value="">{t('accountModal.gender.select')}</option>
                            <option value="Male">{t('accountModal.gender.male')}</option>
                            <option value="Female">{t('accountModal.gender.female')}</option>
                            <option value="Other">{t('accountModal.gender.other')}</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="form-label">{t('accountModal.fields.address')}</label>
                          <input
                            type="text"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('accountModal.fields.emergencyContact')}</label>
                          <input
                            type="text"
                            value={editForm.emergencyContact}
                            onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('accountModal.fields.allergies')}</label>
                          <input
                            type="text"
                            value={editForm.allergies}
                            onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('accountModal.fields.medications')}</label>
                          <input
                            type="text"
                            value={editForm.medications}
                            onChange={(e) => setEditForm({ ...editForm, medications: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label">{t('accountModal.fields.conditions')}</label>
                          <input
                            type="text"
                            value={editForm.conditions}
                            onChange={(e) => setEditForm({ ...editForm, conditions: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="form-label">{t('accountModal.fields.notes')}</label>
                          <textarea
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            className="form-input"
                            rows={3}
                          />
                        </div>
                        <div className="col-span-2 flex gap-3 pt-4">
                          <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">
                            {t('accountModal.actions.cancel')}
                          </button>
                          <button onClick={handleSaveProfile} className="btn-primary flex-1">
                            {t('accountModal.actions.saveChanges')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 uppercase">{t('accountModal.fields.phone')}</div>
                          <div className="text-gray-800">{editForm.phone || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 uppercase">{t('accountModal.fields.email')}</div>
                          <div className="text-gray-800">{editForm.email || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 uppercase">{t('accountModal.fields.dateOfBirth')}</div>
                          <div className="text-gray-800">{editForm.dateOfBirth || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 uppercase">{t('accountModal.fields.gender')}</div>
                          <div className="text-gray-800">{editForm.gender || '-'}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-gray-400 uppercase">{t('accountModal.fields.address')}</div>
                          <div className="text-gray-800">{editForm.address || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 uppercase">{t('accountModal.fields.emergencyContact')}</div>
                          <div className="text-gray-800">{editForm.emergencyContact || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 uppercase">{t('accountModal.fields.allergies')}</div>
                          <div className="text-gray-800">{editForm.allergies || t('accountModal.defaults.none')}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 uppercase">{t('accountModal.fields.medications')}</div>
                          <div className="text-gray-800">{editForm.medications || t('accountModal.defaults.none')}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 uppercase">{t('accountModal.fields.conditions')}</div>
                          <div className="text-gray-800">{editForm.conditions || t('accountModal.defaults.none')}</div>
                        </div>
                        {editForm.notes && (
                          <div className="col-span-2 mt-4 p-4 bg-blue-50 rounded-lg">
                            <div className="text-xs text-gray-400 uppercase mb-2">{t('accountModal.fields.notes')}</div>
                            <div className="text-gray-700">{editForm.notes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Appointment History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {appointments.length > 0 ? (
                    appointments.map((app) => (
                      <div key={app.id} className="glass-card p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{formatDate(app.dateKey)}</div>
                          <div className="text-sm text-gray-500">
                            {app.time} - {app.service || app.serviceType || t('accountModal.defaults.general')}
                          </div>
                          <div className="text-sm text-gray-400">
                            {app.location || app.clinicLocation}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[app.status]}`}>
                          {getStatusLabel(app.status, lang)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <i className="fas fa-history text-4xl mb-4"></i>
                      <p>{t('accountModal.history.empty')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Medical Records Tab */}
              {activeTab === 'records' && (
                <div className="space-y-6">
                  {/* Upload Section */}
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('accountModal.sections.uploadRecords')}</h3>
                    <div className="flex gap-4">
                      <label className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-admin-primary hover:bg-gray-50 transition-colors">
                        <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                        <span className="text-gray-600">{t('accountModal.records.uploadAction')}</span>
                        <span className="text-sm text-gray-400">{t('accountModal.records.uploadTypes')}</span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Existing Records */}
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('accountModal.sections.existingRecords')}</h3>
                    {records.length > 0 ? (
                      <div className="space-y-3">
                        {records.map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                <i className={`fas ${record.type.includes('pdf') ? 'fa-file-pdf text-red-500' : 'fa-file-image text-blue-500'}`}></i>
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">{record.originalName}</div>
                                <div className="text-sm text-gray-500">{(record.size / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <i className="fas fa-folder-open text-4xl mb-4"></i>
                        <p>{t('accountModal.records.empty')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dental Chart Tab */}
              {activeTab === 'dental-chart' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      <i className="fas fa-cube text-admin-primary mr-2"></i>
                      {t('dentalChart.title')}
                    </h3>
                    <button
                      onClick={handleExportDentalChartPDF}
                      disabled={!dentalChart}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-file-pdf mr-2"></i>
                      {t('accountModal.actions.exportPdf')}
                    </button>
                  </div>

                  {dentalChart ? (
                    <div className="space-y-4">
                      {/* 3D Chart - Lazy loaded */}
                      <Suspense fallback={<Chart3DLoader label={t('dentalChart.loading')} />}>
                        <DentalChart3D
                          teethData={dentalChart.teeth as unknown as TeethData}
                          mode="edit"
                          selectedTooth={selectedTooth}
                          onToothSelect={(toothNum) => {
                            setSelectedTooth(toothNum);
                          }}
                          className="min-h-[450px]"
                        />
                      </Suspense>

                      {/* Tooth Detail Panel */}
                      {selectedTooth && (
                        <div className="glass-card p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-800">
                              {t('dentalChart.toothLabel', { number: selectedTooth })}
                            </h4>
                            <button
                              onClick={() => setSelectedTooth(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="form-label">{t('accountModal.fields.status')}</label>
                              <select
                                className="form-input"
                                value={dentalChart.teeth[selectedTooth.toString()]?.status || 'healthy'}
                                onChange={(e) => handleToothStatusChange(selectedTooth, e.target.value as ToothStatus)}
                              >
                                {toothStatusOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <i className="fas fa-tooth text-4xl mb-4"></i>
                      <p>{t('accountModal.dentalChart.noChartTitle')}</p>
                      <p className="text-sm">{t('accountModal.dentalChart.noChartDesc')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Chart History Tab */}
              {activeTab === 'chart-history' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">{t('accountModal.snapshots.title')}</h3>
                    <button onClick={handleCreateSnapshot} className="btn-primary">
                      <i className="fas fa-camera mr-2"></i>
                      {t('accountModal.snapshots.create')}
                    </button>
                  </div>

                  {snapshots.length > 0 ? (
                    <div className="space-y-4">
                      {snapshots.map((snapshot) => (
                        <div key={snapshot.id} className="glass-card p-4 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-800">{snapshot.description}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(snapshot.createdAt).toLocaleDateString(locale)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCompareSnapshot(snapshot.id)}
                              className="btn-secondary btn-sm"
                            >
                              {t('accountModal.actions.compare')}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <i className="fas fa-chart-line text-4xl mb-4"></i>
                        <p>{t('accountModal.snapshots.emptyTitle')}</p>
                        <p className="text-sm">{t('accountModal.snapshots.emptyDesc')}</p>
                      </div>
                    )}

                  {comparison && (
                    <div className="glass-card p-6 mt-6">
                      <h4 className="font-semibold text-gray-800 mb-4">
                        {t('accountModal.comparison.title', { description: comparison.snapshotDescription })}
                      </h4>
                      <p className="text-sm text-gray-500 mb-4">
                        {t('accountModal.comparison.summary', {
                          count: comparison.totalChanges,
                          date: new Date(comparison.snapshotDate).toLocaleDateString(locale),
                        })}
                      </p>
                      {comparison.changes.length > 0 ? (
                        <div className="space-y-2">
                          {comparison.changes.map((change) => (
                            <div key={change.toothNum} className="p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium">
                                {t('accountModal.comparison.tooth', { number: change.toothNum })}
                              </div>
                              {change.changes.map((c, i) => (
                                <div key={i} className="text-sm text-gray-600">
                                  {c.field}: {c.old || t('accountModal.comparison.none')} → {c.new || t('accountModal.comparison.none')}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">{t('accountModal.comparison.noChanges')}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Next Treatment Tab */}
              {activeTab === 'treatment' && (
                <div className="text-center py-12 text-gray-400">
                  <i className="fas fa-calendar-plus text-4xl mb-4"></i>
                  <p>{t('accountModal.treatment.comingSoon')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
