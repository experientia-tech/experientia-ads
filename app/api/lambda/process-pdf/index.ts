import { prisma } from "@/lib/prisma";
import { generateCampaignPDF } from "@/lib/pdf-generator";
import { sendPDFReadyEmail, sendPDFErrorEmail } from "@/lib/email";

interface ProcessPDFEvent {
  jobId: string;
  campaignId: string;
}

export async function handler(event: ProcessPDFEvent): Promise<void> {
  const { jobId, campaignId } = event;

  console.log(`Processing PDF job ${jobId} for campaign ${campaignId}`);

  try {
    // Fetch the job to get user email
    const job = await prisma.pDFJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    // Mark as processing
    await prisma.pDFJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    // Generate PDF
    const { downloadUrl } = await generateCampaignPDF(campaignId, "");

    // Update job with download URL
    await prisma.pDFJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        downloadUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        processedAt: new Date(),
      },
    });

    // Send email if user provided one
    if (job.userEmail) {
      try {
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { name: true },
        });

        await sendPDFReadyEmail(
          job.userEmail,
          campaign?.name || "Your Campaign",
          downloadUrl,
          24
        );

        await prisma.pDFJob.update({
          where: { id: jobId },
          data: { emailSent: true },
        });

        console.log(`Email sent to ${job.userEmail} for job ${jobId}`);
      } catch (emailErr) {
        console.error(`Failed to send email for job ${jobId}:`, emailErr);
      }
    }

    console.log(`Successfully processed PDF job ${jobId}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to process PDF job ${jobId}:`, errorMsg);

    // Mark job as failed
    try {
      await prisma.pDFJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: errorMsg,
          processedAt: new Date(),
        },
      });

      // Send error email if user provided one
      const job = await prisma.pDFJob.findUnique({
        where: { id: jobId },
      });

      if (job?.userEmail) {
        try {
          const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { name: true },
          });

          await sendPDFErrorEmail(
            job.userEmail,
            campaign?.name || "Your Campaign",
            errorMsg
          );

          await prisma.pDFJob.update({
            where: { id: jobId },
            data: { emailSent: true },
          });
        } catch (emailErr) {
          console.error(`Failed to send error email for job ${jobId}:`, emailErr);
        }
      }
    } catch (updateErr) {
      console.error(`Failed to update job status for ${jobId}:`, updateErr);
    }

    throw error;
  }
}
