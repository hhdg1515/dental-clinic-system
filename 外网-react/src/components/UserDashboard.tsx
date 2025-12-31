import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AppointmentForm } from './AppointmentForm';
import { useChat } from './chat/ChatProvider';
import { ChatFloatingButton } from './chat/ChatFloatingButton';
import {
  getUpcomingAppointments,
  CLINIC_LOCATIONS,
  SERVICE_TYPES,
  type AppointmentDoc
} from '../services/appointment';

const formatDateTime = (dateTime: Date, locale: string) => ({
  date: dateTime.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }),
  time: dateTime.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
});

const adminRedirectCopy = (isZh: boolean) => ({
  title: isZh ? '管理员登录成功' : 'Admin login success',
  subtitle: isZh ? '正在跳转至内部控制面板…' : 'Redirecting to the internal dashboard…'
});

const getAdminRedirectUrl = () => {
  const envUrl = import.meta.env.VITE_ADMIN_DASHBOARD_URL as string | undefined;
  if (envUrl) {
    return envUrl;
  }
  // Use same-origin path to share Firebase auth state
  // In dev: proxied via vite to localhost:5174
  // In prod: served from same origin under /内网/
  return '/内网/';
};

export const UserDashboard = () => {
  const { currentUser, userData, signOut, isAdmin, requestAuthInit } = useAuth();
  const { currentLanguage } = useLanguage();
  const { openChat } = useChat();

  const isZh = currentLanguage === 'zh';
  const locale = isZh ? 'zh-CN' : 'en-US';
  const isVip = Boolean(userData?.isVIP);

  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    requestAuthInit();
  }, [requestAuthInit]);

  const displayName = useMemo(
    () => currentUser?.displayName || currentUser?.email?.split('@')[0] || (isZh ? '会员' : 'Member'),
    [currentUser, isZh]
  );

  useEffect(() => {
    const loadAppointments = async () => {
      if (currentUser && !isAdmin) {
        try {
          setLoadingAppointments(true);
          const upcoming = await getUpcomingAppointments(currentUser.uid);
          setAppointments(upcoming);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Error loading appointments:', error);
          }
        } finally {
          setLoadingAppointments(false);
        }
      }
    };

    if (!showAppointmentForm) {
      void loadAppointments();
    }
  }, [currentUser, isAdmin, showAppointmentForm]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Logout error:', error);
      }
    }
  };

  const handleAppointmentSuccess = () => {
    setShowAppointmentForm(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  if (isAdmin && userData && currentUser) {
    const accessibleLocations =
      userData.role === 'owner'
        ? ['arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale']
        : userData.clinics || ['arcadia'];
    const defaultViewLocation = accessibleLocations[0] || 'arcadia';
    if (typeof window !== 'undefined') {
      const internalUserData = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin',
        role: userData.role,
        accessibleLocations,
        clinics: accessibleLocations,
        currentViewLocation: defaultViewLocation,
        assignedLocation: userData.assignedLocation || defaultViewLocation,
        photoURL: currentUser.photoURL || null
      };

      localStorage.setItem('currentUser', JSON.stringify(internalUserData));
      localStorage.setItem('dashboard:view-location', defaultViewLocation);
    }

    const adminRedirectUrl = getAdminRedirectUrl();
    setTimeout(() => {
      window.location.href = adminRedirectUrl;
    }, 2000);

    const copy = adminRedirectCopy(isZh);

    return (
      <div className="card-surface w-full text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <i className="fas fa-shield-alt text-xl" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <h3 className="font-display text-xl text-neutral-900">{copy.title}</h3>
            <p className="text-sm text-neutral-500">{copy.subtitle}</p>
          </div>
          <i className="fas fa-spinner fa-spin text-brand-primary" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (showAppointmentForm) {
    return (
      <AppointmentForm
        onSuccess={handleAppointmentSuccess}
        onCancel={() => setShowAppointmentForm(false)}
      />
    );
  }

  const renderAppointments = () => {
    if (loadingAppointments) {
      return (
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 text-sm text-neutral-600 shadow-elevationSm">
          <i className="fas fa-spinner fa-spin mr-2 text-brand-primary" aria-hidden="true" />
          {isZh ? '正在加载预约…' : 'Loading appointments…'}
        </div>
      );
    }

    if (!appointments.length) {
      return (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-6 text-center text-sm text-neutral-500">
          <i className="fas fa-calendar-check mb-2 text-lg text-brand-primary" aria-hidden="true" />
          <p>{isZh ? '暂无预约' : 'No appointments yet'}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {appointments.map((appointment) => {
          const appointmentDate =
            appointment.appointmentDateTime instanceof Date
              ? appointment.appointmentDateTime
              : new Date(appointment.appointmentDateTime);

          const { date, time } = formatDateTime(appointmentDate, locale);

          return (
            <div
              key={appointment.id}
              className="rounded-2xl border border-neutral-200 bg-white/85 p-5 shadow-elevationSm transition duration-normal hover:border-brand-primary hover:shadow-elevationMd"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
                    {SERVICE_TYPES[appointment.serviceType]}
                  </p>
                  <h4 className="font-display text-lg text-neutral-900">
                    {CLINIC_LOCATIONS[appointment.clinicLocation]}
                  </h4>
                </div>
                <div className="text-right text-sm text-neutral-600">
                  <div className="font-semibold text-neutral-900">{date}</div>
                  <div>{time}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {isVip && <ChatFloatingButton isEnabled showVipBadge />}
      <div className="card-surface w-full space-y-6">
        <header className="flex flex-col gap-4 border-b border-neutral-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
              {isZh ? '欢迎' : 'Welcome'}
            </p>
            <h2 className="font-display text-2xl text-neutral-900">Hi {displayName}</h2>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-outline w-full justify-center text-[0.65rem] md:w-auto"
          >
            {isZh ? '退出登录' : 'Sign out'}
          </button>
        </header>

        {showSuccessMessage && (
          <div className="alert-success">
            <i className="fas fa-check-circle mt-1 text-base" aria-hidden="true" />
            <span>
              {isZh
                ? '预约已提交，我们会尽快与您确认细节。'
                : 'Appointment booked! Our team will contact you soon.'}
            </span>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-neutral-900">
              {isZh ? '即将到来的预约' : 'Upcoming'}
            </h3>
            <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-primary">
              {appointments.length}
            </span>
          </div>
          {renderAppointments()}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            className="btn-primary w-full justify-center sm:w-auto"
            onClick={() => setShowAppointmentForm(true)}
          >
            {isZh ? '预约' : 'Appointment'}
          </button>

          <button
            type="button"
            className={`w-full justify-center sm:w-auto ${
              isVip ? 'btn-outline hover:bg-brand-primary/10' : 'btn-outline cursor-not-allowed opacity-60'
            }`}
            onClick={() => {
              if (isVip) {
                openChat();
              }
            }}
            disabled={!isVip}
          >
            {isZh ? 'AI 咨询助理' : 'AI Chat'}
            {isVip && <span className="badge ml-2">VIP</span>}
          </button>
        </div>
      </div>
    </>
  );
};
