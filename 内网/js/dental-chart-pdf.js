/**
 * Dental Chart PDF Export Module
 * Exports comprehensive dental chart reports to PDF format
 */

/**
 * Main function to export dental chart to PDF
 */
async function exportDentalChartPDF() {
    // Get patient data from the account modal
    const patientNameEl = document.getElementById('accountPatientName');
    if (!patientNameEl || !patientNameEl.textContent) {
        showNotification('⚠️ Please select a patient first');
        return;
    }

    // Get current patient data from window (set by appointments.js)
    const patientData = window._currentAccountPatient;
    if (!patientData) {
        showNotification('⚠️ Patient data not available. Please reopen the patient account.');
        return;
    }

    try {
        // Show loading indicator
        showNotification('📄 Generating PDF...');
        const exportBtn = document.getElementById('exportPdfBtn');
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        }

        // Get userId
        const userId = patientData.userId || `patient_${patientData.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const chartData = await window.firebaseDataService.getDentalChart(userId);

        if (!chartData) {
            throw new Error('Dental chart data not found');
        }

        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        let currentY = 15;

        // Add header
        currentY = addPDFHeader(doc, patientData, currentY, pageWidth);

        // Capture dental chart as image
        currentY = await addDentalChartImage(doc, currentY, pageWidth);

        // Add detailed findings
        currentY = addDetailedFindings(doc, chartData, currentY, pageWidth, pageHeight);

        // Add periodontal summary
        currentY = await addPeriodontalSummary(doc, userId, chartData, currentY, pageWidth, pageHeight);

        // Add treatment history
        currentY = addTreatmentHistory(doc, chartData, currentY, pageWidth, pageHeight);

        // Add footer
        addPDFFooter(doc, pageWidth, pageHeight);

        // Save PDF
        const filename = `DentalChart_${sanitizeFilename(patientData.patientName)}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);

        showNotification('✅ PDF exported successfully');
    } catch (error) {
        console.error('❌ Error exporting PDF:', error);
        showNotification('❌ Failed to export PDF: ' + error.message);
    } finally {
        // Reset button
        const exportBtn = document.getElementById('exportPdfBtn');
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Export PDF';
        }
    }
}

/**
 * Add PDF header with clinic info and patient details
 */
function addPDFHeader(doc, patientData, startY, pageWidth) {
    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('DENTAL CHART REPORT', pageWidth / 2, startY, { align: 'center' });

    // Clinic name
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('First Ave Dental', pageWidth / 2, startY + 7, { align: 'center' });

    // Divider line
    doc.setLineWidth(0.5);
    doc.line(20, startY + 12, pageWidth - 20, startY + 12);

    // Patient information
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Patient:', 20, startY + 20);
    doc.setFont(undefined, 'normal');
    doc.text(patientData.patientName || 'N/A', 45, startY + 20);

    doc.setFont(undefined, 'bold');
    doc.text('Report Date:', pageWidth - 70, startY + 20);
    doc.setFont(undefined, 'normal');
    doc.text(new Date().toLocaleDateString(), pageWidth - 30, startY + 20);

    if (patientData.patientPhone) {
        doc.setFont(undefined, 'bold');
        doc.text('Phone:', 20, startY + 27);
        doc.setFont(undefined, 'normal');
        doc.text(patientData.patientPhone, 45, startY + 27);
    }

    if (patientData.patientEmail) {
        doc.setFont(undefined, 'bold');
        doc.text('Email:', 20, startY + 34);
        doc.setFont(undefined, 'normal');
        doc.text(patientData.patientEmail, 45, startY + 34);
    }

    return startY + 42;
}

/**
 * Capture dental chart container as image and add to PDF
 */
