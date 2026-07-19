import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, authenticate } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.js';
import { AppError } from '../middleware/errorHandler.js';
import storage from '../services/storage.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/mailService.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, role, agreeToTerms, faaCertNumber, insuranceProvider, insurancePolicyNumber } = req.validatedBody;

    // Require ToS agreement
    if (!agreeToTerms) {
      throw new AppError('You must agree to the Terms of Service and Privacy Policy', 400);
    }

    // Check if user exists
    const existing = await storage.findUserByEmail(email);
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    // Create user
    const user = await storage.createUser({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
    });

    // If pilot, create pilot profile with verification info
    if (role === 'drone_pilot') {
      await storage.createPilotProfile(user.id, {
        baseLat: 0,
        baseLng: 0,
        serviceRadius: 25,
        faaCertNumber: faaCertNumber || null,
        insuranceProvider: insuranceProvider || null,
        insurancePolicyNumber: insurancePolicyNumber || null,
      });
    }

    // Send verification email
    if (user._verificationToken) {
      try {
        await sendVerificationEmail(email, firstName, user._verificationToken);
      } catch (err) {
        console.warn('Failed to send verification email:', err.message);
      }
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        emailVerified: user.email_verified,
      },
      message: user.email_verified
        ? undefined
        : 'Account created! Please check your email to verify your address.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await storage.findUserByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
      },
      emailWarning: !user.email_verified ? 'Your email is not verified. Some features may be limited.' : undefined,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = req.user;
  const { password, ...safeUser } = user;
  
  let profile = null;
  if (user.role === 'drone_pilot') {
    const fullProfile = await storage.getPilotProfile(user.id);
    profile = fullProfile?.profile || null;
  }

  res.json({
    user: {
      ...safeUser,
      profile,
      emailVerified: user.email_verified,
    },
  });
});

// POST /api/auth/verify-email — Verify email with token
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new AppError('Verification token is required', 400);
    }

    const user = await storage.verifyEmail(token);
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    const authToken = generateToken(user.id, user.role);

    res.json({
      token: authToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        emailVerified: true,
      },
      message: 'Email verified successfully!',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-verification — Resend verification email
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await storage.findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If that email exists, a verification link has been sent.' });
    }

    if (user.email_verified) {
      return res.json({ message: 'Email is already verified.' });
    }

    // Generate new verification token
    const token = uuidv4();
    await storage.updateUser(user.id, {
      email_verification_token: token,
      email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendVerificationEmail(email, user.first_name, token);

    res.json({ message: 'If that email exists, a verification link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password — Request password reset
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await storage.setPasswordResetToken(email);
    if (user) {
      try {
        await sendPasswordResetEmail(email, user.first_name, user._resetToken);
      } catch (err) {
        console.warn('Failed to send password reset email:', err.message);
      }
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password — Reset password with token
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      throw new AppError('Token and new password are required', 400);
    }
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const user = await storage.resetPassword(token, password);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const authToken = generateToken(user.id, user.role);

    res.json({
      token: authToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        emailVerified: user.email_verified,
      },
      message: 'Password reset successfully!',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/change-password — Change password (authenticated)
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }
    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    const validPassword = await bcrypt.compare(currentPassword, req.user.password);
    if (!validPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await storage.updateUser(req.userId, { password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
