'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Business } from '../../types';
import { BUSINESSES_DATA } from '../../data/businesses';
import {
  getStoredBusinesses,
  saveOrUpdateBusiness,
  deleteBusiness,
  resetBusinessesToDefault,
  BUSINESSES_UPDATED_EVENT
} from '../../lib/businessStore';
import { logStaffActivity } from '../../lib/staffAuditLogger';
import { uploadImageAsset } from '../../lib/uploadService';
import { getCacheBustedImageUrl } from '../../lib/imageCacheBuster';
import {
  Building2,
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
  DollarSign,
  TrendingUp,
  Clock,
  Wrench,
  Save,
  Link as LinkIcon
} from 'lucide-react';

export const BusinessCatalogAdminCms: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'purchasePrice' | 'maxDailyIncome' | 'name'>('purchasePrice');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal State for Editing/Adding
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<Partial<Business>>({
    name: '',
    slug: '',
    type: 'Nightclub',
    location: '',
    purchasePrice: 2000000,
    maxDailyIncome: 150000,
    setupCost: 250000,
    maxUpgradesCost: 1500000,
    payoutFrequencyHours: 1,
    difficulty: 'Medium',
    description: '',
    imageUrl: ''
  });

  // Image Upload Drag & Drop State
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Modals
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Quick Image Upload Modal State
  const [quickImageModalBiz, setQuickImageModalBiz] = useState<Business | null>(null);
  const [quickImageUrlInput, setQuickImageUrlInput] = useState<string>('');
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    setIsLoading(true);
    getStoredBusinesses().then((data) => {
      setBusinesses(data);
      setIsLoading(false);
    });

    const handleUpdated = (e: CustomEvent<Business[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBusinesses(e.detail);
      }
    };

    window.addEventListener(BUSINESSES_UPDATED_EVENT as any, handleUpdated);
    return () => {
      window.removeEventListener(BUSINESSES_UPDATED_EVENT as any, handleUpdated);
    };
  }, []);

  const handleOpenAddModal = () => {
    setEditingBusiness(null);
    setFormData({
      name: '',
      slug: '',
      type: 'Nightclub',
      location: 'Vice City Commercial District',
      purchasePrice: 2000000,
      maxDailyIncome: 150000,
      setupCost: 250000,
      maxUpgradesCost: 1500000,
      payoutFrequencyHours: 1,
      difficulty: 'Medium',
      description: 'High-earning commercial operation in Vice City.',
      imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80'
    });
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = (biz: Business) => {
    setEditingBusiness(biz);
    setFormData({ ...biz });
    setIsEditorOpen(true);
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.imageUrl) {
      showNotification('⚠️ Property Name and Image URL are required!');
      return;
    }

    const cleanSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cleanId = editingBusiness?.id || `biz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    const newBusiness: Business = {
      id: cleanId,
      slug: cleanSlug,
      name: formData.name,
      type: formData.type || 'Commercial',
      location: formData.location || 'Leonida',
      purchasePrice: Number(formData.purchasePrice) || 1000000,
      maxDailyIncome: Number(formData.maxDailyIncome) || 100000,
      setupCost: Number(formData.setupCost) || 100000,
      maxUpgradesCost: Number(formData.maxUpgradesCost) || 500000,
      payoutFrequencyHours: Number(formData.payoutFrequencyHours) || 1,
      difficulty: (formData.difficulty as any) || 'Medium',
      description: formData.description || '',
      imageUrl: formData.imageUrl,
      ...(editingBusiness ? { updatedAt: now, imageVersion: now } : { createdAt: now })
    } as Business;

    try {
      const updatedList = await saveOrUpdateBusiness(newBusiness);
      setBusinesses(updatedList);
      setIsEditorOpen(false);
      showNotification(editingBusiness ? `✅ Business "${newBusiness.name}" updated successfully!` : `✅ New property "${newBusiness.name}" added to catalog!`);
      logStaffActivity({
        actionType: editingBusiness ? 'CMS_CONTENT_UPDATE' : 'CMS_CONTENT_CREATE',
        actionCategory: 'Content CMS',
        targetId: newBusiness.id,
        details: `Saved property item: ${newBusiness.name} ($${newBusiness.purchasePrice})`
      });
    } catch (err) {
      console.error(err);
      showNotification('❌ Failed to save commercial property to Firestore store.');
    }
  };

  const handleDeleteBusiness = async (biz: Business) => {
    try {
      const updatedList = await deleteBusiness(biz.id);
      setBusinesses(updatedList);
      setDeleteTarget(null);
      showNotification(`🗑️ Commercial Property "${biz.name}" deleted from catalog.`);
      logStaffActivity({
        actionType: 'CMS_CONTENT_DELETE',
        actionCategory: 'Content CMS',
        targetId: biz.id,
        details: `Deleted property item: ${biz.name} (${biz.id})`
      });
    } catch (err) {
      console.error(err);
      showNotification('❌ Failed to delete property item.');
    }
  };

  const handleResetToDefault = async () => {
    try {
      const defaultList = await resetBusinessesToDefault();
      setBusinesses(defaultList);
      setShowResetConfirm(false);
      showNotification('🔄 Commercial Property catalog reset to default Rockstar data!');
      logStaffActivity({
        actionType: 'CMS_CONTENT_UPDATE',
        actionCategory: 'Content CMS',
        targetId: 'master_business_bundle',
        details: 'Reset commercial property catalog to defaults'
      });
    } catch (err) {
      console.error(err);
      showNotification('❌ Failed to reset catalog.');
    }
  };

  const handleFileUpload = async (file: File, isQuickModal = false) => {
    if (!file.type.startsWith('image/')) {
      showNotification('⚠️ Only image files (PNG, JPG, WEBP) are allowed.');
      return;
    }
    showNotification('⏳ Processing image upload...');
    try {
      const uploadedUrl = await uploadImageAsset(file, 'generalImage');
      if (isQuickModal && quickImageModalBiz) {
        setQuickImageUrlInput(uploadedUrl);
      } else {
        setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      }
      showNotification('✨ Property image ready!');
    } catch (err) {
      console.error(err);
      showNotification('❌ Image upload failed. Try again.');
    }
  };

  const handleSaveQuickImage = async () => {
    if (!quickImageModalBiz || !quickImageUrlInput.trim()) return;
    const now = Date.now();
    const updatedBiz: Business = {
      ...quickImageModalBiz,
      imageUrl: quickImageUrlInput.trim(),
      updatedAt: now,
      imageVersion: now
    } as Business;

    try {
      const list = await saveOrUpdateBusiness(updatedBiz);
      setBusinesses(list);
      setQuickImageModalBiz(null);
      setQuickImageUrlInput('');
      showNotification(`🖼️ Image updated for "${updatedBiz.name}"!`);
      logStaffActivity({
        actionType: 'CMS_CONTENT_UPDATE',
        actionCategory: 'Content CMS',
        targetId: updatedBiz.id,
        details: `Updated photo for business ${updatedBiz.name}`
      });
    } catch (err) {
      console.error(err);
      showNotification('❌ Failed to update business image.');
    }
  };

  // Filter & Sorting
  const filteredBusinesses = businesses
    .filter((biz) => {
      const matchesSearch =
        biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || biz.type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'purchasePrice') return b.purchasePrice - a.purchasePrice;
      if (sortBy === 'maxDailyIncome') return b.maxDailyIncome - a.maxDailyIncome;
      return a.name.localeCompare(b.name);
    });

  const businessTypes = Array.from(new Set(businesses.map((b) => b.type)));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Commercial Property Catalog Management
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Add, update, or edit commercial property images, CapEx prices, daily yields, and ROI parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search property by name, type, or location..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Property Types ({businesses.length})</option>
            {businessTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 shrink-0">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="purchasePrice">Purchase Price (Highest First)</option>
            <option value="maxDailyIncome">Max Daily Income (Highest First)</option>
            <option value="name">Property Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Businesses Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-500 text-xs">Loading commercial property catalog...</div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="p-12 text-center text-zinc-400 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-xs">
          No commercial properties found matching your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredBusinesses.map((biz) => (
            <div
              key={biz.id}
              className="bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Image & Quick Upload Button */}
                <div className="relative h-44 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 mb-3 group/img">
                  <img
                    src={getCacheBustedImageUrl(biz.imageUrl, (biz as any).imageVersion || (biz as any).updatedAt)}
                    alt={biz.name}
                    className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/90 text-zinc-950 shadow-md">
                    {biz.type}
                  </span>

                  {/* Quick Change Photo Button overlay */}
                  <button
                    onClick={() => {
                      setQuickImageModalBiz(biz);
                      setQuickImageUrlInput(biz.imageUrl);
                    }}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-zinc-950/90 hover:bg-emerald-500 hover:text-slate-950 text-white text-[11px] font-bold border border-zinc-700/80 transition flex items-center gap-1.5 shadow-lg backdrop-blur-sm cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Change Image</span>
                  </button>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-emerald-300 font-medium">📍 {biz.location}</p>
                      <h4 className="text-base font-black text-white">{biz.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ${biz.purchasePrice.toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">{biz.description}</p>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[11px] mb-3">
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold">Max Daily</span>
                    <span className="font-mono font-bold text-emerald-400">${biz.maxDailyIncome.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold">Upgrades</span>
                    <span className="font-mono text-zinc-300">${biz.maxUpgradesCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold">Difficulty</span>
                    <span className="font-bold text-amber-400">{biz.difficulty}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/60">
                <button
                  onClick={() => handleOpenEditModal(biz)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(biz)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-bold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Business Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 my-8 relative shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                {editingBusiness ? `Edit Property: ${editingBusiness.name}` : 'Add New Commercial Property'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Property Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Malibu Club Vice Beach"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Property Type</label>
                  <input
                    type="text"
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g. Nightclub, Chop Shop, Acid Lab"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Location / Zone</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Ocean Drive, Vice Beach"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Difficulty Rating</label>
                  <select
                    value={formData.difficulty || 'Medium'}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Purchase Price ($) *</label>
                  <input
                    type="number"
                    required
                    value={formData.purchasePrice || 0}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Max Daily Income ($) *</label>
                  <input
                    type="number"
                    required
                    value={formData.maxDailyIncome || 0}
                    onChange={(e) => setFormData({ ...formData, maxDailyIncome: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Setup / License Cost ($)</label>
                  <input
                    type="number"
                    value={formData.setupCost || 0}
                    onChange={(e) => setFormData({ ...formData, setupCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Max Upgrades Cost ($)</label>
                  <input
                    type="number"
                    value={formData.maxUpgradesCost || 0}
                    onChange={(e) => setFormData({ ...formData, maxUpgradesCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe operational yields, safe income mechanics, or contraband warehousing..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Image Input & Drag-Drop Box */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Property Image URL or File Upload *</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={formData.imageUrl || ''}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload File</span>
                    </button>
                  </div>

                  {/* Image Preview Box */}
                  {formData.imageUrl && (
                    <div className="relative h-36 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                        Image Preview
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Commercial Property</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Image Upload Modal */}
      {quickImageModalBiz && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                Change Photo: {quickImageModalBiz.name}
              </h3>
              <button
                onClick={() => setQuickImageModalBiz(null)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Image URL</label>
                <input
                  type="url"
                  value={quickImageUrlInput}
                  onChange={(e) => setQuickImageUrlInput(e.target.value)}
                  placeholder="Paste image web URL..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-bold uppercase">or</span>
                <input
                  type="file"
                  ref={quickFileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0], true);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => quickFileInputRef.current?.click()}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload Local File</span>
                </button>
              </div>

              {quickImageUrlInput && (
                <div className="relative h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <img
                    src={quickImageUrlInput}
                    alt="Quick Preview"
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setQuickImageModalBiz(null)}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuickImage}
                disabled={!quickImageUrlInput.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Update Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-white">Delete Commercial Property?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{deleteTarget.name}</strong> from the catalog? This will remove it from the ROI Calculator.
            </p>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBusiness(deleteTarget)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition"
              >
                Delete Property
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
