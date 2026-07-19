import { FiFileText, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>TERMS OF SERVICE</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Last updated: July 19, 2026</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.25rem 1rem', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <FiFileText size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem', color: 'var(--primary)' }} />
          By using LPDR, you agree to these terms. Read carefully.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>1. Acceptance of Terms</h2>
            <p>By accessing or using the Lost Pet Drone Recovery ("LPDR") platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the platform. LPDR reserves the right to modify these terms at any time, and your continued use constitutes acceptance of any modifications.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>2. Description of Service</h2>
            <p>LPDR is a platform that connects pet owners who have lost their pets with FAA-certified drone pilots who can assist in search and recovery operations using thermal imaging and other aerial technologies. LPDR is a connecting service and does not directly operate drones, conduct searches, or guarantee the recovery of any lost pet.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>3. User Accounts</h2>
            <p>You must provide accurate, complete, and current information when creating an account. You are responsible for safeguarding your account credentials and for all activities under your account. You must be at least 18 years old to create an account. LPDR reserves the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>4. Pet Owner Responsibilities</h2>
            <ul style={{ paddingLeft: '1.25rem', listStyle: 'disc' }}>
              <li>Provide accurate and truthful information about your lost pet, including last known location, description, and circumstances.</li>
              <li>Understand that drone searches may not result in finding your pet.</li>
              <li>Agree to pay the pilot's stated fee for services rendered.</li>
              <li>Do not misrepresent the urgency or nature of your situation.</li>
              <li>Communicate respectfully with pilots and other users.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>5. Drone Pilot Responsibilities</h2>
            <ul style={{ paddingLeft: '1.25rem', listStyle: 'disc' }}>
              <li>Hold a valid FAA Part 107 Remote Pilot Certificate or equivalent certification required by your jurisdiction.</li>
              <li>Maintain all required insurance coverage and comply with all applicable laws, regulations, and airspace restrictions.</li>
              <li>Only operate drones in a safe and lawful manner during search operations.</li>
              <li>Provide accurate information about your equipment, capabilities, and service area.</li>
              <li>Respond to accepted cases promptly and professionally.</li>
              <li>Do not guarantee results — set realistic expectations with pet owners.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>6. Pilot Verification</h2>
            <p>Pilots on LPDR may submit their FAA certification and insurance information for verification. LPDR makes reasonable efforts to verify pilot credentials but does not guarantee the accuracy, currency, or validity of any pilot's certification or insurance status. Pet owners should independently verify a pilot's qualifications before engaging their services.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>7. Membership and Fees</h2>
            <p>Drone pilots may subscribe to Pro or Elite membership plans for enhanced visibility and features. LPDR charges a platform fee per case as outlined in the membership agreement. Payment processing is handled through secure third-party services. All fees are non-refundable unless otherwise stated in writing.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>8. Assumption of Risk</h2>
            <p style={{ color: 'var(--danger)', fontWeight: 600 }}>IMPORTANT:</p>
            <ul style={{ paddingLeft: '1.25rem', listStyle: 'disc' }}>
              <li>Drone operations involve inherent risks, including but not limited to equipment failure, weather hazards, and airspace conflicts.</li>
              <li>Search operations may disturb wildlife, domestic animals, or property.</li>
              <li>LPDR does not guarantee that any lost pet will be found or recovered.</li>
              <li>Pet owners and pilots both assume all risks associated with search operations.</li>
              <li>Neither party should engage in any activity that creates a safety hazard.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>9. Limitation of Liability</h2>
            <p>LPDR is a connecting platform and is not liable for: (a) the actions, conduct, or negligence of any pilot or pet owner; (b) the outcome of any search operation; (c) any injury, loss, or damage to persons, animals, or property arising from the use of this platform; (d) any violation of law by a user. LPDR's total liability shall not exceed the fees paid by you to LPDR in the preceding 12 months.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>10. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless LPDR and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising from your use of the platform or violation of these terms.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>11. Privacy</h2>
            <p>Your use of LPDR is also governed by our <a href="/privacy" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Privacy Policy</a>. We collect and process personal data as described therein, including contact information, location data, and verification documents.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>12. Termination</h2>
            <p>LPDR may terminate or suspend your account at any time for violation of these terms, fraudulent activity, or conduct harmful to other users or the platform. You may deactivate your account at any time. Upon termination, the provisions of these terms that by their nature should survive will remain in effect.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>13. Governing Law</h2>
            <p>These terms shall be governed by the laws of the State of New York, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Otsego County, New York.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>14. Contact</h2>
            <p>For questions about these terms, contact us at:</p>
            <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px', marginTop: '0.5rem' }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Lost Pet Drone Recovery</p>
              <p>Email: support@lostpetdronerecovery.com</p>
              <p>Website: lostpetdronerecovery.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
