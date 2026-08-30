import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Zap,
  Bot,
  Activity,
  Filter,
  Check,
  Pause
} from 'lucide-react';
import { AgentLogItem } from './types';
import { SEED_AGENT_LOGS } from './mockData';

interface ScheduledJob {
  id: string;
  name: string;
  agentType: string;
  schedule: string;
  status: 'Active' | 'Paused' | 'Running';
  lastRun: string;
  nextRun: string;
  successRate: number;
}

const SEED_JOBS: ScheduledJob[] = [
  {
    id: 'job-1',
    name: 'Midnight pSEO News Spider & Indexer',
    agentType: 'pSEO Spider Agent',
    schedule: 'Every midnight (00:00 UTC)',
    status: 'Active',
    lastRun: 'Today, 00:00 UTC',
    nextRun: 'Tomorrow, 00:00 UTC',
    successRate: 99.4
  },
  {
    id: 'job-2',
    name: 'Weekly Tuning Championship Launch Campaign',
    agentType: 'Multi-Channel Social Agent',
    schedule: 'Mondays at 14:00 UTC',
    status: 'Active',
    lastRun: '3 days ago',
    nextRun: 'in 4 days',
    successRate: 100
  },
  {
    id: 'job-3',
    name: 'On-Page Technical SEO Audit & Schema Scanner',
    agentType: 'Technical SEO Auditor',
    schedule: 'Daily at 06:00 UTC',
    status: 'Active',
    lastRun: 'Today, 06:00 UTC',
    nextRun: 'Tomorrow, 06:00 UTC',
    successRate: 98.2
  },
  {
    id: 'job-4',
    name: 'Contextual Internal Link Silo Re-Optimizer',
    agentType: 'Internal Link Strategist',
    schedule: 'Every 3 days',
    status: 'Active',
    lastRun: 'Yesterday',
    nextRun: 'in 2 days',
    successRate: 100
  }
];

export const AgentSchedulerSection: React.FC = () => {
  const [jobs, setJobs] = useState<ScheduledJob[]>(SEED_JOBS);
  const [logs, setLogs] = useState<AgentLogItem[]>(SEED_AGENT_LOGS);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('All');
  const [notice, setNotice] = useState<string | null>(null);

  const filteredLogs = logs.filter(log =>
    selectedAgentFilter === 'All' || log.agentName === selectedAgentFilter
  );

  const handleRunJob = (job: ScheduledJob) => {
    setRunningJobId(job.id);
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Running' } : j));

    setTimeout(() => {
      const newLog: AgentLogItem = {
        id: `log-${Date.now()}`,
        agentName: job.agentType,
        action: `Executed scheduled routine: ${job.name}`,
        status: 'success',
        timestamp: 'Just now',
        duration: '1.2s',
        details: 'Dispatched task, validated payload schemas, and persisted results to state.'
      };

      setLogs(prev => [newLog, ...prev]);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Active', lastRun: 'Just now' } : j));
      setRunningJobId(null);
      setNotice(`⚡ Agent "${job.agentType}" executed successfully!`);
      setTimeout(() => setNotice(null), 4000);
    }, 1400);
  };

  const handleToggleJobStatus = (id: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        return {
          ...j,
          status: j.status === 'Active' ? 'Paused' : 'Active'
        };
      }
      return j;
    }));
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Scheduled Routines Matrix */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Autonomous Agent Cron Jobs & Schedules</span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">Automated background triggers synchronized with Express server crons.</p>
          </div>

          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl font-bold">
            All Systems Operational
          </span>
        </div>

        <div className="space-y-3">
          {jobs.map(job => (
            <div
              key={job.id}
              className="p-4 bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                    job.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : job.status === 'Running'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {job.status}
                  </span>
                  <span className="text-xs font-bold text-white">{job.name}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 flex-wrap">
                  <span>
                    <strong className="text-zinc-300">Agent:</strong> {job.agentType}
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-zinc-300">Schedule:</strong> {job.schedule}
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-zinc-300">Last run:</strong> {job.lastRun}
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-emerald-400">Success:</strong> {job.successRate}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleJobStatus(job.id)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition border border-zinc-800 cursor-pointer"
                >
                  {job.status === 'Active' ? 'Pause' : 'Resume'}
                </button>

                <button
                  onClick={() => handleRunJob(job)}
                  disabled={runningJobId === job.id}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3 h-3 ${runningJobId === job.id ? 'animate-spin' : ''}`} />
                  <span>{runningJobId === job.id ? 'Running...' : '⚡ Trigger Now'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Agent Terminal Log */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-black text-white">Live Agent Activity Log & Telemetry Stream</h4>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="All">Filter: All Agents</option>
              <option value="Keyword Strategist Agent">Keyword Strategist</option>
              <option value="Technical SEO Auditor">SEO Auditor</option>
              <option value="Internal Link Strategist">Internal Link Strategist</option>
              <option value="SEO Content Writer">Content Writer</option>
              <option value="Multi-Channel Social Agent">Social Agent</option>
              <option value="Brand Visual Director">Visual Director</option>
            </select>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs space-y-3 max-h-[380px] overflow-y-auto">
          {filteredLogs.map(log => (
            <div key={log.id} className="border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-bold text-rose-400">{log.agentName}</span>
                <span className="text-zinc-400">{log.timestamp} • {log.duration}</span>
              </div>
              <p className="text-zinc-200 font-sans text-xs">{log.action}</p>
              {log.details && (
                <p className="text-zinc-400 text-[11px]">{log.details}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
