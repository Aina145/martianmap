/**
 * Unit tests for RED ARES Route Engine (graph version)
 * Data: Natasha's 50 real points. Cost: Total_Cost = (C_terrain × μ) × α_science.
 */

import { describe, it, expect } from 'vitest';
import { findPath, MinHeap, edgeCost } from './routeEngine';
import {
  buildGraph,
  TERRAIN_POINTS,
  TerrainGraph,
  TerrainPoint,
} from '../data/terrain';

const realGraph = buildGraph(TERRAIN_POINTS, 400);

// Helper: tiny synthetic graph for exact cost assertions
function makePoint(id: number, slope: number, soil: TerrainPoint['soil'], science = false): TerrainPoint {
  return { id, lat: 18.44 + id * 0.001, lon: 77.43, elev: -2500, slope, soil, mineral: 'none', science };
}

function makeGraph(points: TerrainPoint[], links: [number, number][]): TerrainGraph {
  const nodes = new Map(points.map((p) => [p.id, p]));
  const adjacency = new Map<number, { to: number; distM: number }[]>();
  for (const p of points) adjacency.set(p.id, []);
  // fixed 100 m edges for predictable math
  for (const [a, b] of links) {
    adjacency.get(a)!.push({ to: b, distM: 100 });
    adjacency.get(b)!.push({ to: a, distM: 100 });
  }
  return { nodes, adjacency, blockedIds: [], edgeThresholdM: 400 };
}

describe('MinHeap Priority Queue', () => {
  it('correctly pops elements in ascending priority order', () => {
    const heap = new MinHeap<string>();
    heap.push('c', 30);
    heap.push('a', 10);
    heap.push('b', 20);
    heap.push('z', 5);

    expect(heap.pop()).toBe('z');
    expect(heap.pop()).toBe('a');
    expect(heap.pop()).toBe('b');
    expect(heap.pop()).toBe('c');
    expect(heap.isEmpty()).toBe(true);
  });
});

describe("Natasha's cost matrix (exact values)", () => {
  const flat = makePoint(1, 3.0, 'bedrock'); // band 0: C=1.0, μ=1.0
  const strain = makePoint(2, 10.0, 'compact_regolith'); // band 1: C=2.5, μ=1.4
  const risk = makePoint(3, 14.0, 'aeolian_dunes'); // band 2: C=5.0, μ=3.0
  const sci = makePoint(4, 4.0, 'bedrock', true); // band 0 + science

  it('lower-slope: dist × C_terrain × μ', () => {
    expect(edgeCost(flat, 100, 'lower-slope')).toBe(100); // 100×1.0×1.0
    expect(edgeCost(strain, 100, 'lower-slope')).toBe(350); // 100×2.5×1.4
    expect(edgeCost(risk, 100, 'lower-slope')).toBe(1500); // 100×5.0×3.0
  });

  it('science-stop: multiplies by α_science = 0.3 on target nodes only', () => {
    expect(edgeCost(sci, 100, 'science-stop')).toBe(30); // 100 × 0.3
    expect(edgeCost(flat, 100, 'science-stop')).toBe(100); // no bonus
  });

  it('shortest: pure distance', () => {
    expect(edgeCost(risk, 100, 'shortest')).toBe(100);
  });
});

describe('Route Engine Requirements', () => {
  it('1. Start equals goal: single point, zero distance', () => {
    const result = findPath(1, 1, realGraph, { routeType: 'lower-slope' });
    expect(result).not.toBeNull();
    expect(result?.points.length).toBe(1);
    expect(result?.points[0].id).toBe(1);
    expect(result?.metrics.distanceMeters).toBe(0);
  });

  it('2. Blocked start or dest (>15°): returns null', () => {
    // P22 has slope 15.5° — blocked, not in graph
    expect(findPath(22, 50, realGraph, { routeType: 'lower-slope' })).toBeNull();
    expect(findPath(1, 46, realGraph, { routeType: 'lower-slope' })).toBeNull();
  });

  it('3. Blocked nodes never appear on any route', () => {
    const result = findPath(1, 50, realGraph, { routeType: 'lower-slope' });
    expect(result).not.toBeNull();
    const ids = result!.points.map((p) => p.id);
    for (const b of [22, 23, 24, 46]) expect(ids).not.toContain(b);
    // every node on route respects the hard constraint
    for (const p of result!.points) expect(p.slope).toBeLessThanOrEqual(15);
  });

  it('4. Full transect P1→P50 is routable and visits science targets', () => {
    const lower = findPath(1, 50, realGraph, { routeType: 'lower-slope' });
    const science = findPath(1, 50, realGraph, { routeType: 'science-stop' });
    expect(lower).not.toBeNull();
    expect(science).not.toBeNull();
    expect(lower!.points[0].id).toBe(1);
    expect(lower!.points[lower!.points.length - 1].id).toBe(50);
    // science-stop should hit at least as many targets as lower-slope
    expect(science!.metrics.visitedScienceIds.length).toBeGreaterThanOrEqual(
      lower!.metrics.visitedScienceIds.length
    );
    expect(science!.metrics.visitedScienceIds.length).toBeGreaterThan(0);
  });

  it('5. A* total cost equals Dijkstra total cost (both optimal)', () => {
    const astar = findPath(1, 50, realGraph, { routeType: 'lower-slope', algorithm: 'A*' });
    const dijkstra = findPath(1, 50, realGraph, { routeType: 'lower-slope', algorithm: 'Dijkstra' });
    expect(astar).not.toBeNull();
    expect(dijkstra).not.toBeNull();
    expect(astar!.metrics.totalCost).toBeCloseTo(dijkstra!.metrics.totalCost, 6);
    expect(astar!.metrics.distanceMeters).toBe(dijkstra!.metrics.distanceMeters);
  });

  it('6. Detour preference: engine avoids a high-cost dune node when a bedrock alternative exists', () => {
    // 1 -- 2(dune, steep) -- 4  vs  1 -- 3(bedrock, flat) -- 4
    const pts = [
      makePoint(1, 2, 'bedrock'),
      makePoint(2, 14, 'aeolian_dunes'),
      makePoint(3, 2, 'bedrock'),
      makePoint(4, 2, 'bedrock'),
    ];
    const g = makeGraph(pts, [
      [1, 2],
      [2, 4],
      [1, 3],
      [3, 4],
    ]);
    const r = findPath(1, 4, g, { routeType: 'lower-slope' });
    expect(r).not.toBeNull();
    expect(r!.points.map((p) => p.id)).toEqual([1, 3, 4]);
  });
});
