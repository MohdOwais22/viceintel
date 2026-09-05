import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffAuditLog extends Document {
  id: string;
  timestamp: string;
  timestampMs: number;
  actorId: string;
  actorEmail: string;
  actorUsername: string;
  actorRole: string;
  actorClearance: string;
  actionType: string;
  actionCategory: string;
  targetId?: string;
  targetName?: string;
  targetType?: string;
  severity: string;
  details: string;
  changes?: any[];
  metadata?: Record<string, any>;
  isReviewedByL4?: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  l4ReviewNote?: string;
  ipAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const StaffAuditLogSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, required: true },
    timestampMs: { type: Number, required: true, index: true },
    actorId: { type: String, required: true, index: true },
    actorEmail: { type: String, default: '' },
    actorUsername: { type: String, required: true },
    actorRole: { type: String, default: 'Staff' },
    actorClearance: { type: String, default: 'L3' },
    actionType: { type: String, required: true, index: true },
    actionCategory: { type: String, required: true },
    targetId: { type: String },
    targetName: { type: String },
    targetType: { type: String },
    severity: { type: String, default: 'LOW' },
    details: { type: String, required: true },
    changes: { type: Array, default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isReviewedByL4: { type: Boolean, default: false },
    reviewedAt: { type: String },
    reviewedBy: { type: String },
    l4ReviewNote: { type: String },
    ipAddress: { type: String },
  },
  {
    timestamps: true,
    strict: false,
  }
);

StaffAuditLogSchema.index({ timestampMs: -1 });

export const StaffAuditLogModel =
  mongoose.models.StaffAuditLog || mongoose.model<IStaffAuditLog>('StaffAuditLog', StaffAuditLogSchema);
