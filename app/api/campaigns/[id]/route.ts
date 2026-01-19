import { NextResponse } from 'next/server';
import { CampaignService } from '@/services/campaign.services';

const campaignService = new CampaignService();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaign', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}