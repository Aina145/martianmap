/**
 * RED ARES — Data & About Screen
 * Dataset specifications table, routing mathematical cost formula,
 * safety categorization rules, and transparent engineering limitations.
 */

import React from 'react';
import {
  Database,
  Calculator,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  Layers,
  FileText,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface DataAboutScreenProps {
  onBack: () => void;
}

export const DataAboutScreen: React.FC<DataAboutScreenProps> = ({ onBack }) => {
  return (
    <div className="h-full flex flex-col bg-[#0B1220] text-[#E6EDF3] overflow-y-auto select-none font-sans">
      {/* Top Header */}
      <header className="h-14 bg-[#131C2E] border-b border-[#243552] px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-[#0B1220] border border-[#243552] text-slate-300 hover:text-white hover:border-[#4DE3F0] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO MAP</span>
          </button>
          <div className="h-5 w-px bg-slate-700" />
          <h2 className="font-heading font-bold text-sm text-white">DATA ARCHITECTURE & SAFETY SPECIFICATION</h2>
        </div>

        <div className="text-xs font-code text-[#4DE3F0]">
          NASA Space Apps 2026 • Challenge: Martian Map
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* SECTION 1: DATASETS TABLE */}
        <section className="bg-[#131C2E] rounded-xl border border-[#243552] overflow-hidden">
          <div className="p-4 bg-[#1B273F] border-b border-[#243552] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#4DE3F0]" />
              <h3 className="font-heading font-bold text-sm text-white uppercase">
                1. ORBITAL & SYNTHETIC DATASETS SPECIFICATION
              </h3>
            </div>
            <span className="text-[10px] font-code text-amber-300 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded">
              PROTOTYPE SYNTHESIS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-code">
              <thead>
                <tr className="border-b border-[#243552] text-slate-400 text-[10px] uppercase bg-[#0B1220]/60">
                  <th className="py-3 px-4">Dataset Name</th>
                  <th className="py-3 px-4">Resolution</th>
                  <th className="py-3 px-4">Operational Role & Use</th>
                  <th className="py-3 px-4">Known Limits & Biases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243552]/70 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-bold text-[#4DE3F0]">
                    jezero_terrain_matrix.csv (Active Engine)
                  </td>
                  <td className="py-3 px-4 text-white">50 georeferenced points</td>
                  <td className="py-3 px-4">
                    Real transect: Octavia E. Butler landing (P1) → Delta Front (P41) → Margin Carbonate (P50). Each point carries elevation, slope, soil friction class and mineral signature.
                  </td>
                  <td className="py-3 px-4 text-emerald-300">
                    Real team dataset. Nodes with slope &gt; 15° (P22–P24, P46) are hard-blocked.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">
                    NASA CTX (Context Camera) Stereo Pairs
                  </td>
                  <td className="py-3 px-4 text-white">~6.0 m / pixel</td>
                  <td className="py-3 px-4">
                    Target baseline for regional topographic stereo reconstruction and crater rim morphology.
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    High computational overhead for planetary-scale ingestion; orbital illumination shadows create voids.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">
                    HiRISE (High Resolution Imaging Science Experiment)
                  </td>
                  <td className="py-3 px-4 text-white">0.25 m / pixel (DEM: 1.0 m)</td>
                  <td className="py-3 px-4">
                    Rock boulder density mapping, meter-scale scarp fracture detection, rover wheel-hazard classification.
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    Sparse geographical coverage (&lt;3% of Mars total surface); file sizes range into multiple gigabytes.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">
                    NASA MOLA (Mars Orbiter Laser Altimeter)
                  </td>
                  <td className="py-3 px-4 text-white">~463 m / pixel (128 px/deg)</td>
                  <td className="py-3 px-4">
                    Mars 2000 geodetic reference datum and regional crater floor baseline elevation (-2,580m).
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    Too coarse for astronaut slope traversal; misses localized vertical cliffs under 400m wide.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#3DDC84]">
                    Team-Selected Science Targets (POIs)
                  </td>
                  <td className="py-3 px-4 text-white">Vector Point Locations</td>
                  <td className="py-3 px-4">
                    15 real science targets from the matrix: P16–P21 phyllosilicates (Target ALPHA), P38–P43 & P48–P50 carbonates (Target BETA).
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    CRISM FRT0000B23C mineralogy + team rule matrix. Science-stop routes earn W = −3.5 per target node.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 2: COST FUNCTION SPECIFICATION */}
        <section className="bg-[#131C2E] rounded-xl border border-[#243552] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#243552] pb-3">
            <Calculator className="w-4 h-4 text-[#4DE3F0]" />
            <h3 className="font-heading font-bold text-sm text-white uppercase">
              2. TERRAIN-AWARE COST FUNCTION MATHEMATICAL FORMULATION
            </h3>
          </div>

          <div className="bg-[#0B1220] p-4 rounded-lg border border-[#243552] font-code text-xs text-[#4DE3F0] leading-relaxed overflow-x-auto">
            <div className="text-white font-bold text-sm mb-1">
              C(t) = (C_terrain × μ_friction) + W_science
            </div>
            <div className="text-slate-400 text-[11px] mt-2 space-y-1">
              <div>• <b>Edge cost u → v</b>: dist(u,v) × C_terrain(v) × μ(v) + W(v), summed over the corridor (ΣC(t)).</div>
              <div>• <b>C_terrain</b>: 1.0 for 0–5° (nominal) · 2.5 for 5.1–12° (strain) · 5.0 for 12.1–15° (risk) · <b className="text-rose-400">99999 for &gt;15° — hard blocked, node removed from graph</b>.</div>
              <div>• <b>μ_friction</b>: bedrock ×1.0 · compact regolith ×1.4 · aeolian dunes ×3.0.</div>
              <div>• <b>W_science</b>: −3.5 for the 15 NASA sample-target nodes, else 0 (active in Science-Stop mode).</div>
              <div>• <b>Modes</b>: Lower-Slope minimizes ΣC(t) · Shortest uses pure distance (baseline) · Science-Stop adds W_science. Blocked nodes are excluded in every mode.</div>
            </div>
          </div>
        </section>

        {/* SECTION 3: SAFETY RULES BREAKDOWN */}
        <section className="bg-[#131C2E] rounded-xl border border-[#243552] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#243552] pb-3">
            <ShieldAlert className="w-4 h-4 text-[#3DDC84]" />
            <h3 className="font-heading font-bold text-sm text-white uppercase">
              3. OPERATIONAL SAFETY THRESHOLDS (PROPOSED DESIGN RULES)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-code text-xs">
            <div className="bg-[#0B1220] p-4 rounded-lg border border-emerald-900/60">
              <div className="flex items-center gap-2 text-[#3DDC84] font-bold text-sm mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3DDC84]" />
                <span>NOMINAL (0–5°) · C=1.0</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                Minimal metabolic load on EVA astronaut. Suit joint articulation stable; O₂ ≈ 1.2 L/min.
              </p>
            </div>

            <div className="bg-[#0B1220] p-4 rounded-lg border border-amber-900/60 caution-hatch">
              <div className="flex items-center gap-2 text-[#F5C542] font-bold text-sm mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5C542]" />
                <span>STRAIN (5.1–12°) · C=2.5</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                Tolerable for traversals with elevated cost. Telemetry watches heart rate and O₂ ramp.
              </p>
            </div>

            <div className="bg-[#0B1220] p-4 rounded-lg border border-orange-900/60">
              <div className="flex items-center gap-2 text-[#FF9F43] font-bold text-sm mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F43]" />
                <span>RISK (12.1–15°) · C=5.0</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                High cost zone — only crossed when no alternative corridor exists. O₂ up to 3.8 L/min.
              </p>
            </div>

            <div className="bg-[#0B1220] p-4 rounded-lg border border-rose-900/60 hazard-hatch">
              <div className="flex items-center gap-2 text-[#E5484D] font-bold text-sm mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5484D]" />
                <span>BLOCKED (&gt; 15°) · C=99999</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                Hard constraint. P22–P24 and P46 are excluded from the routing graph — no corridor may pass through them.
              </p>
            </div>
          </div>

          <div className="bg-[#0B1220] p-3.5 rounded-lg border border-slate-700 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed font-sans">
              <strong className="text-white">Rule on blocked nodes:</strong> Any node with slope &gt; 15° is removed from the routing graph before search begins. If start or destination is blocked, or no corridor exists, the engine returns <span className="font-mono text-rose-400 font-bold">NO PASSABLE CORRIDOR</span> instead of inventing a path.
            </div>
          </div>
        </section>

        {/* SECTION 4: HONEST LIMITATIONS */}
        <section className="bg-[#131C2E] rounded-xl border border-amber-900/40 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#243552] pb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="font-heading font-bold text-sm text-white uppercase">
              4. LIMITATIONS IN PLAIN WORDS (HONEST ENGINEERING DISCLOSURE)
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 font-sans leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold font-mono">1.</span>
              <span>
                <strong className="text-white">Point-based terrain model:</strong> The engine routes over 50 surveyed transect points — not a continuous DEM. Corridors follow straight segments between neighboring points (≤400 m links); fine terrain between points is not modeled. Phase 2 will drape NASA Trek WMS imagery and denser elevation under the same cost matrix.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold font-mono">2.</span>
              <span>
                <strong className="text-white">No Live Mars Weather:</strong> The tool does not model real-time atmospheric opacity (tau), seasonal dust storms, cryogenic CO₂ frost accumulation, or thermal diurnal cycling.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold font-mono">3.</span>
              <span>
                <strong className="text-white">Rule-Based, Not Certified AI:</strong> The routing engine uses deterministic graph search (A* with Dijkstra baseline). It does not claim "guaranteed safety", autonomous pilot certification, or neural black-box decision making.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold font-mono">4.</span>
              <span>
                <strong className="text-white">Spacesuit Walking Speed:</strong> EVA walk duration is modeled using an adapted Tobler Hiking Function calibrated to 0.38g gravity and 3.2 km/h flat suit pace. Real astronaut speeds will vary based on suit mass, soil cohesion, and crew fatigue.
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
