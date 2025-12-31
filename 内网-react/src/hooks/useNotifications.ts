import { useState, useEffect, useCallback, useRef } from 'react';
import type { Appointment } from '../types';
import { useI18n } from '../i18n';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  appointmentId?: string;
  type: 'new_appointment' | 'reminder' | 'status_change';
}

interface UseNotificationsOptions {
  onNotificationClick?: (notification: NotificationItem) => void;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { t } = useI18n();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenAppointmentIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Check initial permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Show a desktop notification
  const showDesktopNotification = useCallback((title: string, body: string, icon?: string) => {
    if (permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: `notification-${Date.now()}`,
        requireInteraction: false,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permission]);

  // Add a notification to history
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50

    // Show desktop notification
    showDesktopNotification(notification.title, notification.body);

    return newNotification;
  }, [showDesktopNotification]);

  // Process new appointments and create notifications
  const processNewAppointments = useCallback((appointments: Appointment[]) => {
    // Skip on first load to avoid showing all existing appointments
    if (isFirstLoad.current) {
      appointments.forEach(apt => seenAppointmentIds.current.add(apt.id));
      isFirstLoad.current = false;
      return;
    }

    // Find truly new appointments
    const newAppointments = appointments.filter(apt => !seenAppointmentIds.current.has(apt.id));

    newAppointments.forEach(apt => {
      seenAppointmentIds.current.add(apt.id);

      addNotification({
        title: t('notifications.newAppointmentTitle'),
        body: t('notifications.newAppointmentBody', {
          name: apt.patientName,
          date: apt.dateKey,
          time: apt.time,
        }),
        type: 'new_appointment',
        appointmentId: apt.id,
      });
    });
  }, [addNotification, t]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Remove a notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  return {
    permission,
    notifications,
    unreadCount,
    requestPermission,
    addNotification,
    processNewAppointments,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    showDesktopNotification,
  };
}

export default useNotifications;
