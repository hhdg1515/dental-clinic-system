// Dental Chart Component - Simplified version with CSS grid
// Universal numbering system (1-32)

// XSS Prevention: Escape HTML function (inline to avoid module import issues)
function escapeHtml(str) {
    if (str === null || str === undefined) {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

class DentalChart {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.mode = options.mode || 'view'; // 'view' or 'edit'
        this.teethData = options.teethData || {};
        this.selectedTooth = null;
        this.onToothSelect = options.onToothSelect || (() => {});

        // Status colors (Universal system)
        this.statusColors = {
            'healthy': '#10b981',      // Green
            'monitor': '#f59e0b',      // Amber
            'cavity': '#ef4444',       // Red
            'filled': '#3b82f6',       // Blue
            'missing': '#6b7280',      // Gray
            'implant': '#8b5cf6',      // Purple
            'root-canal': '#f97316',   // Orange
            'post-op': '#06b6d4',      // Cyan
            'urgent': '#dc2626'        // Dark Red
        };

        this.init();
    }

    init() {
        if (!this.container) {
            console.error('❌ Dental chart container not found');
            return;
        }

        this.render();
        this.attachEventListeners();
        console.log('✅ Dental Chart initialized');
    }

    render() {
        const html = this.generateHTML();
        this.container.innerHTML = html;
    }

    generateHTML() {
        // Teeth positions (Universal numbering 1-32)
        // Upper Right: 1-8, Upper Left: 9-16
        // Lower Left: 17-24, Lower Right: 25-32

        return `
            <div class="dental-chart-wrapper">
                <div class="chart-title">Dental Chart - Universal System (1-32)</div>

                <div class="chart-quadrants">
                    <!-- Upper Right -->
                    <div class="quadrant quadrant-ur">
                        <div class="quadrant-label">UR (1-8)</div>
                        <div class="teeth-row">
                            ${this.generateToothButtons([8, 7, 6, 5, 4, 3, 2, 1])}
                        </div>
                    </div>

                    <!-- Upper Left -->
                    <div class="quadrant quadrant-ul">
                        <div class="quadrant-label">UL (9-16)</div>
                        <div class="teeth-row">
                            ${this.generateToothButtons([9, 10, 11, 12, 13, 14, 15, 16])}
                        </div>
                    </div>

                    <!-- Lower Left -->
                    <div class="quadrant quadrant-ll">
                        <div class="quadrant-label">LL (17-24)</div>
                        <div class="teeth-row">
                            ${this.generateToothButtons([24, 23, 22, 21, 20, 19, 18, 17])}
                        </div>
                    </div>

                    <!-- Lower Right -->
                    <div class="quadrant quadrant-lr">
                        <div class="quadrant-label">LR (25-32)</div>
                        <div class="teeth-row">
                            ${this.generateToothButtons([25, 26, 27, 28, 29, 30, 31, 32])}
                        </div>
                    </div>
                </div>

                <div class="legend">
                    <div class="legend-title">Status:</div>
                    <div class="legend-items">
                        ${this.generateLegend()}
                    </div>
                </div>
            </div>
        `;
    }

    generateToothButtons(toothNumbers) {
        return toothNumbers.map(num => {
            const tooth = this.teethData[num.toString()] || { detailedStatus: { condition: 'healthy' }, treatments: [] };

            // Get condition from detailedStatus (new system) or fallback to status (legacy)
            const condition = tooth.detailedStatus?.condition || tooth.status || 'healthy';

            // Validate tooth condition against whitelist to prevent XSS in CSS
            const validStatuses = ['healthy', 'monitor', 'cavity', 'filled', 'missing', 'implant', 'root-canal', 'post-op', 'urgent'];
            const safeStatus = validStatuses.includes(condition) ? condition : 'healthy';
            const color = this.statusColors[safeStatus];

            const treatmentCount = tooth.treatments ? tooth.treatments.length : 0;

            const showDot = safeStatus && safeStatus !== 'healthy';
            return `
                <button class="tooth-btn"
                        data-tooth="${num}"
                        title="${num}: ${escapeHtml(safeStatus)}${treatmentCount > 0 ? ` (${treatmentCount} treatments)` : ''}">
                    <span class="tooth-number">${num}</span>
                    ${showDot ? `<span class="status-dot" style="background-color: ${color};"></span>` : ''}
                    ${treatmentCount > 0 ? `<span class="treatment-badge">${treatmentCount}</span>` : ''}
                </button>
            `;
        }).join('');
    }

    generateLegend() {
        return Object.entries(this.statusColors).map(([status, color]) => {
            if (status === 'healthy' || status === 'urgent') {
                return '';
            }
            return `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${color};"></div>
                    <span>${status}</span>
                </div>
            `;
        }).join('');
    }

    attachEventListeners() {
        // Tooth button click
        this.container.querySelectorAll('.tooth-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const toothNum = parseInt(btn.dataset.tooth);
                this.selectTooth(toothNum);
            });
        });
    }

    selectTooth(toothNum) {
        // Remove previous selection
        this.container.querySelectorAll('.tooth-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Add selection to clicked tooth
        const toothBtn = this.container.querySelector(`[data-tooth="${toothNum}"]`);
        if (toothBtn) {
            toothBtn.classList.add('selected');
            this.selectedTooth = toothNum;
            this.onToothSelect(toothNum, this.teethData[toothNum.toString()] || {});
        }
    }

    // Update tooth data
    updateToothData(toothNum, data) {
        this.teethData[toothNum.toString()] = data;
        const btn = this.container.querySelector(`[data-tooth="${toothNum}"]`);
        if (btn) {
            // Validate tooth status against whitelist
            const validStatuses = ['healthy', 'monitor', 'cavity', 'filled', 'missing', 'implant', 'root-canal', 'post-op', 'urgent'];
            const safeStatus = validStatuses.includes(data.status) ? data.status : 'healthy';
            const color = this.statusColors[safeStatus];

            // Use textContent instead of setting HTML to prevent XSS
            btn.title = `${toothNum}: ${safeStatus}`;
            let statusDot = btn.querySelector('.status-dot');
            if (safeStatus === 'healthy') {
                if (statusDot) statusDot.remove();
            } else {
                if (!statusDot) {
                    statusDot = document.createElement('span');
                    statusDot.className = 'status-dot';
                    btn.appendChild(statusDot);
                }
                statusDot.style.backgroundColor = color;
            }

            const treatmentCount = data.treatments ? data.treatments.length : 0;
            if (treatmentCount > 0) {
                let badge = btn.querySelector('.treatment-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'treatment-badge';
                    btn.appendChild(badge);
                }
                badge.textContent = treatmentCount;
            } else {
                const badge = btn.querySelector('.treatment-badge');
                if (badge) badge.remove();
            }
        }
    }

    // Get selected tooth number
    getSelectedTooth() {
        return this.selectedTooth;
    }

    // Get tooth data
    getToothData(toothNum) {
        return this.teethData[toothNum.toString()] || null;
    }

    // Set all teeth data
    setAllTeethData(teethData) {
        this.teethData = teethData;
        this.render();
        this.attachEventListeners();
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.DentalChart = DentalChart;
}

console.log('✅ DentalChart component loaded');
