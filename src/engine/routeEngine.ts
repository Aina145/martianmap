/**
 * RED ARES — Martian Map Route Planning Engine
 *
 * Graph-based A* / Dijkstra over Natasha's 50 REAL terrain points
 * (jezero_terrain_matrix.csv). Nodes with slope > 15° are excluded from
 * the graph — hard constraint, never routed through.
 *
 * COST MODEL — Scientific Dossier §3 (exact, do not invent other weights):
 *   C(t) = (C_terrain × μ_friction) + W_science
 *   C_terrain: 1.0 (0–5°) | 2.5 (5.1–12°) | 5.0 (12.1–15°) | 99999 (>15°, blocked)
 *   μ: bedrock 1.0 | compact_regolith 1.4 | aeolian_dunes 3.0
 *   W_science: −3.5 for science-target nodes, else 0
 */

import { RouteResult, RoutePoint, RouteMetrics, RouteType } from '../types/mars';
import {
  TerrainGraph,
  TerrainPoint,
  terrainCost,
  MU_FRICTION,
  scienceBonus,
  nodeCostFactor,
  haversineM,
  slopeBand,
  W_SCIENCE,
} from '../data/terrain';

// Priority Queue implementation with Binary Min-Heap
export class MinHeap<T> {
  private heap: { priority: number; item: T }[] = [];

  push(item: T, priority: number): void {
    this.heap.push({ priority, item });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0].item;
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.bubbleDown(0);
    }
    return top;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  get size(): number {
    return this.heap.length;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (this.heap[index].priority < this.heap[parentIndex].priority) {
        const tmp = this.heap[index];
        this.heap[index] = this.heap[parentIndex];
        this.heap[parentIndex] = tmp;
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const left = (index << 1) + 1;
      const right = left + 1;

      if (left < length && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }

      if (smallest !== index) {
        const tmp = this.heap[index];
        this.heap[index] = this.heap[smallest];
        this.heap[smallest] = tmp;
        index = smallest;
      } else {
        break;
      }
    }
  }
}

export interface RouteEngineOptions {
  routeType: RouteType;
  algorithm?: 'A*' | 'Dijkstra';
}

/**
 * C(t) for traversing edge u → v (cost of ARRIVING at v).
 * Blocked nodes (>15°) are not in the graph, so the 99999 case never fires —
 * the guard below is defensive only.
 */
export function edgeCost(
  v: TerrainPoint,
  distM: number,
  routeType: RouteType
): number {
  const cTerr = terrainCost(v);
  if (cTerr >= 99999) return Infinity; // hard constraint
  if (routeType === 'shortest') return distM;
  const base = distM * cTerr * MU_FRICTION[v.soil];
  if (routeType === 'science-stop') return base + scienceBonus(v);
  return base; // 'lower-slope'
}

/**
 * Admissible A* heuristic: straight-line haversine × minimum per-meter factor.
 * science-stop can earn at most 15 × (−3.5) bonus, hence the correction.
 */
function heuristic(nodeId: number, destId: number, graph: TerrainGraph, routeType: RouteType): number {
  const n = graph.nodes.get(nodeId)!;
  const d = graph.nodes.get(destId)!;
  const h = haversineM(n.lat, n.lon, d.lat, d.lon);
  if (routeType === 'shortest') return h;
  if (routeType === 'lower-slope') return h * 1.0;
  return Math.max(0, h * 1.0 + W_SCIENCE * 15);
}

/**
 * Estimates Mars EVA walk time using adapted Tobler Hiking model.
 * 0.38g gravity, pressurized suit ≈ 3.2 km/h on flat terrain.
 */
