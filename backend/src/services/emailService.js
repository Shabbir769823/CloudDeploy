import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT || '2525'),
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    }
  });
};

/**
 * Sends an email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Subject line
 * @param {string} html - HTML content
 * @returns {Promise<boolean>}
 */
export const sendEmail = async (to, subject, html) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // If credentials are not configured, log to console as fallback
  if (!user || !pass || user === 'your_smtp_user') {
    console.log('\n--- [EMAIL NOTIFICATION SIMULATION] ---');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html.replace(/<[^>]*>/g, '')}`); // strip HTML for console view
    console.log('---------------------------------------\n');
    return true;
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@clouddeploy.com',
      to,
      subject,
      html
    });
    console.log(`Email notification successfully sent to: ${to}`);
    return true;
  } catch (err) {
    console.error('Failed to send email notification:', err.message);
    // Return true anyway because we don't want notifications to fail deployments
    return false;
  }
};

/**
 * Sends a deployment success email
 */
export const sendDeploymentSuccessEmail = (email, userName, projectName, version, ip, port) => {
  const subject = `🚀 CloudDeploy Success: ${projectName} is Live!`;
  const url = `http://${ip || 'localhost'}:${port}`;
  const html = `
    <h2>Hello ${userName},</h2>
    <p>Great news! Your project <strong>${projectName}</strong> (Version ${version}) has been deployed successfully.</p>
    <p>The container is active and accessible via the following address:</p>
    <p><a href="${url}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">View Application</a></p>
    <p>Or copy & paste: <code>${url}</code></p>
    <br/>
    <p>Best regards,<br/>The CloudDeploy Team</p>
  `;
  return sendEmail(email, subject, html);
};

/**
 * Sends a deployment failure email
 */
export const sendDeploymentFailureEmail = (email, userName, projectName, errorMessage) => {
  const subject = `⚠️ CloudDeploy Failed: Build issue with ${projectName}`;
  const html = `
    <h2>Hello ${userName},</h2>
    <p>We encountered an issue while building or deploying your project: <strong>${projectName}</strong>.</p>
    <p><strong>Error Message:</strong></p>
    <pre style="background: #f4f4f4; padding: 15px; border-left: 5px solid #f44336; font-family: monospace;">${errorMessage}</pre>
    <p>Please check the project details logs in your CloudDeploy dashboard to resolve the issues and trigger a redeployment.</p>
    <br/>
    <p>Best regards,<br/>The CloudDeploy Team</p>
  `;
  return sendEmail(email, subject, html);
};
