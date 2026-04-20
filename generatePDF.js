import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const GAS_SAFE_LOGO = 'data:image/jpeg;base64,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';

export function generateCertificatePDF(cert) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const { eng, prop, ll, apps, pipe, alarms, faults, rect, works, flueCap, decl, inspDate, nextDate, certNo, ct } = cert;
  const ctLabel = (ct || 'landlord').charAt(0).toUpperCase() + (ct || 'landlord').slice(1);

  // ═══ HEADER ═══
  doc.setFillColor(12, 31, 63);
  doc.rect(0, 0, W, 18, 'F');
  try { doc.addImage(GAS_SAFE_LOGO, 'JPEG', 2, 1, 16, 16); } catch (e) {}
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Homeowner / Landlord Gas Safety Record', W / 2, 9, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont(undefined, 'normal');
  doc.text('Gas Safety (Installation and Use) Regulations 1998', W / 2, 14, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text((certNo || '\u2014'), W - 6, 9, { align: 'right' });
  doc.setFontSize(6);
  doc.setFont(undefined, 'normal');
  doc.text('GAS SAFE REGISTER', W - 6, 14, { align: 'right' });

  // ═══ DISCLAIMER ═══
  var y = 19.5;
  doc.setFontSize(4.5);
  doc.setTextColor(120, 120, 120);
  doc.text('This inspection is for gas safety purposes only to comply with the Gas Safety (Installation and Use) Regulations. Flues have been inspected visually and checked for satisfactory evacuation of products of combustion. A detailed internal inspection of the flue integrity, construction and lining has NOT been carried out. Registered Business/engineer details can be checked at www.gassaferegister.co.uk or by calling 0800 408 5500.', 8, y, { maxWidth: W - 16 });
  y += 5;

  // ═══ STYLES ═══
  var hs = { fillColor: [12, 31, 63], textColor: [255, 255, 255], fontSize: 6, fontStyle: 'bold', cellPadding: 1, halign: 'center' };
  var th = { fillColor: [232, 234, 246], fontStyle: 'bold', fontSize: 5.5, cellPadding: 1 };
  var td = { fontSize: 5.5, cellPadding: 1 };
  var go = { theme: 'grid', styles: { lineColor: [176, 190, 197], lineWidth: 0.15 } };
  var cw = (W - 20) / 3;
  var mkR = function(pairs) { return pairs.map(function(p) { return [{ content: p[0], styles: th }, { content: p[1] || '', styles: td }]; }); };

  // ═══ THREE COLUMN INFO — all 7 rows each to prevent overlap ═══
  var infoStartY = y;

  doc.autoTable({ startY: infoStartY, margin: { left: 8 }, tableWidth: cw,
    head: [[{ content: 'Company / Installer', colSpan: 2, styles: hs }]],
    body: mkR([['Engineer', eng.name], ['Company', eng.company], ['Address', eng.address], ['Tel No.', eng.tel], ['Gas Safe Reg.', eng.gasSafe], ['ID Card No.', eng.idCard], ['Email', eng.email]]),
    ...go, columnStyles: { 0: { cellWidth: cw * 0.34 } } });
  var engEndY = doc.lastAutoTable.finalY;

  doc.autoTable({ startY: infoStartY, margin: { left: 10 + cw }, tableWidth: cw,
    head: [[{ content: 'Inspection / Installation Address', colSpan: 2, styles: hs }]],
    body: mkR([['Name', prop.name], ['Address', prop.address], ['City', ((prop.city || '') + ' ' + (prop.county || '')).trim()], ['Postcode', prop.postcode], ['Mobile', prop.mobile], ['Landline', prop.landline], ['Email', prop.email]]),
    ...go, columnStyles: { 0: { cellWidth: cw * 0.28 } } });
  var propEndY = doc.lastAutoTable.finalY;

  doc.autoTable({ startY: infoStartY, margin: { left: 12 + cw * 2 }, tableWidth: cw,
    head: [[{ content: ctLabel + ' / Agent / Customer', colSpan: 2, styles: hs }]],
    body: mkR([['Name', ll.name], ['Company Name', ll.company], ['Address', ll.address], ['City', ll.city || ''], ['Postcode', ll.postcode], ['Email', ll.email], ['Phone', ll.phone]]),
    ...go, columnStyles: { 0: { cellWidth: cw * 0.34 } } });
  var llEndY = doc.lastAutoTable.finalY;

  // Use the MAXIMUM Y from all three tables to prevent overlap
  y = Math.max(engEndY, propEndY, llEndY) + 2;

  // ═══ APPLIANCE TABLE ═══
  var appData = apps.map(function(a, i) {
    return [i + 1, a.location, a.make, a.model, a.type, a.flueType,
      a.operatingPressure, a.safetyDevices, a.spillageTest, a.smokePelletTest,
      a.initRatio, a.initCO, a.initCO2, a.finalRatio, a.finalCO, a.finalCO2,
      a.satTermination, a.flueVisual, a.adequateVent,
      a.landlordsAppliance, a.inspected, a.appVisualCheck,
      a.appServiced, a.appSafeToUse];
  });
  while (appData.length < 5) appData.push([appData.length + 1, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

  doc.autoTable({
    startY: y, margin: { left: 8, right: 8 },
    head: [
      [{ content: 'Appliance Details', colSpan: 6, styles: hs },
       { content: 'Flue Tests', colSpan: 10, styles: { ...hs, fillColor: [26, 82, 118] } },
       { content: 'Inspection Details', colSpan: 8, styles: { ...hs, fillColor: [30, 58, 95] } }],
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
  var pipeEndY = doc.lastAutoTable.finalY;

  doc.autoTable({ startY: y, margin: { left: 12 + hw }, tableWidth: hw,
    head: [[{ content: 'Audible CO Alarms', colSpan: 4, styles: hs }]],
    body: [
      [{ content: 'Approved CO Alarms Fitted', styles: th }, alarms.coFitted || '', { content: 'Are CO Alarms in Date', styles: th }, alarms.coInDate || ''],
      [{ content: 'Testing CO Alarms', styles: th }, alarms.coTested || '', { content: 'Smoke Alarms Fitted', styles: th }, alarms.smokeFitted || ''],
    ], ...go, styles: { ...go.styles, fontSize: 5.5, cellPadding: 1, halign: 'center', valign: 'middle' } });
  y = Math.max(pipeEndY, doc.lastAutoTable.finalY) + 1.5;

  // ═══ FAULTS ═══
  doc.autoTable({ startY: y, margin: { left: 8 }, tableWidth: hw,
    head: [[{ content: 'Give Details of Any Faults', styles: hs }]], body: [[faults || 'None']],
    ...go, styles: { ...go.styles, fontSize: 5.5, cellPadding: 1.5, minCellHeight: 8 } });
  var faultEndY = doc.lastAutoTable.finalY;
  doc.autoTable({ startY: y, margin: { left: 12 + hw }, tableWidth: hw,
    head: [[{ content: 'Rectification Work Carried Out', styles: hs }]], body: [[rect || 'None']],
    ...go, styles: { ...go.styles, fontSize: 5.5, cellPadding: 1.5, minCellHeight: 8 } });
  y = Math.max(faultEndY, doc.lastAutoTable.finalY) + 1.5;

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

  doc.save('CP12_' + (certNo || 'Certificate') + '_' + (prop.postcode || 'cert').replace(/\s/g, '') + '.pdf');
}
