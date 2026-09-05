import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicleBuild extends Document {
  id: string;
  title: string;
  vehicleName: string;
  creatorUid: string;
  creatorName: string;
  handlingData: Record<string, any>;
  telemetry: Record<string, any>;
  upvotes: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const VehicleBuildSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    vehicleName: { type: String, required: true, index: true },
    creatorUid: { type: String, required: true, index: true },
    creatorName: { type: String },
    handlingData: { type: Schema.Types.Mixed, default: {} },
    telemetry: { type: Schema.Types.Mixed, default: {} },
    upvotes: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const VehicleBuildModel =
  mongoose.models.VehicleBuild ||
  mongoose.model<IVehicleBuild>('VehicleBuild', VehicleBuildSchema, 'vehicle_tuning_builds');
