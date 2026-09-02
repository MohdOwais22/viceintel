'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MAP_LOCATIONS_DATA, ExtendedMapLocation } from '../data/mapLocations';
import { getCachedMapLocations } from '../lib/offlineStorage';
import { initializeRealtimeMapSync, getStoredMapLocations, MAP_LOCATIONS_UPDATED_EVENT } from '../lib/mapStore';
import {
  MapPin,
  Filter,
  Navigation,
  Compass,
  Shield,
  Crosshair,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  Share2,
  ExternalLink,
  Flame,
  Award,
  Crown,
  Radio,
  Users,
  Lock,
  Bell,
  X,
  Clock
} from 'lucide-react';

import { copyToClipboard } from '../lib/copyUtils';
import { MapHeatmapLayer, HeatmapPoint } from './MapHeatmapLayer';
import { LeonidaIslandMap } from './map/LeonidaIslandMap';
import { RealLeonidaMap } from './map/RealLeonidaMap';
import { SquadMapCanvas } from './map/SquadMapCanvas';
import { SquadRadarHUD } from './map/SquadRadarHUD';
import {
  SquadRoom,
  SquadMember,
  Waypoint,
  SquadPing,
  createSquadRoom,
  joinSquadRoom,
  leaveSquadRoom,
  kickSquadMember,
  toggleLockSquadRoom,
  updateSquadRoomPasscode,
  updatePlayerPosition,
  addWaypoint,
  removeWaypoint,
  addSquadPing,
  toggleCollectibleSync,
  subscribeToSquadRoom,
  getCachedActiveRoom,
  clearCachedRoom
} from '../lib/squad-radar';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type MapTheme = 'leonida' | 'neon' | 'satellite' | 'night' | 'tactical';
import { LeonidaMapLegend } from './map/LeonidaMapLegend';
import { LEONIDA_LANDMARKS, LEONIDA_COUNTIES, LeonidaLandmark } from '../data/leonidaGeography';

