import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, createCaseSchema } from '../middleware/validation.js';
import { AppError } from '../middleware/errorHandler.js';
import storage from '../services/storage.js';
import { notifyNearbyPilots, notifyOwnerPilotAssigned, notifyOwnerSearchStarted, notifyOwnerPetFound } from '../services/notificationService.js';

const router = Router();

// POST /api/cases — Submit a new lost pet case
router.post('/', authenticate, requireRole('pet_owner'), validate(createCaseSchema), async (req, res, next) => {
  try {
    const caseData = {
      ...req.validatedBody,
      ownerId: req.userId,
    };

    const newCase = await storage.createCase(caseData);

    // Transition to "notifying" status
    await storage.updateCase(newCase.id, { status: 'notifying' });
    await storage.addTimelineEntry(newCase.id, 'notifying', 'Notifying nearby pilots...', null);

    // In production: trigger push notifications to nearby pilots
    const nearbyPilots = await storage.getAvailablePilots(
      caseData.lastSeenLat,
      caseData.lastSeenLng,
      caseData.searchRadius || 25
    );

    // Send notifications to nearby pilots
    notifyNearbyPilots(newCase, nearbyPilots).catch(err => 
      console.warn('Notification error:', err.message)
    );

    res.status(201).json({
      case: newCase,
      nearbyPilots: nearbyPilots.length,
      message: 'Case submitted! Notifying nearby pilots.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/cases — Get user's cases
router.get('/', authenticate, async (req, res, next) => {
  try {
    const cases = await storage.getCasesForUser(req.userId, req.user.role);
    const enriched = cases.map(c => {
      const timeline = storage.caseTimeline.filter(t => t.case_id === c.id);
      const owner = storage.users.find(u => u.id === c.owner_id);
      const pilot = c.pilot_id ? storage.users.find(u => u.id === c.pilot_id) : null;
      const messages = storage.messages.filter(m => m.case_id === c.id);
      const unread = messages.filter(m => m.sender_id !== req.userId && !m.read).length;
      return {
        ...c,
        ownerName: owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown',
        pilotName: pilot ? `${pilot.first_name} ${pilot.last_name}` : null,
        unreadMessages: unread,
        timeline,
      };
    });

    res.json({ cases: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/cases/:id — Get case details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const caseItem = await storage.getCaseById(req.params.id);
    if (!caseItem) {
      throw new AppError('Case not found', 404);
    }

    // Verify access (owner, assigned pilot, or admin)
    if (req.user.role !== 'admin' && 
        caseItem.owner_id !== req.userId && 
        caseItem.pilot_id !== req.userId) {
      throw new AppError('Access denied', 403);
    }

    const timeline = await storage.getTimeline(caseItem.id);
    const messages = await storage.getMessages(caseItem.id);
    const owner = storage.users.find(u => u.id === caseItem.owner_id);
    const pilot = caseItem.pilot_id ? storage.users.find(u => u.id === caseItem.pilot_id) : null;

    res.json({
      case: {
        ...caseItem,
        owner: owner ? { id: owner.id, firstName: owner.first_name, lastName: owner.last_name, email: owner.email, phone: owner.phone } : null,
        pilot: pilot ? { id: pilot.id, firstName: pilot.first_name, lastName: pilot.last_name, email: pilot.email, phone: pilot.phone } : null,
        timeline,
        messages: messages.slice(-50), // Last 50 messages
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/accept — Pilot accepts a case
router.post('/:id/accept', authenticate, requireRole('drone_pilot'), async (req, res, next) => {
  try {
    const caseItem = await storage.getCaseById(req.params.id);
    if (!caseItem) throw new AppError('Case not found', 404);
    if (caseItem.status !== 'notifying') throw new AppError('Case is not available for acceptance', 400);

    await storage.updateCase(caseItem.id, { pilot_id: req.userId, status: 'matched' });
    await storage.addTimelineEntry(caseItem.id, 'matched', `Pilot accepted the case`, req.userId);

    // Notify the pet owner
    notifyOwnerPilotAssigned(caseItem.owner_id, `${req.user.first_name} ${req.user.last_name}`, caseItem.pet_name).catch(err =>
      console.warn('Notification error:', err.message)
    );

    res.json({ message: 'Case accepted!', status: 'matched' });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/status — Update case status
router.post('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const caseItem = await storage.getCaseById(req.params.id);
    if (!caseItem) throw new AppError('Case not found', 404);

    // Only pilot or admin can update status
    if (req.user.role !== 'admin' && caseItem.pilot_id !== req.userId) {
      throw new AppError('Only the assigned pilot can update case status', 403);
    }

    const validStatuses = ['searching', 'found', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Cannot transition to '${status}' from this endpoint`, 400);
    }

    const updates = { status };
    if (status === 'found') {
      updates.found_at = new Date();
      updates.resolution_notes = notes || null;
    }

    await storage.updateCase(caseItem.id, updates);
    await storage.addTimelineEntry(caseItem.id, status, notes || `Case status updated to ${status}`, req.userId);

    // Send notifications for key status changes
    if (status === 'searching') {
      notifyOwnerSearchStarted(caseItem.owner_id, caseItem.pet_name).catch(err =>
        console.warn('Notification error:', err.message)
      );
    } else if (status === 'found') {
      notifyOwnerPetFound(caseItem.owner_id, caseItem.pet_name).catch(err =>
        console.warn('Notification error:', err.message)
      );
    }

    res.json({ message: `Case status updated to ${status}`, status });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/cancel — Owner cancels a case
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const caseItem = await storage.getCaseById(req.params.id);
    if (!caseItem) throw new AppError('Case not found', 404);
    if (caseItem.owner_id !== req.userId) throw new AppError('Only the owner can cancel', 403);

    await storage.updateCase(caseItem.id, { status: 'cancelled' });
    await storage.addTimelineEntry(caseItem.id, 'cancelled', 'Case cancelled by owner', req.userId);

    res.json({ message: 'Case cancelled' });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/review — Leave a review
router.post('/:id/review', authenticate, requireRole('pet_owner'), async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const caseItem = await storage.getCaseById(req.params.id);
    if (!caseItem) throw new AppError('Case not found', 404);
    if (caseItem.owner_id !== req.userId) throw new AppError('Only the case owner can review', 403);
    if (!caseItem.pilot_id) throw new AppError('No pilot assigned to this case', 400);
    if (caseItem.status !== 'completed' && caseItem.status !== 'found') {
      throw new AppError('Can only review completed cases', 400);
    }

    // Check if already reviewed
    const existingReview = storage.reviews.find(r => r.case_id === caseItem.id);
    if (existingReview) throw new AppError('Already reviewed this case', 409);

    const review = await storage.createReview({
      caseId: caseItem.id,
      ownerId: req.userId,
      pilotId: caseItem.pilot_id,
      rating,
      comment,
    });

    await storage.updateCase(caseItem.id, { status: 'reviewed' });

    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
});

export default router;
