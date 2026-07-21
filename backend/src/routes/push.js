import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getVapidPublicKey, saveSubscription, removeSubscription } from '../services/pushService.js';

const router = Router();

// GET /api/push/vapid-key — Get the public VAPID key for frontend
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// GET /api/push/status — Check push subscription status (debug)
router.get('/status', authenticate, async (req, res) => {
  try {
    const pool = (await import('../config/database.js')).default;
    const result = await pool.query('SELECT endpoint, created_at FROM push_subscriptions WHERE user_id = $1', [req.user.id]);
    const allSubs = await pool.query('SELECT user_id, endpoint, created_at FROM push_subscriptions');
    res.json({
      mySubscriptions: result.rows.length,
      myEndpoints: result.rows.map(r => ({ endpoint: r.endpoint.substring(0, 60) + '...', created: r.created_at })),
      totalSubscriptions: allSubs.rows.length,
      allSubs: allSubs.rows.map(r => ({ userId: r.user_id, endpoint: r.endpoint.substring(0, 60) + '...' })),
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// POST /api/push/subscribe — Register a push subscription
router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }
    await saveSubscription(req.user.id, subscription);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/push/unsubscribe — Remove a push subscription
router.post('/unsubscribe', authenticate, async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Endpoint required' });
    await removeSubscription(req.user.id, endpoint);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
