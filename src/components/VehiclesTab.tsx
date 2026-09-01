'use client';
import React, { useState, useEffect, useRef } from 'react';
import { VEHICLES_DATA } from '../data/vehicles';
import { Vehicle, VehicleCategory } from '../types';
import { VehicleDetailModal } from './VehicleDetailModal';
import { getCachedVehicles } from '../lib/offlineStorage';
import { VEHICLES_UPDATED_EVENT } from '../lib/vehicleStore';
import { UnitToggleSwitch } from './UnitToggleSwitch';
import { getStoredUnitPreference, setStoredUnitPreference, formatSpeed, UnitSystem } from '../lib/unitConverter';
import { getCacheBustedImageUrl } from '../lib/imageCacheBuster';
import { Car, Gauge, Zap, GitCompare, ArrowUpDown, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdSlot } from './ads';

interface VehiclesTabProps {
  searchQuery: string;
  onSelectForCompare: (vehicle: Vehicle) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 8;

const VehicleSkeletonCard = () => (
  <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden animate-pulse flex flex-col h-[340px]">
    <div className="h-44 bg-zinc-800/60 w-full relative overflow-hidden">
      <div className="absolute top-3 left-3 w-16 h-5 bg-zinc-700/50 rounded-md" />
      <div className="absolute bottom-3 right-3 w-20 h-5 bg-zinc-700/50 rounded-full" />
    </div>
    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="w-20 h-3 bg-zinc-800 rounded" />
        <div className="w-3/4 h-5 bg-zinc-700/80 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60">
        <div className="h-4 bg-zinc-800/70 rounded" />
        <div className="h-4 bg-zinc-800/70 rounded" />
      </div>
      <div className="h-9 bg-zinc-800/80 rounded-xl w-full" />
    </div>
  </div>
);

export const VehiclesTab: React.FC<VehiclesTabProps> = ({ searchQuery, onSelectForCompare, isLoading = false }) => {
  const catalogTopRef = useRef<HTMLDivElement>(null);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>(VEHICLES_DATA);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'price' | 'speed' | 'acceleration'>('speed');
  const [activeModalVehicle, setActiveModalVehicle] = useState<Vehicle | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(getStoredUnitPreference());
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUnitChange = (newUnit: UnitSystem) => {
    setUnitSystem(newUnit);
    setStoredUnitPreference(newUnit);
  };

  useEffect(() => {
    getCachedVehicles().then((data) => {
      if (data && data.length > 0) {
        setVehiclesList(data);
      }
    });

    const handleVehiclesUpdated = (e: CustomEvent<Vehicle[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setVehiclesList(e.detail);
        setActiveModalVehicle((current) => {
          if (!current) return null;
          const updated = e.detail.find((v) => v.id === current.id);
          return updated || current;
        });
      }
    };

    window.addEventListener(VEHICLES_UPDATED_EVENT as any, handleVehiclesUpdated);
    return () => {
      window.removeEventListener(VEHICLES_UPDATED_EVENT as any, handleVehiclesUpdated);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const handleCategoryChange = (cat: VehicleCategory | 'All') => {
    setIsFilterLoading(true);
    setSelectedCategory(cat);
    setCurrentPage(1);
    setTimeout(() => setIsFilterLoading(false), 300);
  };

  const categories: (VehicleCategory | 'All')[] = [
    'All',
    'Super',
    'Sports',
    'Muscle',
    'Off-Road',
    'Motorcycles',
    'Helicopters',
  ];

  const filteredVehicles = vehiclesList.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.dealer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'price') return b.price - a.price;
    if (sortBy === 'speed') return b.topSpeedMph - a.topSpeedMph;
    if (sortBy === 'acceleration') return b.acceleration - a.acceleration;
    return 0;
  });

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 min-h-[100vh]">
      {/* Top Banner Leaderboard in Responsive Grid Container with Min-Height Protection */}
      <div className="w-full my-3 sm:my-5 px-1 sm:px-2 grid grid-cols-1 place-items-center min-h-[100px] overflow-hidden transition-all">
        <AdSlot
          slotType="leaderboard"
          position="inline"
          refreshIntervalSeconds={60}
          fallbackContent={
            <div className="p-3 text-center w-full bg-zinc-950/80 rounded-xl border border-zinc-800">
              <span className="text-xs font-bold text-rose-400">GTA VI Custom Tuning &amp; Dyno Garage</span>
              <p className="text-[11px] text-zinc-400">Benchmark your drag times and slip angles in the Tuning Championship.</p>
            </div>
          }
        />
      </div>

      {/* Category Pills & Sort Bar */}
      <div ref={catalogTopRef} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 scroll-mt-24">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-zinc-400 mr-1 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto text-xs text-zinc-400 shrink-0">
          <UnitToggleSwitch unitSystem={unitSystem} onChange={handleUnitChange} />

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1.5 border border-zinc-700/80 focus:outline-none focus:border-rose-500 font-sans"
            >
              <option value="speed">Top Speed ({unitSystem === 'metric' ? 'KM/H' : 'MPH'})</option>
              <option value="acceleration">Acceleration</option>
              <option value="price">Price (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Grid with Min-Height Protection to prevent footer jump on sparse pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 min-h-[80vh] align-content-start">
        {(isLoading || isFilterLoading) ? (
          Array.from({ length: 8 }).map((_, idx) => (
            <VehicleSkeletonCard key={idx} />
          ))
        ) : (
          paginatedVehicles.map((vehicle) => {
          const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(vehicle.price);

          return (
            <div
              key={vehicle.id}
              className="group bg-zinc-900/80 border border-zinc-800/90 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-rose-500/5 flex flex-col"
            >
              {/* Image & Badges */}
              <div className="relative h-44 w-full bg-zinc-950 overflow-hidden shrink-0">
                <img
                  key={`${vehicle.id}-${vehicle.imageVersion || vehicle.updatedAt || vehicle.imageUrl}`}
                  src={getCacheBustedImageUrl(vehicle.imageUrl, vehicle.imageVersion || vehicle.updatedAt)}
                  alt={vehicle.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-950/80 text-rose-400 border border-rose-500/30 backdrop-blur-md">
                    {vehicle.category}
                  </span>
                  {vehicle.featuredInTrailer && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                      Trailer Confirmed
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 font-mono font-black text-emerald-400 text-sm bg-zinc-950/90 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {formattedPrice}
                </div>
              </div>

              {/* Specs Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{vehicle.brand}</p>
                  <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                    {vehicle.name}
                  </h3>
                </div>

                {/* Quick Stat Bars */}
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-zinc-400 mb-1">
                      <span className="flex items-center gap-1"><Gauge className="w-3 h-3 text-amber-400" /> Top Speed</span>
                      <span className="text-zinc-200 font-bold">{formatSpeed(vehicle.topSpeedMph, unitSystem)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, (vehicle.topSpeedMph / 170) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 mb-1">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-rose-400" /> Acceleration</span>
                      <span className="text-zinc-200 font-bold">{vehicle.acceleration}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${vehicle.acceleration}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveModalVehicle(vehicle)}
                    className="flex-1 py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Spec</span>
                  </button>
                  <button
                    onClick={() => onSelectForCompare(vehicle)}
                    className="py-1.5 px-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-medium rounded-lg text-xs transition border border-rose-500/30 flex items-center gap-1"
                    title="Add to 1v1 Comparison Matrix"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Compare</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-400">
          <Car className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
          <p className="text-sm">No vehicles matched your criteria.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredVehicles.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">
          <div>
            Showing <span className="font-bold text-white">{startIndex + 1}</span> to{' '}
            <span className="font-bold text-white">
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredVehicles.length)}
            </span>{' '}
            of <span className="font-bold text-rose-400">{filteredVehicles.length}</span> vehicles
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage === 1}
              className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold transition flex items-center justify-center ${
                      safeCurrentPage === pageNum
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Spec Modal */}
      <VehicleDetailModal
        vehicle={activeModalVehicle}
        unitSystem={unitSystem}
        onUnitChange={handleUnitChange}
        onClose={() => setActiveModalVehicle(null)}
        onCompare={(v) => {
          setActiveModalVehicle(null);
          onSelectForCompare(v);
        }}
      />
    </div>
  );
};
