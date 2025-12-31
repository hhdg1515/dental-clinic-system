import { useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import type { TeethData, ToothData, ToothStatus } from '../types';
import { useI18n } from '../i18n';

// Event type for three.js pointer events
type PointerEvent3D = { stopPropagation: () => void };

// Re-export types
export type { TeethData, ToothData, ToothStatus };

interface DentalChart3DProps {
  teethData: TeethData;
  mode?: 'view' | 'edit';
  onToothSelect?: (toothNumber: number, data: ToothData) => void;
  selectedTooth?: number | null;
  className?: string;
}

// Status colors (hex format for Three.js)
const statusColors: Record<ToothStatus, number> = {
  'healthy': 0xdff5eb,
  'monitor': 0xfff3d6,
  'cavity': 0xffe4e6,
  'filled': 0xe0ecff,
  'missing': 0xeceff3,
  'implant': 0xf2e9ff,
  'root-canal': 0xffedd5,
  'post-op': 0xe0f7fb,
  'urgent': 0xffe2e5
};

type ToothType = 'molar' | 'premolar' | 'canine' | 'incisor';

interface ToothSpec {
  crownHeight: number;
  rootHeight: number;
  crownRadius: number;
  neckRadius: number;
  rootRadius: number;
  topRadius: number;
  squash: [number, number, number];
  cusps: Array<[number, number, number]>;
  cuspSize: number;
}

const TOOTH_SPECS: Record<ToothType, ToothSpec> = {
  incisor: {
    crownHeight: 12,
    rootHeight: 10,
    crownRadius: 3.2,
    neckRadius: 2.5,
    rootRadius: 1.6,
    topRadius: 2.4,
    squash: [1.15, 1, 0.7],
    cusps: [],
    cuspSize: 0
  },
  canine: {
    crownHeight: 13,
    rootHeight: 11,
    crownRadius: 3.6,
    neckRadius: 2.7,
    rootRadius: 1.8,
    topRadius: 1.4,
    squash: [1, 1, 0.85],
    cusps: [[0, 10.5, 0]],
    cuspSize: 1.2
  },
  premolar: {
    crownHeight: 11,
    rootHeight: 10,
    crownRadius: 4.2,
    neckRadius: 3.3,
    rootRadius: 2.0,
    topRadius: 3.2,
    squash: [1.02, 1, 0.9],
    cusps: [
      [-1.8, 8.2, 0.2],
      [1.8, 8.2, -0.2]
    ],
    cuspSize: 1.3
  },
  molar: {
    crownHeight: 9.5,
    rootHeight: 9.5,
    crownRadius: 5.0,
    neckRadius: 4.1,
    rootRadius: 2.4,
    topRadius: 4.1,
    squash: [1.05, 1, 1],
    cusps: [
      [-2.4, 6.8, -2.1],
      [2.4, 6.8, -2.1],
      [-2.4, 6.8, 2.1],
      [2.4, 6.8, 2.1]
    ],
    cuspSize: 1.4
  }
};

const TOOTH_GEOMETRY_CACHE = new Map<ToothType, THREE.BufferGeometry>();
const CUSP_GEOMETRY = new THREE.SphereGeometry(1, 10, 10);
const MARKER_SPHERE = new THREE.SphereGeometry(1, 14, 14);
const MARKER_CAP = new THREE.CylinderGeometry(1, 1, 0.45, 20);
const MARKER_RING = new THREE.TorusGeometry(1.15, 0.22, 12, 24);

const ARCH_RADIUS = 70;
const UPPER_Y = 25;
const LOWER_Y = -25;

type MarkerShape = 'sphere' | 'cap' | 'ring';

interface MarkerStyle {
  color: string;
  emissive?: string;
  shape: MarkerShape;
  size: number;
  depth?: number;
  pulse?: boolean;
}

const STATUS_MARKERS: Partial<Record<ToothStatus, MarkerStyle>> = {
  monitor: { color: '#f59e0b', emissive: '#fbbf24', shape: 'cap', size: 1.1 },
  cavity: { color: '#7f1d1d', emissive: '#b91c1c', shape: 'sphere', size: 1.2, depth: -0.5 },
  filled: { color: '#e0f2fe', emissive: '#93c5fd', shape: 'cap', size: 1.15 },
  'root-canal': { color: '#fb923c', emissive: '#fdba74', shape: 'ring', size: 1.4 },
  'post-op': { color: '#38bdf8', emissive: '#7dd3fc', shape: 'cap', size: 1.15 },
  urgent: { color: '#ef4444', emissive: '#fca5a5', shape: 'sphere', size: 1.4, pulse: true },
  implant: { color: '#a3a3a3', emissive: '#d4d4d4', shape: 'cap', size: 1.05 }
};

const SEVERITY_SCALE: Record<string, number> = {
  none: 1,
  mild: 1.05,
  moderate: 1.15,
  severe: 1.3,
  urgent: 1.45
};

function getMarkerGeometry(shape: MarkerShape) {
  if (shape === 'ring') return MARKER_RING;
  if (shape === 'cap') return MARKER_CAP;
  return MARKER_SPHERE;
}

function buildToothProfile(spec: ToothSpec): THREE.Vector2[] {
  const {
    crownHeight,
    rootHeight,
    crownRadius,
    neckRadius,
    rootRadius,
    topRadius
  } = spec;

  return [
    new THREE.Vector2(rootRadius * 0.5, -rootHeight),
    new THREE.Vector2(rootRadius, -rootHeight * 0.7),
    new THREE.Vector2(rootRadius * 1.1, -rootHeight * 0.4),
    new THREE.Vector2(neckRadius * 0.95, -rootHeight * 0.1),
    new THREE.Vector2(neckRadius * 1.05, 0),
    new THREE.Vector2(crownRadius * 1.05, crownHeight * 0.35),
    new THREE.Vector2(crownRadius, crownHeight * 0.72),
    new THREE.Vector2(topRadius, crownHeight)
  ];
}

function getToothGeometry(toothType: ToothType): THREE.BufferGeometry {
  const cached = TOOTH_GEOMETRY_CACHE.get(toothType);
  if (cached) {
    return cached;
  }

  const profile = buildToothProfile(TOOTH_SPECS[toothType]);
  const geometry = new THREE.LatheGeometry(profile, 36);
  geometry.computeVertexNormals();
  TOOTH_GEOMETRY_CACHE.set(toothType, geometry);
  return geometry;
}

// Calculate tooth position along the arch
function calculateToothPosition(toothNum: number, archRadius: number, yPos: number): THREE.Vector3 {
  let t: number, xSign: number;

  if (toothNum <= 8) {
    // Upper right: 1-8
    t = (toothNum - 1) / 7;
    xSign = 1;
  } else if (toothNum <= 16) {
    // Upper left: 9-16
    t = (toothNum - 9) / 7;
    xSign = -1;
  } else if (toothNum <= 24) {
    // Lower left: 17-24
    t = (24 - toothNum) / 7;
    xSign = -1;
  } else {
    // Lower right: 25-32
    t = (toothNum - 25) / 7;
    xSign = 1;
  }

  const xNorm = 0.1 + t * 0.9;
  const x = xSign * xNorm * archRadius;
  const zMax = 30;
  const zCurve = Math.cos(t * Math.PI * 0.6) * zMax;

  return new THREE.Vector3(x, yPos, zCurve);
}

// Get tooth type based on number
function getToothType(toothNum: number): 'molar' | 'premolar' | 'canine' | 'incisor' {
  if ([1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].includes(toothNum)) return 'molar';
  if ([4, 5, 12, 13, 20, 21, 28, 29].includes(toothNum)) return 'premolar';
  if ([6, 11, 22, 27].includes(toothNum)) return 'canine';
  return 'incisor';
}

// Individual Tooth Component
interface ToothMeshProps {
  toothNumber: number;
  toothData: ToothData;
  isSelected: boolean;
  onClick: () => void;
  isUpper: boolean;
  position: THREE.Vector3;
}

function ToothMesh({ toothNumber, toothData, isSelected, onClick, isUpper, position }: ToothMeshProps) {
  const toothRef = useRef<THREE.Group>(null);
  const markerGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const status = toothData.detailedStatus?.condition || toothData.status || 'healthy';
  const color = statusColors[status] || statusColors.healthy;
  const treatmentCount = toothData.treatments?.length || 0;

  const toothType = getToothType(toothNumber);
  const spec = TOOTH_SPECS[toothType];
  const geometry = useMemo(() => getToothGeometry(toothType), [toothType]);
  const enamelColor = useMemo(() => {
    const base = new THREE.Color(color);
    return base.lerp(new THREE.Color('#ffffff'), 0.25);
  }, [color]);
  const isMissing = status === 'missing';
  const isImplant = status === 'implant';

  const markerStyle = STATUS_MARKERS[status];
  const severity = toothData.detailedStatus?.severity || 'none';
  const markerScale = markerStyle ? markerStyle.size * (SEVERITY_SCALE[severity] || 1) : 1;
  const surfaceOffsets = useMemo(() => {
    const crownTop = spec.crownHeight * 0.7;
    const crownMid = spec.crownHeight * 0.35;
    const radius = spec.crownRadius * 0.85;
    const depth = spec.crownRadius * 0.75;
    const midlineSign = position.x >= 0 ? -1 : 1;
    return {
      occlusal: new THREE.Vector3(0, crownTop, 0),
      buccal: new THREE.Vector3(0, crownMid, depth),
      lingual: new THREE.Vector3(0, crownMid, -depth),
      mesial: new THREE.Vector3(radius * midlineSign, crownMid, 0),
      distal: new THREE.Vector3(-radius * midlineSign, crownMid, 0)
    };
  }, [spec, position.x]);

  const affectedSurfaces = useMemo(() => {
    const surfaces = toothData.detailedStatus?.affectedSurfaces;
    if (surfaces?.length) {
      return surfaces;
    }
    if (markerStyle) {
      return ['occlusal'] as const;
    }
    return [] as const;
  }, [toothData.detailedStatus?.affectedSurfaces, markerStyle]);

  // Animate selection
  const baseScale = useMemo(() => {
    return new THREE.Vector3(
      spec.squash[0] * (isUpper ? 1 : 0.96),
      spec.squash[1] * (isUpper ? 1 : 0.95),
      spec.squash[2] * (isUpper ? 1 : 0.96)
    );
  }, [spec, isUpper]);

  useFrame(({ clock }) => {
    if (toothRef.current) {
      const targetScale = isSelected ? 1.15 : hovered ? 1.05 : 1;
      const target = baseScale.clone().multiplyScalar(targetScale);
      toothRef.current.scale.lerp(target, 0.1);
    }
    if (markerGroupRef.current) {
      if (markerStyle?.pulse) {
        const pulse = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.08;
        markerGroupRef.current.scale.setScalar(pulse);
      } else {
        markerGroupRef.current.scale.setScalar(1);
      }
    }
  });

  // Calculate rotation
  const rotation = useMemo(() => {
    const angle = Math.atan2(position.x, position.z);
    const tilt = isUpper ? -0.08 : 0.08;
    const roll = position.x >= 0 ? 0.04 : -0.04;
    const pitch = (isUpper ? Math.PI : 0) + tilt;
    return new THREE.Euler(
      pitch,
      angle,
      roll
    );
  }, [position, isUpper]);

  const handleClick = (e: PointerEvent3D) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <group position={position}>
      <group
        ref={toothRef}
        rotation={rotation}
        scale={baseScale}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {isSelected && (
          <mesh geometry={geometry} scale={1.08}>
            <meshBasicMaterial
              color="#3b82f6"
              transparent
              opacity={0.18}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        )}

        <mesh geometry={geometry} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={enamelColor}
            roughness={isImplant ? 0.35 : 0.48}
            metalness={isImplant ? 0.55 : 0.08}
            clearcoat={0.6}
            clearcoatRoughness={0.25}
            envMapIntensity={0.4}
            transparent={isMissing}
            opacity={isMissing ? 0.35 : 0.98}
            emissive={isSelected ? 0x2563eb : 0x000000}
            emissiveIntensity={isSelected ? 0.35 : hovered ? 0.12 : 0}
          />
        </mesh>

        {spec.cusps.map((cuspPos, index) => (
          <mesh
            key={`${toothNumber}-cusp-${index}`}
            geometry={CUSP_GEOMETRY}
            position={[cuspPos[0], cuspPos[1], cuspPos[2]]}
            scale={spec.cuspSize * (isUpper ? 1 : 0.95)}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={enamelColor}
              roughness={0.4}
              metalness={0.05}
              transparent={isMissing}
              opacity={isMissing ? 0.35 : 0.98}
            />
          </mesh>
        ))}

        {markerStyle && !isMissing && (
          <group ref={markerGroupRef}>
            {affectedSurfaces.map((surface, index) => {
              const baseOffset = surfaceOffsets[surface];
              const depthOffset = markerStyle.depth ? markerStyle.depth : 0;
              const markerPosition = baseOffset.clone().add(new THREE.Vector3(0, depthOffset, 0));
              const markerGeometry = getMarkerGeometry(markerStyle.shape);
              return (
                <mesh
                  key={`${toothNumber}-marker-${surface}-${index}`}
                  geometry={markerGeometry}
                  position={markerPosition}
                  rotation={markerStyle.shape === 'ring' ? new THREE.Euler(Math.PI / 2, 0, 0) : undefined}
                  scale={markerScale}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    color={markerStyle.color}
                    emissive={markerStyle.emissive ? new THREE.Color(markerStyle.emissive) : undefined}
                    emissiveIntensity={markerStyle.pulse ? 0.7 : 0.35}
                    roughness={0.35}
                    metalness={markerStyle.shape === 'ring' ? 0.4 : 0.1}
                    transparent={markerStyle.shape === 'ring'}
                    opacity={markerStyle.shape === 'ring' ? 0.75 : 0.95}
                    depthWrite={false}
                  />
                </mesh>
              );
            })}
          </group>
        )}
      </group>

      {/* Tooth number label */}
      <Html
        position={[0, isUpper ? spec.crownHeight + 3 : -(spec.crownHeight + 3), 0]}
        center
        distanceFactor={100}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`
            text-[10px] font-bold px-1.5 py-0.5 rounded
            ${isSelected ? 'bg-blue-500 text-white' : 'bg-white/90 text-slate-700'}
            shadow-sm
          `}
        >
          {toothNumber}
        </div>
      </Html>

      {/* Treatment badge */}
      {treatmentCount > 0 && (
        <Html
          position={[spec.crownRadius + 3, isUpper ? spec.crownHeight - 2 : -(spec.crownHeight - 2), 0]}
          center
          distanceFactor={100}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
            {treatmentCount}
          </div>
        </Html>
      )}
    </group>
  );
}

