import { NextResponse } from 'next/server';
import { CampaignService } from '@/services/campaign.services';
import { getAuthUser } from '@/lib/auth';

const campaignService = new CampaignService();

export async function POST(
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

    const campaignId = params.id;
    const { members } = await request.json();
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: 'At least one member is required' },
        { status: 400 }
      );
    }

    for (const member of members) {
      if (!member.userId || !member.role) {
        return NextResponse.json(
          { error: 'Each member must have userId and role' },
          { status: 400 }
        );
      }
    }

    const result = await campaignService.addCampaignMembers(
      campaignId,
      members,
      authUser.userId 
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error adding campaign members:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add campaign members',
        details: error instanceof Error ? error.message : String(error)
      },
      { 
        status: error instanceof Error && error.message === 'Campaign not found' 
          ? 404 
          : 500 
      }
    );
  }
}