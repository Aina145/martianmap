/**
 * RED ARES — Martian Map Type Definitions
 * NASA Space Apps 2026: "Interplanetary Survival Guide: Martian Map"
 *
 * Data model: graph of Natasha's 50 real terrain points (jezero_terrain_matrix.csv).
 * Cost model: Total_Cost = (C_terrain × μ_friction) × α_science  (Scientific Dossier §3)
 */

export type SlopeCategory = 'safe' | 'caution' | 'hazard' | 'blocked';

/** A node on the EVA route — one of the 50 real terrain points. */
export interface RoutePoint {
  id: number; // terrain point id (1–50)
  lat: number;
  lon: number;
  elevation: number;
  slope: number;
  soil: string;
  mineral: string;
  science: boolean;
  stepDistanceMeters: number;
  cumulativeDistanceMeters: number;
  cumulativeElevationGain: number;
  /** C(t) cost of the step that arrived at this node (Natasha's formula). */
  stepCost: number;
  hazardLevel: 0 | 1 | 2; // 0 safe (≤5°), 1 caution (5–12°), 2 risk (12–15°). Blocked nodes never appear on routes.
  category: SlopeCategory;
}

export type RouteType = 'lower-slope' | 'shortest' | 'science-stop';

export interface RouteMetrics {
  distanceMeters: number;
  distanceKm: number;
  estimatedWalkTimeMinutes: number;
  formattedWalkTime: string;
  elevationGainMeters: number;
  elevationLossMeters: number;
  maxSlopeDegrees: number;
  avgSlopeDegrees: number;
  cautionCellCount: number;
  hazardCellCount: number;
  unknownCellPercentage: number; // always 0 — real data has no sensor voids
  safetyScore: number; // 0 - 100
  totalCost: number; // Σ C(t) over the route
  whySentence: string;
  visitedScienceIds: number[]; // terrain point ids with science=true on this route
}

export interface RouteResult {
  id: string;
  type: RouteType;
  label: string;
  color: string;
  points: RoutePoint[];
  metrics: RouteMetrics;
  algorithmUsed: 'A*' | 'Dijkstra';
  executionTimeMs: number;
  timestamp: string;
}

export interface LayerSettings {
  terrain: boolean; // all 50 terrain nodes
  science: boolean; // science target highlight
  danger: boolean; // blocked-zone markers (>15°)
  route: boolean; // graph edges ( faint corridor mesh )
}

export interface HUDTelemetry {
  oxygenPct: number;
  suitPressureKpa: number;
  internalTempC: number;
  heartRateBpm: number;
  batteryPct: number;
  headingDegrees: number;
}
