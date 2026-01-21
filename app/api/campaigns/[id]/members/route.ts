import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { campaignMemberService } from '@/services/campaign-member.services';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the resolved params
    const resolvedParams = await Promise.resolve(params);
    const campaignId = resolvedParams.id;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const { members } = await request.json();
    if (!members || !Array.isArray(members)) {
      return NextResponse.json(
        { error: 'Members array is required' },
        { status: 400 }
      );
    }

    // Add members to the campaign
    await Promise.all(
      members.map(member => {
        if (!member.userId || !member.role) {
          throw new Error('Each member must have userId and role');
        }
        return campaignMemberService.addCampaignMember({
          campaignId,
          userId: member.userId,
          role: member.role,
          assignedBy: authUser.userId
        });
      })
    );

    return NextResponse.json(
      { success: true, message: 'Members added successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error adding campaign members:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add campaign members',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}