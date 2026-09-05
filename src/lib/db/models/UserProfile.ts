import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile extends Document {
  uid: string;
  gamerTag: string;
  username?: string;
  usernameLower?: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  vipStatus: boolean;
  isVip?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  role?: string;
  userLevel?: string;
  clearanceLevel: number | string; // 1: User, 2: VIP, 3: Staff, 4: Admin or 'L1', 'L2', 'L3', 'L4'
  vipExpires: string;
  vipUntil?: string | number;
  vcBalance: number;
  dailyStreak: number;
  rewardStreak?: number;
  lastClaimDate?: string;
  lastLogin?: number | string;
  claimed30DayVip?: boolean;
  lastClaimed30DayVipStreak?: number;
  status?: string;
  gamerTagChangesRemaining?: number;
  lastGamerTagChangeDate?: string;
  changeHistory?: any[];
  discordConnected?: boolean;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  claimedByDiscordId?: string;
  claimedByDiscordUsername?: string;
  discordAuth?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema: Schema = new Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    gamerTag: { type: String, default: '', index: true },
    username: { type: String },
    usernameLower: { type: String },
    email: { type: String },
    avatarUrl: { type: String, default: '' },
    avatar: { type: String, default: '' },
    vipStatus: { type: Boolean, default: false },
    isVip: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isStaff: { type: Boolean, default: false },
    role: { type: String, default: 'User' },
    userLevel: { type: String, default: 'Member' },
    clearanceLevel: { type: Schema.Types.Mixed, default: 1 },
    vipExpires: { type: String, default: 'Expired' },
    vipUntil: { type: Schema.Types.Mixed },
    vcBalance: { type: Number, default: 100 },
    dailyStreak: { type: Number, default: 1 },
    rewardStreak: { type: Number, default: 1 },
    lastClaimDate: { type: String },
    lastLogin: { type: Schema.Types.Mixed },
    claimed30DayVip: { type: Boolean, default: false },
    lastClaimed30DayVipStreak: { type: Number, default: 0 },
    status: { type: String, default: 'Active' },
    gamerTagChangesRemaining: { type: Number, default: 2 },
    lastGamerTagChangeDate: { type: String },
    changeHistory: { type: Array, default: [] },
    discordConnected: { type: Boolean, default: false },
    discordId: { type: String },
    discordUsername: { type: String },
    discordAvatar: { type: String },
    claimedByDiscordId: { type: String },
    claimedByDiscordUsername: { type: String },
    discordAuth: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const UserProfileModel =
  mongoose.models.UserProfile ||
  mongoose.model<IUserProfile>('UserProfile', UserProfileSchema, 'userProfiles');

