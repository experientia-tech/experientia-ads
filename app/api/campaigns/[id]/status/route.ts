import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { CampaignService } from '@/services/campaign.services';
import { prisma } from '@/lib/prisma';

const campaignService = new CampaignService();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const resolvedParams = await Promise.resolve(params);
    const campaignId = resolvedParams.id;
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const { status } = await request.json();
    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Status is required and must be a string' },
        { status: 400 }
      );
    }

    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const updatedCampaign = await campaignService.updateCampaignStatus(campaignId, status);

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update campaign status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}