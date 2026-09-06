import mongoose from 'mongoose';
import { connectToMongoDB, invalidateMongoConnection } from './mongodb';
import { getDynamicModel } from './models/DynamicDoc';
import { UserProfileModel } from './models/UserProfile';
import { VehicleBuildModel } from './models/VehicleBuild';
import { ServerWhitelistFormModel } from './models/ServerWhitelistForm';
import { PseoArticleModel } from './models/PseoArticle';
import { CustomChannelModel } from './models/CustomChannel';
import { ChatMessageModel } from './models/ChatMessage';
import { StaffAuditLogModel } from './models/StaffAuditLog';
import gtaviData from '../../data/gtavi_data.json';

const localData = (gtaviData || {}) as Record<string, any[]>;
let lastReportedAuthErrorTime = 0;

/**
 * Gracefully handles MongoDB errors, invalidates stale/broken connection pools, and throttles noisy logging.
 */
function handleMongoError(err: any, context: string, collectionName: string): void {
  const msg = err?.message || String(err);
  const codeName = err?.codeName || '';
  const isAuthOrPermission =
    codeName === 'AtlasError' ||
    codeName === 'Unauthorized' ||
    err?.code === 13 ||
    err?.code === 18 ||
    msg.includes('cannot find user account') ||
    msg.includes('user is not allowed') ||
    msg.includes('AuthenticationFailed') ||
    msg.includes('not authorized');

  if (isAuthOrPermission) {
    invalidateMongoConnection(msg);
    const now = Date.now();
    if (now - lastReportedAuthErrorTime > 30000) {
      lastReportedAuthErrorTime = now;
      console.warn(`[MongoDB Storage] Atlas auth/permission constraint on collection "${collectionName}" (${msg}). Falling back to local catalog data.`);
    }
  } else {
    console.warn(`[MongoDB Storage] Error in ${context} (${collectionName}):`, msg);
  }
}

/**
 * Searches in local bundled gtavi_data.json collection if MongoDB is unreachable or unauthorized.
 */
function findLocalDocuments(collectionName: string, filter: any = {}, limit: number = 100): any[] {
  const collection = localData[collectionName];
  if (!Array.isArray(collection)) return [];

  let results = collection;
  if (filter && typeof filter === 'object' && Object.keys(filter).length > 0) {
    results = collection.filter((item) => {
      if (!item) return false;
      for (const [key, val] of Object.entries(filter)) {
        if (key === '$or' && Array.isArray(val)) {
          const matchesOr = val.some((subFilter) => {
            return Object.entries(subFilter).every(([subK, subV]) => item[subK] === subV);
          });
          if (!matchesOr) return false;
        } else if (item[key] !== val) {
          return false;
        }
      }
      return true;
    });
  }

  return results.slice(0, limit);
}

function findLocalDocument(collectionName: string, filterOrId: any): any | null {
  const normalized = normalizeFilter(filterOrId);
  const docs = findLocalDocuments(collectionName, normalized, 1);
  return docs.length > 0 ? docs[0] : null;
}

/**
 * Returns the appropriate Mongoose model for a given collection name.
 */
export function getModelForCollection(collectionName: string) {
  switch (collectionName) {
    case 'userProfiles':
      return UserProfileModel;
    case 'staff_activity_logs':
    case 'staffAuditLogs':
      return StaffAuditLogModel;
    case 'vehicle_tuning_builds':
      return VehicleBuildModel;
    case 'serverWhitelistForms':
    case 'whitelist_forms':
      return ServerWhitelistFormModel;
    case 'pseoArticles':
      return PseoArticleModel;
    case 'customChannels':
      return CustomChannelModel;
    case 'chatMessages':
      return ChatMessageModel;
    default:
      return getDynamicModel(collectionName);
  }
}

/**
 * Upserts a document into MongoDB for a given collection.
 */
export async function saveDocument(collectionName: string, id: string, data: any): Promise<boolean> {
  try {
    const conn = await connectToMongoDB();
    if (!conn) return false;

    const Model = getModelForCollection(collectionName);
    
    // Determine a precise, non-ambiguous filter to prevent MongoDB upsert errors
    let filter: any;
    if (collectionName === 'userProfiles') {
      const emailFilter = data?.email ? { email: new RegExp(`^${data.email}$`, 'i') } : null;
      const uidRegex = typeof id === 'string' ? new RegExp(`^${id}$`, 'i') : null;
      const orConditions: any[] = [{ uid: id }, { id }];
      if (uidRegex) {
        orConditions.push({ uid: uidRegex }, { id: uidRegex });
      }
      if (emailFilter) {
        orConditions.push(emailFilter);
      }

      const existing = await (Model as any).findOne({ $or: orConditions });
      if (existing) {
        filter = { _id: existing._id };
      } else {
        filter = { uid: id };
      }
    } else {
      const isObjectId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      if (isObjectId) {
        filter = { $or: [{ id }, { _id: id }] };
      } else {
        filter = { id };
      }
    }
    
    const updatePayload: any = {
      ...data,
      id,
      docId: id,
      updatedAt: new Date(),
    };
    delete updatePayload._id;

    // Use atomic $set operator to cleanly merge fields on update and avoid document replacement issues
    await (Model as any).findOneAndUpdate(filter, { $set: updatePayload }, {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    });
    
    return true;
  } catch (err) {
    handleMongoError(err, 'save', collectionName);
    return false;
  }
}

/**
 * Normalizes a string ID, number, or query object into a valid MongoDB filter.
 */
