import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import storage from '../services/storage.js';

const router = Router();

// POST /api/notifications/register — Register device for push notifications
router.post('/register', authenticate, async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    await storage.registerToken(req.userId, token, platform || 'web');
    res.json({ message: 'Device registered for notifications' });
  } catch (err) {
    next(err);
  }
});

export default router;
