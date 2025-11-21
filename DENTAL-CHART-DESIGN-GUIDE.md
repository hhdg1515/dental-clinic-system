# Dental Chart Integration Design Guide

## 1. Project Goals
- **Elevate clinical visibility** on the internal patients page by surfacing tooth-level status, recent treatments, and pending follow-ups without leaving the main workflow.
- **Preserve current Firebase cost discipline** by batching reads/writes and extending existing cache layers instead of enabling high-frequency listeners.
- **Deliver a modular foundation** that can incrementally grow from simple color-coded states to richer media (intraoral photos, X-rays, procedure notes) per tooth.

## 2. Experience Overview

### 2.1 Patients List Enhancements
- Replace the purely tabular view with patient summary cards. Each card shows:
  - Primary contact data (name, phone, email)
  - Next appointment date/time
  - Compact "Tooth Status Strip" highlighting flagged teeth (visual color-coded indicators)
- Selecting a patient opens a persistent right-hand drawer (replacing modal churn) containing:
  - Dental chart visualization
  - Timeline of treatments
  - Quick actions (upload file, add note, set reminder)

### 2.2 Dental Chart Drawer
- **Layout:** Chart occupies the left half of the drawer; clicking a tooth reveals details on the right
- **Badge System:** Colors correspond to state values:
  - `healthy`: default gray/green border
  - `monitor`: amber fill with optional dot indicator
  - `in-progress`: violet border + spinner icon overlay
  - `post-op`: blue fill with check icon
  - `urgent`: red fill + pulsing outline
- **Interactive Elements:**
  - Hover tooltips show `summary` + `lastUpdated`
  - Icons overlay to indicate attachments or scheduled procedures

### 2.3 Detail Panel
- Shows chronological entries (procedure notes, uploads) grouped per tooth
- Allows administrators to:
  - Add structured entries (status change, notes, reminders)
  - Upload supporting assets (X-rays, photos, documents)
  - View treatment history timeline

## 3. Data Model Extensions

### 3.1 Firestore Schema - NEW COLLECTION APPROACH

**IMPORTANT:** The current system uses separate collections for appointments and patient profiles. We will create a NEW independent collection for dental charts.

#### Collection Structure

```jsonc
// NEW COLLECTION: dentalCharts/{patientId}
dentalCharts/{patientId} {
  patientId: "john_doe",                  // Normalized patient ID (lowercase, underscores)
  patientName: "John Doe",                // Display name
  clinicLocation: "rowland-heights",      // Primary clinic location (normalized)
  lastUpdated: "2024-03-02T15:04:00Z",
  teeth: {
    "11": {                               // FDI tooth numbering (11-18, 21-28, 31-38, 41-48)
      status: "in-progress",              // enum: healthy|monitor|in-progress|post-op|urgent
      statusColor: "#FFB020",             // optional custom color override
      summary: "Implant placement scheduled for 2024-04-01",
      lastUpdated: "2024-03-02T15:04:00Z",
      flags: ["needs-lab", "scheduled"],  // optional tags for filters
      metrics: {                          // optional structured measurements
        pocketDepth: 4,
        mobility: 1
      },
      entries: [                          // Treatment history for this tooth
        {
          id: "entry-20240302",
          type: "note" | "image" | "document" | "xray",
          title: "Surgery consent uploaded",
          createdBy: "admin_rowland_heights",
          createdAt: "2024-03-02T15:04:00Z",
          content: "Consent form received and signed.",
          // For small files/thumbnails (< 50KB)
          base64Data: "data:image/jpeg;base64,...",  // optional
          // For large files (> 50KB) - use Firebase Storage
          storagePath: "dentalCharts/john_doe/tooth_11/consent-20240302.pdf",  // optional
          downloadURL: "https://...",     // optional
          fileSize: 245678,               // in bytes
          mimeType: "application/pdf"
        }
      ]
    },
    "26": {
      status: "monitor",
      summary: "Crack observation. Review on 2024-04-01.",
      lastUpdated: "2024-02-15T09:30:00Z",
      entries: []
    }
  }
}
```

#### Why a Separate Collection?

1. **Separation of Concerns:** Dental chart data is distinct from appointment scheduling and patient profiles
2. **Independent Scaling:** Dental charts can grow large with images/documents without affecting other queries
3. **Cache Optimization:** Can implement longer cache TTL (12 hours) without affecting appointment data
4. **Firestore Document Limit:** Main patient document won't exceed 1 MiB limit due to dental chart data

#### Relationship to Existing Collections

```
appointments/{appointmentId}           // EXISTING - appointment scheduling
  ├─ patientName, date, time, status...

patientProfiles/{patientId}            // EXISTING - basic patient info
  ├─ patientName, phone, email
  └─ detailedInfo: { selfDescription, notes }

dentalCharts/{patientId}               // NEW - tooth-level clinical data
  ├─ teeth: { 11: {...}, 26: {...} }
  └─ entries: [ treatments, notes, images ]
```

### 3.2 Read Strategy

