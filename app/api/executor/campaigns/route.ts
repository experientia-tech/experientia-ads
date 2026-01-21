import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns } from '@/services/executor.services';

export async function GET(request: NextRequest) {
    try {
        // Get userId from auth
        const userId = "49a34c3d-e09e-46c7-ac06-c5a94030bbc8"; // Replace with actual user ID retrieval logic
        // Assuming getCampaigns fetches campaigns for the current user with role 'executor'
        // You may need to pass user ID or context if required by the service
        const campaigns = await getCampaigns(userId);
        return NextResponse.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
}