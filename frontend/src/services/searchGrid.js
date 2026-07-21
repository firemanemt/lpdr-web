/**
 * Search Grid Generator
 * Creates systematic search patterns based on pet type, location, and conditions
 */

/**
 * Generate a search grid pattern
 * Returns an array of coordinate pairs for the pilot to fly
 */
export function generateSearchGrid(centerLat, centerLng, radiusMiles, pattern = 'spiral', legs = null) {
  const MILES_PER_DEG_LAT = 69;
  const MILES_PER_DEG_LNG = 69 * Math.cos(centerLat * Math.PI / 180);

  const radiusDegLat = radiusMiles / MILES_PER_DEG_LAT;
  const radiusDegLng = radiusMiles / MILES_PER_DEG_LNG;

  switch (pattern) {
    case 'spiral':
      return generateSpiralGrid(centerLat, centerLng, radiusDegLat, radiusDegLng);
    case 'lawnmower':
      return generateLawnmowerGrid(centerLat, centerLng, radiusDegLat, radiusDegLng, legs || 12);
    case 'expanding_box':
      return generateExpandingBoxGrid(centerLat, centerLng, radiusDegLat, radiusDegLng);
    case 'radial':
      return generateRadialGrid(centerLat, centerLng, radiusDegLat, radiusDegLng, legs || 8);
    default:
      return generateLawnmowerGrid(centerLat, centerLng, radiusDegLat, radiusDegLng, legs || 12);
  }
}

/**
 * Lawnmower pattern (parallel passes)
 * Most systematic — good for open areas
 */
function generateLawnmowerGrid(centerLat, centerLng, radiusLat, radiusLng, legs) {
  const points = [];
  const stepLat = (radiusLat * 2) / legs;
  
  for (let i = 0; i <= legs; i++) {
    const lat = centerLat - radiusLat + (stepLat * i);
    const isEven = i % 2 === 0;
    
    // Start point
    points.push({
      lat,
      lng: isEven ? centerLng - radiusLng : centerLng + radiusLng,
      type: 'waypoint',
    });
    
    // End point (same lat, opposite side)
    points.push({
      lat,
      lng: isEven ? centerLng + radiusLng : centerLng - radiusLng,
      type: 'waypoint',
    });
  }
  
  return {
    pattern: 'lawnmower',
    name: 'Lawnmower (Parallel Passes)',
    description: 'Systematic parallel passes. Best for open areas — fields, parks, neighborhoods.',
    points,
    bounds: {
      north: centerLat + radiusLat,
      south: centerLat - radiusLat,
      east: centerLng + radiusLng,
      west: centerLng - radiusLng,
    },
    estimatedFlightTime: Math.round(legs * 2 * 1.5), // rough minutes
  };
}

/**
 * Spiral pattern (outward from center)
 * Good for when the last seen location is precise
 */
function generateSpiralGrid(centerLat, centerLng, radiusLat, radiusLng) {
  const points = [];
  const turns = 6;
  const pointsPerTurn = 12;
  const totalPoints = turns * pointsPerTurn;
  
  for (let i = 0; i <= totalPoints; i++) {
    const angle = (i / pointsPerTurn) * 2 * Math.PI;
    const progress = i / totalPoints;
    const r = progress;
    
    points.push({
      lat: centerLat + radiusLat * r * Math.sin(angle),
      lng: centerLng + radiusLng * r * Math.cos(angle),
      type: 'waypoint',
    });
  }
  
  return {
    pattern: 'spiral',
    name: 'Spiral (Outward from Last Seen)',
    description: 'Spirals outward from the exact last seen point. Best when you have a precise escape location.',
    points,
    bounds: {
      north: centerLat + radiusLat,
      south: centerLat - radiusLat,
      east: centerLng + radiusLng,
      west: centerLng - radiusLng,
    },
    estimatedFlightTime: Math.round(totalPoints * 0.5),
  };
}

/**
 * Expanding box pattern
 * Concentric rectangles expanding from center
 */
