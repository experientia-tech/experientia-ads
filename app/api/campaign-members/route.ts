import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/middleware';
import { ROLES } from '@/lib/roles';
import { response } from '@/utils/response';
import { campaignMemberService } from '@/services/campaign-member.services';
import { getAuthUser } from '@/lib/auth';

type RequestHandler = (
  request: NextRequest,
) => Promise<NextResponse>;

export const GET: RequestHandler = async (request) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') as any;
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';

    const members = await campaignMemberService.getCampaignMembers({
      campaignId: campaignId || undefined,
      userId: userId || undefined,
      role: role || undefined
    });

    return NextResponse.json(
      response(true, 200, authToken, 'Campaign members fetched successfully', members)
    );
  } catch (error) {
    console.error('Error fetching campaign members:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaign members';
    const statusCode = error instanceof Error && error.message === 'Campaign not found' ? 404 : 500;
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    
    return NextResponse.json(
      response(false, statusCode, authToken, errorMessage),
      { status: statusCode }
    );
  }
};

export const POST: RequestHandler = async (request) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    const { campaignId, userId, role } = await request.json();

    if (!campaignId || !userId || !role) {
      return NextResponse.json(
        response(false, 400, authToken, 'campaignId, userId, and role are required'),
        { status: 400 }
      );
    }

    const authUser = await getAuthUser();
    const member = await campaignMemberService.addCampaignMember({
      campaignId,
      userId,
      role,
      assignedBy: authUser?.userId || ''
    });

    return NextResponse.json(
      response(true, 201, authToken, 'Campaign member added successfully', member),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding campaign member:', error);
    
    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message === 'Campaign not found' || error.message === 'User not found') {
        statusCode = 404;
      } else if (error.message === 'User is already a member of this campaign') {
        statusCode = 400;
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to add campaign member';
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    
    return NextResponse.json(
      response(false, statusCode, authToken, errorMessage),
      { status: statusCode }
    );
  }
};