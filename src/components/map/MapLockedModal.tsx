import React from 'react';
import {
  Lock,
  ShieldAlert,
  Compass,
  Radio,
  Car,
  Crosshair,
  Server,
  Home,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface MapLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, targetId?: string) => void;
}

export const MapLockedModal: React.FC<MapLockedModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="map-locked-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="map-locked-modal-dialog"
        className="relative w-full max-w-xl bg-zinc-950 border-2 border-rose-500/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-rose-950/60 overflow-hidden my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Banner / Accent */}
        <div className="bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 px-4 py-2.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest">
              Security Protocol • Map Offline Mode
            </span>
          </div>
          <span className="px-2 py-0.5 bg-black/40 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase">
            Admin HQ Lock
          </span>
        </div>

        {/* Close Button */}
        <button
          type="button"
          id="btn-close-map-locked-modal"
          onClick={onClose}
          className="absolute top-10 right-4 p-2 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition cursor-pointer z-10"
          title="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 sm:p-7 space-y-5">
          {/* Header Icon + Title */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/20">
              <Lock className="w-7 h-7 animate-pulse" />
            </div>
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  SYSTEM LOCKED
                </span>
                <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Calibrating
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                Tactical Map & Squad Radar Temporarily Locked
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The State of Leonida Vector Cartography Engine and Live Squad GPS Radar have been temporarily locked by Admin HQ for database maintenance and coordinate recalibration.
              </p>
            </div>
          </div>

          {/* Diagnostic Status Box */}
          <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-[11px] pb-2 border-b border-zinc-800">
              <span className="text-zinc-400 font-mono uppercase font-bold">Diagnostic Status</span>
              <span className="text-amber-400 font-mono font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                OFFLINE FOR MAINTENANCE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-zinc-950/80 border border-zinc-800/60 p-2.5 rounded-lg">
                <span className="text-zinc-500 block text-[10px] font-mono uppercase">Map Tile Engine</span>
                <span className="text-zinc-300 font-bold flex items-center gap-1 mt-0.5">
                  <Compass className="w-3.5 h-3.5 text-rose-400" />
                  Leaflet / Vector Paused
                </span>
              </div>
              <div className="bg-zinc-950/80 border border-zinc-800/60 p-2.5 rounded-lg">
                <span className="text-zinc-500 block text-[10px] font-mono uppercase">Live Squad Comms</span>
                <span className="text-zinc-300 font-bold flex items-center gap-1 mt-0.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  GPS Telemetry Standby
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              No database reads or tile downloads are running in this mode. The map will reopen once coordinate updates and server benchmarks are finalized.
            </p>
          </div>

          {/* Alternative Navigation Shortcuts */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Available Vice City Modules
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100% Operational</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-goto-vehicles-from-modal"
                onClick={() => {
                  onClose();
                  onNavigate('vehicles');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-rose-500/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-rose-300 transition">
                      Vehicle Database
                    </div>
                    <div className="text-[10px] text-zinc-400">Top speeds & handling specs</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-rose-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                id="btn-goto-weapons-from-modal"
                onClick={() => {
                  onClose();
                  onNavigate('weapons');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-500/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-amber-300 transition">
                      Weapons Arsenal
                    </div>
                    <div className="text-[10px] text-zinc-400">TTK & damage stats</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                id="btn-goto-servers-from-modal"
                onClick={() => {
                  onClose();
                  onNavigate('rp-servers');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-cyan-500/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-cyan-300 transition">
                      FiveM RP Servers
                    </div>
                    <div className="text-[10px] text-zinc-400">Curated community directory</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                id="btn-goto-home-from-modal"
                onClick={() => {
                  onClose();
                  onNavigate('home');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/50 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white group-hover:text-emerald-300 transition">
                      Main Portal Home
                    </div>
                    <div className="text-[10px] text-zinc-400">News, guides & leaks</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-900">
            <span className="text-[11px] text-zinc-500 font-mono text-center sm:text-left">
              🔒 Map resources held offline
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                id="btn-return-home-primary"
                onClick={() => {
                  onClose();
                  onNavigate('home');
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/40 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home Portal</span>
              </button>
              <button
                type="button"
                id="btn-dismiss-modal"
                onClick={onClose}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-xl border border-zinc-800 transition cursor-pointer"
              >
                Dismiss Notice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MapLockedScreenProps {
  onOpenModal?: () => void;
  onNavigate: (tab: string, targetId?: string) => void;
}

export const MapLockedScreen: React.FC<MapLockedScreenProps> = ({
  onOpenModal,
  onNavigate
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in">
      {/* Top Banner Alert */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/50 via-zinc-900 to-amber-950/40 border-2 border-rose-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/20">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                MAP ENGINE LOCKED
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Zero Reads Safeguard</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-1">
              Vice City & Leonida Map Offline for Scheduled Maintenance
            </h2>
            <p className="text-xs text-zinc-400">
              The map page has been completely locked by Admin HQ. Map tiles and radar listeners are not loaded.
            </p>
          </div>
        </div>

        {onOpenModal && (
          <button
            type="button"
            id="btn-reopen-map-locked-modal"
            onClick={onOpenModal}
            className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/50 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 shadow-md"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>View Lock Details</span>
          </button>
        )}
      </div>

      {/* Main Locked Card Canvas */}
      <div className="relative min-h-[460px] sm:min-h-[520px] rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center p-6 shadow-2xl">
        {/* Radar Simulation Grid in Background (Zero Network / Zero Heavy Resources) */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500/30 via-zinc-950 to-black" />
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="locked-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f43f5e" strokeWidth="0.5" strokeOpacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#locked-grid)" />
            <circle cx="50%" cy="50%" r="120" fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50%" cy="50%" r="220" fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="50%" cy="50%" r="320" fill="none" stroke="#f43f5e" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Center Lock Hologram Display */}
        <div className="relative z-10 max-w-lg w-full text-center space-y-6 bg-zinc-900/90 border border-rose-500/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-rose-950/60">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/15 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/30">
            <Lock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <ShieldAlert className="w-3.5 h-3.5" />
              ACCESS TEMPORARILY SUSPENDED
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Tactical Map Offline
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
              Interactive GPS radar, satellite imagery, and POI markers are currently locked for maintenance and database bandwidth protection. The map engine is not loaded to preserve performance.
            </p>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-2 text-left text-xs bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Engine State</span>
              <span className="text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Unloaded (Safe)
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Telemetry Radar</span>
              <span className="text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                Calibration Mode
              </span>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              id="btn-locked-screen-home"
              onClick={() => onNavigate('home')}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/40 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Return to Portal Home</span>
            </button>

            <button
              type="button"
              id="btn-locked-screen-vehicles"
              onClick={() => onNavigate('vehicles')}
              className="w-full sm:w-auto px-5 py-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 hover:border-rose-500/50 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Car className="w-4 h-4 text-rose-400" />
              <span>Browse Vehicles</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
