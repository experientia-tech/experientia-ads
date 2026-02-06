import { NextRequest, NextResponse } from "next/server";
import type { CampaignStatus } from "@/types/campaign";
import { CampaignService } from "@/services/campaign.services";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { response } from "@/utils/response";

const campaignService = new CampaignService();

export async function GET(request: NextRequest) {
    try {
        const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR, ROLES.SUPERVISOR, ROLES.CAMPAIGN_MANAGER]);
        if (auth instanceof NextResponse) return auth;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') as CampaignStatus | null;
        const serviceType = searchParams.get('serviceType') || '';
        const location = searchParams.get('location') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

        // Enforce Assigned Scope
        const memberId = auth.sub;

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
            // No specific memberRole, just any assignment
        });
        const authToken = request.headers.get("authorization") || "";
        return NextResponse.json(
            {
                success: true,
                statusCode: 200,
                token: authToken,
                message: "Assigned campaigns fetched successfully",
                ...campaigns,
            },
        );
    } catch (error) {
        console.error("Error fetching assigned campaigns:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch assigned campaigns";
        return NextResponse.json(response(false, 500, undefined, errorMessage), {
            status: 500,
        });
    }
}
