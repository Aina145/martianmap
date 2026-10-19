/**
 * RED ARES — Elevation Profile Chart
 * Visualizes elevation profile and slope gradients along computed routes.
 */

import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { RouteResult } from '../../types/mars';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ElevationChartProps {
  primaryRoute: RouteResult | null;
  comparisonRoute?: RouteResult | null;
  activeWaypointIndex?: number;
  onWaypointHover?: (index: number | null) => void;
}

export const ElevationChart: React.FC<ElevationChartProps> = ({
  primaryRoute,
  comparisonRoute,
  activeWaypointIndex,
  onWaypointHover,
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!primaryRoute || primaryRoute.points.length === 0) return;

    // Resample or prepare points so chart is snappy
    const pts1 = primaryRoute.points;
    const labels = pts1.map((p) => `${(p.cumulativeDistanceMeters / 1000).toFixed(1)} km`);
    const data1 = pts1.map((p) => p.elevation);

    const datasets: any[] = [
      {
        label: `${primaryRoute.label} (${primaryRoute.metrics.elevationGainMeters}m climb)`,
        data: data1,
        borderColor: primaryRoute.color || '#3DDC84',
        backgroundColor: `${primaryRoute.color || '#3DDC84'}22`,
        borderWidth: 2.5,
        fill: true,
        pointRadius: (ctx: any) => {
          if (activeWaypointIndex !== undefined && ctx.dataIndex === activeWaypointIndex) {
            return 7;
          }
          return 0;
        },
        pointHoverRadius: 6,
        pointBackgroundColor: '#4DE3F0',
        pointBorderColor: '#0B1220',
        pointBorderWidth: 2,
        tension: 0.3,
      },
    ];

    if (comparisonRoute && comparisonRoute.points.length > 0) {
      const pts2 = comparisonRoute.points;
      // Interpolate or map to relative distance
      const data2 = pts2.map((p) => p.elevation);
      datasets.push({
        label: `${comparisonRoute.label} (${comparisonRoute.metrics.elevationGainMeters}m climb)`,
        data: data2,
        borderColor: comparisonRoute.color || '#F5C542',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.3,
      });
    }

    const data: ChartData<'line'> = {
      labels,
      datasets,
    };

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 400,
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#94A3B8',
            font: {
              family: 'Inter, sans-serif',
              size: 11,
            },
            boxWidth: 14,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(19, 28, 46, 0.95)',
          titleColor: '#4DE3F0',
          bodyColor: '#E6EDF3',
          borderColor: '#243552',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            title: (items) => {
              const idx = items[0]?.dataIndex ?? 0;
              const pt = primaryRoute.points[idx];
              return `P${pt.id} · Distance: ${(pt.cumulativeDistanceMeters / 1000).toFixed(2)} km · slope ${pt.slope}°`;
            },
            label: (item) => {
              const idx = item.dataIndex;
              const val = item.formattedValue;
              if (item.datasetIndex === 0) {
                const pt = primaryRoute.points[idx];
                return [
                  `Elevation: ${val} m`,
                  `Slope: ${pt.slope.toFixed(1)}° (${pt.category.toUpperCase()})`,
                ];
              } else if (comparisonRoute && comparisonRoute.points[idx]) {
                const pt2 = comparisonRoute.points[idx];
                return [
                  `Elevation: ${val} m`,
                  `Slope: ${pt2.slope.toFixed(1)}° (${pt2.category.toUpperCase()})`,
                ];
              }
              return `Elevation: ${val} m`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(36, 53, 82, 0.4)',
          },
          ticks: {
            color: '#64748B',
            maxTicksLimit: 8,
            font: {
              size: 10,
              family: 'JetBrains Mono, monospace',
            },
          },
          title: {
            display: true,
            text: 'Traverse Distance',
            color: '#64748B',
            font: { size: 10 },
          },
        },
        y: {
          grid: {
            color: 'rgba(36, 53, 82, 0.4)',
          },
          ticks: {
            color: '#64748B',
            font: {
              size: 10,
              family: 'JetBrains Mono, monospace',
            },
            callback: (val) => `${val}m`,
          },
          title: {
            display: true,
            text: 'MOLA Datum Elevation (m)',
            color: '#64748B',
            font: { size: 10 },
          },
        },
      },
      onHover: (_e, elements) => {
        if (elements.length > 0 && onWaypointHover) {
          onWaypointHover(elements[0].index);
        } else if (onWaypointHover) {
          onWaypointHover(null);
        }
      },
    };

    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstanceRef.current = new ChartJS(ctx, {
        type: 'line',
        data,
        options,
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [primaryRoute, comparisonRoute, activeWaypointIndex]);

  if (!primaryRoute || primaryRoute.points.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center border border-dashed border-[#243552] rounded-lg bg-[#0F172A]/50 text-slate-400 text-xs">
        <span>No active route computed</span>
        <span className="text-[10px] text-slate-500 mt-1">Select Start & Destination to generate elevation profile</span>
      </div>
    );
  }

  return (
    <div className="w-full h-48 relative">
      <canvas ref={chartRef} />
    </div>
  );
};
