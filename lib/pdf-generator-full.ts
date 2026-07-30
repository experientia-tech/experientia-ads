import { CampaignService } from "@/services/campaign.services";
import { getPresignedGetUrl, uploadStreamToS3 } from "@/utils/s3";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { prisma } from "@/lib/prisma";

const campaignService = new CampaignService();
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const CHUNK_SIZE = parseInt(process.env.PDF_CHUNK_SIZE || "100");
const CONCURRENT_FETCHES = parseInt(process.env.PDF_MAX_CONCURRENT_FETCHES || "10");
const TIMEOUT_MS = parseInt(process.env.PDF_FETCH_TIMEOUT_MS || "15000");

const C = {
  dark: "#1e293b",
  blue: "#2563eb",
  blueDark: "#1d4ed8",
  red: "#dc2626",
  green: "#16a34a",
  amber: "#d97706",
  muted: "#64748b",
  border: "#e2e8f0",
  panel: "#f8fafc",
  white: "#ffffff",
};

/**
 * Task photos and brand logos live in a private S3 bucket, so the stored
 * `https://<bucket>.s3.<region>.amazonaws.com/<key>` URL is not fetchable as-is
 * (S3 answers 403). Swap it for a short-lived presigned GET URL before fetching.
 * Data URLs and non-S3 URLs (e.g. Mapbox statics) are passed through untouched.
 */
async function signIfS3(url: string): Promise<string> {
  if (!url || url.startsWith("data:")) return url;
  if (!/\.amazonaws\.com\//.test(url) && url.startsWith("http")) return url;
  return (await getPresignedGetUrl(url, 3600)) ?? url;
}

async function fetchWithRetry(url: string, maxRetries = 3, timeoutMs = TIMEOUT_MS): Promise<Buffer | null> {
  if (!url) return null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (url.startsWith("data:image/")) {
        const base64Data = url.split(",")[1];
        return Buffer.from(base64Data, "base64");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.log(`[PDF] Fetch attempt ${attempt + 1}/${maxRetries} failed with status ${res.status}`);
      } else {
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (error) {
      console.log(
        `[PDF] Fetch attempt ${attempt + 1}/${maxRetries} threw:`,
        error instanceof Error ? error.message : String(error)
      );
    }

    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 5000)));
    }
  }

  console.error(`[PDF] Giving up on asset after ${maxRetries} attempts: ${url.split("?")[0]}`);
  return null;
}

