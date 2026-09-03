import React, { useState } from 'react';
import { DynastyProperty, PropertyCategory, PropertyEscrowBid } from '../../types/rpSuite';
import { 
  Building2, 
  DollarSign, 
  Warehouse, 
  Home, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Boxes, 
  Car, 
  Anchor, 
  Key, 
  Send,
  XCircle,
  MapPin,
  Clock,
  TrendingUp
} from 'lucide-react';

const SEED_PROPERTIES: DynastyProperty[] = [
  {
    id: 'prop-ocean-101',
    slug: 'ocean-drive-beachfront-mansion',
    title: 'The Versace Villa / Ocean Drive Beachfront Palace',
    category: 'Beachfront Mansion',
    district: 'Vice Beach',
    address: '1114 Ocean Drive, Vice Beach, LE 1042',
    purchasePrice: 12500000,
    dailyUpkeepTax: 4500,
    storageSlots: 150,
    garageSlots: 10,
    interiorTier: 'Vice City VIP Luxury Penthouse',
    status: 'Available',
    featuredImageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
    ],
    description: 'Ultra-luxurious historic Mediterranean revival beachfront estate with private infinity pool overlooking the Atlantic Ocean, fortified vault room, and 10-car showroom garage.',
    features: ['Direct Beach Access', '10-Car Showroom Garage', 'Fortified Basement Vault', 'Infinity Pool & Bar', 'Private Helipad Access'],
    hasHelipad: true,
    hasPrivateBoatDock: true,
    hasVaultRoom: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7
  },
  {
    id: 'prop-biscayne-202',
    slug: 'biscayne-tower-penthouse',
    title: 'Biscayne Executive Sky Penthouse',
    category: 'Downtown Luxury Penthouse',
    district: 'Downtown Vice',
    address: '880 Biscayne Boulevard, Suite 5400',
    purchasePrice: 6800000,
    dailyUpkeepTax: 2800,
    storageSlots: 100,
    garageSlots: 6,
    interiorTier: 'Executive Marble Suite',
    status: 'Available',
    featuredImageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ],
    description: '360-degree glass penthouse in the heart of the financial district with rooftop helipad, private elevator access, and executive planning war room.',
    features: ['Rooftop Helipad', 'Private Express Elevator', 'Floor-to-Ceiling Impact Glass', 'Smart Heist Planning Board'],
    hasHelipad: true,
    hasPrivateBoatDock: false,
    hasVaultRoom: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3
  },
  {
    id: 'prop-port-303',
    slug: 'port-gellhorn-bonded-warehouse',
    title: 'Port Gellhorn Heavy Industrial Bonded Warehouse',
    category: 'Industrial Warehouse',
    district: 'Port Gellhorn',
    address: 'Warehouse Bay 14, Port Gellhorn Freight Terminal',
    purchasePrice: 2200000,
    dailyUpkeepTax: 1200,
    storageSlots: 500,
    garageSlots: 8,
    interiorTier: 'Heist Command Bunker',
    status: 'Available',
    featuredImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    galleryImages: [],
    description: 'Massive heavy-duty commercial logistics space equipped with reinforced roll-up gates, forklift bays, and deep subterranean smuggling storage.',
    features: ['500 Storage Crate Capacity', 'Heavy Semi-Truck Loading Docks', 'Security Perimeter Cameras', 'Subterranean Bunker'],
    hasHelipad: false,
    hasPrivateBoatDock: true,
    hasVaultRoom: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1
  },
  {
    id: 'prop-club-404',
    slug: 'malibu-club-nightclub',
    title: 'The Neon Palms Oceanfront Nightclub & Lounge',
    category: 'Nightclub & Lounge',
    district: 'Vice Beach',
    address: '420 Ocean Drive, Vice Beach',
    purchasePrice: 8500000,
    dailyUpkeepTax: 3900,
    storageSlots: 80,
    garageSlots: 4,
    interiorTier: 'Vice City VIP Luxury Penthouse',
    status: 'Under Escrow / Pending',
    ownerCharacterName: 'Tommy Vercetti Estate',
    featuredImageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=80',
    galleryImages: [],
    description: 'Iconic synthwave nightclub with multi-level dance floor, VIP bottle lounge, underground greenroom, and cash counting office.',
    features: ['High-Capacity Sound System', 'VIP Bottle Lounge', 'Underground Safe', 'Liquor License Included'],
    hasHelipad: false,
    hasPrivateBoatDock: false,
    hasVaultRoom: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12
  }
];

