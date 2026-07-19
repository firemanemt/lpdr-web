import nodemailer from 'nodemailer';
import config from '../config/index.js';

/**
 * Email service for sending verification, password reset, and notification emails.
 * If SMTP is not configured, emails are logged to console (dev/demo mode).
 */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (config.smtp?.host && config.smtp?.user && config.smtp?.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port || 587,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    console.log('📧 SMTP configured — real emails enabled');
    return transporter;
  }

  // No SMTP — use ethereal email or just log
  console.log('📧 No SMTP configured — emails will be logged to console');
  return null;
}

export async function sendVerificationEmail(email, firstName, verificationToken) {
  const baseUrl = config.frontendUrl || config.railwayUrl || 'http://localhost:5173';
  const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

  const subject = 'LPDR — Verify Your Email Address';
  const html = `
    <div style="font-family: 'Cabin Condensed', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c1220; color: #f1f5f9; padding: 2rem; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <h1 style="font-family: 'Black Ops One', cursive; color: #046bd2; font-size: 1.5rem; margin: 0;">LPDR</h1>
        <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.25rem;">Lost Pet Drone Recovery</p>
      </div>
      <h2 style="font-size: 1.1rem; margin-bottom: 0.75rem;">Hey ${firstName},</h2>
      <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 1.25rem;">
        Welcome to LPDR! Please verify your email address to activate your account. This link expires in 24 hours.
      </p>
      <a href="${verifyUrl}" style="display: inline-block; background: #046bd2; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.95rem;">
        Verify Email Address
      </a>
      <p style="color: #64748b; font-size: 0.75rem; margin-top: 1.25rem;">
        If the button doesn't work, copy this link:<br>
        <span style="color: #94a3b8; word-break: break-all;">${verifyUrl}</span>
      </p>
    </div>
  `;

  return await sendEmail(email, subject, html);
}

export async function sendPasswordResetEmail(email, firstName, resetToken) {
  const baseUrl = config.frontendUrl || config.railwayUrl || 'http://localhost:5173';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const subject = 'LPDR — Reset Your Password';
  const html = `
    <div style="font-family: 'Cabin Condensed', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c1220; color: #f1f5f9; padding: 2rem; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <h1 style="font-family: 'Black Ops One', cursive; color: #046bd2; font-size: 1.5rem; margin: 0;">LPDR</h1>
        <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.25rem;">Lost Pet Drone Recovery</p>
      </div>
      <h2 style="font-size: 1.1rem; margin-bottom: 0.75rem;">Password Reset Request</h2>
      <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 1.25rem;">
        ${firstName}, we received a request to reset your password. Click below to set a new one. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display: inline-block; background: #fa9118; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.95rem;">
        Reset Password
      </a>
      <p style="color: #64748b; font-size: 0.75rem; margin-top: 1.25rem;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  return await sendEmail(email, subject, html);
}

export async function sendVerificationApprovedEmail(email, firstName) {
  const subject = 'LPDR — Pilot Verification Approved! 🎉';
  const html = `
    <div style="font-family: 'Cabin Condensed', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c1220; color: #f1f5f9; padding: 2rem; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <h1 style="font-family: 'Black Ops One', cursive; color: #10b981; font-size: 1.5rem; margin: 0;">VERIFIED ✓</h1>
      </div>
      <h2 style="font-size: 1.1rem; margin-bottom: 0.75rem;">${firstName}, you're approved!</h2>
      <p style="color: #94a3b8; line-height: 1.6;">
        Your pilot verification has been approved. You're now visible on the map and can receive case alerts. Go online and start helping reunite families with their pets!
      </p>
    </div>
  `;

  return await sendEmail(email, subject, html);
}

export async function sendVerificationRejectedEmail(email, firstName, notes) {
  const subject = 'LPDR — Pilot Verification Update';
  const html = `
    <div style="font-family: 'Cabin Condensed', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c1220; color: #f1f5f9; padding: 2rem; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <h1 style="font-family: 'Black Ops One', cursive; color: #ef4444; font-size: 1.5rem; margin: 0;">UPDATE</h1>
      </div>
      <h2 style="font-size: 1.1rem; margin-bottom: 0.75rem;">${firstName}, we need more info</h2>
      <p style="color: #94a3b8; line-height: 1.6;">
        Your pilot verification was not approved at this time. Here's why:
      </p>
      <div style="background: #1a2642; border-left: 3px solid #ef4444; padding: 0.75rem; margin: 1rem 0; border-radius: 0 8px 8px 0; color: #94a3b8; font-size: 0.9rem;">
        ${notes || 'No specific notes provided. Please contact support for details.'}
      </div>
      <p style="color: #94a3b8; line-height: 1.6;">
        You can resubmit your verification from your pilot dashboard with updated information.
      </p>
    </div>
  `;

  return await sendEmail(email, subject, html);
}

// Internal send function
async function sendEmail(to, subject, html) {
  const transport = getTransporter();

  if (transport) {
    try {
      const result = await transport.sendMail({
        from: `"LPDR" <${config.smtp.from || 'noreply@lostpetdronerecovery.com'}>`,
        to,
        subject,
        html,
      });
      console.log(`📧 Email sent to ${to}: ${subject}`);
      return result;
    } catch (err) {
      console.error(`📧 Failed to send email to ${to}:`, err.message);
      // Fall through to log
    }
  }

  // Log to console if no SMTP or send failed
  console.log(`\n📧 EMAIL (not sent — no SMTP or send failed)`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  // Extract the URL from the HTML
  const urlMatch = html.match(/href="([^"]+)"/);
  if (urlMatch) {
    console.log(`   Link: ${urlMatch[1]}`);
  }
  console.log('');
  return { messageId: 'logged', logged: true };
}
