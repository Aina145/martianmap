/**
 * RED ARES — 3D Mars Globe & Geodetic Measurement Station (Three.js WebGL)
 * Inspired by NASA & Esri Explore Mars (explore-mars.esri.com).
 *
 * Features:
 * 1. Default Startup 3D Experience (Opens immediately into Mars 3D Globe in space)
 * 2. True Geodesic Surface Distance Measurement (Click any two points on Mars to measure Great-Circle distance in km/mi)
 * 3. Real-time Cursor Coordinates (Lat / Lon) raycasted directly off Mars sphere
 * 4. Dynamic Earth Scale Comparisons for any measured distance
 * 5. 1-Click Quick Measurement Presets (Jezero to Gale, Olympus Mons to Valles Marineris, etc.)
 * 6. Historical Missions & Landmarks (Perseverance, Curiosity, Opportunity, Spirit, Viking, InSight)
 * 7. 1-Click Seamless Transition into Jezero Crater Mission Control (50 NASA real points)
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Compass,
  ArrowRight,
  Layers,
  MapPin,
  Info,
  Maximize2,
  Play,
  Pause,
  Ruler,
  Scale,
  Sparkles,
  Mountain,
  Rocket,
  Trash2,
  Navigation2,
  Eye,
  CheckCircle2,
  Globe2,
} from 'lucide-react';
import { sound } from '../../engine/sound';

interface MarsGlobe3DProps {
  onEnterJezero: () => void;
  onBackToMissionControl?: () => void;
}

interface MarsSite {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'mission' | 'landmark';
  missionYear?: string;
  elevationM?: number;
  description: string;
  isJezero?: boolean;
}

const MARS_SITES: MarsSite[] = [
  {
    id: 'jezero',
    name: 'Jezero Crater (Active AOI)',
    lat: 18.38,
    lon: 77.58,
    type: 'mission',
    missionYear: '2021 · Perseverance Rover',
    elevationM: -2580,
    description: 'Ancient river delta lakebed · Landing site of NASA Perseverance rover & Red Ares 50-point traverse.',
    isJezero: true,
  },
  {
    id: 'gale',
    name: 'Gale Crater',
    lat: -5.4,
    lon: 137.8,
    type: 'mission',
    missionYear: '2012 · Curiosity Rover',
    elevationM: -4450,
    description: 'Mount Sharp (Aeolis Mons) central mound complex exploring ancient wet environmental transitions.',
  },
  {
    id: 'olympus',
    name: 'Olympus Mons',
    lat: 18.65,
    lon: -133.8,
    type: 'landmark',
    elevationM: 21287,
    description: 'Largest volcano in the solar system, standing 21.3 km high with a caldera 80 km across.',
  },
  {
    id: 'valles',
    name: 'Valles Marineris',
    lat: -14.0,
    lon: -59.2,
    type: 'landmark',
    elevationM: -7000,
    description: 'Vast Martian tectonic canyon system spanning over 4,000 km in length and up to 7 km in depth.',
  },
  {
    id: 'meridiani',
    name: 'Meridiani Planum',
    lat: -1.9,
    lon: -5.5,
    type: 'mission',
    missionYear: '2004 · Opportunity Rover',
    elevationM: -1300,
    description: 'Hematite-rich plains where Opportunity discovered evidence of past acidic groundwater.',
  },
  {
    id: 'insight',
    name: 'Elysium Planitia',
    lat: 4.5,
    lon: 135.6,
    type: 'mission',
    missionYear: '2018 · InSight Lander',
    elevationM: -2610,
    description: 'Smooth volcanic plains where the InSight lander measured hundreds of Marsquakes.',
  },
];

interface EarthComparison {
  title: string;
  marsFeature: string;
  marsStat: string;
  earthFeature: string;
  earthStat: string;
  ratioBadge: string;
  comparisonNote: string;
}

const EARTH_COMPARISONS: EarthComparison[] = [
  {
    title: 'Volcanic Elevation',
    marsFeature: 'Olympus Mons',
    marsStat: '21.3 km height · 600 km wide',
    earthFeature: 'Mount Everest',
    earthStat: '8.85 km height',
    ratioBadge: '2.4× TALLER THAN EVEREST',
    comparisonNote: 'Would cover the entire territory of France or Arizona, with its peak poking through the upper Martian atmosphere.',
  },
  {
    title: 'Canyon Scale',
    marsFeature: 'Valles Marineris',
    marsStat: '4,000 km long · 7 km deep',
    earthFeature: 'Grand Canyon (USA)',
    earthStat: '446 km long · 1.8 km deep',
    ratioBadge: '10× LONGER & 4× DEEPER',
    comparisonNote: 'Spans the distance from New York to San Francisco across the entire breadth of the North American continent.',
  },
  {
    title: 'Paleolake Basin',
    marsFeature: 'Jezero Crater (Active AOI)',
    marsStat: '45 km diameter crater',
    earthFeature: 'Lake Tahoe (USA)',
    earthStat: '35 km length · 19 km width',
    ratioBadge: 'ANCIENT LAKE BED',
    comparisonNote: 'Held an ancient lake ~3.5 billion years ago fed by Neretva Vallis, depositing rich clay delta sediments.',
  },
  {
    title: 'Planetary Surface Area',
    marsFeature: 'Planet Mars',
    marsStat: '144.8 million km²',
    earthFeature: 'Earth Total Dry Land',
    earthStat: '148.9 million km²',
    ratioBadge: 'NEAR EQUAL TO EARTH LAND',
    comparisonNote: 'Although Mars is half the diameter of Earth, having no oceans means its walkable land area equals all Earth continents combined!',
  },
];

const GLOBE_MEASURE_PRESETS = [
  {
    name: 'Jezero Crater ↔ Gale Crater',
    sub: 'Perseverance to Curiosity',
    p1: { lat: 18.38, lon: 77.58 },
    p2: { lat: -5.4, lon: 137.8 },
  },
  {
    name: 'Olympus Mons ↔ Valles Marineris',
    sub: 'Volcano to Supercanyon',
    p1: { lat: 18.65, lon: -133.8 },
    p2: { lat: -14.0, lon: -59.2 },
  },
  {
    name: 'North Polar Cap ↔ Jezero Crater',
    sub: 'Ice Cap to River Delta',
    p1: { lat: 84.0, lon: 0.0 },
    p2: { lat: 18.38, lon: 77.58 },
  },
  {
    name: 'Meridiani ↔ Elysium Planitia',
    sub: 'Opportunity to InSight',
    p1: { lat: -1.9, lon: -5.5 },
    p2: { lat: 4.5, lon: 135.6 },
  },
];

const MARS_RADIUS_KM = 3389.5;

// Haversine Great Circle Distance on Mars
function calculateMarsDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return MARS_RADIUS_KM * c;
}

// Earth scale contextual comparison generator
function getEarthScaleComparison(km: number): string {
  if (km < 30) {
    return 'Comparable to crossing central Paris or Manhattan Island (~21 km).';
  } else if (km < 70) {
    return 'Comparable to the 45 km diameter of Jezero Crater or the London Orbital M25.';
  } else if (km < 250) {
    return 'Comparable to New York to Philadelphia (~150 km) or Tokyo to Mount Fuji.';
  } else if (km < 600) {
    return 'Comparable to the entire 446 km length of Earth’s Grand Canyon (Arizona).';
  } else if (km < 1400) {
    return 'Comparable to the distance across Europe from Paris to Madrid (~1,050 km).';
  } else if (km < 2800) {
    return 'Comparable to the distance from London to Istanbul (~2,500 km).';
  } else if (km < 4800) {
    return 'Comparable to coast-to-coast USA from New York to San Francisco (~4,100 km) or the full length of Valles Marineris (~4,000 km)!';
  } else if (km < 8500) {
    return 'Comparable to the flight distance from London to Singapore (~10,800 km) or NYC to Tokyo.';
  } else {
    return 'A trans-planetary hemisphere traverse spanning over half the circumference of Mars (~10,650 km antipodal).';
  }
}

// Lat / Lon to 3D Vector on Sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// 3D Point on Sphere back to Lat / Lon
function vector3ToLatLon(vec: THREE.Vector3): { lat: number; lon: number } {
  const norm = vec.clone().normalize();
  const lat = Math.asin(Math.max(-1, Math.min(1, norm.y))) * (180 / Math.PI);
  let lon = Math.atan2(norm.z, -norm.x) * (180 / Math.PI) - 180;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;
  return { lat, lon };
}

export const MarsGlobe3D: React.FC<MarsGlobe3DProps> = ({
  onEnterJezero,
  onBackToMissionControl,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI Modes: 'explore' | 'measure' | 'compare'
  const [activeTab, setActiveTab] = useState<'explore' | 'measure' | 'compare'>('explore');
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedSite, setSelectedSite] = useState<MarsSite>(MARS_SITES[0]);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Measurement State
  const [measurePoints, setMeasurePoints] = useState<
    { lat: number; lon: number; pos: THREE.Vector3 }[]
  >([]);

  // Refs for persistent Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const marsMeshRef = useRef<THREE.Mesh | null>(null);
  const measureMarkersGroupRef = useRef<THREE.Group | null>(null);

  // Synchronized refs for event handlers to avoid re-mounting WebGL scene
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'measure') {
      // Pause auto-rotation when measuring for precision
      setAutoRotate(false);
    }
  }, [activeTab]);

  const measurePointsRef = useRef(measurePoints);
  useEffect(() => {
    measurePointsRef.current = measurePoints;
  }, [measurePoints]);

  // Initialize Three.js WebGL Scene ONCE
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.2);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x403028, 1.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.5);
    sunLight.position.set(5, 3, 4);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x4de3f0, 0.6);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // 4. Mars Sphere with 2K Surface Texture
    const textureLoader = new THREE.TextureLoader();
    const marsTexture = textureLoader.load('/maps/mars_globe_texture.jpg');
    marsTexture.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.SphereGeometry(1.6, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: marsTexture,
      roughness: 0.82,
      metalness: 0.08,
    });

    const mars = new THREE.Mesh(geometry, material);
    scene.add(mars);
    marsMeshRef.current = mars;

    // 5. Atmospheric Glow Layer
    const atmosphereGeometry = new THREE.SphereGeometry(1.625, 48, 48);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
          gl_FragColor = vec4(0.85, 0.35, 0.15, 1.0) * intensity * 0.95;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // 6. Stars Background Particle Field
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 1400;
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 55;
      starPositions[i + 1] = (Math.random() - 0.5) * 55;
      starPositions[i + 2] = (Math.random() - 0.5) * 55;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.75,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 7. 3D Markers Group for Sites
    const markersGroup = new THREE.Group();
    mars.add(markersGroup);

    MARS_SITES.forEach((site) => {
      const pos = latLonToVector3(site.lat, site.lon, 1.61);

      // Pin stem
      const markerPinGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 8);
      const markerPinMat = new THREE.MeshBasicMaterial({
        color: site.isJezero ? 0x4de3f0 : site.type === 'mission' ? 0x3ddc84 : 0xf5c542,
      });
      const pin = new THREE.Mesh(markerPinGeo, markerPinMat);
      pin.position.copy(pos);
      pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());

      // Glowing head beacon
      const headGeo = new THREE.SphereGeometry(site.isJezero ? 0.035 : 0.024, 16, 16);
      const headMat = new THREE.MeshBasicMaterial({
        color: site.isJezero ? 0x3ddc84 : site.type === 'mission' ? 0x4de3f0 : 0xe5484d,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.copy(pos.clone().add(pos.clone().normalize().multiplyScalar(0.04)));

      markersGroup.add(pin);
      markersGroup.add(head);
    });

    // 8. Measurement group (for user drawn points & geodesic line)
    const measureGroup = new THREE.Group();
    mars.add(measureGroup);
    measureMarkersGroupRef.current = measureGroup;

    // Face Jezero Crater initially
    mars.rotation.y = -Math.PI / 2.2;
    mars.rotation.x = 0.2;

    // 9. Interaction / Drag Rotation & Click Raycasting
    let isDragging = false;
    let didMove = false;
    let mouseDownPos = { x: 0, y: 0 };
    let previousMousePosition = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      didMove = false;
      mouseDownPos = { x: e.clientX, y: e.clientY };
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      // Raycast to find Martian coordinates under cursor
      if (marsMeshRef.current && cameraRef.current) {
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObject(marsMeshRef.current);
        if (intersects.length > 0) {
          const localPoint = marsMeshRef.current.worldToLocal(intersects[0].point.clone());
          const coords = vector3ToLatLon(localPoint);
          setCursorCoords(coords);
        } else {
          setCursorCoords(null);
        }
      }

      if (!isDragging || !marsMeshRef.current) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      const totalMove = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      if (totalMove > 5) {
        didMove = true;
      }

      marsMeshRef.current.rotation.y += deltaX * 0.005;
      marsMeshRef.current.rotation.x += deltaY * 0.005;
      marsMeshRef.current.rotation.x = Math.max(-1.2, Math.min(1.2, marsMeshRef.current.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e: MouseEvent) => {
      const wasDragging = isDragging;
      isDragging = false;

      // If user did not drag, treat as a clean click on Mars
      if (wasDragging && !didMove && activeTabRef.current === 'measure') {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

        if (marsMeshRef.current && cameraRef.current) {
          raycaster.setFromCamera(mouse, cameraRef.current);
          const intersects = raycaster.intersectObject(marsMeshRef.current);

          if (intersects.length > 0) {
            sound.playClick();
            const localPoint = marsMeshRef.current.worldToLocal(intersects[0].point.clone());
            const coords = vector3ToLatLon(localPoint);

            setMeasurePoints((prev) => {
              if (prev.length >= 2) {
                return [{ lat: coords.lat, lon: coords.lon, pos: localPoint }];
              }
              return [...prev, { lat: coords.lat, lon: coords.lon, pos: localPoint }];
            });
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(
        2.2,
        Math.min(8.0, cameraRef.current.position.z + e.deltaY * 0.002)
      );
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 10. Smooth Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotateRef.current && marsMeshRef.current && !isDragging) {
        marsMeshRef.current.rotation.y += 0.001;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); // Run ONCE — NEVER re-creates WebGL renderer on state toggles!

  // Redraw 3D Measurement Geodesic Line and Pins
  useEffect(() => {
    const group = measureMarkersGroupRef.current;
    if (!group) return;

    // Clear old measure markers
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    if (measurePoints.length === 0) return;

    // Add pins for measure points
    measurePoints.forEach((pt, idx) => {
      const pinColor = idx === 0 ? 0x3ddc84 : 0xe5484d;

      const sphereGeo = new THREE.SphereGeometry(0.038, 20, 20);
      const sphereMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const pinMesh = new THREE.Mesh(sphereGeo, sphereMat);
      pinMesh.position.copy(pt.pos.clone().normalize().multiplyScalar(1.62));
      group.add(pinMesh);

      // Glowing outer ring for Point A / B
      const ringGeo = new THREE.RingGeometry(0.045, 0.065, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pt.pos.clone().normalize().multiplyScalar(1.622));
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      group.add(ring);
    });

    // If 2 points, draw geodesic arc curving around Mars surface
    if (measurePoints.length === 2) {
      sound.playCompute();
      const p1 = measurePoints[0].pos.clone().normalize().multiplyScalar(1.615);
      const p2 = measurePoints[1].pos.clone().normalize().multiplyScalar(1.615);

      const arcPoints: THREE.Vector3[] = [];
      const numSegments = 64;
      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;
        const pt = p1.clone().lerp(p2, t).normalize().multiplyScalar(1.615 * 1.008);
        arcPoints.push(pt);
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x4de3f0,
        linewidth: 3,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      group.add(line);
    }
  }, [measurePoints]);

  // Focus Camera onto Site
  const focusSite = (site: MarsSite) => {
    sound.playClick();
    setSelectedSite(site);
    if (!marsMeshRef.current) return;
    const phi = (90 - site.lat) * (Math.PI / 180);
    const theta = (site.lon + 180) * (Math.PI / 180);
    marsMeshRef.current.rotation.y = -theta + Math.PI / 2;
    marsMeshRef.current.rotation.x = phi - Math.PI / 2;
  };

  // Apply a preset measurement pair
  const applyPresetMeasurement = (preset: typeof GLOBE_MEASURE_PRESETS[0]) => {
    sound.playClick();
    const p1Pos = latLonToVector3(preset.p1.lat, preset.p1.lon, 1.6);
    const p2Pos = latLonToVector3(preset.p2.lat, preset.p2.lon, 1.6);
    setMeasurePoints([
      { lat: preset.p1.lat, lon: preset.p1.lon, pos: p1Pos },
      { lat: preset.p2.lat, lon: preset.p2.lon, pos: p2Pos },
    ]);

    // Center camera between the two points
    if (marsMeshRef.current) {
      const midLat = (preset.p1.lat + preset.p2.lat) / 2;
      const midLon = (preset.p1.lon + preset.p2.lon) / 2;
      const phi = (90 - midLat) * (Math.PI / 180);
      const theta = (midLon + 180) * (Math.PI / 180);
      marsMeshRef.current.rotation.y = -theta + Math.PI / 2;
      marsMeshRef.current.rotation.x = phi - Math.PI / 2;
    }
  };

  const zoom = (delta: number) => {
    sound.playClick();
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(
      2.2,
      Math.min(8.0, cameraRef.current.position.z + delta)
    );
  };

  // Measured Distance Result
  const measuredDistanceKm = useMemo(() => {
    if (measurePoints.length < 2) return null;
    return calculateMarsDistanceKm(
      measurePoints[0].lat,
      measurePoints[0].lon,
      measurePoints[1].lat,
      measurePoints[1].lon
    );
  }, [measurePoints]);

  return (
    <div className="relative w-full h-full bg-[#05080F] text-[#E6EDF3] overflow-hidden select-none font-sans">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className={`absolute inset-0 z-0 ${
          activeTab === 'measure' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-20 bg-gradient-to-b from-[#0B1220]/95 via-[#0B1220]/75 to-transparent">
        {/* Left Branding & Mode Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C1440E] to-[#E5484D] flex items-center justify-center font-heading font-black text-sm text-white shadow-lg shadow-orange-950/60 border border-orange-400/30">
              ♂
            </div>
            <div>
              <div className="font-heading font-black text-sm tracking-wider text-white flex items-center gap-2">
                <span>EXPLORE MARS 3D</span>
                <span className="text-[10px] bg-[#1E293B] text-[#4DE3F0] px-2 py-0.5 rounded font-mono border border-[#243552]">
                  ELLIPSOID GLOBE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Geodetic Scale Model · R = 3,389.5 km
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#0B1220]/90 p-1 rounded-xl border border-[#243552] text-xs font-mono">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('explore');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-[#182844] text-[#4DE3F0] font-bold border border-[#4DE3F0]/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation2 className="w-3.5 h-3.5" />
              <span>EXPLORE</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('measure');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'measure'
                  ? 'bg-[#182844] text-[#4DE3F0] font-bold border border-[#4DE3F0]/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ruler className="w-3.5 h-3.5 text-rose-400" />
              <span>MEASURE DISTANCE</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('compare');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'compare'
                  ? 'bg-[#182844] text-[#4DE3F0] font-bold border border-[#4DE3F0]/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>EARTH SCALE</span>
            </button>
          </div>
        </div>

        {/* Right CTA to Enter Jezero Sector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playCompute();
              onEnterJezero();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4DE3F0] to-[#38b2bd] hover:brightness-110 text-[#0B1220] font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-cyan-950/80 cursor-pointer transition-transform active:scale-95"
          >
            <span>ENTER JEZERO CRATER TRAVERSE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* LEFT SIDE SHELF: Based on Active Tab */}
      <div className="absolute top-20 left-6 z-20 w-84 bg-[#0D1524]/95 backdrop-blur border border-[#243552] rounded-2xl p-4 shadow-2xl space-y-3.5 max-h-[calc(100vh-140px)] overflow-y-auto">
        {/* 1. Explore Tab */}
        {activeTab === 'explore' && (
          <>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#4DE3F0] uppercase tracking-wider border-b border-[#243552] pb-2">
              <span className="flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                <span>MISSIONS & LANDMARKS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{MARS_SITES.length} SITES</span>
            </div>

            <div className="space-y-1.5">
              {MARS_SITES.map((site) => (
                <button
                  key={site.id}
                  onClick={() => focusSite(site)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedSite.id === site.id
                      ? 'bg-[#182844] border-[#4DE3F0] shadow-md shadow-cyan-950/60'
                      : 'bg-[#070C16]/80 border-[#243552] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{site.name}</span>
                    {site.isJezero && (
                      <span className="text-[9px] font-mono text-[#3DDC84] bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        ACTIVE AOI
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center justify-between">
                    <span>
                      {site.lat > 0 ? `${site.lat.toFixed(1)}°N` : `${Math.abs(site.lat).toFixed(1)}°S`},{' '}
                      {site.lon > 0 ? `${site.lon.toFixed(1)}°E` : `${Math.abs(site.lon).toFixed(1)}°W`}
                    </span>
                    {site.missionYear && <span className="text-cyan-400">{site.missionYear.split('·')[0]}</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Site Details */}
            <div className="bg-[#070C16] p-3 rounded-xl border border-[#243552] text-xs font-mono space-y-2">
              <div className="font-bold text-white text-xs flex items-center justify-between">
                <span>{selectedSite.name}</span>
                {selectedSite.elevationM !== undefined && (
                  <span className="text-slate-400 text-[10px]">
                    Elev: {selectedSite.elevationM > 0 ? `+${selectedSite.elevationM}m` : `${selectedSite.elevationM}m`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                {selectedSite.description}
              </p>
              {selectedSite.isJezero && (
                <button
                  onClick={() => {
                    sound.playCompute();
                    onEnterJezero();
                  }}
                  className="w-full mt-2 py-2 rounded-lg bg-[#3DDC84] hover:bg-[#34c776] text-[#04121A] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-950/80"
                >
                  <span>Launch 50-Point Route Solver ➔</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* 2. Measure Distance Tab */}
        {activeTab === 'measure' && (
          <>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-400 uppercase tracking-wider border-b border-[#243552] pb-2">
              <span className="flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                <span>GEODESIC MEASURE TOOL</span>
              </span>
              {measurePoints.length > 0 && (
                <button
                  onClick={() => {
                    sound.playClick();
                    setMeasurePoints([]);
                  }}
                  className="text-slate-400 hover:text-rose-400 text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>RESET</span>
                </button>
              )}
            </div>

            <div className="bg-[#070C16] p-3 rounded-xl border border-[#243552] text-xs font-mono space-y-2.5">
              <div className="text-slate-300 text-[11px] leading-snug">
                Click anywhere on Mars to drop <b>Point A</b> and <b>Point B</b> to compute geodesic surface distance along the Martian ellipsoid.
              </div>

              {measurePoints.length === 0 && (
                <div className="p-3 border border-dashed border-[#243552] rounded-lg text-center text-slate-400 text-xs">
                  Click on the Mars globe to set Point A
                </div>
              )}

              {measurePoints.length >= 1 && (
                <div className="bg-[#111B2E] p-2 rounded-lg border border-emerald-500/40 text-[11px] flex items-center justify-between">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    POINT A:
                  </span>
                  <span className="text-white font-mono">
                    {measurePoints[0].lat >= 0 ? `${measurePoints[0].lat.toFixed(2)}°N` : `${Math.abs(measurePoints[0].lat).toFixed(2)}°S`},{' '}
                    {measurePoints[0].lon >= 0 ? `${measurePoints[0].lon.toFixed(2)}°E` : `${Math.abs(measurePoints[0].lon).toFixed(2)}°W`}
                  </span>
                </div>
              )}

              {measurePoints.length === 1 && (
                <div className="p-2 border border-dashed border-rose-500/30 rounded-lg text-center text-rose-300/80 text-xs animate-pulse">
                  Click second location to place Point B
                </div>
              )}

              {measurePoints.length >= 2 && (
                <div className="bg-[#111B2E] p-2 rounded-lg border border-rose-500/40 text-[11px] flex items-center justify-between">
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                    POINT B:
                  </span>
                  <span className="text-white font-mono">
                    {measurePoints[1].lat >= 0 ? `${measurePoints[1].lat.toFixed(2)}°N` : `${Math.abs(measurePoints[1].lat).toFixed(2)}°S`},{' '}
                    {measurePoints[1].lon >= 0 ? `${measurePoints[1].lon.toFixed(2)}°E` : `${Math.abs(measurePoints[1].lon).toFixed(2)}°W`}
                  </span>
                </div>
              )}

              {measuredDistanceKm !== null && (
                <div className="mt-2 bg-[#182844] p-3 rounded-xl border-2 border-[#4DE3F0] text-center shadow-lg shadow-cyan-950/60 space-y-1">
                  <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                    MARTIAN SURFACE DISTANCE
                  </div>
                  <div className="text-2xl font-mono font-black text-white">
                    {measuredDistanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                    <span className="text-sm font-normal text-slate-300">km</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {(measuredDistanceKm * 0.621371).toLocaleString(undefined, { maximumFractionDigits: 1 })} miles
                  </div>

                  {/* Geodesic Arc Details */}
                  <div className="pt-2 mt-2 border-t border-[#243552] text-[10px] text-slate-300 text-left space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Great Circle Angle:</span>
                      <span className="text-[#4DE3F0]">
                        {((measuredDistanceKm / MARS_RADIUS_KM) * (180 / Math.PI)).toFixed(2)}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mars Circumference %:</span>
                      <span className="text-white">
                        {((measuredDistanceKm / (2 * Math.PI * MARS_RADIUS_KM)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Earth Scale Context */}
                  <div className="mt-2 p-2 bg-[#0C1524] rounded-lg border border-amber-500/30 text-[10px] text-left">
                    <span className="text-amber-400 font-bold block mb-0.5">🌍 EARTH SCALE EQUIVALENT:</span>
                    <span className="text-slate-300 font-sans leading-tight block">
                      {getEarthScaleComparison(measuredDistanceKm)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick 1-Click Measure Presets */}
            <div className="bg-[#070C16] p-3 rounded-xl border border-[#243552] text-xs font-mono space-y-2">
              <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>QUICK MEASURE PRESETS</span>
                <span className="text-[10px] text-cyan-400 font-mono">1-CLICK</span>
              </div>
              <div className="space-y-1">
                {GLOBE_MEASURE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPresetMeasurement(preset)}
                    className="w-full text-left p-2 rounded-lg bg-[#111B2E] hover:bg-[#182844] border border-[#243552] hover:border-[#4DE3F0] transition-colors cursor-pointer"
                  >
                    <div className="text-[11px] font-bold text-white">{preset.name}</div>
                    <div className="text-[10px] text-slate-400">{preset.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 3. Earth Scale Comparison Tab */}
        {activeTab === 'compare' && (
          <>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 uppercase tracking-wider border-b border-[#243552] pb-2">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>MARS VS EARTH SCALE</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">ESRI SPEC</span>
            </div>

            <div className="space-y-2">
              {EARTH_COMPARISONS.map((comp) => (
                <div
                  key={comp.title}
                  className="bg-[#070C16] p-3 rounded-xl border border-[#243552] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{comp.title}</span>
                    <span className="text-[9px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded">
                      {comp.ratioBadge}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1">
                    <div className="bg-[#111B2E] p-1.5 rounded border border-orange-500/30">
                      <div className="text-orange-400 font-bold">MARS: {comp.marsFeature}</div>
                      <div className="text-slate-300">{comp.marsStat}</div>
                    </div>

                    <div className="bg-[#111B2E] p-1.5 rounded border border-cyan-500/30">
                      <div className="text-cyan-400 font-bold">EARTH: {comp.earthFeature}</div>
                      <div className="text-slate-300">{comp.earthStat}</div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-sans leading-tight pt-1">
                    {comp.comparisonNote}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* BOTTOM FLOATING CONTROLS: Coordinates, Auto-spin, Zoom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#0B1220]/95 backdrop-blur px-5 py-2.5 rounded-2xl border border-[#243552] shadow-2xl">
        {/* Auto Rotate Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            setAutoRotate(!autoRotate);
          }}
          className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            autoRotate
              ? 'bg-[#3DDC84]/20 border-[#3DDC84] text-[#3DDC84]'
              : 'bg-[#182844] border-[#243552] text-slate-300'
          }`}
          title="Toggle Auto Planetary Rotation"
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>AUTO-SPIN</span>
        </button>

        <div className="h-4 w-px bg-slate-700" />

        {/* Live Cursor Martian Coordinates */}
        <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5 min-w-[210px]">
          <Compass className="w-3.5 h-3.5 text-[#4DE3F0]" />
          <span>
            {cursorCoords
              ? `${cursorCoords.lat >= 0 ? `${cursorCoords.lat.toFixed(2)}°N` : `${Math.abs(cursorCoords.lat).toFixed(2)}°S`}, ${cursorCoords.lon >= 0 ? `${cursorCoords.lon.toFixed(2)}°E` : `${Math.abs(cursorCoords.lon).toFixed(2)}°W`}`
              : 'Hover globe to read coords'}
          </span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => zoom(-0.5)}
            className="p-1.5 rounded-lg bg-[#182844] hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoom(0.5)}
            className="p-1.5 rounded-lg bg-[#182844] hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
