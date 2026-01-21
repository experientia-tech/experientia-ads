import { NextResponse } from 'next/server';
import type { CreateCampaignInput, CampaignStatus } from '@/types/campaign';
import { CampaignService } from '@/services/campaign.services';

const campaignService = new CampaignService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as CampaignStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    const response = await campaignService.getCampaigns({
      search,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaigns', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    //const { members, tasks, ...campaignData } = body;
    const campaignData = body;
    
    const campaign = await campaignService.createCampaign(campaignData);

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create campaign', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}