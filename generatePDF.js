import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Gas Safe Register logo — high quality 200x200 JPEG from official PNG
const GAS_SAFE_LOGO = 'data:image/jpeg;base64,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';

export function generateCertificatePDF(cert) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const { eng, prop, ll, apps, pipe, alarms, faults, rect, works, flueCap, decl, inspDate, nextDate, certNo, ct } = cert;
  const ctLabel = (ct || 'landlord').charAt(0).toUpperCase() + (ct || 'landlord').slice(1);

  // ═══ HEADER BAR ═══
  doc.setFillColor(12, 31, 63);
  doc.rect(0, 0, W, 18, 'F');

  // Gas Safe logo — left side, clear and visible
  try {
    doc.addImage(GAS_SAFE_LOGO, 'JPEG', 3, 1.5, 15, 15);
  } catch (e) {
    // Fallback if image fails: draw text
    doc.setFontSize(5);
    doc.setTextColor(255, 208, 0);
    doc.text('GAS SAFE', 5, 10);
  }

  // Title — centered
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Homeowner / Landlord Gas Safety Record', W / 2, 9, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont(undefined, 'normal');
  doc.text('Gas Safety (Installation and Use) Regulations 1998', W / 2, 14, { align: 'center' });

  // Cert number — right side
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('Cert No. ' + (certNo || '\u2014'), W - 6, 9, { align: 'right' });
  doc.setFontSize(6);
  doc.setFont(undefined, 'normal');
  doc.text('GAS SAFE REGISTER', W - 6, 14, { align: 'right' });

  // ═══ DISCLAIMER ═══
  var y = 19.5;
  doc.setFontSize(4.5);
  doc.setTextColor(120, 120, 120);
  doc.text('This inspection is for gas safety purposes only to comply with the Gas Safety (Installation and Use) Regulations. Flues have been inspected visually and checked for satisfactory evacuation of products of combustion. A detailed internal inspection of the flue integrity, construction and lining has NOT been carried out. Registered Business/engineer details can be checked at www.gassaferegister.co.uk or by calling 0800 408 5500.', 8, y, { maxWidth: W - 16 });
  y += 5;

  // ═══ TABLE STYLES ═══
  var hs = { fillColor: [12, 31, 63], textColor: [255, 255, 255], fontSize: 6, fontStyle: 'bold', cellPadding: 1, halign: 'center' };
  var th = { fillColor: [232, 234, 246], fontStyle: 'bold', fontSize: 5.5, cellPadding: 1 };
  var td = { fontSize: 5.5, cellPadding: 1 };
  var go = { theme: 'grid', styles: { lineColor: [176, 190, 197], lineWidth: 0.15 } };

  // ═══ THREE COLUMN INFO ═══
  var cw = (W - 20) / 3;
  var mkRows = function(pairs) { return pairs.map(function(p) { return [{ content: p[0], styles: th }, { content: p[1] || '', styles: td }]; }); };

  doc.autoTable({ startY: y, margin: { left: 8 }, tableWidth: cw,
    head: [[{ content: 'Company / Installer', colSpan: 2, styles: hs }]],
    body: mkRows([['Engineer', eng.name], ['Company', eng.company], ['Address', eng.address], ['Tel No.', eng.tel], ['Gas Safe Reg.', eng.gasSafe], ['ID Card No.', eng.idCard], ['Email', eng.email]]),
    ...go, columnStyles: { 0: { cellWidth: cw * 0.34 } } });

  doc.autoTable({ startY: y, margin: { left: 10 + cw }, tableWidth: cw,
    head: [[{ content: 'Inspection / Installation Address', colSpan: 2, styles: hs }]],
    body: mkRows([['Name', prop.name], ['Address', prop.address], ['City', ((prop.city || '') + ' ' + (prop.county || '')).trim()], ['Postcode', prop.postcode], ['Mobile', prop.mobile], ['Landline', prop.landline], ['Email', prop.email]]),
    ...go, columnStyles: { 0: { cellWidth: cw * 0.28 } } });

  doc.autoTable({ startY: y, margin: { left: 12 + cw * 2 }, tableWidth: cw,
    head: [[{ content: ctLabel + ' / Agent / Customer', colSpan: 2, styles: hs }]],
    body: mkRows([['Name', ll.name], ['Company Name', ll.company], ['Address', ll.address], ['Postcode', ll.postcode], ['Email', ll.email], ['Phone', ll.phone], ['UPRN', ll.uprn]]),
    ...go, columnStyles: { 0: { cellWidth: cw * 0.34 } } });

  y = doc.lastAutoTable.finalY + 2;

  // ═══ APPLIANCE TABLE ═══
  var appData = apps.map(function(a, i) {
    return [i + 1, a.location, a.make, a.model, a.type, a.flueType,
      a.operatingPressure, a.safetyDevices, a.spillageTest, a.smokePelletTest,
      a.initRatio, a.initCO, a.initCO2,
      a.finalRatio, a.finalCO, a.finalCO2,
      a.satTermination, a.flueVisual, a.adequateVent,
      a.landlordsAppliance, a.inspected, a.appVisualCheck,
      a.appServiced, a.appSafeToUse];
  });
  while (appData.length < 5) appData.push([appData.length + 1, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

  doc.autoTable({
    startY: y, margin: { left: 8, right: 8 },
    head: [
      // Row 1: Section group headers
      [
        { content: 'Appliance Details', colSpan: 6, styles: hs },
        { content: 'Flue Tests', colSpan: 10, styles: { ...hs, fillColor: [26, 82, 118] } },
        { content: 'Inspection Details', colSpan: 8, styles: { ...hs, fillColor: [30, 58, 95] } },
      ],
      // Row 2: Column headers with full labels
      ['#', 'Location', 'Make', 'Model', 'Type', 'Flue\nType',
        'Operating\npressure (mBar)\nor heat input\n(kW/h or Btu/h)',
        'Safety\nDevice(s)\ncorrect\noperation', 'Spillage\ntest', 'Smoke Pellet\nFlue Flow\nTest',
        'Ratio', 'CO\nppm', 'CO2\n(%)', 'Ratio', 'CO\nppm', 'CO2\n(%)',
        'Satisfactory\nTermination', 'Flue visual\ncondition', 'Adequate\nventilation',
        "Landlord's\nappliance", 'Inspected', 'Appliance\nvisual check',
        'Appliance\nserviced', 'Appliance\nsafe to use'],
    ],
    body: appData,
    ...go,
    styles: { fontSize: 4.5, cellPadding: 0.8, lineColor: [176, 190, 197], lineWidth: 0.15, halign: 'center', valign: 'middle', overflow: 'linebreak' },
    headStyles: { fillColor: [227, 242, 253], textColor: [12, 31, 63], fontSize: 4, fontStyle: 'bold', halign: 'center', valign: 'middle' },
    columnStyles: { 0: { cellWidth: 5 }, 1: { cellWidth: 14 }, 4: { cellWidth: 18 } },
    didParseCell: function(data) {
      if (data.section === 'body') {
        if (data.column.index === 23 && data.cell.raw === 'Yes') { data.cell.styles.textColor = [46, 125, 50]; data.cell.styles.fontStyle = 'bold'; }
        if (data.column.index === 23 && data.cell.raw === 'No') { data.cell.styles.textColor = [198, 40, 40]; data.cell.styles.fontStyle = 'bold'; }
        if (data.column.index === 17 && data.cell.raw === 'Fail') { data.cell.styles.textColor = [198, 40, 40]; data.cell.styles.fontStyle = 'bold'; }
      }
    },
  });
  y = doc.lastAutoTable.finalY + 2;

  // ═══ PIPEWORK & ALARMS ═══
  var hw = (W - 20) / 2;

  doc.autoTable({ startY: y, margin: { left: 8 }, tableWidth: hw,
    head: [[{ content: 'Gas Installation Pipework', colSpan: 4, styles: hs }]],
    body: [
      [{ content: 'Satisfactory Visual Inspection', styles: th }, pipe.visualInsp || '', { content: 'Emergency Control Accessible', styles: th }, pipe.ecvAccessible || ''],
      [{ content: 'Satisfactory Gas Tightness Test', styles: th }, pipe.gasTightness || '', { content: 'Equipotential Bonding Satisfactory', styles: th }, pipe.bonding || ''],
    ], ...go, styles: { ...go.styles, fontSize: 5.5, cellPadding: 1, halign: 'center', valign: 'middle' } });

  var py = y;
  doc.autoTable({ startY: py, margin: { left: 12 + hw }, tableWidth: hw,
    head: [[{ content: 'Audible CO Alarms', colSpan: 4, styles: hs }]],
    body: [
      [{ content: 'Approved CO Alarms Fitted', styles: th }, alarms.coFitted || '', { content: 'Are CO Alarms in Date', styles: th }, alarms.coInDate || ''],
      [{ content: 'Testing CO Alarms', styles: th }, alarms.coTested || '', { content: 'Smoke Alarms Fitted', styles: th }, alarms.smokeFitted || ''],
    ], ...go, styles: { ...go.styles, fontSize: 5.5, cellPadding: 1, halign: 'center', valign: 'middle' } });
  y = doc.lastAutoTable.finalY + 1.5;

  // ═══ FAULTS ═══
  doc.autoTable({ startY: y, margin: { left: 8 }, tableWidth: hw,
    head: [[{ content: 'Give Details of Any Faults', styles: hs }]], body: [[faults || 'None']],
    ...go, styles: { ...go.styles, fontSize: 5.5, cellPadding: 1.5, minCellHeight: 8 } });
  doc.autoTable({ startY: y, margin: { left: 12 + hw }, tableWidth: hw,
    head: [[{ content: 'Rectification Work Carried Out', styles: hs }]], body: [[rect || 'None']],
    ...go, styles: { ...go.styles, fontSize: 5.5, cellPadding: 1.5, minCellHeight: 8 } });
  y = doc.lastAutoTable.finalY + 1.5;

  // ═══ WORKS ═══
  doc.autoTable({ startY: y, margin: { left: 8, right: 8 },
    head: [[{ content: 'Details of Works', styles: hs }]], body: [[works || 'None']],
    ...go, styles: { ...go.styles, fontSize: 5.5, cellPadding: 1.5 } });
  y = doc.lastAutoTable.finalY + 1;

  // ═══ FLUE CAP ═══
  doc.autoTable({ startY: y, margin: { left: 8, right: 8 },
    body: [[{ content: 'Has flue cap been put back?', styles: { ...th, fillColor: [255, 243, 224], halign: 'center' } }, { content: flueCap || 'N/A', styles: { ...td, fontStyle: 'bold', halign: 'center' } }]],
    ...go });
  y = doc.lastAutoTable.finalY + 1.5;

  // ═══ SIGNATURES ═══
  doc.autoTable({ startY: y, margin: { left: 8, right: 8 },
    head: [[{ content: 'Signatures', colSpan: 6, styles: hs }]],
    body: [
      [{ content: 'Signed', styles: th }, { content: decl.engSig || '', styles: { ...td, fontStyle: 'italic', fontSize: 7 } }, { content: 'Received By', styles: th }, decl.receivedBy || '', { content: 'Date', styles: th }, inspDate || ''],
      [{ content: 'Print Name', styles: th }, decl.engSig || '', { content: 'Print Name', styles: th }, decl.receivedBy || '\u2014', { content: 'Next Inspection Date', styles: th }, nextDate || ''],
    ],
    ...go, styles: { ...go.styles, fontSize: 6, cellPadding: 2, halign: 'center', valign: 'middle' },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [232, 234, 246] }, 2: { fontStyle: 'bold', fillColor: [232, 234, 246] }, 4: { fontStyle: 'bold', fillColor: [232, 234, 246] } } });

  // ═══ SAVE ═══
  doc.save('CP12_' + (certNo || 'Certificate') + '_' + (prop.postcode || 'cert').replace(/\s/g, '') + '.pdf');
}
