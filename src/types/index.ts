export type VehicleCategory = 'Super' | 'Sports' | 'Muscle' | 'Off-Road' | 'Motorcycles' | 'Helicopters' | 'Boats';

export interface Vehicle {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: VehicleCategory;
  price: number;
  tradePrice?: number;
  tradePriceCondition?: string;
  dealer: 'Legendary Motorsport' | 'Southern San Andreas Super Autos' | 'Warstock Cache & Carry' | 'DockTease' | 'Elitás Travel';
  topSpeedMph: number;
  acceleration: number; // 0 - 100
  braking: number; // 0 - 100
  handling: number; // 0 - 100
  drivetrain: 'AWD' | 'RWD' | 'FWD';
  capacity: number;
  description: string;
  imageUrl: string;
  featuredInTrailer: boolean;
  isCustomizable: boolean;
  baseModdingBudget: number;
  updatedAt?: number;
  version?: number;
  imageVersion?: number;
}

export type WeaponCategory = 'Handguns' | 'Submachine Guns' | 'Assault Rifles' | 'Shotguns' | 'Sniper Rifles' | 'Heavy Weapons' | 'Melee';

export interface WeaponAttachment {
  id: string;
  name: string;
  cost: number;
  effect: string;
}

export interface Weapon {
  id: string;
  slug: string;
  name: string;
  manufacturer: string;
  category: WeaponCategory;
  damage: number; // 0 - 100
  fireRate: number; // 0 - 100
  accuracy: number; // 0 - 100
  range: number; // 0 - 100
  magazineSize: number;
  ttkMs: number; // time to kill in ms
  unlockRank: number;
  price: number;
  description: string;
  imageUrl: string;
  attachments: WeaponAttachment[];
  updatedAt?: number;
  version?: number;
  imageVersion?: number;
}

export type CharacterRole = 'Protagonist' | 'Supporting' | 'Antagonist' | 'Faction Boss' | 'Law Enforcement';

export interface Character {
  id: string;
  slug: string;
  name: string;
  role: CharacterRole;
  faction: string;
  description: string;
  voiceActor?: string;
  specialAbility?: string;
  imageUrl: string;
  avatarUrl?: string;
  status: 'Alive' | 'Active' | 'In Custody' | 'Unknown';
  firstAppeared: string;
  trailerTimestamp?: string;
  trailerScene?: string;
  keyTraits: string[];
  location?: string;
  relationship?: string;
  heistRole?: string;
  leonidaQuote?: string;
  socialHandle?: string;
  leonidaMoment?: string;
  trailerFrameDesc?: string;
  realTrailerVisual?: string;
  updatedAt?: number;
  version?: number;
  imageVersion?: number;
}

export interface ModUpgradeOption {
  id: string;
  name: string;
  category: 'Engine' | 'Transmission' | 'Brakes' | 'Turbo' | 'Armor' | 'Suspension' | 'Cosmetics';
  cost: number;
  topSpeedDelta: number;
  accelDelta: number;
  handlingDelta: number;
  imageUrl?: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  type: string;
  location: string;
  purchasePrice: number;
  maxDailyIncome: number;
  setupCost: number;
  maxUpgradesCost: number;
  payoutFrequencyHours: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  riskRating?: string;
  description: string;
  imageUrl: string;
}

export type ServerWhitelistMode = 'ai_fast_track' | 'external_official' | 'open_public';

export interface DiscordGuildVerification {
  verified: boolean;
  guildId: string;
  guildName?: string;
  verifiedAt: number;
  ownerDiscordId?: string;
  userRoleInGuild?: 'owner' | 'administrator' | 'manager' | 'member';
  isGuildOwnerOrAdmin?: boolean;
}

