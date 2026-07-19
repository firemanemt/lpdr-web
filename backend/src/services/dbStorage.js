import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

/**
 * PostgreSQL-backed storage for production mode
 * Falls back gracefully if DB is unavailable
 */
class DatabaseStorage {
  constructor() {
    this.pool = pool;
    console.log('📦 Database storage initialized (PostgreSQL)');
  }

  // ============================
  // USER METHODS
  // ============================

  async findUserByEmail(email) {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async findUserById(id) {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async createUser(userData) {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await this.pool.query(
      `INSERT INTO users (id, email, password, first_name, last_name, phone, role, email_verified, email_verification_token, email_verification_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, userData.email, hashedPassword, userData.firstName, userData.lastName, userData.phone || null, userData.role, false, verificationToken, verificationExpires]
    );

    const user = result.rows[0];
    user._verificationToken = verificationToken; // Expose for email sending
    return user;
  }

  async updateUser(id, updates) {
    const allowedFields = ['first_name', 'last_name', 'phone', 'avatar_url', 'email_verified', 'email_verification_token', 'email_verification_expires', 'password_reset_token', 'password_reset_expires'];
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return await this.findUserById(id);

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async verifyEmail(token) {
    const result = await this.pool.query(
      `UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL, updated_at = NOW()
       WHERE email_verification_token = $1 AND email_verification_expires > NOW()
       RETURNING *`,
      [token]
    );
    return result.rows[0] || null;
  }

  async findByVerificationToken(token) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()',
      [token]
    );
    return result.rows[0] || null;
  }

  async setPasswordResetToken(email) {
    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const result = await this.pool.query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
       WHERE email = $3
       RETURNING *`,
      [token, expires, email]
    );
    if (result.rows[0]) {
      result.rows[0]._resetToken = token;
    }
    return result.rows[0] || null;
  }

  async resetPassword(token, newPassword) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const result = await this.pool.query(
      `UPDATE users SET password = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW()
       WHERE password_reset_token = $2 AND password_reset_expires > NOW()
       RETURNING *`,
      [hashedPassword, token]
    );
    return result.rows[0] || null;
  }

  // ============================
  // PILOT METHODS
  // ============================

  async getPilotProfile(id) {
    const userResult = await this.pool.query('SELECT * FROM users WHERE id = $1 AND role = $2', [id, 'drone_pilot']);
    if (userResult.rows.length === 0) return null;
    const user = userResult.rows[0];

    const profileResult = await this.pool.query('SELECT * FROM pilot_profiles WHERE id = $1', [id]);
    const profile = profileResult.rows[0] || null;

    const equipmentResult = await this.pool.query('SELECT * FROM pilot_equipment WHERE pilot_id = $1', [id]);
    const equipment = equipmentResult.rows;

    const pricingResult = await this.pool.query('SELECT * FROM pilot_pricing WHERE pilot_id = $1', [id]);
    const pricing = pricingResult.rows;

    const reviewsResult = await this.pool.query('SELECT * FROM reviews WHERE pilot_id = $1', [id]);
    const reviews = reviewsResult.rows;

    return { ...user, profile, equipment, pricing, reviews };
  }

  async getAvailablePilots(lat, lng, radius) {
    let query = `
      SELECT u.*, pp.*,
        pe.id as eq_id, pe.drone_model, pe.has_thermal, pe.has_spotlight, pe.has_speaker, pe.camera_type, pe.notes as eq_notes,
        ppri.id as pr_id, ppri.price_type, ppri.amount, ppri.description as pr_desc,
        pl.lat as loc_lat, pl.lng as loc_lng, pl.heading as loc_heading, pl.speed as loc_speed, pl.updated_at as loc_updated
      FROM users u
      JOIN pilot_profiles pp ON u.id = pp.id
      LEFT JOIN pilot_equipment pe ON pp.id = pe.pilot_id
      LEFT JOIN pilot_pricing ppri ON pp.id = ppri.pilot_id
      LEFT JOIN pilot_locations pl ON pp.id = pl.pilot_id
      WHERE pp.available = TRUE AND pp.verified = TRUE
    `;

    const params = [];
    if (lat && lng && radius) {
      // Use Haversine formula for distance filtering
      query = `
        SELECT u.*, pp.*,
          pe.id as eq_id, pe.drone_model, pe.has_thermal, pe.has_spotlight, pe.has_speaker, pe.camera_type, pe.notes as eq_notes,
          ppri.id as pr_id, ppri.price_type, ppri.amount, ppri.description as pr_desc,
          pl.lat as loc_lat, pl.lng as loc_lng, pl.heading as loc_heading, pl.speed as loc_speed, pl.updated_at as loc_updated,
          (3959 * acos(cos(radians($1)) * cos(radians(pp.base_lat)) * cos(radians(pp.base_lng) - radians($2)) + sin(radians($1)) * sin(radians(pp.base_lat)))) AS distance
        FROM users u
        JOIN pilot_profiles pp ON u.id = pp.id
        LEFT JOIN pilot_equipment pe ON pp.id = pe.pilot_id
        LEFT JOIN pilot_pricing ppri ON pp.id = ppri.pilot_id
        LEFT JOIN pilot_locations pl ON pp.id = pl.pilot_id
        WHERE pp.available = TRUE AND pp.verified = TRUE
        HAVING (3959 * acos(cos(radians($1)) * cos(radians(pp.base_lat)) * cos(radians(pp.base_lng) - radians($2)) + sin(radians($1)) * sin(radians(pp.base_lat)))) <= $3
      `;
      params.push(lat, lng, radius);
    }

    // This is complex — let's use a simpler approach
    const simpleQuery = `
      SELECT u.*, pp.*
      FROM users u
      JOIN pilot_profiles pp ON u.id = pp.id
      WHERE pp.available = TRUE AND pp.verified = TRUE
    `;

    const pilotsResult = await this.pool.query(simpleQuery);
    const pilots = [];

    for (const row of pilotsResult.rows) {
      const user = { ...row };

      // Filter by distance if lat/lng/radius provided
      if (lat && lng && radius && row.base_lat && row.base_lng) {
        const dist = this.haversineDistance(lat, lng, parseFloat(row.base_lat), parseFloat(row.base_lng));
        if (dist > radius) continue;
      }

      // Get equipment
      const eqResult = await this.pool.query('SELECT * FROM pilot_equipment WHERE pilot_id = $1', [row.id]);
      // Get pricing
      const prResult = await this.pool.query('SELECT * FROM pilot_pricing WHERE pilot_id = $1', [row.id]);
      // Get location
      const locResult = await this.pool.query('SELECT * FROM pilot_locations WHERE pilot_id = $1', [row.id]);

      pilots.push({
        ...user,
        profile: {
          id: row.id,
          bio: row.bio,
          base_lat: row.base_lat,
          base_lng: row.base_lng,
          service_radius: row.service_radius,
          available: row.available,
          verified: row.verified,
          faa_cert_number: row.faa_cert_number,
          verification_status: row.verification_status,
          membership_plan: row.membership_plan,
          membership_status: row.membership_status,
          membership_expires: row.membership_expires,
          average_rating: row.average_rating,
          total_reviews: row.total_reviews,
          response_time: row.response_time,
          cover_photo_url: row.cover_photo_url,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        equipment: eqResult.rows,
        pricing: prResult.rows,
        location: locResult.rows[0] || null,
      });
    }

    return pilots;
  }

  async createPilotProfile(id, data) {
    const result = await this.pool.query(
      `INSERT INTO pilot_profiles (id, bio, base_lat, base_lng, service_radius, faa_cert_number, insurance_provider, insurance_policy_number, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, data.bio || null, data.baseLat, data.baseLng, data.serviceRadius || 25,
       data.faaCertNumber || null, data.insuranceProvider || null, data.insurancePolicyNumber || null,
       data.faaCertNumber ? 'pending' : 'unsubmitted']
    );

    if (data.equipment) {
      for (const eq of data.equipment) {
        await this.pool.query(
          `INSERT INTO pilot_equipment (id, pilot_id, drone_model, has_thermal, has_spotlight, has_speaker, camera_type, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [uuidv4(), id, eq.droneModel || eq.drone_model || null, eq.hasThermal || eq.has_thermal || false, eq.hasSpotlight || eq.has_spotlight || false, eq.hasSpeaker || eq.has_speaker || false, eq.cameraType || eq.camera_type || null, eq.notes || null]
        );
      }
    }

    if (data.pricing) {
      for (const pr of data.pricing) {
        await this.pool.query(
          `INSERT INTO pilot_pricing (id, pilot_id, price_type, amount, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), id, pr.priceType || pr.price_type, pr.amount || null, pr.description || null]
        );
      }
    }

    return result.rows[0];
  }

  async updatePilotProfile(id, updates) {
    const allowedFields = ['bio', 'base_lat', 'base_lng', 'service_radius', 'cover_photo_url', 'available', 'verified',
      'faa_cert_number', 'insurance_provider', 'insurance_policy_number', 'verification_status', 'verification_submitted_at', 'verification_reviewed_at', 'verification_notes',
      'membership_plan', 'membership_status', 'membership_expires', 'average_rating', 'total_reviews', 'response_time'];
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return null;

    setClauses.push('updated_at = NOW()');
    values.push(id);

    const result = await this.pool.query(
      `UPDATE pilot_profiles SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async submitPilotVerification(id, data) {
    return await this.updatePilotProfile(id, {
      faa_cert_number: data.faaCertNumber,
      insurance_provider: data.insuranceProvider,
      insurance_policy_number: data.insurancePolicyNumber,
      verification_status: 'pending',
      verification_submitted_at: new Date(),
    });
  }

  async getPendingVerifications() {
    const result = await this.pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.created_at,
              pp.faa_cert_number, pp.insurance_provider, pp.insurance_policy_number,
              pp.verification_status, pp.verification_submitted_at
       FROM users u
       JOIN pilot_profiles pp ON u.id = pp.id
       WHERE pp.verification_status = 'pending'
       ORDER BY pp.verification_submitted_at ASC`
    );
    return result.rows;
  }

  async reviewPilotVerification(id, status, notes) {
    return await this.updatePilotProfile(id, {
      verification_status: status, // 'approved' or 'rejected'
      verification_notes: notes || null,
      verification_reviewed_at: new Date(),
      verified: status === 'approved',
    });
  }

  // ============================
  // CASE METHODS
  // ============================

  async createCase(data) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO cases (id, owner_id, pet_name, pet_type, pet_breed, pet_color, pet_weight, microchip,
        distinctive_marks, last_seen_address, last_seen_lat, last_seen_lng, last_seen_date, search_radius,
        circumstances, temperament, danger_notes, urgency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [id, data.ownerId, data.petName, data.petType, data.petBreed || null, data.petColor || null,
       data.petWeight || null, data.microchip || null, data.distinctiveMarks || null,
       data.lastSeenAddress, data.lastSeenLat, data.lastSeenLng, data.lastSeenDate,
       data.searchRadius || 5, data.circumstances || null, data.temperament || 'unknown',
       data.dangerNotes || null, data.urgency || 'medium', 'submitted']
    );

    const caseItem = result.rows[0];

    // Add timeline entry
    await this.addTimelineEntry(caseItem.id, 'submitted', `Case submitted for ${data.petName}`, data.ownerId);

    return caseItem;
  }

  async getCasesForUser(userId, role) {
    if (role === 'pet_owner') {
      const result = await this.pool.query('SELECT * FROM cases WHERE owner_id = $1 ORDER BY created_at DESC', [userId]);
      return result.rows;
    } else if (role === 'drone_pilot') {
      const result = await this.pool.query('SELECT * FROM cases WHERE pilot_id = $1 ORDER BY created_at DESC', [userId]);
      return result.rows;
    }
    const result = await this.pool.query('SELECT * FROM cases ORDER BY created_at DESC');
    return result.rows;
  }

  async getCaseById(caseId) {
    const result = await this.pool.query('SELECT * FROM cases WHERE id = $1', [caseId]);
    return result.rows[0] || null;
  }

  async updateCase(caseId, updates) {
    const allowedFields = ['pilot_id', 'pet_name', 'pet_type', 'pet_breed', 'pet_color', 'pet_weight', 'microchip',
      'distinctive_marks', 'last_seen_address', 'last_seen_lat', 'last_seen_lng', 'last_seen_date', 'search_radius',
      'circumstances', 'temperament', 'danger_notes', 'urgency', 'status', 'found_at', 'resolution_notes'];
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return null;

    setClauses.push('updated_at = NOW()');
    values.push(caseId);

    const result = await this.pool.query(
      `UPDATE cases SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async addTimelineEntry(caseId, eventType, description, actorId) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO case_timeline (id, case_id, event_type, description, actor_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, caseId, eventType, description, actorId || null]
    );
    return result.rows[0];
  }

  async getTimeline(caseId) {
    const result = await this.pool.query(
      'SELECT * FROM case_timeline WHERE case_id = $1 ORDER BY created_at ASC',
      [caseId]
    );
    return result.rows;
  }

  // ============================
  // MESSAGES
  // ============================

  async getMessages(caseId) {
    const result = await this.pool.query(
      'SELECT * FROM messages WHERE case_id = $1 ORDER BY created_at ASC',
      [caseId]
    );
    return result.rows;
  }

  async sendMessage(caseId, senderId, text, imageUrl) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO messages (id, case_id, sender_id, text, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, caseId, senderId, text || null, imageUrl || null]
    );
    return result.rows[0];
  }

  async markMessagesRead(caseId, userId) {
    await this.pool.query(
      `UPDATE messages SET read = TRUE WHERE case_id = $1 AND sender_id != $2`,
      [caseId, userId]
    );
  }

  // ============================
  // REVIEWS
  // ============================

  async getReviewsForPilot(pilotId) {
    const result = await this.pool.query(
      'SELECT * FROM reviews WHERE pilot_id = $1 ORDER BY created_at DESC',
      [pilotId]
    );
    return result.rows;
  }

  async createReview(data) {
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO reviews (id, case_id, owner_id, pilot_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, data.caseId, data.ownerId, data.pilotId, data.rating, data.comment || null]
    );

    // Update pilot rating
    await this.updatePilotRating(data.pilotId, data.rating);

    return result.rows[0];
  }

  async updatePilotRating(pilotId, newRating) {
    const current = await this.pool.query(
      'SELECT average_rating, total_reviews FROM pilot_profiles WHERE id = $1',
      [pilotId]
    );
    if (current.rows.length === 0) return;

    const { average_rating, total_reviews } = current.rows[0];
    const total = total_reviews * average_rating + newRating;
    const newTotal = total_reviews + 1;
    const newAvg = Math.round((total / newTotal) * 10) / 10;

    await this.pool.query(
      'UPDATE pilot_profiles SET average_rating = $1, total_reviews = $2, updated_at = NOW() WHERE id = $3',
      [newAvg, newTotal, pilotId]
    );
  }

  // ============================
  // PILOT LOCATIONS
  // ============================

  async updatePilotLocation(pilotId, lat, lng, heading, speed) {
    // Upsert — if pilot has a location, update it; otherwise insert
    const existing = await this.pool.query(
      'SELECT id FROM pilot_locations WHERE pilot_id = $1', [pilotId]
    );

    if (existing.rows.length > 0) {
      const result = await this.pool.query(
        `UPDATE pilot_locations SET lat = $1, lng = $2, heading = $3, speed = $4, updated_at = NOW()
         WHERE pilot_id = $5 RETURNING *`,
        [lat, lng, heading || 0, speed || 0, pilotId]
      );
      return result.rows[0];
    }

    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO pilot_locations (id, pilot_id, lat, lng, heading, speed)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, pilotId, lat, lng, heading || 0, speed || 0]
    );
    return result.rows[0];
  }

  async getAllPilotLocations() {
    const result = await this.pool.query(
      `SELECT pl.*, u.first_name, u.last_name, pp.available, pp.verified, pp.average_rating
       FROM pilot_locations pl
       JOIN users u ON pl.pilot_id = u.id
       JOIN pilot_profiles pp ON pl.pilot_id = pp.id`
    );
    return result.rows.map(row => ({
      ...row,
      pilot_name: `${row.first_name} ${row.last_name}`,
    }));
  }

  // ============================
  // NOTIFICATIONS
  // ============================

  async registerToken(userId, token, platform) {
    // Check if token already exists for this user
    const existing = await this.pool.query(
      'SELECT id FROM notification_tokens WHERE user_id = $1 AND token = $2',
      [userId, token]
    );
    if (existing.rows.length === 0) {
      await this.pool.query(
        `INSERT INTO notification_tokens (id, user_id, token, platform)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), userId, token, platform]
      );
    }
  }

  // ============================
  // ADMIN METHODS
  // ============================

  async getAllUsers(role, limit = 50, offset = 0) {
    let query = 'SELECT id, email, first_name, last_name, phone, role, email_verified, created_at FROM users';
    const params = [];
    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
    }
    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getUserCount() {
    const result = await this.pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    const counts = {};
    result.rows.forEach(row => { counts[row.role] = parseInt(row.count); });
    return counts;
  }

  async getCaseCount() {
    const result = await this.pool.query('SELECT status, COUNT(*) as count FROM cases GROUP BY status');
    const counts = {};
    result.rows.forEach(row => { counts[row.status] = parseInt(row.count); });
    return counts;
  }

  async getAllCases(limit = 50, offset = 0) {
    const result = await this.pool.query(
      `SELECT c.*, u.first_name as owner_first, u.last_name as owner_last
       FROM cases c
       JOIN users u ON c.owner_id = u.id
       ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  // ============================
  // UTILITY
  // ============================

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export default DatabaseStorage;
