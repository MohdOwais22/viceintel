'use client';
import React, { useState, useEffect } from 'react';
import { WEAPONS_DATA } from '../data/weapons';
import { Weapon, WeaponCategory } from '../types';
import { getCachedWeapons } from '../lib/offlineStorage';
import { WEAPONS_UPDATED_EVENT } from '../lib/weaponStore';
import { UnitToggleSwitch } from './UnitToggleSwitch';
import { getStoredUnitPreference, setStoredUnitPreference, formatRange, UnitSystem } from '../lib/unitConverter';
import { Crosshair, Shield, Zap, Target, Flame, ChevronRight, ChevronLeft, Lock, Check } from 'lucide-react';
import { AdSlot } from './ads';

interface WeaponsTabProps {
  searchQuery: string;
  isLoading?: boolean;
  onNavigateTab?: (tab: string, targetId?: string) => void;
}

const ITEMS_PER_PAGE = 6;

const WeaponSkeletonItem = () => (
  <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 animate-pulse flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-zinc-800/60 shrink-0" />
      <div className="space-y-1.5">
        <div className="w-24 h-2.5 bg-zinc-800 rounded" />
        <div className="w-32 h-4 bg-zinc-700/80 rounded" />
        <div className="w-28 h-3 bg-zinc-800/60 rounded" />
      </div>
    </div>
    <div className="w-4 h-4 bg-zinc-800 rounded-full" />
  </div>
);

const WeaponSkeletonDetail = () => (
  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
      <div className="space-y-2">
        <div className="w-20 h-4 bg-zinc-800 rounded" />
        <div className="w-48 h-7 bg-zinc-700/80 rounded" />
        <div className="w-64 h-3 bg-zinc-800 rounded" />
      </div>
      <div className="w-28 h-12 bg-zinc-800/60 rounded-xl" />
    </div>
    <div className="h-48 bg-zinc-800/50 rounded-xl w-full" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 bg-zinc-800/60 rounded-xl" />
      ))}
    </div>
  </div>
);

