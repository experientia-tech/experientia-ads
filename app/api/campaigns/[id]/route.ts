import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/services/campaign.services';
import type { CreateCampaignInput } from '@/types/campaign';
import { response } from '@/utils/response';
import { authorize } from '@/lib/middleware';
import { ROLES } from '@/lib/roles';

type RequestHandler = (
  request: NextRequest,
  params: { params: { id: string } }
) => Promise<NextResponse>;

const campaignService = new CampaignService();

export const GET: RequestHandler = async (request, { params }) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await Promise.resolve(params);

    if (!id) {
      return NextResponse.json(
        response(false, 400, undefined, 'Campaign ID is required'),
        { status: 400 }
      );
    }

    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    const campaign = await campaignService.getCampaignById(id, authToken);

    if (!campaign.success) {
      return NextResponse.json(
        response(false, campaign.statusCode, undefined, campaign.message),
        { status: campaign.statusCode }
      );
    }

    return NextResponse.json(response(true, 200, authToken, campaign.message, campaign.data));
  } catch (error) {
    console.error('Error fetching campaign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaign';
    return NextResponse.json(
      response(false, 500, undefined, errorMessage),
      { status: 500 }
    );
  }
}

export const PUT: RequestHandler = async (request, { params }) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await Promise.resolve(params);
    const data: Partial<CreateCampaignInput> = await request.json();
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';

    if (!id) {
      return NextResponse.json(
        response(false, 400, authToken, 'Campaign ID is required'),
        { status: 400 }
      );
    }

    const result = await campaignService.updateCampaign(id, data);
    
    if (!result) {
      return NextResponse.json(
        response(false, 404, authToken, 'Campaign not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      response(true, 200, authToken, 'Campaign updated successfully', result)
    );
    
  } catch (error) {
    console.error('Error updating campaign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update campaign';
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    return NextResponse.json(
      response(false, 500, authToken, errorMessage),
      { status: 500 }
    );
  }
}

export const DELETE: RequestHandler = async (request, { params }) => {
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

    const result = await campaignService.deleteCampaign(id);
    
    if (!result.success) {
      return NextResponse.json(
        response(false, 404, authToken, result.message || 'Campaign not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      response(true, 200, authToken, result.message || 'Campaign deleted successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting campaign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete campaign';
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    return NextResponse.json(
      response(false, 500, authToken, errorMessage),
      { status: 500 }
    );
  }
}