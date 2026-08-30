'use client';
import React from 'react';
import { UnitSystem } from '../lib/unitConverter';
import { Gauge, Globe } from 'lucide-react';

interface UnitToggleSwitchProps {
  unitSystem: UnitSystem;
  onChange: (unit: UnitSystem) => void;
  className?: string;
  compact?: boolean;
}

export const UnitToggleSwitch: React.FC<UnitToggleSwitchProps> = ({
  unitSystem,
  onChange,
  className = '',
  compact = false,
}) => {
  return (
    <div
      className={`inline-flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 shadow-inner ${className}`}
      role="group"
      aria-label="Unit system selection toggle"
    >
      <button
        type="button"
        onClick={() => onChange('imperial')}
        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
          unitSystem === 'imperial'
            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
            : 'text-zinc-400 hover:text-white'
        }`}
        title="Display stats in Imperial units (MPH, Yards, Feet)"
      >
        <Gauge className="w-3.5 h-3.5" />
        <span>{compact ? 'MPH' : 'Imperial (MPH)'}</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('metric')}
        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
          unitSystem === 'metric'
            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
            : 'text-zinc-400 hover:text-white'
        }`}
        title="Display stats in Metric units (KM/H, Meters)"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{compact ? 'KM/H' : 'Metric (KM/H)'}</span>
      </button>
    </div>
  );
};
