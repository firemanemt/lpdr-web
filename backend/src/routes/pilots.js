import { Router } from 'express';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';
import { validate, pilotProfileSchema } from '../middleware/validation.js';
import { AppError } from '../middleware/errorHandler.js';
import storage from '../services/storage.js';

const router = Router();

// GET /api/pilots — List available pilots with optional location filter
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { lat, lng, radius, equipment } = req.query;
    
    let pilots = await storage.getAvailablePilots(
      lat ? parseFloat(lat) : null,
      lng ? parseFloat(lng) : null,
      radius ? parseInt(radius) : null
    );

    // Filter by equipment if specified
    if (equipment) {
      const filters = equipment.split(',');
      pilots = pilots.filter(pilot => {
        const eq = pilot.equipment?.[0];
        if (!eq) return false;
        return filters.every(f => {
          if (f === 'thermal') return eq.has_thermal;
          if (f === 'spotlight') return eq.has_spotlight;
          if (f === 'speaker') return eq.has_speaker;
          return true;
        });
      });
    }

    // Map to safe output (remove password)
    const safePilots = pilots.map(p => {
      const { password, ...safeUser } = p;
      return {
        id: p.id,
        email: p.email,
        firstName: p.first_name,
        lastName: p.last_name,
        phone: p.phone,
        avatarUrl: p.avatar_url,
        profile: p.profile,
        equipment: p.equipment,
        pricing: p.pricing,
        location: p.location,
      };
    });

    res.json({ pilots: safePilots, total: safePilots.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/pilots/:id — Get pilot profile
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const pilot = await storage.getPilotProfile(req.params.id);
    if (!pilot) {
      throw new AppError('Pilot not found', 404);
    }
    const { password, ...safePilot } = pilot;
    res.json({ pilot: safePilot });
  } catch (err) {
    next(err);
  }
});

// GET /api/pilots/:id/reviews — Get pilot reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await storage.getReviewsForPilot(req.params.id);
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

// PUT /api/pilots/me/profile — Update own pilot profile (requires pilot role)
router.put('/me/profile', authenticate, requireRole('drone_pilot'), async (req, res, next) => {
  try {
    const pilotId = req.userId;
    const updates = req.body;
    
    const profile = await storage.updatePilotProfile(pilotId, {
      bio: updates.bio,
      base_lat: updates.baseLat,
      base_lng: updates.baseLng,
      service_radius: updates.serviceRadius,
      cover_photo_url: updates.coverPhotoUrl,
    });

    // Update equipment if provided
    if (updates.equipment) {
      // For demo purposes, clear and re-add
      storage.pilotEquipment = storage.pilotEquipment.filter(e => e.pilot_id !== pilotId);
      updates.equipment.forEach(eq => {
        storage.pilotEquipment.push({
          id: crypto.randomUUID?.() || require('uuid').v4(),
          pilot_id: pilotId,
          ...eq,
        });
      });
    }

    // Update pricing if provided
    if (updates.pricing) {
      storage.pilotPricing = storage.pilotPricing.filter(p => p.pilot_id !== pilotId);
      updates.pricing.forEach(pr => {
        storage.pilotPricing.push({
          id: crypto.randomUUID?.() || require('uuid').v4(),
          pilot_id: pilotId,
          price_type: pr.priceType,
          amount: pr.amount,
          description: pr.description,
        });
      });
    }

    const updated = await storage.getPilotProfile(pilotId);
    const { password, ...safePilot } = updated;
    res.json({ pilot: safePilot });
  } catch (err) {
    next(err);
  }
});

// PUT /api/pilots/me/availability — Toggle availability
router.put('/me/availability', authenticate, requireRole('drone_pilot'), async (req, res, next) => {
  try {
    const { available } = req.body;
    const profile = await storage.updatePilotProfile(req.userId, { available });
    res.json({ available: profile.available });
  } catch (err) {
    next(err);
  }
});

// POST /api/pilots/me/location — Update GPS location
router.post('/me/location', authenticate, requireRole('drone_pilot'), async (req, res, next) => {
  try {
    const { lat, lng, heading, speed } = req.body;
    const location = await storage.updatePilotLocation(req.userId, lat, lng, heading, speed);
    res.json({ location });
  } catch (err) {
    next(err);
  }
});

export default router;
