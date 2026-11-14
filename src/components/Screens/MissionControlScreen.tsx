/**
 * RED ARES — Mission Control Screen
 * Primary operational workbench integrating LeftControls, MarsMap, RightInspector, and BottomBar.
 * Routes over Natasha's 50 REAL terrain points. C(t) = (C_terrain × μ) + W_science.
 */

import React, { useState } from 'react';
import { RouteResult, RouteType, LayerSettings } from '../../types/mars';
import { TerrainGraph } from '../../data/terrain';
import { findPath } from '../../engine/routeEngine';
import { MarsMap } from '../Map/MarsMap';
import { LeftControls } from '../Panels/LeftControls';
import { RightInspector } from '../Panels/RightInspector';
import { BottomBar } from '../Panels/BottomBar';
import {
  Compass,
  GitCompare,
  Eye,
  FileText,
  Home,
  CheckCircle,
  AlertCircle,
  Globe,
} from 'lucide-react';

interface MissionControlScreenProps {
  graph: TerrainGraph;
  startId: number | null;
  destId: number | null;
  onSetStart: (id: number | null) => void;
  onSetDest: (id: number | null) => void;
  lowerSlopeRoute: RouteResult | null;
  shortestRoute: RouteResult | null;
  scienceRoute: RouteResult | null;
  activeRoute: RouteResult | null;
  onSetRoutes: (lower: RouteResult | null, shortest: RouteResult | null, science: RouteResult | null) => void;
  onSelectActiveRoute: (route: RouteResult | null) => void;
  onOpenLanding: () => void;
  onOpenCompare: () => void;
  onOpenHud: () => void;
  onOpenAbout: () => void;
  onOpenGlobe: () => void;
}

