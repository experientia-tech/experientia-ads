import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/middleware';
import { ROLES } from '@/lib/roles';
import { response } from '@/utils/response';
import { addSupervisor } from '@/services/executor.services';

type RequestHandler = (
  request: NextRequest,
) => Promise<NextResponse>;

export const GET: RequestHandler = async (request) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || searchParams.get('name') || undefined;
    const pageVal = searchParams.get('page');
    const limitVal = searchParams.get('limit');
    const page = pageVal ? parseInt(pageVal, 10) : undefined;
    const limit = limitVal ? parseInt(limitVal, 10) : undefined;

    const where: any = {
      role: 'SUPERVISOR' as const,
      active: true,
    };

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    const supervisorAssignments = await prisma.campaignMember.findMany({
      where,
      distinct: ['userId'],
      take: limit,
      skip: page && limit ? (page - 1) * limit : undefined,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
    
    const supervisors = supervisorAssignments.map((assignment) => ({
      id: assignment.userId,
      firstName: assignment.user.firstName,
      lastName: assignment.user.lastName,
      phone: assignment.user.phone,
      role: 'SUPERVISOR',
    }));

    return NextResponse.json(
      response(true, 200, authToken, 'Supervisors fetched successfully', supervisors)
    );
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    const errorMessage = 'Failed to fetch supervisors';
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    
    return NextResponse.json(
      response(false, 500, authToken, errorMessage),
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async (request) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN]);
    if (auth instanceof NextResponse) return auth;

    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    const body = await request.json();
    
    const { firstName, lastName, phone, location, organizationId, campaignId } = body;
    const assignedBy = auth.sub; // Get current user ID from JWT token

    // Validate required fields
    if (!firstName || !lastName || !phone || !location || !organizationId || !campaignId) {
      return NextResponse.json(
        response(false, 400, authToken, 'Missing required fields: firstName, lastName, phone, location, organizationId, campaignId'),
        { status: 400 }
      );
    }

    // Validate Indian phone number format (10 digits, starting 6-9).
    if (!/^[6-9]\d{9}$/.test(String(phone).trim())) {
      return NextResponse.json(
        response(false, 400, authToken, 'Invalid phone number. Enter a 10-digit mobile number.'),
        { status: 400 }
      );
    }

    const supervisor = await addSupervisor(firstName, lastName, String(phone).trim(), location, organizationId, campaignId, assignedBy);

    return NextResponse.json(
      response(true, 201, authToken, 'Supervisor created successfully', supervisor),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating supervisor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create supervisor';
    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    
    if (errorMessage === 'User with this phone number is already a supervisor') {
      return NextResponse.json(
        response(false, 409, authToken, errorMessage),
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      response(false, 500, authToken, errorMessage),
      { status: 500 }
    );
  }
};
