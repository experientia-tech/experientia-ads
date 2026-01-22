import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { campaignMemberService } from '@/services/campaign-member.services';

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { memberId, active } = await request.json();

    if (memberId === undefined || active === undefined) {
      return NextResponse.json(
        { error: 'memberId and active status are required' },
        { status: 400 }
      );
    }

    const updatedMember = await campaignMemberService.updateCampaignMemberStatus(
      memberId,
      active
    );

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating campaign member status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update campaign member status',
        details: error instanceof Error ? error.message : String(error)
      },
      { 
        status: error instanceof Error && error.message === 'Campaign member not found'
          ? 404 
          : 500
      }
    );
  }
}

export const dynamic = 'force-dynamic';