interface GumBandProps {
  archRadius: number;
  y: number;
  isUpper: boolean;
}

function GumBand({ archRadius, y, isUpper }: GumBandProps) {
  const coreGeometry = useMemo(() => {
    const points = [];
    const start = isUpper ? 1 : 17;
    const end = isUpper ? 16 : 32;
    const yOffset = isUpper ? 12 : -12;
    for (let i = start; i <= end; i += 1) {
      const base = calculateToothPosition(i, archRadius, y);
      points.push(new THREE.Vector3(base.x, base.y + yOffset, base.z - 6));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 90, 6.2, 18, false);
  }, [archRadius, y, isUpper]);

  const ridgeGeometry = useMemo(() => {
    const points = [];
    const start = isUpper ? 1 : 17;
    const end = isUpper ? 16 : 32;
    const yOffset = isUpper ? 7 : -7;
    for (let i = start; i <= end; i += 1) {
      const base = calculateToothPosition(i, archRadius, y);
      points.push(new THREE.Vector3(base.x, base.y + yOffset, base.z - 4));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 90, 3.8, 18, false);
  }, [archRadius, y, isUpper]);

  return (
    <group>
      <mesh geometry={coreGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={isUpper ? '#f3b9c3' : '#f0aeb9'}
          roughness={0.78}
          metalness={0.05}
          clearcoat={0.2}
          opacity={0.9}
          transparent
        />
      </mesh>
      <mesh geometry={ridgeGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={isUpper ? '#f8cfd6' : '#f5c3cc'}
          roughness={0.6}
          metalness={0.05}
          clearcoat={0.35}
          opacity={0.92}
          transparent
        />
      </mesh>
    </group>
  );
}

// All teeth group
interface TeethGroupProps {
  teethData: TeethData;
  selectedTooth: number | null;
  onToothSelect: (num: number) => void;
}

function TeethGroup({ teethData, selectedTooth, onToothSelect }: TeethGroupProps) {
  const upperY = UPPER_Y;
  const lowerY = LOWER_Y;
  const archRadius = ARCH_RADIUS;

  const teeth = useMemo(() => {
    const result = [];
    for (let i = 1; i <= 32; i++) {
      const isUpper = i <= 16;
      const yPos = isUpper ? upperY : lowerY;
      const position = calculateToothPosition(i, archRadius, yPos);
      result.push({ toothNumber: i, isUpper, position });
    }
    return result;
  }, []);

  return (
    <group>
      <GumBand archRadius={archRadius} y={upperY} isUpper />
      <GumBand archRadius={archRadius} y={lowerY} isUpper={false} />
      {teeth.map(({ toothNumber, isUpper, position }) => (
        <ToothMesh
          key={toothNumber}
          toothNumber={toothNumber}
          toothData={teethData[toothNumber.toString()] || { status: 'healthy' }}
          isSelected={selectedTooth === toothNumber}
          onClick={() => onToothSelect(toothNumber)}
          isUpper={isUpper}
          position={position}
        />
      ))}
    </group>
  );
}

// Scene with lights
function Scene({ teethData, selectedTooth, onToothSelect }: TeethGroupProps) {
  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#e9f2ff', '#f3d7dc', 0.55]} />
      <directionalLight
        position={[50, 100, 80]}
        intensity={0.85}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-80, 60, 60]} intensity={0.35} />
      <directionalLight position={[0, 30, -120]} intensity={0.2} />

      {/* Teeth */}
      <TeethGroup
        teethData={teethData}
        selectedTooth={selectedTooth}
        onToothSelect={onToothSelect}
      />
    </>
  );
}

