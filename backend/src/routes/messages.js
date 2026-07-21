import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import storage from '../services/storage.js';

const router = Router();

// GET /api/messages/conversations — Get all conversations for the current user
router.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const role = req.user.role;

    const allCases = await storage.getCasesForUser(userId, role);
    const conversations = [];

    for (const c of allCases) {
      const messages = await storage.getMessages(c.id);
      const hasMessages = messages.length > 0;
      const isAssigned = !!c.pilot_id;
      
      if (!isAssigned && !hasMessages) continue;

      const otherPerson = c.owner_id === userId
        ? (c.pilot_id ? await storage.findUserById(c.pilot_id) : null)
        : await storage.findUserById(c.owner_id);

      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      const unreadCount = messages.filter(m => m.sender_id !== userId && !m.read).length;

      conversations.push({
        caseId: c.id,
        petName: c.pet_name,
        petType: c.pet_type,
        caseStatus: c.status,
        otherPerson: otherPerson ? {
          id: otherPerson.id,
          firstName: otherPerson.first_name,
          lastName: otherPerson.last_name,
          role: otherPerson.role,
        } : null,
        lastMessage: lastMessage ? {
          text: lastMessage.text,
          imageUrl: lastMessage.image_url,
          senderId: lastMessage.sender_id,
          createdAt: lastMessage.created_at,
        } : null,
        unreadCount,
        lastActivity: lastMessage?.created_at || c.updated_at,
      });
    }

    conversations.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
});

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
    const enriched = [];
    for (const m of messages) {
      const sender = await storage.findUserById(m.sender_id);
      enriched.push({
        ...m,
        sender: sender ? {
          id: sender.id,
          firstName: sender.first_name,
          lastName: sender.last_name,
          role: sender.role,
        } : null,
      });
    }

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

    const sender = await storage.findUserById(message.sender_id);
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
