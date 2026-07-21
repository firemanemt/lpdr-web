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
    const { photos, ...caseFields } = req.validatedBody;
    const caseData = {
      ...caseFields,
      ownerId: req.userId,
    };

    const newCase = await storage.createCase(caseData);

    // Save photos if provided
    if (photos && photos.length > 0) {
      for (const photoUrl of photos.slice(0, 5)) { // Max 5 photos
        await storage.addCasePhoto(newCase.id, photoUrl, req.userId);
      }
    }

    // Transition to "notifying" status
    await storage.updateCase(newCase.id, { status: 'notifying' });
    await storage.addTimelineEntry(newCase.id, 'notifying', 'Notifying nearby pilots...', null);

    // Notify nearby pilots
    const nearbyPilots = await storage.getAvailablePilots(
      caseData.lastSeenLat,
      caseData.lastSeenLng,
      caseData.searchRadius || 25
    );

    notifyNearbyPilots(newCase, nearbyPilots).catch(err => 
      console.warn('Notification error:', err.message)
    );

    // Load photos for response
    const casePhotos = await storage.getCasePhotos(newCase.id);

    res.status(201).json({
      case: { ...newCase, photos: casePhotos },
      nearbyPilots: nearbyPilots.length,
      message: 'Case submitted! Notifying nearby pilots.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/cases — Get user's cases + available cases for pilots
router.get('/', authenticate, async (req, res, next) => {
  try {
    const cases = await storage.getCasesForUser(req.userId, req.user.role);
    
    // For pilots, also include unassigned cases near them
    if (req.user.role === 'drone_pilot') {
      const profile = await storage.getPilotProfile(req.userId);
      if (profile?.profile && profile.profile.available && profile.profile.verified) {
        const pilotLat = parseFloat(profile.profile.base_lat);
        const pilotLng = parseFloat(profile.profile.base_lng);
        const pilotRadius = profile.profile.service_radius || 50;
        
        if (pilotLat && pilotLng) {
          const allCases = await storage.getCasesForUser(req.userId, 'admin'); // Get all cases
          const assignedIds = new Set(cases.map(c => c.id));
          
          // Filter to unassigned cases within pilot's service radius
          const nearbyUnassigned = allCases.filter(c => {
            if (assignedIds.has(c.id)) return false;
            if (c.pilot_id) return false;
            if (c.status !== 'notifying' && c.status !== 'submitted') return false;
            if (!c.last_seen_lat || !c.last_seen_lng) return false;
            
            // Check distance
            const dist = haversineDistance(pilotLat, pilotLng, parseFloat(c.last_seen_lat), parseFloat(c.last_seen_lng));
            return dist <= pilotRadius;
          });
          
          cases.push(...nearbyUnassigned);
        }
      }
    }
    
    const enriched = [];
    for (const c of cases) {
      const timeline = await storage.getTimeline(c.id);
      const owner = await storage.findUserById(c.owner_id);
      const pilot = c.pilot_id ? await storage.findUserById(c.pilot_id) : null;
      const messages = await storage.getMessages(c.id);
      const unread = messages.filter(m => m.sender_id !== req.userId && !m.read).length;
      const photos = await storage.getCasePhotos(c.id);

      enriched.push({
        ...c,
        ownerName: owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown',
        pilotName: pilot ? `${pilot.first_name} ${pilot.last_name}` : null,
        unreadMessages: unread,
        timeline,
        photos,
      });
    }

    res.json({ cases: enriched });
  } catch (err) {
    next(err);
  }
});

// Haversine distance in miles
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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
    const owner = await storage.findUserById(caseItem.owner_id);
    const pilot = caseItem.pilot_id ? await storage.findUserById(caseItem.pilot_id) : null;
    const photos = await storage.getCasePhotos(caseItem.id);

    res.json({
      case: {
        ...caseItem,
        owner: owner ? { id: owner.id, firstName: owner.first_name, lastName: owner.last_name, email: owner.email, phone: owner.phone } : null,
        pilot: pilot ? { id: pilot.id, firstName: pilot.first_name, lastName: pilot.last_name, email: pilot.email, phone: pilot.phone } : null,
        timeline,
        messages: messages.slice(-50),
        photos,
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
    if (caseItem.status !== 'notifying' && caseItem.status !== 'submitted') throw new AppError('Case is not available for acceptance', 400);

    await storage.updateCase(caseItem.id, { pilot_id: req.userId, status: 'matched' });
    await storage.addTimelineEntry(caseItem.id, 'matched', `Pilot accepted the case`, req.userId);

    // Notify the pet owner
    const owner = await storage.findUserById(caseItem.owner_id);
    notifyOwnerPilotAssigned(caseItem.owner_id, `${req.user.first_name} ${req.user.last_name}`, caseItem.pet_name, owner?.email).catch(err =>
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
      const owner = await storage.findUserById(caseItem.owner_id);
      notifyOwnerSearchStarted(caseItem.owner_id, caseItem.pet_name, owner?.email).catch(err =>
        console.warn('Notification error:', err.message)
      );
    } else if (status === 'found') {
      const owner = await storage.findUserById(caseItem.owner_id);
      notifyOwnerPetFound(caseItem.owner_id, caseItem.pet_name, owner?.email).catch(err =>
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
    const existingReviews = await storage.getReviewsForPilot(caseItem.pilot_id);
    const alreadyReviewed = existingReviews.find(r => r.case_id === caseItem.id);
    if (alreadyReviewed) throw new AppError('Already reviewed this case', 409);

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

// POST /api/cases/:id/photos — Add photos to a case
router.post('/:id/photos', authenticate, async (req, res, next) => {
  try {
    const { photos } = req.body;
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      throw new AppError('At least one photo is required', 400);
    }

    const caseItem = await storage.getCaseById(req.params.id);
    if (!caseItem) throw new AppError('Case not found', 404);

    // Only owner or assigned pilot can add photos
    if (caseItem.owner_id !== req.userId && caseItem.pilot_id !== req.userId && req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const saved = [];
    for (const photoUrl of photos.slice(0, 5)) {
      const photo = await storage.addCasePhoto(caseItem.id, photoUrl, req.userId);
      saved.push(photo);
    }

    res.status(201).json({ photos: saved });
  } catch (err) {
    next(err);
  }
});

export default router;
