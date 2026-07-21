import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getVapidPublicKey, saveSubscription, removeSubscription } from '../services/pushService.js';

const router = Router();

// GET /api/push/vapid-key — Get the public VAPID key for frontend
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
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
