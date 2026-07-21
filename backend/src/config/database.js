import pg from 'pg';
import config from './index.js';

const pool = new pg.Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Initialize database schema
export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Enable UUID extension first
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await client.query(`

      -- Users (mirrored from WordPress with extras)
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        wp_id INTEGER UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL CHECK (role IN ('pet_owner', 'drone_pilot', 'admin')),
        avatar_url TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        email_verification_expires TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Pilot Profiles
      CREATE TABLE IF NOT EXISTS pilot_profiles (
        id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        base_lat DECIMAL(10,7),
        base_lng DECIMAL(10,7),
        service_radius INTEGER DEFAULT 25,
        available BOOLEAN DEFAULT FALSE,
        verified BOOLEAN DEFAULT FALSE,
        faa_cert_number VARCHAR(100),
        insurance_provider VARCHAR(200),
        insurance_policy_number VARCHAR(100),
        verification_status VARCHAR(20) DEFAULT 'unsubmitted' CHECK (verification_status IN ('unsubmitted', 'pending', 'approved', 'rejected')),
        verification_submitted_at TIMESTAMP,
        verification_reviewed_at TIMESTAMP,
        verification_notes TEXT,
        membership_plan VARCHAR(20) CHECK (membership_plan IN ('monthly', 'yearly')),
        membership_status VARCHAR(20) DEFAULT 'inactive' CHECK (membership_status IN ('active', 'expired', 'cancelled', 'inactive')),
        membership_expires TIMESTAMP,
        average_rating DECIMAL(2,1) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        response_time INTEGER DEFAULT 0,
        cover_photo_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Pilot Equipment
      CREATE TABLE IF NOT EXISTS pilot_equipment (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        pilot_id UUID REFERENCES pilot_profiles(id) ON DELETE CASCADE,
        drone_model VARCHAR(200),
        has_thermal BOOLEAN DEFAULT FALSE,
        has_spotlight BOOLEAN DEFAULT FALSE,
        has_speaker BOOLEAN DEFAULT FALSE,
        camera_type VARCHAR(100),
        notes TEXT
      );

      -- Pilot Pricing
      CREATE TABLE IF NOT EXISTS pilot_pricing (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        pilot_id UUID REFERENCES pilot_profiles(id) ON DELETE CASCADE,
        price_type VARCHAR(20) CHECK (price_type IN ('fixed', 'hourly', 'free_form', 'negotiable')),
        amount DECIMAL(10,2),
        description TEXT
      );

      -- Lost Pet Cases
      CREATE TABLE IF NOT EXISTS cases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID REFERENCES users(id) NOT NULL,
        pilot_id UUID REFERENCES users(id),
        pet_name VARCHAR(100) NOT NULL,
        pet_type VARCHAR(20) NOT NULL CHECK (pet_type IN ('dog', 'cat', 'horse', 'bird', 'rabbit', 'reptile', 'other')),
        pet_breed VARCHAR(100),
        pet_color VARCHAR(100),
        pet_weight DECIMAL(5,1),
        microchip VARCHAR(50),
        distinctive_marks TEXT,
        last_seen_address TEXT,
        last_seen_lat DECIMAL(10,7),
        last_seen_lng DECIMAL(10,7),
        last_seen_date TIMESTAMP NOT NULL,
        search_radius INTEGER DEFAULT 5,
        circumstances TEXT,
        temperament VARCHAR(20) CHECK (temperament IN ('friendly', 'skittish', 'aggressive', 'unknown')),
        danger_notes TEXT,
        urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'notifying', 'matched', 'searching', 'found', 'completed', 'reviewed', 'cancelled', 'escalated')),
        found_at TIMESTAMP,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Case Photos
      CREATE TABLE IF NOT EXISTS case_photos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        uploaded_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Case Timeline
      CREATE TABLE IF NOT EXISTS case_timeline (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        description TEXT,
        actor_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Messages (Chat)
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id),
        text TEXT,
        image_url TEXT,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Reviews
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID REFERENCES cases(id) ON DELETE CASCADE UNIQUE,
        owner_id UUID REFERENCES users(id),
        pilot_id UUID REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Transactions
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        stripe_id VARCHAR(100) UNIQUE,
        from_user_id UUID REFERENCES users(id),
        to_user_id UUID REFERENCES users(id),
        case_id UUID REFERENCES cases(id),
        amount DECIMAL(10,2),
        platform_fee DECIMAL(10,2),
        status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
        type VARCHAR(20) CHECK (type IN ('membership', 'search_fee', 'payout')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Pilot Location History
      CREATE TABLE IF NOT EXISTS pilot_locations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        pilot_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        lat DECIMAL(10,7),
        lng DECIMAL(10,7),
        heading DECIMAL(5,2),
        speed DECIMAL(5,2),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Notification tokens
      CREATE TABLE IF NOT EXISTS notification_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        platform VARCHAR(10) CHECK (platform IN ('web', 'ios', 'android')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Push Subscriptions (Web Push)
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_cases_owner ON cases(owner_id);
      CREATE INDEX IF NOT EXISTS idx_cases_pilot ON cases(pilot_id);
      CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
      CREATE INDEX IF NOT EXISTS idx_pilot_locations ON pilot_locations(pilot_id);
      CREATE INDEX IF NOT EXISTS idx_messages_case ON messages(case_id);
      CREATE INDEX IF NOT EXISTS idx_case_timeline_case ON case_timeline(case_id);
      CREATE INDEX IF NOT EXISTS idx_users_wp ON users(wp_id);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_email_token ON users(email_verification_token);
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token);
      CREATE INDEX IF NOT EXISTS idx_pilot_verification ON pilot_profiles(verification_status);
    `);

    // Add new columns if they don't exist (for existing databases)
    const alterQueries = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP`,
      `ALTER TABLE pilot_profiles ADD COLUMN IF NOT EXISTS faa_cert_number VARCHAR(100)`,
      `ALTER TABLE pilot_profiles ADD COLUMN IF NOT EXISTS insurance_provider VARCHAR(200)`,
      `ALTER TABLE pilot_profiles ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(100)`,
      `ALTER TABLE pilot_profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unsubmitted'`,
      `ALTER TABLE pilot_profiles ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP`,
      `ALTER TABLE pilot_profiles ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMP`,
      `ALTER TABLE pilot_profiles ADD COLUMN IF NOT EXISTS verification_notes TEXT`,
    ];

    for (const q of alterQueries) {
      try {
        await client.query(q);
      } catch (err) {
        // Column already exists, ignore
        if (!err.message.includes('already exists')) throw err;
      }
    }

    console.log('✅ Database schema initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    // Don't throw — allow app to start for demo mode
  } finally {
    client.release();
  }
}

export default pool;
