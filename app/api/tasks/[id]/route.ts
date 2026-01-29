import { NextResponse } from 'next/server';
import { taskService } from '@/services/tasks.services';
import { getAuthUser } from '@/lib/auth';
import { response } from '@/utils/response';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const task = await taskService.getTaskById(id);

    if (!task) {
      return NextResponse.json(
        response(false, 404, undefined, 'Task not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      response(true, 200, undefined, 'Task retrieved successfully', task)
    );
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      response(false, 500, undefined, 'Failed to fetch task'),
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    try {
      const updatedTask = await taskService.updateTask(id, data);
      return NextResponse.json(
        response(true, 200, undefined, 'Task updated successfully', updatedTask)
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'Task not found') {
        return NextResponse.json(
          response(false, 404, undefined, 'Task not found'),
          { status: 404 }
        );
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      response(false, 500, undefined, 'Failed to update task'),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    try {
      await taskService.deleteTask(id);
      return NextResponse.json(
        response(true, 200, undefined, 'Task deleted successfully')
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'Task not found') {
        return NextResponse.json(
          response(false, 404, undefined, 'Task not found'),
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      response(false, 500, undefined, 'Failed to delete task'),
      { status: 500 }
    );
  }
}