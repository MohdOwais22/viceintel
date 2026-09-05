import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomChannel extends Document {
  id: string;
  name: string;
  topic?: string;
  creatorUid: string;
  isPrivate: boolean;
  members: string[];
  bannedUsers: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomChannelSchema: Schema = new Schema(
  {
    id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    topic: { type: String },
    creatorId: { type: String, index: true },
    creatorUid: { type: String, index: true },
    isPrivate: { type: Boolean, default: false },
    members: { type: [String], default: [] },
    bannedUsers: { type: [String], default: [] },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const CustomChannelModel =
  mongoose.models.CustomChannel ||
  mongoose.model<ICustomChannel>('CustomChannel', CustomChannelSchema, 'customChannels');