export function normalizeFilter(filterOrId: any): any {
  if (filterOrId instanceof String || filterOrId instanceof Number) {
    filterOrId = filterOrId.valueOf();
  }
  if (typeof filterOrId === 'string' || typeof filterOrId === 'number') {
    const trimmedId = String(filterOrId).trim();
    const isHex24 = mongoose.Types.ObjectId.isValid(trimmedId) && /^[0-9a-fA-F]{24}$/.test(trimmedId);
    const orClauses: any[] = [
      { id: trimmedId },
      { uid: trimmedId },
      { docId: trimmedId },
      { messageId: trimmedId },
      { targetUserId: trimmedId },
    ];
    if (isHex24) {
      orClauses.push({ _id: new mongoose.Types.ObjectId(trimmedId) });
    }
    return { $or: orClauses };
  }
  if (filterOrId && typeof filterOrId === 'object') {
    return filterOrId;
  }
  return {};
}

/**
 * Normalizes an update dictionary into a valid MongoDB atomic update operator ($set, etc).
 */
export function normalizeUpdate(updateDataOrOp: any): any {
  if (!updateDataOrOp || typeof updateDataOrOp !== 'object') {
    return { $set: { updatedAt: new Date() } };
  }
  const hasMongoOperator = Object.keys(updateDataOrOp).some(k => k.startsWith('$'));
  if (hasMongoOperator) {
    return updateDataOrOp;
  }
  const cleanPayload = { ...updateDataOrOp };
  delete cleanPayload._id;
  if (!cleanPayload.updatedAt) {
    cleanPayload.updatedAt = new Date().toISOString();
  }
  return { $set: cleanPayload };
}

/**
 * Finds a single document in MongoDB for a given collection, with local fallback if database is inaccessible.
 */
export async function findDocument(collectionName: string, filterOrId: any): Promise<any | null> {
  try {
    const conn = await connectToMongoDB();
    if (!conn) {
      return findLocalDocument(collectionName, filterOrId);
    }

    const Model = getModelForCollection(collectionName);
    const filter = normalizeFilter(filterOrId);
    const doc = await (Model as any).findOne(filter).lean();
    if (doc) return doc;
    return findLocalDocument(collectionName, filterOrId);
  } catch (err) {
    handleMongoError(err, 'findOne', collectionName);
    return findLocalDocument(collectionName, filterOrId);
  }
}

/**
 * Finds multiple documents in MongoDB for a given collection, with local fallback if database is inaccessible.
 */
export async function findDocuments(collectionName: string, filter: any = {}, limit: number = 100): Promise<any[]> {
  try {
    const conn = await connectToMongoDB();
    if (!conn) {
      return findLocalDocuments(collectionName, filter, limit);
    }

    const Model = getModelForCollection(collectionName);
    const normalized = typeof filter === 'object' && filter !== null ? filter : normalizeFilter(filter);
    const docs = await (Model as any).find(normalized).limit(limit).lean();
    if (Array.isArray(docs) && docs.length > 0) {
      return docs;
    }
    return findLocalDocuments(collectionName, filter, limit);
  } catch (err) {
    handleMongoError(err, 'find', collectionName);
    return findLocalDocuments(collectionName, filter, limit);
  }
}

/**
 * Deletes a document from MongoDB for a given collection.
 * Supports string ID, ObjectId, or a query filter object.
 */
export async function deleteDocument(collectionName: string, filterOrId: any): Promise<boolean> {
  try {
    const conn = await connectToMongoDB();
    if (!conn) return false;

    const Model = getModelForCollection(collectionName);
    const filter = normalizeFilter(filterOrId);
    const result = await (Model as any).deleteMany(filter);
    return (result && typeof result.deletedCount === 'number') ? result.deletedCount > 0 : true;
  } catch (err) {
    handleMongoError(err, 'delete', collectionName);
    return false;
  }
}

/**
 * Deletes multiple documents from MongoDB matching a filter.
 */
export async function deleteWhereDocuments(collectionName: string, filter: any): Promise<boolean> {
  try {
    const conn = await connectToMongoDB();
    if (!conn) return false;

    const Model = getModelForCollection(collectionName);
    const normalized = typeof filter === 'object' && filter !== null ? filter : normalizeFilter(filter);
    await (Model as any).deleteMany(normalized);
    return true;
  } catch (err) {
    handleMongoError(err, 'deleteMany', collectionName);
    return false;
  }
}

/**
 * Adds a new document to MongoDB for a given collection with auto-generated id if not provided.
 */
export async function addDocument(collectionName: string, data: any): Promise<any> {
  try {
    const conn = await connectToMongoDB();
    if (!conn) return null;

    const Model = getModelForCollection(collectionName);
    const docId = data.id || data.docId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      ...data,
      id: docId,
      docId,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const newDoc = await (Model as any).create(payload);
    return newDoc.toObject ? newDoc.toObject() : newDoc;
  } catch (err) {
    handleMongoError(err, 'addDocument', collectionName);
    return null;
  }
}

/**
 * Updates an existing document or performs an update query.
 * Safely normalizes string ID or filter objects and handles atomic operator encapsulation.
 */
export async function updateDocument(collectionName: string, filterOrId: any, update: any): Promise<boolean> {
  try {
    const conn = await connectToMongoDB();
    if (!conn) return false;

    const Model = getModelForCollection(collectionName);
    const filter = normalizeFilter(filterOrId);
    const updateOp = normalizeUpdate(update);
    await (Model as any).updateOne(filter, updateOp, { upsert: true });
    return true;
  } catch (err) {
    handleMongoError(err, 'updateDocument', collectionName);
    return false;
  }
}

