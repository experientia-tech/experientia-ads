import { CampaignService } from "@/services/campaign.services";
import { getPresignedGetUrl, uploadStreamToS3 } from "@/utils/s3";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

const campaignService = new CampaignService();

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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function shortReference(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function fillRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function strokeRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lw = 0.5
) {
  doc.save().rect(x, y, w, h).lineWidth(lw).strokeColor(color).stroke().restore();
}

function clampText(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

async function fetchImageBuffer(
  url: string,
  timeoutMs = 15000
): Promise<Buffer | null> {
  try {
    if (!url) return null;
    if (url.startsWith("data:image/")) {
      const base64Data = url.split(",")[1];
      return Buffer.from(base64Data, "base64");
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
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

function singleMarkerMapUrl(
  lat: number,
  lng: number,
  width: number,
  height: number
): string | null {
  if (!MAPBOX_TOKEN) return null;
  const marker = `pin-l+2563eb(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${lng},${lat},14,0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
}

function clusterMapUrl(
  points: { lat: number; lng: number }[],
  width: number,
  height: number
): string | null {
  if (!MAPBOX_TOKEN || points.length === 0) return null;
  const capped = points.slice(0, 100);
  const markers = capped.map((p) => `pin-s+2563eb(${p.lng},${p.lat})`).join(",");
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers}/auto/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
}

export async function generateCampaignPDF(
  campaignId: string,
  authToken: string
): Promise<{ key: string; downloadUrl: string; filename: string }> {
  const campaign = await campaignService.getCampaignById(campaignId, authToken);

  if (!campaign.success || !campaign.data) {
    throw new Error("Campaign not found");
  }

  const data = campaign.data;
  const tasks: any[] = (data.tasks || []).sort(
    (a: any, b: any) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const taskLocation = (task: any) => {
    const meta = (task.metadata as any) || {};
    return meta.location?.latitude
      ? meta.location
      : {
          latitude: task.latitude,
          longitude: task.longitude,
          address: task.address,
        };
  };

  const tasksWithImages = tasks.filter((t: any) => {
    const meta = (t.metadata as any) || {};
    return (meta.images || []).length > 0;
  });

  type PhotoEntry = { task: any; buffer: Buffer; view?: string | null };

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

  const photoEntries: PhotoEntry[] = perTaskPhotos.flat();

  const completedCount = tasks.filter(
    (t: any) => (t.status || "").toUpperCase() === "ACCEPTED"
  ).length;
  const totalTasks = data.totalTasks || tasks.length || 1;
  const progress = Math.round((completedCount / totalTasks) * 100);

  const coverPoints = tasks
    .map((t) => taskLocation(t))
    .filter((l) => l.latitude && l.longitude)
    .map((l) => ({ lat: Number(l.latitude), lng: Number(l.longitude) }));

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

  let logoBuffer: Buffer | null = null;
  if (data.logo) {
    logoBuffer = await fetchImageBuffer(data.logo, 10000);
  }
  if (!logoBuffer) {
    const fallbackLogoUrl = "https://experientia-ads.vercel.app/experientia.png";
    logoBuffer = await fetchImageBuffer(fallbackLogoUrl, 10000);
  }

  // COVER PAGE
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

  const coverMapW = CW;
  const coverMapH = 260;
  const coverMapUrl = clusterMapUrl(coverPoints, Math.round(coverMapW), Math.round(coverMapH));
  const coverMapBuffer = coverMapUrl ? await fetchImageBuffer(coverMapUrl) : null;

  let coverMapDrawn = false;
  if (coverMapBuffer) {
    try {
      doc.save().roundedRect(ML, curY, coverMapW, coverMapH, 10).clip();
      doc.image(coverMapBuffer, ML, curY, {
        width: coverMapW,
        height: coverMapH,
      });
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
    doc
      .save()
      .fill(C.muted)
      .fontSize(9)
      .font("Helvetica")
      .text("Map unavailable", ML, curY + coverMapH / 2 - 5, {
        width: coverMapW,
        align: "center",
      })
      .restore();
  }

  curY += coverMapH + 24;

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
      .text(clampText(card.value, 16), cx + 6, curY + 22, {
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

  // PHOTO PAGES
  const totalPhotoPages = photoEntries.length;

  const miniMapW = CW - CW * 0.44 - 24;
  const miniMapH = 180;

  const locationToBuffer = new Map<string, Buffer | null>();
  const uniqueLocations = new Map<string, { lat: number; lng: number }>();
  for (const { task } of photoEntries) {
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
  }

  await Promise.all(
    Array.from(uniqueLocations.entries()).map(async ([key, loc]) => {
      const mapUrl = singleMarkerMapUrl(
        loc.lat,
        loc.lng,
        Math.round(miniMapW),
        Math.round(miniMapH)
      );
      const buffer = mapUrl ? await fetchImageBuffer(mapUrl, 20000) : null;
      locationToBuffer.set(key, buffer);
    })
  );

  const miniMapBuffers = photoEntries.map(({ task }) => {
    const loc = taskLocation(task);
    if (!loc.latitude || !loc.longitude) return null;
    const key = `${loc.latitude}|${loc.longitude}`;
    return locationToBuffer.get(key) || null;
  });

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
      doc.image(buffer, ML, py, {
        fit: [leftW, bodyH],
        align: "center",
        valign: "center",
      });
    } catch (imgErr) {
      console.error("Failed to render image in PDF:", imgErr);
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

    if (view) {
      doc
        .save()
        .fill(C.blue)
        .fontSize(7)
        .font("Helvetica-Bold")
        .text(String(view).toUpperCase(), rightX, ry)
        .restore();
      ry += 14;
    }

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
      const mapBuffer = miniMapBuffers[i];

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
          console.error("Failed to render mini map in PDF:", mapErr);
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
    const logoW = 140;
    try {
      doc.image(logoBuffer, ML + CW / 2 - logoW / 2, ty, {
        fit: [logoW, 40],
      });
    } catch (logoErr) {
      console.error("Failed to render logo in PDF:", logoErr);
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
    .text(
      "Powered by Experientia — field campaign reporting & monitoring",
      ML,
      ty,
      { width: CW, align: "center" }
    )
    .restore();

  doc.end();

  await uploadPromise;

  const downloadUrl = await getPresignedGetUrl(
    s3Key,
    3600,
    `attachment; filename="${filename}"`
  );

  if (!downloadUrl) {
    throw new Error("Could not create download URL for generated PDF");
  }

  return { key: s3Key, downloadUrl, filename };
}