export interface RpServer {
  id: string;
  name: string;
  serverSlug?: string;
  framework: 'FiveM' | 'VMP' | 'Custom C#';
  playerCount: number;
  maxPlayers: number;
  ping: number;
  isWhitelisted: boolean;
  whitelistMode?: ServerWhitelistMode;
  isManagedPartner?: boolean;
  ownerUid?: string;
  ownerDiscordId?: string;
  planTier?: string;
  isSubscriptionActive?: boolean;
  isVerifiedServerOwner?: boolean;
  stripeSubscriptionId?: string;
  isClaimed?: boolean;
  claimedByUid?: string;
  claimedByDiscordId?: string;
  claimedByDiscordUsername?: string;
  claimedAt?: number;
  discordGuildId?: string;
  discordGuildVerification?: DiscordGuildVerification;
  officialWebsiteUrl?: string;
  officialDiscordUrl?: string;
  averageReviewTime?: string;
  tags: string[];
  region: 'NA East' | 'NA West' | 'EU Central' | 'SA';
  connectUrl: string;
  description: string;
  status?: 'online' | 'busy' | 'maintenance' | 'offline' | 'blacklisted';
  isBlacklisted?: boolean;
  blacklistReason?: string;
  queue?: number;
  lastPingTimestamp?: string;
  isPeakTraffic?: boolean;
  customBranding?: CustomBrandingConfig;
  priorityPlacement?: PriorityPlacementConfig;
  origin?: 'saas' | 'third_party';
  deployedThroughSaaS?: boolean;
  isThirdParty?: boolean;
}

export interface SpotlightRentalBooking {
  id: string; // e.g. "rent_2026_08_18_serverId"
  date: string; // YYYY-MM-DD
  serverId: string;
  serverSlug?: string;
  serverName: string;
  framework: 'FiveM' | 'VMP' | 'Custom C#' | string;
  region: string;
  connectUrl: string;
  description: string;
  tags?: string[];
  logoUrl?: string;
  bannerUrl?: string;
  officialWebsiteUrl?: string;
  customBadge?: string;
  accentColor?: string;
  pricePaid?: number; // e.g. 12
  amountPaidUsd?: number;
  currency?: string; // "USD"
  ownerDiscordId?: string;
  ownerUid?: string;
  ownerEmail?: string;
  stripePaymentId?: string;
  stripePaymentIntentId?: string;
  status: 'active' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: number;
  approvedByAdmin?: string;
  grantedByAdmin?: boolean;
  isComplimentary?: boolean;
  adminNotes?: string;
  notes?: string;
}

export interface SpotlightPricingConfig {
  dailyRateUsd: number; // default 12.00
  enabled?: boolean;
  isActive?: boolean;
  currency?: string;
  headline?: string;
  minimumDays?: number;
  maximumAdvanceDays?: number;
  updatedAt?: number;
  updatedBy?: string;
}

export type MapDistrict =
  | 'Vice Beach'
  | 'Downtown Vice'
  | 'Port Gellhorn'
  | 'Everglades / Keys'
  | 'Little Haiti'
  | 'Starfish Island'
  | 'Downtown Los Santos'
  | 'Vinewood Hills'
  | 'Del Perro'
  | 'Sandy Shores'
  | 'Mount Chiliad'
  | 'Paleto Bay'
  | 'Fort Zancudo'
  | 'LSIA / Terminal'
  | string;

export interface MapLocation {
  id: string;
  title: string;
  category: 'Dealership' | 'Ammu-Nation' | 'Safehouse' | 'Business' | 'Stunt Jump' | 'Easter Egg' | 'Heist Target';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  district: MapDistrict;
  description: string;
}

export interface CommunityBuild {
  id: string;
  author: string;
  title: string;
  vehicleId?: string;
  vehicleName: string;
  totalCost: number;
  upvotes: number;
  appliedModIds?: string[];
  tags: string[];
  createdAt: string;
  description: string;
  isTrending?: boolean;
}

export interface AdPlacement {
  id: string;
  slotName: string;
  dimensions: string;
  estimatedRpm: number;
  activeSponsor?: string;
  description: string;
}

