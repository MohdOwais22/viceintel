import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  where,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import localforage from 'localforage';
import {
  subscribeRtdbSquadRoom,
  fetchRtdbSquadRoom,
  saveRtdbSquadRoom,
  updateRtdbSquadPosition,
  addRtdbSquadWaypoint,
  addRtdbSquadPing,
  toggleRtdbCollectibleSync,
  leaveRtdbSquadRoom,
  subscribeRtdbLfgSquads,
  registerRtdbSquadMemberPresence
} from './firebase/rtdbChatService';

export interface SquadMember {
  displayName: string;
  avatarColor: string; // Hex code for custom map avatar marker
  lat: number;
  lng: number;
  lastUpdated: number;
}

export interface Waypoint {
  id: string;
  label: string;
  type: 'heist' | 'meetup' | 'danger' | 'collectible';
  lat: number;
  lng: number;
  placedBy: string;
}

export interface SquadPing {
  id: string;
  type: 'danger' | 'loot';
  lat: number;
  lng: number;
  placedBy: string;
  placedByColor?: string;
  timestamp: number;
  expiresAt: number; // 10s expiration
  label?: string;
}

export interface LfgConfig {
  activityName: string;
  requiredPlayers: number;
  currentPlayers: number;
  micRequired: boolean;
  minLevel: string;
  rewardEstimate?: string;
  district?: string;
  lat?: number;
  lng?: number;
  hostGamerTag?: string;
  hostAvatar?: string;
  description?: string;
}

export interface LfgJoinRequest {
  id: string;
  applicantUid: string;
  applicantDisplayName: string;
  applicantAvatar?: string;
  applicantLevel?: string;
  applicantMic?: boolean;
  status: 'pending' | 'approved' | 'declined';
  requestedAt: number;
}

export interface SquadRoom {
  roomId: string; // 6-character unique code (e.g., "VC-9482")
  hostUid: string;
  isVipRoom: boolean; // VIP rooms allow up to 8 squad members; standard free tier allows 2
  isLocked?: boolean; // When locked, no new players can join
  privacyMode?: 'public' | 'passcode' | 'invite_only';
  passcode?: string; // Optional 4-digit passcode PIN
  kickedUids?: string[]; // Blacklisted user UIDs kicked by host
  createdAt: number;
  lastActiveTimestamp?: number;
  status?: 'active' | 'stale' | 'cleaned_up';
  isStale?: boolean;
  staleSince?: number;
  isLfgActive?: boolean;
  lfgConfig?: LfgConfig;
  lfgJoinRequests?: LfgJoinRequest[];
  members: {
    [uid: string]: SquadMember;
  };
  waypoints: Waypoint[];
  checkedCollectibles: string[]; // Array of checked marker IDs (e.g., ["jump_01", "package_42"])
  pings?: SquadPing[]; // Temporary 10s danger and loot pings
}

/**
 * Default inactivity threshold for squad rooms: 30 minutes in milliseconds
 */
export const STALE_ROOM_THRESHOLD_MS = 30 * 60 * 1000;

/**
 * Calculates the most recent timestamp among member position updates, pings, and room creation.
 */
export function getSquadRoomLastActiveTime(room: Partial<SquadRoom> | null | undefined): number {
  if (!room) return 0;
  const memberTimestamps = Object.values(room.members || {}).map(m => m?.lastUpdated || 0);
  const pingTimestamps = (room.pings || []).map(p => p?.timestamp || 0);
  return Math.max(
    room.createdAt || 0,
    room.lastActiveTimestamp || 0,
    ...memberTimestamps,
    ...pingTimestamps
  );
}

/**
 * Determines whether a squad room is considered stale (no active positions received in 30 minutes).
 */
export function isSquadRoomStale(
  room: Partial<SquadRoom> | null | undefined,
  thresholdMs: number = STALE_ROOM_THRESHOLD_MS
): boolean {
  if (!room) return false;
  const lastActive = getSquadRoomLastActiveTime(room);
  if (!lastActive) return false;
  return (Date.now() - lastActive) > thresholdMs;
}

/**
 * Background utility to scan squad_rooms in Firestore and clear or flag stale rooms
 * that have not received active positions within 30 minutes.
 */
