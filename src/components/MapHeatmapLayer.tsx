'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface HeatmapPoint {
  id: string;
  name: string;
  x: number; // 0 - 100 map percentage
  y: number; // 0 - 100 map percentage
  intensity: number; // 0.0 - 1.0
  type: 'business' | 'crime' | 'hybrid';
  dailyIncome: number; // $ per day from ROI calculation
  crimeRate: string;
  district: string;
  mapSource: 'gtav' | 'gtavi' | 'both';
}

export const HEATMAP_POINTS_DATA: HeatmapPoint[] = [
  // GTA VI Vice City Hotspots
  {
    id: 'hp1',
    name: 'Malibu Club Oceanfront',
    x: 75,
    y: 59,
    intensity: 0.88,
    type: 'business',
    dailyIncome: 120000,
    crimeRate: 'High Nightlife Contraband',
    district: 'Vice Beach',
    mapSource: 'gtavi'
  },
  {
    id: 'hp2',
    name: 'Port Gellhorn Container Terminal',
    x: 12,
    y: 66,
    intensity: 0.95,
    type: 'business',
    dailyIncome: 240000,
    crimeRate: 'Severe Vehicle Grand Theft & Smuggling',
    district: 'Port Gellhorn',
    mapSource: 'gtavi'
  },
  {
    id: 'hp3',
    name: 'Starfish Island Vercetti Estate',
    x: 56,
    y: 52,
    intensity: 0.82,
    type: 'business',
    dailyIncome: 180000,
    crimeRate: 'Syndicate Money Laundering & Private Docks',
    district: 'Starfish Island',
    mapSource: 'gtavi'
  },
  {
    id: 'hp4',
    name: 'Grassrivers Mobile Acid Lab',
    x: 19,
    y: 42,
    intensity: 0.96,
    type: 'business',
    dailyIncome: 310000,
    crimeRate: 'Illicit Swamp Lab Operations',
    district: 'Everglades / Keys',
    mapSource: 'gtavi'
  },
  {
    id: 'hp5',
    name: 'Little Haiti Arms Depot & Range',
    x: 31,
    y: 44,
    intensity: 0.84,
    type: 'crime',
    dailyIncome: 150000,
    crimeRate: 'Turf War & Weapons Trafficking',
    district: 'Little Haiti',
    mapSource: 'gtavi'
  },
  {
    id: 'hp6',
    name: 'Ocean Drive Art Deco Strip',
    x: 77,
    y: 72,
    intensity: 0.90,
    type: 'crime',
    dailyIncome: 210000,
    crimeRate: 'Jewelry Heists & High-Value Mugging',
    district: 'Vice Beach',
    mapSource: 'gtavi'
  },
  {
    id: 'hp7',
    name: 'Downtown First National Vault',
    x: 32,
    y: 28,
    intensity: 0.98,
    type: 'crime',
    dailyIncome: 450000,
    crimeRate: 'Maximum Threat Armed Vault Robbery',
    district: 'Downtown Vice',
    mapSource: 'gtavi'
  },
  {
    id: 'hp8',
    name: 'Leonida Keys Reef Smuggling Base',
    x: 48,
    y: 96,
    intensity: 0.92,
    type: 'hybrid',
    dailyIncome: 290000,
    crimeRate: 'International Coast Guard Smuggling',
    district: 'Everglades / Keys',
    mapSource: 'gtavi'
  }
];

interface MapHeatmapLayerProps {
  mode: 'business' | 'crime' | 'all';
  sourceType?: 'gtav' | 'gtavi';
  opacity?: number; // 0.1 to 1.0
  onSelectHotspot?: (point: HeatmapPoint) => void;
}

