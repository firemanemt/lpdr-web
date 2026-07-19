import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@lostpetdronerecovery.com',
  },
  
  wp: {
    apiUrl: process.env.WP_API_URL,
    jwtUrl: process.env.WP_JWT_URL,
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // Railway sets PORT automatically. Frontend is self-hosted in production.
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // In production, also allow requests from the Railway domain
  corsOrigin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
  // Railway public domain (set by Railway)
  railwayUrl: process.env.RAILWAY_PUBLIC_DOMAIN || '',
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

export default config;
