import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

/**
 * In-memory storage for demo/development mode
 * Will be replaced by PostgreSQL in production
 */
class InMemoryStorage {
  constructor() {
    this.users = [];
    this.pilotProfiles = [];
    this.pilotEquipment = [];
    this.pilotPricing = [];
    this.cases = [];
    this.casePhotos = [];
    this.caseTimeline = [];
    this.messages = [];
    this.reviews = [];
    this.transactions = [];
    this.pilotLocations = [];
    this.notificationTokens = [];
    
    // Seed with demo data
    this.seed();
  }

  seed() {
    const now = new Date();
    
    // Demo Pet Owner
    const ownerId = uuidv4();
    this.users.push({
      id: ownerId,
      wp_id: null,
      email: 'owner@demo.com',
      first_name: 'Sarah',
      last_name: 'Johnson',
      phone: '555-0100',
      role: 'pet_owner',
      avatar_url: null,
      created_at: now,
      updated_at: now,
      password: bcrypt.hashSync('password123', 10),
    });

    // Demo Pilots
    const pilotIds = [];
    const pilotData = [
      { 
        email: 'pilot1@demo.com', first: 'Mike', last: 'Rivers', 
        lat: 42.4527, lng: -75.0636, radius: 30, city: 'Oneonta, NY',
        bio: 'FAA Part 107 certified pilot with 5+ years of search and rescue experience. Thermal drone specialist.',
        drone: 'DJI Mavic 3 Thermal', thermal: true, spotlight: true, speaker: true,
        price: 150, priceType: 'fixed'
      },
      { 
        email: 'pilot2@demo.com', first: 'Jessica', last: 'Chen', 
        lat: 40.7128, lng: -74.0060, radius: 50, city: 'New York, NY',
        bio: 'Experienced drone pilot and animal lover. I know how stressful losing a pet can be — let me help bring them home.',
        drone: 'Autel EVO II Dual 640T', thermal: true, spotlight: true, speaker: false,
        price: 200, priceType: 'fixed'
      },
      { 
        email: 'pilot3@demo.com', first: 'David', last: 'Martinez', 
        lat: 41.8781, lng: -87.6298, radius: 40, city: 'Chicago, IL',
        bio: 'Former firefighter turned drone pilot. Thermal imaging expert. Available weekends and evenings.',
        drone: 'DJI Matrice 30T', thermal: true, spotlight: true, speaker: true,
        price: 250, priceType: 'fixed'
      },
      { 
        email: 'pilot4@demo.com', first: 'Amanda', last: 'Lee', 
        lat: 34.0522, lng: -118.2437, radius: 35, city: 'Los Angeles, CA',
        bio: 'Animal rescue volunteer and certified drone pilot. I offer discounted rates for urgent cases.',
        drone: 'DJI Mavic 3 Classic + Thermal add-on', thermal: true, spotlight: false, speaker: false,
        price: 100, priceType: 'fixed'
      },
      { 
        email: 'pilot5@demo.com', first: 'Tom', last: 'Bradley', 
        lat: 29.7604, lng: -95.3698, radius: 45, city: 'Houston, TX',
        bio: 'Full-time drone search specialist. I have helped reunite over 50 families with their lost pets.',
        drone: 'Parrot Anafi Thermal', thermal: true, spotlight: true, speaker: true,
        price: 175, priceType: 'fixed'
      },
    ];

    pilotData.forEach((p, i) => {
      const pid = uuidv4();
      pilotIds.push(pid);
      
      this.users.push({
        id: pid,
        wp_id: null,
        email: p.email,
        first_name: p.first,
        last_name: p.last,
        phone: `555-0${100 + i}`,
        role: 'drone_pilot',
        avatar_url: null,
        created_at: now,
        updated_at: now,
        password: bcrypt.hashSync('password123', 10),
      });

      this.pilotProfiles.push({
        id: pid,
        bio: p.bio,
        base_lat: p.lat,
        base_lng: p.lng,
        service_radius: p.radius,
        available: true,
        verified: true,
        membership_plan: 'monthly',
        membership_status: 'active',
        membership_expires: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        average_rating: 0,
        total_reviews: 0,
        response_time: Math.floor(Math.random() * 15) + 2,
        cover_photo_url: null,
        created_at: now,
        updated_at: now,
      });

      // Equipment
      this.pilotEquipment.push({
        id: uuidv4(),
        pilot_id: pid,
        drone_model: p.drone,
        has_thermal: p.thermal,
        has_spotlight: p.spotlight,
        has_speaker: p.speaker,
        camera_type: 'Thermal + RGB',
        notes: null,
      });

      // Pricing
      this.pilotPricing.push({
        id: uuidv4(),
        pilot_id: pid,
        price_type: p.priceType,
        amount: p.price,
        description: 'Per search (up to 2 hours)',
      });

      // Add pilot to map
      this.pilotLocations.push({
        id: uuidv4(),
        pilot_id: pid,
        lat: p.lat,
        lng: p.lng,
        heading: 0,
        speed: 0,
        updated_at: now,
      });
    });

    // Demo Case
    const caseId = uuidv4();
    this.cases.push({
      id: caseId,
      owner_id: ownerId,
      pilot_id: pilotIds[0],
      pet_name: 'Buddy',
      pet_type: 'dog',
      pet_breed: 'Golden Retriever',
      pet_color: 'Golden',
      pet_weight: 75,
      microchip: '985112003456789',
      distinctive_marks: 'Red collar with tags',
      last_seen_address: '123 Main St, Oneonta, NY 13820',
      last_seen_lat: 42.4527,
      last_seen_lng: -75.0636,
      last_seen_date: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      search_radius: 10,
      circumstances: 'Buddy ran out the back door when the mailman came. He usually stays close but might have gotten spooked.',
      temperament: 'friendly',
      danger_notes: 'Busy road nearby, some coyotes in the area at night',
      urgency: 'high',
      status: 'searching',
      found_at: null,
      resolution_notes: null,
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      updated_at: now,
    });

    // Timeline
    this.caseTimeline.push(
      { id: uuidv4(), case_id: caseId, event_type: 'submitted', description: 'Case submitted by Sarah Johnson', actor_id: ownerId, created_at: new Date(now.getTime() - 120 * 60 * 1000) },
      { id: uuidv4(), case_id: caseId, event_type: 'notifying', description: 'Notifying nearby pilots...', actor_id: null, created_at: new Date(now.getTime() - 115 * 60 * 1000) },
      { id: uuidv4(), case_id: caseId, event_type: 'matched', description: 'Mike Rivers accepted the case', actor_id: pilotIds[0], created_at: new Date(now.getTime() - 100 * 60 * 1000) },
      { id: uuidv4(), case_id: caseId, event_type: 'searching', description: 'Mike Rivers has started the search', actor_id: pilotIds[0], created_at: new Date(now.getTime() - 60 * 60 * 1000) },
    );

    // Messages
    this.messages.push(
      { id: uuidv4(), case_id: caseId, sender_id: pilotIds[0], text: 'Hey Sarah! I\'m here at your location. Can you give me more details about where Buddy was last seen?', image_url: null, read: true, created_at: new Date(now.getTime() - 55 * 60 * 1000) },
      { id: uuidv4(), case_id: caseId, sender_id: ownerId, text: 'Hi Mike! He ran out the back door toward the woods behind the house. I saw him heading northeast.', image_url: null, read: true, created_at: new Date(now.getTime() - 54 * 60 * 1000) },
      { id: uuidv4(), case_id: caseId, sender_id: pilotIds[0], text: 'Got it! I\'m launching the drone now. I\'ll keep you updated as I search.', image_url: null, read: true, created_at: new Date(now.getTime() - 50 * 60 * 1000) },
      { id: uuidv4(), case_id: caseId, sender_id: pilotIds[0], text: 'I\'m picking up a heat signature near the creek about half a mile northeast. Heading there now!', image_url: null, read: false, created_at: new Date(now.getTime() - 10 * 60 * 1000) },
    );

    // Demo Reviews
    this.reviews.push(
      { id: uuidv4(), case_id: uuidv4(), owner_id: ownerId, pilot_id: pilotIds[0], rating: 5, comment: 'Mike found our cat within 30 minutes. Absolutely incredible service!', created_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
      { id: uuidv4(), case_id: uuidv4(), owner_id: uuidv4(), pilot_id: pilotIds[2], rating: 5, comment: 'David was so professional and caring. He found our dog in the woods before nightfall.', created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { id: uuidv4(), case_id: uuidv4(), owner_id: uuidv4(), pilot_id: pilotIds[3], rating: 4, comment: 'Amanda was very helpful. She searched for hours and eventually found our cat.', created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    );

    // Update pilot ratings based on reviews
    this.updatePilotRating(pilotIds[0], 5);
    this.updatePilotRating(pilotIds[2], 5);
    this.updatePilotRating(pilotIds[3], 4);

    console.log('✅ Demo data seeded');
  }

  updatePilotRating(pilotId, newRating) {
    const profile = this.pilotProfiles.find(p => p.id === pilotId);
    if (profile) {
      const total = profile.total_reviews * profile.average_rating + newRating;
      profile.total_reviews += 1;
      profile.average_rating = Math.round((total / profile.total_reviews) * 10) / 10;
    }
  }

  // === USER METHODS ===
  async findUserByEmail(email) {
    return this.users.find(u => u.email === email);
  }

  async findUserById(id) {
    return this.users.find(u => u.id === id);
  }

  async createUser(userData) {
    const user = {
      id: uuidv4(),
      wp_id: null,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone || null,
      role: userData.role,
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date(),
      password: bcrypt.hashSync(userData.password, 10),
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id, updates) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...updates, updated_at: new Date() };
    return this.users[idx];
  }

  // === PILOT METHODS ===
  async getPilotProfile(id) {
    const user = this.users.find(u => u.id === id && u.role === 'drone_pilot');
    if (!user) return null;
    const profile = this.pilotProfiles.find(p => p.id === id);
    const equipment = this.pilotEquipment.filter(e => e.pilot_id === id);
    const pricing = this.pilotPricing.filter(p => p.pilot_id === id);
    const reviews = this.reviews.filter(r => r.pilot_id === id);
    return { ...user, profile, equipment, pricing, reviews };
  }

  async getAvailablePilots(lat, lng, radius) {
    return this.pilotProfiles
      .filter(p => {
        const pilot = this.users.find(u => u.id === p.id);
        if (!p.available || !p.verified) return false;
        if (lat && lng && radius) {
          const dist = this.haversineDistance(lat, lng, parseFloat(p.base_lat), parseFloat(p.base_lng));
          return dist <= radius;
        }
        return true;
      })
      .map(p => {
        const user = this.users.find(u => u.id === p.id);
        const equipment = this.pilotEquipment.filter(e => e.pilot_id === p.id);
        const pricing = this.pilotPricing.filter(pr => pr.pilot_id === p.id);
        const loc = this.pilotLocations.find(l => l.pilot_id === p.id);
        return { ...user, profile: p, equipment, pricing, location: loc };
      });
  }

  async createPilotProfile(id, data) {
    const profile = {
      id,
      bio: data.bio || null,
      base_lat: data.baseLat,
      base_lng: data.baseLng,
      service_radius: data.serviceRadius || 25,
      available: false,
      verified: false,
      membership_plan: null,
      membership_status: 'inactive',
      membership_expires: null,
      average_rating: 0,
      total_reviews: 0,
      response_time: 0,
      cover_photo_url: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.pilotProfiles.push(profile);

    if (data.equipment) {
      data.equipment.forEach(eq => {
        this.pilotEquipment.push({
          id: uuidv4(),
          pilot_id: id,
          ...eq,
        });
      });
    }

    if (data.pricing) {
      data.pricing.forEach(pr => {
        this.pilotPricing.push({
          id: uuidv4(),
          pilot_id: id,
          price_type: pr.priceType,
          amount: pr.amount || null,
          description: pr.description || null,
        });
      });
    }

    return profile;
  }

  async updatePilotProfile(id, updates) {
    const idx = this.pilotProfiles.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.pilotProfiles[idx] = { ...this.pilotProfiles[idx], ...updates, updated_at: new Date() };
    return this.pilotProfiles[idx];
  }

  // === CASE METHODS ===
  async createCase(data) {
    const caseItem = {
      id: uuidv4(),
      owner_id: data.ownerId,
      pilot_id: null,
      pet_name: data.petName,
      pet_type: data.petType,
      pet_breed: data.petBreed || null,
      pet_color: data.petColor || null,
      pet_weight: data.petWeight || null,
      microchip: data.microchip || null,
      distinctive_marks: data.distinctiveMarks || null,
      last_seen_address: data.lastSeenAddress,
      last_seen_lat: data.lastSeenLat,
      last_seen_lng: data.lastSeenLng,
      last_seen_date: new Date(data.lastSeenDate),
      search_radius: data.searchRadius || 5,
      circumstances: data.circumstances || null,
      temperament: data.temperament || 'unknown',
      danger_notes: data.dangerNotes || null,
      urgency: data.urgency || 'medium',
      status: 'submitted',
      found_at: null,
      resolution_notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.cases.push(caseItem);

    // Add timeline entry
    this.caseTimeline.push({
      id: uuidv4(),
      case_id: caseItem.id,
      event_type: 'submitted',
      description: `Case submitted for ${data.petName}`,
      actor_id: data.ownerId,
      created_at: new Date(),
    });

    return caseItem;
  }

  async getCasesForUser(userId, role) {
    if (role === 'pet_owner') {
      return this.cases.filter(c => c.owner_id === userId);
    } else if (role === 'drone_pilot') {
      return this.cases.filter(c => c.pilot_id === userId);
    }
    return this.cases;
  }

  async getCaseById(caseId) {
    return this.cases.find(c => c.id === caseId);
  }

  async updateCase(caseId, updates) {
    const idx = this.cases.findIndex(c => c.id === caseId);
    if (idx === -1) return null;
    this.cases[idx] = { ...this.cases[idx], ...updates, updated_at: new Date() };
    return this.cases[idx];
  }

  async addTimelineEntry(caseId, eventType, description, actorId) {
    const entry = {
      id: uuidv4(),
      case_id: caseId,
      event_type: eventType,
      description,
      actor_id: actorId || null,
      created_at: new Date(),
    };
    this.caseTimeline.push(entry);
    return entry;
  }

  async getTimeline(caseId) {
    return this.caseTimeline.filter(t => t.case_id === caseId).sort((a, b) => a.created_at - b.created_at);
  }

  // === MESSAGES ===
  async getMessages(caseId) {
    return this.messages.filter(m => m.case_id === caseId).sort((a, b) => a.created_at - b.created_at);
  }

  async sendMessage(caseId, senderId, text, imageUrl) {
    const msg = {
      id: uuidv4(),
      case_id: caseId,
      sender_id: senderId,
      text: text || null,
      image_url: imageUrl || null,
      read: false,
      created_at: new Date(),
    };
    this.messages.push(msg);
    return msg;
  }

  async markMessagesRead(caseId, userId) {
    this.messages.forEach(m => {
      if (m.case_id === caseId && m.sender_id !== userId) {
        m.read = true;
      }
    });
  }

  // === REVIEWS ===
  async getReviewsForPilot(pilotId) {
    return this.reviews.filter(r => r.pilot_id === pilotId);
  }

  async createReview(data) {
    const review = {
      id: uuidv4(),
      case_id: data.caseId,
      owner_id: data.ownerId,
      pilot_id: data.pilotId,
      rating: data.rating,
      comment: data.comment || null,
      created_at: new Date(),
    };
    this.reviews.push(review);
    this.updatePilotRating(data.pilotId, data.rating);
    return review;
  }

  // === PILOT LOCATIONS ===
  async updatePilotLocation(pilotId, lat, lng, heading, speed) {
    const existing = this.pilotLocations.find(l => l.pilot_id === pilotId);
    if (existing) {
      existing.lat = lat;
      existing.lng = lng;
      existing.heading = heading || 0;
      existing.speed = speed || 0;
      existing.updated_at = new Date();
      return existing;
    }
    const loc = {
      id: uuidv4(),
      pilot_id: pilotId,
      lat,
      lng,
      heading: heading || 0,
      speed: speed || 0,
      updated_at: new Date(),
    };
    this.pilotLocations.push(loc);
    return loc;
  }

  async getAllPilotLocations() {
    return this.pilotLocations.map(loc => {
      const profile = this.pilotProfiles.find(p => p.id === loc.pilot_id);
      const user = this.users.find(u => u.id === loc.pilot_id);
      return {
        ...loc,
        pilot_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
        available: profile?.available || false,
        verified: profile?.verified || false,
        average_rating: profile?.average_rating || 0,
      };
    });
  }

  // === NOTIFICATIONS ===
  async registerToken(userId, token, platform) {
    const existing = this.notificationTokens.find(t => t.user_id === userId && t.token === token);
    if (!existing) {
      this.notificationTokens.push({
        id: uuidv4(),
        user_id: userId,
        token,
        platform,
        created_at: new Date(),
      });
    }
  }

  // === UTILITY ===
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

// Singleton
const storage = new InMemoryStorage();
export default storage;
