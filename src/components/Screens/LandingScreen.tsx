/**
 * RED ARES — Landing Screen
 * Mission brief, Jezero Crater operational theatre selection, and launch CTA.
 */

import React from 'react';
import {
  Compass,
  MapPin,
  Mountain,
  ShieldAlert,
  ArrowRight,
  Eye,
  Activity,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface LandingScreenProps {
  onStartPlanning: () => void;
  onOpenAbout: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onStartPlanning,
  onOpenAbout,
}) => {
  return (
    <div className="min-h-full flex flex-col bg-[#0B1220] text-[#E6EDF3] relative overflow-hidden">
      {/* Background radial gradient glow & grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(193,68,14,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#24355208_1px,transparent_1px),linear-gradient(to_bottom,#24355208_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-[#243552] px-6 flex items-center justify-between z-10 bg-[#0B1220]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C1440E] to-[#E5484D] flex items-center justify-center font-heading font-black text-white text-lg shadow-lg shadow-orange-950/60 border border-orange-400/30">
            ♂
          </div>
          <div>
            <div className="font-heading font-bold text-sm tracking-wider text-white flex items-center gap-2">
              <span>RED ARES</span>
              <span className="text-[10px] bg-[#1E293B] text-[#4DE3F0] px-2 py-0.5 rounded font-code border border-[#243552]">
                MARTIAN MAP v2.6
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-subheading tracking-wide">
              NASA Space Apps 2026 • Interplanetary Survival Guide
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAbout}
            className="px-3 py-1.5 rounded-lg border border-[#243552] hover:border-slate-500 text-slate-300 hover:text-white text-xs font-subheading tracking-wide transition-colors cursor-pointer"
          >
            Data & Rules
          </button>
          <button
            onClick={onStartPlanning}
            className="px-4 py-1.5 rounded-lg bg-[#4DE3F0] hover:bg-[#38b2bd] text-[#0B1220] font-heading text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950/60 cursor-pointer"
          >
            <span>Start Planning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col justify-center z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131C2E] border border-[#243552] text-xs font-code text-[#4DE3F0] mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#3DDC84] animate-ping" />
            <span>TERRAIN-AWARE PLANETARY EXPLORATION SOLVER</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-white mb-4 leading-tight">
            Navigate the Red Planet with <span className="text-[#4DE3F0] glow-cyan">Slope Intelligence</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-sans font-normal leading-relaxed max-w-2xl mx-auto mb-6">
            Autonomous Mars surface routing for Jezero Crater. Evaluates slope steepness, avoids high-risk crater scarps, detects sensor data voids, and synchronizes waypoints directly to an astronaut helmet HUD.
          </p>

          {/* Mandatory Prototype Safety Banner */}
          <div className="inline-block bg-[#131C2E] border border-amber-500/40 px-4 py-2 rounded-lg text-xs font-code text-amber-300 mb-6 shadow-md">
            ⚠ Terrain-aware planning prototype. Not a certified safety system.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onStartPlanning}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#4DE3F0] to-[#38b2bd] text-[#0B1220] font-heading text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-transform hover:scale-105 shadow-xl shadow-cyan-950 cursor-pointer"
            >
              <span>Launch Mission Control</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenAbout}
              className="px-5 py-3 rounded-lg bg-[#131C2E] hover:bg-[#1E293B] border border-[#243552] text-slate-200 font-subheading text-sm font-semibold tracking-wide flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Explore Topographic Model</span>
            </button>
          </div>
        </div>

        {/* Region Cards (Jezero Crater Active, Others Locked) */}
        <div className="mb-10">
          <div className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>OPERATIONAL SECTORS (MARS)</span>
            <span className="text-[11px] font-code text-[#4DE3F0]">1 REGION ONLINE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Jezero Crater (ACTIVE) */}
            <div
              onClick={onStartPlanning}
              className="bg-[#131C2E] border-2 border-[#4DE3F0] rounded-xl p-5 relative overflow-hidden group cursor-pointer transition-all hover:shadow-xl hover:shadow-cyan-950/40"
            >
              <div className="absolute top-3 right-3 bg-[#3DDC84]/20 border border-[#3DDC84] text-[#3DDC84] text-[10px] font-code font-bold px-2 py-0.5 rounded uppercase">
                ACTIVE AOI
              </div>

              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-[#4DE3F0]" />
                <h3 className="font-heading font-bold text-lg text-white">Jezero Crater</h3>
              </div>

              <div className="text-xs text-slate-300 font-sans mb-4 leading-relaxed">
                Ancient lacustrine lakebed featuring the famous Western Delta deposits, Neretva Vallis breach canyon, and Séítah carbonate ridges.
              </div>

              <div className="space-y-1.5 text-[11px] font-code text-slate-400 border-t border-[#243552] pt-3">
                <div className="flex justify-between">
                  <span>GRID COVERAGE:</span>
                  <span className="text-white">200 × 200 cells (100 km²)</span>
                </div>
                <div className="flex justify-between">
                  <span>RESOLUTION:</span>
                  <span className="text-white">50m / cell</span>
                </div>
                <div className="flex justify-between">
                  <span>ELEVATION RANGE:</span>
                  <span className="text-white">-2,580m to -2,140m</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-heading font-bold text-[#4DE3F0] group-hover:translate-x-1 transition-transform">
                <span>SELECT SECTOR</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* 2. Gale Crater (LOCKED) */}
            <div className="bg-[#131C2E]/50 border border-[#243552] rounded-xl p-5 relative opacity-60">
              <div className="absolute top-3 right-3 bg-slate-800 text-slate-400 text-[10px] font-code px-2 py-0.5 rounded uppercase">
                PHASE 2 LOCKED
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Mountain className="w-5 h-5 text-slate-500" />
                <h3 className="font-heading font-bold text-lg text-slate-300">Gale Crater</h3>
              </div>

              <div className="text-xs text-slate-400 font-sans mb-4 leading-relaxed">
                Mount Sharp (Aeolis Mons) central mound complex. Slopes exceed 28° along sedimentary sulfates.
              </div>

              <div className="text-[11px] font-code text-slate-500 border-t border-[#243552] pt-3">
                Orbital DEM ingestion pending Mars Reconnaissance Orbiter stereo pairs.
              </div>
            </div>

            {/* 3. Valles Marineris (LOCKED) */}
            <div className="bg-[#131C2E]/50 border border-[#243552] rounded-xl p-5 relative opacity-60">
              <div className="absolute top-3 right-3 bg-slate-800 text-slate-400 text-[10px] font-code px-2 py-0.5 rounded uppercase">
                PHASE 3 LOCKED
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Mountain className="w-5 h-5 text-slate-500" />
                <h3 className="font-heading font-bold text-lg text-slate-300">Valles Marineris</h3>
              </div>

              <div className="text-xs text-slate-400 font-sans mb-4 leading-relaxed">
                Grand canyon of Mars spanning 4,000 km. Extreme cliff faces with vertical drops exceeding 7,000 meters.
              </div>

              <div className="text-[11px] font-code text-slate-500 border-t border-[#243552] pt-3">
                High-altitude atmospheric compensation model required.
              </div>
            </div>
          </div>
        </div>

        {/* Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#243552] pt-8">
          <div className="bg-[#131C2E]/60 p-4 rounded-lg border border-[#243552]">
            <div className="w-8 h-8 rounded bg-[#3DDC84]/20 text-[#3DDC84] flex items-center justify-center mb-2.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h4 className="font-heading font-bold text-sm text-white mb-1">Slope Hazard Avoidance</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Rule-based classification separating safe gradients (&lt;10°) from caution (10-15°) and hazardous rollover zones (&gt;15°).
            </p>
          </div>

          <div className="bg-[#131C2E]/60 p-4 rounded-lg border border-[#243552]">
            <div className="w-8 h-8 rounded bg-[#F5C542]/20 text-[#F5C542] flex items-center justify-center mb-2.5">
              <Activity className="w-4 h-4" />
            </div>
            <h4 className="font-heading font-bold text-sm text-white mb-1">Dijkstra & A* Route Comparison</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Real-time multi-objective pathfinding comparing direct shortest transit against safe lower-slope corridors and science stops.
            </p>
          </div>

          <div className="bg-[#131C2E]/60 p-4 rounded-lg border border-[#243552]">
            <div className="w-8 h-8 rounded bg-[#4DE3F0]/20 text-[#4DE3F0] flex items-center justify-center mb-2.5">
              <Eye className="w-4 h-4" />
            </div>
            <h4 className="font-heading font-bold text-sm text-white mb-1">Astronaut Visor HUD Sync</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Simulated first-person helmet view projecting neon waypoints, bearing telemetry, and steep incline audio-visual alerts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Credits */}
      <footer className="h-12 border-t border-[#243552] px-6 flex items-center justify-between text-[11px] font-code text-slate-500 z-10 bg-[#080D17]">
        <span>NASA Space Apps Challenge 2026: "Interplanetary Survival Guide: Martian Map"</span>
        <span>REAL TERRAIN MATRIX • 50 PTS • NOT CERTIFIED FOR FLIGHT</span>
      </footer>
    </div>
  );
};
