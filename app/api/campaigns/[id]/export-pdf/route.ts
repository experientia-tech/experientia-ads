import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { generateCampaignPDF } from "@/lib/pdf-generator";
import { sendPDFReadyEmail, sendPDFErrorEmail } from "@/lib/email";

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

    const body = await request.json();
    const { userEmail } = body;

    const authToken = request.headers.get("authorization")?.split(" ")[1] || "";

    const pdfJob = await prisma.pDFJob.create({
      data: {
        campaignId: id,
        organizationId: auth.orgId,
        status: "PENDING",
        userEmail: userEmail || null,
      },
    });

    // Start PDF generation in background (non-blocking)
    generateAndEmailPDF(pdfJob.id, id, auth.orgId, authToken, userEmail).catch(
      (err) => console.error("Background PDF generation failed:", err)
    );

    return NextResponse.json(
      {
        success: true,
        jobId: pdfJob.id,
        status: pdfJob.status,
        createdAt: pdfJob.createdAt,
        message: userEmail
          ? "PDF is being generated. Check your email for the download link."
          : "PDF is being generated. Please check back shortly for the download link.",
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

async function generateAndEmailPDF(
  jobId: string,
  campaignId: string,
  organizationId: string,
  authToken: string,
  userEmail: string | null
): Promise<void> {
  try {
    await prisma.pDFJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    const { downloadUrl, filename } = await generateCampaignPDF(
      campaignId,
      authToken
    );

    await prisma.pDFJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        downloadUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        processedAt: new Date(),
      },
    });

    if (userEmail) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { name: true },
      });

      await sendPDFReadyEmail(
        userEmail,
        campaign?.name || "Your Campaign",
        downloadUrl,
        24
      );

      await prisma.pDFJob.update({
        where: { id: jobId },
        data: { emailSent: true },
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to generate PDF for job ${jobId}:`, errorMsg);

    await prisma.pDFJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: errorMsg,
        processedAt: new Date(),
      },
    });

    if (userEmail) {
      try {
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { name: true },
        });

        await sendPDFErrorEmail(
          userEmail,
          campaign?.name || "Your Campaign",
          errorMsg
        );

        await prisma.pDFJob.update({
          where: { id: jobId },
          data: { emailSent: true },
        });
      } catch (emailErr) {
        console.error("Failed to send error email:", emailErr);
      }
    }
  }
}
