import {
  getDatabase,
  ref,
  onValue,
  get,
  push,
  set,
  update,
  remove,
  query,
  limitToLast,
  onDisconnect,
  Database
} from 'firebase/database';
import { app } from './client';
import firebaseConfig from '../../../firebase-applet-config.json';

export interface RtdbMessage {
  id: string;
  username: string;
  avatar: string;
  text: string;
  channel: string;
  timestamp: string;
  isVip?: boolean;
  isMod?: boolean;
  isAdmin?: boolean;
  userLevel?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  attachment?: any;
  reactions?: Record<string, number>;
  createdAtMs?: number;
}

export interface RtdbChannel {
  id: string;
  name: string;
  category?: string;
  badge?: string;
  description?: string;
  membersCount?: number;
  members?: string[];
  pendingRequests?: any[];
  admins?: string[];
  bannedUsers?: string[];
  createdBy?: string;
  createdByUid?: string;
  createdAt?: string;
  isPrivate?: boolean;
  password?: string;
  slowModeSec?: number;
  deletionRequested?: boolean;
  deletionRequestedAtMs?: number;
  isDeleted?: boolean;
  deleted?: boolean;
}

let rtdbInstance: Database | null = null;
let rtdbInitAttempted = false;

export function getRtdb(): Database | null {
  if (rtdbInstance) return rtdbInstance;
  try {
    const dbUrl = (firebaseConfig as any).databaseURL || `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`;
    rtdbInstance = getDatabase(app, dbUrl);
  } catch (err) {
    try {
      rtdbInstance = getDatabase(app);
    } catch (e) {
      console.warn('Realtime Database init notice (will fallback to Firestore/REST):', e);
      rtdbInstance = null;
    }
  }
  return rtdbInstance;
}

/**
 * Subscribe to real-time chat messages for a specific channel using Realtime Database
 */
export function subscribeRtdbMessages(
  channelId: string,
  onUpdate: (messages: RtdbMessage[]) => void,
  limit: number = 100
): () => void {
  const rtdb = getRtdb();
  if (!rtdb) return () => {};

  try {
    const messagesRef = query(ref(rtdb, `chatMessages/${channelId}`), limitToLast(limit));
    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate([]);
          return;
        }
        const val = snapshot.val();
        const msgList: RtdbMessage[] = [];
        Object.keys(val).forEach((key) => {
          const item = val[key];
          msgList.push({
            id: key,
            username: item.username || 'ViceCityPlayer_2026',
            avatar: item.avatar || '',
            text: item.text || '',
            channel: item.channel || channelId,
            timestamp: item.timestamp || new Date().toISOString(),
            isVip: item.isVip ?? true,
            isMod: item.isMod || false,
            isAdmin: item.isAdmin || false,
            userLevel: item.userLevel || 'Member',
            isDeleted: item.isDeleted || false,
            deletedBy: item.deletedBy,
            attachment: item.attachment || undefined,
            reactions: item.reactions || {},
            createdAtMs: item.createdAtMs || Date.now()
          });
        });
        msgList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        onUpdate(msgList);
      },
      (error) => {
        console.warn('RTDB onValue warning for messages:', error);
      }
    );

    return () => unsubscribe();
  } catch (err) {
    console.warn('Failed to subscribe to RTDB messages:', err);
    return () => {};
  }
}

/**
 * Push a new chat message to Realtime Database
 */
export async function sendRtdbMessage(msgPayload: Omit<RtdbMessage, 'id'>): Promise<string | null> {
  const rtdb = getRtdb();
  if (!rtdb) return null;

  try {
    const channelRef = ref(rtdb, `chatMessages/${msgPayload.channel}`);
    const newMsgRef = push(channelRef);
    const msgId = newMsgRef.key;
    if (!msgId) return null;

    const dataToSave = {
      ...msgPayload,
      createdAtMs: Date.now()
    };
    await set(newMsgRef, dataToSave);
    return msgId;
  } catch (err) {
    console.warn('RTDB message send warning:', err);
    return null;
  }
}

/**
 * Delete / redact a message in Realtime Database
 */
export async function deleteRtdbMessage(channelId: string, messageId: string, deletedByUsername?: string): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb) return false;

  try {
    const msgRef = ref(rtdb, `chatMessages/${channelId}/${messageId}`);
    await update(msgRef, {
      isDeleted: true,
      text: 'This message was deleted by moderator',
      deletedBy: deletedByUsername || 'Moderator',
      attachment: null
    });
    return true;
  } catch (err) {
    console.warn('RTDB message delete warning:', err);
    return false;
  }
}

