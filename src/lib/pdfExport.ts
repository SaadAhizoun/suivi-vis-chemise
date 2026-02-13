import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WearCalculation, WearFormulas, Status, getStatusLabel } from '@/types/maintenance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import html2canvas from "html2canvas";

async function captureToPng(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Graph not found: " + elementId);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
  return canvas.toDataURL("image/png");
}

// COFICAB brand colors (mutable arrays for jspdf compatibility)
const COFICAB_BLUE: [number, number, number] = [0, 22, 137]; // #001689
const COFICAB_COPPER: [number, number, number] = [149, 101, 62]; // #95653E
const STATUS_OK: [number, number, number] = [46, 125, 50];
const STATUS_WARNING: [number, number, number] = [249, 168, 37];
const STATUS_DANGER: [number, number, number] = [198, 40, 40];

interface ReportData {
  lineName: string;
  extruderType: 'principale' | 'secondaire';
  dateVerification: Date;
  formulas: WearFormulas;
  wearCalculations: WearCalculation[];
  overallStatus: Status;
}

function getStatusColor(status: Status): [number, number, number] {
  switch (status) {
    case 'ok': return [...STATUS_OK];
    case 'a_commander': return [...STATUS_WARNING];
    case 'a_changer': return [...STATUS_DANGER];
  }
}
export type PdfReportInput = {
  lineName: string;
  extruderLabel: string; // "Principale" / "Secondaire"
  date: string;
  compteur?: string;
  status: "ok" | "a_commander" | "a_changer";
  recommendation: "garder" | "changer";
  summary: {
    pointsTotal: number;
    pointsNok: number;
    ecartMax: number;
  };
  chartWearPng: string;  // dataURL "data:image/png;base64,..."
  chartEcartPng: string; // dataURL
  logoPng?: string;      // optionnel
};

