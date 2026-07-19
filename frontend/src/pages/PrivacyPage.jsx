import { FiShield, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>PRIVACY POLICY</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Last updated: July 19, 2026</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.25rem 1rem', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <FiShield size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem', color: 'var(--success)' }} />
          We take your privacy seriously. Your personal data is never sold to third parties.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>1. Information We Collect</h2>
            <p><strong>Account Information:</strong> Name, email address, phone number, and role (pet owner or drone pilot) when you register.</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Verification Documents:</strong> FAA Part 107 certificate number, insurance provider and policy number when pilots submit for verification.</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Location Data:</strong> Last known location of lost pets (address, coordinates) and pilot base locations for matching purposes.</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Case Data:</strong> Pet descriptions, photos, search details, and communication between pet owners and pilots.</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Usage Data:</strong> Device information, browser type, pages visited, and interaction patterns for analytics and platform improvement.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>2. How We Use Your Information</h2>
            <ul style={{ paddingLeft: '1.25rem', listStyle: 'disc' }}>
              <li>To connect pet owners with nearby drone pilots for search operations.</li>
              <li>To verify pilot credentials and maintain platform safety.</li>
              <li>To communicate with you about your cases, account, and platform updates.</li>
              <li>To process membership payments and platform fees.</li>
              <li>To improve our services through analytics and user feedback.</li>
              <li>To comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>3. How We Protect Your Data</h2>
            <ul style={{ paddingLeft: '1.25rem', listStyle: 'disc' }}>
              <li><strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and at rest in our database.</li>
              <li><strong>Access Controls:</strong> Owner contact information (phone, email, full address) is only visible to verified drone pilots assigned to a case.</li>
              <li><strong>Authentication:</strong> Passwords are hashed using bcrypt and never stored in plaintext.</li>
              <li><strong>Secure Storage:</strong> Data is stored in a PostgreSQL database hosted on Railway with enterprise-grade security.</li>
              <li><strong>Minimal Exposure:</strong> Public case listings do not include owner phone numbers or email addresses.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>4. Data Sharing</h2>
            <p>We do <strong>not</strong> sell, rent, or trade your personal information to third parties. We may share data:</p>
            <ul style={{ paddingLeft: '1.25rem', listStyle: 'disc', marginTop: '0.5rem' }}>
              <li><strong>Between Users:</strong> Pet owner contact info is shared with assigned, verified pilots for case coordination.</li>
              <li><strong>Service Providers:</strong> Payment processors (Stripe), email services, and hosting providers as needed to operate the platform.</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority.</li>
              <li><strong>Safety:</strong> To protect the safety of users, animals, or the public.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>5. Data Retention</h2>
            <p>We retain your account data as long as your account is active. Case data is retained for 3 years after case completion for record-keeping and dispute resolution. Verification documents are retained for the duration of a pilot's active membership plus 1 year. You may request deletion of your data at any time, subject to legal retention requirements.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>6. Your Rights</h2>
            <ul style={{ paddingLeft: '1.25rem', listStyle: 'disc' }}>
              <li><strong>Access:</strong> You can view and download your personal data at any time.</li>
              <li><strong>Correction:</strong> You can update your account information at any time.</li>
              <li><strong>Deletion:</strong> You can request deletion of your account and data by contacting support.</li>
              <li><strong>Opt-Out:</strong> You can opt out of non-essential communications.</li>
              <li><strong>Portability:</strong> You can request a copy of your data in a standard format.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>7. Cookies and Tracking</h2>
            <p>We use essential cookies for authentication and session management. We may use analytics tools to understand platform usage. We do not use tracking cookies for advertising purposes. You can control cookie settings in your browser.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>8. Children's Privacy</h2>
            <p>LPDR is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>9. Data Breach Notification</h2>
            <p>In the event of a data breach that may affect your personal information, we will notify affected users within 72 hours via email and take immediate steps to contain and remediate the breach.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes via email. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.5rem' }}>11. Contact</h2>
            <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Lost Pet Drone Recovery — Privacy</p>
              <p>Email: privacy@lostpetdronerecovery.com</p>
              <p>Website: lostpetdronerecovery.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
