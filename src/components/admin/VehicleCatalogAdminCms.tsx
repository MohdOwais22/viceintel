'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, VehicleCategory } from '../../types';
import { VEHICLES_DATA } from '../../data/vehicles';
import {
  getStoredVehicles,
  saveOrUpdateVehicle,
  deleteVehicle,
  resetVehiclesToDefault,
  VEHICLES_UPDATED_EVENT
} from '../../lib/vehicleStore';
import { forceSyncFirestoreToLocal } from '../../lib/offlineStorage';
import { logStaffActivity } from '../../lib/staffAuditLogger';
import { getCacheBustedImageUrl } from '../../lib/imageCacheBuster';
import {
  Car,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Gauge,
  Zap,
  DollarSign,
  Shield,
  Layers,
  Sparkles,
  Info,
  Camera,
  RefreshCw,
  Save,
  Link as LinkIcon
} from 'lucide-react';

export const VehicleCatalogAdminCms: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'topSpeed'>('price');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal State for Editing/Adding
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Quick Image Modal State
  const [quickImageModalVeh, setQuickImageModalVeh] = useState<Vehicle | null>(null);
  const [quickImageUrlInput, setQuickImageUrlInput] = useState<string>('');

  // Form Fields
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    name: '',
    brand: 'Pegassi',
    category: 'Super',
    price: 1500000,
    tradePrice: 1125000,
    tradePriceCondition: '',
    dealer: 'Legendary Motorsport',
    topSpeedMph: 135,
    acceleration: 85,
    braking: 80,
    handling: 85,
    drivetrain: 'AWD',
    capacity: 2,
    description: '',
    imageUrl: '',
    featuredInTrailer: true,
    isCustomizable: true,
    baseModdingBudget: 250000
  });

  // Image Upload Drag & Drop State
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Modals
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    setIsLoading(true);
    getStoredVehicles().then((data) => {
      setVehicles(data);
      setIsLoading(false);
    });

    const handleUpdate = (e: CustomEvent<Vehicle[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setVehicles(e.detail);
      }
    };

    window.addEventListener(VEHICLES_UPDATED_EVENT as any, handleUpdate);
    return () => {
      window.removeEventListener(VEHICLES_UPDATED_EVENT as any, handleUpdate);
    };
  }, []);

  // Filter and Sort Vehicles
  const filteredVehicles = vehicles
    .filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.dealer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'topSpeed') return b.topSpeedMph - a.topSpeedMph;
      return b.price - a.price;
    });

  // Image compression utility for PC uploads
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotification('⚠️ Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
        showNotification('✅ Image optimized and attached!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processQuickImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotification('⚠️ Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setQuickImageUrlInput(dataUrl);
        showNotification('✅ Photo loaded from your computer!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenQuickImage = (veh: Vehicle) => {
    setQuickImageModalVeh(veh);
    setQuickImageUrlInput(veh.imageUrl || '');
  };

  const handleSaveQuickImage = async () => {
    if (!quickImageModalVeh) return;
    const target = quickImageModalVeh;
    const newUrl = quickImageUrlInput.trim() || target.imageUrl;

    try {
      const updatedVeh: Vehicle = {
        ...target,
        imageUrl: newUrl
      };
      const updatedList = await saveOrUpdateVehicle(updatedVeh);
      setVehicles(updatedList);
      setQuickImageModalVeh(null);
      showNotification(`✅ Updated photo for "${target.name}" and synced to Cloud!`);

      logStaffActivity({
        actionType: 'CMS_CONTENT_UPDATE',
        actionCategory: 'Content CMS',
        targetId: target.id,
        targetName: target.name,
        targetType: 'vehicle',
        severity: 'LOW',
        details: `Staff updated vehicle image for "${target.name}" via Quick Image CMS.`
      }).catch(() => {});
    } catch (err) {
      console.error('Quick image save error:', err);
      showNotification('❌ Failed to update vehicle photo.');
    }
  };

  const handleForceSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      await forceSyncFirestoreToLocal();
      const fresh = await getStoredVehicles();
      setVehicles(fresh);
      showNotification('✅ Successfully synced vehicles with Cloud Firestore!');
    } catch (err) {
      console.error('Cloud sync error:', err);
      showNotification('⚠️ Could not complete cloud sync.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      name: '',
      brand: 'Pegassi',
      category: 'Super',
      price: 1500000,
      tradePrice: 1125000,
      tradePriceCondition: 'Complete 5 Vice City Street Races in 1st Place',
      dealer: 'Legendary Motorsport',
      topSpeedMph: 140,
      acceleration: 88,
      braking: 82,
      handling: 85,
      drivetrain: 'AWD',
      capacity: 2,
      description: 'High-performance Vice City hypercar with active aerodynamic spoiler.',
      imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80',
      featuredInTrailer: true,
      isCustomizable: true,
      baseModdingBudget: 300000
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({ ...v });
    setIsEditorOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showNotification('⚠️ Vehicle name is required.');
      return;
    }

    const vehicleId = editingVehicle
      ? editingVehicle.id
      : `v_custom_${Date.now()}`;
    const slug =
      formData.slug ||
      formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const completeVehicle: Vehicle = {
      id: vehicleId,
      slug: slug,
      name: formData.name.trim(),
      brand: formData.brand || 'Pegassi',
      category: (formData.category as VehicleCategory) || 'Super',
      price: Number(formData.price) || 0,
      tradePrice: formData.tradePrice ? Number(formData.tradePrice) : undefined,
      tradePriceCondition: formData.tradePriceCondition || undefined,
      dealer: formData.dealer || 'Legendary Motorsport',
      topSpeedMph: Number(formData.topSpeedMph) || 120,
      acceleration: Number(formData.acceleration) || 80,
      braking: Number(formData.braking) || 80,
      handling: Number(formData.handling) || 80,
      drivetrain: (formData.drivetrain as 'AWD' | 'RWD' | 'FWD') || 'AWD',
      capacity: Number(formData.capacity) || 2,
      description: formData.description || '',
      imageUrl:
        formData.imageUrl ||
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80',
      featuredInTrailer: Boolean(formData.featuredInTrailer),
      isCustomizable: Boolean(formData.isCustomizable),
      baseModdingBudget: Number(formData.baseModdingBudget) || 200000
    };

    try {
      const updated = await saveOrUpdateVehicle(completeVehicle);
      setVehicles(updated);
      setIsEditorOpen(false);
      showNotification(
        editingVehicle
          ? `Updated vehicle "${completeVehicle.name}"!`
          : `Added new vehicle "${completeVehicle.name}"!`
      );

      logStaffActivity({
        actionType: editingVehicle ? 'CMS_CONTENT_UPDATE' : 'CMS_CONTENT_CREATE',
        actionCategory: 'Content CMS',
        targetId: completeVehicle.id,
        targetName: completeVehicle.name,
        targetType: 'vehicle',
        severity: 'MEDIUM',
        details: `Staff ${editingVehicle ? 'updated' : 'created'} vehicle profile "${completeVehicle.name}" ($${completeVehicle.price.toLocaleString()}).`
      }).catch(() => {});
    } catch (err) {
      console.error('Save vehicle error:', err);
      showNotification('❌ Failed to save vehicle. Check console for details.');
    }
  };

  const confirmDeleteVehicle = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const updated = await deleteVehicle(target.id);
      setVehicles(updated);
      showNotification(`Deleted vehicle "${target.name}".`);

      logStaffActivity({
        actionType: 'CMS_CONTENT_DELETE',
        actionCategory: 'Content CMS',
        targetId: target.id,
        targetName: target.name,
        targetType: 'vehicle',
        severity: 'HIGH',
        details: `Staff deleted vehicle "${target.name}" (${target.id}) from catalog.`
      }).catch(() => {});
    } catch (err) {
      showNotification('❌ Failed to delete vehicle.');
    }
  };

  const confirmResetToDefault = async () => {
    setShowResetConfirm(false);
    try {
      const updated = await resetVehiclesToDefault();
      setVehicles(updated);
      showNotification('Reset vehicle catalog to Rockstar default dataset!');

      logStaffActivity({
        actionType: 'CMS_CONTENT_UPDATE',
        actionCategory: 'Content CMS',
        targetId: 'vehicle_catalog',
        targetName: 'Vehicle Catalog Dataset',
        targetType: 'dataset',
        severity: 'CRITICAL',
        details: 'Staff reset vehicle catalog back to Rockstar default dataset.'
      }).catch(() => {});
    } catch (err) {
      showNotification('❌ Failed to reset vehicles.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-zinc-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-amber-950/40 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Firestore Catalog Sync
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {vehicles.length} Total Vehicles
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Car className="w-6 h-6 text-amber-400" />
              <span>Vehicle Catalog CMS</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Manage all Vice City vehicles, trade prices, stats, and custom user modifications in real-time with automatic Cloud Firestore sync and local PC photo uploading.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleForceSyncCloud}
              disabled={isSyncingCloud}
              className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold border border-zinc-700 flex items-center justify-center gap-2 transition cursor-pointer"
              title="Force sync database with Cloud Firestore across all devices"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'Syncing...' : 'Sync All Devices'}</span>
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold border border-zinc-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Reset vehicle catalog to Rockstar defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Vehicle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search vehicles by name, brand, or dealer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 font-bold focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Super">Super</option>
              <option value="Sports">Sports</option>
              <option value="Muscle">Muscle</option>
              <option value="Off-Road">Off-Road</option>
              <option value="Motorcycles">Motorcycles</option>
              <option value="Helicopters">Helicopters</option>
              <option value="Boats">Boats</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-zinc-300 font-bold focus:outline-none"
            >
              <option value="price">Highest Price</option>
              <option value="topSpeed">Top Speed (MPH)</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Grid / Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-zinc-900/60 rounded-2xl border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center space-y-3">
          <Car className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-sm text-zinc-400 font-medium">No vehicles match your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((veh) => {
            const isDefault = VEHICLES_DATA.some((dv) => dv.id === veh.id);
            return (
              <div
                key={veh.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition group flex flex-col justify-between"
              >
                <div>
                  {/* Image Container */}
                  <div className="h-44 w-full bg-zinc-950 relative overflow-hidden">
                    <img
                      key={`${veh.id}-${veh.imageVersion || veh.updatedAt || veh.imageUrl}`}
                      src={getCacheBustedImageUrl(veh.imageUrl, veh.imageVersion || veh.updatedAt)}
                      alt={veh.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40" />
                    
                    {/* Category Badge */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-amber-400 border border-amber-500/30">
                      {veh.category}
                    </span>

                    {/* Quick Image Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenQuickImage(veh)}
                      className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/70 hover:bg-amber-500 text-zinc-300 hover:text-black border border-zinc-700/60 hover:border-amber-400 transition backdrop-blur-md flex items-center gap-1 cursor-pointer z-10"
                      title="Quick Change Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold">Photo</span>
                    </button>

                    {/* Price Tag */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-lg font-black text-white font-mono drop-shadow-md">
                        ${veh.price.toLocaleString()}
                      </span>
                      {veh.tradePrice && (
                        <div className="text-[10px] text-amber-300 font-mono font-bold">
                          Trade: ${veh.tradePrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Specs */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
                        {veh.brand} • {veh.dealer}
                      </div>
                      <h3 className="text-base font-black text-white group-hover:text-amber-400 transition">
                        {veh.name}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                        {veh.description}
                      </p>
                    </div>

                    {/* Telemetry Stats */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-zinc-800/80 text-center">
                      <div className="bg-zinc-950/60 p-1.5 rounded-lg border border-zinc-800">
                        <span className="block text-[9px] text-zinc-500 uppercase font-bold">Speed</span>
                        <span className="text-xs font-mono font-black text-amber-400">{veh.topSpeedMph} mph</span>
                      </div>
                      <div className="bg-zinc-950/60 p-1.5 rounded-lg border border-zinc-800">
                        <span className="block text-[9px] text-zinc-500 uppercase font-bold">Accel</span>
                        <span className="text-xs font-mono font-black text-white">{veh.acceleration}/100</span>
                      </div>
                      <div className="bg-zinc-950/60 p-1.5 rounded-lg border border-zinc-800">
                        <span className="block text-[9px] text-zinc-500 uppercase font-bold">Drive</span>
                        <span className="text-xs font-mono font-black text-emerald-400">{veh.drivetrain}</span>
                      </div>
                      <div className="bg-zinc-950/60 p-1.5 rounded-lg border border-zinc-800">
                        <span className="block text-[9px] text-zinc-500 uppercase font-bold">Seats</span>
                        <span className="text-xs font-mono font-black text-zinc-300">{veh.capacity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 flex items-center justify-end gap-2 border-t border-zinc-800/40 mt-2">
                  <button
                    onClick={() => handleOpenEdit(veh)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit Vehicle</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(veh)}
                    className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-400 hover:text-white transition cursor-pointer"
                    title="Delete Vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT / CREATE VEHICLE MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">
                  {editingVehicle ? `Edit Vehicle: ${editingVehicle.name}` : 'Add New Vehicle to Catalog'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              {/* Photo Upload Zone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Vehicle Image (Upload from Local PC or URL)
                </label>
                
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingImage(true);
                  }}
                  onDragLeave={() => setIsDraggingImage(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingImage(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processImageFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-2 ${
                    isDraggingImage
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-zinc-700 bg-zinc-950/60 hover:border-zinc-500'
                  }`}
                >
                  {formData.imageUrl ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden group">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-amber-400 mb-1" />
                      <p className="text-xs text-zinc-300 font-bold">
                        Drag & Drop your PC image file here, or click to browse
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Supports PNG, JPG, WEBP (Automatically compressed for instant loading)
                      </p>
                    </>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processImageFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {!formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition"
                    >
                      Upload Local PC Image
                    </button>
                  )}
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-zinc-500 font-mono block mb-1">Or paste direct image URL:</span>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Basic Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Vehicle Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="Pegassi Ignus Custom"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Manufacturer / Brand</label>
                  <input
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="Pegassi"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Category</label>
                  <select
                    value={formData.category || 'Super'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Super">Super</option>
                    <option value="Sports">Sports</option>
                    <option value="Muscle">Muscle</option>
                    <option value="Off-Road">Off-Road</option>
                    <option value="Motorcycles">Motorcycles</option>
                    <option value="Helicopters">Helicopters</option>
                    <option value="Boats">Boats</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Trade Price ($ Optional)</label>
                  <input
                    type="number"
                    value={formData.tradePrice || ''}
                    onChange={(e) => setFormData({ ...formData, tradePrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Dealer</label>
                  <select
                    value={formData.dealer || 'Legendary Motorsport'}
                    onChange={(e) => setFormData({ ...formData, dealer: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Legendary Motorsport">Legendary Motorsport</option>
                    <option value="Southern San Andreas Super Autos">Southern San Andreas Super Autos</option>
                    <option value="Warstock Cache & Carry">Warstock Cache & Carry</option>
                    <option value="DockTease">DockTease</option>
                    <option value="Elitás Travel">Elitás Travel</option>
                  </select>
                </div>
              </div>

              {/* Trade Condition */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Trade Price Unlock Condition</label>
                <input
                  type="text"
                  value={formData.tradePriceCondition || ''}
                  onChange={(e) => setFormData({ ...formData, tradePriceCondition: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Complete 5 Vice City Street Races in 1st Place"
                />
              </div>

              {/* Telemetry Stats Inputs */}
              <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-2xl space-y-3">
                <span className="block text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  Telemetry & Performance Stats
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Top Speed (MPH)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.topSpeedMph || 120}
                      onChange={(e) => setFormData({ ...formData, topSpeedMph: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Acceleration (0-100)</label>
                    <input
                      type="number"
                      value={formData.acceleration || 80}
                      onChange={(e) => setFormData({ ...formData, acceleration: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Braking (0-100)</label>
                    <input
                      type="number"
                      value={formData.braking || 80}
                      onChange={(e) => setFormData({ ...formData, braking: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Handling (0-100)</label>
                    <input
                      type="number"
                      value={formData.handling || 80}
                      onChange={(e) => setFormData({ ...formData, handling: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Drivetrain</label>
                    <select
                      value={formData.drivetrain || 'AWD'}
                      onChange={(e) => setFormData({ ...formData, drivetrain: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                    >
                      <option value="AWD">AWD (All Wheel Drive)</option>
                      <option value="RWD">RWD (Rear Wheel Drive)</option>
                      <option value="FWD">FWD (Front Wheel Drive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Seating Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity || 2}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Modding Budget ($)</label>
                    <input
                      type="number"
                      value={formData.baseModdingBudget || 250000}
                      onChange={(e) => setFormData({ ...formData, baseModdingBudget: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Describe the vehicle styling, performance, handling..."
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.featuredInTrailer)}
                    onChange={(e) => setFormData({ ...formData, featuredInTrailer: e.target.checked })}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-zinc-300">Featured in GTA VI Trailer</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isCustomizable)}
                    onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-zinc-300">Supports Custom Tuning Mods</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  {editingVehicle ? 'Save Changes' : 'Publish Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PHOTO CHANGER MODAL */}
      {quickImageModalVeh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Update Vehicle Photo</h3>
                  <p className="text-[11px] text-zinc-400">{quickImageModalVeh.brand} • {quickImageModalVeh.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickImageModalVeh(null)}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current/New Photo Preview */}
            <div className="space-y-2">
              <div className="relative h-44 w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">
                <img
                  src={quickImageUrlInput || quickImageModalVeh.imageUrl}
                  alt={quickImageModalVeh.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80';
                  }}
                />
              </div>
            </div>

            {/* PC Upload Button */}
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl cursor-pointer bg-zinc-950/80 hover:bg-zinc-900 transition text-center p-2 group">
              <Upload className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
              <span className="text-xs font-bold text-white">Upload New Photo from PC</span>
              <span className="text-[9px] text-zinc-400">Click to browse your computer files</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    processQuickImageFile(file);
                  }
                }}
              />
            </label>

            {/* Direct URL Input */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Or Direct Image URL
              </label>
              <div className="relative">
                <LinkIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={quickImageUrlInput}
                  onChange={(e) => setQuickImageUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setQuickImageModalVeh(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickImage}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-rose-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Delete Vehicle Profile?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Are you sure you want to remove <strong className="text-rose-300">"{deleteTarget.name}"</strong> from the catalog? This will delete the document from Cloud Firestore.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteVehicle}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET TO DEFAULT MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-amber-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Reset Vehicle Catalog?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                This will reset the vehicle catalog back to the official Rockstar Games vehicle dataset and purge custom vehicle additions from Cloud Firestore.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetToDefault}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