export function generateMaintenanceReport(data: ReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with COFICAB branding
  doc.setFillColor(...COFICAB_BLUE);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('COFICAB - Gestion IP 4.0', 15, 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Rapport de Maintenance Extrudeuse', 15, 25);
  
  // Report date
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth - 15, 15, { align: 'right' });
  
  // Line info section
  let yPos = 50;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations de la Ligne', 15, yPos);
  
  yPos += 10;
  
  // Info box
  doc.setDrawColor(...COFICAB_COPPER);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'S');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const col1X = 20;
  const col2X = pageWidth / 2 + 10;
  
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Ligne:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.lineName, col1X + 25, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date de vérification:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(format(data.dateVerification, 'dd MMMM yyyy', { locale: fr }), col2X + 45, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Extrudeuse:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.extruderType === 'principale' ? 'Principale' : 'Secondaire', col1X + 30, yPos);
  
  // Status badge
  const statusColor = getStatusColor(data.overallStatus);
  doc.setFillColor(...statusColor);
  doc.roundedRect(col2X, yPos - 4, 50, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(getStatusLabel(data.overallStatus), col2X + 25, yPos + 1, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Formules:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`A = ${data.formulas.visA}   B = ${data.formulas.visB}   C = ${data.formulas.chemiseC}`, col1X + 25, yPos);
  
  // Measurements table
  yPos += 25;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Tableau des Mesures', 15, yPos);
  
  yPos += 5;
  
  // Prepare table data
  const tableData = data.wearCalculations.map(calc => [
    `Point ${calc.pointId.toString().padStart(2, '0')}`,
    calc.usureVis.toFixed(3),
    calc.usureChemise.toFixed(3),
    calc.ecart.toFixed(3),
    getStatusLabel(calc.status)
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Point', 'Usure Vis', 'Usure Chemise', 'Écart', 'Statut']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [...COFICAB_BLUE],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      3: { fontStyle: 'bold' },
      4: { halign: 'center' }
    },
    didParseCell: (data) => {
      // Color the status column
      if (data.column.index === 4 && data.section === 'body') {
        const status = tableData[data.row.index][4];
        if (status === 'À changer') {
          data.cell.styles.textColor = [...STATUS_DANGER];
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'À commander') {
          data.cell.styles.textColor = [180, 130, 30];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [...STATUS_OK];
        }
      }
      // Color the écart column if critical
      if (data.column.index === 3 && data.section === 'body') {
        const ecart = parseFloat(tableData[data.row.index][3]);
        if (ecart >= 1) {
          data.cell.styles.textColor = [...STATUS_DANGER];
        }
      }
    },
    margin: { left: 15, right: 15 }
  });
  
  // Statistics section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  if (finalY < 250) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques', 15, finalY);
    
    const avgUsureVis = data.wearCalculations.reduce((sum, c) => sum + c.usureVis, 0) / data.wearCalculations.length;
    const avgUsureChemise = data.wearCalculations.reduce((sum, c) => sum + c.usureChemise, 0) / data.wearCalculations.length;
    const avgEcart = data.wearCalculations.reduce((sum, c) => sum + c.ecart, 0) / data.wearCalculations.length;
    const maxEcart = Math.max(...data.wearCalculations.map(c => c.ecart));
    const criticalPoints = data.wearCalculations.filter(c => c.ecart >= 1).length;
    
    const statsY = finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, statsY, pageWidth - 30, 25, 3, 3, 'F');
    
    const statCol = (pageWidth - 30) / 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Moy. Usure Vis', 15 + statCol * 0.5, statsY + 8, { align: 'center' });
    doc.text('Moy. Usure Chemise', 15 + statCol * 1.5, statsY + 8, { align: 'center' });
    doc.text('Moy. Écart', 15 + statCol * 2.5, statsY + 8, { align: 'center' });
    doc.text('Écart Max', 15 + statCol * 3.5, statsY + 8, { align: 'center' });
    doc.text('Points Critiques', 15 + statCol * 4.5, statsY + 8, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.text(avgUsureVis.toFixed(3), 15 + statCol * 0.5, statsY + 18, { align: 'center' });
    doc.text(avgUsureChemise.toFixed(3), 15 + statCol * 1.5, statsY + 18, { align: 'center' });
    doc.text(avgEcart.toFixed(3), 15 + statCol * 2.5, statsY + 18, { align: 'center' });
    
    if (maxEcart >= 1) {
      doc.setTextColor(...STATUS_DANGER);
    }
    doc.text(maxEcart.toFixed(3), 15 + statCol * 3.5, statsY + 18, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    
    if (criticalPoints > 0) {
      doc.setTextColor(...STATUS_DANGER);
    }
    doc.text(`${criticalPoints} / ${data.wearCalculations.length}`, 15 + statCol * 4.5, statsY + 18, { align: 'center' });
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...COFICAB_COPPER);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Document généré par Gestion IP 4.0 - COFICAB © ' + new Date().getFullYear(), 15, pageHeight - 8);
  doc.text('Page 1/1', pageWidth - 15, pageHeight - 8, { align: 'right' });
  
  // Save the PDF
  const fileName = `Rapport_${data.lineName.replace(' ', '_')}_${data.extruderType}_${format(data.dateVerification, 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}

export function generateArchiveReport(records: Array<{
  lineName: string;
  extruderType: 'principale' | 'secondaire';
  status: Status;
  dateVerification: Date;
}>): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(...COFICAB_BLUE);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('COFICAB - Gestion IP 4.0', 15, 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Rapport d\'Archive - Historique des Vérifications', 15, 25);
  
  doc.setFontSize(10);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth - 15, 15, { align: 'right' });
  
  // Summary
  let yPos = 50;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${records.length} enregistrements`, 15, yPos);
  
  yPos += 15;
  
  // Table
  const tableData = records.map(r => [
    r.lineName,
    r.extruderType === 'principale' ? 'Principale' : 'Secondaire',
    format(r.dateVerification, 'dd/MM/yyyy', { locale: fr }),
    getStatusLabel(r.status)
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Ligne', 'Extrudeuse', 'Date', 'Statut']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [...COFICAB_BLUE],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.section === 'body') {
        const status = tableData[data.row.index][3];
        if (status === 'À changer') {
          data.cell.styles.textColor = [...STATUS_DANGER];
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'À commander') {
          data.cell.styles.textColor = [180, 130, 30];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [...STATUS_OK];
        }
      }
    },
    margin: { left: 15, right: 15 }
  });
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...COFICAB_COPPER);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Document généré par Gestion IP 4.0 - COFICAB © ' + new Date().getFullYear(), 15, pageHeight - 8);
  
  doc.save(`Archive_IP40_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
export function generateAnalyseReportModern(input: PdfReportInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COFICAB_BLUE);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Rapport Analyse — Suivi Vis & Chemise", 15, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${input.lineName} — ${input.extruderLabel} • ${input.date}`, 15, 19);

  const badgeColor = getStatusColor(input.status as Status);
  doc.setFillColor(...badgeColor);
  doc.roundedRect(pageWidth - 55, 7, 43, 12, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(getStatusLabel(input.status as Status), pageWidth - 33.5, 15, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  let y = 34;
  doc.text("Courbes d’Usure", 15, y);
  doc.addImage(input.chartWearPng, "PNG", 15, y + 5, pageWidth - 30, 70);

  y += 85;
  doc.text("Évolution de l’Écart — Seuil 1.0", 15, y);
  doc.addImage(input.chartEcartPng, "PNG", 15, y + 5, pageWidth - 30, 70);

  y += 85;

  const recIsChange = input.recommendation === "changer";
  doc.setFillColor(...(recIsChange ? STATUS_DANGER : STATUS_OK));
  doc.roundedRect(15, y, pageWidth - 30, 20, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(
    recIsChange ? "❌ Recommandation : CHANGER la vis" : "✅ Recommandation : GARDER la vis",
    20,
    y + 13
  );

  doc.save(`Analyse_${input.lineName}_${input.date}.pdf`);
}

// ===============================
// PDF PREMIUM 2 PAGES (COFICAB)
// ===============================

type PremiumInput = {
  line: {
    name: string;
    brand: string;
    screwRef: string;
    dimensions: string;
    lastVerification: string;
    nextVerification: string;
    remark: string;
  };
  extruderLabel: string;
  date: string;
  compteur: string;
  status: Status;
  kpi: {
    ecartAvg: number;
    ecartMax: number;
    pointsNok: number;
    pointsTotal: number;
  };
  recommendation: "garder" | "changer";
  charts: {
    wearPng: string;
    ecartPng: string;
  };
  logoPng: string;
};

function drawHeader(
  doc: jsPDF,
  title: string,
  subline: string,
  status: Status,
  logoPng: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(...COFICAB_BLUE);
  doc.rect(0, 0, pageWidth, 26, "F");

  // ---- LOGO (top-left, smaller, keep ratio)
  const imgProps = (doc as any).getImageProperties(logoPng);
  const logoH = 9; // 👈 smaller
  let logoW = (imgProps.width / imgProps.height) * logoH;

  const maxLogoW = 26; // prevent too wide
  if (logoW > maxLogoW) logoW = maxLogoW;

  const logoX = 8;
  const logoY = 5; // top-left
  doc.addImage(logoPng, "PNG", logoX, logoY, logoW, logoH);

  // ---- STATUS BADGE (right, auto width)
  const label = getStatusLabel(status);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  const textW = doc.getTextWidth(label);
  const padX = 6;             // inside padding
  const badgeW = textW + padX * 2;
  const badgeH = 9;

  const badgeX = pageWidth - 8 - badgeW; // right margin 8
  const badgeY = 8;                      // vertically centered in header

  const badgeColor = getStatusColor(status);
  doc.setFillColor(...badgeColor);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.text(label, badgeX + badgeW / 2, badgeY + 6.2, { align: "center" });

  // ---- TITLE + SUBLINE (between logo and badge)
  const leftBlockX = logoX + logoW + 6; // start after logo
  const rightLimit = badgeX - 6;        // stop before badge
  const maxTextWidth = rightLimit - leftBlockX;

  doc.setTextColor(255, 255, 255);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, leftBlockX, 11, { maxWidth: maxTextWidth });

  // Subline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(subline, leftBlockX, 18, { maxWidth: maxTextWidth });

  // Copper separator line
  doc.setDrawColor(...COFICAB_COPPER);
  doc.setLineWidth(0.7);
  doc.line(0, 26, pageWidth, 26);
}

function drawCardBox(doc: jsPDF, x: number, y: number, w: number, h: number, title: string) {
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 3, 3, "S");

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, x + 4, y + 7);

  doc.setDrawColor(...COFICAB_COPPER);
  doc.setLineWidth(0.6);
  doc.line(x + 4, y + 10, x + w - 4, y + 10);
}

