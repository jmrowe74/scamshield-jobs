import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateScamReport(jobs: any[]) {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  doc.setFillColor(10, 10, 40);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ScamShield Jobs', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 255);
  doc.text('Cloud Persistent Audit Engine', 14, 30);

  doc.setTextColor(150, 150, 150);
  doc.text('Report Generated: ' + date, 14, 38);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Audit Summary', 14, 55);

  const scams = jobs.filter(j => j.classification === 'scam');
  const suspicious = jobs.filter(j => j.classification === 'suspicious');
  const legitimate = jobs.filter(j => j.classification === 'legitimate');

  const summaryData = [
    ['Total Analyzed', jobs.length.toString()],
    ['Scams Detected', scams.length.toString()],
    ['Suspicious', suspicious.length.toString()],
    ['Verified Legitimate', legitimate.length.toString()],
  ];

  autoTable(doc, {
    startY: 60,
    head: [['Category', 'Count']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [10, 10, 40], textColor: [255, 255, 255] },
    styles: { fontSize: 11 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 40, halign: 'center' }
    }
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Flagged Job Postings', 14, (doc as any).lastAutoTable.finalY + 20);

  const flaggedJobs = [...scams, ...suspicious];

  if (flaggedJobs.length === 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('No flagged jobs found.', 14, (doc as any).lastAutoTable.finalY + 30);
  } else {
    const tableData = flaggedJobs.map(job => [
      job.title || 'Unknown',
      job.company || 'Unknown',
      job.classification?.toUpperCase() || 'NA',
      (job.legitimacyScore || 0) + '%',
      job.url ? job.url.substring(0, 40) + '...' : 'NA'
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 25,
      head: [['Job Title', 'Company', 'Status', 'Score', 'URL']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [220, 50, 50], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
    });
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Verified Legitimate Jobs', 14, (doc as any).lastAutoTable.finalY + 20);

  if (legitimate.length === 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('No verified jobs found.', 14, (doc as any).lastAutoTable.finalY + 30);
  } else {
    const legitimateData = legitimate.map(job => [
      job.title || 'Unknown',
      job.company || 'Unknown',
      (job.legitimacyScore || 0) + '%',
      (job.confidence || 0) + '%'
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 25,
      head: [['Job Title', 'Company', 'Legitimacy Score', 'Confidence']],
      body: legitimateData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'ScamShield Jobs - Confidential Report - Page ' + i + ' of ' + pageCount,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save('ScamShield-Report-' + new Date().toISOString().split('T')[0] + '.pdf');
}
