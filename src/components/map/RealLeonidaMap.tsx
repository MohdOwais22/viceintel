'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import {
  MapPin,
  Compass,
  Layers,
  Search,
  Navigation,
  Crosshair,
  Maximize2,
  Minimize2,
  Sparkles,
  AlertTriangle,
  Radio,
  Copy,
  Check,
  RotateCcw,
  Eye,
  Sliders,
  X,
  Plus,
  Trash2,
  Info,
  Building,
  Anchor,
  TreePine,
  Waves,
  ShieldAlert,
  Flame,
  CheckCircle,
  Crown,
  ZoomIn,
  ZoomOut,
  Map as MapIcon
} from 'lucide-react';
import { MAP_LOCATIONS_DATA, ExtendedMapLocation } from '../../data/mapLocations';
import { LEONIDA_COUNTIES, LEONIDA_LANDMARKS, LeonidaLandmark, LeonidaCounty } from '../../data/leonidaGeography';
import { SquadRoom, SquadMember, Waypoint, SquadPing } from '../../lib/squad-radar';
import { copyToClipboard } from '../../lib/copyUtils';
import { VectorMapTerrain } from './VectorMapTerrain';
import { MapHeatmapLayer } from '../MapHeatmapLayer';

// Fix Leaflet default icon paths on client
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

export type RealMapLayer = 'satellite' | 'dark' | 'streets' | 'osm' | 'topo';
export type RenderEngineMode = 'leaflet' | 'vector';

// Reliable Tile Layer Configurations
export const MAP_TILE_PROVIDERS: Record<
  RealMapLayer,
  { name: string; url: string; attribution: string; maxZoom: number; subdomains?: string[] }
> = {
  satellite: {
    name: 'HD Real Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  },
  dark: {
    name: 'Tactical Dark Matter',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap',
    maxZoom: 19
  },
  streets: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },
  topo: {
    name: 'Topographic Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OSM contributors, SRTM | style: OpenTopoMap',
    maxZoom: 17,
    subdomains: ['a', 'b', 'c']
  }
};

// Regional Quick-Jump Focus Coordinates for Leonida
export const LEONIDA_REGIONS = [
  { id: 'all', name: '🗺️ All Leonida', center: [26.25, -80.95] as [number, number], zoom: 8, vectorX: 50, vectorY: 50, vectorZoom: 1 },
  { id: 'vice_city', name: '🏙️ Vice City Metro', center: [25.774, -80.193] as [number, number], zoom: 13, vectorX: 78, vectorY: 65, vectorZoom: 2.2 },
  { id: 'vice_beach', name: '🏖️ Vice Beach & Ocean Dr', center: [25.782, -80.131] as [number, number], zoom: 14, vectorX: 86, vectorY: 62, vectorZoom: 2.8 },
  { id: 'port_gellhorn', name: '⚓ Port Gellhorn', center: [26.620, -81.860] as [number, number], zoom: 13, vectorX: 18, vectorY: 42, vectorZoom: 2.4 },
  { id: 'mount_kalaga', name: '🏔️ Mount Kalaga', center: [28.450, -81.750] as [number, number], zoom: 12, vectorX: 38, vectorY: 12, vectorZoom: 2.4 },
  { id: 'everglades', name: '🐊 Everglades / Grassrivers', center: [25.950, -80.700] as [number, number], zoom: 11, vectorX: 45, vectorY: 60, vectorZoom: 1.8 },
  { id: 'gator_keys', name: '🏝️ Gator Keys', center: [24.750, -81.150] as [number, number], zoom: 10, vectorX: 42, vectorY: 88, vectorZoom: 2.0 },
  { id: 'airport', name: '✈️ Escobar Airport', center: [25.795, -80.287] as [number, number], zoom: 14, vectorX: 70, vectorY: 62, vectorZoom: 2.6 }
];

// Map 0..100 vector data coordinates into realistic real geographic Lat/Lng coordinates across Leonida
export function mapCoordinateToGeo(x: number, y: number): [number, number] {
  const lat = 28.65 - (y / 100) * (28.65 - 24.5);
  const lng = -82.15 + (x / 100) * (-80.1 + 82.15);
  return [Number(lat.toFixed(5)), Number(lng.toFixed(5))];
}