function drawKpiTile(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  isCritical?: boolean
) {
  doc.setFillColor(248, 249, 252);
  doc.roundedRect(x, y, w, h, 3, 3, "F");

  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 3, 3, "S");

  doc.setTextColor(90, 90, 90);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(label, x + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  if (isCritical) doc.setTextColor(...STATUS_DANGER);
  else doc.setTextColor(0, 0, 0);
  doc.text(value, x + 4, y + 16);

  doc.setTextColor(0, 0, 0);
}

export function generateAnalyseReportPremium2Pages(input: PremiumInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // PAGE 1
  drawHeader(
    doc,
    "RAPPORT D’ANALYSE TECHNIQUE — VIS & CHEMISE",
    `${input.line.name} — Extrudeuse ${input.extruderLabel} • ${input.date} • Compteur: ${input.compteur}`,
    input.status,
    input.logoPng
  );

  let y = 36;

  drawCardBox(doc, 12, y, pageWidth - 24, 44, "Informations Ligne");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);

  const leftX = 16;
  const midX = pageWidth / 2 + 2;

  doc.text(`Ligne : ${input.line.name}`, leftX, y + 18);
  doc.text(`Marque : ${input.line.brand}`, leftX, y + 26);
  doc.text(`Réf. Vis : ${input.line.screwRef}`, leftX, y + 34);

  doc.text(`Dimensions : ${input.line.dimensions}`, midX, y + 18);
  doc.text(`Dernière vérif. : ${input.line.lastVerification}`, midX, y + 26);
  doc.text(`Prochaine vérif. : ${input.line.nextVerification}`, midX, y + 34);

  y += 54;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Indicateurs Clés (KPI)", 12, y);

  const tileY = y + 6;
  const gap = 4;
  const tileW = (pageWidth - 24 - gap * 3) / 4;
  const tileH = 22;

  drawKpiTile(doc, 12, tileY, tileW, tileH, "Écart moyen", input.kpi.ecartAvg.toFixed(3), input.kpi.ecartAvg >= 1);
  drawKpiTile(doc, 12 + (tileW + gap) * 1, tileY, tileW, tileH, "Écart max", input.kpi.ecartMax.toFixed(3), input.kpi.ecartMax >= 1);
  drawKpiTile(doc, 12 + (tileW + gap) * 2, tileY, tileW, tileH, "Points NOK", `${input.kpi.pointsNok}/${input.kpi.pointsTotal}`, input.kpi.pointsNok > 0);
  drawKpiTile(doc, 12 + (tileW + gap) * 3, tileY, tileW, tileH, "Seuil critique", "1.0", false);

  y = tileY + tileH + 16;

  drawCardBox(doc, 12, y, pageWidth - 24, 38, "Analyse Automatique");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);

  const line1 = `Sur ${input.kpi.pointsTotal} points, ${input.kpi.pointsNok} dépassent le seuil critique (1.0).`;
  const line2 = `Écart maximal : ${input.kpi.ecartMax.toFixed(3)} µm • Écart moyen : ${input.kpi.ecartAvg.toFixed(3)} µm.`;
  const line3 =
    input.kpi.pointsNok > 0
      ? "Conclusion : risque d’usure critique. Intervention recommandée."
      : "Conclusion : usure sous contrôle. Surveillance normale.";

  doc.text(line1, 16, y + 18);
  doc.text(line2, 16, y + 26);
  doc.text(line3, 16, y + 34);

  y += 50;

  const recIsChange = input.recommendation === "changer";
  doc.setFillColor(...(recIsChange ? STATUS_DANGER : STATUS_OK));
  doc.roundedRect(12, y, pageWidth - 24, 26, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(
    recIsChange ? "REMPLACEMENT RECOMMANDÉ : CHANGER LA VIS" : "DÉCISION : GARDER LA VIS",
    pageWidth / 2,
    y + 16,
    { align: "center" }
  );

  // Footer page 1
  doc.setDrawColor(220, 220, 220);
  doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(`COFICAB © ${new Date().getFullYear()} — Rapport Analyse`, 12, pageHeight - 6);
  doc.text(`Page 1/2`, pageWidth - 12, pageHeight - 6, { align: "right" });

  // PAGE 2
  doc.addPage();
  drawHeader(
    doc,
    "ANALYSE GRAPHIQUE",
    `${input.line.name} — Extrudeuse ${input.extruderLabel} • Seuil critique : 1.0`,
    input.status,
    input.logoPng
  );

  y = 36;
  drawCardBox(doc, 12, y, pageWidth - 24, 92, `Courbes d’Usure — ${input.line.name}`);
  doc.addImage(input.charts.wearPng, "PNG", 16, y + 14, pageWidth - 32, 72);

  y += 102;
  drawCardBox(doc, 12, y, pageWidth - 24, 92, "Évolution de l’Écart — Seuil 1.0");
  doc.addImage(input.charts.ecartPng, "PNG", 16, y + 14, pageWidth - 32, 72);

  // Footer page 2
  doc.setDrawColor(220, 220, 220);
  doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(`COFICAB © ${new Date().getFullYear()} — Rapport Analyse`, 12, pageHeight - 6);
  doc.text(`Page 2/2`, pageWidth - 12, pageHeight - 6, { align: "right" });

  const safeLine = input.line.name.replace(/\s+/g, "_");
  doc.save(`Rapport_Analyse_${safeLine}_${input.extruderLabel}_${input.date.split("/").join("-")}.pdf`);
}
