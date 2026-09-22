import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { JobPost } from './mock-data';

const BRAND_BLUE: [number, number, number] = [31, 107, 206]; // #1F6BCE
const DARK_TEXT: [number, number, number] = [30, 30, 30];
const MUTED_TEXT: [number, number, number] = [120, 120, 120];
const RED: [number, number, number] = [200, 60, 60];
const AMBER: [number, number, number] = [200, 140, 20];
const GREEN: [number, number, number] = [34, 150, 90];

function truncate(text: string | undefined, len: number): string {
  if (!text) return 'No reasoning provided.';
  return text.length > len ? text.substring(0, len).trim() + '…' : text;
}

function truncateUrl(url: string | undefined, len = 45): string {
  if (!url) return 'N/A';
  return url.length > len ? url.substring(0, len) + '…' : url;
}

function drawShieldIcon(doc: jsPDF, x: number, y: number, size: number) {
  const w = size;
  const h = size * 1.2;

  doc.setFillColor(255, 255, 255);

  const startX = x + w / 2;
  const startY = y;

  doc.lines(
    [
      [w / 2, h * 0.15],
      [0, h * 0.4],
      [-w / 2, h * 0.45],
      [-w / 2, -h * 0.45],
      [0, -h * 0.4],
      [w / 2, -h * 0.15],
    ],
    startX,
    startY,
    [1, 1],
    'F',
    true
  );
}

function buildReportDoc(jobs: JobPost[], userEmail: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const date = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 40, 'F');

  drawShieldIcon(doc, 14, 9, 9);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ScamShield Jobs', 28, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Audit Report', 14, 27);

  doc.setFontSize(9);
  doc.setTextColor(220, 230, 250);
  doc.text(`Generated: ${date}`, 14, 34);
  doc.text(`Account: ${userEmail}`, pageWidth - 14, 34, { align: 'right' });

  const scams = jobs.filter((j) => j.classification === 'scam');
  const suspicious = jobs.filter((j) => j.classification === 'suspicious');
  const legitimate = jobs.filter((j) => j.classification === 'legitimate');

  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Audit Summary', 14, 55);

  autoTable(doc, {
    startY: 60,
    head: [['Category', 'Count']],
    body: [
      ['Total Analyzed', jobs.length.toString()],
      ['Scams Detected', scams.length.toString()],
      ['Suspicious', suspicious.length.toString()],
      ['Verified Legitimate', legitimate.length.toString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: BRAND_BLUE, textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 40, halign: 'center' },
    },
  });

  function drawRiskSection(title: string, list: JobPost[], color: [number, number, number]) {
    const startY = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 15
      : 70;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text(title, 14, startY);

    if (list.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED_TEXT);
      doc.text(`No ${title.toLowerCase()} found.`, 14, startY + 8);
      (doc as any).lastAutoTable = { finalY: startY + 8 };
      return;
    }

    const sorted = [...list].sort(function (a, b) {
      return (a.legitimacyScore ?? 0) - (b.legitimacyScore ?? 0);
    });

    autoTable(doc, {
      startY: startY + 4,
      head: [['Job Title', 'Company', 'Score', 'URL', 'Why Flagged']],
      body: sorted.map((job) => [
        job.title || 'Unknown',
        job.company || 'Unknown',
        `${job.legitimacyScore ?? 0}%`,
        truncateUrl(job.url),
        truncate(job.reasoning, 90),
      ]),
      theme: 'striped',
      headStyles: { fillColor: color, textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 28 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 34 },
        4: { cellWidth: 'auto' },
      },
    });
  }

  drawRiskSection('Scams Detected', scams, RED);
  drawRiskSection('Suspicious Listings', suspicious, AMBER);

  const verifiedStartY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text('Verified Legitimate Jobs', 14, verifiedStartY);

  if (legitimate.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED_TEXT);
    doc.text('No verified jobs found.', 14, verifiedStartY + 8);
  } else {
    const sortedLegit = [...legitimate].sort(function (a, b) {
      return (b.legitimacyScore ?? 0) - (a.legitimacyScore ?? 0);
    });

    autoTable(doc, {
      startY: verifiedStartY + 4,
      head: [['Job Title', 'Company', 'Legitimacy Score', 'Confidence']],
      body: sortedLegit.map((job) => [
        job.title || 'Unknown',
        job.company || 'Unknown',
        `${job.legitimacyScore ?? 0}%`,
        `${job.confidence ?? 0}%`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: GREEN, textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_TEXT);
    doc.text(
      `Generated by ScamShield Jobs — scamshieldjobs.com`,
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }

  return doc;
}

export async function generateScamReport(jobs: JobPost[], userEmail: string): Promise<void> {
  const doc = buildReportDoc(jobs, userEmail);
  const fileName = `ScamShield-Report-${new Date().toISOString().split('T')[0]}.pdf`;

  if (Capacitor.isNativePlatform()) {
    // Native Android/iOS: browser-style download doesn't work in the WebView.
    // Write the file to device storage, then open the native share/save sheet.
    const base64Data = doc.output('datauristring').split(',')[1];

    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    const fileUri = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'ScamShield Jobs Audit Report',
      url: fileUri.uri,
      dialogTitle: 'Save or share your report',
    });
  } else {
    // Regular web browser: normal download behavior works fine.
    doc.save(fileName);
  }
}

export function generateScamReportBase64(jobs: JobPost[], userEmail: string): string {
  const doc = buildReportDoc(jobs, userEmail);
  return doc.output('datauristring').split(',')[1];
}