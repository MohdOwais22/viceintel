'use client';
import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Eye, EyeOff, Info } from 'lucide-react';

interface LeonidaMapLegendProps {
  showRoads?: boolean;
  showDistricts?: boolean;
  showTopography?: boolean;
  showWaterways?: boolean;
  showCountyBorders?: boolean;
  showBuildings?: boolean;
  showMetro?: boolean;
  showGrid?: boolean;
  onToggleRoads?: () => void;
  onToggleDistricts?: () => void;
  onToggleTopography?: () => void;
  onToggleWaterways?: () => void;
  onToggleCountyBorders?: () => void;
  onToggleBuildings?: () => void;
  onToggleMetro?: () => void;
  onToggleGrid?: () => void;
  className?: string;
}

export const LeonidaMapLegend: React.FC<LeonidaMapLegendProps> = ({
  showRoads = true,
  showDistricts = true,
  showTopography = true,
  showWaterways = true,
  showCountyBorders = true,
  showBuildings = true,
  showMetro = true,
  showGrid = true,
  onToggleRoads,
  onToggleDistricts,
  onToggleTopography,
  onToggleWaterways,
  onToggleCountyBorders,
  onToggleBuildings,
  onToggleMetro,
  onToggleGrid,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'layers' | 'symbols' | 'grid'>('symbols');

  return (
    <div
      className={`bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 text-xs ${className}`}
      style={{ maxWidth: isCollapsed ? '160px' : '260px' }}
    >
      {/* Header bar */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-b border-zinc-800 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
          <span className="font-mono font-black text-white text-[11px] tracking-wide uppercase">
            Leonida Cartography
          </span>
        </div>
        <button
          type="button"
          aria-label={isCollapsed ? "Expand legend" : "Collapse legend"}
          className="text-zinc-400 group-hover:text-white transition"
        >
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-3 space-y-3 max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
          {/* Sub Tab Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => setActiveTab('symbols')}
              className={`py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                activeTab === 'symbols' ? 'bg-cyan-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Key
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                activeTab === 'layers' ? 'bg-cyan-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Layers
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                activeTab === 'grid' ? 'bg-cyan-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Grid
            </button>
          </div>

          {/* TAB 1: SYMBOLS & SPECULATION KEY (EXACT REPLICA OF THE LEONIDA MAPPING PROJECT) */}
          {activeTab === 'symbols' && (
            <div className="space-y-3 text-[11px]">
              {/* Infrastructure Key */}
              <div>
                <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-1 mb-1.5 flex justify-between">
                  <span>Standard</span>
                  <span className="text-rose-400">Speculation</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-slate-500 rounded" />
                      <span className="text-zinc-300">Road</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-300">Spec Road</span>
                      <div className="w-4 h-0.5 bg-rose-500 rounded" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-slate-700 rounded" />
                      <span className="text-zinc-300">Highway</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-300">Spec Highway</span>
                      <div className="w-4 h-1 bg-red-600 rounded" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-zinc-600 rounded" />
                      <span className="text-zinc-300">Metro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300">Metro Mule</span>
                      <div className="w-4 h-1 bg-yellow-400 rounded" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 border-b border-dashed border-zinc-400" />
                      <span className="text-zinc-300">Railway</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300">County Border</span>
                      <div className="w-4 h-0.5 border-b border-dashed border-cyan-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Landmass & Terrain Colors */}
              <div>
                <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-1 mb-1.5">
                  Terrain & Zoning
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-[#c2ceb9] border border-zinc-600 shrink-0" />
                    <span className="text-[10px] text-zinc-300">Urban Land</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-[#8bc27c] border border-zinc-600 shrink-0" />
                    <span className="text-[10px] text-zinc-300">Rural Land</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-[#74a4cf] border border-zinc-600 shrink-0" />
                    <span className="text-[10px] text-zinc-300">Water Body</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-[#ede3ad] border border-zinc-600 shrink-0" />
                    <span className="text-[10px] text-zinc-300">Sandy Beach</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-[#eb3b3b] border border-zinc-600 shrink-0" />
                    <span className="text-[10px] text-rose-300">Spec Building</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-[#5a7d52] border border-zinc-600 shrink-0" />
                    <span className="text-[10px] text-emerald-300">Highlands (10m+)</span>
                  </div>
                </div>
              </div>

              {/* Pin Nomenclature */}
              <div>
                <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-1 mb-1.5">
                  Pin Classifications
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-black border border-white shrink-0" />
                    <span className="text-zinc-200">Confirmed Location (In-Game)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-white shrink-0" />
                    <span className="text-purple-300">Speculative Location (In-Game Name)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shrink-0" />
                    <span className="text-emerald-300">Trailer Camera Position</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white shrink-0" />
                    <span className="text-cyan-300">Water Body / Harbor</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE LAYER TOGGLES */}
          {activeTab === 'layers' && (
            <div className="space-y-1.5">
              <button
                onClick={onToggleRoads}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🛣️</span>
                  <span className="text-zinc-300 font-semibold">Freeways & Spec Roads</span>
                </div>
                {showRoads ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              </button>

              <button
                onClick={onToggleMetro}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🚇</span>
                  <span className="text-zinc-300 font-semibold">Metro Mule Transit</span>
                </div>
                {showMetro ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              </button>

              <button
                onClick={onToggleCountyBorders}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🗺️</span>
                  <span className="text-zinc-300 font-semibold">County Boundaries</span>
                </div>
                {showCountyBorders ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              </button>

              <button
                onClick={onToggleDistricts}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏷️</span>
                  <span className="text-zinc-300 font-semibold">Town & District Labels</span>
                </div>
                {showDistricts ? <Eye className="w-3.5 h-3.5 text-white" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              </button>

              <button
                onClick={onToggleTopography}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">⛰️</span>
                  <span className="text-zinc-300 font-semibold">Topography & Forests</span>
                </div>
                {showTopography ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              </button>

              <button
                onClick={onToggleWaterways}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🌊</span>
                  <span className="text-zinc-300 font-semibold">Lakes & Canals</span>
                </div>
                {showWaterways ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              </button>

              <button
                onClick={onToggleBuildings}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏢</span>
                  <span className="text-zinc-300 font-semibold">Airports & Buildings</span>
                </div>
                {showBuildings ? <Eye className="w-3.5 h-3.5 text-red-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              </button>

              <button
                onClick={onToggleGrid}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🧭</span>
                  <span className="text-zinc-300 font-semibold">Rockstar Grid Lines</span>
                </div>
                {showGrid ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              </button>
            </div>
          )}

          {/* TAB 3: ROCKSTAR INTERNAL GRID REFERENCE GUIDE */}
          {activeTab === 'grid' && (
            <div className="space-y-2 text-[10px] text-zinc-300 leading-relaxed">
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="font-mono font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Grid Notation Guide</span>
                </div>
                <p className="text-zinc-400">
                  The letters & numbers in the grid are Rockstar&apos;s internal naming convention for each map square:
                </p>
                <div className="mt-1.5 space-y-1 font-mono text-[9px] bg-zinc-950 p-1.5 rounded border border-zinc-850 text-cyan-300">
                  <div>s01 = South of 0 origin</div>
                  <div>e01 = East of 0 origin</div>
                  <div>n08 e07 = 8 north, 7 east</div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="font-mono font-bold text-cyan-400 mb-1">Region Tag Identifiers</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[9px] text-zinc-400">
                  <div><span className="text-white">sb:</span> South Beach</div>
                  <div><span className="text-white">nm:</span> North Miami</div>
                  <div><span className="text-white">tw:</span> Town Interior</div>
                  <div><span className="text-white">po:</span> Vice Port</div>
                  <div><span className="text-white">ap:</span> Airport</div>
                  <div><span className="text-white">lo:</span> Lake Leonida</div>
                  <div><span className="text-white">vk:</span> Virginia Key</div>
                  <div><span className="text-white">ky:</span> Leonida Keys</div>
                </div>
              </div>

              <div className="text-[9px] text-zinc-500 italic pt-1 border-t border-zinc-800/80">
                Cartography based on the GTA VI Community Mapping Project.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
