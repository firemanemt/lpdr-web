/**
 * Notification Service
 * Sends email + push notifications for key events
 */

import { sendEmail } from './mailService.js';
import { sendPushToUser, sendPushToRole } from './pushService.js';
import config from '../config/index.js';

const APP_URL = config.appUrl;

/**
 * Notification types
 */
const NOTIFICATION_TYPES = {
  NEW_CASE_NEARBY: 'new_case_nearby',
  CASE_ACCEPTED: 'case_accepted',
  CASE_STATUS_CHANGED: 'case_status_changed',
  NEW_MESSAGE: 'new_message',
  VERIFICATION_STATUS: 'verification_status',
  
  PILOT_ASSIGNED: 'pilot_assigned',
  SEARCH_STARTED: 'search_started',
  PET_FOUND: 'pet_found',
};

/**
 * Send a notification to a user via email + push
 */
export async function notify(userId, type, data) {
  console.log(`📢 Notification: ${type} for user ${userId}`);
  
  // Always send push notification (works when app is closed)
  const pushPromise = (async () => {
    try {
      switch (type) {
        case NOTIFICATION_TYPES.NEW_CASE_NEARBY:
          await sendPushToUser(userId, {
            title: '🐾 New Lost Pet Case',
            body: `${data.petName} — ${data.address || data.city || 'your area'}${data.urgency ? ` (${data.urgency} urgency)` : ''}`,
            tag: `case-new`,
            data: { url: '/pilot/dashboard', type: 'new_case' },
            requireInteraction: true,
          });
          break;
        case NOTIFICATION_TYPES.PILOT_ASSIGNED:
          await sendPushToUser(userId, {
            title: '✅ Pilot Assigned',
            body: `${data.pilotName} accepted your case for ${data.petName}`,
            tag: `case-assigned`,
            data: { url: '/owner/dashboard', type: 'pilot_assigned' },
          });
          break;
        case NOTIFICATION_TYPES.SEARCH_STARTED:
          await sendPushToUser(userId, {
            title: '🔍 Search Started',
            body: `The drone search for ${data.petName} is underway`,
            tag: `case-searching`,
            data: { url: '/owner/dashboard', type: 'search_started' },
          });
          break;
        case NOTIFICATION_TYPES.PET_FOUND:
          await sendPushToUser(userId, {
            title: '🎉 Pet Found!',
            body: `${data.petName} has been found!`,
            tag: `case-found`,
            data: { url: '/owner/dashboard', type: 'pet_found' },
            requireInteraction: true,
          });
          break;
      }
    } catch (err) {
      console.warn(`  → Push notification failed for user ${userId}:`, err.message);
    }
  })();

  // Also send email
  const emailPromise = (async () => {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_CASE_NEARBY:
        if (data.pilotEmail) {
          try {
            await sendEmail(
              data.pilotEmail,
              `🐾 New Lost Pet Case: ${data.petName} in ${data.city || data.address || 'your area'}`,
              `<div style="font-family: 'Cabin Condensed', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c1220; color: #f1f5f9; padding: 2rem; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                  <h1 style="font-family: 'Black Ops One', cursive; color: #fa9118; font-size: 1.3rem; margin: 0;">🚨 NEW CASE ALERT</h1>
                  <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.25rem;">Lost Pet Drone Recovery</p>
                </div>
                <h2 style="font-size: 1.1rem; margin-bottom: 0.75rem;">Hey ${data.pilotName || 'Pilot'},</h2>
                <p style="color: #94a3b8; line-height: 1.6;">A new lost pet case has been reported near your service area:</p>
                <div style="background: #1a2332; border: 1px solid #2d3f57; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                  <div style="font-size: 1.1rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.4rem;">${data.petName}</div>
                  <div style="color: #94a3b8; font-size: 0.85rem;">${data.petType || ''} ${data.petBreed ? '· ' + data.petBreed : ''}</div>
                  <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.3rem;">📍 ${data.address || ''}${data.city ? ', ' + data.city : ''}${data.state ? ', ' + data.state : ''}</div>
                  ${data.urgency ? `<div style="margin-top: 0.4rem;"><span style="background: ${data.urgency === 'critical' || data.urgency === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(250,145,24,0.15)'}; color: ${data.urgency === 'critical' || data.urgency === 'high' ? '#ef4444' : '#fa9118'}; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">${data.urgency} urgency</span></div>` : ''}
                </div>
                <p style="color: #94a3b8; line-height: 1.6;">Log into the LPDR app to accept this mission.</p>
                <a href="${APP_URL}/pilot/dashboard" style="display: block; text-align: center; background: #fa9118; color: #0c1220; padding: 0.75rem; border-radius: 8px; font-weight: 700; text-decoration: none; margin: 1rem 0;">View Case →</a>
                <hr style="border: none; border-top: 1px solid #1e2d4a; margin: 1.5rem 0;" />
                <p style="color: #64748b; font-size: 0.75rem; text-align: center;">Lost Pet Drone Recovery · lostpetdronerecovery.com</p>
              </div>`
            );
          } catch (err) {
            console.warn(`  → Failed to email pilot ${data.pilotEmail}:`, err.message);
          }
        }
        break;
      
      case NOTIFICATION_TYPES.PILOT_ASSIGNED:
        if (data.ownerEmail) {
          try {
            await sendEmail(
              data.ownerEmail,
              `✅ A Pilot Has Been Assigned to Your Case`,
              `<div style="font-family: 'Cabin Condensed', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c1220; color: #f1f5f9; padding: 2rem; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                  <h1 style="font-family: 'Black Ops One', cursive; color: #10b981; font-size: 1.3rem; margin: 0;">PILOT ASSIGNED</h1>
                </div>
                <h2 style="font-size: 1.05rem; margin-bottom: 0.75rem;">Great news!</h2>
                <p style="color: #94a3b8; line-height: 1.6;"><strong>${data.pilotName}</strong> has accepted your case for <strong>${data.petName}</strong>. They'll be in touch shortly.</p>
                <hr style="border: none; border-top: 1px solid #1e2d4a; margin: 1.5rem 0;" />
                <p style="color: #64748b; font-size: 0.75rem; text-align: center;">Lost Pet Drone Recovery · lostpetdronerecovery.com</p>
              </div>`
            );
          } catch (err) {
            console.warn(`  → Failed to email owner:`, err.message);
          }
        }
        break;
      
      case NOTIFICATION_TYPES.SEARCH_STARTED:
        if (data.ownerEmail) {
          try {
            await sendEmail(
              data.ownerEmail,
              `🔍 Search Started for ${data.petName}`,
              `<div style="font-family: 'Cabin Condensed', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c1220; color: #f1f5f9; padding: 2rem; border-radius: 12px;">
                <h1 style="font-family: 'Black Ops One', cursive; color: #8b5cf6; font-size: 1.3rem; margin: 0 0 1rem;">SEARCH IN PROGRESS</h1>
                <p style="color: #94a3b8; line-height: 1.6;">The drone search for <strong>${data.petName}</strong> has started. Stay tuned for updates.</p>
                <hr style="border: none; border-top: 1px solid #1e2d4a; margin: 1.5rem 0;" />
                <p style="color: #64748b; font-size: 0.75rem; text-align: center;">Lost Pet Drone Recovery · lostpetdronerecovery.com</p>
              </div>`
            );
          } catch (err) {
            console.warn(`  → Failed to email owner:`, err.message);
          }
        }
        break;
      
      case NOTIFICATION_TYPES.PET_FOUND:
        if (data.ownerEmail) {
          try {
            await sendEmail(
              data.ownerEmail,
              `🎉 ${data.petName} Has Been Found!`,
              `<div style="font-family: 'Cabin Condensed', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c1220; color: #f1f5f9; padding: 2rem; border-radius: 12px;">
                <h1 style="font-family: 'Black Ops One', cursive; color: #10b981; font-size: 1.5rem; margin: 0 0 1rem;">🐾 PET FOUND!</h1>
                <p style="color: #94a3b8; line-height: 1.6;">Great news — <strong>${data.petName}</strong> has been found!</p>
                <hr style="border: none; border-top: 1px solid #1e2d4a; margin: 1.5rem 0;" />
                <p style="color: #64748b; font-size: 0.75rem; text-align: center;">Lost Pet Drone Recovery · lostpetdronerecovery.com</p>
              </div>`
            );
          } catch (err) {
            console.warn(`  → Failed to email owner:`, err.message);
          }
        }
        break;
      
      default:
        console.log(`  → Notification type ${type} logged only`);
    }
  })();

  // Fire both in parallel
  await Promise.all([pushPromise, emailPromise]);
}

