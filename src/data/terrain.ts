/**
 * RED ARES — Martian Map · Real terrain data module
 *
 * SOURCE OF TRUTH: Natasha's jezero_terrain_matrix.csv
 * 50 georeferenced points, Jezero Crater (Octavia E. Butler landing site
 * → Delta Front → Margin Carbonate Unit).
 *
 * COST MODEL (Scientific Dossier §3 — DO NOT invent other weights):
 *   C(t) = (C_terrain × μ_friction) + W_science
 */

import rawPoints from './terrainPoints.json';

export interface TerrainPoint {
  id: number;
  lat: number;
  lon: number;
  elev: number; // meters (Mars datum)
  slope: number; // degrees
  soil: 'bedrock' | 'compact_regolith' | 'aeolian_dunes';
  mineral: 'none' | 'phyllosilicates' | 'carbonates';
  science: boolean; // has_science_target
}

export const TERRAIN_POINTS = rawPoints as TerrainPoint[];

/* ---------------- Natasha's rule matrix ---------------- */

// Slope bands → C_terrain coefficient. >15° is a HARD CONSTRAINT (blocked).
export const C_TERRAIN = [1.0, 2.5, 5.0, 99999.0] as const;
export const BAND_LABELS = ['NOMINAL (0–5°)', 'STRAIN (5.1–12°)', 'RISK (12.1–15°)', 'BLOCKED (>15°)'] as const;
export const BAND_COLORS = ['#3DDC84', '#F5C542', '#FF9F43', '#E5484D'] as const;

export function slopeBand(slope: number): 0 | 1 | 2 | 3 {
  if (slope <= 5) return 0;
  if (slope <= 12) return 1;
  if (slope <= 15) return 2;
  return 3;
}

export function isBlocked(p: TerrainPoint): boolean {
  return p.slope > 15;
}

export function terrainCost(p: TerrainPoint): number {
  return C_TERRAIN[slopeBand(p.slope)];
}

// Soil friction multiplier μ
export const MU_FRICTION: Record<TerrainPoint['soil'], number> = {
  bedrock: 1.0,
  compact_regolith: 1.4,
  aeolian_dunes: 3.0,
};

// Science bonus: −3.5 for nodes flagged as science targets
export const W_SCIENCE = -3.5;

export function scienceBonus(p: TerrainPoint): number {
  return p.science ? W_SCIENCE : 0;
}

/** Per-meter cost factor of ENTERING node v (Natasha's formula, without distance). */
export function nodeCostFactor(v: TerrainPoint): number {
  return terrainCost(v) * MU_FRICTION[v.soil];
}

/* ---------------- Mars distance ---------------- */

// Dossier conversion: 0.00085° ≈ 50 m  →  1° ≈ 58,823.5 m
const M_PER_DEG = 50 / 0.00085;

export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * M_PER_DEG;
  const meanLat = ((lat1 + lat2) / 2) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * M_PER_DEG * Math.cos(meanLat);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/* ---------------- Graph ---------------- */

export interface GraphEdge {
  to: number; // node id
  distM: number;
}

export interface TerrainGraph {
  nodes: Map<number, TerrainPoint>;
  adjacency: Map<number, GraphEdge[]>;
  blockedIds: number[];
  edgeThresholdM: number;
}

/**
 * Builds a routable graph from the 50 real points.
 * - Nodes with slope > 15° are EXCLUDED (Natasha's hard constraint).
 * - Edges: consecutive transect neighbors + any pair within maxEdgeMeters.
 */
export function buildGraph(
  points: TerrainPoint[] = TERRAIN_POINTS,
  maxEdgeMeters = 400
): TerrainGraph {
  const alive = points.filter((p) => !isBlocked(p));
  const nodes = new Map<number, TerrainPoint>();
  const adjacency = new Map<number, GraphEdge[]>();
  for (const p of alive) {
    nodes.set(p.id, p);
    adjacency.set(p.id, []);
  }

  const link = (a: TerrainPoint, b: TerrainPoint) => {
    const d = haversineM(a.lat, a.lon, b.lat, b.lon);
    adjacency.get(a.id)!.push({ to: b.id, distM: d });
    adjacency.get(b.id)!.push({ to: a.id, distM: d });
  };

  // Consecutive transect neighbors (by id order), skipping blocked nodes
  const seq = points.filter((p) => !isBlocked(p));
  const linked = new Set<string>();
  for (let i = 0; i < seq.length - 1; i++) {
    link(seq[i], seq[i + 1]);
    linked.add(`${seq[i].id}-${seq[i + 1].id}`);
  }

  // Proximity edges (detours around blocked zones)
  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < alive.length; j++) {
      const key = `${alive[i].id}-${alive[j].id}`;
      if (linked.has(key)) continue;
      const d = haversineM(alive[i].lat, alive[i].lon, alive[j].lat, alive[j].lon);
      if (d <= maxEdgeMeters) {
        link(alive[i], alive[j]);
        linked.add(key);
      }
    }
  }

  return {
    nodes,
    adjacency,
    blockedIds: points.filter(isBlocked).map((p) => p.id),
    edgeThresholdM: maxEdgeMeters,
  };
}

/* ---------------- Biomedical (Dossier §4, display only) ---------------- */

/** Dynamic O₂ consumption estimate, L/min: 1.2 flat → 3.8 at 15°. */
export function o2LitersPerMin(slope: number): number | null {
  if (slope > 15) return null; // blocked — no EVA
  return Number((1.2 + (slope / 15) * (3.8 - 1.2)).toFixed(2));
}

/* ---------------- Science POIs (the 15 real targets) ---------------- */

export interface SciencePoint {
  id: string;
  name: string;
  pointId: number;
  lat: number;
  lon: number;
  elevation: number;
  category: string;
  reason: string;
}

const MINERAL_LABEL: Record<string, string> = {
  phyllosilicates: 'Phyllosilicates (Fe/Mg clays)',
  carbonates: 'Carbonates (magnesite)',
};

export const SCIENCE_POIS: SciencePoint[] = TERRAIN_POINTS.filter((p) => p.science).map((p) => ({
  id: `sci-p${p.id}`,
  name: `P${p.id} — ${p.mineral === 'phyllosilicates' ? 'Clay target' : 'Carbonate target'}`,
  pointId: p.id,
  lat: p.lat,
  lon: p.lon,
  elevation: p.elev,
  category: MINERAL_LABEL[p.mineral] ?? p.mineral,
  reason:
    p.mineral === 'phyllosilicates'
      ? 'Fe/Mg smectite clays — chemical traps preserving organics (Delta Front, Target ALPHA).'
      : 'Massive carbonate deposits — ancient shoreline mineral precipitation (Margin Unit, Target BETA).',
}));

/* ---------------- Named sites ---------------- */

export const SITE_LABELS: { pointId: number; label: string }[] = [
  { pointId: 1, label: 'OCTAVIA E. BUTLER — LANDING SITE' },
  { pointId: 41, label: 'DELTA FRONT — TARGET ALPHA' },
  { pointId: 50, label: 'MARGIN CARBONATE — TARGET BETA' },
];
