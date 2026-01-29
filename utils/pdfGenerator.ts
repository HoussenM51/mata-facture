
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Client, UserSettings, InvoiceStatus, DocumentType, PaymentTransaction } from '../types';
import { formatAr, numberToWords } from './formatters';

// Charte graphique unifiée
const COLORS = {
  PRIMARY: [15, 23, 42],   // Slate 900 (Titres et structures)
  ACCENT: [5, 150, 105],    // Emerald 600 (Validation et highlights)
  NEUTRAL_BG: [248, 250, 252], // Slate 50 (Fonds de blocs)
  BORDER: [226, 232, 240], // Slate 200 (Séparateurs)
  TEXT_LIGHT: [100, 116, 139] // Slate 400 (Labels secondaires)
};

/**
 * Dessine l'en-tête commun à tous les documents avec alignement gauche rigoureux
 */
const drawDocumentHeader = (doc: jsPDF, settings: UserSettings, title: string, docNumber: string, date: string, dueDate?: string) => {
  let textStartX = 10;
  
  // 1. Logo (si présent)
  if (settings.logoUrl) {
    try {
      doc.addImage(settings.logoUrl, 'PNG', 10, 10, 25, 25);
      textStartX = 40; // Décale le texte si logo présent
    } catch (e) {
      console.warn("Logo invalide");
      textStartX = 10;
    }
  }

  // 2. Infos Société (Ancrage Gauche avec limite de largeur pour éviter collision)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
  doc.text(settings.businessName.toUpperCase(), textStartX, 18, { maxWidth: 85 });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.TEXT_LIGHT[0], COLORS.TEXT_LIGHT[1], COLORS.TEXT_LIGHT[2]);
  
  const companyDetails = [
    settings.address,
    `Tél: ${settings.phone}`,
    `Email: ${settings.email}`,
    `NIF: ${settings.nif} | STAT: ${settings.stat}`,
    `RCS: ${settings.rcs}`
  ];
  
  doc.text(companyDetails, textStartX, 25, { maxWidth: 85, lineHeightFactor: 1.4 });

  // 3. Cartouche Document (Droite - Bloc Gris Arrondi)
  // Fixé à x=135, largeur=65. Garanti sans superposition avec la gauche (max 85+textStartX)
  doc.setFillColor(COLORS.NEUTRAL_BG[0], COLORS.NEUTRAL_BG[1], COLORS.NEUTRAL_BG[2]);
  doc.roundedRect(135, 10, 65, 38, 3, 3, 'F');
  
  doc.setTextColor(COLORS.ACCENT[0], COLORS.ACCENT[1], COLORS.ACCENT[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 140, 20);
  
  doc.setFontSize(9);
  doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
  doc.text(`N° : ${docNumber}`, 140, 28);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date : ${new Date(date).toLocaleDateString('fr-FR')}`, 140, 35);
  if (dueDate) {
    doc.text(`Échéance : ${new Date(dueDate).toLocaleDateString('fr-FR')}`, 140, 41);
  }
};

/**
 * Pied de page standardisé
 */
const drawDocumentFooter = (doc: jsPDF, settings: UserSettings, y: number) => {
  const footerY = Math.max(y, 250);
  
  doc.setDrawColor(COLORS.BORDER[0], COLORS.BORDER[1], COLORS.BORDER[2]);
  doc.line(10, footerY, 200, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
  doc.text('LE CLIENT (Bon pour accord)', 15, footerY + 8);
  doc.text('LA DIRECTION', 145, footerY + 8);
  
  doc.setDrawColor(COLORS.BORDER[0], COLORS.BORDER[1], COLORS.BORDER[2]);
  doc.roundedRect(10, footerY + 11, 65, 20, 2, 2, 'D');
  doc.roundedRect(140, footerY + 11, 65, 20, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.TEXT_LIGHT[0], COLORS.TEXT_LIGHT[1], COLORS.TEXT_LIGHT[2]);
  const legalText = `MadaFacture - Document certifié conforme - NIF ${settings.nif} - ${settings.businessName}`;
  doc.text(legalText, 105, 285, { align: 'center' });
};

export const generateInvoicePDF = async (invoice: Invoice, client: Client, settings: UserSettings) => {
  const doc = new jsPDF();
  let title = invoice.type.toString();
  if (invoice.type === DocumentType.RECU) title = "REÇU DE CAISSE";

  // Header
  drawDocumentHeader(doc, settings, title, invoice.number, invoice.date, invoice.dueDate);

  // 4. Infos Client (Décalage vers le bas pour éviter collision avec header long)
  const clientSectionY = 65;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.TEXT_LIGHT[0], COLORS.TEXT_LIGHT[1], COLORS.TEXT_LIGHT[2]);
  doc.text('CLIENT / DESTINATAIRE :', 10, clientSectionY);
  
  doc.setFontSize(11);
  doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
  doc.text(client.name.toUpperCase(), 10, clientSectionY + 7);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const clientDetails = [
    client.address || 'Adresse non communiquée',
    client.phone ? `Tél: ${client.phone}` : '',
    client.nif ? `NIF: ${client.nif} | STAT: ${client.stat || 'N/A'}` : ''
  ].filter(Boolean);
  doc.text(clientDetails, 10, clientSectionY + 13, { lineHeightFactor: 1.3 });

  // 5. Tableau Articles
  const tableRows = invoice.items.map((item, index) => [
    index + 1,
    item.description,
    item.quantity,
    item.unit || 'U',
    formatAr(item.unitPrice),
    formatAr(item.quantity * item.unitPrice)
  ]);

  autoTable(doc, {
    startY: 100, // Espace généreux après les infos client
    head: [['#', 'DÉSIGNATION', 'QTÉ', 'UNITÉ', 'P.U (Ar)', 'TOTAL HT']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: COLORS.PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  // 6. Résumé financier
  doc.setFontSize(9);
  doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
  doc.text('TOTAL HORS-TAXES :', 130, currentY);
  doc.text(formatAr(invoice.subtotal), 200, currentY, { align: 'right' });
  
  if (invoice.vatTotal > 0) {
    currentY += 6;
    doc.text(`TVA (${invoice.items[0]?.vatRate || 20}%) :`, 130, currentY);
    doc.text(formatAr(invoice.vatTotal), 200, currentY, { align: 'right' });
  }
  
  currentY += 4;
  doc.setFillColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
  doc.rect(125, currentY, 75, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('TOTAL TTC :', 130, currentY + 8);
  doc.text(formatAr(invoice.total), 198, currentY + 8, { align: 'right' });

  // Somme en lettres
  currentY += 22;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.TEXT_LIGHT[0], COLORS.TEXT_LIGHT[1], COLORS.TEXT_LIGHT[2]);
  doc.text(`Somme arrêtée à la valeur de :`, 10, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
  doc.text(numberToWords(invoice.total).toUpperCase(), 10, currentY + 5, { maxWidth: 180 });

  // 7. Bloc de Règlement
  if (invoice.paidAmount > 0) {
    currentY += 15;
    doc.setDrawColor(COLORS.ACCENT[0], COLORS.ACCENT[1], COLORS.ACCENT[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(10, currentY, 100, 15, 2, 2, 'D');
    doc.setTextColor(COLORS.ACCENT[0], COLORS.ACCENT[1], COLORS.ACCENT[2]);
    doc.setFontSize(9);
    doc.text(`MODE DE RÈGLEMENT : ${invoice.paymentMethod || 'Espèces'}`, 15, currentY + 6);
    doc.text(`MONTANT ENCAISSÉ : ${formatAr(invoice.paidAmount)}`, 15, currentY + 11);
    doc.setLineWidth(0.1); 
  }

  drawDocumentFooter(doc, settings, currentY + 30);
  return doc;
};

export const generateDailyReportPDF = async (
  transactions: PaymentTransaction[], 
  productStats: any[], 
  totals: any, 
  date: string, 
  settings: UserSettings
) => {
  const doc = new jsPDF();
  const closingNumber = `CLOT-${date.replace(/-/g, '')}`;

  drawDocumentHeader(doc, settings, "RAPPORT DE CLÔTURE", closingNumber, date);

  // Cartes de synthèse (Décalées sous le header)
  const statsY = 60;
  doc.setFillColor(COLORS.NEUTRAL_BG[0], COLORS.NEUTRAL_BG[1], COLORS.NEUTRAL_BG[2]);
  doc.roundedRect(10, statsY, 90, 22, 2, 2, 'F');
  doc.roundedRect(110, statsY, 90, 22, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.TEXT_LIGHT[0], COLORS.TEXT_LIGHT[1], COLORS.TEXT_LIGHT[2]);
  doc.text("RECETTE TOTALE (TTC)", 15, statsY + 8);
  doc.text("BÉNÉFICE ESTIMÉ", 115, statsY + 8);
  
  doc.setFontSize(12);
  doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
  doc.text(formatAr(totals.total), 15, statsY + 16);
  doc.setTextColor(COLORS.ACCENT[0], COLORS.ACCENT[1], COLORS.ACCENT[2]);
  doc.text(formatAr(totals.profit), 115, statsY + 16);

  // Tableaux de données
  doc.setFontSize(10);
  doc.setTextColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
  doc.text("DÉTAIL DES VENTES PAR ARTICLE", 10, statsY + 35);

  const productRows = productStats.map(p => [
    p.name,
    p.quantity,
    formatAr(p.revenue),
    formatAr(p.profit)
  ]);

  autoTable(doc, {
    startY: statsY + 40,
    head: [['ARTICLE', 'UNITÉS', 'CHIFFRE D\'AFFAIRE', 'MARGE']],
    body: productRows,
    theme: 'grid',
    headStyles: { fillColor: COLORS.PRIMARY, fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  });

  drawDocumentFooter(doc, settings, (doc as any).lastAutoTable.finalY + 20);
  return doc;
};

export const shareInvoice = async (invoice: Invoice, client: Client, settings: UserSettings) => {
  const doc = await generateInvoicePDF(invoice, client, settings);
  const pdfBlob = doc.output('blob');
  const fileName = `${invoice.number}_${client.name.replace(/\s+/g, '_')}.pdf`;
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
  const shareData = {
    title: `${invoice.type} ${invoice.number}`,
    text: `Facture de ${settings.businessName} pour ${client.name}`,
    files: [file],
  };
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share(shareData); return true; } catch (err) { doc.save(fileName); return false; }
  } else { doc.save(fileName); return false; }
};