async function parallelFetch(urls: string[], concurrency = CONCURRENT_FETCHES): Promise<(Buffer | null)[]> {
  const results: (Buffer | null)[] = new Array(urls.length).fill(null);
  const inProgress = new Set<number>();

  const processQueue = async () => {
    for (let i = 0; i < urls.length; i++) {
      if (inProgress.has(i)) continue;

      while (inProgress.size >= concurrency) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      inProgress.add(i);
      (async () => {
        try {
          results[i] = await fetchWithRetry(urls[i]);
        } finally {
          inProgress.delete(i);
        }
      })();
    }

    while (inProgress.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  await processQueue();
  return results;
}

function singleMarkerMapUrl(lat: number, lng: number, width: number, height: number): string | null {
  if (!MAPBOX_TOKEN) return null;
  const marker = `pin-l+2563eb(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${lng},${lat},14,0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
}

function clusterMapUrl(points: { lat: number; lng: number }[], width: number, height: number): string | null {
  if (!MAPBOX_TOKEN || points.length === 0) return null;
  const capped = points.slice(0, 100);
  const markers = capped.map((p) => `pin-s+2563eb(${p.lng},${p.lat})`).join(",");
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers}/auto/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
}

function fillRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color: string) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function strokeRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color: string, lw = 0.5) {
  doc.save().rect(x, y, w, h).lineWidth(lw).strokeColor(color).stroke().restore();
}

function shortReference(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

interface TaskLocation {
  latitude: number | string;
  longitude: number | string;
  address?: string;
}

function taskLocation(task: any): TaskLocation {
  const meta = (task.metadata as any) || {};
  return meta.location?.latitude
    ? meta.location
    : {
        latitude: task.latitude,
        longitude: task.longitude,
        address: task.address,
      };
}

export async function generateFullCampaignPDF(
  campaignId: string,
  jobId: string,
  authToken: string = ""
): Promise<{ key: string; downloadUrl: string; filename: string }> {
  console.log(`[PDF] Starting full PDF generation for campaign ${campaignId}, job ${jobId}`);

  try {
    const campaign = await campaignService.getCampaignById(campaignId, authToken);

    if (!campaign.success || !campaign.data) {
      throw new Error("Campaign not found");
    }

    const data = campaign.data;
    const allTasks: any[] = (data.tasks || []).sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    console.log(`[PDF] Total tasks to process: ${allTasks.length}`);

    await prisma.pDFJob.update({
      where: { id: jobId },
      data: { totalTasks: allTasks.length, status: "PROCESSING" },
    });

    const ML = 40;
    const MR = 40;
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      compress: true,
      autoFirstPage: false,
    });

    const slug = (data.name || "campaign").replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${slug}_report_${dateStr}.pdf`;
    const s3Key = `campaign-reports/${campaignId}/${filename}`;

    const pdfStream = new PassThrough();
    doc.on("error", (err) => pdfStream.destroy(err));
    doc.pipe(pdfStream);

    const uploadPromise = uploadStreamToS3({
      key: s3Key,
      body: pdfStream,
      contentType: "application/pdf",
    });

    const PW = 595.28;
    const PH = 841.89;
    const CW = PW - ML - MR;
    const BAR_H = 6;

    const drawBars = () => {
      fillRect(doc, 0, 0, PW, BAR_H, C.blue);
      fillRect(doc, 0, PH - BAR_H, PW, BAR_H, C.blue);
    };

    // COVER PAGE
    console.log(`[PDF] Generating cover page`);
    let logoBuffer: Buffer | null = null;
    if (data.logo) {
      logoBuffer = await fetchWithRetry(await signIfS3(data.logo), 3, 10000);
    }
    if (!logoBuffer) {
      const fallbackLogoUrl = "https://experientia-ads.vercel.app/experientia.png";
      logoBuffer = await fetchWithRetry(fallbackLogoUrl, 3, 10000);
    }

    doc.addPage({ size: "A4", margin: 0 });
    drawBars();

    let curY = 28;

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, ML, curY, { fit: [110, 32] });
      } catch (err) {
        console.log("[PDF] Failed to render logo");
      }
    } else {
      doc
        .save()
        .fill(C.dark)
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("EXPERIENTIA", ML, curY)
        .restore();
    }

    const genDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    doc
      .save()
      .fill(C.muted)
      .fontSize(9)
      .font("Helvetica")
      .text(`Report generated on ${genDate}`, ML, curY + 10, {
        width: CW,
        align: "right",
      })
      .restore();

    curY += 46;
    doc
      .save()
      .moveTo(ML, curY)
      .lineTo(PW - MR, curY)
      .lineWidth(1)
      .strokeColor(C.blue)
      .stroke()
      .restore();

    curY += 70;
    doc
      .save()
      .fill(C.dark)
      .fontSize(30)
      .font("Helvetica-Bold")
      .text(data.name || "Untitled Campaign", ML, curY, {
        width: CW,
        align: "center",
      })
      .restore();

    curY = doc.y + 30;

    // Cover map
    const coverPoints = allTasks
      .map((t) => taskLocation(t))
      .filter((l) => l.latitude && l.longitude)
      .map((l) => ({ lat: Number(l.latitude), lng: Number(l.longitude) }));

    const coverMapW = CW;
    const coverMapH = 260;
    const coverMapUrl = clusterMapUrl(coverPoints, Math.round(coverMapW), Math.round(coverMapH));
    const coverMapBuffer = coverMapUrl ? await fetchWithRetry(coverMapUrl) : null;

    if (coverMapBuffer) {
      try {
        doc.save().roundedRect(ML, curY, coverMapW, coverMapH, 10).clip();
        doc.image(coverMapBuffer, ML, curY, {
          width: coverMapW,
          height: coverMapH,
        });
        doc.restore();
        strokeRect(doc, ML, curY, coverMapW, coverMapH, C.border, 0.5);
      } catch (err) {
        fillRect(doc, ML, curY, coverMapW, coverMapH, C.panel);
        strokeRect(doc, ML, curY, coverMapW, coverMapH, C.border, 0.5);
      }
    } else {
      fillRect(doc, ML, curY, coverMapW, coverMapH, C.panel);
      strokeRect(doc, ML, curY, coverMapW, coverMapH, C.border, 0.5);
    }

    curY += coverMapH + 24;

    const completedCount = allTasks.filter(
      (t: any) => (t.status || "").toUpperCase() === "ACCEPTED"
    ).length;
    const totalTasks = data.totalTasks || allTasks.length || 1;
    const progress = Math.round((completedCount / totalTasks) * 100);

    const statCards = [
      { label: "Service Type", value: data.serviceType || "Campaign" },
      { label: "Locations", value: String(totalTasks) },
      { label: "Verified", value: String(completedCount) },
      { label: "Completion", value: `${progress}%` },
    ];

    const cardGap = 12;
    const cardW = (CW - cardGap * (statCards.length - 1)) / statCards.length;
    const cardH = 78;

    statCards.forEach((card, i) => {
      const cx = ML + i * (cardW + cardGap);
      fillRect(doc, cx, curY, cardW, cardH, C.panel);
      strokeRect(doc, cx, curY, cardW, cardH, C.border, 0.5);

      doc
        .save()
        .fill(C.dark)
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(card.value, cx + 6, curY + 22, {
          width: cardW - 12,
          align: "center",
        })
        .restore();

      doc
        .save()
        .fill(C.red)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(card.label, cx + 6, curY + 48, {
          width: cardW - 12,
          align: "center",
        })
        .restore();
    });

    // PHOTO PAGES (chunked processing)
    console.log(`[PDF] Processing tasks in chunks of ${CHUNK_SIZE}`);

    const tasksWithImages = allTasks;

    let processedCount = 0;
    const miniMapW = CW - CW * 0.44 - 24;
    const miniMapH = 180;

    for (let chunkStart = 0; chunkStart < tasksWithImages.length; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, tasksWithImages.length);
      const chunk = tasksWithImages.slice(chunkStart, chunkEnd);

      console.log(`[PDF] Processing chunk: tasks ${chunkStart}-${chunkEnd}`);

      const allImageUrls: string[] = [];
      const imageToTaskMap: { taskIndex: number; imageIndex: number }[] = [];

      chunk.forEach((task, taskIdx) => {
        const meta = (task.metadata as any) || {};
        const images = meta.images || [];

        images.forEach((img: any) => {
          allImageUrls.push(typeof img.url === "string" ? img.url : "");
          imageToTaskMap.push({ taskIndex: taskIdx, imageIndex: imageToTaskMap.filter((m) => m.taskIndex === taskIdx).length });
        });
      });

      // Presign before fetching — these are private S3 objects.
      const signedImageUrls = await Promise.all(allImageUrls.map(signIfS3));
      const fetchedImages = await parallelFetch(signedImageUrls, CONCURRENT_FETCHES);

      const missing = fetchedImages.filter((b) => !b).length;
      if (missing > 0) {
        console.error(`[PDF] ${missing}/${signedImageUrls.length} task photos could not be fetched in this chunk`);
      }

      // Fetch mini maps for this chunk
      const locationToBuffer = new Map<string, Buffer | null>();
      const uniqueLocations = new Map<string, { lat: number; lng: number }>();

      chunk.forEach((task) => {
        const loc = taskLocation(task);
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude}|${loc.longitude}`;
          if (!uniqueLocations.has(key)) {
            uniqueLocations.set(key, {
              lat: Number(loc.latitude),
              lng: Number(loc.longitude),
            });
          }
        }
      });

      const mapUrls = Array.from(uniqueLocations.entries()).map(([key, loc]) => ({
        key,
        url: singleMarkerMapUrl(loc.lat, loc.lng, Math.round(miniMapW), Math.round(miniMapH)),
      }));

      const mapBuffers = await parallelFetch(
        mapUrls.map((m) => m.url).filter((u) => u !== null) as string[],
        CONCURRENT_FETCHES
      );

      mapUrls.forEach((m, idx) => {
        locationToBuffer.set(m.key, mapBuffers[idx] || null);
      });

      // Add pages for this chunk
      for (let i = 0; i < chunk.length; i++) {
        const task = chunk[i];
        const meta = (task.metadata as any) || {};
        const images = meta.images || [];

        const numPages = Math.max(1, images.length);

        for (let imgIdx = 0; imgIdx < numPages; imgIdx++) {
          const globalImgIndex = imageToTaskMap.findIndex((m) => m.taskIndex === i && m.imageIndex === imgIdx);

          const buffer = globalImgIndex !== -1 ? fetchedImages[globalImgIndex] : null;

          doc.addPage({ size: "A4", margin: 0 });
          drawBars();

          let py = 24;

          if (logoBuffer) {
            try {
              doc.image(logoBuffer, ML, py, { fit: [70, 20] });
            } catch (err) {
              // skip
            }
          }

          const headerRight = `${data.name?.slice(0, 40) || "Campaign"}   •   ${data.serviceType || "Campaign"}   •   ${processedCount + 1}`;
          doc
            .save()
            .fill(C.muted)
            .fontSize(8)
            .font("Helvetica")
            .text(headerRight, ML, py + 5, { width: CW, align: "right" })
            .restore();

          py += 32;
          doc
            .save()
            .moveTo(ML, py)
            .lineTo(PW - MR, py)
            .lineWidth(0.5)
            .strokeColor(C.border)
            .stroke()
            .restore();
          py += 20;

          const colGap = 24;
          const leftW = CW * 0.44;
          const rightW = CW - leftW - colGap;
          const rightX = ML + leftW + colGap;
          const bodyH = PH - py - 40;

          fillRect(doc, ML, py, leftW, bodyH, "#0f172a");
          try {
            if (!buffer) throw new Error("No image buffer available");
            doc.image(buffer, ML, py, {
              fit: [leftW, bodyH],
              align: "center",
              valign: "center",
            });
          } catch (imgErr) {
            doc
              .save()
              .fill(C.muted)
              .fontSize(9)
              .font("Helvetica")
              .text("Image rendering failed", ML, py + bodyH / 2 - 5, {
                width: leftW,
                align: "center",
              })
              .restore();
          }
          strokeRect(doc, ML, py, leftW, bodyH, C.border, 0.5);

          let ry = py;
          const loc = taskLocation(task);
          const completedDate = task.completedAt || task.createdAt;

          doc
            .save()
            .fill(C.muted)
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("COMPLETED", rightX, ry)
            .restore();
          doc
            .save()
            .fill(C.muted)
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("REFERENCE", rightX, ry, { width: rightW, align: "right" })
            .restore();
          ry += 12;
          doc
            .save()
            .fill(C.dark)
            .fontSize(13)
            .font("Helvetica-Bold")
            .text(
              completedDate
                ? new Date(completedDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—",
              rightX,
              ry
            )
            .restore();
          doc
            .save()
            .fill(C.dark)
            .fontSize(13)
            .font("Helvetica-Bold")
            .text(shortReference(task.id), rightX, ry, {
              width: rightW,
              align: "right",
            })
            .restore();

          ry += 24;
          doc
            .save()
            .moveTo(rightX, ry)
            .lineTo(rightX + rightW, ry)
            .lineWidth(0.5)
            .strokeColor(C.border)
            .stroke()
            .restore();
          ry += 16;

          doc
            .save()
            .fill(C.muted)
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("LOCATION", rightX, ry)
            .restore();
          ry += 12;
          doc
            .save()
            .fill(C.dark)
            .fontSize(10)
            .font("Helvetica")
            .text(loc.address || data.address || "Unknown location", rightX, ry, {
              width: rightW,
            })
            .restore();
          ry = doc.y + 12;

          if (loc.latitude && loc.longitude) {
            const key = `${loc.latitude}|${loc.longitude}`;
            const mapBuffer = locationToBuffer.get(key);

            if (mapBuffer) {
              try {
                doc.save().roundedRect(rightX, ry, miniMapW, miniMapH, 8).clip();
                doc.image(mapBuffer, rightX, ry, {
                  width: miniMapW,
                  height: miniMapH,
                });
                doc.restore();
                strokeRect(doc, rightX, ry, miniMapW, miniMapH, C.border, 0.5);
              } catch (mapErr) {
                doc.restore();
                fillRect(doc, rightX, ry, miniMapW, miniMapH, C.panel);
                strokeRect(doc, rightX, ry, miniMapW, miniMapH, C.border, 0.5);
              }
            } else {
              fillRect(doc, rightX, ry, miniMapW, miniMapH, C.panel);
              strokeRect(doc, rightX, ry, miniMapW, miniMapH, C.border, 0.5);
              doc
                .save()
                .fill(C.muted)
                .fontSize(8)
                .font("Helvetica")
                .text(
                  `${Number(loc.latitude).toFixed(6)}, ${Number(loc.longitude).toFixed(6)}`,
                  rightX,
                  ry + miniMapH / 2 - 4,
                  { width: miniMapW, align: "center" }
                )
                .restore();
            }

            ry += miniMapH + 16;

            const btnH = 30;
            fillRect(doc, rightX, ry, miniMapW, btnH, C.blue);
            doc
              .save()
              .fill(C.white)
              .fontSize(10)
              .font("Helvetica-Bold")
              .text("Open in Google Maps", rightX, ry + 10, {
                width: miniMapW,
                align: "center",
              })
              .restore();
            doc.link(
              rightX,
              ry,
              miniMapW,
              btnH,
              `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`
            );
          }

          processedCount++;
        }
      }

      await prisma.pDFJob.update({
        where: { id: jobId },
        data: { processedTasks: processedCount },
      });

      console.log(`[PDF] Chunk complete. Progress: ${processedCount}/${tasksWithImages.length}`);
    }

    // THANK YOU PAGE
    doc.addPage({ size: "A4", margin: 0 });
    drawBars();

    let ty = 140;
    doc
      .save()
      .fill(C.dark)
      .fontSize(40)
      .font("Helvetica-Bold")
      .text("Thank You", ML, ty, { width: CW, align: "center" })
      .restore();

    ty += 60;
    doc
      .save()
      .fill(C.muted)
      .fontSize(11)
      .font("Helvetica")
      .text("This report was prepared for", ML, ty, {
        width: CW,
        align: "center",
      })
      .restore();

    ty += 18;
    doc
      .save()
      .fill(C.dark)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(data.name || "Untitled Campaign", ML, ty, {
        width: CW,
        align: "center",
      })
      .restore();

    ty += 60;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, ML + CW / 2 - 70, ty, {
          fit: [140, 40],
        });
      } catch (logoErr) {
        // skip
      }
      ty += 60;
    }

    doc
      .save()
      .moveTo(ML, ty)
      .lineTo(PW - MR, ty)
      .lineWidth(0.5)
      .strokeColor(C.border)
      .stroke()
      .restore();
    ty += 16;

    doc
      .save()
      .fill(C.muted)
      .fontSize(9)
      .font("Helvetica")
      .text("Powered by Experientia — field campaign reporting & monitoring", ML, ty, {
        width: CW,
        align: "center",
      })
      .restore();

    doc.end();

    await uploadPromise;

    const downloadUrl = await getPresignedGetUrl(s3Key, 7200, `attachment; filename="${filename}"`);

    if (!downloadUrl) {
      throw new Error("Could not create download URL for generated PDF");
    }

    console.log(`[PDF] Successfully completed full PDF generation for campaign ${campaignId}`);

    return { key: s3Key, downloadUrl, filename };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[PDF] Error generating full PDF:`, errorMsg);
    throw error;
  }
}
