export interface BotGuildConfig {
  guildId: string;
  serverId: string; // Linked Vice City Central server ID
  ownerDiscordId: string;
  whitelistRoleId: string;
  reviewChannelId: string;
  logsChannelId?: string;
  minAccountAgeDays: number; // Alt-account protection (default: 14)
  reapplyCooldownDays: number; // Application cooldown (default: 3)
  autoRoleEnabled: boolean;
  isSubscriptionActive: boolean;
  tier: 'starter' | 'pro' | 'mega';
  updatedAt: number;
}

export interface WhitelistApplication {
  id: string;
  serverId: string;
  guildId: string;
  applicantDiscordId: string;
  applicantAccountAgeDays: number;
  isFlaggedAlt: boolean;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  aiAudit: {
    score: number;
    flags: string[];
    summary: string;
  };
  answers: Record<string, string>;
  discordMessageId?: string;
  reviewedByDiscordId?: string;
  rejectionReason?: string;
  createdAt: number;
  reviewedAt?: number;
  // Optional compatibility fields for rich presentation
  applicantDiscordTag?: string;
  applicantAvatarUrl?: string;
  discordId?: string;
  discordTag?: string;
  discordAvatar?: string;
  reviewerNotes?: string;
  reviewedBy?: string;
}
