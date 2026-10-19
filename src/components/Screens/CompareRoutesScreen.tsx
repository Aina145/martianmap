/**
 * RED ARES — Compare Routes Screen
 * Side-by-side analytical comparison of Shortest (dashed) vs Lower-Slope (solid) corridors.
 * Includes interactive dual elevation profile chart, metric comparison table, and route picker.
 */

import React, { useState } from 'react';
import { RouteResult } from '../../types/mars';
import { TerrainGraph } from '../../data/terrain';
import { ElevationChart } from '../Chart/ElevationChart';
import { MarsMap } from '../Map/MarsMap';
import {
  ArrowLeft,
  CheckCircle,
  GitCompare,
  TrendingUp,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface CompareRoutesScreenProps {
  graph: TerrainGraph;
  lowerSlopeRoute: RouteResult | null;
  shortestRoute: RouteResult | null;
  scienceRoute: RouteResult | null;
  onBackToMissionControl: () => void;
  onPickRoute: (route: RouteResult) => void;
  onSyncToHud: (route: RouteResult) => void;
}

export const CompareRoutesScreen: React.FC<CompareRoutesScreenProps> = ({
  graph,
  lowerSlopeRoute,
  shortestRoute,
  scienceRoute,
  onBackToMissionControl,
  onPickRoute,
  onSyncToHud,
}) => {
  const [selectedRouteType, setSelectedRouteType] = useState<'lower-slope' | 'shortest' | 'science-stop'>(
    'lower-slope'
  );
  const [hoveredWaypointIndex, setHoveredWaypointIndex] = useState<number | null>(null);

  // Active chosen route
  const activeChosenRoute =
    selectedRouteType === 'lower-slope'
      ? lowerSlopeRoute
      : selectedRouteType === 'shortest'
      ? shortestRoute
      : scienceRoute || lowerSlopeRoute;

  // Comparison metrics calculations
  const lsM = lowerSlopeRoute?.metrics;
  const shM = shortestRoute?.metrics;

  const distanceDiffM = lsM && shM ? lsM.distanceMeters - shM.distanceMeters : 0;
  const timeDiffMins = lsM && shM ? lsM.estimatedWalkTimeMinutes - shM.estimatedWalkTimeMinutes : 0;
  const elevDiffM = lsM && shM ? lsM.elevationGainMeters - shM.elevationGainMeters : 0;
  const hazardDiff = lsM && shM ? lsM.hazardCellCount - shM.hazardCellCount : 0;

  return (
    <div className="h-full flex flex-col bg-[#0B1220] text-[#E6EDF3] select-none">
      {/* Top Header */}
      <header className="h-14 bg-[#131C2E] border-b border-[#243552] px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMissionControl}
            className="p-1.5 rounded-lg bg-[#0B1220] border border-[#243552] text-slate-300 hover:text-white hover:border-[#4DE3F0] transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO MISSION MAP</span>
          </button>
          <div className="h-5 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#4DE3F0]" />
            <h2 className="font-heading font-bold text-sm text-white">ROUTE COMPARISON ENGINE</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeChosenRoute && (
            <button
              onClick={() => onSyncToHud(activeChosenRoute)}
              className="px-3.5 py-1.5 rounded-lg bg-[#4DE3F0] hover:bg-[#38b2bd] text-[#0B1220] font-heading text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>SYNC SELECTED TO HUD</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Comparison Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Side: Map Comparison Preview (5 cols) */}
        <div className="lg:col-span-5 h-full relative border-r border-[#243552] flex flex-col bg-[#080D17]">
          {/* Legend bar */}
          <div className="p-3 bg-[#131C2E] border-b border-[#243552] flex items-center justify-between text-xs font-code">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#3DDC84] inline-block shadow-sm shadow-emerald-500" />
                <span className="text-[#3DDC84] font-bold">LOWER-SLOPE (SOLID)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b-2 border-dashed border-[#F5C542] inline-block" />
                <span className="text-[#F5C542] font-bold">SHORTEST (DASHED)</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">JEZERO AOI</span>
          </div>

          <div className="flex-1 relative">
            <MarsMap
              graph={graph}
              layers={{ terrain: true, science: true, danger: true, route: false }}
              startId={lowerSlopeRoute?.points[0]?.id ?? null}
              destId={
                lowerSlopeRoute && lowerSlopeRoute.points.length > 0
                  ? lowerSlopeRoute.points[lowerSlopeRoute.points.length - 1].id
                  : null
              }
              onSetStart={() => {}}
              onSetDest={() => {}}
              selectedId={null}
              onSelectNode={() => {}}
              onHoverNode={() => {}}
              primaryRoute={lowerSlopeRoute}
              comparisonRoute={shortestRoute}
              settingMode="inspect"
              onSetSettingMode={() => {}}
            />
          </div>
        </div>

        {/* Right Side: Analytical Deep Dive & Decision Matrix (7 cols) */}
        <div className="lg:col-span-7 h-full overflow-y-auto p-6 space-y-5 bg-[#0B1220]">
          {/* Comparison Cards Selector */}
          <div>
            <div className="text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-wider mb-2">
              SELECT STRATEGY FOR MISSION EXECUTION
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lower Slope Option */}
              <div
                onClick={() => setSelectedRouteType('lower-slope')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedRouteType === 'lower-slope'
                    ? 'bg-[#131C2E] border-[#3DDC84] shadow-lg shadow-emerald-950/40 ring-1 ring-[#3DDC84]'
                    : 'bg-[#131C2E]/60 border-[#243552] hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#3DDC84]" />
                    <h3 className="font-heading font-bold text-sm text-white">Lower Slope Strategy</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-code font-bold">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
                  Avoids crater rim cliffs, minimizes spacesuit mechanical strain and keeps rollover risk at near zero.
                </p>
                <div className="flex items-center justify-between text-xs font-code text-slate-400 border-t border-[#243552] pt-2">
                  <span>Score: <b className="text-[#3DDC84]">{lsM?.safetyScore || '--'}/100</b></span>
                  <span>Max Slope: <b className="text-white">{lsM?.maxSlopeDegrees || '--'}°</b></span>
                  <span>Dist: <b className="text-white">{lsM?.distanceKm || '--'} km</b></span>
                </div>
              </div>

              {/* Shortest Option */}
              <div
                onClick={() => setSelectedRouteType('shortest')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedRouteType === 'shortest'
                    ? 'bg-[#131C2E] border-[#F5C542] shadow-lg shadow-amber-950/40 ring-1 ring-[#F5C542]'
                    : 'bg-[#131C2E]/60 border-[#243552] hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#F5C542]" />
                    <h3 className="font-heading font-bold text-sm text-white">Shortest Direct Route</h3>
                  </div>
                  <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded font-code font-bold">
                    HIGH HAZARD
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
                  Straight-line geometric corridor across rough topography. Traverses steep rim scarps.
                </p>
                <div className="flex items-center justify-between text-xs font-code text-slate-400 border-t border-[#243552] pt-2">
                  <span>Score: <b className="text-[#F5C542]">{shM?.safetyScore || '--'}/100</b></span>
                  <span>Max Slope: <b className="text-rose-400">{shM?.maxSlopeDegrees || '--'}°</b></span>
                  <span>Dist: <b className="text-white">{shM?.distanceKm || '--'} km</b></span>
                </div>
              </div>
            </div>
          </div>

          {/* Elevation Profile Comparison Chart */}
          <div className="bg-[#131C2E] p-4 rounded-xl border border-[#243552]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#4DE3F0]" />
                <h4 className="font-heading font-bold text-xs uppercase text-white">
                  DUAL ELEVATION PROFILE OVERLAY
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-code">
                Solid: Lower-Slope • Dashed: Shortest
              </span>
            </div>
            <ElevationChart
              primaryRoute={lowerSlopeRoute}
              comparisonRoute={shortestRoute}
              activeWaypointIndex={hoveredWaypointIndex ?? undefined}
              onWaypointHover={setHoveredWaypointIndex}
            />
          </div>

          {/* Detailed Metric Comparison Table */}
          <div className="bg-[#131C2E] rounded-xl border border-[#243552] overflow-hidden">
            <div className="p-3 bg-[#1B273F] border-b border-[#243552] flex items-center justify-between">
              <h4 className="font-heading font-bold text-xs uppercase text-white">
                QUANTITATIVE PERFORMANCE MATRIX
              </h4>
              <span className="text-[10px] text-slate-400 font-code">50m Cell Discretization</span>
            </div>

            <table className="w-full text-left text-xs font-code">
              <thead>
                <tr className="border-b border-[#243552] text-slate-400 text-[10px] uppercase">
                  <th className="py-2.5 px-3">Metric Dimension</th>
                  <th className="py-2.5 px-3 text-[#3DDC84]">Lower Slope</th>
                  <th className="py-2.5 px-3 text-[#F5C542]">Shortest</th>
                  <th className="py-2.5 px-3 text-slate-300">Variance / Trade-Off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243552]/70">
                <tr>
                  <td className="py-2.5 px-3 text-slate-300 font-medium">Ground Traverse Distance</td>
                  <td className="py-2.5 px-3 text-white font-bold">{lsM ? `${lsM.distanceKm} km` : '--'}</td>
                  <td className="py-2.5 px-3 text-white">{shM ? `${shM.distanceKm} km` : '--'}</td>
                  <td className="py-2.5 px-3 text-amber-400">
                    {distanceDiffM > 0 ? `+${distanceDiffM}m (+${((distanceDiffM / (shM?.distanceMeters || 1)) * 100).toFixed(0)}%)` : `${distanceDiffM}m`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300 font-medium">Estimated Walk Time (Mars 0.38g)</td>
                  <td className="py-2.5 px-3 text-white font-bold">{lsM?.formattedWalkTime || '--'}</td>
                  <td className="py-2.5 px-3 text-white">{shM?.formattedWalkTime || '--'}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {timeDiffMins >= 0 ? `+${timeDiffMins} min` : `${timeDiffMins} min`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300 font-medium">Maximum Incline Encountered</td>
                  <td className="py-2.5 px-3 text-[#3DDC84] font-bold">{lsM?.maxSlopeDegrees}°</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">{shM?.maxSlopeDegrees}°</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">
                    {lsM && shM ? `-${(shM.maxSlopeDegrees - lsM.maxSlopeDegrees).toFixed(1)}° safer` : '--'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300 font-medium">Average Gradient Slope</td>
                  <td className="py-2.5 px-3 text-white">{lsM?.avgSlopeDegrees}°</td>
                  <td className="py-2.5 px-3 text-white">{shM?.avgSlopeDegrees}°</td>
                  <td className="py-2.5 px-3 text-emerald-400">
                    {lsM && shM ? `-${(shM.avgSlopeDegrees - lsM.avgSlopeDegrees).toFixed(1)}° flatter` : '--'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300 font-medium">Cumulative Elevation Gain</td>
                  <td className="py-2.5 px-3 text-white">+{lsM?.elevationGainMeters}m</td>
                  <td className="py-2.5 px-3 text-white">+{shM?.elevationGainMeters}m</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {elevDiffM >= 0 ? `+${elevDiffM}m climb` : `${elevDiffM}m climb`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300 font-medium">Hazard Cells (&gt;15° Grade)</td>
                  <td className="py-2.5 px-3 text-[#3DDC84] font-bold">{lsM?.hazardCellCount ?? 0} cells</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">{shM?.hazardCellCount ?? 0} cells</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">
                    {lsM && shM ? `${shM.hazardCellCount - lsM.hazardCellCount} hazards eliminated` : '--'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-300 font-medium">Overall Safety Index</td>
                  <td className="py-2.5 px-3 text-[#3DDC84] font-black text-sm">{lsM?.safetyScore}/100</td>
                  <td className="py-2.5 px-3 text-rose-400 font-black text-sm">{shM?.safetyScore}/100</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">
                    +{lsM && shM ? lsM.safetyScore - shM.safetyScore : 0} pts gain
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Plain-Language Verdict Text */}
          <div className="bg-[#131C2E] p-4 rounded-xl border border-[#4DE3F0]/40">
            <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#4DE3F0] mb-2 uppercase">
              <ShieldCheck className="w-4 h-4 text-[#4DE3F0]" />
              <span>DECISION ENGINE VERDICT</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              The <strong className="text-[#3DDC84]">Lower Slope Route</strong> is strongly recommended for human EVA traversal. While the direct Shortest baseline cuts {Math.abs(distanceDiffM)}m of total walking distance, it forces astronauts to scale dangerous scarp cliffs peaking at {shM?.maxSlopeDegrees}°, well above the 15° tipping threshold for pressurized Mars space suits. The Lower Slope corridor routes safely around rim ridges, keeping maximum grade down to {lsM?.maxSlopeDegrees}° and maintaining continuous ground stability.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                if (activeChosenRoute) {
                  onPickRoute(activeChosenRoute);
                  onBackToMissionControl();
                }
              }}
              className="flex-1 py-3 px-4 rounded-lg bg-[#3DDC84] hover:bg-[#34be72] text-[#0B1220] font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>COMMIT {selectedRouteType.toUpperCase()} ROUTE</span>
            </button>

            {activeChosenRoute && (
              <button
                onClick={() => onSyncToHud(activeChosenRoute)}
                className="py-3 px-4 rounded-lg bg-[#4DE3F0] hover:bg-[#38b2bd] text-[#0B1220] font-heading text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-950 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>LOAD INTO VISOR HUD</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
