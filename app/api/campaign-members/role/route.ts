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

    const { memberId, role } = await request.json();

    if (!memberId || !role) {
      return NextResponse.json(
        { error: 'memberId and role are required' },
        { status: 400 }
      );
    }

    const updatedMember = await campaignMemberService.updateCampaignMemberRole(
      memberId,
      role
    );

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating campaign member role:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update campaign member role',
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