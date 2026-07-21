/**
 * Search Checklist for Drone Pilots
 * Step-by-step guide for pre-flight, in-flight, and post-flight procedures
 */

export const SEARCH_CHECKLIST = {
  preflight: {
    title: 'Pre-Flight',
    icon: '📋',
    items: [
      { id: 'weather', label: 'Check weather — wind <20mph, no rain/thunderstorms, visibility >3 miles', critical: true },
      { id: 'airspace', label: 'Verify airspace authorization (LAANC or waiver) for search area', critical: true },
      { id: 'battery', label: 'Charge all batteries — bring at least 2 spares', critical: true },
      { id: 'camera', label: 'Set thermal camera: high contrast palette (Iron or White Hot), gain boosted', critical: false },
      { id: 'microsd', label: 'Insert formatted SD card — enough space for 30+ min video', critical: false },
      { id: 'owner_contact', label: 'Get owner\'s phone number — coordinate in real time', critical: true },
      { id: 'pet_photo', label: 'Have a photo of the pet on your phone for visual ID', critical: false },
      { id: 'search_plan', label: 'Review search grid pattern and estimated flight time', critical: true },
      { id: 'notam', label: 'Check for active NOTAMs in search area', critical: true },
      { id: 'emergency', label: 'Confirm emergency landing zones in search area', critical: false },
    ],
  },
  inflight: {
    title: 'In-Flight Search',
    icon: '🔍',
    items: [
      { id: 'altitude', label: 'Start at 150ft AGL for thermal — lower for visual search (50-80ft)', critical: false },
      { id: 'speed', label: 'Fly 8-12 mph for thermal scanning, slower for visual (3-5 mph)', critical: false },
      { id: 'pattern', label: 'Follow grid pattern — systematic coverage, no random flying', critical: true },
      { id: 'thermal_sweep', label: 'First pass: thermal sweep of entire grid at 150ft', critical: true },
      { id: 'investigate', label: 'Investigate any heat signatures — descend to 50ft for closer look', critical: true },
      { id: 'record', label: 'Record video on all passes — review footage later for missed targets', critical: false },
      { id: 'battery_swap', label: 'Swap batteries at 25% — never fly below 20%', critical: true },
      { id: 'owner_comm', label: 'Report findings to owner every 15 minutes', critical: false },
      { id: 'wildlife', label: 'Watch for wildlife heat signatures — deer, raccoons can mimic pets', critical: false },
      { id: 'boundaries', label: 'Stay within search grid boundaries — avoid mission creep', critical: false },
    ],
  },
  postflight: {
    title: 'Post-Flight',
    icon: '✅',
    items: [
      { id: 'review_footage', label: 'Review all thermal footage for targets you may have missed', critical: true },
      { id: 'update_status', label: 'Update case status in the LPDR app', critical: true },
      { id: 'send_clips', label: 'Send any notable clips/screenshots to the owner', critical: false },
      { id: 'log_flights', label: 'Log flight time, battery usage, and area covered', critical: false },
      { id: 'plan_next', label: 'Plan next search window if pet not found — adjust grid based on findings', critical: true },
      { id: 'battery_charge', label: 'Charge batteries for next flight window', critical: false },
    ],
  },
};

/**
 * Get checklist section by key
 */
export function getChecklistSection(section) {
  return SEARCH_CHECKLIST[section] || null;
}

/**
 * Get all checklist items as flat array with section info
 */
export function getAllChecklistItems() {
  const items = [];
  for (const [key, section] of Object.entries(SEARCH_CHECKLIST)) {
    for (const item of section.items) {
      items.push({ ...item, section: key, sectionTitle: section.title });
    }
  }
  return items;
}
