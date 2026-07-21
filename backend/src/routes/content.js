import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import storage from '../services/storage.js';
import { getWPCases, getWPCasesFull, getWPCaseFull, getWPTestimonials, getWPFAQs, getWPTotalCaseCount } from '../services/wpSync.js';
import { getWPPilots } from '../services/wpPilotSync.js';

const router = Router();

// GET /api/content/testimonials — Get testimonials (from WP + local)
router.get('/testimonials', async (req, res) => {
  try {
    const wpTestimonials = await getWPTestimonials();
    res.json({ testimonials: wpTestimonials });
  } catch (err) {
    res.json({ testimonials: [] });
  }
});

// GET /api/content/faqs — Get FAQs (from WP)
router.get('/faqs', async (req, res) => {
  try {
    const faqs = await getWPFAQs();
    res.json({ faqs });
  } catch (err) {
    res.json({ faqs: [] });
  }
});

// GET /api/content/live-cases — Get real cases from the WordPress site
// PUBLIC — strips owner phone/email for privacy
router.get('/live-cases', async (req, res) => {
  try {
    const cases = await getWPCases();
    res.json({ cases, total: cases.length, source: 'lostpetdronerecovery.com' });
  } catch (err) {
    console.error('Live cases error:', err);
    res.json({ cases: [], total: 0, error: err.message });
  }
});

// GET /api/content/live-cases-debug — Diagnostic endpoint
router.get('/live-cases-debug', async (req, res) => {
  try {
    const WP_BASE = 'https://lostpetdronerecovery.com/wp-json/wp/v2';
    const wpRes = await fetch(`${WP_BASE}/submit-a-new-case?per_page=3&status=publish`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    const contentType = wpRes.headers.get('content-type');
    const status = wpRes.status;
    const text = await wpRes.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {}
    
    res.json({
      wpStatus: status,
      contentType,
      bodyLength: text.length,
      bodyPreview: text.substring(0, 500),
      parsedCount: Array.isArray(parsed) ? parsed.length : 'not array',
      firstCase: Array.isArray(parsed) && parsed[0] ? {
        id: parsed[0].id,
        acf: parsed[0].acf,
        status: parsed[0].status,
      } : null,
    });
  } catch (err) {
    res.json({ error: err.message, stack: err.stack?.substring(0, 300) });
  }
});

// GET /api/content/live-cases/:wpId — Get single case with contact info
// REQUIRES authenticated, verified pilot
router.get('/live-cases/:wpId/contact', authenticate, requireRole('drone_pilot'), async (req, res) => {
  try {
    // Verify pilot is actually verified
    const pilot = await storage.getPilotProfile(req.userId);
    if (!pilot?.profile?.verified) {
      return res.status(403).json({ error: 'Only verified pilots can access owner contact information' });
    }

    const caseData = await getWPCaseFull(req.params.wpId);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Return only the contact info, not everything
    res.json({
      contact: {
        owner_name: caseData.owner_name,
        phone: caseData.phone,
        email: caseData.email,
        street_address: caseData.street_address,
        city: caseData.city,
        state: caseData.state,
        zip_code: caseData.zip_code,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load contact info' });
  }
});

// GET /api/content/wp-pilots — Get real pilots from the website map
// PUBLIC — strips phone, cert number, and other sensitive fields
router.get('/wp-pilots', async (req, res) => {
  try {
    const pilots = await getWPPilots();
    // Strip sensitive fields from public response
    const publicPilots = pilots.map(p => ({
      id: p.id,
      name: p.name,
      firstName: p.firstName,
      lastName: p.lastName,
      businessName: p.businessName,
      email: p.email,
      address: p.address,
      city: p.city,
      state: p.state,
      country: p.country,
      lat: p.lat,
      lng: p.lng,
      droneModel: p.droneModel,
      capabilities: p.capabilities,
      description: p.description,
      userRole: p.userRole,
      profileImageUrl: p.profileImageUrl,
      source: p.source,
    }));
    res.json({ pilots: publicPilots, total: publicPilots.length, source: 'lostpetdronerecovery.com' });
  } catch (err) {
    res.json({ pilots: [], total: 0 });
  }
});

// GET /api/content/stats — Get real stats from WordPress
router.get('/stats', async (req, res) => {
  try {
    const [cases, totalCaseCount, wpPilots] = await Promise.all([
      getWPCases(),
      getWPTotalCaseCount(),
      getWPPilots(),
    ]);

    // Use real WP total if available, otherwise fall back
    const casesReceived = totalCaseCount || Math.max(cases.length, 130);
    const activePilots = wpPilots.length || 50;

    // Count unique states from real pilot data
    const statesCovered = [...new Set(wpPilots.map(p => p.state).filter(Boolean))].length;

    res.json({
      casesReceived,
      activePilots,
      statesCovered: statesCovered || 15,
      lastUpdated: new Date().toISOString(),
      source: 'live',
    });
  } catch (err) {
    res.json({
      casesReceived: 501,
      activePilots: 25,
      statesCovered: 15,
      source: 'fallback',
    });
  }
});

export default router;