export async function cleanupStaleSquadRooms(options?: {
  thresholdMs?: number;
  dryRun?: boolean;
  flagOnly?: boolean;
}): Promise<{
  success: boolean;
  checkedCount: number;
  staleCount: number;
  clearedRoomIds: string[];
  flaggedRoomIds: string[];
  errors: string[];
}> {
  const thresholdMs = options?.thresholdMs ?? STALE_ROOM_THRESHOLD_MS;
  const dryRun = Boolean(options?.dryRun);
  const flagOnly = Boolean(options?.flagOnly);

  const clearedRoomIds: string[] = [];
  const flaggedRoomIds: string[] = [];
  const errors: string[] = [];
  let checkedCount = 0;

  try {
    const roomsSnap = await getDocs(query(collection(db, 'squad_rooms'), limit(10)));
    checkedCount = roomsSnap.size;

    for (const roomDoc of roomsSnap.docs) {
      const data = roomDoc.data() as SquadRoom;
      const roomId = data.roomId || roomDoc.id;

      if (isSquadRoomStale(data, thresholdMs)) {
        if (dryRun) {
          clearedRoomIds.push(roomId);
        } else if (flagOnly) {
          try {
            await updateDoc(roomDoc.ref, {
              status: 'stale',
              isStale: true,
              staleSince: Date.now()
            });
            flaggedRoomIds.push(roomId);
          } catch (e: any) {
            errors.push(`Failed to flag stale room ${roomId}: ${e?.message || e}`);
          }
        } else {
          try {
            await deleteDoc(roomDoc.ref);
            clearedRoomIds.push(roomId);
          } catch (e: any) {
            errors.push(`Failed to delete stale room ${roomId}: ${e?.message || e}`);
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      checkedCount,
      staleCount: clearedRoomIds.length + flaggedRoomIds.length,
      clearedRoomIds,
      flaggedRoomIds,
      errors
    };
  } catch (err: any) {
    console.error('Error in cleanupStaleSquadRooms:', err);
    return {
      success: false,
      checkedCount,
      staleCount: 0,
      clearedRoomIds,
      flaggedRoomIds,
      errors: [err?.message || String(err)]
    };
  }
}

/**
 * Generates a random 6-character room code (e.g., "VC-9482").
 */
export function generateRoomCode(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `VC-${randomSuffix}`;
}

export function sanitizeFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeFirestoreData) as unknown as T;
  }
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeFirestoreData(value);
    }
  }
  return clean as T;
}

/**
 * Generates a random 6-character room code (e.g., "VC-9482") and creates a new document in squad_rooms.
 */
export async function createSquadRoom(
  hostUid: string,
  isVip: boolean = false,
  hostUser?: { displayName?: string; avatarColor?: string; lat?: number; lng?: number },
  options?: { passcode?: string; isLocked?: boolean; privacyMode?: 'public' | 'passcode' | 'invite_only' }
): Promise<string> {
  const roomId = generateRoomCode();
  const now = Date.now();

  const initialMembers: { [uid: string]: SquadMember } = {};
  if (hostUid) {
    initialMembers[hostUid] = {
      displayName: hostUser?.displayName || 'Squad Host',
      avatarColor: hostUser?.avatarColor || '#F43F5E',
      lat: hostUser?.lat ?? 25.7617,
      lng: hostUser?.lng ?? -80.1918,
      lastUpdated: now
    };
  }

  const rawRoomData: SquadRoom = {
    roomId,
    hostUid,
    isVipRoom: isVip,
    isLocked: Boolean(options?.isLocked),
    privacyMode: options?.privacyMode || (options?.passcode ? 'passcode' : 'public'),
    ...(options?.passcode?.trim() ? { passcode: options.passcode.trim() } : {}),
    kickedUids: [],
    createdAt: now,
    lastActiveTimestamp: now,
    status: 'active',
    isStale: false,
    members: initialMembers,
    waypoints: [],
    checkedCollectibles: []
  };

  const roomData = sanitizeFirestoreData(rawRoomData);

  await saveRtdbSquadRoom(roomData);
  if (hostUid) {
    registerRtdbSquadMemberPresence(roomId, hostUid, true);
  }
  await cacheActiveRoom(roomId);
  await cacheSquadRoom(roomData);
  return roomId;
}

/**
 * Adds the user into the members map. Enforces security, kick lists, lock status, passcode, and member capacity limits.
 */
