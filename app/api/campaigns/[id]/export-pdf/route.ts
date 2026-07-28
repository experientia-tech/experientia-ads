import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

type RequestHandler = (
  request: NextRequest,
  params: { params: { id: string } }
) => Promise<NextResponse>;

export const POST: RequestHandler = async (request, { params }) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await Promise.resolve(params);
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const pdfJob = await prisma.pDFJob.create({
      data: {
        campaignId: id,
        organizationId: auth.orgId,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        jobId: pdfJob.id,
        status: pdfJob.status,
        createdAt: pdfJob.createdAt,
      },
      { status: 202 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error queueing PDF export:", errorMsg);
    return NextResponse.json(
      { success: false, message: `Failed to queue PDF export: ${errorMsg}` },
      { status: 500 }
    );
  }
};
