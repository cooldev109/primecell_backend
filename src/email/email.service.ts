import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface SendGridResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SENDGRID_API_KEY') || '';
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@primecell.app';
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'PrimeCell';
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  /**
   * Send OTP email for authentication
   */
  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    const subject = 'Your PrimeCell Login Code';
    const html = this.getOtpEmailTemplate(otp);
    const text = `Your PrimeCell login code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send welcome email after onboarding
   */
  async sendWelcomeEmail(email: string, userName?: string): Promise<boolean> {
    const subject = 'Welcome to PrimeCell!';
    const html = this.getWelcomeEmailTemplate(userName);
    const text = `Welcome to PrimeCell${userName ? `, ${userName}` : ''}!\n\nYour personalized fitness journey starts now. We've created your custom plan based on your goals.\n\nOpen the app to view your nutrition and training plan.\n\nTo your success,\nThe PrimeCell Team`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send weekly check-in reminder
   */
  async sendCheckinReminder(email: string, weekNumber: number): Promise<boolean> {
    const subject = `Week ${weekNumber} Check-In Reminder`;
    const html = this.getCheckinReminderTemplate(weekNumber);
    const text = `Hi!\n\nIt's time for your Week ${weekNumber} check-in. A quick update helps us fine-tune your plan for better results.\n\nOpen the PrimeCell app to submit your check-in.\n\nKeep up the great work!\nThe PrimeCell Team`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Core email sending function
   */
  private async sendEmail(options: SendEmailOptions): Promise<boolean> {
    // In development, log email instead of sending
    if (!this.isProduction || !this.apiKey) {
      this.logger.log('='.repeat(50));
      this.logger.log('EMAIL (Development Mode - Not Sent)');
      this.logger.log('='.repeat(50));
      this.logger.log(`To: ${options.to}`);
      this.logger.log(`Subject: ${options.subject}`);
      this.logger.log(`Text: ${options.text?.substring(0, 200)}...`);
      this.logger.log('='.repeat(50));
      return true;
    }

    try {
      const response = await this.sendViaSendGrid(options);

      if (response.success) {
        this.logger.log(`Email sent successfully to ${options.to}`);
        return true;
      } else {
        this.logger.error(`Failed to send email: ${response.error}`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Email sending error: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Send email via SendGrid API
   */
  private async sendViaSendGrid(options: SendEmailOptions): Promise<SendGridResponse> {
    const url = 'https://api.sendgrid.com/v3/mail/send';

    const body = {
      personalizations: [
        {
          to: [{ email: options.to }],
          subject: options.subject,
        },
      ],
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      content: [
        ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
        ...(options.html ? [{ type: 'text/html', value: options.html }] : []),
      ],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok || response.status === 202) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return { success: false, error: `SendGrid API error: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * OTP Email HTML Template
   */
  private getOtpEmailTemplate(otp: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PrimeCell Login Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #eee;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #22C55E;">PrimeCell</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">
                Your Login Code
              </h2>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #666; text-align: center;">
                Enter this code in the app to sign in to your account:
              </p>

              <!-- OTP Code Box -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', monospace;">
                  ${otp}
                </span>
              </div>

              <p style="margin: 0 0 8px; font-size: 14px; color: #888; text-align: center;">
                This code expires in <strong>10 minutes</strong>
              </p>
              <p style="margin: 0; font-size: 14px; color: #888; text-align: center;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 13px; color: #999; text-align: center;">
                &copy; ${new Date().getFullYear()} PrimeCell. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Welcome Email HTML Template
   */
  private getWelcomeEmailTemplate(userName?: string): string {
    const greeting = userName ? `Hi ${userName}!` : 'Welcome!';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PrimeCell</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #22C55E 0%, #16a34a 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">PrimeCell</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Your Fitness Journey Starts Now</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #1a1a1a;">
                ${greeting}
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #444;">
                Congratulations on taking the first step towards a healthier you! We've created a personalized plan based on your goals and preferences.
              </p>

              <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1a1a1a;">
                What's Next?
              </h3>
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #444;">
                <li>Review your personalized nutrition plan</li>
                <li>Check out your training program</li>
                <li>Complete your first weekly check-in</li>
                <li>Track your progress and adjustments</li>
              </ul>

              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #444;">
                Remember: Consistency beats perfection. We're here to support you every step of the way.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <a href="#" style="display: block; width: 100%; padding: 16px; background-color: #22C55E; color: #ffffff; text-decoration: none; text-align: center; font-weight: 600; font-size: 16px; border-radius: 8px;">
                Open PrimeCell App
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #666; text-align: center;">
                To your success,<br>
                <strong>The PrimeCell Team</strong>
              </p>
              <p style="margin: 0; font-size: 13px; color: #999; text-align: center;">
                &copy; ${new Date().getFullYear()} PrimeCell. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Check-in Reminder Email HTML Template
   */
  private getCheckinReminderTemplate(weekNumber: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Week ${weekNumber} Check-In Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #eee;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #22C55E;">PrimeCell</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background-color: #22C55E; color: white; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px;">
                  Week ${weekNumber}
                </span>
              </div>

              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">
                Time for Your Check-In!
              </h2>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #444; text-align: center;">
                A quick update helps us fine-tune your plan for even better results. It only takes a minute!
              </p>

              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1a1a1a;">What to log:</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #666;">
                  <li>Current weight & waist measurement</li>
                  <li>Energy, hunger, sleep & stress levels</li>
                  <li>Adherence to the plan</li>
                  <li>Any notable events this week</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <a href="#" style="display: block; width: 100%; padding: 16px; background-color: #22C55E; color: #ffffff; text-decoration: none; text-align: center; font-weight: 600; font-size: 16px; border-radius: 8px;">
                Complete Check-In
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #666; text-align: center;">
                Keep up the great work!
              </p>
              <p style="margin: 0; font-size: 13px; color: #999; text-align: center;">
                &copy; ${new Date().getFullYear()} PrimeCell. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