export async function joinSquadRoom(
  roomId: string,
  user: { uid: string; displayName: string; color: string; lat?: number; lng?: number },
  providedPasscode?: string
): Promise<{
  success: boolean;
  error?: string;
  room?: SquadRoom;
  requiresVip?: boolean;
  requiresPasscode?: boolean;
  isLocked?: boolean;
  isKicked?: boolean;
  isStale?: boolean;
}> {
  if (!roomId) {
    return { success: false, error: 'Room code is required.' };
  }
  const normalizedRoomId = roomId.toUpperCase().trim();
  
  let room: SquadRoom | null = null;
  try {
    room = await fetchRtdbSquadRoom(normalizedRoomId);
  } catch (err: any) {
    console.warn('Error fetching squad room from RTDB:', err);
    return { success: false, error: 'Could not connect to squad room database.' };
  }

  if (!room) {
    return { success: false, error: `Squad room ${normalizedRoomId} was not found or has expired.` };
  }

  // Verify room is not stale (>30 mins without active positions)
  if (isSquadRoomStale(room) || room.isStale || room.status === 'stale') {
    return {
      success: false,
      isStale: true,
      error: `Squad room ${normalizedRoomId} has expired due to 30 minutes of inactivity.`,
      room
    };
  }

  const existingMembers = room.members || {};
  const isAlreadyMember = Boolean(user.uid && existingMembers[user.uid]);

  // 1. Check if user is in blacklisted kickedUids
  if (user.uid && room.kickedUids && room.kickedUids.includes(user.uid)) {
    return {
      success: false,
      isKicked: true,
      error: 'You have been kicked from this squad room by the host and cannot re-join.',
      room
    };
  }

  // 2. Check room lock status (Host can lock room from new joins)
  if (room.isLocked && !isAlreadyMember && user.uid !== room.hostUid) {
    return {
      success: false,
      isLocked: true,
      error: 'This squad room has been locked by the host against new joins.',
      room
    };
  }

  // 3. Check room passcode protection
  if (room.passcode && room.passcode.trim().length > 0 && !isAlreadyMember && user.uid !== room.hostUid) {
    if (!providedPasscode || providedPasscode.trim() !== room.passcode.trim()) {
      return {
        success: false,
        requiresPasscode: true,
        error: providedPasscode ? 'Incorrect 4-digit room passcode.' : 'This squad room requires a passcode to join.',
        room
      };
    }
  }

  // 4. Check member limits: Free tier = 2 players, VIP tier = 8 players
  const currentCount = Object.keys(existingMembers).length;
  if (!isAlreadyMember) {
    const maxAllowed = room.isVipRoom ? 8 : 2;
    if (currentCount >= maxAllowed) {
      return {
        success: false,
        requiresVip: !room.isVipRoom,
        error: room.isVipRoom
          ? 'Squad room is full (8/8 members).'
          : 'Free Squad Rooms are limited to 2 players. Upgrade to $3.99/mo VIP to unlock 8-player party sync!',
        room
      };
    }
  }

  const now = Date.now();
  const memberData: SquadMember = {
    displayName: user.displayName || 'Vice Operative',
    avatarColor: user.color || '#3B82F6',
    lat: user.lat ?? (existingMembers[user.uid]?.lat ?? 25.7617),
    lng: user.lng ?? (existingMembers[user.uid]?.lng ?? -80.1918),
    lastUpdated: now
  };

  const updatedMembers = { ...existingMembers, [user.uid]: memberData };
  const updatedRoom: SquadRoom = {
    ...room,
    members: updatedMembers,
    lastActiveTimestamp: now,
    status: 'active',
    isStale: false
  };

  await saveRtdbSquadRoom(updatedRoom);
  registerRtdbSquadMemberPresence(normalizedRoomId, user.uid, false);

  await cacheActiveRoom(normalizedRoomId);
  return { success: true, room: updatedRoom };
}

/**
 * Host Kicks an unwanted or unknown player from the squad room and blacklists their UID.
 */
export async function kickSquadMember(
  roomId: string,
  hostUid: string,
  targetUid: string
): Promise<{ success: boolean; error?: string }> {
  if (!roomId || !targetUid) return { success: false, error: 'Invalid room or target UID.' };
  const room = await fetchRtdbSquadRoom(roomId);
  if (!room) return { success: false, error: 'Room not found.' };

  if (room.hostUid !== hostUid) {
    return { success: false, error: 'Only the squad host can kick players.' };
  }

  const updatedMembers = { ...(room.members || {}) };
  delete updatedMembers[targetUid];

  const currentKicked = room.kickedUids || [];
  const updatedKicked = currentKicked.includes(targetUid) ? currentKicked : [...currentKicked, targetUid];

  const updatedRoom: SquadRoom = {
    ...room,
    members: updatedMembers,
    kickedUids: updatedKicked,
    lastActiveTimestamp: Date.now()
  };

  await saveRtdbSquadRoom(updatedRoom);
  leaveRtdbSquadRoom(roomId, targetUid).catch(() => {});
  return { success: true };
}