export function estimateMartianWalkTime(
  distanceMeters: number,
  elevGainMeters: number,
  avgSlopeDegrees: number
): { minutes: number; formatted: string } {
  let effectiveSpeedMpm = 53.3; // 3.2 km/h
  if (avgSlopeDegrees > 2) {
    effectiveSpeedMpm *= Math.max(0.35, 1 - (avgSlopeDegrees / 20) * 0.65);
  }
  const climbExtraMinutes = elevGainMeters > 0 ? elevGainMeters * 0.25 : 0;
  const baseMinutes = distanceMeters / effectiveSpeedMpm;
  const totalMinutes = Math.max(1, Math.round(baseMinutes + climbExtraMinutes));

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formatted = hours > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}m` : `${mins} min`;
  return { minutes: totalMinutes, formatted };
}

function hazardLevelOf(p: TerrainPoint): 0 | 1 | 2 {
  const b = slopeBand(p.slope);
  return b as 0 | 1 | 2; // blocked nodes never reach the route
}

function categoryOf(p: TerrainPoint): 'safe' | 'caution' | 'hazard' {
  const b = slopeBand(p.slope);
  return b === 0 ? 'safe' : b === 1 ? 'caution' : 'hazard';
}

function analyzeRoute(
  path: { node: TerrainPoint; stepDistM: number; stepCost: number }[],
  routeType: RouteType
): RouteMetrics {
  let totalDistance = 0;
  let totalCost = 0;
  let totalElevGain = 0;
  let totalElevLoss = 0;
  let maxSlope = 0;
  let sumSlope = 0;
  let cautionCount = 0;
  let hazardCount = 0;
  const visitedScienceIds: number[] = [];

  for (let i = 0; i < path.length; i++) {
    const { node, stepDistM, stepCost } = path[i];
    totalDistance += stepDistM;
    totalCost += stepCost;
    sumSlope += node.slope;
    if (node.slope > maxSlope) maxSlope = node.slope;
    const hl = hazardLevelOf(node);
    if (hl === 1) cautionCount++;
    else if (hl === 2) hazardCount++;
    if (node.science) visitedScienceIds.push(node.id);
    if (i > 0) {
      const diff = node.elev - path[i - 1].node.elev;
      if (diff > 0) totalElevGain += diff;
      else totalElevLoss += Math.abs(diff);
    }
  }

  const avgSlope = path.length ? Number((sumSlope / path.length).toFixed(1)) : 0;
  const { minutes: walkMins, formatted: formattedWalkTime } = estimateMartianWalkTime(
    totalDistance,
    totalElevGain,
    avgSlope
  );

  let score = 100;
  if (path.length > 0) {
    score -= (hazardCount / path.length) * 85;
    score -= (cautionCount / path.length) * 25;
  }
  if (maxSlope > 15) score -= (maxSlope - 15) * 2; // should never happen — blocked nodes excluded
  const safetyScore = Math.max(5, Math.min(100, Math.round(score)));

  const distKm = (totalDistance / 1000).toFixed(2);
  let whySentence: string;
  if (routeType === 'lower-slope') {
    whySentence =
      `Natasha's C(t)=(C_terrain×μ)+W_science minimized: corridor keeps ${path.length} nodes ` +
      `at avg slope ${avgSlope}° (max ${maxSlope.toFixed(1)}°), hard-avoids all >15° blocked zones ` +
      `over ${distKm} km. Total mission cost ΣC(t) = ${totalCost.toFixed(1)}.`;
  } else if (routeType === 'shortest') {
    whySentence =
      `Geometric baseline ignoring terrain cost: ${distKm} km in ${formattedWalkTime}, ` +
      `crossing ${cautionCount} caution and ${hazardCount} risk nodes (peak ${maxSlope.toFixed(1)}°). ` +
      `Blocked (>15°) nodes excluded by hard constraint.`;
  } else {
    const n = visitedScienceIds.length;
    whySentence =
      `Science-weighted corridor (W_science = −3.5) diverts through ${n} NASA sample target${n === 1 ? '' : 's'} ` +
      `(P${visitedScienceIds.join(', P')}) at avg slope ${avgSlope}°, safety ${safetyScore}/100, ` +
      `ΣC(t) = ${totalCost.toFixed(1)}.`;
  }

  return {
    distanceMeters: Math.round(totalDistance),
    distanceKm: Number(distKm),
    estimatedWalkTimeMinutes: walkMins,
    formattedWalkTime,
    elevationGainMeters: Math.round(totalElevGain),
    elevationLossMeters: Math.round(totalElevLoss),
    maxSlopeDegrees: Number(maxSlope.toFixed(1)),
    avgSlopeDegrees: avgSlope,
    cautionCellCount: cautionCount,
    hazardCellCount: hazardCount,
    unknownCellPercentage: 0,
    safetyScore,
    totalCost: Number(totalCost.toFixed(2)),
    whySentence,
    visitedScienceIds,
  };
}

const ROUTE_LABEL: Record<RouteType, string> = {
  'lower-slope': 'Lower Slope Corridor',
  shortest: 'Shortest Direct Baseline',
  'science-stop': 'Science Exploration Corridor',
};

const ROUTE_COLOR: Record<RouteType, string> = {
  'lower-slope': '#3DDC84',
  shortest: '#F5C542',
  'science-stop': '#4DE3F0',
};

/**
 * A* / Dijkstra over the terrain graph.
 * Returns null when start/dest is blocked or no corridor exists.
 */
