import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useI18n } from '../i18n';
import { subscribeToNewAppointments } from '../services/admin-data-service';
import { useNotifications } from '../hooks';
import NotificationDropdown from './NotificationDropdown';

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { currentUser, userData, signOut, accessibleClinics, isAdmin } = useAuth();
  const { t } = useI18n();
  const { query, setQuery, clear } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();

  // Notification system
  const {
    permission,
    notifications,
    unreadCount,
    requestPermission,
    processNewAppointments,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  useEffect(() => {
    if (!currentUser) {
      setPendingCount(0);
      return;
    }

    const role = userData?.role ?? (isAdmin ? 'admin' : null);
    if (role !== 'owner' && role !== 'admin' && role !== 'boss') {
      setPendingCount(0);
      return;
    }

    const clinics = userData?.clinics?.length ? userData.clinics : accessibleClinics;
    if (clinics.length === 0) {
      setPendingCount(0);
      return;
    }

    const unsubscribe = subscribeToNewAppointments(role, clinics, (appointments) => {
      setPendingCount(appointments.length);
      // Process for desktop notifications
      processNewAppointments(appointments);
    });

    return () => unsubscribe();
  }, [currentUser, userData?.role, userData?.clinics, accessibleClinics, isAdmin, processNewAppointments]);

  // Handle notification click - navigate to appointments
  const handleNotificationClick = () => {
    navigate('/patients');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: 'fas fa-chart-line', labelKey: 'layout.nav.dashboard' },
    { path: '/patients', icon: 'fas fa-tasks', labelKey: 'layout.nav.patients' },
    { path: '/appointments', icon: 'fas fa-calendar-alt', labelKey: 'layout.nav.calendar' },
    { path: '/accounts', icon: 'fas fa-users', labelKey: 'layout.nav.accounts' }
  ];

  // Check if we're on the calendar page to show the accounts icon
  const isCalendarPage = location.pathname === '/appointments';

  return (
    <div className="min-h-screen flex main-content-area">
      {/* Sidebar - Glass Effect */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } glass-sidebar fixed h-full z-20 flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3 min-h-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-lg">
              <i className="fas fa-tooth text-white text-lg"></i>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col relative">
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item relative ${isActive ? 'active' : ''} stagger-${index + 1}`
              }
            >
              <i className={`${item.icon} w-5 text-center text-base`}></i>
              {!sidebarCollapsed && <span>{t(item.labelKey)}</span>}
            </NavLink>
          ))}

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="nav-item mt-2"
          >
            <i className={`fas fa-${sidebarCollapsed ? 'indent' : 'outdent'} w-5 text-center`}></i>
            {!sidebarCollapsed && (
              <span className="text-[var(--color-text-light)]">{t('layout.nav.collapse')}</span>
            )}
          </button>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Logout - at bottom */}
          <button
            onClick={handleSignOut}
            className="nav-item mx-4 mb-6 text-[var(--color-error)] hover:bg-[var(--color-error-bg)]"
          >
            <i className="fas fa-sign-out-alt w-5 text-center"></i>
            {!sidebarCollapsed && <span>{t('layout.nav.logout')}</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 content-wrapper ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header - Glass Effect */}
        <header className="glass-header sticky top-0 z-10">
          <div className="flex items-center justify-between px-8 py-4">
            {/* Page Title */}
            <div className="page-title">
              <h1 className="font-heading text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
                {location.pathname === '/dashboard' && t('layout.header.titles.dashboard')}
                {location.pathname === '/patients' && t('layout.header.titles.patients')}
                {location.pathname === '/appointments' && t('layout.header.titles.appointments')}
                {location.pathname === '/accounts' && t('layout.header.titles.accounts')}
              </h1>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-4">
              {/* Global Search */}
              <div className="relative group">
                <input
                  type="text"
                  placeholder={t('layout.header.searchPlaceholder')}
                  value={query}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setQuery(nextValue);
                    if (nextValue.trim() && location.pathname !== '/accounts') {
                      navigate('/accounts');
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      clear();
                      return;
                    }
                    if (event.key === 'Enter' && query.trim() && location.pathname !== '/accounts') {
                      navigate('/accounts');
                    }
                  }}
                  aria-label={t('layout.header.searchPlaceholder')}
                  className="form-input w-72 pl-11 pr-4 py-2.5 text-sm"
                />
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-light)] group-focus-within:text-[var(--color-primary)] transition-colors"></i>
              </div>

              {/* Patient Accounts Icon - Only on Calendar page */}
              {isCalendarPage && (
                <NavLink
                  to="/accounts"
                  className="relative p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] rounded-xl transition-all group"
                  title={t('layout.header.accountsTooltip')}
                >
                  <i className="fas fa-users text-lg"></i>
                  <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-[var(--color-text-primary)] text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                    {t('layout.header.accountsTooltip')}
                  </div>
                </NavLink>
              )}

              {/* Notifications Dropdown */}
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount > 0 ? unreadCount : pendingCount}
                permission={permission}
                onRequestPermission={requestPermission}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClearAll={clearAll}
                onNotificationClick={handleNotificationClick}
              />

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-3 border-l border-[var(--color-border-subtle)]">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <i className="fas fa-user text-white"></i>
                  )}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold text-[var(--color-text-primary)] font-heading">
                    {userData?.displayName || currentUser?.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] font-medium">
                    {userData?.role === 'owner'
                      ? t('layout.header.roleOwner')
                      : t('layout.header.roleAdmin')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
