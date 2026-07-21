import { Router } from 'express';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';
import { validate, pilotProfileSchema, pilotVerificationSchema } from '../middleware/validation.js';
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

    // Map to safe output (remove password, sensitive verification data)
    const safePilots = pilots.map(p => {
      const { password, email_verification_token, password_reset_token, ...safeUser } = p;
      return {
        id: p.id,
        email: p.email,
        firstName: p.first_name,
        lastName: p.last_name,
        phone: p.phone,
        avatarUrl: p.avatar_url,
        emailVerified: p.email_verified,
        profile: {
          ...p.profile,
          faa_cert_number: p.profile?.verified ? p.profile.faa_cert_number : null,
          insurance_provider: null,
          insurance_policy_number: null,
          verification_notes: null,
        },
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

// ============================
// /me/ routes MUST come before /:id to avoid Express matching 'me' as an ID
// ============================

// PUT /api/pilots/me/profile — Update own pilot profile
router.put('/me/profile', authenticate, requireRole('drone_pilot'), async (req, res, next) => {
  try {
    const pilotId = req.userId;
    const updates = req.body;

    // Update basic user info if provided
    if (updates.firstName || updates.lastName || updates.phone) {
      await storage.updateUser(pilotId, {
        ...(updates.firstName ? { first_name: updates.firstName } : {}),
        ...(updates.lastName ? { last_name: updates.lastName } : {}),
        ...(updates.phone ? { phone: updates.phone } : {}),
      });
    }

    // Update pilot profile
    await storage.updatePilotProfile(pilotId, {
      bio: updates.bio,
      base_lat: updates.baseLat,
      base_lng: updates.baseLng,
      service_radius: updates.serviceRadius,
      cover_photo_url: updates.coverPhotoUrl,
    });

    // Update equipment if provided
    if (updates.equipment && storage.pool) {
      await storage.pool.query('DELETE FROM pilot_equipment WHERE pilot_id = $1', [pilotId]);
      for (const eq of updates.equipment) {
        await storage.pool.query(
          `INSERT INTO pilot_equipment (id, pilot_id, drone_model, has_thermal, has_spotlight, has_speaker, camera_type, notes)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)`,
          [pilotId, eq.droneModel || eq.drone_model || null, eq.hasThermal || eq.has_thermal || false,
           eq.hasSpotlight || eq.has_spotlight || false, eq.hasSpeaker || eq.has_speaker || false,
           eq.cameraType || eq.camera_type || null, eq.notes || null]
        );
      }
    } else if (updates.equipment && storage.pilotEquipment) {
      storage.pilotEquipment = storage.pilotEquipment.filter(e => e.pilot_id !== pilotId);
      for (const eq of updates.equipment) {
        storage.pilotEquipment.push({
          id: crypto.randomUUID?.() || (await import('uuid')).v4(),
          pilot_id: pilotId,
          drone_model: eq.droneModel || eq.drone_model,
          has_thermal: eq.hasThermal || eq.has_thermal || false,
          has_spotlight: eq.hasSpotlight || eq.has_spotlight || false,
          has_speaker: eq.hasSpeaker || eq.has_speaker || false,
          camera_type: eq.cameraType || eq.camera_type,
          notes: eq.notes,
        });
      }
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

// POST /api/pilots/me/verification — Submit pilot verification
router.post('/me/verification', authenticate, requireRole('drone_pilot'), validate(pilotVerificationSchema), async (req, res, next) => {
  try {
    const pilotId = req.userId;
    const { faaCertNumber, insuranceProvider, insurancePolicyNumber } = req.validatedBody;

    const pilot = await storage.getPilotProfile(pilotId);
    if (!pilot) {
      throw new AppError('Pilot profile not found', 404);
    }
    if (pilot.profile?.verification_status === 'approved') {
      throw new AppError('You are already verified', 400);
    }
    if (pilot.profile?.verification_status === 'pending') {
      throw new AppError('Verification already submitted and pending review', 400);
    }

    const result = await storage.submitPilotVerification(pilotId, {
      faaCertNumber,
      insuranceProvider,
      insurancePolicyNumber,
    });

    res.json({
      message: 'Verification submitted! Our team will review your credentials within 1-2 business days.',
      verification: {
        status: 'pending',
        submittedAt: result.verification_submitted_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/pilots/me/verification — Get verification status
router.get('/me/verification', authenticate, requireRole('drone_pilot'), async (req, res, next) => {
  try {
    const pilot = await storage.getPilotProfile(req.userId);
    if (!pilot?.profile) {
      throw new AppError('Pilot profile not found', 404);
    }
    res.json({
      verification: {
        status: pilot.profile.verification_status,
        faaCertNumber: pilot.profile.faa_cert_number,
        insuranceProvider: pilot.profile.insurance_provider,
        submittedAt: pilot.profile.verification_submitted_at,
        reviewedAt: pilot.profile.verification_reviewed_at,
        notes: pilot.profile.verification_notes,
        verified: pilot.profile.verified,
      },
    });
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

// ============================
// Dynamic /:id routes come LAST
// ============================

// GET /api/pilots/:id — Get pilot profile
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const pilot = await storage.getPilotProfile(req.params.id);
    if (!pilot) {
      throw new AppError('Pilot not found', 404);
    }
    const { password, email_verification_token, password_reset_token, ...safePilot } = pilot;
    if (safePilot.profile) {
      safePilot.profile.insurance_policy_number = null;
      safePilot.profile.verification_notes = null;
    }
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

export default router;
