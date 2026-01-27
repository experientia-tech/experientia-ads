import { prisma } from "../lib/prisma";
import { TaskStatus } from "../app/generated/prisma/client";

type CreateTaskInput = {
  campaignId: string;
  executorUserId: string;
  notes?: string;
  metadata?: any;
};

type UpdateTaskInput = {
  status?: TaskStatus;
  notes?: string;
  rejectionReason?: string;
  flagged?: boolean;
  metadata?: any;
};
//create task
export const taskService = {
  async createTask(data: CreateTaskInput) {
    return prisma.task.create({
      data: {
        campaignId: data.campaignId,
        executorUserId: data.executorUserId,
        notes: data.notes,
        metadata: data.metadata,
      },
      include: {
        campaign: true,
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  },

  //get task by id
  async getTaskById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        campaign: true,
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  },

  //Update a task
  async updateTask(id: string, data: UpdateTaskInput) {
    const updateData: any = { ...data };

    // Handle status-specific updates
    if (data.status === TaskStatus.IN_PROGRESS && !data.status) {
      updateData.startedAt = new Date();
    } else if (data.status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        campaign: true,
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  },

  //Delete a task
  async deleteTask(id: string) {
    return prisma.task.delete({
      where: { id },
    });
  },

  //List tasks with optional filters
  async listTasks(filters: {
    campaignId?: string;
    executorUserId?: string;
    status?: TaskStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.executorUserId) where.executorUserId = filters.executorUserId;
    if (filters.status) where.status = filters.status;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
          executor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

export default taskService;
