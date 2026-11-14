/**
 * RED ARES — Bottom Bar
 * Cartographic metadata, live node readout, and dataset credits.
 */

import React, { useMemo } from 'react';
import { TERRAIN_POINTS } from '../../data/terrain';

interface BottomBarProps {
  hoveredId: number | null;
}

const nodeById = new Map(TERRAIN_POINTS.map((p) => [p.id, p]));

export const BottomBar: React.FC<BottomBarProps> = ({ hoveredId }) => {
  const readout = useMemo(() => {
    if (hoveredId == null) return null;
    const p = nodeById.get(hoveredId);
    if (!p) return null;
    return p;
  }, [hoveredId]);

  return (
    <div className="h-9 bg-[#0B1220] border-t border-[#243552] px-4 flex items-center justify-between text-[10px] font-mono text-slate-500 z-20">
      <div className="flex items-center gap-4">
        <span>
          CRS: <span className="text-slate-300">MARS AREODETIC</span>
        </span>
        <span className="hidden md:inline">
          DATUM: <span className="text-slate-300">MOLA MEGDR</span>
        </span>
        {readout ? (
          <span className="text-[#4DE3F0]">
            P{readout.id} · {readout.lat.toFixed(5)}°N {readout.lon.toFixed(5)}°E · {readout.elev}m ·{' '}
            {readout.slope.toFixed(1)}°{readout.slope > 15 ? ' BLOCKED' : ''}
            {readout.science ? ' · SCIENCE' : ''}
          </span>
        ) : (
          <span className="text-slate-600">Hover a node for live readout</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden md:inline">
          DATA: <span className="text-slate-300">jezero_terrain_matrix.csv · 50 PTS · REAL</span>
        </span>
        <span>
          Total_Cost = <span className="text-slate-300">(C_terrain × μ) × α_science</span>
        </span>
      </div>
    </div>
  );
};