export interface ChatAttachment {
  type: 'vehicle' | 'server' | 'weapon' | 'location' | 'business' | 'mod_build' | 'giftcard' | 'custom' | string;
  title: string;
  detail: string;
  imageUrl?: string;
  badge?: string;
  id?: string;
  stats?: { label: string; value: string }[];
  actionUrl?: string;
  actionType?: 'open_vehicle' | 'open_weapon' | 'open_server' | 'open_map' | 'open_business' | 'copy_connect' | 'claim_giftcard' | string;
  actionData?: string;
  giftcardCode?: string;
  giftcardVcValue?: number;
  giftcardTier?: string;
  giftcardVipDays?: number;
  isClaimed?: boolean;
  claimedBy?: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  channel: string;
  content: string;
  timestamp: string;
  isVip?: boolean;
  isMod?: boolean;
  isAdmin?: boolean;
  isBot?: boolean;
  userLevel?: 'VIP' | 'Member' | 'L1' | 'L2' | 'L3' | 'Staff' | 'Admin' | string;
  isDeleted?: boolean;
  deletedBy?: string;
  attachment?: ChatAttachment;
  reactions: Record<string, number>;
}

export type UserRole = 'Admin' | 'Staff' | 'VIP Member' | 'User';

export interface DiscordAuthData {
  encryptedAccessToken?: string;
  encryptedRefreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: number;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  linkedAt?: string;
  lastRefreshedAt?: string;
}

export interface UserProfile {
  id: string;
  uid?: string;
  username: string;
  displayName?: string;
  email: string;
  avatar: string;
  role: UserRole;
  clearanceLevel?: string;
  isAdmin?: boolean;
  isStaff?: boolean;
  isVip: boolean;
  vipExpires?: string;
  vcBalance?: number;
  dailyStreak?: number;
  moderationNote?: string;
  joinedDate: string;
  publishedBuildsCount: number;
  status: 'Active' | 'Suspended';
  discordConnected?: boolean;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  discordAuth?: DiscordAuthData;
  rawFirestoreData?: Record<string, any>;
}

export type WhitelistQuestionType = 'text' | 'textarea' | 'multiple_choice';

export interface WhitelistQuestion {
  id: string;
  question: string;
  type: WhitelistQuestionType;
  options?: string[];
  required: boolean;
  placeholder?: string;
  helperText?: string;
}

export interface CustomBrandingConfig {
  logoUrl?: string;
  bannerUrl?: string;
  accentColor?: string; // e.g. '#6366f1' or '#f43f5e'
  customDomain?: string;
  hideWatermark?: boolean;
  discordInviteUrl?: string;
  customBadgeText?: string;
  customHeaderTitle?: string;
}

export interface PriorityPlacementConfig {
  isFeatured?: boolean;
  isBoosted?: boolean;
  boostRank?: number;
  badge?: string; // e.g. '⭐ Verified Partner'
  boostExpiresAt?: number;
  highlightColor?: string;
}

export interface ServerAnalyticsOverview {
  totalViews?: number;
  totalSubmissions?: number;
  acceptanceRate?: number;
  avgAiScore?: number;
  funnelDropoffRate?: number;
  topReferrals?: { source: string; count: number }[];
  dailyApplicants?: { date: string; count: number }[];
}

