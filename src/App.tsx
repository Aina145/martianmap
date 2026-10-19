/**
 * RED ARES — Martian Map
 * NASA Space Apps 2026: "Interplanetary Survival Guide: Martian Map"
 * Main Application Orchestrator & State Container
 *
 * Data: Natasha's 50 REAL terrain points (jezero_terrain_matrix.csv).
 * Routing: graph A-star/Dijkstra with C(t) = (C_terrain x mu) + W_science.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { buildGraph } from './data/terrain';
import { RouteResult } from './types/mars';
import { findPath } from './engine/routeEngine';

import { LandingScreen } from './components/Screens/LandingScreen';
import { MissionControlScreen } from './components/Screens/MissionControlScreen';
import { CompareRoutesScreen } from './components/Screens/CompareRoutesScreen';
import { AstronautHudScreen } from './components/Screens/AstronautHudScreen';
import { DataAboutScreen } from './components/Screens/DataAboutScreen';

export default function App() {
  // Screen Router State
  const [activeScreen, setActiveScreen] = useState<
    'landing' | 'mission-control' | 'compare' | 'hud' | 'about'
  >('landing');

  // Real terrain graph: 50 nodes, 4 blocked (>15°) excluded
  const graph = useMemo(() => buildGraph(), []);

  // Waypoints A & B: terrain point IDs. Default: P1 (landing) → P50 (Margin Carbonate)
  const [startId, setStartId] = useState<number | null>(1);
  const [destId, setDestId] = useState<number | null>(50);

  // Computed Routes State
  const [lowerSlopeRoute, setLowerSlopeRoute] = useState<RouteResult | null>(null);
  const [shortestRoute, setShortestRoute] = useState<RouteResult | null>(null);
  const [scienceRoute, setScienceRoute] = useState<RouteResult | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);

  // Initial Route Bootstrap on Mount
  useEffect(() => {
    if (startId && destId && !lowerSlopeRoute) {
      const lower = findPath(startId, destId, graph, { routeType: 'lower-slope', algorithm: 'A*' });
      const shortest = findPath(startId, destId, graph, { routeType: 'shortest', algorithm: 'A*' });
      const science = findPath(startId, destId, graph, { routeType: 'science-stop', algorithm: 'A*' });

      setLowerSlopeRoute(lower);
      setShortestRoute(shortest);
      setScienceRoute(science);
      setActiveRoute(lower);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  const handleSetRoutes = (
    lower: RouteResult | null,
    shortest: RouteResult | null,
    science: RouteResult | null
  ) => {
    setLowerSlopeRoute(lower);
    setShortestRoute(shortest);
    setScienceRoute(science);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0B1220] text-[#E6EDF3]">
      {activeScreen === 'landing' && (
        <LandingScreen
          onStartPlanning={() => setActiveScreen('mission-control')}
          onOpenAbout={() => setActiveScreen('about')}
        />
      )}

      {activeScreen === 'mission-control' && (
        <MissionControlScreen
          graph={graph}
          startId={startId}
          destId={destId}
          onSetStart={setStartId}
          onSetDest={setDestId}
          lowerSlopeRoute={lowerSlopeRoute}
          shortestRoute={shortestRoute}
          scienceRoute={scienceRoute}
          activeRoute={activeRoute}
          onSetRoutes={handleSetRoutes}
          onSelectActiveRoute={setActiveRoute}
          onOpenLanding={() => setActiveScreen('landing')}
          onOpenCompare={() => setActiveScreen('compare')}
          onOpenHud={() => setActiveScreen('hud')}
          onOpenAbout={() => setActiveScreen('about')}
        />
      )}

      {activeScreen === 'compare' && (
        <CompareRoutesScreen
          graph={graph}
          lowerSlopeRoute={lowerSlopeRoute}
          shortestRoute={shortestRoute}
          scienceRoute={scienceRoute}
          onBackToMissionControl={() => setActiveScreen('mission-control')}
          onPickRoute={(route) => setActiveRoute(route)}
          onSyncToHud={(route) => {
            setActiveRoute(route);
            setActiveScreen('hud');
          }}
        />
      )}

      {activeScreen === 'hud' && (
        <AstronautHudScreen
          route={activeRoute || lowerSlopeRoute}
          onBackToMissionControl={() => setActiveScreen('mission-control')}
        />
      )}

      {activeScreen === 'about' && (
        <DataAboutScreen onBack={() => setActiveScreen('mission-control')} />
      )}
    </div>
  );
}