export const MissionControlScreen: React.FC<MissionControlScreenProps> = ({
  graph,
  startId,
  destId,
  onSetStart,
  onSetDest,
  lowerSlopeRoute,
  shortestRoute,
  scienceRoute,
  activeRoute,
  onSetRoutes,
  onSelectActiveRoute,
  onOpenLanding,
  onOpenCompare,
  onOpenHud,
  onOpenAbout,
  onOpenGlobe,
}) => {
  // Layers state
  const [layers, setLayers] = useState<LayerSettings>({
    terrain: true,
    science: true,
    danger: true,
    route: true,
  });

  // Routing state
  const [routeType, setRouteType] = useState<RouteType>('lower-slope');
  const [algorithm, setAlgorithm] = useState<'A*' | 'Dijkstra'>('A*');
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map interaction state
  const [settingMode, setSettingMode] = useState<'start' | 'dest' | 'inspect' | 'measure'>('start');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleToggleLayer = (layer: keyof LayerSettings) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const computeAll = (s: number, d: number, algo: 'A*' | 'Dijkstra') => {
    const lowerRes = findPath(s, d, graph, { routeType: 'lower-slope', algorithm: algo });
    const shortestRes = findPath(s, d, graph, { routeType: 'shortest', algorithm: algo });
    const scienceRes = findPath(s, d, graph, { routeType: 'science-stop', algorithm: algo });
    return { lowerRes, shortestRes, scienceRes };
  };

  // Perform route calculation for selected A & B
  const handleCalculateRoute = () => {
    if (!startId || !destId) return;

    setIsCalculating(true);
    setErrorMessage(null);

    setTimeout(() => {
      try {
        const { lowerRes, shortestRes, scienceRes } = computeAll(startId, destId, algorithm);

        if (!lowerRes && !shortestRes && !scienceRes) {
          setErrorMessage(
            'NO PASSABLE CORRIDOR: destination is isolated — every approach crosses >15° blocked nodes (Natasha hard constraint).'
          );
          setIsCalculating(false);
          return;
        }

        onSetRoutes(lowerRes, shortestRes, scienceRes);

        if (routeType === 'lower-slope') onSelectActiveRoute(lowerRes);
        else if (routeType === 'shortest') onSelectActiveRoute(shortestRes);
        else onSelectActiveRoute(scienceRes);
      } catch (err: unknown) {
        setErrorMessage(`Routing engine error: ${err instanceof Error ? err.message : 'Calculation aborted'}`);
      } finally {
        setIsCalculating(false);
      }
    }, 40);
  };

  // Change route criteria
  const handleChangeRouteType = (type: RouteType) => {
    setRouteType(type);
    if (type === 'lower-slope' && lowerSlopeRoute) onSelectActiveRoute(lowerSlopeRoute);
    else if (type === 'shortest' && shortestRoute) onSelectActiveRoute(shortestRoute);
    else if (type === 'science-stop' && scienceRoute) onSelectActiveRoute(scienceRoute);
  };

  // Preset Mission Application (real point IDs)
  const handleApplyPreset = (s: number, d: number, type: RouteType) => {
    onSetStart(s);
    onSetDest(d);
    setRouteType(type);
    setSelectedId(s);
    setSettingMode('inspect');
    setTimeout(() => {
      const { lowerRes, shortestRes, scienceRes } = computeAll(s, d, 'A*');
      onSetRoutes(lowerRes, shortestRes, scienceRes);
      onSelectActiveRoute(lowerRes);
    }, 50);
  };

  return (
    <div className="h-full flex flex-col bg-[#0B1220] text-[#E6EDF3] select-none">
      {/* Top Application Header */}
      <header className="h-14 bg-[#131C2E] border-b border-[#243552] px-4 flex items-center justify-between z-20">
        {/* Left: Branding & Region */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLanding}
            title="Return to Mission Brief"
            className="flex items-center gap-2 text-white hover:text-[#4DE3F0] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#C1440E] to-[#E5484D] flex items-center justify-center font-heading font-black text-xs text-white shadow-md">
              ♂
            </div>
            <span className="font-heading font-bold text-sm tracking-wider hidden sm:inline">
              RED ARES
            </span>
          </button>

          <div className="h-4 w-px bg-slate-700 hidden sm:inline" />

          <div className="text-[11px] font-subheading text-slate-300 hidden md:flex items-center gap-1.5">
            <span className="text-[#4DE3F0] font-bold">JEZERO CRATER</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">50 REAL PTS</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-code text-[10px] bg-emerald-950/40 px-1.5 rounded border border-emerald-800/40">
              REAL DATA
            </span>
          </div>
        </div>

        {/* Center: Screen Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#0B1220] p-1 rounded-lg border border-[#243552]">
          <button
            className="px-3 py-1 rounded text-xs font-mono font-bold bg-[#1E293B] text-[#4DE3F0] border border-[#4DE3F0]/40 shadow-sm"
          >
            MISSION MAP
          </button>
          <button
            onClick={onOpenCompare}
            className="px-3 py-1 rounded text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center gap-1"
          >
            <GitCompare className="w-3.5 h-3.5 text-[#F5C542]" />
            <span>COMPARE ROUTES</span>
          </button>
          <button
            onClick={onOpenHud}
            className="px-3 py-1 rounded text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 text-[#4DE3F0]" />
            <span>ASTRONAUT HUD</span>
          </button>
          <button
            onClick={onOpenGlobe}
            className="px-3 py-1 rounded text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 text-rose-400" />
            <span>3D MARS GLOBE</span>
          </button>
          <button
            onClick={onOpenAbout}
            className="px-2.5 py-1 rounded text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer hidden lg:flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>DATA & RULES</span>
          </button>
        </nav>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-2">
          {activeRoute && (
            <button
              onClick={onOpenHud}
              className="px-3 py-1 rounded-md bg-[#4DE3F0] hover:bg-[#38b2bd] text-[#0B1220] text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1 shadow-md shadow-cyan-950/80 cursor-pointer transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>SYNC HUD</span>
            </button>
          )}
        </div>
      </header>

      {/* Error Notification Banner if No Path Found */}
      {errorMessage && (
        <div className="bg-rose-950/90 border-b border-rose-800 px-4 py-2 text-xs text-rose-200 flex items-center justify-between z-20">
          <div className="flex items-center gap-2 font-code">
            <AlertCircle className="w-4 h-4 text-[#E5484D] shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Center 3-Column Workbench */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Layers, Routing Mode, Legend, Solve CTA */}
        <LeftControls
          layers={layers}
          onToggleLayer={handleToggleLayer}
          routeType={routeType}
          onChangeRouteType={handleChangeRouteType}
          algorithm={algorithm}
          onChangeAlgorithm={setAlgorithm}
          startId={startId}
          destId={destId}
          onCalculateRoute={handleCalculateRoute}
          isCalculating={isCalculating}
          onApplyPreset={handleApplyPreset}
        />

        {/* Center: Leaflet MarsMap Canvas */}
        <main className="flex-1 h-full relative">
          <MarsMap
            graph={graph}
            layers={layers}
            startId={startId}
            destId={destId}
            onSetStart={(id) => {
              onSetStart(id);
              setSettingMode('dest');
            }}
            onSetDest={(id) => {
              onSetDest(id);
              setSettingMode('inspect');
            }}
            selectedId={selectedId}
            onSelectNode={(id) => setSelectedId(id)}
            onHoverNode={(id) => setHoveredId(id)}
            primaryRoute={activeRoute}
            comparisonRoute={routeType === 'lower-slope' ? shortestRoute : null}
            settingMode={settingMode}
            onSetSettingMode={setSettingMode}
          />
        </main>

        {/* Right Panel: Data Inspector & Route Analysis */}
        <RightInspector
          selectedId={selectedId}
          activeRoute={activeRoute}
          graph={graph}
          onOpenHud={onOpenHud}
        />
      </div>

      {/* Bottom Bar: CRS, Coordinates, Projection, Data Credits */}
      <BottomBar hoveredId={hoveredId} />
    </div>
  );
};
