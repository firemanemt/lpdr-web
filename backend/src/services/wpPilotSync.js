/**
 * WordPress Pilot Sync Service
 * Pulls real pilot data from the LPDR website's Google Map plugin
 * Geocodes addresses and maintains a pilot directory
 */

const WP_BASE = 'https://lostpetdronerecovery.com';
const MAP_PAGE_URL = `${WP_BASE}/find-a-drone-pilot/`;

// Cache
let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes — pilots don't change often

/**
 * Fetch real pilot data from the WP Google Map Plugin
 * The "Find a Drone Pilot" page embeds base64-encoded map data
 */
export async function getWPPilots() {
  if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  try {
    const res = await fetch(MAP_PAGE_URL, {
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();

    // Extract base64-encoded map data from the page
    const match = html.match(/window\.wpgmp\.mapdata2\s*=\s*"([^"]+)"/);
    if (!match) {
      console.warn('WP pilot map data not found in page HTML');
      return cache.data || [];
    }

    // Decode base64
    const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
    const mapData = JSON.parse(decoded);
    const places = mapData.places || [];

    // Parse pilot data from places
    const pilots = places.map(place => {
      const loc = place.location || {};
      const content = place.content || '';
      
      // Extract email from content
      const emailMatch = content.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
      const email = emailMatch ? emailMatch[0] : '';
      
      // Clean up name - remove email addresses and titles
      let name = place.title || 'Unknown';
      if (name.includes('@')) {
        name = name.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      name = name.replace(/\s*[-–]\s*(Owner|Founder|Admin|LPDR).*$/i, '').trim();

      // Extract city/state from address
      const address = place.address || '';
      const cityStateMatch = address.match(/,\s*([A-Za-z\s]+),\s*([A-Z]{2})/);
      const city = cityStateMatch ? cityStateMatch[1].trim() : '';
      const state = cityStateMatch ? cityStateMatch[2] : '';

      return {
        id: `wp-pilot-${place.id}`,
        wp_map_id: place.id,
        name,
        email,
        address,
        city,
        state,
        lat: loc.latitude ? parseFloat(loc.latitude) : null,
        lng: loc.longitude ? parseFloat(loc.longitude) : null,
        source: 'website',
        updated_at: new Date().toISOString(),
      };
    });

    cache = { data: pilots, timestamp: Date.now() };
    console.log(`✅ Synced ${pilots.length} real pilots from website`);
    return pilots;
  } catch (err) {
    console.warn('WP pilot sync failed:', err.message);
    return cache.data || [];
  }
}