/**
 * Subscribe to custom channels list in Realtime Database
 */
export function subscribeRtdbChannels(
  onUpdate: (channels: RtdbChannel[]) => void
): () => void {
  const rtdb = getRtdb();
  if (!rtdb) return () => {};

  try {
    const channelsRef = ref(rtdb, 'customChannels');
    const unsubscribe = onValue(
      channelsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate([]);
          return;
        }
        const val = snapshot.val();
        const chanList: RtdbChannel[] = [];
        Object.keys(val).forEach((key) => {
          const item = val[key];
          if (!item.isDeleted && !item.deleted) {
            chanList.push({
              id: key,
              ...item
            });
          }
        });
        onUpdate(chanList);
      },
      (error) => {
        console.warn('RTDB onValue warning for customChannels:', error);
      }
    );

    return () => unsubscribe();
  } catch (err) {
    console.warn('Failed to subscribe to RTDB channels:', err);
    return () => {};
  }
}

/**
 * Save or update a custom channel document in Realtime Database
 */
export async function saveRtdbChannel(channel: RtdbChannel): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb) return false;

  try {
    const chanRef = ref(rtdb, `customChannels/${channel.id}`);
    await set(chanRef, {
      ...channel,
      updatedAtMs: Date.now()
    });
    return true;
  } catch (err) {
    console.warn('RTDB channel save warning:', err);
    return false;
  }
}

/**
 * Delete a custom channel document in Realtime Database
 */
export async function deleteRtdbChannel(channelId: string): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb) return false;

  try {
    const chanRef = ref(rtdb, `customChannels/${channelId}`);
    await remove(chanRef);
    return true;
  } catch (err) {
    console.warn('RTDB channel delete warning:', err);
    return false;
  }
}

/* ====================================================================
   1. Squad Radar & Co-Op Tactical Party Sync (Realtime Database)
   ==================================================================== */

export function subscribeRtdbSquadRoom(
  roomId: string,
  onUpdate: (room: any | null) => void
): () => void {
  const rtdb = getRtdb();
  if (!rtdb || !roomId) {
    return () => {};
  }

  try {
    const roomRef = ref(rtdb, `squadRooms/${roomId}`);
    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate(null);
          return;
        }
        const val = snapshot.val();
        onUpdate(val);
      },
      (err) => {
        console.warn('RTDB squad room snapshot warning:', err);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('Failed to subscribe to RTDB squad room:', err);
    return () => {};
  }
}

