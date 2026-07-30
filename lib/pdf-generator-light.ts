import PDFDocument from "pdfkit";

interface Campaign {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  serviceType?: string;
  totalTasks: number;
}

interface LightPDFOptions {
  completedTasks: number;
  totalTasks: number;
  logo?: Buffer;
}

const C = {
  dark: "#1e293b",
  blue: "#2563eb",
  blueDark: "#1d4ed8",
  red: "#dc2626",
  green: "#16a34a",
  muted: "#64748b",
  border: "#e2e8f0",
  panel: "#f8fafc",
  white: "#ffffff",
};

function fillRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color: string) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function strokeRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color: string, lw = 0.5) {
  doc.save().rect(x, y, w, h).lineWidth(lw).strokeColor(color).stroke().restore();
}

export async function generateLightweightCampaignPDF(
  campaign: Campaign,
  options: LightPDFOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ML = 40;
    const MR = 40;
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      compress: true,
      autoFirstPage: false,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);

    const PW = 595.28;
    const PH = 841.89;
    const CW = PW - ML - MR;
    const BAR_H = 6;

    const drawBars = () => {
      fillRect(doc, 0, 0, PW, BAR_H, C.blue);
      fillRect(doc, 0, PH - BAR_H, PW, BAR_H, C.blue);
    };

    // COVER PAGE
    doc.addPage({ size: "A4", margin: 0 });
    drawBars();

    let curY = 28;

    // Logo
    if (options.logo) {
      try {
        doc.image(options.logo, ML, curY, { fit: [110, 32] });
      } catch (err) {
        doc
          .save()
          .fill(C.dark)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("EXPERIENTIA", ML, curY)
          .restore();
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
      .text(campaign.name || "Untitled Campaign", ML, curY, {
        width: CW,
        align: "center",
      })
      .restore();

    curY += 100;

    doc
      .save()
      .fill(C.muted)
      .fontSize(10)
      .font("Helvetica")
      .text(campaign.serviceType || "Campaign", ML, curY, {
        width: CW,
        align: "center",
      })
      .restore();

    curY += 60;

    const completedCount = options.completedTasks;
    const totalTasks = options.totalTasks || 1;
    const progress = Math.round((completedCount / totalTasks) * 100);

    const statCards = [
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

    curY += cardH + 60;

    const barWidth = CW;
    const barHeight = 30;
    const progressPercent = (completedCount / totalTasks) * 100;

    fillRect(doc, ML, curY, barWidth, barHeight, C.panel);
    strokeRect(doc, ML, curY, barWidth, barHeight, C.border, 0.5);

    const fillWidth = (barWidth / 100) * progressPercent;
    fillRect(doc, ML, curY, fillWidth, barHeight, C.blue);

    doc
      .save()
      .fill(C.white)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`${Math.round(progressPercent)}%`, ML, curY + 8, {
        width: barWidth,
        align: "center",
      })
      .restore();

    curY += barHeight + 60;

    doc
      .save()
      .fill(C.muted)
      .fontSize(9)
      .font("Helvetica")
      .text("Full detailed report with task photos and location maps will be sent to your email", ML, curY, {
        width: CW,
        align: "center",
      })
      .restore();

    curY += 20;
    doc
      .save()
      .fill(C.muted)
      .fontSize(9)
      .font("Helvetica")
      .text("Powered by Experientia — field campaign reporting & monitoring", ML, curY, {
        width: CW,
        align: "center",
      })
      .restore();

    doc.end();
  });
}
