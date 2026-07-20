/**
 * Notification Service
 * Sends email notifications for key events
 * Push notifications via web push (future: service worker + Push API)
 */

import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from './mailService.js';

/**
 * Notification types and their handlers
 */
const NOTIFICATION_TYPES = {
  // Pilot notifications
  NEW_CASE_NEARBY: 'new_case_nearby',
  CASE_ACCEPTED: 'case_accepted',
  CASE_STATUS_CHANGED: 'case_status_changed',
  NEW_MESSAGE: 'new_message',
  VERIFICATION_STATUS: 'verification_status',
  
  // Owner notifications
  PILOT_ASSIGNED: 'pilot_assigned',
  SEARCH_STARTED: 'search_started',
  PET_FOUND: 'pet_found',
};

/**
 * Send a notification to a user
 * Currently: email only (web push coming in Phase 3)
 */
export async function notify(userId, type, data) {
  console.log(`📢 Notification: ${type} for user ${userId}`);
  
  switch (type) {
    case NOTIFICATION_TYPES.VERIFICATION_STATUS:
      if (data.status === 'approved') {
        await sendVerificationApprovedEmail(data.email, data.firstName);
      } else if (data.status === 'rejected') {
        await sendVerificationRejectedEmail(data.email, data.firstName, data.notes);
      }
      break;
    
    // These just log for now — email templates can be added later
    case NOTIFICATION_TYPES.NEW_CASE_NEARBY:
      console.log(`  → Pilot ${userId}: New case nearby - ${data.petName} in ${data.address}`);
      break;
    
    case NOTIFICATION_TYPES.PILOT_ASSIGNED:
      console.log(`  → Owner ${userId}: Pilot ${data.pilotName} assigned to your case`);
      break;
    
    case NOTIFICATION_TYPES.SEARCH_STARTED:
      console.log(`  → Owner ${userId}: Search has started for ${data.petName}`);
      break;
    
    case NOTIFICATION_TYPES.PET_FOUND:
      console.log(`  → Owner ${userId}: ${data.petName} has been found!`);
      break;
    
    case NOTIFICATION_TYPES.NEW_MESSAGE:
      console.log(`  → User ${userId}: New message from ${data.senderName}`);
      break;
    
    case NOTIFICATION_TYPES.CASE_STATUS_CHANGED:
      console.log(`  → User ${userId}: Case status changed to ${data.status}`);
      break;
    
    default:
      console.log(`  → Unknown notification type: ${type}`);
  }
  
  // Store notification in database for in-app notification center (future)
  // For now, we just log and send emails where applicable
}

/**
 * Notify nearby pilots about a new case
 * Called when a new case is submitted
 */
export async function notifyNearbyPilots(caseData, nearbyPilots) {
  for (const pilot of nearbyPilots) {
    await notify(pilot.id, NOTIFICATION_TYPES.NEW_CASE_NEARBY, {
      petName: caseData.pet_name,
      petType: caseData.pet_type,
      address: caseData.last_seen_address,
      urgency: caseData.urgency,
    });
  }
}

/**
 * Notify pet owner that a pilot has been assigned
 */
export async function notifyOwnerPilotAssigned(ownerId, pilotName, petName) {
  await notify(ownerId, NOTIFICATION_TYPES.PILOT_ASSIGNED, {
    pilotName,
    petName,
  });
}

/**
 * Notify owner that search has started
 */
export async function notifyOwnerSearchStarted(ownerId, petName) {
  await notify(ownerId, NOTIFICATION_TYPES.SEARCH_STARTED, {
    petName,
  });
}

/**
 * Notify owner that pet was found
 */
export async function notifyOwnerPetFound(ownerId, petName) {
  await notify(ownerId, NOTIFICATION_TYPES.PET_FOUND, {
    petName,
  });
}

export default { notify, notifyNearbyPilots, notifyOwnerPilotAssigned, notifyOwnerSearchStarted, notifyOwnerPetFound };
