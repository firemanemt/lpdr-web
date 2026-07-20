/**
 * WordPress Pilot Sync Service
 * Pulls real pilot data from the LPDR website's Google Map plugin
 * The "Find a Drone Pilot" page embeds base64-encoded map data via WPGMP
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

    // Parse pilot data from places — the WPGMP data has rich extra_fields
    const pilots = places.map(place => {
      const loc = place.location || {};
      const content = place.content || '';
      const ef = loc.extra_fields || {};

      // Extract email from content (HTML) as fallback
      const emailMatch = content.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
      const email = ef.user_email || (emailMatch ? emailMatch[0] : '');

      // Use real name from extra_fields, fallback to title
      const firstName = ef.first_name || '';
      const lastName = ef.last_name || '';
      let name = '';
      if (firstName && lastName) {
        name = `${firstName} ${lastName}`;
      } else if (firstName) {
        name = firstName;
      } else {
        name = place.title || 'Unknown';
        // Clean up username-style names
        if (name.includes('@')) {
          name = name.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
      }

      // Business name
      const businessName = ef.user_registration_input_box_1754579014 || '';

      // Phone (only expose to verified pilots via separate endpoint)
      const phone = ef.user_registration_phone_1754579074 || '';

      // Drone info
      const droneModel = ef.user_registration_drone_in_service || '';

      // Capabilities
      const capabilities = ef.user_registration_capabilities || '';

      // Description
      const description = ef.user_registration_textarea_1754579364 || '';

      // FAA cert number (sensitive — only for admin)
      const certNumber = ef.user_registration_certificate_number || '';

      // Membership plan
      const userRole = ef.user_role || '';

      // Gravatar / profile image
      const markerImageHtml = loc.marker_image || '';
      const imgSrcMatch = markerImageHtml.match(/src=([^\s>]+)/);
      const profileImageUrl = imgSrcMatch ? imgSrcMatch[1] : '';

      // Map pin icon
      const mapIcon = loc.icon || '';

      // City/state from location object (more reliable than parsing address)
      const city = loc.city || '';
      const state = loc.state || '';
      const country = loc.country || '';

      return {
        id: `wp-pilot-${place.id}`,
        wp_map_id: place.id,
        name,
        firstName,
        lastName,
        businessName,
        email,
        phone,
        address: place.address || '',
        city,
        state,
        country,
        lat: loc.lat ? parseFloat(loc.lat) : null,
        lng: loc.lng ? parseFloat(loc.lng) : null,
        droneModel,
        capabilities,
        description,
        certNumber,
        userRole,
        profileImageUrl,
        mapIcon,
        source: 'website',
        updated_at: new Date().toISOString(),
      };
    });

    cache = { data: pilots, timestamp: Date.now() };
    console.log(`✅ Synced ${pilots.length} real pilots from website (${pilots.filter(p => p.lat && p.lng).length} with coordinates)`);
    return pilots;
  } catch (err) {
    console.warn('WP pilot sync failed:', err.message);
    return cache.data || [];
  }
}
