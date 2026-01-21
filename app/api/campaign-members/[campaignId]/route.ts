import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { campaignMemberService } from '@/services/campaign-member.services';

export async function GET(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const campaignId = resolvedParams.campaignId;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const members = await campaignMemberService.getCampaignMembers({
      campaignId
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching campaign members:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaign members',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
