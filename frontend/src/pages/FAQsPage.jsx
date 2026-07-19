import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const faqs = [
  { q: 'What if there\'s no pilot near me?', a: 'We\'re adding new drone pilots every week. If no one shows up near your location, hit the "Request Assistance" button and we\'ll reach out to nearby pilots on your behalf — or notify you when someone\'s available.' },
  { q: 'Is this a free service?', a: 'No, but it\'s affordable compared to what\'s at stake. Our pilots use high-end thermal drones that cost thousands, and they\'re trained to help in real-world emergencies. Each pilot sets their own pricing, and you\'ll see it when you click their profile.' },
  { q: 'How quickly can someone help me?', a: 'It depends on location and availability. Many of our pilots respond within an hour or two. Some may need to drive a bit to reach you. You\'ll be able to message them directly once you find a good match.' },
  { q: 'What kind of pets can drones help find?', a: 'Most often, dogs and cats — but we\'ve helped recover horses, goats, and pigs. If it\'s warm-blooded and recently lost, thermal drones give you a fighting chance.' },
  { q: 'Will the drone hurt or scare my pet?', a: 'Not likely. Drones usually fly at a safe distance and help locate — not chase. If the drone needs to get close, pilots will communicate with you first. Some can use a loudspeaker to call your pet gently.' },
  { q: 'What tech do the pilots use?', a: 'Many of our pilots fly thermal drones with zoom cameras, spotlights, loudspeakers, and even live video feeds. Most pilots list their equipment on their profile so you can see exactly what they offer.' },
  { q: 'Can I talk to someone before booking?', a: 'Yes. You can message any pilot directly from their profile. If you\'re overwhelmed or unsure who to contact, hit "Request Assistance" and we\'ll try to connect you with someone who can help.' },
  { q: 'How do I become a pilot?', a: 'Sign up for a pilot account, select a membership plan (monthly or yearly), set up your profile with your equipment and service area, and once verified by our team, you\'ll appear on the map and start receiving case alerts.' },
  { q: 'What equipment do I need as a pilot?', a: 'At minimum, a drone with thermal imaging capabilities. Many of our pilots also use spotlights, loudspeakers, and zoom cameras. You\'ll need to be FAA Part 107 certified or equivalent.' },
];

export default function FAQsPage() {
  const [openId, setOpenId] = useState(null);

  return (
    <div>
      <section className="page-header">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <p>Everything you need to know about Lost Pet Drone Recovery</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqs.map((faq, i) => (
              <div key={i} className="card fade-in">
                <div
                  onClick={() => setOpenId(openId === i ? null : i)}
                  style={{
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '1rem', paddingRight: '2rem' }}>{faq.q}</div>
                  {openId === i ? <FiChevronUp size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} /> : <FiChevronDown size={20} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />}
                </div>
                {openId === i && (
                  <div style={{ padding: '0 1.5rem 1.25rem', color: 'var(--gray-600)', lineHeight: 1.7, borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '0.5rem' }}>Still have questions?</h3>
              <p style={{ color: 'var(--gray-500)', marginBottom: '1rem' }}>We're here to help. Reach out to our support team.</p>
              <a href="mailto:support@lostpetdronerecovery.com" className="btn btn-primary">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
