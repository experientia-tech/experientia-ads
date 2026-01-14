import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CreateCampaignInput, CampaignResponse, CampaignStatus } from '@/types/campaign';


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

    const campaigns = await prisma.campaign.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        members: {
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
        },
        tasks: true,
      },
    });

    // Format the response
    const response = {
      data: campaigns.map(campaign => {
        // Find the creator (first campaign manager)
        const creator = campaign.members.find(m => m.role === 'CAMPAIGN_MANAGER');
        
        return {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          organizationId: campaign.organizationId,
          status: campaign.status as CampaignStatus,
          createdBy: creator?.userId || '',
          latitude: campaign.latitude || undefined,
          longitude: campaign.longitude || undefined,
          address: campaign.address || undefined,
          serviceType: campaign.serviceType || undefined,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          members: campaign.members.map(member => ({
            id: member.id,
            campaignId: member.campaignId,
            userId: member.userId,
            assignedBy: member.assignedBy,
            role: member.role as 'CAMPAIGN_MANAGER' | 'SUPERVISOR' | 'EXECUTOR' | 'BRAND_VIEWER',
            assignedAt: member.assignedAt,
            active: member.active,
            user: member.user ? {
              id: member.user.id,
              firstName: member.user.firstName,
              lastName: member.user.lastName,
              email: member.user.email,
            } : undefined,
          })),
          tasks: campaign.tasks.map(task => {
            const metadata = (task.metadata as {
              title?: string;
              description?: string;
              dueDate?: string;
              priority?: 'LOW' | 'MEDIUM' | 'HIGH';
            }) || {};

            return {
              id: task.id,
              campaignId: task.campaignId,
              status: task.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED',
              executorUserId: task.executorUserId,
              assignedAt: task.assignedAt,
              startedAt: task.startedAt,
              completedAt: task.completedAt,
              rejectionReason: task.rejectionReason || null,
              flagged: task.flagged,
              notes: task.notes || null,
              metadata: task.metadata || {},
              // Add the missing fields from metadata
              title: metadata.title || 'Untitled Task',
              description: metadata.description || null,
              dueDate: metadata.dueDate ? new Date(metadata.dueDate) : null,
              priority: metadata.priority || 'MEDIUM',
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
            };
          }),
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        } as CampaignResponse;
      }),
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
    
    // Validate required fields
    if (!data.createdBy) {
      return NextResponse.json(
        { error: 'createdBy is required' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Create the campaign
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

      // 2. Add the creator as a campaign manager
      await prisma.campaignMember.create({
        data: {
          campaignId: campaign.id,
          userId: data.createdBy,
          assignedBy: data.createdBy,
          role: 'CAMPAIGN_MANAGER',
        },
      });
      
      // 3. Add other members if provided
      if (data.members && data.members.length > 0) {
        await Promise.all(
          data.members.map(member => 
            prisma.campaignMember.create({
              data: {
                campaignId: campaign.id,
                userId: member.userId,
                assignedBy: data.createdBy,
                role: member.role,
              },
            })
          )
        );
      }
      
      // 4. Add tasks if provided
      if (data.tasks && data.tasks.length > 0) {
        await Promise.all(
          data.tasks.map(task => 
            prisma.task.create({
              data: {
                campaignId: campaign.id,
                status: task.status || 'PENDING',
                executorUserId: task.executorUserId,
                assignedAt: new Date(),
                metadata: {
                  title: task.title,
                  description: task.description,
                  dueDate: task.dueDate,
                  priority: task.priority || 'MEDIUM',
                }
              },
            })
          )
        );
      }

      // Return the complete campaign with relations
      return prisma.campaign.findUnique({
        where: { id: campaign.id },
        include: {
          members: {
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
          },
          tasks: true,
        },
      });
    });

    if (!result) {
      throw new Error('Failed to create campaign');
    }

    return NextResponse.json({
      id: result.id,
      name: result.name,
      description: result.description,
      organizationId: result.organizationId,
      status: result.status,
      createdBy: data.createdBy,
      latitude: result.latitude || undefined,
      longitude: result.longitude || undefined,
      address: result.address || undefined,
      serviceType: result.serviceType || undefined,
      startDate: result.startDate,
      endDate: result.endDate,
      members: result.members.map(member => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        user: member.user,
      })),
      tasks: result.tasks,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    } as CampaignResponse);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}