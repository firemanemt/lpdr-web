import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, adminReviewSchema } from '../middleware/validation.js';
import { AppError } from '../middleware/errorHandler.js';
import storage from '../services/storage.js';
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail, sendEmail } from '../services/mailService.js';

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

// POST /api/admin/cases/:caseId/assign — Manually assign a pilot to a case
router.post('/cases/:caseId/assign', async (req, res, next) => {
  try {
    const { pilotId } = req.body;
    if (!pilotId) throw new AppError('Pilot ID is required', 400);

    const caseItem = await storage.getCaseById(req.params.caseId);
    if (!caseItem) throw new AppError('Case not found', 404);

    const pilot = await storage.findUserById(pilotId);
    if (!pilot || pilot.role !== 'drone_pilot') throw new AppError('Invalid pilot', 400);

    await storage.updateCase(caseItem.id, { pilot_id: pilotId, status: 'matched' });
    await storage.addTimelineEntry(caseItem.id, 'matched', `Admin assigned pilot ${pilot.first_name} ${pilot.last_name}`, req.userId);

    res.json({ message: `Pilot ${pilot.first_name} ${pilot.last_name} assigned to case`, status: 'matched' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/broadcast — Send broadcast email to all users
router.post('/broadcast', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) throw new AppError('Message is required', 400);

    const users = await storage.getAllUsers(null, 1000);

    let sent = 0;
    for (const u of users) {
      try {
        await sendEmail(
          u.email,
          'LPDR — Important Update',
          `<div style="font-family: 'Cabin Condensed', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c1220; color: #f1f5f9; padding: 2rem; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <h1 style="font-family: 'Black Ops One', cursive; color: #046bd2; font-size: 1.5rem; margin: 0;">LPDR</h1>
              <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.25rem;">Lost Pet Drone Recovery</p>
            </div>
            <h2 style="font-size: 1.05rem; margin-bottom: 0.75rem;">Hey ${u.first_name || 'there'},</h2>
            <p style="color: #94a3b8; line-height: 1.6; white-space: pre-line;">${message}</p>
            <hr style="border: none; border-top: 1px solid #1e2d4a; margin: 1.5rem 0;" />
            <p style="color: #64748b; font-size: 0.75rem; text-align: center;">Lost Pet Drone Recovery · lostpetdronerecovery.com</p>
          </div>`
        );
        sent++;
      } catch (err) {
        console.warn(`Failed to send broadcast to ${u.email}:`, err.message);
      }
    }

    res.json({ message: `Broadcast sent to ${sent} users`, sent });
  } catch (err) {
    next(err);
  }
});

export default router;
