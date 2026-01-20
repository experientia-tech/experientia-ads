import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { campaignMemberService } from '@/services/campaign-member.services';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') as any;

    const members = await campaignMemberService.getCampaignMembers({
      campaignId: campaignId || undefined,
      userId: userId || undefined,
      role: role || undefined
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching campaign members:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaign members',
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

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { campaignId, userId, role } = await request.json();

    if (!campaignId || !userId || !role) {
      return NextResponse.json(
        { error: 'campaignId, userId, and role are required' },
        { status: 400 }
      );
    }

    const member = await campaignMemberService.addCampaignMember({
      campaignId,
      userId,
      role,
      assignedBy: authUser.userId
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding campaign member:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add campaign member',
        details: error instanceof Error ? error.message : String(error)
      },
      { 
        status: error instanceof Error && error.message === 'Campaign not found' 
          ? 404 
          : error instanceof Error && error.message === 'User not found'
          ? 404
          : error instanceof Error && error.message === 'User is already a member of this campaign'
          ? 400
          : 500
      }
    );
  }
}