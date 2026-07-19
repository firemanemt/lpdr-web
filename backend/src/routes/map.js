import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import storage from '../services/storage.js';

const router = Router();

// GET /api/map/pilots — Get all pilot locations (GeoJSON format)
router.get('/pilots', optionalAuth, async (req, res, next) => {
  try {
    const locations = await storage.getAllPilotLocations();
    
    // Return as GeoJSON for map rendering
    const geojson = {
      type: 'FeatureCollection',
      features: locations.map(loc => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(loc.lng), parseFloat(loc.lat)],
        },
        properties: {
          id: loc.pilot_id,
          name: loc.pilot_name,
          available: loc.available,
          verified: loc.verified,
          rating: loc.average_rating,
          updatedAt: loc.updated_at,
        },
      })),
    };

    res.json(geojson);
  } catch (err) {
    next(err);
  }
});

// GET /api/map/cases — Get public case locations (for map display)
router.get('/cases', optionalAuth, async (req, res, next) => {
  try {
    // Only show cases that are active (not cancelled/completed/reviewed)
    const activeCases = storage.cases.filter(c => 
      !['cancelled', 'completed', 'reviewed'].includes(c.status)
    );

    const geojson = {
      type: 'FeatureCollection',
      features: activeCases.map(c => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(c.last_seen_lng), parseFloat(c.last_seen_lat)],
        },
        properties: {
          id: c.id,
          petName: c.pet_name,
          petType: c.pet_type,
          status: c.status,
          urgency: c.urgency,
          createdAt: c.created_at,
        },
      })),
    };

    res.json(geojson);
  } catch (err) {
    next(err);
  }
});

export default router;
