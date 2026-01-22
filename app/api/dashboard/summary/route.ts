import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.services';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const summary = await dashboardService.getSummary();
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error in dashboard summary API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}