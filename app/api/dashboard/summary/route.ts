import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dashboardService } from '@/services/dashboard.services';
import { response } from '@/utils/response';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        response(false, 401, undefined, 'Missing or invalid bearer token'),
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    if (!token) {
      return NextResponse.json(
        response(false, 401, undefined, 'Token is required'),
        { status: 401 }
      );
    }

    // Verify the token signature instead of blindly decoding it.
    let organizationId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        orgId: string;
      };
      organizationId = decoded.orgId;
    } catch {
      return NextResponse.json(
        response(false, 401, undefined, 'Invalid or expired token'),
        { status: 401 }
      );
    }

    const summary = await dashboardService.getSummary(organizationId);
    
    return NextResponse.json(
      response(true, 200, token, 'Dashboard summary retrieved successfully', summary),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in dashboard summary API:', error);
    return NextResponse.json(
      response(
        false, 
        500, 
        undefined, 
        'Failed to fetch dashboard summary',
        error instanceof Error ? error.message : 'Unknown error'
      ),
      { status: 500 }
    );
  }
}