import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  id: string;
  username: string;
  avatar?: string;
  channel: string;
  text: string;
  timestamp: string;
  isBot?: boolean;
  isVip?: boolean;
  isMod?: boolean;
  isAdmin?: boolean;
  userLevel?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  attachment?: any;
  reactions?: Record<string, number>;
  createdAtMs?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    id: { type: String, required: true, index: true },
    channel: { type: String, required: true, index: true },
    username: { type: String, required: true, index: true },
    avatar: { type: String },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
    isBot: { type: Boolean, default: false },
    isVip: { type: Boolean, default: false },
    isMod: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    userLevel: { type: String, default: 'Member' },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: String },
    attachment: { type: Schema.Types.Mixed },
    reactions: { type: Schema.Types.Mixed, default: {} },
    createdAtMs: { type: Number, default: () => Date.now(), index: true },
  },
  {
    timestamps: true,
    strict: false,
  }
);

ChatMessageSchema.index({ channel: 1, createdAtMs: -1 });

export const ChatMessageModel =
  mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema, 'chatMessages');
