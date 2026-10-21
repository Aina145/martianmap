/**
 * RED ARES — MarsMap Component
 * Leaflet vector map of Natasha's 50 REAL terrain points (Jezero Crater).
 * No tile layer (offline-safe) — nodes, graph edges and routes are pure vectors.
 * Nodes with slope > 15° are shown as BLOCKED (excluded from routing graph).
 */

import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteResult, LayerSettings } from '../../types/mars';
import {
  TerrainGraph,
  TERRAIN_POINTS,
  BAND_COLORS,
  slopeBand,
  SITE_LABELS,
} from '../../data/terrain';
import { Compass, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Layers } from 'lucide-react';

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
  settingMode: 'start' | 'dest' | 'inspect';
  onSetSettingMode: (mode: 'start' | 'dest' | 'inspect') => void;
}

const nodeById = new Map(TERRAIN_POINTS.map((p) => [p.id, p]));

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
  const terrainLayerRef = useRef<L.LayerGroup | null>(null);
  const scienceLayerRef = useRef<L.LayerGroup | null>(null);
  const dangerLayerRef = useRef<L.LayerGroup | null>(null);
  const edgeLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const modeRef = useRef(settingMode);
  modeRef.current = settingMode;
  const hoverRef = useRef(onHoverNode);
  hoverRef.current = onHoverNode;

  const bounds = useMemo(() => {
    const lats = TERRAIN_POINTS.map((p) => p.lat);
    const lons = TERRAIN_POINTS.map((p) => p.lon);
    return L.latLngBounds(
      [Math.min(...lats) - 0.004, Math.min(...lons) - 0.004],
      [Math.max(...lats) + 0.004, Math.max(...lons) + 0.004]
    );
  }, []);

  const handleNodeClick = (id: number) => {
    const mode = modeRef.current;
    if (mode === 'start') onSetStart(id);
    else if (mode === 'dest') onSetDest(id);
    else onSelectNode(id);
  };
  const handleNodeClickRef = useRef(handleNodeClick);
  handleNodeClickRef.current = handleNodeClick;

  // ---- init map once ----
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      // Trek's default028mm grid is equirectangular (2:1) — EPSG4326 matches
      // it, so the imagery aligns with the lat/lon vector overlays.
      crs: L.CRS.EPSG4326,
      minZoom: 2,
      maxZoom: 11,
    });
    // NASA Mars Trek basemap — Viking MDIM 2.1 colour mosaic (real imagery
    // under the vector overlays). Tiles verified live 2026-10-21; if Trek is
    // unreachable the map simply falls back to the dark background.
    L.tileLayer(
      'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
      { maxNativeZoom: 7, maxZoom: 11, opacity: 0.9 }
    ).addTo(map);
    map.fitBounds(bounds);
    mapInstanceRef.current = map;

    // Leaflet measures the container once at init. If the layout settles
    // afterwards (panels/fonts), vector layers project off-pane — the map
    // looks empty even though everything drew. Re-measure + reframe once
    // layout is final, and keep the size in sync when the container resizes.
    const reframe = () => {
      map.invalidateSize();
      map.fitBounds(bounds);
    };
    const raf = requestAnimationFrame(reframe);
    const timer = setTimeout(reframe, 300);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapContainerRef.current);

    terrainLayerRef.current = L.layerGroup().addTo(map);
    scienceLayerRef.current = L.layerGroup().addTo(map);
    dangerLayerRef.current = L.layerGroup().addTo(map);
    edgeLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', () => {
      if (modeRef.current === 'inspect') onSelectNode(null);
    });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- draw static layers ----
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !terrainLayerRef.current) return;
    const tL = terrainLayerRef.current.clearLayers();
    const sL = scienceLayerRef.current!.clearLayers();
    const dL = dangerLayerRef.current!.clearLayers();
    const eL = edgeLayerRef.current!.clearLayers();

    if (layers.terrain) {
      for (const p of TERRAIN_POINTS) {
        if (p.slope > 15) continue;
        const c = BAND_COLORS[slopeBand(p.slope)];
        const m = L.circleMarker([p.lat, p.lon], {
          radius: p.science ? 9 : 6,
          color: p.science ? '#ffffff' : c,
          weight: p.science ? 2 : 1,
          fillColor: c,
          fillOpacity: 0.9,
        });
        m.bindTooltip(
          `<b>P${p.id}</b> · ${p.slope.toFixed(1)}° · ${p.soil}<br>${p.mineral}${p.science ? ' · <b>SCIENCE</b>' : ''}`,
          { direction: 'top', offset: [0, -8] }
        );
        m.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          handleNodeClickRef.current(p.id);
        });
        m.on('mouseover', () => hoverRef.current(p.id));
        m.on('mouseout', () => hoverRef.current(null));
        m.addTo(tL);
      }
    }

    if (layers.science) {
      for (const p of TERRAIN_POINTS) {
        if (!p.science || p.slope > 15) continue;
        L.circleMarker([p.lat, p.lon], {
          radius: 14,
          color: '#ffffff',
          weight: 1,
          fillColor: '#ffffff',
          fillOpacity: 0.12,
        }).addTo(sL);
      }
      for (const s of SITE_LABELS) {
        const p = nodeById.get(s.pointId)!;
        L.marker([p.lat, p.lon], {
          icon: L.divIcon({
            className: '',
            html: `<div style="transform:translate(-50%,-160%);white-space:nowrap;background:rgba(11,18,32,.85);border:1px solid #4DE3F0;color:#fff;font-size:9px;padding:2px 6px;border-radius:4px;letter-spacing:1px;">${s.label}</div>`,
          }),
          interactive: false,
        }).addTo(sL);
      }
    }

    if (layers.danger) {
      for (const id of graph.blockedIds) {
        const p = nodeById.get(id)!;
        const m = L.circleMarker([p.lat, p.lon], {
          radius: 7,
          color: '#E5484D',
          weight: 2,
          fillColor: '#E5484D',
          fillOpacity: 0.35,
        });
        m.bindTooltip(`<b>P${p.id} — BLOCKED</b><br>${p.slope.toFixed(1)}° &gt; 15° hard constraint`, {
          direction: 'top',
          offset: [0, -8],
        });
        m.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          handleNodeClickRef.current(p.id);
        });
        m.addTo(dL);
      }
    }

    if (layers.route) {
      const seen = new Set<string>();
      graph.adjacency.forEach((edges, from) => {
        const a = graph.nodes.get(from)!;
        for (const e of edges) {
          const key = from < e.to ? `${from}-${e.to}` : `${e.to}-${from}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const b = graph.nodes.get(e.to)!;
          L.polyline(
            [
              [a.lat, a.lon],
              [b.lat, b.lon],
            ],
            { color: '#5b6b85', weight: 1, opacity: 0.35 }
          ).addTo(eL);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, graph]);

  // ---- draw routes ----
  useEffect(() => {
    const rL = routeLayerRef.current;
    if (!rL) return;
    rL.clearLayers();
    const draw = (route: RouteResult | null, main: boolean) => {
      if (!route || route.points.length === 0) return;
      const latlngs = route.points.map((p) => [p.lat, p.lon] as [number, number]);
      L.polyline(latlngs, {
        color: route.color,
        weight: main ? 4 : 2,
        opacity: main ? 0.95 : 0.55,
        dashArray: main ? undefined : '6 6',
      }).addTo(rL);
      if (main) {
        route.points.forEach((p, i) => {
          if (i % 5 !== 0 && i !== route.points.length - 1) return;
          L.circleMarker([p.lat, p.lon], {
            radius: 3,
            color: '#ffffff',
            weight: 1,
            fillColor: route.color,
            fillOpacity: 1,
          }).addTo(rL);
        });
      }
    };
    draw(comparisonRoute || null, false);
    draw(primaryRoute, true);
  }, [primaryRoute, comparisonRoute]);

  // ---- start/dest/selected markers ----
  useEffect(() => {
    const mL = markerLayerRef.current;
    if (!mL) return;
    mL.clearLayers();
    const pin = (id: number, label: string, color: string) => {
      const p = nodeById.get(id);
      if (!p) return;
      L.marker([p.lat, p.lon], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:50%;background:${color};color:#04121a;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;transform:translate(-50%,-50%);box-shadow:0 0 10px ${color};">${label}</div>`,
        }),
        interactive: false,
        zIndexOffset: 1000,
      }).addTo(mL);
    };
    if (startId) pin(startId, 'S', '#3DDC84');
    if (destId) pin(destId, 'D', '#E5484D');
    if (selectedId && selectedId !== startId && selectedId !== destId) {
      const p = nodeById.get(selectedId);
      if (p) {
        L.circleMarker([p.lat, p.lon], {
          radius: 16,
          color: '#4DE3F0',
          weight: 2,
          fill: false,
        }).addTo(mL);
      }
    }
  }, [startId, destId, selectedId]);

  const zoom = (d: number) => {
    const map = mapInstanceRef.current;
    if (map) map.setZoom(map.getZoom() + d);
  };
  const reset = () => {
    const map = mapInstanceRef.current;
    if (map) map.fitBounds(bounds);
  };

  return (
    <div className="relative w-full h-full">
      <style>{`.leaflet-container{background:#070b14;}`}</style>
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Mode switch */}
      <div className="absolute top-3 left-3 z-[500] flex gap-1.5">
        {(
          [
            ['start', 'SET START'],
            ['dest', 'SET DEST'],
            ['inspect', 'INSPECT'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => onSetSettingMode(m)}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-mono tracking-wider border transition-colors cursor-pointer ${
              settingMode === m
                ? 'bg-[#4DE3F0] text-[#04121a] border-[#4DE3F0] font-bold'
                : 'bg-[#0B1220]/85 text-slate-300 border-[#243552] hover:border-[#4DE3F0]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5">
        <button onClick={() => zoom(1)} className="p-2 rounded-md bg-[#0B1220]/85 border border-[#243552] text-slate-300 hover:text-white hover:border-[#4DE3F0] cursor-pointer" title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => zoom(-1)} className="p-2 rounded-md bg-[#0B1220]/85 border border-[#243552] text-slate-300 hover:text-white hover:border-[#4DE3F0] cursor-pointer" title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={reset} className="p-2 rounded-md bg-[#0B1220]/85 border border-[#243552] text-slate-300 hover:text-white hover:border-[#4DE3F0] cursor-pointer" title="Reset view">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Scale hint */}
      <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-[#0B1220]/85 border border-[#243552] rounded-md px-2.5 py-1.5">
        <Compass className="w-3.5 h-3.5 text-[#4DE3F0]" />
        <span>50 REAL PTS · JEZERO · {graph.nodes.size} ROUTABLE · {graph.blockedIds.length} BLOCKED</span>
      </div>
      <div className="absolute bottom-3 right-3 z-[500] flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
        <Layers className="w-3.5 h-3.5" />
        <span>VIKING MDIM21 · NASA TREK</span>
        <AlertTriangle className="w-3.5 h-3.5 text-[#E5484D]" />
      </div>
    </div>
  );
};