export const DynastyEconomyDirectory: React.FC = () => {
  const [properties, setProperties] = useState<DynastyProperty[]>(SEED_PROPERTIES);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<DynastyProperty | null>(null);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
  
  // Escrow Form State
  const [buyerName, setBuyerName] = useState('');
  const [buyerDiscord, setBuyerDiscord] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [intendedUse, setIntendedUse] = useState('');
  const [bidSubmitted, setBidSubmitted] = useState(false);

  const filteredProperties = properties.filter(prop => {
    const matchesCategory = categoryFilter === 'all' || prop.category === categoryFilter;
    const matchesSearch = prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prop.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prop.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenEscrow = (prop: DynastyProperty) => {
    setSelectedProperty(prop);
    setBidAmount(prop.purchasePrice);
    setIsEscrowModalOpen(true);
    setBidSubmitted(false);
  };

  const handleSubmitEscrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    setBidSubmitted(true);
    setTimeout(() => {
      setIsEscrowModalOpen(false);
      alert(`Escrow purchase bid for "${selectedProperty.title}" has been registered in the City of Vice Land Registry.`);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* HEADER BAR */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-black text-white">Dynasty 8 Executive Real Estate & Business Directory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse commercial businesses, mansions, warehouses, and submit real-time escrow purchase contracts
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800 text-xs">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Citywide Real Estate Tax:</span>
          <span className="font-mono text-emerald-400 font-black">2.5% Daily Upkeep</span>
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Properties' },
            { id: 'Beachfront Mansion', label: 'Mansions' },
            { id: 'Downtown Luxury Penthouse', label: 'Penthouses' },
            { id: 'Industrial Warehouse', label: 'Warehouses' },
            { id: 'Nightclub & Lounge', label: 'Nightclubs & Venues' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border ${
                categoryFilter === c.id
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address, district, or estate..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* PROPERTY CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((prop) => (
          <div
            key={prop.id}
            className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden space-y-4 shadow-2xl hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              {/* Featured Image Banner */}
              <div className="w-full h-48 bg-slate-900 relative overflow-hidden">
                <img
                  src={prop.featuredImageUrl}
                  alt={prop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
                  {prop.category}
                </div>
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full font-black text-[10px] uppercase shadow-lg ${
                  prop.status === 'Available' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
                }`}>
                  {prop.status}
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white font-bold bg-gradient-to-t from-black/80 to-transparent p-2 rounded-xl">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {prop.district}
                  </span>
                  <span className="font-mono text-emerald-300 text-sm">
                    ${prop.purchasePrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 space-y-3">
                <h3 className="font-black text-white text-base leading-snug">{prop.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{prop.description}</p>

                {/* Telemetry Matrix (Storage & Garage) */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-y border-slate-800/80">
                  <div className="p-2 rounded-xl bg-slate-900">
                    <Boxes className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-500 block">Storage:</span>
                    <strong className="text-white font-mono">{prop.storageSlots} Slots</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900">
                    <Car className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-500 block">Garage:</span>
                    <strong className="text-white font-mono">{prop.garageSlots} Bays</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900">
                    <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-500 block">Daily Tax:</span>
                    <strong className="text-emerald-300 font-mono">${prop.dailyUpkeepTax}/d</strong>
                  </div>
                </div>

                {/* Features Pill Strip */}
                <div className="flex flex-wrap gap-1">
                  {prop.features.slice(0, 3).map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] font-medium border border-slate-800">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-5 pt-0">
              <button
                type="button"
                onClick={() => handleOpenEscrow(prop)}
                disabled={prop.status !== 'Available'}
                className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition ${
                  prop.status === 'Available'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
                    : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>{prop.status === 'Available' ? 'Submit Escrow Purchase Bid' : 'Property Under Contract'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ESCROW PURCHASE SUBMISSION MODAL */}
      {isEscrowModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Dynasty 8 Contract</span>
                <h3 className="font-black text-white text-base mt-0.5">{selectedProperty.title}</h3>
              </div>
              <button
                onClick={() => setIsEscrowModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEscrow} className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Listing Price:</span>
                <span className="font-mono text-emerald-400 font-black text-sm">
                  ${selectedProperty.purchasePrice.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Buyer Full Name:</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Jason Duval"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Discord Tag:</label>
                  <input
                    type="text"
                    required
                    value={buyerDiscord}
                    onChange={(e) => setBuyerDiscord(e.target.value)}
                    placeholder="e.g. jason_duval#0001"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Offer Amount ($ USD / In-Game Cash):</label>
                <input
                  type="number"
                  required
                  value={bidAmount}
                  onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Intended Business / RP Use:</label>
                <textarea
                  rows={2}
                  value={intendedUse}
                  onChange={(e) => setIntendedUse(e.target.value)}
                  placeholder="e.g. Primary residence and syndicate heist strategy war room..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEscrowModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  Confirm & Submit Escrow Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
