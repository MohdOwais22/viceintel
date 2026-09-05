'use client';
import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  Trash2,
  X,
  Layers,
  MapPin,
  Car,
  Crosshair,
  Briefcase,
  Zap,
  Users
} from 'lucide-react';
import {
  preloadAllCriticalData,
  getCacheMetadata,
  clearAllOfflineCache,
  forceSyncFirestoreToLocal,
  CacheMetadata
} from '../lib/offlineStorage';
import { formatDateTime } from '../lib/dateUtils';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({ isOpen, onClose }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cacheStats, setCacheStats] = useState<CacheMetadata | null>(null);
  const [syncProgressMessage, setSyncProgressMessage] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNotification({ message: 'Internet connection restored! Resuming live API cloud sync.', type: 'success' });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNotification({ message: 'Network connection lost. GTA VI Central is running in Offline Vault mode.', type: 'info' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load of cache metadata
    loadMetadata();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadMetadata = async () => {
    const meta = await getCacheMetadata();
    setCacheStats(meta);
  };

  const handlePreloadData = async () => {
    setIsSyncing(true);
    setSyncProgressMessage('Caching vehicle top speeds, mod specs & handling parameters...');

    try {
      await new Promise((r) => setTimeout(r, 300));
      setSyncProgressMessage('Caching weapon TTK damage matrices & attachment data...');

      await new Promise((r) => setTimeout(r, 300));
      setSyncProgressMessage('Caching Vice City POI coordinates & map tiles...');

      await new Promise((r) => setTimeout(r, 300));
      setSyncProgressMessage('Caching Character dossiers, syndicate lore & voice actor rosters...');

      await new Promise((r) => setTimeout(r, 300));
      setSyncProgressMessage('Caching Business ROI formulas & FiveM RP directory...');

      const newMeta = await preloadAllCriticalData();
      setCacheStats(newMeta);

      setNotification({
        message: `Successfully cached all critical GTA VI datasets (${newMeta.estimatedSizeKb} KB) for offline use!`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Failed to complete offline dataset pre-caching.', type: 'error' });
    } finally {
      setIsSyncing(false);
      setSyncProgressMessage('');
    }
  };

  const handleLiveSync = async () => {
    if (!isOnline) {
      setNotification({ message: 'Sync requires an active internet connection. Please connect to the network.', type: 'error' });
      return;
    }
    setIsSyncing(true);
    setSyncProgressMessage('Connecting to Vice City Central Database...');

    try {
      await new Promise((r) => setTimeout(r, 250));
      setSyncProgressMessage('Fetching vehicle catalog from database...');
      
      await new Promise((r) => setTimeout(r, 250));
      setSyncProgressMessage('Fetching weapon catalog & ballistics specs...');
      
      await new Promise((r) => setTimeout(r, 250));
      setSyncProgressMessage('Fetching map locations & landmark coordinates...');

      await new Promise((r) => setTimeout(r, 250));
      setSyncProgressMessage('Fetching character gallery & syndicate lore...');

      await new Promise((r) => setTimeout(r, 200));
      setSyncProgressMessage('Updating local browser offline cache...');

      const newMeta = await forceSyncFirestoreToLocal();
      setCacheStats(newMeta);

      setNotification({
        message: `Successfully synchronized live Firestore catalogs (${newMeta.estimatedSizeKb} KB cached locally)!`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Failed to sync with live Cloud Firestore. Please try again.', type: 'error' });
    } finally {
      setIsSyncing(false);
      setSyncProgressMessage('');
    }
  };

  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const handleClearCache = async () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      return;
    }

    try {
      setIsSyncing(true);
      setSyncProgressMessage('Purging local browser storage and Service Worker cache...');
      await clearAllOfflineCache();
      setCacheStats(null);
      setShowClearConfirm(false);
      setNotification({ message: '🗑️ Offline cache cleared completely. Fresh datasets will be fetched on next sync.', type: 'info' });
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Failed to clear offline cache.', type: 'error' });
    } finally {
      setIsSyncing(false);
      setSyncProgressMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
              {isOnline ? <Wifi className="w-5 h-5 animate-pulse" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">Offline Data Storage & Sync</h3>
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ${isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {isOnline ? 'Live Network Online' : 'Offline Cache Mode'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Service Worker & Local Browser Storage caching engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Alert Banner */}
        {notification && (
          <div className={`px-6 py-3 text-xs font-semibold flex items-center justify-between ${
            notification.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border-b border-emerald-500/30' :
            notification.type === 'error' ? 'bg-rose-500/15 text-rose-300 border-b border-rose-500/30' :
            'bg-indigo-500/15 text-indigo-300 border-b border-indigo-500/30'
          }`}>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {notification.message}
            </span>
            <button onClick={() => setNotification(null)} className="text-xs underline hover:opacity-80">
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-6 space-y-6">
          
          {/* Status Overview Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Connection Status Box */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Network Status</span>
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Connected
                  </span>
                ) : (
                  <span className="text-rose-400 font-mono text-[10px]">Disconnected</span>
                )}
              </div>
              <div className="text-sm font-extrabold text-white">
                {isOnline ? 'Direct Cloud REST API & WebSockets' : 'Local Offline Vault Active'}
              </div>
              <p className="text-xs text-zinc-400">
                {isOnline
                  ? 'All requests pull real-time data from server APIs with automatic local storage backup.'
                  : 'Zero connectivity detected. All vehicle specs, weapon damage, and Vice City map POIs are served instantly from local storage.'}
              </p>
            </div>

            {/* Storage Usage Box */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Cache Storage Size</span>
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div className="text-sm font-extrabold text-rose-400 font-mono">
                {cacheStats?.estimatedSizeKb ? `${cacheStats.estimatedSizeKb} KB` : 'Not Preloaded'}
              </div>
              <p className="text-xs text-zinc-400" suppressHydrationWarning>
                {cacheStats?.lastSyncedAt
                  ? `Last synced: ${formatDateTime(cacheStats.lastSyncedAt)}`
                  : 'Click pre-cache button below to store all 500+ vehicle specs & map tiles.'}
              </p>
            </div>
          </div>

          {/* Cached Datasets Grid */}
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-rose-400" />
              <span>Offline Cached Datasets Summary</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
                <Car className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Vehicle Specs</div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {cacheStats ? `${cacheStats.vehiclesCount} Cached` : 'Static Ready'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
                <Crosshair className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Weapon TTK Matrix</div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {cacheStats ? `${cacheStats.weaponsCount} Cached` : 'Static Ready'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Vice City Map POIs</div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {cacheStats ? `${cacheStats.mapLocationsCount} Cached` : 'Static Ready'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
                <Users className="w-5 h-5 text-pink-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Character Dossiers</div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {cacheStats ? `${cacheStats.charactersCount} Cached` : 'Static Ready'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Business ROI</div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {cacheStats ? `${cacheStats.businessesCount} Cached` : 'Static Ready'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
                <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">FiveM RP Directory</div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {cacheStats ? `${cacheStats.rpServersCount} Cached` : 'Static Ready'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-3">
                <Zap className="w-5 h-5 text-pink-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Service Worker</div>
                  <div className="text-[11px] font-mono text-emerald-400">Active v2.5</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Progress Bar */}
          {isSyncing && (
            <div className="p-4 bg-zinc-950 border border-rose-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                  Hydrating Local Offline Cache...
                </span>
                <span className="font-mono text-[11px]">browser cache</span>
              </div>
              <p className="text-xs text-zinc-400">{syncProgressMessage}</p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 h-full w-full animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800">
            {showClearConfirm ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleClearCache}
                  disabled={isSyncing}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-rose-950/50 animate-pulse"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Clear Cache</span>
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isSyncing}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleClearCache}
                disabled={isSyncing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 text-zinc-400" />
                <span>Clear Offline Cache</span>
              </button>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePreloadData}
                disabled={isSyncing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                title="Loads standard static default catalog files directly into local cache"
              >
                <Database className="w-4 h-4 text-zinc-400" />
                <span>Default Local Preload</span>
              </button>

              <button
                onClick={handleLiveSync}
                disabled={isSyncing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-lg shadow-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                title="Queries Firestore Live master bundles directly to pull newly added items & changes from staff CMS"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Live Firestore Catalogs</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
