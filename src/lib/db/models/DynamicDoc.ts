import mongoose, { Schema, Model } from 'mongoose';

const dynamicModelsCache: Record<string, Model<any>> = {};

/**
 * Retrieves or creates a dynamic Mongoose model for any collection name.
 * Uses strict: false to accept any JSON document structure from Firestore.
 */
export function getDynamicModel(collectionName: string): Model<any> {
  if (dynamicModelsCache[collectionName]) {
    return dynamicModelsCache[collectionName];
  }

  if (mongoose.models[collectionName]) {
    dynamicModelsCache[collectionName] = mongoose.models[collectionName];
    return dynamicModelsCache[collectionName];
  }

  const dynamicSchema = new Schema(
    {
      id: { type: String, index: true },
    },
    {
      timestamps: true,
      strict: false,
    }
  );

  const model = mongoose.model(collectionName, dynamicSchema, collectionName);
  dynamicModelsCache[collectionName] = model;
  return model;
}
