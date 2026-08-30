'use client';
import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Globe,
  Server,
  Database,
  ShieldCheck,
  Bot,
  Layers,
  Car,
  Sliders,
  MapPin,
  MessageSquare,
  User,
  CreditCard,
  Zap,
  ExternalLink,
  Code2,
  Lock,
  Unlock,
  Radio,
  Search,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Cpu,
  Workflow,
  Network
} from 'lucide-react';
import { ActiveTab } from '../types';
import { copyToClipboard } from '../lib/copyUtils';

export interface TreeNode {
  id: string;
  name: string;
  type: 'root' | 'cluster' | 'route' | 'subfeature' | 'component' | 'api' | 'database';
  path?: string;
  tabKey?: ActiveTab;
  dynamicParam?: string;
  badge?: string;
  access?: 'Public' | 'Registered User' | 'VIP (L2)' | 'Staff (L3)' | 'Admin (L4)' | 'Discord';
  description: string;
  color?: string;
  icon?: any;
  endpoints?: string[];
  dbCollections?: string[];
  components?: string[];
  children?: TreeNode[];
}

export const SITE_TREE_DATA: TreeNode = {
  id: 'root-gateway',
  name: 'GTA VI Central Platform Ingress',
  type: 'root',
  path: '/',
  tabKey: 'home',
  description: 'Root domain entry point with single-page history routing, Schema.org SEO injector, and central state manager.',
  color: 'indigo',
  icon: Globe,
  children: [
    {
      id: 'cluster-core',
      name: 'Core Intel & Catalogs',
      type: 'cluster',
      description: 'Vehicles, weapons, dual comparison matrices, and official newswire editorial feeds.',
      color: 'blue',
      icon: Car,
      children: [
        {
          id: 'tree-home',
          name: 'Operations HQ (/ )',
          type: 'route',
          path: '/',
          tabKey: 'home',
          access: 'Public',
          description: 'Mission command dashboard, countdown telemetry, system health indicators.',
          endpoints: ['GET /api/health'],
          components: ['HomeTab', 'CountdownClock', 'LiveTelemetryGrid'],
          dbCollections: ['userProfiles', 'chatMessages']
        },
        {
          id: 'tree-vehicles',
          name: '360° Vehicle Catalog (/vehicles)',
          type: 'route',
          path: '/vehicles',
          tabKey: 'vehicles',
          access: 'Public',
          description: 'High-fidelity vehicle database with 360° color visualizer and performance meters.',
          endpoints: ['GET /api/vehicles', 'POST /api/builds'],
          components: ['VehicleCatalogTab', 'VehicleCard', 'VehicleDetailModal'],
          dbCollections: ['communityBuilds'],
          children: [
            {
              id: 'tree-veh-sub1',
              name: '360° SVG Customizer & Paint Palette',
              type: 'subfeature',
              description: 'Interactive RGB color picker with glossy, matte, and metallic finish renderers.'
            },
            {
              id: 'tree-veh-sub2',
              name: 'IndexedDB Offline Cache Engine',
              type: 'subfeature',
              description: 'LocalForage IndexedDB persistence with Service Worker asset caching.'
            }
          ]
        },
        {
          id: 'tree-weapons',
          name: 'Arsenal & Ballistics (/weapons)',
          type: 'route',
          path: '/weapons',
          tabKey: 'weapons',
          access: 'Public',
          description: 'Weapons database with computed DPS, TTK metrics, and attachment builder.',
          endpoints: ['GET /api/weapons'],
          components: ['WeaponsArmoryTab', 'WeaponSpecCard', 'BallisticRadarChart']
        },
        {
          id: 'tree-comparison',
          name: 'Dual Spec Matrix & Radar (/comparison)',
          type: 'route',
          path: '/comparison',
          tabKey: 'comparison',
          access: 'Public',
          description: 'Synchronized radar graphs and stat differential metrics for vehicles and weapons.',
          components: ['ComparisonTab', 'RadarChartCompare', 'SpecDiffBadge']
        },
        {
          id: 'tree-blog',
          name: 'Vice City Newswire Blog (/blog)',
          type: 'route',
          path: '/blog',
          tabKey: 'blog',
          access: 'Public',
          description: 'Official Rockstar Games newswire breakdowns, guides, and comment system.',
          endpoints: ['GET /api/blog'],
          components: ['BlogTab', 'ArticleViewerModal'],
          dbCollections: ['blogComments']
        }
      ]
    },
    {
      id: 'cluster-engineering',
      name: 'Performance Engineering & Modding',
      type: 'cluster',
      description: 'Vehicle tuning simulators, ROI business calculators, and FiveM physics exporters.',
      color: 'amber',
      icon: Sliders,
      children: [
        {
          id: 'tree-mod-calc',
          name: 'Tuning Simulator & Mod Lab (/mod-calculator)',
          type: 'route',
          path: '/mod-calculator',
          tabKey: 'mod-calculator',
          access: 'Public',
          description: 'Calculates horsepower, 0-60 acceleration, and dyno quarter-mile curves.',
          components: ['ModBuilderCalculator', 'DynoGraphCanvas']
        },
        {
          id: 'tree-roi-calc',
          name: 'Business ROI & Break-Even (/roi-calculator)',
          type: 'route',
          path: '/roi-calculator',
          tabKey: 'roi-calculator',
          access: 'Public',
          description: 'Nightclub, Chop Shop, and Smuggling Dock financial yield modeling.',
          components: ['BusinessRoiCalculator', 'ProfitBreakdownChart']
        },
        {
          id: 'tree-handling-editor',
          name: 'Handling.meta Physics Lab (/handling-editor)',
          type: 'route',
          path: '/handling-editor',
          tabKey: 'handling-editor',
          access: 'Public',
          description: 'Vehicle physics calibration lab exporting valid FiveM handling.meta XML.',
          components: ['HandlingEditorTab', 'MetaXmlPreviewModal', 'PhysicsVisualizer']
        },
        {
          id: 'tree-economy-balancer',
          name: 'Server Economy Balancer (/economy-balancer)',
          type: 'route',
          path: '/economy-balancer',
          tabKey: 'economy-balancer',
          access: 'Public',
          description: 'QBCore, ESX Legacy, and QBX job payout and black market balancing suite.',
          components: ['EconomyBalancerTab', 'JobPayoutMatrix', 'EconomyLuaExporter']
        }
      ]
    },
    {
      id: 'cluster-geospatial',
      name: 'Tactical Geospatial & Squad Radar',
      type: 'cluster',
      description: 'Interactive high-res Vice City GPS map with real-time multiplayer Squad Radar pings.',
      color: 'emerald',
      icon: MapPin,
      children: [
        {
          id: 'tree-map',
          name: 'Vice City Tactical GPS & Radar (/map)',
          type: 'route',
          path: '/map',
          tabKey: 'map',
          access: 'Public',
          description: 'High-res interactive map with POI filters and multiplayer squad synchronization.',
          dbCollections: ['squadRadarRooms'],
          components: ['InteractiveMap', 'SquadMapCanvas', 'SquadRadarHUD'],
          children: [
            {
              id: 'tree-map-sub1',
              name: 'Multiplayer Room Pinging & 10s Waypoints',
              type: 'subfeature',
              description: 'Real-time peer waypoint pings with decaying 10-second visual rings.'
            },
            {
              id: 'tree-map-sub2',
              name: 'POI Layer Engine (Heist, Safehouses, Stunts)',
              type: 'subfeature',
              description: 'Multi-category layer filtering with high-DPI canvas zoom and pan.'
            }
          ]
        }
      ]
    },
    {
      id: 'cluster-rp-suite',
      name: 'FiveM RP & Whitelist Gateway',
      type: 'cluster',
      description: 'Server directory, no-code whitelist form builder, Discord OAuth, and staff review queue.',
      color: 'purple',
      icon: ShieldCheck,
      children: [
        {
          id: 'tree-rp-servers',
          name: 'FiveM Server Directory (/rp-servers)',
          type: 'route',
          path: '/rp-servers',
          tabKey: 'rp-servers',
          access: 'Public',
          description: 'Top-tier RP servers with live player density and 1-click F8 console connect strings.',
          endpoints: ['POST /api/rp-servers', 'POST /api/rp-servers/ping'],
          dbCollections: ['rpServers', 'pendingApprovals'],
          components: ['RpServerDirectory', 'ServerCard', 'SubmitServerModal']
        },
        {
          id: 'tree-server-manage',
          name: 'No-Code Form Builder (/servers/[slug]/manage)',
          type: 'route',
          path: '/servers/[slug]/manage',
          tabKey: 'server-manage',
          access: 'Staff (L3)',
          description: 'Drag-and-drop question editor, word limit rules, and Discord webhook configurations.',
          endpoints: ['POST /api/discord/webhook'],
          dbCollections: ['serverWhitelistForms'],
          components: ['ServerManageFormTab', 'QuestionEditorCard']
        },
        {
          id: 'tree-server-apply',
          name: 'Player Application Portal (/servers/[slug]/apply)',
          type: 'route',
          path: '/servers/[slug]/apply',
          tabKey: 'server-apply',
          access: 'Discord',
          description: 'Gated application form requiring linked Discord OAuth and backstory verification.',
          endpoints: ['GET /api/auth/discord', 'POST /api/discord/webhook'],
          dbCollections: ['serverWhitelistForms', 'whitelistApplications', 'userProfiles'],
          components: ['ServerApplyTab', 'DynamicFormRenderer']
        },
        {
          id: 'tree-server-review',
          name: 'Staff Review Decision Queue (/servers/[slug]/review)',
          type: 'route',
          path: '/servers/[slug]/review',
          tabKey: 'server-review',
          access: 'Staff (L3)',
          description: 'Staff queue for inspecting backstories, internal notes, and 1-click Discord approvals.',
          endpoints: ['POST /api/discord/webhook'],
          dbCollections: ['whitelistApplications'],
          components: ['ServerReviewTab', 'ApplicationInspectorModal']
        },
        {
          id: 'tree-server-status',
          name: 'Live Status Tracker (/servers/[slug]/status)',
          type: 'route',
          path: '/servers/[slug]/status',
          tabKey: 'server-status',
          access: 'Registered User',
          description: 'Milestone progress tracker showing real-time staff decisions and reviewer notes.',
          dbCollections: ['whitelistApplications'],
          components: ['ServerStatusTab', 'MilestoneTimeline']
        }
      ]
    },
    {
      id: 'cluster-comms',
      name: 'Live Multiplayer Comms & VIP Hubs',
      type: 'cluster',
      description: 'Firebase synchronized chat channels, WebRTC voice comms, Picture-in-Picture, and vouchers.',
      color: 'pink',
      icon: MessageSquare,
      children: [
        {
          id: 'tree-chat',
          name: 'Live Community Chat (/chat)',
          type: 'route',
          path: '/chat',
          tabKey: 'chat',
          access: 'Registered User',
          description: 'Real-time multi-channel chat with deduplication filters, voice comms, and VIP hubs.',
          endpoints: ['GET /api/chat', 'POST /api/chat', 'POST /api/chat/report'],
          dbCollections: ['chatMessages', 'customChannels', 'chatReports'],
          components: ['CommunityChatTab', 'VoiceCommsModal', 'VideoStreamPlayer'],
          children: [
            {
              id: 'tree-chat-sub1',
              name: 'WebRTC Voice Comms & Document PiP',
              type: 'subfeature',
              description: 'Hardware-accelerated 90 FPS screen share with Picture-in-Picture window overlay.'
            },
            {
              id: 'tree-chat-sub2',
              name: 'VIP Custom Hubs & Moderation (Kick/Ban)',
              type: 'subfeature',
              description: 'Channel creators can invite members, kick participants, and ban trolls.'
            }
          ]
        },
        {
          id: 'tree-giftcards',
          name: 'Shark Voucher Terminal (/giftcards)',
          type: 'route',
          path: '/giftcards',
          tabKey: 'giftcards',
          access: 'Public',
          description: 'Redeem Vice City Shark Cards and staff VIP subscription giveaway codes.',
          endpoints: ['POST /api/giftcards/redeem', 'POST /api/giftcards/generate'],
          dbCollections: ['giftCards', 'userProfiles'],
          components: ['GiftCardTab', 'VoucherInputCard']
        }
      ]
    },
    {
      id: 'cluster-identity',
      name: 'Player Dossier & Executive HQ',
      type: 'cluster',
      description: 'GamerTag management with annual limits, avatar matrix, Discord linking, and Admin HQ.',
      color: 'rose',
      icon: User,
      children: [
        {
          id: 'tree-profile',
          name: 'Player Profile & Dossier (/profile)',
          type: 'route',
          path: '/profile',
          tabKey: 'profile',
          access: 'Registered User',
          description: 'GamerTag with 2-change/year lockout rule, animated avatars, and Discord badge.',
          endpoints: ['GET /api/auth/discord'],
          dbCollections: ['userProfiles', 'userNotifications'],
          components: ['ProfileTab', 'AvatarSelectorModal']
        },
        {
          id: 'tree-admin',
          name: 'Executive Admin & Moderation HQ (/admin)',
          type: 'route',
          path: '/admin',
          tabKey: 'admin',
          access: 'Admin (L4)',
          description: 'User management table, clearance elevation (L1-L4), and automated VIP expirations.',
          endpoints: ['GET /api/admin/users', 'POST /api/admin/user/role', 'POST /api/admin/server/moderate'],
          dbCollections: ['userProfiles', 'pendingApprovals', 'chatReports'],
          components: ['AdminDashboardTab', 'UserManagementTable']
        }
      ]
    },
    {
      id: 'cluster-monetization',
      name: 'Monetization & Ads Engine',
      type: 'cluster',
      description: 'Stripe VIP Pass subscriptions ($3.99/mo) and B2B Sponsored Server placement ($49/mo).',
      color: 'yellow',
      icon: CreditCard,
      children: [
        {
          id: 'tree-monetization',
          name: 'VIP Pass & B2B Sponsorships (/monetization)',
          type: 'route',
          path: '/monetization',
          tabKey: 'monetization',
          access: 'Public',
          description: 'Dynamic Stripe checkout and publisher ad banner simulator (AdSense/Mediavine).',
          endpoints: ['GET /api/stripe/config', 'POST /api/stripe/checkout'],
          dbCollections: ['userProfiles', 'rpServers'],
          components: ['MonetizationTab', 'PaymentGatewayModal', 'AdSensePreviewBanner']
        }
      ]
    },
    {
      id: 'cluster-seo-docs',
      name: 'Autonomous SEO Spider & Documentation',
      type: 'cluster',
      description: 'Gemini AI midnight news crawler, programmatic topic pages, and system documentation.',
      color: 'teal',
      icon: Zap,
      children: [
        {
          id: 'tree-seo-hub',
          name: 'Midnight Spider & pSEO Hub (/seo-hub)',
          type: 'route',
          path: '/seo-hub',
          tabKey: 'seo-hub',
          access: 'Public',
          description: 'Automated news crawler indexing verified Rockstar Games intel with Gemini 3.7 Flash.',
          endpoints: ['GET /api/seo/pages', 'POST /api/seo/auto-generate', 'POST /api/cron/midnight-spider'],
          dbCollections: ['pseoArticles'],
          components: ['GtaSeoKnowledgeHub', 'PseoArticleReader']
        },
        {
          id: 'tree-docs',
          name: 'System Architecture & API Docs (/docs)',
          type: 'route',
          path: '/docs',
          tabKey: 'docs',
          access: 'Public',
          description: 'Complete technical reference, REST API schema tables, and interactive model.',
          endpoints: ['GET /api/health', 'GET /api/vehicles', 'GET /api/chat'],
          components: ['DocumentationTab', 'WebsiteInteractiveModel', 'PlatformTreeModel']
        }
      ]
    }
  ]
};

