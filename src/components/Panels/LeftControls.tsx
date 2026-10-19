/**
 * RED ARES — Left Controls Panel
 * Region selector, layer toggles, route mode radio, legend, calculate button.
 */

import React from 'react';
import { LayerSettings, RouteType } from '../../types/mars';
import {
  Layers,
  MapPin,
  Mountain,
  Navigation,
  ShieldAlert,
  Sparkles,
  Info,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';

interface LeftControlsProps {
  layers: LayerSettings;
  onToggleLayer: (layer: keyof LayerSettings) => void;
  routeType: RouteType;
  onChangeRouteType: (type: RouteType) => void;
  algorithm: 'A*' | 'Dijkstra';
  onChangeAlgorithm: (algo: 'A*' | 'Dijkstra') => void;
  startId: number | null;
  destId: number | null;
  onCalculateRoute: () => void;
  isCalculating: boolean;
  onApplyPreset: (startId: number, destId: number, type: RouteType) => void;
}

export const LeftControls: React.FC<LeftControlsProps> = ({
  layers,
  onToggleLayer,
  routeType,
  onChangeRouteType,
  algorithm,
  onChangeAlgorithm,
  startId,
  destId,
  onCalculateRoute,
  isCalculating,
  onApplyPreset,
}) => {
  const isReadyToCalculate = startId !== null && destId !== null;

  return (
    <aside className="w-80 h-full bg-[#131C2E] border-r border-[#243552] flex flex-col overflow-y-auto z-10 select-none">
      {/* Region Selector */}
      <div className="p-3.5 border-b border-[#243552]">
        <div className="text-[10px] tracking-wider text-[#4DE3F0] font-heading font-semibold uppercase mb-1 flex items-center justify-between">
          <span>OPERATIONAL THEATRE</span>
          <span className="text-[9px] bg-[#1E293B] text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
            ONLINE
          </span>
        </div>
        <div className="relative">
          <select
            className="w-full bg-[#0B1220] border border-[#243552] text-white text-xs rounded-md px-2.5 py-2 font-subheading tracking-wide focus:outline-none focus:border-[#4DE3F0]"
            defaultValue="jezero"
          >
            <option value="jezero">Jezero Crater (Active AOI — 100 km²)</option>
            <option value="gale" disabled>
              Gale Crater (Locked — Phase 2)
            </option>
            <option value="valles" disabled>
              Valles Marineris (Locked — Phase 3)
            </option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-code">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC84]"></span>
          <span>18.42° N, 77.45° E • Elev: -2580m</span>
        </div>
      </div>

      {/* Layer Toggles */}
      <div className="p-3.5 border-b border-[#243552]">
        <div className="text-[10px] tracking-wider text-slate-400 font-heading font-semibold uppercase mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#4DE3F0]" />
          <span>CARTOGRAPHIC LAYERS</span>
        </div>

        <div className="space-y-1.5">
          {/* Hillshade */}
          <label className="flex items-center justify-between p-2 rounded bg-[#0B1220]/60 hover:bg-[#0B1220] border border-[#243552]/70 cursor-pointer transition-colors text-xs">
            <div className="flex items-center gap-2">
              <Mountain className="w-3.5 h-3.5 text-[#C1440E]" />
              <div>
                <div className="text-slate-200">Terrain Nodes (50)</div>
                <div className="text-[9px] text-slate-500 font-code">real CSV points</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={layers.terrain}
              onChange={() => onToggleLayer('terrain')}
              className="accent-[#4DE3F0] w-3.5 h-3.5 rounded"
            />
          </label>

          {/* Slope Hazard Overlay */}
          <label className="flex items-center justify-between p-2 rounded bg-[#0B1220]/60 hover:bg-[#0B1220] border border-[#243552]/70 cursor-pointer transition-colors text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#E5484D]" />
              <div>
                <div className="text-slate-200">Blocked Zones (&gt;15°)</div>
                <div className="text-[9px] text-slate-500 font-code">hard constraint</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={layers.danger}
              onChange={() => onToggleLayer('danger')}
              className="accent-[#E5484D] w-3.5 h-3.5 rounded"
            />
          </label>

          {/* Rocks */}
          <label className="flex items-center justify-between p-2 rounded bg-[#0B1220]/60 hover:bg-[#0B1220] border border-[#243552]/70 cursor-pointer transition-colors text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-slate-600 flex items-center justify-center text-[9px] text-slate-300">
                ■
              </span>
              <div>
                <span className="text-slate-200">Graph Edges</span>
                <div className="text-[9px] text-slate-500 font-code">corridor mesh</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={layers.route}
              onChange={() => onToggleLayer('route')}
              className="accent-[#4DE3F0] w-3.5 h-3.5 rounded"
            />
          </label>

          {/* POIs */}
          <label className="flex items-center justify-between p-2 rounded bg-[#0B1220]/60 hover:bg-[#0B1220] border border-[#243552]/70 cursor-pointer transition-colors text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#4DE3F0]" />
              <span className="text-slate-200">Science Targets (15)</span>
            </div>
            <input
              type="checkbox"
              checked={layers.science}
              onChange={() => onToggleLayer('science')}
              className="accent-[#4DE3F0] w-3.5 h-3.5 rounded"
            />
          </label>
        </div>
      </div>

      {/* Slope Classification Legend */}
      <div className="p-3.5 border-b border-[#243552] bg-[#0B1220]/40">
        <div className="text-[10px] tracking-wider text-slate-400 font-heading font-semibold uppercase mb-2">
          SLOPE HAZARD RULES & LEGEND
        </div>
        <div className="space-y-1.5 text-xs font-code">
          <div className="flex items-center justify-between p-1.5 rounded bg-[#131C2E] border border-emerald-900/40">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#3DDC84] inline-block shadow-sm shadow-emerald-500/50" />
              <span className="text-emerald-300 font-medium">Nominal</span>
            </div>
            <span className="text-[11px] text-slate-400">0–5° · C=1.0</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-[#131C2E] border border-amber-900/40 caution-hatch">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#F5C542] inline-block" />
              <span className="text-amber-300 font-medium">Strain</span>
            </div>
            <span className="text-[11px] text-slate-300">5.1–12° · C=2.5</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-[#131C2E] border border-rose-900/40 hazard-hatch">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#E5484D] inline-block" />
              <span className="text-orange-300 font-medium">Risk</span>
            </div>
            <span className="text-[11px] text-slate-300">12.1–15° · C=5.0</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-[#131C2E] border border-rose-900/40 hazard-hatch">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#E5484D] inline-block" />
              <span className="text-rose-300 font-medium">Blocked</span>
            </div>
            <span className="text-[11px] text-slate-300">&gt; 15° · C=99999</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-[#131C2E] border border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#1E293B] border border-slate-500 inline-block" />
              <span className="text-slate-400">Soil friction μ</span>
            </div>
            <span className="text-[10px] text-slate-300">1.0 / 1.4 / 3.0</span>
          </div>
        </div>
      </div>

      {/* Route Type Radio */}
      <div className="p-3.5 border-b border-[#243552]">
        <div className="text-[10px] tracking-wider text-slate-400 font-heading font-semibold uppercase mb-2 flex items-center justify-between">
          <span>ROUTING CRITERIA</span>
          <span className="text-[9px] text-[#4DE3F0] font-code">Rule-based</span>
        </div>

        <div className="space-y-2">
          {/* Lower Slope (Default) */}
          <div
            onClick={() => onChangeRouteType('lower-slope')}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
              routeType === 'lower-slope'
                ? 'bg-[#0B1220] border-[#3DDC84] shadow-sm shadow-emerald-950'
                : 'bg-[#0B1220]/40 border-[#243552] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    routeType === 'lower-slope' ? 'border-[#3DDC84]' : 'border-slate-500'
                  }`}
                >
                  {routeType === 'lower-slope' && (
                    <div className="w-2 h-2 rounded-full bg-[#3DDC84]" />
                  )}
                </div>
                <span className="text-xs font-semibold text-white">Lower Slope</span>
              </div>
              <span className="text-[9px] bg-emerald-950/70 text-emerald-400 px-1.5 py-0.5 rounded font-code border border-emerald-800">
                RECOMMENDED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-5 leading-tight">
              Minimizes Σ C(t)=(C_terrain×μ)+W over real nodes. Hard-avoids &gt;15° blocked zones.
            </p>
          </div>

          {/* Shortest */}
          <div
            onClick={() => onChangeRouteType('shortest')}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
              routeType === 'shortest'
                ? 'bg-[#0B1220] border-[#F5C542] shadow-sm shadow-amber-950'
                : 'bg-[#0B1220]/40 border-[#243552] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    routeType === 'shortest' ? 'border-[#F5C542]' : 'border-slate-500'
                  }`}
                >
                  {routeType === 'shortest' && (
                    <div className="w-2 h-2 rounded-full bg-[#F5C542]" />
                  )}
                </div>
                <span className="text-xs font-semibold text-white">Shortest Route</span>
              </div>
              <span className="text-[9px] text-slate-400 font-code">BASELINE</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-5 leading-tight">
              Direct Euclidean distance minimization only. Ignores slope penalties.
            </p>
          </div>

          {/* Science Stop */}
          <div
            onClick={() => onChangeRouteType('science-stop')}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
              routeType === 'science-stop'
                ? 'bg-[#0B1220] border-[#4DE3F0] shadow-sm shadow-cyan-950'
                : 'bg-[#0B1220]/40 border-[#243552] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    routeType === 'science-stop' ? 'border-[#4DE3F0]' : 'border-slate-500'
                  }`}
                >
                  {routeType === 'science-stop' && (
                    <div className="w-2 h-2 rounded-full bg-[#4DE3F0]" />
                  )}
                </div>
                <span className="text-xs font-semibold text-white">Science Stop Corridor</span>
              </div>
              <span className="text-[9px] text-cyan-400 font-code">MULTI-GOAL</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-5 leading-tight">
              Applies negative cost bonus to route along team-selected science POIs.
            </p>
          </div>
        </div>

        {/* Algorithm Solver Toggle */}
        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-[#243552]/60">
          <span className="text-slate-400 font-code text-[11px]">SOLVER ENGINE:</span>
          <div className="flex gap-1 bg-[#0B1220] p-0.5 rounded border border-[#243552]">
            <button
              onClick={() => onChangeAlgorithm('A*')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                algorithm === 'A*'
                  ? 'bg-[#4DE3F0] text-[#0B1220] font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              A* (Heuristic)
            </button>
            <button
              onClick={() => onChangeAlgorithm('Dijkstra')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                algorithm === 'Dijkstra'
                  ? 'bg-[#4DE3F0] text-[#0B1220] font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dijkstra
            </button>
          </div>
        </div>
      </div>

      {/* Preset Missions */}
      <div className="p-3.5 border-b border-[#243552]">
        <div className="text-[10px] tracking-wider text-slate-400 font-heading font-semibold uppercase mb-2">
          MISSION SCENARIO PRESETS
        </div>
        <div className="space-y-1.5">
          <button
            onClick={() => onApplyPreset(1, 41, 'science-stop')}
            className="w-full text-left p-2 rounded bg-[#0B1220]/60 hover:bg-[#0B1220] border border-[#243552] text-xs transition-colors group"
          >
            <div className="font-semibold text-slate-200 group-hover:text-[#4DE3F0]">
              Landing → Delta Front (Target ALPHA)
            </div>
            <div className="text-[10px] text-slate-400 font-code">
              P1 Octavia Butler → P41 Delta Front
            </div>
          </button>

          <button
            onClick={() => onApplyPreset(1, 50, 'lower-slope')}
            className="w-full text-left p-2 rounded bg-[#0B1220]/60 hover:bg-[#0B1220] border border-[#243552] text-xs transition-colors group"
          >
            <div className="font-semibold text-slate-200 group-hover:text-[#4DE3F0]">
              Full Transect (Target BETA)
            </div>
            <div className="text-[10px] text-slate-400 font-code">
              P1 Landing → P50 Margin Carbonate
            </div>
          </button>
        </div>
      </div>

      {/* Action CTA & Instructions */}
      <div className="p-3.5 mt-auto bg-[#0B1220]">
        <div className="bg-[#131C2E] p-2.5 rounded-lg border border-[#243552] mb-3">
          <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Info className="w-3.5 h-3.5 text-[#4DE3F0]" />
            <span>WAYPOINT ASSIGNMENT</span>
          </div>
          <div className="space-y-1 text-[11px] font-code">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#3DDC84]"></span>
                <span>START (A):</span>
              </span>
              <span className={startId ? 'text-white' : 'text-slate-600'}>
                {startId ? `P${startId} — node` : 'Click Map to Set'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E5484D]"></span>
                <span>DESTINATION (B):</span>
              </span>
              <span className={destId ? 'text-white' : 'text-slate-600'}>
                {destId ? `P${destId} — node` : 'Click Map to Set'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onCalculateRoute}
          disabled={!isReadyToCalculate || isCalculating}
          className={`w-full py-2.5 px-3 rounded-lg font-heading text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
            isReadyToCalculate
              ? 'bg-[#4DE3F0] hover:bg-[#38b2bd] text-[#0B1220] shadow-cyan-950/80 cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          {isCalculating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
              <span>SOLVING CORRIDOR...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              <span>CALCULATE ROUTE</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-500 text-center mt-2 leading-tight">
          Click map: set Start (A), then Destination (B).
        </p>
      </div>
    </aside>
  );
};
