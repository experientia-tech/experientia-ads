import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CampaignRole } from '@prisma/client';

type CreateCampaignMemberInput = {
  campaignId: string;
  userId: string;
  assignedBy: string;
  role: CampaignRole;
};

export async function POST(request: Request) {
  try {
    const { campaignId, userId, assignedBy, role }: CreateCampaignMemberInput = await request.json();

    // Validate required fields
    if (!campaignId || !userId || !assignedBy || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, userId, assignedBy, and role are required' },
        { status: 400 }
      );
    }

    // Check if campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user is already a member with the same role
    const existingMember = await prisma.campaignMember.findFirst({
      where: {
        campaignId,
        userId,
        role,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this campaign with the same role' },
        { status: 400 }
      );
    }

    // Create the campaign member
    const campaignMember = await prisma.campaignMember.create({
      data: {
        campaignId,
        userId,
        assignedBy,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: campaignMember.id,
      campaignId: campaignMember.campaignId,
      user: campaignMember.user,
      role: campaignMember.role,
      assignedAt: campaignMember.assignedAt,
    });

  } catch (error) {
    console.error('Error adding campaign member:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add campaign member', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') as CampaignRole | null;

    const where: any = {};
    
    if (campaignId) where.campaignId = campaignId;
    if (userId) where.userId = userId;
    if (role) where.role = role;

    const members = await prisma.campaignMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return NextResponse.json(members);

  } catch (error) {
    console.error('Error fetching campaign members:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaign members', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
