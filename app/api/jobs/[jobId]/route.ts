import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

type RequestHandler = (
  request: NextRequest,
  params: { params: { jobId: string } }
) => Promise<NextResponse>;

export const GET: RequestHandler = async (request, { params }) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

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

    if (job.organizationId !== auth.orgId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        downloadUrl: job.downloadUrl,
        expiresAt: job.expiresAt,
        error: job.error,
        createdAt: job.createdAt,
        processedAt: job.processedAt,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching job status:", errorMsg);
    return NextResponse.json(
      { success: false, message: `Failed to fetch job status: ${errorMsg}` },
      { status: 500 }
    );
  }
};
