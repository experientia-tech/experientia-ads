import { NextRequest, NextResponse } from "next/server";
import { createCampaignTask, getCampaignTasks } from "@/services/executor.services";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { response } from "@/utils/response";
import { CampaignTaskInput } from "@/types/campaign";


export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const auth = authorize(request, [ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;
    const resolvedParams = await Promise.resolve(params);
    const campaignId = resolvedParams.campaignId;
    
    if (!campaignId) {
      return NextResponse.json(
        response(false, 400, undefined, 'Campaign ID is required'),
        { status: 400 }
      );
    }
    
    const userId = auth.sub;
    const tasks = await getCampaignTasks(campaignId, userId);
    
    return NextResponse.json(
      response(true, 200, undefined, 'Tasks retrieved successfully', tasks)
    );
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      response(false, error.status || 500, undefined, error.message || 'Failed to fetch tasks'),
      { status: error.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const auth = authorize(request, [ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;
    
    const resolvedParams = await Promise.resolve(params);
    const campaignId = resolvedParams.campaignId;
    
    if (!campaignId) {
      return NextResponse.json(
        response(false, 400, undefined, 'Campaign ID is required'),
        { status: 400 }
      );
    }
    
    const userId = auth.sub;
    const taskData: CampaignTaskInput = await request.json();
    
    const task = await createCampaignTask(campaignId, taskData, userId);
    
    return NextResponse.json(
      response(true, 201, undefined, 'Task created successfully', task)
    );
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      response(false, error.status || 500, undefined, error.message || 'Failed to create task'),
      { status: error.status || 500 }
    );
  }
}