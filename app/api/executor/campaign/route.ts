import { NextRequest, NextResponse } from "next/server";
import { getCampaigns } from "@/services/executor.services";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";

export async function GET(request: NextRequest) {
  try {
    const auth = authorize(request, [ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;
    // Get userId from auth
    const userId = "49a34c3d-e09e-46c7-ac06-c5a94030bbc8"; // Replace with actual user ID retrieval logic

    const campaigns = await getCampaigns(userId);
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 },
    );
  }
}
