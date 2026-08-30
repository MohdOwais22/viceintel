'use client';

import React, { useState } from 'react';
import { SquadRoom, SquadMember } from '../../lib/squad-radar';
import {
  Users,
  Radio,
  Share2,
  Copy,
  Check,
  Plus,
  Crown,
  Crosshair,
  Sparkles,
  Lock,
  X,
  ExternalLink,
  ShieldAlert,
  Compass,
  Flame,
  ChevronRight,
  LogOut,
  Navigation
} from 'lucide-react';
import { copyToClipboard } from '../../lib/copyUtils';

export interface SquadRadarHUDProps {
  squadRoom: SquadRoom | null;
  currentUserId: string;
  isVipUser: boolean;
  onCreateRoom: (isVip: boolean) => void;
  onJoinRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
  onFocusMember: (uid: string, member: SquadMember) => void;
  followingMemberUid?: string | null;
  onToggleFollowMember?: (uid: string | null, member?: SquadMember) => void;
  showVipUpgradeModal: boolean;
  onCloseVipModal: () => void;
  onOpenVipModal: () => void;
}

export const SquadRadarHUD: React.FC<SquadRadarHUDProps> = ({
  squadRoom,
  currentUserId,
  isVipUser,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onFocusMember,
  followingMemberUid,
  onToggleFollowMember,
  showVipUpgradeModal,
  onCloseVipModal,
  onOpenVipModal
}) => {
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const connectedMembers = squadRoom?.members ? Object.entries(squadRoom.members) : [];
  const memberCount = connectedMembers.length;
  const maxCapacity = squadRoom?.isVipRoom ? 8 : 2;

  const handleCopyInviteLink = () => {
    if (!squadRoom?.roomId) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${origin}/map?room=${squadRoom.roomId}`;
    copyToClipboard(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomCode.trim()) return;
    onJoinRoom(inputRoomCode.trim().toUpperCase());
    setInputRoomCode('');
  };

  return (
    <>
      {/* Floating Glassmorphism Radar Control Card (Top Right Overlay) */}
      <div className="absolute top-4 right-4 z-[1000] w-80 sm:w-96 max-w-[calc(100vw-2rem)] font-sans antialiased">
        <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 rounded-2xl p-4 shadow-2xl text-white transition-all duration-300">
          {/* Header Row: Connection Status & Toggle Collapse */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-zinc-100 uppercase tracking-wide">
                    Live Squad Radar
                  </h3>
                  {squadRoom && (
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        squadRoom.isVipRoom
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {squadRoom.isVipRoom ? 'VIP 8-Player' : 'Free 2-Player'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">
                  {squadRoom ? `Room Code: ${squadRoom.roomId}` : 'Co-Op Party Map Sync'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer text-xs font-extrabold"
            >
              {isExpanded ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Active Room View or Create/Join Prompt */}
          {isExpanded && (
            <div className="space-y-3.5">
              {squadRoom ? (
                <>
                  {/* Room Quick Bar & Share Button */}
                  <div className="p-3 bg-zinc-900/80 border border-zinc-800/90 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Active Squad Session
                      </div>
                      <div className="text-sm font-black text-rose-400 font-mono tracking-widest">
                        {squadRoom.roomId}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Capacity: <span className="text-zinc-200 font-bold">{memberCount} / {maxCapacity} Players</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyInviteLink}
                        className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                        title="Copy Shareable Invite Link"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied Link!' : 'Invite'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={onLeaveRoom}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
                        title="Leave Squad Room"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Connected Squad Roster */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-rose-400" />
                        <span>Connected Squadmates</span>
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400">
                        {memberCount}/{maxCapacity}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {connectedMembers.map(([uid, member]) => {
                        const isSelf = uid === currentUserId;
                        return (
                          <div
                            key={uid}
                            className="p-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-2 transition"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/80 shrink-0 shadow"
                                style={{ backgroundColor: member.avatarColor || '#3B82F6' }}
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-zinc-200 truncate flex items-center gap-1">
                                  <span>{member.displayName}</span>
                                  {isSelf && (
                                    <span className="text-[9px] font-extrabold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] text-zinc-400 font-mono truncate">
                                  Lat: {member.lat?.toFixed(3) || '0'}, Lng: {member.lng?.toFixed(3) || '0'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {onToggleFollowMember && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isFollowed = followingMemberUid === uid;
                                    onToggleFollowMember(isFollowed ? null : uid, member);
                                  }}
                                  className={`py-1 px-2 rounded-lg text-[10px] font-extrabold uppercase transition flex items-center gap-1 cursor-pointer border ${
                                    followingMemberUid === uid
                                      ? 'bg-amber-500 text-black border-amber-400 shadow-md animate-pulse'
                                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700'
                                  }`}
                                  title={
                                    followingMemberUid === uid
                                      ? 'Stop following player'
                                      : 'Auto-pan and follow player movement'
                                  }
                                >
                                  <Crosshair
                                    className={`w-3 h-3 ${
                                      followingMemberUid === uid ? 'text-black' : 'text-amber-400'
                                    }`}
                                  />
                                  <span>{followingMemberUid === uid ? 'Following' : 'Follow'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onFocusMember(uid, member)}
                                className="py-1 px-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                                title="Snap Camera to Player Once"
                              >
                                <Navigation className="w-3 h-3 text-rose-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Waypoints & Collectibles Sync Progress Summary */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                      <span className="flex items-center gap-1.5 text-[10px] uppercase text-zinc-400">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Shared Collectibles Found
                      </span>
                      <span className="text-cyan-400 font-mono">
                        {squadRoom.checkedCollectibles?.length || 0} Synced
                      </span>
                    </div>

                    {!squadRoom.isVipRoom && (
                      <button
                        type="button"
                        onClick={onOpenVipModal}
                        className="w-full py-2 px-3 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/40 rounded-xl text-xs font-extrabold text-amber-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unlock 8-Player VIP Squad Sync ($3.99/mo)</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* No Active Room Prompt: Create or Join */
                <div className="space-y-3">
                  <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                    Sync real-time location pins, custom heist waypoints, and collectible progress with your squad on Vice City map.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onCreateRoom(false)}
                      className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Host Free Room</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onCreateRoom(true)}
                      className="py-2.5 px-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-extrabold shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-amber-200" />
                      <span>Host VIP Room</span>
                    </button>
                  </div>

                  <form onSubmit={handleJoinSubmit} className="pt-2 border-t border-zinc-800/80">
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                      Join Existing Squad Room
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputRoomCode}
                        onChange={(e) => setInputRoomCode(e.target.value)}
                        placeholder="e.g. VC-9482"
                        className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-zinc-100 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="submit"
                        className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer"
                      >
                        Join
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VIP Upgrade Monetization Modal */}
      {showVipUpgradeModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-white space-y-5">
            <button
              type="button"
              onClick={onCloseVipModal}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 uppercase tracking-widest">
                  VIP Squad Expansion
                </span>
                <h2 className="text-xl font-black text-zinc-100 tracking-tight mt-0.5">
                  Unlock 8-Player Co-Op Rooms
                </h2>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Standard free squad rooms are capped at 2 players. Upgrade to <strong className="text-amber-300">$3.99/mo VIP Membership</strong> or complete your 30-Day Vice City Daily Login Streak to host 8-player squad rooms!
            </p>

            <div className="space-y-2.5 p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-xs">
              <div className="flex items-center gap-2.5 text-zinc-200 font-bold">
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Host up to 8 Players in Real-Time Co-Op Rooms</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-200 font-bold">
                <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Priority High-Framerate 90 FPS Telemetry Updates</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-200 font-bold">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Unlimited Team Waypoints & Collectible Tracking</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-200 font-bold">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Alternative: Unlocked via 30-Day Daily VC Streak</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="/profile"
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black rounded-xl text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                <span>Upgrade to VIP Pass ($3.99/mo)</span>
              </a>

              <button
                type="button"
                onClick={onCloseVipModal}
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Continue with 2-Player Free Tier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
