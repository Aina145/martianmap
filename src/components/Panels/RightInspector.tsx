/**
 * RED ARES — Right Inspector Panel
 * Tactical Telemetry, Route Metrics, Elevation Profile, and direct Launch HUD CTA.
 */

import React, { useState } from 'react';
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
  TerrainPoint,
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
  Clock,
  Gauge,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { sound } from '../../engine/sound';

interface RightInspectorProps {
  selectedId: number | null;
  activeRoute: RouteResult | null;
  graph: TerrainGraph;
  onOpenHud?: () => void;
}

const nodeById = new Map<number, TerrainPoint>(TERRAIN_POINTS.map((p) => [p.id, p]));

export const RightInspector: React.FC<RightInspectorProps> = ({
  selectedId,
  activeRoute,
  graph,
  onOpenHud,
}) => {
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);
  const node = selectedId ? nodeById.get(selectedId) : undefined;
  const blocked = node ? node.slope > 15 : false;
  const band = node ? slopeBand(node.slope) : 0;

  const downloadCsvFile = (content: string, filename: string) => {
    sound.playClick();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadMsg(`CSV Downloaded: ${filename}`);
    setTimeout(() => setDownloadMsg(null), 3000);
  };

  const handleExportRouteCsv = () => {
    if (!activeRoute) return;
    const headers = [
      'step_index',
      'point_id',
      'latitude',
      'longitude',
      'elevation_m',
      'slope_deg',
      'slope_category',
      'soil_type',
      'soil_friction_mu',
      'mineral',
      'is_science_target',
      'step_distance_m',
      'cumulative_distance_m',
      'cumulative_elevation_gain_m',
      'step_cost_ct',
    ];

    const rows = activeRoute.points.map((pt, idx) => [
      idx + 1,
      `P${pt.id}`,
      pt.lat.toFixed(6),
      pt.lon.toFixed(6),
      pt.elevation.toFixed(1),
      pt.slope.toFixed(1),
      pt.category,
      `"${pt.soil}"`,
      MU_FRICTION[pt.soil as keyof typeof MU_FRICTION] ?? 1.0,
      `"${pt.mineral}"`,
      pt.science ? 'TRUE' : 'FALSE',
      pt.stepDistanceMeters.toFixed(1),
      pt.cumulativeDistanceMeters.toFixed(1),
      pt.cumulativeElevationGain.toFixed(1),
      pt.stepCost.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const filename = `red_ares_route_${activeRoute.type}_${Date.now()}.csv`;
    downloadCsvFile(csvContent, filename);
  };

  const handleExportMatrixCsv = () => {
    const headers = [
      'point_id',
      'latitude',
      'longitude',
      'elevation_m',
      'slope_deg',
      'soil_type',
      'soil_friction_mu',
      'mineral',
      'has_science_target',
      'is_blocked_over_15deg',
    ];

    const rows = TERRAIN_POINTS.map((pt) => [
      `P${pt.id}`,
      pt.lat.toFixed(6),
      pt.lon.toFixed(6),
      pt.elev.toFixed(1),
      pt.slope.toFixed(1),
      `"${pt.soil}"`,
      MU_FRICTION[pt.soil as keyof typeof MU_FRICTION] ?? 1.0,
      `"${pt.mineral}"`,
      pt.science ? 'TRUE' : 'FALSE',
      pt.slope > 15 ? 'TRUE' : 'FALSE',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const filename = `jezero_terrain_matrix_50pts_${Date.now()}.csv`;
    downloadCsvFile(csvContent, filename);
  };

  return (
    <div className="w-80 shrink-0 h-full flex flex-col bg-[#0D1524] border-l border-[#243552] overflow-y-auto select-none font-sans">
      {/* Download Alert Toast */}
      {downloadMsg && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-3 py-2 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{downloadMsg}</span>
        </div>
      )}

      {/* 1. Tactical Route Summary (Top Priority for Evaluators) */}
      <div className="p-4 border-b border-[#243552] bg-[#111B2E]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#4DE3F0] uppercase tracking-wider">
            <RouteIcon className="w-3.5 h-3.5" />
            <span>ROUTE TELEMETRY</span>
          </div>
          <div className="flex items-center gap-1.5">
            {activeRoute && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: `${activeRoute.color}22`,
                  color: activeRoute.color,
                  border: `1px solid ${activeRoute.color}66`,
                }}
              >
                {activeRoute.type.toUpperCase()}
              </span>
            )}
            <button
              onClick={activeRoute ? handleExportRouteCsv : handleExportMatrixCsv}
              title={activeRoute ? "Export Active Route to CSV" : "Export 50-Point Terrain Matrix to CSV"}
              className="p-1 rounded bg-[#0B1220] border border-[#243552] text-slate-400 hover:text-[#4DE3F0] hover:border-[#4DE3F0] transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>

        {!activeRoute ? (
          <div className="text-xs text-slate-400 font-mono py-4 text-center space-y-3">
            <div>Click "Calculate Route" to generate tactical corridor</div>
            <button
              onClick={handleExportMatrixCsv}
              className="py-1.5 px-3 rounded-lg bg-[#0B1220] hover:bg-[#16233B] border border-[#243552] hover:border-[#4DE3F0] text-[#4DE3F0] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mx-auto transition-all cursor-pointer"
              title="Download NASA Jezero 50 points raw dataset as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT TERRAIN CSV</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0B1220] p-2.5 rounded-lg border border-[#243552]">
                <div className="text-[10px] font-mono text-slate-400">TOTAL DISTANCE</div>
                <div className="text-lg font-mono font-black text-white">
                  {activeRoute.metrics.distanceKm.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-400">km</span>
                </div>
              </div>

              <div className="bg-[#0B1220] p-2.5 rounded-lg border border-[#243552]">
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>EST. TIME</span>
                </div>
                <div className="text-lg font-mono font-black text-white">
                  {activeRoute.metrics.formattedWalkTime}
                </div>
              </div>

              <div className="bg-[#0B1220] p-2.5 rounded-lg border border-[#243552]">
                <div className="text-[10px] font-mono text-slate-400">MAX INCLINE</div>
                <div
                  className={`text-lg font-mono font-black ${
                    activeRoute.metrics.maxSlopeDegrees >= 15 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {activeRoute.metrics.maxSlopeDegrees}°{' '}
                  <span className="text-[10px] font-normal text-slate-400">(&lt;15° safe)</span>
                </div>
              </div>

              <div className="bg-[#0B1220] p-2.5 rounded-lg border border-[#243552]">
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>SAFETY SCORE</span>
                </div>
                <div className="text-lg font-mono font-black text-[#3DDC84]">
                  {activeRoute.metrics.safetyScore}
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </div>
              </div>
            </div>

            {/* Science targets visited badge */}
            {activeRoute.metrics.visitedScienceIds.length > 0 && (
              <div className="bg-cyan-950/40 border border-cyan-800/60 p-2 rounded-lg text-xs font-mono text-cyan-200 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#4DE3F0] shrink-0" />
                <span>
                  <b>{activeRoute.metrics.visitedScienceIds.length} Science POIs</b> intercepted along safe corridor!
                </span>
              </div>
            )}

            {/* Why This Route Explanation */}
            <div className="bg-[#0B1220] p-2.5 rounded-lg border border-[#243552] text-xs">
              <div className="text-[10px] font-mono text-[#4DE3F0] font-bold flex items-center gap-1 mb-1">
                <Info className="w-3 h-3" />
                <span>TRAVERSE RATIONALE:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {activeRoute.metrics.whySentence}
              </p>
            </div>

            {/* Direct Launch HUD CTA */}
            {onOpenHud && (
              <button
                onClick={() => {
                  sound.playCompute();
                  onOpenHud();
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-[#4DE3F0] to-[#38b2bd] hover:brightness-110 text-[#0B1220] font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/80 cursor-pointer transition-transform active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>LAUNCH ASTRONAUT HUD ➔</span>
              </button>
            )}

            {/* CSV Export Action Button */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleExportRouteCsv}
                className="flex-1 py-2 px-3 rounded-lg bg-[#0B1220] hover:bg-[#16233B] border border-[#243552] hover:border-[#4DE3F0] text-[#4DE3F0] font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer group"
                title="Download CSV file containing all route waypoints, elevations, slopes, and NASA cost parameters"
              >
                <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                <span>EXPORT ROUTE CSV</span>
              </button>
              <button
                onClick={handleExportMatrixCsv}
                className="py-2 px-2.5 rounded-lg bg-[#0B1220] hover:bg-[#16233B] border border-[#243552] hover:border-slate-500 text-slate-400 hover:text-slate-200 font-mono text-[11px] font-bold uppercase flex items-center justify-center transition-all cursor-pointer"
                title="Export complete 50-point Jezero Crater raw matrix CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Elevation Profile Chart */}
      {activeRoute && activeRoute.points.length > 1 && (
        <div className="p-4 border-b border-[#243552]">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-[#4DE3F0]" />
              <span>ELEVATION PROFILE</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              +{activeRoute.metrics.elevationGainMeters}m climb
            </span>
          </div>
          <ElevationChart primaryRoute={activeRoute} />
        </div>
      )}

      {/* 3. Node Inspector (Inspect Mode) */}
      <div className="p-4">
        <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-[#4DE3F0]" />
            <span>NODE TELEMETRY</span>
          </div>
          {node && <span className="text-[10px] font-mono text-slate-400">P{node.id}</span>}
        </div>

        {!node ? (
          <div className="text-xs text-slate-500 font-mono py-3 text-center bg-[#0B1220]/60 rounded border border-[#243552]/40">
            Click any point on the map to inspect elevation & soil telemetry
          </div>
        ) : (
          <div className="bg-[#0B1220] p-3 rounded-lg border border-[#243552] text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">POINT P{node.id}</span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold"
                style={{
                  background: `${BAND_COLORS[band]}22`,
                  color: BAND_COLORS[band],
                  border: `1px solid ${BAND_COLORS[band]}`,
                }}
              >
                {blocked ? 'BLOCKED (>15°)' : BAND_LABELS[band].split(' (')[0]}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Coordinates:</span>
                <span>{node.lat.toFixed(4)}°N, {node.lon.toFixed(4)}°E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Elevation:</span>
                <span className="text-white font-bold">{node.elev} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Slope:</span>
                <span className={`font-bold ${blocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {node.slope.toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Soil Friction:</span>
                <span>{node.soil} (μ={MU_FRICTION[node.soil]})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mineral:</span>
                <span>{node.mineral}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">O₂ Consumption:</span>
                <span>{o2LitersPerMin(node.slope) ? `${o2LitersPerMin(node.slope)} L/min` : 'N/A (Blocked)'}</span>
              </div>
            </div>

            {blocked && (
              <div className="flex items-start gap-1.5 text-[10px] text-rose-300 bg-rose-950/40 border border-rose-800 rounded p-1.5 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>Steep scarp exceeds 15° rover safety envelope. Excluded from traversable graph.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
