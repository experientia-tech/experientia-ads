import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/middleware';
import { ROLES } from '@/lib/roles';
import { response } from '@/utils/response';

type RequestHandler = (
  request: NextRequest,
) => Promise<NextResponse>;

export const GET: RequestHandler = async (request) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    
    const supervisorAssignments = await prisma.campaignMember.findMany({
      where: {
        role: 'SUPERVISOR' as const,
        active: true,
      },
      distinct: ['userId'],
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
}
