'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SquadRoom, Waypoint, SquadMember, SquadPing } from '../../lib/squad-radar';
import { MAP_LOCATIONS_DATA, ExtendedMapLocation } from '../../data/mapLocations';
import {
  Crosshair,
  Users,
  AlertTriangle,
  Award,
  Plus,
  CheckCircle,
  MapPin,
  Trash2,
  Sparkles,
  Radio,
  Navigation,
  ExternalLink,
  RotateCcw,
  Zap,
  Gem,
  Flame
} from 'lucide-react';

// Web Audio synthesizer for tactical radar ping sounds
function playPingSound(type: 'danger' | 'loot') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'danger') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(460, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch {}
}

// Fix standard Leaflet default icon paths if running on client
if (typeof window !== 'undefined') {
  try {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });
  } catch {}
}

export interface SquadMapCanvasProps {
  squadRoom: SquadRoom | null;
  currentUserId: string;
  currentUserDisplayName: string;
  currentUserColor: string;
  onUpdatePosition: (lat: number, lng: number) => void;
  onAddWaypoint: (waypoint: Omit<Waypoint, 'id'>) => void;
  onAddPing?: (ping: Omit<SquadPing, 'id' | 'timestamp' | 'expiresAt'>) => void;
  onRemoveWaypoint: (waypointId: string) => void;
  onToggleCollectible: (collectibleId: string) => void;
  focusedMemberUid?: string | null;
  focusedCoordinates?: { lat: number; lng: number } | null;
  followingMemberUid?: string | null;
  onToggleFollowMember?: (uid: string | null) => void;
}