// Architecture Pipeline Flow Nodes
export const ARCHITECTURE_PIPELINE_TREE: TreeNode = {
  id: 'root-arch',
  name: 'GTA VI Central System Architecture & Data Flow',
  type: 'root',
  description: 'Full-stack client-server data flow from browser client to Express backend, Firebase Firestore, and Gemini AI.',
  color: 'indigo',
  icon: Network,
  children: [
    {
      id: 'pipe-client',
      name: 'Frontend Client Layer (React 18 + Vite)',
      type: 'cluster',
      description: 'Single Page App running on Cloud Run with Tailwind CSS, Lucide icons, and LocalForage cache.',
      color: 'blue',
      icon: Layers,
      children: [
        {
          id: 'pipe-client-state',
          name: 'Hybrid Local Cache (IndexedDB + Memory)',
          type: 'database',
          description: 'Offline storage for static vehicles, weapons, and custom builds with Service Worker sync.'
        },
        {
          id: 'pipe-client-webrtc',
          name: 'WebRTC Mesh & AudioContext Engine',
          type: 'component',
          description: 'P2P voice comms, 90 FPS screen share stream, and Document Picture-in-Picture window overlay.'
        }
      ]
    },
    {
      id: 'pipe-server',
      name: 'Backend Ingress (Node.js Express + TypeScript)',
      type: 'cluster',
      description: 'High-throughput Express server handling API rate-limiting, Stripe checkout, Discord webhooks, and cron spiders.',
      color: 'amber',
      icon: Server,
      children: [
        {
          id: 'pipe-server-discord',
          name: 'Discord OAuth2 & Webhook Dispatcher',
          type: 'api',
          description: 'Exchanges Discord auth codes, attaches Discord identity to player profiles, and dispatches rich embeds.'
        },
        {
          id: 'pipe-server-stripe',
          name: 'Stripe Checkout & Dynamic Pricing Service',
          type: 'api',
          description: 'Manages $3.99/mo VIP Passes and $49/mo B2B server placement webhooks.'
        },
        {
          id: 'pipe-server-cron',
          name: 'Midnight Cron & Gemini pSEO Spider',
          type: 'api',
          description: 'Background cron triggering Google GenAI Gemini 3.7 Flash news crawling and schema synthesis.'
        }
      ]
    },
    {
      id: 'pipe-db',
      name: 'Persistent Cloud Tier (Firebase Cloud Firestore)',
      type: 'cluster',
      description: 'Real-time NoSQL Firestore database keeping player profiles, chats, and whitelist queues in sync.',
      color: 'emerald',
      icon: Database,
      children: [
        {
          id: 'pipe-db-profiles',
          name: 'userProfiles (GamerTags, Avatars, Roles, Expirations)',
          type: 'database',
          description: 'Holds unique player tags, 2-change annual counters, VC balances, and L1-L4 clearance.'
        },
        {
          id: 'pipe-db-chat',
          name: 'chatMessages & customChannels (onSnapshot Sync)',
          type: 'database',
          description: 'Real-time chat feed with deduplication filters, attachments, and kick/ban moderation.'
        },
        {
          id: 'pipe-db-whitelist',
          name: 'serverWhitelistForms & whitelistApplications',
          type: 'database',
          description: 'No-code dynamic question templates, applicant scenario answers, and staff decision logs.'
        },
        {
          id: 'pipe-db-pseo',
          name: 'pseoArticles (Permanent News Archive)',
          type: 'database',
          description: 'Autonomous spider articles, H1 tags, FAQ schemas, and telemetry tables.'
        }
      ]
    }
  ]
};