export const WeaponsTab: React.FC<WeaponsTabProps> = ({ searchQuery, isLoading = false }) => {
  const [weaponsList, setWeaponsList] = useState<Weapon[]>(WEAPONS_DATA);
  const [selectedCategory, setSelectedCategory] = useState<WeaponCategory | 'All'>('All');
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(WEAPONS_DATA[0]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(getStoredUnitPreference());
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleUnitChange = (newUnit: UnitSystem) => {
    setUnitSystem(newUnit);
    setStoredUnitPreference(newUnit);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    fetch('/api/weapons')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setWeaponsList(json.data);
          setSelectedWeapon((prev) => {
            const match = json.data.find((w: Weapon) => w.id === prev.id);
            return match || json.data[0] || prev;
          });
        }
      })
      .catch(() => {});

    getCachedWeapons().then((data) => {
      if (data && data.length > 0) {
        setWeaponsList(data);
        if (!data.some(w => w.id === selectedWeapon.id)) {
          setSelectedWeapon(data[0]);
        }
      }
    });

    const handleWeaponsUpdated = (e: CustomEvent<Weapon[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setWeaponsList(e.detail);
        setSelectedWeapon(prev => {
          const match = e.detail.find(w => w.id === prev.id);
          return match || e.detail[0] || prev;
        });
      }
    };

    window.addEventListener(WEAPONS_UPDATED_EVENT as any, handleWeaponsUpdated);
    return () => {
      window.removeEventListener(WEAPONS_UPDATED_EVENT as any, handleWeaponsUpdated);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const handleCategoryChange = (cat: WeaponCategory | 'All') => {
    setIsFilterLoading(true);
    setSelectedCategory(cat);
    setCurrentPage(1);
    setTimeout(() => setIsFilterLoading(false), 300);
  };

  const categories: (WeaponCategory | 'All')[] = [
    'All',
    'Assault Rifles',
    'Shotguns',
    'Sniper Rifles',
    'Handguns',
    'Submachine Guns',
    'Heavy Weapons',
    'Melee',
  ];

  const filteredWeapons = weaponsList.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredWeapons.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedWeapons = filteredWeapons.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Auto select first weapon on page change if current selected is not in paginated list
  useEffect(() => {
    if (paginatedWeapons.length > 0 && !paginatedWeapons.some(w => w.id === selectedWeapon?.id)) {
      setSelectedWeapon(paginatedWeapons[0]);
    }
  }, [safeCurrentPage, filteredWeapons]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Weapons Selector List */}
      <div className="lg:col-span-5 space-y-4">
        {/* Category & Unit Selector Header */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex gap-1.5 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <UnitToggleSwitch unitSystem={unitSystem} onChange={handleUnitChange} compact className="shrink-0" />
        </div>

        <div className="space-y-2.5">
          {(isLoading || isFilterLoading) ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <WeaponSkeletonItem key={idx} />
            ))
          ) : (
            paginatedWeapons.map((weapon) => {
            const isSelected = selectedWeapon.id === weapon.id;
            return (
              <div
                key={weapon.id}
                onClick={() => setSelectedWeapon(weapon)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                  isSelected
                    ? 'bg-rose-950/20 border-rose-500/50 text-white shadow-md shadow-rose-950/30'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 aspect-square rounded-lg bg-zinc-950 border border-zinc-800/80 overflow-hidden shrink-0 flex items-center justify-center">
                    {weapon.imageUrl ? (
                      <img
                        src={weapon.imageUrl}
                        alt={weapon.name}
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.failed) {
                            target.dataset.failed = 'true';
                            target.src = 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=800&q=80';
                          }
                        }}
                      />
                    ) : (
                      <Crosshair className="w-6 h-6 text-rose-500/50" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                      {weapon.manufacturer} • {weapon.category}
                    </span>
                    <h4 className="text-sm font-bold text-white">{weapon.name}</h4>
                    <p className="text-xs text-zinc-400">
                      TTK: <strong className="text-zinc-200">{weapon.ttkMs}ms</strong> • Unlock Rank:{' '}
                      <strong className="text-amber-400">{weapon.unlockRank}</strong>
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-rose-400' : 'text-zinc-600'}`} />
              </div>
            );
          })
          )}
        </div>

        {/* Weapons List Pagination Controls */}
        {filteredWeapons.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">
            <span>
              <strong className="text-white">{startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredWeapons.length)}</strong> of <strong className="text-rose-400">{filteredWeapons.length}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-bold text-white">
                {safeCurrentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Weapon Specification Detail Panel */}
      {(isLoading || isFilterLoading) ? (
        <div className="lg:col-span-7">
          <WeaponSkeletonDetail />
        </div>
      ) : (
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <span className="px-2.5 py-1 text-xs font-bold uppercase rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {selectedWeapon.manufacturer}
            </span>
            <h2 className="text-2xl font-black text-white mt-1">{selectedWeapon.name}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{selectedWeapon.description}</p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <UnitToggleSwitch unitSystem={unitSystem} onChange={handleUnitChange} compact />
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 shrink-0 text-right">
              <span className="text-[10px] text-zinc-400 uppercase">Estimated Price</span>
              <p className="text-lg font-black text-emerald-400">
                ${selectedWeapon.price.toLocaleString('en-US')}
              </p>
            </div>
          </div>
        </div>

        {/* TTK & Fire Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase">Time to Kill (TTK)</span>
            <p className="text-xl font-bold text-rose-400">{selectedWeapon.ttkMs} <span className="text-xs text-zinc-400">ms</span></p>
          </div>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase">Magazine Size</span>
            <p className="text-xl font-bold text-zinc-200">{selectedWeapon.magazineSize} <span className="text-xs text-zinc-400">rds</span></p>
          </div>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase">Unlock Rank</span>
            <p className="text-xl font-bold text-amber-400">Rank {selectedWeapon.unlockRank}</p>
          </div>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase">Effective Range</span>
            <p className="text-xl font-bold text-cyan-400">
              {formatRange(selectedWeapon.range, unitSystem)}{' '}
              <span className="text-xs font-normal text-zinc-400">({selectedWeapon.range}/100)</span>
            </p>
          </div>
        </div>

        {/* Detailed Attribute Matrix */}
        <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
          <h4 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">Ballistic Performance Matrix</h4>
          
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Damage Per Shot</span>
                <span className="font-bold text-zinc-200">{selectedWeapon.damage} / 100</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${selectedWeapon.damage}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Rate of Fire</span>
                <span className="font-bold text-zinc-200">{selectedWeapon.fireRate} / 100</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selectedWeapon.fireRate}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Accuracy & Recoil Control</span>
                <span className="font-bold text-zinc-200">{selectedWeapon.accuracy} / 100</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedWeapon.accuracy}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Ammu-Nation Gunsmith Attachments */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
            Ammu-Nation Custom Attachments ({selectedWeapon.attachments.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedWeapon.attachments.map((att) => (
              <div key={att.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-start gap-2.5">
                <Target className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-zinc-200">{att.name}</h5>
                    <span className="text-[10px] text-emerald-400 font-mono">${att.cost.toLocaleString('en-US')}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{att.effect}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Tactical Armory Banner */}
      <div className="lg:col-span-12 w-full mt-6 pt-2 flex justify-center min-h-[100px]">
        <AdSlot
          slotType="leaderboard"
          position="inline"
          refreshIntervalSeconds={60}
          fallbackContent={
            <div className="p-3 text-center w-full bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-xs font-bold text-amber-400">Vice Tactical Armory VIP</span>
              <p className="text-[11px] text-zinc-400">Access exclusive damage drop-off charts and recoil patterns.</p>
            </div>
          }
        />
      </div>
    </div>
  );
};
