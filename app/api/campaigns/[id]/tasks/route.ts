import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { response } from "@/utils/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;
    
    const resolvedParams = await Promise.resolve(params);
    const campaignId = resolvedParams.id;
    
    if (!campaignId) {
      return NextResponse.json(
        response(false, 400, undefined, 'Campaign ID is required'),
        { status: 400 }
      );
    }
    
    // Get all tasks for the campaign with executor information
    const tasks = await prisma.task.findMany({
      where: {
        campaignId,
      },
      include: {
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the tasks for the ReportCard component
    const formattedTasks = tasks.map(task => {
      const metadata = task.metadata as any || {};
      const location = metadata.location || {};
      
      return {
        id: task.id,
        taskId: task.id,
        productName: task.campaign.name || 'Campaign Task',
        productImage: metadata.images?.[0]?.url || '/path/to/product-image.jpg',
        date: task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }) : 'Unknown',
        time: task.createdAt ? new Date(task.createdAt).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : 'Unknown',
        location: location.address || task.campaign.address || 'Unknown Location',
        inGeofence: location.accuracy ? parseFloat(location.accuracy) <= 100 : true, // Assume in geofence if accuracy <= 100m
        distance: location.accuracy ? `${Math.round(parseFloat(location.accuracy))}m` : 'Unknown',
        timeLater: '0s', // You might want to calculate this based on previous task
        executorName: `${task.executor.firstName} ${task.executor.lastName}`,
        status: task.status,
        flagged: task.flagged,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        metadata: task.metadata,
      };
    });
    
    return NextResponse.json(
      response(true, 200, undefined, 'Tasks retrieved successfully', formattedTasks)
    );
  } catch (error: any) {
    console.error("Error fetching campaign tasks:", error);
    return NextResponse.json(
      response(false, error.status || 500, undefined, error.message || 'Failed to fetch tasks'),
      { status: error.status || 500 }
    );
  }
}