export interface WhitelistFormConfig {
  serverId: string;
  ownerUid: string;
  ownerDiscordId?: string;
  serverName: string;
  serverSlug: string;
  discordGuildId: string;
  discordRoleId: string;
  discordWebhookUrl: string;
  discordInviteUrl?: string;
  isSubscriptionActive: boolean;
  isVerifiedServerOwner?: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  subscriptionExpiresAt?: number | string;
  subscriptionExpiresAtIso?: string;
  subscriptionVerifiedAt?: number;
  trialStartedAt?: number;
  trialEndsAt?: number;
  trialEndsAtIso?: string;
  trialPassCode?: string;
  isExpired?: boolean;
  planTier?: 'community' | 'mega_server' | 'pro' | 'enterprise' | string;
  pricingTier?: 'community' | 'mega_server' | 'pro' | 'enterprise' | string;
  isClaimed?: boolean;
  claimedAt?: number;
  claimedByDiscordId?: string;
  claimedByDiscordUsername?: string;
  autoApprovalEnabled?: boolean;
  autoApprovalMinScore?: number;
  botAutoRoleEnabled?: boolean;
  botWebhookEnabled?: boolean;
  botDmApplicantEnabled?: boolean;
  antiAltProtectionEnabled?: boolean;
  minBackstoryWords?: number;
  requireDiscordOAuth?: boolean;
  formEnabled?: boolean;
  maintenanceMessage?: string;
  connectUrl?: string;
  averageReviewTime?: string;
  staffReviewers?: string[];
  customQuestions: WhitelistQuestion[];
  customBranding?: CustomBrandingConfig;
  priorityPlacement?: PriorityPlacementConfig;
  advancedAnalytics?: ServerAnalyticsOverview;
  quickInvites?: QuickInvite[];
  createdAt?: number;
  updatedAt?: number;
}

export interface QuickInvite {
  id: string;
  code: string;
  serverId: string;
  serverSlug: string;
  createdByDiscordId: string;
  createdByUsername?: string;
  createdAt: number;
  expiresAt?: number | null;
  maxUses?: number | null;
  usesCount: number;
  clicksCount: number;
  conversionsCount: number;
  label?: string;
  note?: string;
  isActive: boolean;
}

export interface OwnershipTransfer {
  id: string;
  serverId: string;
  serverSlug: string;
  serverName: string;
  fromDiscordId: string;
  fromUsername?: string;
  toDiscordId: string;
  toUsername?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'rejected';
  initiatedAt: number;
  completedAt?: number;
  transferCode?: string;
  note?: string;
}

export interface AiWhitelistAudit {
  score: number; // 0 - 100
  flags: string[];
  strengths?: string[];
  improvements?: string[];
  summary: string;
  recommendation: 'Fast-Track' | 'Standard Review' | 'Flagged';
  loreScore?: number;
  rulesScore?: number;
  analyzedAt?: string;
  modelUsed?: string;
}

export type WhitelistApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface WhitelistApplication {
  id: string;
  serverId: string;
  serverSlug?: string;
  applicantUid: string;
  applicantEmail?: string;
  applicantUsername?: string;
  discordId: string;
  discordTag: string;
  discordAvatar: string;
  answers: Record<string, string>;
  status: WhitelistApplicationStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  aiAudit?: AiWhitelistAudit;
  inviteCode?: string;
  createdAt: number;
  reviewedAt?: number;
  emailSentAt?: number;
  emailSentStatus?: string;
  emailSentRecipient?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: 'Map Leaks & Districts' | 'Heists & Businesses' | 'Vehicle Tuning Specs' | 'RP Server News' | 'Weapon Meta & TTK' | 'Platform Features & Tools ⚡' | 'Economy & Modding' | string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  imageUrl: string;
  likes: number;
  isFeatured?: boolean;
  tags: string[];
  excerpt: string;
  content: string[]; // paragraph blocks or markdown
  contentMarkdown?: string;
  keyTakeaways: string[];
  faqItems?: { question: string; answer: string }[];
  coordinates?: { district: string; x: number; y: number };
  publishedFromMarketing?: boolean;
  videoUrl?: string;
  youtubeEmbedId?: string;
  netflixUrl?: string;
}

export type GiftCardTier = 'Shark Cash $2.5M' | 'Shark Cash $10M' | 'Megalodon Cash $25M' | 'VIP Pass (30 Days)' | 'VIP Founder Pass (1 Year)' | 'Custom Voucher' | '$20 Starter Pack' | '$40 Crew Pack' | '$60 Executive Pack' | '$100 Max Empire Pack' | string;

