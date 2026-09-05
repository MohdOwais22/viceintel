'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as FirebaseUser, updateProfile } from 'firebase/auth';
import {
  GTA6_AVATARS,
  AvatarPreset,
  generateCustomGtaAvatar,
  getUserHierarchyLevel,
  checkAvatarAccess,
  getSafePhotoURL
} from '../data/avatars';
import {
  X,
  Check,
  Sparkles,
  Search,
  RefreshCw,
  Shield,
  ShieldCheck,
  Crown,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Palette,
  Lock,
  Zap,
  Info
} from 'lucide-react';

interface AvatarCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  currentAvatar?: string;
  onSaveAvatar?: (newAvatarUrl: string) => void;
  isVipActive?: boolean;
  isStaff?: boolean;
  isAdmin?: boolean;
  userRole?: string;
  userLevel?: string;
  onUpgradeToVip?: () => void;
}

export function AvatarCreatorModal({
  isOpen,
  onClose,
  currentUser,
  currentAvatar,
  onSaveAvatar,
  isVipActive = false,
  isStaff = false,
  isAdmin = false,
  userRole,
  userLevel,
  onUpgradeToVip
}: AvatarCreatorModalProps) {
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(currentAvatar || GTA6_AVATARS[0].url);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customSeed, setCustomSeed] = useState<string>('');
  const [customGeneratedUrl, setCustomGeneratedUrl] = useState<string>('');
  const [customStyle, setCustomStyle] = useState<string>('avataaars');

  // Dynamic user profile state fetched from Firestore if available
  const [resolvedRole, setResolvedRole] = useState<string | undefined>(userRole);
  const [resolvedIsVip, setResolvedIsVip] = useState<boolean>(isVipActive);
  const [resolvedIsStaff, setResolvedIsStaff] = useState<boolean>(isStaff);
  const [resolvedIsAdmin, setResolvedIsAdmin] = useState<boolean>(isAdmin);

  // Firestore saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Fetch live profile role data on open
  useEffect(() => {
    if (isOpen && currentUser?.uid) {
      const fetchProfile = async () => {
        try {
          const apiRes = await fetch(`/api/user/profile?uid=${encodeURIComponent(currentUser.uid)}`);
          if (apiRes.ok) {
            const payload = await apiRes.json();
            if (payload.success && payload.data) {
              const data = payload.data;
              if (data.role) setResolvedRole(data.role);
              if (data.isVip !== undefined) setResolvedIsVip(data.isVip);
              if (data.isStaff !== undefined) setResolvedIsStaff(data.isStaff);
              if (data.isAdmin !== undefined) setResolvedIsAdmin(data.isAdmin);
            }
          }
        } catch (err) {
          console.warn('Could not fetch user profile role info for avatar modal:', err);
        }
      };
      fetchProfile();
    } else {
      setResolvedRole(userRole);
      setResolvedIsVip(isVipActive);
      setResolvedIsStaff(isStaff);
      setResolvedIsAdmin(isAdmin);
    }
  }, [isOpen, currentUser, userRole, isVipActive, isStaff, isAdmin]);

  // Compute effective hierarchy level
  const userHierarchy = getUserHierarchyLevel({
    isAdmin: resolvedIsAdmin || isAdmin,
    isStaff: resolvedIsStaff || isStaff,
    isVip: resolvedIsVip || isVipActive,
    role: resolvedRole || userRole,
    userLevel
  });

  const isL2OrAbove = userHierarchy.levelNum >= 2 || resolvedIsVip || resolvedIsStaff || resolvedIsAdmin || isVipActive || isStaff || isAdmin;

  // Sync initial avatar when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial = currentAvatar || localStorage.getItem('gtavi_active_avatar') || GTA6_AVATARS[0].url;
      setSelectedAvatarUrl(initial);
      setSaveStatus('idle');
      setStatusMessage('');
      setSearchQuery('');
      setCustomSeed(currentUser?.displayName || 'ViceLegend');
      setCustomGeneratedUrl(generateCustomGtaAvatar(currentUser?.displayName || 'ViceLegend', customStyle));
    }
  }, [isOpen, currentAvatar, currentUser]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Filter avatars based on access, category, and search query
  const unlockedAvatars = GTA6_AVATARS.filter((av) => checkAvatarAccess(av, userHierarchy).isUnlocked);

  const filteredAvatars = unlockedAvatars.filter((av) => {
    const matchesCategory =
      activeCategory === 'All' ||
      av.game === activeCategory ||
      av.category === activeCategory ||
      (activeCategory === 'Special' && (av.game === 'Special' || av.category === 'Special Moderator'));

    const matchesSearch =
      searchQuery.trim() === '' ||
      av.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      av.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      av.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
      av.character.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const activePreset = GTA6_AVATARS.find((a) => a.url === selectedAvatarUrl);
  const activePresetAccess = activePreset ? checkAvatarAccess(activePreset, userHierarchy) : { isUnlocked: true };

  const handleGenerateCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = generateCustomGtaAvatar(customSeed, customStyle);
    setCustomGeneratedUrl(url);
    setSelectedAvatarUrl(url);
    setSaveStatus('idle');
    setStatusMessage('');
  };

  const handleSelectAvatar = (av: AvatarPreset) => {
    const access = checkAvatarAccess(av, userHierarchy);
    if (!access.isUnlocked) {
      setSaveStatus('error');
      if (av.isSpecialModerator || av.tier === 'L3') {
        setStatusMessage(`Restricted: ${av.label} is reserved for Staff & Moderators.`);
      } else {
        setStatusMessage(`Restricted: ${av.label} requires an active VIP Membership Pass.`);
      }
      return;
    }

    setSelectedAvatarUrl(av.url);
    setSaveStatus('idle');
    setStatusMessage('');
  };

  const handleSaveToFirestore = async () => {
    // Verify access
    const targetPreset = GTA6_AVATARS.find((a) => a.url === selectedAvatarUrl);
    if (targetPreset) {
      const access = checkAvatarAccess(targetPreset, userHierarchy);
      if (!access.isUnlocked) {
        setIsSaving(false);
        setSaveStatus('error');
        setStatusMessage(`Cannot Equip: ${access.reason || 'You do not have the required clearance to equip this avatar.'}`);
        return;
      }
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setStatusMessage('Saving avatar to your cloud profile...');

    try {
      // 1. Persist to localStorage for instant local/offline availability
      localStorage.setItem('gtavi_active_avatar', selectedAvatarUrl);

      // 2. If authenticated, persist to user's MongoDB profile
      if (currentUser?.uid) {
        const timestamp = new Date().toISOString();

        await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: currentUser.uid,
            avatar: selectedAvatarUrl,
            updatedAt: timestamp
          })
        });

        // 3. Update Firebase Auth user photoURL
        try {
          await updateProfile(currentUser, {
            photoURL: getSafePhotoURL(selectedAvatarUrl, currentUser.displayName || currentUser.email)
          });
        } catch (authErr) {
          console.warn('Auth profile photoURL update warning:', authErr);
        }
      }

      // 4. Notify parent state
      if (onSaveAvatar) {
        onSaveAvatar(selectedAvatarUrl);
      }

      setSaveStatus('success');
      setStatusMessage(
        currentUser
          ? '✓ Avatar successfully equipped and synced to your cloud profile!'
          : '✓ Avatar activated for your session! Sign in to sync across devices.'
      );

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Failed to save avatar to Firestore:', err);
      setIsSaving(false);
      setSaveStatus('error');
      setStatusMessage(err?.message || 'Failed to save avatar to cloud database. Please try again.');
    }
  };

  if (!isOpen) return null;

  // Render VIP Lockout view if user is below L2
  if (!isL2OrAbove) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-zinc-950 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center space-y-5 my-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Crown className="w-8 h-8 fill-current" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white tracking-tight">
                Avatar Creator Studio
              </h3>
              <p className="text-xs text-amber-400/90 font-bold uppercase tracking-wider">
                VIP Membership Exclusive Feature
              </p>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                The full vector Avatar Creator Studio and complete protagonist roster are unlocked exclusively for VIP Members.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-left space-y-2 text-xs text-zinc-300">
              <div className="font-extrabold text-amber-300 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> VIP Unlocks Include:
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>More avatars and custom avatars unlocked</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Custom character vector seed and style generator</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Private Crew Chat Hubs & owner ban/kick permissions</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Golden Crown GamerTag badge across all chat rooms</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-1/2 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
              {onUpgradeToVip && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onUpgradeToVip();
                  }}
                  className="w-full sm:w-1/2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 text-xs font-black uppercase tracking-wider transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown className="w-4 h-4 fill-current" />
                  <span>Upgrade to VIP</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800/90 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Ambient Background Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-40 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="relative px-5 sm:px-7 py-4 sm:py-5 border-b border-zinc-800/90 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-md shadow-rose-500/10">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    GTA Avatar Studio & Creator
                  </h3>
                  <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-current" />
                    <span>Unlocked</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Design and equip custom character avatars for your Vice City profile.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer disabled:opacity-50"
              title="Close Avatar Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="relative p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {/* Status Feedback Toast / Banner */}
            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-3 text-emerald-200 text-xs font-bold shadow-lg shadow-emerald-950/40"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                <span>{statusMessage}</span>
              </motion.div>
            )}

            {saveStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/60 flex items-start justify-between gap-3 text-rose-200 text-xs font-bold shadow-lg shadow-rose-950/40"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{statusMessage}</span>
                </div>
              </motion.div>
            )}

            {/* Top Interactive Spotlight / Live Preview Card */}
            <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                {/* Selected Portrait Viewport */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-900 border-2 border-rose-500 shadow-xl shadow-rose-500/20 overflow-hidden p-1">
                      <img
                        src={selectedAvatarUrl}
                        alt="Active Avatar Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          if (activePreset?.fallbackSvgDataUri && e.currentTarget.src !== activePreset.fallbackSvgDataUri) {
                            e.currentTarget.src = activePreset.fallbackSvgDataUri;
                          } else if (GTA6_AVATARS[0].fallbackSvgDataUri) {
                            e.currentTarget.src = GTA6_AVATARS[0].fallbackSvgDataUri;
                          }
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 p-1 bg-rose-600 rounded-lg text-white shadow-md border border-rose-400/40">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {activePreset?.game || 'Custom Avatar'}
                      </span>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="w-3 h-3" /> Unlocked For You
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-white truncate">
                      {activePreset?.label || 'Custom Generated Avatar'}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate">
                      {activePreset?.role || `Seed: ${customSeed || 'Custom Character'}`}
                    </p>
                  </div>
                </div>

                {/* Real-Time Live Chat / Profile Simulation Badge */}
                <div className="w-full md:w-auto bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
                  <img
                    src={selectedAvatarUrl}
                    alt="Chat Mini Preview"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-rose-500/60 shadow-sm"
                    onError={(e) => {
                      if (activePreset?.fallbackSvgDataUri) {
                        e.currentTarget.src = activePreset.fallbackSvgDataUri;
                      }
                    }}
                  />
                  <div className="text-left text-xs min-w-0">
                    <div className="flex items-center gap-1.5 font-black text-white truncate">
                      <span>{currentUser?.displayName || 'ViceCityPlayer'}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded border font-mono bg-amber-500/20 text-amber-300 border-amber-500/40">
                        VIP
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">"Live community chat message preview..."</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Seed Generator Bar */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Custom Character Seed Generator
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Dynamic DiceBear Vector SVG</span>
              </div>

              <form onSubmit={handleGenerateCustom} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customSeed}
                    onChange={(e) => setCustomSeed(e.target.value)}
                    placeholder="Enter custom alias or name (e.g. ViceKing, OceanGhost)..."
                    className="w-full pl-3.5 pr-10 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const randomSeeds = ['ViceKing', 'NeonRider', 'LeonidaFox', 'BiscayneDon', 'PaletoGhost', 'SpeedQueen'];
                      const randomSeed = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + '_' + Math.floor(Math.random() * 99);
                      setCustomSeed(randomSeed);
                      const url = generateCustomGtaAvatar(randomSeed, customStyle);
                      setCustomGeneratedUrl(url);
                      setSelectedAvatarUrl(url);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 transition"
                    title="Randomize Seed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={customStyle}
                    onChange={(e) => {
                      setCustomStyle(e.target.value);
                      const url = generateCustomGtaAvatar(customSeed, e.target.value);
                      setCustomGeneratedUrl(url);
                      setSelectedAvatarUrl(url);
                    }}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="avataaars">Avataaar Style</option>
                    <option value="bottts">Cyborg / Mech</option>
                    <option value="identicon">Geometry Badge</option>
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Category Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {([
                    { id: 'All', label: 'All Avatars' },
                    { id: 'GTA VI', label: 'GTA VI (VIP)' },
                    { id: 'GTA V', label: 'GTA V (Standard)' },
                    { id: 'Classics', label: 'Classics (Standard)' },
                    { id: 'Syndicate', label: 'Syndicates (VIP)' },
                    ...(userHierarchy.levelNum >= 3 ? [{ id: 'Special', label: 'Staff Special' }] : [])
                  ] as const).map((cat) => {
                    const isActive = activeCategory === cat.id;
                    const count =
                      cat.id === 'All'
                        ? unlockedAvatars.length
                        : cat.id === 'Special'
                        ? unlockedAvatars.filter((a) => a.game === 'Special' || a.category === 'Special Moderator').length
                        : unlockedAvatars.filter((a) => a.game === cat.id).length;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                            isActive ? 'bg-black/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search character or role..."
                    className="w-full pl-8 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Stylized GTA Character Portraits */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                {filteredAvatars.map((av) => {
                  const isSelected = selectedAvatarUrl === av.url;

                  const gameBadgeColor =
                    av.game === 'GTA V'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : av.game === 'GTA VI'
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      : av.game === 'Classics'
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      : av.game === 'Special'
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                      : 'text-purple-400 bg-purple-500/10 border-purple-500/30';

                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleSelectAvatar(av)}
                      className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 cursor-pointer text-left relative group ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500 shadow-xl shadow-rose-500/25 scale-[1.03] ring-2 ring-rose-500/60'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="w-full flex items-center justify-between gap-1">
                        <span className={`text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded border ${gameBadgeColor}`}>
                          {av.game}
                        </span>
                        <span className="text-[8.5px] uppercase font-bold text-zinc-400">
                          {av.category || 'Character'}
                        </span>
                      </div>

                      {/* Character Vector Illustration */}
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden my-1 bg-zinc-950 border border-zinc-800 shadow-inner group-hover:scale-105 transition-transform duration-200">
                        <img
                          src={av.url}
                          alt={av.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-opacity duration-200"
                          onError={(e) => {
                            if (av.fallbackSvgDataUri && e.currentTarget.src !== av.fallbackSvgDataUri) {
                              e.currentTarget.src = av.fallbackSvgDataUri;
                            }
                          }}
                        />
                      </div>

                      {/* Character Label & Role */}
                      <div className="w-full text-center min-w-0">
                        <div className="text-xs font-black text-white truncate group-hover:text-rose-300 transition-colors flex items-center justify-center gap-1">
                          {av.isSpecialModerator && <Shield className="w-3 h-3 text-cyan-400 shrink-0" />}
                          <span className="truncate">{av.label}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate mt-0.5" title={av.role}>
                          {av.role}
                        </div>
                      </div>

                      {/* Selection Status Badge */}
                      {isSelected && (
                        <div className="w-full pt-1 border-t border-rose-500/30 flex items-center justify-center gap-1 text-[9px] font-black text-rose-300">
                          <Check className="w-3 h-3" /> ACTIVE
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredAvatars.length === 0 && (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <Search className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-sm font-bold">No characters found matching "{searchQuery}"</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                    }}
                    className="text-xs text-rose-400 hover:underline font-bold"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer with Actions */}
          <div className="relative px-5 sm:px-7 py-4 border-t border-zinc-800/90 bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Info className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {currentUser
                  ? 'Saves directly to your cloud profile & Auth session.'
                  : 'Saves to your browser session (sign in anytime to persist in your cloud profile).'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveToFirestore}
                disabled={isSaving || !activePresetAccess.isUnlocked}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to profile...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Set Active Avatar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