**Smart Loading Pattern:**
1. **List View:** Only load tooth status strip (minimal data)
   - Query: `SELECT patientId, teeth.*.status, teeth.*.flags FROM dentalCharts`
   - Cache: 12 hours in `GlobalCacheManager`
2. **Drawer Open:** Load full dental chart for selected patient
   - Query: `GET /dentalCharts/{patientId}`
   - Cache: 12 hours in `GlobalCacheManager`
3. **Detail View:** Lazy load entries/attachments on demand
   - Only fetch large files when user clicks "View X-ray"
   - Use download URLs from Storage for images > 50KB

### 3.3 Write Strategy

**Batched Writes:**
```javascript
// Update multiple teeth after a procedure
const batch = writeBatch(db);
const chartRef = doc(db, 'dentalCharts', patientId);

batch.update(chartRef, {
  'teeth.11.status': 'completed',
  'teeth.11.lastUpdated': new Date().toISOString(),
  'teeth.12.status': 'post-op',
  'teeth.12.lastUpdated': new Date().toISOString(),
  lastUpdated: new Date().toISOString()
});

await batch.commit();
```

**Entry Management:**
- Entries array stays within tooth object if total size < 500 KB
- For patients with extensive history, consider archiving old entries to subcollection

### 3.4 File Upload Strategy

**Hybrid Approach (Cost-Optimized):**

| File Type | Size | Storage Method | Reason |
|-----------|------|----------------|--------|
| Thumbnails | < 50 KB | Base64 in Firestore | Fast display, no extra fetch |
| Small PDFs | < 200 KB | Base64 in Firestore | Simple, fewer reads |
| Photos | > 50 KB | Firebase Storage | Lower cost, parallel loading |
| X-rays | > 200 KB | Firebase Storage | Required for large files |

**Implementation:**
```javascript
async uploadToothAttachment(patientId, toothId, file) {
  const MAX_BASE64_SIZE = 50 * 1024; // 50 KB

  if (file.size < MAX_BASE64_SIZE) {
    // Small file: Store as Base64 in Firestore
    const base64 = await this.fileToBase64(file);
    return {
      type: this.getFileType(file),
      base64Data: base64,
      fileSize: file.size,
      mimeType: file.type
    };
  } else {
    // Large file: Upload to Firebase Storage
    const storagePath = `dentalCharts/${patientId}/tooth_${toothId}/${Date.now()}_${file.name}`;
    const downloadURL = await this.uploadToStorage(storagePath, file);
    return {
      type: this.getFileType(file),
      storagePath: storagePath,
      downloadURL: downloadURL,
      fileSize: file.size,
      mimeType: file.type
    };
  }
}
```

## 4. Service Layer Changes

### 4.1 firebase-data-service.js Extensions

Add new methods to `FirebaseDataService` class:

```javascript
// Get dental chart for a patient
async getDentalChart(patientId) {
  await this.ensureReady();
  const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

  const db = this.validateDatabase();
  const chartRef = doc(db, 'dentalCharts', patientId);
  const chartSnap = await getDoc(chartRef);

  if (chartSnap.exists()) {
    return { id: chartSnap.id, ...chartSnap.data() };
  }
  return null;
}

// Update tooth status (single tooth)
async updateToothStatus(patientId, toothId, statusData) {
  await this.ensureReady();
  const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

  const db = this.validateDatabase();
  const chartRef = doc(db, 'dentalCharts', patientId);

  await updateDoc(chartRef, {
    [`teeth.${toothId}.status`]: statusData.status,
    [`teeth.${toothId}.summary`]: statusData.summary,
    [`teeth.${toothId}.lastUpdated`]: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });

  return true;
}

// Add entry to tooth (note, image, document)
async addToothEntry(patientId, toothId, entryData) {
  await this.ensureReady();
  const { doc, updateDoc, arrayUnion } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

  const db = this.validateDatabase();
  const chartRef = doc(db, 'dentalCharts', patientId);

  const entry = {
    id: `entry-${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdBy: this.auth.currentUser?.uid || 'unknown',
    ...entryData
  };

  await updateDoc(chartRef, {
    [`teeth.${toothId}.entries`]: arrayUnion(entry),
    [`teeth.${toothId}.lastUpdated`]: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });

  return entry;
}

// Batch update multiple teeth (for procedures affecting multiple teeth)
async batchUpdateTeeth(patientId, teethUpdates) {
  await this.ensureReady();
  const { doc, writeBatch } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

  const db = this.validateDatabase();
  const batch = writeBatch(db);
  const chartRef = doc(db, 'dentalCharts', patientId);

  const updates = { lastUpdated: new Date().toISOString() };

  for (const [toothId, data] of Object.entries(teethUpdates)) {
    updates[`teeth.${toothId}`] = {
      ...data,
      lastUpdated: new Date().toISOString()
    };
  }

  batch.update(chartRef, updates);
  await batch.commit();

  console.log(`✅ Batch updated ${Object.keys(teethUpdates).length} teeth`);
  return true;
}

