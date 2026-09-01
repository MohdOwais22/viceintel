'use client';
import React, { useState } from 'react';
import { Vehicle } from '../types';
import { UnitToggleSwitch } from './UnitToggleSwitch';
import { getStoredUnitPreference, setStoredUnitPreference, convertSpeed, UnitSystem } from '../lib/unitConverter';
import { getCacheBustedImageUrl } from '../lib/imageCacheBuster';
import { X, Gauge, Zap, ShieldAlert, Tag, Award, Compass, Car } from 'lucide-react';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  unitSystem?: UnitSystem;
  onUnitChange?: (unit: UnitSystem) => void;
  onClose: () => void;
  onCompare: (v: Vehicle) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  unitSystem: propsUnitSystem,
  onUnitChange,
  onClose,
  onCompare,
}) => {
  const [localUnit, setLocalUnit] = useState<UnitSystem>(getStoredUnitPreference());
  const currentUnit = propsUnitSystem || localUnit;

  const handleUnitToggle = (unit: UnitSystem) => {
    setLocalUnit(unit);
    setStoredUnitPreference(unit);
    if (onUnitChange) {
      onUnitChange(unit);
    }
  };

  if (!vehicle) return null;

  const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(vehicle.price);
  const formattedTradePrice = vehicle.tradePrice
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(vehicle.tradePrice)
    : null;

  const convertedSpeed = convertSpeed(vehicle.topSpeedMph, currentUnit);
  const speedUnitLabel = currentUnit === 'metric' ? 'KM/H' : 'MPH';

  const pseoRoute = `/vehicles/${vehicle.category.toLowerCase()}/${vehicle.slug}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Top Header Navigation Bar */}
        <div className="bg-zinc-950 px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {vehicle.brand} • {vehicle.category}
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                {formattedPrice}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {vehicle.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <UnitToggleSwitch unitSystem={currentUnit} onChange={handleUnitToggle} compact />
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Hero Vehicle Image */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner group shrink-0">
            <img
              key={`${vehicle.id}-${vehicle.imageVersion || vehicle.updatedAt || vehicle.imageUrl}`}
              src={getCacheBustedImageUrl(vehicle.imageUrl, vehicle.imageVersion || vehicle.updatedAt)}
              alt={vehicle.name}
              className="w-full h-full object-cover object-center transition duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30" />
            
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <span className="px-3 py-1 rounded-lg bg-zinc-900/90 text-zinc-300 text-xs font-bold border border-zinc-700/60 backdrop-blur-md">
                Dealer: {vehicle.dealer}
              </span>
              <span className="px-3 py-1 rounded-lg bg-rose-600/90 text-white text-xs font-black uppercase border border-rose-500/60 backdrop-blur-md">
                {vehicle.category}
              </span>
            </div>
          </div>

          {/* Canonical SEO Bar */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-300 min-w-0">
              <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">
                Canonical SEO Route:{' '}
                <code className="text-cyan-300 font-mono bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
                  {pseoRoute}
                </code>
              </span>
            </div>
            <button
              onClick={() => onCompare(vehicle)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-rose-600/20"
            >
              <Car className="w-3.5 h-3.5" /> Compare 1v1
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Vehicle Description & Technical Specifications
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/60">
              {vehicle.description}
            </p>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>Top Speed</span>
              </div>
              <p className="text-xl font-bold text-white">{convertedSpeed} <span className="text-xs font-normal text-zinc-400">{speedUnitLabel}</span></p>
            </div>

            <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                <span>Acceleration</span>
              </div>
              <p className="text-xl font-bold text-white">{vehicle.acceleration}<span className="text-xs font-normal text-zinc-400">/100</span></p>
            </div>

            <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                <span>Handling</span>
              </div>
              <p className="text-xl font-bold text-white">{vehicle.handling}<span className="text-xs font-normal text-zinc-400">/100</span></p>
            </div>

            <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Drivetrain</span>
              </div>
              <p className="text-xl font-bold text-white">{vehicle.drivetrain}</p>
            </div>
          </div>

          {/* Trade Price & Conditions */}
          {formattedTradePrice && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 flex items-start gap-3 shadow-lg">
              <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">Trade Price Unlock: {formattedTradePrice}</h4>
                <p className="text-xs text-emerald-200/80 mt-0.5">{vehicle.tradePriceCondition}</p>
              </div>
            </div>
          )}

          {/* Dealer Info */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs text-zinc-400">
            <span>Official Dealer: <strong className="text-zinc-200">{vehicle.dealer}</strong></span>
            <span>Est. Mod Budget: <strong className="text-zinc-200">${vehicle.baseModdingBudget.toLocaleString('en-US')}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
