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

function getEmailFooter(loginUrl?: string): string {
  const loginSection = loginUrl 
    ? `<p style="margin-top: 16px;"><a href="${loginUrl}" style="color: #4f46e5; text-decoration: underline;">Log in to your account</a></p>`
    : '';
  return `
    <div class="footer">
      <p>The Integrity Protocol</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">This program is an educational and personal growth resource. It is not therapy, counseling, or a substitute for professional mental health treatment.</p>
      ${loginSection}
      <p style="margin-top: 8px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  `;
}

export async function sendPasswordResetEmail(email: string, resetLink: string, userName?: string, loginUrl?: string): Promise<boolean> {
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
      <p>We received a request to reset your password for your Integrity Protocol account.</p>
      <p>Click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #4f46e5;">${resetLink}</p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
    ${getEmailFooter(loginUrl)}
  </div>
</body>
</html>
    `;

    const rawMessage = createEmailMessage(
      email,
      'Password Reset Request - The Integrity Protocol',
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

export async function sendPasswordChangedConfirmation(email: string, userName?: string, loginUrl?: string): Promise<boolean> {
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
    .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
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
      ${loginUrl ? `<p style="text-align: center;"><a href="${loginUrl}" class="button">Log In to Your Account</a></p>` : ''}
    </div>
    ${getEmailFooter(loginUrl)}
  </div>
</body>
</html>
    `;

    const rawMessage = createEmailMessage(
      email,
      'Password Changed - The Integrity Protocol',
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
  mentorEmail: string, 
  mentorName: string | undefined,
  clientName: string, 
  weekNumber: number,
  dashboardLink: string,
  loginUrl?: string
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
      <p>Hello${mentorName ? ` ${mentorName}` : ''},</p>
      <div class="highlight">
        <strong>${clientName}</strong> has completed <strong>Week ${weekNumber}</strong> and is awaiting your review.
      </div>
      <p>Please review their reflections, homework, and overall progress to help them continue their recovery journey.</p>
      <p style="text-align: center;">
        <a href="${dashboardLink}" class="button">Review Client Progress</a>
      </p>
      <p><strong>Remember:</strong> Timely feedback is important for client engagement and accountability.</p>
    </div>
    ${getEmailFooter(loginUrl || dashboardLink.split('/therapist')[0] + '/login')}
  </div>
</body>
</html>
    `;

    const rawMessage = createEmailMessage(
      mentorEmail,
      `Review Needed: ${clientName} completed Week ${weekNumber}`,
      htmlContent
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });

    console.log(`Week completion notification sent to ${mentorEmail} for ${clientName} Week ${weekNumber}`);
    return true;
  } catch (error) {
    console.error('Failed to send week completion notification:', error);
    return false;
  }
}

export async function sendFeedbackNotification(
  clientEmail: string,
  clientName: string | undefined,
  mentorName: string,
  weekNumber?: number,
  loginUrl?: string
): Promise<boolean> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const weekText = weekNumber ? ` for Week ${weekNumber}` : '';
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .highlight { background-color: #ecfeff; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Feedback Available</h1>
    </div>
    <div class="content">
      <p>Hello${clientName ? ` ${clientName}` : ''},</p>
      <div class="highlight">
        <strong>${mentorName}</strong> has provided new feedback${weekText} for you.
      </div>
      <p>Log in to your account to read the feedback and continue your recovery journey.</p>
      ${loginUrl ? `<p style="text-align: center;"><a href="${loginUrl}" class="button">Log In to View Feedback</a></p>` : ''}
      <p><strong>Remember:</strong> Your mentor is here to support your growth and progress.</p>
    </div>
    ${getEmailFooter(loginUrl)}
  </div>
</body>
</html>
    `;

    const rawMessage = createEmailMessage(
      clientEmail,
      `New Feedback Available${weekText} - The Integrity Protocol`,
      htmlContent
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });

    console.log(`Feedback notification sent to ${clientEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send feedback notification:', error);
    return false;
  }
}

export async function sendRelapseAutopsyNotification(
  mentorEmail: string,
  mentorName: string | undefined,
  clientName: string,
  incidentType: string,
  clientLink: string,
  loginUrl?: string
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
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .highlight { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Relapse Autopsy Completed</h1>
    </div>
    <div class="content">
      <p>Hello${mentorName ? ` ${mentorName}` : ''},</p>
      <div class="highlight">
        <strong>${clientName}</strong> has completed a <strong>Relapse Autopsy</strong> (${incidentType}) and needs your review and feedback.
      </div>
      <p>This is an important moment in their recovery. Please review their autopsy responses and provide supportive, constructive feedback as soon as possible.</p>
      <p style="text-align: center;">
        <a href="${clientLink}" class="button">Review Relapse Autopsy</a>
      </p>
      <p><strong>Remember:</strong> A relapse does not mean failure. Your timely feedback can help reinforce their commitment to recovery.</p>
    </div>
    ${getEmailFooter(loginUrl)}
  </div>
</body>
</html>
    `;

    const rawMessage = createEmailMessage(
      mentorEmail,
      `Relapse Autopsy Completed: ${clientName} - Review Needed`,
      htmlContent
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });

    console.log(`Relapse autopsy notification sent to ${mentorEmail} for ${clientName}`);
    return true;
  } catch (error) {
    console.error('Failed to send relapse autopsy notification:', error);
    return false;
  }
}

export async function sendNudgeEmail(
  clientEmail: string,
  clientName: string | undefined,
  encouragementMessage: string,
  daysSinceLastCheckin: number,
  loginUrl?: string
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
    .message { background-color: #ecfeff; border-left: 4px solid #0891b2; padding: 15px; margin: 20px 0; font-style: italic; }
    .button { display: inline-block; background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .opt-out { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>We Miss You!</h1>
    </div>
    <div class="content">
      <p>Hello${clientName ? ` ${clientName}` : ''},</p>
      <p>We noticed it's been ${daysSinceLastCheckin} days since your last check-in. Your journey matters, and every step counts.</p>
      <div class="message">
        ${encouragementMessage}
      </div>
      <p>Your daily check-in takes just a few minutes and helps you stay connected to your recovery goals.</p>
      <p style="text-align: center;">
        <a href="${loginUrl || '#'}" class="button">Complete Today's Check-in</a>
      </p>
    </div>
    ${getEmailFooter(loginUrl)}
    <p class="opt-out">You can turn off these reminders in your notification settings on the app.</p>
  </div>
</body>
</html>
    `;

    const rawMessage = createEmailMessage(
      clientEmail,
      `Check-in Reminder - The Integrity Protocol`,
      htmlContent
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });

    console.log(`Nudge email sent to ${clientEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send nudge email:', error);
    return false;
  }
}