// Map real Geo Lat/Lng back to 0..100 range
export function geoToMapCoordinate(lat: number, lng: number): { x: number; y: number } {
  const y = ((28.65 - lat) / (28.65 - 24.5)) * 100;
  const x = ((lng - -82.15) / (-80.1 - -82.15)) * 100;
  return {
    x: Math.max(0, Math.min(100, Math.round(x))),
    y: Math.max(0, Math.min(100, Math.round(y)))
  };
}

// Audio ping sound synthesizer
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

// Custom Marker Icons for GTA VI Categories
function createCategoryMarkerIcon(category: string, isActive: boolean, isDiscovered: boolean): L.DivIcon {
  let color = '#f43f5e';
  let emoji = '📍';

  switch (category) {
    case 'Ammu-Nation':
      color = '#ef4444';
      emoji = '🔫';
      break;
    case 'Dealership':
      color = '#f59e0b';
      emoji = '🏎️';
      break;
    case 'Business':
      color = '#10b981';
      emoji = '💼';
      break;
    case 'Safehouse':
      color = '#06b6d4';
      emoji = '🏠';
      break;
    case 'Heist Target':
      color = '#a855f7';
      emoji = '💰';
      break;
    case 'Stunt Jump':
      color = '#6366f1';
      emoji = '🚀';
      break;
    case 'Easter Egg':
      color = '#ec4899';
      emoji = '👽';
      break;
    default:
      color = '#e11d48';
      emoji = '⭐';
  }

  const borderClass = isActive
    ? 'border-2 border-white ring-4 ring-rose-500 scale-125 z-50'
    : isDiscovered
    ? 'border border-amber-300 ring-2 ring-amber-400/50'
    : 'border border-zinc-700 hover:scale-110';

  const html = `
    <div class="relative group flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-transform duration-200">
      ${isActive ? `<div class="absolute w-8 h-8 rounded-full animate-ping opacity-60 pointer-events-none" style="background-color: ${color};"></div>` : ''}
      <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs shadow-xl transition-all ${borderClass}" style="background-color: ${isActive ? color : '#18181b'};">
        <span class="drop-shadow">${emoji}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-poi-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

// Map Invalidation & Resize Watcher
function MapResizeWatcher() {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    const t3 = setTimeout(() => map.invalidateSize(), 1200);

    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

// Controller component to smoothly fly map camera
function MapFlyController({
  targetCenter,
  targetZoom
}: {
  targetCenter?: [number, number] | null;
  targetZoom?: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, targetZoom || map.getZoom(), {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [targetCenter, targetZoom, map]);

  return null;
}

// Real Map Click Handler
function MapClickHandler({
  onMapClick
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const target = e.originalEvent?.target as HTMLElement | null;
      if (
        target &&
        (target.closest('.leaflet-popup') ||
          target.closest('.leaflet-control') ||
          target.closest('button') ||
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

export interface RealLeonidaMapProps {
  activeLocation?: ExtendedMapLocation | null;
  onSelectLocation?: (loc: ExtendedMapLocation) => void;
  discoveredIds?: string[];
  onToggleDiscovered?: (id: string) => void;
  squadRoom?: SquadRoom | null;
  currentUserId?: string;
  currentUserDisplayName?: string;
  currentUserColor?: string;
  onUpdatePosition?: (lat: number, lng: number) => void;
  onAddWaypoint?: (waypoint: Omit<Waypoint, 'id'>) => void;
  onAddPing?: (ping: Omit<SquadPing, 'id' | 'timestamp' | 'expiresAt'>) => void;
  onRemoveWaypoint?: (id: string) => void;
  focusedMemberCoordinates?: { lat: number; lng: number } | null;
}

export const RealLeonidaMap: React.FC<RealLeonidaMapProps> = ({
  activeLocation,
  onSelectLocation,
  discoveredIds = [],
  onToggleDiscovered,
  squadRoom,
  currentUserId = 'user_1',
  currentUserDisplayName = 'Vice Operative',
  currentUserColor = '#f43f5e',
  onUpdatePosition,
  onAddWaypoint,
  onAddPing,
  onRemoveWaypoint,
  focusedMemberCoordinates
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [engineMode, setEngineMode] = useState<RenderEngineMode>('leaflet');
  const [selectedLayer, setSelectedLayer] = useState<RealMapLayer>('satellite');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);

  // Vector Engine Pan and Zoom State
  const [vectorPan, setVectorPan] = useState({ x: 0, y: 0 });
  const [vectorZoom, setVectorZoom] = useState(1);
  const [isDraggingVector, setIsDraggingVector] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Heatmap State for Vector View
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<'all' | 'business' | 'crime'>('all');

  // User GPS & Custom Waypoint
  const [userGpsPosition, setUserGpsPosition] = useState<[number, number]>([25.774, -80.193]);
  const [customWaypoint, setCustomWaypoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [copiedTeleport, setCopiedTeleport] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Tactical Ping Tool: 'navigate' | 'danger' | 'loot'
  const [activePingTool, setActivePingTool] = useState<'navigate' | 'danger' | 'loot'>('navigate');
  const [localPings, setLocalPings] = useState<SquadPing[]>([]);

  // Layer Toggles
  const [showCounties, setShowCounties] = useState<boolean>(true);
  const [showPois, setShowPois] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle native browser fullscreen with CSS fallback
  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      if (containerRef.current) {
        try {
          if (containerRef.current.requestFullscreen) {
            await containerRef.current.requestFullscreen();
          } else if ((containerRef.current as any).webkitRequestFullscreen) {
            await (containerRef.current as any).webkitRequestFullscreen();
          }
        } catch (_) {
          // Fallback to CSS full-viewport container
        }
      }
      setIsFullscreen(true);
    } else {
      try {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        }
      } catch (_) {}
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Sync native fullscreenchange events and Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isNativeFS);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, toggleFullscreen]);

  // Sync activeLocation to map flyTarget
  useEffect(() => {
    if (activeLocation) {
      const [lat, lng] = mapCoordinateToGeo(activeLocation.x, activeLocation.y);
      setFlyTarget({ center: [lat, lng], zoom: 15 });
    }
  }, [activeLocation]);

  // Sync focusedMemberCoordinates from squad radar
  useEffect(() => {
    if (focusedMemberCoordinates) {
      setFlyTarget({
        center: [focusedMemberCoordinates.lat, focusedMemberCoordinates.lng],
        zoom: 16
      });
    }
  }, [focusedMemberCoordinates]);

  // Transform standard locations with accurate Lat/Lng
  const enrichedLocations = useMemo(() => {
    return MAP_LOCATIONS_DATA.map((loc) => {
      const [lat, lng] = mapCoordinateToGeo(loc.x, loc.y);
      return {
        ...loc,
        lat,
        lng
      };
    });
  }, []);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return enrichedLocations.filter((loc) => {
      const matchesCat = selectedCategory === 'All' || loc.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        loc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [enrichedLocations, selectedCategory, searchQuery]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(MAP_LOCATIONS_DATA.map((l) => l.category));
    return ['All', ...Array.from(set)];
  }, []);

  const handleRegionSelect = (regionId: string) => {
    const reg = LEONIDA_REGIONS.find((r) => r.id === regionId);
    if (!reg) return;
    setActiveRegion(regionId);
    setFlyTarget({ center: reg.center, zoom: reg.zoom });

    // Center vector view if in vector engine mode
    if (reg.vectorZoom) {
      const offsetX = (50 - reg.vectorX) * 4 * reg.vectorZoom;
      const offsetY = (50 - reg.vectorY) * 4 * reg.vectorZoom;
      setVectorZoom(reg.vectorZoom);
      setVectorPan({ x: offsetX, y: offsetY });
    }
  };

  const handleDropPing = (lat: number, lng: number, type: 'danger' | 'loot') => {
    playPingSound(type);
    const timestamp = Date.now();
    const newPing: SquadPing = {
      id: `ping_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      lat,
      lng,
      placedBy: currentUserDisplayName,
      placedByColor: currentUserColor,
      timestamp,
      expiresAt: timestamp + 10000
    };

    setLocalPings((prev) => [...prev.filter((p) => p.expiresAt > timestamp), newPing]);

    if (onAddPing) {
      onAddPing({
        type,
        lat,
        lng,
        placedBy: currentUserDisplayName,
        placedByColor: currentUserColor
      });
    }

    setStatusMessage(`Placed 10s ${type === 'danger' ? '⚠️ Danger' : '💎 Loot'} Ping!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setUserGpsPosition([lat, lng]);
    if (onUpdatePosition) {
      onUpdatePosition(lat, lng);
    }

    if (activePingTool === 'danger' || activePingTool === 'loot') {
      handleDropPing(lat, lng, activePingTool);
      return;
    }

    const { x, y } = geoToMapCoordinate(lat, lng);
    setCustomWaypoint({
      lat,
      lng,
      label: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    });

    if (onAddWaypoint) {
      onAddWaypoint({
        lat,
        lng,
        label: `Waypoint [${x}, ${y}]`,
        type: 'heist',
        placedBy: currentUserDisplayName
      });
    }

    setStatusMessage(`Updated GPS Waypoint: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleCopyCoords = (lat: number, lng: number) => {
    const { x, y } = geoToMapCoordinate(lat, lng);
    const cmd = `/tp ${Math.round(x * 10)} ${Math.round(y * 10)} 15.0`;
    copyToClipboard(cmd);
    setCopiedTeleport(true);
    setTimeout(() => setCopiedTeleport(false), 2000);
  };

  const getDistanceTo = (targetLat: number, targetLng: number) => {
    const dLat = (targetLat - userGpsPosition[0]) * 69;
    const dLng = (targetLng - userGpsPosition[1]) * 54.6;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return `${dist.toFixed(2)} mi (${(dist * 1.609).toFixed(1)} km)`;
  };

  // Vector Engine Pointer & Zoom Handlers
  const handleVectorPointerDown = (e: React.PointerEvent) => {
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('button, input, select, a, [role="button"], .pointer-events-auto')) {
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    setIsDraggingVector(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: vectorPan.x,
      panY: vectorPan.y
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleVectorPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingVector) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setVectorPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
  };

  const handleVectorPointerUp = (e: React.PointerEvent) => {
    if (isDraggingVector) {
      setIsDraggingVector(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handleVectorWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const deltaFactor = e.deltaY < 0 ? 1.18 : 0.84;
    setVectorZoom((currentZoom) => {
      const newZoom = Math.min(Math.max(currentZoom * deltaFactor, 0.6), 5.0);
      if (newZoom === currentZoom) return currentZoom;

      const scaleRatio = newZoom / currentZoom;
      const offsetX = mouseX - rect.width / 2;
      const offsetY = mouseY - rect.height / 2;

      setVectorPan((currentPan) => ({
        x: offsetX * (1 - scaleRatio) + currentPan.x * scaleRatio,
        y: offsetY * (1 - scaleRatio) + currentPan.y * scaleRatio
      }));

      return newZoom;
    });
  };

  const handleVectorCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - vectorPan.x;
    const clickY = e.clientY - rect.top - vectorPan.y;
    const normX = (clickX / (rect.width * vectorZoom)) * 100;
    const normY = (clickY / (rect.height * vectorZoom)) * 100;
    const [lat, lng] = mapCoordinateToGeo(normX, normY);
    handleMapClick(lat, lng);
  };

  if (!isMounted) {
    return (
      <div className="w-full h-[650px] bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
        <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
          Initializing State of Leonida Tactical GIS...
        </p>
      </div>
    );
  }

  const activeProvider = MAP_TILE_PROVIDERS[selectedLayer];

  return (
    <div
      ref={containerRef}
      style={{
        height: isFullscreen ? '100vh' : '720px',
        minHeight: isFullscreen ? '100vh' : '650px'
      }}
      className={`relative w-full bg-zinc-950 transition-all duration-300 flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-[100] h-screen w-screen rounded-none'
          : 'rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden'
      }`}
    >
      {/* Top Map Control Bar */}
      <div className="z-20 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 p-3 sm:p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left: Territory Fly-To Quick Jump */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-[10px] font-mono font-black text-amber-400 uppercase shrink-0 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            TERRITORY:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {LEONIDA_REGIONS.map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => handleRegionSelect(reg.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                  activeRegion === reg.id
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold border-amber-400 shadow-md'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {reg.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Engine & Tile Layer Switcher & Tools */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full lg:w-auto justify-end">
          {/* Engine Mode Toggle (Satellite Leaflet vs Leonida Cartography Vector) */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setEngineMode('leaflet')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer flex items-center gap-1 ${
                engineMode === 'leaflet'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🛰️ Satellite GIS</span>
            </button>
            <button
              type="button"
              onClick={() => setEngineMode('vector')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer flex items-center gap-1 ${
                engineMode === 'vector'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🗺️ Vector Map</span>
            </button>
          </div>

          {/* If in Leaflet mode, show Layer Selector */}
          {engineMode === 'leaflet' && (
            <div className="hidden sm:flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
              {(Object.keys(MAP_TILE_PROVIDERS) as RealMapLayer[]).map((layerKey) => (
                <button
                  key={layerKey}
                  type="button"
                  onClick={() => setSelectedLayer(layerKey)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase transition cursor-pointer ${
                    selectedLayer === layerKey
                      ? 'bg-zinc-800 text-rose-400 border border-rose-500/40 shadow'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {layerKey === 'satellite'
                    ? 'Satellite'
                    : layerKey === 'dark'
                    ? 'Dark'
                    : layerKey === 'streets'
                    ? 'Street'
                    : layerKey === 'osm'
                    ? 'OSM'
                    : 'Topo'}
                </button>
              ))}
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-rose-400" /> : <Maximize2 className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="z-20 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 100+ Leonida locations..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Layer Checkboxes */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={showCounties}
              onChange={(e) => setShowCounties(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-700 text-rose-500 focus:ring-0"
            />
            <span>Counties</span>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={showPois}
              onChange={(e) => setShowPois(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-700 text-rose-500 focus:ring-0"
            />
            <span>POIs</span>
          </label>
        </div>
      </div>

      {/* Floating Tactical Ping Mode Toolbar */}
      <div className="absolute top-28 right-4 z-[1000] flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-md border border-zinc-700/80 p-1.5 rounded-2xl shadow-2xl">
          <button
            type="button"
            onClick={() => setActivePingTool('navigate')}
            className={`py-1 px-2.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
              activePingTool === 'navigate'
                ? 'bg-zinc-800 text-white border-zinc-600 shadow'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">GPS Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePingTool(activePingTool === 'danger' ? 'navigate' : 'danger')}
            className={`py-1 px-2.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
              activePingTool === 'danger'
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30 animate-pulse'
                : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border-rose-800/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>⚠️ Danger Ping</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePingTool(activePingTool === 'loot' ? 'navigate' : 'loot')}
            className={`py-1 px-2.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition cursor-pointer border ${
              activePingTool === 'loot'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 animate-pulse'
                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border-emerald-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>💎 Loot Ping</span>
          </button>
        </div>

        {statusMessage && (
          <div className="px-3 py-1.5 bg-zinc-950/95 border border-amber-500/80 rounded-xl text-[11px] font-extrabold text-amber-300 shadow-xl flex items-center gap-1.5 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Main Viewport: Either Leaflet High-Res Satellite GIS or Vector Cartography Engine */}
      {engineMode === 'leaflet' ? (
        <div className="relative flex-1 w-full h-full min-h-[520px] z-0 overflow-hidden bg-zinc-950">
          <MapContainer
            center={[26.25, -80.95]}
            zoom={8}
            minZoom={7}
            maxZoom={19}
            scrollWheelZoom={true}
            className="w-full h-full"
            style={{
              height: '100%',
              minHeight: '520px',
              width: '100%',
              backgroundColor: '#09090b'
            }}
          >
            {/* Automatic Container Resizer to ensure tiles load instantly */}
            <MapResizeWatcher />

            {/* Map Movement & Fly-To Controller */}
            <MapFlyController
              targetCenter={flyTarget?.center}
              targetZoom={flyTarget?.zoom}
            />
            <MapClickHandler onMapClick={handleMapClick} />

            {/* Real Satellite / Dark / Street / OSM / Topo Raster Tiles */}
            <TileLayer
              key={selectedLayer}
              attribution={activeProvider.attribution}
              url={activeProvider.url}
              maxZoom={activeProvider.maxZoom}
              subdomains={activeProvider.subdomains || ['a', 'b', 'c']}
            />

            {/* 7 County Territory Boundary Polygons & Labels */}
            {showCounties && (
              <>
                {/* Kelly County (Northwest / Port Gellhorn entrance) */}
                <Circle
                  center={[27.35, -81.65]}
                  radius={45000}
                  pathOptions={{
                    color: '#00b4d8',
                    fillColor: '#00b4d8',
                    fillOpacity: selectedLayer === 'satellite' ? 0.08 : 0.12,
                    weight: 2,
                    dashArray: '6, 6'
                  }}
                />

                {/* Ambrosia County (North / Mount Kalaga) */}
                <Circle
                  center={[28.45, -81.65]}
                  radius={40000}
                  pathOptions={{
                    color: '#0284c7',
                    fillColor: '#0284c7',
                    fillOpacity: selectedLayer === 'satellite' ? 0.08 : 0.12,
                    weight: 2,
                    dashArray: '6, 6'
                  }}
                />

                {/* Vice-Dale County (East / Vice City Metropolitan Area) */}
                <Circle
                  center={[25.78, -80.20]}
                  radius={35000}
                  pathOptions={{
                    color: '#f43f5e',
                    fillColor: '#f43f5e',
                    fillOpacity: selectedLayer === 'satellite' ? 0.08 : 0.12,
                    weight: 2,
                    dashArray: '6, 6'
                  }}
                />

                {/* Grass Rivers / Everglades (Central Marshlands) */}
                <Circle
                  center={[25.95, -80.80]}
                  radius={45000}
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: selectedLayer === 'satellite' ? 0.08 : 0.12,
                    weight: 2,
                    dashArray: '6, 6'
                  }}
                />

                {/* Gator Keys (Southern Key Archipelago) */}
                <Circle
                  center={[24.75, -81.15]}
                  radius={40000}
                  pathOptions={{
                    color: '#eab308',
                    fillColor: '#eab308',
                    fillOpacity: selectedLayer === 'satellite' ? 0.08 : 0.12,
                    weight: 2,
                    dashArray: '6, 6'
                  }}
                />

                {/* Major District Labels */}
                <Marker
                  position={[25.778, -80.131]}
                  icon={L.divIcon({
                    html: '<div class="px-2.5 py-1 bg-rose-600/90 text-white border border-rose-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">🌴 Vice Beach</div>',
                    className: 'district-label',
                    iconSize: [110, 30]
                  })}
                />
                <Marker
                  position={[25.774, -80.193]}
                  icon={L.divIcon({
                    html: '<div class="px-2.5 py-1 bg-cyan-600/90 text-white border border-cyan-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">🏙️ Downtown Vice</div>',
                    className: 'district-label',
                    iconSize: [130, 30]
                  })}
                />
                <Marker
                  position={[26.620, -81.860]}
                  icon={L.divIcon({
                    html: '<div class="px-2.5 py-1 bg-emerald-600/90 text-white border border-emerald-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">⚓ Port Gellhorn</div>',
                    className: 'district-label',
                    iconSize: [120, 30]
                  })}
                />
                <Marker
                  position={[28.450, -81.750]}
                  icon={L.divIcon({
                    html: '<div class="px-2.5 py-1 bg-sky-600/90 text-white border border-sky-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">🏔️ Mount Kalaga</div>',
                    className: 'district-label',
                    iconSize: [130, 30]
                  })}
                />
                <Marker
                  position={[24.750, -81.150]}
                  icon={L.divIcon({
                    html: '<div class="px-2.5 py-1 bg-amber-600/90 text-white border border-amber-300/80 rounded-lg font-black text-[11px] shadow-xl uppercase tracking-wider pointer-events-none">🏝️ Gator Keys</div>',
                    className: 'district-label',
                    iconSize: [120, 30]
                  })}
                />
              </>
            )}

            {/* User Live GPS Marker */}
            <Marker
              position={userGpsPosition}
              icon={L.divIcon({
                html: `
                  <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div class="w-8 h-8 rounded-full bg-rose-500/30 border-2 border-rose-500 animate-ping absolute"></div>
                    <div class="w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center font-bold text-[10px] text-white">
                      GPS
                    </div>
                  </div>
                `,
                className: 'user-gps-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            >
              <Popup>
                <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-2xl min-w-[200px]">
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
                    📍 YOUR GPS POSITION
                  </span>
                  <p className="text-xs font-mono font-bold text-zinc-300 mt-1">
                    Lat: {userGpsPosition[0].toFixed(5)}, Lng: {userGpsPosition[1].toFixed(5)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopyCoords(userGpsPosition[0], userGpsPosition[1])}
                    className="mt-2 w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-rose-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border border-zinc-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Teleport Command</span>
                  </button>
                </div>
              </Popup>
            </Marker>

            {/* Custom User Set Waypoint */}
            {customWaypoint && (
              <Marker
                position={[customWaypoint.lat, customWaypoint.lng]}
                icon={L.divIcon({
                  html: `
                    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div class="w-10 h-10 rounded-full border-2 border-amber-400 animate-ping absolute"></div>
                      <div class="w-7 h-7 rounded-lg bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center font-bold text-xs text-black">
                        🎯
                      </div>
                    </div>
                  `,
                  className: 'custom-waypoint-marker',
                  iconSize: [28, 28],
                  iconAnchor: [14, 14]
                })}
              >
                <Popup>
                  <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-2xl min-w-[180px]">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                      TARGET WAYPOINT
                    </span>
                    <p className="text-xs font-bold text-white mt-0.5">{customWaypoint.label}</p>
                    <p className="text-[10px] font-mono text-zinc-400 mt-1">
                      Distance: {getDistanceTo(customWaypoint.lat, customWaypoint.lng)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCustomWaypoint(null)}
                      className="mt-2 w-full py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition border border-rose-800/40"
                    >
                      Clear Waypoint
                    </button>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Render All Real POI Locations */}
            {showPois &&
              filteredLocations.map((loc) => {
                const isActive = activeLocation?.id === loc.id;
                const isDiscovered = discoveredIds.includes(loc.id);
                const icon = createCategoryMarkerIcon(loc.category, isActive, isDiscovered);

                return (
                  <Marker
                    key={loc.id}
                    position={[loc.lat, loc.lng]}
                    icon={icon}
                    eventHandlers={{
                      click: () => {
                        if (onSelectLocation) onSelectLocation(loc);
                      }
                    }}
                  >
                    <Popup className="real-poi-popup">
                      <div className="p-3 bg-zinc-900 text-white rounded-2xl shadow-2xl min-w-[240px] max-w-[280px] space-y-2">
                        {loc.imageUrl && (
                          <div className="w-full h-24 rounded-xl overflow-hidden relative">
                            <img
                              src={loc.imageUrl}
                              alt={loc.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-mono font-bold text-amber-300 uppercase">
                              {loc.district}
                            </span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-mono font-black uppercase text-rose-400">
                              {loc.category}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400">
                              {getDistanceTo(loc.lat, loc.lng)}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white leading-tight mt-0.5">
                            {loc.title}
                          </h4>
                        </div>

                        <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                          {loc.description}
                        </p>

                        {loc.rewardText && (
                          <div className="p-1.5 bg-zinc-950 rounded-lg border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{loc.rewardText}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-1">
                          {loc.teleportCommand && (
                            <button
                              type="button"
                              onClick={() => {
                                copyToClipboard(loc.teleportCommand || '');
                                setCopiedTeleport(true);
                                setTimeout(() => setCopiedTeleport(false), 2000);
                              }}
                              className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 border border-zinc-700"
                            >
                              <Copy className="w-3 h-3 text-amber-400" />
                              <span>{copiedTeleport ? 'Copied!' : 'Copy /tp'}</span>
                            </button>
                          )}

                          {onToggleDiscovered && (
                            <button
                              type="button"
                              onClick={() => onToggleDiscovered(loc.id)}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 border ${
                                isDiscovered
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                              }`}
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>{isDiscovered ? 'Discovered' : 'Mark Visited'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Render Connected Squad Members if Squad Room is active */}
            {squadRoom &&
              squadRoom.members &&
              Object.entries(squadRoom.members).map(([uid, member]) => {
                if (!member || typeof member.lat !== 'number' || typeof member.lng !== 'number') {
                  return null;
                }
                const isSelf = uid === currentUserId;

                return (
                  <Marker
                    key={`squad-${uid}`}
                    position={[member.lat, member.lng]}
                    icon={L.divIcon({
                      html: `
                        <div class="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                          <div class="w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center font-black text-xs text-white uppercase" style="background-color: ${
                            member.avatarColor || '#3b82f6'
                          };">
                            ${(member.displayName || 'M').charAt(0)}
                          </div>
                          <span class="mt-1 px-1.5 py-0.5 bg-black/90 text-white rounded text-[9px] font-bold whitespace-nowrap">
                            ${member.displayName} ${isSelf ? '(YOU)' : ''}
                          </span>
                        </div>
                      `,
                      className: 'squad-member-marker',
                      iconSize: [36, 44],
                      iconAnchor: [18, 22]
                    })}
                  />
                );
              })}
          </MapContainer>
        </div>
      ) : (
        /* Vector Cartography Engine Canvas */
        <div
          onPointerDown={handleVectorPointerDown}
          onPointerMove={handleVectorPointerMove}
          onPointerUp={handleVectorPointerUp}
          onPointerCancel={handleVectorPointerUp}
          onWheel={handleVectorWheel}
          onClick={handleVectorCanvasClick}
          className={`relative flex-1 w-full h-full min-h-[520px] overflow-hidden select-none bg-zinc-950 ${
            isDraggingVector ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Zoom and Reset Controls for Vector Mode */}
          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 bg-zinc-900/95 border border-zinc-800 p-1.5 rounded-2xl shadow-2xl">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVectorZoom((z) => Math.min(4, Number((z + 0.2).toFixed(2))));
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-zinc-400 font-bold px-1 min-w-[36px] text-center">
              {Math.round(vectorZoom * 100)}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVectorZoom((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))));
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVectorZoom(1);
                setVectorPan({ x: 0, y: 0 });
              }}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div
            className="w-full h-full relative transition-transform ease-out duration-75"
            style={{
              transform: `translate(${vectorPan.x}px, ${vectorPan.y}px) scale(${vectorZoom})`,
              transformOrigin: '50% 50%'
            }}
          >
            {/* SVG Base Map */}
            <VectorMapTerrain
              sourceType="gtavi"
              theme="leonida"
              showRoads={true}
              showDistricts={true}
              showTopography={true}
              showWaterways={true}
              showCountyBorders={showCounties}
              showBuildings={true}
              showMetro={true}
              showGrid={true}
            />

            {/* Render POIs on Vector Canvas */}
            {showPois &&
              filteredLocations.map((loc) => {
                const isActive = activeLocation?.id === loc.id;
                const isDiscovered = discoveredIds.includes(loc.id);

                return (
                  <div
                    key={`vec-${loc.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectLocation) onSelectLocation(loc);
                    }}
                    className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer group ${
                      isActive ? 'scale-125 z-30' : 'hover:scale-110'
                    }`}
                    style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border shadow-lg transition ${
                          isActive
                            ? 'bg-rose-600 border-white text-white shadow-rose-600/50'
                            : isDiscovered
                            ? 'bg-amber-500/90 border-amber-300 text-black shadow-amber-500/40'
                            : 'bg-zinc-900/90 border-zinc-700 text-rose-400 hover:border-rose-400'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div
                        className={`mt-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold whitespace-nowrap shadow-md pointer-events-none transition ${
                          isActive
                            ? 'bg-rose-600 text-white'
                            : 'bg-zinc-950/90 text-zinc-300 border border-zinc-800 group-hover:border-rose-500'
                        }`}
                      >
                        {loc.title}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Bottom Coordinates & Discovery HUD */}
      <div className="z-20 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-200 font-bold">STATE OF LEONIDA GIS</span>
            <span className="text-zinc-600">|</span>
            <span className="capitalize">Engine: {engineMode === 'leaflet' ? 'Satellite GIS' : 'Vector Cartography'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-zinc-400 font-mono">
          <span>
            GPS: <strong className="text-rose-400">{userGpsPosition[0].toFixed(4)}°N</strong>,{' '}
            <strong className="text-rose-400">{userGpsPosition[1].toFixed(4)}°W</strong>
          </span>
          <span className="text-zinc-600">•</span>
          <span>
            Locations: <strong className="text-amber-400">{filteredLocations.length}</strong> /{' '}
            {MAP_LOCATIONS_DATA.length}
          </span>
        </div>
      </div>
    </div>
  );
};
