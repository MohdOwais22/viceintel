import React, { useState } from 'react';
import { CharacterGalleryAdminCms } from './CharacterGalleryAdminCms';
import { VehicleCatalogAdminCms } from './VehicleCatalogAdminCms';
import { WeaponCatalogAdminCms } from './WeaponCatalogAdminCms';
import { BusinessCatalogAdminCms } from './BusinessCatalogAdminCms';
import { Users, Car, Crosshair, Building2, Layers, Sparkles } from 'lucide-react';

interface MasterCatalogAdminCmsProps {
  initialCategory?: 'characters' | 'vehicles' | 'weapons' | 'businesses';
}

export const MasterCatalogAdminCms: React.FC<MasterCatalogAdminCmsProps> = ({
  initialCategory = 'characters'
}) => {
  const [activeCategory, setActiveCategory] = useState<'characters' | 'vehicles' | 'weapons' | 'businesses'>(initialCategory);

  return (
    <div className="space-y-6">
      {/* Unified Master CMS Header & Category Selector */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Unified Master Catalog CMS
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Game Database & Asset Management Studio
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Manage characters, vehicle telemetry, weapons, and media assets in one unified CMS workspace.
            </p>
          </div>

          {/* Merged Category Switcher Buttons */}
          <div className="flex items-center gap-2 bg-zinc-950/80 p-1.5 rounded-xl border border-zinc-800/80 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveCategory('characters')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeCategory === 'characters'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Users className="w-4 h-4 text-pink-400" />
              <span>Characters</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('vehicles')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeCategory === 'vehicles'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Car className="w-4 h-4 text-rose-400" />
              <span>Vehicles</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('weapons')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeCategory === 'weapons'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span>Weapons</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('businesses')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeCategory === 'businesses'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Businesses</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Selected Catalog Category */}
      <div className="animate-fade-in">
        {activeCategory === 'characters' && <CharacterGalleryAdminCms />}
        {activeCategory === 'vehicles' && <VehicleCatalogAdminCms />}
        {activeCategory === 'weapons' && <WeaponCatalogAdminCms />}
        {activeCategory === 'businesses' && <BusinessCatalogAdminCms />}
      </div>
    </div>
  );
};
