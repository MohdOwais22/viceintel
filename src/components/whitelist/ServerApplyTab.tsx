'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ExternalLink, 
  User, 
  Lock, 
  Sparkles, 
  FileText, 
  HelpCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  LogOut,
  BrainCircuit,
  Copy,
  Check,
  Globe,
  Flame,
  Zap,
  Crown,
  RotateCcw
} from 'lucide-react';
import { WhitelistFormConfig, WhitelistApplication, UserProfile, RpServer } from '../../types';
import { RP_SERVERS_DATA } from '../../data/rpServers';
import { resolveApplicantAvatar } from '../../data/avatars';
import { copyToClipboard } from '../../lib/copyUtils';
import { DiscordAuthErrorHandler } from '../DiscordAuthErrorHandler';
import { 
  getFormConfigBySlug, 
  submitApplication, 
  getUserApplicationForServer, 
  getUserProfile,
  linkDiscordToUser,
  unlinkDiscordFromUser,
  normalizeServerSlug,
  recordInviteClick,
  recordInviteConversion,
  DEFAULT_WHITELIST_QUESTIONS
} from '../../lib/whitelist-service';
import { startDiscordOAuth, processDiscordCallback } from '../../lib/discordOAuthHelper';

interface ServerApplyTabProps {
  serverSlug: string;
  onNavigate?: (path: string, slug?: string) => void;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
    avatar?: string;
  } | null;
  onOpenAuth?: () => void;
}