function generateExpandingBoxGrid(centerLat, centerLng, radiusLat, radiusLng) {
  const points = [];
  const rings = 5;
  
  for (let ring = 1; ring <= rings; ring++) {
    const scale = ring / rings;
    const rLat = radiusLat * scale;
    const rLng = radiusLng * scale;
    
    // North edge (west to east)
    points.push({ lat: centerLat + rLat, lng: centerLng - rLng, type: 'waypoint' });
    points.push({ lat: centerLat + rLat, lng: centerLng + rLng, type: 'waypoint' });
    // East edge (north to south)
    points.push({ lat: centerLat - rLat, lng: centerLng + rLng, type: 'waypoint' });
    // South edge (east to west)
    points.push({ lat: centerLat - rLat, lng: centerLng - rLng, type: 'waypoint' });
    // West edge (south to north) back to start
    points.push({ lat: centerLat + rLat, lng: centerLng - rLng, type: 'waypoint' });
  }
  
  return {
    pattern: 'expanding_box',
    name: 'Expanding Box (Concentric Squares)',
    description: 'Concentric squares expanding outward. Good balance of coverage and center focus.',
    points,
    bounds: {
      north: centerLat + radiusLat,
      south: centerLat - radiusLat,
      east: centerLng + radiusLng,
      west: centerLng - radiusLng,
    },
    estimatedFlightTime: Math.round(rings * 8),
  };
}

/**
 * Radial pattern (spokes from center)
 * Good for quick initial assessment
 */
function generateRadialGrid(centerLat, centerLng, radiusLat, radiusLng, spokes) {
  const points = [];
  
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * 2 * Math.PI;
    
    // Go out
    points.push({
      lat: centerLat,
      lng: centerLng,
      type: 'waypoint',
    });
    points.push({
      lat: centerLat + radiusLat * Math.sin(angle),
      lng: centerLng + radiusLng * Math.cos(angle),
      type: 'waypoint',
    });
    // Come back (slightly offset for return pass)
    const offsetAngle = angle + Math.PI / spokes;
    points.push({
      lat: centerLat + radiusLat * 0.5 * Math.sin(offsetAngle),
      lng: centerLng + radiusLng * 0.5 * Math.cos(offsetAngle),
      type: 'waypoint',
    });
  }
  
  return {
    pattern: 'radial',
    name: 'Radial (Spokes from Center)',
    description: 'Spoke pattern from last seen point. Quick initial scan — good for assessing the area before a detailed grid.',
    points,
    bounds: {
      north: centerLat + radiusLat,
      south: centerLat - radiusLat,
      east: centerLng + radiusLng,
      west: centerLng - radiusLng,
    },
    estimatedFlightTime: Math.round(spokes * 3),
  };
}

/**
 * Get recommended pattern based on pet type and terrain
 */
export function getRecommendedPattern(petType, hoursMissing) {
  if (petType === 'cat' || petType === 'rabbit') {
    return { pattern: 'spiral', reason: 'Cats and rabbits stay close — spiral from last seen covers the high-probability zone first.' };
  }
  if (petType === 'bird') {
    return { pattern: 'radial', reason: 'Birds can be in any direction — quick radial scan finds them fast if they\'re in a nearby tree.' };
  }
  if (petType === 'horse') {
    return { pattern: 'lawnmower', reason: 'Horses are in open areas — systematic parallel passes cover large fields efficiently.' };
  }
  if (hoursMissing <= 6) {
    return { pattern: 'spiral', reason: 'Pet likely still close — start tight and expand.' };
  }
  return { pattern: 'lawnmower', reason: 'Lawnmower gives the most complete coverage for wider searches.' };
}

/**
 * Get all available patterns
 */
export function getAvailablePatterns() {
  return [
    { id: 'lawnmower', name: 'Lawnmower', icon: '⊥', desc: 'Parallel passes — best coverage' },
    { id: 'spiral', name: 'Spiral', icon: '🌀', desc: 'Outward from center — precise last seen' },
    { id: 'expanding_box', name: 'Expanding Box', icon: '⬜', desc: 'Concentric squares — balanced' },
    { id: 'radial', name: 'Radial', icon: '✳️', desc: 'Spoke pattern — quick initial scan' },
  ];
}