/**
 * Toggles room lock status (Host can lock room to block any new joins).
 */
export async function toggleLockSquadRoom(
  roomId: string,
  hostUid: string,
  isLocked: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!roomId) return { success: false, error: 'Invalid room ID.' };
  const room = await fetchRtdbSquadRoom(roomId);
  if (!room) return { success: false, error: 'Room not found.' };

  if (room.hostUid !== hostUid) {
    return { success: false, error: 'Only the squad host can lock or unlock the room.' };
  }

  const updatedRoom: SquadRoom = {
    ...room,
    isLocked,
    lastActiveTimestamp: Date.now()
  };

  await saveRtdbSquadRoom(updatedRoom);
  return { success: true };
}

/**
 * Updates squad room passcode (Host can configure/clear 4-digit PIN for private sessions).
 */
export async function updateSquadRoomPasscode(
  roomId: string,
  hostUid: string,
  passcode?: string
): Promise<{ success: boolean; error?: string }> {
  if (!roomId) return { success: false, error: 'Invalid room ID.' };
  const room = await fetchRtdbSquadRoom(roomId);
  if (!room) return { success: false, error: 'Room not found.' };

  if (room.hostUid !== hostUid) {
    return { success: false, error: 'Only the squad host can set the room passcode.' };
  }

  const cleanPasscode = passcode?.trim() || undefined;

  const rawUpdatedRoom: SquadRoom = {
    ...room,
    privacyMode: cleanPasscode ? 'passcode' : 'public',
    lastActiveTimestamp: Date.now(),
    ...(cleanPasscode ? { passcode: cleanPasscode } : {})
  };
  if (!cleanPasscode) {
    delete rawUpdatedRoom.passcode;
  }
  const updatedRoom = sanitizeFirestoreData(rawUpdatedRoom);

  await saveRtdbSquadRoom(updatedRoom);
  return { success: true };
}

// In-memory throttling map to prevent excessive Firestore writes during active map movement
const lastFirestorePositionUpdateMap = new Map<string, number>();
const FIRESTORE_POSITION_THROTTLE_MS = 4000;

/**
 * Updates coordinate telemetry for the user in real-time.
 */
export async function updatePlayerPosition(
  roomId: string,
  uid: string,
  lat: number,
  lng: number
): Promise<void> {
  if (!roomId || !uid) return;
  updateRtdbSquadPosition(roomId, uid, lat, lng).catch(() => {});
}

/**
 * Adds a new custom team map ping/waypoint to the squad room.
 */
export async function addWaypoint(
  roomId: string,
  waypoint: Omit<Waypoint, 'id'> & { id?: string }
): Promise<void> {
  if (!roomId) return;
  const newWaypoint: Waypoint = {
    ...waypoint,
    id: waypoint.id || `wp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  };
  await addRtdbSquadWaypoint(roomId, newWaypoint);
}

/**
 * Places a temporary (10-second) Danger or Loot tactical ping for the squad room.
 */
export async function addSquadPing(
  roomId: string,
  ping: Omit<SquadPing, 'id' | 'timestamp' | 'expiresAt'> & { id?: string }
): Promise<SquadPing> {
  const timestamp = Date.now();
  const expiresAt = timestamp + 10000; // 10 seconds duration
  const newPing: SquadPing = {
    ...ping,
    id: ping.id || `ping_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    expiresAt
  };

  if (roomId) {
    await addRtdbSquadPing(roomId, newPing);
  }

  return newPing;
}

/**
 * Removes a team map ping/waypoint from the squad room.
 */
export async function removeWaypoint(
  roomId: string,
  waypointId: string
): Promise<void> {
  if (!roomId || !waypointId) return;
  const room = await fetchRtdbSquadRoom(roomId);
  if (room) {
    const updatedWaypoints = (room.waypoints || []).filter((w: Waypoint) => w.id !== waypointId);
    await saveRtdbSquadRoom({ ...room, waypoints: updatedWaypoints });
  }
}

/**
 * Atomically adds/removes a collectible ID in checkedCollectibles.
 */
