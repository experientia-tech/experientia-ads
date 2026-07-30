import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE === "false" ? false : true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
}

export async function sendEmail({
  to,
  subject,
  htmlBody,
}: SendEmailParams): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Experientia" <tech@experientia.media>',
      to,
      subject,
      html: htmlBody,
    });
    console.log(`Email sent successfully to ${to} [Message ID: ${info.messageId}]`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export async function sendPDFReadyEmail(
  email: string,
  campaignName: string,
  downloadUrl: string,
  expiresIn: number = 24,
  fileName?: string,
  additionalInfo?: string
): Promise<void> {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .download-btn { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .info-box { background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 12px; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Your PDF Report is Ready</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your PDF report for <strong>${campaignName}</strong> has been successfully generated and is ready for download.</p>

            ${additionalInfo ? `<div class="info-box"><strong>Additional Info:</strong> ${additionalInfo}</div>` : ""}

            <center>
              <a href="${downloadUrl}" class="download-btn">📥 Download PDF Report</a>
            </center>

            <p style="font-size: 12px; color: #666;">
              <strong>Note:</strong> This download link will expire in ${expiresIn} hours. Please download your report before it expires.
            </p>

            <p>If you have any questions, please contact us at tech@experientia.media</p>

            <p>Best regards,<br><strong>Experientia Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Experientia. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `✅ Your PDF Report for ${campaignName} is Ready`,
    htmlBody,
  });
}

export async function sendPDFErrorEmail(
  email: string,
  campaignName: string,
  errorMessage: string
): Promise<void> {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .error-box { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PDF Generation Failed</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Unfortunately, the PDF report for <strong>${campaignName}</strong> could not be generated.</p>

            <div class="error-box">
              <strong>Error Details:</strong><br>
              ${errorMessage}
            </div>

            <p>Please try exporting the report again, or contact us if the problem persists at tech@experientia.media</p>

            <p>Best regards,<br><strong>Experientia Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Experientia. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `PDF Report Generation Failed for ${campaignName}`,
    htmlBody,
  });
}

export async function sendPDFStatusEmail(
  email: string,
  campaignName: string,
  statusPageUrl: string,
  taskCount: number,
  additionalInfo?: string
): Promise<void> {
  const estimatedTime = Math.ceil(taskCount / 200); // Rough estimate: 200 tasks per minute
  const estimatedTimeText = estimatedTime <= 1 ? "a few minutes" : `${estimatedTime} minutes`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .status-btn { display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .info-box { background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .progress-text { font-size: 13px; color: #666; margin-top: 15px; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 PDF Report Generation Started</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your PDF report for <strong>${campaignName}</strong> is being generated.</p>

            <div class="info-box">
              <strong>📊 Campaign Details:</strong><br>
              Total Tasks: <strong>${taskCount}</strong><br>
              Estimated Time: <strong>~${estimatedTimeText}</strong>
              ${additionalInfo ? `<br>User: <strong>${additionalInfo}</strong>` : ""}
            </div>

            <p style="text-align: center;">
              <a href="${statusPageUrl}" class="status-btn">
                📥 Check Status & Download
              </a>
            </p>

            <div class="progress-text">
              <strong>💡 How it works:</strong><br>
              • Click the button above to check real-time progress<br>
              • Page auto-refreshes every 5 seconds<br>
              • Download button appears when PDF is ready<br>
              • You can close this email and check anytime
            </div>

            <p style="margin-top: 25px; font-size: 13px; color: #666;">
              <strong>Note:</strong> The status page will be available for 24 hours.
              Download your report within this timeframe.
            </p>

            <p>If you have any questions, please contact us at <strong>tech@experientia.media</strong></p>

            <p style="margin-top: 20px;">Best regards,<br><strong>Experientia Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Experientia. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `PDF Report for ${campaignName} - Check Status`,
    htmlBody,
  });
}