// Camera controls component
function CameraController() {
  const { camera } = useThree();

  // Set initial camera position
  useMemo(() => {
    camera.position.set(0, 120, 180);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI * 0.75}
      minPolarAngle={Math.PI * 0.1}
      minDistance={80}
      maxDistance={350}
      enablePan={false}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
    />
  );
}

// Loading fallback
function LoadingFallback({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
    </div>
  );
}

// Legend Component
function Legend3D({
  legendLabel,
  statusLabels,
}: {
  legendLabel: string;
  statusLabels: Record<ToothStatus, string>;
}) {
  const legendItems = Object.entries(statusLabels).filter(([status]) =>
    status !== 'healthy' && status !== 'urgent'
  );

  return (
    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
      <span className="text-[11px] font-semibold text-gray-700">{legendLabel}</span>
      {legendItems.map(([status, statusLabel]) => (
        <div key={status} className="flex items-center gap-1 text-[10px] text-gray-600">
          <div
            className="w-3 h-3 rounded-full border border-slate-300"
            style={{ backgroundColor: `#${statusColors[status as ToothStatus].toString(16).padStart(6, '0')}` }}
          />
          <span>{statusLabel}</span>
        </div>
      ))}
    </div>
  );
}

// Control buttons
interface ControlButtonsProps {
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  labels: {
    reset: string;
    zoomIn: string;
    zoomOut: string;
  };
}

