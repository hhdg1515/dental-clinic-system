import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DentalChart, ToothData, Appointment, ToothStatus, ToothCondition } from '../types';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

// Constants
const COLORS = {
  primary: [13, 148, 136] as [number, number, number],      // Teal
  secondary: [100, 116, 139] as [number, number, number],   // Slate
  success: [16, 185, 129] as [number, number, number],      // Emerald
  warning: [245, 158, 11] as [number, number, number],      // Amber
  danger: [239, 68, 68] as [number, number, number],        // Red
  text: [31, 41, 55] as [number, number, number],           // Gray-800
  lightText: [107, 114, 128] as [number, number, number],   // Gray-500
  background: [249, 250, 251] as [number, number, number],  // Gray-50
};

const STATUS_LABELS: Record<ToothStatus | ToothCondition, string> = {
  healthy: '健康',
  monitor: '观察',
  cavity: '龋齿',
  filled: '已补',
  missing: '缺失',
  implant: '种植',
  'root-canal': '根管',
  'post-op': '术后',
  urgent: '紧急',
};

const STATUS_COLORS: Record<ToothStatus | ToothCondition, [number, number, number]> = {
  healthy: COLORS.success,
  monitor: COLORS.warning,
  cavity: COLORS.danger,
  filled: [139, 92, 246],     // Violet
  missing: COLORS.secondary,
  implant: [59, 130, 246],    // Blue
  'root-canal': [236, 72, 153], // Pink
  'post-op': [249, 115, 22],  // Orange
  urgent: COLORS.danger,
};

// Helper: Add header to PDF
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo/Brand area
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 22);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 20, 30);
  }

  // Company name on right
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('First Ave Dental & Orthodontics', pageWidth - 20, 22, { align: 'right' });

  // Reset text color
  doc.setTextColor(...COLORS.text);
}

// Helper: Add footer
function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.lightText);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('zh-CN')} at ${new Date().toLocaleTimeString('zh-CN')}`,
    20,
    pageHeight - 10
  );
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
}

// Helper: Add section title
function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(title, 20, y);

  // Underline
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(20, y + 2, 80, y + 2);

  doc.setTextColor(...COLORS.text);
  return y + 10;
}

// Export Dental Chart to PDF
export function exportDentalChartPDF(
  chart: DentalChart,
  patientName: string,
  options: {
    includePeriodontal?: boolean;
    includeTreatments?: boolean;
  } = {}
): void {
  const { includePeriodontal = true, includeTreatments = true } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  addHeader(doc, '牙科图表报告', `Dental Chart Report`);

  // Patient info section
  let y = 50;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('患者信息', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`姓名: ${patientName}`, 20, y);
  doc.text(`更新日期: ${new Date(chart.lastUpdated).toLocaleDateString('zh-CN')}`, pageWidth / 2, y);
  y += 15;

  // Teeth Summary Table
  y = addSectionTitle(doc, '牙齿状态概览', y);

  // Group teeth by status
  const teethByStatus: Record<string, string[]> = {};
  Object.entries(chart.teeth).forEach(([toothNum, data]) => {
    const status = data.detailedStatus?.condition || data.status || 'healthy';
    if (!teethByStatus[status]) teethByStatus[status] = [];
    teethByStatus[status].push(toothNum);
  });

  const summaryData = Object.entries(teethByStatus).map(([status, teeth]) => [
    STATUS_LABELS[status as ToothStatus] || status,
    teeth.length.toString(),
    teeth.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')
  ]);

  autoTable(doc, {
    startY: y,
    head: [['状态', '数量', '牙位']],
    body: summaryData,
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLORS.background,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 'auto' },
    },
  });

  y = doc.lastAutoTable.finalY + 15;

  // Detailed Teeth Table
  y = addSectionTitle(doc, '详细牙齿信息', y);

  const teethData = Object.entries(chart.teeth)
    .filter(([_, data]) => data.status !== 'healthy' || data.treatments?.length > 0)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([toothNum, data]) => {
      const status = data.detailedStatus?.condition || data.status || 'healthy';
      const severity = data.detailedStatus?.severity || 'none';
      const surfaces = data.detailedStatus?.affectedSurfaces?.join(', ') || '-';
      const notes = data.detailedStatus?.clinicalNotes || '-';
      const treatmentCount = data.treatments?.length || 0;

      return [
        toothNum,
        STATUS_LABELS[status as ToothStatus] || status,
        severity === 'none' ? '-' : severity,
        surfaces,
        treatmentCount.toString(),
        notes.substring(0, 30) + (notes.length > 30 ? '...' : '')
      ];
    });

  if (teethData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['牙位', '状态', '严重程度', '受影响面', '治疗记录', '备注']],
      body: teethData,
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.background,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 'auto' },
      },
    });

    y = doc.lastAutoTable.finalY + 15;
  }

  // Treatment History
  if (includeTreatments) {
    const allTreatments: { toothNum: string; treatment: { date: string; type?: string; description?: string; createdBy: string } }[] = [];

    Object.entries(chart.teeth).forEach(([toothNum, data]) => {
      data.treatments?.forEach(t => {
        allTreatments.push({ toothNum, treatment: t });
      });
    });

    if (allTreatments.length > 0) {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      y = addSectionTitle(doc, '治疗历史记录', y);

      const treatmentData = allTreatments
        .sort((a, b) => new Date(b.treatment.date).getTime() - new Date(a.treatment.date).getTime())
        .slice(0, 20) // Limit to last 20 treatments
        .map(({ toothNum, treatment }) => [
          new Date(treatment.date).toLocaleDateString('zh-CN'),
          toothNum,
          treatment.type || '-',
          treatment.description || '-',
          treatment.createdBy
        ]);

      autoTable(doc, {
        startY: y,
        head: [['日期', '牙位', '类型', '描述', '操作者']],
        body: treatmentData,
        headStyles: {
          fillColor: COLORS.secondary,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: COLORS.background,
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
      });
    }
  }

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  // Save
  doc.save(`dental-chart-${patientName}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export Patient Report to PDF