export async function fetchRtdbSquadRoom(roomId: string): Promise<any | null> {
  const rtdb = getRtdb();
  if (!rtdb || !roomId) return null;
  try {
    const roomRef = ref(rtdb, `squadRooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (err) {
    console.warn('RTDB fetch squad room error:', err);
    return null;
  }
}

export async function saveRtdbSquadRoom(room: any): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !room?.roomId) return false;

  try {
    const roomRef = ref(rtdb, `squadRooms/${room.roomId}`);
    await set(roomRef, {
      ...room,
      lastActiveTimestamp: Date.now()
    });
    return true;
  } catch (err) {
    console.warn('RTDB save squad room warning:', err);
    return false;
  }
}

export async function updateRtdbSquadPosition(
  roomId: string,
  uid: string,
  lat: number,
  lng: number
): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !roomId || !uid) return false;

  try {
    const now = Date.now();
    const posRef = ref(rtdb, `squadRooms/${roomId}/members/${uid}`);
    await update(posRef, {
      lat,
      lng,
      lastUpdated: now
    });
    const activeRef = ref(rtdb, `squadRooms/${roomId}`);
    await update(activeRef, {
      lastActiveTimestamp: now,
      status: 'active',
      isStale: false
    });
    return true;
  } catch (err) {
    console.warn('RTDB update squad position warning:', err);
    return false;
  }
}

export async function addRtdbSquadWaypoint(roomId: string, waypointsList: any[]): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !roomId) return false;

  try {
    const wpRef = ref(rtdb, `squadRooms/${roomId}/waypoints`);
    await set(wpRef, waypointsList);
    return true;
  } catch (err) {
    console.warn('RTDB add squad waypoint warning:', err);
    return false;
  }
}

export async function addRtdbSquadPing(roomId: string, pingsList: any[]): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !roomId) return false;

  try {
    const pingsRef = ref(rtdb, `squadRooms/${roomId}/pings`);
    await set(pingsRef, pingsList);
    return true;
  } catch (err) {
    console.warn('RTDB add squad ping warning:', err);
    return false;
  }
}

export async function toggleRtdbCollectibleSync(roomId: string, collectiblesList: string[]): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !roomId) return false;

  try {
    const colRef = ref(rtdb, `squadRooms/${roomId}/checkedCollectibles`);
    await set(colRef, collectiblesList);
    return true;
  } catch (err) {
    console.warn('RTDB toggle collectible warning:', err);
    return false;
  }
}

export async function leaveRtdbSquadRoom(roomId: string, uid: string): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !roomId || !uid) return false;

  try {
    const memberRef = ref(rtdb, `squadRooms/${roomId}/members/${uid}`);
    await remove(memberRef);
    return true;
  } catch (err) {
    console.warn('RTDB leave squad room warning:', err);
    return false;
  }
}

export function subscribeRtdbLfgSquads(
  onUpdate: (rooms: any[]) => void
): () => void {
  const rtdb = getRtdb();
  if (!rtdb) return () => {};

  try {
    const roomsRef = ref(rtdb, 'squadRooms');
    const unsubscribe = onValue(
      roomsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate([]);
          return;
        }
        const val = snapshot.val();
        const lfgRooms: any[] = [];
        Object.keys(val).forEach((key) => {
          const room = val[key];
          if (room && room.isLfgActive && !room.isStale && room.status !== 'stale') {
            const memberCount = Object.keys(room.members || {}).length;
            if (room.lfgConfig) {
              room.lfgConfig.currentPlayers = memberCount;
            }
            lfgRooms.push(room);
          }
        });
        onUpdate(lfgRooms);
      },
      (err) => {
        console.warn('RTDB LFG squads subscription warning:', err);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('Failed to subscribe to RTDB LFG squads:', err);
    return () => {};
  }
}

/* ====================================================================
   2. WebRTC Signaling & Voice Chat Presence (Realtime Database)
   ==================================================================== */

export function subscribeRtdbVoiceRooms(
  onUpdate: (voiceRooms: Record<string, any[]>) => void
): () => void {
  const rtdb = getRtdb();
  if (!rtdb) return () => {};

  try {
    const voiceRef = ref(rtdb, 'voiceComms');
    const unsubscribe = onValue(
      voiceRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate({});
          return;
        }
        const val = snapshot.val();
        const roomsMap: Record<string, any[]> = {};
        Object.keys(val).forEach((chanId) => {
          const roomData = val[chanId];
          if (roomData && roomData.participants) {
            const pArray = typeof roomData.participants === 'object'
              ? (Array.isArray(roomData.participants) ? roomData.participants : Object.values(roomData.participants))
              : [];
            roomsMap[chanId] = pArray;
          } else {
            roomsMap[chanId] = [];
          }
        });
        onUpdate(roomsMap);
      },
      (err) => {
        console.warn('RTDB voice rooms warning:', err);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('Failed to subscribe to RTDB voice rooms:', err);
    return () => {};
  }
}

export async function setRtdbVoiceParticipants(channelId: string, participants: any[]): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !channelId) return false;

  try {
    const roomRef = ref(rtdb, `voiceComms/${channelId}`);
    await set(roomRef, {
      participants,
      updatedAtMs: Date.now()
    });
    return true;
  } catch (err) {
    console.warn('RTDB set voice participants warning:', err);
    return false;
  }
}

export async function sendRtdbVoiceSignal(channelId: string, signalData: any): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !channelId) return false;

  try {
    const signalsRef = ref(rtdb, `voiceSignals/${channelId}`);
    const newSignalRef = push(signalsRef);
    await set(newSignalRef, {
      ...signalData,
      createdAtMs: Date.now()
    });
    return true;
  } catch (err) {
    console.warn('RTDB send voice signal warning:', err);
    return false;
  }
}

export function subscribeRtdbVoiceSignals(
  channelId: string,
  onSignal: (signal: any) => void
): () => void {
  const rtdb = getRtdb();
  if (!rtdb || !channelId) return () => {};

  try {
    const signalsRef = query(ref(rtdb, `voiceSignals/${channelId}`), limitToLast(20));
    let initialLoaded = false;
    const unsubscribe = onValue(
      signalsRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        if (!initialLoaded) {
          initialLoaded = true;
          return;
        }
        const val = snapshot.val();
        const keys = Object.keys(val);
        const lastKey = keys[keys.length - 1];
        if (lastKey) {
          onSignal({ id: lastKey, ...val[lastKey] });
        }
      },
      (err) => {
        console.warn('RTDB voice signals subscription warning:', err);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('Failed to subscribe to RTDB voice signals:', err);
    return () => {};
  }
}

/* ====================================================================
   3. Live FiveM Server Status (Realtime Database)
   ==================================================================== */

export function subscribeRtdbFivemServers(
  onUpdate: (serversMap: Record<string, any>) => void
): () => void {
  const rtdb = getRtdb();
  if (!rtdb) return () => {};

  try {
    const serversRef = ref(rtdb, 'fivemServers');
    const unsubscribe = onValue(
      serversRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate({});
          return;
        }
        onUpdate(snapshot.val());
      },
      (err) => {
        console.warn('RTDB fivemServers subscription warning:', err);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('Failed to subscribe to RTDB FiveM servers:', err);
    return () => {};
  }
}

export async function updateRtdbFivemServer(
  serverId: string,
  serverData: Record<string, any>
): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !serverId) return false;

  try {
    const serverRef = ref(rtdb, `fivemServers/${serverId}`);
    await update(serverRef, {
      ...serverData,
      lastPingAt: Date.now()
    });
    return true;
  } catch (err) {
    console.warn('RTDB update fivem server warning:', err);
    return false;
  }
}

/* ====================================================================
   4. Squad Member Presence & Auto-Disconnect Cleanup
   ==================================================================== */

export function registerRtdbSquadMemberPresence(
  roomId: string,
  uid: string,
  isHost: boolean = false
): () => void {
  const rtdb = getRtdb();
  if (!rtdb || !roomId || !uid) return () => {};

  try {
    const memberRef = ref(rtdb, `squadRooms/${roomId}/members/${uid}`);
    
    // Automatically remove this member node from RTDB when tab closes or disconnects
    onDisconnect(memberRef).remove().catch((e) => {
      console.warn('RTDB onDisconnect member remove notice:', e);
    });

    if (isHost) {
      // If the host disconnects, mark room status stale or remove LFG flag
      const roomRef = ref(rtdb, `squadRooms/${roomId}`);
      onDisconnect(roomRef).update({
        isLfgActive: false,
        status: 'stale',
        isStale: true
      }).catch((e) => {
        console.warn('RTDB onDisconnect host room update notice:', e);
      });
    }

    return () => {
      try {
        remove(memberRef).catch(() => {});
      } catch {}
    };
  } catch (err) {
    console.warn('registerRtdbSquadMemberPresence error:', err);
    return () => {};
  }
}

/* ====================================================================
   5. Live Tuning Championship Leaderboards (Realtime Database)
   ==================================================================== */

export async function saveRtdbChallengeEntry(entry: any): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !entry?.challengeId || !entry?.id) return false;

  try {
    const entryRef = ref(rtdb, `tuningLeaderboards/${entry.challengeId}/${entry.id}`);
    await set(entryRef, {
      ...entry,
      updatedAtMs: Date.now()
    });
    return true;
  } catch (err) {
    console.warn('RTDB challenge entry save warning:', err);
    return false;
  }
}

export async function deleteRtdbChallengeEntry(challengeId: string, entryId: string): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !challengeId || !entryId) return false;
  try {
    const entryRef = ref(rtdb, `tuningLeaderboards/${challengeId}/${entryId}`);
    await remove(entryRef);
    return true;
  } catch (err) {
    console.warn('RTDB challenge entry delete error:', err);
    return false;
  }
}

export async function clearRtdbChallengeLeaderboard(challengeId: string): Promise<boolean> {
  const rtdb = getRtdb();
  if (!rtdb || !challengeId) return false;
  try {
    const boardRef = ref(rtdb, `tuningLeaderboards/${challengeId}`);
    await remove(boardRef);
    return true;
  } catch (err) {
    console.warn('RTDB challenge leaderboard clear error:', err);
    return false;
  }
}

export function subscribeRtdbChallengeLeaderboard(
  challengeId: string,
  onUpdate: (entriesMap: Record<string, any>) => void
): () => void {
  const rtdb = getRtdb();
  if (!rtdb || !challengeId) return () => {};

  try {
    const boardRef = ref(rtdb, `tuningLeaderboards/${challengeId}`);
    const unsubscribe = onValue(
      boardRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate({});
          return;
        }
        onUpdate(snapshot.val());
      },
      (err) => {
        console.warn('RTDB leaderboard subscription warning:', err);
      }
    );
    return () => unsubscribe();
  } catch (err) {
    console.warn('Failed to subscribe to RTDB leaderboard:', err);
    return () => {};
  }
}


