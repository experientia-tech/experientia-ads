import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCampaignPDF } from "@/lib/pdf-generator";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pendingJobs = await prisma.pDFJob.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
    });

    if (pendingJobs.length === 0) {
      return NextResponse.json({
        success: true,
        processedCount: 0,
        message: "No pending jobs",
      });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const job of pendingJobs) {
      try {
        await prisma.pDFJob.update({
          where: { id: job.id },
          data: { status: "PROCESSING" },
        });

        const { downloadUrl } = await generateCampaignPDF(
          job.campaignId,
          "" // No auth token needed for internal processing
        );

        await prisma.pDFJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            downloadUrl,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            processedAt: new Date(),
          },
        });

        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Failed to process PDF job ${job.id}:`, errorMsg);

        await prisma.pDFJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            error: errorMsg,
            processedAt: new Date(),
          },
        });

        failureCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: successCount + failureCount,
      successCount,
      failureCount,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error in PDF processing cron:", errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
