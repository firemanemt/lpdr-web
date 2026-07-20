import { z } from 'zod';

// Register validation
export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  role: z.enum(['pet_owner', 'drone_pilot', 'admin']),
  agreeToTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the Terms of Service' }) }),
  // Pilot verification fields (optional at registration)
  faaCertNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
});

// Login validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// Case creation validation
export const createCaseSchema = z.object({
  petName: z.string().min(1, 'Pet name is required'),
  petType: z.enum(['dog', 'cat', 'horse', 'bird', 'rabbit', 'reptile', 'other']),
  petBreed: z.string().optional(),
  petColor: z.string().optional(),
  petWeight: z.number().positive().optional(),
  microchip: z.string().optional(),
  distinctiveMarks: z.string().optional(),
  lastSeenAddress: z.string().min(1, 'Last seen address is required'),
  lastSeenLat: z.number().min(-90).max(90),
  lastSeenLng: z.number().min(-180).max(180),
  lastSeenDate: z.string().datetime(),
  searchRadius: z.number().min(1).max(100).default(5),
  circumstances: z.string().optional(),
  temperament: z.enum(['friendly', 'skittish', 'aggressive', 'unknown']).optional(),
  dangerNotes: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  photos: z.array(z.string()).optional(), // Base64 data URLs
});

// Pilot profile validation
export const pilotProfileSchema = z.object({
  bio: z.string().optional(),
  baseLat: z.number().min(-90).max(90),
  baseLng: z.number().min(-180).max(180),
  serviceRadius: z.number().min(1).max(500).default(25),
  equipment: z.array(z.object({
    droneModel: z.string().optional(),
    hasThermal: z.boolean().default(false),
    hasSpotlight: z.boolean().default(false),
    hasSpeaker: z.boolean().default(false),
    cameraType: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  pricing: z.array(z.object({
    priceType: z.enum(['fixed', 'hourly', 'free_form', 'negotiable']),
    amount: z.number().positive().optional(),
    description: z.string().optional(),
  })).optional(),
});

// Pilot verification submission
export const pilotVerificationSchema = z.object({
  faaCertNumber: z.string().min(1, 'FAA certificate number is required'),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
});

// Admin verification review
export const adminReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

// Validate middleware
export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.validatedBody = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}
