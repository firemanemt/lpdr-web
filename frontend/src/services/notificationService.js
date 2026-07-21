/**
 * Push Notification Service
 * Handles Web Push subscription for background notifications
 */

const VAPID_KEY_ENDPOINT = '/api/push/vapid-key';

let swRegistration = null;

/**
 * Convert base64 VAPID key to Uint8Array for the Push API
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Initialize push notifications — call after login
 * Returns true if subscribed successfully
 */
export async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('📱 Push not supported in this browser');
    return false;
  }

  try {
    // Register service worker
    swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('📱 Service worker registered');

    // Wait for it to be ready
    await navigator.serviceWorker.ready;

    // Check if already subscribed
    const existingSub = await swRegistration.pushManager.getSubscription();
    if (existingSub) {
      console.log('📱 Already subscribed to push');
      // Re-send to backend in case it was lost
      await sendSubscriptionToBackend(existingSub);
      return true;
    }

    // Get VAPID public key from backend
    const response = await fetch(VAPID_KEY_ENDPOINT);
    const { publicKey } = await response.json();
    if (!publicKey) {
      console.warn('📱 No VAPID key from server');
      return false;
    }

    // Subscribe
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Send to backend
    await sendSubscriptionToBackend(subscription);
    console.log('📱 Push notifications enabled');
    return true;
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      console.log('📱 Push permission denied by user');
    } else {
      console.warn('📱 Push subscription failed:', err.message);
    }
    return false;
  }
}

/**
 * Send subscription to backend
 */
async function sendSubscriptionToBackend(subscription) {
  const token = localStorage.getItem('lpdr_token');
  if (!token) return;

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      subscription: {
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys,
      },
    }),
  });
}

/**
 * Unsubscribe from push notifications — call on logout
 */
export async function unsubscribePush() {
  try {
    if (!swRegistration) {
      swRegistration = await navigator.serviceWorker.getRegistration();
    }
    if (!swRegistration) return;

    const subscription = await swRegistration.pushManager.getSubscription();
    if (subscription) {
      // Tell backend to remove it
      const token = localStorage.getItem('lpdr_token');
      if (token) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {});
      }
      await subscription.unsubscribe();
      console.log('📱 Push notifications disabled');
    }
  } catch (err) {
    console.warn('📱 Push unsubscribe failed:', err.message);
  }
}

/**
 * Request notification permission (for in-app notification fallback)
 */
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/**
 * Play a notification sound using AudioContext
 */
export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 880;
    gain1.gain.value = 0.3;
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.1);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1100;
    gain2.gain.value = 0.3;
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.25);

    setTimeout(() => ctx.close(), 500);
  } catch {}
}

/**
 * Show an in-app notification (fallback for when app is in foreground)
 */
export function showNotification(title, options = {}) {
  playNotificationSound();
  if (swRegistration && Notification.permission === 'granted') {
    swRegistration.showNotification(title, {
      icon: '/lpdr-logo.png',
      badge: '/lpdr-logo.png',
      vibrate: [200, 100, 200],
      ...options,
    });
  }
}

// Legacy compatibility with existing notification service
export function notifyNewCase(petName, location) {
  showNotification(`🐾 New Case: ${petName}`, {
    body: `Lost pet reported in ${location}`,
    tag: 'new-case',
    data: { url: '/pilot/dashboard' },
    requireInteraction: true,
  });
}

export function notifyNewMessage(senderName, caseId) {
  showNotification(`💬 Message from ${senderName}`, {
    body: 'You have a new message',
    tag: `msg-${caseId}`,
    data: { url: `/cases/${caseId}` },
  });
}

export function notifyCaseUpdate(status, petName, caseId) {
  showNotification(`📋 Case Update: ${petName}`, {
    body: `Status changed to ${status}`,
    tag: `case-${caseId}`,
    data: { url: `/cases/${caseId}` },
  });
}
