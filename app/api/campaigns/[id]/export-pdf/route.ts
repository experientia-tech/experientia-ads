import { NextRequest, NextResponse } from "next/server";
import { CampaignService } from "@/services/campaign.services";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import { getPresignedGetUrl, uploadStreamToS3 } from "@/utils/s3";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { PassThrough } from "stream";

type RequestHandler = (
  request: NextRequest,
  params: { params: { id: string } }
) => Promise<NextResponse>;

const campaignService = new CampaignService();

// ─── Colours (Experientia brand) ───────────────────────────────────────────────
const C = {
  dark:     "#1e293b",
  blue:     "#2563eb",
  blueDark: "#1d4ed8",
  red:      "#dc2626",
  green:    "#16a34a",
  amber:    "#d97706",
  muted:    "#64748b",
  border:   "#e2e8f0",
  panel:    "#f8fafc",
  white:    "#ffffff",
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function shortReference(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

// ─── Draw helpers ───────────────────────────────────────────────────────────────
function fillRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color: string) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function strokeRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color: string, lw = 0.5) {
  doc.save().rect(x, y, w, h).lineWidth(lw).strokeColor(color).stroke().restore();
}

function clampText(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

// ─── Fetch any image (S3/http/data URL) as a Buffer ────────────────────────────
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("data:image/")) {
      const base64Data = url.split(",")[1];
      return Buffer.from(base64Data, "base64");
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Failed to fetch image from ${url}:`, error);
    return null;
  }
}

// ─── Mapbox Static Images helpers ──────────────────────────────────────────────
function singleMarkerMapUrl(lat: number, lng: number, width: number, height: number): string | null {
  if (!MAPBOX_TOKEN) return null;
  const marker = `pin-l+2563eb(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${lng},${lat},14,0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
}

function clusterMapUrl(points: { lat: number; lng: number }[], width: number, height: number): string | null {
  if (!MAPBOX_TOKEN || points.length === 0) return null;
  // Mapbox overlays have a practical marker cap; 100 keeps the URL well within limits.
  const capped = points.slice(0, 100);
  const markers = capped.map((p) => `pin-s+2563eb(${p.lng},${p.lat})`).join(",");
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers}/auto/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
}

const __t0 = () => Date.now();
const __log = (label: string, start: number) => fs.appendFileSync("/tmp/pdf-timing.log", `${label}: ${Date.now() - start}ms\n`);

