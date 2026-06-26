import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { authorize } from '@/lib/middleware';
import { ROLES } from '@/lib/roles';
import { response } from '@/utils/response';

export async function GET(request: NextRequest) {
  try {
    const auth = authorize(request, [ROLES.ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: auth.orgId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          campaignMembers: {
            select: {
              role: true,
              campaign: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),
      prisma.user.count({ where }),
    ]);

    // Map roles of user from campaignMembers
    const formattedUsers = users.map((user) => {
      const roles = Array.from(new Set(user.campaignMembers.map((m) => m.role)));
      const campaigns = Array.from(new Set(user.campaignMembers.map((m) => m.campaign.name)));
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isActive: user.isActive,
        roles,
        campaigns,
      };
    });

    return NextResponse.json(
      response(true, 200, authToken, 'Users fetched successfully', {
        users: formattedUsers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }
      })
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      response(false, 500, '', 'Failed to fetch users'),
      { status: 500 }
    );
  }
}
