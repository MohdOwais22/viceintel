'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Users,
  Shield,
  Mic,
  MicOff,
  Flame,
  Search,
  Plus,
  Check,
  X,
  MapPin,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Crown,
  DollarSign,
  Compass,
  Zap,
  Target,
  RefreshCw,
  Eye
} from 'lucide-react';
import {
  SquadRoom,
  LfgConfig,
  LfgJoinRequest,
  subscribeToLfgSquads,
  hostLfgSquadRoom,
  requestJoinLfgSquad,
  respondToLfgJoinRequest,
  updateLfgStatus
} from '../../lib/squad-radar';

export interface LfgMatchmakerOverlayProps {
  currentRoom: SquadRoom | null;
  currentUser: {
    uid: string;
    displayName: string;
    avatar?: string;
    isVip?: boolean;
    clearanceLevel?: string;
  } | null;
  onJoinRoom: (roomId: string) => void;
  onFocusCoordinate?: (lat: number, lng: number) => void;
  onOpenAuth?: () => void;
}

const HEIST_PRESETS = [
  {
    name: 'Vice Central Bank Vault Heist',
    district: 'Downtown Vice City',
    lat: 25.7743,
    lng: -80.1937,
    reward: '$3,500,000',
    defaultSlots: 4,
    desc: 'Coordinated drill and vault breach targeting offshore cartel deposit boxes.'
  },
  {
    name: 'Port Gellhorn Cargo Ship Raid',
    district: 'Port Gellhorn Industrial',
    lat: 25.7550,
    lng: -80.1750,
    reward: '$2,800,000',
    defaultSlots: 4,
    desc: 'Amphibious infiltration to hijack high-value weapon containers.'
  },
  {
    name: 'Ocean Beach Diamond Syndicate',
    district: 'Ocean Drive & South Beach',
    lat: 25.7820,
    lng: -80.1310,
    reward: '$1,950,000',
    defaultSlots: 3,
    desc: 'Smash and grab luxury boutique jewelry heist with quick jet-ski exfil.'
  },
  {
    name: 'Everglades Smuggling Run',
    district: 'Everglades Swamplands',
    lat: 25.7300,
    lng: -80.3200,
    reward: '$2,200,000',
    defaultSlots: 2,
    desc: 'Airboat smuggling convoy defense against rival cartel ambushes.'
  },
  {
    name: 'Sunshine Autos High-End Boost',
    district: 'Little Haiti / Industrial',
    lat: 25.8050,
    lng: -80.2050,
    reward: '$1,400,000',
    defaultSlots: 2,
    desc: 'High-speed exotic vehicle recovery and underground chop-shop delivery.'
  }
];

