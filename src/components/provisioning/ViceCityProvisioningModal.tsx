import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Siren, 
  Wifi, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  MapPin, 
  Activity, 
  Volume2, 
  VolumeX, 
  X, 
  Crown,
  ChevronRight,
  Database
} from 'lucide-react';

export interface ProvisioningStep {
  id: string;
  title: string;
  detail: string;
  location: string;
  completed: boolean;
  active: boolean;
}

export interface ViceCityProvisioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  serverName?: string;
}

const DEFAULT_STEPS: Omit<ProvisioningStep, 'completed' | 'active'>[] = [
  {
    id: 'step-1',
    title: 'Connecting to Vice City Central Database',
    detail: 'Syncing Firestore collections & verifying Vice City account clearance...',
    location: 'Ocean Drive HQ • Server Node #01'
  },
  {
    id: 'step-2',
    title: 'Configuring Leonida PD Scanner & Discord Webhooks',
    detail: 'Binding live dispatch webhooks and player notification gateways...',
    location: 'Downtown Vice • Comms Tower'
  },
  {
    id: 'step-3',
    title: 'Seeding FiveM RP Whitelist Rules & Application Engines',
    detail: 'Injecting custom questions, automated review queues, and role permissions...',
    location: 'Starfish Island • VIP Registry'
  },
  {
    id: 'step-4',
    title: 'Broadcasting Live Server GPS Satellite Beacon',
    detail: 'Finalizing server listing, priority tags, and public invitation links...',
    location: 'Vice Port • Satellite Relay'
  }
];

export const ViceCityProvisioningModal: React.FC<ViceCityProvisioningModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  title = 'Vice City Server Provisioning in Progress...',
  subtitle = 'Setting up your GTA VI RP Server, Discord Gateways & Whitelist Engine',
  serverName = 'Vice City Underground RP'
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStepIndex(0);
      setLogs([]);
      setIsDone(false);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDone(true);
          if (onComplete) onComplete();
          return 100;
        }

        const next = prev + 1;
        
        // Update step index based on progress quarters
        if (next >= 75) {
          setCurrentStepIndex(3);
        } else if (next >= 50) {
          setCurrentStepIndex(2);
        } else if (next >= 25) {
          setCurrentStepIndex(1);
        } else {
          setCurrentStepIndex(0);
        }

        // Add dynamic GTA VI Vice City radio dispatch log entries
        if (next === 5) {
          setLogs((l) => [...l, '📻 [LPD DISPATCH] Initializing secure handshake with Ocean Drive server node...']);
        } else if (next === 25) {
          setLogs((l) => [...l, '🌴 [WEAZEL NEWS] Vice City server registration acknowledged on 104.2 FM!']);
        } else if (next === 50) {
          setLogs((l) => [...l, '🚁 [AIR ONE] Discord bot webhook channel verified: #whitelist-logs active.']);
        } else if (next === 75) {
          setLogs((l) => [...l, '💳 [STARFISH BANK] VIP Priority Placement & No-Code Form Engine unlocked.']);
        } else if (next === 98) {
          setLogs((l) => [...l, '⚡ [SYSTEM READY] All systems operational. State of Leonida beacon broadcast live!']);
        }

        return next;
      });
    }, 80); // ~8 seconds total realistic immersive load time

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden text-slate-100 ring-1 ring-cyan-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BACKGROUND AMBIENT GLOW */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* TOP BAR / DISPATCH SCANNER HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold text-[10px] uppercase tracking-wider border border-pink-500/30 flex items-center gap-1">
                <Siren className="w-3 h-3 text-pink-400 animate-pulse" />
                <span>Vice City Dispatch GPS • 104.2 MHz</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/30 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-cyan-400" />
                <span>LAT 25.7617° N</span>
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Configuring <span className="text-amber-300 font-bold">{serverName}</span> • {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title={isAudioMuted ? 'Unmute Scanner Audio Chatter' : 'Mute Scanner Audio Chatter'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            
            {isDone && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* PROGRESS BAR & PERCENTAGE */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <Activity className="w-4 h-4 text-pink-400 animate-spin" />
              <span>Overall Provisioning Status</span>
            </div>
            <span className="font-mono font-black text-base text-cyan-300">
              {progress}%
            </span>
          </div>

          {/* CUSTOM VICE CITY NEON GRADIENT PROGRESS TRACK */}
          <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 transition-all duration-150 ease-out shadow-[0_0_15px_rgba(236,72,153,0.5)] relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* SHIMMER EFFECT */}
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* PROVISIONING STEPS MATRIX */}
        <div className="space-y-3 relative z-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-pink-400" />
            <span>Active Dispatch Tasks & System Milestones:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEFAULT_STEPS.map((step, idx) => {
              const isCompleted = progress >= (idx + 1) * 25;
              const isActive = currentStepIndex === idx && !isCompleted;

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-2xl border transition-all duration-300 flex items-start gap-3 ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : isActive
                      ? 'bg-indigo-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30 text-white'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isActive ? (
                      <Zap className="w-4 h-4 text-cyan-400 animate-bounce" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800/50" />
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <h4 className="font-bold text-xs truncate">
                      {step.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {step.detail}
                    </p>
                    <span className="text-[9px] font-mono text-slate-500 block">
                      📍 {step.location}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LIVE DISPATCH DISPATCH RADIO CHATTER LOG */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 relative z-10 font-mono text-[11px]">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans border-b border-slate-800/80 pb-1">
            <span className="flex items-center gap-1 text-cyan-400">
              <Activity className="w-3 h-3" />
              <span>Vice City Scanner Audio Log</span>
            </span>
            <span>Channel 104.2 FM</span>
          </div>

          <div className="max-h-24 overflow-y-auto space-y-1 text-slate-300 scrollbar-thin">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic">Listening for Vice City scanner broadcasts...</p>
            ) : (
              logs.map((log, i) => (
                <p key={i} className="text-cyan-300/90 leading-tight">
                  {log}
                </p>
              ))
            )}
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between relative z-10">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>State of Leonida Verified Encryption</span>
          </span>

          {isDone ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:opacity-90 text-white font-black text-xs shadow-xl shadow-pink-500/20 flex items-center gap-2 cursor-pointer transition animate-bounce"
            >
              <span>Launch Your Server Portal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Broadcasting Setup Data...</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
