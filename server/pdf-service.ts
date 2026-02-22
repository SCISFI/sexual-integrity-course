import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

const LOGO_PATH = path.join(process.cwd(), "server", "ifsi-logo.png");

interface WeeklySummaryData {
  clientName: string;
  weekNumber: number;
  weekTitle: string;
  summaryContent: string;
  checkinStats: {
    totalDays: number;
    completedDays: number;
    avgMood: number;
    avgUrge: number;
  };
  homeworkCompletion: string;
  hasReflection: boolean;
  mentorName: string;
  generatedDate: string;
}

export function generateWeeklySummaryPDF(data: WeeklySummaryData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 60 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const navy = "#1e293b";
    const cyan = "#06b6d4";
    const gray = "#64748b";
    const lightGray = "#f1f5f9";

    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 60, 40, { width: 80 });
    }

    doc.fontSize(20).fillColor(navy).text("The Integrity Protocol", 150, 50);
    doc.fontSize(10).fillColor(gray).text("Weekly Progress Summary", 150, 75);

    doc.moveTo(60, 110).lineTo(552, 110).strokeColor(cyan).lineWidth(2).stroke();

    doc.moveDown(2);
    doc.y = 130;

    doc.fontSize(16).fillColor(navy).text(`Week ${data.weekNumber}: ${data.weekTitle}`, 60);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(gray).text(`Client: ${data.clientName} | Mentor: ${data.mentorName}`);
    doc.fontSize(10).fillColor(gray).text(`Generated: ${data.generatedDate}`);

    doc.moveDown(1);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(lightGray).lineWidth(1).stroke();
    doc.moveDown(1);

    doc.fontSize(13).fillColor(navy).text("Progress Overview", 60);
    doc.moveDown(0.5);

    const statsY = doc.y;
    const colWidth = 120;

    const stats = [
      { label: "Check-ins", value: `${data.checkinStats.completedDays}/${data.checkinStats.totalDays} days` },
      { label: "Avg Mood", value: `${data.checkinStats.avgMood}/10` },
      { label: "Avg Urge", value: `${data.checkinStats.avgUrge}/10` },
      { label: "Homework", value: data.homeworkCompletion },
    ];

    stats.forEach((stat, i) => {
      const x = 60 + i * colWidth;
      doc.fontSize(9).fillColor(gray).text(stat.label, x, statsY, { width: colWidth });
      doc.fontSize(12).fillColor(navy).text(stat.value, x, statsY + 14, { width: colWidth });
    });

    doc.y = statsY + 40;
    doc.moveDown(1);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(lightGray).lineWidth(1).stroke();
    doc.moveDown(1);

    doc.fontSize(13).fillColor(navy).text("Mentor Summary & Observations", 60);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#334155").text(data.summaryContent, 60, doc.y, {
      width: 492,
      align: "left",
      lineGap: 4,
    });

    doc.moveDown(2);
    doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor(cyan).lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor(gray).text(
      "This program is an educational and personal growth resource. It is not therapy, counseling, or a substitute for professional mental health treatment.",
      60,
      doc.y,
      { width: 492, align: "center" },
    );

    doc.end();
  });
}
