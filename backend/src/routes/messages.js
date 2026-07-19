import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import storage from '../services/storage.js';

const router = Router();

// GET /api/cases/:caseId/messages — Get messages for a case
router.get('/:caseId/messages', authenticate, async (req, res, next) => {
  try {
    const caseItem = await storage.getCaseById(req.params.caseId);
    if (!caseItem) throw new AppError('Case not found', 404);

    // Check access
    if (caseItem.owner_id !== req.userId && caseItem.pilot_id !== req.userId && req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const messages = await storage.getMessages(req.params.caseId);
    
    // Enrich with sender info
    const enriched = messages.map(m => {
      const sender = storage.users.find(u => u.id === m.sender_id);
      return {
        ...m,
        sender: sender ? {
          id: sender.id,
          firstName: sender.first_name,
          lastName: sender.last_name,
          role: sender.role,
        } : null,
      };
    });

    res.json({ messages: enriched });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:caseId/messages — Send a message
router.post('/:caseId/messages', authenticate, async (req, res, next) => {
  try {
    const { text, imageUrl } = req.body;
    const caseItem = await storage.getCaseById(req.params.caseId);
    if (!caseItem) throw new AppError('Case not found', 404);

    // Check access
    if (caseItem.owner_id !== req.userId && caseItem.pilot_id !== req.userId && req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    if (!text && !imageUrl) {
      throw new AppError('Message text or image is required', 400);
    }

    const message = await storage.sendMessage(req.params.caseId, req.userId, text, imageUrl);
    
    // In production: emit via WebSocket here

    const sender = storage.users.find(u => u.id === message.sender_id);
    res.status(201).json({
      message: {
        ...message,
        sender: sender ? {
          id: sender.id,
          firstName: sender.first_name,
          lastName: sender.last_name,
          role: sender.role,
        } : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:caseId/messages/read — Mark messages as read
router.post('/:caseId/messages/read', authenticate, async (req, res, next) => {
  try {
    await storage.markMessagesRead(req.params.caseId, req.userId);
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    next(err);
  }
});

export default router;