export interface GiftCard {
  id: string;
  code: string;
  tier: GiftCardTier;
  cashValue: number;
  vipDaysGranted: number;
  isRedeemed: boolean;
  redeemedByUid?: string;
  redeemedByUsername?: string;
  redeemedAt?: string;
  createdByUid?: string;
  createdByName?: string;
  recipientGamerTag?: string;
  message?: string;
  createdAt: string;
  expiresAt?: string;
  transactionId?: string;
  amountPaid?: number;
  paymentMethod?: string;
}

export type ActiveTab = 'home' | 'about' | 'vehicles' | 'weapons' | 'characters' | 'comparison' | 'mod-calculator' | 'roi-calculator' | 'handling-editor' | 'economy-balancer' | 'script-generator' | 'map' | 'rp-servers' | 'monetization' | 'chat' | 'admin' | 'docs' | 'blog' | 'profile' | 'pseo' | 'giftcards' | 'seo-hub' | 'challenges' | 'whitelist-manage' | 'whitelist-apply' | 'whitelist-review' | 'whitelist-status' | 'server-manage' | 'server-apply' | 'server-review' | 'server-status' | 'server-dashboard' | 'server-billing' | 'server-growth' | 'server-studio' | 'marketing' | 'privacy' | 'copyright' | 'for-servers' | 'servers-onboarding' | 'admin-business' | 'market-agency' | 'marketagency' | 'pitch' | 'investors';

export type NotificationType = 'article' | 'admin_message' | 'car_addition' | 'weapon_addition' | 'chat_tag' | 'channel_join_request' | 'admin_chat_broadcast' | 'channel_all_tag' | 'whitelist_status_update' | 'VIP_EXPIRY_ALERT' | 'challenge_win';

export interface UserNotification {
  id: string;
  targetUserId?: string;
  targetUsername?: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  createdAt?: number;
  read: boolean;
  targetTab: ActiveTab;
  targetId?: string;
  metadata?: {
    channelId?: string;
    channel?: string;
    channelName?: string;
    requesterId?: string;
    requesterName?: string;
    requesterAvatar?: string;
    senderName?: string;
    status?: 'pending' | 'approved' | 'declined';
    claimed?: boolean;
    rewardVc?: number;
    challengeTitle?: string;
    buildTitle?: string;
  };
}

export interface VoiceParticipant {
  userId: string;
  username: string;
  avatar: string;
  userLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'Staff' | 'Admin' | string;
  isMuted: boolean;
  isForceMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  joinedAtMs: number;
  mutedByHost?: string;
  pingMs?: number;
}

export interface VoiceRoomState {
  channelId: string;
  channelName: string;
  participants: VoiceParticipant[];
  updatedAtMs: number;
}

export type StaffActionType =
  | 'USER_EDIT'
  | 'USER_ROLE_CHANGE'
  | 'USER_BAN_SUSPEND'
  | 'USER_UNBAN'
  | 'USER_VC_ADJUST'
  | 'USER_STREAK_ADJUST'
  | 'USER_DOC_DIRECT_SAVE'
  | 'USER_DOC_DELETE'
  | 'MODERATION_APPROVAL'
  | 'MODERATION_REJECTION'
  | 'REPORT_RESOLVE'
  | 'REPORT_DISMISS'
  | 'CHANNEL_MODERATION'
  | 'CHANNEL_DELETE_APPROVE'
  | 'CHAT_MESSAGE_DELETE'
  | 'CMS_CONTENT_CREATE'
  | 'CMS_CONTENT_UPDATE'
  | 'CMS_CONTENT_DELETE'
  | 'BUG_REPORT_STATUS_CHANGE'
  | 'BUG_REPORT_DELETE'
  | 'CHALLENGE_MODERATION'
  | 'CHALLENGE_CREATE'
  | 'WHITELIST_REVIEW'
  | 'SQUAD_CLEANUP'
  | 'SQUAD_ROOM_CLEANUP'
  | 'SQUAD_ROOM_DELETE'
  | 'VIP_ENGINE_TRIGGER'
  | 'SPOTLIGHT_OVERRIDE_TODAY'
  | 'SPOTLIGHT_BOOKING_CANCELLED'
  | 'SPOTLIGHT_ADMIN_GRANT'
  | 'SPOTLIGHT_RATE_UPDATE'
  | 'SYSTEM_CONFIG_CHANGE'
  | 'SEO_META_UPDATE'
  | 'SEO_META_RESET'
  | 'COUPON_CREATE'
  | 'COUPON_TOGGLE'
  | 'COUPON_DELETE';

