/**
 * Notification Service (Frontend)
 * Handles browser push notifications and sound alerts
 */

let notificationPermission = null;

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission === 'granted';
  } catch (err) {
    console.warn('Notification permission error:', err);
    return false;
  }
}

/**
 * Check if we have notification permission
 */
export function hasNotificationPermission() {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * Show a browser notification
 */
export function showNotification(title, options = {}) {
  if (!hasNotificationPermission()) {
    // Try requesting permission first time
    requestNotificationPermission();
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: '/lpdr-logo.png',
      badge: '/lpdr-logo.png',
      tag: options.tag || 'lpdr-notification',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  } catch (err) {
    console.warn('Notification error:', err);
  }
}

/**
 * Play notification sound
 */
let audioContext = null;

export function playNotificationSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create a simple two-tone notification beep
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator1.frequency.value = 880; // A5
    oscillator2.frequency.value = 1100; // ~C#6
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    gainNode.gain.value = 0.15;

    const now = audioContext.currentTime;
    oscillator1.start(now);
    oscillator1.stop(now + 0.15);
    oscillator2.start(now + 0.2);
    oscillator2.stop(now + 0.35);
  } catch (err) {
    // Audio might not be available
    console.warn('Sound notification error:', err);
  }
}

/**
 * Notify about a new case (for pilots)
 */
export function notifyNewCase(petName, address) {
  playNotificationSound();
  showNotification(`🐾 New Lost Pet: ${petName}`, {
    body: `Last seen near ${address}`,
    tag: 'new-case',
    url: '/pilot/dashboard',
  });
}

/**
 * Notify about a new message
 */
export function notifyNewMessage(senderName, preview) {
  playNotificationSound();
  showNotification(`💬 ${senderName}`, {
    body: preview || 'Sent you a message',
    tag: 'new-message',
  });
}

/**
 * Notify about case status change (for owners)
 */
export function notifyCaseUpdate(status, petName) {
  playNotificationSound();
  const messages = {
    matched: `A pilot has been assigned to find ${petName}!`,
    searching: `The search for ${petName} has started!`,
    found: `🎉 ${petName} has been found!`,
  };
  showNotification(`📋 Case Update: ${petName}`, {
    body: messages[status] || `Status changed to ${status}`,
    tag: 'case-update',
  });
}

export default {
  requestNotificationPermission,
  hasNotificationPermission,
  showNotification,
  playNotificationSound,
  notifyNewCase,
  notifyNewMessage,
  notifyCaseUpdate,
};
