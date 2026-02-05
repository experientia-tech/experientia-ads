import { NextRequest, NextResponse } from "next/server";
import { getCampaigns } from "@/services/executor.services";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { response } from "@/utils/response";

export async function GET(request: NextRequest) {
  try {
    const auth = authorize(request, [ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    // Get the token from the authorization header
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : "";

    // Get userId
    const userId = auth.sub;

    const campaigns = await getCampaigns(userId);

    return NextResponse.json(
      response(true, 200, token, "Campaigns retrieved successfully", campaigns),
      {
        headers: {
          "Cache-Control": "private, max-age=300", // Cache for 5 minutes
        },
      },
    );
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      response(false, 500, undefined, "Failed to fetch campaigns"),
      { status: 500 },
    );
  }
}
