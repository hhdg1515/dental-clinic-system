import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const Landing = lazy(() =>
  import('./pages/Landing').then((module) => ({ default: module.Landing }))
);
const Service = lazy(() =>
  import('./pages/Service').then((module) => ({ default: module.Service }))
);
const FAQ = lazy(() =>
  import('./pages/FAQ').then((module) => ({ default: module.FAQ }))
);
const ServiceDetail = lazy(() =>
  import('./pages/ServiceDetail').then((module) => ({
    default: module.ServiceDetail,
  }))
);
const Stories = lazy(() =>
  import('./pages/Stories').then((module) => ({
    default: module.Stories,
  }))
);
const StoryDetail = lazy(() =>
  import('./pages/StoryDetail').then((module) => ({
    default: module.StoryDetail,
  }))
);
const PromotionDetail = lazy(() =>
  import('./pages/PromotionDetail').then((module) => ({
    default: module.PromotionDetail,
  }))
);
const AppLogin = lazy(() =>
  import('./app/pages/LoginPage').then((module) => ({
    default: module.AppLoginPage,
  }))
);
const AppDashboard = lazy(() =>
  import('./app/pages/DashboardPage').then((module) => ({
    default: module.AppDashboardPage,
  }))
);
const AppAppointment = lazy(() =>
  import('./app/pages/AppointmentPage').then((module) => ({
    default: module.AppAppointmentPage,
  }))
);
const TermsOfService = lazy(() =>
  import('./pages/TermsOfService').then((module) => ({
    default: module.TermsOfService,
  }))
);
const PrivacyPolicy = lazy(() =>
  import('./pages/PrivacyPolicy').then((module) => ({
    default: module.PrivacyPolicy,
  }))
);

function App() {
  const ALLOWED_KEYS = new Set(['preferred-language', 'sidebarCollapsed', 'dashboard:view-location']);
  const location = useLocation();
  const { requestAuthInit, loading } = useAuth();
  const isAppRoute = location.pathname.startsWith('/app');

  useEffect(() => {
    try {
      localStorage.removeItem('dental_clinic_data');

      if (import.meta.env.DEV) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith('firebase:')) continue;
          if (!ALLOWED_KEYS.has(key)) {
            // eslint-disable-next-line no-console
            console.warn('[storage] unexpected key in localStorage:', key);
          }
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('localStorage cleanup skipped:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isAppRoute) {
      requestAuthInit();
    }
  }, [isAppRoute, requestAuthInit]);

  if (isAppRoute && loading) {
    return <div style={{ padding: 16 }}>Preparing your dashboard…</div>;
  }

  return (
    <Suspense fallback={<div style={{ padding: 8 }}>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/service" element={<Service />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/stories/:id" element={<StoryDetail />} />
        <Route path="/promotions/spring-whitening" element={<PromotionDetail />} />
        <Route path="/faq" element={<FAQ />} />
        {/* Dynamic service routes - SEO friendly */}
        <Route path="/services/:slug" element={<ServiceDetail />} />
        {/* Legacy routes - redirect to new routes */}
        <Route path="/services-detail-1" element={<Navigate to="/services/general-family" replace />} />
        <Route path="/services-detail-2" element={<Navigate to="/services/periodontics" replace />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/app/login" element={<AppLogin />} />
        <Route path="/app/dashboard" element={<AppDashboard />} />
        <Route path="/app/appointment" element={<AppAppointment />} />
        <Route path="/app" element={<Navigate to="/app/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
