'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  Crosshair,
  MapPin,
  Compass,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Check,
  Radio,
  Eye,
  EyeOff,
  Navigation,
  Sparkles,
  Shield,
  Flame,
  Award,
  ExternalLink,
  Volume2,
  VolumeX
} from 'lucide-react';
import { LEONIDA_COUNTIES, LEONIDA_LANDMARKS, LeonidaLandmark } from '../../data/leonidaGeography';
import { MAP_LOCATIONS_DATA, ExtendedMapLocation } from '../../data/mapLocations';
import { copyToClipboard } from '../../lib/copyUtils';
import { SquadRoom, Waypoint, SquadPing } from '../../lib/squad-radar';

export interface LeonidaIslandMapProps {
  activeLocation?: ExtendedMapLocation;
  onSelectLocation?: (loc: ExtendedMapLocation) => void;
  discoveredIds?: string[];
  onToggleDiscovered?: (id: string) => void;
  squadRoom?: SquadRoom | null;
  currentUserId?: string;
  currentUserDisplayName?: string;
  currentUserColor?: string;
  onUpdatePosition?: (coords: { lat: number; lng: number }) => void;
  onAddWaypoint?: (wp: Omit<Waypoint, 'id' | 'createdAt'>) => void;
  onAddPing?: (ping: Omit<SquadPing, 'id' | 'createdAt' | 'expiresAt'>) => void;
  onRemoveWaypoint?: (id: string) => void;
  focusedMemberCoordinates?: { lat: number; lng: number } | null;
}

// Leak coordinate points from GTA 6 mapping project (Rockridge, Little Haiti, Stockyard, Vice City)
interface LeakPin {
  id: string;
  code: string;
  label?: string;
  type: 'leak' | 'trailer' | 'screenshot' | 'spec_event';
  x: number; // 0..1000 coordinate
  y: number;
  color: 'yellow' | 'green' | 'blue' | 'red';
  hasT?: boolean; // T badge
  description: string;
}

const LEAK_COORDINATE_PINS: LeakPin[] = [
  // Rockridge & Little Haiti & Stockyard cluster (matching user screenshot 2)
  { id: 'lk-sn18', code: 'sn18', label: 'sn18', type: 'leak', x: 742, y: 535, color: 'yellow', hasT: true, description: 'Leak Event sn18: Rockridge diner & pawn alleyway coordinate' },
  { id: 'lk-sn08', code: 'sn08', label: 'sn08', type: 'leak', x: 770, y: 508, color: 'yellow', hasT: true, description: 'Leak Event sn08: Stockyard freight switching rail yard coordinate' },
  { id: 'lk-sn42', code: 'sn42', label: 'sn42', type: 'leak', x: 738, y: 572, color: 'yellow', hasT: true, description: 'Leak Event sn42: Little Haiti strip mall & Vice River bridge coordinate' },
  { id: 'lk-ss15', code: 'ss15', label: 'ss15', type: 'leak', x: 755, y: 595, color: 'blue', hasT: false, description: 'Spec Position ss15: i404 expressway underpass' },
  { id: 'lk-nm19', code: 'nm19', label: 'nm19', type: 'leak', x: 785, y: 538, color: 'yellow', hasT: true, description: 'Leak Event nm19: Stockyard industrial warehouse entrance' },
  { id: 'lk-nm16', code: 'nm16', label: 'nm16', type: 'leak', x: 798, y: 530, color: 'green', hasT: true, description: 'Trailer Position nm16: Street racing sequence' },
  { id: 'lk-b157', code: 'b157', label: 'b157', type: 'spec_event', x: 728, y: 530, color: 'green', hasT: true, description: 'Building b157: Rockridge garage & workshop' },
  { id: 'lk-b196', code: 'b196', label: 'b196', type: 'spec_event', x: 735, y: 546, color: 'yellow', hasT: false, description: 'Building b196: Commercial retail center' },
  { id: 'lk-b214', code: 'b214', label: 'b214', type: 'spec_event', x: 722, y: 605, color: 'red', hasT: false, description: 'Spec Building b214: Logistics freight depot' },
  { id: 'lk-b302', code: 'b302', label: 'b302', type: 'spec_event', x: 775, y: 610, color: 'yellow', hasT: false, description: 'Building b302: South connector terminal' },
  { id: 'lk-b304', code: 'b304', label: 'b304', type: 'spec_event', x: 792, y: 600, color: 'yellow', hasT: false, description: 'Building b304: Catalán Blvd commercial lot' },
  { id: 'lk-b191', code: 'b191', label: 'b191', type: 'spec_event', x: 800, y: 620, color: 'yellow', hasT: false, description: 'Building b191: Route 3 intersection store' },

  // Port Gellhorn cluster
  { id: 'lk-pg01', code: 'pg01', label: 'pg01', type: 'leak', x: 425, y: 345, color: 'yellow', hasT: true, description: 'Leak Event pg01: Port Gellhorn diner robbery scene' },
  { id: 'lk-pg02', code: 'pg02', label: 'pg02', type: 'leak', x: 440, y: 380, color: 'green', hasT: true, description: 'Trailer Position pg02: Gellhorn motel exterior & speedway' },
  { id: 'lk-pg03', code: 'pg03', label: 'pg03', type: 'spec_event', x: 410, y: 430, color: 'blue', hasT: false, description: 'Spec Position pg03: Port Gellhorn cargo shipping berths' },

  // Ocean Drive & Vice Beach cluster
  { id: 'lk-vb01', code: 'vb01', label: 'vb01', type: 'trailer', x: 875, y: 560, color: 'green', hasT: true, description: 'Trailer Position vb01: Ocean Drive neon strip & convertible joyride' },
  { id: 'lk-vb02', code: 'vb02', label: 'vb02', type: 'trailer', x: 885, y: 640, color: 'green', hasT: true, description: 'Trailer Position vb02: South Beach crowded sunbathers' },

  // Airport & Prison
  { id: 'lk-ap01', code: 'ap01', label: 'ap01', type: 'trailer', x: 670, y: 665, color: 'green', hasT: true, description: 'Trailer Position ap01: Escobar Airport commercial jet flyover' },
  { id: 'lk-pr01', code: 'pr01', label: 'pr01', type: 'trailer', x: 560, y: 520, color: 'green', hasT: true, description: 'Trailer Position pr01: Leonida State Prison yard & intake counseling' },

  // Mount Kalaga & Ambrosia
  { id: 'lk-mk01', code: 'mk01', label: 'mk01', type: 'trailer', x: 710, y: 105, color: 'green', hasT: true, description: 'Trailer Position mk01: Mount Kalaga ridge & hovercraft over water' },
  { id: 'lk-am01', code: 'am01', label: 'am01', type: 'leak', x: 655, y: 445, color: 'yellow', hasT: true, description: 'Leak Event am01: Ambrosia sugar mill & warehouse interior' }
];

// Presets for quick camera fly-to
interface RegionPreset {
  id: string;
  name: string;
  icon: string;
  zoom: number;
  center: { x: number; y: number }; // 0..1000 coordinate
}

const REGION_PRESETS: RegionPreset[] = [
  { id: 'all', name: 'Whole Leonida', icon: '🗺️', zoom: 1.0, center: { x: 500, y: 500 } },
  { id: 'rockridge', name: 'Rockridge & Little Haiti', icon: '🔍', zoom: 6.5, center: { x: 755, y: 560 } },
  { id: 'vice-city', name: 'Vice City Metro', icon: '🏙️', zoom: 3.2, center: { x: 790, y: 620 } },
  { id: 'ocean-drive', name: 'Ocean Drive & Beaches', icon: '🏖️', zoom: 4.8, center: { x: 880, y: 600 } },
  { id: 'port-gellhorn', name: 'Port Gellhorn', icon: '⚓', zoom: 3.8, center: { x: 430, y: 390 } },
  { id: 'mount-kalaga', name: 'Mount Kalaga', icon: '🏔️', zoom: 3.5, center: { x: 710, y: 120 } },
  { id: 'airport', name: 'Escobar Airport', icon: '✈️', zoom: 4.5, center: { x: 670, y: 680 } },
  { id: 'gator-keys', name: 'Leonida Keys', icon: '🏝️', zoom: 3.0, center: { x: 640, y: 920 } }
];