export async function toggleCollectibleSync(
  roomId: string,
  collectibleId: string
): Promise<void> {
  if (!roomId || !collectibleId) return;
  await toggleRtdbCollectibleSync(roomId, collectibleId);
}

/**
 * Removes a player from the members map and clears local room cache.
 */
export async function leaveSquadRoom(roomId: string, uid: string): Promise<void> {
  if (!roomId || !uid) return;
  await leaveRtdbSquadRoom(roomId, uid).catch(() => {});
  await clearCachedRoom();
}

/**
 * Subscribes to real-time updates for a squad room via Realtime Database (0 Firestore reads).
 */
export function subscribeToSquadRoom(
  roomId: string,
  onUpdate: (room: SquadRoom | null) => void,
  onError?: (err: any) => void
): () => void {
  if (!roomId) {
    onUpdate(null);
    return () => {};
  }

  // 100% RTDB streaming listener
  return subscribeRtdbSquadRoom(roomId, (rtdbRoom) => {
    if (rtdbRoom) {
      onUpdate(rtdbRoom as SquadRoom);
      cacheSquadRoom(rtdbRoom as SquadRoom).catch(() => {});
    } else {
      onUpdate(null);
    }
  });
}

// LocalForage Cache Helpers
export async function cacheActiveRoom(roomId: string): Promise<void> {
  try {
    await localforage.setItem('gtavi_squad_active_room_id', roomId);
  } catch (e) {
    console.warn('localforage cacheActiveRoom error:', e);
  }
}

export async function getCachedActiveRoom(): Promise<string | null> {
  try {
    return await localforage.getItem<string>('gtavi_squad_active_room_id');
  } catch {
    return null;
  }
}

export async function cacheSquadRoom(room: SquadRoom): Promise<void> {
  try {
    await localforage.setItem(`gtavi_squad_room_${room.roomId}`, room);
  } catch (e) {
    console.warn('localforage cacheSquadRoom error:', e);
  }
}

export async function getCachedSquadRoom(roomId: string): Promise<SquadRoom | null> {
  try {
    return await localforage.getItem<SquadRoom>(`gtavi_squad_room_${roomId}`);
  } catch {
    return null;
  }
}

export async function cacheCheckedCollectibles(list: string[]): Promise<void> {
  try {
    await localforage.setItem('gtavi_squad_checked_collectibles', list);
  } catch (e) {
    console.warn('localforage cacheCheckedCollectibles error:', e);
  }
}

export async function getCachedCheckedCollectibles(): Promise<string[]> {
  try {
    const list = await localforage.getItem<string[]>('gtavi_squad_checked_collectibles');
    return list || [];
  } catch {
    return [];
  }
}

export async function clearCachedRoom(): Promise<void> {
  try {
    await localforage.removeItem('gtavi_squad_active_room_id');
  } catch (e) {
    console.warn('localforage clearCachedRoom error:', e);
  }
}

/**
 * Hosts a new Squad Room with active LFG Matchmaker status
 */
export async function hostLfgSquadRoom(
  hostUid: string,
  hostDisplayName: string,
  lfgConfig: LfgConfig,
  isVipRoom: boolean = false
): Promise<SquadRoom> {
  const roomId = generateRoomCode();
  const avatarColor = '#F43F5E'; // Rose host marker

  const newRoom: SquadRoom = {
    roomId,
    hostUid,
    isVipRoom,
    createdAt: Date.now(),
    lastActiveTimestamp: Date.now(),
    status: 'active',
    isLfgActive: true,
    lfgConfig: {
      ...lfgConfig,
      currentPlayers: 1,
      hostGamerTag: hostDisplayName,
      lat: lfgConfig.lat || 25.7617,
      lng: lfgConfig.lng || -80.1918
    },
    lfgJoinRequests: [],
    members: {
      [hostUid]: {
        displayName: hostDisplayName,
        avatarColor,
        lat: lfgConfig.lat || 25.7617,
        lng: lfgConfig.lng || -80.1918,
        lastUpdated: Date.now()
      }
    },
    waypoints: [
      {
        id: `waypoint-heist-${Date.now()}`,
        label: lfgConfig.activityName,
        type: 'heist',
        lat: lfgConfig.lat || 25.7617,
        lng: lfgConfig.lng || -80.1918,
        placedBy: hostDisplayName
      }
    ],
    checkedCollectibles: []
  };

  const roomRef = doc(db, 'squad_rooms', roomId);
  await setDoc(roomRef, newRoom);
  await saveRtdbSquadRoom(newRoom);
  if (hostUid) {
    registerRtdbSquadMemberPresence(roomId, hostUid, true);
  }
  await cacheActiveRoom(roomId);
  await cacheSquadRoom(newRoom);

  return newRoom;
}

