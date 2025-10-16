import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './components/chat/ChatProvider';

const Landing = lazy(() =>
  import('./pages/Landing').then((module) => ({ default: module.Landing }))
);
const Service = lazy(() =>
  import('./pages/Service').then((module) => ({ default: module.Service }))
);
const FAQ = lazy(() =>
  import('./pages/FAQ').then((module) => ({ default: module.FAQ }))
);
const ServicesDetail1 = lazy(() =>
  import('./pages/ServicesDetail1').then((module) => ({
    default: module.ServicesDetail1,
  }))
);
const ServicesDetail2 = lazy(() =>
  import('./pages/ServicesDetail2').then((module) => ({
    default: module.ServicesDetail2,
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

function App() {
  const ALLOWED_KEYS = new Set(['preferred-language', 'sidebarCollapsed', 'dashboard:view-location']);

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

  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <ChatProvider>
            <Suspense fallback={<div style={{ padding: 8 }}>Loading…</div>}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/service" element={<Service />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/services-detail-1" element={<ServicesDetail1 />} />
                <Route path="/services/general-family" element={<ServicesDetail1 />} />
                <Route path="/services/cosmetic" element={<ServicesDetail1 />} />
                <Route path="/services/orthodontics" element={<ServicesDetail1 />} />
                <Route path="/services/root-canals" element={<ServicesDetail1 />} />
                <Route path="/services-detail-2" element={<ServicesDetail2 />} />
                <Route path="/app/login" element={<AppLogin />} />
                <Route path="/app/dashboard" element={<AppDashboard />} />
                <Route path="/app/appointment" element={<AppAppointment />} />
                <Route path="/app" element={<Navigate to="/app/login" replace />} />
              </Routes>
            </Suspense>
          </ChatProvider>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
