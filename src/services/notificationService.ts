import { Capture } from '../types';

class NotificationService {
  private hasPermission = false;
  private notifiedIds: string[] = [];

  constructor() {
    this.requestPermission();
    // Load notified IDs from session storage to avoid double notifications in same session
    const stored = sessionStorage.getItem('notified_reminders');
    if (stored) {
      this.notifiedIds = JSON.parse(stored);
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
    }
  }

  private markAsNotified(id: string, type: 'today' | 'tomorrow') {
    const key = `${id}_${type}`;
    if (!this.notifiedIds.includes(key)) {
      this.notifiedIds.push(key);
      sessionStorage.setItem('notified_reminders', JSON.stringify(this.notifiedIds));
    }
  }

  private alreadyNotified(id: string, type: 'today' | 'tomorrow') {
    return this.notifiedIds.includes(`${id}_${type}`);
  }

  checkReminders(captures: Capture[], t: (key: string) => string) {
    if (!this.hasPermission) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrow = today + (24 * 60 * 60 * 1000);

    captures.forEach(capture => {
      if (!capture.reminderDate) return;

      const rDate = new Date(capture.reminderDate);
      const reminderDay = new Date(rDate.getFullYear(), rDate.getMonth(), rDate.getDate()).getTime();

      // Today (notify if it's 8 AM or later)
      if (reminderDay === today && now.getHours() >= 8 && !this.alreadyNotified(capture.id, 'today')) {
        this.sendNotification(`${t('Reminder: ')}${capture.title}`, t('This reminder is for today.'));
        this.markAsNotified(capture.id, 'today');
      }

      // Tomorrow (notify if it's 8 PM or later today)
      const dayBeforeReminder = reminderDay - (24 * 60 * 60 * 1000);
      if (today === dayBeforeReminder && now.getHours() >= 20 && !this.alreadyNotified(capture.id, 'tomorrow')) {
        this.sendNotification(`${t('Upcoming: ')}${capture.title}`, t('You have this reminder scheduled for tomorrow.'));
        this.markAsNotified(capture.id, 'tomorrow');
      }
    });
  }

  sendNotification(title: string, body: string) {
    // Dispatch custom event for in-app toast
    window.dispatchEvent(new CustomEvent('app-notification', { detail: { title, body } }));

    if (!this.hasPermission) return;
    
    new Notification(title, {
      body,
      icon: '/favicon.ico', // Standard icon
    });
  }
}

export const notificationService = new NotificationService();