async function addDentalChartImage(doc, startY, pageWidth) {
    const container = document.getElementById('dentalChartContainer');
    if (!container) {
        return startY;
    }

    try {
        // Temporarily hide tooth details panel for cleaner capture
        const detailsPanel = document.getElementById('toothDetailsPanel');
        const originalDisplay = detailsPanel ? detailsPanel.style.display : null;
        if (detailsPanel) {
            detailsPanel.style.display = 'none';
        }

        // Capture chart as canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
        });

        // Restore details panel
        if (detailsPanel && originalDisplay !== null) {
            detailsPanel.style.display = originalDisplay;
        }

        // Add title
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('DENTAL CHART (Universal System 1-32)', 20, startY);

        // Calculate dimensions to fit page
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const maxHeight = 100;
        const finalHeight = Math.min(imgHeight, maxHeight);
        const finalWidth = (canvas.width * finalHeight) / canvas.height;

        // Add image to PDF
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', (pageWidth - finalWidth) / 2, startY + 5, finalWidth, finalHeight);

        return startY + finalHeight + 15;
    } catch (error) {
        console.error('Error capturing dental chart:', error);
        return startY;
    }
}

/**
 * Add detailed findings section
 */
function addDetailedFindings(doc, chartData, startY, pageWidth, pageHeight) {
    // Check if we need a new page
    if (startY > pageHeight - 60) {
        doc.addPage();
        startY = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DETAILED FINDINGS', 20, startY);
    startY += 7;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');

    let findingsCount = 0;

    for (let i = 1; i <= 32; i++) {
        const tooth = chartData.teeth?.[i.toString()];
        if (tooth && tooth.status !== 'healthy') {
            // Check for page break
            if (startY > pageHeight - 20) {
                doc.addPage();
                startY = 20;
            }

            const statusText = tooth.status.charAt(0).toUpperCase() + tooth.status.slice(1).replace(/-/g, ' ');
            doc.setFont(undefined, 'bold');
            doc.text(`Tooth #${i}:`, 22, startY);
            doc.setFont(undefined, 'normal');
            doc.text(statusText, 42, startY);

            startY += 5;

            // Add detailed classification if available
            if (tooth.detailedStatus) {
                const ds = tooth.detailedStatus;
                const severity = ds.severity.charAt(0).toUpperCase() + ds.severity.slice(1);
                const surfaces = ds.affectedSurfaces && ds.affectedSurfaces.length > 0
                    ? ds.affectedSurfaces.join(', ')
                    : 'N/A';

                doc.setFontSize(8);
                doc.text(`  Severity: ${severity}`, 22, startY);
                startY += 3;
                doc.text(`  Surfaces: ${surfaces}`, 22, startY);
                startY += 3;

                if (ds.clinicalNotes) {
                    const notes = ds.clinicalNotes.substring(0, 60) + (ds.clinicalNotes.length > 60 ? '...' : '');
                    doc.setTextColor(100, 116, 139);
                    doc.text(`  Notes: ${notes}`, 22, startY);
                    doc.setTextColor(0, 0, 0);
                    startY += 4;
                }

                doc.setFontSize(9);
                startY += 1;
            }

            // Add periodontal info if available
            if (tooth.periodontal) {
                const perio = tooth.periodontal;
                const depths = [
                    perio.buccal.mesial, perio.buccal.mid, perio.buccal.distal,
                    perio.lingual.mesial, perio.lingual.mid, perio.lingual.distal
                ];
                const maxDepth = Math.max(...depths);
                const avgDepth = (depths.reduce((a, b) => a + b, 0) / 6).toFixed(1);

                if (maxDepth > 4) {
                    doc.text(`  Periodontal: Avg ${avgDepth}mm, Max ${maxDepth}mm`, 22, startY);
                    if (maxDepth >= 7) {
                        doc.setTextColor(220, 38, 38); // Red
                        doc.text('(Severe)', 90, startY);
                        doc.setTextColor(0, 0, 0);
                    } else if (maxDepth >= 4) {
                        doc.setTextColor(245, 158, 11); // Orange
                        doc.text('(Moderate)', 90, startY);
                        doc.setTextColor(0, 0, 0);
                    }
                    startY += 5;
                }
            }

            // Add treatment notes if available
            if (tooth.treatments && tooth.treatments.length > 0) {
                const latestTreatment = tooth.treatments[tooth.treatments.length - 1];
                if (latestTreatment.notes) {
                    const notes = latestTreatment.notes.substring(0, 80) + (latestTreatment.notes.length > 80 ? '...' : '');
                    doc.setFontSize(8);
                    doc.setTextColor(100, 116, 139);
                    doc.text(`  "${notes}"`, 22, startY);
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(9);
                    startY += 5;
                }
            }

            startY += 2;
            findingsCount++;
        }
    }

    if (findingsCount === 0) {
        doc.setTextColor(16, 185, 129); // Green
        doc.text('All teeth are healthy!', 22, startY);
        doc.setTextColor(0, 0, 0);
        startY += 7;
    }

    return startY + 5;
}

/**
 * Add periodontal summary section
 */
async function addPeriodontalSummary(doc, userId, chartData, startY, pageWidth, pageHeight) {
    // Check if we need a new page
    if (startY > pageHeight - 60) {
        doc.addPage();
        startY = 20;
    }

    try {
        const summary = await window.firebaseDataService.getPeriodontalSummary(userId);

        if (!summary || summary.teethWithData === 0) {
            return startY;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('PERIODONTAL SUMMARY', 20, startY);
        startY += 7;

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');

        doc.text(`Teeth with measurements: ${summary.teethWithData}`, 22, startY);
        startY += 5;
        doc.text(`Average pocket depth: ${summary.averageDepth}mm`, 22, startY);
        startY += 5;
        doc.text(`Maximum pocket depth: ${summary.maxDepth}mm`, 22, startY);
        startY += 5;
        doc.text(`Teeth with bleeding: ${summary.teethWithBleeding}`, 22, startY);
        startY += 7;

        if (summary.problemAreas && summary.problemAreas.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.text('Problem Areas (>4mm):', 22, startY);
            startY += 5;
            doc.setFont(undefined, 'normal');

            summary.problemAreas.forEach(area => {
                if (startY > pageHeight - 15) {
                    doc.addPage();
                    startY = 20;
                }

                doc.text(`  Tooth #${area.toothNum}: ${area.maxDepth}mm`, 24, startY);
                startY += 5;
            });
        }

        return startY + 5;
    } catch (error) {
        console.error('Error adding periodontal summary:', error);
        return startY;
    }
}

/**
 * Add treatment history section
 */
function addTreatmentHistory(doc, chartData, startY, pageWidth, pageHeight) {
    // Collect all treatments
    const allTreatments = [];

    for (let i = 1; i <= 32; i++) {
        const tooth = chartData.teeth?.[i.toString()];
        if (tooth?.treatments && tooth.treatments.length > 0) {
            tooth.treatments.forEach(treatment => {
                allTreatments.push({
                    toothNum: i,
                    ...treatment
                });
            });
        }
    }

    if (allTreatments.length === 0) {
        return startY;
    }

    // Sort by date (newest first)
    allTreatments.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit to 15 most recent
    const recentTreatments = allTreatments.slice(0, 15);

    // Check if we need a new page
    if (startY > pageHeight - 60) {
        doc.addPage();
        startY = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RECENT TREATMENT HISTORY', 20, startY);
    startY += 7;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');

    recentTreatments.forEach((treatment, index) => {
        if (startY > pageHeight - 15) {
            doc.addPage();
            startY = 20;
        }

        const date = new Date(treatment.date).toLocaleDateString();
        doc.setFont(undefined, 'bold');
        doc.text(`${date} - Tooth #${treatment.toothNum}:`, 22, startY);
        doc.setFont(undefined, 'normal');

        if (treatment.notes) {
            const notes = treatment.notes.substring(0, 70) + (treatment.notes.length > 70 ? '...' : '');
            doc.text(notes, 22, startY + 4);
            startY += 9;
        } else {
            startY += 5;
        }
    });

    if (allTreatments.length > 15) {
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`(Showing 15 of ${allTreatments.length} total treatments)`, 22, startY + 2);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
    }

    return startY + 10;
}

/**
 * Add PDF footer
 */
function addPDFFooter(doc, pageWidth, pageHeight) {
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer line
        doc.setLineWidth(0.3);
        doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Generated by First Ave Dental Management System', 20, pageHeight - 10);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 35, pageHeight - 10);
        doc.setTextColor(0, 0, 0);
    }
}

/**
 * Sanitize filename for safe file system use
 */
function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Make function globally available
window.exportDentalChartPDF = exportDentalChartPDF;