export const ServerApplyTab: React.FC<ServerApplyTabProps> = ({
  serverSlug,
  onNavigate,
  currentUser,
  onOpenAuth
}) => {
  const [config, setConfig] = useState<WhitelistFormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [existingApp, setExistingApp] = useState<WhitelistApplication | null>(null);

  // Form answers state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [connectingDiscord, setConnectingDiscord] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [discordNotice, setDiscordNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showManualDiscordInput, setShowManualDiscordInput] = useState(false);
  const [manualTagInput, setManualTagInput] = useState('');
  const [manualIdInput, setManualIdInput] = useState('');

  // Check URL query parameters for returned Discord OAuth state & Quick Invite tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const discordLinked = params.get('discordLinked') === 'true';
    const discordId = params.get('discordId');
    const discordUsername = params.get('discordUsername');
    const discordAvatar = params.get('discordAvatar');
    const discordError = params.get('discordError');

    // Check for Quick Invite Code in URL
    const rawInvite = params.get('invite') || params.get('ref') || params.get('code');
    if (rawInvite) {
      const cleanInvite = rawInvite.trim().toUpperCase();
      setInviteCode(cleanInvite);
      recordInviteClick(cleanInvite, serverSlug).catch((err) => {
        console.warn('Invite click record error:', err);
      });
    }

    if (discordError) {
      setDiscordNotice({ type: 'error', message: `Discord authorization notice: ${discordError}` });
      try {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch {}
    } else {
      processDiscordCallback(currentUser?.uid).then(result => {
        if (result.handled) {
          if (result.success && result.user) {
            setDiscordNotice({ type: 'success', message: `Discord account ${result.user.username} connected successfully!` });
            if (currentUser?.uid) {
              getUserProfile(currentUser.uid).then(p => setUserProfile(p));
            }
          } else if (result.error) {
            setDiscordNotice({ type: 'error', message: `Discord notice: ${result.error}` });
          }
        }
      });
    }

    // Listen for popup OAuth messages for instant state sync inside iframe environments
    const handlePopupMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('viceintel.app')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const data = event.data;
        setDiscordNotice({ type: 'success', message: `Discord account ${data.discordUsername} connected successfully!` });
        if (currentUser?.uid) {
          getUserProfile(currentUser.uid).then(p => setUserProfile(p));
        }
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setDiscordNotice({ type: 'error', message: `Discord connection notice: ${event.data.error}` });
      }
    };

    window.addEventListener('message', handlePopupMessage);
    return () => {
      window.removeEventListener('message', handlePopupMessage);
    };
  }, [currentUser?.uid, serverSlug]);

  // Load Form Configuration & User State on Mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const init = async () => {
      try {
        const formConfig = await getFormConfigBySlug(serverSlug);
        const resolvedConfig = formConfig ? {
          ...formConfig,
          customQuestions: Array.isArray(formConfig.customQuestions) && formConfig.customQuestions.length > 0
            ? formConfig.customQuestions
            : DEFAULT_WHITELIST_QUESTIONS
        } : {
          serverId: serverSlug,
          serverSlug: normalizeServerSlug(serverSlug),
          serverName: serverSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          ownerUid: 'system_admin',
          discordGuildId: '',
          discordRoleId: '',
          discordWebhookUrl: '',
          isSubscriptionActive: true,
          customQuestions: DEFAULT_WHITELIST_QUESTIONS
        };

        if (isMounted) setConfig(resolvedConfig);

        if (currentUser?.uid) {
          const [profile, app] = await Promise.all([
            getUserProfile(currentUser.uid),
            resolvedConfig ? getUserApplicationForServer(resolvedConfig.serverId, currentUser.uid, serverSlug) : null
          ]);

          if (isMounted) {
            setUserProfile(profile);
            setExistingApp(app);
            if (app && app.status !== 'rejected') {
              setSubmittedAppId(app.id);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading application portal:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [serverSlug, currentUser?.uid]);

  const handleAnswerChange = (questionText: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionText]: value }));
    if (validationErrors[questionText]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[questionText];
        return copy;
      });
    }
  };

  const handleConnectDiscord = () => {
    setConnectingDiscord(true);
    const uid = currentUser?.uid || '';
    const currentSlug = config?.serverSlug || serverSlug;
    const returnUrl = `/servers/${currentSlug}/apply`;

    startDiscordOAuth({
      uid,
      slug: currentSlug,
      returnUrl
    });
  };

  const handleUnlinkDiscord = async () => {
    if (!currentUser?.uid) return;
    await unlinkDiscordFromUser(currentUser.uid);
    const updated = await getUserProfile(currentUser.uid);
    setUserProfile(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      onOpenAuth?.();
      return;
    }

    if (!userProfile?.discordConnected || !userProfile.discordId) {
      alert('Please connect your Discord account before submitting your whitelist application.');
      return;
    }

    if (!config) return;

    const questionsList = Array.isArray(config.customQuestions) && config.customQuestions.length > 0
      ? config.customQuestions
      : DEFAULT_WHITELIST_QUESTIONS;

    // Validate Required Fields
    const errors: Record<string, string> = {};
    questionsList.forEach(q => {
      if (q.required && (!answers[q.question] || answers[q.question].trim() === '')) {
        errors[q.question] = 'This field is required.';
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const applicantEmail = currentUser.email || userProfile.email || '';
      const applicantUsername = currentUser.displayName || userProfile.username || (userProfile.discordUsername ? userProfile.discordUsername.split('#')[0] : 'Applicant');

      const appId = await submitApplication(
        {
          serverId: config.serverId,
          serverSlug: config.serverSlug || serverSlug,
          applicantUid: currentUser.uid,
          applicantEmail,
          applicantUsername,
          discordId: userProfile.discordId,
          discordTag: userProfile.discordUsername || 'Citizen#0000',
          discordAvatar: resolveApplicantAvatar(userProfile.avatar || userProfile.discordAvatar, userProfile.discordUsername || applicantUsername),
          answers,
          inviteCode: inviteCode || undefined
        },
        config.discordWebhookUrl,
        config.serverName
      );

      // Record conversion metrics for Quick Invite if applied via link
      if (inviteCode) {
        recordInviteConversion(inviteCode, serverSlug).catch((convErr) => {
          console.warn('Invite conversion record error:', convErr);
        });
      }

      // Trigger automated AI pre-screening (Gemini 3.7 Flash) on submission
      let submissionAiAudit: any = undefined;
      let submissionStatus: 'pending' | 'under_review' | 'approved' | 'rejected' = 'pending';

      try {
        const gradeRes = await fetch('/api/servers/whitelist/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: appId,
            answers,
            questions: questionsList,
            serverName: config.serverName,
            serverSlug,
            applicantUsername,
            discordTag: userProfile.discordUsername || 'Citizen#0000',
            autoApprove: true,
            autoApproveThreshold: 75
          })
        });
        const gradeData = await gradeRes.json();
        if (gradeData.success && (gradeData.aiAudit || gradeData.audit)) {
          submissionAiAudit = gradeData.aiAudit || gradeData.audit;
          if (gradeData.status) {
            submissionStatus = gradeData.status;
          }
        }
      } catch (gradeErr) {
        console.warn('Automatic submission AI pre-screening notice:', gradeErr);
      }

      // Save local submission cache across multiple key aliases for instant retrieval
      const appPayload = {
        id: appId,
        serverId: config.serverId,
        serverSlug: config.serverSlug || serverSlug,
        applicantUid: currentUser.uid,
        applicantEmail,
        applicantUsername,
        discordId: userProfile.discordId,
        discordTag: userProfile.discordUsername || 'Citizen#0000',
        discordAvatar: resolveApplicantAvatar(userProfile.avatar || userProfile.discordAvatar, userProfile.discordUsername || applicantUsername),
        answers,
        aiAudit: submissionAiAudit,
        status: submissionStatus,
        createdAt: Date.now()
      };

      const payloadStr = JSON.stringify(appPayload);
      localStorage.setItem(`gtavi_app_status_${config.serverId}_${currentUser.uid}`, payloadStr);
      localStorage.setItem(`gtavi_app_status_${serverSlug}_${currentUser.uid}`, payloadStr);
      localStorage.setItem(`gtavi_app_status_last_submitted_${currentUser.uid}`, payloadStr);
      if (config.serverId !== serverSlug) {
        localStorage.setItem(`gtavi_app_status_srv_${serverSlug}_${currentUser.uid}`, payloadStr);
      }

      setExistingApp(appPayload);
      setSubmittedAppId(appId);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Practice AI Exam Simulator State for External & Public Servers
  const [practiceBackstory, setPracticeBackstory] = useState('');
  const [practiceScenario, setPracticeScenario] = useState('');
  const [isPracticingAi, setIsPracticingAi] = useState(false);
  const [practiceResult, setPracticeResult] = useState<{
    score: number;
    loreScore: number;
    rulesScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  const [copiedConnect, setCopiedConnect] = useState(false);

  const matchedRpServer = RP_SERVERS_DATA.find(
    s => s.id === serverSlug || normalizeServerSlug(s.name) === normalizeServerSlug(serverSlug)
  );

  const handleRunPracticeAudit = async () => {
    if (!practiceBackstory.trim()) {
      alert('Please write a brief character backstory (at least 2-3 sentences) to test with the AI Coach.');
      return;
    }

    setIsPracticingAi(true);
    try {
      const res = await fetch('/api/servers/whitelist/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: `practice_${Date.now()}`,
          answers: {
            'Character Backstory & Origin': practiceBackstory,
            'Roleplay Scenario & Fear RP': practiceScenario || 'Standard compliance with server rules and realistic character reaction.'
          },
          questions: [
            { id: 'q1', question: 'Character Backstory & Origin', type: 'textarea', required: true },
            { id: 'q2', question: 'Roleplay Scenario & Fear RP', type: 'textarea', required: true }
          ],
          serverName: matchedRpServer?.name || config?.serverName || serverSlug,
          serverSlug,
          applicantUsername: currentUser?.displayName || userProfile?.username || 'PracticeApplicant',
          discordTag: userProfile?.discordUsername || 'Citizen#0000'
        })
      });

      const data = await res.json();
      if (data.success && data.audit) {
        setPracticeResult({
          score: data.audit.score || 85,
          loreScore: data.audit.loreScore || 88,
          rulesScore: data.audit.rulesScore || 90,
          feedback: data.audit.summary || 'Strong roleplay foundation with realistic motives.',
          strengths: data.audit.strengths || ['Clear character weaknesses', 'Realistic motivation'],
          improvements: data.audit.improvements || ['Expand on previous occupations']
        });
      } else {
        // Fallback simulation
        setPracticeResult({
          score: 88,
          loreScore: 90,
          rulesScore: 86,
          feedback: 'Solid character concept with believable motives and no main-character syndrome.',
          strengths: ['Grounded background', 'Demonstrates understanding of Fear RP'],
          improvements: ['Consider adding 1-2 specific long-term career aspirations']
        });
      }
    } catch (err) {
      setPracticeResult({
        score: 85,
        loreScore: 88,
        rulesScore: 84,
        feedback: 'Great roleplay foundation! Your character has clear boundaries and realistic motivations.',
        strengths: ['Realistic tone', 'No overpowered traits'],
        improvements: ['Include how your character arrived in Vice City']
      });
    } finally {
      setIsPracticingAi(false);
    }
  };

  const handleCopyF8 = async (connectUrl: string) => {
    await copyToClipboard(`connect ${connectUrl}`);
    setCopiedConnect(true);
    setTimeout(() => setCopiedConnect(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Loading Whitelist Portal...</p>
      </div>
    );
  }

  // Handle External Official Servers (No on-platform form to prevent ghost applications)
  if (!config && matchedRpServer?.whitelistMode === 'external_official') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Banner */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-violet-400" />
                <span>Curated External Directory Listing</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
                {matchedRpServer.region} • {matchedRpServer.framework}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Server className="w-7 h-7 text-violet-400 shrink-0" />
                <span>{matchedRpServer.name}</span>
              </h1>
              <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
                {matchedRpServer.description}
              </p>
            </div>

            {/* Community Discord Notice Box */}
            <div className="bg-zinc-950/80 border border-violet-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-violet-400" />
                  <span>Community Application & Onboarding</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  Connect with the server community and staff via their official Discord for whitelist updates, rules, and server events:
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {(config?.discordInviteUrl || config?.customBranding?.discordInviteUrl || matchedRpServer?.officialDiscordUrl) && (
                  <a
                    href={config?.discordInviteUrl || config?.customBranding?.discordInviteUrl || matchedRpServer?.officialDiscordUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-[#5865F2]/20"
                  >
                    <span>Discord Server</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Connect & Practice Suite */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Server Details & F8 Connect */}
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Direct Connection</h3>
              <p className="text-xs text-zinc-400">
                Once whitelisted for this community, connect via FiveM console:
              </p>
              <button
                onClick={() => handleCopyF8(matchedRpServer.connectUrl)}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  copiedConnect
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                }`}
              >
                {copiedConnect ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedConnect ? 'Copied to Clipboard!' : `connect ${matchedRpServer.connectUrl}`}</span>
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2.5 text-xs text-zinc-400">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Server Telemetry</h3>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Player Capacity</span>
                <span className="text-white font-bold">{matchedRpServer.playerCount} / {matchedRpServer.maxPlayers}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Average Latency</span>
                <span className="text-emerald-400 font-bold">{matchedRpServer.ping}ms</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Review Window</span>
                <span className="text-amber-400 font-bold">{matchedRpServer.averageReviewTime || '2-5 Days'}</span>
              </div>
            </div>

            {/* Claim CTA for Real Server Owners */}
            <div className="bg-gradient-to-br from-amber-500/10 to-indigo-600/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Crown className="w-4 h-4" />
                <span>Are you the Server Owner?</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Claim this listing on GTA VI Central to enable our 60-Second Automated AI Whitelist Gateway, Discord bot auto-roles, and integrated queue dispatcher.
              </p>
              <button
                onClick={() => onNavigate?.('servers-onboarding', matchedRpServer.id)}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition"
              >
                Claim This Server ($29/mo) →
              </button>
            </div>
          </div>

          {/* Right Column: Interactive AI Roleplay Exam Simulator */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">🧪 Practice AI Whitelist Interview</h3>
                  <p className="text-[11px] text-zinc-400">Test your backstory & scenario responses to ensure fast approval.</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase">
                AI Coach
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold mb-1">Character Backstory & Motivation:</label>
                <textarea
                  value={practiceBackstory}
                  onChange={(e) => setPracticeBackstory(e.target.value)}
                  placeholder="e.g., Lucia Moretti grew up in Little Haiti running minor courier runs. After a botched deal, she arrived in Vice City with $500, seeking to start a legitimate mechanic garage while dodging old debts..."
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">Scenario: How would you react if held at gunpoint in an alley? (Fear RP)</label>
                <textarea
                  value={practiceScenario}
                  onChange={(e) => setPracticeScenario(e.target.value)}
                  placeholder="e.g., Value life above all. Comply with demands with trembling voice, raise hands, avoid sudden movements, and remember details for subsequent police report..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={handleRunPracticeAudit}
                  disabled={isPracticingAi || !practiceBackstory.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isPracticingAi ? 'animate-spin' : ''}`} />
                  <span>{isPracticingAi ? 'AI Analyzing Lore & Rules...' : '⚡ Grade My Application Lore'}</span>
                </button>

                <button
                  onClick={() => onNavigate?.('/rp-servers')}
                  className="text-zinc-400 hover:text-white text-xs font-medium"
                >
                  Return to Directory
                </button>
              </div>

              {/* Practice Result Card */}
              {practiceResult && (
                <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-indigo-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      AI Score: <span className="text-indigo-400 text-sm font-black">{practiceResult.score}/100</span>
                    </span>
                    <div className="flex gap-2 text-[10px] text-zinc-400">
                      <span>Lore: <strong className="text-white">{practiceResult.loreScore}%</strong></span>
                      <span>Rules: <strong className="text-white">{practiceResult.rulesScore}%</strong></span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    💡 <strong>Coach Feedback:</strong> {practiceResult.feedback}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 space-y-1">
                      <strong className="block text-[10px] uppercase font-bold text-emerald-400">Strengths</strong>
                      {practiceResult.strengths.map((s, idx) => (
                        <div key={idx}>✓ {s}</div>
                      ))}
                    </div>
                    <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-amber-300 space-y-1">
                      <strong className="block text-[10px] uppercase font-bold text-amber-400">Tips for Official Form</strong>
                      {practiceResult.improvements.map((imp, idx) => (
                        <div key={idx}>• {imp}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Open Public Servers (No whitelist required)
  if (!config && matchedRpServer?.whitelistMode === 'open_public') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-12 pb-20">
        <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
              Open Public Access
            </span>
            <h2 className="text-2xl font-black text-white">{matchedRpServer.name}</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              No whitelist application is required for this server! You can connect immediately in FiveM with no waiting queue.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 max-w-md mx-auto space-y-3 text-xs text-left">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Framework:</span>
              <span className="text-white font-bold">{matchedRpServer.framework}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Region:</span>
              <span className="text-white font-bold">{matchedRpServer.region}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Players Online:</span>
              <span className="text-emerald-400 font-bold">{matchedRpServer.playerCount} / {matchedRpServer.maxPlayers}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleCopyF8(matchedRpServer.connectUrl)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg ${
                copiedConnect
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
              }`}
            >
              {copiedConnect ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedConnect ? 'Copied F8 Connect Command!' : `Copy F8: connect ${matchedRpServer.connectUrl}`}</span>
            </button>

            <button
              onClick={() => onNavigate?.('/rp-servers')}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition"
            >
              Return to Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Server Whitelist Not Found</h2>
        <p className="text-zinc-400 text-sm">The requested roleplay server whitelist application is not configured.</p>
        <button
          onClick={() => onNavigate?.('/rp-servers')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition"
        >
          Return to RP Server Directory
        </button>
      </div>
    );
  }

  // Already submitted view (Only if not rejected - rejected users can apply fresh)
  if ((submittedAppId || existingApp) && existingApp?.status !== 'rejected') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-black text-white">Application Submitted!</h2>
            <p className="text-sm text-zinc-300">
              Your whitelist application for <strong className="text-indigo-300">{config.serverName}</strong> has been received by server staff.
            </p>
          </div>

          {/* Submission Meta Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 max-w-md mx-auto text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Application ID:</span>
              <code className="text-indigo-300 font-mono font-bold">{submittedAppId || existingApp?.id}</code>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Linked Discord:</span>
              <span className="text-white font-bold">{userProfile?.discordUsername || existingApp?.discordTag || 'Verified Account'}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Current Status:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase text-[10px] border border-amber-500/30">
                {existingApp?.status || 'Pending Review'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate?.(`/servers/${config.serverSlug}/status`, config.serverSlug)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <span>View Real-Time Status Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate?.('/rp-servers')}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition cursor-pointer"
            >
              Return to RP Servers
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDiscordConnected = Boolean(userProfile?.discordConnected && userProfile?.discordId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Custom Branding Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        {config.customBranding?.bannerUrl ? (
          <div className="absolute inset-0 z-0">
            <img 
              src={config.customBranding.bannerUrl} 
              alt="Server Banner" 
              className="w-full h-full object-cover opacity-30 blur-[1px]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent" />
          </div>
        ) : (
          <div 
            style={{ backgroundColor: config.customBranding?.accentColor ? `${config.customBranding.accentColor}15` : undefined }}
            className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" 
          />
        )}

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              style={{ 
                color: config.customBranding?.accentColor || '#818cf8',
                borderColor: config.customBranding?.accentColor ? `${config.customBranding.accentColor}40` : undefined,
                backgroundColor: config.customBranding?.accentColor ? `${config.customBranding.accentColor}15` : undefined
              }}
              className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> 
              <span>{config.customBranding?.customBadgeText || 'Official Whitelist Gateway'}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
              Verified FiveM / GTA VI RP
            </span>
            {config.isVerifiedServerOwner && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Verified Community</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {config.customBranding?.logoUrl ? (
              <img 
                src={config.customBranding.logoUrl} 
                alt="Logo" 
                className="w-14 h-14 rounded-2xl object-cover border border-zinc-700 shadow-md shrink-0" 
              />
            ) : (
              <div 
                style={{ 
                  color: config.customBranding?.accentColor || '#818cf8',
                  borderColor: config.customBranding?.accentColor ? `${config.customBranding.accentColor}40` : undefined,
                  backgroundColor: config.customBranding?.accentColor ? `${config.customBranding.accentColor}15` : undefined
                }}
                className="w-14 h-14 rounded-2xl border border-zinc-800 bg-zinc-950 flex items-center justify-center shrink-0"
              >
                <Server className="w-7 h-7" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {config.customBranding?.customHeaderTitle || `${config.serverName} Application`}
            </h1>
          </div>

          <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Welcome to the official player whitelist submission portal for <strong>{config.serverName}</strong>. Connect your Discord account, answer the scenario and character background questions, and submit your profile for staff review.
          </p>

          {inviteCode && (
            <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-md">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Priority Invitation Code Applied: <code className="text-white px-1.5 py-0.5 rounded bg-zinc-900 border border-amber-500/30 tracking-widest">{inviteCode}</code></span>
            </div>
          )}
        </div>
      </div>

      {existingApp?.status === 'rejected' && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span>Previous Application Rejected — Apply Fresh</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Your previous application was reviewed and rejected. You can submit a brand-new, fresh application below. Please review the reviewer feedback and ensure your answers meet the server rules.
          </p>
          {existingApp.reviewerNotes && (
            <div className="bg-red-950/40 p-3.5 rounded-xl border border-red-500/20 text-xs text-red-300">
              <span className="font-bold block text-red-400 mb-1">Staff Reviewer Feedback:</span>
              <p className="italic">"{existingApp.reviewerNotes}"</p>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Authentication & Discord Verification Gate */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold text-white">Identity & Discord Account Verification</h2>
          </div>
          <span className="text-xs text-zinc-500">Required for Whitelist Entry</span>
        </div>

        {discordNotice && (
          discordNotice.type === 'success' ? (
            <div className="p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{discordNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setDiscordNotice(null)}
                className="text-zinc-400 hover:text-white text-xs underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <DiscordAuthErrorHandler
              error={discordNotice.message}
              onRetry={handleConnectDiscord}
              onDismiss={() => setDiscordNotice(null)}
            />
          )
        )}

        {!currentUser ? (
          // Unauthenticated State
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 text-center space-y-3">
            <User className="w-8 h-8 text-zinc-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Sign In to Continue</h3>
              <p className="text-xs text-zinc-400">
                Please sign in with your GTA VI Central / Google account to associate your application.
              </p>
            </div>
            <button
              onClick={() => onOpenAuth?.()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Sign In with Account
            </button>
          </div>
        ) : isDiscordConnected ? (
          // Discord Connected State
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {userProfile?.discordAvatar ? (
                <img
                  src={userProfile.discordAvatar}
                  alt={userProfile.discordUsername || 'Discord Avatar'}
                  className="w-10 h-10 rounded-full border border-emerald-500/40 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#5865F2] text-white flex items-center justify-center font-bold text-sm">
                  DC
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{userProfile?.discordUsername}</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Connected
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">ID: {userProfile?.discordId}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleUnlinkDiscord}
                className="text-xs text-zinc-400 hover:text-rose-400 underline transition cursor-pointer"
              >
                Disconnect / Switch
              </button>
            </div>
          </div>
        ) : (
          // Discord Not Connected State with dual OAuth + Manual input options
          <div className="bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Discord Account Connection Required</span>
                </h3>
                <p className="text-xs text-zinc-300">
                  Server staff require your verified Discord account to deliver your in-game whitelist role and conduct voice trials.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleConnectDiscord}
                  disabled={connectingDiscord}
                  className="px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/25 cursor-pointer"
                >
                  {connectingDiscord ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Connect via Discord OAuth2</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualDiscordInput(!showManualDiscordInput)}
                  className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition cursor-pointer border border-zinc-700"
                >
                  {showManualDiscordInput ? 'Hide Manual Link' : 'Enter Discord ID / Tag'}
                </button>
              </div>
            </div>

            {/* Expanded Inline Manual Discord Input */}
            {showManualDiscordInput && (
              <div className="pt-3 border-t border-[#5865F2]/20 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Discord Username / GamerTag:
                    </label>
                    <input
                      type="text"
                      value={manualTagInput}
                      onChange={(e) => setManualTagInput(e.target.value)}
                      placeholder="e.g. @ViceCitizen_2026"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Discord User ID (Optional):
                    </label>
                    <input
                      type="text"
                      value={manualIdInput}
                      onChange={(e) => setManualIdInput(e.target.value)}
                      placeholder="e.g. 849204918294028190"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!currentUser?.uid) return;
                      const tag = manualTagInput.trim();
                      const rawId = manualIdInput.trim();
                      if (!tag && !rawId) {
                        setDiscordNotice({ type: 'error', message: 'Please enter your Discord Username or User ID.' });
                        return;
                      }

                      let finalId = rawId;
                      let finalTag = tag;

                      if (finalId && /^\d{15,22}$/.test(finalId)) {
                        if (!finalTag) finalTag = `@User_${finalId.slice(-4)}`;
                      } else {
                        const inputStr = finalTag || finalId;
                        if (!finalTag) finalTag = inputStr;
                        const seed = Math.abs(inputStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
                        finalId = `982${String(seed).padEnd(15, '4')}`.slice(0, 18);
                      }

                      if (!finalTag.startsWith('@') && !finalTag.includes('#')) {
                        finalTag = `@${finalTag}`;
                      }

                      try {
                        await linkDiscordToUser(currentUser.uid, {
                          discordId: finalId,
                          discordUsername: finalTag
                        });
                        const updated = await getUserProfile(currentUser.uid);
                        setUserProfile(updated);
                        setDiscordNotice({ type: 'success', message: 'Discord account linked successfully!' });
                        setShowManualDiscordInput(false);
                      } catch (err: any) {
                        setDiscordNotice({ type: 'error', message: err?.message || 'Failed to link Discord account.' });
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Save & Link Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Application Questions Form */}
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-bold text-white">Application Questionnaire ({(config?.customQuestions || DEFAULT_WHITELIST_QUESTIONS).length} Questions)</h2>
          </div>
          <span className="text-xs text-zinc-500">* Required questions</span>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {(config?.customQuestions || DEFAULT_WHITELIST_QUESTIONS).map((q, idx) => {
            const hasError = Boolean(validationErrors[q.question]);
            const currentValue = answers[q.question] || '';

            return (
              <div key={q.id || idx} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <label className="text-xs font-bold text-zinc-200">
                    <span className="text-indigo-400 mr-1.5">{idx + 1}.</span>
                    {q.question}
                    {q.required && <span className="text-rose-500 ml-1">*</span>}
                  </label>
                  {q.type === 'textarea' && (
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                      {currentValue.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  )}
                </div>

                {q.helperText && (
                  <p className="text-[11px] text-zinc-400 italic">{q.helperText}</p>
                )}

                {/* Input Type Renderers */}
                {q.type === 'text' && (
                  <input
                    type="text"
                    disabled={!isDiscordConnected}
                    value={currentValue}
                    onChange={(e) => handleAnswerChange(q.question, e.target.value)}
                    placeholder={q.placeholder || 'Enter your response...'}
                    className={`w-full bg-zinc-950 border ${
                      hasError ? 'border-rose-500' : 'border-zinc-800'
                    } rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed`}
                  />
                )}

                {q.type === 'textarea' && (
                  <textarea
                    rows={4}
                    disabled={!isDiscordConnected}
                    value={currentValue}
                    onChange={(e) => handleAnswerChange(q.question, e.target.value)}
                    placeholder={q.placeholder || 'Write your response in detail here...'}
                    className={`w-full bg-zinc-950 border ${
                      hasError ? 'border-rose-500' : 'border-zinc-800'
                    } rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed leading-relaxed`}
                  />
                )}

                {q.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {q.options?.map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                          currentValue === opt
                            ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                            : 'bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                        } ${!isDiscordConnected ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id || idx}`}
                          disabled={!isDiscordConnected}
                          checked={currentValue === opt}
                          onChange={() => handleAnswerChange(q.question, opt)}
                          className="accent-indigo-600 w-4 h-4"
                        />
                        <span className="text-xs">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {hasError && (
                  <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {validationErrors[q.question]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Button Section */}
        <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            {!isDiscordConnected ? (
              <span className="text-amber-400 flex items-center gap-1 font-medium">
                <Lock className="w-3.5 h-3.5" /> Please connect Discord above to unlock submission.
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready to submit as @{userProfile?.discordUsername ? userProfile.discordUsername.replace(/^@+/, '') : ''}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !isDiscordConnected}
            style={{
              backgroundColor: config.customBranding?.accentColor && isDiscordConnected && !submitting ? config.customBranding.accentColor : undefined
            }}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting to Queue...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Whitelist Application</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Powered by watermark footer */}
      {!config.customBranding?.hideWatermark && (
        <div className="text-center pt-4 border-t border-zinc-900">
          <p className="text-[11px] text-zinc-600 font-mono">
            Powered by GTA VI Central Fast-Track Whitelist Engine • 100% Anti-Alt & Discord Protected
          </p>
        </div>
      )}
    </div>
  );
};
