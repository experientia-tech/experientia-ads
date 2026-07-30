import { prisma } from "@/lib/prisma";
import { generateFullCampaignPDF } from "@/lib/pdf-generator-full";
import { sendPDFReadyEmail, sendPDFErrorEmail } from "@/lib/email";

interface ProcessPDFEvent {
  jobId: string;
  campaignId: string;
}

export async function handler(event: ProcessPDFEvent): Promise<void> {
  const { jobId, campaignId } = event;

  console.log(`[Lambda] Processing full PDF - Job: ${jobId}, Campaign: ${campaignId}`);

  try {
    const job = await prisma.pDFJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      console.error(`[Lambda] Job ${jobId} not found in database`);
      return;
    }

    // Async (Event) invocations are retried automatically by AWS, and the export
    // endpoint can be hit twice by an impatient user. Without this guard a retry
    // flips a finished job back to PROCESSING, regenerates the whole PDF, and
    // re-sends the emails.
    if (job.status === "COMPLETED" || job.status === "PROCESSING") {
      console.log(`[Lambda] Job ${jobId} is already ${job.status} — skipping duplicate invocation`);
      return;
    }

    await prisma.pDFJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING", updatedAt: new Date() },
    });

    console.log(`[Lambda] Job marked as PROCESSING for campaign ${campaignId}`);

    console.log(`[Lambda] Starting full PDF generation...`);
    const { downloadUrl, filename } = await generateFullCampaignPDF(campaignId, jobId, "");

    console.log(`[Lambda] Full PDF generated successfully`);

    await prisma.pDFJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        downloadUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`[Lambda] Job marked as COMPLETED`);

    // Send completion emails to both user and tech@experientia.media
    if (job.userEmail) {
      try {
        console.log(`[Lambda] Sending PDF ready email to ${job.userEmail}`);

        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { name: true },
        });

        await sendPDFReadyEmail(
          job.userEmail,
          campaign?.name || "Your Campaign",
          downloadUrl,
          24,
          filename
        );

        console.log(`[Lambda] Email sent successfully to ${job.userEmail}`);
      } catch (emailErr) {
        console.error(`[Lambda] Failed to send email for job ${jobId}:`, emailErr);
      }
    }

    // Always send to tech@experientia.media
    try {
      console.log(`[Lambda] Sending PDF ready email to tech@experientia.media`);

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { name: true },
      });

      await sendPDFReadyEmail(
        "tech@experientia.media",
        campaign?.name || "Your Campaign",
        downloadUrl,
        24,
        filename,
        `User: ${job.userEmail || "Unknown"}`
      );

      console.log(`[Lambda] Email sent successfully to tech@experientia.media`);
    } catch (emailErr) {
      console.error(`[Lambda] Failed to send email to tech@experientia.media:`, emailErr);
    }

    await prisma.pDFJob.update({
      where: { id: jobId },
      data: { emailSent: true },
    });

    console.log(`[Lambda] Successfully completed full PDF processing for job ${jobId}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Lambda] Failed to process full PDF for job ${jobId}:`, errorMsg, error);

    try {
      await prisma.pDFJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: errorMsg,
          processedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`[Lambda] Job marked as FAILED`);

      const updatedJob = await prisma.pDFJob.findUnique({
        where: { id: jobId },
      });

      if (updatedJob?.userEmail) {
        try {
          console.log(`[Lambda] Sending error email to ${updatedJob.userEmail}`);

          const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { name: true },
          });

          await sendPDFErrorEmail(
            updatedJob.userEmail,
            campaign?.name || "Your Campaign",
            errorMsg
          );

          console.log(`[Lambda] Error email sent to ${updatedJob.userEmail}`);
        } catch (emailErr) {
          console.error(`[Lambda] Failed to send error email for job ${jobId}:`, emailErr);
        }
      }

      // Send error email to tech@experientia.media
      try {
        console.log(`[Lambda] Sending error email to tech@experientia.media`);

        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { name: true },
        });

        await sendPDFErrorEmail(
          "tech@experientia.media",
          campaign?.name || "Your Campaign",
          `${errorMsg} (User: ${updatedJob?.userEmail || "Unknown"})`
        );

        console.log(`[Lambda] Error email sent to tech@experientia.media`);
      } catch (emailErr) {
        console.error(`[Lambda] Failed to send error email to tech@experientia.media:`, emailErr);
      }

      await prisma.pDFJob.update({
        where: { id: jobId },
        data: { emailSent: true },
      });
    } catch (updateErr) {
      console.error(`[Lambda] Failed to update job status for ${jobId}:`, updateErr);
    }

    // Deliberately not rethrowing: the job is already recorded as FAILED and the
    // user has been emailed. Rethrowing would make AWS retry the async invocation
    // twice more, restarting a 10-minute PDF build and duplicating the emails.
  }
}
