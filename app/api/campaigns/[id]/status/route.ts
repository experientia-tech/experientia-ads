import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/services/campaign.services';
import { authorize } from '@/lib/middleware';
import { ROLES } from '@/lib/roles';
import { response } from '@/utils/response';

type RequestHandler = (
  request: NextRequest,
  params: { params: { id: string } }
) => Promise<NextResponse>;

const campaignService = new CampaignService();

export const PATCH: RequestHandler = async (request, { params }) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await Promise.resolve(params);
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';

    if (!id) {
      return NextResponse.json(
        response(false, 400, authToken, 'Campaign ID is required'),
        { status: 400 }
      );
    }

    const { status } = await request.json();
    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        response(false, 400, authToken, 'Status is required and must be a string'),
        { status: 400 }
      );
    }

    const result = await campaignService.updateCampaignStatus(id, status);
    
    if (!result) {
      return NextResponse.json(
        response(false, 404, authToken, 'Campaign not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      response(true, 200, authToken, 'Campaign status updated successfully', result)
    );
  } catch (error) {
    console.error('Error updating campaign status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update campaign status';
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    return NextResponse.json(
      response(false, 500, authToken, errorMessage),
      { status: 500 }
    );
  }
}