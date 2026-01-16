import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CreateCampaignInput, CampaignResponse, CampaignStatus } from '@/types/campaign';

interface GetCampaignsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as CampaignStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    // Build the where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count for pagination
    const total = await prisma.campaign.count({ where });

    // Get paginated campaigns
    const campaigns = await prisma.campaign.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // Format the response
    const response: {
      data: CampaignResponse[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    } = {
      data: campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        organizationId: campaign.organizationId,
        status: campaign.status as CampaignStatus,
        latitude: campaign.latitude || undefined,
        longitude: campaign.longitude || undefined,
        address: campaign.address || undefined,
        serviceType: campaign.serviceType || undefined,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data: CreateCampaignInput = await request.json();
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId: data.organizationId,
        status: data.status || 'Active',
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        serviceType: data.serviceType,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      organizationId: campaign.organizationId,
      status: campaign.status,
      latitude: campaign.latitude || undefined,
      longitude: campaign.longitude || undefined,
      address: campaign.address || undefined,
      serviceType: campaign.serviceType || undefined,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}