export const LfgMatchmakerOverlay: React.FC<LfgMatchmakerOverlayProps> = ({
  currentRoom,
  currentUser,
  onJoinRoom,
  onFocusCoordinate,
  onOpenAuth
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'host' | 'requests'>('browse');
  const [lfgRooms, setLfgRooms] = useState<SquadRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMic, setFilterMic] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requestedRoomIds, setRequestedRoomIds] = useState<Record<string, boolean>>({});

  // Host Form State
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customActivityName, setCustomActivityName] = useState(HEIST_PRESETS[0].name);
  const [customDistrict, setCustomDistrict] = useState(HEIST_PRESETS[0].district);
  const [customLat, setCustomLat] = useState(HEIST_PRESETS[0].lat);
  const [customLng, setCustomLng] = useState(HEIST_PRESETS[0].lng);
  const [requiredPlayers, setRequiredPlayers] = useState(4);
  const [micRequired, setMicRequired] = useState(true);
  const [minLevel, setMinLevel] = useState('Any Citizen');
  const [rewardEstimate, setRewardEstimate] = useState(HEIST_PRESETS[0].reward);
  const [description, setDescription] = useState(HEIST_PRESETS[0].desc);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Subscribe to live LFG squad rooms
  useEffect(() => {
    const unsub = subscribeToLfgSquads((rooms) => {
      setLfgRooms(rooms);
    });
    return () => unsub();
  }, []);

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = HEIST_PRESETS[idx];
    setCustomActivityName(p.name);
    setCustomDistrict(p.district);
    setCustomLat(p.lat);
    setCustomLng(p.lng);
    setRewardEstimate(p.reward);
    setRequiredPlayers(p.defaultSlots);
    setDescription(p.desc);
  };

  const handleHostLfg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }

    setSubmitting(true);
    try {
      const config: LfgConfig = {
        activityName: customActivityName,
        district: customDistrict,
        lat: customLat,
        lng: customLng,
        requiredPlayers,
        currentPlayers: 1,
        micRequired,
        minLevel,
        rewardEstimate,
        description,
        hostGamerTag: currentUser.displayName,
        hostAvatar: currentUser.avatar
      };

      const newRoom = await hostLfgSquadRoom(
        currentUser.uid,
        currentUser.displayName,
        config,
        currentUser.isVip || false
      );

      onJoinRoom(newRoom.roomId);
      setActiveTab('requests');
      showToast(`🔥 Radar Beacon Active: "${customActivityName}" is now broadcasting!`);
    } catch (err: any) {
      showToast(`Error hosting crew: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendJoinRequest = async (room: SquadRoom) => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }

    try {
      setRequestedRoomIds(prev => ({ ...prev, [room.roomId]: true }));
      const res = await requestJoinLfgSquad(room.roomId, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        level: currentUser.clearanceLevel || 'L1 Citizen',
        mic: true
      });

      if (res.success) {
        showToast(`📡 Request sent to host ${room.lfgConfig?.hostGamerTag || 'Squad'}!`);
      } else {
        showToast(`Notice: ${res.message}`);
      }
    } catch (err: any) {
      showToast(`Failed to send request: ${err.message}`);
    }
  };

  const handleRespondRequest = async (requestId: string, approve: boolean, applicantUid: string, applicantName: string) => {
    if (!currentRoom) return;
    try {
      await respondToLfgJoinRequest(currentRoom.roomId, requestId, approve, applicantUid, applicantName);
      showToast(approve ? `✅ ${applicantName} accepted into crew!` : `❌ Join request declined.`);
    } catch (err: any) {
      showToast(`Error updating request: ${err.message}`);
    }
  };

  const isHost = Boolean(currentRoom && currentUser && currentRoom.hostUid === currentUser.uid);
  const pendingRequests = currentRoom?.lfgJoinRequests?.filter(r => r.status === 'pending') || [];

  const filteredLfgRooms = lfgRooms.filter(room => {
    if (!room.lfgConfig) return false;
    const matchesSearch =
      room.lfgConfig.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.lfgConfig.hostGamerTag && room.lfgConfig.hostGamerTag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (room.lfgConfig.district && room.lfgConfig.district.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMic = !filterMic || room.lfgConfig.micRequired;
    const matchesLevel = filterLevel === 'all' || room.lfgConfig.minLevel.includes(filterLevel);
    return matchesSearch && matchesMic && matchesLevel;
  });

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-rose-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-rose-400 animate-in fade-in duration-200">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 left-6 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-2xl border cursor-pointer ${
            isOpen
              ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
              : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-400/40 hover:brightness-110 shadow-rose-600/30 animate-pulse'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>{isOpen ? 'Close Heist Radar' : 'Find Crew / Host Heist (LFG)'}</span>
          {lfgRooms.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono border border-white/20">
              {lfgRooms.length} Live
            </span>
          )}
          {pendingRequests.length > 0 && isHost && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-black text-[10px] animate-bounce">
              {pendingRequests.length} Req
            </span>
          )}
        </button>
      </div>

      {/* Slide-out LFG Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 left-0 z-40 w-full sm:w-[460px] bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 shadow-2xl flex flex-col transition-all duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Squad Radar LFG</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-mono">
                    Matchmaker
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">Discover and assemble heist crews on the live map</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 p-2 bg-zinc-900/80 border-b border-zinc-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'browse'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse ({filteredLfgRooms.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('host')}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'host'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Host Heist</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 relative ${
                activeTab === 'requests'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>My Crew</span>
              {pendingRequests.length > 0 && isHost && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1.5 right-2" />
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* TAB 1: BROWSE LFG CREWS */}
            {activeTab === 'browse' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search heist, district, or host..."
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterMic(!filterMic)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                        filterMic
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      <span>Mic Required</span>
                    </button>

                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value)}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 font-bold focus:outline-none"
                    >
                      <option value="all">All Clearance Levels</option>
                      <option value="L1">L1 Citizen+</option>
                      <option value="VIP">VIP Clearance</option>
                      <option value="Staff">Staff Only</option>
                    </select>
                  </div>
                </div>

                {/* List of Active LFG Crews */}
                {filteredLfgRooms.length === 0 ? (
                  <div className="py-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                      <Radio className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                      No Active Heist Crews Found
                    </h4>
                    <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                      Be the first mastermind to launch an LFG beacon for Vice City Bank, Port Gellhorn, or street races.
                    </p>
                    <button
                      onClick={() => setActiveTab('host')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Host New Heist Crew</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLfgRooms.map((room) => {
                      const cfg = room.lfgConfig!;
                      const memberCount = Object.keys(room.members || {}).length;
                      const maxSlots = cfg.requiredPlayers || (room.isVipRoom ? 8 : 2);
                      const isFull = memberCount >= maxSlots;
                      const isAlreadyIn = Boolean(currentUser && room.members && room.members[currentUser.uid]);
                      const hasRequested = requestedRoomIds[room.roomId];

                      return (
                        <div
                          key={room.roomId}
                          className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 space-y-3 transition group relative overflow-hidden"
                        >
                          {/* Top Row: Activity & Slots */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                                  {cfg.activityName}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                                <span className="flex items-center gap-1 text-zinc-300">
                                  <MapPin className="w-3 h-3 text-rose-400" />
                                  {cfg.district || 'Vice City'}
                                </span>
                                <span>•</span>
                                <span className="text-emerald-400 font-mono font-bold">
                                  {cfg.rewardEstimate || 'High Payout'}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-black font-mono border ${
                                  isFull
                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                }`}
                              >
                                {memberCount} / {maxSlots} Slots
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          {cfg.description && (
                            <p className="text-[11px] text-zinc-300 leading-relaxed italic bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
                              "{cfg.description}"
                            </p>
                          )}

                          {/* Host & Meta Badges */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400">Host:</span>
                              <span className="font-extrabold text-white">{cfg.hostGamerTag || 'Mastermind'}</span>
                              {room.isVipRoom && (
                                <span title="VIP Squad" className="inline-flex items-center">
                                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {cfg.micRequired ? (
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold flex items-center gap-1">
                                  <Mic className="w-2.5 h-2.5 text-rose-400" /> Mic
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                                  Mic Opt.
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold">
                                {cfg.minLevel || 'Any'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            {cfg.lat && cfg.lng && onFocusCoordinate && (
                              <button
                                onClick={() => onFocusCoordinate(cfg.lat!, cfg.lng!)}
                                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                title="Focus map coordinates"
                              >
                                <Target className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Locate</span>
                              </button>
                            )}

                            {isAlreadyIn ? (
                              <button
                                onClick={() => onJoinRoom(room.roomId)}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Open Active Room ({room.roomId})</span>
                              </button>
                            ) : isFull ? (
                              <button
                                disabled
                                className="flex-1 py-2 bg-zinc-800 text-zinc-500 rounded-xl text-xs font-bold cursor-not-allowed"
                              >
                                Crew Full
                              </button>
                            ) : hasRequested ? (
                              <button
                                disabled
                                className="flex-1 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                              >
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Request Transmitted...</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendJoinRequest(room)}
                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
                              >
                                <Radio className="w-3.5 h-3.5" />
                                <span>Request to Join Crew</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HOST HEIST CREW */}
            {activeTab === 'host' && (
              <form onSubmit={handleHostLfg} className="space-y-4">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Choose Heist Operation Preset:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {HEIST_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(idx)}
                        className={`p-3 rounded-xl text-left border transition cursor-pointer flex items-center justify-between gap-3 ${
                          selectedPresetIndex === idx
                            ? 'bg-rose-600/20 border-rose-500 text-white shadow-md'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{p.name}</div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span>{p.district}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-mono font-semibold">{p.reward}</span>
                          </div>
                        </div>
                        {selectedPresetIndex === idx && (
                          <Check className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Operation Title Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Custom Activity Title
                  </label>
                  <input
                    type="text"
                    required
                    value={customActivityName}
                    onChange={(e) => setCustomActivityName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Required Slots & Minimum Level */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">Crew Size Required</label>
                    <select
                      value={requiredPlayers}
                      onChange={(e) => setRequiredPlayers(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value={2}>2 Operatives (Duo)</option>
                      <option value={3}>3 Operatives (Trio)</option>
                      <option value={4}>4 Operatives (Standard Heist)</option>
                      <option value={6}>6 Operatives (VIP Syndicate)</option>
                      <option value={8}>8 Operatives (Max VIP Raid)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">Min Clearance</label>
                    <select
                      value={minLevel}
                      onChange={(e) => setMinLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="Any Citizen">Any Citizen</option>
                      <option value="L1 Citizen+">L1 Citizen+</option>
                      <option value="L2 VIP">L2 VIP Only</option>
                      <option value="L3 Staff">L3 Staff</option>
                    </select>
                  </div>
                </div>

                {/* Mic Required & Reward */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="text-xs font-bold text-zinc-300">Voice Mic Req.</div>
                    <input
                      type="checkbox"
                      checked={micRequired}
                      onChange={(e) => setMicRequired(e.target.checked)}
                      className="w-4 h-4 accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      value={rewardEstimate}
                      onChange={(e) => setRewardEstimate(e.target.value)}
                      placeholder="e.g. $3,500,000"
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Tactical Briefing / Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Tactical Briefing / Roleplay Guidelines</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details on driver, hacker, and gunman roles..."
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Broadcasting Radar Beacon...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>Launch LFG Heist Beacon</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: MY CREW & INCOMING REQUESTS */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {currentRoom ? (
                  <div className="space-y-4">
                    {/* Active Room Info */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Active Squad Room: <strong className="font-mono text-rose-400">{currentRoom.roomId}</strong>
                          </span>
                        </div>
                        {currentRoom.isLfgActive && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold uppercase">
                            LFG Beacon Live
                          </span>
                        )}
                      </div>

                      {/* Members List */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Current Squad Members ({Object.keys(currentRoom.members || {}).length}):
                        </span>
                        <div className="space-y-1.5">
                          {Object.entries(currentRoom.members || {}).map(([uid, member]) => (
                            <div
                              key={uid}
                              className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-3 h-3 rounded-full border border-white/40"
                                  style={{ backgroundColor: member.avatarColor || '#F43F5E' }}
                                />
                                <span className="text-xs font-extrabold text-white">{member.displayName}</span>
                                {uid === currentRoom.hostUid && (
                                  <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/30">
                                    Host
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500">Connected</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Host Incoming Join Requests Queue */}
                    {isHost && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-rose-400" />
                            <span>Incoming Join Requests ({pendingRequests.length})</span>
                          </h4>
                        </div>

                        {pendingRequests.length === 0 ? (
                          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
                            <p className="text-xs text-zinc-400">
                              No pending join requests right now. Operatives discovering your beacon will appear here.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {pendingRequests.map((req) => (
                              <div
                                key={req.id}
                                className="bg-zinc-900 border border-zinc-700/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-lg"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-white">{req.applicantDisplayName}</span>
                                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold">
                                      {req.applicantLevel}
                                    </span>
                                    {req.applicantMic && (
                                      <span title="Mic verified" className="inline-flex items-center">
                                        <Mic className="w-3 h-3 text-emerald-400" />
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-zinc-400 block">
                                    Requested: {new Date(req.requestedAt).toLocaleTimeString()}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleRespondRequest(req.id, false, req.applicantUid, req.applicantDisplayName)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                    title="Decline request"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleRespondRequest(req.id, true, req.applicantUid, req.applicantDisplayName)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-md shadow-emerald-600/20 cursor-pointer"
                                    title="Accept into crew"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-6 space-y-3">
                    <p className="text-xs text-zinc-400">
                      You are not currently in an active squad room. Browse the LFG tab to request joining a crew or host your own heist.
                    </p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Browse Heist Lobbies
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
