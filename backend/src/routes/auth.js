import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, authenticate } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.js';
import { AppError } from '../middleware/errorHandler.js';
import storage from '../services/storage.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/mailService.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const WP_LOGIN_URL = 'https://lostpetdronerecovery.com/wp-login.php';
const WP_API_URL = 'https://lostpetdronerecovery.com/wp-json/wp/v2';

/**
 * Authenticate against WordPress using wp-login.php
 * Returns true if credentials are valid
 */
async function checkWPCredentials(email, password) {
  try {
    const res = await fetch(WP_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': 'wordpress_test_cookie=WP Cookie check',
      },
      body: new URLSearchParams({
        log: email,
        pwd: password,
        'wp-submit': 'Log In',
        redirect_to: '/wp-admin/',
        testcookie: '1',
      }),
      redirect: 'manual', // Don't follow redirects
      signal: AbortSignal.timeout(10000),
    });

    // On success: WP redirects to /wp-admin/ and sets wordpress_logged_in cookie
    // On failure: WP redirects to /sign-in/ (custom login page)
    const location = res.headers.get('location') || '';
    const setCookie = res.headers.get('set-cookie') || '';
    
    if (location.includes('/wp-admin') || setCookie.includes('wordpress_logged_in')) {
      return true;
    }
    return false;
  } catch (err) {
    console.warn('WP auth check failed:', err.message);
    return false;
  }
}

/**
 * Fetch WP user profile data (email, name, role, etc.)
 * Uses the authenticated session cookie from login
 */
async function getWPUserProfile(email, password) {
  try {
    // First, log in to get session cookies
    const loginRes = await fetch(WP_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': 'wordpress_test_cookie=WP Cookie check',
      },
      body: new URLSearchParams({
        log: email,
        pwd: password,
        'wp-submit': 'Log In',
        redirect_to: '/wp-admin/',
        testcookie: '1',
      }),
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });

    const cookies = loginRes.headers.get('set-cookie') || '';
    
    // Extract all cookies to pass to next request
    const cookieList = cookies.split(',').map(c => c.split(';')[0].trim()).filter(c => c).join('; ');

    if (!cookieList) return null;

    // Fetch user profile from WP REST API using session cookies
    const profileRes = await fetch(`${WP_API_URL}/users/me?context=edit`, {
      headers: {
        'Cookie': cookieList,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!profileRes.ok) {
      // Try getting user info from the pilot map data instead
      return { email };
    }

    const profile = await profileRes.json();
    return {
      email: profile.email || email,
      firstName: profile.first_name || profile.name?.split(' ')[0] || '',
      lastName: profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '',
      wpId: profile.id,
      role: profile.roles?.includes('drone_pilot') || profile.roles?.includes('basic_free_plan') ? 'drone_pilot' : 'pet_owner',
      wpRoles: profile.roles || [],
      description: profile.description || '',
    };
  } catch (err) {
    console.warn('WP profile fetch failed:', err.message);
    return { email };
  }
}

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

    // Send verification email in background — don't block the response
    if (user._verificationToken) {
      sendVerificationEmail(email, firstName, user._verificationToken).catch(err => {
        console.warn('Failed to send verification email:', err.message);
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

// POST /api/auth/login — tries WP first, then local DB
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    // 1. Check if user exists in local DB
    let user = await storage.findUserByEmail(email);

    if (user) {
      // User exists locally — verify password against local hash
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        // Local password doesn't match — try WP as fallback
        // (maybe they changed their WP password and want to use that)
        const wpValid = await checkWPCredentials(email, password);
        if (wpValid) {
          // Update local password to match WP
          const hashedPassword = bcrypt.hashSync(password, 10);
          await storage.updateUser(user.id, { password: hashedPassword });
        } else {
          throw new AppError('Invalid email or password', 401);
        }
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
      return;
    }

    // 2. User NOT in local DB — try WordPress authentication
    const wpValid = await checkWPCredentials(email, password);
    if (!wpValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // 3. WP auth succeeded! Auto-create app account
    const wpProfile = await getWPUserProfile(email, password);
    
    const firstName = wpProfile?.firstName || email.split('@')[0];
    const lastName = wpProfile?.lastName || '';
    const role = wpProfile?.role || 'drone_pilot'; // Default to pilot since WP users are pilots

    // Create the user in our DB
    user = await storage.createUser({
      email,
      password,
      firstName,
      lastName,
      phone: null,
      role,
    });

    // Mark email as verified since WP already verified it
    await storage.updateUser(user.id, { email_verified: true });

    // If pilot, create pilot profile
    if (role === 'drone_pilot') {
      await storage.createPilotProfile(user.id, {
        baseLat: 0,
        baseLng: 0,
        serviceRadius: 25,
        faaCertNumber: null,
        insuranceProvider: null,
        insurancePolicyNumber: null,
      });
    }

    const token = generateToken(user.id, user.role);

    console.log(`✅ WP user auto-provisioned: ${email} (${role})`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        emailVerified: true, // WP users are already verified
      },
      message: 'Welcome! Your account has been linked to your website profile.',
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
