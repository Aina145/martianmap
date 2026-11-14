/**
 * RED ARES — Left Controls Panel
 * Streamlined, hackathon-ready operational console:
 * - 1-Click Mission Scenario Presets
 * - Clean Waypoint Assignment (Start & Destination)
 * - Routing Strategy Selection
 * - Layer visibility toggles & slope legend
 */

import React from 'react';
import { LayerSettings, RouteType } from '../../types/mars';
import {
  Layers,
  MapPin,
  Navigation,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowUpDown,
  Zap,
} from 'lucide-react';
import { sound } from '../../engine/sound';

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
  const isReady = startId !== null && destId !== null;

  return (
    <aside className="w-80 h-full bg-[#0D1524] border-r border-[#243552] flex flex-col overflow-y-auto select-none z-10 font-sans">
      {/* 1. Mission Presets (Instant 1-Click for Hackathon Demo) */}
      <div className="p-4 border-b border-[#243552] bg-[#111B2E]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#4DE3F0] uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>1-CLICK MISSION DEMOS</span>
          </div>
          <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
            READY
          </span>
        </div>

        <div className="space-y-2">
          {/* Preset 1 */}
          <button
            onClick={() => {
              sound.playCompute();
              onApplyPreset(1, 41, 'science-stop');
            }}
            className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer group ${
              startId === 1 && destId === 41
                ? 'bg-[#182844] border-[#4DE3F0] shadow-md shadow-cyan-950/60'
                : 'bg-[#0B1220]/70 border-[#243552] hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white group-hover:text-[#4DE3F0] transition-colors">
                Landing → Delta Front
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">TARGET ALPHA</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Traverse to ancient clay riverbed · P1 to P41
            </div>
          </button>

          {/* Preset 2 */}
          <button
            onClick={() => {
              sound.playCompute();
              onApplyPreset(1, 50, 'lower-slope');
            }}
            className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer group ${
              startId === 1 && destId === 50
                ? 'bg-[#182844] border-[#3DDC84] shadow-md shadow-emerald-950/60'
                : 'bg-[#0B1220]/70 border-[#243552] hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white group-hover:text-[#3DDC84] transition-colors">
                Full Crater Transect
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">TARGET BETA</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Safe slope route to Margin Carbonate · P1 to P50
            </div>
          </button>
        </div>
      </div>

      {/* 2. Waypoint Coordinates Assignment */}
      <div className="p-4 border-b border-[#243552]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#4DE3F0]" />
            <span>WAYPOINTS ASSIGNMENT</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">50 Real Points</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Start Point */}
          <div className="bg-[#0B1220] p-2 rounded-lg border border-[#243552] text-xs">
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#3DDC84] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#3DDC84] inline-block animate-ping"></span>
              <span>START (A)</span>
            </div>
            <div className="font-mono font-bold text-white text-sm">
              {startId ? `POINT P${startId}` : 'Not Set'}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {startId === 1 ? 'Octavia Butler Site' : `Point #${startId || '--'}`}
            </div>
          </div>

          {/* Destination Point */}
          <div className="bg-[#0B1220] p-2 rounded-lg border border-[#243552] text-xs">
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#E5484D] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#E5484D] inline-block"></span>
              <span>DEST (B)</span>
            </div>
            <div className="font-mono font-bold text-white text-sm">
              {destId ? `POINT P${destId}` : 'Not Set'}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {destId === 50 ? 'Margin Carbonate' : destId === 41 ? 'Delta Front' : `Point #${destId || '--'}`}
            </div>
          </div>
        </div>

        <div className="mt-2 text-[10px] font-mono text-slate-400 text-center bg-[#0B1220]/60 py-1 rounded border border-[#243552]/60">
          💡 Click any node on the map to place Start or Dest
        </div>
      </div>

      {/* 3. Routing Strategy Selector */}
      <div className="p-4 border-b border-[#243552]">
        <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>ROUTING CRITERIA</span>
          <span className="text-[10px] text-[#4DE3F0] font-mono">NASA Spec</span>
        </div>

        <div className="space-y-2">
          {/* Lower Slope (Recommended) */}
          <button
            onClick={() => {
              sound.playClick();
              onChangeRouteType('lower-slope');
            }}
            className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
              routeType === 'lower-slope'
                ? 'bg-[#0F231D] border-[#3DDC84] shadow-md shadow-emerald-950/60'
                : 'bg-[#0B1220]/60 border-[#243552] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    routeType === 'lower-slope' ? 'border-[#3DDC84]' : 'border-slate-500'
                  }`}
                >
                  {routeType === 'lower-slope' && <div className="w-2 h-2 rounded-full bg-[#3DDC84]" />}
                </div>
                <span className="font-bold text-xs text-white">Lower Slope Corridor</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-[#3DDC84]/20 text-[#3DDC84] px-1.5 py-0.5 rounded border border-[#3DDC84]/40">
                RECOMMENDED
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 pl-5 leading-snug">
              Minimizes spacesuit strain, strictly avoids &gt;15° rollover zones.
            </p>
          </button>

          {/* Shortest Route */}
          <button
            onClick={() => {
              sound.playClick();
              onChangeRouteType('shortest');
            }}
            className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
              routeType === 'shortest'
                ? 'bg-[#2B2313] border-[#F5C542] shadow-md shadow-amber-950/60'
                : 'bg-[#0B1220]/60 border-[#243552] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    routeType === 'shortest' ? 'border-[#F5C542]' : 'border-slate-500'
                  }`}
                >
                  {routeType === 'shortest' && <div className="w-2 h-2 rounded-full bg-[#F5C542]" />}
                </div>
                <span className="font-bold text-xs text-white">Direct Shortest Route</span>
              </div>
              <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                HIGH RISK
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 pl-5 leading-snug">
              Direct geometric line. Traverses steeper slopes for faster transit.
            </p>
          </button>

          {/* Science Stop */}
          <button
            onClick={() => {
              sound.playClick();
              onChangeRouteType('science-stop');
            }}
            className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
              routeType === 'science-stop'
                ? 'bg-[#102331] border-[#4DE3F0] shadow-md shadow-cyan-950/60'
                : 'bg-[#0B1220]/60 border-[#243552] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    routeType === 'science-stop' ? 'border-[#4DE3F0]' : 'border-slate-500'
                  }`}
                >
                  {routeType === 'science-stop' && <div className="w-2 h-2 rounded-full bg-[#4DE3F0]" />}
                </div>
                <span className="font-bold text-xs text-white">Science Stop Corridor</span>
              </div>
              <span className="text-[9px] font-mono text-[#4DE3F0] bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                15 POIS
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 pl-5 leading-snug">
              Prioritizes clay smectites and carbonate minerals for sample collection.
            </p>
          </button>
        </div>

        {/* Algorithm solver toggle */}
        <div className="mt-3 pt-2.5 border-t border-[#243552]/70 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 text-[11px]">SOLVER:</span>
          <div className="flex gap-1 bg-[#0B1220] p-0.5 rounded border border-[#243552]">
            <button
              onClick={() => {
                sound.playClick();
                onChangeAlgorithm('A*');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                algorithm === 'A*' ? 'bg-[#4DE3F0] text-[#0B1220]' : 'text-slate-400 hover:text-white'
              }`}
            >
              A* Heuristic
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onChangeAlgorithm('Dijkstra');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                algorithm === 'Dijkstra' ? 'bg-[#4DE3F0] text-[#0B1220]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dijkstra
            </button>
          </div>
        </div>
      </div>

      {/* 4. Quick Layer Filters */}
      <div className="p-4 border-b border-[#243552]">
        <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#4DE3F0]" />
            <span>MAP LAYERS</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
          <button
            onClick={() => {
              sound.playClick();
              onToggleLayer('terrain');
            }}
            className={`p-1.5 rounded border text-left flex items-center justify-between cursor-pointer transition-colors ${
              layers.terrain ? 'bg-[#182844] border-[#4DE3F0]/60 text-white' : 'bg-[#0B1220] border-[#243552] text-slate-500'
            }`}
          >
            <span>50 Nodes</span>
            <span className={layers.terrain ? 'text-[#4DE3F0]' : 'text-slate-600'}>●</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleLayer('danger');
            }}
            className={`p-1.5 rounded border text-left flex items-center justify-between cursor-pointer transition-colors ${
              layers.danger ? 'bg-[#2A1820] border-rose-500/60 text-white' : 'bg-[#0B1220] border-[#243552] text-slate-500'
            }`}
          >
            <span>&gt;15° Hazards</span>
            <span className={layers.danger ? 'text-rose-400' : 'text-slate-600'}>▲</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleLayer('science');
            }}
            className={`p-1.5 rounded border text-left flex items-center justify-between cursor-pointer transition-colors ${
              layers.science ? 'bg-[#102331] border-cyan-500/60 text-white' : 'bg-[#0B1220] border-[#243552] text-slate-500'
            }`}
          >
            <span>Science POIs</span>
            <span className={layers.science ? 'text-cyan-400' : 'text-slate-600'}>✦</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleLayer('route');
            }}
            className={`p-1.5 rounded border text-left flex items-center justify-between cursor-pointer transition-colors ${
              layers.route ? 'bg-[#182844] border-slate-500 text-white' : 'bg-[#0B1220] border-[#243552] text-slate-500'
            }`}
          >
            <span>Corridor Mesh</span>
            <span className={layers.route ? 'text-slate-300' : 'text-slate-600'}>—</span>
          </button>
        </div>
      </div>

      {/* 5. Calculate Route CTA Button */}
      <div className="p-4 mt-auto bg-[#0B1220] border-t border-[#243552]">
        <button
          onClick={() => {
            sound.playCompute();
            onCalculateRoute();
          }}
          disabled={!isReady || isCalculating}
          className={`w-full py-3 px-4 rounded-xl font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
            isReady && !isCalculating
              ? 'bg-gradient-to-r from-[#4DE3F0] to-[#38b2bd] text-[#0B1220] shadow-cyan-950/80 hover:brightness-110 active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          {isCalculating ? (
            <>
              <span className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
              <span>SOLVING SAFE TRAVERSE...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              <span>CALCULATE ROUTE</span>
            </>
          )}
        </button>

        <div className="text-[10px] text-slate-400 text-center font-mono mt-2">
          Jezero Crater Operational Model • Real 50 Points
        </div>
      </div>
    </aside>
  );
};
