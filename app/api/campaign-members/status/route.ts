import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/middleware';
import { ROLES } from '@/lib/roles';
import { response } from '@/utils/response';
import { campaignMemberService } from '@/services/campaign-member.services';

type RequestHandler = (
  request: NextRequest,
) => Promise<NextResponse>;

export const PATCH: RequestHandler = async (request) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    const { memberId, active } = await request.json();

    if (memberId === undefined || active === undefined) {
      return NextResponse.json(
        response(false, 400, authToken, 'memberId and active status are required'),
        { status: 400 }
      );
    }

    const updatedMember = await campaignMemberService.updateCampaignMemberStatus(
      memberId,
      active
    );

    return NextResponse.json(
      response(true, 200, authToken, 'Campaign member status updated successfully', updatedMember)
    );
  } catch (error) {
    console.error('Error updating campaign member status:', error);
    
    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message === 'Campaign member not found') {
        statusCode = 404;
      } else if (error.message === 'Invalid status') {
        statusCode = 400;
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update campaign member status';
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    
    return NextResponse.json(
      response(false, statusCode, authToken, errorMessage),
      { status: statusCode }
    );
  }
}

export const dynamic = 'force-dynamic';