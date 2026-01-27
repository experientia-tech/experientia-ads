import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    return NextResponse.json(supervisors);
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supervisors' },
      { status: 500 }
    );
  }
}
