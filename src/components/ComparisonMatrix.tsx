'use client';
import React, { useState } from 'react';
import { VEHICLES_DATA } from '../data/vehicles';
import { WEAPONS_DATA } from '../data/weapons';
import { Vehicle, Weapon } from '../types';
import { UnitToggleSwitch } from './UnitToggleSwitch';
import { getStoredUnitPreference, setStoredUnitPreference, formatSpeed, formatRange, convertSpeed, UnitSystem } from '../lib/unitConverter';
import { Trophy, GitCompare, Gauge, Crosshair, Zap, DollarSign, ShieldAlert, Check, ShieldCheck, Flame } from 'lucide-react';

interface ComparisonMatrixProps {
  initialVehicleA?: Vehicle;
  initialVehicleB?: Vehicle;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  initialVehicleA = VEHICLES_DATA[0],
  initialVehicleB = VEHICLES_DATA[1],
}) => {
  const [compareMode, setCompareMode] = useState<'vehicles' | 'weapons'>('vehicles');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(getStoredUnitPreference());

  const handleUnitChange = (newUnit: UnitSystem) => {
    setUnitSystem(newUnit);
    setStoredUnitPreference(newUnit);
  };

  // Vehicle state
  const [vehicleA, setVehicleA] = useState<Vehicle>(initialVehicleA);
  const [vehicleB, setVehicleB] = useState<Vehicle>(initialVehicleB);

  // Weapon state
  const [weaponA, setWeaponA] = useState<Weapon>(WEAPONS_DATA[0]);
  const [weaponB, setWeaponB] = useState<Weapon>(WEAPONS_DATA[1]);

  // Vehicle winners
  const getVehicleWinner = (stat: 'topSpeedMph' | 'acceleration' | 'braking' | 'handling' | 'price') => {
    if (stat === 'price') {
      if (vehicleA.price < vehicleB.price) return 'A';
      if (vehicleB.price < vehicleA.price) return 'B';
      return 'TIE';
    }
    if (vehicleA[stat] > vehicleB[stat]) return 'A';
    if (vehicleB[stat] > vehicleA[stat]) return 'B';
    return 'TIE';
  };

  // Weapon winners
  const getWeaponWinner = (stat: 'damage' | 'fireRate' | 'accuracy' | 'range' | 'ttkMs' | 'price') => {
    if (stat === 'price' || stat === 'ttkMs') {
      // Lower is better
      if (weaponA[stat] < weaponB[stat]) return 'A';
      if (weaponB[stat] < weaponA[stat]) return 'B';
      return 'TIE';
    }
    if (weaponA[stat] > weaponB[stat]) return 'A';
    if (weaponB[stat] > weaponA[stat]) return 'B';
    return 'TIE';
  };

  const pseoComparisonSlug =
    compareMode === 'vehicles'
      ? `${vehicleA.slug}-vs-${vehicleB.slug}`
      : `${weaponA.slug}-vs-${weaponB.slug}`;
  const pseoUrl = `/compare/${compareMode}/${pseoComparisonSlug}`;

  return (
    <div className="space-y-6">
      {/* Mode Selector & Header */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">1v1 Dynamic Comparison Matrix</h2>
              <p className="text-xs text-zinc-400">Side-by-side spec evaluation with programmatic SEO route indexing.</p>
            </div>
          </div>

          {/* Mode & Unit Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <UnitToggleSwitch unitSystem={unitSystem} onChange={handleUnitChange} compact />

            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setCompareMode('vehicles')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  compareMode === 'vehicles'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Vehicles (1v1)</span>
              </button>
              <button
                onClick={() => setCompareMode('weapons')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  compareMode === 'weapons'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Weapons (1v1)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Dropdown Selectors */}
        {compareMode === 'vehicles' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Vehicle A */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-rose-400 uppercase tracking-wider">Vehicle #1</label>
              <select
                value={vehicleA.id}
                onChange={(e) => {
                  const found = VEHICLES_DATA.find((v) => v.id === e.target.value);
                  if (found) setVehicleA(found);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                {VEHICLES_DATA.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.name} (${v.price.toLocaleString('en-US')})
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle B */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Vehicle #2</label>
              <select
                value={vehicleB.id}
                onChange={(e) => {
                  const found = VEHICLES_DATA.find((v) => v.id === e.target.value);
                  if (found) setVehicleB(found);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {VEHICLES_DATA.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.name} (${v.price.toLocaleString('en-US')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Weapon A */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-rose-400 uppercase tracking-wider">Weapon #1</label>
              <select
                value={weaponA.id}
                onChange={(e) => {
                  const found = WEAPONS_DATA.find((w) => w.id === e.target.value);
                  if (found) setWeaponA(found);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                {WEAPONS_DATA.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} - {w.category} (${w.price.toLocaleString('en-US')})
                  </option>
                ))}
              </select>
            </div>

            {/* Weapon B */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Weapon #2</label>
              <select
                value={weaponB.id}
                onChange={(e) => {
                  const found = WEAPONS_DATA.find((w) => w.id === e.target.value);
                  if (found) setWeaponB(found);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {WEAPONS_DATA.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} - {w.category} (${w.price.toLocaleString('en-US')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* SEO Link Footer */}
        <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <span>
            Target SEO Route:{' '}
            <code className="text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded font-mono border border-rose-800/40">
              {pseoUrl}
            </code>
          </span>
          <span className="text-emerald-400 font-medium">Auto-indexed 1v1 Matrix Page</span>
        </div>
      </div>

      {/* RENDER VEHICLES MATRIX */}
      {compareMode === 'vehicles' ? (
        <>
          {/* Side by Side Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/90 border border-rose-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-rose-600 text-white font-bold text-[10px] uppercase rounded-bl-xl">
                Contender 1
              </div>
              <img src={vehicleA.imageUrl} alt={vehicleA.name} className="w-full h-44 md:h-48 object-cover object-center rounded-xl border border-zinc-800 bg-zinc-950" referrerPolicy="no-referrer" />
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase">{vehicleA.brand}</span>
                <h3 className="text-2xl font-black text-white">{vehicleA.name}</h3>
                <p className="text-sm font-bold text-emerald-400 mt-1">${vehicleA.price.toLocaleString('en-US')}</p>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-cyan-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-cyan-600 text-white font-bold text-[10px] uppercase rounded-bl-xl">
                Contender 2
              </div>
              <img src={vehicleB.imageUrl} alt={vehicleB.name} className="w-full h-44 md:h-48 object-cover object-center rounded-xl border border-zinc-800 bg-zinc-950" referrerPolicy="no-referrer" />
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase">{vehicleB.brand}</span>
                <h3 className="text-2xl font-black text-white">{vehicleB.name}</h3>
                <p className="text-sm font-bold text-emerald-400 mt-1">${vehicleB.price.toLocaleString('en-US')}</p>
              </div>
            </div>
          </div>

          {/* Stat Comparison Table */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 font-bold text-sm text-white flex items-center justify-between">
              <span>Vehicle Head-to-Head Specification Differential</span>
              <span className="text-xs text-zinc-400">Winner Badges Highlight Advantage</span>
            </div>

            <div className="divide-y divide-zinc-800 text-xs sm:text-sm">
              {/* Top Speed */}
              <div className="grid grid-cols-12 p-4 items-center hover:bg-zinc-800/40 transition">
                <div className="col-span-4 font-semibold text-zinc-300">{vehicleA.name} ({formatSpeed(vehicleA.topSpeedMph, unitSystem)})</div>
                <div className="col-span-4 text-center font-bold text-amber-400">
                  <span className="text-xs text-zinc-400 block uppercase">Top Speed</span>
                  {formatSpeed(vehicleA.topSpeedMph, unitSystem)} vs {formatSpeed(vehicleB.topSpeedMph, unitSystem)}
                </div>
                <div className="col-span-4 text-right font-semibold text-zinc-300 flex items-center justify-end gap-2">
                  <span>{vehicleB.name} ({formatSpeed(vehicleB.topSpeedMph, unitSystem)})</span>
                  {getVehicleWinner('topSpeedMph') === 'A' && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] flex items-center gap-1 border border-rose-500/30">
                      <Trophy className="w-3 h-3 text-rose-400" /> +{Math.abs(convertSpeed(vehicleA.topSpeedMph, unitSystem) - convertSpeed(vehicleB.topSpeedMph, unitSystem)).toFixed(1)} {unitSystem === 'metric' ? 'KM/H' : 'MPH'}
                    </span>
                  )}
                  {getVehicleWinner('topSpeedMph') === 'B' && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center gap-1 border border-cyan-500/30">
                      <Trophy className="w-3 h-3 text-cyan-400" /> +{Math.abs(convertSpeed(vehicleB.topSpeedMph, unitSystem) - convertSpeed(vehicleA.topSpeedMph, unitSystem)).toFixed(1)} {unitSystem === 'metric' ? 'KM/H' : 'MPH'}
                    </span>
                  )}
                </div>
              </div>

              {/* Acceleration */}
              <div className="grid grid-cols-12 p-4 items-center hover:bg-zinc-800/40 transition">
                <div className="col-span-4 font-semibold text-zinc-300">{vehicleA.acceleration} / 100</div>
                <div className="col-span-4 text-center font-bold text-rose-400">
                  <span className="text-xs text-zinc-400 block uppercase">Acceleration Score</span>
                  {vehicleA.acceleration > vehicleB.acceleration ? 'Faster Launch' : vehicleB.acceleration > vehicleA.acceleration ? 'Slower Launch' : 'Equal Launch'}
                </div>
                <div className="col-span-4 text-right font-semibold text-zinc-300 flex items-center justify-end gap-2">
                  <span>{vehicleB.acceleration} / 100</span>
                  {getVehicleWinner('acceleration') === 'A' && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">Winner</span>
                  )}
                  {getVehicleWinner('acceleration') === 'B' && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">Winner</span>
                  )}
                </div>
              </div>

              {/* Handling */}
              <div className="grid grid-cols-12 p-4 items-center hover:bg-zinc-800/40 transition">
                <div className="col-span-4 font-semibold text-zinc-300">{vehicleA.handling} / 100</div>
                <div className="col-span-4 text-center font-bold text-blue-400">
                  <span className="text-xs text-zinc-400 block uppercase">Handling & Cornering</span>
                  {vehicleA.handling} vs {vehicleB.handling}
                </div>
                <div className="col-span-4 text-right font-semibold text-zinc-300 flex items-center justify-end gap-2">
                  <span>{vehicleB.handling} / 100</span>
                  {getVehicleWinner('handling') === 'A' && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">Winner</span>
                  )}
                  {getVehicleWinner('handling') === 'B' && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">Winner</span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="grid grid-cols-12 p-4 items-center hover:bg-zinc-800/40 transition">
                <div className="col-span-4 font-semibold text-emerald-400">${vehicleA.price.toLocaleString('en-US')}</div>
                <div className="col-span-4 text-center font-bold text-emerald-400">
                  <span className="text-xs text-zinc-400 block uppercase">Price Difference</span>
                  ${Math.abs(vehicleA.price - vehicleB.price).toLocaleString('en-US')} Savings
                </div>
                <div className="col-span-4 text-right font-semibold text-emerald-400 flex items-center justify-end gap-2">
                  <span>${vehicleB.price.toLocaleString('en-US')}</span>
                  {getVehicleWinner('price') === 'A' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">Cheaper</span>
                  )}
                  {getVehicleWinner('price') === 'B' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">Cheaper</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* RENDER WEAPONS MATRIX */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/90 border border-rose-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-rose-600 text-white font-bold text-[10px] uppercase rounded-bl-xl">
                Armament 1
              </div>
              <img src={weaponA.imageUrl} alt={weaponA.name} className="w-full h-44 md:h-48 object-cover object-center rounded-xl border border-zinc-800 bg-zinc-950" referrerPolicy="no-referrer" />
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase">{weaponA.manufacturer} • {weaponA.category}</span>
                <h3 className="text-2xl font-black text-white">{weaponA.name}</h3>
                <p className="text-sm font-bold text-emerald-400 mt-1">${weaponA.price.toLocaleString('en-US')} (Rank {weaponA.unlockRank})</p>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-cyan-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-cyan-600 text-white font-bold text-[10px] uppercase rounded-bl-xl">
                Armament 2
              </div>
              <img src={weaponB.imageUrl} alt={weaponB.name} className="w-full h-44 md:h-48 object-cover object-center rounded-xl border border-zinc-800 bg-zinc-950" referrerPolicy="no-referrer" />
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase">{weaponB.manufacturer} • {weaponB.category}</span>
                <h3 className="text-2xl font-black text-white">{weaponB.name}</h3>
                <p className="text-sm font-bold text-emerald-400 mt-1">${weaponB.price.toLocaleString('en-US')} (Rank {weaponB.unlockRank})</p>
              </div>
            </div>
          </div>

          {/* Weapon Stat Comparison Table */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 font-bold text-sm text-white flex items-center justify-between">
              <span>Weapon Head-to-Head Specification Differential</span>
              <span className="text-xs text-zinc-400">TTK & Damage Advantage Badges</span>
            </div>

            <div className="divide-y divide-zinc-800 text-xs sm:text-sm">
              {/* Damage */}
              <div className="grid grid-cols-12 p-4 items-center hover:bg-zinc-800/40 transition">
                <div className="col-span-4 font-semibold text-zinc-300">{weaponA.damage} / 100</div>
                <div className="col-span-4 text-center font-bold text-rose-400">
                  <span className="text-xs text-zinc-400 block uppercase">Base Damage Score</span>
                  {weaponA.damage > weaponB.damage ? 'Higher Firepower' : weaponB.damage > weaponA.damage ? 'Lower Firepower' : 'Equal Firepower'}
                </div>
                <div className="col-span-4 text-right font-semibold text-zinc-300 flex items-center justify-end gap-2">
                  <span>{weaponB.damage} / 100</span>
                  {getWeaponWinner('damage') === 'A' && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">Winner</span>
                  )}
                  {getWeaponWinner('damage') === 'B' && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">Winner</span>
                  )}
                </div>
              </div>

              {/* Time to Kill (TTK) */}
              <div className="grid grid-cols-12 p-4 items-center hover:bg-zinc-800/40 transition">
                <div className="col-span-4 font-semibold text-amber-400">{weaponA.ttkMs} ms</div>
                <div className="col-span-4 text-center font-bold text-amber-400">
                  <span className="text-xs text-zinc-400 block uppercase">Time to Kill (TTK)</span>
                  {weaponA.ttkMs < weaponB.ttkMs ? `${weaponB.ttkMs - weaponA.ttkMs}ms Faster Elimination` : weaponB.ttkMs < weaponA.ttkMs ? `${weaponA.ttkMs - weaponB.ttkMs}ms Slower Elimination` : 'Identical TTK'}
                </div>
                <div className="col-span-4 text-right font-semibold text-amber-400 flex items-center justify-end gap-2">
                  <span>{weaponB.ttkMs} ms</span>
                  {getWeaponWinner('ttkMs') === 'A' && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Faster TTK
                    </span>
                  )}
                  {getWeaponWinner('ttkMs') === 'B' && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Faster TTK
                    </span>
                  )}
                </div>
              </div>

              {/* Fire Rate */}
              <div className="grid grid-cols-12 p-4 items-center hover:bg-zinc-800/40 transition">
                <div className="col-span-4 font-semibold text-zinc-300">{weaponA.fireRate} / 100</div>
                <div className="col-span-4 text-center font-bold text-cyan-400">
                  <span className="text-xs text-zinc-400 block uppercase">Fire Rate Index</span>
                  {weaponA.fireRate} vs {weaponB.fireRate}
                </div>
                <div className="col-span-4 text-right font-semibold text-zinc-300 flex items-center justify-end gap-2">
                  <span>{weaponB.fireRate} / 100</span>
                  {getWeaponWinner('fireRate') === 'A' && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">Winner</span>
                  )}
                  {getWeaponWinner('fireRate') === 'B' && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">Winner</span>
                  )}
                </div>
              </div>

              {/* Magazine Size */}
              <div className="grid grid-cols-12 p-4 items-center hover:bg-zinc-800/40 transition">
                <div className="col-span-4 font-semibold text-zinc-300">{weaponA.magazineSize} Rounds</div>
                <div className="col-span-4 text-center font-bold text-zinc-300">
                  <span className="text-xs text-zinc-400 block uppercase">Standard Mag Capacity</span>
                  {weaponA.magazineSize} Rds vs {weaponB.magazineSize} Rds
                </div>
                <div className="col-span-4 text-right font-semibold text-zinc-300 flex items-center justify-end gap-2">
                  <span>{weaponB.magazineSize} Rounds</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

