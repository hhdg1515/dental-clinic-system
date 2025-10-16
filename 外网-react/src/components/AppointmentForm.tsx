import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  createAppointment,
  getLastUserAppointment,
  SERVICE_TYPES,
  CLINIC_LOCATIONS,
  type AppointmentData
} from '../services/appointment';

interface AppointmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export const AppointmentForm: FC<AppointmentFormProps> = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const isZh = currentLanguage === 'zh';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AppointmentData>({
    patientName: '',
    patientPhone: '',
    patientEmail: currentUser?.email || '',
    isNewPatient: false,
    appointmentDate: '',
    appointmentTime: '',
    clinicLocation: '',
    serviceType: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLastAppointment = async () => {
      if (!currentUser) return;

      try {
        const lastAppointment = await getLastUserAppointment(currentUser.uid);
        if (lastAppointment) {
          setFormData((prev) => ({
            ...prev,
            patientName: lastAppointment.patientName,
            patientPhone: lastAppointment.patientPhone,
            patientEmail: lastAppointment.patientEmail
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            patientName: currentUser.displayName || currentUser.email?.split('@')[0] || ''
          }));
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Error loading last appointment:', err);
        }
      }
    };

    loadLastAppointment();
  }, [currentUser]);

  const handleInputChange = (field: keyof AppointmentData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.patientName.trim()) {
        setError(isZh ? '请填写患者姓名' : 'Please enter patient name');
        return false;
      }

      if (!formData.patientPhone.trim()) {
        setError(isZh ? '请填写联系电话' : 'Please enter phone number');
        return false;
      }
    }

    if (step === 2) {
      if (!formData.appointmentDate) {
        setError(isZh ? '请选择预约日期' : 'Please select appointment date');
        return false;
      }

      if (!formData.appointmentTime) {
        setError(isZh ? '请选择预约时间' : 'Please select appointment time');
        return false;
      }

      if (!formData.clinicLocation) {
        setError(isZh ? '请选择就诊门店' : 'Please select clinic location');
        return false;
      }
    }

    if (step === 3 && !formData.serviceType) {
      setError(isZh ? '请选择服务类型' : 'Please select service type');
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setError(isZh ? '请先登录后再预约' : 'Please sign in before booking an appointment');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createAppointment(formData, currentUser.uid);
      onSuccess();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error creating appointment:', err);
      }
      setError(
        isZh ? '预约提交失败，请稍后再试或联系我们的前台团队' : 'We could not save your appointment. Please try again or contact our team.'
      );
    } finally {
      setLoading(false);
    }
  };

  const stepHeading =
    currentStep === 4
      ? isZh
        ? '确认预约信息'
        : 'Review'
      : isZh
        ? '填写预约表单'
        : 'New Appointment';

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="patient-name" className="form-label">
              {isZh ? '患者姓名' : 'Patient Name'} *
            </label>
            <input
              id="patient-name"
              className="form-input"
              type="text"
              value={formData.patientName}
              onChange={(event) => handleInputChange('patientName', event.target.value)}
              placeholder={isZh ? '请输入患者姓名' : 'Enter patient name'}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="patient-phone" className="form-label">
              {isZh ? '联系电话' : 'Phone Number'} *
            </label>
            <input
              id="patient-phone"
              className="form-input"
              type="tel"
              value={formData.patientPhone}
              onChange={(event) => handleInputChange('patientPhone', event.target.value)}
              placeholder={isZh ? '请输入联系电话' : 'Enter phone number'}
              required
            />
            <p className="form-helper">
              {isZh ? '如信息有变动，请直接在此更新' : 'Please update the information if it has changed'}
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-brand-primary"
              checked={formData.isNewPatient || false}
              onChange={(event) => handleInputChange('isNewPatient', event.target.checked)}
            />
            {isZh ? '我是首次就诊患者' : 'I am a new patient'}
          </label>

          <button type="button" className="btn-primary w-full justify-center" onClick={nextStep}>
            {isZh ? '下一步' : 'Next'}
            <i className="fas fa-arrow-right text-sm" />
          </button>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="appointment-date" className="form-label">
              {isZh ? '预约日期' : 'Date'} *
            </label>
            <input
              id="appointment-date"
              type="date"
              className="form-input"
              value={formData.appointmentDate}
              onChange={(event) => handleInputChange('appointmentDate', event.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="appointment-time" className="form-label">
              {isZh ? '预约时间' : 'Time'} *
            </label>
            <select
              id="appointment-time"
              className="form-select"
              value={formData.appointmentTime}
              onChange={(event) => handleInputChange('appointmentTime', event.target.value)}
              required
            >
              <option value="">{isZh ? '请选择时间' : 'Select time'}</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="clinic-location" className="form-label">
              {isZh ? '就诊门店' : 'Location'} *
            </label>
            <select
              id="clinic-location"
              className="form-select"
              value={formData.clinicLocation}
              onChange={(event) => handleInputChange('clinicLocation', event.target.value)}
              required
            >
              <option value="">{isZh ? '请选择门店' : 'Select clinic'}</option>
              {Object.entries(CLINIC_LOCATIONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="btn-outline w-full justify-center sm:w-auto" onClick={prevStep}>
              <i className="fas fa-arrow-left text-sm" />
              {isZh ? '上一步' : 'Previous'}
            </button>
            <button type="button" className="btn-primary w-full justify-center sm:w-auto" onClick={nextStep}>
              {isZh ? '下一步' : 'Next'}
              <i className="fas fa-arrow-right text-sm" />
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="service-type" className="form-label">
              {isZh ? '服务类型' : 'Service Type'} *
            </label>
            <select
              id="service-type"
              className="form-select"
              value={formData.serviceType}
              onChange={(event) => handleInputChange('serviceType', event.target.value)}
              required
            >
              <option value="">{isZh ? '请选择服务类型' : 'Select service type'}</option>
              {Object.entries(SERVICE_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="patient-description" className="form-label">
              {isZh ? '问题描述（可选）' : 'Problem Description (Optional)'}
            </label>
            <textarea
              id="patient-description"
              className="form-textarea"
              value={formData.description}
              onChange={(event) => handleInputChange('description', event.target.value)}
              placeholder={
                isZh
                  ? '请简单描述您的就诊需求或当前不适...'
                  : 'Briefly describe your concerns or symptoms...'
              }
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="btn-outline w-full justify-center sm:w-auto" onClick={prevStep}>
              <i className="fas fa-arrow-left text-sm" />
              {isZh ? '上一步' : 'Previous'}
            </button>
            <button type="button" className="btn-primary w-full justify-center sm:w-auto" onClick={nextStep}>
              {isZh ? '预览预约' : 'Review'}
              <i className="fas fa-eye text-sm" />
            </button>
          </div>
        </div>
      );
    }

    const summaryRows = [
      {
        label: isZh ? '患者姓名' : 'Patient Name',
        value: formData.patientName
      },
      {
        label: isZh ? '联系电话' : 'Phone',
        value: formData.patientPhone
      },
      {
        label: isZh ? '预约日期' : 'Date',
        value: formatDate(formData.appointmentDate, isZh)
      },
      {
        label: isZh ? '预约时间' : 'Time',
        value: formatTime(formData.appointmentTime)
      },
      {
        label: isZh ? '就诊门店' : 'Location',
        value: formData.clinicLocation ? CLINIC_LOCATIONS[formData.clinicLocation] : '—'
      },
      {
        label: isZh ? '服务类型' : 'Service',
        value: formData.serviceType ? SERVICE_TYPES[formData.serviceType] : '—'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white/85 p-6 shadow-elevationSm">
          <h4 className="font-display text-lg text-neutral-900">
            {isZh ? '预约详情' : 'Appointment Details'}
          </h4>
          <dl className="space-y-3 text-sm text-neutral-700">
            {summaryRows.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <dt className="font-semibold text-neutral-500">{label}</dt>
                <dd className="text-neutral-900 sm:text-right">{value}</dd>
              </div>
            ))}
            {formData.description && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <dt className="font-semibold text-neutral-500">
                  {isZh ? '问题描述' : 'Description'}
                </dt>
                <dd className="text-neutral-900 sm:max-w-[360px] sm:text-right line-clamp-2">{formData.description}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button type="button" className="btn-outline w-full justify-center sm:w-auto" onClick={prevStep} disabled={loading}>
            <i className="fas fa-arrow-left text-sm" />
            {isZh ? '返回修改' : 'Back'}
          </button>
          <button
            type="button"
            className="btn-primary w-full justify-center sm:w-auto"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin text-sm" />
                {isZh ? ' 处理中...' : ' Processing...'}
              </>
            ) : (
              <>
                <i className="fas fa-check text-sm" />
                {isZh ? '确认预约' : 'Confirm'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="card-surface w-full space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost"
            aria-label={isZh ? '返回主页' : 'Go back'}
          >
            <i className="fas fa-arrow-left text-base" />
          </button>
          <div className="text-left">
            <h3 className="font-display text-xl text-neutral-900">{stepHeading}</h3>
          </div>
        </div>
      </header>

      {error && (
        <div className="alert-error">
          <i className="fas fa-exclamation-circle mt-1 text-base" />
          <span>{error}</span>
        </div>
      )}

      {renderStepContent()}
    </div>
  );
};

function formatDate(date: string, isZh: boolean): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(time: string): string {
  if (!time) return '—';
  const [hour, minute] = time.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time;
  }
  const date = new Date();
  date.setHours(hour, minute, 0);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
