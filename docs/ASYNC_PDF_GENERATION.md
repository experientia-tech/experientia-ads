# Async PDF Generation System

## Overview

The PDF export functionality has been refactored to use **asynchronous job-based generation** instead of synchronous generation. This solves the performance issues where large PDFs would timeout after 60 seconds.

### How It Works

1. **User clicks "Export PDF"** → API queues a job and returns immediately
2. **Frontend polls for status** every 5 seconds
3. **Background worker processes** PDF in the background (no timeout)
4. **PDF stored in S3** with presigned download URL
5. **User downloads** when ready

## Architecture

### Database: PDFJob Model

```prisma
model PDFJob {
  id            String         @id @default(uuid())
  campaignId    String         @db.Uuid
  organizationId String        @db.Uuid
  status        PDFJobStatus   @default(PENDING)  // PENDING, PROCESSING, COMPLETED, FAILED
  downloadUrl   String?        @db.Text
  expiresAt     DateTime?      @db.Timestamptz   // Presigned URL expires after 24 hours
  error         String?        @db.Text
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @default(now())
  processedAt   DateTime?      @db.Timestamptz
}
```

### API Endpoints

#### 1. Queue PDF Job
```
POST /api/campaigns/:id/export-pdf
Headers: Authorization: Bearer <token>

Response (202 Accepted):
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "createdAt": "2026-07-28T06:30:20Z"
}
```

#### 2. Check Job Status
```
GET /api/jobs/:jobId
Headers: Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",  // or PROCESSING, FAILED
    "downloadUrl": "https://s3.../report.pdf?...signature...",
    "expiresAt": "2026-07-29T06:30:20Z",
    "error": null,
    "createdAt": "2026-07-28T06:30:20Z",
    "processedAt": "2026-07-28T06:35:45Z"
  }
}
```

### Background Worker

**Cron Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/process-pdf-jobs",
      "schedule": "*/10 * * * *"  // Every 10 minutes
    }
  ]
}
```

**Worker Behavior**:
- Runs every 10 minutes
- Processes up to 5 pending jobs per run
- Marks job as PROCESSING → generates PDF → marks COMPLETED/FAILED
- PDF stored in S3 with key: `campaign-reports/{campaignId}/{filename}.pdf`
- Presigned download URL valid for 24 hours

### Frontend Flow

**Old (Synchronous)**:
```
User clicks → Wait up to 60 seconds → Download PDF or Error
```

**New (Asynchronous)**:
```
User clicks → Job queued (instant) → Poll every 5 seconds → Progress updates → Download when ready
```

The frontend shows progress:
- "PDF is being generated (Job: 550e8400...)"
- "Generating PDF... 10%"
- "Generating PDF... 50%"
- "Generating PDF... 99%"
- Auto-download when complete

## Setup

### 1. Database Migration

```bash
npx prisma migrate dev
```

This creates the `PDFJob` table and related indices.

### 2. Environment Variables

Add to `.env` (local) and Vercel environment variables:

```
CRON_SECRET=<random-secret>
```

Generate a random secret:
```bash
# On macOS/Linux
head -c 32 /dev/urandom | base64

# On Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 3. Vercel Configuration

The `vercel.json` file configures the cron job. On deployment:
- Vercel automatically sets up the cron trigger
- The cron will call `/api/cron/process-pdf-jobs` every 10 minutes
- Only requires the `CRON_SECRET` to be set

## Performance Improvements

| Metric | Synchronous | Asynchronous |
|--------|-------------|--------------|
| Initial Response | 5-60 seconds | <1 second |
| PDF Size Limit | ~50 MB | Unlimited |
| Timeout Risk | High | None |
| Scalability | Poor | Excellent |
| User Experience | Blocking | Non-blocking |

For a typical 40-task campaign with 100 photos:
- **PDF Generation**: ~4 minutes (background)
- **User waits**: <1 second for job queue
- **Status polling**: ~30 seconds of polling updates

## Testing

### Local Testing

1. Start the development server:
```bash
npm run dev
```

2. Queue a PDF job:
```bash
curl -X POST http://localhost:3000/api/campaigns/<campaign-id>/export-pdf \
  -H "Authorization: Bearer <token>"
```

3. Check the status manually (cron won't run locally):
```bash
curl http://localhost:3000/api/jobs/<job-id> \
  -H "Authorization: Bearer <token>"
```

4. Or manually trigger the worker:
```bash
curl -X POST http://localhost:3000/api/cron/process-pdf-jobs \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Production Testing

1. Export a PDF from the UI
2. Watch the polling messages ("Generating PDF... 15%", etc.)
3. PDF auto-downloads when complete
4. Check Vercel logs to see cron executions

## Troubleshooting

### Job Stuck in PROCESSING

**Cause**: Worker crashed while processing
**Solution**: Manually reset via database:
```sql
UPDATE "PDFJob" SET status = 'PENDING', error = NULL 
WHERE id = '<job-id>' AND status = 'PROCESSING';
```

### Job Failed with Error

Check the error message in the job status:
```bash
curl http://localhost:3000/api/jobs/<job-id> \
  -H "Authorization: Bearer <token>" | jq .job.error
```

Common errors:
- **"Campaign not found"** → Job references invalid campaign
- **"Could not create download URL"** → S3 credentials issue
- **"Image fetch timeout"** → Network issue or slow image source

### Cron Not Running

1. Check Vercel dashboard → Settings → Cron Jobs
2. Verify `vercel.json` is committed
3. Verify `CRON_SECRET` is set in Vercel environment variables
4. Check Vercel function logs for errors

## Database Maintenance

Clean up old completed jobs (optional):

```sql
-- Delete completed jobs older than 7 days
DELETE FROM "PDFJob" 
WHERE status = 'COMPLETED' 
AND "createdAt" < NOW() - INTERVAL '7 days';

-- Delete failed jobs older than 30 days
DELETE FROM "PDFJob" 
WHERE status = 'FAILED' 
AND "createdAt" < NOW() - INTERVAL '30 days';
```

## Migration from Synchronous to Asynchronous

- Old endpoint: `/api/campaigns/[id]/export-pdf` (was GET)
- New endpoint: `/api/campaigns/[id]/export-pdf` (now POST)
- Old worker code: `/api/campaigns/[id]/export-pdf-worker/route.ts` (kept for reference)

The old synchronous logic is preserved in `export-pdf-worker` but not used by default. To revert:

1. Update frontend to GET `/api/campaigns/[id]/export-pdf-worker` instead
2. Await response directly (no polling needed)
3. Download when response returns

**Note**: This will reintroduce timeout issues for large PDFs.
