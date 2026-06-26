import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { response } from "@/utils/response";
import { prisma } from "@/lib/prisma";

type RequestHandler = (
  request: NextRequest,
  params: { params: { id: string } }
) => Promise<NextResponse>;

export const PATCH: RequestHandler = async (request, { params }) => {
  try {
    // 1. Authorize user (must be ADMIN or SUPERVISOR)
    const auth = authorize(request, [ROLES.ADMIN, ROLES.SUPERVISOR]);
    if (auth instanceof NextResponse) return auth;

    const resolvedParams = await Promise.resolve(params);
    const taskId = resolvedParams.id;

    if (!taskId) {
      return NextResponse.json(
        response(false, 400, undefined, "Task ID is required"),
        { status: 400 }
      );
    }

    // 2. Parse body
    const body = await request.json();
    const { status, rejectionReason, images } = body;

    // 3. Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json(
        response(false, 404, undefined, "Task not found"),
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      if (!["ACCEPTED", "REJECTED"].includes(status)) {
        return NextResponse.json(
          response(
            false,
            400,
            undefined,
            "Invalid status. Must be 'ACCEPTED' or 'REJECTED'"
          ),
          { status: 400 }
        );
      }
      updateData.status = status;
      updateData.rejectionReason = status === "REJECTED" ? rejectionReason || "" : null;
      updateData.completedAt = status === "ACCEPTED" ? new Date() : null;
    }

    if (images) {
      if (!Array.isArray(images)) {
        return NextResponse.json(
          response(false, 400, undefined, "Images must be an array"),
          { status: 400 }
        );
      }
      const currentMetadata = (existingTask.metadata as any) || {};
      updateData.metadata = {
        ...currentMetadata,
        images: images,
      };
    }

    // 4. Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    return NextResponse.json(
      response(true, 200, undefined, "Task updated successfully", updatedTask)
    );
  } catch (error) {
    console.error("Error updating task status:", error);
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      response(
        false,
        err.status || 500,
        undefined,
        err.message || "Failed to update task status"
      ),
      { status: err.status || 500 }
    );
  }
};
