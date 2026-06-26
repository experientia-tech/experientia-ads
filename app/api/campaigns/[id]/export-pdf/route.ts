import { NextRequest, NextResponse } from "next/server";
import { CampaignService } from "@/services/campaign.services";
import { authorize } from "@/lib/middleware";
import { ROLES } from "@/lib/roles";
import PDFDocument from "pdfkit";

type RequestHandler = (
  request: NextRequest,
  params: { params: { id: string } }
) => Promise<NextResponse>;

const campaignService = new CampaignService();

// ─── Colours ─────────────────────────────────────────────────────────────────
const C = {
  dark:     "#1e293b",
  blue:     "#2563eb",
  red:      "#dc2626",
  green:    "#16a34a",
  amber:    "#d97706",
  muted:    "#64748b",
  border:   "#e2e8f0",
  rowAlt:   "#f8fafc",
  white:    "#ffffff",
  badge:    "#eff6ff",
  badgeText:"#1d4ed8",
};

// ─── Haversine ────────────────────────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Draw a filled rect helper ────────────────────────────────────────────────
function fillRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color: string) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

// ─── Draw bordered rect helper ────────────────────────────────────────────────
function strokeRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color: string, lw = 0.5) {
  doc.save().rect(x, y, w, h).lineWidth(lw).strokeColor(color).stroke().restore();
}

