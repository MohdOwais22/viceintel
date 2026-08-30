'use client';
import React, { useState, useMemo } from 'react';
import {
  Layers,
  Globe,
  Compass,
  Zap,
  Server,
  Database,
  ShieldCheck,
  Bot,
  Users,
  Car,
  Crosshair,
  TrendingUp,
  Sliders,
  Calculator,
  Coins,
  MapPin,
  MessageSquare,
  Gift,
  User,
  ShieldAlert,
  CreditCard,
  Newspaper,
  BookOpen,
  Search,
  ExternalLink,
  CheckCircle2,
  Code2,
  ArrowRight,
  Sparkles,
  Terminal,
  Activity,
  Radio,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { ActiveTab } from '../types';
import { copyToClipboard } from '../lib/copyUtils';
import { ENV } from '../lib/envConfig';

export interface RouteDocItem {
  id: string;
  tabKey: ActiveTab;
  path: string;
  dynamicParams?: string;
  title: string;
  category: 'core' | 'engineering' | 'geospatial' | 'rp' | 'comms' | 'identity' | 'monetization' | 'seo_docs';
  categoryLabel: string;
  accessLevel: 'Public' | 'Registered User' | 'VIP Member (L2)' | 'Staff (L3)' | 'Executive Admin (L4)' | 'Discord Linked';
  description: string;
  userStory: string;
  coreFeatures: string[];
  firestoreCollections: string[];
  localStorageKeys: string[];
  apiEndpoints: string[];
  clientComponents: string[];
  seoMetadata: {
    title: string;
    description: string;
    schemaType: string;
  };
  sampleInteractivePayload?: any;
}

export const PLATFORM_ROUTES_DATA: RouteDocItem[] = [
  {
    id: 'route-home',
    tabKey: 'home',
    path: '/',
    title: 'Operations HQ & Hub',
    category: 'core',
    categoryLabel: 'Core Operations & Intel',
    accessLevel: 'Public',
    description: 'Central mission command dashboard displaying release countdowns, quick action telemetry grids, system pulse, and platform quick links.',
    userStory: 'As a player or server enthusiast, I want a high-level briefing of current GTA VI release intelligence, server activity, and fast shortcuts to tools.',
    coreFeatures: [
      'Real-time GTA VI Vice City launch countdown clock & event telemetry',
      'Interactive quick-launch portal cards with instant tab switching',
      'Live server latency check & platform uptime indicators',
      'Dynamic Schema.org WebSite JSON-LD structured metadata injection'
    ],
    firestoreCollections: ['userProfiles', 'chatMessages'],
    localStorageKeys: ['GTA_VI_USER_PREFERENCES'],
    apiEndpoints: ['GET /api/health'],
    clientComponents: ['HomeTab', 'CountdownClock', 'LiveTelemetryGrid'],
    seoMetadata: {
      title: 'GTA VI Central — Vice City Interactive Operations Hub & RP Suite',
      description: 'The ultimate GTA VI and FiveM companion platform with vehicle catalogs, weapons armory, GPS tactical radar, and RP whitelist manager.',
      schemaType: 'WebSite'
    }
  },
  {
    id: 'route-vehicles',
    tabKey: 'vehicles',
    path: '/vehicles',
    title: '360° Vehicle Catalog & Specs',
    category: 'core',
    categoryLabel: 'Core Operations & Intel',
    accessLevel: 'Public',
    description: 'High-fidelity vehicle database with category filters, acceleration meters, handling ratings, interactive paint customizer, and exportable builds.',
    userStory: 'As a racer or roleplayer, I want to inspect top speeds, drivetrains, prices, and test color combinations on vehicles.',
    coreFeatures: [
      'Filterable vehicle grid (Super, Sports, Muscle, Classic, Helis, Boats, Offroad)',
      '360° interactive SVG/Canvas vehicle spec visualizer with dynamic color palette picker',
      'Performance stat meters (Top Speed, 0-60 Accel, Braking, Traction, Weight)',
      '1-Click "Send to Mod Calculator" and "Compare Vehicle" pipelines',
      'Offline caching via IndexedDB LocalForage with Service Worker sync'
    ],
    firestoreCollections: ['communityBuilds'],
    localStorageKeys: ['gta6_vehicles_cache', 'gta6_custom_builds'],
    apiEndpoints: ['GET /api/vehicles', 'POST /api/builds'],
    clientComponents: ['VehicleCatalogTab', 'VehicleCard', 'VehicleDetailModal'],
    seoMetadata: {
      title: 'GTA 6 Vehicle Database & Specs Catalog — ViceIntel',
      description: 'Explore full vehicle telemetry, top speeds, custom paint options, and performance benchmarks for GTA VI.',
      schemaType: 'ItemList'
    }
  },
  {
    id: 'route-weapons',
    tabKey: 'weapons',
    path: '/weapons',
    title: 'Arsenal & Ballistics Database',
    category: 'core',
    categoryLabel: 'Core Operations & Intel',
    accessLevel: 'Public',
    description: 'Military-grade weapons armory with weapon classifications, Time-To-Kill (TTK) estimates, damage-per-second (DPS) matrices, and attachment specs.',
    userStory: 'As a tactical player, I want to analyze weapon ballistics, recoil coefficients, fire rates, and attachment modifications.',
    coreFeatures: [
      'Comprehensive categories (Handguns, SMGs, Rifles, Shotguns, Heavy, Snipers, Melee)',
      'Computed Damage Per Second (DPS) & TTK against armored and unarmored targets',
      'Attachment customizer (Extended Mags, Suppressors, Holographic Sights, Compensators)',
      'Side-by-side comparative ballistic radar graphs'
    ],
    firestoreCollections: [],
    localStorageKeys: ['gta6_weapons_cache'],
    apiEndpoints: ['GET /api/weapons'],
    clientComponents: ['WeaponsArmoryTab', 'WeaponSpecCard', 'BallisticRadarChart'],
    seoMetadata: {
      title: 'GTA 6 Weapons & Arsenal Database — ViceIntel',
      description: 'Compare firearm damages, rate of fire, recoil statistics, and DPS metrics across the GTA VI weapon catalog.',
      schemaType: 'ItemList'
    }
  },
  {
    id: 'route-comparison',
    tabKey: 'comparison',
    path: '/comparison',
    title: 'Dual Spec Matrix & Radar Diff',
    category: 'core',
    categoryLabel: 'Core Operations & Intel',
    accessLevel: 'Public',
    description: 'Interactive comparison workbench for comparing two vehicles or two weapons with synchronized radar charts and stat differential metrics.',
    userStory: 'As an enthusiast, I want to compare the Grotti Cheetah vs Pegassi Ignus to find the best acceleration or handling balance.',
    coreFeatures: [
      'Multi-entity selector with search and quick filter dropdowns',
      'Comparative radar polygon visualization mapping 5 key performance axes',
      'Color-coded metric win/loss badges highlighting superior specs',
      'Shareable comparison URLs with pre-loaded entity query parameters'
    ],
    firestoreCollections: [],
    localStorageKeys: ['gta6_vehicles_cache', 'gta6_weapons_cache'],
    apiEndpoints: ['GET /api/vehicles', 'GET /api/weapons'],
    clientComponents: ['ComparisonTab', 'RadarChartCompare', 'SpecDiffBadge'],
    seoMetadata: {
      title: 'GTA 6 Vehicle & Weapon Comparison Matrix — ViceIntel',
      description: 'Side-by-side performance spec matrix comparing top speeds, handling, TTK, and prices in GTA VI.',
      schemaType: 'WebPage'
    }
  },
  {
    id: 'route-mod-calc',
    tabKey: 'mod-calculator',
    path: '/mod-calculator',
    title: 'Performance Tuner & Mod Lab',
    category: 'engineering',
    categoryLabel: 'Performance Engineering & Modding',
    accessLevel: 'Public',
    description: 'Vehicle tuning simulator calculating horsepower gains, top speed alterations, transmission shift times, and handling adjustments based on part upgrades.',
    userStory: 'As a FiveM tuner, I want to calculate the cost and performance impact of Stage 3 Turbo, Race Transmission, and Ceramic Brakes.',
    coreFeatures: [
      'Interactive engine upgrade sliders (Turbo Stages 1-4, EMS Tuning, Race Cams)',
      'Drivetrain modifications (AWD / RWD Bias, Ceramic Brakes, Track Suspension)',
      'Calculated 0-60 mph acceleration curve & estimated quarter-mile times',
      'Export custom builds directly to community repository or clipboard'
    ],
    firestoreCollections: ['communityBuilds'],
    localStorageKeys: ['gta6_saved_mod_builds'],
    apiEndpoints: ['POST /api/builds'],
    clientComponents: ['ModBuilderCalculator', 'DynoGraphCanvas', 'TunePresetPicker'],
    seoMetadata: {
      title: 'GTA 6 Vehicle Performance & Mod Calculator — ViceIntel',
      description: 'Simulate vehicle upgrades, horsepower gains, and top speed improvements with the Vice City tuning lab.',
      schemaType: 'WebApplication'
    }
  },
  {
    id: 'route-roi-calc',
    tabKey: 'roi-calculator',
    path: '/roi-calculator',
    title: 'Business Empire & ROI Optimizer',
    category: 'engineering',
    categoryLabel: 'Performance Engineering & Modding',
    accessLevel: 'Public',
    description: 'Financial planning tool modeling GTA VI business properties (Nightclubs, Chop Shops, Smuggling Docks, Vehicle Warehouses) and break-even timelines.',
    userStory: 'As a criminal mastermind, I want to determine whether upgrading Nightclub Staff and Equipment delivers faster ROI than a Chop Shop.',
    coreFeatures: [
      'Simulated revenue generators with upgrade cost amortizations',
      'Dynamic break-even timeline chart projecting daily, weekly, and monthly net yields',
      'Operating expense sliders factoring in staff wages and security upgrades',
      'Exportable investment audit reports with unique report identifiers'
    ],
    firestoreCollections: [],
    localStorageKeys: ['gta6_roi_saved_reports'],
    apiEndpoints: ['POST /api/roi/calculate'],
    clientComponents: ['BusinessRoiCalculator', 'ProfitBreakdownChart'],
    seoMetadata: {
      title: 'GTA 6 Business Empire & ROI Calculator — ViceIntel',
      description: 'Calculate hourly payouts, upgrade costs, and break-even days for Vice City businesses and properties.',
      schemaType: 'WebApplication'
    }
  },
  {
    id: 'route-handling-editor',
    tabKey: 'handling-editor',
    path: '/handling-editor',
    title: 'Physics & Handling.meta Workbench',
    category: 'engineering',
    categoryLabel: 'Performance Engineering & Modding',
    accessLevel: 'Public',
    description: 'Developer and server owner workbench for fine-tuning GTA VI vehicle physics and exporting formatted `handling.meta` XML.',
    userStory: 'As a FiveM developer, I want to calibrate fMass, fInitialDragCoeff, fDriveBiasFront, and fTractionCurveMax with live validation.',
    coreFeatures: [
      'Calibrated physics sliders (Mass, Drag Coefficient, Drive Bias, Downforce, Suspension)',
      'Real-time cornering stability, drift tendency, and rollover resistance calculations',
      '1-Click `handling.meta` XML code generation and copy-to-clipboard formatter',
      'Preset archetypes: Track Racing, Drift Spec, Offroad Baja, Heavy Armored'
    ],
    firestoreCollections: [],
    localStorageKeys: ['gta6_handling_custom_presets'],
    apiEndpoints: [],
    clientComponents: ['HandlingEditorTab', 'MetaXmlPreviewModal', 'PhysicsVisualizer'],
    seoMetadata: {
      title: 'GTA 6 / FiveM Handling.meta Physics Editor — ViceIntel',
      description: 'Generate, tune, and export custom handling.meta XML configuration files for GTA VI and FiveM vehicles.',
      schemaType: 'WebApplication'
    }
  },
  {
    id: 'route-economy-balancer',
    tabKey: 'economy-balancer',
    path: '/economy-balancer',
    title: 'Server Economy Balancer & Exporter',
    category: 'engineering',
    categoryLabel: 'Performance Engineering & Modding',
    accessLevel: 'Public',
    description: 'FiveM roleplay economy balancing suite supporting QBCore, ESX Legacy, and QBX framework configurations.',
    userStory: 'As an RP server owner, I want to balance legal job wages vs criminal risk-reward payouts to prevent hyper-inflation.',
    coreFeatures: [
      'Framework targets: QBCore, ESX Legacy, QBX (Qbox Core), Custom JSON',
      'Job wage matrices (Police, EMS, Mechanic, Taxi, Delivery, Mining)',
      'Black market multipliers with risk-vs-reward inflation safeguards',
      'Exportable SQL migrations and Lua configuration tables'
    ],
    firestoreCollections: [],
    localStorageKeys: ['gta6_economy_presets'],
    apiEndpoints: [],
    clientComponents: ['EconomyBalancerTab', 'JobPayoutMatrix', 'EconomyLuaExporter'],
    seoMetadata: {
      title: 'FiveM / GTA 6 RP Server Economy Balancer — ViceIntel',
      description: 'Balance server jobs, inflation, and black market economies for QBCore, ESX, and QBX frameworks.',
      schemaType: 'WebApplication'
    }
  },
  {
    id: 'route-map',
    tabKey: 'map',
    path: '/map',
    title: 'Interactive GPS & Squad Radar',
    category: 'geospatial',
    categoryLabel: 'Tactical Geospatial & Squad Radar',
    accessLevel: 'Public',
    description: 'High-definition Vice City interactive tactical map with Points of Interest (POIs), heist prep markers, and multiplayer Squad Radar live pinging.',
    userStory: 'As a squad leader, I want to share a Room Code with my crew to drop real-time tactical pings and mark escape routes.',
    coreFeatures: [
      'Multi-layer POI toggles (Safehouses, Heist Prep, Weapon Caches, Chop Shops, Stunt Jumps)',
      'Squad Radar multiplayer room sharing with real-time peer pings and 10s auto-fade waypoints',
      'Custom GPS route distance and estimated driving travel time calculator',
      'Full offline tile caching and high-DPI canvas zoom & pan rendering'
    ],
    firestoreCollections: ['squadRadarRooms'],
    localStorageKeys: ['gta6_map_active_room', 'gta6_saved_waypoints'],
    apiEndpoints: [],
    clientComponents: ['InteractiveMap', 'SquadMapCanvas', 'SquadRadarHUD', 'PoiFilterBar'],
    seoMetadata: {
      title: 'GTA 6 Vice City Interactive GPS & Tactical Map — ViceIntel',
      description: 'High-res interactive map of Vice City & Leonida with POI markers, stunt jumps, and real-time Squad Radar room pings.',
      schemaType: 'Map'
    }
  },
  {
    id: 'route-rp-servers',
    tabKey: 'rp-servers',
    path: '/rp-servers',
    title: 'FiveM RP Server Directory',
    category: 'rp',
    categoryLabel: 'FiveM RP & Whitelist Suite',
    accessLevel: 'Public',
    description: 'Directory of top GTA VI and FiveM roleplay servers with live player density counters, latency monitors, 1-click F8 connect commands, and sponsor badges.',
    userStory: 'As an RP player, I want to find high-population, whitelisted servers, copy the connect string, and apply for whitelist status.',
    coreFeatures: [
      'Live server traffic ranker with real-time player counts and queue telemetry',
      '1-Click "Copy F8 Console Command" (`connect ip:port`) with confirmation toast',
      'Direct links to Whitelist Form Builder, Application Portal, and Staff Queue',
      'Community submission modal for server owners to list their server'
    ],
    firestoreCollections: ['rpServers', 'pendingApprovals'],
    localStorageKeys: ['gta6_rp_servers_cache'],
    apiEndpoints: ['POST /api/rp-servers', 'POST /api/rp-servers/ping', 'GET /api/cron/fivem-traffic-sync'],
    clientComponents: ['RpServerDirectory', 'ServerCard', 'SubmitServerModal'],
    seoMetadata: {
      title: 'GTA 6 & FiveM Roleplay Server Directory — ViceIntel',
      description: 'Discover active GTA VI FiveM roleplay servers, view live player counts, and copy instant connect commands.',
      schemaType: 'CollectionPage'
    }
  },
  {
    id: 'route-server-manage',
    tabKey: 'server-manage',
    path: '/servers/[slug]/manage',
    dynamicParams: 'slug = vice-city-life-rp',
    title: 'No-Code Whitelist Form Builder',
    category: 'rp',
    categoryLabel: 'FiveM RP & Whitelist Suite',
    accessLevel: 'Staff (L3)',
    description: 'No-code dynamic application form builder allowing server owners and staff to configure custom question templates, Discord webhooks, and guild roles.',
    userStory: 'As a server owner, I want to build a customized 8-question whitelist form with character background requirements and auto-route submissions to Discord.',
    coreFeatures: [
      'Drag-and-drop question builder supporting text, textarea, dropdown, multiple choice, number, and boolean',
      'Minimum word count enforceability for character backstories (e.g. 50+ words)',
      'Discord integration configurator (Target Guild ID, Whitelisted Role ID, Webhook URL)',
      'Live applicant form preview modal with real-time Firestore persistence'
    ],
    firestoreCollections: ['serverWhitelistForms'],
    localStorageKeys: [],
    apiEndpoints: ['POST /api/discord/webhook'],
    clientComponents: ['ServerManageFormTab', 'QuestionEditorCard', 'DiscordGuildConfigCard'],
    seoMetadata: {
      title: 'No-Code Whitelist Form Builder & Discord Gateway — ViceIntel',
      description: 'Configure custom RP whitelist application templates, Discord webhook routing, and role requirements.',
      schemaType: 'WebApplication'
    }
  },
  {
    id: 'route-server-apply',
    tabKey: 'server-apply',
    path: '/servers/[slug]/apply',
    dynamicParams: 'slug = vice-city-life-rp',
    title: 'Player Whitelist Application Portal',
    category: 'rp',
    categoryLabel: 'FiveM RP & Whitelist Suite',
    accessLevel: 'Discord Linked',
    description: 'Player-facing whitelist application portal with mandatory Discord OAuth identity verification, custom scenario questions, and automated embed alerts.',
    userStory: 'As an applicant, I want to link my Discord account, fill out character backstories, and submit my application for staff review.',
    coreFeatures: [
      'Gated authentication ensuring applicant has linked a verified Discord account',
      'Dynamic question rendering based on server configuration with word count validators',
      'Automated rich Discord embed dispatch to staff review channels via webhook',
      'Instant redirection to live Status Tracker upon successful submission'
    ],
    firestoreCollections: ['serverWhitelistForms', 'whitelistApplications', 'userProfiles'],
    localStorageKeys: [],
    apiEndpoints: ['GET /api/auth/discord', 'POST /api/discord/webhook'],
    clientComponents: ['ServerApplyTab', 'DynamicFormRenderer', 'DiscordGateBanner'],
    seoMetadata: {
      title: 'Player Whitelist Application Portal — ViceIntel',
      description: 'Submit your character backstory, scenario responses, and verified Discord identity for RP server whitelist approval.',
      schemaType: 'WebPage'
    }
  },
  {
    id: 'route-server-review',
    tabKey: 'server-review',
    path: '/servers/[slug]/review',
    dynamicParams: 'slug = vice-city-life-rp',
    title: 'Staff Application Review Queue',
    category: 'rp',
    categoryLabel: 'FiveM RP & Whitelist Suite',
    accessLevel: 'Staff (L3)',
    description: 'Staff decision queue for reviewing incoming player applications, inspecting detailed scenario answers, recording internal notes, and triggering 1-click approvals.',
    userStory: 'As a server moderator, I want to filter pending applications, review backstory quality, and approve applicants with automatic Discord role webhooks.',
    coreFeatures: [
      'Real-time Firestore sync filtering by status (Pending, Under Review, Approved, Rejected)',
      'Deep applicant inspector modal with character details and reviewer internal notes',
      '1-Click "Approve" and "Reject" buttons dispatching formatted Discord webhook embeds',
      'Audit log tracking which staff member reviewed the application and decision timestamps'
    ],
    firestoreCollections: ['whitelistApplications', 'serverWhitelistForms'],
    localStorageKeys: [],
    apiEndpoints: ['POST /api/discord/webhook'],
    clientComponents: ['ServerReviewTab', 'ApplicationInspectorModal', 'QueueFilterToolbar'],
    seoMetadata: {
      title: 'Staff Whitelist Queue & Review Dashboard — ViceIntel',
      description: 'Staff review queue for inspecting applicant backstories, saving internal notes, and triggering 1-click Discord webhook approvals.',
      schemaType: 'WebApplication'
    }
  },
  {
    id: 'route-server-status',
    tabKey: 'server-status',
    path: '/servers/[slug]/status',
    dynamicParams: 'slug = vice-city-life-rp',
    title: 'Live Application Status Tracker',
    category: 'rp',
    categoryLabel: 'FiveM RP & Whitelist Suite',
    accessLevel: 'Registered User',
    description: 'Interactive applicant milestone timeline showing live review progress, reviewer comments, and next steps for joining the server.',
    userStory: 'As an applicant, I want to check whether my application has been reviewed by staff without needing to ask on Discord.',
    coreFeatures: [
      'Visual 4-step progress timeline: Submitted -> Queued -> Under Review -> Decision',
      'Real-time Firestore listener updating status instantly upon staff action',
      'Displays staff feedback / rejection reasons and re-application cooldown timer',
      'Quick-launch connect button enabled automatically upon approval'
    ],
    firestoreCollections: ['whitelistApplications'],
    localStorageKeys: [],
    apiEndpoints: [],
    clientComponents: ['ServerStatusTab', 'MilestoneTimeline', 'StaffFeedbackCard'],
    seoMetadata: {
      title: 'Live Whitelist Application Status Tracker — ViceIntel',
      description: 'Track the real-time review progress of your RP server whitelist application.',
      schemaType: 'WebPage'
    }
  },
  {
    id: 'route-chat',
    tabKey: 'chat',
    path: '/chat',
    title: 'Community Live Chat & VIP Hubs',
    category: 'comms',
    categoryLabel: 'Live Community Comms & VIP Hubs',
    accessLevel: 'Registered User',
    description: 'High-speed multiplayer chat with multi-channel support, rich asset drops (vehicles, weapons, gift cards), moderation controls, and WebRTC voice comms.',
    userStory: 'As a player, I want to talk with other players, share vehicle builds, drop Shark Card vouchers, and join low-latency voice channels.',
    coreFeatures: [
      'Channels: General, LFG Crews, Modding Lab, RP Hub, Staff Comms, Custom VIP Hubs',
      'Deduplication safeguard matching message IDs and content hashes across listeners',
      'Voice Comms & Screen Sharing with Document Picture-in-Picture (PiP) and Pop-out window support',
      'Moderation suite: Kick member from custom channel, Ban user, and Report message',
      'Shark Card gift voucher drops with 1-click redemption right in the chat feed'
    ],
    firestoreCollections: ['chatMessages', 'customChannels', 'chatReports'],
    localStorageKeys: ['gta6_chat_draft', 'gta6_voice_settings'],
    apiEndpoints: ['GET /api/chat', 'POST /api/chat', 'POST /api/chat/report'],
    clientComponents: ['CommunityChatTab', 'VoiceCommsModal', 'VideoStreamPlayer', 'RichAttachmentCard'],
    seoMetadata: {
      title: 'GTA 6 Community Live Chat & Player Hubs — ViceIntel',
      description: 'Join real-time player channels, voice comms, vehicle build drops, and VIP hubs for GTA VI.',
      schemaType: 'DiscussionForumPosting'
    }
  },
  {
    id: 'route-giftcards',
    tabKey: 'giftcards',
    path: '/giftcards',
    title: 'Shark Voucher & VIP Card Terminal',
    category: 'comms',
    categoryLabel: 'Live Community Comms & VIP Hubs',
    accessLevel: 'Public',
    description: 'Gift card and voucher terminal for purchasing Vice City credits, redeeming Shark Pack vouchers, and activating VIP perks.',
    userStory: 'As a player, I want to redeem a voucher code dropped by staff to receive $50,000 Vice City credits and 14 days of VIP status.',
    coreFeatures: [
      'Voucher tiers: Starter Pack ($20k VC), Crew Pack ($40k VC + 7d VIP), Executive Pack ($60k VC + 14d VIP), Max Empire ($100k VC + 30d VIP)',
      'Instant code validator verifying format against Firestore redemption ledger',
      'Staff generation tool for creating single-use giveaway codes',
      'Live account balance credit integration (`vcBalance` in `userProfiles`)'
    ],
    firestoreCollections: ['giftCards', 'userProfiles'],
    localStorageKeys: ['gta6_redeemed_codes_cache'],
    apiEndpoints: ['POST /api/giftcards/redeem', 'POST /api/giftcards/generate'],
    clientComponents: ['GiftCardTab', 'VoucherInputCard', 'SharkPackGrid'],
    seoMetadata: {
      title: 'Shark Card Vouchers & VIP Rewards Terminal — ViceIntel',
      description: 'Redeem Vice City Shark vouchers, gift cards, and activate VIP subscription perks.',
      schemaType: 'FinancialProduct'
    }
  },
  {
    id: 'route-profile',
    tabKey: 'profile',
    path: '/profile',
    title: 'Player Dossier & Profile',
    category: 'identity',
    categoryLabel: 'Player Dossier & Admin HQ',
    accessLevel: 'Registered User',
    description: 'User profile dashboard managing GamerTags (with 2-change/year lockout safeguard), GTA VI character avatars, Discord connection status, and notifications.',
    userStory: 'As a user, I want to customize my Vice City GamerTag, select a Lucia/Jason avatar, link Discord, and check my VIP expiration date.',
    coreFeatures: [
      'GamerTag uniqueness checker with 2-change annual rolling window limit indicator',
      'Dynamic vector avatar library (Lucia, Jason, Vice Squad Officer, Ocean DJ, Cartel Don, etc.)',
      'Discord OAuth account linkage badge showing Discord ID and linked username',
      'User notification center handling VIP updates and channel join approvals/declines'
    ],
    firestoreCollections: ['userProfiles', 'userNotifications'],
    localStorageKeys: ['gta6_user_profile_cache'],
    apiEndpoints: ['GET /api/auth/discord'],
    clientComponents: ['ProfileTab', 'AvatarSelectorModal', 'NotificationCenterCard'],
    seoMetadata: {
      title: 'Vice City Player Dossier & Profile — ViceIntel',
      description: 'Manage your GTA VI GamerTag, animated character avatar, VIP membership, and connected Discord account.',
      schemaType: 'ProfilePage'
    }
  },
  {
    id: 'route-admin',
    tabKey: 'admin',
    path: '/admin',
    title: 'Executive Admin & Moderation HQ',
    category: 'identity',
    categoryLabel: 'Player Dossier & Admin HQ',
    accessLevel: 'Executive Admin (L4)',
    description: 'Mission control console for system administrators to manage user accounts, assign clearance roles (L1-L4), synchronize VIP expirations, and moderate RP servers.',
    userStory: 'As an administrator, I want to inspect user accounts, demote/elevate roles, review submitted servers, and monitor system health.',
    coreFeatures: [
      'Real-time Firestore user table displaying clearance levels (L1 User, L2 VIP, L3 Staff, L4 Admin)',
      'Automated VIP expiration synchronization (L4 = Lifetime, L3 = Staff Account, L2 = 1 Year Rolling, L1 = Expired)',
      'One-click account suspension and unban toggles updating Firestore directly',
      'Pending RP server submission review queue with approve/reject actions'
    ],
    firestoreCollections: ['userProfiles', 'pendingApprovals', 'chatReports'],
    localStorageKeys: [],
    apiEndpoints: ['GET /api/admin/users', 'POST /api/admin/user/role', 'POST /api/admin/server/moderate'],
    clientComponents: ['AdminDashboardTab', 'UserManagementTable', 'ServerApprovalQueue'],
    seoMetadata: {
      title: 'Executive Admin HQ & Moderation Dashboard — ViceIntel',
      description: 'Administrative portal for user account management, role elevation, and platform moderation.',
      schemaType: 'AdminPage'
    }
  },
  {
    id: 'route-monetization',
    tabKey: 'monetization',
    path: '/monetization',
    title: 'VIP Pass & B2B Sponsorship Portal',
    category: 'monetization',
    categoryLabel: 'Monetization & Ads',
    accessLevel: 'Public',
    description: 'Commercial monetization hub offering B2C VIP Pass subscriptions ($3.99/mo) and B2B Sponsored RP Server Spots ($49/mo) with live AdSense banner simulator.',
    userStory: 'As a player or server owner, I want to upgrade to VIP for ad-free access or sponsor my server in top directory spots.',
    coreFeatures: [
      'Stripe Checkout gateway integration with dynamic pricing from environment variables',
      'B2C VIP Pass perks: Ad-Free browsing, custom chat hubs, golden VIP badge, priority voice bandwidth',
      'B2B Server Placement: Top-ranked slot on RP server directory with featured amber border',
      'Interactive Publisher Ad Preview toggle (AdSense / Mediavine top and sidebar slots)'
    ],
    firestoreCollections: ['userProfiles', 'rpServers'],
    localStorageKeys: [],
    apiEndpoints: ['GET /api/stripe/config', 'POST /api/stripe/checkout'],
    clientComponents: ['MonetizationTab', 'PaymentGatewayModal', 'AdSensePreviewBanner'],
    seoMetadata: {
      title: 'VIP Membership & B2B Server Sponsorship — ViceIntel',
      description: 'Subscribe to VIP ad-free access or sponsor your FiveM RP server with premier directory placement.',
      schemaType: 'Product'
    }
  },
  {
    id: 'route-blog',
    tabKey: 'blog',
    path: '/blog',
    title: 'Vice City Newswire & Leaks Blog',
    category: 'core',
    categoryLabel: 'Core Operations & Intel',
    accessLevel: 'Public',
    description: 'Official newswire journal covering Rockstar Games announcements, map analysis, trailer breakdowns, and community discussion threads.',
    userStory: 'As a fan, I want to read comprehensive articles about Vice City gameplay mechanics and leave comments.',
    coreFeatures: [
      'Categorized editorial feeds (Official News, Leaks & Rumors, Guides & Heists, PC Specs)',
      'Rich Markdown article renderer with high-res imagery and release timeline tables',
      'Community discussion comment section backed by local storage and Firestore sync',
      'Dynamic Article JSON-LD Schema markup for Google Discover and News indexing'
    ],
    firestoreCollections: ['blogComments'],
    localStorageKeys: ['gta6_blog_posts_cache'],
    apiEndpoints: ['GET /api/blog'],
    clientComponents: ['BlogTab', 'ArticleViewerModal', 'CommentSection'],
    seoMetadata: {
      title: 'GTA 6 News, Leaks & Official Newswire — ViceIntel',
      description: 'The latest Rockstar Games announcements, trailer analyses, and confirmed features for GTA VI.',
      schemaType: 'Blog'
    }
  },
  {
    id: 'route-seo-hub',
    tabKey: 'seo-hub',
    path: '/seo-hub',
    title: 'Midnight Spider & pSEO Hub',
    category: 'seo_docs',
    categoryLabel: 'SEO Automation & Documentation',
    accessLevel: 'Public',
    description: 'Autonomous midnight news crawler and programmatic SEO engine powered by Gemini AI with permanent Firestore storage and dynamic landing page generation.',
    userStory: 'As a visitor or SEO bot, I want to browse indexed topic pages generated from recent Rockstar Games news and leak intelligence.',
    coreFeatures: [
      'Automated background spider crawling news via Gemini 3.7 Flash and Google Search grounding',
      'Permanent Firestore collection (`pseoArticles`) storing full article content, FAQs, and schemas',
      'Interactive crawler trigger button for on-demand intel generation (`POST /api/seo/auto-generate`)',
      'Automatic sitemap XML generator endpoint (`GET /api/seo/sitemap.xml`) indexing all articles'
    ],
    firestoreCollections: ['pseoArticles'],
    localStorageKeys: [],
    apiEndpoints: ['GET /api/seo/pages', 'POST /api/seo/auto-generate', 'POST /api/cron/midnight-spider'],
    clientComponents: ['GtaSeoKnowledgeHub', 'PseoArticleReader', 'CrawlerStatusCard'],
    seoMetadata: {
      title: 'GTA 6 Programmatic Intel Hub & Automated Newswire — ViceIntel',
      description: 'Real-time AI synthesized knowledge base indexing all verified GTA 6 news, leaks, and system updates.',
      schemaType: 'CollectionPage'
    }
  },
  {
    id: 'route-docs',
    tabKey: 'docs',
    path: '/docs',
    title: 'System & Architecture Docs',
    category: 'seo_docs',
    categoryLabel: 'SEO Automation & Documentation',
    accessLevel: 'Public',
    description: 'Complete technical reference for Express REST APIs, Gemini AI integration, data models, deployment runtimes, and the Interactive Website Model.',
    userStory: 'As a developer or reviewer, I want to explore every page route, test live endpoints in the playground, and inspect the platform architecture.',
    coreFeatures: [
      'Interactive Website Route Explorer & Topological Architecture Map',
      'REST API Reference table with copyable endpoints, schemas, and live tester playground',
      'Gemini AI Tactical Assistant integration guide with fallback patterns',
      'Cloud Run production build scripts (`esbuild server.ts --bundle --platform=node`)'
    ],
    firestoreCollections: [],
    localStorageKeys: [],
    apiEndpoints: ['GET /api/health', 'GET /api/vehicles', 'GET /api/chat', 'POST /api/ai/assistant'],
    clientComponents: ['DocumentationTab', 'WebsiteInteractiveModel', 'PseoArchitectureTab'],
    seoMetadata: {
      title: 'GTA VI Central System & API Documentation — ViceIntel',
      description: 'Complete technical specification for the Express REST server, Gemini AI integration, and Cloud Run setup.',
      schemaType: 'TechArticle'
    }
  }
];

interface WebsiteInteractiveModelProps {
  onNavigate?: (tab: ActiveTab, targetId?: string) => void;
}

export const WebsiteInteractiveModel: React.FC<WebsiteInteractiveModelProps> = ({ onNavigate }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-server-manage');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Mini Interactive Route Simulators State
  const [simulatorState, setSimulatorState] = useState<any>({
    // Form Builder sim
    simQuestionText: 'What is your character name and motivation?',
    simQuestionType: 'textarea',
    simMinWords: 25,
    simQuestionsList: [
      { id: 'q1', text: 'Character Backstory (Origin & Arrival in Vice City)', type: 'textarea', minWords: 50 },
      { id: 'q2', text: 'Define Fail-RP and give a realistic scenario', type: 'textarea', minWords: 30 },
      { id: 'q3', text: 'Preferred Character Faction / Alignment', type: 'dropdown', options: ['Civilian', 'Cartel', 'Police', 'EMS'] }
    ],
    // ROI sim
    simBusinessInvestment: 1500000,
    simHourlyYield: 45000,
    simDailyHours: 4,
    // Handling sim
    simMass: 1450,
    simDragCoeff: 8.5,
    simDriveBias: 0.3,
    // GamerTag sim
    simGamerTagInput: 'ViceRacer_2026',
    simGamerTagValid: true,
    // Discord Webhook sim
    simWebhookStatus: 'ready'
  });

  const categories = [
    { id: 'all', label: 'All Platform Routes', icon: Layers, count: PLATFORM_ROUTES_DATA.length },
    { id: 'core', label: 'Core Intel & Catalog', icon: Car, count: PLATFORM_ROUTES_DATA.filter(r => r.category === 'core').length },
    { id: 'engineering', label: 'Tuning & Economy', icon: Sliders, count: PLATFORM_ROUTES_DATA.filter(r => r.category === 'engineering').length },
    { id: 'geospatial', label: 'Tactical Map & Radar', icon: MapPin, count: PLATFORM_ROUTES_DATA.filter(r => r.category === 'geospatial').length },
    { id: 'rp', label: 'FiveM RP & Whitelist', icon: ShieldCheck, count: PLATFORM_ROUTES_DATA.filter(r => r.category === 'rp').length },
    { id: 'comms', label: 'Live Comms & VIP Hubs', icon: MessageSquare, count: PLATFORM_ROUTES_DATA.filter(r => r.category === 'comms').length },
    { id: 'identity', label: 'Dossier & Admin HQ', icon: User, count: PLATFORM_ROUTES_DATA.filter(r => r.category === 'identity').length },
    { id: 'monetization', label: 'Monetization & Ads', icon: CreditCard, count: PLATFORM_ROUTES_DATA.filter(r => r.category === 'monetization').length },
    { id: 'seo_docs', label: 'SEO & System Docs', icon: Zap, count: PLATFORM_ROUTES_DATA.filter(r => r.category === 'seo_docs').length }
  ];

  const filteredRoutes = useMemo(() => {
    return PLATFORM_ROUTES_DATA.filter((route) => {
      const matchesCategory = filterCategory === 'all' || route.category === filterCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.coreFeatures.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [filterCategory, searchQuery]);

  const selectedRoute = useMemo(() => {
    return PLATFORM_ROUTES_DATA.find((r) => r.id === selectedRouteId) || PLATFORM_ROUTES_DATA[0];
  }, [selectedRouteId]);

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAddSimQuestion = () => {
    if (!simulatorState.simQuestionText.trim()) return;
    const newQ = {
      id: `q_${Date.now().toString(36)}`,
      text: simulatorState.simQuestionText.trim(),
      type: simulatorState.simQuestionType,
      minWords: simulatorState.simQuestionType === 'textarea' ? Number(simulatorState.simMinWords) : undefined
    };
    setSimulatorState((prev: any) => ({
      ...prev,
      simQuestionsList: [...prev.simQuestionsList, newQ],
      simQuestionText: ''
    }));
  };

  const handleDeleteSimQuestion = (id: string) => {
    setSimulatorState((prev: any) => ({
      ...prev,
      simQuestionsList: prev.simQuestionsList.filter((q: any) => q.id !== id)
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Interactive Model Header */}
      <div className="bg-zinc-900/95 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" /> Platform Route Model
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Interactive
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              {ENV.APP_NAME} Full Website Interactive Architecture Model
            </h2>
            <p className="text-xs lg:text-sm text-zinc-400 max-w-3xl leading-relaxed">
              Explore every single client URL route, dynamic parameter schema, data persistence pipeline, REST endpoint, and live interactive feature simulator in the {ENV.APP_NAME} platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800 text-center">
              <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Total Routes</p>
              <p className="text-lg font-black text-indigo-400">{PLATFORM_ROUTES_DATA.length}</p>
            </div>
            <div className="bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800 text-center">
              <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Collections</p>
              <p className="text-lg font-black text-emerald-400">12</p>
            </div>
            <div className="bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800 text-center">
              <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold">REST APIs</p>
              <p className="text-lg font-black text-amber-400">18</p>
            </div>
          </div>
        </div>

        {/* Global Search & Category Filters */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search platform routes, capabilities, Firestore collections, or APIs (e.g. whitelist, discord, handling, radar)..."
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-indigo-700 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Route Selector & Detailed Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Filtered Route Cards (4 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Available Routes ({filteredRoutes.length})
            </span>
            <span className="text-[11px] text-zinc-500">Click route to inspect</span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredRoutes.map((route) => {
              const isSelected = route.id === selectedRoute.id;
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white">{route.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          route.accessLevel.includes('Admin')
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : route.accessLevel.includes('Staff')
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : route.accessLevel.includes('VIP')
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : route.accessLevel.includes('Discord')
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {route.accessLevel}
                        </span>
                      </div>
                      <code className="text-xs text-indigo-300 font-mono block truncate">
                        {route.path}
                      </code>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {route.description}
                      </p>
                    </div>

                    <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-indigo-400 translate-x-0.5' : 'text-zinc-600'}`} />
                  </div>

                  {/* Feature Tag Highlights */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span className="truncate">{route.categoryLabel}</span>
                    <span className="shrink-0 text-indigo-400">{route.coreFeatures.length} features</span>
                  </div>
                </div>
              );
            })}

            {filteredRoutes.length === 0 && (
              <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                <Search className="w-6 h-6 text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400 font-bold">No routes match your search</p>
                <p className="text-[11px] text-zinc-600">Try searching for keywords like "whitelist", "mod", "radar", or "chat".</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: In-Depth Route Inspector & Live Simulator (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Route Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
            
            {/* Header with Direct Navigation Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    Tab Key: {selectedRoute.tabKey}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {selectedRoute.categoryLabel}
                  </span>
                </div>
                <h3 className="text-lg lg:text-xl font-black text-white tracking-tight">
                  {selectedRoute.title}
                </h3>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-emerald-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 font-bold">
                    {selectedRoute.path}
                  </code>
                  <button
                    onClick={() => handleCopy(selectedRoute.path)}
                    className="p-1 text-zinc-500 hover:text-white rounded bg-zinc-950 border border-zinc-800 cursor-pointer"
                    title="Copy Route Path"
                  >
                    {copiedText === selectedRoute.path ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Action Button: Jump to Real Route in App */}
              <button
                onClick={() => {
                  if (onNavigate) {
                    if (selectedRoute.tabKey.startsWith('server-')) {
                      onNavigate(selectedRoute.tabKey, 'vice-city-life-rp');
                    } else {
                      onNavigate(selectedRoute.tabKey);
                    }
                  } else {
                    window.location.href = selectedRoute.path.replace('[slug]', 'vice-city-life-rp');
                  }
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0"
              >
                <span>Launch Live Route</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Persona & User Story */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 block">
                User Story & Persona
              </span>
              <p className="text-xs text-zinc-300 italic leading-relaxed">
                "{selectedRoute.userStory}"
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Features & Capabilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedRoute.coreFeatures.map((feat, idx) => (
                  <div key={idx} className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-zinc-300 leading-snug">{feat}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Topology & Data Model */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Firestore
                </span>
                {selectedRoute.firestoreCollections.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedRoute.firestoreCollections.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800 text-[10px] font-mono text-indigo-300">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-600">Pure client computation</p>
                )}
              </div>

              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" /> REST APIs / Webhooks
                </span>
                {selectedRoute.apiEndpoints.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedRoute.apiEndpoints.map((api, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-[10px] font-mono text-emerald-300">
                        {api}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-600">No server endpoints called</p>
                )}
              </div>

              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" /> React Components
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedRoute.clientComponents.map((comp, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-[10px] font-mono text-amber-300">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* SEO & Meta Specifications */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400" /> Dynamic Schema.org & SEO Header
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Schema Type:</span>
                  <span className="text-indigo-300 font-mono font-bold">{selectedRoute.seoMetadata.schemaType}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Document Title:</span>
                  <span className="text-zinc-300 font-semibold">{selectedRoute.seoMetadata.title}</span>
                </div>
              </div>
            </div>

          </div>

          {/* INTERACTIVE ROUTE SIMULATOR (DEDICATED FOR EACH ROUTE TYPE) */}
          <div className="bg-zinc-900/90 border border-indigo-500/20 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">
                  Live Interactive Simulator: {selectedRoute.title}
                </h4>
              </div>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                Interactive Testing Sandbox
              </span>
            </div>

            {/* SIMULATOR 1: NO-CODE FORM BUILDER & DISCORD GATE SIMULATOR (for server-manage / server-apply) */}
            {(selectedRoute.id === 'route-server-manage' || selectedRoute.id === 'route-server-apply' || selectedRoute.id === 'route-server-review' || selectedRoute.id === 'route-server-status') && (
              <div className="space-y-4">
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">Question Template Configurator</span>
                    <span className="text-[11px] text-zinc-500">{simulatorState.simQuestionsList.length} configured</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={simulatorState.simQuestionText}
                      onChange={(e) => setSimulatorState((prev: any) => ({ ...prev, simQuestionText: e.target.value }))}
                      placeholder="Add a new custom question (e.g. Past Roleplay Experience)..."
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <select
                      value={simulatorState.simQuestionType}
                      onChange={(e) => setSimulatorState((prev: any) => ({ ...prev, simQuestionType: e.target.value }))}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="textarea">Paragraph (textarea)</option>
                      <option value="text">Short Answer (text)</option>
                      <option value="dropdown">Dropdown Options</option>
                      <option value="boolean">Yes / No Toggle</option>
                    </select>
                    <button
                      onClick={handleAddSimQuestion}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                    >
                      + Add Question
                    </button>
                  </div>

                  {/* Active Questions Preview */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    {simulatorState.simQuestionsList.map((q: any, idx: number) => (
                      <div key={q.id} className="flex items-center justify-between bg-zinc-900/90 px-3 py-2 rounded-lg border border-zinc-800 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 font-mono text-[10px]">#{idx + 1}</span>
                          <span className="text-white font-medium">{q.text}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">{q.type}</span>
                          {q.minWords && <span className="text-[10px] text-amber-400 font-mono">min {q.minWords} words</span>}
                        </div>
                        <button
                          onClick={() => handleDeleteSimQuestion(q.id)}
                          className="text-zinc-500 hover:text-rose-400 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Discord Embed Payload */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" /> Simulated Discord Webhook Embed (`/api/discord/webhook`)
                  </span>
                  <div className="bg-zinc-900 border-l-4 border-indigo-500 p-3 rounded text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-indigo-300 font-bold">
                      <span>🎮 Whitelist Application • Vice City Life RP</span>
                      <span className="text-[10px] text-zinc-500">2026-08-14</span>
                    </div>
                    <p className="text-zinc-300 text-[11px]">
                      **Applicant:** <span className="text-emerald-400">@VicePlayer#0001</span> (Discord ID: `123456789012345678`)
                    </p>
                    <p className="text-zinc-400 text-[11px]">
                      **Questions Configured:** {simulatorState.simQuestionsList.length} total questions
                    </p>
                    <div className="flex gap-2 pt-2">
                      <span className="px-2 py-0.5 bg-emerald-600/30 text-emerald-300 rounded text-[10px] font-bold">
                        Status: Pending Review
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR 2: ROI SIMULATOR (for roi-calculator) */}
            {selectedRoute.id === 'route-roi-calc' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                    <label className="text-[11px] text-zinc-400">Initial Property Cost</label>
                    <input
                      type="number"
                      value={simulatorState.simBusinessInvestment}
                      onChange={(e) => setSimulatorState((prev: any) => ({ ...prev, simBusinessInvestment: Number(e.target.value) }))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                    <label className="text-[11px] text-zinc-400">Hourly Revenue ($)</label>
                    <input
                      type="number"
                      value={simulatorState.simHourlyYield}
                      onChange={(e) => setSimulatorState((prev: any) => ({ ...prev, simHourlyYield: Number(e.target.value) }))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                    <label className="text-[11px] text-zinc-400">Active Hours/Day ({simulatorState.simDailyHours}h)</label>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={simulatorState.simDailyHours}
                      onChange={(e) => setSimulatorState((prev: any) => ({ ...prev, simDailyHours: Number(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block">Daily Yield:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      ${(simulatorState.simHourlyYield * simulatorState.simDailyHours).toLocaleString()} / day
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Break-Even Point:</span>
                    <span className="text-indigo-400 font-bold text-sm">
                      {Math.ceil(simulatorState.simBusinessInvestment / (simulatorState.simHourlyYield * simulatorState.simDailyHours))} Days
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR 3: HANDLING.META WORKBENCH (for handling-editor) */}
            {selectedRoute.id === 'route-handling-editor' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Mass (fMass)</span>
                      <span className="text-indigo-400 font-mono">{simulatorState.simMass} kg</span>
                    </div>
                    <input
                      type="range"
                      min={800}
                      max={3500}
                      step={50}
                      value={simulatorState.simMass}
                      onChange={(e) => setSimulatorState((prev: any) => ({ ...prev, simMass: Number(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Drag Coeff</span>
                      <span className="text-indigo-400 font-mono">{simulatorState.simDragCoeff}</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={15.0}
                      step={0.5}
                      value={simulatorState.simDragCoeff}
                      onChange={(e) => setSimulatorState((prev: any) => ({ ...prev, simDragCoeff: Number(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Drive Bias</span>
                      <span className="text-indigo-400 font-mono">{simulatorState.simDriveBias} ({Math.round((1 - simulatorState.simDriveBias)*100)}% RWD)</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={simulatorState.simDriveBias}
                      onChange={(e) => setSimulatorState((prev: any) => ({ ...prev, simDriveBias: Number(e.target.value) }))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Generated XML Snippet */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-indigo-300 space-y-1">
                  <span className="text-[10px] text-zinc-500 block">&lt;!-- Live Exported handling.meta XML --&gt;</span>
                  <p>&lt;Item type="CHandlingData"&gt;</p>
                  <p className="pl-4">&lt;handlingName&gt;VICE_TUNED_SPEC&lt;/handlingName&gt;</p>
                  <p className="pl-4">&lt;fMass value="{simulatorState.simMass}.000000" /&gt;</p>
                  <p className="pl-4">&lt;fInitialDragCoeff value="{simulatorState.simDragCoeff}.000000" /&gt;</p>
                  <p className="pl-4">&lt;fDriveBiasFront value="{simulatorState.simDriveBias}.000000" /&gt;</p>
                  <p>&lt;/Item&gt;</p>
                </div>
              </div>
            )}

            {/* DEFAULT SIMULATOR FOR ALL OTHER ROUTES */}
            {!['route-server-manage', 'route-server-apply', 'route-server-review', 'route-server-status', 'route-roi-calc', 'route-handling-editor'].includes(selectedRoute.id) && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-300 font-bold">Route Lifecycle Simulator</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> State Active
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                    <span className="text-zinc-500 block text-[9px]">1. ROUTE MATCH</span>
                    <span className="text-white font-bold">{selectedRoute.path}</span>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                    <span className="text-zinc-500 block text-[9px]">2. ACCESS CHECK</span>
                    <span className="text-emerald-400 font-bold">{selectedRoute.accessLevel}</span>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                    <span className="text-zinc-500 block text-[9px]">3. CACHE SYNC</span>
                    <span className="text-amber-400 font-bold">LocalForage OK</span>
                  </div>
                  <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                    <span className="text-zinc-500 block text-[9px]">4. REALTIME SYNC</span>
                    <span className="text-indigo-400 font-bold">onSnapshot Ready</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