/**
 * Notify nearby pilots about a new case
 */
export async function notifyNearbyPilots(caseData, nearbyPilots) {
  for (const pilot of nearbyPilots) {
    await notify(pilot.id, NOTIFICATION_TYPES.NEW_CASE_NEARBY, {
      pilotName: pilot.first_name || pilot.firstName,
      pilotEmail: pilot.email,
      petName: caseData.pet_name,
      petType: caseData.pet_type,
      petBreed: caseData.pet_breed,
      address: caseData.last_seen_address,
      city: caseData.city,
      state: caseData.state,
      urgency: caseData.urgency,
    });
  }
}

/**
 * Notify pet owner that a pilot has been assigned
 */
export async function notifyOwnerPilotAssigned(ownerId, pilotName, petName, ownerEmail) {
  await notify(ownerId, NOTIFICATION_TYPES.PILOT_ASSIGNED, {
    pilotName,
    petName,
    ownerEmail,
  });
}

/**
 * Notify owner that search has started
 */
export async function notifyOwnerSearchStarted(ownerId, petName, ownerEmail) {
  await notify(ownerId, NOTIFICATION_TYPES.SEARCH_STARTED, {
    petName,
    ownerEmail,
  });
}

/**
 * Notify owner that pet was found
 */
export async function notifyOwnerPetFound(ownerId, petName, ownerEmail) {
  await notify(ownerId, NOTIFICATION_TYPES.PET_FOUND, {
    petName,
    ownerEmail,
  });
}

export default { notify, notifyNearbyPilots, notifyOwnerPilotAssigned, notifyOwnerSearchStarted, notifyOwnerPetFound };