export const InteractiveMap: React.FC = () => {
  // Mode Selection: 'classic' (State of Leonida Vector GIS Map) vs 'squad' (Live Squad Radar)
  const [mapViewMode, setMapViewMode] = useState<'classic' | 'squad'>('classic');

  // Squad Radar Real-Time Telemetry & Party Room State
  const [activeUser, setActiveUser] = useState<{
    uid: string;
    displayName: string;
    color: string;
    isVip: boolean;
  }>(() => {
    const randId = Math.floor(1000 + Math.random() * 9000);
    return {
      uid: `guest_${randId}`,
      displayName: `ViceOperative_${randId}`,
      color: '#3B82F6',
      isVip: false
    };
  });

  const [squadRoom, setSquadRoom] = useState<SquadRoom | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showVipUpgradeModal, setShowVipUpgradeModal] = useState<boolean>(false);
  const [focusedMemberUid, setFocusedMemberUid] = useState<string | null>(null);
  const [focusedCoordinates, setFocusedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [followingMemberUid, setFollowingMemberUid] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 25.7617,
    lng: -80.1918
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Classic Map State
  const [mapLocationsList, setMapLocationsList] = useState<ExtendedMapLocation[]>(MAP_LOCATIONS_DATA as ExtendedMapLocation[]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLocation, setActiveLocation] = useState<ExtendedMapLocation | null>(null);
  const [mapTheme, setMapTheme] = useState<MapTheme>('leonida');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showCountyBorders, setShowCountyBorders] = useState<boolean>(true);
  const [showBuildings, setShowBuildings] = useState<boolean>(true);
  const [showMetro, setShowMetro] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [selectedLandmark, setSelectedLandmark] = useState<LeonidaLandmark | null>(null);

  // Pan & Drag Canvas Navigation
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });
  const hasMovedRef = useRef<boolean>(false);

  // Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let isVip = false;
        let displayName = firebaseUser.displayName || 'Vice Gamer';

        try {
          const profileDoc = await getDoc(doc(db, 'userProfiles', firebaseUser.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            isVip = Boolean(data.isVip || data.role === 'Admin' || data.role === 'Staff');
            if (data.username) displayName = data.username;
          }
        } catch (e) {
          console.warn('Profile fetch notice:', e);
        }

        setActiveUser({
          uid: firebaseUser.uid,
          displayName,
          color: isVip ? '#F59E0B' : '#3B82F6',
          isVip
        });
      }
    });

    return () => unsub();
  }, []);

  // Initialize 2,000x Optimized Map Locations Bundled Store Engine (Thanh Le Pattern)
  useEffect(() => {
    initializeRealtimeMapSync();
    getStoredMapLocations().then((locs) => {
      if (locs && locs.length > 0) {
        setMapLocationsList(locs);
      }
    }).catch(() => {});

    const handleUpdate = () => {
      getStoredMapLocations().then((locs) => {
        if (locs && locs.length > 0) {
          setMapLocationsList(locs);
        }
      }).catch(() => {});
    };

    window.addEventListener(MAP_LOCATIONS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(MAP_LOCATIONS_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  // Real-time Firestore Subscription for Active Squad Room
  useEffect(() => {
    if (!activeRoomId) {
      setSquadRoom(null);
      return;
    }

    const unsub = subscribeToSquadRoom(
      activeRoomId,
      (updatedRoom) => {
        if (!updatedRoom) {
          if (activeRoomId) {
            setStatusMessage(`Squad room ${activeRoomId} was cleared due to 30 minutes of inactivity.`);
            clearCachedRoom();
            setActiveRoomId(null);
            setTimeout(() => setStatusMessage(null), 4000);
          }
          setSquadRoom(null);
          return;
        }

        // Check if current user was kicked or removed by room host
        if (
          updatedRoom.kickedUids?.includes(activeUser.uid) ||
          (!updatedRoom.members?.[activeUser.uid] && activeUser.uid !== updatedRoom.hostUid)
        ) {
          setStatusMessage('⚠️ You were removed from squad room by the host.');
          clearCachedRoom();
          setActiveRoomId(null);
          setSquadRoom(null);
          setTimeout(() => setStatusMessage(null), 4000);
          return;
        }

        if (updatedRoom.isStale || updatedRoom.status === 'stale') {
          setStatusMessage(`Squad room ${activeRoomId} has expired due to 30 minutes of inactivity.`);
          clearCachedRoom();
          setActiveRoomId(null);
          setSquadRoom(null);
          setTimeout(() => setStatusMessage(null), 4000);
          return;
        }

        setSquadRoom(updatedRoom);
      },
      (err) => {
        console.warn('Squad room subscription notice:', err);
      }
    );

    return () => unsub();
  }, [activeRoomId, activeUser.uid]);

  // Check URL parameters for ?room=VC-XXXX or cached room on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');

    const initRoom = async () => {
      const targetRoom = roomParam ? roomParam.toUpperCase().trim() : await getCachedActiveRoom();
      if (targetRoom) {
        setMapViewMode('squad');
        setStatusMessage(`Connecting to squad room ${targetRoom}...`);
        const result = await joinSquadRoom(targetRoom, {
          uid: activeUser.uid,
          displayName: activeUser.displayName,
          color: activeUser.color,
          lat: userLocation.lat,
          lng: userLocation.lng
        });

        if (result.success) {
          setActiveRoomId(targetRoom);
          setStatusMessage(`Connected to squad room ${targetRoom}!`);
          setTimeout(() => setStatusMessage(null), 3000);
        } else {
          if (result.requiresVip) {
            setShowVipUpgradeModal(true);
          }
          setStatusMessage(result.error || 'Failed to connect to room.');
          setTimeout(() => setStatusMessage(null), 4000);
        }
      }
    };

    initRoom();
  }, [activeUser.uid]);

  // Squad Radar Action Handlers
  const handleCreateRoom = async (isVip: boolean, passcode?: string) => {
    try {
      setStatusMessage('Hosting new squad room...');
      const newRoomId = await createSquadRoom(
        activeUser.uid,
        isVip,
        {
          displayName: activeUser.displayName,
          avatarColor: activeUser.color,
          lat: userLocation.lat,
          lng: userLocation.lng
        },
        { passcode }
      );
      setActiveRoomId(newRoomId);
      setStatusMessage(`Created squad room ${newRoomId}!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Error creating room:', err);
      setStatusMessage('Failed to create squad room.');
    }
  };

  const handleJoinRoom = async (roomId: string, passcode?: string) => {
    try {
      setStatusMessage(`Joining room ${roomId}...`);
      const result = await joinSquadRoom(
        roomId,
        {
          uid: activeUser.uid,
          displayName: activeUser.displayName,
          color: activeUser.color,
          lat: userLocation.lat,
          lng: userLocation.lng
        },
        passcode
      );

      if (result.success) {
        setActiveRoomId(roomId.toUpperCase());
        setStatusMessage(`Connected to ${roomId.toUpperCase()}`);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        if (result.requiresVip) {
          setShowVipUpgradeModal(true);
        }
        setStatusMessage(result.error || 'Failed to join room.');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Error joining room:', err);
      setStatusMessage('Failed to join room.');
    }
  };

  const handleKickMember = async (targetUid: string) => {
    if (!activeRoomId) return;
    try {
      const res = await kickSquadMember(activeRoomId, activeUser.uid, targetUid);
      if (res.success) {
        setStatusMessage('Player kicked from squad room.');
        setTimeout(() => setStatusMessage(null), 2500);
      } else {
        setStatusMessage(res.error || 'Failed to kick player.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      console.warn('Kick member error:', e);
    }
  };

  const handleToggleLockRoom = async (isLocked: boolean) => {
    if (!activeRoomId) return;
    try {
      const res = await toggleLockSquadRoom(activeRoomId, activeUser.uid, isLocked);
      if (res.success) {
        setStatusMessage(isLocked ? '🔒 Squad room locked.' : '🔓 Squad room unlocked.');
        setTimeout(() => setStatusMessage(null), 2500);
      }
    } catch (e) {
      console.warn('Lock room error:', e);
    }
  };

  const handleUpdatePasscode = async (passcode?: string) => {
    if (!activeRoomId) return;
    try {
      const res = await updateSquadRoomPasscode(activeRoomId, activeUser.uid, passcode);
      if (res.success) {
        setStatusMessage(passcode ? `🔑 Squad room PIN set to ${passcode}` : 'Room PIN cleared.');
        setTimeout(() => setStatusMessage(null), 2500);
      }
    } catch (e) {
      console.warn('Update passcode error:', e);
    }
  };

  const handleLeaveRoom = async () => {
    if (activeRoomId) {
      await leaveSquadRoom(activeRoomId, activeUser.uid);
      setActiveRoomId(null);
      setSquadRoom(null);
      setStatusMessage('Left squad room.');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleUpdatePosition = useCallback(
    async (lat: number, lng: number) => {
      setUserLocation({ lat, lng });
      if (activeRoomId) {
        await updatePlayerPosition(activeRoomId, activeUser.uid, lat, lng);
      }
    },
    [activeRoomId, activeUser.uid]
  );

  const handleAddWaypoint = async (wp: Omit<Waypoint, 'id'>) => {
    if (!activeRoomId) {
      setStatusMessage('Please create or join a squad room first!');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    await addWaypoint(activeRoomId, wp);
  };

  const handleAddPing = async (ping: Omit<SquadPing, 'id' | 'timestamp' | 'expiresAt'>) => {
    if (!activeRoomId) {
      setStatusMessage(`${ping.type === 'danger' ? '⚠️ Danger' : '💎 Loot'} ping placed locally! Join a squad room to broadcast.`);
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    await addSquadPing(activeRoomId, ping);
    setStatusMessage(`Broadcasted ${ping.type === 'danger' ? '⚠️ Danger' : '💎 Loot'} Ping (10s) to squad!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleRemoveWaypoint = async (wpId: string) => {
    if (!activeRoomId) return;
    await removeWaypoint(activeRoomId, wpId);
  };

  const handleToggleCollectibleSync = async (collectibleId: string) => {
    if (!activeRoomId) {
      setStatusMessage('Please create or join a squad room to sync collectibles!');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    await toggleCollectibleSync(activeRoomId, collectibleId);
  };

  const handleFocusMember = (uid: string, member: SquadMember) => {
    setFocusedMemberUid(uid);
    if (member && typeof member.lat === 'number') {
      setFocusedCoordinates({ lat: member.lat, lng: member.lng });
    }
  };

  const handleToggleFollowMember = (uid: string | null, member?: SquadMember) => {
    setFollowingMemberUid(uid);
    if (uid && member && typeof member.lat === 'number') {
      setFocusedCoordinates({ lat: member.lat, lng: member.lng });
      setStatusMessage(`Following ${member.displayName || 'squadmate'}`);
      setTimeout(() => setStatusMessage(null), 2500);
    } else if (!uid) {
      setStatusMessage('Switched to Free Camera mode');
      setTimeout(() => setStatusMessage(null), 2000);
    }
  };

  // Auto-clear follow state if followed member leaves room
  useEffect(() => {
    if (followingMemberUid && squadRoom?.members && !squadRoom.members[followingMemberUid]) {
      setFollowingMemberUid(null);
    }
  }, [followingMemberUid, squadRoom?.members]);

  // Keyboard shortcut listener to exit fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    getCachedMapLocations().then((data) => {
      if (data && data.length > 0) {
        setMapLocationsList(data as ExtendedMapLocation[]);
        if (activeLocation && !data.some(d => d.id === activeLocation.id)) {
          setActiveLocation(null);
        }
      }
    });
  }, []);

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedTeleport, setCopiedTeleport] = useState<boolean>(false);
  const mapSource: 'gtavi' = 'gtavi';
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showDistricts, setShowDistricts] = useState<boolean>(true);
  const [showTopography, setShowTopography] = useState<boolean>(true);
  const [showWaterways, setShowWaterways] = useState<boolean>(true);

  // GTA VI Map Lock & Releasing Soon Modal state
  const [showReleasingSoonModal, setShowReleasingSoonModal] = useState<boolean>(false);
  const [hasJoinedWaitlist, setHasJoinedWaitlist] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gtavi_map_waitlist_joined') === 'true';
    } catch {
      return false;
    }
  });

  const handleJoinWaitlist = () => {
    const nextState = !hasJoinedWaitlist;
    setHasJoinedWaitlist(nextState);
    try {
      if (nextState) {
        localStorage.setItem('gtavi_map_waitlist_joined', 'true');
      } else {
        localStorage.removeItem('gtavi_map_waitlist_joined');
      }
    } catch {
      // fallback
    }
  };

  const handleViewModeChange = (mode: 'classic' | 'squad') => {
    setMapViewMode(mode);
  };

  // D3 Activity Heatmap Layer State
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapMode, setHeatmapMode] = useState<'business' | 'crime' | 'all'>('business');

  // Custom User GPS Waypoint
  const [userWaypoint, setUserWaypoint] = useState<{ x: number; y: number } | null>({ x: 50, y: 50 });

  // Discovered Locations Tracking (Saved in localStorage)
  const [discoveredIds, setDiscoveredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gtavi_discovered_locations');
      return saved ? JSON.parse(saved) : ['m1', 'm2', 'm4'];
    } catch {
      return ['m1', 'm2', 'm4'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gtavi_discovered_locations', JSON.stringify(discoveredIds));
    } catch (e) {
      console.error(e);
    }
  }, [discoveredIds]);

  const toggleDiscovered = (id: string) => {
    setDiscoveredIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const categories = ['All', 'Dealership', 'Ammu-Nation', 'Business', 'Safehouse', 'Heist Target', 'Stunt Jump', 'Easter Egg'];
  const districts = ['All', 'Vice Beach', 'Downtown Vice', 'Port Gellhorn', 'Little Haiti', 'Starfish Island', 'Everglades / Keys'];

  const filteredLocations = mapLocationsList.filter((loc) => {
    const matchesSource = !loc.mapSource || loc.mapSource === 'both' || loc.mapSource === 'gtavi';
    if (!matchesSource) return false;
    const matchesCategory = selectedCategory === 'All' || loc.category === selectedCategory;
    const matchesDistrict = selectedDistrict === 'All' || loc.district === selectedDistrict;
    const matchesSearch = loc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          loc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          loc.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDistrict && matchesSearch;
  });

  const handleCopyTeleport = async (cmd?: string) => {
    if (!cmd) return;
    await copyToClipboard(cmd);
    setCopiedTeleport(true);
    setTimeout(() => setCopiedTeleport(false), 2000);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panOffset.x,
      panY: panOffset.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }
    setPanOffset({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomLevel((z) => Math.min(Math.max(Number((z + delta).toFixed(2)), 0.6), 4));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasMovedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setUserWaypoint({ x, y });
  };

  const handleResetPanAndZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setUserWaypoint({ x: 50, y: 50 });
  };

  const calculateDistance = () => {
    if (!userWaypoint || !activeLocation) return '0.0 mi';
    const dx = activeLocation.x - userWaypoint.x;
    const dy = activeLocation.y - userWaypoint.y;
    const distUnits = Math.sqrt(dx * dx + dy * dy);
    const miles = (distUnits * 0.12).toFixed(2);
    return `${miles} mi (${Math.round(distUnits * 150)} meters)`;
  };

  const completionPercentage = Math.round((discoveredIds.length / MAP_LOCATIONS_DATA.length) * 100);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Ammu-Nation': return 'text-rose-400 bg-rose-500/20 border-rose-500/30';
      case 'Dealership': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'Business': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'Safehouse': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
      case 'Heist Target': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'Stunt Jump': return 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30';
      case 'Easter Egg': return 'text-pink-400 bg-pink-500/20 border-pink-500/30';
      default: return 'text-zinc-300 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Mode Switcher */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/40 rounded-2xl shadow-lg">
              <Compass className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  State of Leonida — Interactive GIS Vector Map
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-extrabold uppercase">
                  MAPPING PROJECT
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                High-fidelity cartographic vector geography, county borders, Mount Kalaga topography, GTA VI landmarks & live squad radar.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleViewModeChange('classic')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                mapViewMode === 'classic'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold shadow-lg border border-amber-400/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>🗺️ State of Leonida Interactive Island Map</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange('squad')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                mapViewMode === 'squad'
                  ? 'bg-gradient-to-r from-rose-600 to-cyan-600 text-white shadow-lg border border-rose-400/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4 text-amber-200 animate-pulse" />
              <span>Live Squad Radar</span>
              <span className="px-1.5 py-0.5 bg-rose-500/30 text-rose-200 text-[9px] font-extrabold rounded uppercase">
                CO-OP
              </span>
            </button>
          </div>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div className="p-3 bg-zinc-950 border border-rose-500/40 rounded-2xl text-xs font-bold text-rose-300 flex items-center gap-2 animate-pulse">
            <Radio className="w-4 h-4 text-rose-400 shrink-0 animate-ping" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: LIVE SQUAD RADAR & CO-OP PARTY SYNC */}
      {mapViewMode === 'squad' ? (
        <div className="relative w-full h-[650px] sm:h-[720px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
          <SquadMapCanvas
            squadRoom={squadRoom}
            currentUserId={activeUser.uid}
            currentUserDisplayName={activeUser.displayName}
            currentUserColor={activeUser.color}
            onUpdatePosition={handleUpdatePosition}
            onAddWaypoint={handleAddWaypoint}
            onAddPing={handleAddPing}
            onRemoveWaypoint={handleRemoveWaypoint}
            onToggleCollectible={handleToggleCollectibleSync}
            focusedMemberUid={focusedMemberUid}
            focusedCoordinates={focusedCoordinates}
            followingMemberUid={followingMemberUid}
            onToggleFollowMember={handleToggleFollowMember}
          />

          <SquadRadarHUD
            squadRoom={squadRoom}
            currentUserId={activeUser.uid}
            isVipUser={activeUser.isVip}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onLeaveRoom={handleLeaveRoom}
            onKickMember={handleKickMember}
            onToggleLockRoom={handleToggleLockRoom}
            onUpdatePasscode={handleUpdatePasscode}
            onFocusMember={handleFocusMember}
            followingMemberUid={followingMemberUid}
            onToggleFollowMember={handleToggleFollowMember}
            showVipUpgradeModal={showVipUpgradeModal}
            onCloseVipModal={() => setShowVipUpgradeModal(false)}
            onOpenVipModal={() => setShowVipUpgradeModal(true)}
          />
        </div>
      ) : (
        /* VIEW MODE 2: STATE OF LEONIDA VECTOR ISLAND MAP */
        <div className="w-full space-y-6">
          <LeonidaIslandMap
            activeLocation={activeLocation}
            onSelectLocation={(loc) => setActiveLocation(loc)}
            discoveredIds={discoveredIds}
            onToggleDiscovered={toggleDiscovered}
            squadRoom={squadRoom}
            currentUserId={activeUser.uid}
            currentUserDisplayName={activeUser.displayName}
            currentUserColor={activeUser.color}
            onUpdatePosition={(coords) => handleUpdatePosition(coords.lat, coords.lng)}
            onAddWaypoint={handleAddWaypoint}
            onAddPing={handleAddPing}
            onRemoveWaypoint={handleRemoveWaypoint}
            focusedMemberCoordinates={focusedCoordinates}
          />

          {/* Selected Landmark / POI Detail Modal */}
          {selectedLandmark && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
              <div className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 my-auto">
                <button
                  type="button"
                  onClick={() => setSelectedLandmark(null)}
                  className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl">
                    <Compass className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
                        {selectedLandmark.type}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold">
                        {selectedLandmark.county} County
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">
                      {selectedLandmark.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedLandmark.description}
                </p>

                {/* Technical Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-bold block">MAP GRID CODE</span>
                    <span className="font-mono text-amber-300 font-bold">{selectedLandmark.gridCode || 's01 e08'}</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-bold block">COORDINATES</span>
                    <span className="font-mono text-zinc-200 font-bold">{selectedLandmark.x}, {selectedLandmark.y}</span>
                  </div>
                  {selectedLandmark.elevation && (
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-zinc-500 font-bold block">ELEVATION</span>
                      <span className="font-mono text-emerald-400 font-bold">{selectedLandmark.elevation}</span>
                    </div>
                  )}
                </div>

                {/* Trailer & Leak Reference */}
                {selectedLandmark.trailerRef && (
                  <div className="p-3 bg-zinc-950 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-bold">GTA VI TRAILER REFERENCE:</span>
                    <span className="text-rose-400 font-mono font-bold">{selectedLandmark.trailerRef}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  {selectedLandmark.teleportCommand && (
                    <button
                      type="button"
                      onClick={() => handleCopyTeleport(selectedLandmark.teleportCommand)}
                      className="w-full sm:flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-700"
                    >
                      {copiedTeleport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedTeleport ? 'Teleport Copied!' : 'Copy /tp Command'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setUserWaypoint({ x: selectedLandmark.x, y: selectedLandmark.y });
                      setSelectedLandmark(null);
                      setStatusMessage(`Set GPS Waypoint to ${selectedLandmark.name}`);
                      setTimeout(() => setStatusMessage(null), 2500);
                    }}
                    className="w-full sm:flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Set GPS Waypoint</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Location Details Sidebar & Actions */}
          {activeLocation ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* COL 1: POI THUMBNAIL (4 COLS) */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-800 aspect-video bg-zinc-950">
                    <img
                      src={activeLocation.imageUrl}
                      alt={activeLocation.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getCategoryColor(activeLocation.category)}`}>
                        {activeLocation.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* COL 2: POI SPECS & DESCRIPTION (5 COLS) */}
                <div className="lg:col-span-5 space-y-3">
                  <div>
                    <h3 className="text-xl font-black text-white">{activeLocation.title}</h3>
                    <p className="text-xs text-rose-400 font-bold mt-0.5">{activeLocation.district} District</p>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">{activeLocation.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] text-zinc-500 font-bold block">X / Y COORDINATES</span>
                      <span className="font-mono text-zinc-200 font-bold">{activeLocation.x}, {activeLocation.y}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <span className="text-[10px] text-zinc-500 font-bold block">GPS DISTANCE</span>
                      <span className="font-mono text-amber-400 font-bold">{calculateDistance()}</span>
                    </div>
                  </div>

                  {activeLocation.teleportCommand && (
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block">FiveM Teleport</span>
                        <code className="text-xs text-rose-400 font-mono font-bold truncate block">{activeLocation.teleportCommand}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyTeleport(activeLocation.teleportCommand)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-rose-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedTeleport ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedTeleport ? 'Copied!' : 'Copy /tp'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* COL 3: POI ACTIONS & LOCATION SELECTOR (3 COLS) */}
                <div className="lg:col-span-3 space-y-3">
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleDiscovered(activeLocation.id)}
                      className={`w-full py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                        discoveredIds.includes(activeLocation.id)
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${discoveredIds.includes(activeLocation.id) ? 'text-amber-400' : 'text-zinc-500'}`} />
                      <span>{discoveredIds.includes(activeLocation.id) ? 'Marked Discovered' : 'Mark as Discovered'}</span>
                    </button>

                    <button
                      onClick={() => setUserWaypoint({ x: activeLocation.x, y: activeLocation.y })}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Set GPS Waypoint Here</span>
                    </button>
                  </div>

                  {/* POI Selector Dropdown */}
                  <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800 space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 block px-1">Select Point of Interest:</label>
                    <select
                      value={activeLocation.id}
                      onChange={(e) => {
                        const found = mapLocationsList.find(m => m.id === e.target.value);
                        if (found) setActiveLocation(found);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white p-2 focus:outline-none focus:border-rose-500 font-sans"
                    >
                      {filteredLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.title} ({loc.district})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Default Map Selector Card when no POI is active */
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl shrink-0">
                  <MapPin className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">State of Leonida GPS Map — Vice City Active</h3>
                  <p className="text-xs text-zinc-400">Click any location marker on the map or choose a point of interest below to view details.</p>
                </div>
              </div>
              <div className="w-full md:w-72 shrink-0">
                <select
                  value=""
                  onChange={(e) => {
                    const found = mapLocationsList.find(m => m.id === e.target.value);
                    if (found) setActiveLocation(found);
                  }}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs font-bold text-zinc-200 focus:outline-none focus:border-amber-400 transition cursor-pointer"
                >
                  <option value="" disabled>-- Inspect Point of Interest --</option>
                  {mapLocationsList.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.title} ({loc.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
      {/* GTA VI Map Releasing Soon Modal */}
      {showReleasingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowReleasingSoonModal(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/50 rounded-2xl shadow-lg shrink-0">
                <Lock className="w-8 h-8 text-rose-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider">
                    CLASSIFIED INTEL
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                    GTA VI
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                  Vice City Map Releasing Soon!
                </h2>
                <p className="text-xs text-zinc-400">
                  Official Vice City & Leonida State Interactive GIS Telemetry
                </p>
              </div>
            </div>

            {/* Status Bar */}
            <div className="p-4 bg-zinc-950 border border-rose-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-bold">SYSTEM ACCESS:</span>
                <span className="text-rose-400 font-black font-mono flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> ENCRYPTED / LOCKED
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-bold">TARGET LOCATION:</span>
                <span className="text-amber-300 font-bold">Vice City & State of Leonida</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-bold">RELEASE TIMELINE:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Official GTA VI Game Launch
                </span>
              </div>
            </div>

            {/* Summary text */}
            <p className="text-xs text-zinc-300 leading-relaxed">
              The full high-resolution Vice City & Leonida interactive GIS satellite map with co-op squad telemetry, hidden package coordinates, property heatmaps, and stunt jump locations will officially unlock on GTA VI release day.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-start gap-2.5">
                <Compass className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Full GIS Satellite Map</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">High-definition vector terrain for all Vice City districts.</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-start gap-2.5">
                <Radio className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Live Squad Party Sync</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Real-time room waypoints and co-op member radar.</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">100% Collectibles Engine</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Hidden packages, stunt jumps, and easter egg pins.</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-start gap-2.5">
                <Flame className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Business & Heist Heatmaps</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Passive income locations and heist target telemetry.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleJoinWaitlist}
                className={`w-full py-3.5 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  hasJoinedWaitlist
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-600/30'
                }`}
              >
                {hasJoinedWaitlist ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Waitlist Joined! We'll Alert You On Map Launch</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Join Map Launch Alert Waitlist</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowReleasingSoonModal(false)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Close & Inspect Locked Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