interface PlatformTreeModelProps {
  onNavigate?: (tab: ActiveTab, targetId?: string) => void;
}

export const PlatformTreeModel: React.FC<PlatformTreeModelProps> = ({ onNavigate }) => {
  const [activeTreeMode, setActiveTreeMode] = useState<'site' | 'arch'>('site');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'root-gateway': true,
    'cluster-core': true,
    'cluster-engineering': false,
    'cluster-geospatial': true,
    'cluster-rp-suite': true,
    'cluster-comms': false,
    'cluster-identity': false,
    'cluster-monetization': false,
    'cluster-seo-docs': false,
    // Arch tree
    'root-arch': true,
    'pipe-client': true,
    'pipe-server': true,
    'pipe-db': true
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string>('tree-server-manage');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const currentTreeRoot = activeTreeMode === 'site' ? SITE_TREE_DATA : ARCHITECTURE_PIPELINE_TREE;

  // Toggle single node
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Expand all / collapse all
  const handleExpandAll = (expand: boolean) => {
    const newMap: Record<string, boolean> = {};
    const traverse = (node: TreeNode) => {
      newMap[node.id] = expand;
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(currentTreeRoot);
    setExpandedNodes(newMap);
  };

  // Find currently selected node in the active tree
  const selectedNode = useMemo(() => {
    let found: TreeNode | null = null;
    const traverse = (node: TreeNode) => {
      if (node.id === selectedNodeId) {
        found = node;
        return;
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(currentTreeRoot);
    return found || currentTreeRoot;
  }, [selectedNodeId, currentTreeRoot]);

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: TreeNode, depth: number = 0, isLast: boolean = false) => {
    const isExpanded = expandedNodes[node.id] ?? false;
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.id === selectedNodeId;

    const matchesSearch =
      searchFilter.trim() === '' ||
      node.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (node.path && node.path.toLowerCase().includes(searchFilter.toLowerCase())) ||
      node.description.toLowerCase().includes(searchFilter.toLowerCase());

    const Icon = node.icon || (node.type === 'cluster' ? (isExpanded ? FolderOpen : Folder) : node.type === 'api' ? Server : node.type === 'database' ? Database : Code2);

    return (
      <div key={node.id} className="select-none">
        {/* Node Row */}
        <div
          onClick={() => {
            setSelectedNodeId(node.id);
            if (hasChildren && depth > 0) {
              toggleNode(node.id);
            }
          }}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition text-xs font-mono group relative ${
            isSelected
              ? 'bg-indigo-600/25 border border-indigo-500/60 text-white font-bold shadow-md shadow-indigo-500/10'
              : matchesSearch
              ? 'hover:bg-zinc-800/80 text-zinc-300'
              : 'text-zinc-500 opacity-60 hover:opacity-100 hover:bg-zinc-900'
          }`}
        >
          {/* Connecting Branch Marker */}
          {depth > 0 && (
            <div className="absolute left-2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-full pointer-events-none" />
          )}

          {/* Folder Toggle Caret */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-0.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>
          ) : (
            <span className="w-4 h-4 flex items-center justify-center text-zinc-600 text-[10px]">
              •
            </span>
          )}

          {/* Node Icon */}
          <Icon className={`w-3.5 h-3.5 shrink-0 ${
            node.color === 'blue' ? 'text-blue-400' :
            node.color === 'emerald' ? 'text-emerald-400' :
            node.color === 'amber' ? 'text-amber-400' :
            node.color === 'purple' ? 'text-purple-400' :
            node.color === 'pink' ? 'text-pink-400' :
            node.color === 'rose' ? 'text-rose-400' :
            node.color === 'teal' ? 'text-teal-400' :
            'text-indigo-400'
          }`} />

          {/* Node Name */}
          <span className="truncate flex-1">
            {node.name}
          </span>

          {/* Access / Type Badge */}
          {node.access && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold shrink-0 ${
              node.access.includes('Admin')
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : node.access.includes('Staff')
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : node.access.includes('VIP')
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : node.access.includes('Discord')
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {node.access}
            </span>
          )}

          {node.type === 'cluster' && hasChildren && (
            <span className="text-[10px] text-zinc-500 font-mono">
              ({node.children?.length})
            </span>
          )}
        </div>

        {/* Child Subtree */}
        {hasChildren && isExpanded && (
          <div className="border-l border-zinc-800/80 ml-4 pl-1 space-y-0.5 mt-0.5">
            {node.children!.map((child, idx) =>
              renderTreeNode(child, depth + 1, idx === node.children!.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Tree Header Banner */}
      <div className="bg-zinc-900/95 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-indigo-400" /> Hierarchical Tree Model
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5 text-emerald-400" /> Interactive DAG
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              GTA VI Central Interactive Visual Tree & Topology Model
            </h2>
            <p className="text-xs lg:text-sm text-zinc-400 max-w-3xl leading-relaxed">
              Navigate the complete hierarchical structure of the GTA VI Central platform. Explore root URL routing trees, sub-feature branches, Express REST endpoints, and Cloud Firestore collections with collapsible nodes.
            </p>
          </div>

          {/* Mode Switcher: Site Map Tree vs. System Data Pipeline Tree */}
          <div className="flex items-center bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 gap-1 shrink-0">
            <button
              onClick={() => setActiveTreeMode('site')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTreeMode === 'site'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Site Navigation Tree</span>
            </button>
            <button
              onClick={() => setActiveTreeMode('arch')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTreeMode === 'arch'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Data Flow & Backend Pipeline</span>
            </button>
          </div>
        </div>

        {/* Tree Controls Toolbar */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter tree nodes (e.g. whitelist, handling, chat, discord)..."
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono transition"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleExpandAll(true)}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3 h-3 text-indigo-400" />
              <span>Expand All</span>
            </button>
            <button
              onClick={() => handleExpandAll(false)}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Minimize2 className="w-3 h-3 text-zinc-400" />
              <span>Collapse All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Tree Hierarchy + Node Details Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Tree View Canvas (6 cols) */}
        <div className="lg:col-span-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                {activeTreeMode === 'site' ? 'Platform Route Hierarchy' : 'System Architecture Pipeline'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              Click node to inspect details
            </span>
          </div>

          {/* Tree Rendering Box */}
          <div className="max-h-[640px] overflow-y-auto pr-2 scrollbar-thin space-y-1">
            {renderTreeNode(currentTreeRoot)}
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Root: {currentTreeRoot.name}</span>
            <span className="text-emerald-400">● Live Synchronization</span>
          </div>
        </div>

        {/* Right Column: Node Details Inspector & Action Drawer (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Inspector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    Node ID: {selectedNode.id}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Type: {selectedNode.type}
                  </span>
                </div>
                <h3 className="text-lg lg:text-xl font-black text-white tracking-tight">
                  {selectedNode.name}
                </h3>
                {selectedNode.path && (
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-emerald-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 font-bold">
                      {selectedNode.path}
                    </code>
                    <button
                      onClick={() => handleCopy(selectedNode.path!)}
                      className="p-1 text-zinc-500 hover:text-white rounded bg-zinc-950 border border-zinc-800 cursor-pointer"
                      title="Copy Path"
                    >
                      {copiedText === selectedNode.path ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button if route has tabKey */}
              {selectedNode.tabKey && (
                <button
                  onClick={() => {
                    if (onNavigate) {
                      if (selectedNode.tabKey!.startsWith('server-')) {
                        onNavigate(selectedNode.tabKey!, 'vice-city-life-rp');
                      } else {
                        onNavigate(selectedNode.tabKey!);
                      }
                    } else {
                      window.location.href = selectedNode.path?.replace('[slug]', 'vice-city-life-rp') || '/';
                    }
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0"
                >
                  <span>Launch Live Route</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Node Description */}
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Description & Architectural Purpose
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {selectedNode.description}
              </p>
            </div>

            {/* Access Level Guard */}
            {selectedNode.access && (
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Access Authorization</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold font-mono ${
                  selectedNode.access.includes('Admin')
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : selectedNode.access.includes('Staff')
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : selectedNode.access.includes('VIP')
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : selectedNode.access.includes('Discord')
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {selectedNode.access}
                </span>
              </div>
            )}

            {/* Connected REST API Endpoints */}
            {selectedNode.endpoints && selectedNode.endpoints.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" /> Connected REST Endpoints & Webhooks
                </span>
                <div className="space-y-1.5">
                  {selectedNode.endpoints.map((ep, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-xs font-mono">
                      <span className="text-zinc-300">{ep}</span>
                      <button
                        onClick={() => handleCopy(ep)}
                        className="p-1 text-zinc-500 hover:text-white rounded cursor-pointer"
                        title="Copy endpoint"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Firestore Collections */}
            {selectedNode.dbCollections && selectedNode.dbCollections.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Synchronized Firestore Collections
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.dbCollections.map((col, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-zinc-950 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold">
                      db.{col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Associated React Components */}
            {selectedNode.components && selectedNode.components.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" /> Key React Components
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.components.map((comp, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-zinc-950 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-mono">
                      &lt;{comp} /&gt;
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Child Branches */}
            {selectedNode.children && selectedNode.children.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">
                  Sub-Branches & Nested Nodes ({selectedNode.children.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedNode.children.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => setSelectedNodeId(child.id)}
                      className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{child.name}</p>
                        {child.path && <p className="text-[10px] text-zinc-500 font-mono truncate">{child.path}</p>}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
