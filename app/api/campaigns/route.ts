import { NextRequest, NextResponse } from "next/server";
import type { CreateCampaignInput, CampaignStatus } from "@/types/campaign";
import { CampaignService } from "@/services/campaign.services";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { response } from "@/utils/response";

const campaignService = new CampaignService();

export async function GET(request: NextRequest) {
  try {
    const auth = authorize(request, [
      ROLES.ADMIN,
      ROLES.EXECUTOR,
      ROLES.SUPERVISOR,
      ROLES.CAMPAIGN_MANAGER,
    ]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as CampaignStatus | null;
    const serviceType = searchParams.get("serviceType") || "";
    const location = searchParams.get("location") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const scope = searchParams.get("scope");

    let memberId: string | undefined;
    let memberRole: any | undefined;

    if (scope === "assigned") {
      memberId = auth.sub;
    } else if (scope === "CAMPAIGN_MANAGER") {
      memberId = auth.sub;
      memberRole = "CAMPAIGN_MANAGER";
    }

    const campaigns = await campaignService.getCampaigns({
      search,
      status,
      serviceType,
      location,
      page,
      limit,
      sortBy,
      sortOrder,
      organizationId: auth.orgId,
      memberId,
      memberRole,
    });
    const authToken = request.headers.get("authorization") || "";
    return NextResponse.json({
      success: true,
      statusCode: 200,
      token: authToken,
      message: "Campaigns fetched successfully",
      ...campaigns,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch campaigns";
    return NextResponse.json(response(false, 500, undefined, errorMessage), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authorize(request, [ROLES.ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const campaignData = {
      ...body,
      organizationId: auth.orgId,
    };

    const createdCampaign = await campaignService.createCampaign(
      campaignData,
      auth.sub,
    );
    const authToken = request.headers.get("authorization") || "";
    return NextResponse.json(
      response(
        true,
        201,
        authToken,
        "Campaign created successfully",
        createdCampaign,
      ),
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating campaign:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create campaign";
    return NextResponse.json(response(false, 500, undefined, errorMessage), {
      status: 500,
    });
  }
}