// Delete tooth entry
async deleteToothEntry(patientId, toothId, entryId) {
  await this.ensureReady();
  const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');

  const db = this.validateDatabase();
  const chartRef = doc(db, 'dentalCharts', patientId);
  const chartSnap = await getDoc(chartRef);

  if (chartSnap.exists()) {
    const chartData = chartSnap.data();
    const tooth = chartData.teeth?.[toothId];
    if (tooth?.entries) {
      const updatedEntries = tooth.entries.filter(e => e.id !== entryId);
      await updateDoc(chartRef, {
        [`teeth.${toothId}.entries`]: updatedEntries,
        [`teeth.${toothId}.lastUpdated`]: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  }

  return true;
}
```

### 4.2 Firestore Security Rules

Update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: Check if user has access to clinic
    function hasClinicAccess(clinicId) {
      let userConfig = get(/databases/$(database)/documents/userConfig/$(request.auth.uid)).data;
      return request.auth != null && (
        userConfig.role == 'boss' ||
        userConfig.role == 'owner' ||
        clinicId in userConfig.accessibleLocations
      );
    }

    // Dental Charts Collection
    match /dentalCharts/{patientId} {
      // Read: User must be authenticated and have clinic access
      allow read: if request.auth != null &&
        hasClinicAccess(resource.data.clinicLocation);

      // Write: User must be authenticated, have clinic access, and respect size limits
      allow create, update: if request.auth != null &&
        hasClinicAccess(request.resource.data.clinicLocation) &&
        // Prevent cross-patient data pollution
        request.resource.data.patientId == patientId &&
        // Limit document size to 1 MB (Firestore limit)
        request.resource.size() < 1000000 &&
        // Validate required fields
        request.resource.data.keys().hasAll(['patientId', 'patientName', 'clinicLocation', 'teeth']);

      // Delete: Only boss/owner can delete
      allow delete: if request.auth != null &&
        get(/databases/$(database)/documents/userConfig/$(request.auth.uid)).data.role in ['boss', 'owner'];
    }

    // ... existing rules for other collections
  }
}
```

### 4.3 Cache Manager Extension

Extend `GlobalCacheManager` (内网/js/cache-manager.js):

```javascript
class GlobalCacheManager {
  constructor() {
    // ... existing code

    // Dental Charts Cache
    this.dentalChartsCache = new Map();          // {patientId: chartData}
    this.dentalChartsTimestamps = new Map();     // {patientId: timestamp}
    this.DENTAL_CHART_CACHE_DURATION = 12 * 60 * 60 * 1000;  // 12 hours
  }

  // ========== Dental Chart Cache ==========

  getDentalChartCache(patientId) {
    if (!this.isDentalChartCacheValid(patientId)) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    this.stats.savedReads++;
    console.log(`📦 Dental Chart Cache HIT: ${patientId}`);
    return this.dentalChartsCache.get(patientId);
  }

  setDentalChartCache(patientId, chartData) {
    this.dentalChartsCache.set(patientId, chartData);
    this.dentalChartsTimestamps.set(patientId, Date.now());
    console.log(`💾 Cached dental chart: ${patientId}`);
  }

  isDentalChartCacheValid(patientId) {
    if (!this.dentalChartsCache.has(patientId) ||
        !this.dentalChartsTimestamps.has(patientId)) {
      return false;
    }

    const timestamp = this.dentalChartsTimestamps.get(patientId);
    const age = Date.now() - timestamp;
    return age < this.DENTAL_CHART_CACHE_DURATION;
  }

  invalidateDentalChartCache(patientId) {
    this.dentalChartsCache.delete(patientId);
    this.dentalChartsTimestamps.delete(patientId);
    console.log(`🗑️ Invalidated dental chart cache: ${patientId}`);
  }

  // Invalidate all dental chart caches (use after bulk updates)
  invalidateAllDentalCharts() {
    this.dentalChartsCache.clear();
    this.dentalChartsTimestamps.clear();
    console.log('🗑️ Cleared all dental chart caches');
  }
}
```

## 5. Front-End Architecture

### 5.1 Patients Page Refactor (patients.html + patients.js)

**HTML Changes:**

```html
<!-- Replace table with card grid -->
<div class="patients-card-grid" id="pendingCardsGrid">
  <!-- Cards will be dynamically generated -->
</div>

<!-- Patient Drawer (new component) -->
<div class="patient-drawer" id="patientDrawer" data-patient-id="">
  <div class="drawer-overlay" id="drawerOverlay"></div>
  <div class="drawer-content">
    <div class="drawer-header">
      <h3 id="drawerPatientName">Patient Name</h3>
      <button class="drawer-close" id="drawerClose">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="drawer-body">
      <div class="dental-chart-container">
        <!-- Dental chart will be injected here -->
        <div id="dentalChartSvg"></div>
      </div>
      <div class="tooth-detail-panel" id="toothDetailPanel">
        <!-- Selected tooth details -->
        <div class="no-tooth-selected">
          Select a tooth to view details
        </div>
      </div>
    </div>
  </div>
</div>
```

**Patient Card Template:**

```javascript
function createPatientCard(appointment) {
  const toothStatusStrip = generateToothStatusStrip(appointment.patientId);

  return `
    <div class="patient-card" data-patient-id="${appointment.patientId}">
      <div class="card-header">
        <h4>${escapeHtml(appointment.patientName)}</h4>
        <span class="appointment-badge">${appointment.dateKey} ${appointment.time}</span>
      </div>
      <div class="card-body">
        <div class="contact-info">
          <i class="fas fa-phone"></i> ${escapeHtml(appointment.phone)}
        </div>
        <div class="service-info">
          <i class="fas fa-tooth"></i> ${escapeHtml(appointment.service)}
        </div>
        ${toothStatusStrip}
      </div>
      <div class="card-footer">
        <button class="btn-view-chart" onclick="openDentalChart('${appointment.patientId}')">
          View Chart
        </button>
      </div>
    </div>
  `;
}
```

### 5.2 Dental Chart Component (js/components/dental-chart.js)

**NEW FILE:** Create reusable vanilla JS component

```javascript
// Dental Chart Component - Renders interactive SVG dental chart
export class DentalChart {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.mode = options.mode || 'view';  // 'view' or 'edit'
    this.teethData = options.teethData || {};
    this.selectedTooth = null;
    this.onToothSelect = options.onToothSelect || (() => {});

    this.render();
    this.attachEventListeners();
  }

  render() {
    const svg = this.generateSVG();
    this.container.innerHTML = svg;
    this.updateToothStates();
  }

  generateSVG() {
    // FDI tooth numbering system
    // Upper: 18-11 (right to left), 21-28 (left to right)
    // Lower: 48-41 (right to left), 31-38 (left to right)

    return `
      <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" class="dental-chart-svg">
        <!-- Upper Teeth -->
        <g id="upper-teeth">
          ${this.generateUpperTeeth()}
        </g>

        <!-- Lower Teeth -->
        <g id="lower-teeth">
          ${this.generateLowerTeeth()}
        </g>

        <!-- Labels -->
        <text x="400" y="20" text-anchor="middle" class="chart-title">Upper</text>
        <text x="400" y="390" text-anchor="middle" class="chart-title">Lower</text>
      </svg>
    `;
  }

  generateUpperTeeth() {
    const teeth = [];
    const y = 50;
    const toothWidth = 45;
    const gap = 5;

    // Right side: 18-11 (right to left)
    for (let i = 18; i >= 11; i--) {
      const x = 400 - (18 - i + 1) * (toothWidth + gap);
      teeth.push(this.generateTooth(i, x, y));
    }

    // Left side: 21-28 (left to right)
    for (let i = 21; i <= 28; i++) {
      const x = 400 + (i - 21) * (toothWidth + gap);
      teeth.push(this.generateTooth(i, x, y));
    }

    return teeth.join('\n');
  }

  generateLowerTeeth() {
    const teeth = [];
    const y = 250;
    const toothWidth = 45;
    const gap = 5;

    // Right side: 48-41 (right to left)
    for (let i = 48; i >= 41; i--) {
      const x = 400 - (48 - i + 1) * (toothWidth + gap);
      teeth.push(this.generateTooth(i, x, y));
    }

    // Left side: 31-38 (left to right)
    for (let i = 31; i <= 38; i++) {
      const x = 400 + (i - 31) * (toothWidth + gap);
      teeth.push(this.generateTooth(i, x, y));
    }

    return teeth.join('\n');
  }

  generateTooth(toothId, x, y) {
    const toothData = this.teethData[toothId] || {};
    const status = toothData.status || 'healthy';
    const hasAttachments = toothData.entries?.length > 0;

    return `
      <g class="tooth-group" data-tooth-id="${toothId}">
        <rect
          x="${x}"
          y="${y}"
          width="40"
          height="60"
          rx="5"
          class="tooth tooth-${status}"
          data-tooth-id="${toothId}"
        />
        <text
          x="${x + 20}"
          y="${y + 35}"
          text-anchor="middle"
          class="tooth-number"
        >${toothId}</text>
        ${hasAttachments ? `<circle cx="${x + 35}" cy="${y + 10}" r="5" class="attachment-indicator"/>` : ''}
      </g>
    `;
  }

  updateToothStates() {
    for (const [toothId, data] of Object.entries(this.teethData)) {
      const toothElement = this.container.querySelector(`[data-tooth-id="${toothId}"]`);
      if (toothElement) {
        toothElement.classList.remove('tooth-healthy', 'tooth-monitor', 'tooth-in-progress', 'tooth-post-op', 'tooth-urgent');
        toothElement.classList.add(`tooth-${data.status || 'healthy'}`);
      }
    }
  }

  attachEventListeners() {
    this.container.addEventListener('click', (e) => {
      const tooth = e.target.closest('.tooth-group');
      if (tooth) {
        const toothId = tooth.dataset.toothId;
        this.selectTooth(toothId);
      }
    });

    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.selectedTooth) {
        this.onToothSelect(this.selectedTooth, this.teethData[this.selectedTooth]);
      }
    });
  }

  selectTooth(toothId) {
    // Remove previous selection
    this.container.querySelectorAll('.tooth-selected').forEach(el => {
      el.classList.remove('tooth-selected');
    });

    // Add new selection
    const toothElement = this.container.querySelector(`[data-tooth-id="${toothId}"]`);
    if (toothElement) {
      toothElement.classList.add('tooth-selected');
      this.selectedTooth = toothId;
      this.onToothSelect(toothId, this.teethData[toothId] || {});
    }
  }

  updateTeethData(newData) {
    this.teethData = newData;
    this.updateToothStates();
  }
}
```

### 5.3 Tooth Detail Component (js/components/tooth-detail.js)

**NEW FILE:**

```javascript
// Tooth Detail Panel Component
import { escapeHtml } from '../security-utils.js';

export class ToothDetailPanel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.mode = options.mode || 'view';
    this.onUpdate = options.onUpdate || (() => {});
    this.currentToothId = null;
    this.currentData = null;
  }

  render(toothId, toothData) {
    this.currentToothId = toothId;
    this.currentData = toothData || {};

    const html = `
      <div class="tooth-detail-header">
        <h4>Tooth #${toothId}</h4>
        ${this.mode === 'edit' ? '<button class="btn-edit" id="editToothBtn">Edit</button>' : ''}
      </div>

      <div class="tooth-status-section">
        <label>Status:</label>
        <span class="status-badge status-${this.currentData.status || 'healthy'}">
          ${this.currentData.status || 'healthy'}
        </span>
      </div>

      <div class="tooth-summary-section">
        <label>Summary:</label>
        <p>${escapeHtml(this.currentData.summary || 'No notes')}</p>
      </div>

      <div class="tooth-timeline-section">
        <h5>Treatment Timeline</h5>
        ${this.renderTimeline()}
      </div>

      ${this.mode === 'edit' ? this.renderActions() : ''}
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  renderTimeline() {
    if (!this.currentData.entries || this.currentData.entries.length === 0) {
      return '<p class="no-entries">No treatment history</p>';
    }

    return this.currentData.entries
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(entry => `
        <div class="timeline-entry">
          <div class="entry-header">
            <span class="entry-type">${this.getEntryIcon(entry.type)} ${entry.type}</span>
            <span class="entry-date">${new Date(entry.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="entry-content">
            <strong>${escapeHtml(entry.title)}</strong>
            <p>${escapeHtml(entry.content || '')}</p>
            ${entry.base64Data || entry.downloadURL ? this.renderAttachment(entry) : ''}
          </div>
        </div>
      `).join('');
  }

  renderAttachment(entry) {
    if (entry.type === 'image' && entry.base64Data) {
      return `<img src="${entry.base64Data}" class="entry-image" alt="Attachment">`;
    } else if (entry.downloadURL) {
      return `<a href="${entry.downloadURL}" target="_blank" class="entry-link">View Attachment</a>`;
    }
    return '';
  }

  getEntryIcon(type) {
    const icons = {
      note: '<i class="fas fa-sticky-note"></i>',
      image: '<i class="fas fa-image"></i>',
      document: '<i class="fas fa-file-pdf"></i>',
      xray: '<i class="fas fa-x-ray"></i>'
    };
    return icons[type] || '<i class="fas fa-file"></i>';
  }

  renderActions() {
    return `
      <div class="tooth-actions">
        <button class="btn-action" id="addNoteBtn">
          <i class="fas fa-sticky-note"></i> Add Note
        </button>
        <button class="btn-action" id="uploadFileBtn">
          <i class="fas fa-upload"></i> Upload File
        </button>
        <button class="btn-action" id="changeStatusBtn">
          <i class="fas fa-edit"></i> Change Status
        </button>
      </div>
    `;
  }

  attachEventListeners() {
    // Add event listeners for edit mode actions
    if (this.mode === 'edit') {
      const addNoteBtn = this.container.querySelector('#addNoteBtn');
      const uploadFileBtn = this.container.querySelector('#uploadFileBtn');
      const changeStatusBtn = this.container.querySelector('#changeStatusBtn');

      addNoteBtn?.addEventListener('click', () => this.showAddNoteDialog());
      uploadFileBtn?.addEventListener('click', () => this.showUploadFileDialog());
      changeStatusBtn?.addEventListener('click', () => this.showChangeStatusDialog());
    }
  }

  showAddNoteDialog() {
    // Implementation: Show modal or inline form for adding note
    this.onUpdate('addNote', this.currentToothId);
  }

  showUploadFileDialog() {
    // Implementation: Show file upload dialog
    this.onUpdate('uploadFile', this.currentToothId);
  }

  showChangeStatusDialog() {
    // Implementation: Show status change dialog
    this.onUpdate('changeStatus', this.currentToothId);
  }
}
```

### 5.4 Styling (内网/css/dental-chart.css)

**NEW FILE:**

```css
/* Dental Chart Styles */

:root {
  /* Tooth status colors */
  --tooth-healthy: #3DBE8B;
  --tooth-monitor: #FFB020;
  --tooth-urgent: #F85640;
  --tooth-postop: #6C5CE7;
  --tooth-inactive: #D6DCE5;
  --tooth-in-progress: #A855F7;
}

/* Patient Card Grid */
.patients-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 20px;
}

.patient-card {
  background: var(--glass-bg);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.patient-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.tooth-status-strip {
  display: flex;
  gap: 4px;
  margin-top: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
}

.tooth-status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.tooth-status-indicator.urgent { background: var(--tooth-urgent); }
.tooth-status-indicator.monitor { background: var(--tooth-monitor); }
.tooth-status-indicator.in-progress { background: var(--tooth-in-progress); }

/* Patient Drawer */
.patient-drawer {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 0;
  z-index: 1000;
  transition: width 0.3s ease;
  overflow: hidden;
}

.patient-drawer.active {
  width: 70%;
}

.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.patient-drawer.active .drawer-overlay {
  opacity: 1;
  pointer-events: all;
}

.drawer-content {
  position: relative;
  height: 100%;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  overflow-y: auto;
}

/* Dental Chart SVG */
.dental-chart-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dental-chart-svg {
  width: 100%;
  height: auto;
}

.tooth {
  fill: white;
  stroke: #ccc;
  stroke-width: 2;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tooth:hover {
  stroke-width: 3;
  filter: brightness(0.95);
}

.tooth-healthy {
  fill: var(--tooth-healthy);
  fill-opacity: 0.2;
  stroke: var(--tooth-healthy);
}

.tooth-monitor {
  fill: var(--tooth-monitor);
  fill-opacity: 0.3;
  stroke: var(--tooth-monitor);
}

.tooth-in-progress {
  fill: var(--tooth-in-progress);
  fill-opacity: 0.3;
  stroke: var(--tooth-in-progress);
}

.tooth-post-op {
  fill: var(--tooth-postop);
  fill-opacity: 0.3;
  stroke: var(--tooth-postop);
}

.tooth-urgent {
  fill: var(--tooth-urgent);
  fill-opacity: 0.4;
  stroke: var(--tooth-urgent);
  animation: pulse 2s ease-in-out infinite;
}

.tooth-selected {
  stroke-width: 4;
  stroke: #000;
}

.tooth-number {
  font-size: 12px;
  fill: #333;
  pointer-events: none;
}

.attachment-indicator {
  fill: #2563eb;
  stroke: white;
  stroke-width: 1;
}

@keyframes pulse {
  0%, 100% { stroke-opacity: 1; }
  50% { stroke-opacity: 0.5; }
}

/* Tooth Detail Panel */
.tooth-detail-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
}

.no-tooth-selected {
  text-align: center;
  color: #999;
  padding: 40px 20px;
}

.timeline-entry {
  padding: 12px;
  border-left: 3px solid var(--tooth-monitor);
  margin-bottom: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.entry-image {
  max-width: 100%;
  border-radius: 4px;
  margin-top: 8px;
}

/* Responsive Design */
@media (max-width: 1023px) {
  .patient-drawer.active {
    width: 100%;
  }

  .drawer-body {
    grid-template-columns: 1fr;
  }
}
```

## 6. Interaction Design

### 6.1 States & Visual Feedback

| State | Color | Icon | Use Case |
|-------|-------|------|----------|
| `healthy` | Green (#3DBE8B) | - | No issues detected |
| `monitor` | Amber (#FFB020) | Dot | Watch for changes (e.g., crack) |
| `in-progress` | Purple (#A855F7) | Spinner | Active treatment scheduled |
| `post-op` | Blue (#6C5CE7) | Check | Recently treated, healing |
| `urgent` | Red (#F85640) | Pulsing | Requires immediate attention |

### 6.2 User Flows

**Flow 1: View Patient Dental Chart**
1. User sees patient card with tooth status strip
2. Clicks "View Chart" button
3. Drawer slides in from right
4. Dental chart loads (cache first, then Firestore)
5. User hovers over tooth → tooltip shows summary
6. User clicks tooth → detail panel shows timeline

**Flow 2: Update Tooth Status**
1. User opens dental chart (Flow 1)
2. Clicks tooth to select
3. Clicks "Change Status" button in detail panel
4. Modal shows status dropdown + summary textarea
5. User selects new status, enters note
6. Clicks "Save"
7. **Optimistic update:** UI immediately reflects change
8. Background: Write to Firestore
9. On success: Cache invalidated, show toast "Saved"
10. On error: Revert UI, show error toast

**Flow 3: Upload Attachment**
1. User selects tooth
2. Clicks "Upload File" button
3. File picker opens
4. User selects image/PDF
5. File uploads (Base64 or Storage based on size)
6. Progress indicator shows
7. On complete: Entry added to timeline
8. Cache invalidated

## 7. Incremental Delivery Plan (Revised)

### Sprint 1 - Data Foundations (1-2 weeks)
**Goal:** Establish data layer and caching

- [ ] Create `dentalCharts` Firestore collection structure
- [ ] Update Firestore security rules
- [ ] Add CRUD methods to `firebase-data-service.js`:
  - `getDentalChart(patientId)`
  - `updateToothStatus(patientId, toothId, statusData)`
  - `addToothEntry(patientId, toothId, entryData)`
  - `batchUpdateTeeth(patientId, teethUpdates)`
- [ ] Extend `GlobalCacheManager` with dental chart caching
- [ ] Create seed data for 5 pilot patients
- [ ] Test: Verify cache hit/miss logic works

**Deliverable:** Backend ready, manual Firestore console testing passes

### Sprint 2 - UI Shell (1-2 weeks)
**Goal:** Transform patients list and add drawer

- [ ] Convert `patients.html` table to card grid layout
- [ ] Create patient card template with tooth status strip
- [ ] Implement drawer component (HTML/CSS)
- [ ] Add open/close drawer animations
- [ ] Wire up "View Chart" button to drawer
- [ ] Test: Drawer opens/closes smoothly on all viewports

**Deliverable:** Card UI live, drawer shell functional (no chart yet)

### Sprint 3 - Dental Chart MVP (2 weeks)
**Goal:** Render interactive SVG chart

- [ ] Create `dental-chart.js` component
- [ ] Generate SVG with FDI tooth numbering (11-48)
- [ ] Implement tooth state color coding
- [ ] Add hover tooltips (tooth ID + summary)
- [ ] Connect to real Firestore data via cache
- [ ] Add tooth selection highlighting
- [ ] Test: Chart renders correctly, colors match statuses

**Deliverable:** Working dental chart in drawer, read-only mode

### Sprint 4 - Editing & Attachments (2 weeks)
**Goal:** Enable data modification

- [ ] Create `tooth-detail.js` component
- [ ] Implement "Change Status" modal
- [ ] Implement "Add Note" functionality
- [ ] Implement file upload (hybrid Base64/Storage)
- [ ] Add optimistic updates with error rollback
- [ ] Cache invalidation on writes
- [ ] Test: Full CRUD cycle works end-to-end

**Deliverable:** Full read-write dental chart system

### Sprint 5 - Polish & Testing (1-2 weeks)
**Goal:** Production readiness

- [ ] Performance optimization (lazy loading, batch operations)
- [ ] Accessibility audit:
  - Keyboard navigation (Tab, Enter, Esc)
  - ARIA labels for screen readers
  - Focus indicators
  - Color contrast validation
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile/tablet responsive testing
- [ ] User acceptance testing with 2-3 admins
- [ ] Fix bugs and iterate based on feedback
- [ ] Documentation for future developers

**Deliverable:** Production-ready feature, user-approved

## 8. Testing Strategy

### 8.1 Unit Tests

**Pure JS Modules (dental-chart.js, tooth-detail.js):**
- Test tooth numbering generation (expect 32 teeth)
- Test status-to-color mapping
- Test entry sanitization (XSS prevention)

### 8.2 Integration Tests

**Firebase Operations:**
- Seed test data in staging Firestore
- Test `getDentalChart()` returns correct structure
- Test batched writes update multiple teeth
- Test cache invalidation after writes
- Monitor Firebase console for read count (should not exceed budget)

**Cache Tests:**
- Open drawer twice for same patient
- Verify second open uses cache (no Firestore read)
- Update tooth status
- Verify cache invalidated and next read fetches fresh data

### 8.3 UX Validation

**Hallway Testing:**
- Show tooth numbering to non-clinical staff
- Ask: "Can you find tooth #26?"
- Ask: "What does the orange color mean?"
- Iterate on color legend clarity

**Accessibility Audit:**
- Use screen reader (NVDA/JAWS) to navigate chart
- Verify all interactive elements are keyboard-accessible
- Check focus order is logical
- Validate WCAG 2.1 AA contrast ratios

## 9. Security & Compliance

### 9.1 Input Sanitization

**All user inputs must be sanitized:**
```javascript
import { escapeHtml } from './security-utils.js';

// When rendering notes/summaries
const safeNote = escapeHtml(toothData.summary);
noteElement.textContent = safeNote;  // NOT innerHTML!
```

### 9.2 File Upload Security

**Validation:**
- Check file type: `['image/jpeg', 'image/png', 'application/pdf']`
- Limit file size: 10 MB max
- Scan filename for path traversal attempts

```javascript
function validateFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10 MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  // Sanitize filename
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return safeName;
}
```

### 9.3 Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /dentalCharts/{patientId}/{toothId}/{filename} {
      // Only authenticated users can read/write
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        // Limit file size to 10 MB
        request.resource.size < 10 * 1024 * 1024 &&
        // Only allow specific file types
        request.resource.contentType.matches('image/.*') ||
        request.resource.contentType == 'application/pdf';
    }
  }
}
```

### 9.4 Audit Trail

**Log all modifications:**
```javascript
async addToothEntry(patientId, toothId, entryData) {
  const entry = {
    ...entryData,
    createdBy: this.auth.currentUser?.uid || 'unknown',
    createdByName: await this.getUserName(this.auth.currentUser?.uid),
    createdAt: new Date().toISOString(),
    ipAddress: await this.getClientIP(),  // Optional
  };
  // ... save to Firestore
}
```

### 9.5 Role-Based Access Control

**Respect clinic assignments:**
```javascript
// In firebase-data-service.js
async getDentalChart(patientId, userRole, userClinics) {
  const chart = await this.fetchDentalChart(patientId);

  // Verify user has access to this clinic
  if (!this.hasClinicAccess(chart.clinicLocation, userRole, userClinics)) {
    throw new Error('Access denied to this patient chart');
  }

  return chart;
}
```

## 10. Analytics & Telemetry

**Lightweight event tracking:**

```javascript
function trackDentalChartEvent(eventName, data) {
  // Batch events locally
  if (!window.analyticsQueue) window.analyticsQueue = [];

  window.analyticsQueue.push({
    event: eventName,
    timestamp: new Date().toISOString(),
    ...data
  });

  // Flush every 10 events or 5 minutes
  if (window.analyticsQueue.length >= 10) {
    flushAnalytics();
  }
}

// Example usage
trackDentalChartEvent('dental_chart_opened', { patientId: 'john_doe' });
trackDentalChartEvent('tooth_status_changed', {
  toothId: '11',
  oldStatus: 'monitor',
  newStatus: 'in-progress'
});
```

**Metrics to track:**
- Drawer open rate (% of patient cards clicked)
- Average time spent in drawer
- Number of tooth status changes per week
- Number of urgent flags resolved per week
- File upload success rate

## 11. Open Questions

### To Clarify Before Implementation:

1. **Procedure Templates:**
   - Do we need pre-defined templates for common treatments (e.g., "Crown Prep", "Root Canal")?
   - Should templates auto-populate certain tooth statuses?

2. **Multi-Tooth Selection:**
   - Should users be able to select multiple teeth at once for batch operations?
   - Example: Mark teeth 11-13 as "in-progress" after bridge procedure

3. **Mobile Workflow:**
   - Is there a requirement for tablet use in operatories?
   - Should there be a simplified view for chairside updates?

4. **Localization:**
   - Are multilingual labels required (English/Chinese)?
   - Should tooth numbering support multiple systems (FDI/Universal/Palmer)?

5. **Integration with External Systems:**
   - Does the clinic use any practice management software (Dentrix, Eaglesoft)?
   - Should dental charts sync bidirectionally?

6. **Patient Portal:**
   - Will patients eventually see their own dental charts?
   - If yes, what data should be visible/hidden?

## 12. Success Metrics

**Launch Criteria (MVP):**
- [ ] 5 pilot patients have complete dental charts
- [ ] All admins can view/edit charts without errors
- [ ] Cache hit rate > 70% (reduce Firebase reads)
- [ ] Page load time < 2 seconds
- [ ] Zero XSS vulnerabilities in security audit
- [ ] Accessibility score > 90 (Lighthouse)

**Post-Launch (30 days):**
- [ ] 50+ patients with dental chart data
- [ ] Average 10+ tooth status updates per day
- [ ] User satisfaction score > 4/5
- [ ] Zero data loss incidents
- [ ] Firebase read cost increase < 10%

---

## Appendix A: Tooth Numbering Reference

**FDI World Dental Federation Notation:**

```
Upper Right   Upper Left
18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28

48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38
Lower Right   Lower Left
```

**Quadrant Breakdown:**
- **1st Quadrant (Upper Right):** 11-18
- **2nd Quadrant (Upper Left):** 21-28
- **3rd Quadrant (Lower Left):** 31-38
- **4th Quadrant (Lower Right):** 41-48

## Appendix B: Sample Firestore Document

```json
{
  "patientId": "john_doe",
  "patientName": "John Doe",
  "clinicLocation": "rowland-heights",
  "lastUpdated": "2024-03-15T10:30:00Z",
  "teeth": {
    "11": {
      "status": "in-progress",
      "statusColor": "#A855F7",
      "summary": "Crown preparation completed. Lab work pending.",
      "lastUpdated": "2024-03-15T10:30:00Z",
      "flags": ["needs-lab", "scheduled"],
      "entries": [
        {
          "id": "entry-1710499800000",
          "type": "note",
          "title": "Crown Prep Complete",
          "content": "Tooth prepared for PFM crown. Impression taken.",
          "createdBy": "admin_rowland_heights",
          "createdAt": "2024-03-15T10:30:00Z"
        },
        {
          "id": "entry-1710486000000",
          "type": "image",
          "title": "Pre-op Photo",
          "base64Data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
          "createdBy": "admin_rowland_heights",
          "createdAt": "2024-03-15T06:40:00Z"
        }
      ]
    },
    "26": {
      "status": "monitor",
      "summary": "Craze line detected. Monitor for propagation.",
      "lastUpdated": "2024-02-28T14:20:00Z",
      "entries": []
    }
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** 2024-03-15
**Next Review:** After Sprint 1 completion

This design guide is a living document and should be updated as the implementation progresses and new requirements emerge.