function ControlButtons({ onResetView, onZoomIn, onZoomOut, labels }: ControlButtonsProps) {
  return (
    <div className="absolute top-3 right-3 flex flex-col gap-1.5">
      <button
        onClick={onResetView}
        className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors"
        title={labels.reset}
      >
        <i className="fas fa-sync-alt text-sm" />
      </button>
      <button
        onClick={onZoomIn}
        className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors"
        title={labels.zoomIn}
      >
        <i className="fas fa-search-plus text-sm" />
      </button>
      <button
        onClick={onZoomOut}
        className="w-8 h-8 bg-white/90 hover:bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors"
        title={labels.zoomOut}
      >
        <i className="fas fa-search-minus text-sm" />
      </button>
    </div>
  );
}

// Main DentalChart3D Component
export default function DentalChart3D({
  teethData,
  mode = 'view',
  onToothSelect,
  selectedTooth: controlledSelectedTooth,
  className = ''
}: DentalChart3DProps) {
  const { t } = useI18n();
  const [internalSelectedTooth, setInternalSelectedTooth] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusLabels = useMemo<Record<ToothStatus, string>>(() => ({
    healthy: t('dentalChart.status.healthy'),
    monitor: t('dentalChart.status.monitor'),
    cavity: t('dentalChart.status.cavity'),
    filled: t('dentalChart.status.filled'),
    missing: t('dentalChart.status.missing'),
    implant: t('dentalChart.status.implant'),
    'root-canal': t('dentalChart.status.root-canal'),
    'post-op': t('dentalChart.status.post-op'),
    urgent: t('dentalChart.status.urgent'),
  }), [t]);
  const controlLabels = useMemo(() => ({
    reset: t('dentalChart.controls.reset'),
    zoomIn: t('dentalChart.controls.zoomIn'),
    zoomOut: t('dentalChart.controls.zoomOut'),
  }), [t]);

  // Use controlled or internal state
  const selectedTooth = controlledSelectedTooth !== undefined
    ? controlledSelectedTooth
    : internalSelectedTooth;

  const handleToothSelect = useCallback((toothNumber: number) => {
    setInternalSelectedTooth(toothNumber);
    if (onToothSelect) {
      const toothData = teethData[toothNumber.toString()] || { status: 'healthy' };
      onToothSelect(toothNumber, toothData);
    }
  }, [teethData, onToothSelect]);

  // Camera control functions
  const handleResetView = useCallback(() => {
    // This will be handled by the OrbitControls reset
    // For now, we can trigger a re-render to reset
    setInternalSelectedTooth(null);
  }, []);

  const handleZoomIn = useCallback(() => {
    // Zoom is handled by OrbitControls scroll
    // This is a placeholder for manual zoom
  }, []);

  const handleZoomOut = useCallback(() => {
    // Zoom is handled by OrbitControls scroll
    // This is a placeholder for manual zoom
  }, []);

  // Check WebGL support
  const [webGLSupported] = useState(() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch {
      return false;
    }
  });

  if (!webGLSupported) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100 rounded-xl p-8`}>
        <div className="text-center text-slate-500">
          <i className="fas fa-exclamation-triangle text-4xl mb-2" />
          <p>{t('dentalChart.webgl.unsupportedTitle')}</p>
          <p className="text-sm mt-1">{t('dentalChart.webgl.unsupportedDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`dental-chart-3d-container relative rounded-[18px] overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(145deg, #f7fbff 0%, #eef3ff 60%, #f9fbff 100%)',
        boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08), 0 1px 0 rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(37, 99, 235, 0.12)',
        minHeight: '420px'
      }}
    >
      <Suspense fallback={<LoadingFallback label={t('dentalChart.loading')} />}>
        <Canvas
          ref={canvasRef}
          shadows
          dpr={[1, 2]}
          style={{ width: '100%', height: '420px' }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={['#f7fbff']} />
          <PerspectiveCamera makeDefault position={[0, 120, 180]} fov={50} />
          <CameraController />
          <Scene
            teethData={teethData}
            selectedTooth={selectedTooth}
            onToothSelect={handleToothSelect}
          />
        </Canvas>
      </Suspense>

      {/* Controls */}
      <ControlButtons
        onResetView={handleResetView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        labels={controlLabels}
      />

      {/* Legend */}
      <Legend3D legendLabel={t('dentalChart.legendLabel')} statusLabels={statusLabels} />

      {/* Title */}
      <div className="absolute top-3 left-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wider bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
        {t('dentalChart.title')}
      </div>
    </div>
  );
}