export const MapHeatmapLayer: React.FC<MapHeatmapLayerProps> = ({
  mode,
  sourceType = 'gtavi',
  opacity = 0.85,
  onSelectHotspot
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<HeatmapPoint | null>(null);

  const filteredPoints = HEATMAP_POINTS_DATA.filter(p => {
    // Match Map Source
    const matchesSource = !p.mapSource || p.mapSource === 'both' || p.mapSource === sourceType;
    if (!matchesSource) return false;

    // Match Activity Mode
    if (mode === 'all') return true;
    if (mode === 'business') return p.type === 'business' || p.type === 'hybrid';
    if (mode === 'crime') return p.type === 'crime' || p.type === 'hybrid';
    return true;
  });

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // D3 Color Interpolator based on heatmap mode
    const colorScale = d3.scaleSequential(
      mode === 'business' ? d3.interpolateYlGn : mode === 'crime' ? d3.interpolateYlOrRd : d3.interpolateTurbo
    ).domain([0, 1]);

    const defs = svg.append('defs');

    // Render radial gradient defs for each point using D3
    filteredPoints.forEach((point) => {
      const gradientId = `heatmap-grad-${point.id}`;
      const grad = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      const coreColor = colorScale(point.intensity);
      const outerColor = colorScale(point.intensity * 0.4);

      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', coreColor)
        .attr('stop-opacity', point.intensity * 0.85);

      grad.append('stop')
        .attr('offset', '45%')
        .attr('stop-color', outerColor)
        .attr('stop-opacity', point.intensity * 0.4);

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', coreColor)
        .attr('stop-opacity', 0);
    });

    const layerGroup = svg.append('g').attr('class', 'd3-heatmap-layer');

    // Draw Heatmap halos
    filteredPoints.forEach((point) => {
      const radius = 10 + point.intensity * 12; // Percentage units

      // Outer Heat Halo (using screen mix-blend mode so background terrain and roads stay clearly visible)
      layerGroup.append('circle')
        .attr('cx', `${point.x}%`)
        .attr('cy', `${point.y}%`)
        .attr('r', `${radius}%`)
        .attr('fill', `url(#heatmap-grad-${point.id})`)
        .style('mix-blend-mode', 'screen')
        .style('pointer-events', 'none');

      // Core Interactive Heat Node
      const coreNode = layerGroup.append('circle')
        .attr('cx', `${point.x}%`)
        .attr('cy', `${point.y}%`)
        .attr('r', `${1.8 + point.intensity * 1.4}%`)
        .attr('fill', colorScale(point.intensity))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', '0.4')
        .style('cursor', 'pointer')
        .style('filter', 'drop-shadow(0px 0px 6px rgba(255,255,255,0.7))');

      coreNode.on('mouseenter', () => {
        setHoveredPoint(point);
      });

      coreNode.on('mouseleave', () => {
        setHoveredPoint(null);
      });

      coreNode.on('click', (e) => {
        e.stopPropagation();
        if (onSelectHotspot) onSelectHotspot(point);
      });
    });

  }, [mode, sourceType, filteredPoints]);

  return (
    <div className="absolute inset-0 pointer-events-none z-15 transition-opacity duration-300" style={{ opacity }}>
      <svg ref={svgRef} className="w-full h-full pointer-events-auto" viewBox="0 0 100 100" preserveAspectRatio="none" />

      {/* Interactive D3 Hover Tooltip */}
      {hoveredPoint && (
        <div
          style={{ top: `${hoveredPoint.y}%`, left: `${hoveredPoint.x}%` }}
          className="absolute -translate-x-1/2 -translate-y-full mb-3 pointer-events-none z-50 animate-fade-in"
        >
          <div className="bg-zinc-950/95 border border-emerald-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[210px] space-y-1 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
              <span className="font-extrabold text-white">{hoveredPoint.name}</span>
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                hoveredPoint.type === 'business' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                hoveredPoint.type === 'crime' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {hoveredPoint.type}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-zinc-400 font-bold">ROI Daily Yield:</span>
              <span className="text-emerald-400 font-mono font-black">${hoveredPoint.dailyIncome.toLocaleString()}/day</span>
            </div>

            <div className="flex justify-between items-center text-[10px]">
              <span className="text-zinc-500">Activity Level:</span>
              <span className="text-rose-400 font-bold">{hoveredPoint.crimeRate}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] pt-1 border-t border-zinc-900 text-zinc-500">
              <span>District Sector:</span>
              <span className="text-cyan-400 font-bold font-mono">{hoveredPoint.district}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] text-zinc-500">
              <span>Heat Density:</span>
              <span className="text-amber-400 font-bold font-mono">{Math.round(hoveredPoint.intensity * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
