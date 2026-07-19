import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, authenticate } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.js';
import { AppError } from '../middleware/errorHandler.js';
import storage from '../services/storage.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.validatedBody;

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

    // If pilot, create empty pilot profile
    if (role === 'drone_pilot') {
      await storage.createPilotProfile(user.id, {
        baseLat: 0,
        baseLng: 0,
        serviceRadius: 25,
      });
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
      },
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
      },
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
    },
  });
});

export default router;
