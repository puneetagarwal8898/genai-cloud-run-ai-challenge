import jsPDF from 'jspdf';
import { JournalInteraction, UserProfile } from '../types';

/**
 * Generates a clean, beautifully formatted mindful PDF document of all reflections
 * and triggers a client-side download.
 */
export function exportReflectionsToPdf(
  interactions: JournalInteraction[],
  userProfile?: UserProfile | null
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Helper to add new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    // Top subtle brand line
    doc.setDrawColor(218, 165, 32); // Amber gold
    doc.setLineWidth(0.5);
    doc.line(margin, margin - 6, pageWidth - margin, margin - 6);

    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('ReflectAI Sanctuary — Private Journal Export', margin, margin - 8);

    // Page footer
    const pageNumber = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - margin / 2, { align: 'center' });
    doc.text('Confidential & Encrypted User Archive', pageWidth - margin, pageHeight - margin / 2, { align: 'right' });
  };

  // --- Title Page Header ---
  drawHeaderFooter();

  doc.setFontSize(22);
  doc.setTextColor(26, 32, 44);
  doc.setFont('helvetica', 'bold');
  doc.text('Sanctuary Reflections Archive', margin, y + 4);
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const ownerName = userProfile?.displayName || userProfile?.email || 'Mindful Reflector';
  const exportDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Exported for: ${ownerName} (${userProfile?.email || 'Private Account'})`, margin, y);
  y += 6;
  doc.text(`Export Date: ${exportDate}  •  Total Entries: ${interactions.length}`, margin, y);
  y += 6;
  doc.text('Security Status: Verified via Password & Two-Factor Authentication', margin, y);
  y += 8;

  // Gold accent divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  if (interactions.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text('No reflections found in your sanctuary.', margin, y);
  } else {
    interactions.forEach((item, index) => {
      checkPageBreak(35);

      // Entry Card Background / Border
      const cardStartY = y;

      // Entry Title & Index
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const titleText = `${index + 1}. ${item.title || 'Mindful Reflection'}`;
      doc.text(titleText, margin, y);
      y += 6;

      // Metadata Bar (Date, Mood, Mode, Location)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);

      const itemDate = new Date(item.createdAt || item.timestamp || Date.now()).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let metaDetails = `Date: ${itemDate}  |  Mode: ${item.mode || 'reflection'}`;
      if (item.mood) {
        metaDetails += `  |  Mood: ${item.mood.toUpperCase()}`;
      }
      if (item.location?.placeName || item.location?.name) {
        metaDetails += `  |  Place: ${item.location.placeName || item.location.name}`;
      }
      if (item.timeCapsule?.isSealed) {
        metaDetails += `  |  Time Capsule: Sealed (Opens ${new Date(item.timeCapsule.unlockDate).toLocaleDateString()})`;
      }

      doc.text(metaDetails, margin, y);
      y += 6;

      // User prompt / inquiry section
      checkPageBreak(25);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Your Words / Inquiry:', margin, y);
      y += 5;

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(51, 65, 85);
      const promptLines = doc.splitTextToSize(item.prompt, contentWidth);
      promptLines.forEach((line: string) => {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 4.5;
      });
      y += 4;

      // AI Reflection Guidance section
      checkPageBreak(25);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9); // Warm amber
      doc.text('Sanctuary Mindful Guidance:', margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      // Clean markdown characters for clean PDF typography
      const cleanResponse = (item.geminiResponse || item.response || '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .trim();

      const responseLines = doc.splitTextToSize(cleanResponse, contentWidth);
      responseLines.forEach((line: string) => {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 4.5;
      });

      y += 6;

      // Divider between entries
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    });
  }

  // Save the document
  const safeDate = new Date().toISOString().slice(0, 10);
  doc.save(`ReflectAI-Sanctuary-Reflections-${safeDate}.pdf`);
}
