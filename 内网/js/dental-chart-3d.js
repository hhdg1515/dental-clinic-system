// 3D Dental Chart Component using Three.js
// Universal numbering system (1-32)
// API compatible with DentalChart (2D version)

class DentalChart3D {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.mode = options.mode || 'view';
        this.teethData = options.teethData || {};
        this.selectedTooth = null;
        this.onToothSelect = options.onToothSelect || (() => {});

        // Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.labelRenderer = null;

        // Tooth meshes map: { toothNum: THREE.Mesh }
        this.teethMeshes = {};
        this.toothLabels = {};

        // Status colors (matching 2D version - hex format for Three.js)
        this.statusColors = {
            'healthy': 0xdff5eb,
            'monitor': 0xf59e0b,
            'cavity': 0xef4444,
            'filled': 0x3b82f6,
            'missing': 0x9ca3af,
            'implant': 0x8b5cf6,
            'root-canal': 0xf97316,
            'post-op': 0x06b6d4,
            'urgent': 0xdc2626
        };

        // Raycaster for click detection
        this.raycaster = null;
        this.mouse = null;

        // Check WebGL support
        if (!this.checkWebGLSupport()) {
            console.warn('WebGL not supported, falling back to 2D');
            this.fallbackTo2D();
            return;
        }

        this.init();
    }

    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    fallbackTo2D() {
        // Fall back to 2D DentalChart
        if (typeof DentalChart !== 'undefined') {
            const chart2D = new DentalChart(this.container.id, {
                mode: this.mode,
                teethData: this.teethData,
                onToothSelect: this.onToothSelect
            });
            // Copy methods to maintain API compatibility
            this.selectTooth = chart2D.selectTooth.bind(chart2D);
            this.updateToothData = chart2D.updateToothData.bind(chart2D);
            this.getSelectedTooth = chart2D.getSelectedTooth.bind(chart2D);
            this.getToothData = chart2D.getToothData.bind(chart2D);
            this.setAllTeethData = chart2D.setAllTeethData.bind(chart2D);
        }
    }

    init() {
        if (!this.container) {
            console.error('❌ 3D Dental chart container not found');
            return;
        }

        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLabelRenderer();
        this.setupControls();
        this.setupLights();
        this.createTeeth();
        this.createLegend();
        this.createControls();
        this.setupRaycaster();
        this.setupEventListeners();
        this.animate();

        console.log('✅ 3D Dental Chart initialized');
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf7fbff);
    }

    setupCamera() {
        const width = this.container.clientWidth || 600;
        const height = 420;

        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        // Position camera for a good view of both arches
        this.camera.position.set(0, 120, 180);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        const width = this.container.clientWidth || 600;
        const height = 420;

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Create canvas wrapper
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'dental-chart-3d-canvas';
        canvasWrapper.appendChild(this.renderer.domElement);

        this.container.innerHTML = '';
        this.container.appendChild(canvasWrapper);
        this.canvasWrapper = canvasWrapper;
    }

    setupLabelRenderer() {
        this.labelRenderer = new THREE.CSS2DRenderer();

        const width = this.container.clientWidth || 600;
        const height = 420;

        this.labelRenderer.setSize(width, height);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        this.labelRenderer.domElement.style.left = '0';
        this.labelRenderer.domElement.style.pointerEvents = 'none';

        this.canvasWrapper.appendChild(this.labelRenderer.domElement);
    }

    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.maxPolarAngle = Math.PI * 0.75;
        this.controls.minPolarAngle = Math.PI * 0.1;
        this.controls.minDistance = 80;
        this.controls.maxDistance = 350;
        this.controls.enablePan = false;
        this.controls.rotateSpeed = 0.6;
        this.controls.zoomSpeed = 0.8;
    }

    setupLights() {
        // Ambient light for overall illumination
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambient);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
        mainLight.position.set(50, 100, 80);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);

        // Fill light from front-left
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-60, 60, 100);
        this.scene.add(fillLight);

        // Back light for rim
        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(0, 50, -100);
        this.scene.add(backLight);
    }

    createTeeth() {
        // Upper arch: teeth 1-16, Lower arch: teeth 17-32
        // Viewed from front: upper right (1-8), upper left (9-16)
        //                    lower left (17-24), lower right (25-32)

        const upperY = 25;
        const lowerY = -25;
        const archRadius = 70;

        for (let i = 1; i <= 32; i++) {
            const isUpper = i <= 16;
            const yPos = isUpper ? upperY : lowerY;

            // Calculate position along arch
            const position = this.calculateToothPosition(i, archRadius, yPos);

            // Create tooth mesh
            const toothMesh = this.createToothMesh(i, position, isUpper);

            // Create number label
            this.createToothLabel(i, toothMesh, isUpper);

            this.teethMeshes[i] = toothMesh;
            this.scene.add(toothMesh);
        }

        // Apply initial colors based on teethData
        this.updateAllTeethColors();
    }

    calculateToothPosition(toothNum, archRadius, yPos) {
        // Map tooth numbers to arch position
        // The arch follows a parabolic/U shape

        let t, xSign;

        if (toothNum <= 8) {
            // Upper right: 1-8 (1=back right, 8=front center right)
            t = (toothNum - 1) / 7; // 0 to 1
            xSign = 1; // Right side (positive X when viewed from front)
        } else if (toothNum <= 16) {
            // Upper left: 9-16 (9=front center left, 16=back left)
            t = (toothNum - 9) / 7; // 0 to 1
            xSign = -1; // Left side
        } else if (toothNum <= 24) {
            // Lower left: 17-24 (17=back left, 24=front center left)
            t = (24 - toothNum) / 7; // 1 to 0 (reversed)
            xSign = -1;
        } else {
            // Lower right: 25-32 (25=front center right, 32=back right)
            t = (toothNum - 25) / 7; // 0 to 1
            xSign = 1;
        }

        // Arch shape: parabolic curve
        // X increases from center to sides
        // Z is highest at center, curves back at sides (for front teeth being forward)
        const xNorm = 0.1 + t * 0.9; // Start slightly offset from center
        const x = xSign * xNorm * archRadius;

        // Z position: front teeth protrude more
        const zMax = 30;
        const zCurve = Math.cos(t * Math.PI * 0.6) * zMax;

        return new THREE.Vector3(x, yPos, zCurve);
    }

    createToothMesh(toothNum, position, isUpper) {
        const type = this.getToothType(toothNum);
        const geometry = this.getToothGeometry(type);

        // Get initial color
        const color = this.getToothColor(toothNum);

        const material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 60,
            specular: 0x444444,
            transparent: true,
            opacity: 0.95
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.userData.toothNum = toothNum;
        mesh.userData.type = type;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Rotate teeth to face outward and proper orientation
        const angle = Math.atan2(position.x, position.z);
        mesh.rotation.y = angle;

        // Upper teeth root up, lower teeth root down
        if (!isUpper) {
            mesh.rotation.x = Math.PI;
        }

        return mesh;
    }

    getToothType(toothNum) {
        // Molars: 1-3, 14-16, 17-19, 30-32
        if ([1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].includes(toothNum)) return 'molar';
        // Premolars: 4-5, 12-13, 20-21, 28-29
        if ([4, 5, 12, 13, 20, 21, 28, 29].includes(toothNum)) return 'premolar';
        // Canines: 6, 11, 22, 27
        if ([6, 11, 22, 27].includes(toothNum)) return 'canine';
        // Incisors: 7-10, 23-26
        return 'incisor';
    }

    getToothGeometry(type) {
        let geometry;

        switch (type) {
            case 'molar':
                // Large, box-like with rounded edges
                geometry = new THREE.BoxGeometry(10, 14, 10);
                break;

            case 'premolar':
                // Medium, slightly narrower
                geometry = new THREE.BoxGeometry(7, 12, 8);
                break;

            case 'canine':
                // Pointed, cone-like
                geometry = new THREE.ConeGeometry(4, 14, 6);
                break;

            case 'incisor':
                // Flat, chisel-shaped
                geometry = new THREE.BoxGeometry(5, 13, 3);
                break;

            default:
                geometry = new THREE.BoxGeometry(7, 12, 7);
        }

        return geometry;
    }

    createToothLabel(toothNum, mesh, isUpper) {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'tooth-3d-label';
        labelDiv.textContent = toothNum.toString();

        const label = new THREE.CSS2DObject(labelDiv);
        // Position label above or below tooth depending on jaw
        const labelOffset = isUpper ? 12 : -12;
        label.position.set(0, labelOffset, 0);

        mesh.add(label);
        this.toothLabels[toothNum] = labelDiv;

        // Add treatment badge if exists
        this.updateTreatmentBadge(toothNum, this.teethData[toothNum.toString()]);
    }

    createLegend() {
        const legendDiv = document.createElement('div');
        legendDiv.className = 'dental-chart-3d-legend';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'legend-3d-title';
        titleSpan.textContent = 'Status:';
        legendDiv.appendChild(titleSpan);

        const statusLabels = {
            'monitor': 'Monitor',
            'cavity': 'Cavity',
            'filled': 'Filled',
            'missing': 'Missing',
            'implant': 'Implant',
            'root-canal': 'Root Canal',
            'post-op': 'Post-op'
        };

        Object.entries(statusLabels).forEach(([status, label]) => {
            const item = document.createElement('div');
            item.className = 'legend-3d-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-3d-color';
            colorBox.style.backgroundColor = '#' + this.statusColors[status].toString(16).padStart(6, '0');

            const textSpan = document.createElement('span');
            textSpan.textContent = label;

            item.appendChild(colorBox);
            item.appendChild(textSpan);
            legendDiv.appendChild(item);
        });

        this.canvasWrapper.appendChild(legendDiv);
    }

    createControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'dental-chart-3d-controls';

        // Reset view button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'chart-control-btn';
        resetBtn.title = 'Reset View';
        resetBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        resetBtn.onclick = () => this.resetView();

        // Zoom in button
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'chart-control-btn';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
        zoomInBtn.onclick = () => this.zoomIn();

        // Zoom out button
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'chart-control-btn';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i>';
        zoomOutBtn.onclick = () => this.zoomOut();

        controlsDiv.appendChild(resetBtn);
        controlsDiv.appendChild(zoomInBtn);
        controlsDiv.appendChild(zoomOutBtn);

        this.canvasWrapper.appendChild(controlsDiv);
    }

    setupRaycaster() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    setupEventListeners() {
        // Click handler
        this.renderer.domElement.addEventListener('click', (event) => {
            this.onCanvasClick(event);
        });

        // Hover handler for cursor
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            this.onCanvasHover(event);
        });

        // Window resize handler
        this._resizeHandler = () => this.handleResize();
        window.addEventListener('resize', this._resizeHandler);
    }

    onCanvasClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const meshes = Object.values(this.teethMeshes);
        const intersects = this.raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const toothNum = intersects[0].object.userData.toothNum;
            this.selectTooth(toothNum);
        }
    }

    onCanvasHover(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const meshes = Object.values(this.teethMeshes);
        const intersects = this.raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            this.renderer.domElement.style.cursor = 'pointer';
        } else {
            this.renderer.domElement.style.cursor = 'grab';
        }
    }

    // ===== API Methods (compatible with DentalChart 2D) =====

    selectTooth(toothNum) {
        // Deselect previous
        if (this.selectedTooth !== null) {
            this.updateToothHighlight(this.selectedTooth, false);
        }

        // Select new
        this.selectedTooth = toothNum;
        this.updateToothHighlight(toothNum, true);

        // Trigger callback
        this.onToothSelect(toothNum, this.teethData[toothNum.toString()] || {});
    }

    updateToothHighlight(toothNum, isSelected) {
        const mesh = this.teethMeshes[toothNum];
        const labelDiv = this.toothLabels[toothNum];

        if (mesh) {
            if (isSelected) {
                mesh.material.emissive = new THREE.Color(0x2563eb);
                mesh.material.emissiveIntensity = 0.4;
                mesh.scale.set(1.15, 1.15, 1.15);
            } else {
                mesh.material.emissive = new THREE.Color(0x000000);
                mesh.material.emissiveIntensity = 0;
                mesh.scale.set(1, 1, 1);
            }
        }

        if (labelDiv) {
            if (isSelected) {
                labelDiv.classList.add('selected');
            } else {
                labelDiv.classList.remove('selected');
            }
        }
    }

    updateToothData(toothNum, data) {
        this.teethData[toothNum.toString()] = data;
        this.updateToothColor(toothNum);
        this.updateTreatmentBadge(toothNum, data);
    }

    getSelectedTooth() {
        return this.selectedTooth;
    }

    getToothData(toothNum) {
        return this.teethData[toothNum.toString()] || null;
    }

    setAllTeethData(teethData) {
        this.teethData = teethData;
        this.updateAllTeethColors();

        // Update all badges
        for (let i = 1; i <= 32; i++) {
            this.updateTreatmentBadge(i, teethData[i.toString()]);
        }
    }

    // ===== Helper Methods =====

    updateToothColor(toothNum) {
        const mesh = this.teethMeshes[toothNum];
        if (mesh) {
            const color = this.getToothColor(toothNum);
            mesh.material.color.setHex(color);
        }
    }

    getToothColor(toothNum) {
        const tooth = this.teethData[toothNum.toString()] || {};
        const status = tooth.detailedStatus?.condition || tooth.status || 'healthy';
        return this.statusColors[status] || this.statusColors['healthy'];
    }

    updateAllTeethColors() {
        for (let i = 1; i <= 32; i++) {
            this.updateToothColor(i);
        }
    }

    updateTreatmentBadge(toothNum, data) {
        const mesh = this.teethMeshes[toothNum];
        if (!mesh) return;

        // Remove existing badge
        const existingBadge = mesh.children.find(c => c.userData && c.userData.isBadge);
        if (existingBadge) {
            mesh.remove(existingBadge);
        }

        // Add new badge if treatments exist
        const treatmentCount = data?.treatments?.length || 0;
        if (treatmentCount > 0) {
            const badgeDiv = document.createElement('div');
            badgeDiv.className = 'tooth-3d-badge';
            badgeDiv.textContent = treatmentCount.toString();

            const badge = new THREE.CSS2DObject(badgeDiv);
            const isUpper = toothNum <= 16;
            badge.position.set(6, isUpper ? 8 : -8, 0);
            badge.userData = { isBadge: true };
            mesh.add(badge);
        }
    }

    // ===== View Controls =====

    resetView() {
        // Animate camera back to initial position
        const startPos = this.camera.position.clone();
        const endPos = new THREE.Vector3(0, 120, 180);
        const duration = 500;
        const startTime = Date.now();

        const animateReset = () => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            const easeT = 1 - Math.pow(1 - t, 3); // Ease out cubic

            this.camera.position.lerpVectors(startPos, endPos, easeT);
            this.camera.lookAt(0, 0, 0);

            if (t < 1) {
                requestAnimationFrame(animateReset);
            }
        };

        animateReset();
    }

    zoomIn() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        this.camera.position.addScaledVector(direction, 20);

        // Clamp distance
        const distance = this.camera.position.length();
        if (distance < this.controls.minDistance) {
            this.camera.position.normalize().multiplyScalar(this.controls.minDistance);
        }
    }

    zoomOut() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        this.camera.position.addScaledVector(direction, -20);

        // Clamp distance
        const distance = this.camera.position.length();
        if (distance > this.controls.maxDistance) {
            this.camera.position.normalize().multiplyScalar(this.controls.maxDistance);
        }
    }

    // ===== Animation Loop =====

    animate() {
        if (!this.renderer) return; // Check if disposed

        requestAnimationFrame(() => this.animate());

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
    }

    // ===== Resize Handler =====

    handleResize() {
        if (!this.container || !this.renderer) return;

        const width = this.container.clientWidth || 600;
        const height = 420;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.labelRenderer.setSize(width, height);
    }

    // ===== Cleanup =====

    dispose() {
        // Remove event listeners
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }

        // Dispose controls
        if (this.controls) {
            this.controls.dispose();
        }

        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
        }

        // Dispose geometries and materials
        Object.values(this.teethMeshes).forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });

        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.labelRenderer = null;
        this.teethMeshes = {};
        this.toothLabels = {};
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.DentalChart3D = DentalChart3D;
}

console.log('✅ DentalChart3D component loaded (Three.js v0.128)');
