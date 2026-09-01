'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Weapon, WeaponCategory, WeaponAttachment } from '../../types';
import { WEAPONS_DATA } from '../../data/weapons';
import {
  getStoredWeapons,
  saveOrUpdateWeapon,
  deleteWeapon,
  resetWeaponsToDefault,
  WEAPONS_UPDATED_EVENT
} from '../../lib/weaponStore';
import { logStaffActivity } from '../../lib/staffAuditLogger';
import {
  Crosshair,
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
  Target,
  Zap,
  Flame,
  Shield,
  Lock,
  Wrench
} from 'lucide-react';

export const WeaponCatalogAdminCms: React.FC = () => {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'damage' | 'fireRate' | 'price' | 'name'>('damage');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal State for Editing/Adding
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingWeapon, setEditingWeapon] = useState<Weapon | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<Partial<Weapon>>({
    name: '',
    manufacturer: 'Hawk & Little',
    category: 'Assault Rifles',
    damage: 75,
    fireRate: 70,
    accuracy: 80,
    range: 65,
    magazineSize: 30,
    ttkMs: 320,
    unlockRank: 1,
    price: 18500,
    description: '',
    imageUrl: '',
    attachments: [
      { id: 'att_1', name: 'Extended Magazine', cost: 2500, effect: '+15 Mag Capacity' },
      { id: 'att_2', name: 'Suppressor', cost: 4000, effect: '-10% Sound & Flash' }
    ]
  });

  // New Attachment Field State inside Modal
  const [newAttName, setNewAttName] = useState('');
  const [newAttCost, setNewAttCost] = useState(1500);
  const [newAttEffect, setNewAttEffect] = useState('+5% Accuracy');

  // Image Upload Drag & Drop State
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Modals
  const [deleteTarget, setDeleteTarget] = useState<Weapon | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    setIsLoading(true);
    getStoredWeapons().then((data) => {
      setWeapons(data);
      setIsLoading(false);
    });

    const handleUpdate = (e: CustomEvent<Weapon[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setWeapons(e.detail);
      }
    };

    window.addEventListener(WEAPONS_UPDATED_EVENT as any, handleUpdate);
    return () => {
      window.removeEventListener(WEAPONS_UPDATED_EVENT as any, handleUpdate);
    };
  }, []);

  // Filter and Sort Weapons
  const filteredWeapons = weapons
    .filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || w.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'fireRate') return b.fireRate - a.fireRate;
      if (sortBy === 'price') return b.price - a.price;
      return b.damage - a.damage;
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
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
        setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
        showNotification('✅ Weapon image optimized and attached!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    setEditingWeapon(null);
    setFormData({
      name: '',
      manufacturer: 'Hawk & Little',
      category: 'Assault Rifles',
      damage: 78,
      fireRate: 72,
      accuracy: 82,
      range: 68,
      magazineSize: 30,
      ttkMs: 310,
      unlockRank: 1,
      price: 19500,
      description: 'Standard issue Vice City Police Department carbine assault rifle.',
      imageUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80',
      attachments: [
        { id: 'att_1', name: 'Extended Magazine', cost: 2500, effect: '+15 Mag Capacity' },
        { id: 'att_2', name: 'Suppressor', cost: 4000, effect: '-10% Sound & Flash' }
      ]
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (w: Weapon) => {
    setEditingWeapon(w);
    setFormData({ ...w, attachments: w.attachments || [] });
    setIsEditorOpen(true);
  };

  const handleAddAttachment = () => {
    if (!newAttName.trim()) return;
    const newAtt: WeaponAttachment = {
      id: `att_${Date.now()}`,
      name: newAttName.trim(),
      cost: Number(newAttCost) || 1000,
      effect: newAttEffect.trim() || '+5% Boost'
    };
    setFormData((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), newAtt]
    }));
    setNewAttName('');
    setNewAttCost(1500);
    setNewAttEffect('+5% Accuracy');
  };

  const handleRemoveAttachment = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== id)
    }));
  };

  const handleSaveWeapon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showNotification('⚠️ Weapon name is required.');
      return;
    }

    const weaponId = editingWeapon
      ? editingWeapon.id
      : `w_custom_${Date.now()}`;
    const slug =
      formData.slug ||
      formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const completeWeapon: Weapon = {
      id: weaponId,
      slug: slug,
      name: formData.name.trim(),
      manufacturer: formData.manufacturer || 'Hawk & Little',
      category: (formData.category as WeaponCategory) || 'Assault Rifles',
      damage: Number(formData.damage) || 50,
      fireRate: Number(formData.fireRate) || 50,
      accuracy: Number(formData.accuracy) || 50,
      range: Number(formData.range) || 50,
      magazineSize: Number(formData.magazineSize) || 30,
      ttkMs: Number(formData.ttkMs) || 300,
      unlockRank: Number(formData.unlockRank) || 1,
      price: Number(formData.price) || 0,
      description: formData.description || '',
      imageUrl:
        formData.imageUrl ||
        'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80',
      attachments: formData.attachments || []
    };

    try {
      const updated = await saveOrUpdateWeapon(completeWeapon);
      setWeapons(updated);
      setIsEditorOpen(false);
      showNotification(
        editingWeapon
          ? `Updated weapon "${completeWeapon.name}"!`
          : `Added new weapon "${completeWeapon.name}"!`
      );

      logStaffActivity({
        actionType: editingWeapon ? 'CMS_CONTENT_UPDATE' : 'CMS_CONTENT_CREATE',
        actionCategory: 'Content CMS',
        targetId: completeWeapon.id,
        targetName: completeWeapon.name,
        targetType: 'weapon',
        severity: 'MEDIUM',
        details: `Staff ${editingWeapon ? 'updated' : 'created'} weapon profile "${completeWeapon.name}" ($${completeWeapon.price.toLocaleString()}).`
      }).catch(() => {});
    } catch (err) {
      console.error('Save weapon error:', err);
      showNotification('❌ Failed to save weapon. Check console for details.');
    }
  };

  const confirmDeleteWeapon = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const updated = await deleteWeapon(target.id);
      setWeapons(updated);
      showNotification(`Deleted weapon "${target.name}".`);

      logStaffActivity({
        actionType: 'CMS_CONTENT_DELETE',
        actionCategory: 'Content CMS',
        targetId: target.id,
        targetName: target.name,
        targetType: 'weapon',
        severity: 'HIGH',
        details: `Staff deleted weapon "${target.name}" (${target.id}) from catalog.`
      }).catch(() => {});
    } catch (err) {
      showNotification('❌ Failed to delete weapon.');
    }
  };

  const confirmResetToDefault = async () => {
    setShowResetConfirm(false);
    try {
      const updated = await resetWeaponsToDefault();
      setWeapons(updated);
      showNotification('Reset weapon catalog to Rockstar default dataset!');

      logStaffActivity({
        actionType: 'CMS_CONTENT_UPDATE',
        actionCategory: 'Content CMS',
        targetId: 'weapon_catalog',
        targetName: 'Weapon Catalog Dataset',
        targetType: 'dataset',
        severity: 'CRITICAL',
        details: 'Staff reset weapon catalog back to Rockstar default dataset.'
      }).catch(() => {});
    } catch (err) {
      showNotification('❌ Failed to reset weapons.');
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
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-red-950/40 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-red-500/10 text-red-400 border border-red-500/30">
                Firestore Catalog Sync
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {weapons.length} Total Weapons
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Crosshair className="w-6 h-6 text-red-400" />
              <span>Weapon Arsenal CMS</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Manage Vice City firearms, ballistics specs, attachments, unlock ranks, and prices with instant Cloud Firestore sync and PC photo uploader.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold border border-zinc-700 flex items-center justify-center gap-1.5 transition"
              title="Reset weapon catalog to Rockstar defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Weapon</span>
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
            placeholder="Search weapons by name or manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50"
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
              <option value="Handguns">Handguns</option>
              <option value="SMGs">SMGs</option>
              <option value="Assault Rifles">Assault Rifles</option>
              <option value="Shotguns">Shotguns</option>
              <option value="Heavy Weapons">Heavy Weapons</option>
              <option value="Melee">Melee</option>
              <option value="Throwables">Throwables</option>
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
              <option value="damage">Highest Damage</option>
              <option value="fireRate">Fire Rate</option>
              <option value="price">Price</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Weapon Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-zinc-900/60 rounded-2xl border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : filteredWeapons.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center space-y-3">
          <Crosshair className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-sm text-zinc-400 font-medium">No weapons match your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWeapons.map((wpn) => {
            const isDefault = WEAPONS_DATA.some((dw) => dw.id === wpn.id);
            return (
              <div
                key={wpn.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition group flex flex-col justify-between"
              >
                <div>
                  {/* Image Container */}
                  <div className="h-44 w-full bg-zinc-950 relative overflow-hidden">
                    <img
                      src={wpn.imageUrl}
                      alt={wpn.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40" />

                    {/* Category Badge */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-red-400 border border-red-500/30">
                      {wpn.category}
                    </span>

                    {/* Default vs Custom Badge */}
                    <span
                      className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold ${
                        isDefault
                          ? 'bg-zinc-800/80 text-zinc-400 border border-zinc-700'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {isDefault ? 'Rockstar Default' : 'Custom Entry'}
                    </span>

                    {/* Price Tag & Unlock Rank */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className="text-lg font-black text-white font-mono drop-shadow-md">
                        ${wpn.price.toLocaleString()}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-red-400" />
                        Rank {wpn.unlockRank}
                      </span>
                    </div>
                  </div>

                  {/* Body Specs */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase text-red-400 tracking-wider">
                        {wpn.manufacturer}
                      </div>
                      <h3 className="text-base font-black text-white group-hover:text-red-400 transition">
                        {wpn.name}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                        {wpn.description}
                      </p>
                    </div>

                    {/* Stats Progress Bars */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500 font-bold uppercase">Damage</span>
                        <span className="text-red-400 font-mono font-black">{wpn.damage}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${wpn.damage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-zinc-500 font-bold uppercase">Fire Rate</span>
                        <span className="text-amber-400 font-mono font-black">{wpn.fireRate}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${wpn.fireRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Attachments Count */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 font-mono">
                      <span>{wpn.attachments?.length || 0} Attachments</span>
                      <span>TTK: {wpn.ttkMs}ms</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-0 flex items-center justify-end gap-2 border-t border-zinc-800/40 mt-2">
                  <button
                    onClick={() => handleOpenEdit(wpn)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-red-400" />
                    <span>Edit Weapon</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(wpn)}
                    className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-400 hover:text-white transition cursor-pointer"
                    title="Delete Weapon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT / CREATE WEAPON MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-black text-white">
                  {editingWeapon ? `Edit Weapon: ${editingWeapon.name}` : 'Add New Weapon to Arsenal'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWeapon} className="space-y-4">
              {/* Photo Upload Zone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Weapon Photo (Upload from Local PC or URL)
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
                      ? 'border-red-400 bg-red-500/10'
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
                          className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-black"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-red-400 mb-1" />
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Basic Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Weapon Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    placeholder="VCPD Heavy Pistol"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer || ''}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    placeholder="Hawk & Little"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Category</label>
                  <select
                    value={formData.category || 'Assault Rifles'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Handguns">Handguns</option>
                    <option value="SMGs">SMGs</option>
                    <option value="Assault Rifles">Assault Rifles</option>
                    <option value="Shotguns">Shotguns</option>
                    <option value="Heavy Weapons">Heavy Weapons</option>
                    <option value="Melee">Melee</option>
                    <option value="Throwables">Throwables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Unlock Rank</label>
                  <input
                    type="number"
                    value={formData.unlockRank || 1}
                    onChange={(e) => setFormData({ ...formData, unlockRank: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">TTK (Time-to-Kill ms)</label>
                  <input
                    type="number"
                    value={formData.ttkMs || 300}
                    onChange={(e) => setFormData({ ...formData, ttkMs: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-2xl space-y-3">
                <span className="block text-xs font-extrabold text-red-400 uppercase tracking-wider">
                  Ballistics & Stat Ratios (0-100)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Damage</label>
                    <input
                      type="number"
                      value={formData.damage || 50}
                      onChange={(e) => setFormData({ ...formData, damage: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-red-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Fire Rate</label>
                    <input
                      type="number"
                      value={formData.fireRate || 50}
                      onChange={(e) => setFormData({ ...formData, fireRate: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Accuracy</label>
                    <input
                      type="number"
                      value={formData.accuracy || 50}
                      onChange={(e) => setFormData({ ...formData, accuracy: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Range</label>
                    <input
                      type="number"
                      value={formData.range || 50}
                      onChange={(e) => setFormData({ ...formData, range: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">Mag Size</label>
                    <input
                      type="number"
                      value={formData.magazineSize || 30}
                      onChange={(e) => setFormData({ ...formData, magazineSize: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Attachments Configurator */}
              <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-red-400" />
                    <span>Weapon Attachments ({formData.attachments?.length || 0})</span>
                  </span>
                </div>

                {/* Existing Attachments List */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(formData.attachments || []).map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{att.name}</span>
                        <span className="text-zinc-500 ml-2 font-mono">${att.cost}</span>
                        <span className="text-emerald-400 ml-2 font-mono">{att.effect}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1 rounded-lg hover:bg-rose-950 text-rose-400 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Attachment Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-800/60">
                  <input
                    type="text"
                    placeholder="Attachment Name (e.g. Scope)"
                    value={newAttName}
                    onChange={(e) => setNewAttName(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="number"
                    placeholder="Cost ($)"
                    value={newAttCost}
                    onChange={(e) => setNewAttCost(Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Effect (+10% Range)"
                      value={newAttEffect}
                      onChange={(e) => setNewAttEffect(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="px-3 py-1.5 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-400 transition cursor-pointer"
                    >
                      Add
                    </button>
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
                  placeholder="Describe weapon history, fire modes, ballistics..."
                />
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
                  className="px-6 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-black shadow-lg shadow-red-500/20 transition cursor-pointer"
                >
                  {editingWeapon ? 'Save Changes' : 'Publish Weapon'}
                </button>
              </div>
            </form>
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
              <h3 className="text-lg font-black text-white">Delete Weapon Profile?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Are you sure you want to remove <strong className="text-rose-300">"{deleteTarget.name}"</strong> from the arsenal? This will delete the document from Cloud Firestore.
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
                onClick={confirmDeleteWeapon}
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
          <div className="bg-zinc-900 border border-red-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-800 flex items-center justify-center text-red-400">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Reset Weapon Catalog?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                This will reset the weapon catalog back to official Rockstar Games firearms datasets and purge custom weapon additions from Cloud Firestore.
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
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition"
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
