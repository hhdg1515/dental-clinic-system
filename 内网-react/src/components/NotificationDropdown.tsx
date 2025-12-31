import { useState, useRef, useEffect } from 'react';
import type { NotificationItem } from '../hooks/useNotifications';
import { useI18n } from '../i18n';

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  unreadCount: number;
  permission: NotificationPermission;
  onRequestPermission: () => Promise<boolean>;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: NotificationItem) => void;
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  permission,
  onRequestPermission,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNotificationClick,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useI18n();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: NotificationItem) => {
    onMarkAsRead(notification.id);
    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('notifications.justNow');
    if (minutes < 60) return t('notifications.minutesAgo', { count: minutes });
    if (hours < 24) return t('notifications.hoursAgo', { count: hours });
    if (days < 7) return t('notifications.daysAgo', { count: days });
    return date.toLocaleDateString(locale);
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'new_appointment':
        return 'fas fa-calendar-plus text-blue-500';
      case 'reminder':
        return 'fas fa-bell text-amber-500';
      case 'status_change':
        return 'fas fa-exchange-alt text-green-500';
      default:
        return 'fas fa-info-circle text-gray-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] rounded-xl transition-all"
        title={t('notifications.title')}
        aria-label={t('notifications.title')}
      >
        <i className={`${unreadCount > 0 ? 'fas' : 'far'} fa-bell text-lg`}></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[var(--color-error)] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-scaleIn origin-top-right">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-gray-800">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={onClearAll}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                  >
                    {t('notifications.clearAll')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Permission Request */}
          {permission !== 'granted' && (
            <div className="px-5 py-4 bg-amber-50 border-b border-amber-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-bell-slash text-amber-600"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">{t('notifications.enableTitle')}</p>
                  <p className="text-xs text-amber-600 mt-0.5">{t('notifications.enableDesc')}</p>
                  <button
                    onClick={onRequestPermission}
                    className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {t('notifications.enableAction')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <i className="fas fa-bell-slash text-2xl text-gray-400"></i>
                </div>
                <p className="text-gray-500 font-medium">{t('notifications.emptyTitle')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('notifications.emptyDesc')}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-5 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <i className={getNotificationIcon(notification.type)}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{notification.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(notification.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-400">
                {t('notifications.footer', { count: notifications.length })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
