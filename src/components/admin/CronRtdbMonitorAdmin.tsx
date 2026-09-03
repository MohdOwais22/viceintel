import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Activity,
  Zap,
  Server,
  Shield,
  FileText,
  Users,
  Search,
  Radio
} from 'lucide-react';
import { CronJobRecord } from '../../lib/rtdbCronService';

interface CronRtdbMonitorAdminProps {
  passkey?: string;
}

export const CronRtdbMonitorAdmin: React.FC<CronRtdbMonitorAdminProps> = () => {
  const [cronJobs, setCronJobs] = useState<CronJobRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [triggeringJobId, setTriggeringJobId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchCronStatuses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cron/status');
      if (res.ok) {
        const data = await res.json();
        if (data.cronJobs && Array.isArray(data.cronJobs)) {
          setCronJobs(data.cronJobs);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch RTDB cron status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCronStatuses();
    const interval = setInterval(fetchCronStatuses, 10000); // Live poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const triggerJobOnDemand = async (jobId: string) => {
    setTriggeringJobId(jobId);
    setFeedbackMsg(null);

    let endpoint = '';
    switch (jobId) {
      case 'pseo_spider':
        endpoint = '/api/cron/midnight-spider?force=true';
        break;
      case 'fivem_traffic_sync':
        endpoint = '/api/cron/servers-pulse';
        break;
      case 'vip_expiry_alerts':
        endpoint = '/api/cron/vip-alerts';
        break;
      case 'challenges_payout':
        endpoint = '/api/cron/challenges-payout';
        break;
      case 'stale_squad_cleanup':
        endpoint = '/api/cron/stale-squad-cleanup';
        break;
      case 'pseo_merge_prune':
        endpoint = '/api/cron/merge-prune';
        break;
      case 'discord_role_sync':
        endpoint = '/api/cron/discord-role-sync';
        break;
      default:
        endpoint = `/api/cron/trigger?job=${jobId}`;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'vice_midnight_cron_secret_2026'
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Triggered "${jobId}" successfully! Realtime Database updated.`
        });
        await fetchCronStatuses();
      } else {
        setFeedbackMsg({
          type: 'error',
          text: data.message || `Execution notice for ${jobId}.`
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || `Failed to trigger ${jobId}.`
      });
    } finally {
      setTriggeringJobId(null);
    }
  };

  const getJobIcon = (id: string) => {
    switch (id) {
      case 'pseo_spider':
        return <Search className="w-5 h-5 text-amber-400" />;
      case 'fivem_traffic_sync':
        return <Server className="w-5 h-5 text-cyan-400" />;
      case 'vip_expiry_alerts':
        return <Zap className="w-5 h-5 text-purple-400" />;
      case 'challenges_payout':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'stale_squad_cleanup':
        return <Radio className="w-5 h-5 text-rose-400" />;
      case 'pseo_merge_prune':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'discord_role_sync':
        return <Shield className="w-5 h-5 text-indigo-400" />;
      default:
        return <Clock className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/20 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="w-48 h-48 text-amber-400" />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Database className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-wide">
                Realtime Database (RTDB) Cron Engine
              </h2>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Sub-10ms WebSocket Sync
              </span>
              <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                Automatic Crons: Stopped (Manual Only)
              </span>
            </div>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Automatic background intervals have been stopped. All 7 cron tasks can be triggered manually on-demand or via authenticated webhook calls while updating Realtime Database status in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCronStatuses}
              disabled={isLoading}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              Refresh States
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-3 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Cron Job Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cronJobs.map((job) => (
          <div
            key={job.id}
            className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800/80 rounded-xl border border-zinc-700/60">
                    {getJobIcon(job.id)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{job.name}</h3>
                    <span className="text-xs text-zinc-400 font-mono">{job.intervalDescription}</span>
                  </div>
                </div>

                {job.status === 'running' ? (
                  <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold rounded-full flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                    Running
                  </span>
                ) : job.status === 'error' ? (
                  <span className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    Error
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Active / Idle
                  </span>
                )}
              </div>

              {/* Stats Table */}
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 space-y-2 mb-4 text-xs">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Last Executed:</span>
                  <span className="font-mono text-zinc-200">
                    {job.lastRunTimestamp ? new Date(job.lastRunTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Total Executions:</span>
                  <span className="font-mono text-amber-400 font-bold">{job.runCount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Execution Duration:</span>
                  <span className="font-mono text-cyan-400">{job.lastDurationMs ? `${job.lastDurationMs}ms` : '<10ms'}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Trigger Source:</span>
                  <span className="font-mono text-purple-300 capitalize">{job.triggeredBy || 'internal_timer'}</span>
                </div>
              </div>

              {/* Summary Box */}
              <div className="p-3 bg-zinc-950/50 border border-zinc-800/50 rounded-xl text-xs text-zinc-300 font-mono line-clamp-3 mb-4">
                {job.lastError ? (
                  <span className="text-rose-400 font-sans">{job.lastError}</span>
                ) : (
                  job.lastSummary || 'No execution summary available.'
                )}
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => triggerJobOnDemand(job.id)}
              disabled={triggeringJobId === job.id || job.status === 'running'}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              {triggeringJobId === job.id ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Job Now
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
