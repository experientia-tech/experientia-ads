import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { taskService } from '@/services/tasks.services';
import { TaskStatus } from '@/app/generated/prisma/client';
import { response } from '@/utils/response';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return NextResponse.json(
        response(false, 401, undefined, 'Unauthorized'),
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.campaignId || !body.executorUserId) {
      return NextResponse.json(
        response(false, 400, undefined, 'Missing required fields: campaignId and executorUserId are required'),
        { status: 400 }
      );
    }

    // Check if campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: body.campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        response(false, 404, undefined, 'Campaign not found'),
        { status: 404 }
      );
    }

    // Check if executor user exists
    const executor = await prisma.user.findUnique({
      where: { id: body.executorUserId },
    });

    if (!executor) {
      return NextResponse.json(
        response(false, 404, undefined, 'Executor user not found'),
        { status: 404 }
      );
    }

    // Create the task using the service
    try {
      const task = await taskService.createTask({
        campaignId: body.campaignId,
        executorUserId: body.executorUserId,
        notes: body.notes,
        metadata: body.metadata,
      });

      return NextResponse.json(
        response(true, 201, undefined, 'Task created successfully', task),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        response(false, 500, undefined, 'Failed to create task'),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in tasks POST:', error);
    return NextResponse.json(
      response(false, 500, undefined, 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const executorUserId = searchParams.get('executorUserId');
    const status = searchParams.get('status') as TaskStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Use the task service to fetch tasks
    const result = await taskService.listTasks({
      campaignId: campaignId || undefined,
      executorUserId: executorUserId || undefined,
      status: status || undefined,
      page,
      limit,
    });

    return NextResponse.json(
      response(true, 200, undefined, 'Tasks retrieved successfully', result)
    );
  } catch (error) {
    console.error('Error in task list service:', error);
    return NextResponse.json(
      response(false, 500, undefined, 'Failed to retrieve tasks'),
      { status: 500 }
    );
  }
}