import mongoose, { Schema, Document } from 'mongoose';

export interface IServerWhitelistForm extends Document {
  id: string;
  serverId: string;
  serverName: string;
  ownerUid: string;
  questions: any[];
  discordConfig: Record<string, any>;
  customBranding?: Record<string, any>;
  priorityPlacement?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServerWhitelistFormSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    serverId: { type: String, index: true },
    serverName: { type: String },
    ownerUid: { type: String, index: true },
    questions: { type: Array, default: [] },
    discordConfig: { type: Schema.Types.Mixed, default: {} },
    customBranding: { type: Schema.Types.Mixed },
    priorityPlacement: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const ServerWhitelistFormModel =
  mongoose.models.ServerWhitelistForm ||
  mongoose.model<IServerWhitelistForm>('ServerWhitelistForm', ServerWhitelistFormSchema, 'serverWhitelistForms');
