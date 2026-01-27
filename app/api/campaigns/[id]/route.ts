import { NextResponse } from 'next/server';
import { CampaignService } from '@/services/campaign.services';
import type { CreateCampaignInput } from '@/types/campaign';

const campaignService = new CampaignService();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);

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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const data: Partial<CreateCampaignInput> = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const updatedCampaign = await campaignService.updateCampaign(id, data);
    return NextResponse.json(updatedCampaign);
    
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update campaign', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: error instanceof Error && error.message === 'Campaign not found' ? 404 : 500 }
    );
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const result = await campaignService.deleteCampaign(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete campaign',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: error instanceof Error && error.message === 'Campaign not found' ? 404 : 500 }
    );
  }
}