export function exportPatientReportPDF(
  patientName: string,
  phone: string | undefined,
  email: string | undefined,
  appointments: Appointment[],
  dentalChart?: DentalChart
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  addHeader(doc, '患者档案报告', 'Patient Profile Report');

  // Patient Info Section
  let y = 50;
  y = addSectionTitle(doc, '基本信息', y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const infoData = [
    ['姓名', patientName],
    ['电话', phone || '未提供'],
    ['邮箱', email || '未提供'],
    ['预约总数', appointments.length.toString()],
    ['报告生成日期', new Date().toLocaleDateString('zh-CN')],
  ];

  autoTable(doc, {
    startY: y,
    body: infoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', textColor: COLORS.secondary },
      1: { cellWidth: 'auto' },
    },
  });

  y = doc.lastAutoTable.finalY + 15;

  // Appointment Statistics
  y = addSectionTitle(doc, '预约统计', y);

  const statusCounts: Record<string, number> = {};
  appointments.forEach(apt => {
    statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
  });

  const statsData = Object.entries(statusCounts).map(([status, count]) => [
    STATUS_LABELS[status as ToothStatus] || status,
    count.toString(),
    `${((count / appointments.length) * 100).toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: y,
    head: [['状态', '数量', '占比']],
    body: statsData,
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      halign: 'center',
    },
    tableWidth: 100,
  });

  y = doc.lastAutoTable.finalY + 15;

  // Recent Appointments
  y = addSectionTitle(doc, '预约记录', y);

  const sortedAppointments = [...appointments]
    .sort((a, b) => new Date(b.dateKey || b.appointmentDate).getTime() - new Date(a.dateKey || a.appointmentDate).getTime())
    .slice(0, 15);

  const appointmentData = sortedAppointments.map(apt => [
    apt.dateKey || apt.appointmentDate,
    apt.time,
    apt.service || apt.serviceType || '-',
    apt.location || apt.clinicLocation || '-',
    STATUS_LABELS[apt.status as ToothStatus] || apt.status
  ]);

  autoTable(doc, {
    startY: y,
    head: [['日期', '时间', '服务', '诊所', '状态']],
    body: appointmentData,
    headStyles: {
      fillColor: COLORS.secondary,
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: COLORS.background,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
  });

  y = doc.lastAutoTable.finalY + 15;

  // Dental Chart Summary (if available)
  if (dentalChart) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    y = addSectionTitle(doc, '牙科概况', y);

    const teethByStatus: Record<string, number> = {};
    Object.values(dentalChart.teeth).forEach(data => {
      const status = data.detailedStatus?.condition || data.status || 'healthy';
      teethByStatus[status] = (teethByStatus[status] || 0) + 1;
    });

    const chartSummary = Object.entries(teethByStatus).map(([status, count]) => [
      STATUS_LABELS[status as ToothStatus] || status,
      count.toString()
    ]);

    autoTable(doc, {
      startY: y,
      head: [['牙齿状态', '数量']],
      body: chartSummary,
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        halign: 'center',
      },
      tableWidth: 80,
    });
  }

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  // Save
  doc.save(`patient-report-${patientName}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export Appointment List PDF
export function exportAppointmentListPDF(
  appointments: Appointment[],
  title: string = '预约列表',
  dateRange?: { start: string; end: string }
): void {
  const doc = new jsPDF('landscape');

  // Header
  const subtitle = dateRange
    ? `${dateRange.start} - ${dateRange.end}`
    : new Date().toLocaleDateString('zh-CN');
  addHeader(doc, title, subtitle);

  let y = 50;

  // Summary stats
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`总计: ${appointments.length} 个预约`, 20, y);

  const completed = appointments.filter(a => a.status === 'completed').length;
  const pending = appointments.filter(a => a.status === 'pending').length;
  doc.text(`已完成: ${completed}  |  待确认: ${pending}`, 100, y);

  y += 10;

  // Appointments table
  const appointmentData = appointments
    .sort((a, b) => {
      const dateA = a.dateKey || a.appointmentDate;
      const dateB = b.dateKey || b.appointmentDate;
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.time || '').localeCompare(b.time || '');
    })
    .map(apt => [
      apt.dateKey || apt.appointmentDate,
      apt.time,
      apt.patientName,
      apt.phone || apt.patientPhone || '-',
      apt.service || apt.serviceType || '-',
      apt.location || apt.clinicLocation || '-',
      STATUS_LABELS[apt.status as ToothStatus] || apt.status,
      apt.notes?.substring(0, 20) || '-'
    ]);

  autoTable(doc, {
    startY: y,
    head: [['日期', '时间', '患者', '电话', '服务', '诊所', '状态', '备注']],
    body: appointmentData,
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLORS.background,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 18 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 },
      5: { cellWidth: 30 },
      6: { cellWidth: 20 },
      7: { cellWidth: 'auto' },
    },
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  // Save
  const filename = dateRange
    ? `appointments-${dateRange.start}-to-${dateRange.end}.pdf`
    : `appointments-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
