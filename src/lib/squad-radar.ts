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
    const roomsSnap = await getDocs(collection(db, 'squad_rooms'));
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

/**
 * Generates a random 6-character room code (e.g., "VC-9482") and creates a new document in squad_rooms.
 */
export async function createSquadRoom(
  hostUid: string,
  isVip: boolean = false,
  hostUser?: { displayName?: string; avatarColor?: string; lat?: number; lng?: number }
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

  const roomData: SquadRoom = {
    roomId,
    hostUid,
    isVipRoom: isVip,
    createdAt: now,
    lastActiveTimestamp: now,
    status: 'active',
    isStale: false,
    members: initialMembers,
    waypoints: [],
    checkedCollectibles: []
  };

  const roomRef = doc(db, 'squad_rooms', roomId);
  await setDoc(roomRef, roomData);
  await cacheActiveRoom(roomId);
  await cacheSquadRoom(roomData);
  return roomId;
}

/**
 * Adds the user into the members map. Enforces room member capacity limits.
 */
export async function joinSquadRoom(
  roomId: string,
  user: { uid: string; displayName: string; color: string; lat?: number; lng?: number }
): Promise<{ success: boolean; error?: string; room?: SquadRoom; requiresVip?: boolean; isStale?: boolean }> {
  if (!roomId) {
    return { success: false, error: 'Room code is required.' };
  }
  const normalizedRoomId = roomId.toUpperCase().trim();
  const roomRef = doc(db, 'squad_rooms', normalizedRoomId);
  
  let snap;
  try {
    snap = await getDoc(roomRef);
  } catch (err: any) {
    console.warn('Error fetching squad room:', err);
    return { success: false, error: 'Could not connect to squad room database.' };
  }

  if (!snap.exists()) {
    return { success: false, error: `Squad room ${normalizedRoomId} was not found or has expired.` };
  }

  const room = snap.data() as SquadRoom;

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
  const currentCount = Object.keys(existingMembers).length;
  const isAlreadyMember = Boolean(user.uid && existingMembers[user.uid]);

  // Check member limits: Free tier = 2 players, VIP tier = 8 players
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

  await updateDoc(roomRef, {
    [`members.${user.uid}`]: memberData,
    lastActiveTimestamp: now,
    status: 'active',
    isStale: false
  });

  await cacheActiveRoom(normalizedRoomId);
  return { success: true, room };
}

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
  const roomRef = doc(db, 'squad_rooms', roomId);
  const now = Date.now();
  try {
    await updateDoc(roomRef, {
      [`members.${uid}.lat`]: lat,
      [`members.${uid}.lng`]: lng,
      [`members.${uid}.lastUpdated`]: now,
      lastActiveTimestamp: now,
      status: 'active',
      isStale: false
    });
  } catch (e) {
    console.warn('Failed to update player position:', e);
  }
}

/**
 * Adds a new custom team map ping/waypoint to the squad room.
 */
export async function addWaypoint(
  roomId: string,
  waypoint: Omit<Waypoint, 'id'> & { id?: string }
): Promise<void> {
  if (!roomId) return;
  const roomRef = doc(db, 'squad_rooms', roomId);
  const newWaypoint: Waypoint = {
    ...waypoint,
    id: waypoint.id || `wp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  };
  await updateDoc(roomRef, {
    waypoints: arrayUnion(newWaypoint)
  });
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
    const roomRef = doc(db, 'squad_rooms', roomId);
    try {
      // Clean up older expired pings while appending the new ping
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const room = snap.data() as SquadRoom;
        const freshPings = (room.pings || []).filter(p => p.expiresAt > timestamp);
        await updateDoc(roomRef, {
          pings: [...freshPings, newPing]
        });
      } else {
        await updateDoc(roomRef, {
          pings: arrayUnion(newPing)
        });
      }
    } catch (e) {
      console.warn('Failed to sync squad ping to Firestore:', e);
    }
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
  const roomRef = doc(db, 'squad_rooms', roomId);
  const snap = await getDoc(roomRef);
  if (snap.exists()) {
    const room = snap.data() as SquadRoom;
    const updatedWaypoints = (room.waypoints || []).filter(w => w.id !== waypointId);
    await updateDoc(roomRef, {
      waypoints: updatedWaypoints
    });
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
  const roomRef = doc(db, 'squad_rooms', roomId);
  const snap = await getDoc(roomRef);
  if (snap.exists()) {
    const room = snap.data() as SquadRoom;
    const currentList = room.checkedCollectibles || [];
    const isChecked = currentList.includes(collectibleId);
    if (isChecked) {
      await updateDoc(roomRef, {
        checkedCollectibles: arrayRemove(collectibleId)
      });
      await cacheCheckedCollectibles(currentList.filter(id => id !== collectibleId));
    } else {
      await updateDoc(roomRef, {
        checkedCollectibles: arrayUnion(collectibleId)
      });
      await cacheCheckedCollectibles([...currentList, collectibleId]);
    }
  }
}

/**
 * Removes a player from the members map and clears local room cache.
 */
export async function leaveSquadRoom(roomId: string, uid: string): Promise<void> {
  if (!roomId || !uid) return;
  const roomRef = doc(db, 'squad_rooms', roomId);
  try {
    await updateDoc(roomRef, {
      [`members.${uid}`]: deleteField()
    });
  } catch (e) {
    console.warn('leaveSquadRoom error:', e);
  }
  await clearCachedRoom();
}

/**
 * Subscribes to real-time updates for a squad room via Firestore onSnapshot.
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
  const roomRef = doc(db, 'squad_rooms', roomId);
  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SquadRoom;
        onUpdate(data);
        cacheSquadRoom(data).catch(() => {});
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Squad room snapshot subscription notice:', err?.message || err);
      if (onError) onError(err);
    }
  );
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
 * Subscribes to all active LFG Squad Rooms across the platform
 */
export function subscribeToLfgSquads(
  onUpdate: (rooms: SquadRoom[]) => void,
  onError?: (err: any) => void
): () => void {
  const roomsRef = collection(db, 'squad_rooms');
  const q = query(roomsRef, where('isLfgActive', '==', true), limit(25));

  return onSnapshot(
    q,
    (snapshot) => {
      const activeLfgRooms: SquadRoom[] = [];
      snapshot.forEach((docSnap) => {
        const room = docSnap.data() as SquadRoom;
        if (!isSquadRoomStale(room)) {
          // Sync current member count
          const memberCount = Object.keys(room.members || {}).length;
          if (room.lfgConfig) {
            room.lfgConfig.currentPlayers = memberCount;
          }
          activeLfgRooms.push(room);
        }
      });
      onUpdate(activeLfgRooms);
    },
    (err) => {
      console.warn('subscribeToLfgSquads snapshot notice:', err?.message || err);
      if (onError) onError(err);
    }
  );
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