export const GET: RequestHandler = async (request, { params }) => {
  const __reqStart = __t0();
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await Promise.resolve(params);
    if (!id) {
      return NextResponse.json({ success: false, message: "Campaign ID is required" }, { status: 400 });
    }

    const authToken = request.headers.get("authorization")?.split(" ")[1] || "";
    const __tCampaign = __t0();
    const campaign  = await campaignService.getCampaignById(id, authToken);
    __log("campaign fetch", __tCampaign);

    if (!campaign.success || !campaign.data) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 });
    }

    const data  = campaign.data;
    const tasks: any[] = (data.tasks || []).sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Resolve each task's location the same way regardless of where it's stored.
    const taskLocation = (task: any) => {
      const meta = (task.metadata as any) || {};
      return meta.location?.latitude
        ? meta.location
        : { latitude: task.latitude, longitude: task.longitude, address: task.address };
    };

    // ── Flatten every photo across every task into one page-per-photo list ─────
    const tasksWithImages = tasks.filter((t: any) => {
      const meta = (t.metadata as any) || {};
      return (meta.images || []).length > 0;
    });

    type PhotoEntry = { task: any; buffer: Buffer; view?: string | null };

    // Fetch every task's images concurrently instead of one task at a time —
    // sequential per-task fetching turned a 40-task campaign into 60s+ of
    // serial network I/O, which routinely exceeded the Lambda/CloudFront
    // timeout and surfaced as a bare "Internal Server Error".
    const __tImages = __t0();
    const perTaskPhotos = await Promise.all(
      tasksWithImages.map(async (task: any) => {
        const taskMeta = (task.metadata as any) || {};
        const taskImages = taskMeta.images || [];

        const resolved = await Promise.all(
          taskImages.map(async (img: any) => {
            const src =
              typeof img.url === "string" && img.url.startsWith("http")
                ? (await getPresignedGetUrl(img.url)) ?? img.url
                : img.url;
            const buffer = await fetchImageBuffer(src);
            return buffer ? { buffer, view: img.view ?? null } : null;
          })
        );

        return resolved
          .filter((r): r is { buffer: Buffer; view: string | null } => !!r)
          .map((r) => ({ task, buffer: r.buffer, view: r.view }));
      })
    );
    __log("task image fetch (parallel)", __tImages);

    const photoEntries: PhotoEntry[] = perTaskPhotos.flat();

    // ── Cover stats ──────────────────────────────────────────────────────────
    const completedCount = tasks.filter((t: any) => (t.status || "").toUpperCase() === "ACCEPTED").length;
    const totalTasks     = data.totalTasks || tasks.length || 1;
    const progress        = Math.round((completedCount / totalTasks) * 100);

    const coverPoints = tasks
      .map((t) => taskLocation(t))
      .filter((l) => l.latitude && l.longitude)
      .map((l) => ({ lat: Number(l.latitude), lng: Number(l.longitude) }));

    // ── PDF setup ─────────────────────────────────────────────────────────────
    const ML = 40;
    const MR = 40;
    const MT = 40;
    const doc = new PDFDocument({ size: "A4", margin: 0, compress: true, autoFirstPage: false });

    // Stream pages straight to S3 as pdfkit produces them instead of buffering
    // the whole PDF in memory and returning it inline — large campaigns can
    // produce multi-hundred-page reports that blow past the Lambda response
    // payload limit, which is what was surfacing as a bare "Internal Server
    // Error" for those campaigns.
    const slug     = (data.name || "campaign").replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr  = new Date().toISOString().split("T")[0];
    const filename = `${slug}_report_${dateStr}.pdf`;
    const s3Key    = `campaign-reports/${id}/${filename}`;

    const pdfStream = new PassThrough();
    // .pipe() doesn't forward "error" events from the source, so without this
    // a PDFKit failure mid-generation would leave the S3 upload hanging
    // instead of rejecting.
    doc.on("error", (err) => pdfStream.destroy(err));
    doc.pipe(pdfStream);
    const __tUpload = __t0();
    const uploadPromise = uploadStreamToS3({
      key: s3Key,
      body: pdfStream,
      contentType: "application/pdf",
    });

    // A4 in points — fixed, so these are safe to read before any page exists
    // (autoFirstPage is off; doc.page is null until the first addPage()).
    const PW = 595.28;
    const PH = 841.89;
    const CW = PW - ML - MR;

    const BAR_H = 6;

    const drawBars = () => {
      fillRect(doc, 0, 0, PW, BAR_H, C.blue);
      fillRect(doc, 0, PH - BAR_H, PW, BAR_H, C.blue);
    };

    const logoPath = path.join(process.cwd(), "public", "experientia.png");
    const logoBuffer = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;

    // ═══════════════════════════════════════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════════════════════════════════════
    doc.addPage({ size: "A4", margin: 0 });
    drawBars();

    let curY = 28;

    let logoDrawn = false;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, ML, curY, { fit: [110, 32] });
        logoDrawn = true;
      } catch (logoErr) {
        console.error("Failed to render logo in PDF:", logoErr);
      }
    }
    if (!logoDrawn) {
      doc.save().fill(C.dark).fontSize(16).font("Helvetica-Bold").text("EXPERIENTIA", ML, curY).restore();
    }

    const genDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    doc.save()
      .fill(C.muted)
      .fontSize(9)
      .font("Helvetica")
      .text(`Report generated on ${genDate}`, ML, curY + 10, { width: CW, align: "right" })
      .restore();

    curY += 46;
    doc.save().moveTo(ML, curY).lineTo(PW - MR, curY).lineWidth(1).strokeColor(C.blue).stroke().restore();

    curY += 70;
    doc.save()
      .fill(C.dark)
      .fontSize(30)
      .font("Helvetica-Bold")
      .text(data.name || "Untitled Campaign", ML, curY, { width: CW, align: "center" })
      .restore();

    curY = doc.y + 30;

    // Cover map (all task locations)
    const coverMapW = CW;
    const coverMapH = 260;
    const coverMapUrl = clusterMapUrl(coverPoints, Math.round(coverMapW), Math.round(coverMapH));
    const coverMapBuffer = coverMapUrl ? await fetchImageBuffer(coverMapUrl) : null;

    let coverMapDrawn = false;
    if (coverMapBuffer) {
      try {
        doc.save().roundedRect(ML, curY, coverMapW, coverMapH, 10).clip();
        doc.image(coverMapBuffer, ML, curY, { width: coverMapW, height: coverMapH });
        doc.restore();
        strokeRect(doc, ML, curY, coverMapW, coverMapH, C.border, 0.5);
        coverMapDrawn = true;
      } catch (mapErr) {
        console.error("Failed to render cover map in PDF:", mapErr);
        doc.restore();
      }
    }
    if (!coverMapDrawn) {
      fillRect(doc, ML, curY, coverMapW, coverMapH, C.panel);
      strokeRect(doc, ML, curY, coverMapW, coverMapH, C.border, 0.5);
      doc.save().fill(C.muted).fontSize(9).font("Helvetica")
        .text("Map unavailable", ML, curY + coverMapH / 2 - 5, { width: coverMapW, align: "center" })
        .restore();
    }

    curY += coverMapH + 24;

    // Stat cards
    const statCards = [
      { label: "Service Type", value: data.serviceType || "Campaign" },
      { label: "Locations",    value: String(totalTasks) },
      { label: "Verified",     value: String(completedCount) },
      { label: "Completion",   value: `${progress}%` },
    ];

    const cardGap = 12;
    const cardW   = (CW - cardGap * (statCards.length - 1)) / statCards.length;
    const cardH   = 78;

    statCards.forEach((card, i) => {
      const cx = ML + i * (cardW + cardGap);
      fillRect(doc, cx, curY, cardW, cardH, C.panel);
      strokeRect(doc, cx, curY, cardW, cardH, C.border, 0.5);
      doc.save()
        .fill(C.dark)
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(clampText(card.value, 16), cx + 6, curY + 22, { width: cardW - 12, align: "center" })
        .restore();
      doc.save()
        .fill(C.red)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(card.label, cx + 6, curY + 48, { width: cardW - 12, align: "center" })
        .restore();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // ONE PAGE PER PHOTO
    // ═══════════════════════════════════════════════════════════════════════════
    const totalPhotoPages = photoEntries.length;

    // Prefetch every mini-map concurrently — doing this one Mapbox call per
    // loop iteration (blocking) was the other major source of serial latency.
    const miniMapW = CW - CW * 0.44 - 24;
    const miniMapH = 180;
    const __tMiniMaps = __t0();
    const miniMapBuffers = await Promise.all(
      photoEntries.map(({ task }) => {
        const loc = taskLocation(task);
        if (!loc.latitude || !loc.longitude) return Promise.resolve(null);
        const mapUrl = singleMarkerMapUrl(Number(loc.latitude), Number(loc.longitude), Math.round(miniMapW), Math.round(miniMapH));
        return mapUrl ? fetchImageBuffer(mapUrl) : Promise.resolve(null);
      })
    );
    __log("mini map fetch (parallel)", __tMiniMaps);

    for (let i = 0; i < photoEntries.length; i++) {
      const { task, buffer, view } = photoEntries[i];
      doc.addPage({ size: "A4", margin: 0 });
      drawBars();

      let py = 24;

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, ML, py, { fit: [70, 20] });
        } catch (logoErr) {
          console.error("Failed to render logo in PDF:", logoErr);
        }
      }

      const headerRight = `${clampText(data.name || "Campaign", 40)}   •   ${data.serviceType || "Campaign"}   •   ${i + 1}/${totalPhotoPages}`;
      doc.save()
        .fill(C.muted)
        .fontSize(8)
        .font("Helvetica")
        .text(headerRight, ML, py + 5, { width: CW, align: "right" })
        .restore();

      py += 32;
      doc.save().moveTo(ML, py).lineTo(PW - MR, py).lineWidth(0.5).strokeColor(C.border).stroke().restore();
      py += 20;

      const colGap   = 24;
      const leftW    = CW * 0.44;
      const rightW   = CW - leftW - colGap;
      const rightX   = ML + leftW + colGap;
      const bodyH    = PH - py - 40;

      // Photo (left column)
      fillRect(doc, ML, py, leftW, bodyH, "#0f172a");
      try {
        doc.image(buffer, ML, py, { fit: [leftW, bodyH], align: "center", valign: "center" });
      } catch (imgErr) {
        console.error("Failed to render image in PDF:", imgErr);
        doc.save().fill(C.muted).fontSize(9).font("Helvetica")
          .text("Image rendering failed", ML, py + bodyH / 2 - 5, { width: leftW, align: "center" })
          .restore();
      }
      strokeRect(doc, ML, py, leftW, bodyH, C.border, 0.5);

      // Details (right column)
      let ry = py;
      const loc = taskLocation(task);
      const completedDate = task.completedAt || task.createdAt;

      doc.save().fill(C.muted).fontSize(8).font("Helvetica-Bold").text("COMPLETED", rightX, ry).restore();
      doc.save().fill(C.muted).fontSize(8).font("Helvetica-Bold")
        .text("REFERENCE", rightX, ry, { width: rightW, align: "right" }).restore();
      ry += 12;
      doc.save().fill(C.dark).fontSize(13).font("Helvetica-Bold")
        .text(completedDate ? new Date(completedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—", rightX, ry)
        .restore();
      doc.save().fill(C.dark).fontSize(13).font("Helvetica-Bold")
        .text(shortReference(task.id), rightX, ry, { width: rightW, align: "right" })
        .restore();

      ry += 24;
      doc.save().moveTo(rightX, ry).lineTo(rightX + rightW, ry).lineWidth(0.5).strokeColor(C.border).stroke().restore();
      ry += 16;

      if (view) {
        doc.save().fill(C.blue).fontSize(7).font("Helvetica-Bold")
          .text(String(view).toUpperCase(), rightX, ry).restore();
        ry += 14;
      }

      doc.save().fill(C.muted).fontSize(8).font("Helvetica-Bold").text("LOCATION", rightX, ry).restore();
      ry += 12;
      doc.save().fill(C.dark).fontSize(10).font("Helvetica")
        .text(loc.address || data.address || "Unknown location", rightX, ry, { width: rightW })
        .restore();
      ry = doc.y + 12;

      // Mini map (prefetched above, in parallel, for every photo entry)
      if (loc.latitude && loc.longitude) {
        const mapBuffer = miniMapBuffers[i];

        if (mapBuffer) {
          try {
            doc.save().roundedRect(rightX, ry, miniMapW, miniMapH, 8).clip();
            doc.image(mapBuffer, rightX, ry, { width: miniMapW, height: miniMapH });
            doc.restore();
            strokeRect(doc, rightX, ry, miniMapW, miniMapH, C.border, 0.5);
          } catch (mapErr) {
            console.error("Failed to render mini map in PDF:", mapErr);
            doc.restore();
            fillRect(doc, rightX, ry, miniMapW, miniMapH, C.panel);
            strokeRect(doc, rightX, ry, miniMapW, miniMapH, C.border, 0.5);
          }
        } else {
          fillRect(doc, rightX, ry, miniMapW, miniMapH, C.panel);
          strokeRect(doc, rightX, ry, miniMapW, miniMapH, C.border, 0.5);
          doc.save().fill(C.muted).fontSize(8).font("Helvetica")
            .text(`${Number(loc.latitude).toFixed(6)}, ${Number(loc.longitude).toFixed(6)}`, rightX, ry + miniMapH / 2 - 4, { width: miniMapW, align: "center" })
            .restore();
        }
        ry += miniMapH + 16;

        // "Open in Google Maps" button (clickable link)
        const btnH = 30;
        fillRect(doc, rightX, ry, miniMapW, btnH, C.blue);
        doc.save().fill(C.white).fontSize(10).font("Helvetica-Bold")
          .text("Open in Google Maps", rightX, ry + 10, { width: miniMapW, align: "center" })
          .restore();
        doc.link(rightX, ry, miniMapW, btnH, `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // THANK YOU PAGE
    // ═══════════════════════════════════════════════════════════════════════════
    doc.addPage({ size: "A4", margin: 0 });
    drawBars();

    let ty = 140;
    doc.save().fill(C.dark).fontSize(40).font("Helvetica-Bold")
      .text("Thank You", ML, ty, { width: CW, align: "center" }).restore();

    ty += 60;
    doc.save().fill(C.muted).fontSize(11).font("Helvetica")
      .text("This report was prepared for", ML, ty, { width: CW, align: "center" }).restore();

    ty += 18;
    doc.save().fill(C.dark).fontSize(16).font("Helvetica-Bold")
      .text(data.name || "Untitled Campaign", ML, ty, { width: CW, align: "center" }).restore();

    ty += 60;
    if (logoBuffer) {
      const logoW = 140;
      try {
        doc.image(logoBuffer, ML + CW / 2 - logoW / 2, ty, { fit: [logoW, 40] });
      } catch (logoErr) {
        console.error("Failed to render logo in PDF:", logoErr);
      }
      ty += 60;
    }

    doc.save().moveTo(ML, ty).lineTo(PW - MR, ty).lineWidth(0.5).strokeColor(C.border).stroke().restore();
    ty += 16;

    doc.save().fill(C.muted).fontSize(9).font("Helvetica")
      .text("Powered by Experientia — field campaign reporting & monitoring", ML, ty, { width: CW, align: "center" })
      .restore();

    doc.end();

    // ── Wait for the S3 multipart upload to finish draining the stream ──────────
    await uploadPromise;
    __log("s3 upload", __tUpload);

    const downloadUrl = await getPresignedGetUrl(
      s3Key,
      3600,
      `attachment; filename="${filename}"`,
    );
    if (!downloadUrl) {
      return NextResponse.json(
        { success: false, message: "Report was generated but the download link could not be created" },
        { status: 500 },
      );
    }

    __log("TOTAL request", __reqStart);

    return NextResponse.json({ success: true, url: downloadUrl, filename });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    );
  }
};
