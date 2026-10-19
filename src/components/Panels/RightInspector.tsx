/**
 * RED ARES — Right Inspector Panel
 * Terrain Node Inspector, Route Analysis metrics, "Why this route?" explanation.
 * Data: Natasha's 50 real points. Cost: C(t) = (C_terrain × μ) + W_science.
 */

import React from 'react';
import { RouteResult } from '../../types/mars';
import {
  TerrainGraph,
  TERRAIN_POINTS,
  BAND_LABELS,
  BAND_COLORS,
  slopeBand,
  terrainCost,
  MU_FRICTION,
  scienceBonus,
  o2LitersPerMin,
} from '../../data/terrain';
import { ElevationChart } from '../Chart/ElevationChart';
import {
  Crosshair,
  Route as RouteIcon,
  Info,
  FlaskConical,
  AlertTriangle,
  Mountain,
  Wind,
  Atom,
} from 'lucide-react';

interface RightInspectorProps {
  selectedId: number | null;
  activeRoute: RouteResult | null;
  graph: TerrainGraph;
}

const nodeById = new Map(TERRAIN_POINTS.map((p) => [p.id, p]));

export const RightInspector: React.FC<RightInspectorProps> = ({ selectedId, activeRoute, graph }) => {
  const node = selectedId ? nodeById.get(selectedId) : undefined;
  const blocked = node ? node.slope > 15 : false;
  const band = node ? slopeBand(node.slope) : 0;

  return (
    <div className="h-full flex flex-col bg-[#0E1626] border-l border-[#243552] overflow-y-auto">
      {/* Node inspector */}
      <div className="p-3.5 border-b border-[#243552]">
        <div className="text-[10px] tracking-wider text-slate-400 font-heading font-semibold uppercase mb-2 flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-[#4DE3F0]" />
          <span>TERRAIN NODE INSPECTOR</span>
        </div>
        {!node ? (
          <div className="text-xs text-slate-500 font-mono py-3 text-center">
            Click a node on the map (INSPECT mode)
          </div>
        ) : (
          <div className="text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">P{node.id}</span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold"
                style={{ background: `${BAND_COLORS[band]}22`, color: BAND_COLORS[band], border: `1px solid ${BAND_COLORS[band]}` }}
              >
                {blocked ? 'BLOCKED' : BAND_LABELS[band].split(' (')[0]}
              </span>
            </div>
            <Row k="Coords" v={`${node.lat.toFixed(5)}°N, ${node.lon.toFixed(5)}°E`} />
            <Row k="Elevation" v={`${node.elev} m`} icon={<Mountain className="w-3 h-3" />} />
            <Row k="Slope" v={`${node.slope.toFixed(1)}°`} />
            <Row k="Soil (μ)" v={`${node.soil} ×${MU_FRICTION[node.soil]}`} icon={<Wind className="w-3 h-3" />} />
            <Row k="Mineral" v={node.mineral} icon={<Atom className="w-3 h-3" />} />
            <Row
              k="Science"
              v={node.science ? 'TARGET (−3.5 bonus)' : '—'}
              icon={<FlaskConical className="w-3 h-3" />}
              hot={node.science}
            />
            <div className="pt-1.5 mt-1.5 border-t border-[#243552]/60">
              <div className="text-[10px] text-slate-500 mb-1">C(t) = (C_terrain × μ) + W_science</div>
              <Row
                k="C_terrain"
                v={blocked ? '99999 (hard block)' : terrainCost(node).toFixed(1)}
                hot={blocked}
              />
              {!blocked && <Row k="Per-meter factor" v={`×${(terrainCost(node) * MU_FRICTION[node.soil]).toFixed(2)}`} />}
              {!blocked && <Row k="W_science" v={scienceBonus(node).toFixed(1)} hot={node.science} />}
              <Row k="O₂ est." v={blocked ? '— (no EVA)' : `${o2LitersPerMin(node.slope)} L/min`} />
            </div>
            {blocked && (
              <div className="flex items-start gap-1.5 text-[10px] text-[#E5484D] bg-[#E5484D]/10 border border-[#E5484D]/40 rounded p-1.5 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-none mt-0.5" />
                <span>Slope &gt; 15° — hard constraint. Excluded from routing graph.</span>
              </div>
            )}
            <div className="text-[9px] text-slate-600 pt-1">
              Routable nodes: {graph.nodes.size}/50 · Blocked: {graph.blockedIds.join(', ') || '—'}
            </div>
          </div>
        )}
      </div>

      {/* Route analysis */}
      <div className="p-3.5 border-b border-[#243552]">
        <div className="text-[10px] tracking-wider text-slate-400 font-heading font-semibold uppercase mb-2 flex items-center gap-1.5">
          <RouteIcon className="w-3.5 h-3.5 text-[#4DE3F0]" />
          <span>ROUTE ANALYSIS</span>
        </div>
        {!activeRoute ? (
          <div className="text-xs text-slate-500 font-mono py-3 text-center">No route calculated yet</div>
        ) : (
          <div className="text-xs font-mono space-y-1.5">
            <div className="text-white font-bold text-sm" style={{ color: activeRoute.color }}>
              {activeRoute.label}
            </div>
            <Row k="Nodes" v={String(activeRoute.points.length)} />
            <Row k="Distance" v={`${activeRoute.metrics.distanceKm.toFixed(2)} km`} />
            <Row k="Walk time" v={activeRoute.metrics.formattedWalkTime} />
            <Row k="Elev gain" v={`+${activeRoute.metrics.elevationGainMeters} m`} />
            <Row k="Max slope" v={`${activeRoute.metrics.maxSlopeDegrees}°`} />
            <Row k="Avg slope" v={`${activeRoute.metrics.avgSlopeDegrees}°`} />
            <Row k="Σ C(t)" v={activeRoute.metrics.totalCost.toFixed(1)} hot />
            <Row k="Safety" v={`${activeRoute.metrics.safetyScore}/100`} />
            <Row k="Algorithm" v={`${activeRoute.algorithmUsed} · ${activeRoute.executionTimeMs} ms`} />
            {activeRoute.metrics.visitedScienceIds.length > 0 && (
              <Row
                k="Science via"
                v={`P${activeRoute.metrics.visitedScienceIds.join(', P')}`}
                hot
              />
            )}
            <div className="pt-1.5 mt-1.5 border-t border-[#243552]/60">
              <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                <Info className="w-3 h-3" /> WHY THIS ROUTE?
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{activeRoute.metrics.whySentence}</p>
            </div>
          </div>
        )}
      </div>

      {/* Elevation profile */}
      {activeRoute && activeRoute.points.length > 1 && (
        <div className="p-3.5">
          <div className="text-[10px] tracking-wider text-slate-400 font-heading font-semibold uppercase mb-2">
            ELEVATION PROFILE
          </div>
          <ElevationChart primaryRoute={activeRoute} />
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ k: string; v: string; icon?: React.ReactNode; hot?: boolean }> = ({
  k,
  v,
  icon,
  hot,
}) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-slate-500 flex items-center gap-1">
      {icon}
      {k}
    </span>
    <span className={hot ? 'text-[#4DE3F0] font-bold' : 'text-slate-200'}>{v}</span>
  </div>
);
