/**
 * WordPress Case Alert Service
 * Polls the WP REST API for new cases and sends push notifications to pilots
 * Runs on a 2-minute interval, tracking the last-seen WP case ID
 */

import pool from '../config/database.js';
import { sendPushToRole } from './pushService.js';
import { sendEmail } from './mailService.js';
import config from '../config/index.js';

const WP_API_BASE = 'https://lostpetdronerecovery.com/wp-json/wp/v2/submit-a-new-case';
const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes
let lastSeenId = null;
let isRunning = false;

/**
 * Fetch latest cases from WordPress
 */
async function fetchLatestWPCases() {
  try {
    const url = `${WP_API_BASE}?per_page=5&orderby=date&order=desc&_embed`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return [];

    const cases = await response.json();
    return cases;
  } catch (err) {
    console.warn('⚠️ WP case poll failed:', err.message);
    return [];
  }
}

/**
 * Initialize — find the highest existing WP case ID so we don't alert on old cases
 */
async function initializeLastSeenId() {
  try {
    const cases = await fetchLatestWPCases();
    if (cases.length > 0) {
      lastSeenId = cases[0].id;
      console.log(`📡 WP case monitor initialized. Last seen ID: ${lastSeenId}`);
    }
  } catch {
    lastSeenId = null;
  }
}

/**
 * Check for new WP cases and alert pilots
 */
async function checkForNewCases() {
  if (!lastSeenId) {
    // First run — just set the baseline, don't alert
    await initializeLastSeenId();
    return;
  }

  const cases = await fetchLatestWPCases();
  if (cases.length === 0) return;

  const newCases = cases.filter(c => c.id > lastSeenId);
  if (newCases.length === 0) return;

  // Update last seen ID
  lastSeenId = Math.max(...newCases.map(c => c.id));

  // Alert for each new case
  for (const wpCase of newCases) {
    const acf = wpCase.acf || {};
    const petName = acf.pet_name || 'Unknown Pet';
    const petType = acf.pet_type || 'Unknown';
    const address = `${acf.street_address || ''}${acf.city ? ', ' + acf.city : ''}${acf.state ? ', ' + acf.state : ''}`;
    const urgency = acf.status || 'medium';

    console.log(`📡 New WP case detected: ${petName} (ID: ${wpCase.id})`);

    // Push notification to all drone pilots
    try {
      await sendPushToRole('drone_pilot', {
        title: `🐾 New Lost Pet: ${petName}`,
        body: `${petType} — ${address || 'see details'}`,
        tag: 'wp-new-case',
        data: { url: '/pilot/dashboard', type: 'new_case_wp' },
        requireInteraction: true,
      });
    } catch (err) {
      console.warn('  → Push failed:', err.message);
    }

    // Also try to email nearby verified pilots
    try {
      const pilotsResult = await pool.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, pp.base_lat, pp.base_lng, pp.available
         FROM users u JOIN pilot_profiles pp ON u.id = pp.id
         WHERE pp.available = TRUE AND pp.verified = TRUE`
      );

      for (const pilot of pilotsResult.rows) {
        try {
          await sendEmail(
            pilot.email,
            `🐾 New Lost Pet Case: ${petName} in ${address || 'your area'}`,
            `<div style="font-family: 'Cabin Condensed', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c1220; color: #f1f5f9; padding: 2rem; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 1.5rem;">
                <h1 style="font-family: 'Black Ops One', cursive; color: #fa9118; font-size: 1.3rem; margin: 0;">🚨 NEW CASE ALERT</h1>
                <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.25rem;">From LostPetDroneRecovery.com</p>
              </div>
              <h2 style="font-size: 1.1rem; margin-bottom: 0.75rem;">Hey ${pilot.first_name},</h2>
              <p style="color: #94a3b8; line-height: 1.6;">A new lost pet case has been reported on the website:</p>
              <div style="background: #1a2332; border: 1px solid #2d3f57; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                <div style="font-size: 1.1rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.4rem;">${petName}</div>
                <div style="color: #94a3b8; font-size: 0.85rem;">${petType}</div>
                <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.3rem;">📍 ${address || 'Address not provided'}</div>
              </div>
              <p style="color: #94a3b8; line-height: 1.6;">Log into the LPDR app to view details.</p>
              <a href="${config.appUrl}/pilot/dashboard" style="display: block; text-align: center; background: #fa9118; color: #0c1220; padding: 0.75rem; border-radius: 8px; font-weight: 700; text-decoration: none; margin: 1rem 0;">View Cases →</a>
              <hr style="border: none; border-top: 1px solid #1e2d4a; margin: 1.5rem 0;" />
              <p style="color: #64748b; font-size: 0.75rem; text-align: center;">Lost Pet Drone Recovery · lostpetdronerecovery.com</p>
            </div>`
          );
        } catch {}
      }
    } catch (err) {
      console.warn('  → Email to pilots failed:', err.message);
    }
  }
}

/**
 * Start the polling service
 */
export function startWPCaseMonitor() {
  if (isRunning) return;
  isRunning = true;

  console.log('📡 Starting WP case monitor (polling every 2 min)');

  // Initialize baseline first
  initializeLastSeenId().then(() => {
    // Start polling
    setInterval(checkForNewCases, POLL_INTERVAL);
    // Also check immediately after init
    setTimeout(checkForNewCases, 10000);
  });
}

export default { startWPCaseMonitor };
