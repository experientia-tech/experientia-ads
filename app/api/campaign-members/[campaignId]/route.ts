import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/middleware';
import { ROLES } from '@/lib/roles';
import { response } from '@/utils/response';
import { campaignMemberService } from '@/services/campaign-member.services';

type RequestHandler = (
  request: NextRequest,
  context: { params: { campaignId: string } }
) => Promise<NextResponse>;

export const GET: RequestHandler = async (request, { params }) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const { campaignId } = await Promise.resolve(params);
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';

    if (!campaignId) {
      return NextResponse.json(
        response(false, 400, authToken, 'Campaign ID is required'),
        { status: 400 }
      );
    }

    const members = await campaignMemberService.getCampaignMembers({
      campaignId
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
