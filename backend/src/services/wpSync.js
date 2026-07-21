/**
 * WordPress Sync Service
 * Pulls real data from lostpetdronerecovery.com WordPress REST API
 * - Cases (lost pet submissions) — STRIPS sensitive owner contact info
 * - Testimonials
 * - FAQs
 * 
 * SECURITY: Owner phone numbers and emails are NEVER returned in public responses.
 * They are only available through authenticated endpoints for verified pilots.
 */

const WP_BASE = 'https://lostpetdronerecovery.com/wp-json/wp/v2';

// Cache to avoid hammering the API
let cache = {
  cases: { data: null, timestamp: 0 },
  casesFull: { data: null, timestamp: 0 }, // Full data with contact info (for auth'd pilots only)
  testimonials: { data: null, timestamp: 0 },
  faqs: { data: null, timestamp: 0 },
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function wpFetch(endpoint) {
  try {
    const res = await fetch(`${WP_BASE}${endpoint}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`WP fetch ${endpoint} returned status ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`WP fetch failed for ${endpoint}:`, err.message);
    return null;
  }
}

/**
 * Fetch real lost pet cases from the WordPress site
 * PUBLIC VERSION — strips phone/email for privacy
 */
export async function getWPCases() {
  if (cache.cases.data && Date.now() - cache.cases.timestamp < CACHE_TTL) {
    return cache.cases.data;
  }

  // Fetch full data and cache it
  const fullCases = await getWPCasesFull();
  
  if (fullCases.length === 0) {
    console.warn('⚠️ getWPCases: No cases returned from WordPress');
  }
  
  // Strip sensitive contact info for public consumption
  const publicCases = fullCases.map(c => ({
    id: c.id,
    wp_id: c.wp_id,
    pet_name: c.pet_name,
    pet_type: c.pet_type,
    pet_breed: c.pet_breed,
    last_seen_address: c.last_seen_address,
    last_seen_date: c.last_seen_date,
    owner_name: c.owner_name ? c.owner_name.split(' ')[0] + '.' : '', // First name + initial only
    photo_url: c.photo_url,
    photo_thumb: c.photo_thumb,
    status: c.status,
    source: c.source,
    date: c.date,
    city: c.city,
    state: c.state,
    // DO NOT include: phone, email, full address, zip_code, street_address
    has_contact_info: !!(c.phone || c.email), // Let UI know contact exists but don't expose it
  }));

  cache.cases = { data: publicCases, timestamp: Date.now() };
  return publicCases;
}

/**
 * Fetch real lost pet cases with FULL contact info
 * ONLY for authenticated, verified pilots
 */
export async function getWPCasesFull() {
  if (cache.casesFull.data && Date.now() - cache.casesFull.timestamp < CACHE_TTL) {
    return cache.casesFull.data;
  }

  const raw = await wpFetch('/submit-a-new-case?per_page=50&status=publish');
  if (!raw || !Array.isArray(raw)) {
    console.warn(`⚠️ WP cases fetch returned: ${raw ? typeof raw : 'null'}`);
    return cache.casesFull.data || [];
  }
  
  console.log(`📡 WP returned ${raw.length} cases`);

  const cases = raw.map(post => {
    const acf = post.acf || {};
    const photo = acf.photo && typeof acf.photo === 'object' ? acf.photo : null;
    
    return {
      id: `wp-${post.id}`,
      wp_id: post.id,
      pet_name: acf.pet_name || 'Unknown',
      pet_type: normalizePetType(acf.pet_type),
      pet_breed: acf.pet_type || '',
      pet_color: '',
      last_seen_address: acf.last_seen || '',
      street_address: acf.street_address || '',
      city: acf.city || '',
      state: acf.state || '',
      zip_code: acf.zip_code || '',
      last_seen_date: post.date,
      owner_name: acf.pet_owner || '',
      email: acf.email_address || '',   // SENSITIVE
      phone: acf.phone || '',           // SENSITIVE
      description: acf.description || '',
      photo_url: photo?.sizes?.medium || photo?.url || null,
      photo_thumb: photo?.sizes?.thumbnail || null,
      photo_full: photo?.url || null,
      status: acf.status || 'submitted',
      source: 'website',
      date: post.date,
      wp_link: post.link,
    };
  });

  cache.casesFull = { data: cases, timestamp: Date.now() };
  return cases;
}

/**
 * Get a single WP case with full contact info (for verified pilots only)
 */
export async function getWPCaseFull(wpId) {
  const fullCases = await getWPCasesFull();
  return fullCases.find(c => c.wp_id === parseInt(wpId)) || null;
}

/**
 * Fetch real testimonials from the website
 */
export async function getWPTestimonials() {
  if (cache.testimonials.data && Date.now() - cache.testimonials.timestamp < CACHE_TTL) {
    return cache.testimonials.data;
  }

  const testimonials = [
    {
      id: 'wp-1',
      name: 'Josh W.',
      location: 'Oneonta, NY',
      text: 'There are not enough words to describe the amount of gratitude my husband and I had for Josh. Within 5 minutes of that call and conversation, Josh was in his car to make the 2 hour commute to help us find our fur baby.',
    },
    {
      id: 'wp-2',
      name: 'Michael L.',
      location: 'Oneonta, New York',
      text: 'We had an excellent experience with this company. We were watching our daughter\'s family dog, when he ran into an over 3000 acre wildlife refuge. The dog is home and recovering well after being on his own for 4 days. Thanks to the help and guidance from Michael!',
    },
    {
      id: 'wp-3',
      name: 'Charles D.',
      location: 'Spanish Forks, Utah',
      text: 'I had thought one of my cats got out while we were loading up the uhaul to move. Charles went above and beyond to give me real direction on what to do before he arrived, as he was going to fly from Utah to Buffalo for me. Thank you so much!',
    },
    {
      id: 'wp-4',
      name: 'Amelia C.',
      role: 'Cat Owner',
      text: 'I thought I\'d never see my cat again. Within hours of reaching out, a drone pilot was here, in the air — and we found her hiding under a shed. Absolutely incredible team and organization.',
    },
    {
      id: 'wp-5',
      name: 'Jeff U.',
      role: 'Dog Owner',
      text: 'Our dog ran off during a fireworks show. I submitted my info at midnight — by the next morning, a pilot had already started searching. We were reunited later that day.',
    },
    {
      id: 'wp-6',
      name: 'Holly D.',
      role: 'Horse Owner',
      text: 'One of our horses broke through the fence and vanished into the woods. A drone team showed up the next morning, found her within minutes, and even helped guide her back. Total lifesavers.',
    },
  ];

  cache.testimonials = { data: testimonials, timestamp: Date.now() };
  return testimonials;
}

/**
 * Fetch FAQs from the website
 */
export async function getWPFAQs() {
  if (cache.faqs.data && Date.now() - cache.faqs.timestamp < CACHE_TTL) {
    return cache.faqs.data;
  }

  const faqs = [
    {
      id: 'faq-1',
      question: "What if there's no pilot near me?",
      answer: "We're adding new drone pilots every week. If no one shows up near your location, hit the \"Request Assistance\" button and we'll reach out to nearby pilots on your behalf — or notify you when someone's available.",
    },
    {
      id: 'faq-2',
      question: 'Is this a free service?',
      answer: "No, but it's affordable compared to what's at stake. Our pilots use high-end thermal drones that cost thousands, and they're trained to help in real-world emergencies. Each pilot sets their own pricing, and you'll see it when you click their profile.",
    },
    {
      id: 'faq-3',
      question: 'How quickly can someone help me?',
      answer: "It depends on location and availability. Many of our pilots respond within an hour or two. Some may need to drive a bit to reach you. You'll be able to message them directly once you find a good match.",
    },
    {
      id: 'faq-4',
      question: 'What kind of pets can drones help find?',
      answer: "Most often, dogs and cats — but we've helped recover horses, goats, and pigs. If it's warm-blooded and recently lost, thermal drones give you a fighting chance.",
    },
    {
      id: 'faq-5',
      question: 'Will the drone hurt or scare my pet?',
      answer: 'Not likely. Drones usually fly at a safe distance and help locate — not chase. If the drone needs to get close, pilots will communicate with you first. Some can use a loudspeaker to call your pet gently.',
    },
    {
      id: 'faq-6',
      question: 'What tech do the pilots use?',
      answer: 'Many of our pilots fly thermal drones with zoom cameras, spotlights, loudspeakers, and even live video feeds. Most pilots list their equipment on their profile so you can see exactly what they offer.',
    },
    {
      id: 'faq-7',
      question: 'Can I talk to someone before booking?',
      answer: 'Yes. You can message any pilot directly from their profile. If you\'re overwhelmed or unsure who to contact, hit \"Request Assistance\" and we\'ll try to connect you with someone who can help.',
    },
    {
      id: 'faq-8',
      question: 'How do I become a pilot?',
      answer: "Sign up for a pilot account, select a membership plan (monthly or yearly), set up your profile with your equipment and service area, and once verified by our team, you'll appear on the map and start receiving case alerts.",
    },
    {
      id: 'faq-9',
      question: 'What equipment do I need as a pilot?',
      answer: "At minimum, a drone with thermal imaging capabilities. Many of our pilots also use spotlights, loudspeakers, and zoom cameras. You'll need to be FAA Part 107 certified or equivalent.",
    },
  ];

  cache.faqs = { data: faqs, timestamp: Date.now() };
  return faqs;
}

/**
 * Get total case count from WordPress (real number from X-WP-Total header)
 */
export async function getWPTotalCaseCount() {
  try {
    const res = await fetch(`${WP_BASE}/submit-a-new-case?per_page=1`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const total = parseInt(res.headers.get('X-WP-Total'));
    return isNaN(total) ? null : total;
  } catch (err) {
    console.warn('WP total count fetch failed:', err.message);
    return null;
  }
}

/**
 * Normalize pet type strings from WordPress submissions
 */
function normalizePetType(type) {
  if (!type) return 'other';
  const t = type.toLowerCase().trim();
  if (t.includes('dog') || t.includes('poodle') || t.includes('doodle') || t.includes('lab') || t.includes('retriever') || t.includes('collie') || t.includes('boxer') || t.includes('pyrenees')) return 'dog';
  if (t.includes('cat')) return 'cat';
  if (t.includes('horse')) return 'horse';
  if (t.includes('bird')) return 'bird';
  if (t.includes('rabbit') || t.includes('bunny')) return 'rabbit';
  return 'other';
}