export interface SeoMetaOverride {
  sectionId: string;
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product' | string;
  ogSiteName?: string;
  twitterCard?: 'summary_large_image' | 'summary';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
  robots?: 'index, follow' | 'noindex, follow' | 'noindex, nofollow' | string;
  schemaType?: 'WebSite' | 'WebPage' | 'SoftwareApplication' | 'ItemPage' | 'Dataset' | 'FAQPage' | string;
  customJsonLd?: Record<string, any> | string;
  isCustomOverride: boolean;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  version?: number;
}

export type CouponScope = 
  | 'all' 
  | 'vip_sub' 
  | 'b2b_sponsor' 
  | 'whitelist_mega' 
  | 'whitelist_enterprise' 
  | 'spotlight_rental' 
  | 'vc_credits';

export interface DiscountCoupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number; // max payment limit / discount cap
  applicableScope: CouponScope;
  minPurchaseAmount?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string; // ISO string or 'Never'
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  description?: string;
}

export type StaffActionCategory =
  | 'User Management'
  | 'Moderation Queue'
  | 'Bug Reports'
  | 'Content CMS'
  | 'Content Moderation'
  | 'Community Chat'
  | 'Tuning Challenges'
  | 'Whitelist Review'
  | 'System Operations';

export type StaffAuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface StaffFieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  fieldLabel?: string;
}

export interface StaffAuditLog {
  id: string;
  timestamp: string; // ISO string
  timestampMs: number;
  actorId: string;
  actorEmail: string;
  actorUsername: string;
  actorRole: UserRole | string;
  actorClearance: 'L3' | 'L4' | string;
  actionType: StaffActionType;
  actionCategory: StaffActionCategory;
  targetId?: string;
  targetName?: string;
  targetType?: 'user' | 'report' | 'server' | 'build' | 'weapon' | 'vehicle' | 'map' | 'chat_message' | 'channel' | 'challenge' | 'bug_report' | 'whitelist_app' | 'squad_room' | string;
  severity: StaffAuditSeverity;
  details: string;
  changes?: StaffFieldChange[];
  metadata?: Record<string, any>;
  isReviewedByL4?: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  l4ReviewNote?: string;
  ipAddress?: string;
}

// B2B SaaS Subscriptions & Server Operations
export interface B2BSubscription {
  id: string;
  serverId: string;
  ownerDiscordId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId?: string;
  tier: 'community' | 'mega_server' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  mrr: number; // e.g., 29 or 49
  createdAt: number;
}

export interface ServerRecord {
  id: string;
  ownerDiscordId: string;
  serverName: string;
  serverSlug: string;
  discordGuildId: string;
  discordRoleId: string;
  isSubscriptionActive: boolean;
  isClaimed?: boolean;
  claimedAt?: number;
  claimedByDiscordId?: string;
  claimedByDiscordUsername?: string;
  tier: 'free' | 'community' | 'mega_server';
  metrics: {
    totalApplicationsProcessed: number;
    totalLuaConfigsGenerated: number;
    lastActiveAt: number;
  };
}