export const LeonidaIslandMap: React.FC<LeonidaIslandMapProps> = ({
  activeLocation,
  onSelectLocation,
  discoveredIds = [],
  onToggleDiscovered,
  squadRoom,
  currentUserId,
  currentUserDisplayName = 'Player',
  currentUserColor = '#3B82F6',
  onUpdatePosition,
  onAddWaypoint,
  onAddPing,
  onRemoveWaypoint,
  focusedMemberCoordinates
}) => {
  // Map viewport transformation state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showZoomSlider, setShowZoomSlider] = useState<boolean>(false);

  // Toggle native browser fullscreen with CSS fallback
  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      if (mapContainerRef.current) {
        try {
          if (mapContainerRef.current.requestFullscreen) {
            await mapContainerRef.current.requestFullscreen();
          } else if ((mapContainerRef.current as any).webkitRequestFullscreen) {
            await (mapContainerRef.current as any).webkitRequestFullscreen();
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

  // Sync native fullscreenchange events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isNativeFS);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Layer Visibility
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showHighways, setShowHighways] = useState<boolean>(true);
  const [showBuildings, setShowBuildings] = useState<boolean>(true);
  const [showSpecBuildings, setShowSpecBuildings] = useState<boolean>(true);
  const [showLeakPins, setShowLeakPins] = useState<boolean>(true);
  const [showPOIs, setShowPOIs] = useState<boolean>(true);
  const [showCountyBorders, setShowCountyBorders] = useState<boolean>(true);
  const [showCountyNames, setShowCountyNames] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTopography, setShowTopography] = useState<boolean>(true);
  const [showWaterways, setShowWaterways] = useState<boolean>(true);
  const [showMetro, setShowMetro] = useState<boolean>(true);

  // UI Panels
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [legendTab, setLegendTab] = useState<'key' | 'layers' | 'grid'>('key');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPin, setSelectedPin] = useState<{
    type: 'poi' | 'landmark' | 'leak';
    data: any;
  } | null>(null);

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Interaction refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const touchDistanceRef = useRef<number | null>(null);

  // Audio Chime Feedback
  const playAudioFeedback = useCallback((frequency: number = 587.33, duration: number = 0.12) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  }, [soundEnabled]);

  // Helper to recalculate and clamp pan offsets so the map never crops or disappears off-screen
  const clampPan = useCallback((panPos: { x: number; y: number }, zoomLevel: number) => {
    if (!mapContainerRef.current) return panPos;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const containerW = rect.width || 800;
    const containerH = rect.height || 600;

    // When zoom is at overview (<= 1.05x), automatically lock/recenter pan to zero
    if (zoomLevel <= 1.05) {
      const maxOffset = Math.max(0, (zoomLevel - 1.0) * 200);
      return {
        x: Math.min(Math.max(panPos.x, -maxOffset), maxOffset),
        y: Math.min(Math.max(panPos.y, -maxOffset), maxOffset)
      };
    }

    // At higher zooms, allow free panning bounded within container limits
    const maxPanX = (containerW / 2) * (zoomLevel - 0.4);
    const maxPanY = (containerH / 2) * (zoomLevel - 0.4);

    return {
      x: Math.min(Math.max(panPos.x, -maxPanX), maxPanX),
      y: Math.min(Math.max(panPos.y, -maxPanY), maxPanY)
    };
  }, []);

  // Handle Zoom change with limits, auto-centering & bounded scaling
  const handleZoom = useCallback((targetZoom: number) => {
    const clampedZoom = Math.min(Math.max(targetZoom, 0.8), 16.0);
    setZoom((currentZoom) => {
      if (clampedZoom === currentZoom) return currentZoom;
      const scaleRatio = clampedZoom / currentZoom;
      setPan((currentPan) => {
        const rawPan = {
          x: currentPan.x * scaleRatio,
          y: currentPan.y * scaleRatio
        };
        return clampPan(rawPan, clampedZoom);
      });
      return clampedZoom;
    });
    playAudioFeedback(440 + clampedZoom * 25, 0.05);
  }, [clampPan, playAudioFeedback]);

  // Center on a coordinate (0..1000 coordinate space)
  const flyTo = useCallback((targetX: number, targetY: number, targetZoom: number = 3.5) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;

    const clampedZoom = Math.min(Math.max(targetZoom, 0.8), 16.0);
    const svgScaleInContainer = Math.min(containerW, containerH) / 1000;
    
    // Pan offset to center targetX, targetY (0..1000 space, center is 500,500)
    const newPanX = (500 - targetX) * svgScaleInContainer * clampedZoom;
    const newPanY = (500 - targetY) * svgScaleInContainer * clampedZoom;

    setZoom(clampedZoom);
    setPan(clampPan({ x: newPanX, y: newPanY }, clampedZoom));
    playAudioFeedback(659.25, 0.15);
  }, [clampPan, playAudioFeedback]);

  // Reset View / Auto-Fit to Recalculate 1x Viewport Scale & Center Coordinates
  const resetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setStatusNotification('Map Viewport Recalculated & Auto-Centered');
    setTimeout(() => setStatusNotification(null), 2500);
    playAudioFeedback(523.25, 0.1);
  }, [playAudioFeedback]);

  // Quick Preset Selection
  const applyPreset = useCallback((preset: RegionPreset) => {
    if (preset.id === 'all') {
      resetView();
    } else {
      flyTo(preset.center.x, preset.center.y, preset.zoom);
    }
  }, [flyTo, resetView]);

  // Global Keyboard Navigation Shortcuts (+ / -, Arrow keys, R, F, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoom(zoom * 1.3);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoom(zoom * 0.77);
      } else if (e.key.toLowerCase() === 'r') {
        resetView();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPan((prev) => ({ ...prev, y: prev.y + 50 }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPan((prev) => ({ ...prev, y: prev.y - 50 }));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPan((prev) => ({ ...prev, x: prev.x + 50 }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPan((prev) => ({ ...prev, x: prev.x - 50 }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, zoom, handleZoom, resetView, toggleFullscreen]);

  // Pointer Drag Handlers (Supports Mouse & Touch with Pointer Capture)
  const handlePointerDown = (e: React.PointerEvent) => {
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('button, input, select, a, [role="button"], .pointer-events-auto')) {
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 3) {
      hasMovedRef.current = true;
    }
    const rawPan = {
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    };
    setPan(clampPan(rawPan, zoom));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Focal-Point Wheel Zoom (zooms directly toward mouse cursor)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.18 : 0.84;

    setZoom((currentZoom) => {
      const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.8), 16.0);
      if (newZoom === currentZoom) return currentZoom;

      const scaleRatio = newZoom / currentZoom;
      const offsetX = mouseX - rect.width / 2;
      const offsetY = mouseY - rect.height / 2;

      setPan((currentPan) => {
        const rawPan = {
          x: offsetX * (1 - scaleRatio) + currentPan.x * scaleRatio,
          y: offsetY * (1 - scaleRatio) + currentPan.y * scaleRatio
        };
        return clampPan(rawPan, newZoom);
      });

      return newZoom;
    });

    playAudioFeedback(480, 0.04);
  };

  // Touch handlers for mobile / tablet pinch-to-zoom with focal midpoint
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      hasMovedRef.current = false;
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y
      };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 3) {
        hasMovedRef.current = true;
      }
      const rawPan = {
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy
      };
      setPan(clampPan(rawPan, zoom));
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null && mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      if (dist > 0 && touchDistanceRef.current > 0) {
        const factor = dist / touchDistanceRef.current;
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

        setZoom((currentZoom) => {
          const newZoom = Math.min(Math.max(currentZoom * factor, 0.8), 16.0);
          const scaleRatio = newZoom / currentZoom;
          const offsetX = midX - rect.width / 2;
          const offsetY = midY - rect.height / 2;

          setPan((currentPan) => {
            const rawPan = {
              x: offsetX * (1 - scaleRatio) + currentPan.x * scaleRatio,
              y: offsetY * (1 - scaleRatio) + currentPan.y * scaleRatio
            };
            return clampPan(rawPan, newZoom);
          });

          return newZoom;
        });
      }
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Map Double-Click to Zoom In focused on click coordinates
  const handleMapDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 1000;
    const clickY = ((e.clientY - rect.top) / rect.height) * 1000;
    flyTo(clickX, clickY, Math.min(zoom * 1.5, 16.0));
  };

  // Map Click (place GPS waypoint or squad ping if shift/alt or normal click)
  const handleMapBackgroundClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (hasMovedRef.current) return; // ignore clicks during pan drag

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 1000;
    const clickY = ((e.clientY - rect.top) / rect.height) * 1000;

    // Convert SVG 0..1000 space to approximate coordinates
    const lat = 26.5 - (clickY / 1000) * 1.5;
    const lng = -81.5 + (clickX / 1000) * 2.0;

    if (e.shiftKey && onAddPing && currentUserId) {
      // Shift-click places Danger squad ping
      onAddPing({
        type: 'danger',
        label: 'Tactical Alert',
        placedBy: currentUserId,
        placedByColor: currentUserColor || '#EF4444',
        timestamp: Date.now(),
        lat,
        lng
      });
      playAudioFeedback(880, 0.2);
      setStatusNotification('🚨 Tactical Danger Ping broadcasted to Squad!');
      setTimeout(() => setStatusNotification(null), 3000);
    } else if (onAddWaypoint && currentUserId) {
      // Normal click places Waypoint
      onAddWaypoint({
        label: 'Custom GPS Marker',
        type: 'heist',
        placedBy: currentUserId,
        lat,
        lng
      });
      playAudioFeedback(587.33, 0.1);
      setStatusNotification(`📍 GPS Waypoint placed at [${lat.toFixed(3)}, ${lng.toFixed(3)}]`);
      setTimeout(() => setStatusNotification(null), 3000);
    }
  };

  // Filtered POIs
  const filteredLocations = useMemo(() => {
    return MAP_LOCATIONS_DATA.filter((loc) => {
      if (selectedCategory !== 'All' && loc.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = loc.title.toLowerCase().includes(q);
        const matchDistrict = (loc.district || '').toLowerCase().includes(q);
        const matchCat = loc.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDistrict && !matchCat) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    MAP_LOCATIONS_DATA.forEach((loc) => set.add(loc.category));
    return ['All', ...Array.from(set)];
  }, []);

  const isInitialMountRef = useRef<boolean>(true);

  // Sync with activeLocation prop if changed externally
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      if (activeLocation) {
        setSelectedPin({ type: 'poi', data: activeLocation });
      }
      return;
    }
    if (activeLocation && activeLocation.x !== undefined && activeLocation.y !== undefined) {
      const targetX = activeLocation.x * 10;
      const targetY = activeLocation.y * 10;
      setSelectedPin({ type: 'poi', data: activeLocation });
      flyTo(targetX, targetY, 4.0);
    }
  }, [activeLocation, flyTo]);

  // Sync with focusedMemberCoordinates if squad member selected
  useEffect(() => {
    if (focusedMemberCoordinates && focusedMemberCoordinates.lat && focusedMemberCoordinates.lng) {
      const targetY = ((26.5 - focusedMemberCoordinates.lat) / 1.5) * 1000;
      const targetX = ((focusedMemberCoordinates.lng - (-81.5)) / 2.0) * 1000;
      flyTo(targetX, targetY, 4.5);
    }
  }, [focusedMemberCoordinates, flyTo]);

  return (
    <div
      ref={mapContainerRef}
      id="leonida-island-map-container"
      className={`relative w-full ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen bg-[#3b6f8c]' : 'h-[680px] sm:h-[760px] md:h-[820px] rounded-3xl'
      } overflow-hidden border border-zinc-800/80 shadow-2xl bg-[#4a7e96] select-none transition-all duration-300 font-sans`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
    >
      {/* =========================================================================
          TOP CONTROL BAR & REGION SELECTOR
          ========================================================================= */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Branding & Legend Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-700/80 text-white rounded-xl shadow-lg backdrop-blur-md transition cursor-pointer text-xs font-bold"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="font-mono uppercase tracking-wider">
              {showLegend ? 'Hide Key' : 'Map Key'}
            </span>
          </button>

          {/* Quick Region Presets & Auto-Fit Viewport */}
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-950/85 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow-md">
            {REGION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1"
                title={`Fly to ${preset.name}`}
              >
                <span>{preset.icon}</span>
                <span className="hidden md:inline">{preset.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={resetView}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition cursor-pointer flex items-center gap-1 ml-1"
              title="Recalculate Viewport Scale & Recenter Map (R key)"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Auto-Fit</span>
            </button>
          </div>
        </div>

        {/* Center: Search POIs & Locations */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Rockridge, Little Haiti, POIs..."
            className="w-full pl-9 pr-8 py-2 bg-zinc-950/90 text-white text-xs rounded-xl border border-zinc-700/80 focus:border-amber-400 focus:outline-none placeholder-zinc-500 shadow-lg backdrop-blur-md font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Sound & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white rounded-xl shadow-lg backdrop-blur-md transition cursor-pointer"
            title={soundEnabled ? 'Mute map audio' : 'Enable map audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 border text-zinc-300 hover:text-white rounded-xl shadow-lg backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 ${
              isFullscreen
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-zinc-950/90 hover:bg-zinc-900 border-zinc-700/80'
            }`}
            title={isFullscreen ? 'Exit Fullscreen (Esc or F)' : 'Fullscreen Map (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
            <span className="hidden lg:inline text-[11px] font-bold">{isFullscreen ? 'Exit FS' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CATEGORY FILTER CHIPS BAR
          ========================================================================= */}
      <div className="absolute top-16 left-3 right-3 z-20 flex items-center gap-1.5 overflow-x-auto pb-1 pointer-events-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition shadow-md border ${
              selectedCategory === cat
                ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-amber-500/20'
                : 'bg-zinc-950/80 text-zinc-300 hover:text-white hover:bg-zinc-900 border-zinc-800/80 backdrop-blur-md'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* =========================================================================
          AUTHENTIC GTA 6 SPECULATION MAP KEY (LEFT SIDEBAR OVERLAY)
          ========================================================================= */}
      {showLegend && (
        <div className="absolute left-3 top-28 z-30 w-64 max-h-[calc(100%-130px)] bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs pointer-events-auto animate-fade-in">
          {/* Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span className="font-mono font-black text-white text-[11px] uppercase tracking-wider">
                Leonida Speculation Key
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowLegend(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subtabs: Key / Layers / Grid */}
          <div className="grid grid-cols-3 gap-1 p-2 bg-zinc-900/60 border-b border-zinc-800">
            <button
              type="button"
              onClick={() => setLegendTab('key')}
              className={`py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                legendTab === 'key' ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Key
            </button>
            <button
              type="button"
              onClick={() => setLegendTab('layers')}
              className={`py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                legendTab === 'layers' ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Layers
            </button>
            <button
              type="button"
              onClick={() => setLegendTab('grid')}
              className={`py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                legendTab === 'grid' ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Grid Code
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3 space-y-3 overflow-y-auto max-h-[420px] scrollbar-thin scrollbar-thumb-zinc-700">
            {legendTab === 'key' && (
              <div className="space-y-2.5">
                {/* 2-Column Key / Speculation exactly from GTA 6 mapping project image */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="space-y-1.5 border-r border-zinc-800 pr-2">
                    <div className="font-mono font-bold text-zinc-400 text-[10px] uppercase pb-1 border-b border-zinc-800/80">
                      Feature
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-1.5 bg-[#475569] rounded-sm" />
                      <span className="text-zinc-200">Road</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-1 bg-[#334155] rounded-sm" />
                      <span className="text-zinc-200">Alley</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-2 bg-[#f05a28] rounded-sm" />
                      <span className="text-orange-400 font-bold">Highway</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-1.5 bg-[#ffd600] rounded-sm" />
                      <span className="text-yellow-400 font-bold">Metro Mule</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-1.5 border-b border-dashed border-white" />
                      <span className="text-zinc-300">Railway</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-[#a8c3a8] border border-zinc-600 rounded-sm" />
                      <span className="text-zinc-200">Urban Land</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-[#69a769] rounded-sm" />
                      <span className="text-zinc-200">Rural Land</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-[#5a8ea5] rounded-sm" />
                      <span className="text-cyan-300">Water Body</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-[#e2d7a7] rounded-sm" />
                      <span className="text-amber-200">Beach Sand</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-1">
                    <div className="font-mono font-bold text-zinc-400 text-[10px] uppercase pb-1 border-b border-zinc-800/80">
                      Speculation
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-1.5 bg-[#f05a28] rounded-sm" />
                      <span className="text-rose-400">Spec Road</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-2 bg-[#e63946] rounded-sm" />
                      <span className="text-rose-400 font-bold">Spec Interstate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-[#ef4444] rounded-sm" />
                      <span className="text-rose-300 font-bold">Spec Building</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-[#cbd5e1] border border-zinc-500 rounded-sm" />
                      <span className="text-zinc-300">Building</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black flex items-center justify-center text-[7px] font-black text-black">
                        T
                      </div>
                      <span className="text-yellow-300">Leak Coord</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 border border-black flex items-center justify-center text-[7px] font-black text-black">
                        T
                      </div>
                      <span className="text-emerald-300">Trailer Pos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400 border border-black flex items-center justify-center text-[7px] font-black text-black">
                        T
                      </div>
                      <span className="text-blue-300">Screenshot Pos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-1 border-b-2 border-dashed border-cyan-400" />
                      <span className="text-cyan-400 font-mono">County Border</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-zinc-900/80 rounded-xl border border-zinc-800 text-[10px] text-zinc-400 space-y-1">
                  <p className="font-bold text-amber-300">💡 Zoom for Deep Urban Micro-Grid</p>
                  <p>Zoom past 3x to inspect individual street names, spaghetti highway flyovers, and building numbers.</p>
                </div>
              </div>
            )}

            {legendTab === 'layers' && (
              <div className="space-y-2">
                <label className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-900 cursor-pointer">
                  <span className="text-zinc-200">Highways & Interstates</span>
                  <input
                    type="checkbox"
                    checked={showHighways}
                    onChange={(e) => setShowHighways(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                </label>
                <label className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-900 cursor-pointer">
                  <span className="text-zinc-200">Local Streets & Alleys</span>
                  <input
                    type="checkbox"
                    checked={showRoads}
                    onChange={(e) => setShowRoads(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                </label>
                <label className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-900 cursor-pointer">
                  <span className="text-zinc-200">Building Footprints</span>
                  <input
                    type="checkbox"
                    checked={showBuildings}
                    onChange={(e) => setShowBuildings(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                </label>
                <label className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-900 cursor-pointer">
                  <span className="text-zinc-200">Spec Red Buildings</span>
                  <input
                    type="checkbox"
                    checked={showSpecBuildings}
                    onChange={(e) => setShowSpecBuildings(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                </label>
                <label className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-900 cursor-pointer">
                  <span className="text-zinc-200">Leak Coordinate Pins (T)</span>
                  <input
                    type="checkbox"
                    checked={showLeakPins}
                    onChange={(e) => setShowLeakPins(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                </label>
                <label className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-900 cursor-pointer">
                  <span className="text-zinc-200">Icons & POIs</span>
                  <input
                    type="checkbox"
                    checked={showPOIs}
                    onChange={(e) => setShowPOIs(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                </label>
                <label className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-900 cursor-pointer">
                  <span className="text-zinc-200">County Borders & Labels</span>
                  <input
                    type="checkbox"
                    checked={showCountyBorders}
                    onChange={(e) => setShowCountyBorders(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                </label>
                <label className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-900 cursor-pointer">
                  <span className="text-zinc-200">Mount Kalaga Topography</span>
                  <input
                    type="checkbox"
                    checked={showTopography}
                    onChange={(e) => setShowTopography(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                </label>
                <label className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-900 cursor-pointer">
                  <span className="text-zinc-200">Rockstar Grid (n08, s01...)</span>
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                </label>
              </div>
            )}

            {legendTab === 'grid' && (
              <div className="space-y-2 text-[11px] text-zinc-300">
                <p className="font-bold text-white font-mono uppercase text-[10px]">
                  Rockstar Internal Grid Notation
                </p>
                <p className="text-zinc-400 text-[10px] leading-relaxed">
                  The letters & numbers in yellow/white are R* internal grid coordinates:
                </p>
                <ul className="space-y-1 font-mono text-[10px] text-zinc-400 list-disc list-inside">
                  <li><span className="text-yellow-300">s01</span> = South of 0 latitude</li>
                  <li><span className="text-yellow-300">e01</span> = East of 0 meridian</li>
                  <li><span className="text-cyan-300">sb37</span> = South Beach grid square 37</li>
                  <li><span className="text-emerald-300">nm19</span> = North Miami / Stockyard square 19</li>
                  <li><span className="text-purple-300">tw / ss</span> = Town / Southside interior sector</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ZOOM & VIEWPORT CONTROLS (BOTTOM RIGHT)
          ========================================================================= */}
      <div className="absolute right-4 bottom-4 z-30 flex items-end gap-2 pointer-events-auto">
        {/* Interactive Vertical Slider Popover */}
        {showZoomSlider && (
          <div className="bg-zinc-950/95 border border-zinc-800 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col items-center gap-2 animate-fade-in text-xs">
            <span className="font-mono text-[10px] font-bold text-amber-400">{zoom.toFixed(1)}x</span>
            <input
              type="range"
              min="0.8"
              max="16.0"
              step="0.1"
              value={zoom}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              className="w-24 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 -rotate-90 my-10"
              title="Drag zoom slider"
            />
            <div className="flex flex-col gap-1 w-full">
              {[1.0, 4.0, 8.0, 16.0].map((zVal) => (
                <button
                  key={zVal}
                  type="button"
                  onClick={() => handleZoom(zVal)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                    Math.abs(zoom - zVal) < 0.2
                      ? 'bg-amber-400 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {zVal}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons Stack */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowZoomSlider(!showZoomSlider)}
            className={`p-2.5 rounded-2xl shadow-xl backdrop-blur-md transition cursor-pointer border text-xs font-mono font-bold ${
              showZoomSlider
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-zinc-950/90 hover:bg-zinc-900 border-zinc-700/80 text-zinc-300'
            }`}
            title="Toggle Precision Zoom Slider"
          >
            {zoom.toFixed(1)}x
          </button>
          <button
            type="button"
            onClick={() => handleZoom(zoom * 1.35)}
            className="p-3 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-700/80 text-white rounded-2xl shadow-xl backdrop-blur-md transition cursor-pointer hover:scale-105 active:scale-95"
            title="Zoom In (+ / Double Click)"
          >
            <ZoomIn className="w-5 h-5 text-amber-400" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(zoom * 0.74)}
            className="p-3 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-700/80 text-white rounded-2xl shadow-xl backdrop-blur-md transition cursor-pointer hover:scale-105 active:scale-95"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-5 h-5 text-amber-400" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className={`p-3 border rounded-2xl shadow-xl backdrop-blur-md transition cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center ${
              zoom !== 1.0 || pan.x !== 0 || pan.y !== 0
                ? 'bg-cyan-950/90 hover:bg-cyan-900 border-cyan-400/80 text-cyan-300 ring-2 ring-cyan-500/30'
                : 'bg-zinc-950/90 hover:bg-zinc-900 border-zinc-700/80 text-white'
            }`}
            title="Recalculate Viewport Scale & Recenter Map (R key / Auto-Fit)"
          >
            <RotateCcw className="w-5 h-5 text-cyan-400" />
            <span className="sr-only">Auto-Fit & Recenter Map</span>
          </button>
        </div>
      </div>

      {/* Floating Exit Fullscreen Button in Fullscreen Mode */}
      {isFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-50 px-4 py-2 bg-zinc-950/95 border border-amber-400/80 rounded-2xl text-xs font-bold text-amber-300 shadow-2xl backdrop-blur-md flex items-center gap-2 hover:bg-amber-500/20 transition cursor-pointer animate-pulse"
        >
          <Minimize2 className="w-4 h-4 text-amber-400" />
          <span>Exit Fullscreen (Esc)</span>
        </button>
      )}

      {/* Zoom Level Readout & Controls Legend (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-full text-[11px] font-mono font-bold text-zinc-300 shadow-md flex items-center gap-2 pointer-events-none">
        <span className="text-amber-400">{zoom.toFixed(1)}x ZOOM</span>
        <span className="text-zinc-600">•</span>
        <span className="text-zinc-400 hidden sm:inline">STATE OF LEONIDA GIS</span>
        <span className="text-zinc-600 hidden sm:inline">•</span>
        <span className="text-cyan-400 text-[10px]">Shortcuts: [+ / -] Zoom, [Arrows] Pan, [F] Fullscreen</span>
      </div>

      {/* Toast Notification */}
      {statusNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-zinc-950 border border-amber-500/80 rounded-2xl text-xs font-bold text-amber-300 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* =========================================================================
          PRIMARY HIGH-FIDELITY VECTOR CARTOGRAPHY CANVAS (ISLAND SVG)
          ========================================================================= */}
      <div className="w-full h-full flex items-center justify-center pointer-events-auto select-none">
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-full select-none overflow-visible"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '50% 50%',
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          preserveAspectRatio="xMidYMid meet"
          onClick={handleMapBackgroundClick}
          onDoubleClick={handleMapDoubleClick}
        >
          <defs>
            {/* Ocean Background Gradient */}
            <radialGradient id="leonida-ocean-grad" cx="55%" cy="48%" r="65%">
              <stop offset="0%" stopColor="#4f859f" />
              <stop offset="50%" stopColor="#447993" />
              <stop offset="100%" stopColor="#37677e" />
            </radialGradient>

            {/* Lake Leonida Freshwater Glow */}
            <radialGradient id="lake-leonida-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6aa0b7" />
              <stop offset="70%" stopColor="#4c8096" />
              <stop offset="100%" stopColor="#3f6f84" />
            </radialGradient>

            {/* Urban Block Hatch Pattern */}
            <pattern id="urban-block-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 6 6 M 6 0 L 0 6" fill="none" stroke="#718871" strokeWidth="0.4" opacity="0.3" />
            </pattern>

            {/* Tree Symbol for Forests */}
            <g id="pine-symbol">
              <polygon points="0,-3 2,0 0.8,0 2,2.5 -2,2.5 -0.8,0 -2,0" fill="#2d6333" />
              <rect x="-0.4" y="2.5" width="0.8" height="1" fill="#3d2b1f" />
            </g>
          </defs>

          {/* =====================================================================
              1. OCEAN CANVAS & BATHYMETRIC CONTOURS
              ===================================================================== */}
          <rect x="-3000" y="-3000" width="7000" height="7000" fill="url(#leonida-ocean-grad)" />

          {/* Bathymetric depth curves */}
          <g opacity="0.2" fill="none" stroke="#8ec3db" strokeWidth="0.8" strokeDasharray="6,6">
            <path d="M 180 0 C 240 180, 200 400, 300 600 C 350 720, 340 850, 420 1000" />
            <path d="M 860 0 C 930 200, 960 450, 940 700 C 910 850, 860 950, 800 1000" />
            <path d="M 0 340 C 140 310, 250 390, 310 540" />
            <path d="M 0 760 C 170 740, 370 810, 510 910" />
          </g>

          {/* =====================================================================
              2. COASTAL SANDY BEACHES & REEF SHELVES
              ===================================================================== */}
          <g id="coastal-shallows-and-sandbars">
            {/* Outer golden coastline contour */}
            <path
              d="M 385 45
                 L 625 45
                 C 700 45, 770 50, 840 75
                 C 885 115, 915 175, 935 255
                 C 950 335, 945 435, 940 535
                 C 935 635, 905 745, 865 815
                 C 825 875, 765 925, 695 945
                 C 635 965, 575 935, 535 885
                 C 505 845, 475 755, 475 665
                 C 475 575, 425 485, 415 405
                 C 405 325, 375 245, 375 165
                 C 375 105, 385 65, 385 45 Z"
              fill="#e2d7a7"
              stroke="#cfc18d"
              strokeWidth="2.5"
            />
          </g>

          {/* =====================================================================
              3. MAINLAND LEONIDA - SAGE GREEN RURAL CONTINENT
              ===================================================================== */}
          <g id="mainland-rural-landmass">
            {/* Massive Leonida Landmass polygon */}
            <path
              d="M 390 50
                 L 620 50
                 C 690 50, 760 55, 830 80
                 C 870 120, 900 180, 920 260
                 C 935 340, 930 440, 925 540
                 C 920 640, 890 750, 850 820
                 C 810 880, 750 930, 680 950
                 C 620 970, 560 940, 520 890
                 C 490 850, 460 760, 460 670
                 C 460 580, 410 490, 400 410
                 C 390 330, 360 250, 360 170
                 C 360 110, 380 70, 390 50 Z"
              fill="#69a769"
              stroke="#4a7c4a"
              strokeWidth="1.2"
            />

            {/* Kelly County northwest rural landmass */}
            <path
              d="M 390 50
                 C 360 80, 340 140, 340 200
                 C 340 260, 380 320, 395 380
                 C 410 440, 440 500, 450 560
                 L 420 560
                 C 400 490, 370 430, 350 360
                 C 330 280, 310 200, 320 120
                 C 330 70, 360 50, 390 50 Z"
              fill="#629e62"
            />

            {/* Mariana County / Watson Bay southwest peninsula */}
            <path
              d="M 450 560
                 C 460 630, 470 700, 490 770
                 C 510 840, 540 900, 570 950
                 L 530 960
                 C 490 900, 460 830, 440 750
                 C 420 680, 420 610, 420 560 Z"
              fill="#5d985d"
            />
          </g>

          {/* =====================================================================
              4. URBAN ZONES (MUNICIPAL / URBAN SAGE-GREY DISTRIC AREAS)
              ===================================================================== */}
          <g id="urban-district-zones">
            {/* Greater Vice City Metro (Vice-Dale County) */}
            <path
              id="zone-vice-city"
              d="M 720 480
                 C 770 460, 830 470, 880 510
                 C 910 550, 920 620, 910 700
                 C 890 780, 840 840, 770 850
                 C 720 850, 680 810, 660 740
                 C 650 670, 680 580, 700 520 Z"
              fill="#abc1ab"
              stroke="#627762"
              strokeWidth="0.8"
            />

            {/* Rockridge, Little Haiti & Stockyard Urban Pocket (Micro Zoom Zone) */}
            <path
              id="zone-rockridge-haiti"
              d="M 700 510
                 C 730 495, 780 495, 810 520
                 C 820 550, 805 610, 775 625
                 C 745 635, 715 620, 705 580
                 C 695 550, 690 525, 700 510 Z"
              fill="#a2bca2"
              stroke="#586e58"
              strokeWidth="0.6"
            />

            {/* Port Gellhorn Urban Zone */}
            <path
              id="zone-port-gellhorn"
              d="M 400 320
                 C 440 310, 470 330, 480 370
                 C 490 420, 470 480, 450 530
                 C 420 550, 390 530, 380 480
                 C 370 420, 380 360, 400 320 Z"
              fill="#a8c0a8"
              stroke="#627762"
              strokeWidth="0.8"
            />

            {/* Ambrosia Sugar Town */}
            <path
              id="zone-ambrosia"
              d="M 640 420
                 C 670 410, 700 420, 710 450
                 C 710 480, 680 510, 650 510
                 C 620 500, 620 450, 640 420 Z"
              fill="#a6bea6"
              stroke="#627762"
              strokeWidth="0.6"
            />

            {/* Seaview & North Vice */}
            <path
              id="zone-seaview"
              d="M 780 200
                 C 830 180, 870 210, 880 260
                 C 880 310, 840 350, 800 350
                 C 770 330, 760 260, 780 200 Z"
              fill="#a8c0a8"
              stroke="#627762"
              strokeWidth="0.6"
            />
          </g>

          {/* =====================================================================
              5. INLAND LAKES, RIVERS & CHANNELS
              ===================================================================== */}
          {showWaterways && (
            <g id="inland-waterways">
              {/* Lake Leonida (Central Freshwater Lake with glow) */}
              <path
                id="lake-leonida-poly"
                d="M 670 280
                   C 710 260, 750 280, 760 320
                   C 770 370, 750 420, 710 440
                   C 670 450, 640 420, 635 370
                   C 630 320, 645 290, 670 280 Z"
                fill="url(#lake-leonida-glow)"
                stroke="#3f6f84"
                strokeWidth="1.2"
              />

              {/* Lake Leonida internal islands */}
              <ellipse cx="680" cy="340" rx="6" ry="4" fill="#69a769" />
              <ellipse cx="720" cy="380" rx="8" ry="5" fill="#69a769" />

              {/* Vice River (Meandering river flowing through Rockridge/Little Haiti into Bay) */}
              <path
                id="vice-river"
                d="M 710 500
                   C 725 530, 735 550, 740 575
                   C 745 600, 738 620, 750 645
                   C 765 670, 780 685, 800 690"
                fill="none"
                stroke="#548ca2"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <text x="715" y="555" fontSize="5" fontWeight="bold" fill="#31586a" transform="rotate(50, 715, 555)">
                Vice River
              </text>

              {/* Port Gellhorn Bay & Inlet */}
              <path
                d="M 370 380 C 400 395, 420 410, 425 440 C 410 460, 390 450, 375 430"
                fill="#4a7e96"
                stroke="#37677e"
                strokeWidth="1"
              />

              {/* Grass Rivers wetland channels */}
              <g stroke="#4f859f" strokeWidth="2.2" fill="none" opacity="0.8">
                <path d="M 580 870 C 600 890, 610 930, 630 960" />
                <path d="M 610 880 C 640 910, 650 950, 660 980" />
                <path d="M 640 860 C 660 890, 680 920, 690 970" />
                <path d="M 550 900 C 570 930, 580 960, 590 990" />
              </g>

              {/* Biscayne Bay Harbor Shallows */}
              <path
                d="M 790 520
                   C 830 520, 870 560, 875 640
                   C 880 720, 850 800, 810 820
                   C 780 820, 770 760, 780 680
                   C 785 600, 770 540, 790 520 Z"
                fill="#4a7e96"
                stroke="#37677e"
                strokeWidth="1"
              />
            </g>
          )}

          {/* =====================================================================
              6. BARRIER ISLANDS & OCEAN DRIVE BEACHES
              ===================================================================== */}
          <g id="barrier-islands-and-keys">
            {/* South Beach & Ocean Beach barrier strip */}
            <path
              d="M 870 480
                 C 905 520, 915 600, 905 690
                 C 895 770, 865 830, 830 855
                 L 818 845
                 C 850 820, 875 750, 885 680
                 C 895 590, 880 520, 855 490 Z"
              fill="#e2d7a7"
              stroke="#cfc18d"
              strokeWidth="0.8"
            />
            {/* Urban portion of South Beach */}
            <path
              d="M 865 520
                 C 890 540, 900 600, 895 680
                 C 890 760, 860 820, 825 845
                 C 810 830, 820 760, 835 680
                 C 845 600, 840 545, 865 520 Z"
              fill="#9cb49c"
              stroke="#586e58"
              strokeWidth="0.6"
            />

            {/* Star Island */}
            <ellipse cx="845" cy="635" rx="8" ry="6" fill="#abc1ab" stroke="#cfc18d" strokeWidth="0.8" />
            {/* Venetian Islands Chain */}
            <ellipse cx="830" cy="590" rx="5" ry="3" fill="#abc1ab" stroke="#cfc18d" strokeWidth="0.6" />
            <ellipse cx="842" cy="593" rx="5.5" ry="3.5" fill="#abc1ab" stroke="#cfc18d" strokeWidth="0.6" />
            <ellipse cx="855" cy="596" rx="5" ry="3" fill="#abc1ab" stroke="#cfc18d" strokeWidth="0.6" />

            {/* Fisher Island */}
            <path d="M 900 740 C 915 745, 920 765, 910 775 C 895 780, 885 765, 890 745 Z" fill="#abc1ab" stroke="#cfc18d" strokeWidth="0.6" />
            {/* Virginia Key */}
            <path d="M 855 770 C 875 765, 890 785, 880 805 C 865 815, 845 800, 850 780 Z" fill="#69a769" stroke="#cfc18d" strokeWidth="0.6" />
            {/* Key Biscayne */}
            <path d="M 825 820 C 845 815, 860 840, 850 880 C 835 910, 815 890, 815 850 Z" fill="#69a769" stroke="#cfc18d" strokeWidth="0.6" />

            {/* Leonida Keys Archipelago Chain (South) */}
            <path d="M 680 955 C 695 960, 690 975, 675 975 C 665 970, 670 955, 680 955 Z" fill="#69a769" stroke="#cfc18d" strokeWidth="0.6" />
            <path d="M 640 965 C 655 970, 650 985, 635 985 C 625 980, 630 965, 640 965 Z" fill="#69a769" stroke="#cfc18d" strokeWidth="0.6" />
            <path d="M 600 975 C 615 980, 610 995, 595 995 C 585 990, 590 975, 600 975 Z" fill="#69a769" stroke="#cfc18d" strokeWidth="0.6" />
          </g>

          {/* =====================================================================
              7. TOPOGRAPHY, MOUNT KALAGA CONTOURS & FORESTS
              ===================================================================== */}
          {showTopography && (
            <g id="topography-and-elevations">
              {/* Mount Kalaga 10m/15m/20m elevation contours */}
              <g id="mount-kalaga-elevation">
                {/* 10m Base Ring */}
                <path
                  d="M 670 80
                     C 720 60, 770 70, 780 110
                     C 785 150, 750 180, 700 180
                     C 660 170, 645 130, 655 95 Z"
                  fill="#599559"
                  stroke="#3e6f3e"
                  strokeWidth="0.8"
                />
                {/* 15m Mid Ring */}
                <path
                  d="M 685 90
                     C 720 75, 755 85, 760 115
                     C 765 140, 740 160, 705 160
                     C 675 150, 665 125, 675 100 Z"
                  fill="#4c854c"
                  stroke="#335d33"
                  strokeWidth="0.8"
                />
                {/* 20m Peak Ridge */}
                <path
                  d="M 700 95
                     C 720 85, 745 90, 750 110
                     C 750 130, 730 145, 710 140
                     C 690 135, 685 115, 695 100 Z"
                  fill="#3d703d"
                  stroke="#274b27"
                  strokeWidth="1"
                />
                {/* Mountain peak hachures */}
                <line x1="700" y1="100" x2="720" y2="120" stroke="#274b27" strokeWidth="0.8" />
                <line x1="710" y1="95" x2="735" y2="115" stroke="#274b27" strokeWidth="0.8" />
                <line x1="720" y1="95" x2="745" y2="110" stroke="#274b27" strokeWidth="0.8" />

                <text x="710" y="70" fontSize="10" fontWeight="900" fill="#a855f7" textAnchor="middle" stroke="#ffffff" strokeWidth="0.6" paintOrder="stroke">
                  ▲ Mount Kalaga
                </text>
              </g>

              {/* Domed Hills & Redhill */}
              <g id="domed-hills" opacity="0.9">
                <ellipse cx="550" cy="180" rx="35" ry="20" fill="#599559" stroke="#3e6f3e" strokeWidth="0.6" />
                <ellipse cx="555" cy="178" rx="22" ry="12" fill="#4c854c" stroke="#335d33" strokeWidth="0.6" />
                <text x="550" y="160" fontSize="6" fontStyle="italic" fill="#2d522d" textAnchor="middle">Domed Hills</text>

                <ellipse cx="490" cy="240" rx="28" ry="16" fill="#599559" stroke="#3e6f3e" strokeWidth="0.6" />
                <text x="490" y="225" fontSize="6" fontStyle="italic" fill="#2d522d" textAnchor="middle">Hank Hill</text>
              </g>

              {/* Forest tree clusters */}
              <g id="forest-canopies" opacity="0.9">
                <use href="#pine-symbol" x="620" y="110" transform="scale(1.2)" />
                <use href="#pine-symbol" x="635" y="115" transform="scale(1.1)" />
                <use href="#pine-symbol" x="610" y="125" transform="scale(1.3)" />
                <use href="#pine-symbol" x="645" y="120" transform="scale(1.2)" />
                <use href="#pine-symbol" x="670" y="190" transform="scale(1.1)" />
                <use href="#pine-symbol" x="685" y="185" transform="scale(1.2)" />
              </g>
            </g>
          )}

          {/* =====================================================================
              8. INFRASTRUCTURE: AIRPORTS, RUNWAYS, PRISON, HARBORS
              ===================================================================== */}
          {showBuildings && (
            <g id="infrastructure-and-facilities">
              {/* Escobar / Vice City International Airport */}
              <g id="via-airport-complex">
                {/* Tarmac apron */}
                <polygon points="630,660 740,650 750,710 640,730 625,690" fill="#9bb39b" stroke="#506550" strokeWidth="0.8" />
                {/* Runway 1 */}
                <line x1="635" y1="670" x2="740" y2="660" stroke="#334155" strokeWidth="6" strokeLinecap="square" />
                <line x1="635" y1="670" x2="740" y2="660" stroke="#ffffff" strokeWidth="1" strokeDasharray="5,4" />
                {/* Runway 2 */}
                <line x1="640" y1="695" x2="745" y2="685" stroke="#334155" strokeWidth="6" strokeLinecap="square" />
                <line x1="640" y1="695" x2="745" y2="685" stroke="#ffffff" strokeWidth="1" strokeDasharray="5,4" />
                {/* Crosswind Runway */}
                <line x1="655" y1="655" x2="720" y2="720" stroke="#334155" strokeWidth="5" strokeLinecap="square" />

                {/* Terminals & Hangars */}
                <rect x="680" y="640" width="30" height="10" rx="1" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
                <rect x="670" y="652" width="15" height="6" rx="0.5" fill="#eab308" stroke="#a16207" strokeWidth="0.5" />
                <rect x="715" y="645" width="20" height="8" rx="0.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
                <rect x="635" y="705" width="25" height="12" rx="1" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
              </g>

              {/* Port Gellhorn Airfield */}
              <g id="gellhorn-airfield">
                <line x1="450" y1="490" x2="495" y2="540" stroke="#334155" strokeWidth="5" strokeLinecap="square" />
                <line x1="450" y1="490" x2="495" y2="540" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="4,3" />
                <rect x="460" y="480" width="14" height="8" rx="0.5" fill="#ef4444" />
              </g>

              {/* Leonida State Prison */}
              <g id="prison-facility">
                <rect x="545" y="505" width="32" height="28" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="3,2" />
                <rect x="550" y="510" width="10" height="6" fill="#ef4444" />
                <rect x="563" y="510" width="10" height="6" fill="#ef4444" />
                <rect x="550" y="520" width="10" height="6" fill="#ef4444" />
                <rect x="563" y="520" width="10" height="6" fill="#ef4444" />
                <circle cx="545" cy="505" r="1.5" fill="#dc2626" />
                <circle cx="577" cy="505" r="1.5" fill="#dc2626" />
                <circle cx="545" cy="533" r="1.5" fill="#dc2626" />
                <circle cx="577" cy="533" r="1.5" fill="#dc2626" />
              </g>

              {/* Vice Port Container Terminal */}
              <g id="vice-port-containers">
                <rect x="840" y="685" width="22" height="12" fill="#8ca88c" stroke="#475569" strokeWidth="0.5" />
                <rect x="842" y="688" width="4" height="2" fill="#3b82f6" />
                <rect x="847" y="688" width="4" height="2" fill="#ef4444" />
                <rect x="852" y="688" width="4" height="2" fill="#eab308" />
                <rect x="842" y="692" width="4" height="2" fill="#10b981" />
              </g>
            </g>
          )}

          {/* =====================================================================
              9. ROAD NETWORKS & HIGHWAY SYSTEMS
              ===================================================================== */}
          {showRoads && (
            <g id="street-grid-network" stroke="#475569" strokeWidth="0.8" fill="none" opacity="0.85">
              {/* Vice City Street Grid Lines */}
              <line x1="760" y1="520" x2="760" y2="760" />
              <line x1="775" y1="510" x2="775" y2="780" />
              <line x1="790" y1="500" x2="790" y2="800" />
              <line x1="805" y1="520" x2="805" y2="790" />
              <line x1="820" y1="540" x2="820" y2="770" />
              <line x1="750" y1="540" x2="840" y2="540" />
              <line x1="750" y1="570" x2="850" y2="570" />
              <line x1="750" y1="600" x2="860" y2="600" />
              <line x1="745" y1="630" x2="850" y2="630" />
              <line x1="745" y1="660" x2="840" y2="660" />
              <line x1="750" y1="690" x2="830" y2="690" />

              {/* Ocean Drive Beach Boulevard */}
              <path d="M 870 510 C 895 560, 905 650, 885 750 C 870 800, 840 840, 820 855" strokeWidth="1.4" stroke="#334155" />

              {/* Port Gellhorn Streets */}
              <line x1="390" y1="350" x2="470" y2="350" />
              <line x1="385" y1="390" x2="475" y2="390" />
              <line x1="380" y1="430" x2="470" y2="430" />
              <line x1="410" y1="330" x2="410" y2="490" />
              <line x1="440" y1="320" x2="440" y2="500" />
            </g>
          )}

          {/* =====================================================================
              10. PRIMARY SPEC HIGHWAYS & INTERSTATES (BOLD RED/ORANGE/YELLOW INTERCHANGES)
              ===================================================================== */}
          {showHighways && (
            <g id="spec-highways" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Trans-Leonida Central Interstate (Port Gellhorn <-> Mariana <-> Vice City) */}
              <path
                d="M 850 600
                   C 810 590, 770 585, 720 590
                   C 660 595, 600 580, 540 550
                   C 490 520, 450 480, 430 430
                   C 420 390, 425 350, 435 310"
                stroke="#e63946"
                strokeWidth="3.2"
              />

              {/* North-South Interstate (Mount Kalaga <-> Vice City <-> Hamlet <-> Keys) */}
              <path
                d="M 720 70
                   C 740 140, 760 230, 780 320
                   C 795 400, 790 480, 785 560
                   C 780 640, 765 720, 740 790
                   C 720 840, 700 870, 690 910
                   C 680 940, 650 965, 610 985"
                stroke="#e63946"
                strokeWidth="3.2"
              />

              {/* Western Coastal Highway (Kelly County <-> Port Gellhorn <-> Watson Bay) */}
              <path
                d="M 410 70
                   C 400 140, 410 210, 435 280
                   C 450 340, 465 410, 460 480
                   C 455 540, 470 610, 490 680
                   C 510 750, 535 830, 560 900
                   C 575 940, 560 970, 530 980"
                stroke="#f05a28"
                strokeWidth="2.5"
              />

              {/* Southern Connector (Hamlet <-> Watson Bay) */}
              <path
                d="M 740 790
                   C 700 810, 650 825, 600 830
                   C 550 835, 510 860, 490 900
                   C 475 930, 485 960, 520 975"
                stroke="#f05a28"
                strokeWidth="2.2"
              />

              {/* Bridges & Causeways across Biscayne Bay */}
              <line x1="800" y1="590" x2="865" y2="590" stroke="#f05a28" strokeWidth="2.2" />
              <line x1="800" y1="635" x2="870" y2="635" stroke="#e63946" strokeWidth="2.6" />
              <line x1="795" y1="535" x2="860" y2="535" stroke="#f05a28" strokeWidth="2.2" />
              <path d="M 790 700 C 810 730, 840 760, 860 780" stroke="#f05a28" strokeWidth="2.4" />
            </g>
          )}

          {/* =====================================================================
              11. DEEP MICRO-GRID FOR ROCKRIDGE, LITTLE HAITI & STOCKYARD (ZOOMED IN DETAIL)
              ===================================================================== */}
          <g id="rockridge-micro-urban-detail">
            {/* Rockridge Curved Loop Bypass (matching user screenshot 2) */}
            <path
              d="M 710 540 C 720 520, 760 520, 770 540 L 775 560"
              fill="none"
              stroke="#ffd600"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Rockridge Urban Footprint */}
            <path
              d="M 715 528 C 725 515, 755 515, 765 528 L 760 545 L 720 545 Z"
              fill="#8e998e"
              stroke="#475569"
              strokeWidth="0.6"
            />

            {/* i404 Expressway (Yellow & Red highway curve underneath Rockridge) */}
            <path
              d="M 700 610 C 730 608, 770 608, 810 605"
              fill="none"
              stroke="#ffd600"
              strokeWidth="2.5"
            />
            <path
              d="M 700 613 C 730 611, 770 611, 810 608"
              fill="none"
              stroke="#e63946"
              strokeWidth="1.5"
            />
            <text x="730" y="604" fontSize="4.5" fontWeight="bold" fill="#dc2626">i404</text>
            <text x="750" y="604" fontSize="4.5" fontWeight="bold" fill="#000000">i404</text>

            {/* i97 Spaghetti Interchange (Multi-tier blue highway ribbons) */}
            <g id="i97-spaghetti-interchange">
              {/* North-South blue multi-lane freeway */}
              <path d="M 770 510 C 775 540, 775 570, 765 600 C 760 620, 755 640, 750 670" fill="none" stroke="#3b82f6" strokeWidth="3.2" />
              <path d="M 775 510 C 780 540, 780 570, 770 600 C 765 620, 760 640, 755 670" fill="none" stroke="#2563eb" strokeWidth="2.8" />
              {/* Cloverleaf flyover loops */}
              <path d="M 760 580 C 750 585, 750 600, 765 605 C 780 610, 790 595, 775 585 Z" fill="none" stroke="#1d4ed8" strokeWidth="1.8" />
              <path d="M 775 570 C 790 565, 805 580, 785 595" fill="none" stroke="#1d4ed8" strokeWidth="1.8" />
              <text x="778" y="555" fontSize="5" fontWeight="bold" fill="#1e3a8a">i97</text>
            </g>

            {/* Detailed Building Footprints in Rockridge & Little Haiti */}
            {showBuildings && (
              <g id="micro-building-footprints">
                {/* Regular Grey Buildings */}
                <rect x="740" y="530" width="5" height="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.4" />
                <rect x="748" y="530" width="6" height="5" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.4" />
                <rect x="756" y="532" width="5" height="6" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.4" />
                <rect x="742" y="540" width="8" height="5" fill="#94a3b8" stroke="#475569" strokeWidth="0.4" />
                <rect x="752" y="540" width="7" height="6" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.4" />
                <rect x="735" y="560" width="6" height="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.4" />
                <rect x="744" y="560" width="5" height="5" fill="#94a3b8" stroke="#475569" strokeWidth="0.4" />
                <rect x="780" y="525" width="8" height="6" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.4" />
                <rect x="790" y="525" width="6" height="7" fill="#94a3b8" stroke="#475569" strokeWidth="0.4" />
                <rect x="785" y="540" width="7" height="8" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.4" />
                <rect x="795" y="540" width="8" height="6" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.4" />

                {/* Spec Red Buildings (Leak / Speculative Buildings) */}
                {showSpecBuildings && (
                  <g id="spec-red-buildings">
                    <rect x="715" y="605" width="8" height="6" rx="0.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.4" />
                    <rect x="760" y="505" width="7" height="4" rx="0.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.4" />
                    <rect x="738" y="515" width="5" height="4" rx="0.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.4" />
                    <polygon points="782,605 788,600 792,608 786,612" fill="#ef4444" stroke="#991b1b" strokeWidth="0.4" />
                  </g>
                )}

                {/* Ammu-Nation Gun Icon at Little Haiti */}
                <g transform="translate(745, 570) scale(0.6)">
                  <rect x="-4" y="-3" width="10" height="6" rx="1" fill="#000000" />
                  <path d="M -2 0 L 4 0 L 4 2 L 2 2 L 1 3 L -1 3 Z" fill="#ffffff" />
                </g>

                {/* Neighborhood Micro Labels */}
                <g id="micro-neighborhood-labels">
                  <text x="736" y="538" fontSize="5.5" fontWeight="900" fill="#000000" stroke="#ffffff" strokeWidth="0.5" paintOrder="stroke">
                    📍 Rockridge
                  </text>
                  <text x="755" y="500" fontSize="5.5" fontWeight="900" fill="#000000" stroke="#ffffff" strokeWidth="0.5" paintOrder="stroke">
                    Little Haiti
                  </text>
                  <text x="785" y="505" fontSize="5.5" fontWeight="900" fill="#000000" stroke="#ffffff" strokeWidth="0.5" paintOrder="stroke">
                    Stockyard
                  </text>
                </g>
              </g>
            )}
          </g>

          {/* =====================================================================
              12. METRO MULE TRANSIT & RAILWAYS
              ===================================================================== */}
          {showMetro && (
            <g id="transit-rail-networks">
              {/* Metro Mule (Bright Yellow Transit Line) */}
              <path
                id="metro-mule-line"
                d="M 775 530
                   C 775 580, 785 640, 800 670
                   C 815 700, 810 740, 790 770
                   C 770 795, 740 805, 715 800"
                fill="none"
                stroke="#ffd600"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              {/* Freight Railway (Dashed rail line) */}
              <path
                id="freight-rail-line"
                d="M 440 370
                   C 470 410, 520 450, 580 470
                   C 640 490, 700 520, 750 560
                   C 800 600, 825 650, 845 685"
                fill="none"
                stroke="#1e293b"
                strokeWidth="1.6"
                strokeDasharray="4,3"
              />
            </g>
          )}

          {/* =====================================================================
              13. COUNTY BOUNDARIES (CYAN / TEAL DASHED LINES)
              ===================================================================== */}
          {showCountyBorders && (
            <g id="county-borders" stroke="#00b4d8" strokeWidth="1.4" fill="none" strokeDasharray="5,4" opacity="0.85">
              <line x1="580" y1="50" x2="580" y2="350" />
              <line x1="770" y1="50" x2="770" y2="360" />
              <line x1="380" y1="460" x2="580" y2="460" />
              <line x1="580" y1="460" x2="800" y2="460" />
              <line x1="650" y1="460" x2="650" y2="820" />
              <line x1="530" y1="820" x2="820" y2="820" />
            </g>
          )}

          {/* =====================================================================
              14. PROMINENT COUNTY WATERMARK TITLES
              ===================================================================== */}
          {showCountyNames && (
            <g id="county-watermarks" className="pointer-events-none select-none">
              {LEONIDA_COUNTIES.map((county) => (
                <g key={county.id} transform={`translate(${county.center.x * 10}, ${county.center.y * 10})`}>
                  <text
                    textAnchor="middle"
                    className="font-black uppercase tracking-widest font-sans"
                    fontSize="18"
                    fill="#1e293b"
                    opacity="0.45"
                    stroke="#ffffff"
                    strokeWidth="1"
                    paintOrder="stroke"
                  >
                    {county.name}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* =====================================================================
              15. LEAK COORDINATE PINS (AUTHENTIC GTA 6 MAPPING PROJECT DOTS)
              ===================================================================== */}
          {showLeakPins && (
            <g id="leak-coordinate-pins">
              {LEAK_COORDINATE_PINS.map((leak) => {
                let circleColor = '#facc15'; // yellow
                if (leak.color === 'green') circleColor = '#4ade80';
                if (leak.color === 'blue') circleColor = '#60a5fa';
                if (leak.color === 'red') circleColor = '#f87171';

                return (
                  <g
                    key={leak.id}
                    transform={`translate(${leak.x}, ${leak.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPin({ type: 'leak', data: leak });
                      playAudioFeedback(700, 0.08);
                    }}
                    className="cursor-pointer group pointer-events-auto"
                  >
                    {/* Circle Pin Marker */}
                    <circle r="3.2" fill={circleColor} stroke="#000000" strokeWidth="0.8" />
                    {leak.hasT && (
                      <text x="0" y="1.2" fontSize="2.8" fontWeight="900" fill="#000000" textAnchor="middle">
                        T
                      </text>
                    )}
                    {/* Code label */}
                    <text
                      x="5"
                      y="1.5"
                      fontSize="3.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#1e293b"
                      stroke="#ffffff"
                      strokeWidth="0.5"
                      paintOrder="stroke"
                    >
                      {leak.code}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* =====================================================================
              16. LANDMARK PINS & MAJOR HUBS (BLACK / PURPLE / CYAN PINHEADS)
              ===================================================================== */}
          <g id="major-landmarks">
            {LEONIDA_LANDMARKS.map((lm) => {
              const pinX = lm.x * 10;
              const pinY = lm.y * 10;
              const isSelected = selectedPin?.type === 'landmark' && selectedPin.data.id === lm.id;

              let pinColor = '#000000';
              if (lm.pinColor === 'purple') pinColor = '#9333ea';
              if (lm.pinColor === 'cyan') pinColor = '#0284c7';
              if (lm.pinColor === 'red') pinColor = '#dc2626';

              return (
                <g
                  key={lm.id}
                  transform={`translate(${pinX}, ${pinY})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPin({ type: 'landmark', data: lm });
                    playAudioFeedback(600, 0.1);
                  }}
                  className="cursor-pointer group pointer-events-auto"
                >
                  {isSelected && (
                    <circle r="12" fill="none" stroke="#f43f5e" strokeWidth="1.8" className="animate-ping" />
                  )}

                  {/* Pinhead shape */}
                  <g transform="translate(0, -6)">
                    <path
                      d="M 0 0 C -3.5 -3.5, -5 -7, -5 -10 C -5 -14, -2.5 -16, 0 -16 C 2.5 -16, 5 -14, 5 -10 C 5 -7, 3.5 -3.5, 0 0 Z"
                      fill={pinColor}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    <circle cx="0" cy="-10" r="1.8" fill="#ffffff" />
                  </g>

                  {/* Landmark Name Box */}
                  <g transform="translate(0, 7)">
                    <rect
                      x={-(lm.name.length * 3.0)}
                      y="-4"
                      width={lm.name.length * 6.0}
                      height="11"
                      rx="2.5"
                      fill="#ffffff"
                      fillOpacity="0.9"
                      stroke={isSelected ? '#f43f5e' : '#94a3b8'}
                      strokeWidth="0.8"
                    />
                    <text
                      textAnchor="middle"
                      y="4"
                      fontSize="7.5"
                      fontWeight="800"
                      fill={pinColor}
                    >
                      {lm.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* =====================================================================
              17. POI GAMEPLAY LOCATIONS (FILTERED)
              ===================================================================== */}
          {showPOIs && (
            <g id="gameplay-pois">
              {filteredLocations.map((loc) => {
                const px = (loc.x || 50) * 10;
                const py = (loc.y || 50) * 10;
                const isDiscovered = discoveredIds.includes(loc.id);
                const isSelected = activeLocation?.id === loc.id;

                let iconBg = '#f59e0b';
                if (loc.category === 'Dealership') iconBg = '#3b82f6';
                if (loc.category === 'Ammu-Nation') iconBg = '#ef4444';
                if (loc.category === 'Business') iconBg = '#10b981';
                if (loc.category === 'Safehouse') iconBg = '#8b5cf6';
                if (loc.category === 'Heist Target') iconBg = '#ec4899';

                return (
                  <g
                    key={loc.id}
                    transform={`translate(${px}, ${py})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectLocation) onSelectLocation(loc);
                      setSelectedPin({ type: 'poi', data: loc });
                      playAudioFeedback(650, 0.08);
                    }}
                    className="cursor-pointer group pointer-events-auto"
                  >
                    {isSelected && (
                      <circle r="10" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="animate-ping" />
                    )}

                    <circle r="4.5" fill={iconBg} stroke="#ffffff" strokeWidth="1" />
                    <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
                  </g>
                );
              })}
            </g>
          )}

          {/* =====================================================================
              18. SQUAD RADAR CO-OP LIVE PLAYERS & WAYPOINTS
              ===================================================================== */}
          {squadRoom && (
            <g id="squad-radar-elements">
              {/* Waypoints */}
              {squadRoom.waypoints && squadRoom.waypoints.map((wp) => {
                // Approximate coordinate mapping back to SVG 0..1000
                const sx = (wp.lng + 81.5) * (1000 / 2.0);
                const sy = (26.5 - wp.lat) * (1000 / 1.5);

                return (
                  <g key={wp.id} transform={`translate(${sx}, ${sy})`} className="pointer-events-auto">
                    <polygon points="0,0 8,-12 -8,-12" fill={wp.type === 'danger' ? '#ef4444' : '#3b82f6'} stroke="#ffffff" strokeWidth="1" />
                    <circle cx="0" cy="0" r="2" fill="#ffffff" />
                    <text x="0" y="-15" fontSize="6" fontWeight="bold" fill="#ffffff" textAnchor="middle" stroke="#000000" strokeWidth="0.5" paintOrder="stroke">
                      {wp.label}
                    </text>
                  </g>
                );
              })}

              {/* Squad Danger Pings */}
              {squadRoom.pings && squadRoom.pings.map((ping) => {
                const sx = (ping.lng + 81.5) * (1000 / 2.0);
                const sy = (26.5 - ping.lat) * (1000 / 1.5);

                return (
                  <g key={ping.id} transform={`translate(${sx}, ${sy})`}>
                    <circle r="14" fill="none" stroke={ping.placedByColor || '#ef4444'} strokeWidth="2" className="animate-ping" />
                    <circle r="5" fill={ping.placedByColor || '#ef4444'} stroke="#ffffff" strokeWidth="1" />
                  </g>
                );
              })}
            </g>
          )}

          {/* =====================================================================
              19. ROCKSTAR INTERNAL GRID OVERLAY
              ===================================================================== */}
          {showGrid && (
            <g id="rockstar-grid" opacity="0.35">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((gx, idx) => (
                <g key={`gx-${gx}`}>
                  <line x1={gx} y1="0" x2={gx} y2="1000" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="3,3" />
                  <text x={gx + 4} y="15" fontSize="8" fontFamily="monospace" fill="#ffffff" fontWeight="bold">
                    e0{idx + 1}
                  </text>
                </g>
              ))}
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((gy, idx) => (
                <g key={`gy-${gy}`}>
                  <line x1="0" y1={gy} x2="1000" y2={gy} stroke="#ffffff" strokeWidth="0.6" strokeDasharray="3,3" />
                  <text x="5" y={gy - 4} fontSize="8" fontFamily="monospace" fill="#ffffff" fontWeight="bold">
                    {idx < 5 ? `n0${5 - idx}` : `s0${idx - 4}`}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Map Attribution Watermark */}
          <text x="15" y="990" fontSize="8" fontFamily="monospace" fill="#1e293b" opacity="0.8">
            STATE OF LEONIDA GIS • GTA VI COMMUNITY MAPPING PROJECT
          </text>
        </svg>
      </div>

      {/* =========================================================================
          SELECTED PIN DETAIL MODAL / FLOATING INTEL CARD
          ========================================================================= */}
      {selectedPin && (
        <div className="absolute right-4 top-20 z-40 w-80 bg-zinc-950/95 backdrop-blur-md border border-amber-500/50 rounded-2xl p-4 shadow-2xl space-y-3 pointer-events-auto animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl">
                <Compass className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  {selectedPin.type === 'poi'
                    ? selectedPin.data.category
                    : selectedPin.type === 'leak'
                    ? 'Leak Event Coordinate'
                    : 'Major Landmark'}
                </span>
                <h4 className="text-sm font-black text-white leading-tight">
                  {selectedPin.type === 'poi'
                    ? selectedPin.data.title
                    : selectedPin.type === 'leak'
                    ? `Coordinate ${selectedPin.data.code}`
                    : selectedPin.data.name}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPin(null)}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {selectedPin.data.description}
          </p>

          {/* Teleport command */}
          {selectedPin.data.teleportCommand && (
            <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400">
                {selectedPin.data.teleportCommand}
              </span>
              <button
                type="button"
                onClick={() => {
                  copyToClipboard(selectedPin.data.teleportCommand);
                  setCopiedText(selectedPin.data.teleportCommand);
                  setTimeout(() => setCopiedText(null), 2000);
                }}
                className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-extrabold rounded-lg flex items-center gap-1 transition"
              >
                {copiedText === selectedPin.data.teleportCommand ? (
                  <>
                    <Check className="w-3 h-3 text-black" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-black" />
                    <span>/tp</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Discovered Checklist for POIs */}
          {selectedPin.type === 'poi' && onToggleDiscovered && (
            <button
              type="button"
              onClick={() => onToggleDiscovered(selectedPin.data.id)}
              className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                discoveredIds.includes(selectedPin.data.id)
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {discoveredIds.includes(selectedPin.data.id)
                  ? 'Discovered & Cataloged'
                  : 'Mark as Discovered'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