export function findPath(
  startId: number,
  destId: number,
  graph: TerrainGraph,
  options: RouteEngineOptions
): RouteResult | null {
  const startTime = performance.now();
  const { routeType } = options;
  const isDijkstra = options.algorithm === 'Dijkstra';

  if (!graph.nodes.has(startId) || !graph.nodes.has(destId)) return null;

  // Start equals goal
  if (startId === destId) {
    const node = graph.nodes.get(startId)!;
    const rp = toRoutePoint(node, 0, 0, 0);
    const metrics = analyzeRoute([{ node, stepDistM: 0, stepCost: 0 }], routeType);
    return makeResult(routeType, [rp], metrics, options.algorithm || 'A*', startTime);
  }

  const dist = new Map<number, number>();
  const parent = new Map<number, number>();
  const closed = new Set<number>();
  for (const id of graph.nodes.keys()) dist.set(id, Infinity);
  dist.set(startId, 0);

  const pq = new MinHeap<number>();
  pq.push(startId, isDijkstra ? 0 : heuristic(startId, destId, graph, routeType));

  let found = false;
  while (!pq.isEmpty()) {
    const u = pq.pop()!;
    if (closed.has(u)) continue;
    closed.add(u);
    if (u === destId) {
      found = true;
      break;
    }
    const du = dist.get(u)!;
    for (const e of graph.adjacency.get(u)!) {
      if (closed.has(e.to)) continue;
      const v = graph.nodes.get(e.to)!;
      const cost = edgeCost(v, e.distM, routeType);
      if (!isFinite(cost)) continue;
      const nd = du + cost;
      if (nd < dist.get(e.to)!) {
        dist.set(e.to, nd);
        parent.set(e.to, u);
        pq.push(e.to, nd + (isDijkstra ? 0 : heuristic(e.to, destId, graph, routeType)));
      }
    }
  }

  if (!found) return null;

  // Reconstruct
  const ids: number[] = [];
  let cur: number | undefined = destId;
  while (cur !== undefined) {
    ids.push(cur);
    cur = parent.get(cur);
  }
  ids.reverse();

  const path: { node: TerrainPoint; stepDistM: number; stepCost: number }[] = [];
  const points: RoutePoint[] = [];
  let cumDist = 0;
  let cumGain = 0;
  for (let i = 0; i < ids.length; i++) {
    const node = graph.nodes.get(ids[i])!;
    let stepDistM = 0;
    let stepCost = 0;
    if (i > 0) {
      const prev = graph.nodes.get(ids[i - 1])!;
      stepDistM = haversineM(prev.lat, prev.lon, node.lat, node.lon);
      stepCost = edgeCost(node, stepDistM, routeType);
      cumDist += stepDistM;
      const dElev = node.elev - prev.elev;
      if (dElev > 0) cumGain += dElev;
    }
    path.push({ node, stepDistM, stepCost });
    points.push(toRoutePoint(node, stepDistM, cumDist, cumGain, stepCost));
  }

  const metrics = analyzeRoute(path, routeType);
  return makeResult(routeType, points, metrics, options.algorithm || 'A*', startTime);
}

function toRoutePoint(
  node: TerrainPoint,
  stepDistM: number,
  cumDist: number,
  cumGain: number,
  stepCost = 0
): RoutePoint {
  return {
    id: node.id,
    lat: node.lat,
    lon: node.lon,
    elevation: Math.round(node.elev),
    slope: Number(node.slope.toFixed(1)),
    soil: node.soil,
    mineral: node.mineral,
    science: node.science,
    stepDistanceMeters: Math.round(stepDistM),
    cumulativeDistanceMeters: Math.round(cumDist),
    cumulativeElevationGain: Math.round(cumGain),
    stepCost: Number(stepCost.toFixed(2)),
    hazardLevel: hazardLevelOf(node),
    category: categoryOf(node),
  };
}

function makeResult(
  routeType: RouteType,
  points: RoutePoint[],
  metrics: RouteMetrics,
  algorithmUsed: 'A*' | 'Dijkstra',
  startTime: number
): RouteResult {
  return {
    id: `route-${Date.now()}`,
    type: routeType,
    label: ROUTE_LABEL[routeType],
    color: ROUTE_COLOR[routeType],
    points,
    metrics,
    algorithmUsed,
    executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
    timestamp: new Date().toISOString(),
  };
}

// Re-export for panels that display the matrix
export { nodeCostFactor, terrainCost, MU_FRICTION, W_SCIENCE };
