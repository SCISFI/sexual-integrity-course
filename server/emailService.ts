// Gmail integration for password reset emails
// Uses Replit Gmail connector for authentication
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

function createEmailMessage(to: string, subject: string, htmlContent: string): string {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlContent
  ].join('\r\n');
  
  return Buffer.from(message).toString('base64url');
}

export async function sendPasswordResetEmail(email: string, resetLink: string, userName?: string): Promise<boolean> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello${userName ? ` ${userName}` : ''},</p>
      <p>We received a request to reset your password for your Sexual Integrity Curriculum account.</p>
      <p>Click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #4f46e5;">${resetLink}</p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
    <div class="footer">
      <p>Sexual Integrity Curriculum</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    const rawMessage = createEmailMessage(
      email,
      'Password Reset Request - Sexual Integrity Curriculum',
      htmlContent
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });

    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

export async function sendPasswordChangedConfirmation(email: string, userName?: string): Promise<boolean> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Changed Successfully</h1>
    </div>
    <div class="content">
      <p>Hello${userName ? ` ${userName}` : ''},</p>
      <p>Your password has been successfully changed.</p>
      <p>If you did not make this change, please contact your administrator immediately.</p>
    </div>
    <div class="footer">
      <p>Sexual Integrity Curriculum</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    const rawMessage = createEmailMessage(
      email,
      'Password Changed - Sexual Integrity Curriculum',
      htmlContent
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });

    console.log(`Password changed confirmation sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send password changed confirmation:', error);
    return false;
  }
}

export async function sendWeekCompletionNotification(
  therapistEmail: string, 
  therapistName: string | undefined,
  clientName: string, 
  weekNumber: number,
  dashboardLink: string
): Promise<boolean> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0891b2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .highlight { background-color: #ecfeff; border-left: 4px solid #0891b2; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Client Week Completed - Review Needed</h1>
    </div>
    <div class="content">
      <p>Hello${therapistName ? ` ${therapistName}` : ''},</p>
      <div class="highlight">
        <strong>${clientName}</strong> has completed <strong>Week ${weekNumber}</strong> and is awaiting your review.
      </div>
      <p>Please review their reflections, homework, and overall progress to help them continue their recovery journey.</p>
      <p style="text-align: center;">
        <a href="${dashboardLink}" class="button">Review Client Progress</a>
      </p>
      <p><strong>Remember:</strong> Timely feedback is important for client engagement and accountability.</p>
    </div>
    <div class="footer">
      <p>Sexual Integrity Curriculum</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    const rawMessage = createEmailMessage(
      therapistEmail,
      `Review Needed: ${clientName} completed Week ${weekNumber}`,
      htmlContent
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });

    console.log(`Week completion notification sent to ${therapistEmail} for ${clientName} Week ${weekNumber}`);
    return true;
  } catch (error) {
    console.error('Failed to send week completion notification:', error);
    return false;
  }
}
