import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.REGION_AWS,
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
    const command = new SendEmailCommand({
      Source: "tech@experientia.media",
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: htmlBody, Charset: "UTF-8" },
        },
      },
    });

    await sesClient.send(command);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export async function sendPDFReadyEmail(
  email: string,
  campaignName: string,
  downloadUrl: string,
  expiresIn: number = 24
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
          .footer { font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your PDF Report is Ready</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your PDF report for <strong>${campaignName}</strong> has been successfully generated and is ready for download.</p>

            <center>
              <a href="${downloadUrl}" class="download-btn">Download PDF Report</a>
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
    subject: `Your PDF Report for ${campaignName} is Ready`,
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