/**
 * Toggles or updates LFG Matchmaker status for an existing squad room
 */
export async function updateLfgStatus(
  roomId: string,
  isLfgActive: boolean,
  lfgConfig?: Partial<LfgConfig>
): Promise<void> {
  const roomRef = doc(db, 'squad_rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const currentData = snap.data() as SquadRoom;
  const updatedConfig = lfgConfig && currentData.lfgConfig 
    ? { ...currentData.lfgConfig, ...lfgConfig } 
    : (lfgConfig as LfgConfig) || currentData.lfgConfig;

  await updateDoc(roomRef, {
    isLfgActive,
    lfgConfig: updatedConfig || null,
    lastActiveTimestamp: Date.now()
  });
}

/**
 * Subscribes to all active LFG Squad Rooms across the platform via Realtime Database (0 Firestore reads)
 */
export function subscribeToLfgSquads(
  onUpdate: (rooms: SquadRoom[]) => void,
  onError?: (err: any) => void
): () => void {
  return subscribeRtdbLfgSquads((rtdbRooms) => {
    if (rtdbRooms) {
      const active = (rtdbRooms as SquadRoom[]).filter(room => !isSquadRoomStale(room));
      onUpdate(active);
    } else {
      onUpdate([]);
    }
  });
}

/**
 * Sends a real-time join request to the room host
 */
export async function requestJoinLfgSquad(
  roomId: string,
  applicant: {
    uid: string;
    displayName: string;
    avatar?: string;
    level?: string;
    mic?: boolean;
  }
): Promise<{ success: boolean; message: string }> {
  const roomRef = doc(db, 'squad_rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) {
    return { success: false, message: 'Squad room no longer exists or expired.' };
  }

  const room = snap.data() as SquadRoom;
  const currentMembers = Object.keys(room.members || {}).length;
  const maxSlots = room.lfgConfig?.requiredPlayers || (room.isVipRoom ? 8 : 2);

  if (currentMembers >= maxSlots) {
    return { success: false, message: 'This heist crew is already full.' };
  }

  if (room.members && room.members[applicant.uid]) {
    return { success: true, message: 'You are already in this squad!' };
  }

  const newRequest: LfgJoinRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    applicantUid: applicant.uid,
    applicantDisplayName: applicant.displayName,
    applicantAvatar: applicant.avatar,
    applicantLevel: applicant.level || 'L1 Citizen',
    applicantMic: applicant.mic ?? true,
    status: 'pending',
    requestedAt: Date.now()
  };

  await updateDoc(roomRef, {
    lfgJoinRequests: arrayUnion(newRequest),
    lastActiveTimestamp: Date.now()
  });

  return { success: true, message: 'Join request transmitted to crew host!' };
}

/**
 * Host responds to an applicant's join request (approve/decline)
 */
export async function respondToLfgJoinRequest(
  roomId: string,
  requestId: string,
  approve: boolean,
  applicantUid: string,
  applicantDisplayName: string
): Promise<void> {
  const roomRef = doc(db, 'squad_rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as SquadRoom;
  const currentRequests = room.lfgJoinRequests || [];
  const targetReq = currentRequests.find(r => r.id === requestId);

  const updatedRequests = currentRequests.map(r => 
    r.id === requestId ? { ...r, status: approve ? 'approved' as const : 'declined' as const } : r
  );

  const updates: Record<string, any> = {
    lfgJoinRequests: updatedRequests,
    lastActiveTimestamp: Date.now()
  };

  if (approve) {
    // Add applicant to members
    const memberColors = ['#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6'];
    const assignedColor = memberColors[Object.keys(room.members || {}).length % memberColors.length];
    
    updates[`members.${applicantUid}`] = {
      displayName: applicantDisplayName,
      avatarColor: assignedColor,
      lat: room.lfgConfig?.lat || 25.7617,
      lng: room.lfgConfig?.lng || -80.1918,
      lastUpdated: Date.now()
    };

    if (room.lfgConfig) {
      updates['lfgConfig.currentPlayers'] = Object.keys(room.members || {}).length + 1;
    }
  }

  await updateDoc(roomRef, updates);
}

