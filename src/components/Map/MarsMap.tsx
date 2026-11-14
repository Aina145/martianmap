/**
 * RED ARES — MarsMap Component
 * High-definition tactical Martian GIS & Topographic Surface.
 * Built with authentic NASA datasets:
 * - NASA MRO CRISM/CTX Western Delta & Landing Floor high-resolution mosaic
 * - NASA MOLA Topographic Elevation Model (color shaded relief)
 * - Tactical Sci-Fi DEM Grid
 * - Real georeferenced landing transect points (P1 Octavia Butler Landing to P50 Margin Carbonate)
 * - Dynamic route calculation corridor with glowing animated milestones
 * - Geodesic Tactical Ruler & Surface Measurement System
 */

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteResult, LayerSettings } from '../../types/mars';
import {
  TerrainGraph,
  TERRAIN_POINTS,
  BAND_COLORS,
  slopeBand,
  SITE_LABELS,
  SCIENCE_POIS,
  TerrainPoint,
} from '../../data/terrain';
import {
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Layers,
  MapPin,
  Sparkles,
  Radar,
  Eye,
  Crosshair,
  Satellite,
  Mountain,
  Ruler,
  Trash2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { sound } from '../../engine/sound';

export type SettingMode = 'start' | 'dest' | 'inspect' | 'measure';

interface MarsMapProps {
  graph: TerrainGraph;
  layers: LayerSettings;
  startId: number | null;
  destId: number | null;
  onSetStart: (id: number) => void;
  onSetDest: (id: number) => void;
  selectedId: number | null;
  onSelectNode: (id: number | null) => void;
  onHoverNode: (id: number | null) => void;
  primaryRoute: RouteResult | null;
  comparisonRoute?: RouteResult | null;
  settingMode: SettingMode;
  onSetSettingMode: (mode: SettingMode) => void;
}

const nodeById = new Map<number, TerrainPoint>(TERRAIN_POINTS.map((p) => [p.id, p]));

// Haversine Great Circle Distance on Mars in meters (R = 3,389,500 m)
function marsDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3389500;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Interpolate elevation from nearest terrain points (or snap to node)
function getPointElevation(lat: number, lon: number): number {
  let closestDist = Infinity;
  let closestElev = -2500;
  let weightSum = 0;
  let elevSum = 0;

  for (const pt of TERRAIN_POINTS) {
    const d = marsDistanceMeters(lat, lon, pt.lat, pt.lon);
    if (d < closestDist) {
      closestDist = d;
      closestElev = pt.elev;
    }
    if (d < 500) {
      const w = 1 / Math.max(d * d, 1);
      weightSum += w;
      elevSum += pt.elev * w;
    }
  }

  if (closestDist < 40) return closestElev;
  return weightSum > 0 ? elevSum / weightSum : closestElev;
}

interface MeasurePoint {
  lat: number;
  lng: number;
  elevation: number;
  node?: TerrainPoint;
}

export const MarsMap: React.FC<MarsMapProps> = ({
  graph,
  layers,
  startId,
  destId,
  onSetStart,
  onSetDest,
  selectedId,
  onSelectNode,
  onHoverNode,
  primaryRoute,
  comparisonRoute,
  settingMode,
  onSetSettingMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseImageLayerRef = useRef<L.ImageOverlay | null>(null);
  const topoLayerRef = useRef<L.LayerGroup | null>(null);
  const terrainLayerRef = useRef<L.LayerGroup | null>(null);
  const scienceLayerRef = useRef<L.LayerGroup | null>(null);
  const dangerLayerRef = useRef<L.LayerGroup | null>(null);
  const edgeLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);

  // Basemap options: 'crism' (NASA MRO CRISM/CTX photo), 'mola' (NASA MOLA elevation), 'tactical' (dark DEM vector)
  const [basemapStyle, setBasemapStyle] = useState<'crism' | 'mola' | 'tactical'>('crism');
  const [radarSweep, setRadarSweep] = useState(false);

  // Measurement tool state
  const [measurePoints, setMeasurePoints] = useState<MeasurePoint[]>([]);

  const modeRef = useRef(settingMode);
  modeRef.current = settingMode;
  const hoverRef = useRef(onHoverNode);
  hoverRef.current = onHoverNode;

  // Bounding box of Natasha's 50 points
  const bounds = useMemo(() => {
    const lats = TERRAIN_POINTS.map((p) => p.lat);
    const lons = TERRAIN_POINTS.map((p) => p.lon);
    return L.latLngBounds(
      [Math.min(...lats) - 0.003, Math.min(...lons) - 0.004],
      [Math.max(...lats) + 0.003, Math.max(...lons) + 0.004]
    );
  }, []);

  const addMeasurePoint = useCallback((lat: number, lng: number, node?: TerrainPoint) => {
    sound.playClick();
    const elevation = node ? node.elev : getPointElevation(lat, lng);
    setMeasurePoints((prev) => [...prev, { lat, lng, elevation, node }]);
  }, []);

  const addMeasurePointRef = useRef(addMeasurePoint);
  addMeasurePointRef.current = addMeasurePoint;

  const handleNodeClick = (id: number) => {
    sound.playClick();
    const mode = modeRef.current;
    if (mode === 'start') {
      onSetStart(id);
    } else if (mode === 'dest') {
      onSetDest(id);
    } else if (mode === 'measure') {
      const node = nodeById.get(id);
      if (node) {
        addMeasurePointRef.current(node.lat, node.lon, node);
      }
    } else {
      onSelectNode(id);
    }
  };
  const handleNodeClickRef = useRef(handleNodeClick);
  handleNodeClickRef.current = handleNodeClick;

  // ---- Initialize Leaflet Map ----
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 11,
      maxZoom: 18,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
    });

    topoLayerRef.current = L.layerGroup().addTo(map);
    edgeLayerRef.current = L.layerGroup().addTo(map);
    terrainLayerRef.current = L.layerGroup().addTo(map);
    dangerLayerRef.current = L.layerGroup().addTo(map);
    scienceLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    measureLayerRef.current = L.layerGroup().addTo(map);

    map.fitBounds(bounds, { padding: [50, 50] });
    mapInstanceRef.current = map;

    const reframe = () => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [50, 50] });
    };
    const timer = setTimeout(reframe, 200);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapContainerRef.current);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const mode = modeRef.current;
      if (mode === 'inspect') {
        onSelectNode(null);
      } else if (mode === 'start') {
        sound.playClick();
        let closestNode: TerrainPoint | undefined;
        let minDist = Infinity;
        for (const pt of TERRAIN_POINTS) {
          if (pt.slope > 15) continue; // hard constraint: do not start on blocked node
          const d = marsDistanceMeters(e.latlng.lat, e.latlng.lng, pt.lat, pt.lon);
          if (d < minDist) {
            minDist = d;
            closestNode = pt;
          }
        }
        if (closestNode) {
          onSetStart(closestNode.id);
        }
      } else if (mode === 'dest') {
        sound.playClick();
        let closestNode: TerrainPoint | undefined;
        let minDist = Infinity;
        for (const pt of TERRAIN_POINTS) {
          if (pt.slope > 15) continue; // hard constraint: do not target blocked node
          const d = marsDistanceMeters(e.latlng.lat, e.latlng.lng, pt.lat, pt.lon);
          if (d < minDist) {
            minDist = d;
            closestNode = pt;
          }
        }
        if (closestNode) {
          onSetDest(closestNode.id);
        }
      } else if (mode === 'measure') {
        // Snap to closest node if close, otherwise record ground click
        let closestNode: TerrainPoint | undefined;
        let minDist = Infinity;
        for (const pt of TERRAIN_POINTS) {
          const d = marsDistanceMeters(e.latlng.lat, e.latlng.lng, pt.lat, pt.lon);
          if (d < minDist) {
            minDist = d;
            closestNode = pt;
          }
        }

        if (minDist < 60 && closestNode) {
          addMeasurePointRef.current(closestNode.lat, closestNode.lon, closestNode);
        } else {
          addMeasurePointRef.current(e.latlng.lat, e.latlng.lng);
        }
      }
    });

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Manage Real NASA Basemap Image Overlays ----
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing image overlay if present
    if (baseImageLayerRef.current) {
      map.removeLayer(baseImageLayerRef.current);
      baseImageLayerRef.current = null;
    }

    if (basemapStyle === 'crism') {
      // Real NASA MRO CRISM & CTX Western Delta and Landing Floor Mosaic
      const crismLayer = L.imageOverlay('/maps/jezero_delta_crism.jpg', [
        [18.420, 77.378],
        [18.486, 77.466],
      ], {
        opacity: 0.92,
        interactive: false,
        zIndex: 1,
      });
      crismLayer.addTo(map);
      baseImageLayerRef.current = crismLayer;
    } else if (basemapStyle === 'mola') {
      // Real NASA MOLA Topographic Elevation Model of Jezero Crater
      const molaLayer = L.imageOverlay('/maps/jezero_nasa_overview.jpg', [
        [18.25, 77.22],
        [18.62, 77.72],
      ], {
        opacity: 0.88,
        interactive: false,
        zIndex: 1,
      });
      molaLayer.addTo(map);
      baseImageLayerRef.current = molaLayer;
    }
  }, [basemapStyle]);

  // ---- Draw Tactical Contours (Only in Tactical Mode) ----
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !topoLayerRef.current) return;
    const tL = topoLayerRef.current.clearLayers();

    if (basemapStyle === 'tactical') {
      const centerLat = 18.444;
      const centerLon = 77.452;

      // Concentric crater contour rings
      [2200, 3600, 5200, 7000].forEach((radiusM, idx) => {
        L.circle([centerLat, centerLon], {
          radius: radiusM,
          color: idx === 3 ? '#4DE3F0' : '#1E3A5F',
          weight: idx === 3 ? 1.5 : 1,
          opacity: 0.35,
          dashArray: idx % 2 === 0 ? '4, 4' : undefined,
          fill: false,
          interactive: false,
        }).addTo(tL);
      });
    }
  }, [basemapStyle]);

  // ---- Draw Dynamic Graph Corridor Mesh ----
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !edgeLayerRef.current) return;
    const eL = edgeLayerRef.current.clearLayers();

    if (layers.route && graph && graph.adjacency) {
      const drawn = new Set<string>();
      graph.adjacency.forEach((edges, fromId) => {
        const fromPt = nodeById.get(fromId);
        if (!fromPt) return;

        edges.forEach((edge) => {
          const toPt = nodeById.get(edge.to);
          if (!toPt) return;

          const edgeKey = [Math.min(fromId, edge.to), Math.max(fromId, edge.to)].join('-');
          if (drawn.has(edgeKey)) return;
          drawn.add(edgeKey);

          L.polyline(
            [
              [fromPt.lat, fromPt.lon],
              [toPt.lat, toPt.lon],
            ],
            {
              color: '#38BDF8',
              weight: 1,
              opacity: 0.22,
              dashArray: '3, 6',
              interactive: false,
            }
          ).addTo(eL);
        });
      });
    }
  }, [graph, layers.route]);

  // ---- Draw Terrain Nodes & Danger/Science Layers ----
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !terrainLayerRef.current || !dangerLayerRef.current || !scienceLayerRef.current) return;

    const tL = terrainLayerRef.current.clearLayers();
    const dL = dangerLayerRef.current.clearLayers();
    const sL = scienceLayerRef.current.clearLayers();

    TERRAIN_POINTS.forEach((pt) => {
      const isBlocked = pt.slope > 15;
      const isStart = pt.id === startId;
      const isDest = pt.id === destId;
      const isSelected = pt.id === selectedId;
      const band = slopeBand(pt.slope);

      // 1. Blocked Danger Zone (Natasha constraint >15°)
      if (isBlocked && layers.danger) {
        L.circle([pt.lat, pt.lon], {
          radius: 220,
          color: '#E5484D',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: '#E5484D',
          fillOpacity: 0.18,
          interactive: false,
        }).addTo(dL);

        const dangerIcon = L.divIcon({
          className: 'hazard-icon-wrapper',
          html: `
            <div class="flex items-center justify-center w-5 h-5 rounded-full bg-rose-950/90 border border-rose-500 shadow-lg text-[9px] font-mono font-bold text-rose-300">
              ✕
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        L.marker([pt.lat, pt.lon], { icon: dangerIcon, interactive: false }).addTo(dL);
      }

      // 2. Science POI Highlight Ring
      if (pt.science && layers.science && !isBlocked) {
        L.circleMarker([pt.lat, pt.lon], {
          radius: 12,
          color: '#3DDC84',
          weight: 1.5,
          dashArray: '3, 3',
          fill: false,
          interactive: false,
        }).addTo(sL);
      }

      // 3. Routable Terrain Node Marker
      if (layers.terrain) {
        let nodeColor: string = BAND_COLORS[band];
        let radius = 5.5;

        if (isStart) {
          nodeColor = '#3DDC84';
          radius = 9;
        } else if (isDest) {
          nodeColor = '#E5484D';
          radius = 9;
        } else if (isSelected) {
          nodeColor = '#4DE3F0';
          radius = 8;
        }

        const marker = L.circleMarker([pt.lat, pt.lon], {
          radius,
          fillColor: nodeColor,
          fillOpacity: isBlocked ? 0.35 : 0.88,
          color: isSelected ? '#FFFFFF' : isStart || isDest ? '#0B1220' : '#111827',
          weight: isSelected || isStart || isDest ? 2.5 : 1,
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          handleNodeClickRef.current(pt.id);
        });

        marker.on('mouseover', () => hoverRef.current(pt.id));
        marker.on('mouseout', () => hoverRef.current(null));

        const siteName = SITE_LABELS[pt.id];
        const tooltipContent = `
          <div style="font-family: monospace; font-size: 11px; padding: 4px 6px; background: #0B1220; color: #E6EDF3; border: 1px solid #243552; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
            <div style="font-weight: bold; color: ${nodeColor}; display: flex; justify-content: space-between; gap: 8px;">
              <span>POINT P${pt.id}</span>
              <span>${pt.slope}° SLOPE</span>
            </div>
            ${siteName ? `<div style="color: #4DE3F0; font-size: 10px; margin-top: 2px;">${siteName}</div>` : ''}
            <div style="color: #94A3B8; font-size: 10px; margin-top: 2px;">Elev: ${pt.elev}m · ${pt.mineral}</div>
            ${isBlocked ? '<div style="color: #E5484D; font-weight: bold; margin-top: 2px;">⚠️ ROLLOVR RISK (&gt;15°)</div>' : ''}
          </div>
        `;

        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -6],
          className: 'tactical-tooltip',
          opacity: 0.98,
        });

        marker.addTo(tL);
      }
    });
  }, [layers.terrain, layers.danger, layers.science, startId, destId, selectedId]);

  // ---- Draw Calculated Routes (Active Primary & Comparison Ghost) ----
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routeLayerRef.current) return;
    const rL = routeLayerRef.current.clearLayers();

    // 1. Comparison Route (Ghost line)
    if (comparisonRoute && comparisonRoute.points.length > 1) {
      const latlngs: [number, number][] = comparisonRoute.points.map((p) => [p.lat, p.lon]);
      L.polyline(latlngs, {
        color: '#94A3B8',
        weight: 3,
        opacity: 0.45,
        dashArray: '6, 6',
        interactive: false,
      }).addTo(rL);
    }

    // 2. Active Primary Route (Glowing animated path)
    if (primaryRoute && primaryRoute.points.length > 1) {
      const latlngs: [number, number][] = primaryRoute.points.map((p) => [p.lat, p.lon]);

      // Neon outer glow
      L.polyline(latlngs, {
        color: primaryRoute.color,
        weight: 7,
        opacity: 0.35,
        interactive: false,
      }).addTo(rL);

      // Core crisp trajectory
      L.polyline(latlngs, {
        color: primaryRoute.color,
        weight: 3.5,
        opacity: 0.95,
        interactive: false,
      }).addTo(rL);

      // Sequential distance indicators on each point
      primaryRoute.points.forEach((p, idx) => {
        if (idx === 0 || idx === primaryRoute.points.length - 1) return;

        L.circleMarker([p.lat, p.lon], {
          radius: 3.5,
          fillColor: '#FFFFFF',
          fillOpacity: 1,
          color: primaryRoute.color,
          weight: 2,
          interactive: false,
        }).addTo(rL);
      });
    }
  }, [primaryRoute, comparisonRoute]);

  // ---- Draw Measurement Layer (Interactive Geodesic Ruler) ----
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !measureLayerRef.current) return;
    const mL = measureLayerRef.current.clearLayers();

    if (measurePoints.length === 0) return;

    // Draw points
    measurePoints.forEach((pt, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === measurePoints.length - 1;
      const color = isFirst ? '#3DDC84' : isLast ? '#E5484D' : '#4DE3F0';

      const marker = L.circleMarker([pt.lat, pt.lng], {
        radius: 7,
        fillColor: color,
        fillOpacity: 0.95,
        color: '#FFFFFF',
        weight: 2,
      });

      const label = pt.node ? `P${pt.node.id}` : `M${idx + 1}`;
      marker.bindTooltip(
        `<div style="font-family: monospace; font-size: 10px; font-weight: bold; padding: 2px 5px; background: #0B1220; color: #FFF; border: 1px solid ${color}; border-radius: 4px;">${label} (${pt.elevation.toFixed(0)}m)</div>`,
        { permanent: true, direction: 'top', offset: [0, -8] }
      );
      marker.addTo(mL);
    });

    // Draw line connecting points
    if (measurePoints.length >= 2) {
      const latlngs: [number, number][] = measurePoints.map((p) => [p.lat, p.lng]);

      // Glow polyline
      L.polyline(latlngs, {
        color: '#4DE3F0',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(mL);

      // Segment distance tags
      for (let i = 0; i < measurePoints.length - 1; i++) {
        const p1 = measurePoints[i];
        const p2 = measurePoints[i + 1];
        const segDistM = marsDistanceMeters(p1.lat, p1.lng, p2.lat, p2.lng);
        const midLat = (p1.lat + p2.lat) / 2;
        const midLng = (p1.lng + p2.lng) / 2;

        const tagIcon = L.divIcon({
          className: 'measure-tag',
          html: `
            <div style="background: rgba(11,18,32,0.92); border: 1px solid #4DE3F0; color: #4DE3F0; font-family: monospace; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; box-shadow: 0 4px 10px rgba(0,0,0,0.6); white-space: nowrap; transform: translate(-50%, -50%);">
              ${segDistM < 1000 ? `${segDistM.toFixed(0)}m` : `${(segDistM / 1000).toFixed(2)}km`}
            </div>
          `,
          iconSize: [0, 0],
        });

        L.marker([midLat, midLng], { icon: tagIcon, interactive: false }).addTo(mL);
      }
    }
  }, [measurePoints]);

  // Keyboard shortcut listener: S (start), D (dest), I (inspect), M (measure)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 's') onSetSettingMode('start');
      else if (key === 'd') onSetSettingMode('dest');
      else if (key === 'i') onSetSettingMode('inspect');
      else if (key === 'm') onSetSettingMode('measure');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSetSettingMode]);

  // Derived metrics for current measurement
  const measurementMetrics = useMemo(() => {
    if (measurePoints.length < 2) return null;

    let totalDistM = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      totalDistM += marsDistanceMeters(
        measurePoints[i].lat,
        measurePoints[i].lng,
        measurePoints[i + 1].lat,
        measurePoints[i + 1].lng
      );
    }

    const first = measurePoints[0];
    const last = measurePoints[measurePoints.length - 1];
    const deltaH = last.elevation - first.elevation;
    const avgSlopeDeg = totalDistM > 0 ? Math.atan2(Math.abs(deltaH), totalDistM) * (180 / Math.PI) : 0;
    const walkMinutes = totalDistM / 1.2 / 60; // 1.2 m/s walking speed
    const o2Rate = 1.2 + (Math.min(avgSlopeDeg, 15) / 15) * (3.8 - 1.2);
    const totalO2Liters = o2Rate * walkMinutes;

    return {
      totalDistM,
      totalDistKm: totalDistM / 1000,
      deltaH,
      avgSlopeDeg,
      walkMinutes,
      totalO2Liters,
      isHazard: avgSlopeDeg > 15,
      canSetRoute:
        measurePoints.length === 2 &&
        Boolean(measurePoints[0].node) &&
        Boolean(measurePoints[1].node),
      nodeA: measurePoints[0].node,
      nodeB: measurePoints[measurePoints.length - 1].node,
    };
  }, [measurePoints]);

  const zoom = (delta: number) => {
    sound.playClick();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  const reset = () => {
    sound.playClick();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className="relative w-full h-full bg-[#05080F] select-none overflow-hidden">
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        className={`absolute inset-0 z-0 ${settingMode === 'measure' ? 'cursor-crosshair' : ''}`}
      />

      {/* High-tech animated radar sweep overlay (toggleable) */}
      {radarSweep && (
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden z-10">
          <div
            className="w-[1200px] h-[1200px] absolute -top-1/4 -left-1/4 rounded-full border border-[#4DE3F0]/20"
            style={{
              background: 'conic-gradient(from 0deg, transparent 75%, rgba(77,227,240,0.3) 100%)',
              animation: 'spin 10s linear infinite',
            }}
          />
        </div>
      )}

      {/* Top Left: Waypoint Mode Selector */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 bg-[#0B1220]/95 backdrop-blur p-1 rounded-xl border border-[#243552] shadow-2xl">
        <span className="text-[10px] font-mono font-bold text-slate-400 px-2 uppercase flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-[#4DE3F0]" />
          <span>Interactive Mode:</span>
        </span>
        {(
          [
            ['start', 'SET START (S)'],
            ['dest', 'SET DEST (D)'],
            ['inspect', 'INSPECT NODE (I)'],
            ['measure', 'MEASURE (M)'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => {
              sound.playClick();
              onSetSettingMode(m);
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1 ${
              settingMode === m
                ? m === 'measure'
                  ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                  : 'bg-[#4DE3F0] text-[#0B1220] shadow-[0_0_12px_rgba(77,227,240,0.5)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {m === 'measure' && <Ruler className="w-3 h-3" />}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Top Right: NASA Basemap Switcher & View Controls */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
        {/* Basemap Style Toggle */}
        <div className="flex bg-[#0B1220]/95 backdrop-blur p-1 rounded-xl border border-[#243552] text-[10px] font-mono shadow-2xl">
          <button
            onClick={() => {
              sound.playClick();
              setBasemapStyle('crism');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              basemapStyle === 'crism'
                ? 'bg-[#182844] text-[#4DE3F0] font-bold border border-[#4DE3F0]/60 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>NASA CRISM DELTA</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setBasemapStyle('mola');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              basemapStyle === 'mola'
                ? 'bg-[#182844] text-[#4DE3F0] font-bold border border-[#4DE3F0]/60 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>NASA MOLA ELEVATION</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setBasemapStyle('tactical');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              basemapStyle === 'tactical'
                ? 'bg-[#182844] text-[#4DE3F0] font-bold border border-[#4DE3F0]/60 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TACTICAL GRID
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-[#0B1220]/95 backdrop-blur rounded-xl border border-[#243552] p-1 shadow-2xl">
          <button
            onClick={() => zoom(0.5)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => zoom(-0.5)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={reset}
            className="p-2 text-slate-300 hover:text-[#4DE3F0] hover:bg-slate-800/60 rounded-lg cursor-pointer"
            title="Recenter Jezero Crater"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Tactical Geodesic Measurement HUD (When Measuring or Points Placed) */}
      {(settingMode === 'measure' || measurePoints.length > 0) && (
        <div className="absolute top-16 left-3 z-[400] w-80 bg-[#0B1220]/95 backdrop-blur border border-rose-500/40 rounded-2xl p-4 shadow-2xl font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#243552] pb-2">
            <span className="flex items-center gap-1.5 font-bold text-rose-400">
              <Ruler className="w-4 h-4" />
              <span>TACTICAL SURFACE RULER</span>
            </span>
            {measurePoints.length > 0 && (
              <button
                onClick={() => {
                  sound.playClick();
                  setMeasurePoints([]);
                }}
                className="text-slate-400 hover:text-rose-400 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>CLEAR</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-300 font-sans leading-tight">
            Click anywhere on the map or snap to any of the 50 NASA Jezero points to measure real ground distance and slope.
          </div>

          {measurePoints.length === 0 ? (
            <div className="p-3 border border-dashed border-[#243552] rounded-xl text-center text-slate-500 text-[11px]">
              Click on the map to place Point 1
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Waypoints Placed: {measurePoints.length}</span>
                <span className="text-cyan-400">R = 3,389.5 km</span>
              </div>

              {measurementMetrics && (
                <div className="bg-[#111B2E] p-3 rounded-xl border border-[#243552] space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-400 text-[10px]">TOTAL DISTANCE:</span>
                    <span className="text-xl font-black text-white">
                      {measurementMetrics.totalDistM < 1000
                        ? `${measurementMetrics.totalDistM.toFixed(0)} m`
                        : `${measurementMetrics.totalDistKm.toFixed(2)} km`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1 border-t border-[#243552]">
                    <div>
                      <span className="text-slate-400 block">ELEVATION Δh:</span>
                      <span className="font-bold text-cyan-300">
                        {measurementMetrics.deltaH >= 0 ? '+' : ''}
                        {measurementMetrics.deltaH.toFixed(1)} m
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">AVG INCLINE:</span>
                      <span
                        className={`font-bold ${
                          measurementMetrics.avgSlopeDeg > 15
                            ? 'text-rose-400'
                            : measurementMetrics.avgSlopeDeg > 5
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {measurementMetrics.avgSlopeDeg.toFixed(1)}°{' '}
                        {measurementMetrics.avgSlopeDeg > 15 ? '⚠️ HAZARD' : 'SAFE'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">EST. WALK TIME:</span>
                      <span className="font-bold text-slate-200">
                        {measurementMetrics.walkMinutes < 1
                          ? `${Math.round(measurementMetrics.walkMinutes * 60)} sec`
                          : `${measurementMetrics.walkMinutes.toFixed(1)} min`}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block">EST. O₂ COST:</span>
                      <span className="font-bold text-emerald-400">
                        {measurementMetrics.totalO2Liters.toFixed(1)} L O₂
                      </span>
                    </div>
                  </div>

                  {/* Route shortcut if 2 nodes are selected */}
                  {measurementMetrics.canSetRoute && measurementMetrics.nodeA && measurementMetrics.nodeB && (
                    <button
                      onClick={() => {
                        sound.playCompute();
                        onSetStart(measurementMetrics.nodeA!.id);
                        onSetDest(measurementMetrics.nodeB!.id);
                        onSetSettingMode('inspect');
                      }}
                      className="w-full mt-2 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#04121A] font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>SET AS MISSION ROUTE (P{measurementMetrics.nodeA.id} ➔ P{measurementMetrics.nodeB.id})</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#0B1220]/95 backdrop-blur border border-[#243552] rounded-xl px-3.5 py-2 text-[10px] font-mono shadow-2xl">
          <Compass className="w-3.5 h-3.5 text-[#4DE3F0]" />
          <span className="text-white font-bold">JEZERO CRATER</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">50 NASA POINTS</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-bold">46 ROUTABLE</span>
          <span className="text-slate-500">•</span>
          <span className="text-rose-400 flex items-center gap-1 font-bold">
            <AlertTriangle className="w-3 h-3" /> 4 BLOCKED (&gt;15°)
          </span>
        </div>

        <button
          onClick={() => setRadarSweep(!radarSweep)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-mono cursor-pointer transition-colors shadow-2xl ${
            radarSweep
              ? 'bg-[#4DE3F0]/20 border-[#4DE3F0] text-[#4DE3F0]'
              : 'bg-[#0B1220]/95 border-[#243552] text-slate-400'
          }`}
          title="Toggle Tactical Radar Sweep"
        >
          <Radar className="w-3.5 h-3.5" />
          <span>RADAR</span>
        </button>
      </div>

      {/* Bottom Right NASA Credits */}
      <div className="absolute bottom-3 right-3 z-[400] bg-[#0B1220]/90 backdrop-blur border border-[#243552] rounded-lg px-2.5 py-1 text-[9px] font-mono text-slate-400 flex items-center gap-2">
        <span className="text-[#4DE3F0]">NASA MRO CRISM/CTX</span>
        <span>•</span>
        <span>MOLA DEM</span>
        <span>•</span>
        <span>JEZERO DELTA</span>
      </div>
    </div>
  );
};
