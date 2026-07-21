import webpush from 'web-push';
import pool from '../config/database.js';

// Configure VAPID - these keys are generated once and must stay the same
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BANMdgvCAkjRIDkEuhFCXqKRLpTHVy_CwX9KQEEaJ9hQjjCJyCf_ELg4O9eMHTzeP039AKdDFyLmgiRVVL5jS4I';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UZvGYHWx8831SVqJjwL2g1jp4ibdHVNyH_MbF8LbsCM';
const VAPID_SUBJECT = `mailto:support@lostpetdronerecovery.com`;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

/**
 * Save a push subscription for a user
 */
export async function saveSubscription(userId, subscription) {
  const { endpoint, keys } = subscription;
  const keysJson = JSON.stringify(keys);

  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4, updated_at = NOW()`,
    [userId, endpoint, keys.p256dh, keys.auth]
  );
  console.log(`📱 Push subscription saved for user ${userId}`);
}

/**
 * Remove a push subscription
 */
export async function removeSubscription(userId, endpoint) {
  await pool.query(
    `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
    [userId, endpoint]
  );
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushToUser(userId, payload) {
  const result = await pool.query(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) return;

  const subscriptions = result.rows;
  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/lpdr-logo.png',
    badge: '/lpdr-logo.png',
    data: payload.data || {},
    tag: payload.tag || 'default',
    requireInteraction: payload.requireInteraction || false,
    vibrate: payload.vibrate || [200, 100, 200],
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message,
          { TTL: 3600 }
        );
      } catch (err) {
        // If subscription is expired/invalid, remove it
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`📱 Removing expired push subscription: ${sub.endpoint.substring(0, 50)}...`);
          await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [sub.endpoint]);
        } else {
          throw err;
        }
      }
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  if (sent > 0) {
    console.log(`📱 Push notification sent to ${sent} device(s) for user ${userId}: ${payload.title}`);
  }
}

/**
 * Send push notification to all users with a specific role
 */
export async function sendPushToRole(role, payload) {
  const result = await pool.query(
    `SELECT DISTINCT ps.endpoint, ps.p256dh, ps.auth
     FROM push_subscriptions ps
     JOIN users u ON ps.user_id = u.id
     WHERE u.role = $1`,
    [role]
  );

  if (result.rows.length === 0) return;

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/lpdr-logo.png',
    badge: '/lpdr-logo.png',
    data: payload.data || {},
    tag: payload.tag || 'default',
    requireInteraction: payload.requireInteraction || false,
    vibrate: payload.vibrate || [200, 100, 200],
  });

  const results = await Promise.allSettled(
    result.rows.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message,
          { TTL: 3600 }
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [sub.endpoint]);
        } else {
          throw err;
        }
      }
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  if (sent > 0) {
    console.log(`📱 Push sent to ${sent} ${role} device(s): ${payload.title}`);
  }
}
