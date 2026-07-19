import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, adminReviewSchema } from '../middleware/validation.js';
import { AppError } from '../middleware/errorHandler.js';
import storage from '../services/storage.js';
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from '../services/mailService.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireRole('admin'));

// GET /api/admin/stats — Dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const [userCounts, caseCounts, pendingVerifications] = await Promise.all([
      storage.getUserCount(),
      storage.getCaseCount(),
      storage.getPendingVerifications(),
    ]);

    res.json({
      users: userCounts,
      cases: caseCounts,
      pendingVerifications: pendingVerifications.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users — List all users
router.get('/users', async (req, res, next) => {
  try {
    const { role, limit, offset } = req.query;
    const users = await storage.getAllUsers(role, parseInt(limit) || 50, parseInt(offset) || 0);
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/cases — List all cases
router.get('/cases', async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const cases = await storage.getAllCases(parseInt(limit) || 50, parseInt(offset) || 0);
    res.json({ cases });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/verifications — List pending pilot verifications
router.get('/verifications', async (req, res, next) => {
  try {
    const verifications = await storage.getPendingVerifications();
    res.json({ verifications });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/verifications/:id/review — Approve or reject a pilot verification
router.post('/verifications/:id/review', validate(adminReviewSchema), async (req, res, next) => {
  try {
    const { status, notes } = req.validatedBody;
    const pilotId = req.params.id;

    // Get pilot profile first
    const pilot = await storage.getPilotProfile(pilotId);
    if (!pilot) {
      throw new AppError('Pilot not found', 404);
    }

    // Update verification status
    const updated = await storage.reviewPilotVerification(pilotId, status, notes);
    if (!updated) {
      throw new AppError('Failed to update verification', 500);
    }

    // Send email notification
    try {
      if (status === 'approved') {
        await sendVerificationApprovedEmail(pilot.email, pilot.first_name);
      } else {
        await sendVerificationRejectedEmail(pilot.email, pilot.first_name, notes);
      }
    } catch (err) {
      console.warn('Failed to send verification email:', err.message);
    }

    res.json({
      message: `Pilot verification ${status}`,
      verification: {
        pilotId,
        status,
        notes,
        reviewedAt: updated.verification_reviewed_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
