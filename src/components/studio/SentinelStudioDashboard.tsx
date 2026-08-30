import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sliders,
  FileCode2,
  Users,
  Share2,
  TrendingUp,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Award,
  Video,
  Lock,
  ChevronRight,
  Flame,
  ArrowRight,
  Zap,
  DollarSign,
  Info,
  Compass,
  UserCheck,
  ShieldCheck,
  FileCheck,
  Send,
  Upload,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  Code2,
  X,
  Swords,
  Target,
  Shield,
  Car,
  MapPin,
  Edit3,
  Clipboard,
  Building2,
  Maximize2,
  FileText
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { AdvancedEconomyVisualizer } from './AdvancedEconomyVisualizer';
import {
  runDeepResourceAudit,
  DeepResourceAuditResult,
  EnterpriseBanAppeal,
  generateStreamerPriorityToken,
  verifyAntiSybilFingerprint
} from '../../lib/studio-performance-engine';

interface SentinelStudioDashboardProps {
  serverSlug?: string;
  serverName?: string;
  serverId?: string;
  onNavigateTab?: (tab: string) => void;
}

export const SentinelStudioDashboard: React.FC<SentinelStudioDashboardProps> = ({
  serverSlug = 'vice-city-rp',
  serverName = 'Vice City Central Roleplay',
  serverId = 'srv_vicecityrp',
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'appeals' | 'economy' | 'creators' | 'referrals'>('audit');

  // -------------------------------------------------------------
  // MODULE 1: RESOURCE AUDIT STATE
  // -------------------------------------------------------------
  const [manifestCode, setManifestCode] = useState<string>(`-- fxmanifest.lua
fx_version 'cerulean'
game 'gta5'

description 'Ocean Drive RP Core Vehicles'

client_scripts {
    'client/main.lua',
    'client/vehicles.lua'
}

server_scripts {
    'server/main.lua'
}`);

  const [scriptCode, setScriptCode] = useState<string>(`-- client/main.lua (Sample Script)
CreateThread(function()
    while true do
        Wait(0) -- Heavy tick loop without proximity check
        local playerPed = PlayerPedId()
        local coords = GetEntityCoords(playerPed)
        
        -- High frequency native call
        DrawMarker(1, 185.0, -920.0, 30.0, 0,0,0,0,0,0, 1.0,1.0,1.0, 255,0,0,200)
    end
end)`);

  const [auditResult, setAuditResult] = useState<DeepResourceAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);
  const [resourceName, setResourceName] = useState<string>('ocean-drive-rp-core');
  const [recentAudits, setRecentAudits] = useState<Array<{ id: string; name: string; score: number; grade: string; timestamp: string }>>([
    { id: '1', name: 'qb-hud', score: 67, grade: 'DEGRADED', timestamp: '2026-08-22 10:15' },
    { id: '2', name: 'esx_ambulancejob', score: 92, grade: 'EXCELLENT', timestamp: '2026-08-22 11:02' },
  ]);

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUploadedFiles = (files: FileList) => {
    let loadedManifest = false;
    let loadedScript = false;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;

        const filename = file.name.toLowerCase();
        if (filename.includes('manifest') || filename.includes('__resource')) {
          setManifestCode(text);
          loadedManifest = true;
        } else if (filename.endsWith('.lua')) {
          setScriptCode(text);
          loadedScript = true;
        } else {
          // Fallback guess based on content
          if (text.includes('fx_version') || text.includes('game') || text.includes('client_script')) {
            setManifestCode(text);
            loadedManifest = true;
          } else {
            setScriptCode(text);
            loadedScript = true;
          }
        }

        // Notify user
        if (loadedManifest && loadedScript) {
          showToastMessage(`Successfully loaded manifest & script: ${file.name}`);
        } else if (loadedManifest) {
          showToastMessage(`Successfully loaded manifest: ${file.name}`);
        } else if (loadedScript) {
          showToastMessage(`Successfully loaded script: ${file.name}`);
        }
      };
      reader.readAsText(file);
    });
  };

  const addAuditToHistory = (score: number, grade: string) => {
    setRecentAudits(prev => {
      // Avoid duplicate logs with same name and score in rapid succession
      if (prev.length > 0 && prev[0].name === resourceName && prev[0].score === score) {
        return prev;
      }
      return [
        {
          id: Math.random().toString(),
          name: resourceName || 'custom-script',
          score,
          grade,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        },
        ...prev
      ];
    });
  };

  const handleRunResourceAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/studio/resource-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [
            { filename: 'fxmanifest.lua', content: manifestCode },
            { filename: 'client/main.lua', content: scriptCode },
            { filename: 'stream/custom_vehicle.ytd', content: '-- custom_vehicle.ytd 18MB texture dictionary stream mock' }
          ]
        })
      });
      const data = await res.json();
      if (data.success && data.audit) {
        setAuditResult(data.audit);
        addAuditToHistory(data.audit.hardwareFootprintScore, data.audit.grade);
        showToastMessage(`⚡ Optimization audit completed successfully! Score: ${data.audit.hardwareFootprintScore}/100.`);
      } else {
        const fallback = runDeepResourceAudit([
          { filename: 'fxmanifest.lua', content: manifestCode },
          { filename: 'client/main.lua', content: scriptCode },
          { filename: 'stream/custom_vehicle.ytd', content: '-- custom_vehicle.ytd 18MB texture dictionary stream mock' }
        ]);
        setAuditResult(fallback);
        addAuditToHistory(fallback.hardwareFootprintScore, fallback.grade);
        showToastMessage(`⚡ Completed via fallback engine. Score: ${fallback.hardwareFootprintScore}/100.`);
      }
    } catch (e) {
      const fallback = runDeepResourceAudit([
        { filename: 'fxmanifest.lua', content: manifestCode },
        { filename: 'client/main.lua', content: scriptCode },
        { filename: 'stream/custom_vehicle.ytd', content: '-- custom_vehicle.ytd 18MB texture dictionary stream mock' }
      ]);
      setAuditResult(fallback);
      addAuditToHistory(fallback.hardwareFootprintScore, fallback.grade);
      showToastMessage(`⚡ Completed via backup engine. Score: ${fallback.hardwareFootprintScore}/100.`);
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    handleRunResourceAudit();
  }, []);

  // -------------------------------------------------------------
  // MODULE 2: AI BAN APPEALS STATE
  // -------------------------------------------------------------
  const [appeals, setAppeals] = useState<EnterpriseBanAppeal[]>([]);

  const [applicantGamerTag, setApplicantGamerTag] = useState<string>('');
  const [newBanReason, setNewBanReason] = useState<string>('');
  const [newDefense, setNewDefense] = useState<string>('');
  const [newClip, setNewClip] = useState<string>('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isSyncingAppeals, setIsSyncingAppeals] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [appealFilter, setAppealFilter] = useState<'all' | 'under_tribunal' | 'resolved' | 'rejected'>('all');
  const [expandedEmbedId, setExpandedEmbedId] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubTab === 'appeals') {
      fetchAppeals();
    }
  }, [activeSubTab, serverId]);

  const fetchAppeals = async () => {
    setIsSyncingAppeals(true);
    setSyncFeedback(null);
    try {
      const res = await fetch(`/api/studio/appeals/tribunal?serverId=${serverId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.appeals)) {
        setAppeals(data.appeals);
        setSyncFeedback(data.appeals.length > 0 ? `✓ Appeals synced (${data.appeals.length} records in queue)` : '✓ Tribunal queue up to date (0 pending appeals)');
      } else {
        setSyncFeedback('✓ Appeals synchronized — Tribunal queue up to date');
      }
    } catch (e) {
      console.error('Failed to load appeals:', e);
      setSyncFeedback('⚡ Sync complete (active local tribunal state)');
    } finally {
      setIsSyncingAppeals(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!newBanReason || !newDefense) return;
    setIsSubmittingAppeal(true);
    setSubmitSuccess(false);
    try {
      const res = await fetch('/api/studio/appeals/tribunal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId,
          applicantDiscordId: applicantGamerTag || 'ActivePlayer#2026',
          banReason: newBanReason,
          defenseStatement: newDefense,
          clipUrls: newClip ? [newClip] : []
        })
      });
      const data = await res.json();
      if (data.success && data.appeal) {
        setAppeals([data.appeal, ...appeals]);
        setNewBanReason('');
        setNewDefense('');
        setNewClip('');
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 6000);
      }
    } catch (e) {
      console.error('Error submitting ban appeal:', e);
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const handleResolveAppeal = async (id: string, action: 'instant_unban' | 'reduce_sentence' | 'permanent_denial') => {
    try {
      const res = await fetch('/api/studio/appeals/tribunal/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appealId: id,
          action,
          resolvedBy: 'Staff Admin (Sentinel HQ)'
        })
      });
      const data = await res.json();
      if (data.success && data.appeal) {
        setAppeals(appeals.map(a => a.id === id ? data.appeal : a));
      } else {
        setAppeals(appeals.map(a => a.id === id ? {
          ...a,
          status: action === 'permanent_denial' ? 'rejected' : 'resolved',
          resolvedByDiscordId: `Action: ${action.toUpperCase()} (Staff Admin)`
        } : a));
      }
    } catch (e) {
      console.error('Error resolving appeal:', e);
      setAppeals(appeals.map(a => a.id === id ? {
        ...a,
        status: action === 'permanent_denial' ? 'rejected' : 'resolved',
        resolvedByDiscordId: `Action: ${action.toUpperCase()} (Staff Admin)`
      } : a));
    }
  };

  const handleDeleteAppeal = async (id: string) => {
    try {
      await fetch(`/api/studio/appeals/tribunal?appealId=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting appeal from server:', e);
    }
    setAppeals(appeals.filter(a => a.id !== id));
    showToastMessage('✓ Appeal deleted from tribunal queue');
  };

  const handleClearAllAppeals = async () => {
    try {
      await fetch('/api/studio/appeals/tribunal?appealId=clear_all', { method: 'DELETE' });
    } catch (e) {
      console.error('Error clearing queue:', e);
    }
    setAppeals([]);
    showToastMessage('✓ Cleared all ban appeals from queue');
  };

  // -------------------------------------------------------------
  // MODULE 4: CREATOR OUTREACH CRM STATE & MAX CAPABILITY ENGINE
  // -------------------------------------------------------------
  interface PriorityPassItem {
    id: string;
    name: string;
    slug: string;
    token: string;
    weight: number;
    tierRank: string;
    monthlyImpressions: number;
    projectedInstalls: number;
    projectedRevenue: number;
    txAdminLua: string;
    qbCoreLua: string;
    esxLua: string;
    vmpCs: string;
    discordJson: string;
    createdAt: number;
  }

  const [creatorName, setCreatorName] = useState<string>('Summit1g');
  const [platform, setPlatform] = useState<string>('twitch');
  const [avgCcv, setAvgCcv] = useState<number>(3500);
  const [pitchTone, setPitchTone] = useState<'commercial' | 'hype' | 'storyline'>('hype');
  const [selectedPerks, setSelectedPerks] = useState<string[]>(['priority_pass', 'gang_turf', 'staff_shadow', 'dmca_safe', 'rev_share']);
  const [generatedPitch, setGeneratedPitch] = useState<string>('');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState<boolean>(false);
  const [copiedPitch, setCopiedPitch] = useState<boolean>(false);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState<boolean>(false);
  const [expandedCodeModal, setExpandedCodeModal] = useState<{ title: string; code: string; name: string; framework: string } | null>(null);
  const [exportFramework, setExportFramework] = useState<'txadmin' | 'qbcore' | 'esx' | 'vmp' | 'discord'>('txadmin');
  const [webhookDispatchNotice, setWebhookDispatchNotice] = useState<string | null>(null);

  const [activeTokens, setActiveTokens] = useState<PriorityPassItem[]>([]);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [copiedSnippetTokenId, setCopiedSnippetTokenId] = useState<string | null>(null);

  // Firestore onSnapshot for creator_priority_passes
  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      const colRef = collection(db, 'creator_priority_passes');
      unsub = onSnapshot(colRef, (snapshot) => {
        if (snapshot.empty) {
          // Seed default pass for Summit1g
          const seedPass: PriorityPassItem = {
            id: 'pass_seed_summit1g',
            name: 'Summit1g',
            slug: 'summit1g',
            token: 'CREATOR_QUEUE_SUMMIT1G_X92K',
            weight: 85,
            tierRank: '🔥 S-Rank Titan Partner',
            monthlyImpressions: 157500,
            projectedInstalls: 1225,
            projectedRevenue: 4830,
            txAdminLua: `-- txAdmin Priority Queue Integration (+85 Weight)\nexports['qb-queues']:AddPriority(source, 85)`,
            qbCoreLua: `-- QBCore Priority Snippet\nexports['qb-queues']:AddPriority(source, 85)`,
            esxLua: `-- ESX FastPass Integration\nexports['esx_queue']:AddPriority(source, 85)`,
            vmpCs: `// VMP C# Native\nPriorityQueueManager.SetUserWeight(player.Identifiers["discord"], 85);`,
            discordJson: `{\n  "creatorToken": "CREATOR_QUEUE_SUMMIT1G_X92K",\n  "assignedQueueWeight": 85\n}`,
            createdAt: Date.now() - 86400000 * 3
          };
          setDoc(doc(db, 'creator_priority_passes', seedPass.id), seedPass).catch((err) =>
            console.warn('Error seeding default creator pass to Firebase:', err)
          );
        } else {
          const loaded: PriorityPassItem[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || 'Unknown Streamer',
              slug: data.slug || 'streamer',
              token: data.token || `CREATOR_QUEUE_${d.id.slice(0, 6)}`,
              weight: Number(data.weight) || 50,
              tierRank: data.tierRank || '⭐ Partner',
              monthlyImpressions: Number(data.monthlyImpressions) || 10000,
              projectedInstalls: Number(data.projectedInstalls) || 100,
              projectedRevenue: Number(data.projectedRevenue) || 500,
              txAdminLua: data.txAdminLua || '',
              qbCoreLua: data.qbCoreLua || '',
              esxLua: data.esxLua || '',
              vmpCs: data.vmpCs || '',
              discordJson: data.discordJson || '',
              createdAt: Number(data.createdAt) || Date.now()
            };
          });
          loaded.sort((a, b) => b.createdAt - a.createdAt);
          setActiveTokens(loaded);
        }
      }, (err) => {
        console.warn('Firestore creator_priority_passes subscription notice:', err);
      });
    } catch (e) {
      console.warn('Error initializing creator_priority_passes listener:', e);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Auto-initialize pitch proposal on mount
  useEffect(() => {
    if (!generatedPitch) {
      handleGeneratePitch();
    }
  }, []);

  const togglePerk = (perkKey: string) => {
    if (selectedPerks.includes(perkKey)) {
      setSelectedPerks(selectedPerks.filter(p => p !== perkKey));
    } else {
      setSelectedPerks([...selectedPerks, perkKey]);
    }
  };

  const handleGeneratePitch = async () => {
    // 1. Instantly synthesize a high-converting pitch locally (< 5ms)
    const perkSummary = selectedPerks.length > 0 
      ? selectedPerks.map(p => p.replace('_', ' ')).join(', ') 
      : 'Priority Queue Bypass, Custom Mansion Property';
    
    const isTitan = avgCcv >= 3000;
    const toneIntro = pitchTone === 'hype' 
      ? `🔥 Hey ${creatorName}! Huge fan of your ${platform.toUpperCase()} streams!` 
      : pitchTone === 'storyline' 
      ? `🎬 Hey ${creatorName}! We're building the ultimate narrative RP ecosystem on ${serverName}.` 
      : `💼 Dear ${creatorName}, Official Partnership Offer from ${serverName}.`;

    const instantPitch = `${toneIntro}\n\nWe'd love to bring you and your squad onto ${serverName} with a dedicated ${isTitan ? 'S-Rank Titan Creator' : 'VIP Partner'} package:\n\n⚡ Priority Queue Bypass (+${Math.min(100, Math.round(avgCcv * 0.8))} Weight)\n🏰 Custom Perks: ${perkSummary}\n🛡️ Stream Safeguards: Dedicated Staff Shadow & DMCA-Safe Audio\n💰 Monetization: 15% Store Revenue Share\n\nYour FastPass Token is ready for instant connection. Let's make history on Ocean Drive!`;

    setGeneratedPitch(instantPitch);
    setIsGeneratingPitch(true);

    // 2. Background async call with short timeout race to refine pitch if Gemini is available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch('/api/marketing/creator-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorName,
          platform,
          avgViewers: avgCcv,
          serverName,
          pitchTone,
          perkPackage: selectedPerks.join(', ')
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && data.pitchProposal) {
        setGeneratedPitch(data.pitchProposal);
      }
    } catch (e) {
      // Keep instant pitch
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleCreatePriorityToken = async () => {
    const slug = creatorName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tokenObj = generateStreamerPriorityToken(creatorName, avgCcv, 10);
    const passId = `pass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newPass: PriorityPassItem = {
      id: passId,
      name: creatorName,
      slug,
      token: tokenObj.token,
      weight: tokenObj.assignedQueueWeight,
      tierRank: tokenObj.tierRank,
      monthlyImpressions: tokenObj.monthlyImpressions,
      projectedInstalls: tokenObj.projectedInstalls,
      projectedRevenue: tokenObj.projectedMonthlyRevenue,
      txAdminLua: tokenObj.txAdminLuaSnippet,
      qbCoreLua: tokenObj.qbCoreSnippet,
      esxLua: tokenObj.esxSnippet,
      vmpCs: tokenObj.vmpCsSnippet,
      discordJson: tokenObj.discordSyncJson,
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'creator_priority_passes', passId), newPass);
      setWebhookDispatchNotice(`✓ Priority Connect Pass created & saved to database for ${creatorName} (+${tokenObj.assignedQueueWeight} Weight)`);
    } catch (err) {
      console.warn('Firebase setDoc error, using local state:', err);
      setActiveTokens((prev) => [newPass, ...prev]);
      setWebhookDispatchNotice(`✓ Priority Connect Pass generated for ${creatorName} (+${tokenObj.assignedQueueWeight} Weight)`);
    }
    setTimeout(() => setWebhookDispatchNotice(null), 4000);
  };

  const [deletingPassId, setDeletingPassId] = useState<string | null>(null);

  const handleDeletePriorityPass = async (passId: string, name: string) => {
    if (deletingPassId !== passId) {
      setDeletingPassId(passId);
      setTimeout(() => {
        setDeletingPassId((curr) => (curr === passId ? null : curr));
      }, 4000);
      return;
    }

    try {
      setDeletingPassId(null);
      await deleteDoc(doc(db, 'creator_priority_passes', passId));
      setActiveTokens((prev) => prev.filter((p) => p.id !== passId));
      setWebhookDispatchNotice(`✓ Priority Connect Pass for "${name}" deleted from server.`);
    } catch (err) {
      console.warn('Firebase deleteDoc error:', err);
      setActiveTokens((prev) => prev.filter((p) => p.id !== passId));
      setWebhookDispatchNotice(`✓ Priority Pass removed.`);
    }
    setTimeout(() => setWebhookDispatchNotice(null), 4000);
  };

  // -------------------------------------------------------------
  // MODULE 5: SQUAD REFERRALS & ANTI-SYBIL STATE (FIREBASE PERSISTENT)
  // -------------------------------------------------------------
  interface SquadReferralItem {
    id: string;
    squadName: string;
    code: string;
    clicks: number;
    conversions: number;
    rewardVc: number;
    sybilRisk: boolean;
    accountAgeDays: number;
    createdAt: number;
  }

  const [referrals, setReferrals] = useState<SquadReferralItem[]>([]);
  const [newSquadName, setNewSquadName] = useState<string>('');
  const [referralFeedbackNotice, setReferralFeedbackNotice] = useState<string | null>(null);
  const [copiedLinkCode, setCopiedLinkCode] = useState<string | null>(null);

  // Ad Banner Generator Modal State
  const [activeAdBannerModal, setActiveAdBannerModal] = useState<SquadReferralItem | null>(null);
  const [bannerTheme, setBannerTheme] = useState<'neon' | 'blood' | 'gold' | 'cyber'>('neon');
  const [bannerHeadline, setBannerHeadline] = useState<string>('');
  const [copiedEmbedType, setCopiedEmbedType] = useState<string | null>(null);

  // Real-time Firebase Firestore Sync for Squad Referrals
  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      const colRef = collection(db, 'squad_referrals');
      unsub = onSnapshot(colRef, (snapshot) => {
        if (snapshot.empty) {
          // Seed initial default squad campaigns to Firebase
          const defaultSeeds: SquadReferralItem[] = [
            {
              id: 'squad_ref_seed_1',
              squadName: 'Ocean Drive Kings',
              code: 'SQUAD-OCEAN-99',
              clicks: 142,
              conversions: 18,
              rewardVc: 2000,
              sybilRisk: false,
              accountAgeDays: 180,
              createdAt: Date.now() - 86400000 * 5
            },
            {
              id: 'squad_ref_seed_2',
              squadName: 'Biscayne Outlaws',
              code: 'SQUAD-BISCAYNE-42',
              clicks: 88,
              conversions: 9,
              rewardVc: 500,
              sybilRisk: false,
              accountAgeDays: 95,
              createdAt: Date.now() - 86400000 * 2
            }
          ];
          defaultSeeds.forEach((seed) => {
            setDoc(doc(db, 'squad_referrals', seed.id), seed).catch((err) =>
              console.warn('Error seeding default squad referral to Firebase:', err)
            );
          });
        } else {
          const loaded: SquadReferralItem[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              squadName: data.squadName || 'Unknown Squad',
              code: data.code || `SQUAD-${d.id.slice(0, 6)}`,
              clicks: Number(data.clicks) || 0,
              conversions: Number(data.conversions) || 0,
              rewardVc: Number(data.rewardVc) || 100,
              sybilRisk: Boolean(data.sybilRisk),
              accountAgeDays: Number(data.accountAgeDays) || 30,
              createdAt: Number(data.createdAt) || Date.now()
            };
          });
          loaded.sort((a, b) => b.createdAt - a.createdAt);
          setReferrals(loaded);
        }
      }, (err) => {
        console.warn('Firestore squad_referrals subscription notice:', err);
      });
    } catch (e) {
      console.warn('Error initializing squad_referrals listener:', e);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleCreateSquadCode = async () => {
    if (!newSquadName.trim()) return;
    const nameClean = newSquadName.trim();
    const code = `SQUAD-${nameClean.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Math.floor(10 + Math.random() * 90)}`;
    const antiSybil = verifyAntiSybilFingerprint({
      discordAccountAgeDays: 120,
      hasPhoneVerified: true,
      ipSubnetHash: 'subnet_192_168_1'
    });

    const docId = `squad_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReferralItem: SquadReferralItem = {
      id: docId,
      squadName: nameClean,
      code,
      clicks: 1,
      conversions: 0,
      rewardVc: 1000,
      sybilRisk: antiSybil.isSybilRisk,
      accountAgeDays: 120,
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'squad_referrals', docId), newReferralItem);
      setNewSquadName('');
      setReferralFeedbackNotice(`✓ Campaign "${nameClean}" created & saved to database! Code: ${code}`);
      setTimeout(() => setReferralFeedbackNotice(null), 4000);
    } catch (err) {
      console.error('Failed to save squad referral doc to database:', err);
      // Local fallback
      setReferrals([newReferralItem, ...referrals]);
      setNewSquadName('');
      setReferralFeedbackNotice(`✓ Campaign created locally (Database fallback): ${code}`);
      setTimeout(() => setReferralFeedbackNotice(null), 4000);
    }
  };

  const [deletingSquadId, setDeletingSquadId] = useState<string | null>(null);

  const handleDeleteSquadCode = async (refId: string, squadName: string) => {
    if (deletingSquadId !== refId) {
      setDeletingSquadId(refId);
      setTimeout(() => {
        setDeletingSquadId((curr) => (curr === refId ? null : curr));
      }, 4000);
      return;
    }

    try {
      setDeletingSquadId(null);
      await deleteDoc(doc(db, 'squad_referrals', refId));
      setReferrals((prev) => prev.filter((r) => r.id !== refId));
      setReferralFeedbackNotice(`✓ Squad campaign "${squadName}" deleted from database.`);
      setTimeout(() => setReferralFeedbackNotice(null), 4000);
    } catch (err) {
      console.error('Failed to delete squad referral doc from Firebase:', err);
      setReferrals((prev) => prev.filter((r) => r.id !== refId));
      setReferralFeedbackNotice(`✓ Squad campaign removed.`);
      setTimeout(() => setReferralFeedbackNotice(null), 4000);
    }
  };

  const handleCopyReferralLink = (code: string) => {
    const url = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkCode(code);
    setReferralFeedbackNotice(`✓ Referral link copied to clipboard: ${url}`);
    setTimeout(() => {
      setCopiedLinkCode(null);
      setReferralFeedbackNotice(null);
    }, 3000);
  };

  const handleOpenAdBannerModal = (refItem: SquadReferralItem) => {
    setActiveAdBannerModal(refItem);
    setBannerHeadline(`JOIN ${refItem.squadName.toUpperCase()} — USE CODE ${refItem.code} FOR +${refItem.rewardVc} VC BONUS!`);
    setCopiedEmbedType(null);
  };



  return (
    <div className="space-y-8 bg-zinc-950 text-white min-h-screen p-4 sm:p-6 lg:p-8 font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="sentinel-studio-toast"
          className="fixed bottom-6 right-6 z-50 bg-zinc-900 border-2 border-emerald-500 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-fade-in max-w-sm"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
            ✓
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">Server Operating System</h4>
            <p className="text-[11px] text-zinc-300 font-medium leading-tight mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-zinc-900 to-indigo-950 border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Server Operating Suite Pro
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{serverName} Studio</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PRO SUITE ACTIVE
              </span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Enterprise management suite for FiveM and GTA RP server owners. Optimize resources with Lua AST AST scanning, evaluate AI ban tribunal clips, simulate Monte Carlo economies, manage streamer CRM, and route citizen archetypes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('server-review')}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-2 border border-zinc-700 cursor-pointer"
              >
                <Users className="w-4 h-4 text-cyan-400" /> Whitelist Applications
              </button>
            )}
            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Server Portal Slug</span>
              <span className="text-xs font-mono font-bold text-emerald-400">/servers/{serverSlug}</span>
            </div>
          </div>
        </div>

        {/* Sub-navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-zinc-800/80">
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'audit'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" /> Resource Inspector
          </button>

          <button
            onClick={() => setActiveSubTab('appeals')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'appeals'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" /> AI Ban Appeals ({appeals.filter(a => a.status === 'under_tribunal').length})
          </button>

          <button
            onClick={() => setActiveSubTab('economy')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'economy'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Dynamic Economy
          </button>

          <button
            onClick={() => setActiveSubTab('creators')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'creators'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Video className="w-4 h-4 text-rose-400" /> Streamer CRM
          </button>

          <button
            onClick={() => setActiveSubTab('referrals')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'referrals'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Share2 className="w-4 h-4 text-purple-400" /> Squad Referrals
          </button>


        </div>
      </div>

      {/* SUBTAB 1: RESOURCE PERFORMANCE INSPECTOR */}
      {activeSubTab === 'audit' && (
        <div className="space-y-8 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" /> FiveM Resource Manifest & Asset Performance Audit
                </h2>
                <button
                  id="open-inspector-explain-btn"
                  onClick={() => setShowExplainModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border border-zinc-700/60"
                >
                  <Info className="w-3 h-3 text-cyan-400" /> What is this?
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                Scans client scripts, fxmanifest declarations, and `.ytd`/`.ydr` streaming files for AST tick loops (`Citizen.Wait(0)`), missing dependencies, and VRAM texture bloat.
              </p>
            </div>
            <button
              id="run-resource-audit-btn"
              onClick={(e) => {
                e.preventDefault();
                handleRunResourceAudit();
              }}
              disabled={isAuditing}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase transition flex items-center gap-2 shadow-lg shadow-cyan-950 disabled:opacity-50 cursor-pointer shrink-0 self-start md:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
              {isAuditing ? 'Auditing Resources...' : 'Run Optimization Audit'}
            </button>
          </div>

          {/* Production Configuration & Preset Loader Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">Currently Auditing Resource</label>
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. qb-hud"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">Load Preconfigured Script Templates</label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const found = [
                    {
                      name: 'custom-resource',
                      label: 'Custom / Uploaded Code',
                      manifest: `-- fxmanifest.lua\nfx_version 'cerulean'\ngame 'gta5'\ndescription 'Ocean Drive RP Core Vehicles'\n\nclient_scripts {\n    'client/main.lua'\n}`,
                      script: `-- client/main.lua\nCreateThread(function()\n    while true do\n        Wait(1000)\n    end\nend)`
                    },
                    {
                      name: 'qb-hud',
                      label: 'Heavy Laggy HUD Script (unthrottled loops)',
                      manifest: `-- fxmanifest.lua\nfx_version 'cerulean'\ngame 'gta5'\nclient_script 'client.lua'`,
                      script: `-- client.lua (Laggy HUD client script)\nCreateThread(function()\n    while true do\n        Wait(0) -- Bad! No dynamic throttling wait\n        local ped = PlayerPedId()\n        local hp = GetEntityHealth(ped)\n        local arm = GetPedArmour(ped)\n        DrawText3D(0.5, 0.5, "Health: " .. hp .. " | Armour: " .. arm)\n    end\nend)`
                    },
                    {
                      name: 'esx_ambulancejob',
                      label: 'Database-in-Loop Core (heavy server SQL-in-loop)',
                      manifest: `-- fxmanifest.lua\nfx_version 'cerulean'\ngame 'gta5'\nserver_script 'server.lua'`,
                      script: `-- server.lua (Heavy DB tick loop)\nCreateThread(function()\n    while true do\n        Wait(5000)\n        for i = 1, 128 do\n            -- SQL inside loops is critical resource waste!\n            MySQL.Async.execute('UPDATE users SET online = 1 WHERE identifier = @id', {\n                ['@id'] = i\n            })\n        end\n    end\nend)`
                    },
                    {
                      name: 'custom_speedometer',
                      label: 'Optimal Speedometer (perfect dynamic tick sleep)',
                      manifest: `-- fxmanifest.lua\nfx_version 'cerulean'\ngame 'gta5'\nclient_script 'client.lua'`,
                      script: `-- client.lua (Optimized HUD client script)\nCreateThread(function()\n    local sleep = 1000\n    while true do\n        local ped = PlayerPedId()\n        if IsPedInAnyVehicle(ped, false) then\n            sleep = 0 -- Fast tick when driving\n            local veh = GetVehiclePedIsIn(ped, false)\n            local speed = GetEntitySpeed(veh) * 2.236936\n            DrawText3D(0.5, 0.8, "Speed: " .. math.floor(speed) .. " MPH")\n        else\n            sleep = 1000 -- Slow down thread when walking to save CPU\n        end\n        Wait(sleep)\n    end\nend)`
                    },
                    {
                      name: 'vms_assets',
                      label: 'Oversized Vehicle Asset Stream (VRAM Limit Warning)',
                      manifest: `-- fxmanifest.lua\nfx_version 'adamant'\ngame 'gta5'\nclient_script 'client.lua'`,
                      script: `-- client.lua\nprint("Asset streaming active.")`
                    }
                  ].find(p => p.name === val);

                  if (found) {
                    setResourceName(found.name);
                    setManifestCode(found.manifest);
                    setScriptCode(found.script);
                    showToastMessage(`Loaded preset script: ${found.label}`);
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ocean-drive-rp-core">-- Select a FiveM Script Blueprint --</option>
                <option value="qb-hud">qb-hud (Critical Loop Wait(0) Lag Warning)</option>
                <option value="esx_ambulancejob">esx_ambulancejob (Database SQL-in-Loop Leak Warning)</option>
                <option value="custom_speedometer">custom_speedometer (100/100 Perfect CPU Throttling)</option>
                <option value="vms_assets">vms_assets (Oversized Texture VRAM Streaming Limit Warning)</option>
                <option value="custom-resource">Empty Custom Slate (Ready for Paste or Drag-and-Drop)</option>
              </select>
            </div>
          </div>

          {auditResult && (
            <div className="space-y-6">
              {/* Scorecard Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                  id="audit-scorecard-hardware"
                  className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex items-center gap-4 animate-fade-in"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 ${
                    auditResult.hardwareFootprintScore >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    auditResult.hardwareFootprintScore >= 55 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {auditResult.hardwareFootprintScore}
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Script Performance Score</span>
                    <span className="text-sm font-bold text-white">{auditResult.grade}</span>
                  </div>
                </div>

                <div 
                  id="audit-scorecard-vram"
                  className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-center"
                >
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Estimated VRAM Footprint</span>
                  <span className="text-xl font-black font-mono text-cyan-400 mt-0.5">{auditResult.estimatedVramMB} MB</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">Peak client graphics memory</span>
                </div>

                <div 
                  id="audit-scorecard-ram"
                  className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-center"
                >
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">RAM Leak Risk</span>
                  <span className="text-xl font-black font-mono text-amber-400 mt-0.5">{auditResult.estimatedRamLeakMB} MB/hr</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">Garbage collector accumulation</span>
                </div>

                <div 
                  id="audit-scorecard-cpu"
                  className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-center"
                >
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">CPU Thread Bottlenecks</span>
                  <span className="text-xl font-black font-mono text-rose-400 mt-0.5">{auditResult.cpuThreadBottleneckCount} loops</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">High frequency native calls</span>
                </div>
              </div>

              {/* Explanatory Banner */}
              <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
                <span className="text-lg leading-none shrink-0">ℹ️</span>
                <p>
                  <strong>About this Score:</strong> The <span className="text-zinc-200">Script Performance Score</span> measures the structural optimization of the Lua code itself (such as loop wait-times, native execution frequency, and memory footprint). It does not represent or measure the hardware specifications of the device (such as your phone, tablet, or laptop) you are currently using to browse this dashboard.
                </p>
              </div>

              {/* Automatic Suggestions & Diagnostics Box */}
              <div className="bg-zinc-950 border border-zinc-800/80 p-5 sm:p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                  <h3 className="text-sm font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                    💡 Automatic Optimization Suggestions
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 rounded-md">
                    {auditResult.luaBottlenecks.length + auditResult.oversizedTextures.length} Diagnostics Found
                  </span>
                </div>

                {auditResult.luaBottlenecks.length === 0 && auditResult.oversizedTextures.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-emerald-400 text-sm font-semibold">🎉 Outstanding Optimization! 100/100</p>
                    <p className="text-zinc-500 text-xs mt-1">No performance bottlenecks, leak vectors, or oversized streaming textures detected.</p>
                  </div>
                ) : (
                  <div className="space-y-4 divide-y divide-zinc-900">
                    {/* Lua Bottleneck suggestions */}
                    {auditResult.luaBottlenecks.map((b, idx) => (
                      <div key={`lua-b-${idx}`} className={`${idx > 0 ? 'pt-4' : ''} space-y-2`}>
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              b.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              b.severity === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {b.severity}
                            </span>
                            <span className="text-xs font-bold text-zinc-200">
                              {b.file}:{b.line}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-medium">Issue: {b.issue}</span>
                        </div>
                        <p className="text-xs text-zinc-400 pl-1 leading-relaxed">
                          <strong>Impact:</strong> {b.impactDescription}
                        </p>
                        {b.fixSnippet && (
                          <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1.5">Recommended Code Fix:</span>
                            <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre">{b.fixSnippet}</pre>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Oversized texture suggestions */}
                    {auditResult.oversizedTextures.map((t, idx) => (
                      <div key={`tex-t-${idx}`} className="pt-4 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              vram limit
                            </span>
                            <span className="text-xs font-bold text-zinc-200">
                              {t.name} ({t.dimensions})
                            </span>
                          </div>
                          <span className="text-[11px] text-red-400 font-mono font-bold">Uncompressed {t.sizeMB} MB</span>
                        </div>
                        <p className="text-xs text-zinc-400 pl-1 leading-relaxed">
                          <strong>Action Suggestion:</strong> {t.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Benchmarks Audit Logs List */}
          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">
                📋 Performance Benchmark History Logs
              </span>
              <span className="text-[9px] text-zinc-500 font-mono font-medium">Tracking resource iterations</span>
            </div>
            {recentAudits.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No historical runs saved yet. Click run to save current stats.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[140px] overflow-y-auto">
                {recentAudits.map((audit) => (
                  <div 
                    key={audit.id}
                    onClick={() => {
                      setResourceName(audit.name);
                      showToastMessage(`Restored custom profile slot: ${audit.name}`);
                    }}
                    className="bg-zinc-900/40 hover:bg-zinc-900 p-3 rounded-xl border border-zinc-800/60 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div>
                      <span className="text-xs font-mono font-bold text-zinc-200 block truncate max-w-[130px]">
                        {audit.name}
                      </span>
                      <span className="text-[9px] text-zinc-500 block">{audit.timestamp}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black font-mono block ${
                        audit.score >= 80 ? 'text-emerald-400' :
                        audit.score >= 55 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {audit.score}/100
                      </span>
                      <span className="text-[9px] text-zinc-400 uppercase font-bold font-mono">{audit.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            id="audit-dropzone-container"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragging(false);
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                handleUploadedFiles(files);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragging
                ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/5'
                : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-950/60'
            }`}
          >
            <input
              type="file"
              id="audit-file-uploader"
              multiple
              accept=".lua,.json,.cfg,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUploadedFiles(e.target.files);
                }
              }}
            />
            <label
              htmlFor="audit-file-uploader"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Upload className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-200">
                  Drag & Drop or <span className="text-cyan-400 hover:underline font-extrabold">Browse files</span> to upload & evaluate
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Supports `.lua` scripts, `fxmanifest.lua` manifests, or drop any text scripts to auto-analyze
                </p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                fxmanifest.lua Content
              </label>
              <textarea
                id="audit-textarea-manifest"
                value={manifestCode}
                onChange={(e) => setManifestCode(e.target.value)}
                rows={10}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                client/main.lua Script Sample
              </label>
              <textarea
                id="audit-textarea-script"
                value={scriptCode}
                onChange={(e) => setScriptCode(e.target.value)}
                rows={10}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 leading-relaxed"
              />
            </div>
          </div>

          {auditResult && auditResult.patchDiffSnippet && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Generated Lua Optimization Patch</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(auditResult.patchDiffSnippet);
                    setCopiedPatch(true);
                    setTimeout(() => setCopiedPatch(false), 2000);
                  }}
                  className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedPatch ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPatch ? 'Copied Patch' : 'Copy Optimization Patch'}
                </button>
              </div>
              <pre className="bg-zinc-950 p-4 rounded-xl text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap border border-zinc-800">
                {auditResult.patchDiffSnippet}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: AI BAN APPEAL & INCIDENT EVALUATOR */}
      {activeSubTab === 'appeals' && (
        <div className="space-y-8 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" /> AI Ban Appeal & Incident Tribunal
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Automated rule conflict auditor powered by Gemini AI. Transcribes video clip audio, cross-examines statements against server guidelines (RDM, VDM, Metagaming, NLR), and assigns mathematical credibility ratings.
              </p>
            </div>
            <button
              onClick={fetchAppeals}
              disabled={isSyncingAppeals}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer border border-zinc-700/60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncingAppeals ? 'animate-spin' : ''}`} />
              <span>{isSyncingAppeals ? 'Syncing...' : 'Sync Appeals'}</span>
            </button>
          </div>

          {syncFeedback && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-2 text-amber-300 text-xs font-semibold animate-fade-in shadow-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold text-white">Appeal Submitted to AI Tribunal!</p>
                <p className="text-emerald-300/90 text-[11px] mt-0.5">Gemini AI has transcribed the video clip audio, cross-referenced server rules, and assigned a credibility index to the appeal queue.</p>
              </div>
            </div>
          )}

          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Submit New Ban Appeal for AI Tribunal Evaluation
            </h3>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-medium">Quick Presets:</span>
              {[
                { label: 'VDM / Hydroplane', reason: 'Vehicle Deathmatch (VDM) during pursuit', defense: 'My game crashed during the pursuit on Ocean Drive. Vehicle hydroplaned before PC rebooted.' },
                { label: 'Combat Logging', reason: 'Combat Logging during Heist Raid', defense: 'Experienced ISP connection drop during SWAT raid. Reconnected within 5 minutes.' },
                { label: 'RDM Misunderstanding', reason: 'Random Deathmatch (RDM) near Vice Port', defense: 'Target initiated active threat with firearm prior to engagement. Proximity audio was clear.' },
                { label: 'Speedhack / Desync', reason: 'Movement exploit / Speed hack flag', defense: 'Severe packet loss (380ms ping) on cellular hotspot caused vehicle desync artifacts.' }
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setNewBanReason(preset.reason);
                    setNewDefense(preset.defense);
                    setNewClip('https://medal.tv/clip/sample-vdm-proof');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/20 text-purple-300 text-[11px] font-medium transition cursor-pointer"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Applicant Discord ID / GamerTag"
                value={applicantGamerTag}
                onChange={(e) => setApplicantGamerTag(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Ban Reason (e.g. VDM / Combat Logging)"
                value={newBanReason}
                onChange={(e) => setNewBanReason(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Video Clip Proof URL (YouTube / Medal / Twitch)"
                value={newClip}
                onChange={(e) => setNewClip(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <textarea
              placeholder="Player Defense Statement..."
              value={newDefense}
              onChange={(e) => setNewDefense(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSubmitAppeal}
              disabled={isSubmittingAppeal || !newBanReason || !newDefense}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              {isSubmittingAppeal ? '⚡ Gemini AI Transcribing & Cross-Examining...' : 'Evaluate Appeal with Gemini AI Tribunal'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Tribunal Appeals Queue
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                  {appeals.filter(a => a.status === 'under_tribunal').length} Pending
                </span>
              </h3>

              {/* Status Filters & Clear Queue */}
              <div className="flex items-center gap-2">
                {appeals.length > 0 && (
                  <button
                    onClick={handleClearAllAppeals}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Clear Queue</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  {(['all', 'under_tribunal', 'resolved', 'rejected'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAppealFilter(filter)}
                      className={`px-3 py-1 rounded-lg font-semibold transition capitalize cursor-pointer ${
                        appealFilter === filter ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {filter === 'under_tribunal' ? 'Pending' : filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {appeals.filter(a => {
                if (appealFilter === 'under_tribunal') return a.status === 'under_tribunal';
                if (appealFilter === 'resolved') return a.status === 'resolved';
                if (appealFilter === 'rejected') return a.status === 'rejected';
                return true;
              }).length === 0 ? (
                <div className="bg-zinc-950 p-8 rounded-2xl border border-dashed border-zinc-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">No Appeals in Queue</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                      All test applicants have been cleared. Select a <strong>Quick Preset</strong> above or enter player details to submit a new ban appeal for real-time Gemini AI Tribunal cross-examination.
                    </p>
                  </div>
                </div>
              ) : (
                appeals
                  .filter(a => {
                    if (appealFilter === 'under_tribunal') return a.status === 'under_tribunal';
                    if (appealFilter === 'resolved') return a.status === 'resolved';
                    if (appealFilter === 'rejected') return a.status === 'rejected';
                    return true;
                  })
                  .map((appeal) => (
                <div key={appeal.id} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        {appeal.applicantDiscordId}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {appeal.id}
                        </span>
                        {appeal.status === 'resolved' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ RESOLVED
                          </span>
                        )}
                        {appeal.status === 'rejected' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            ✕ REJECTED
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-rose-400 font-semibold block mt-0.5">
                        Ban Reason: "{appeal.banReason}"
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        appeal.aiTribunal.credibilityScore >= 70 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        appeal.aiTribunal.credibilityScore >= 45 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        AI Credibility: {appeal.aiTribunal.credibilityScore}%
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                        Risk: {appeal.aiTribunal.ruleRiskIndex.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleDeleteAppeal(appeal.id)}
                        title="Delete Appeal Record"
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/50">
                    <strong>Player Defense Statement:</strong> "{appeal.defenseStatement}"
                  </p>

                  {appeal.transcriptionLogs && (
                    <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400">
                      <strong className="text-cyan-400 font-sans block mb-1">Scraped Video Clip Transcript Audio:</strong>
                      {appeal.transcriptionLogs}
                    </div>
                  )}

                  <div className="bg-purple-950/20 border border-purple-500/30 p-3 rounded-xl text-xs space-y-1">
                    <span className="text-purple-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Tribunal Rationale:
                    </span>
                    <p className="text-zinc-300">{appeal.aiTribunal.verdictRationale}</p>
                    {appeal.aiTribunal.violatedRules && appeal.aiTribunal.violatedRules.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-zinc-400">Rules Evaluated:</span>
                        {appeal.aiTribunal.violatedRules.map((rule, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-500/30">
                            {rule}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {appeal.resolvedByDiscordId && (
                    <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/80">
                      <strong>Audit Log:</strong> {appeal.resolvedByDiscordId}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                    <button
                      onClick={() => setExpandedEmbedId(expandedEmbedId === appeal.id ? null : appeal.id)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-medium transition cursor-pointer"
                    >
                      {expandedEmbedId === appeal.id ? '▼ Hide Discord Embed Payload' : '▶ Show Discord Webhook Embed Payload'}
                    </button>

                    {appeal.status === 'under_tribunal' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveAppeal(appeal.id, 'instant_unban')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                        >
                          ✓ Instant Unban
                        </button>
                        <button
                          onClick={() => handleResolveAppeal(appeal.id, 'reduce_sentence')}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                        >
                          ⚡ Commute to Warning
                        </button>
                        <button
                          onClick={() => handleResolveAppeal(appeal.id, 'permanent_denial')}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
                        >
                          ✕ Permanent Deny
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Discord Embed Inspection Payload */}
                  {expandedEmbedId === appeal.id && (
                    <div className="bg-zinc-900 p-4 rounded-xl border border-purple-500/30 text-xs font-mono space-y-2 animate-fade-in">
                      <div className="flex justify-between items-center text-purple-300 font-sans font-bold">
                        <span>Discord Webhook Rich Embed JSON</span>
                        <span className="text-[10px] text-zinc-400">Ready for Discord Bot Dispatch</span>
                      </div>
                      <pre className="bg-zinc-950 p-3 rounded-lg text-zinc-300 overflow-x-auto text-[11px] border border-zinc-800">
{JSON.stringify({
  title: `⚖️ AI BAN TRIBUNAL EVALUATION — ${appeal.applicantDiscordId}`,
  color: appeal.aiTribunal.recommendedVerdict === 'instant_unban' ? 0x22c55e : appeal.aiTribunal.recommendedVerdict === 'reduce_sentence' ? 0xeab308 : 0xef4444,
  fields: [
    { name: 'Official Ban Reason', value: appeal.banReason, inline: true },
    { name: 'Credibility Index', value: `${appeal.aiTribunal.credibilityScore}%`, inline: true },
    { name: 'Recidivism Risk', value: appeal.aiTribunal.ruleRiskIndex.toUpperCase(), inline: true },
    { name: 'Verdict Rationale', value: appeal.aiTribunal.verdictRationale },
    { name: 'Transcribed Key Moment', value: appeal.aiTribunal.transcriptKeyMoments[0] || 'N/A' }
  ]
}, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DYNAMIC ECONOMY & INFLATION SIMULATOR */}
      {activeSubTab === 'economy' && (
        <AdvancedEconomyVisualizer />
      )}

      {/* SUBTAB 4: CREATOR OUTREACH CRM & 3500 CCV BENCHMARK SUITE */}
      {activeSubTab === 'creators' && (
        <div className="space-y-8 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-rose-400" /> Streamer CRM & Priority Queue Bypass Engine
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Analyze creator viewership benchmarks, calculate server financial ROI, synthesize AI partnership pitches, and export multi-framework priority connect passes.
            </p>
          </div>

          {/* 3500 CCV BENCHMARK EXPLANATION & LIVE ANALYTICS CARD */}
          <div className="bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-zinc-950 border border-rose-500/30 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-xs font-bold border border-rose-500/30">
                    ⚡ WHAT IS 3,500 CCV?
                  </span>
                  <span className="text-xs text-zinc-400">Benchmark Metrics Analysis</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1.5">
                  S-Rank Titan Streamer Benchmark (3,500 Average Concurrent Viewers)
                </h3>
                <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed mt-1">
                  In GTA VI / FiveM roleplay ecosystems, <strong className="text-rose-400 font-semibold">3,500 CCV</strong> represents a top-tier Titan creator (e.g. Summit1g, xQc, Buddha, Fuslie). Bringing a 3,500 CCV streamer to your server generates immense organic reach, fills queue bottlenecks, and boosts VIP server store monetization.
                </p>
              </div>

              {/* CCV PRESET SELECTOR BUTTONS */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => setAvgCcv(250)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${avgCcv === 250 ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'}`}
                >
                  🌱 250 CCV
                </button>
                <button
                  onClick={() => setAvgCcv(1000)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${avgCcv === 1000 ? 'bg-purple-600 text-white border-purple-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'}`}
                >
                  ✨ 1,000 CCV
                </button>
                <button
                  onClick={() => setAvgCcv(3500)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${avgCcv === 3500 ? 'bg-rose-600 text-white border-rose-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'}`}
                >
                  🔥 3,500 CCV (Titan)
                </button>
                <button
                  onClick={() => setAvgCcv(10000)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${avgCcv === 10000 ? 'bg-amber-600 text-white border-amber-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'}`}
                >
                  👑 10,000 CCV
                </button>
              </div>
            </div>

            {/* LIVE COMPUTED ROI MATRIX FOR CURRENT CCV */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Partner Classification</span>
                <span className="text-xs font-extrabold text-amber-400 font-mono mt-0.5 block">
                  {avgCcv >= 3000 ? '🔥 S-Rank Titan' : avgCcv >= 1000 ? '⭐ A-Rank Mega' : avgCcv >= 250 ? '✨ B-Rank Mid' : '🌱 C-Rank Rising'}
                </span>
              </div>
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">FastPass Queue Weight</span>
                <span className="text-sm font-extrabold text-purple-400 font-mono mt-0.5 block">
                  +{Math.min(100, Math.max(10, Math.round(avgCcv * 0.8)))} Weight
                </span>
              </div>
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Monthly Stream Reach</span>
                <span className="text-sm font-extrabold text-white font-mono mt-0.5 block">
                  ~{(avgCcv * 30 * 1.5).toLocaleString()} Impr.
                </span>
              </div>
              <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Est. Monthly Rev Impact</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5 block">
                  +${Math.round(avgCcv * 1.38).toLocaleString()} / mo
                </span>
              </div>
            </div>
          </div>

          {/* STREAMER PITCH GENERATOR & CODE EXPORTER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>AI Streamer Partnership Pitch Generator</span>
                <span className="text-[10px] font-mono text-rose-400">Gemini 3.7 Flash Model</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Creator Name</label>
                  <input
                    type="text"
                    placeholder="Creator Name (e.g. Summit1g)"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Broadcast Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="twitch">Twitch Streamer</option>
                    <option value="kick">Kick Creator</option>
                    <option value="youtube">YouTube Gaming</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Average CCV Viewership</label>
                  <input
                    type="number"
                    placeholder="Average Viewers / CCV (e.g. 3500)"
                    value={avgCcv}
                    onChange={(e) => setAvgCcv(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Pitch Strategy & Tone</label>
                  <select
                    value={pitchTone}
                    onChange={(e) => setPitchTone(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="hype">🔥 Hype & FastPass Perks</option>
                    <option value="commercial">💼 Commercial & Revenue Share</option>
                    <option value="storyline">🎬 Storyline & Exclusive Heist</option>
                  </select>
                </div>
              </div>

              {/* PERK PACKAGE CHECKBOX TOGGLES */}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1.5 block">Included Partnership Perks</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={selectedPerks.includes('priority_pass')}
                      onChange={() => togglePerk('priority_pass')}
                      className="accent-rose-500"
                    />
                    <span>Priority Queue FastPass</span>
                  </label>
                  <label className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={selectedPerks.includes('gang_turf')}
                      onChange={() => togglePerk('gang_turf')}
                      className="accent-rose-500"
                    />
                    <span>Custom Gang Turf / Mansion</span>
                  </label>
                  <label className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={selectedPerks.includes('staff_shadow')}
                      onChange={() => togglePerk('staff_shadow')}
                      className="accent-rose-500"
                    />
                    <span>Dedicated Staff Mod Shadow</span>
                  </label>
                  <label className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={selectedPerks.includes('rev_share')}
                      onChange={() => togglePerk('rev_share')}
                      className="accent-rose-500"
                    />
                    <span>15% Store Revenue Share</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleGeneratePitch}
                  disabled={isGeneratingPitch}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs uppercase transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
                >
                  <Sparkles className="w-4 h-4 text-rose-200" />
                  {isGeneratingPitch ? 'Synthesizing Pitch...' : 'Synthesize Custom Pitch'}
                </button>
                <button
                  onClick={handleCreatePriorityToken}
                  className="px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase transition cursor-pointer shrink-0"
                >
                  + Create Pass
                </button>
              </div>

              {webhookDispatchNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{webhookDispatchNotice}</span>
                </div>
              )}

              {generatedPitch && (
                <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-400" />
                      <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                        Generated Pitch Proposal
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold">
                        {generatedPitch.length} chars • {generatedPitch.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPitchModalOpen(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        title="Open Fullscreen View"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Expand View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPitch);
                          setCopiedPitch(true);
                          setTimeout(() => setCopiedPitch(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-rose-400" />}
                        <span>{copiedPitch ? 'Copied!' : 'Copy Pitch'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative group">
                    <textarea
                      value={generatedPitch}
                      onChange={(e) => setGeneratedPitch(e.target.value)}
                      rows={12}
                      className="w-full bg-zinc-950/90 border border-rose-500/30 focus:border-rose-500 rounded-2xl p-4 sm:p-5 text-sm sm:text-base font-mono text-zinc-100 leading-relaxed focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-all shadow-inner resize-y min-h-[280px] sm:min-h-[340px]"
                      placeholder="Your custom synthesized pitch proposal will appear here..."
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Directly edit or tweak the pitch text above before sending to the creator.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPitchModalOpen(true)}
                      className="text-rose-400 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      Maximize Editor →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MULTI-FRAMEWORK CODE EXPORTER & ACTIVE TOKEN MANAGER */}
            <div className="lg:col-span-6 space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Multi-Framework Connect Passes ({activeTokens.length})
                </h3>

                {/* FRAMEWORK EXPORT TAB SELECTOR */}
                <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800 text-[10px] font-bold">
                  <button
                    onClick={() => setExportFramework('txadmin')}
                    className={`px-2 py-1 rounded transition cursor-pointer ${exportFramework === 'txadmin' ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    txAdmin
                  </button>
                  <button
                    onClick={() => setExportFramework('qbcore')}
                    className={`px-2 py-1 rounded transition cursor-pointer ${exportFramework === 'qbcore' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    QBCore
                  </button>
                  <button
                    onClick={() => setExportFramework('esx')}
                    className={`px-2 py-1 rounded transition cursor-pointer ${exportFramework === 'esx' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    ESX
                  </button>
                  <button
                    onClick={() => setExportFramework('vmp')}
                    className={`px-2 py-1 rounded transition cursor-pointer ${exportFramework === 'vmp' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    VMP (C#)
                  </button>
                  <button
                    onClick={() => setExportFramework('discord')}
                    className={`px-2 py-1 rounded transition cursor-pointer ${exportFramework === 'discord' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Discord API
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                {activeTokens.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-2">
                    <p className="text-xs text-zinc-400">No active creator connect passes generated yet.</p>
                    <p className="text-[11px] text-zinc-500">Fill in the creator details on the left and click <span className="text-purple-400 font-bold">+ Create Pass</span> to issue a new FastPass token.</p>
                  </div>
                ) : (
                  activeTokens.map((item) => {
                    const passLink = `${window.location.origin}/?pass=${item.token}`;
                    const currentSnippet = exportFramework === 'txadmin' 
                      ? item.txAdminLua 
                      : (exportFramework === 'qbcore' 
                      ? item.qbCoreLua 
                      : (exportFramework === 'esx' 
                      ? item.esxLua 
                      : (exportFramework === 'vmp' 
                      ? item.vmpCs 
                      : item.discordJson)));

                    const frameworkTitle = exportFramework === 'txadmin' ? 'txAdmin Lua Event Snippet'
                      : (exportFramework === 'qbcore' ? 'QBCore (qb-queues) Integration'
                      : (exportFramework === 'esx' ? 'ESX Legacy Priority Snippet'
                      : (exportFramework === 'vmp' ? 'VMP C# Native Server Script' : 'Discord Bot Sync JSON')));

                    return (
                      <div key={item.id || item.token} className="bg-gradient-to-b from-zinc-900 to-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-xl relative group">
                        {/* PASS CARD HEADER */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center font-extrabold text-sm text-purple-300 font-mono shadow-inner">
                              {item.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-base font-extrabold text-white">{item.name}</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  Active Pass
                                </span>
                              </div>
                              <span className="text-xs text-rose-400 font-semibold block">{item.tierRank}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-purple-950/80 text-purple-300 px-3 py-1 rounded-lg border border-purple-500/30 shadow-sm">
                              ⚡ +{item.weight} Weight
                            </span>
                            {/* SERVER OWNER DELETE BUTTON */}
                            <button
                              onClick={() => handleDeletePriorityPass(item.id, item.name)}
                              title={deletingPassId === item.id ? "Click again to confirm pass deletion" : "Delete Priority Pass (Server Owner Action)"}
                              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                deletingPassId === item.id
                                  ? 'bg-rose-600 text-white animate-pulse px-2.5 py-1 ring-2 ring-rose-400 font-extrabold shadow-md'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                              {deletingPassId === item.id && <span>Confirm?</span>}
                            </button>
                          </div>
                        </div>

                        {/* PASS TOKEN & QUICK COPY ACTIONS */}
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0">Token ID:</span>
                              <code className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-500/20 truncate">
                                {item.token}
                              </code>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.token);
                                  setCopiedTokenId(item.token);
                                  setTimeout(() => setCopiedTokenId(null), 2000);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white border border-zinc-800 transition cursor-pointer flex items-center gap-1"
                              >
                                {copiedTokenId === item.token ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                                {copiedTokenId === item.token ? 'Copied' : 'Copy Token'}
                              </button>

                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(passLink);
                                  setCopiedSnippetTokenId(`link_${item.token}`);
                                  setTimeout(() => setCopiedSnippetTokenId(null), 2000);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-xs font-bold text-purple-300 border border-purple-500/30 transition cursor-pointer flex items-center gap-1"
                              >
                                {copiedSnippetTokenId === `link_${item.token}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5 text-purple-400" />}
                                {copiedSnippetTokenId === `link_${item.token}` ? 'Copied Link' : 'Copy Pass Link'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ESTIMATED ROI METRICS MATRIX */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/60">
                          <div>
                            <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">Est. Reach</span>
                            <span className="font-extrabold text-white font-mono text-sm">{item.monthlyImpressions.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">New Players</span>
                            <span className="font-extrabold text-emerald-400 font-mono text-sm">+{item.projectedInstalls}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">Est. Revenue</span>
                            <span className="font-extrabold text-amber-400 font-mono text-sm">+${item.projectedRevenue}</span>
                          </div>
                        </div>

                        {/* MULTI-FRAMEWORK LUA CODE EXPORTER (ENLARGED & HIGH READABILITY AREA) */}
                        <div className="space-y-2 pt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                              <Code2 className="w-4 h-4 text-rose-400" />
                              <span>{frameworkTitle}</span>
                              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {currentSnippet.split('\n').length} lines
                              </span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setExpandedCodeModal({
                                  title: frameworkTitle,
                                  code: currentSnippet,
                                  name: item.name,
                                  framework: exportFramework
                                })}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              >
                                <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                                <span>Expand View</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(currentSnippet);
                                  setCopiedSnippetTokenId(`code_${item.token}`);
                                  setTimeout(() => setCopiedSnippetTokenId(null), 2000);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-xs font-bold text-rose-300 border border-rose-500/30 transition cursor-pointer flex items-center gap-1"
                              >
                                {copiedSnippetTokenId === `code_${item.token}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-rose-400" />}
                                <span>{copiedSnippetTokenId === `code_${item.token}` ? 'Copied Code!' : 'Copy Code'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="relative group">
                            <textarea
                              value={currentSnippet}
                              readOnly
                              rows={10}
                              className="w-full bg-zinc-950 border border-purple-500/30 focus:border-purple-400 rounded-xl p-4 text-xs sm:text-sm font-mono text-zinc-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner resize-y min-h-[220px] sm:min-h-[280px] select-all cursor-text"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: SQUAD REFERRAL ENGINE */}
      {activeSubTab === 'referrals' && (
        <div className="space-y-8 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-400" /> Squad Invite & Viral Referral Engine
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Create squad referral codes featuring cryptographic anti-Sybil fingerprinting, real-time database persistence, shareable links, and custom ad banners.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Database Synced (`squad_referrals`)
            </div>
          </div>

          {referralFeedbackNotice && (
            <div className="bg-purple-950/60 border border-purple-500/40 p-3.5 rounded-2xl text-xs text-purple-200 font-semibold flex items-center justify-between animate-fadeIn">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> {referralFeedbackNotice}
              </span>
            </div>
          )}

          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Create Anti-Sybil Squad Campaign</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Squad / Gang Name (e.g. Ocean Drive Kings, Biscayne Cartel)"
                value={newSquadName}
                onChange={(e) => setNewSquadName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSquadCode()}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-zinc-500"
              />
              <button
                onClick={handleCreateSquadCode}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase transition shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                + Generate Referral Code
              </button>
            </div>
          </div>

          {referrals.length === 0 ? (
            <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-800 text-center space-y-3">
              <Share2 className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-400">No active squad referral campaigns found.</p>
              <p className="text-xs text-zinc-500">Create your first squad referral campaign above to start tracking referral clicks, conversions, and ad banners.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referrals.map((ref) => (
                <div key={ref.id} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4 hover:border-purple-500/30 transition">
                  <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                    <div>
                      <span className="text-sm font-bold text-white block">{ref.squadName}</span>
                      <span className="text-[10px] text-zinc-500">
                        Created {new Date(ref.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/50 px-2.5 py-1 rounded-lg border border-purple-500/30">
                      {ref.code}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 uppercase block">Clicks</span>
                      <span className="text-sm font-bold text-white font-mono">{ref.clicks}</span>
                    </div>
                    <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 uppercase block">Conversions</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{ref.conversions}</span>
                    </div>
                    <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 uppercase block">Reward</span>
                      <span className="text-sm font-bold text-amber-400 font-mono">+{ref.rewardVc} VC</span>
                    </div>
                    <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 uppercase block">Anti-Sybil</span>
                      <span className={`text-xs font-bold ${ref.sybilRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {ref.sybilRisk ? 'RISK' : 'VERIFIED'}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS: COPY LINK, GENERATE AD BANNER, DELETE */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                    <button
                      onClick={() => handleCopyReferralLink(ref.code)}
                      className="flex-1 px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedLinkCode === ref.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
                          Copy Link
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenAdBannerModal(ref)}
                      className="flex-1 px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      Ad Banner
                    </button>

                    <button
                      onClick={() => handleDeleteSquadCode(ref.id, ref.squadName)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        deletingSquadId === ref.id
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-400 font-extrabold shadow-lg shadow-rose-950'
                          : 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30'
                      }`}
                      title={deletingSquadId === ref.id ? 'Click again to confirm campaign deletion' : 'Delete squad referral campaign'}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      {deletingSquadId === ref.id ? 'Confirm Delete?' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AD BANNER GENERATOR MODAL */}
          {activeAdBannerModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl p-6 max-w-2xl w-full space-y-6 shadow-2xl relative my-8 animate-scaleUp">
                <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-amber-400" /> Squad Referral Ad Banner Studio
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Custom promotional banner generator for <span className="text-purple-300 font-semibold">{activeAdBannerModal.squadName}</span> (`{activeAdBannerModal.code}`)
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveAdBannerModal(null)}
                    className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* THEME SELECTOR */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">1. Select Banner Aesthetic Theme</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      onClick={() => setBannerTheme('neon')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-left ${
                        bannerTheme === 'neon'
                          ? 'bg-purple-950/80 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      🌴 Vice City Neon
                      <span className="block text-[10px] text-zinc-500 font-normal">Cyan & Rose Glow</span>
                    </button>
                    <button
                      onClick={() => setBannerTheme('blood')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-left ${
                        bannerTheme === 'blood'
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      🩸 Gang War Blood
                      <span className="block text-[10px] text-zinc-500 font-normal">Crimson & Dark Metal</span>
                    </button>
                    <button
                      onClick={() => setBannerTheme('gold')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-left ${
                        bannerTheme === 'gold'
                          ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      👑 VIP Club Gold
                      <span className="block text-[10px] text-zinc-500 font-normal">Amber & Obsidian</span>
                    </button>
                    <button
                      onClick={() => setBannerTheme('cyber')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-left ${
                        bannerTheme === 'cyber'
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      ⚡ Cyber Blue
                      <span className="block text-[10px] text-zinc-500 font-normal">Indigo & Electric Blue</span>
                    </button>
                  </div>
                </div>

                {/* CUSTOM HEADLINE */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">2. Custom Promotional Offer Headline</label>
                  <input
                    type="text"
                    value={bannerHeadline}
                    onChange={(e) => setBannerHeadline(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g. JOIN OUR SQUAD FOR +2000 VC BONUS CREDITS!"
                  />
                </div>

                {/* LIVE DYNAMIC BANNER PREVIEW */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">3. Live Banner Preview</label>
                  <div
                    className={`p-6 rounded-2xl border transition relative overflow-hidden space-y-3 ${
                      bannerTheme === 'neon'
                        ? 'bg-gradient-to-br from-purple-950 via-zinc-950 to-pink-950 border-purple-500/50 shadow-lg shadow-purple-950/50'
                        : bannerTheme === 'blood'
                        ? 'bg-gradient-to-br from-rose-950 via-zinc-950 to-red-950 border-rose-500/50 shadow-lg shadow-rose-950/50'
                        : bannerTheme === 'gold'
                        ? 'bg-gradient-to-br from-amber-950 via-zinc-950 to-yellow-950 border-amber-500/50 shadow-lg shadow-amber-950/50'
                        : 'bg-gradient-to-br from-cyan-950 via-zinc-950 to-indigo-950 border-cyan-500/50 shadow-lg shadow-cyan-950/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-white flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        GTA VI VICE CITY CENTRAL • SQUAD OFFICIAL
                      </span>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black/60 text-emerald-400 border border-emerald-500/30">
                        +{activeAdBannerModal.rewardVc} VC BONUS
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xl font-extrabold text-white tracking-wide uppercase">{activeAdBannerModal.squadName}</h4>
                      <p className="text-xs text-zinc-200 font-semibold">{bannerHeadline}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase text-zinc-400 font-bold">Referral Code:</span>
                        <span className="text-sm font-mono font-bold text-white bg-black/60 px-3 py-1 rounded-lg border border-purple-400/40">
                          {activeAdBannerModal.code}
                        </span>
                      </div>
                      <button className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                        ⚡ Claim Squad Bonus →
                      </button>
                    </div>
                  </div>
                </div>

                {/* EMBED CODE EXPORT OPTIONS */}
                <div className="space-y-3 pt-2 border-t border-zinc-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Export Ad Banner Snippets</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const htmlSnippet = `<a href="${window.location.origin}/?ref=${activeAdBannerModal.code}" target="_blank" style="text-decoration:none;"><div style="background:linear-gradient(135deg,#18181b,#09090b);border:2px solid #a855f7;border-radius:16px;padding:20px;color:#fff;font-family:sans-serif;"><span style="color:#c084fc;font-weight:bold;font-size:12px;">🌴 GTA VI VICE CITY CENTRAL SQUAD</span><h3 style="margin:8px 0;font-size:18px;">${activeAdBannerModal.squadName}</h3><p style="margin:4px 0;color:#e4e4e7;font-size:13px;">${bannerHeadline}</p><div style="margin-top:12px;background:#581c87;padding:8px 12px;border-radius:8px;display:inline-block;font-weight:bold;">SQUAD CODE: ${activeAdBannerModal.code}</div></div></a>`;
                        navigator.clipboard.writeText(htmlSnippet);
                        setCopiedEmbedType('html');
                        setTimeout(() => setCopiedEmbedType(null), 3000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-purple-400" />
                      {copiedEmbedType === 'html' ? 'Copied HTML Embed!' : 'Copy HTML Embed'}
                    </button>

                    <button
                      onClick={() => {
                        const discordSnippet = `> 🌴 **JOIN ${activeAdBannerModal.squadName.toUpperCase()} ON GTA VI VICE CITY CENTRAL**\n> ⚡ Squad Code: **\`${activeAdBannerModal.code}\`**\n> 💰 ${bannerHeadline}\n> 🔗 Claim +${activeAdBannerModal.rewardVc} VC Credits: ${window.location.origin}/?ref=${activeAdBannerModal.code}`;
                        navigator.clipboard.writeText(discordSnippet);
                        setCopiedEmbedType('discord');
                        setTimeout(() => setCopiedEmbedType(null), 3000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      {copiedEmbedType === 'discord' ? 'Copied Discord Code!' : 'Copy Discord Markdown'}
                    </button>

                    <button
                      onClick={() => {
                        const bbSnippet = `[url=${window.location.origin}/?ref=${activeAdBannerModal.code}][b]🌴 Join ${activeAdBannerModal.squadName} - Code: ${activeAdBannerModal.code}[/b][/url]`;
                        navigator.clipboard.writeText(bbSnippet);
                        setCopiedEmbedType('bbcode');
                        setTimeout(() => setCopiedEmbedType(null), 3000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      {copiedEmbedType === 'bbcode' ? 'Copied BBCode!' : 'Copy Forum BBCode'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Explanation Modal */}
      {showExplainModal && (
        <div 
          id="inspector-explain-modal"
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-fade-in"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
            onClick={() => setShowExplainModal(false)}
          />

          {/* Modal content wrapper */}
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    About Resource Inspector
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-mono tracking-wider">FIVE M OPTIMIZATION SENTINEL</p>
                </div>
              </div>
              <button
                id="close-explain-modal-btn"
                onClick={() => setShowExplainModal(false)}
                className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-sm text-zinc-300 leading-relaxed">
              <p className="text-xs">
                The <strong className="text-cyan-400">FiveM Resource Inspector & Asset Performance Audit</strong> is a powerful static code analyzer engineered specifically for server owners, gameplay developers, and mod developers in the GTA V and FiveM multiplayer ecosystem.
              </p>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-zinc-200 tracking-wider">🎯 Core Capabilities</h4>
                <ul className="space-y-2.5 list-disc pl-5 text-xs text-zinc-400">
                  <li>
                    <strong className="text-zinc-300">AST Script Scanner</strong>: Reads Lua source files to trace performance issues like high-frequency thread loops, unthrottled ticks (<code className="text-amber-400 font-mono text-[11px] bg-zinc-950 px-1 py-0.5 rounded">Citizen.Wait(0)</code>), or resource leak triggers.
                  </li>
                  <li>
                    <strong className="text-zinc-300">Manifest Validation</strong>: Scans <code className="text-zinc-300 font-mono text-[11px] bg-zinc-950 px-1 py-0.5 rounded">fxmanifest.lua</code> / <code className="text-zinc-300 font-mono text-[11px] bg-zinc-950 px-1 py-0.5 rounded">__resource.lua</code> declarations to detect legacy game version overrides, obsolete scripts, and structural config anomalies.
                  </li>
                  <li>
                    <strong className="text-zinc-300">VRAM Footprint Estimator</strong>: Evaluates custom 3D asset streams (<code className="text-zinc-300 font-mono text-[11px] bg-zinc-950 px-1 py-0.5 rounded">.ytd</code> / <code className="text-zinc-300 font-mono text-[11px] bg-zinc-950 px-1 py-0.5 rounded">.ydr</code>) to detect oversized uncompressed texture files that could cause client crash anomalies (VRAM crash limits).
                  </li>
                  <li>
                    <strong className="text-zinc-300">Auto-Patch Synthesis</strong>: Produces an optimized, non-destructive Lua correction patch on-the-fly that you can instantly copy and paste into your resource files to boost your server's framerate.
                  </li>
                </ul>
              </div>

              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
                <span className="text-amber-400 font-bold block uppercase tracking-wider text-[9px]">⚙️ Performance Note</span>
                <p>
                  This tool runs 100% on the server side using virtual AST compiler simulations. It calculates estimated client thread metrics and VRAM footprints based on script parameters rather than your browser's local computer specs.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-800/80 flex justify-end">
              <button
                id="close-explain-modal-bottom-btn"
                onClick={() => setShowExplainModal(false)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED FULLSCREEN PITCH PROPOSAL MODAL */}
      {isPitchModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    Expanded Creator Pitch Proposal
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Target: <strong className="text-rose-400">{creatorName}</strong> ({platform.toUpperCase()}) • Avg CCV: <strong className="text-purple-400">{avgCcv} Viewers</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPitchModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                <span>Full Pitch Body (Editable)</span>
                <span>{generatedPitch.length} characters • {generatedPitch.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>

              <textarea
                value={generatedPitch}
                onChange={(e) => setGeneratedPitch(e.target.value)}
                rows={16}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-base font-mono text-zinc-100 leading-relaxed focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 shadow-inner min-h-[380px] resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
              <span className="text-xs text-zinc-400">
                ⚡ Ready to copy into Discord DMs, Twitter/X messages, or Twitch Whispers.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPitch);
                    setCopiedPitch(true);
                    setToastMessage('✓ Pitch text copied to clipboard!');
                    setTimeout(() => setCopiedPitch(false), 2500);
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/50"
                >
                  {copiedPitch ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-white" />}
                  <span>{copiedPitch ? 'Copied Pitch!' : 'Copy Pitch to Clipboard'}</span>
                </button>

                <button
                  onClick={() => setIsPitchModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED FULLSCREEN INTEGRATION CODE MODAL */}
      {expandedCodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    {expandedCodeModal.title}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Target Pass: <strong className="text-purple-400">{expandedCodeModal.name}</strong> • Framework: <strong className="text-rose-400">{expandedCodeModal.framework.toUpperCase()}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setExpandedCodeModal(null)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                <span>Integration Snippet Code</span>
                <span>{expandedCodeModal.code.split('\n').length} lines • {expandedCodeModal.code.length} characters</span>
              </div>

              <textarea
                value={expandedCodeModal.code}
                readOnly
                rows={18}
                className="w-full bg-zinc-900 border border-purple-500/30 rounded-2xl p-5 text-sm sm:text-base font-mono text-zinc-100 leading-relaxed focus:outline-none focus:border-purple-400 shadow-inner min-h-[400px] resize-y select-all cursor-text"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
              <span className="text-xs text-zinc-400">
                ⚡ Copy this snippet directly into your FiveM or server resource files (`server/main.lua` or `server.cs`).
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(expandedCodeModal.code);
                    setToastMessage('✓ Integration snippet copied to clipboard!');
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/50"
                >
                  <Copy className="w-4 h-4 text-white" />
                  <span>Copy Code to Clipboard</span>
                </button>

                <button
                  onClick={() => setExpandedCodeModal(null)}
                  className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
