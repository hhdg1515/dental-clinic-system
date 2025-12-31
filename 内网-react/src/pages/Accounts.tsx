import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import {
  getAllAppointments,
  getCancelledAppointments,
} from '../services/admin-data-service';
import type { Appointment } from '../types';
import PatientAccountModal from '../components/PatientAccountModal';
import { CLINICS } from '../constants';
import { useI18n } from '../i18n';

interface PatientSummary {
  id: string;
  patientName: string;
  phone?: string;
  email?: string;
  userId?: string;
  clinicLocation?: string;
  lastVisit?: string;
  totalVisits: number;
  upcomingAppointment?: string;
  status: 'active' | 'inactive';
}

export default function Accounts() {
  const { userData, accessibleClinics: userClinics, currentUser } = useAuth();
  const { t } = useI18n();
  const { query, setQuery } = useSearch();
  const [loading, setLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<string>('all');
  const [patients, setPatients] = useState<PatientSummary[]>([]);

  // Modal state
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);

  const isOwner = userData?.role === 'owner';
  const accessibleClinics = isOwner
    ? CLINICS
    : CLINICS.filter((c) => userClinics?.includes(c.value));

  // Load patients from appointments
  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const userRole = userData?.role || null;
      const clinics = userClinics || [];
      const allAppts = await getAllAppointments(userRole, clinics, true);
      const cancelledAppts = await getCancelledAppointments(userRole, clinics);
      const allAppointments = [...allAppts, ...cancelledAppts];

      // Group by patient
      const patientMap = new Map<string, PatientSummary>();
      const today = new Date().toISOString().split('T')[0];
      const adminUserId = currentUser?.uid || '';

      const resolvePatientKey = (appt: Appointment) => {
        const userId = appt.userId?.trim() || '';
        const phone = appt.phone || appt.patientPhone || '';
        const email = appt.email || '';
        const name = appt.patientName || '';
        if (userId && userId !== adminUserId) {
          return `user:${userId}`;
        }
        if (phone) return `phone:${phone}`;
        if (email) return `email:${email}`;
        return `name:${name}`;
      };

      allAppointments.forEach((appt) => {
        const key = resolvePatientKey(appt);
        const existing = patientMap.get(key);

        if (existing) {
          existing.totalVisits++;
          // Update last visit
          if (!existing.lastVisit || appt.dateKey > existing.lastVisit) {
            if (appt.dateKey <= today && (appt.status === 'completed' || appt.status === 'arrived')) {
              existing.lastVisit = appt.dateKey;
            }
          }
          // Update upcoming appointment
          if (appt.dateKey >= today && (appt.status === 'confirmed' || appt.status === 'scheduled' || appt.status === 'pending')) {
            if (!existing.upcomingAppointment || appt.dateKey < existing.upcomingAppointment) {
              existing.upcomingAppointment = appt.dateKey;
            }
          }
          // Update phone/email if missing
          if (!existing.phone && appt.phone) existing.phone = appt.phone;
          if (!existing.email && appt.email) existing.email = appt.email;
        } else {
          const isUpcoming = appt.dateKey >= today &&
            (appt.status === 'confirmed' || appt.status === 'scheduled' || appt.status === 'pending');
          const isCompleted = appt.dateKey <= today &&
            (appt.status === 'completed' || appt.status === 'arrived');
          const shouldShowUserId = appt.userId && appt.userId.trim() && appt.userId !== adminUserId;

          patientMap.set(key, {
            id: key,
            patientName: appt.patientName,
            phone: appt.phone || appt.patientPhone,
            email: appt.email,
            userId: shouldShowUserId ? appt.userId : undefined,
            clinicLocation: appt.clinicLocation || appt.location,
            lastVisit: isCompleted ? appt.dateKey : undefined,
            totalVisits: 1,
            upcomingAppointment: isUpcoming ? appt.dateKey : undefined,
            status: 'active',
          });
        }
      });

      // Convert to array and sort by last visit
      const patientList = Array.from(patientMap.values());
      patientList.sort((a, b) => {
        const dateA = a.upcomingAppointment || a.lastVisit || '0000-00-00';
        const dateB = b.upcomingAppointment || b.lastVisit || '0000-00-00';
        return dateB.localeCompare(dateA);
      });

      setPatients(patientList);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, isOwner, userData?.role, userClinics]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      // Search filter
      if (query) {
        const normalizedQuery = query.toLowerCase();
        const matchName = patient.patientName.toLowerCase().includes(normalizedQuery);
        const matchPhone = patient.phone?.toLowerCase().includes(normalizedQuery);
        const matchEmail = patient.email?.toLowerCase().includes(normalizedQuery);
        if (!matchName && !matchPhone && !matchEmail) return false;
      }
      // Clinic filter
      if (selectedClinic !== 'all' && patient.clinicLocation !== selectedClinic) {
        return false;
      }
      return true;
    });
  }, [patients, query, selectedClinic]);

  // Format date
  const formatDate = (dateKey?: string) => {
    if (!dateKey) return '-';
    const [year, month, day] = dateKey.split('-');
    return `${month}/${day}/${year}`;
  };

  // Open patient account
  const openPatientAccount = (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('accounts.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('accounts.foundCount', { count: filteredPatients.length })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder={t('accounts.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-admin-primary mb-4"></i>
            <p className="text-gray-500">{t('accounts.loading')}</p>
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('accounts.table.patientName')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('accounts.table.contact')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('accounts.table.clinic')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('accounts.table.lastVisit')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('accounts.table.upcoming')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('accounts.table.totalVisits')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('accounts.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openPatientAccount(patient)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-admin-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-admin-primary font-semibold">
                            {patient.patientName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {patient.patientName}
                          </div>
                          {patient.userId && (
                            <div className="text-xs text-gray-400">
                              {t('accounts.table.idLabel')}: {patient.userId.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {patient.phone || '-'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {patient.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                        {patient.clinicLocation || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(patient.lastVisit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.upcomingAppointment ? formatDate(patient.upcomingAppointment) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      {patient.totalVisits}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPatientAccount(patient);
                        }}
                        className="p-2 text-gray-400 hover:text-admin-primary hover:bg-gray-100 rounded-lg"
                      >
                        <i className="fas fa-arrow-right"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <i className="fas fa-users text-4xl mb-4"></i>
            <p>{t('accounts.empty.title')}</p>
            {query && (
              <p className="text-sm mt-2">{t('accounts.empty.subtitle')}</p>
            )}
          </div>
        )}
      </div>

      {/* Patient Account Modal */}
      <PatientAccountModal
        isOpen={showPatientModal}
        onClose={() => {
          setShowPatientModal(false);
          setSelectedPatient(null);
        }}
        patientData={selectedPatient ? {
          patientName: selectedPatient.patientName,
          phone: selectedPatient.phone,
          email: selectedPatient.email,
          userId: selectedPatient.userId,
          clinicLocation: selectedPatient.clinicLocation,
        } : null}
      />
    </div>
  );
}