// Controller component to smoothly snap and continuously pan camera to followed squadmates
function MapController({
  focusedCoordinates,
  followingCoordinates,
  isFollowing,
  onUserPan
}: {
  focusedCoordinates?: { lat: number; lng: number } | null;
  followingCoordinates?: { lat: number; lng: number } | null;
  isFollowing?: boolean;
  onUserPan?: () => void;
}) {
  const map = useMap();
  const isProgrammaticMoveRef = useRef(false);

  // Smooth snap on initial focus or single-shot focus trigger
  useEffect(() => {
    if (focusedCoordinates && typeof focusedCoordinates.lat === 'number') {
      isProgrammaticMoveRef.current = true;
      map.flyTo([focusedCoordinates.lat, focusedCoordinates.lng], Math.max(map.getZoom(), 15), {
        duration: 1.0
      });
      const timer = setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [focusedCoordinates, map]);

  // Continuous follow camera: panTo center as squadmate moves
  useEffect(() => {
    if (
      isFollowing &&
      followingCoordinates &&
      typeof followingCoordinates.lat === 'number' &&
      typeof followingCoordinates.lng === 'number'
    ) {
      isProgrammaticMoveRef.current = true;
      map.panTo([followingCoordinates.lat, followingCoordinates.lng], {
        animate: true,
        duration: 0.5,
        easeLinearity: 0.25
      });
      const timer = setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [followingCoordinates?.lat, followingCoordinates?.lng, isFollowing, map]);

  // Detect manual user drag to release follow lock and switch to Free Camera
  useMapEvents({
    dragstart() {
      if (!isProgrammaticMoveRef.current && isFollowing && onUserPan) {
        onUserPan();
      }
    }
  });

  return null;
}

// Map click handler to open contextual waypoint creation popup
function MapClickHandler({
  onMapClick
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      // If click originated from inside a Leaflet popup, control, button, form, or marker element, don't trigger map click
      const target = e.originalEvent?.target as HTMLElement | null;
      if (
        target &&
        (target.closest('.leaflet-popup') ||
          target.closest('.leaflet-control') ||
          target.closest('.leaflet-interactive') ||
          target.closest('button') ||
          target.closest('form') ||
          target.closest('input') ||
          target.closest('select'))
      ) {
        return;
      }
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });

  return null;
}

/**
 * Creates custom pulsing Leaflet DivIcon for connected Squad Members with Follow Reticle
 */
function createSquadMemberIcon(
  displayName: string,
  color: string,
  isSelf: boolean,
  isFollowed: boolean
): L.DivIcon {
  const shortName = (displayName || 'Member').substring(0, 10);
  const ringColor = isSelf ? '#F43F5E' : color || '#3B82F6';

  const html = `
    <div class="relative group flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2">
      <!-- Follow Reticle when active -->
      ${
        isFollowed
          ? `
        <div class="absolute -inset-3 rounded-full border-2 border-dashed border-amber-400 animate-spin pointer-events-none" style="animation-duration: 6s;"></div>
        <div class="absolute w-12 h-12 rounded-full border-2 border-amber-400 animate-ping opacity-75 pointer-events-none"></div>
      `
          : ''
      }

      <!-- Pulsing Beacon Effect -->
      <div class="absolute w-10 h-10 rounded-full opacity-75 animate-ping pointer-events-none" style="background-color: ${ringColor};"></div>
      
      <!-- Center Player Avatar Badge -->
      <div class="relative z-10 w-8 h-8 rounded-full border-2 ${
        isFollowed
          ? 'border-amber-300 ring-2 ring-amber-500 ring-offset-2 ring-offset-black'
          : 'border-white'
      } shadow-lg flex items-center justify-center font-black text-xs text-white uppercase tracking-wider" style="background-color: ${ringColor};">
        ${shortName.charAt(0)}
      </div>

      <!-- Player Name Label -->
      <div class="mt-1 px-2 py-0.5 bg-zinc-950/90 border ${
        isFollowed ? 'border-amber-400 text-amber-300' : 'border-zinc-700/80 text-white'
      } rounded-md shadow-md text-[10px] font-bold whitespace-nowrap flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full ${
          isFollowed
            ? 'bg-amber-400 animate-ping'
            : isSelf
            ? 'bg-rose-400 animate-pulse'
            : 'bg-emerald-400'
        }"></span>
        <span>${shortName}${isSelf ? ' (YOU)' : ''}</span>
        ${
          isFollowed
            ? '<span class="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded uppercase font-black">FOLLOWING</span>'
            : ''
        }
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'squad-member-marker',
    iconSize: [40, 50],
    iconAnchor: [20, 25]
  });
}

/**
 * Creates custom icon for Team Waypoints
 */
function createWaypointIcon(type: Waypoint['type'], label: string): L.DivIcon {
  let badgeColor = '#EF4444'; // default heist
  let iconSymbol = '🎯';

  if (type === 'meetup') {
    badgeColor = '#F59E0B';
    iconSymbol = '🚩';
  } else if (type === 'danger') {
    badgeColor = '#E11D48';
    iconSymbol = '⚠️';
  } else if (type === 'collectible') {
    badgeColor = '#06B6D4';
    iconSymbol = '⭐';
  }

  const html = `
    <div class="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-full">
      <div class="w-8 h-8 rounded-xl shadow-xl flex items-center justify-center text-sm border-2 border-white/90 transform hover:scale-110 transition" style="background-color: ${badgeColor};">
        <span>${iconSymbol}</span>
      </div>
      <div class="mt-1 px-2 py-0.5 bg-zinc-900/95 border border-zinc-700 rounded text-[10px] font-extrabold text-white whitespace-nowrap shadow">
        ${label || 'Squad Ping'}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'squad-waypoint-marker',
    iconSize: [32, 45],
    iconAnchor: [16, 45]
  });
}

/**
 * Creates custom pulsing Leaflet DivIcon for temporary (10s) Danger or Loot tactical pings
 */
function createSquadPingIcon(
  ping: SquadPing,
  remainingSeconds: number,
  progress: number
): L.DivIcon {
  const isDanger = ping.type === 'danger';
  const badgeColor = isDanger ? '#EF4444' : '#10B981';
  const glowColor = isDanger ? 'rgba(239, 68, 68, 0.65)' : 'rgba(16, 185, 129, 0.65)';
  const iconSymbol = isDanger ? '⚠️' : '💎';
  const pingTitle = isDanger ? 'DANGER' : 'LOOT';
  const progressPercent = Math.max(0, Math.min(100, Math.round(progress * 100)));

  const html = `
    <div class="relative group flex flex-col items-center justify-center -translate-x-1/2 -translate-y-full pointer-events-auto transition-opacity duration-300">
      <!-- Expanding Shockwave Radar Rings -->
      <div class="absolute w-14 h-14 -top-7 rounded-full animate-ping pointer-events-none opacity-60" style="background-color: ${glowColor}; animation-duration: 2s;"></div>

      <!-- Center Icon Badge -->
      <div class="relative z-10 w-10 h-10 rounded-2xl shadow-xl flex items-center justify-center text-base border-2 border-white transition transform hover:scale-105" style="background: linear-gradient(135deg, ${badgeColor}, #09090b); box-shadow: 0 0 16px ${glowColor};">
        <span class="drop-shadow">${iconSymbol}</span>
      </div>

      <!-- Floating Tactical Tag Card with 10s Countdown Bar -->
      <div class="mt-1 px-2.5 py-1 bg-zinc-950/95 border rounded-xl shadow-xl flex flex-col items-center gap-0.5 whitespace-nowrap min-w-[100px]" style="border-color: ${badgeColor};">
        <div class="flex items-center justify-between w-full gap-2">
          <span class="text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1">
            <span>${iconSymbol}</span> ${pingTitle}
          </span>
          <span class="text-[9px] font-mono font-black px-1.5 py-0.2 rounded-md ${
            isDanger ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
          }">
            ${remainingSeconds}s
          </span>
        </div>

        <!-- 10s Decaying Progress Bar -->
        <div class="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
          <div class="h-full rounded-full transition-all duration-300 ease-linear" style="width: ${progressPercent}%; background-color: ${badgeColor};"></div>
        </div>

        <div class="text-[8px] font-bold text-zinc-400 mt-0.5">
          by <span class="text-zinc-200">${ping.placedBy || 'Squadmate'}</span>
        </div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'squad-temp-ping-marker',
    iconSize: [40, 56],
    iconAnchor: [20, 56]
  });
}

/**
 * Dedicated isolated component for temporary 10s squad pings.
 * Manages its own 1-second interval so the main map and popup dialogue boxes NEVER re-render or flicker!
 */
const SquadPingsLayer: React.FC<{
  pings: SquadPing[];
}> = React.memo(({ pings }) => {
  const [now, setNow] = useState<number>(Date.now());

  const hasActivePings = Boolean(pings && pings.some((p) => p && p.expiresAt > Date.now()));

  useEffect(() => {
    if (!hasActivePings) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActivePings]);

  const activePings = React.useMemo(() => {
    return (pings || []).filter((p) => p && p.expiresAt > now);
  }, [pings, now]);

  if (activePings.length === 0) return null;

  return (
    <>
      {activePings.map((ping) => {
        const remainingMs = Math.max(0, ping.expiresAt - now);
        const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
        const progress = remainingMs / 10000;
        const opacity = Math.min(1.0, remainingMs / 2500);
        const isDanger = ping.type === 'danger';
        const icon = createSquadPingIcon(ping, remainingSeconds, progress);

        return (
          <React.Fragment key={`temp-ping-${ping.id}`}>
            <Marker position={[ping.lat, ping.lng]} icon={icon}>
              <Popup>
                <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-2xl min-w-[180px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        isDanger
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {isDanger ? '⚠️ DANGER ALERT' : '💎 LOOT DETECTED'}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-zinc-400">
                      {remainingSeconds}s left
                    </span>
                  </div>
                  <div className="text-xs font-black text-white mb-1">
                    {isDanger ? 'Hostile Area / Danger Ping' : 'Valuable Loot Cache'}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Pinged by: <span className="text-zinc-200 font-bold">{ping.placedBy}</span>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Fading expanding shockwave radar circle */}
            <Circle
              center={[ping.lat, ping.lng]}
              radius={200 + (1 - progress) * 150}
              pathOptions={{
                color: isDanger ? '#EF4444' : '#10B981',
                fillColor: isDanger ? '#EF4444' : '#10B981',
                fillOpacity: opacity * 0.12,
                weight: 1.5,
                dashArray: '3, 3'
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
});

/**
 * Dedicated isolated component for top-right Active Pings HUD Feed
 */
const SquadPingsFeed: React.FC<{
  pings: SquadPing[];
  onFocusPing: (coords: { lat: number; lng: number }) => void;
}> = React.memo(({ pings, onFocusPing }) => {
  const [now, setNow] = useState<number>(Date.now());

  const hasActivePings = Boolean(pings && pings.some((p) => p && p.expiresAt > Date.now()));

  useEffect(() => {
    if (!hasActivePings) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActivePings]);

  const activePings = React.useMemo(() => {
    return (pings || []).filter((p) => p && p.expiresAt > now);
  }, [pings, now]);

  if (activePings.length === 0) return null;

  return (
    <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 p-2.5 rounded-2xl shadow-2xl flex flex-col gap-1.5 max-w-[240px]">
      <div className="text-[9px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-rose-400 animate-ping" /> Active Squad Pings ({activePings.length})
        </span>
      </div>

      <div className="space-y-1 max-h-[140px] overflow-y-auto">
        {activePings.map((ping) => {
          const remainingSec = Math.max(1, Math.ceil((ping.expiresAt - now) / 1000));
          const isDanger = ping.type === 'danger';
          return (
            <button
              key={`feed-${ping.id}`}
              type="button"
              onClick={() => onFocusPing({ lat: ping.lat, lng: ping.lng })}
              className={`w-full text-left p-1.5 rounded-xl border text-[10px] font-extrabold flex items-center justify-between gap-1 transition cursor-pointer ${
                isDanger
                  ? 'bg-rose-950/30 hover:bg-rose-900/50 border-rose-800/60 text-rose-200'
                  : 'bg-emerald-950/30 hover:bg-emerald-900/50 border-emerald-800/60 text-emerald-200'
              }`}
              title="Click to snap camera to ping"
            >
              <span className="flex items-center gap-1 truncate">
                <span>{isDanger ? '⚠️' : '💎'}</span>
                <span className="truncate">{ping.placedBy}</span>
              </span>
              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-black/60 shrink-0">
                {remainingSec}s
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

/**
 * Creates custom icon for Collectible map items
 */
function createCollectibleIcon(
  type: string,
  title: string,
  isChecked: boolean
): L.DivIcon {
  const opacityClass = isChecked ? 'opacity-40 grayscale' : 'opacity-100';
  const badgeColor = isChecked ? '#10B981' : '#EC4899';
  const iconSymbol = isChecked ? '✓' : '💎';

  const html = `
    <div class="${opacityClass} transition duration-200 flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
      <div class="w-6 h-6 rounded-full border border-white/80 shadow flex items-center justify-center text-[10px] font-black text-white" style="background-color: ${badgeColor};">
        ${iconSymbol}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'collectible-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

export const SquadMapCanvas: React.FC<SquadMapCanvasProps> = ({
  squadRoom,
  currentUserId,
  currentUserDisplayName,
  currentUserColor,
  onUpdatePosition,
  onAddWaypoint,
  onAddPing,
  onRemoveWaypoint,
  onToggleCollectible,
  focusedMemberUid,
  focusedCoordinates,
  followingMemberUid,
  onToggleFollowMember
}) => {
  // Vice City Default Center (Miami area)
  const [isMounted, setIsMounted] = useState(false);
  const [mapCenter] = useState<[number, number]>([25.7617, -80.1918]);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [clickLocation, setClickLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [newWaypointLabel, setNewWaypointLabel] = useState<string>('');
  const [newWaypointType, setNewWaypointType] = useState<Waypoint['type']>('heist');
  const [localFollowingUid, setLocalFollowingUid] = useState<string | null>(null);

  // Quick Ping Tool Mode: 'navigate' (normal click context menu) | 'danger' | 'loot'
  const [activePingTool, setActivePingTool] = useState<'navigate' | 'danger' | 'loot'>('navigate');
  
  // Local temporary pings state for immediate optimistic rendering
  const [localPings, setLocalPings] = useState<SquadPing[]>([]);
  const [pingFocusedCoords, setPingFocusedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Determine active following member
  const activeFollowingUid =
    followingMemberUid !== undefined ? followingMemberUid : localFollowingUid;

  const handleToggleFollow = (uid: string | null) => {
    if (onToggleFollowMember) {
      onToggleFollowMember(uid);
    } else {
      setLocalFollowingUid(uid);
    }
  };

  const followedMember =
    activeFollowingUid && squadRoom?.members ? squadRoom.members[activeFollowingUid] : null;

  const followingCoordinates =
    followedMember &&
    typeof followedMember.lat === 'number' &&
    typeof followedMember.lng === 'number'
      ? { lat: followedMember.lat, lng: followedMember.lng }
      : null;

  // Collectible items dataset mapped to map locations
  const collectibles = MAP_LOCATIONS_DATA as ExtendedMapLocation[];
  const checkedCollectiblesList = squadRoom?.checkedCollectibles || [];

  // Merged pings from Firestore and local state
  const allPings = React.useMemo(() => {
    const map = new Map<string, SquadPing>();
    (squadRoom?.pings || []).forEach((p) => {
      if (p && p.id) {
        map.set(p.id, p);
      }
    });
    localPings.forEach((p) => {
      if (p && p.id) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  }, [squadRoom?.pings, localPings]);

  // Handler to drop temporary (10-second) Danger or Loot ping
  const handleDropPing = (lat: number, lng: number, type: 'danger' | 'loot') => {
    playPingSound(type);

    const timestamp = Date.now();
    const newPing: SquadPing = {
      id: `ping_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      lat,
      lng,
      placedBy: currentUserDisplayName || 'Vice Operative',
      placedByColor: currentUserColor || (type === 'danger' ? '#EF4444' : '#10B981'),
      timestamp,
      expiresAt: timestamp + 10000 // 10 seconds duration
    };

    // Optimistic local state update
    setLocalPings((prev) => [...prev.filter((p) => p.expiresAt > timestamp), newPing]);

    // Broadcast to squad room via Firestore
    if (onAddPing) {
      onAddPing({
        type,
        lat,
        lng,
        placedBy: currentUserDisplayName || 'Vice Operative',
        placedByColor: currentUserColor
      });
    }

    setClickLocation(null);
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Update local user position telemetry when clicking anywhere on map
    onUpdatePosition(lat, lng);

    // If Quick Ping tool is active, immediately place ping without opening popup
    if (activePingTool === 'danger' || activePingTool === 'loot') {
      handleDropPing(lat, lng, activePingTool);
      return;
    }

    setClickLocation({ lat, lng });
    setNewWaypointLabel('');
  };

  const handleConfirmAddWaypoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clickLocation) return;
    onAddWaypoint({
      label: newWaypointLabel.trim() || `${newWaypointType.toUpperCase()} Ping`,
      type: newWaypointType,
      lat: clickLocation.lat,
      lng: clickLocation.lng,
      placedBy: currentUserDisplayName || 'Squadmate'
    });
    setClickLocation(null);
    setNewWaypointLabel('');
  };

  // Combine focus coordinates from props or ping focus clicks
  const effectiveFocusedCoords = pingFocusedCoords || focusedCoordinates;

  if (!isMounted) {
    return (
      <div className="relative w-full h-full min-h-[550px] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <Radio className="w-6 h-6 text-emerald-400 absolute" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">
            Initializing Squad Tactical Radar
          </h4>
          <p className="text-xs text-zinc-500 font-mono">
            Calibrating GPS satellite grid & GIS coordinates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[550px] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
      {/* Floating Follow Mode Status HUD Banner */}
      {activeFollowingUid && followedMember && (
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3 bg-zinc-950/95 backdrop-blur-md border border-amber-500/60 px-3.5 py-2.5 rounded-2xl shadow-2xl animate-fade-in pointer-events-auto">
          <div className="relative flex items-center justify-center">
            <Crosshair
              className="w-4 h-4 text-amber-400 animate-spin"
              style={{ animationDuration: '6s' }}
            />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">
                Follow Mode Active
              </span>
              <span className="text-[8px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded">
                AUTOCAM
              </span>
            </div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow"
                style={{ backgroundColor: followedMember.avatarColor || '#F59E0B' }}
              />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {followedMember.displayName}{' '}
                {activeFollowingUid === currentUserId ? '(You)' : ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggleFollow(null)}
            className="ml-2 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-[10px] font-extrabold uppercase transition border border-zinc-700 cursor-pointer shadow"
            title="Stop following and release camera control"
          >
            Free Cam
          </button>
        </div>
      )}

      {/* Floating Tactical Ping Mode Toolbar */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-md border border-zinc-700/80 p-1.5 rounded-2xl shadow-2xl">
          <button
            type="button"
            onClick={() => setActivePingTool('navigate')}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
              activePingTool === 'navigate'
                ? 'bg-zinc-800 text-white border-zinc-600 shadow'
                : 'text-zinc-400 hover:text-white border-transparent hover:bg-zinc-800/50'
            }`}
            title="Navigate / Click for Waypoint Menu"
          >
            <Crosshair className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Navigate</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePingTool(activePingTool === 'danger' ? 'navigate' : 'danger')}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
              activePingTool === 'danger'
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30 animate-pulse'
                : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border-rose-800/50'
            }`}
            title="Toggle Quick 10s Danger Ping Mode (Click map to drop)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>⚠️ Danger Ping (10s)</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePingTool(activePingTool === 'loot' ? 'navigate' : 'loot')}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
              activePingTool === 'loot'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 animate-pulse'
                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border-emerald-800/50'
            }`}
            title="Toggle Quick 10s Loot Ping Mode (Click map to drop)"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>💎 Loot Ping (10s)</span>
          </button>
        </div>

        {/* Active Ping Tool Instruction Banner */}
        {activePingTool !== 'navigate' && (
          <div className="px-3 py-1.5 bg-zinc-950/95 border border-amber-500/80 rounded-xl text-[11px] font-extrabold text-amber-300 shadow-xl flex items-center gap-1.5 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Click anywhere on map to drop 10s {activePingTool.toUpperCase()} ping!</span>
          </div>
        )}

        {/* Active Live Pings Radar Feed (Isolated timer, zero outer re-renders) */}
        <SquadPingsFeed
          pings={allPings}
          onFocusPing={(coords) => {
            setPingFocusedCoords(coords);
            setTimeout(() => setPingFocusedCoords(null), 1200);
          }}
        />
      </div>

      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className={`w-full h-full z-0 ${
          activePingTool !== 'navigate' ? 'cursor-crosshair' : ''
        }`}
        style={{ height: '100%', width: '100%', background: '#09090b' }}
      >
        <MapController
          focusedCoordinates={effectiveFocusedCoords}
          followingCoordinates={followingCoordinates}
          isFollowing={Boolean(activeFollowingUid && followingCoordinates)}
          onUserPan={() => handleToggleFollow(null)}
        />
        <MapClickHandler onMapClick={handleMapClick} />

        {/* High-Contrast Tactical Dark Tiles (Watermark-Free) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com">Esri</a>, HERE, Garmin, OpenStreetMap'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />

        {/* Vice City District Sector Overlays */}
        <Marker position={[25.778, -80.131]} icon={L.divIcon({
          html: '<div class="px-2.5 py-1 bg-rose-600/90 text-white border border-rose-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">🌴 Vice Beach</div>',
          className: 'district-label',
          iconSize: [110, 30]
        })} />
        <Marker position={[25.774, -80.193]} icon={L.divIcon({
          html: '<div class="px-2.5 py-1 bg-cyan-600/90 text-white border border-cyan-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">🏙️ Downtown Vice</div>',
          className: 'district-label',
          iconSize: [130, 30]
        })} />
        <Marker position={[25.775, -80.160]} icon={L.divIcon({
          html: '<div class="px-2.5 py-1 bg-amber-500/90 text-black border border-amber-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">⭐ Starfish Island</div>',
          className: 'district-label',
          iconSize: [130, 30]
        })} />
        <Marker position={[25.805, -80.195]} icon={L.divIcon({
          html: '<div class="px-2.5 py-1 bg-purple-600/90 text-white border border-purple-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">🎨 Little Haiti</div>',
          className: 'district-label',
          iconSize: [105, 30]
        })} />
        <Marker position={[25.750, -80.250]} icon={L.divIcon({
          html: '<div class="px-2.5 py-1 bg-emerald-600/90 text-white border border-emerald-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">⚓ Port Gellhorn</div>',
          className: 'district-label',
          iconSize: [120, 30]
        })} />
        <Marker position={[25.680, -80.350]} icon={L.divIcon({
          html: '<div class="px-2.5 py-1 bg-indigo-600/90 text-white border border-indigo-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">🐊 Everglades / Keys</div>',
          className: 'district-label',
          iconSize: [140, 30]
        })} />

        {/* Render Connected Squad Members */}
        {squadRoom && squadRoom.members &&
          Object.entries(squadRoom.members).map(([uid, member]) => {
            if (!member || typeof member.lat !== 'number' || typeof member.lng !== 'number') {
              return null;
            }
            const isSelf = uid === currentUserId;
            const isFollowed = uid === activeFollowingUid;
            const icon = createSquadMemberIcon(
              member.displayName,
              member.avatarColor,
              isSelf,
              isFollowed
            );

            return (
              <React.Fragment key={`member-${uid}`}>
                <Marker position={[member.lat, member.lng]} icon={icon}>
                  <Popup className="squad-popup">
                    <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-2xl min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shrink-0"
                          style={{ backgroundColor: member.avatarColor || '#3B82F6' }}
                        />
                        <span className="font-extrabold text-sm text-zinc-100 truncate">
                          {member.displayName} {isSelf && '(You)'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mb-1">
                        GPS Telemetry: {member.lat.toFixed(4)}, {member.lng.toFixed(4)}
                      </p>
                      <div className="text-[9px] text-emerald-400 font-mono mb-2.5">
                        Last Active: {new Date(member.lastUpdated || Date.now()).toLocaleTimeString()}
                      </div>

                      <div className="pt-2 border-t border-zinc-800 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleFollow(isFollowed ? null : uid);
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-extrabold uppercase transition flex items-center justify-center gap-1 cursor-pointer border ${
                            isFollowed
                              ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                          }`}
                        >
                          <Crosshair className="w-3 h-3" />
                          <span>{isFollowed ? 'Unfollow' : 'Follow'}</span>
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Radar Radius Ring around self */}
                {isSelf && (
                  <Circle
                    center={[member.lat, member.lng]}
                    radius={400}
                    pathOptions={{
                      color: '#F43F5E',
                      fillColor: '#F43F5E',
                      fillOpacity: 0.08,
                      weight: 1,
                      dashArray: '4, 4'
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}

        {/* Render Temporary 10-Second Danger and Loot Tactical Pings (Isolated layer, no map flicker) */}
        <SquadPingsLayer pings={allPings} />

        {/* Render Team Waypoints */}
        {squadRoom && squadRoom.waypoints &&
          squadRoom.waypoints.map((wp) => {
            if (!wp || typeof wp.lat !== 'number' || typeof wp.lng !== 'number') return null;
            const icon = createWaypointIcon(wp.type, wp.label);

            return (
              <Marker key={`wp-${wp.id}`} position={[wp.lat, wp.lng]} icon={icon}>
                <Popup>
                  <div className="p-2 bg-zinc-900 text-white rounded-lg min-w-[170px]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-rose-400 uppercase tracking-wide">
                        {wp.type} WAYPOINT
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveWaypoint(wp.id)}
                        className="p-1 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                        title="Remove Waypoint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-black text-sm text-zinc-100 mb-1">{wp.label}</div>
                    <div className="text-[10px] text-zinc-400">
                      Placed by: <span className="text-zinc-200">{wp.placedBy}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Render Vice City Collectibles */}
        {collectibles.map((loc) => {
          if (typeof loc.x !== 'number' || typeof loc.y !== 'number') {
            return null;
          }
          // Convert 0-100 coordinate scaling to lat/lng mapping
          const lat = 25.70 + (loc.y / 100) * 0.12;
          const lng = -80.25 + (loc.x / 100) * 0.12;
          const isChecked = checkedCollectiblesList.includes(loc.id);
          const icon = createCollectibleIcon(loc.category, loc.title, isChecked);

          return (
            <Marker key={`collectible-${loc.id}`} position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="p-2.5 bg-zinc-900 text-white rounded-lg shadow-xl min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      {loc.category}
                    </span>
                    {isChecked && (
                      <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Found
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs text-zinc-100 mb-1">{loc.title}</div>
                  <p className="text-[10px] text-zinc-400 mb-3">{loc.description}</p>

                  <button
                    type="button"
                    onClick={() => onToggleCollectible(loc.id)}
                    className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isChecked
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isChecked ? 'Mark as Uncollected' : 'Sync Collectible as Found'}</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Contextual Popup Modal when clicking anywhere on Map */}
        {clickLocation && (
          <Popup
            position={[clickLocation.lat, clickLocation.lng]}
            eventHandlers={{
              remove: () => {
                setClickLocation(null);
                setNewWaypointLabel('');
              }
            }}
          >
            <div
              className="p-3 bg-zinc-900 text-white rounded-xl shadow-2xl min-w-[230px]"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Squad Pings & Waypoints
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setClickLocation(null);
                    setNewWaypointLabel('');
                  }}
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-bold cursor-pointer p-1 -mr-1"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {/* 1-Click 10-Second Danger & Loot Tactical Pings */}
              <div className="mb-2.5 pb-2.5 border-b border-zinc-800">
                <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-1.5">
                  ⚡ Quick 10s Squad Pings
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDropPing(clickLocation.lat, clickLocation.lng, 'danger');
                    }}
                    className="py-2 px-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-[11px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>⚠️ Danger (10s)</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDropPing(clickLocation.lat, clickLocation.lng, 'loot');
                    }}
                    className="py-2 px-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>💎 Loot (10s)</span>
                  </button>
                </div>
              </div>

              {/* Persistent Waypoint Form */}
              <form onSubmit={handleConfirmAddWaypoint} className="space-y-2">
                <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                  📍 Custom Persistent Waypoint
                </div>
                <div>
                  <input
                    type="text"
                    value={newWaypointLabel}
                    onChange={(e) => setNewWaypointLabel(e.target.value)}
                    placeholder="e.g. Safehouse, Meetup Point"
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                    autoFocus
                  />
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-1">
                    {(['heist', 'meetup', 'danger', 'collectible'] as Waypoint['type'][]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewWaypointType(t);
                        }}
                        className={`py-1 px-2 rounded text-[10px] font-extrabold capitalize transition cursor-pointer border ${
                          newWaypointType === t
                            ? 'bg-rose-500 text-white border-rose-400'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-lg text-xs shadow transition cursor-pointer"
                  >
                    Add Waypoint
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setClickLocation(null);
                      setNewWaypointLabel('');
                    }}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  );
};
