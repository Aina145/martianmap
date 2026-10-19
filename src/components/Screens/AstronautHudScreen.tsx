/**
 * RED ARES — Astronaut HUD (SIMULATED) Screen
 * First-person perspective simulated helmet visor feed.
 * Features:
 * - Mandatory disclaimer: "SIMULATED VIEW — demo only, not a real helmet feed"
 * - Perspective neon path projection with START & TARGET beacons
 * - Dynamic slope alerts ONLY when approaching incline > slope limit (>10° / >15°)
 * - Live EVA scrubber & auto-walk simulator
 * - Astronaut biomechanical telemetry (O2, Suit Pressure, Temp, HR)
 * - Compass tape & altitude profile
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RouteResult, HUDTelemetry } from '../../types/mars';
import {
  Compass,
  Heart,
  Wind,
  Gauge,
  Thermometer,
  Battery,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface AstronautHudScreenProps {
  route: RouteResult | null;
  onBackToMissionControl: () => void;
}

export const AstronautHudScreen: React.FC<AstronautHudScreenProps> = ({
  route,
  onBackToMissionControl,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLayersPanel, setActiveLayersPanel] = useState(true);

  // Simulated astronaut telemetry state
  const [telemetry, setTelemetry] = useState<HUDTelemetry>({
    oxygenPct: 96.4,
    suitPressureKpa: 29.6, // Nominal Apollo/Artemis EVA suit pressure ~4.3 psi = 29.6 kPa
    internalTempC: 20.8,
    heartRateBpm: 84,
    batteryPct: 88,
    headingDegrees: 45,
  });

  const totalSteps = route ? route.points.length : 0;
  const currentPt = route && route.points[currentStep] ? route.points[currentStep] : null;
  const destPt = route && route.points.length > 0 ? route.points[route.points.length - 1] : null;

  // Auto-play interval
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && totalSteps > 0) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, totalSteps]);

  // Dynamic heart rate & bearing simulation based on slope
  useEffect(() => {
    if (!currentPt) return;

    // Heart rate increases on steep climbing grades
    const baseHR = 78;
    const slopeExertion = currentPt.slope > 10 ? (currentPt.slope - 10) * 3 : 0;
    const dynamicHR = Math.round(baseHR + slopeExertion + Math.sin(Date.now() / 2000) * 2);

    // Compute heading to next waypoint
    let heading = telemetry.headingDegrees;
    if (route && currentStep < route.points.length - 1) {
      const nextPt = route.points[currentStep + 1];
      const dx = (nextPt.lon - currentPt.lon) * Math.cos((currentPt.lat * Math.PI) / 180);
      const dy = nextPt.lat - currentPt.lat;
      heading = Math.round((Math.atan2(dx, dy) * (180 / Math.PI) + 360) % 360);
    }

    setTelemetry((prev) => ({
      ...prev,
      heartRateBpm: dynamicHR,
      headingDegrees: heading,
      oxygenPct: Math.max(70, Number((prev.oxygenPct - 0.01).toFixed(1))),
      batteryPct: Math.max(20, Number((prev.batteryPct - 0.02).toFixed(1))),
    }));
  }, [currentStep, currentPt]);

  // Check for upcoming steep incline alert in the next 1-4 waypoints
  const upcomingInclineAlert = useMemo(() => {
    if (!route || currentStep >= route.points.length - 1) return null;

    // Look ahead 3 waypoints
    const lookAheadSteps = Math.min(route.points.length - 1, currentStep + 4);
    for (let i = currentStep + 1; i <= lookAheadSteps; i++) {
      const p = route.points[i];
      if (p.slope > 15.0) {
        return {
          level: 'HAZARD',
          message: `EXTREME SCARP INCLINE AHEAD (${p.slope.toFixed(1)}° GRADE IN ${(i - currentStep) * 50}m)`,
          class: 'bg-rose-950/90 border-[#E5484D] text-[#E5484D]',
        };
      }
      if (p.slope >= 10.0) {
        return {
          level: 'CAUTION',
          message: `STEEP INCLINE AHEAD (${p.slope.toFixed(1)}° GRADE IN ${(i - currentStep) * 50}m)`,
          class: 'bg-amber-950/90 border-[#F5C542] text-[#F5C542]',
        };
      }
    }
    return null;
  }, [route, currentStep]);

  // Distance remaining calculation
  const remainingDistM = useMemo(() => {
    if (!route || !currentPt) return 0;
    const totalDist = route.metrics.distanceMeters;
    return Math.max(0, totalDist - currentPt.cumulativeDistanceMeters);
  }, [route, currentPt]);

  return (
    <div className="h-full flex flex-col bg-[#05080F] text-[#E6EDF3] relative overflow-hidden select-none font-code">
      {/* Visor Scanline and Vignette Effects */}
      <div className="absolute inset-0 hud-scanline pointer-events-none opacity-40 z-20" />
      <div className="absolute inset-0 hud-vignette pointer-events-none z-20" />

      {/* Mandatory Simulated View Banner */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-[#131C2E]/95 backdrop-blur border border-amber-500/80 px-4 py-1 rounded-full text-xs font-bold text-amber-300 shadow-xl shadow-black/80 flex items-center gap-2 tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>SIMULATED VIEW — demo only, not a real helmet feed</span>
        </div>
      </div>

      {/* Visor Curvature Frame Overlay */}
      <div className="absolute inset-3 rounded-[32px] border border-[#4DE3F0]/25 pointer-events-none z-10" />

      {/* TOP HUD BAR: Heading Compass Tape & Time */}
      <header className="h-16 px-8 flex items-center justify-between z-30 pt-3">
        {/* Back Button */}
        <button
          onClick={onBackToMissionControl}
          className="px-3 py-1.5 rounded-lg bg-[#131C2E]/90 border border-[#243552] text-[#4DE3F0] hover:text-white hover:border-[#4DE3F0] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>EXIT HUD</span>
        </button>

        {/* Compass Tape Widget */}
        <div className="flex flex-col items-center bg-[#131C2E]/80 backdrop-blur border border-[#243552] px-6 py-1.5 rounded-xl shadow-2xl">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#4DE3F0]">
            <Compass className="w-3.5 h-3.5" />
            <span>BEARING: {telemetry.headingDegrees.toString().padStart(3, '0')}° MAG</span>
          </div>
          {/* Compass Ribbon */}
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono mt-0.5">
            <span className={telemetry.headingDegrees >= 340 || telemetry.headingDegrees <= 20 ? 'text-[#4DE3F0] font-black' : ''}>N</span>
            <span className={telemetry.headingDegrees >= 25 && telemetry.headingDegrees <= 65 ? 'text-[#4DE3F0] font-black' : ''}>NE</span>
            <span className={telemetry.headingDegrees >= 70 && telemetry.headingDegrees <= 110 ? 'text-[#4DE3F0] font-black' : ''}>E</span>
            <span className={telemetry.headingDegrees >= 115 && telemetry.headingDegrees <= 155 ? 'text-[#4DE3F0] font-black' : ''}>SE</span>
            <span className={telemetry.headingDegrees >= 160 && telemetry.headingDegrees <= 200 ? 'text-[#4DE3F0] font-black' : ''}>S</span>
            <span className={telemetry.headingDegrees >= 205 && telemetry.headingDegrees <= 245 ? 'text-[#4DE3F0] font-black' : ''}>SW</span>
            <span className={telemetry.headingDegrees >= 250 && telemetry.headingDegrees <= 290 ? 'text-[#4DE3F0] font-black' : ''}>W</span>
            <span className={telemetry.headingDegrees >= 295 && telemetry.headingDegrees <= 335 ? 'text-[#4DE3F0] font-black' : ''}>NW</span>
          </div>
        </div>

        {/* HUD Mode indicator */}
        <div className="text-right text-[11px] text-slate-400">
          <div className="text-[#3DDC84] font-bold tracking-wider">EVA MODE: NOMINAL</div>
          <div className="text-slate-500 text-[10px]">CORRIDOR ID: {route?.id.slice(0, 12) || 'NONE'}</div>
        </div>
      </header>

      {/* DYNAMIC ALERT BANNER (ONLY TRIGGERS WHEN SLOPE LIMIT EXCEEDED) */}
      <div className="h-10 flex items-center justify-center z-30 px-6">
        {upcomingInclineAlert ? (
          <div
            className={`px-6 py-1.5 rounded-lg border-2 shadow-2xl flex items-center gap-2.5 text-xs font-black uppercase tracking-wider animate-bounce ${upcomingInclineAlert.class}`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{upcomingInclineAlert.message}</span>
          </div>
        ) : (
          <div className="text-[10px] text-emerald-400/80 bg-emerald-950/30 border border-emerald-900/40 px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>TERRAIN AHEAD CLEARED: GRADIENT WITHIN SAFETY ENVELOPE (&lt; 10°)</span>
          </div>
        )}
      </div>

      {/* MAIN FIRST-PERSON VISOR CANVAS / 3D-STYLE SYNTHETIC PROJECTION */}
      <div className="flex-1 relative mx-6 my-2 rounded-2xl overflow-hidden border border-[#243552]/80 bg-gradient-to-b from-[#0B1424] via-[#1A121E] to-[#2E1815]">
        {/* Synthetic Martian Horizon & Distant Crater Rim Silhouette */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {/* Martian Sky & Stars */}
          <div className="h-2/5 bg-gradient-to-b from-[#080D17] to-[#251515] relative">
            <div className="absolute top-8 left-1/4 w-1 h-1 bg-white rounded-full opacity-80" />
            <div className="absolute top-12 right-1/3 w-1.5 h-1.5 bg-amber-200 rounded-full opacity-90" />
            <div className="absolute top-5 right-1/5 text-[9px] text-slate-500 font-mono">PHOBOS 14° ALT</div>
          </div>

          {/* Jagged Crater Rim Silhouette */}
          <div
            className="h-1/5 bg-[#3B1914] relative"
            style={{
              clipPath:
                'polygon(0% 100%, 0% 45%, 15% 25%, 30% 50%, 45% 20%, 60% 40%, 75% 15%, 88% 35%, 100% 20%, 100% 100%)',
            }}
          />

          {/* Crater Floor Surface with Perspective Grid */}
          <div className="h-2/5 bg-[#1C0E0B] relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #C1440E 1px, transparent 1px), linear-gradient(to bottom, #C1440E 1px, transparent 1px)',
                backgroundSize: '40px 20px',
                transform: 'perspective(300px) rotateX(60deg)',
              }}
            />
          </div>
        </div>

        {/* 3D PERSPECTIVE NEON FLIGHT PATH PROJECTION */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <defs>
              <linearGradient id="neonPathGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#4DE3F0" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#3DDC84" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F5C542" stopOpacity="0.6" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Vanishing Point Horizon Line */}
            <line x1="100" y1="360" x2="900" y2="360" stroke="#4DE3F0" strokeWidth="1" strokeDasharray="4 8" opacity="0.3" />

            {/* Target Beacon Marker in Distance */}
            <g transform="translate(500, 340)">
              <circle r="14" fill="#E5484D" opacity="0.3" filter="url(#neonGlow)" />
              <circle r="7" fill="#E5484D" />
              <line x1="0" y1="0" x2="0" y2="-60" stroke="#E5484D" strokeWidth="2" strokeDasharray="3 3" />
              <text x="0" y="-70" fill="#E5484D" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">
                TARGET B ({remainingDistM}m)
              </text>
            </g>

            {/* Perspective Waypoint Route Strip */}
            <path
              d="M 500 580 L 460 520 L 530 450 L 480 390 L 500 340"
              fill="none"
              stroke="url(#neonPathGrad)"
              strokeWidth="10"
              filter="url(#neonGlow)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Neon Stepping Beacons */}
            <circle cx="500" cy="580" r="10" fill="#3DDC84" filter="url(#neonGlow)" />
            <text x="500" y="598" fill="#3DDC84" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">
              EVA POS (WP {currentStep + 1}/{totalSteps})
            </text>

            <circle cx="460" cy="520" r="6" fill="#4DE3F0" />
            <circle cx="530" cy="450" r="6" fill="#4DE3F0" />
            <circle cx="480" cy="390" r="6" fill={upcomingInclineAlert ? '#F5C542' : '#4DE3F0'} />

            {/* Center Reticle */}
            <g transform="translate(500, 300)" opacity="0.6">
              <circle r="28" fill="none" stroke="#4DE3F0" strokeWidth="1" strokeDasharray="6 6" />
              <line x1="-35" y1="0" x2="-10" y2="0" stroke="#4DE3F0" strokeWidth="1.5" />
              <line x1="10" y1="0" x2="35" y2="0" stroke="#4DE3F0" strokeWidth="1.5" />
              <line x1="0" y1="-35" x2="0" y2="-10" stroke="#4DE3F0" strokeWidth="1.5" />
              <line x1="0" y1="10" x2="0" y2="35" stroke="#4DE3F0" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        {/* LEFT HUD OVERLAY: Spacesuit Telemetry Pod */}
        <div className="absolute top-4 left-4 z-20 w-64 bg-[#131C2E]/85 backdrop-blur border border-[#243552] rounded-xl p-3 shadow-2xl space-y-2">
          <div className="text-[10px] font-heading font-semibold text-[#4DE3F0] uppercase tracking-wider flex items-center justify-between border-b border-[#243552] pb-1.5">
            <span>BIOMECHANICAL SUIT TELEMETRY</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          <div className="space-y-1.5 text-xs font-code">
            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Wind className="w-3.5 h-3.5 text-[#4DE3F0]" />
                <span>O₂ RESERVES</span>
              </div>
              <span className="text-white font-bold">{telemetry.oxygenPct}%</span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                <span>SUIT PRESSURE</span>
              </div>
              <span className="text-white font-bold">{telemetry.suitPressureKpa} kPa</span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>CORE TEMP</span>
              </div>
              <span className="text-white font-bold">{telemetry.internalTempC}°C</span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>HEART RATE</span>
              </div>
              <span
                className={`font-bold ${
                  telemetry.heartRateBpm > 100 ? 'text-[#E5484D]' : 'text-white'
                }`}
              >
                {telemetry.heartRateBpm} BPM
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Battery className="w-3.5 h-3.5 text-cyan-400" />
                <span>SUIT BATTERY</span>
              </div>
              <span className="text-white font-bold">{telemetry.batteryPct}%</span>
            </div>
          </div>
        </div>

        {/* RIGHT HUD OVERLAY: Route Analysis Panel (Same numbers as Mission Control) */}
        <div className="absolute top-4 right-4 z-20 w-72 bg-[#131C2E]/85 backdrop-blur border border-[#243552] rounded-xl p-3 shadow-2xl space-y-2">
          <div className="text-[10px] font-heading font-semibold text-[#4DE3F0] uppercase tracking-wider flex items-center justify-between border-b border-[#243552] pb-1.5">
            <span>TACTICAL ROUTE TELEMETRY</span>
            <span className="text-[9px] text-[#3DDC84] font-code">{route?.type.toUpperCase()}</span>
          </div>

          <div className="space-y-1.5 text-xs font-code">
            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <span className="text-slate-400">CURRENT POSITION</span>
              <span className="text-white font-bold">
                {currentPt ? `P${currentPt.id} · ${currentPt.lat.toFixed(4)}°N ${currentPt.lon.toFixed(4)}°E` : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <span className="text-slate-400">CURRENT ELEVATION</span>
              <span className="text-white font-bold">
                {currentPt ? `${currentPt.elevation} m` : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <span className="text-slate-400">LOCAL SURFACE SLOPE</span>
              <span
                className={`font-bold ${
                  currentPt && currentPt.slope > 15
                    ? 'text-[#E5484D]'
                    : currentPt && currentPt.slope >= 10
                    ? 'text-[#F5C542]'
                    : 'text-[#3DDC84]'
                }`}
              >
                {currentPt ? `${currentPt.slope.toFixed(1)}°` : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <span className="text-slate-400">DISTANCE TO TARGET</span>
              <span className="text-[#4DE3F0] font-bold">{remainingDistM} m</span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <span className="text-slate-400">TOTAL CORRIDOR</span>
              <span className="text-white font-bold">{route?.metrics.distanceKm} km</span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <span className="text-slate-400">EST. REMAINING TIME</span>
              <span className="text-white font-bold">
                {Math.round((remainingDistM / (route?.metrics.distanceMeters || 1)) * (route?.metrics.estimatedWalkTimeMinutes || 0))} min
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <span className="text-slate-400">MAX CORRIDOR SLOPE</span>
              <span className="text-white font-bold">{route?.metrics.maxSlopeDegrees}°</span>
            </div>

            <div className="flex items-center justify-between bg-[#0B1220]/70 p-1.5 rounded">
              <span className="text-slate-400">CORRIDOR SAFETY SCORE</span>
              <span className="text-[#3DDC84] font-bold">{route?.metrics.safetyScore}/100</span>
            </div>
          </div>
        </div>

        {/* BOTTOM HUD OVERLAY: Route Waypoint Scrubber & Playback Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-2xl bg-[#131C2E]/90 backdrop-blur border border-[#243552] rounded-xl p-3 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-code mb-2 text-slate-300">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-lg bg-[#4DE3F0] hover:bg-[#38b2bd] text-[#0B1220] transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(0);
                }}
                className="p-1.5 rounded-lg bg-[#0B1220] hover:bg-slate-800 border border-[#243552] text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-white text-xs">
                WAYPOINT {currentStep + 1} / {totalSteps}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span>Traversed: {currentPt ? currentPt.cumulativeDistanceMeters : 0}m</span>
              <span className="text-[#3DDC84]">
                Climb: +{currentPt ? currentPt.cumulativeElevationGain : 0}m
              </span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStep}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStep(Number(e.target.value));
            }}
            className="w-full accent-[#4DE3F0] h-1.5 bg-[#0B1220] rounded-lg cursor-pointer"
          />

          {/* Slope Bar Strip */}
          <div className="flex h-1.5 w-full mt-1.5 rounded overflow-hidden">
            {route?.points.map((pt, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  backgroundColor:
                    pt.hazardLevel === 2
                      ? '#E5484D'
                      : pt.hazardLevel === 1
                      ? '#F5C542'
                      : '#3DDC84',
                  opacity: i <= currentStep ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