// ─── Text clipped to width ────────────────────────────────────────────────────
function clampText(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

// ─── Fetch image buffer helper ────────────────────────────────────────────────
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

export const GET: RequestHandler = async (request, { params }) => {
  try {
    const auth = authorize(request, [ROLES.ADMIN, ROLES.EXECUTOR]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await Promise.resolve(params);
    if (!id) {
      return NextResponse.json({ success: false, message: "Campaign ID is required" }, { status: 400 });
    }

    const authToken = request.headers.get("authorization")?.split(" ")[1] || "";
    const campaign  = await campaignService.getCampaignById(id, authToken);

    if (!campaign.success || !campaign.data) {
      return NextResponse.json({ success: false, message: "Campaign not found" }, { status: 404 });
    }

    const data  = campaign.data;
    const tasks: any[] = (data.tasks || []).sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // ── Format task rows ──────────────────────────────────────────────────────
    const rows = tasks.map((task: any, i: number) => {
      const meta     = (task.metadata as any) || {};
      const loc      = meta.location?.latitude ? meta.location : { latitude: task.latitude, longitude: task.longitude, address: task.address, accuracy: task.accuracy };
      const prevTask = tasks[i - 1];

      let distance = "N/A";
      if (i > 0 && prevTask) {
        const prevMeta = (prevTask.metadata as any) || {};
        const prevLoc  = prevMeta.location?.latitude ? prevMeta.location : { latitude: prevTask.latitude, longitude: prevTask.longitude };
        if (loc.latitude && loc.longitude && prevLoc.latitude && prevLoc.longitude) {
          const d = haversine(loc.latitude, loc.longitude, prevLoc.latitude, prevLoc.longitude);
          distance = d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`;
        }
      } else {
        distance = loc.accuracy ? `±${Math.round(parseFloat(loc.accuracy))} m` : "N/A";
      }

      let timeLater = "0s";
      if (i > 0 && prevTask) {
        const ms = new Date(task.createdAt).getTime() - new Date(prevTask.createdAt).getTime();
        timeLater = ms < 60_000 ? `${Math.round(ms / 1_000)}s` : ms < 3_600_000 ? `${Math.round(ms / 60_000)}m` : `${Math.round(ms / 3_600_000)}h`;
      }

      const inGeo = loc.accuracy !== undefined && loc.accuracy !== null ? parseFloat(loc.accuracy) <= 100 : null;

      return {
        num:      i + 1,
        date:     task.createdAt ? new Date(task.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
        time:     task.createdAt ? new Date(task.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—",
        executor: task.executor ? `${task.executor.firstName} ${task.executor.lastName}` : "Unknown",
        location: clampText(loc.address || data.address || "Unknown", 28),
        distance,
        timeLater,
        inGeo,
        status:   (task.status || "ACCEPTED").toUpperCase(),
      };
    });

    // ── PDF setup ─────────────────────────────────────────────────────────────
    const ML = 40;          // margin left
    const MR = 40;          // margin right
    const MT = 40;          // margin top
    const doc = new PDFDocument({ size: "A4", margin: 0, compress: true, autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));

    const PW = doc.page.width;   // 595.28
    const PH = doc.page.height;  // 841.89
    const CW = PW - ML - MR;     // content width

    // ── Helper: draw page footer ──────────────────────────────────────────────
    const drawFooter = () => {
      const fy = PH - 28;
      doc.save()
        .moveTo(ML, fy)
        .lineTo(PW - MR, fy)
        .lineWidth(0.5)
        .strokeColor(C.border)
        .stroke()
        .restore();
      doc.save()
        .fill(C.muted)
        .fontSize(7)
        .font("Helvetica")
        .text("Experientia by Dealberg", ML, fy + 6, { width: CW / 2 })
        .text(`Campaign ID: ${id}`, ML, fy + 6, { width: CW, align: "right" })
        .restore();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // PAGE 1 — COVER + STATS + TABLE START
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Header band ───────────────────────────────────────────────────────────
    fillRect(doc, 0, 0, PW, 72, C.dark);

    doc.save()
      .fill(C.white)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("EXPERIENTIA", ML, 18, { width: CW / 2 })
      .restore();

    doc.save()
      .fill("#94a3b8")
      .fontSize(9)
      .font("Helvetica")
      .text("Campaign Task Report", ML, 44, { width: CW / 2 })
      .restore();

    const genDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    doc.save()
      .fill("#94a3b8")
      .fontSize(9)
      .font("Helvetica")
      .text(`Generated: ${genDate}`, ML, 44, { width: CW, align: "right" })
      .restore();

    // ── Campaign name ─────────────────────────────────────────────────────────
    let curY = 90;

    doc.save()
      .fill(C.dark)
      .fontSize(17)
      .font("Helvetica-Bold")
      .text(data.name || "Untitled Campaign", ML, curY, { width: CW })
      .restore();

    curY += 26;

    // Service type badge
    const badgeLabel = (data.serviceType || "Campaign").toUpperCase();
    const badgeW     = 7 * badgeLabel.length + 16;
    fillRect(doc, ML, curY, badgeW, 16, C.blue);
    doc.save()
      .fill(C.white)
      .fontSize(7)
      .font("Helvetica-Bold")
      .text(badgeLabel, ML + 6, curY + 5, { width: badgeW - 10 })
      .restore();

    curY += 26;

    // Meta row (Status · Address · Dates)
    const metaItems = [
      { label: "STATUS",   value: (data.status || "ACTIVE").toUpperCase() },
      { label: "TOTAL",    value: `${tasks.length} / ${data.totalTasks || tasks.length} tasks` },
      { label: "LOCATION", value: clampText(data.address || "N/A", 40) },
    ];
    const colW3 = CW / metaItems.length;
    metaItems.forEach((item, i) => {
      const x = ML + i * colW3;
      doc.save().fill(C.muted).fontSize(7).font("Helvetica-Bold").text(item.label, x, curY, { width: colW3 - 8 }).restore();
      doc.save().fill(C.dark).fontSize(9).font("Helvetica").text(item.value, x, curY + 10, { width: colW3 - 8 }).restore();
    });

    curY += 30;

    // Divider
    doc.save().moveTo(ML, curY).lineTo(PW - MR, curY).lineWidth(0.5).strokeColor(C.border).stroke().restore();
    curY += 14;

    // ── Summary cards ─────────────────────────────────────────────────────────
    const completedCount = tasks.filter((t: any) => (t.status || "").toUpperCase() === "ACCEPTED").length;
    const totalTasks     = data.totalTasks || tasks.length || 1;
    const progress       = Math.round((completedCount / totalTasks) * 100);

    const cards = [
      { label: "Total Tasks",  value: String(totalTasks),                  accent: C.blue  },
      { label: "Accepted",     value: String(completedCount),              accent: C.green },
      { label: "Remaining",    value: String(totalTasks - completedCount), accent: C.amber },
      { label: "Progress",     value: `${progress}%`,                     accent: C.blue  },
    ];

    const cardGap = 8;
    const cardW   = (CW - cardGap * (cards.length - 1)) / cards.length;
    const cardH   = 50;

    cards.forEach((card, i) => {
      const cx = ML + i * (cardW + cardGap);
      fillRect(doc, cx, curY, cardW, cardH, "#f1f5f9");
      fillRect(doc, cx, curY, 3, cardH, card.accent);
      doc.save().fill(C.muted).fontSize(7).font("Helvetica-Bold").text(card.label.toUpperCase(), cx + 10, curY + 9, { width: cardW - 14 }).restore();
      doc.save().fill(C.dark).fontSize(19).font("Helvetica-Bold").text(card.value, cx + 10, curY + 21, { width: cardW - 14 }).restore();
    });

    curY += cardH + 18;

    // ── Table header ──────────────────────────────────────────────────────────
    doc.save()
      .fill(C.dark)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Task Details", ML, curY)
      .restore();

    curY += 14;

    // Column config: [label, width, align]
    // Note: Helvetica (WinAnsi) does not support Unicode outside Latin-1; avoid symbols like Δ
    const cols: [string, number, "left" | "center" | "right"][] = [
      ["#",        20,  "center"],
      ["Date",     62,  "left"],
      ["Time",     48,  "left"],
      ["Executor", 90,  "left"],
      ["Location", 145, "left"],
      ["Distance", 60,  "left"],
      ["Lag",      40,  "left"],
      ["Status",   50,  "center"],
    ];

    // derive x offsets
    const colX: number[] = [];
    cols.reduce((acc, [, w]) => { colX.push(acc); return acc + w; }, ML);

    const ROW_H     = 24;
    const HEADER_H  = 16;
    const FOOT_H    = 36;          // footer reserve

    const drawTableHeader = (y: number) => {
      fillRect(doc, ML, y, CW, HEADER_H, C.dark);
      cols.forEach(([label, w, align], i) => {
        doc.save()
          .fill(C.white)
          .fontSize(7)
          .font("Helvetica-Bold")
          .text(label, colX[i] + 3, y + 5, { width: w - 6, align })
          .restore();
      });
    };

    drawTableHeader(curY);
    curY += HEADER_H;

    // ── Table rows ────────────────────────────────────────────────────────────
    rows.forEach((row, ri) => {
      // Page break
      if (curY + ROW_H + FOOT_H > PH) {
        drawFooter();
        doc.addPage({ size: "A4", margin: 0 });
        curY = MT;
        drawTableHeader(curY);
        curY += HEADER_H;
      }

      // Row bg
      fillRect(doc, ML, curY, CW, ROW_H, ri % 2 === 0 ? C.white : C.rowAlt);
      strokeRect(doc, ML, curY, CW, ROW_H, C.border, 0.3);

      const statusColor = row.status === "ACCEPTED" ? C.green : row.status === "REJECTED" ? C.red : C.muted;
      const inGeoStr    = row.inGeo === null ? "—" : row.inGeo ? "✓" : "✗";
      const inGeoCol    = row.inGeo === null ? C.muted : row.inGeo ? C.green : C.red;

      const cells = [
        { text: String(row.num),  color: C.muted,       align: "center" as const },
        { text: row.date,          color: C.dark,         align: "left"   as const },
        { text: row.time,          color: C.dark,         align: "left"   as const },
        { text: clampText(row.executor, 18), color: C.dark, align: "left" as const },
        { text: row.location,      color: C.muted,        align: "left"  as const },
        { text: row.distance,      color: C.muted,        align: "left"  as const },
        { text: row.timeLater,     color: C.muted,        align: "left"  as const },
        { text: row.status,        color: statusColor,    align: "center" as const },
      ];

      cells.forEach((cell, ci) => {
        const [, w, ] = cols[ci];
        doc.save()
          .fill(cell.color)
          .fontSize(7)
          .font("Helvetica")
          .text(cell.text, colX[ci] + 3, curY + 7, { width: w - 6, align: cell.align, lineBreak: false })
          .restore();
      });

      curY += ROW_H;
    });

    if (rows.length === 0) {
      doc.save().fill(C.muted).fontSize(10).font("Helvetica")
        .text("No tasks found for this campaign.", ML, curY + 10)
        .restore();
      curY += 30;
    }

    drawFooter();

    // ═══════════════════════════════════════════════════════════════════════════
    // EVIDENCE GALLERY
    // ═══════════════════════════════════════════════════════════════════════════
    const tasksWithImages = tasks.filter((t: any) => {
      const meta = (t.metadata as any) || {};
      const imgs = meta.images || [];
      return imgs.length > 0;
    });

    if (tasksWithImages.length > 0) {
      doc.addPage({ size: "A4", margin: 0 });
      curY = MT;

      doc.save()
        .fill(C.dark)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Task Evidence Gallery", ML, curY)
        .restore();
      curY += 24;

      for (let i = 0; i < tasksWithImages.length; i++) {
        const task = tasksWithImages[i];
        const taskImages = (task.metadata as any).images || [];
        
        // Fetch valid image buffers
        const imageBuffers = await Promise.all(
          taskImages.map((img: any) => fetchImageBuffer(img.url))
        );
        const validImages = imageBuffers.filter((buf): buf is Buffer => buf !== null);
        if (validImages.length === 0) continue;

        // Calculate rows
        const imageRows = Math.ceil(validImages.length / 2);
        const taskHeaderHeight = task.notes ? 40 : 28;
        const rowHeight = 155;
        const spacing = 15;
        const requiredHeight = taskHeaderHeight + (rowHeight * imageRows) + (spacing * (imageRows - 1)) + 30;

        if (curY + requiredHeight > PH - 40) {
          drawFooter();
          doc.addPage({ size: "A4", margin: 0 });
          curY = MT;
        }

        // Draw task header
        const execName = task.executor ? `${task.executor.firstName} ${task.executor.lastName}` : "Unknown";
        const taskDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
        const taskTime = task.createdAt ? new Date(task.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
        const loc = (task.metadata as any)?.location?.address || task.address || "Unknown Location";
        const originalIndex = tasks.indexOf(task) + 1;

        doc.save()
          .fill(C.dark)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(`Task #${originalIndex} — Submitted by ${execName}`, ML, curY)
          .restore();

        doc.save()
          .fill(C.muted)
          .fontSize(8)
          .font("Helvetica")
          .text(`Date/Time: ${taskDate} at ${taskTime}  |  Location: ${clampText(loc, 60)}`, ML, curY + 13)
          .restore();

        if (task.notes) {
          doc.save()
            .fill(C.muted)
            .fontSize(8)
            .font("Helvetica-Oblique")
            .text(`Description: "${task.notes}"`, ML, curY + 25)
            .restore();
        }

        curY += taskHeaderHeight;

        // Render images
        for (let j = 0; j < validImages.length; j++) {
          const row = Math.floor(j / 2);
          const col = j % 2;
          const imgX = ML + col * (240 + 35);
          const imgY = curY + row * (rowHeight + spacing);

          try {
            doc.image(validImages[j], imgX, imgY, { width: 240, height: rowHeight, fit: [240, rowHeight] });
            
            // Draw a border around the image
            strokeRect(doc, imgX, imgY, 240, rowHeight, C.border, 0.5);
          } catch (imgErr) {
            console.error("Failed to render image in PDF:", imgErr);
            fillRect(doc, imgX, imgY, 240, rowHeight, "#f1f5f9");
            strokeRect(doc, imgX, imgY, 240, rowHeight, C.border, 0.5);
            doc.save()
              .fill(C.muted)
              .fontSize(8)
              .font("Helvetica")
              .text("Image rendering failed", imgX + 10, imgY + rowHeight / 2 - 4, { width: 220, align: "center" })
              .restore();
          }
        }

        curY += (rowHeight * imageRows) + (spacing * (imageRows - 1)) + 30;
      }
      drawFooter();
    }

    doc.end();

    // ── Collect buffer ────────────────────────────────────────────────────────
    await new Promise<void>((resolve) => doc.on("end", resolve));
    const pdfBuffer = Buffer.concat(chunks);

    const slug     = (data.name || "campaign").replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr  = new Date().toISOString().split("T")[0];
    const filename = `${slug}_report_${dateStr}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    );
  }
};
