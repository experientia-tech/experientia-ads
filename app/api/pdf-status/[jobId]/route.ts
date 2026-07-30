import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RequestHandler = (
  request: NextRequest,
  params: { params: { jobId: string } }
) => Promise<NextResponse>;

export const GET: RequestHandler = async (request, { params }) => {
  try {
    const { jobId } = await Promise.resolve(params);

    if (!jobId) {
      return NextResponse.json(
        { success: false, message: "Job ID is required" },
        { status: 400 }
      );
    }

    const job = await prisma.pDFJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    // Calculate progress
    const progress = job.totalTasks > 0
      ? Math.round((job.processedTasks / job.totalTasks) * 100)
      : 0;

    // Estimate time remaining
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
      downloadUrl: job.downloadUrl || null,
      error: job.error || null,
      estimatedTimeSeconds,
      expiresAt: job.expiresAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
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
