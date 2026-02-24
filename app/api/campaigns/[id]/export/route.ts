import { NextRequest, NextResponse } from 'next/server';
import { CampaignService } from '@/services/campaign.services';
import { authorize } from '@/lib/middleware';
import { ROLES } from '@/lib/roles';
import * as XLSX from 'xlsx';

type RequestHandler = (
  request: NextRequest,
  params: { params: { id: string } }
) => Promise<NextResponse>;

const campaignService = new CampaignService();

export const GET: RequestHandler = async (request, { params }) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await Promise.resolve(params);

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const authToken = request.headers.get('authorization')?.split(' ')[1] || '';
    const campaign = await campaignService.getCampaignById(id, authToken);

    if (!campaign.success || !campaign.data?.tasks) {
      return NextResponse.json(
        { success: false, message: 'No tasks found for this campaign' },
        { status: 404 }
      );
    }

    const formattedTasks = campaign.data!.tasks.map((task: any, index: number) => {
      const metadata = (task.metadata as any) || {};
      const location = metadata.location || {};
      
      // Also check if location data exists at the top level (fallback)
      const topLocation = {
        latitude: (task as any).latitude,
        longitude: (task as any).longitude,
        address: (task as any).address,
        accuracy: (task as any).accuracy
      };
      
      // Use metadata.location if available, otherwise use top-level location
      const finalLocation = location.latitude ? location : topLocation;

      let distance = "Unknown";
      if (index > 0) {
        const previousTask = campaign.data!.tasks[index - 1];
        const previousMetadata = (previousTask.metadata as any) || {};
        const previousLocation = previousMetadata.location || {};
        
        // Also check previous task's top-level location
        const previousTopLocation = {
          latitude: (previousTask as any).latitude,
          longitude: (previousTask as any).longitude,
          address: (previousTask as any).address,
          accuracy: (previousTask as any).accuracy
        };
        const finalPreviousLocation = previousLocation.latitude ? previousLocation : previousTopLocation;

        if (
          finalLocation.latitude &&
          finalLocation.longitude &&
          finalPreviousLocation.latitude &&
          finalPreviousLocation.longitude
        ) {
          const R = 6371000;
          const dLat = ((finalLocation.latitude - finalPreviousLocation.latitude) * Math.PI) / 180;
          const dLon = ((finalLocation.longitude - finalPreviousLocation.longitude) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((finalPreviousLocation.latitude * Math.PI) / 180) *
              Math.cos((finalLocation.latitude * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceInMeters = R * c;
          
          distance =
            distanceInMeters >= 1000
              ? `${(distanceInMeters / 1000).toFixed(1)}km`
              : `${Math.round(distanceInMeters)}m`;
        }
      } else {
        if (finalLocation.accuracy) {
          distance = `${Math.round(parseFloat(finalLocation.accuracy))}m`;
        }
      }

      let timeLater = "0s";
      if (index > 0) {
        const previousTask = campaign.data!.tasks[index - 1];
        const currentTime = new Date(task.createdAt).getTime();
        const previousTime = new Date(previousTask.createdAt).getTime();
        const timeDiffMs = currentTime - previousTime;

        if (timeDiffMs < 60000) {
          timeLater = `${Math.round(timeDiffMs / 1000)}s`;
        } else if (timeDiffMs < 3600000) {
          timeLater = `${Math.round(timeDiffMs / 60000)}m`;
        } else {
          timeLater = `${Math.round(timeDiffMs / 3600000)}h`;
        }
      }

      const taskData = {
        'Task ID': task.id,
        'Service Type': campaign.data!.serviceType || "N/A",
        'Completed Date': task.createdAt
          ? new Date(task.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Unknown",
        'Completed Time': task.createdAt
          ? new Date(task.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Unknown",
        'Location': (() => {
          const addr = finalLocation.address || campaign.data!.address || "Unknown Location";
          return addr.length > 200 ? addr.substring(0, 200) + '...' : addr;
        })(),
        'Latitude': finalLocation.latitude || "N/A",
        'Longitude': finalLocation.longitude || "N/A",
        'GPS Accuracy': finalLocation.accuracy ? `${finalLocation.accuracy}m` : "N/A",
        'In Geofence': finalLocation.accuracy
          ? parseFloat(finalLocation.accuracy) <= 100
            ? "Yes"
            : "No"
          : "Unknown",
        'Distance from Previous': distance,
        'Time from Previous': timeLater,
        'Executor Name': task.executor
          ? `${task.executor.firstName} ${task.executor.lastName}`
          : "Unknown Executor",
        'Executor ID': task.executor?.id || "unknown",
        'Images': metadata.images?.map((img: any) => {
          const url = img.url || '';
          return url.length > 100 ? url.substring(0, 100) + '...' : url;
        }).join(', ') || "N/A",
      };
      if (campaign.data!.serviceType?.toLowerCase() === 'auto hood') {
        return {
          ...taskData,
          'Driver Name': metadata.driverName || "N/A",
          'Phone Number': metadata.phoneNumber || "N/A",
          'Vehicle Number': metadata.vehicleNumber || "N/A",
        };
      }
      
      if (campaign.data!.serviceType?.toLowerCase() === 'gym') {
        return {
          ...taskData,
          'Gym Name': metadata.gymName || "N/A",
          'Gym Location': metadata.gymLocation || "N/A",
          'Monthly Fees': metadata.monthlyFees || "N/A",
          'Foot Fall': metadata.footFall || "N/A",
        };
      }
      
      return taskData;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedTasks);

    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    const campaignName = campaign.data!.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'campaign';
    const date = new Date().toISOString().split('T')[0];
    const filename = `${campaignName}_tasks_${date}.xlsx`;

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to export tasks';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
};
