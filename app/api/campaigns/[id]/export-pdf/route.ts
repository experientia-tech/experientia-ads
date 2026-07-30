import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { invokePDFProcessor } from "@/lib/lambda-invoker";
import { generateLightweightCampaignPDF } from "@/lib/pdf-generator-light";
import { sendPDFStatusEmail } from "@/lib/email";
import { CampaignService } from "@/services/campaign.services";

type RequestHandler = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => Promise<NextResponse>;

const campaignService = new CampaignService();

export const POST: RequestHandler = async (request, context) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userEmail } = body;

    if (!userEmail || !userEmail.trim()) {
      return NextResponse.json(
        { success: false, message: "User email is required" },
        { status: 400 }
      );
    }

    // Fetch campaign for lightweight PDF
    console.log(`[PDF] Fetching campaign ${id} for lightweight PDF generation`);
    // Pass a dummy token if auth.token doesn't exist but is expected
    const token = (auth as any).token || "";
    const campaignResponse = await campaignService.getCampaignById(id, token);

    if (!campaignResponse.success || !campaignResponse.data) {
      return NextResponse.json(
        { success: false, message: "Campaign not found" },
        { status: 404 }
      );
    }

    const campaign = campaignResponse.data;
    const tasks = campaign.tasks || [];
    const completedCount = tasks.filter(
      (t: any) => (t.status || "").toUpperCase() === "ACCEPTED"
    ).length;

    // Create PDF job record for full PDF
    console.log(`[PDF] Creating PDF job record for campaign ${id}`);
    const pdfJob = await prisma.pDFJob.create({
      data: {
        campaignId: id,
        organizationId: auth.orgId,
        status: "PENDING",
        userEmail: userEmail.trim(),
        totalTasks: campaign.totalTasks || tasks.length,
      },
    });

    // Send status emails to both user and tech@experientia.media
    console.log(`[PDF] Sending status emails for job ${pdfJob.id}`);

    // Get base URL from request or environment
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "experientia-ads.vercel.app";
    const statusPageUrl = `${protocol}://${host}/pdf-status/${pdfJob.id}`;

    // Send to user email
    await sendPDFStatusEmail(
      userEmail.trim(),
      campaign.name || "Your Campaign",
      statusPageUrl,
      campaign.totalTasks || tasks.length
    ).catch((err) => {
      console.error(`[PDF] Failed to send email to user ${userEmail}:`, err);
    });

    // Send to tech@experientia.media
    await sendPDFStatusEmail(
      "tech@experientia.media",
      campaign.name || "Your Campaign",
      statusPageUrl,
      campaign.totalTasks || tasks.length,
      `User: ${userEmail}`
    ).catch((err) => {
      console.error(`[PDF] Failed to send email to tech@experientia.media:`, err);
    });

    // Queue full PDF generation in Lambda (fire and forget)
    console.log(`[PDF] Invoking Lambda for full PDF generation: job ${pdfJob.id}`);
    invokePDFProcessor(pdfJob.id, id).catch(async (err) => {
      console.error(`[PDF] Failed to invoke PDF processor for job ${pdfJob.id}:`, err);
      // Without this the job sits at PENDING forever and the status page shows
      // "Generating PDF" indefinitely for a build that never actually started.
      await prisma.pDFJob
        .update({
          where: { id: pdfJob.id },
          data: {
            status: "FAILED",
            error: `Could not start PDF processor: ${err instanceof Error ? err.message : String(err)}`,
            processedAt: new Date(),
          },
        })
        .catch((updateErr) => {
          console.error(`[PDF] Failed to mark job ${pdfJob.id} as FAILED:`, updateErr);
        });
    });

    return NextResponse.json({
      success: true,
      message: "PDF generation started. You will receive an email shortly.",
      jobId: pdfJob.id,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[PDF] Error in export-pdf endpoint:`, errorMsg, error);

    return NextResponse.json(
      {
        success: false,
        message: `Failed to generate PDF: ${errorMsg}`
      },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async (request, context) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { success: false, message: "jobId query parameter is required" },
        { status: 400 }
      );
    }

    const job = await prisma.pDFJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.campaignId !== id) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    const progress = job.totalTasks > 0
      ? Math.round((job.processedTasks / job.totalTasks) * 100)
      : 0;

    let estimatedTimeSeconds = 0;
    if (job.status === "PROCESSING" && job.processedTasks > 0) {
      const processingDuration = Date.now() - job.updatedAt.getTime();
      const tasksPerMs = job.processedTasks / processingDuration;
      const remainingTasks = Math.max(0, job.totalTasks - job.processedTasks);
      estimatedTimeSeconds = Math.ceil(remainingTasks / tasksPerMs / 1000);
    }

    return NextResponse.json({
      success: true,
      status: job.status,
      progress,
      processedTasks: job.processedTasks,
      totalTasks: job.totalTasks,
      downloadUrl: job.downloadUrl,
      emailSent: job.emailSent,
      error: job.error,
      estimatedTimeSeconds,
      expiresAt: job.expiresAt,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[PDF] Error checking status:`, errorMsg);

    return NextResponse.json(
      { success: false, message: `Failed to check status: ${errorMsg}` },
      { status: 500 }
    );
  }
};
