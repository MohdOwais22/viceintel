'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Users,
  Send,
  Sparkles,
  ShieldAlert,
  Crown,
  Paperclip,
  Smile,
  Hash,
  Flame,
  Search,
  CheckCircle2,
  Share2,
  ExternalLink,
  Shield,
  Bot,
  ChevronDown,
  ChevronUp,
  Trash2,
  AtSign,
  UserX,
  CornerDownRight,
  ShieldCheck,
  AlertTriangle,
  Flag,
  Lock,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Tv,
  Radio,
  Plus,
  UserPlus,
  UserCheck,
  Globe,
  Video,
  Copy,
  Settings,
  X,
  LogOut,
  Car,
  Crosshair,
  MapPin,
  DollarSign,
  Eye,
  Gift,
  Key,
  Tag,
  Ban,
  RefreshCw,
  Headphones,
  Volume1,
  Zap,
  Sliders,
  UserMinus,
  BellOff,
  Activity,
  ShieldX,
  Terminal,
  Check,
  FileText,
  Wifi,
  Filter,
  Grid,
  Layout,
  PhoneOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { collection, addDoc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, doc, serverTimestamp, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeFirestoreWrite } from '../lib/firebase/firestoreCircuitBreaker';
import {
  subscribeRtdbMessages,
  sendRtdbMessage,
  deleteRtdbMessage,
  subscribeRtdbChannels,
  saveRtdbChannel,
  deleteRtdbChannel,
  subscribeRtdbVoiceRooms,
  setRtdbVoiceParticipants,
  sendRtdbVoiceSignal,
  subscribeRtdbVoiceSignals,
  subscribeRtdbFivemServers
} from '../lib/firebase/rtdbChatService';
import { ENV } from '../lib/envConfig';
import { getVipVcGrantedNumber, calculateVcForUsd } from '../lib/vipConfig';
import { ChatMessage, ChatAttachment, VoiceParticipant, VoiceRoomState } from '../types';
import {
  playJoinCallSound,
  playLeaveCallSound,
  playMuteClickSound,
  playForceMutedAlert
} from '../lib/voiceAudioEffects';
import { GTA6_AVATARS, DEFAULT_GTA6_AVATAR } from '../data/avatars';
import { VEHICLES_DATA } from '../data/vehicles';
import { WEAPONS_DATA } from '../data/weapons';
import { RP_SERVERS_DATA } from '../data/rpServers';
import { MAP_LOCATIONS_DATA } from '../data/mapLocations';
import { BUSINESSES_DATA } from '../data/businesses';
import { VehicleDetailModal } from './VehicleDetailModal';
import { User as FirebaseUser } from 'firebase/auth';
import { validateMessageContent, getDomainSafetyInfo, DomainSafetyInfo } from '../lib/moderation';
import { copyToClipboard } from '../lib/copyUtils';

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
];



function parseToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return isNaN(timestamp.getTime()) ? null : timestamp;

  // Firestore Timestamp object
  if (typeof timestamp === 'object' && timestamp !== null) {
    if (typeof timestamp.toDate === 'function') {
      const d = timestamp.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    }
    if (typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000);
    }
  }

  // Numeric timestamp (ms or seconds)
  if (typeof timestamp === 'number') {
    const d = new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof timestamp === 'string') {
    const trimmed = timestamp.trim();
    if (!trimmed) return null;

    // ISO or standard JS Date format
    const parsedDirect = new Date(trimmed);
    if (!isNaN(parsedDirect.getTime())) {
      return parsedDirect;
    }

    // Relative format: "Today, 10:42 AM" or "Yesterday, 8:50 PM"
    const now = new Date();
    if (/^today,\s*/i.test(trimmed)) {
      const timePart = trimmed.replace(/^today,\s*/i, '');
      return parseTimeOnDate(now, timePart);
    }
    if (/^yesterday,\s*/i.test(trimmed)) {
      const timePart = trimmed.replace(/^yesterday,\s*/i, '');
      const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return parseTimeOnDate(yest, timePart);
    }

    // Formatted "Jul 26, 2026, 4:15 PM" or "July 26, 4:15 PM" or "Jul 26"
    const matchFormatted = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?(?:,\s*(.*))?$/);
    if (matchFormatted) {
      const monthStr = matchFormatted[1];
      const day = parseInt(matchFormatted[2], 10);
      const year = matchFormatted[3] ? parseInt(matchFormatted[3], 10) : now.getFullYear();
      const timePart = matchFormatted[4] || '';

      const monthIdx = parseMonthIndex(monthStr);
      if (monthIdx !== -1) {
        const d = new Date(year, monthIdx, day);
        if (timePart) {
          return parseTimeOnDate(d, timePart);
        }
        return d;
      }
    }
  }

  return null;
}

function parseTimeOnDate(baseDate: Date, timeStr: string): Date {
  const result = new Date(baseDate);
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    const ampm = match[4] ? match[4].toUpperCase() : null;

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    result.setHours(hours, minutes, seconds, 0);
  }
  return result;
}

function parseMonthIndex(monthStr: string): number {
  const m = monthStr.toLowerCase();
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  for (let i = 0; i < months.length; i++) {
    if (m.startsWith(months[i])) return i;
  }
  return -1;
}

export interface ChatDateAndFormattedTime {
  dateLabel: string;
  timeLabel: string;
}

export const getChatMessageDateAndTime = (timestamp: any, useUtc: boolean = false): ChatDateAndFormattedTime => {
  const date = parseToDate(timestamp);
  const now = new Date();

  if (!date) {
    return {
      dateLabel: 'Today',
      timeLabel: typeof timestamp === 'string' && timestamp.includes(':')
        ? timestamp.replace(/^(today|yesterday),\s*/i, '')
        : '12:00 PM'
    };
  }

  if (useUtc) {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const targetDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    const hours = date.getUTCHours();
    const mins = date.getUTCMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const timeLabel = `${h12.toString().padStart(2, '0')}:${mins} ${ampm}`;

    if (targetDate.getTime() === today.getTime()) {
      return { dateLabel: 'Today', timeLabel };
    } else if (targetDate.getTime() === yesterday.getTime()) {
      return { dateLabel: 'Yesterday', timeLabel };
    } else {
      const isSameYear = date.getUTCFullYear() === now.getUTCFullYear();
      const monthStr = SHORT_MONTH_NAMES[date.getUTCMonth()];
      const dayNum = date.getUTCDate();
      if (isSameYear) {
        return { dateLabel: `${monthStr} ${dayNum}`, timeLabel };
      } else {
        return { dateLabel: `${monthStr} ${dayNum}, ${date.getUTCFullYear()}`, timeLabel };
      }
    }
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (targetDate.getTime() === today.getTime()) {
    return { dateLabel: 'Today', timeLabel };
  } else if (targetDate.getTime() === yesterday.getTime()) {
    return { dateLabel: 'Yesterday', timeLabel };
  } else {
    const isSameYear = date.getFullYear() === now.getFullYear();
    const monthStr = SHORT_MONTH_NAMES[date.getMonth()];
    const dayNum = date.getDate();
    if (isSameYear) {
      return { dateLabel: `${monthStr} ${dayNum}`, timeLabel };
    } else {
      return { dateLabel: `${monthStr} ${dayNum}, ${date.getFullYear()}`, timeLabel };
    }
  }
};

export const BOT_USER_NAME = 'ViceSentinel Bot';
export const BOT_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=ViceSentinel2026';
export const BOT_USER_LEVEL = 'AI Bot';

export const formatChatTimestamp = (timestamp: any, useUtc: boolean = false): string => {
  const { dateLabel, timeLabel } = getChatMessageDateAndTime(timestamp, useUtc);
  return `${dateLabel}, ${timeLabel}`;
};

/**
 * Robustly merges and deduplicates chat messages from multiple transports (RTDB, REST, MongoDB).
 * Automatically reconciles local optimistic messages ('local_...') with authoritative incoming messages,
 * preventing double-message rendering.
 */
export function mergeChatMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  let result = [...existing];

  for (const inc of incoming) {
    if (!inc) continue;

    // 1. Exact ID match: update message in place (preserving reactions or deletion states)
    const exactIdIdx = result.findIndex(p => p.id === inc.id);
    if (exactIdIdx !== -1) {
      result[exactIdIdx] = {
        ...result[exactIdIdx],
        ...inc,
        reactions: { ...(result[exactIdIdx].reactions || {}), ...(inc.reactions || {}) }
      };
      continue;
    }

    // 2. Optimistic message reconciliation:
    // If incoming message matches an optimistic local message (id starting with 'local_')
    // from the same user in the same channel with identical text, reconcile it in place!
    const incTime = parseToDate(inc.timestamp)?.getTime() || Date.now();
    const optIdx = result.findIndex(p => {
      if (!p.id || !p.id.startsWith('local_')) return false;
      if (p.channel !== inc.channel) return false;
      if (p.user !== inc.user) return false;
      if ((p.content || '').trim() !== (inc.content || '').trim()) return false;
      const pTime = parseToDate(p.timestamp)?.getTime() || 0;
      return Math.abs(incTime - pTime) < 120000; // within 2 minutes
    });

    if (optIdx !== -1) {
      result[optIdx] = {
        ...result[optIdx],
        ...inc,
        id: inc.id // replace temporary local_ id with authoritative message id
      };
      continue;
    }

    // 3. Multi-transport deduplication:
    // Check if another confirmed message already exists with identical content, user, and channel within 10 seconds
    const isDuplicate = result.some(p => {
      if (p.id === inc.id) return true;
      if (p.channel === inc.channel && p.user === inc.user && (p.content || '').trim() === (inc.content || '').trim()) {
        const pTime = parseToDate(p.timestamp)?.getTime() || 0;
        if (p.timestamp === inc.timestamp || Math.abs(incTime - pTime) < 10000) {
          return true;
        }
      }
      return false;
    });

    if (!isDuplicate) {
      result.push(inc);
    }
  }

  return result;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm_bot_welcome',
    user: BOT_USER_NAME,
    avatar: BOT_AVATAR,
    channel: 'general',
    content: '🤖 **ViceSentinel Bot is active in #general!** Type `!help` to list commands (`!ping`, `!vehicle`, `!weapon`, `!server`, `!rules`, `!vip`, `!roll`, `!8ball`, `!weather`, `!stats`). Tag `@ViceSentinel` anytime!',
    timestamp: '2026-08-01T10:30:00.000Z',
    isBot: true,
    isVip: true,
    userLevel: 'AI Bot',
    reactions: { '🤖': 42, '⚡': 38, '🔥': 29 }
  },
  {
    id: 'm1',
    user: 'LeonidaKing',
    avatar: GTA6_AVATARS[1].url, // Jason
    channel: 'general',
    content: 'Has anyone tested the top speed on Ocean Drive with the new Pegassi Ignus Custom? Is it topping out at 172mph or higher with turbo?',
    timestamp: '2026-08-01T10:00:00.000Z',
    isVip: true,
    userLevel: 'VIP',
    reactions: { '🔥': 14, '🏎️': 8 }
  },
  {
    id: 'm2',
    user: 'ViceCityMod_Tommy',
    avatar: GTA6_AVATARS[2].url, // Vice Squad Officer
    channel: 'general',
    content: 'Just updated the FiveM RP server listings! @LeonidaKing check out Vice City Underground RP, 128 slots running on custom C# physics.',
    timestamp: '2026-08-01T10:25:00.000Z',
    isMod: true,
    isAdmin: true,
    userLevel: 'Admin',
    attachment: {
      type: 'server',
      title: 'Vice City Underground RP',
      detail: 'cfx.re/join/v6vc77 • 112/128 Online'
    },
    reactions: { '👍': 24, '💯': 19 }
  },
  {
    id: 'm3',
    user: 'HeistLeader_Lucia',
    avatar: GTA6_AVATARS[0].url, // Lucia
    channel: 'heists',
    content: 'Looking for 2 experienced drivers for Port Gellhorn Container Heist tonight at 9 PM EST. Must have armored Executor Heavy.',
    timestamp: '2026-07-31T20:00:00.000Z',
    isVip: true,
    userLevel: 'VIP',
    reactions: { '💰': 12, '🤝': 7 }
  },
  {
    id: 'm4',
    user: 'DriftMaster99',
    avatar: GTA6_AVATARS[4].url, // Ocean Drive DJ
    channel: 'tuning',
    content: 'Pro tip for Grotti Turismo Classic: lowering suspension to Street level gives +12% handling stability without losing drift angle.',
    timestamp: '2026-07-28T14:00:00.000Z',
    userLevel: 'Member',
    attachment: {
      type: 'vehicle',
      title: 'Grotti Turismo Classic (Drift Spec)',
      detail: 'Total Mod Cost: $980,000 • 218 Community Upvotes'
    },
    reactions: { '🔥': 31, '❤️': 15 }
  },
  {
    id: 'm5',
    user: 'ViceCity_Classic_88',
    avatar: GTA6_AVATARS[3].url, // Outlaw Biker
    channel: 'rp-servers',
    content: 'Flashback to our classic Vice City roleplay server anniversary! Legendary memories on Starfish Island.',
    timestamp: '2025-06-15T12:00:00.000Z',
    userLevel: 'Member',
    reactions: { '👑': 18, '🔥': 22 }
  }
];

export interface CustomChannel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  inviteCode: string;
  createdAt: string;
  members: string[];
  pendingRequests: {
    userId: string;
    username: string;
    avatar: string;
    requestedAt: string;
  }[];
  admins?: string[];
  bannedUsers?: string[];
  deletionRequested?: boolean;
  deletionRequestedAtMs?: number;
}

const INITIAL_CUSTOM_CHANNELS: CustomChannel[] = [
  {
    id: 'vip_ocean_drivers',
    name: 'ocean-drive-syndicate',
    description: 'Private high-stakes drag racing crew & secret custom mod swaps on Vice Beach.',
    isPrivate: true,
    creatorId: 'vip_creator_01',
    creatorName: 'LeonidaKing',
    creatorAvatar: GTA6_AVATARS[1].url,
    inviteCode: 'HUB-VIP-7709',
    createdAt: '2026-08-01T08:00:00.000Z',
    members: ['LeonidaKing', 'HeistLeader_Lucia', 'ViceRacer99'],
    pendingRequests: [
      {
        userId: 'req_usr_01',
        username: 'SpeedDemon_99',
        avatar: GTA6_AVATARS[3].url,
        requestedAt: '10 mins ago'
      }
    ]
  },
  {
    id: 'vip_leaks_vault',
    name: 'gta6-secret-leaks',
    description: 'Exclusive leaks, map coordinates & audio decrypt files shared by VIP members.',
    isPrivate: false,
    creatorId: 'vip_creator_02',
    creatorName: 'ViceCityMod_Tommy',
    creatorAvatar: GTA6_AVATARS[2].url,
    inviteCode: 'HUB-LEAKS-3312',
    createdAt: '2026-08-01T08:00:00.000Z',
    members: ['ViceCityMod_Tommy', 'DriftMaster99', 'ViceCity_Classic_88'],
    pendingRequests: []
  }
];

interface CommunityChatTabProps {
  isAuthenticated?: boolean;
  currentUser?: FirebaseUser | null;
  onOpenAuth?: () => void;
  isVipActive?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  initialChannel?: string;
  isVoiceModalOpen?: boolean;
  onVoiceModalChange?: (isOpen: boolean) => void;
  onChannelChange?: (channel: string) => void;
  onOpenAvatarCreator?: () => void;
}

export const CommunityChatTab: React.FC<CommunityChatTabProps> = ({
  isAuthenticated = true,
  currentUser,
  onOpenAuth,
  isVipActive = false,
  isAdmin = false,
  isStaff = false,
  initialChannel = 'general',
  isVoiceModalOpen,
  onVoiceModalChange,
  onChannelChange,
  onOpenAvatarCreator
}) => {
  const [activeChannel, setActiveChannelState] = useState<string>(initialChannel || 'general');

  const setActiveChannel = (chan: string) => {
    setActiveChannelState(chan);
    if (onChannelChange) {
      onChannelChange(chan);
    }
  };

  useEffect(() => {
    if (initialChannel) {
      setActiveChannelState(initialChannel);
    }
  }, [initialChannel]);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const hasPositionedForChannelRef = useRef<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);

  // Custom VIP Channels state & Firestore synchronization
  const [customChannels, setCustomChannels] = useState<CustomChannel[]>(INITIAL_CUSTOM_CHANNELS);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState<boolean>(false);
  const [isJoinChannelModalOpen, setIsJoinChannelModalOpen] = useState<boolean>(false);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [newChannelForm, setNewChannelForm] = useState<{ name: string; description: string; isPrivate: boolean }>({
    name: '',
    description: '',
    isPrivate: true
  });
  const [managingChannel, setManagingChannel] = useState<CustomChannel | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // Ultra-Low CPU Voice Comms ("Vice Voice Comms") state & Multi-Channel Voice Rooms
  const [isVoiceConnected, setIsVoiceConnected] = useState<boolean>(false);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [isVoiceRoomModalOpenState, setIsVoiceRoomModalOpenState] = useState<boolean>(isVoiceModalOpen ?? false);

  useEffect(() => {
    if (typeof isVoiceModalOpen === 'boolean') {
      if (isVoiceModalOpen && !isVoiceConnected && micPermissionState !== 'granted') {
        handleJoinVoiceChannel(activeVoiceChannel || activeChannel || 'general').then((granted) => {
          if (!granted) {
            setIsVoiceRoomModalOpenState(false);
            if (onVoiceModalChange) {
              onVoiceModalChange(false);
            }
          } else {
            setIsVoiceRoomModalOpenState(true);
          }
        });
      } else {
        setIsVoiceRoomModalOpenState(isVoiceModalOpen);
      }
    }
  }, [isVoiceModalOpen]);

  const setIsVoiceRoomModalOpen = async (open: boolean) => {
    if (open && !isVoiceConnected) {
      const granted = await handleJoinVoiceChannel(activeVoiceChannel || activeChannel || 'general');
      if (!granted) {
        setIsVoiceRoomModalOpenState(false);
        if (onVoiceModalChange) {
          onVoiceModalChange(false);
        }
        return;
      }
    }
    setIsVoiceRoomModalOpenState(open);
    if (onVoiceModalChange) {
      onVoiceModalChange(open);
    }
  };

  const isVoiceRoomModalOpen = isVoiceRoomModalOpenState;
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);
  const [pushToTalk, setPushToTalk] = useState<boolean>(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  const [participantVolumes, setParticipantVolumes] = useState<Record<string, number>>({});

  // Real-Time Audio Capture, WebAudio VAD and WebRTC Audio Mesh Refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const lastPlayedPacketTimestampRef = useRef<number>(0);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const webrtcBroadcastRef = useRef<BroadcastChannel | null>(null);
  const remoteAudioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // Master WebAudio Output Pipeline for bypass of browser autoplay restrictions
  const masterAudioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const [isAudioOutputUnlocked, setIsAudioOutputUnlocked] = useState<boolean>(false);

  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(100);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'requesting'>('prompt');
  const [voiceDurationSec, setVoiceDurationSec] = useState<number>(0);

  // Live timer for voice session duration in mm:ss format
  useEffect(() => {
    if (!isVoiceConnected) {
      setVoiceDurationSec(0);
      return;
    }
    const interval = setInterval(() => {
      if (lastJoinedVoiceMsRef.current > 0) {
        const elapsed = Math.floor((Date.now() - lastJoinedVoiceMsRef.current) / 1000);
        setVoiceDurationSec(Math.max(0, elapsed));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isVoiceConnected]);

  // Background Tab / Minimize Keepalive effect for AudioContext & WebRTC call connection
  useEffect(() => {
    const handleVisibilityOrFocusChange = () => {
      if (isVoiceConnected) {
        if (masterAudioContextRef.current && masterAudioContextRef.current.state === 'suspended') {
          masterAudioContextRef.current.resume().catch(() => {});
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocusChange);
    window.addEventListener('focus', handleVisibilityOrFocusChange);
    window.addEventListener('pageshow', handleVisibilityOrFocusChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange);
      window.removeEventListener('focus', handleVisibilityOrFocusChange);
      window.removeEventListener('pageshow', handleVisibilityOrFocusChange);
    };
  }, [isVoiceConnected]);

  // Picture-in-Picture & Standalone Pop-out Window Handlers (Removed as per requested interface cleanup)


  const formatVoiceDuration = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Ensures the master AudioContext is initialized, resumed, and unlocked by user gesture
  const ensureAudioOutputUnlocked = async () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!masterAudioContextRef.current && AudioCtx) {
        const ctx = new AudioCtx();
        const gainNode = ctx.createGain();
        gainNode.gain.value = Math.max(0, Math.min(1, outputVolume / 100));
        gainNode.connect(ctx.destination);
        masterAudioContextRef.current = ctx;
        masterGainRef.current = gainNode;
      }

      if (masterAudioContextRef.current) {
        if (masterAudioContextRef.current.state === 'suspended') {
          await masterAudioContextRef.current.resume();
        }
        // Play a 0.001s silent buffer to permanently unlock audio output in browser session
        const ctx = masterAudioContextRef.current;
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume().catch(() => {});
      }

      setIsAudioOutputUnlocked(true);
    } catch (e) {
      console.warn('Unlock master audio context warning:', e);
    }
  };

  // Helper to obtain WebRTC Configuration with public STUN and TURN fallback servers
  const getWebRTCConfig = (): RTCConfiguration => {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ],
      iceCandidatePoolSize: 10
    };
  };

  // Helper to send WebRTC signaling data across BroadcastChannel, RTDB (~10ms) and Firestore
  const sendWebRTCSignal = async (targetChan: string, signalData: any) => {
    if (webrtcBroadcastRef.current) {
      try {
        webrtcBroadcastRef.current.postMessage(signalData);
      } catch (e) {}
    }
    sendRtdbVoiceSignal(targetChan, signalData).catch(() => {});
    await safeFirestoreWrite(async () => {
      await addDoc(collection(db, 'voiceComms', targetChan, 'signals'), {
        ...signalData,
        timestampMs: Date.now()
      });
    });
  };

  // Helper to create or retrieve WebRTC PeerConnection for a remote peer
  const getOrCreatePeerConnection = (peerId: string, channelId: string): RTCPeerConnection => {
    if (peerConnectionsRef.current[peerId]) {
      return peerConnectionsRef.current[peerId];
    }

    const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const currentUid = currentUser?.uid || currentUsername;

    const config = getWebRTCConfig();
    const pc = new RTCPeerConnection(config);

    // ICE Candidate Gathering Event
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebRTCSignal(channelId, {
          type: 'webrtc_ice_candidate',
          candidate: event.candidate.toJSON(),
          fromUserId: currentUid,
          fromUsername: currentUsername,
          toUserId: peerId
        });
      }
    };

    // Attach local audio track if available
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        try {
          pc.addTrack(track, localStreamRef.current!);
        } catch (e) {}
      });
    }

    // Remote Track Events & Stream Attachment
    pc.ontrack = (event) => {
      if (event.receiver) {
        try {
          if ('playoutDelayHint' in event.receiver) {
            (event.receiver as any).playoutDelayHint = 0.12; // 120ms playout buffer hint
          }
        } catch (e) {}
      }

      const remoteStream = event.streams[0];
      if (remoteStream) {
        // Ensure DOM container for audio elements exists
        let audioContainer = document.getElementById('gtavi-voice-remote-audio-container');
        if (!audioContainer && typeof document !== 'undefined') {
          audioContainer = document.createElement('div');
          audioContainer.id = 'gtavi-voice-remote-audio-container';
          audioContainer.style.display = 'none';
          document.body.appendChild(audioContainer);
        }

        let audioEl = document.getElementById(`remote-audio-${peerId}`) as HTMLAudioElement;
        if (!audioEl && typeof document !== 'undefined') {
          audioEl = document.createElement('audio');
          audioEl.id = `remote-audio-${peerId}`;
          audioEl.autoplay = true;
          (audioEl as any).playsInline = true;
          if (audioContainer) {
            audioContainer.appendChild(audioEl);
          }
          remoteAudioElementsRef.current[peerId] = audioEl;
        }

        if (audioEl) {
          audioEl.srcObject = remoteStream;
          const userVol = (participantVolumes[peerId] ?? 100) / 100;
          const globalVol = isDeafened ? 0 : (outputVolume / 100);
          audioEl.volume = Math.max(0, Math.min(1, userVol * globalVol));
          audioEl.muted = isDeafened;
          audioEl.play().catch(async () => {
            await ensureAudioOutputUnlocked();
            audioEl.play().catch(() => {});
          });
        }

        // Also route through WebAudio master gain for double redundancy
        try {
          if (masterAudioContextRef.current && masterGainRef.current) {
            const ctx = masterAudioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            const streamSource = ctx.createMediaStreamSource(remoteStream);
            streamSource.connect(masterGainRef.current);
          }
        } catch (e) {}

        setVoiceRooms(prev => {
          const list = prev[channelId] || [];
          return {
            ...prev,
            [channelId]: list.map(p => (p.userId === peerId || p.username === peerId ? { ...p, isSpeaking: true } : p))
          };
        });

        const timerKey = `webrtc_speaking_${peerId}`;
        if ((window as any)[timerKey]) clearTimeout((window as any)[timerKey]);
        (window as any)[timerKey] = setTimeout(() => {
          setVoiceRooms(prev => {
            const list = prev[channelId] || [];
            return {
              ...prev,
              [channelId]: list.map(p => (p.userId === peerId || p.username === peerId ? { ...p, isSpeaking: false } : p))
            };
          });
        }, 1200);
      }
    };

    peerConnectionsRef.current[peerId] = pc;
    return pc;
  };

  // Initialize and monitor real microphone audio capture & VAD (Voice Activity Detection)
  const startMicCaptureAndVAD = async (targetChan: string): Promise<boolean> => {
    try {
      setMicPermissionState('requesting');
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setMicPermissionState('denied');
        return false;
      }

      let stream: MediaStream | null = null;
      try {
        // First try with high-fidelity WebAudio constraints
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: noiseSuppression,
            autoGainControl: true
          }
        });
      } catch (constraintErr) {
        console.warn('Advanced audio constraints not supported by browser, attempting basic audio fallback...', constraintErr);
        try {
          // Fallback to basic audio constraint for maximum compatibility (Safari / iOS WebKit)
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (basicErr) {
          throw basicErr;
        }
      }

      if (!stream) {
        setMicPermissionState('denied');
        return false;
      }

      localStreamRef.current = stream;
      setMicPermissionState('granted');

      // Ensure stream tracks match current mute setting
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });

      // Attach tracks to existing peer connections if any exist
      Object.values(peerConnectionsRef.current).forEach(pc => {
        stream.getAudioTracks().forEach(track => {
          try {
            pc.addTrack(track, stream);
          } catch (e) {}
        });
      });

      // WebAudio VAD Analyser Node Setup
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        let audioCtx = audioContextRef.current;
        if (!audioCtx || audioCtx.state === 'closed') {
          audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
        }
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume().catch(() => {});
        }

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
        vadIntervalRef.current = setInterval(() => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const levelNormalized = Math.min(100, Math.round((avg / 128) * 100));
          setMicVolumeLevel(levelNormalized);

          // Update real-time voice activity state when local player speaks
          if (targetChan && !isMuted) {
            const isSpeakingNow = levelNormalized > 10;
            const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
            const currentUid = currentUser?.uid || currentUsername;

            setVoiceRooms(prev => {
              const currentList = prev[targetChan] || [];
              const myEntry = currentList.find(p => p.username === currentUsername || p.userId === currentUid);
              if (myEntry && myEntry.isSpeaking !== isSpeakingNow) {
                const nextList = currentList.map(p => {
                  if (p.username === currentUsername || p.userId === currentUid) {
                    return { ...p, isSpeaking: isSpeakingNow };
                  }
                  return p;
                });
                return { ...prev, [targetChan]: nextList };
              }
              return prev;
            });
          }
        }, 100);
      }
      return true;
    } catch (err: any) {
      console.warn('Microphone stream access notice:', err);
      setMicPermissionState('denied');
      const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;
      if (isInsideIframe) {
        setVoiceToast('ℹ️ Mic blocked in preview frame. Connected in Listen-Only mode (Open in new tab to speak).');
      } else {
        setVoiceToast('ℹ️ Mic unavailable. Connected in Listen-Only mode.');
      }
      setTimeout(() => setVoiceToast(null), 5000);
      return false;
    }
  };

  // Manual Reconnect Media Streams handler to refresh media transports & renegotiate tracks without page reload
  const handleReconnectMediaStreams = async () => {
    try {
      setVoiceToast('🔄 Refreshing & Reconnecting Media Streams...');

      const targetChan = activeVoiceChannel || activeChannel;

      // 1. Re-acquire or refresh local microphone audio stream
      if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        try {
          const freshStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });

          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
          }

          localStreamRef.current = freshStream;
          setMicPermissionState('granted');

          freshStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
          });
        } catch (micErr) {
          console.warn('Mic re-acquisition notice:', micErr);
        }
      }

      // 2. Reset and reconnect active PeerConnections/Transports
      Object.keys(peerConnectionsRef.current).forEach(peerId => {
        try {
          peerConnectionsRef.current[peerId].close();
        } catch (e) {}
      });
      peerConnectionsRef.current = {};

      // 3. Clear and re-initialize remote audio elements
      Object.keys(remoteAudioElementsRef.current).forEach(peerId => {
        try {
          remoteAudioElementsRef.current[peerId].pause();
          remoteAudioElementsRef.current[peerId].remove();
        } catch (e) {}
      });
      remoteAudioElementsRef.current = {};

      // 4. Send WebRTC signal to initiate transport re-handshake across channel
      const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
      const currentUid = currentUser?.uid || currentUsername;

      if (targetChan && isVoiceConnected) {
        await sendWebRTCSignal(targetChan, {
          type: 'user_joined_voice',
          fromUserId: currentUid,
          fromUsername: currentUsername,
          toUserId: 'ALL'
        });
      }

      // 5. Ensure Master WebAudio Output is unblocked
      await ensureAudioOutputUnlocked();

      setVoiceToast('⚡ Media Streams & Voice Transports Reconnected!');
      setTimeout(() => setVoiceToast(null), 3000);
    } catch (err) {
      console.error('Error in handleReconnectMediaStreams:', err);
      setVoiceToast('⚠️ Media stream refresh completed with warnings.');
      setTimeout(() => setVoiceToast(null), 2500);
    }
  };

  const stopMicAndAudio = () => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    setMicVolumeLevel(0);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    setIsVoiceRoomModalOpen(false);

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (e) {}
      audioContextRef.current = null;
    }

    Object.values(peerConnectionsRef.current).forEach(pc => {
      try {
        pc.close();
      } catch (e) {}
    });
    peerConnectionsRef.current = {};

    Object.values(remoteAudioElementsRef.current).forEach(el => {
      try {
        el.pause();
        el.srcObject = null;
        el.remove();
      } catch (e) {}
    });
    remoteAudioElementsRef.current = {};
  };

  // Ensure all microphone tracks, VAD timers, audio contexts, and WebRTC peers are completely halted on component unmount
  useEffect(() => {
    return () => {
      stopMicAndAudio();
    };
  }, []);

  const [voiceRooms, setVoiceRooms] = useState<Record<string, VoiceParticipant[]>>({
    general: [
      {
        userId: 'usr_lk_01',
        username: 'LeonidaKing',
        avatar: GTA6_AVATARS[1].url,
        userLevel: 'VIP',
        isMuted: false,
        isForceMuted: false,
        isDeafened: false,
        isSpeaking: true,
        joinedAtMs: Date.now() - 300000,
        pingMs: 24
      },
      {
        userId: 'usr_tv_02',
        username: 'Tommy_ViceSquad',
        avatar: GTA6_AVATARS[2].url,
        userLevel: 'Admin',
        isMuted: false,
        isForceMuted: false,
        isDeafened: false,
        isSpeaking: false,
        joinedAtMs: Date.now() - 600000,
        pingMs: 18
      },
      {
        userId: 'usr_dm_03',
        username: 'DriftMaster99',
        avatar: GTA6_AVATARS[4].url,
        userLevel: 'Member',
        isMuted: true,
        isForceMuted: false,
        isDeafened: false,
        isSpeaking: false,
        joinedAtMs: Date.now() - 120000,
        pingMs: 32
      }
    ],
    heists: [
      {
        userId: 'usr_hl_04',
        username: 'HeistLeader_Lucia',
        avatar: GTA6_AVATARS[0].url,
        userLevel: 'VIP',
        isMuted: false,
        isForceMuted: false,
        isDeafened: false,
        isSpeaking: true,
        joinedAtMs: Date.now() - 450000,
        pingMs: 20
      },
      {
        userId: 'usr_ob_05',
        username: 'OutlawBiker',
        avatar: GTA6_AVATARS[3].url,
        userLevel: 'Member',
        isMuted: false,
        isForceMuted: false,
        isDeafened: false,
        isSpeaking: false,
        joinedAtMs: Date.now() - 180000,
        pingMs: 28
      }
    ],
    tuning: [
      {
        userId: 'usr_vr_06',
        username: 'ViceRacer99',
        avatar: GTA6_AVATARS[5].url,
        userLevel: 'VIP',
        isMuted: false,
        isForceMuted: false,
        isDeafened: false,
        isSpeaking: false,
        joinedAtMs: Date.now() - 90000,
        pingMs: 15
      }
    ]
  });

  const lastJoinedVoiceMsRef = useRef<number>(0);

  // Real-Time RTDB & Firestore Synchronization for Voice Comms across all channels
  useEffect(() => {
    let unsubFs = () => {};
    let unsubRtdb = () => {};

    // 1. RTDB instant presence sync (~10ms)
    try {
      unsubRtdb = subscribeRtdbVoiceRooms((rtdbRoomsMap) => {
        if (rtdbRoomsMap && Object.keys(rtdbRoomsMap).length > 0) {
          setVoiceRooms(prev => ({
            ...prev,
            ...rtdbRoomsMap
          }));
        }
      });
    } catch (e) {
      console.warn('RTDB voice rooms sub warning:', e);
    }

    return () => {
      unsubRtdb();
    };
  }, [isVoiceConnected, activeVoiceChannel, currentUser]);

  // Synchronize remote audio elements volume & mute status with outputVolume & isDeafened
  useEffect(() => {
    Object.values(remoteAudioElementsRef.current).forEach(audioEl => {
      if (audioEl) {
        audioEl.volume = isDeafened ? 0 : Math.max(0, Math.min(1, outputVolume / 100));
        audioEl.muted = isDeafened;
      }
    });
  }, [outputVolume, isDeafened]);

  // Process incoming WebRTC signaling packets (Offer, Answer, ICE Candidate, User Joined, User Left)
  const handleIncomingWebRTCSignal = async (signalData: any) => {
    if (!signalData || !isVoiceConnected || !activeVoiceChannel) return;
    const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const currentUid = currentUser?.uid || currentUsername;

    const { type, sdp, candidate, fromUserId, fromUsername, toUserId } = signalData;

    // Filter out our own signals
    if (fromUserId === currentUid || fromUsername === currentUsername) return;
    // Filter signals directed specifically to another user
    if (toUserId && toUserId !== currentUid && toUserId !== currentUsername && toUserId !== 'ALL') return;

    const peerId = fromUserId || fromUsername;

    if (type === 'user_joined_voice') {
      const pc = getOrCreatePeerConnection(peerId, activeVoiceChannel);
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);
        sendWebRTCSignal(activeVoiceChannel, {
          type: 'webrtc_offer',
          sdp: pc.localDescription?.toJSON(),
          fromUserId: currentUid,
          fromUsername: currentUsername,
          toUserId: peerId
        });
      } catch (err) {
        console.warn('Error creating offer for new joiner:', err);
      }
      return;
    }

    if (type === 'user_left_voice') {
      if (peerConnectionsRef.current[peerId]) {
        peerConnectionsRef.current[peerId].close();
        delete peerConnectionsRef.current[peerId];
      }
      if (remoteAudioElementsRef.current[peerId]) {
        remoteAudioElementsRef.current[peerId].pause();
        remoteAudioElementsRef.current[peerId].remove();
        delete remoteAudioElementsRef.current[peerId];
      }
      return;
    }

    const pc = getOrCreatePeerConnection(peerId, activeVoiceChannel);

    try {
      if (type === 'webrtc_offer' && sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendWebRTCSignal(activeVoiceChannel, {
          type: 'webrtc_answer',
          sdp: pc.localDescription?.toJSON(),
          fromUserId: currentUid,
          fromUsername: currentUsername,
          toUserId: peerId
        });
      } else if (type === 'webrtc_answer' && sdp) {
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
      } else if (type === 'webrtc_ice_candidate' && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (cErr) {
          console.warn('Remote ICE candidate error:', cErr);
        }
      }
    } catch (err) {
      console.warn('Error processing WebRTC signal:', err);
    }
  };

  // WebRTC BroadcastChannel signaling listener for same-origin tabs
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const wbc = new BroadcastChannel('gtavi_webrtc_signaling');
    webrtcBroadcastRef.current = wbc;

    wbc.onmessage = (event) => {
      handleIncomingWebRTCSignal(event.data);
    };

    return () => {
      wbc.close();
      webrtcBroadcastRef.current = null;
    };
  }, [isVoiceConnected, activeVoiceChannel, currentUser]);

  // WebRTC RTDB & Firestore signaling listener for remote devices & cross-network connections
  useEffect(() => {
    if (!isVoiceConnected || !activeVoiceChannel) return;
    let unsubFs = () => {};
    let unsubRtdb = () => {};
    const joinTime = lastJoinedVoiceMsRef.current || (Date.now() - 5000);

    // 1. RTDB instant signal listener (~10ms)
    try {
      unsubRtdb = subscribeRtdbVoiceSignals(activeVoiceChannel, (signalData) => {
        if (signalData && signalData.createdAtMs && signalData.createdAtMs >= joinTime - 3000) {
          handleIncomingWebRTCSignal(signalData);
        }
      });
    } catch (e) {
      console.warn('RTDB voice signal sub warning:', e);
    }

    return () => {
      unsubRtdb();
    };
  }, [isVoiceConnected, activeVoiceChannel, currentUser]);

  // Monitor current user's force-mute or kick status in active voice channel
  useEffect(() => {
    if (!isVoiceConnected || !activeVoiceChannel) return;

    // Grace period right after joining to allow Firestore doc creation/sync
    if (Date.now() - lastJoinedVoiceMsRef.current < 6000) return;

    const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const participantsInChannel = voiceRooms[activeVoiceChannel] || [];
    const myParticipant = participantsInChannel.find(
      p => p.username === currentUsername || p.userId === (currentUser?.uid || currentUsername)
    );

    if (!myParticipant) {
      setIsVoiceConnected(false);
      setActiveVoiceChannel(null);
      playLeaveCallSound();
      setVoiceToast('🚫 You were disconnected from Voice Comms by channel host or staff.');
      setTimeout(() => setVoiceToast(null), 5000);
      return;
    }

    if (myParticipant.isForceMuted) {
      if (!isMuted) {
        setIsMuted(true);
        playForceMutedAlert();
        setVoiceToast('🔇 You were Force-Muted by channel host or staff.');
        setTimeout(() => setVoiceToast(null), 5000);
      }
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
    }
  }, [voiceRooms, isVoiceConnected, activeVoiceChannel, isMuted, currentUser]);

  const handleJoinVoiceChannel = async (channelId: string, forceListenOnly: boolean = false): Promise<boolean> => {
    const targetChannel = channelId || activeChannel || 'general';
    lastJoinedVoiceMsRef.current = Date.now();

    // Start real microphone audio capture and WebAudio VAD meter if not forcing listen-only
    let isGranted = false;
    if (!forceListenOnly) {
      isGranted = await startMicCaptureAndVAD(targetChannel);
    }

    // Even if mic capture fails (e.g. Safari iframe sandbox or no mic), connect user in Listen-Only mode!
    const effectiveMuted = !isGranted || isMuted || forceListenOnly;
    if (!isGranted || forceListenOnly) {
      setIsMuted(true);
    }

    const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const currentUid = currentUser?.uid || currentUsername;
    const currentAvatar = currentUser?.photoURL || GTA6_AVATARS[0].url;
    const userLevel = isAdminUser ? 'Admin' : isStaffUser ? 'Staff' : isVipUser ? 'VIP' : 'Member';

    const updatedRooms = { ...voiceRooms };
    Object.keys(updatedRooms).forEach(ch => {
      updatedRooms[ch] = (updatedRooms[ch] || []).filter(
        p => p.username !== currentUsername && p.userId !== currentUid
      );
      if (ch !== targetChannel) {
        setDoc(doc(db, 'voiceComms', ch), {
          channelId: ch,
          participants: updatedRooms[ch],
          updatedAtMs: Date.now()
        }).catch(() => {});
      }
    });

    const newParticipant: VoiceParticipant = {
      userId: currentUid,
      username: currentUsername,
      avatar: currentAvatar,
      userLevel: userLevel,
      isMuted: effectiveMuted,
      isForceMuted: false,
      isDeafened: isDeafened,
      isSpeaking: false,
      joinedAtMs: Date.now(),
      pingMs: Math.floor(Math.random() * 15) + 16
    };

    const targetParticipants = [...(updatedRooms[targetChannel] || []), newParticipant];
    updatedRooms[targetChannel] = targetParticipants;
    setVoiceRooms(updatedRooms);
    setActiveVoiceChannel(targetChannel);
    setIsVoiceConnected(true);
    setIsVoiceRoomModalOpenState(true);
    if (onVoiceModalChange) {
      onVoiceModalChange(true);
    }

    playJoinCallSound();
    if (isGranted) {
      setVoiceToast(`🎙️ Connected to Voice Comms in #${targetChannel}`);
    } else {
      setVoiceToast(`🎧 Connected to #${targetChannel} (Listen-Only Mode)`);
    }
    setTimeout(() => setVoiceToast(null), 4000);

    try {
      setRtdbVoiceParticipants(targetChannel, targetParticipants).catch(() => {});
      await setDoc(doc(db, 'voiceComms', targetChannel), {
        channelId: targetChannel,
        participants: targetParticipants,
        updatedAtMs: Date.now()
      });
    } catch (e) {
      console.warn('Error joining voice comms Firestore:', e);
    }

    // Broadcast user_joined_voice signal to trigger WebRTC offer from channel participants
    sendWebRTCSignal(targetChannel, {
      type: 'user_joined_voice',
      fromUserId: currentUid,
      fromUsername: currentUsername,
      toUserId: 'ALL'
    });
    return true;
  };

  const handleDisconnectVoice = async () => {
    setIsVoiceRoomModalOpen(false);
    if (!activeVoiceChannel) {
      setIsVoiceConnected(false);
      stopMicAndAudio();
      return;
    }
    const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const currentUid = currentUser?.uid || currentUsername;

    const channelId = activeVoiceChannel;

    // Broadcast user_left_voice signal
    sendWebRTCSignal(channelId, {
      type: 'user_left_voice',
      fromUserId: currentUid,
      fromUsername: currentUsername,
      toUserId: 'ALL'
    });

    const updatedParticipants = (voiceRooms[channelId] || []).filter(
      p => p.username !== currentUsername && p.userId !== currentUid
    );

    stopMicAndAudio();

    setVoiceRooms(prev => ({ ...prev, [channelId]: updatedParticipants }));
    setIsVoiceConnected(false);
    setActiveVoiceChannel(null);

    playLeaveCallSound();
    setVoiceToast(`🔌 Disconnected from Voice Comms`);
    setTimeout(() => setVoiceToast(null), 3000);

    try {
      setRtdbVoiceParticipants(channelId, updatedParticipants).catch(() => {});
      await setDoc(doc(db, 'voiceComms', channelId), {
        channelId,
        participants: updatedParticipants,
        updatedAtMs: Date.now()
      });
    } catch (e) {
      console.warn('Error disconnecting voice comms Firestore:', e);
    }
  };

  const handleToggleMuteSelf = async () => {
    const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const currentUid = currentUser?.uid || currentUsername;

    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    playMuteClickSound(nextMuted);

    // If unmuting and stream is missing or permission pending/denied, attempt re-capture on user gesture
    if (!nextMuted && (!localStreamRef.current || micPermissionState !== 'granted')) {
      await startMicCaptureAndVAD(activeVoiceChannel || 'general');
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }

    if (activeVoiceChannel && isVoiceConnected) {
      const updated = (voiceRooms[activeVoiceChannel] || []).map(p => {
        if (p.username === currentUsername || p.userId === currentUid) {
          return { ...p, isMuted: nextMuted, isForceMuted: false, isSpeaking: false };
        }
        return p;
      });

      setVoiceRooms(prev => ({ ...prev, [activeVoiceChannel]: updated }));
      try {
        await setDoc(doc(db, 'voiceComms', activeVoiceChannel), {
          channelId: activeVoiceChannel,
          participants: updated,
          updatedAtMs: Date.now()
        });
      } catch (e) {
        console.warn('Error toggling mute in Firestore:', e);
      }
    }
  };

  const handleToggleDeafenSelf = async () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);
    playMuteClickSound(nextDeafened);

    Object.values(remoteAudioElementsRef.current).forEach(el => {
      el.muted = nextDeafened;
    });

    if (activeVoiceChannel && isVoiceConnected) {
      const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
      const updated = (voiceRooms[activeVoiceChannel] || []).map(p => {
        if (p.username === currentUsername || p.userId === (currentUser?.uid || currentUsername)) {
          return { ...p, isDeafened: nextDeafened, isMuted: nextDeafened ? true : p.isMuted };
        }
        return p;
      });

      setVoiceRooms(prev => ({ ...prev, [activeVoiceChannel]: updated }));
      try {
        await setDoc(doc(db, 'voiceComms', activeVoiceChannel), {
          channelId: activeVoiceChannel,
          participants: updated,
          updatedAtMs: Date.now()
        });
      } catch (e) {
        console.warn('Error toggling deafen in Firestore:', e);
      }
    }
  };

  const handleForceMuteParticipant = async (targetUsername: string, channelId: string) => {
    const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const channelParticipants = voiceRooms[channelId] || [];

    const updated = channelParticipants.map(p => {
      if (p.username === targetUsername) {
        const nextForceMute = !p.isForceMuted;
        return {
          ...p,
          isForceMuted: nextForceMute,
          isMuted: nextForceMute ? true : p.isMuted,
          isSpeaking: false,
          mutedByHost: nextForceMute ? currentUsername : undefined
        };
      }
      return p;
    });

    setVoiceRooms(prev => ({ ...prev, [channelId]: updated }));
    const targetWasForceMuted = updated.find(p => p.username === targetUsername)?.isForceMuted;
    setVoiceToast(targetWasForceMuted ? `🔇 Force-muted @${targetUsername}` : `🔊 Unmuted @${targetUsername}`);
    setTimeout(() => setVoiceToast(null), 3000);

    try {
      await setDoc(doc(db, 'voiceComms', channelId), {
        channelId,
        participants: updated,
        updatedAtMs: Date.now()
      });
    } catch (e) {
      console.warn('Error force muting participant in Firestore:', e);
    }
  };

  const handleKickParticipantFromVoice = async (targetUsername: string, channelId: string) => {
    const channelParticipants = voiceRooms[channelId] || [];
    const updated = channelParticipants.filter(p => p.username !== targetUsername);

    setVoiceRooms(prev => ({ ...prev, [channelId]: updated }));
    setVoiceToast(`🚫 Kicked @${targetUsername} from Voice Comms`);
    setTimeout(() => setVoiceToast(null), 3000);

    try {
      await setDoc(doc(db, 'voiceComms', channelId), {
        channelId,
        participants: updated,
        updatedAtMs: Date.now()
      });
    } catch (e) {
      console.warn('Error kicking participant from voice in Firestore:', e);
    }
  };

  const handleServerMuteAll = async (channelId: string) => {
    const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const channelParticipants = voiceRooms[channelId] || [];

    const updated = channelParticipants.map(p => {
      const isTargetStaff = p.userLevel === 'Admin' || p.userLevel === 'Staff' || p.username === currentUsername;
      if (isTargetStaff) return p;
      return {
        ...p,
        isForceMuted: true,
        isMuted: true,
        isSpeaking: false,
        mutedByHost: currentUsername
      };
    });

    setVoiceRooms(prev => ({ ...prev, [channelId]: updated }));
    setVoiceToast(`🔇 Server-Muted all participants in #${channelId}`);
    setTimeout(() => setVoiceToast(null), 3000);

    try {
      await setDoc(doc(db, 'voiceComms', channelId), {
        channelId,
        participants: updated,
        updatedAtMs: Date.now()
      });
    } catch (e) {
      console.warn('Error server muting all in Firestore:', e);
    }
  };

  const handleServerUnmuteAll = async (channelId: string) => {
    const channelParticipants = voiceRooms[channelId] || [];

    const updated = channelParticipants.map(p => ({
      ...p,
      isForceMuted: false,
      isMuted: false,
      mutedByHost: undefined
    }));

    setVoiceRooms(prev => ({ ...prev, [channelId]: updated }));
    setVoiceToast(`🔊 Server-Unmuted all participants in #${channelId}`);
    setTimeout(() => setVoiceToast(null), 3000);

    try {
      await setDoc(doc(db, 'voiceComms', channelId), {
        channelId,
        participants: updated,
        updatedAtMs: Date.now()
      });
    } catch (e) {
      console.warn('Error server unmuting all in Firestore:', e);
    }
  };

  // Go Live & Live Stream Engine state
  const [isLiveStreamOpen, setIsLiveStreamOpen] = useState<boolean>(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string>('tJbzMqJGH4k'); // Official GTA VI Video Embed
  const [streamInfo, setStreamInfo] = useState<{
    streamType: 'youtube' | 'twitch';
    streamId: string;
    streamerName?: string;
    title?: string;
    updatedAtMs?: number;
  }>({
    streamType: 'youtube',
    streamId: 'tJbzMqJGH4k',
    streamerName: 'Rockstar Games Official',
    title: 'GTA VI Official Broadcast'
  });
  const [customYoutubeInput, setCustomYoutubeInput] = useState<string>('');
  const [isGameOverlayMode, setIsGameOverlayMode] = useState<boolean>(false);
  const [showObsGuideModal, setShowObsGuideModal] = useState<boolean>(false);
  
  // Real-time Firestore user profile state (VIP, Admin, Staff & Account Status)
  const [isVipUser, setIsVipUser] = useState<boolean>(isVipActive);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(isAdmin);
  const [isStaffUser, setIsStaffUser] = useState<boolean>(isStaff);
  const [isAccountSuspended, setIsAccountSuspended] = useState<boolean>(false);

  // Real-Time Firestore Synchronization for Channel Live Streams
  useEffect(() => {
    if (!activeChannel) return;
    let unsub = () => {};
    try {
      unsub = onSnapshot(doc(db, 'liveStreams', activeChannel), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.streamId) {
            setStreamInfo({
              streamType: data.streamType || 'youtube',
              streamId: data.streamId,
              streamerName: data.streamerName || 'Vice City Streamer',
              title: data.title || `Live Stream in #${activeChannel}`,
              updatedAtMs: data.updatedAtMs
            });
            if (data.streamType === 'youtube') {
              setYoutubeVideoId(data.streamId);
            }
          }
        }
      });
    } catch (err) {
      console.warn('Live stream sync listener error:', err);
    }
    return () => unsub();
  }, [activeChannel]);

  // Input ref & mention state
  const inputRef = useRef<HTMLInputElement>(null);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIsVipUser(isVipActive);
    setIsAdminUser(isAdmin);
    setIsStaffUser(isStaff);
  }, [isVipActive, isAdmin, isStaff]);

  useEffect(() => {
    if (!currentUser) {
      setIsAccountSuspended(false);
      return;
    }

    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`/api/user/profile?uid=${encodeURIComponent(currentUser.uid)}`);
        if (res.ok) {
          const resJson = await res.json();
          const data = resJson?.data || resJson;
          if (data && isMounted) {
            setUserProfileData(data);
            const vip = data.isVip === true || data.vipStatus === true || data.role === 'VIP Member' || isVipActive;
            const adm = data.role === 'Admin' || data.isAdmin === true;
            const stf = adm || data.role === 'Staff' || data.isStaff === true;
            setIsVipUser(vip);
            setIsAdminUser(adm || isAdmin);
            setIsStaffUser(stf || isStaff);
            setIsAccountSuspended(data.status === 'Suspended');
          }
        }
      } catch (err) {
        console.debug('[CommunityChatTab] Profile sync notice:', err);
      }
    };

    fetchUserProfile();
    const intervalId = setInterval(fetchUserProfile, 12000);

    const handleProfileUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('gtavi_profile_updated', handleProfileUpdate);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('gtavi_profile_updated', handleProfileUpdate);
    };
  }, [currentUser, isVipActive, isAdmin, isStaff]);

  // Helper to synchronize custom VIP channel changes to MongoDB
  const syncChannelToMongo = useCallback(async (channelId: string, data: any, isDelete = false) => {
    try {
      if (isDelete) {
        await fetch(`/api/db/customChannels/${channelId}`, { method: 'DELETE' });
      } else {
        await fetch(`/api/db/customChannels/${channelId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: channelId, ...data })
        });
      }
    } catch (err) {
      console.warn('MongoDB channel sync notice:', err);
    }
  }, []);

  // Sync custom VIP channels with MongoDB & Realtime Database & auto-expire 24h deletion requests
  useEffect(() => {
    let unsubRtdbChannels: () => void = () => {};

    // 1. Fetch channels from MongoDB customChannels collection
    const fetchMongoChannels = async () => {
      try {
        const res = await fetch('/api/db/customChannels');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const activeMongoMap = new Map<string, any>();

            json.data.forEach((c: any) => {
              const id = c.id || c.docId || String(c._id);
              if (!c.isDeleted && !c.deleted && c.status !== 'Deleted') {
                activeMongoMap.set(id, c);
              }
            });

            setCustomChannels(prev => {
              const map = new Map<string, CustomChannel>();
              INITIAL_CUSTOM_CHANNELS.forEach(c => map.set(c.id, c));

              activeMongoMap.forEach((c: any, id: string) => {
                map.set(id, {
                  ...c,
                  id,
                  name: c.name || id,
                  members: Array.isArray(c.members) ? c.members : [],
                  pendingRequests: Array.isArray(c.pendingRequests) ? c.pendingRequests : [],
                  admins: Array.isArray(c.admins) ? c.admins : [],
                  bannedUsers: Array.isArray(c.bannedUsers) ? c.bannedUsers : []
                } as CustomChannel);
              });

              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        console.warn('MongoDB customChannels sync notice:', err);
      }
    };

    fetchMongoChannels();
    const mongoInterval = setInterval(fetchMongoChannels, 15000);

    // 2. Subscribe to Realtime Database custom channels
    try {
      unsubRtdbChannels = subscribeRtdbChannels((rtdbChannels) => {
        if (!Array.isArray(rtdbChannels)) return;
        setCustomChannels(prev => {
          const map = new Map<string, CustomChannel>();
          INITIAL_CUSTOM_CHANNELS.forEach(c => map.set(c.id, c));

          prev.forEach(c => {
            if (!c.id.startsWith('vip_')) {
              map.set(c.id, c);
            }
          });

          rtdbChannels.forEach(c => {
            if (c.isDeleted || c.deleted || (c as any).status === 'Deleted') {
              map.delete(c.id);
            } else {
              map.set(c.id, {
                ...c,
                members: Array.isArray(c.members) ? c.members : [],
                pendingRequests: Array.isArray(c.pendingRequests) ? c.pendingRequests : [],
                admins: Array.isArray(c.admins) ? c.admins : [],
                bannedUsers: Array.isArray(c.bannedUsers) ? c.bannedUsers : []
              } as CustomChannel);
            }
          });

          return Array.from(map.values());
        });
      });
    } catch (e) {
      console.warn('RTDB channels subscription warning:', e);
    }

    return () => {
      unsubRtdbChannels();
      clearInterval(mongoInterval);
    };
  }, []);

  // Reset activeChannel to general if currently active channel is deleted
  useEffect(() => {
    if (activeChannel.startsWith('hub_') || activeChannel.startsWith('custom-')) {
      const exists = customChannels.some(c => c.id === activeChannel);
      if (!exists) {
        setActiveChannel('general');
      }
    }
  }, [customChannels, activeChannel]);

  const DEFAULT_CHANNELS = ['general', 'tuning', 'heists', 'rp-servers'];

  // Auto-join/select custom channel if page opened with shareable ?channel=... or ?invite=...
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const paramChannel = searchParams.get('channel');
    const paramInvite = searchParams.get('invite');

    if (!paramChannel && !paramInvite) return;

    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';

    const match = customChannels.find(c => 
      (paramChannel && c.id === paramChannel) ||
      (paramInvite && c.inviteCode.toUpperCase() === paramInvite.toUpperCase())
    );

    if (match) {
      const membersList = match.members || [];
      const isMember = membersList.includes(activeUsername);
      const isBanned = (match.bannedUsers || []).includes(activeUsername);

      if (isBanned) return;

      if (!isMember) {
        const updatedMembers = Array.from(new Set([...membersList, activeUsername]));
        setCustomChannels(prev => prev.map(c => c.id === match.id ? { ...c, members: updatedMembers } : c));
        updateDoc(doc(db, 'customChannels', match.id), { members: updatedMembers }).catch(() => {});
        setReportSuccessToast(`🎉 Auto-joined #${match.name} via share link!`);
        setTimeout(() => setReportSuccessToast(null), 4000);
      }
      setActiveChannel(match.id);
    }
  }, [customChannels, currentUser]);

  // Join Channel by Invite Code or Share Link URL
  const handleJoinChannelByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = joinCodeInput.trim();
    if (!input) return;

    let targetCode = input;
    let targetChanId = input;

    if (input.includes('channel=') || input.includes('invite=')) {
      try {
        const urlObj = new URL(input.startsWith('http') ? input : `https://${input}`);
        const cParam = urlObj.searchParams.get('channel');
        const iParam = urlObj.searchParams.get('invite');
        if (cParam) targetChanId = cParam;
        if (iParam) targetCode = iParam;
      } catch {
        if (input.includes('channel=')) {
          targetChanId = input.split('channel=')[1]?.split('&')[0] || input;
        }
        if (input.includes('invite=')) {
          targetCode = input.split('invite=')[1]?.split('&')[0] || input;
        }
      }
    }

    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';

    const matchingChan = customChannels.find(c => 
      c.id.toLowerCase() === targetChanId.toLowerCase() ||
      c.inviteCode.toUpperCase() === targetCode.toUpperCase() ||
      c.name.toLowerCase() === targetChanId.toLowerCase().replace('#', '')
    );

    if (!matchingChan) {
      setReportSuccessToast('❌ Invalid invite code or channel link. Channel not found.');
      setTimeout(() => setReportSuccessToast(null), 4000);
      return;
    }

    const isBanned = (matchingChan.bannedUsers || []).includes(activeUsername);
    if (isBanned) {
      setReportSuccessToast(`🚫 You have been banned from #${matchingChan.name}.`);
      setTimeout(() => setReportSuccessToast(null), 4000);
      return;
    }

    const membersList = matchingChan.members || [];
    const isMember = membersList.includes(activeUsername);

    if (isMember) {
      setActiveChannel(matchingChan.id);
      setIsJoinChannelModalOpen(false);
      setJoinCodeInput('');
      setReportSuccessToast(`You are already a member of #${matchingChan.name}!`);
      setTimeout(() => setReportSuccessToast(null), 3000);
      return;
    }

    const updatedMembers = Array.from(new Set([...membersList, activeUsername]));
    setCustomChannels(prev => prev.map(c => c.id === matchingChan.id ? { ...c, members: updatedMembers } : c));
    
    try {
      await updateDoc(doc(db, 'customChannels', matchingChan.id), { members: updatedMembers });
    } catch (err) {
      console.warn('Error joining channel in Firestore:', err);
    }

    setActiveChannel(matchingChan.id);
    setIsJoinChannelModalOpen(false);
    setJoinCodeInput('');
    setReportSuccessToast(`🎉 Joined #${matchingChan.name}! Added to your joined channels.`);
    setTimeout(() => setReportSuccessToast(null), 4000);
  };

  const isModerator = isAdminUser || isStaffUser || isAdmin || isStaff;
  
  // Attachment state
  const [attachedItem, setAttachedItem] = useState<ChatAttachment | null>(null);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);
  const [viewingAttachment, setViewingAttachment] = useState<ChatAttachment | null>(null);

  // GTA-Themed Emoji Picker state
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);
  const [emojiCategory, setEmojiCategory] = useState<'gta' | 'reactions' | 'vehicles' | 'roles'>('gta');
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    if (isEmojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  const getGtaEmojiList = (category: 'gta' | 'reactions' | 'vehicles' | 'roles') => {
    switch (category) {
      case 'gta':
        return [
          { emoji: '🌴', name: 'Vice City Palm' },
          { emoji: '💰', name: 'Money Bag' },
          { emoji: '👑', name: 'Crown VIP' },
          { emoji: '💵', name: 'Dollar Cash' },
          { emoji: '🔫', name: 'Pistol' },
          { emoji: '💣', name: 'C4 Explosive' },
          { emoji: '🏎️', name: 'Supercar' },
          { emoji: '🏍️', name: 'Biker Chopper' },
          { emoji: '🚁', name: 'Attack Helicopter' },
          { emoji: '🚤', name: 'Speedboat' },
          { emoji: '🚔', name: 'Police Cruiser' },
          { emoji: '🚨', name: 'Siren' },
          { emoji: '🍹', name: 'Ocean Drive Cocktail' },
          { emoji: '🌅', name: 'Vice Sunset' },
          { emoji: '🕶️', name: 'Vice Squad Shades' },
          { emoji: '🎰', name: 'Malibu Casino' },
          { emoji: '🎲', name: 'Dice' },
          { emoji: '🏛️', name: 'Pacific Standard Bank' },
          { emoji: '💎', name: 'Diamond Loot' },
          { emoji: '🛥️', name: 'Luxury Yacht' },
          { emoji: '🚘', name: 'Getaway Car' },
        ];
      case 'reactions':
        return [
          { emoji: '🔥', name: 'Fire' },
          { emoji: '💯', name: '100 Percent' },
          { emoji: '⚡', name: 'Zap' },
          { emoji: '🚀', name: 'Rocket' },
          { emoji: '👍', name: 'Thumbs Up' },
          { emoji: '👎', name: 'Thumbs Down' },
          { emoji: '😂', name: 'Joy' },
          { emoji: '😎', name: 'Cool' },
          { emoji: '💀', name: 'Wasted Skull' },
          { emoji: '🤡', name: 'Clown' },
          { emoji: '👀', name: 'Spotted' },
          { emoji: '🎯', name: 'Bullseye' },
          { emoji: '🖤', name: 'Black Heart' },
          { emoji: '💖', name: 'Vice Pink Heart' },
          { emoji: '🤩', name: 'Star Struck' },
          { emoji: '🤯', name: 'Exploding Head' },
          { emoji: '🤫', name: 'Shh' },
          { emoji: '💩', name: 'Busted' },
        ];
      case 'vehicles':
        return [
          { emoji: '🏎️', name: 'Grotti Itali' },
          { emoji: '🚘', name: 'Vapid Bullet' },
          { emoji: '🏍️', name: 'Pegassi Bati' },
          { emoji: '🚁', name: 'Buzzard Attack' },
          { emoji: '🚤', name: 'Shitzu Squalo' },
          { emoji: '✈️', name: 'Cargo Plane' },
          { emoji: '⛽', name: 'Gasoline' },
          { emoji: '🛠️', name: 'LS Customs' },
          { emoji: '🔧', name: 'Custom Tuning' },
          { emoji: '🧯', name: 'Extinguisher' },
          { emoji: '🎯', name: 'Sniper' },
          { emoji: '🛡️', name: 'Kevlar Armor' },
          { emoji: '💣', name: 'Sticky Bomb' },
          { emoji: '🔫', name: 'AP Pistol' },
          { emoji: '🔪', name: 'Machete' },
          { emoji: '📦', name: 'Special Cargo' },
        ];
      case 'roles':
        return [
          { emoji: '👮', name: 'Vice City PD' },
          { emoji: '🕵️', name: 'Undercover FIB' },
          { emoji: '🥷', name: 'Heist Specialist' },
          { emoji: '🧑‍💼', name: 'Cartel Boss' },
          { emoji: '🧑‍🎤', name: 'Malibu DJ' },
          { emoji: '🧑‍🔧', name: 'Chop Shop Tech' },
          { emoji: '🤑', name: 'High Roller' },
          { emoji: '😈', name: 'Outlaw' },
          { emoji: '🤠', name: 'Bounty Hunter' },
          { emoji: '👑', name: 'VIP Godfather' },
          { emoji: '🦾', name: 'Enforcer' },
          { emoji: '🤝', name: 'Crew Deal' },
        ];
    }
  };

  // Attach modal browser state
  const [attachTab, setAttachTab] = useState<'vehicles' | 'weapons' | 'servers' | 'locations' | 'businesses' | 'giftcards' | 'custom'>('vehicles');
  const [attachSearch, setAttachSearch] = useState<string>('');

  // Giftcard attachment state
  const [claimingVoucherCode, setClaimingVoucherCode] = useState<string | null>(null);
  const [voucherClaimToast, setVoucherClaimToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [myPurchasedVouchersForChat, setMyPurchasedVouchersForChat] = useState<any[]>([]);
  const [isLoadingMyVouchersForChat, setIsLoadingMyVouchersForChat] = useState<boolean>(false);
  const [giftcardInputCode, setGiftcardInputCode] = useState<string>('');

  // Track redeemed vouchers in real-time to expire them in chat instantly across all clients
  const [redeemedVouchersMap, setRedeemedVouchersMap] = useState<Record<string, { isRedeemed: boolean; redeemedByUsername?: string }>>({});

  useEffect(() => {
    const giftCardsQuery = query(collection(db, 'giftCards'), limit(10));
    const unsub = onSnapshot(giftCardsQuery, (snapshot) => {
      const map: Record<string, { isRedeemed: boolean; redeemedByUsername?: string }> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.isRedeemed) {
          const codeKey = (data.code || d.id || '').toUpperCase();
          if (codeKey) {
            map[codeKey] = {
              isRedeemed: true,
              redeemedByUsername: data.redeemedByUsername || 'a player'
            };
          }
        }
      });
      setRedeemedVouchersMap(map);
    }, (err) => {
      console.warn('Realtime giftCards listener notice:', err);
    });
    return () => unsub();
  }, []);

  // Fetch user's purchased vouchers when opening attach modal on giftcards tab
  useEffect(() => {
    if (isAttachModalOpen && attachTab === 'giftcards' && currentUser?.uid) {
      setIsLoadingMyVouchersForChat(true);
      const giftCardsRef = collection(db, 'giftCards');
      const q = query(giftCardsRef, where('createdByUid', '==', currentUser.uid));
      getDocs(q).then((querySnap) => {
        const list: any[] = [];
        querySnap.forEach((d) => {
          list.push(d.data());
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMyPurchasedVouchersForChat(list);
        setIsLoadingMyVouchersForChat(false);
      }).catch(err => {
        console.error('Error fetching vouchers for chat:', err);
        setIsLoadingMyVouchersForChat(false);
      });
    }
  }, [isAttachModalOpen, attachTab, currentUser]);

  // Handle claiming gift card voucher directly from chat message
  const handleClaimChatVoucher = async (code: string, messageId?: string) => {
    if (!isAuthenticated || !currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const rawCode = code.trim().toUpperCase();
    const targetCode = rawCode.includes('/') ? rawCode.split('/').pop()!.trim() : rawCode;
    if (!targetCode) return;

    setClaimingVoucherCode(targetCode);
    try {
      const giftCardDocRef = doc(db, 'giftCards', targetCode);
      const cardSnap = await getDoc(giftCardDocRef);

      if (!cardSnap.exists()) {
        setVoucherClaimToast({
          type: 'error',
          message: `Voucher key "${targetCode}" is invalid or expired.`
        });
        setTimeout(() => setVoucherClaimToast(null), 4000);
        return;
      }

      const cardData = cardSnap.data() as any;
      if (cardData.isRedeemed) {
        setVoucherClaimToast({
          type: 'error',
          message: `This voucher code was already claimed by ${cardData.redeemedByUsername || 'another player'}.`
        });
        setTimeout(() => setVoucherClaimToast(null), 4000);
        return;
      }

      const rewardVc = cardData.cashValue || getVipVcGrantedNumber();
      const rewardVipDays = cardData.vipDaysGranted || 0;
      const redeemerName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Gamer';

      // 1. Mark voucher as redeemed
      await setDoc(
        giftCardDocRef,
        {
          isRedeemed: true,
          redeemedByUid: currentUser.uid,
          redeemedByUsername: redeemerName,
          redeemedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // 2. Also update chat message doc if messageId is known
      if (messageId) {
        try {
          const msgRef = doc(db, 'chatMessages', messageId);
          await updateDoc(msgRef, {
            'attachment.isClaimed': true,
            'attachment.claimedBy': redeemerName
          });
        } catch (e) {
          console.warn('Notice updating chat message attachment state:', e);
        }
      }

      // 2. Fetch current user profile from MongoDB to update balance
      let currentVc = 0;
      let claimedArr: string[] = [];
      let logsArr: any[] = [];
      let currentVipUntil = Date.now();

      try {
        const resProf = await fetch(`/api/user/profile?uid=${encodeURIComponent(currentUser.uid)}`);
        if (resProf.ok) {
          const resJson = await resProf.json();
          const uData = resJson?.data || resJson;
          if (uData) {
            currentVc = typeof uData.vcBalance === 'number' ? uData.vcBalance : (uData.credits || 0);
            claimedArr = Array.isArray(uData.claimedVouchers) ? uData.claimedVouchers : [];
            logsArr = Array.isArray(uData.voucherLogs) ? uData.voucherLogs : [];
            currentVipUntil = uData.vipUntil || Date.now();
          }
        }
      } catch (e) {
        console.warn('Profile read warning for voucher claim:', e);
      }

      const newVcBalance = currentVc + rewardVc;
      const updatedClaimed = [...claimedArr, targetCode];
      const newLogItem = {
        code: targetCode,
        name: `${cardData.tier || 'Shark Card'} (${rewardVc.toLocaleString('en-US')} VC)`,
        vcAmount: rewardVc,
        vipDays: rewardVipDays,
        timestamp: new Date().toISOString()
      };
      const updatedLogs = [newLogItem, ...logsArr];

      const updatePayload: any = {
        vcBalance: newVcBalance,
        claimedVouchers: updatedClaimed,
        voucherLogs: updatedLogs,
        updatedAt: new Date().toISOString()
      };

      if (rewardVipDays > 0) {
        const now = Date.now();
        const newVipUntil = Math.max(now, currentVipUntil) + (rewardVipDays * 24 * 60 * 60 * 1000);
        updatePayload.isVip = true;
        updatePayload.vipUntil = newVipUntil;
      }

      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          ...updatePayload
        })
      });

      window.dispatchEvent(new CustomEvent('gtavi_profile_updated'));

      setVoucherClaimToast({
        type: 'success',
        message: `🎉 Success! +${rewardVc.toLocaleString('en-US')} VC added to your balance!`
      });
      setTimeout(() => setVoucherClaimToast(null), 5000);
    } catch (err) {
      console.error('Error claiming chat voucher:', err);
      setVoucherClaimToast({
        type: 'error',
        message: 'Failed to claim voucher. Network error.'
      });
      setTimeout(() => setVoucherClaimToast(null), 4000);
    } finally {
      setClaimingVoucherCode(null);
    }
  };

  // Custom attachment fields
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDetail, setCustomDetail] = useState<string>('');
  const [customBadge, setCustomBadge] = useState<string>('Custom Spec');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');

  // Interactive toasts and inspect vehicle modal
  const [copySuccessToast, setCopySuccessToast] = useState<string | null>(null);
  const [inspectingVehicleModal, setInspectingVehicleModal] = useState<any | null>(null);

  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});

  // Track message IDs created in this browser session or stored locally
  const [mySentMessageIds, setMySentMessageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gta6_my_chat_msg_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom modal state for delete confirmation (avoids window.confirm iframe issues)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    messageId: string;
    authorName: string;
    isOwn: boolean;
  } | null>(null);

  // Safety & Moderation modal states
  const [externalLinkModalTarget, setExternalLinkModalTarget] = useState<DomainSafetyInfo | null>(null);
  const [reportModalTarget, setReportModalTarget] = useState<{
    messageId: string;
    authorName: string;
    text: string;
    channelId?: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState<string>('adult');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
  const [reportSuccessToast, setReportSuccessToast] = useState<string | null>(null);
  const [contentValidationError, setContentValidationError] = useState<string | null>(null);

  // VIP Lock Modal state
  const [vipLockModalTarget, setVipLockModalTarget] = useState<{
    type: 'attachment' | 'reaction';
    title: string;
    message: string;
  } | null>(null);
  const [isUpgradingVip, setIsUpgradingVip] = useState<boolean>(false);

  // Handle VIP Custom Channel Creation
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!isVipUser && !isModerator) {
      setVipLockModalTarget({
        type: 'attachment',
        title: '🔒 Private Communities Reserved for VIP Members',
        message: 'Creating custom public or private channels with shareable invite links is an exclusive VIP Member perk.'
      });
      return;
    }

    if (!newChannelForm.name.trim()) {
      setContentValidationError('Channel name cannot be empty.');
      return;
    }

    const formattedName = newChannelForm.name.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-');
    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const activeAvatar = currentUser?.photoURL || GTA6_AVATARS[1].url;

    const newChan: CustomChannel = {
      id: `hub_${Date.now()}`,
      name: formattedName,
      description: newChannelForm.description.trim() || 'Exclusive Vice City community hub.',
      isPrivate: newChannelForm.isPrivate,
      creatorId: currentUser?.uid || `usr_${Date.now()}`,
      creatorName: activeUsername,
      creatorAvatar: activeAvatar,
      inviteCode: `HUB-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      members: [activeUsername],
      pendingRequests: []
    };

    try {
      await setDoc(doc(db, 'customChannels', newChan.id), newChan);
    } catch (err) {
      console.warn('Firestore channel creation fallback:', err);
    }
    saveRtdbChannel(newChan).catch(err => console.warn('RTDB channel creation notice:', err));
    syncChannelToMongo(newChan.id, newChan);

    setCustomChannels(prev => {
      const map = new Map<string, CustomChannel>();
      prev.forEach(c => map.set(c.id, c));
      map.set(newChan.id, newChan);
      return Array.from(map.values());
    });
    setActiveChannel(newChan.id);
    setIsCreateChannelModalOpen(false);
    setNewChannelForm({ name: '', description: '', isPrivate: true });
    setReportSuccessToast(`🎉 Created custom hub #${newChan.name}! Share code: ${newChan.inviteCode}`);
    setTimeout(() => setReportSuccessToast(null), 5000);
  };

  // Join or Request Private Access to Custom Hub
  const handleJoinOrRequestAccess = async (channel: CustomChannel) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const activeAvatar = currentUser?.photoURL || GTA6_AVATARS[0].url;

    const currentMembers = channel.members || [];
    const currentRequests = channel.pendingRequests || [];
    const currentBanned = channel.bannedUsers || [];

    if (currentBanned.includes(activeUsername)) {
      setReportSuccessToast(`🚫 You have been banned from joining #${channel.name} by the hub creator.`);
      setTimeout(() => setReportSuccessToast(null), 4000);
      return;
    }

    if (currentMembers.includes(activeUsername)) return;

    if (channel.isPrivate) {
      // Check if already requested
      if (currentRequests.some(r => r.username === activeUsername)) {
        setReportSuccessToast('⏳ Access request already sent to VIP creator for review.');
        setTimeout(() => setReportSuccessToast(null), 4000);
        return;
      }

      const updatedRequests = [
        ...currentRequests,
        {
          userId: currentUser?.uid || `usr_${Date.now()}`,
          username: activeUsername,
          avatar: activeAvatar,
          requestedAt: 'Just now'
        }
      ];

      setCustomChannels(prev => prev.map(c => c.id === channel.id ? { ...c, pendingRequests: updatedRequests } : c));
      syncChannelToMongo(channel.id, { pendingRequests: updatedRequests });

      await safeFirestoreWrite(async () => {
        const chanRef = doc(db, 'customChannels', channel.id);
        await updateDoc(chanRef, { pendingRequests: updatedRequests });

        // Dispatch notification directly to channel creator's profile notification queue
        await addDoc(collection(db, 'userNotifications'), {
          targetUsername: channel.creatorName,
          targetUserId: channel.creatorId || '',
          type: 'channel_join_request',
          title: `🔑 Join Request for #${channel.name}`,
          message: `@${activeUsername} requested permission to join your private VIP channel #${channel.name}.`,
          timestamp: new Date().toISOString(),
          read: false,
          targetTab: 'chat',
          metadata: {
            channelId: channel.id,
            channelName: channel.name,
            requesterId: currentUser?.uid || `usr_${Date.now()}`,
            requesterName: activeUsername,
            requesterAvatar: activeAvatar,
            status: 'pending'
          }
        });
      });

      setReportSuccessToast('📩 Access Request sent to VIP Hub creator for approval!');
      setTimeout(() => setReportSuccessToast(null), 4000);
    } else {
      // Public Hub: Instant Join
      const updatedMembers = [...currentMembers, activeUsername];
      setCustomChannels(prev => prev.map(c => c.id === channel.id ? { ...c, members: updatedMembers } : c));
      syncChannelToMongo(channel.id, { members: updatedMembers });

      try {
        const chanRef = doc(db, 'customChannels', channel.id);
        await updateDoc(chanRef, { members: updatedMembers });
      } catch (e) {
        console.warn('Firestore join update warning:', e);
      }

      setReportSuccessToast(`✅ Joined public hub #${channel.name}!`);
      setTimeout(() => setReportSuccessToast(null), 4000);
    }
  };

  // Leave Channel (for members who are not creator)
  const handleLeaveChannel = async (channelId: string) => {
    if (DEFAULT_CHANNELS.includes(channelId)) {
      setReportSuccessToast('🔒 Default community channels cannot be left. Everyone stays in default channels!');
      setTimeout(() => setReportSuccessToast(null), 4000);
      return;
    }

    const channel = customChannels.find(c => c.id === channelId);
    if (!channel) return;

    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';

    if (channel.creatorName === activeUsername || (currentUser?.uid && channel.creatorId === currentUser.uid)) {
      setReportSuccessToast('⚠️ Channel Creators cannot leave their own channel. Request staff deletion in Channel Settings if needed.');
      setTimeout(() => setReportSuccessToast(null), 4000);
      return;
    }

    const updatedMembers = (channel.members || []).filter(m => m !== activeUsername);
    setCustomChannels(prev => prev.map(c => c.id === channelId ? { ...c, members: updatedMembers } : c));
    syncChannelToMongo(channelId, { members: updatedMembers });

    try {
      const chanRef = doc(db, 'customChannels', channelId);
      await updateDoc(chanRef, { members: updatedMembers });
    } catch (e) {
      console.warn('Firestore leave channel warning:', e);
    }

    if (activeChannel === channelId) {
      setActiveChannel('general');
    }

    setReportSuccessToast(`Left channel #${channel.name}`);
    setTimeout(() => setReportSuccessToast(null), 3000);
  };

  // Creator Approves Join Request
  const handleApproveJoinRequest = async (channelId: string, reqUsername: string) => {
    const channel = customChannels.find(c => c.id === channelId);
    if (!channel) return;

    const updatedMembers = Array.from(new Set([...(channel.members || []), reqUsername]));
    const updatedRequests = (channel.pendingRequests || []).filter(r => r.username !== reqUsername);

    setCustomChannels(prev => prev.map(c => c.id === channelId ? { ...c, members: updatedMembers, pendingRequests: updatedRequests } : c));
    if (managingChannel?.id === channelId) {
      setManagingChannel(prev => prev ? { ...prev, members: updatedMembers, pendingRequests: updatedRequests } : null);
    }
    syncChannelToMongo(channelId, { members: updatedMembers, pendingRequests: updatedRequests });

    try {
      const chanRef = doc(db, 'customChannels', channelId);
      await updateDoc(chanRef, { members: updatedMembers, pendingRequests: updatedRequests });
    } catch (e) {
      console.warn('Firestore approve request warning:', e);
    }

    setReportSuccessToast(`Approved @${reqUsername} to join #${channel.name}!`);
    setTimeout(() => setReportSuccessToast(null), 3000);
  };

  // Creator Declines Join Request
  const handleDeclineJoinRequest = async (channelId: string, reqUsername: string) => {
    const channel = customChannels.find(c => c.id === channelId);
    if (!channel) return;

    const updatedRequests = channel.pendingRequests.filter(r => r.username !== reqUsername);

    setCustomChannels(prev => prev.map(c => c.id === channelId ? { ...c, pendingRequests: updatedRequests } : c));
    if (managingChannel?.id === channelId) {
      setManagingChannel(prev => prev ? { ...prev, pendingRequests: updatedRequests } : null);
    }
    syncChannelToMongo(channelId, { pendingRequests: updatedRequests });

    try {
      const chanRef = doc(db, 'customChannels', channelId);
      await updateDoc(chanRef, { pendingRequests: updatedRequests });
    } catch (e) {
      console.warn('Firestore decline request warning:', e);
    }
  };

  // Creator / Moderator Kicks Member from Custom Channel
  const handleKickMember = async (channelId: string, memberUsername: string) => {
    const channel = customChannels.find(c => c.id === channelId);
    if (!channel) return;

    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const canModerate = channel.creatorName === activeUsername ||
                        (currentUser?.uid && channel.creatorId === currentUser.uid) ||
                        isModerator;

    if (!canModerate) {
      setReportSuccessToast('🚫 Only channel creator or staff can kick members.');
      setTimeout(() => setReportSuccessToast(null), 3000);
      return;
    }

    if (memberUsername === channel.creatorName) {
      setReportSuccessToast('⚠️ Cannot kick the channel creator.');
      setTimeout(() => setReportSuccessToast(null), 3000);
      return;
    }

    const updatedMembers = (channel.members || []).filter(m => m !== memberUsername);

    setCustomChannels(prev => prev.map(c => c.id === channelId ? { ...c, members: updatedMembers } : c));
    if (managingChannel?.id === channelId) {
      setManagingChannel(prev => prev ? { ...prev, members: updatedMembers } : null);
    }
    syncChannelToMongo(channelId, { members: updatedMembers });

    try {
      const chanRef = doc(db, 'customChannels', channelId);
      await updateDoc(chanRef, { members: updatedMembers });
    } catch (e) {
      console.warn('Firestore kick member warning:', e);
    }

    setReportSuccessToast(`👢 Kicked @${memberUsername} from #${channel.name}`);
    setTimeout(() => setReportSuccessToast(null), 3000);
  };

  // Creator / Moderator Bans Member from Custom Channel
  const handleBanMember = async (channelId: string, memberUsername: string) => {
    const channel = customChannels.find(c => c.id === channelId);
    if (!channel) return;

    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const canModerate = channel.creatorName === activeUsername ||
                        (currentUser?.uid && channel.creatorId === currentUser.uid) ||
                        isModerator;

    if (!canModerate) {
      setReportSuccessToast('🚫 Only channel creator or staff can ban members.');
      setTimeout(() => setReportSuccessToast(null), 3000);
      return;
    }

    if (memberUsername === channel.creatorName) {
      setReportSuccessToast('⚠️ Cannot ban the channel creator.');
      setTimeout(() => setReportSuccessToast(null), 3000);
      return;
    }

    const updatedMembers = (channel.members || []).filter(m => m !== memberUsername);
    const currentBanned = channel.bannedUsers || [];
    const updatedBanned = Array.from(new Set([...currentBanned, memberUsername]));

    setCustomChannels(prev => prev.map(c => c.id === channelId ? { ...c, members: updatedMembers, bannedUsers: updatedBanned } : c));
    if (managingChannel?.id === channelId) {
      setManagingChannel(prev => prev ? { ...prev, members: updatedMembers, bannedUsers: updatedBanned } : null);
    }
    syncChannelToMongo(channelId, { members: updatedMembers, bannedUsers: updatedBanned });

    try {
      const chanRef = doc(db, 'customChannels', channelId);
      await updateDoc(chanRef, { members: updatedMembers, bannedUsers: updatedBanned });
    } catch (e) {
      console.warn('Firestore ban member warning:', e);
    }

    setReportSuccessToast(`🔨 Banned @${memberUsername} from #${channel.name}`);
    setTimeout(() => setReportSuccessToast(null), 3000);
  };

  // Creator / Moderator Unbans Member from Custom Channel
  const handleUnbanMember = async (channelId: string, memberUsername: string) => {
    const channel = customChannels.find(c => c.id === channelId);
    if (!channel) return;

    const updatedBanned = (channel.bannedUsers || []).filter(m => m !== memberUsername);

    setCustomChannels(prev => prev.map(c => c.id === channelId ? { ...c, bannedUsers: updatedBanned } : c));
    if (managingChannel?.id === channelId) {
      setManagingChannel(prev => prev ? { ...prev, bannedUsers: updatedBanned } : null);
    }
    syncChannelToMongo(channelId, { bannedUsers: updatedBanned });

    try {
      const chanRef = doc(db, 'customChannels', channelId);
      await updateDoc(chanRef, { bannedUsers: updatedBanned });
    } catch (e) {
      console.warn('Firestore unban member warning:', e);
    }

    setReportSuccessToast(`✅ Unbanned @${memberUsername} in #${channel.name}`);
    setTimeout(() => setReportSuccessToast(null), 3000);
  };

  // Creator Requests Staff Deletion (Only Staff can permanently delete)
  const handleRequestStaffDeletion = async (channel: CustomChannel) => {
    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const nowMs = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    // Check if an active, non-expired request already exists (< 24 hours)
    if (channel.deletionRequested && channel.deletionRequestedAtMs) {
      const elapsed = nowMs - channel.deletionRequestedAtMs;
      if (elapsed < TWENTY_FOUR_HOURS_MS) {
        const hoursLeft = Math.ceil((TWENTY_FOUR_HOURS_MS - elapsed) / (1000 * 60 * 60));
        setReportSuccessToast(`⏳ Deletion request already pending staff review! Request expires in ~${hoursLeft}h if not approved.`);
        setTimeout(() => setReportSuccessToast(null), 4000);
        return;
      }
    }

    const approvalId = `pending_deletion_${channel.id}_${Date.now()}`;
    const deletionPayload = {
      id: approvalId,
      type: 'channel_deletion_request',
      title: `Request Channel Deletion: #${channel.name}`,
      submittedBy: activeUsername,
      submittedAt: 'Just now',
      detail: `Creator @${activeUsername} requested permanent deletion of VIP hub "${channel.name}" (${channel.description}).`,
      channelId: channel.id,
      requestedAtMs: nowMs,
      createdAt: new Date().toISOString()
    };

    await safeFirestoreWrite(async () => {
      await setDoc(doc(db, 'pendingApprovals', approvalId), {
        ...deletionPayload,
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, 'customChannels', channel.id), {
        deletionRequested: true,
        deletionRequestedAtMs: nowMs
      }, { merge: true });
    });

    try {
      await fetch(`/api/admin/cms/pendingApprovals/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deletionPayload)
      });
    } catch (err) {
      console.warn('REST API channel deletion report submit error:', err);
    }

    setCustomChannels(prev => prev.map(c => c.id === channel.id ? { ...c, deletionRequested: true, deletionRequestedAtMs: nowMs } : c));
    if (managingChannel?.id === channel.id) {
      setManagingChannel(prev => prev ? { ...prev, deletionRequested: true, deletionRequestedAtMs: nowMs } : null);
    }
    syncChannelToMongo(channel.id, { deletionRequested: true, deletionRequestedAtMs: nowMs });

    setReportSuccessToast('⚠️ Deletion request submitted to Staff! Request will expire after 24 hours if not approved.');
    setTimeout(() => setReportSuccessToast(null), 5000);
  };

  // Immediate Direct Channel Deletion (Staff / Admin / Hub Creator Action)
  const handleDirectDeleteChannel = async (channel: CustomChannel) => {
    try {
      await safeFirestoreWrite(async () => {
        await deleteDoc(doc(db, 'customChannels', channel.id));
      });
    } catch (e) {
      console.warn('Firestore channel delete notice:', e);
    }

    try {
      await Promise.allSettled([
        fetch(`/api/db/customChannels/${channel.id}`, { method: 'DELETE' }),
        fetch(`/api/admin/cms/customChannels/${channel.id}`, { method: 'DELETE' })
      ]);
    } catch (e) {
      console.warn('REST API channel delete notice:', e);
    }

    deleteRtdbChannel(channel.id).catch(e => console.warn('RTDB channel delete notice:', e));

    setCustomChannels(prev => prev.filter(c => c.id !== channel.id));
    if (activeChannel === channel.id) {
      setActiveChannel('general');
    }
    setManagingChannel(null);

    setReportSuccessToast(`🗑️ Custom Hub #${channel.name} permanently deleted!`);
    setTimeout(() => setReportSuccessToast(null), 4000);
  };

  // Copy Channel Shareable Invite Link
  const handleCopyShareLink = async (channel: CustomChannel) => {
    const shareUrl = `https://${window.location.host}/chat?channel=${channel.id}&invite=${channel.inviteCode}`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 3000);
    } else {
      setReportSuccessToast(`Invite Code: ${channel.inviteCode}`);
      setTimeout(() => setReportSuccessToast(null), 3000);
    }
  };

  // Check Go Live and HUD Overlay permissions for current user in a channel
  const checkLiveAndHudPermission = (channelId: string): { allowed: boolean; message: string } => {
    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';

    // 1. General channel -> Disabled for L1, L2, L3 users (only L4 Admin allowed)
    if (channelId === 'general') {
      if (isAdminUser) {
        return { allowed: true, message: '' };
      }
      return {
        allowed: false,
        message: '🔒 Permission Denied: Go Live and HUD Overlay in #general is restricted to Admin broadcasts.'
      };
    }

    // 2. Rest 3 default channels ('tuning', 'heists', 'rp-servers') -> Disabled for L1 and L2 users (L3 Staff & L4 Admin allowed)
    if (['tuning', 'heists', 'rp-servers'].includes(channelId)) {
      if (isAdminUser || isStaffUser) {
        return { allowed: true, message: '' };
      }
      return {
        allowed: false,
        message: '🔒 Permission Denied: Go Live and HUD Overlay in default channels is restricted to Staff & Admins.'
      };
    }

    // 3. Custom channels -> Only Channel Owners (Creators), Channel Admins, or Global Admins allowed
    const customChan = customChannels.find(c => c.id === channelId);
    if (customChan) {
      const isOwner = customChan.creatorName === activeUsername || (currentUser?.uid && customChan.creatorId === currentUser.uid);
      const isChanAdmin = (customChan.admins || []).includes(activeUsername) || (currentUser?.uid && (customChan.admins || []).includes(currentUser.uid));
      
      if (isOwner || isChanAdmin || isAdminUser) {
        return { allowed: true, message: '' };
      }
      return {
        allowed: false,
        message: `🔒 Permission Denied: Go Live and HUD Overlay in #${customChan.name} is reserved for Channel Owners and Channel Admins.`
      };
    }

    return { allowed: false, message: '🔒 Permission Denied: You do not have permission to use Go Live or HUD Overlay.' };
  };

  // Toggle Admin powers for a member in a custom channel
  const handleToggleAdminPower = async (channelId: string, targetUsername: string) => {
    const channel = customChannels.find(c => c.id === channelId);
    if (!channel) return;

    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const isCreator = channel.creatorName === activeUsername || (currentUser?.uid && channel.creatorId === currentUser.uid);
    const isChanAdmin = (channel.admins || []).includes(activeUsername) || (currentUser?.uid && (channel.admins || []).includes(currentUser.uid));
    const canManageAdmins = isCreator || isChanAdmin || isAdminUser;

    if (!canManageAdmins) {
      setReportSuccessToast('🚫 Only Channel Owners or Channel Admins can grant or revoke admin powers.');
      setTimeout(() => setReportSuccessToast(null), 3000);
      return;
    }

    if (targetUsername === channel.creatorName) {
      setReportSuccessToast('⚠️ Channel Owner already possesses full creator admin powers.');
      setTimeout(() => setReportSuccessToast(null), 3000);
      return;
    }

    const currentAdmins = channel.admins || [];
    const isAlreadyAdmin = currentAdmins.includes(targetUsername);

    const updatedAdmins = isAlreadyAdmin
      ? currentAdmins.filter(u => u !== targetUsername)
      : [...currentAdmins, targetUsername];

    setCustomChannels(prev => prev.map(c => c.id === channelId ? { ...c, admins: updatedAdmins } : c));
    if (managingChannel?.id === channelId) {
      setManagingChannel(prev => prev ? { ...prev, admins: updatedAdmins } : null);
    }
    syncChannelToMongo(channelId, { admins: updatedAdmins });

    try {
      const chanRef = doc(db, 'customChannels', channelId);
      await updateDoc(chanRef, { admins: updatedAdmins });
    } catch (e) {
      console.warn('Firestore toggle admin power warning:', e);
    }

    if (isAlreadyAdmin) {
      setReportSuccessToast(`🛡️ Revoked Channel Admin powers from @${targetUsername}.`);
    } else {
      setReportSuccessToast(`👑 Granted Channel Admin powers to @${targetUsername}!`);
    }
    setTimeout(() => setReportSuccessToast(null), 3500);
  };

  // Automatically disable live stream or HUD overlay if active channel changes to an unauthorized channel
  useEffect(() => {
    const perm = checkLiveAndHudPermission(activeChannel);
    if (!perm.allowed) {
      if (isLiveStreamOpen) {
        setIsLiveStreamOpen(false);
        setReportSuccessToast(`🔴 Go Live disabled in #${activeChannel} (requires higher channel clearance).`);
        setTimeout(() => setReportSuccessToast(null), 4000);
      }
      if (isGameOverlayMode) {
        setIsGameOverlayMode(false);
      }
    }
  }, [activeChannel, customChannels, isAdminUser, isStaffUser, currentUser]);

  // Go Live Engine: Set channel live stream feed and sync via Firestore
  const handleSetChannelStream = async (inputUrlOrId: string, titleHint?: string, isFormSubmit: boolean = false) => {
    if (!inputUrlOrId.trim()) return;

    const perm = checkLiveAndHudPermission(activeChannel);
    if (!perm.allowed) {
      setReportSuccessToast(perm.message);
      setTimeout(() => setReportSuccessToast(null), 4000);
      return;
    }

    let parsedType: 'youtube' | 'twitch' = 'youtube';
    let parsedId = inputUrlOrId.trim();

    if (parsedId.includes('twitch.tv/')) {
      parsedType = 'twitch';
      parsedId = parsedId.split('twitch.tv/')[1]?.split('/')[0]?.split('?')[0] || parsedId;
    } else if (parsedId.startsWith('twitch:')) {
      parsedType = 'twitch';
      parsedId = parsedId.replace('twitch:', '').trim();
    } else {
      parsedType = 'youtube';
      if (parsedId.includes('v=')) {
        parsedId = parsedId.split('v=')[1]?.split('&')[0] || parsedId;
      } else if (parsedId.includes('youtu.be/')) {
        parsedId = parsedId.split('youtu.be/')[1]?.split('?')[0] || parsedId;
      }
    }

    const activeUserTag = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const streamTitle = titleHint || (parsedType === 'twitch' ? `Twitch Channel: ${parsedId}` : `YouTube Broadcast (${parsedId})`);

    // Update local state immediately
    setStreamInfo({
      streamType: parsedType,
      streamId: parsedId,
      streamerName: activeUserTag,
      title: streamTitle,
      updatedAtMs: Date.now()
    });
    if (parsedType === 'youtube') {
      setYoutubeVideoId(parsedId);
    }
    setIsLiveStreamOpen(true);
    setCustomYoutubeInput('');

    setReportSuccessToast(`🔴 Live Stream Feed Connected (${parsedType.toUpperCase()})!`);
    setTimeout(() => setReportSuccessToast(null), 3000);

    // Sync to Firestore for all users in active channel
    try {
      await setDoc(doc(db, 'liveStreams', activeChannel), {
        channelId: activeChannel,
        streamType: parsedType,
        streamId: parsedId,
        streamerName: activeUserTag,
        title: streamTitle,
        updatedAtMs: Date.now()
      });

      // Send live stream broadcast announcement to channel chat
      const activeUserAvatar = (currentUser as any)?.photoURL || DEFAULT_GTA6_AVATAR;
      const broadcastMsg: ChatMessage = {
        id: `msg_stream_${Date.now()}`,
        user: activeUserTag,
        avatar: activeUserAvatar,
        channel: activeChannel as any,
        content: `🔴 **[GO LIVE BROADCAST]** Updated the channel live stream feed in **#${activeChannel}**: ${streamTitle}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isVip: isVipUser,
        isMod: isStaffUser,
        isAdmin: isAdminUser,
        userLevel: isAdminUser ? 'Admin' : isStaffUser ? 'Staff' : isVipUser ? 'VIP' : 'Member',
        reactions: {}
      };
      await setDoc(doc(db, 'chatMessages', broadcastMsg.id), broadcastMsg);
    } catch (err) {
      console.warn('Error saving live stream doc to Firestore:', err);
    }
  };

  const handleApplyCustomYoutubeStream = (e: React.FormEvent) => {
    e.preventDefault();
    handleSetChannelStream(customYoutubeInput, undefined, true);
  };

  const handleUpgradeToVip = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setIsUpgradingVip(true);
    if (currentUser?.uid) {
      try {
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: currentUser.uid,
            isVip: true,
            role: 'VIP Member',
            updatedAt: new Date().toISOString()
          })
        });
        window.dispatchEvent(new CustomEvent('gtavi_profile_updated'));
        setIsVipUser(true);
        setVipLockModalTarget(null);
        setReportSuccessToast('👑 Welcome to VIP! Your account now has VIP Member perks unlocked.');
        setTimeout(() => setReportSuccessToast(null), 5000);
      } catch (e) {
        console.warn('VIP upgrade error:', e);
        setIsVipUser(true);
        setVipLockModalTarget(null);
        setReportSuccessToast('👑 Welcome to VIP! Your account now has VIP Member perks unlocked.');
        setTimeout(() => setReportSuccessToast(null), 5000);
      }
    } else {
      setIsVipUser(true);
      setVipLockModalTarget(null);
      setReportSuccessToast('👑 Welcome to VIP! Your account now has VIP Member perks unlocked.');
      setTimeout(() => setReportSuccessToast(null), 5000);
    }
    setIsUpgradingVip(false);
  };

  const handleOpenAttachModal = () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!isVipUser && !isModerator) {
      setVipLockModalTarget({
        type: 'attachment',
        title: '🔒 Attachments Reserved for VIP Members',
        message: 'Community members can view attachments, but attaching custom vehicle specs, RP server links, or weapon loadouts requires VIP Member status.'
      });
      return;
    }

    setIsAttachModalOpen(true);
  };

  // Scroll & Down Arrow button states
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);
  const [showScrollDownBtn, setShowScrollDownBtn] = useState<boolean>(false);
  const [newMessagesCount, setNewMessagesCount] = useState<number>(0);
  const prevMessagesCountRef = useRef<number>(INITIAL_MESSAGES.length);

  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
    setShowScrollDownBtn(false);
    setNewMessagesCount(0);
    isUserScrolledUpRef.current = false;

    // Mark as read when scrolling to bottom
    const channelMsgs = messages.filter(m => m.channel === activeChannel);
    if (channelMsgs.length > 0) {
      const sorted = [...channelMsgs].sort((a, b) => {
        const dateA = parseToDate(a.timestamp)?.getTime() || 0;
        const dateB = parseToDate(b.timestamp)?.getTime() || 0;
        return dateA - dateB;
      });
      const latestMsg = sorted[sorted.length - 1];
      if (latestMsg) {
        const latestTime = parseToDate(latestMsg.timestamp)?.getTime() || Date.now();
        localStorage.setItem(`gta6_chat_last_read_${activeChannel}`, String(latestTime));
      }
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isUp = distanceToBottom > 60;
    isUserScrolledUpRef.current = isUp;
    if (!isUp) {
      setShowScrollDownBtn(false);
      setNewMessagesCount(0);

      // Mark as read when scrolled to bottom
      const channelMsgs = messages.filter(m => m.channel === activeChannel);
      if (channelMsgs.length > 0) {
        const sorted = [...channelMsgs].sort((a, b) => {
          const dateA = parseToDate(a.timestamp)?.getTime() || 0;
          const dateB = parseToDate(b.timestamp)?.getTime() || 0;
          return dateA - dateB;
        });
        const latestMsg = sorted[sorted.length - 1];
        if (latestMsg) {
          const latestTime = parseToDate(latestMsg.timestamp)?.getTime() || Date.now();
          localStorage.setItem(`gta6_chat_last_read_${activeChannel}`, String(latestTime));
        }
      }
    }
  };

  // Sync chat messages with Realtime Database (WebSocket), Firestore & REST fallback
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    let unsubscribeRtdb: (() => void) | null = null;

    // 1. Subscribe to Firebase Realtime Database (WebSocket stream, ~10ms latency)
    try {
      unsubscribeRtdb = subscribeRtdbMessages(activeChannel, (rtdbMsgs) => {
        if (rtdbMsgs && rtdbMsgs.length > 0) {
          const formattedRtdbMsgs: ChatMessage[] = rtdbMsgs.map(m => ({
            id: m.id,
            user: m.username || 'ViceCityPlayer_2026',
            avatar: m.avatar || DEFAULT_GTA6_AVATAR,
            channel: m.channel || activeChannel,
            content: m.isDeleted ? 'This message was deleted' : m.text,
            timestamp: m.timestamp,
            isVip: m.isVip ?? true,
            isMod: m.isMod || false,
            isAdmin: m.isAdmin || false,
            userLevel: m.userLevel || 'Member',
            isDeleted: m.isDeleted || false,
            deletedBy: m.deletedBy,
            attachment: m.isDeleted ? undefined : m.attachment,
            reactions: m.reactions || {}
          }));

          setMessages(prev => mergeChatMessages(prev, formattedRtdbMsgs));
        }
      });
    } catch (e) {
      console.warn('RTDB messages subscription warning:', e);
    }

    // Fallback sync from server REST API
    fetch(`/api/chat?channel=${activeChannel}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          const apiMsgs: ChatMessage[] = data.data.map((m: any) => ({
            id: m.id,
            user: m.username,
            avatar: m.avatar,
            channel: m.channel,
            content: m.isDeleted ? 'This message was deleted by moderator' : m.text,
            timestamp: m.timestamp,
            isVip: m.isVip,
            isMod: m.isMod,
            isAdmin: m.isAdmin || m.username === 'ViceCityMod_Tommy',
            userLevel: m.userLevel || (m.isAdmin ? 'Admin' : m.isMod ? 'Staff' : m.isVip ? 'VIP' : 'Member'),
            isDeleted: m.isDeleted || false,
            deletedBy: m.deletedBy,
            attachment: m.isDeleted ? undefined : m.attachment,
            reactions: { '🔥': 2, '👍': 1 }
          }));
          setMessages(prev => mergeChatMessages(prev, apiMsgs));
        }
      })
      .catch(err => console.warn('Chat API Sync fallback note:', err));

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (unsubscribeRtdb) unsubscribeRtdb();
    };
  }, [activeChannel]);

  // Reset positioning reference and firstUnreadId when active channel changes
  useEffect(() => {
    hasPositionedForChannelRef.current = null;
    setFirstUnreadId(null);
  }, [activeChannel]);

  // Position viewport: scroll to 1st unread message or bottom on first load
  useEffect(() => {
    const channelMsgs = messages.filter(m => m.channel === activeChannel);
    if (channelMsgs.length === 0) return;

    if (hasPositionedForChannelRef.current !== activeChannel) {
      const sorted = [...channelMsgs].sort((a, b) => {
        const dateA = parseToDate(a.timestamp)?.getTime() || 0;
        const dateB = parseToDate(b.timestamp)?.getTime() || 0;
        return dateA - dateB;
      });

      // Retrieve last read timestamp
      const lastReadStr = localStorage.getItem(`gta6_chat_last_read_${activeChannel}`);
      const lastReadTime = lastReadStr ? parseInt(lastReadStr, 10) : 0;

      // Find first unread message
      const firstUnread = sorted.find(m => {
        const t = parseToDate(m.timestamp)?.getTime() || 0;
        return t > lastReadTime;
      });

      if (firstUnread) {
        setFirstUnreadId(firstUnread.id || null);
        
        // Scroll specifically to the 1st unread message
        setTimeout(() => {
          const el = document.getElementById(`chat-msg-${firstUnread.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
          } else {
            scrollToBottom(false);
          }
        }, 120);
      } else {
        setFirstUnreadId(null);
        setTimeout(() => scrollToBottom(false), 50);
      }

      // Record latest message timestamp
      const latestMsg = sorted[sorted.length - 1];
      if (latestMsg) {
        const latestTime = parseToDate(latestMsg.timestamp)?.getTime() || Date.now();
        localStorage.setItem(`gta6_chat_last_read_${activeChannel}`, String(latestTime));
      }

      hasPositionedForChannelRef.current = activeChannel;
    }
  }, [messages, activeChannel]);

  // Handle new incoming messages and scroll behavior
  useEffect(() => {
    if (messages.length > prevMessagesCountRef.current) {
      if (isUserScrolledUpRef.current) {
        setShowScrollDownBtn(true);
        setNewMessagesCount(prev => prev + (messages.length - prevMessagesCountRef.current));
      } else {
        setTimeout(() => scrollToBottom(true), 50);
        // Mark as read immediately if user is already at the bottom
        const channelMsgs = messages.filter(m => m.channel === activeChannel);
        if (channelMsgs.length > 0) {
          const sorted = [...channelMsgs].sort((a, b) => {
            const dateA = parseToDate(a.timestamp)?.getTime() || 0;
            const dateB = parseToDate(b.timestamp)?.getTime() || 0;
            return dateA - dateB;
          });
          const latestMsg = sorted[sorted.length - 1];
          if (latestMsg) {
            const latestTime = parseToDate(latestMsg.timestamp)?.getTime() || Date.now();
            localStorage.setItem(`gta6_chat_last_read_${activeChannel}`, String(latestTime));
          }
        }
      }
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages.length, activeChannel]);

  const filteredMessages = useMemo(() => {
    const channelMsgs = messages.filter(m => m.channel === activeChannel && (
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.toLowerCase().includes(searchQuery.toLowerCase())
    ));

    const seenIds = new Set<string>();
    const seenContentKeys = new Set<string>();
    const result: ChatMessage[] = [];

    for (const msg of channelMsgs) {
      if (seenIds.has(msg.id)) continue;
      seenIds.add(msg.id);

      // Deduplication guard against same content and user within 15 seconds
      const timeMs = parseToDate(msg.timestamp)?.getTime() || 0;
      const timeBucket = Math.floor(timeMs / 15000);
      const contentKey = `${msg.user.toLowerCase()}_${msg.content.trim().toLowerCase()}_${timeBucket}`;

      if (seenContentKeys.has(contentKey) && msg.id.startsWith('local_')) {
        continue;
      }
      seenContentKeys.add(contentKey);
      result.push(msg);
    }
    return result;
  }, [messages, activeChannel, searchQuery]);

  // Handle Tagging user in text input
  const handleTagUser = (targetUsername: string) => {
    setInputText(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return `@${targetUsername} `;
      if (trimmed.includes(`@${targetUsername}`)) return `${prev} `;
      return `${prev} @${targetUsername} `;
    });
    setMentionSearch(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle input change and mention popup suggestion logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const lastWord = val.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@')) {
      setMentionSearch(lastWord.slice(1).toLowerCase());
    } else {
      setMentionSearch(null);
    }
  };

  const handleSelectMention = (username: string) => {
    setInputText(prev => {
      const words = prev.trim().split(/\s+/);
      words.pop(); // remove incomplete query
      return (words.join(' ') + ` @${username} `).trimStart();
    });
    setMentionSearch(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Delete Message Execution (triggered after user confirms in custom modal)
  const executeDeleteMessage = async (messageId: string, authorName: string, isOwn: boolean) => {
    const deletedText = isOwn ? 'This message was deleted by author' : 'This message was deleted by moderator';
    const deletedByName = isOwn
      ? (currentUser?.displayName || authorName)
      : (currentUser?.displayName || (isAdminUser ? 'Admin' : 'Staff Moderator'));

    // 1. Update local state
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          isDeleted: true,
          deletedBy: deletedByName,
          content: deletedText,
          attachment: undefined
        };
      }
      return m;
    }));

    // 2. Update Firestore doc if exists
    try {
      const docRef = doc(db, 'chatMessages', messageId);
      await updateDoc(docRef, {
        isDeleted: true,
        text: deletedText,
        deletedBy: deletedByName,
        attachment: null
      });
    } catch (err) {
      console.warn('Firestore update doc error:', err);
    }

    // 3. Fallback REST API
    try {
      await fetch(`/api/chat/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: deletedByName })
      });
    } catch (err) {
      console.warn('REST API delete error:', err);
    }
  };

  // Submit message report to Firestore and moderators
  const handleSendReport = async () => {
    if (!reportModalTarget) return;
    setReportSubmitting(true);
    const nowIso = new Date().toISOString();
    const reporterName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
    const reportDocId = `pending_report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const reportPayload = {
      id: reportDocId,
      type: 'message_report',
      title: `Report: ${reportReason.toUpperCase()} by ${reportModalTarget.authorName}`,
      author: reportModalTarget.authorName,
      reporter: reporterName,
      messageId: reportModalTarget.messageId,
      content: reportModalTarget.text,
      reason: reportReason,
      details: reportDetails,
      channel: reportModalTarget.channelId || 'general',
      status: 'pending',
      timestamp: nowIso
    };

    try {
      await setDoc(doc(db, 'pendingApprovals', reportDocId), {
        ...reportPayload,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Report Firestore submission error:', err);
    }

    try {
      await fetch(`/api/admin/cms/pendingApprovals/${reportDocId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportPayload,
          createdAt: nowIso
        })
      });
    } catch (err) {
      console.warn('REST API report submit error:', err);
    }

    setReportSubmitting(false);
    setReportModalTarget(null);
    setReportDetails('');
    setReportSuccessToast('Report submitted! Our moderation team has queued this message for review.');
    setTimeout(() => setReportSuccessToast(null), 5000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (isAccountSuspended) {
      alert('Your Vice City account is currently suspended by staff. Messaging is disabled.');
      return;
    }
    if (!inputText.trim() && !attachedItem) return;

    const newText = inputText;
    const currentAttachment = attachedItem;

    // Run automated content moderation filter (adult content, phishing links, malware)
    const validation = validateMessageContent(newText);
    if (!validation.isValid) {
      setContentValidationError(validation.reason || 'Message blocked: Restricted content detected.');
      return;
    }
    setContentValidationError(null);

    setInputText('');
    setAttachedItem(null);
    setMentionSearch(null);

    const nowIso = new Date().toISOString();
    const currentUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer_2026';
    const currentAvatar = currentUser?.photoURL || DEFAULT_GTA6_AVATAR;
    const userLevel = isAdminUser ? 'Admin' : isStaffUser ? 'Staff' : isVipUser ? 'VIP' : 'Member';
    const tempMsgId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 0. Optimistic instant local UI render (0ms response guarantee)
    const optimisticMsg: ChatMessage = {
      id: tempMsgId,
      user: currentUsername,
      avatar: currentAvatar,
      channel: activeChannel,
      content: newText,
      timestamp: nowIso,
      isVip: isVipUser,
      isMod: isStaffUser,
      isAdmin: isAdminUser,
      userLevel: userLevel,
      attachment: currentAttachment || undefined,
      reactions: {}
    };

    setMessages(prev => mergeChatMessages(prev, [optimisticMsg]));

    setMySentMessageIds(prev => {
      const next = [...prev, tempMsgId];
      try { localStorage.setItem('gta6_my_chat_msg_ids', JSON.stringify(next)); } catch {}
      return next;
    });

    // 1. Send to Firebase Realtime Database (~10ms instant WebSocket delivery if RTDB created)
    const rtdbMsgId = await sendRtdbMessage({
      username: currentUsername,
      avatar: currentAvatar,
      text: newText,
      channel: activeChannel,
      timestamp: nowIso,
      isVip: isVipUser,
      isMod: isStaffUser,
      isAdmin: isAdminUser,
      userLevel: userLevel,
      attachment: currentAttachment || null,
      reactions: {}
    }).catch(() => null);

    if (rtdbMsgId) {
      setMessages(prev => prev.map(m => m.id === tempMsgId ? { ...m, id: rtdbMsgId } : m));
      setMySentMessageIds(prev => {
        const next = [...prev, rtdbMsgId];
        try { localStorage.setItem('gta6_my_chat_msg_ids', JSON.stringify(next)); } catch {}
        return next;
      });
    }

    // 2. Admin/Staff Broadcast Notification for regular users
    if (isAdminUser || isStaffUser) {
      try {
        await addDoc(collection(db, 'userNotifications'), {
          targetUserId: 'ALL',
          targetUsername: 'ALL',
          type: 'admin_chat_broadcast',
          title: `🚨 Admin Broadcast in #${activeChannel}`,
          message: `@${currentUsername}: "${newText.slice(0, 100)}"`,
          timestamp: nowIso,
          createdAt: Date.now(),
          read: false,
          targetTab: 'chat',
          targetId: activeChannel,
          metadata: {
              senderName: currentUsername,
              channel: activeChannel,
              isAdmin: isAdminUser,
              isStaff: isStaffUser
            }
          });
        } catch (err) {
          console.warn('Admin chat notification error:', err);
        }
      }

      // 2. @all Channel Tagging Broadcast
      if (newText.toLowerCase().includes('@all')) {
        try {
          await addDoc(collection(db, 'userNotifications'), {
            targetUserId: 'ALL',
            targetUsername: 'ALL',
            type: 'channel_all_tag',
            title: `📢 @all Mention in #${activeChannel}`,
            message: `@${currentUsername}: "${newText.slice(0, 100)}"`,
            timestamp: nowIso,
            createdAt: Date.now(),
            read: false,
            targetTab: 'chat',
            targetId: activeChannel,
            metadata: {
              senderName: currentUsername,
              channel: activeChannel
            }
          });
        } catch (err) {
          console.warn('Channel @all tag notification error:', err);
        }
      }

      // 3. Individual @mentions for tagged users
      const mentionMatch = newText.match(/@([a-zA-Z0-9_]+)/g);
      if (mentionMatch) {
        const processedTags = new Set<string>();
        for (const m of mentionMatch) {
          const taggedUsername = m.replace('@', '');
          const taggedLower = taggedUsername.toLowerCase();
          if (taggedLower === 'all' || taggedLower === currentUsername.toLowerCase() || processedTags.has(taggedLower)) {
            continue;
          }
          processedTags.add(taggedLower);

          try {
            await addDoc(collection(db, 'userNotifications'), {
              targetUserId: taggedUsername,
              targetUsername: taggedUsername,
              type: 'chat_tag',
              title: `💬 Tagged in Chat by @${currentUsername}`,
              message: `"${newText.slice(0, 100)}" in #${activeChannel}`,
              timestamp: nowIso,
              createdAt: Date.now(),
              read: false,
              targetTab: 'chat',
              targetId: activeChannel,
              metadata: {
                senderName: currentUsername,
                channel: activeChannel
              }
            });
          } catch (err) {
            console.warn('Tag notification error:', err);
          }
        }
      }

    // 3. Also post to Express REST API server cache so memory state holds it
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newText,
          channel: activeChannel,
          username: currentUsername,
          avatar: currentAvatar,
          isVip: isVipUser,
          isMod: isStaffUser,
          isAdmin: isAdminUser,
          userLevel: userLevel,
          attachment: currentAttachment,
          timestamp: nowIso
        })
      });
      const data = await res.json();
      if (data?.success && data?.data?.id) {
        const serverId = data.data.id;
        setMessages(prev => prev.map(m => (m.id === tempMsgId || m.id === rtdbMsgId) ? { ...m, id: serverId } : m));
        setMySentMessageIds(prev => {
          const next = [...prev, serverId];
          try { localStorage.setItem('gta6_my_chat_msg_ids', JSON.stringify(next)); } catch {}
          return next;
        });
      }
    } catch (err) {
      console.warn('REST API Chat Sync note:', err);
    }

    // 3. Trigger ViceSentinel AI Bot reply only when a command (!command) is typed or bot is tagged
    const isBotSender = currentUsername === BOT_USER_NAME;
    if (!isBotSender) {
      setTimeout(() => {
        triggerBotResponseIfNeeded(newText, activeChannel, currentUsername);
      }, 900);
    }
  };

  const triggerBotResponseIfNeeded = async (userText: string, channelName: string, senderName: string) => {
    const textLower = userText.toLowerCase().trim();
    const isCommand = textLower.startsWith('!');
    const isMentioned = textLower.includes('@vicesentinel') || textLower.includes('@bot') || textLower.includes('@ai') || textLower.includes('!ai');

    // ONLY reply if user explicitly typed a command (!command) or tagged the bot
    if (!isCommand && !isMentioned) {
      return;
    }

    setIsBotTyping(true);

    const isSenderAdmin = isAdminUser || senderName.toLowerCase().includes('admin') || senderName.toLowerCase().includes('lucia') || senderName === 'ViceCityMod_Tommy';
    const isSenderStaff = isStaffUser || isSenderAdmin;

    const userStatsPayload = {
      vcBalance: userProfileData?.vcBalance ?? (isSenderAdmin ? 50000 : isVipUser ? 10000 : 0),
      dailyStreak: userProfileData?.dailyStreak ?? (isSenderAdmin ? 14 : 3),
      userLevel: userProfileData?.role || (isSenderAdmin ? 'L4 Admin' : isSenderStaff ? 'L3 Staff' : isVipUser ? 'L2 VIP Member' : 'L1 Regular User'),
      vipExpires: userProfileData?.vipExpires || (isSenderAdmin ? 'Lifetime' : isSenderStaff ? 'Staff Account' : isVipUser ? '2027-08-15' : 'Expired'),
      badges: userProfileData?.badges || (isSenderAdmin ? ['Executive Admin', 'Master Tuner', 'Vice Veteran'] : isVipUser ? ['VIP Member', 'Nightclub Owner'] : ['Vice Citizen'])
    };

    try {
      const res = await fetch('/api/chat/bot-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userText,
          channel: channelName,
          username: senderName,
          userStats: userStatsPayload
        })
      });

      let botText = '';
      let botAvatarUrl = BOT_AVATAR;

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.botReply) {
          botText = data.botReply;
          if (data.botAvatar) botAvatarUrl = data.botAvatar;
        }
      }

      if (!botText) {
        if (textLower.startsWith('!rules')) {
          botText = `📜 **VICE CITY COMMUNITY & CHAT RULES**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Respect Fellow Gamers** — Zero tolerance for toxicity, hate speech, dox threats, or harassment.
2. **No Spam / Unsolicited Ads** — Keep FiveM/VMP server listings in the RP Servers Directory tab.
3. **No Exploits / Hacked Metas** — Submitting cheated vehicle stats to the Tuning Championship leads to permanent bans.
4. **Follow Channel Guidelines** — Post tech issues in #tech, voice comms in #voice, and heist recruitment in #heists.
5. **Staff Moderation Finality** — Obey L3 Staff and L4 Admin moderation notices. Type \`!help\` for more commands.`;
        } else {
          botText = `🤖 **ViceSentinel Bot:** Hey @${senderName}! Type \`!help\` to view all commands like \`!ping\`, \`!vehicle\`, \`!weapon\`, \`!server\`, \`!rules\`, \`!vip\`, \`!roll\`, \`!8ball\`, or \`!weather\`!`;
        }
      }

      const nowIso = new Date().toISOString();

      try {
        await sendRtdbMessage({
          username: BOT_USER_NAME,
          avatar: botAvatarUrl,
          text: botText,
          channel: channelName,
          timestamp: nowIso,
          isBot: true,
          isVip: true,
          userLevel: 'AI Bot',
          reactions: { '🤖': 1, '⚡': 1 }
        });
      } catch (err) {
        console.warn('Bot RTDB post error:', err);
      }
        try {
          await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: BOT_USER_NAME,
              avatar: botAvatarUrl,
              text: botText,
              channel: channelName,
              isBot: true,
              isVip: true,
              userLevel: 'AI Bot',
              timestamp: nowIso
            })
          });
        } catch {}

        setMessages(prev => {
          const newMsg: ChatMessage = {
            id: 'bot_' + Date.now(),
            user: BOT_USER_NAME,
            avatar: botAvatarUrl,
            channel: channelName as any,
            content: botText,
            timestamp: nowIso,
            isBot: true,
            isVip: true,
            userLevel: 'AI Bot',
            reactions: { '🤖': 1, '⚡': 1 }
          };
          if (prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.user === newMsg.user))) return prev;
          return [...prev, newMsg];
        });
    } catch (err) {
      console.error('Error in triggerBotResponseIfNeeded:', err);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (emoji === '👑' && !isVipUser && !isModerator) {
      setVipLockModalTarget({
        type: 'reaction',
        title: '👑 VIP Exclusive Gold Crown Reaction',
        message: 'The Gold Crown (👑) reaction is reserved exclusively for VIP Members and Staff. Upgrade to VIP status to cast VIP votes!'
      });
      return;
    }

    const currentReactions = userReactions[messageId] || [];
    const hasReacted = currentReactions.includes(emoji);

    // Toggle user reaction state
    setUserReactions(prev => ({
      ...prev,
      [messageId]: hasReacted
        ? (prev[messageId] || []).filter(e => e !== emoji)
        : [...(prev[messageId] || []), emoji]
    }));

    // Increment/Decrement message reaction count
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const currentCount = m.reactions[emoji] || 0;
        const newCount = hasReacted ? Math.max(0, currentCount - 1) : currentCount + 1;
        const updatedReactions = { ...m.reactions };
        if (newCount > 0) {
          updatedReactions[emoji] = newCount;
        } else {
          delete updatedReactions[emoji];
        }
        return {
          ...m,
          reactions: updatedReactions
        };
      }
      return m;
    }));
  };

  // Helper to parse inline tokens like `code`, **bold**, URLs, and @mentions
  const renderFormattedInline = (text: string) => {
    // Regex matches `code`, **bold**, URLs, and @mentions
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|https?:\/\/[^\s]+|www\.[^\s]+|@[A-Za-z0-9_]+)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, i) => {
      if (!part) return null;

      // Inline Code: `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const codeText = part.slice(1, -1);
        return (
          <code key={i} className="font-mono text-[11px] text-cyan-300 bg-zinc-950 px-1.5 py-0.5 mx-0.5 rounded border border-zinc-800/90 select-all font-semibold">
            {codeText}
          </code>
        );
      }

      // Bold: **bold**
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={i} className="font-extrabold text-zinc-100">
            {boldText}
          </strong>
        );
      }

      // URLs
      if (/^https?:\/\//i.test(part) || /^www\./i.test(part)) {
        const href = /^www\./i.test(part) ? `https://${part}` : part;
        const safety = getDomainSafetyInfo(href);
        return (
          <button
            type="button"
            key={i}
            onClick={() => setExternalLinkModalTarget(safety)}
            className={`inline-flex items-center gap-1 font-semibold underline underline-offset-2 px-1 py-0.5 rounded transition cursor-pointer mx-0.5 ${
              safety.category === 'suspicious'
                ? 'text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20'
                : safety.category === 'trusted'
                ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                : 'text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20'
            }`}
            title={`Safety Check: Click to preview link destination (${safety.domain})`}
          >
            <span>{part}</span>
            <ExternalLink className="w-3 h-3 inline shrink-0" />
          </button>
        );
      }

      // Mentions: @user
      if (part.startsWith('@')) {
        const taggedUser = part.slice(1);
        const isAll = taggedUser.toLowerCase() === 'all';
        return (
          <button
            type="button"
            key={i}
            onClick={() => handleTagUser(taggedUser)}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded font-extrabold text-[11px] transition cursor-pointer shadow-sm ${
              isAll
                ? 'bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/60 shadow-amber-500/20'
                : 'bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 shadow-rose-500/10'
            }`}
            title={isAll ? 'Channel Broadcast Tag (@all)' : `Click to mention @${taggedUser}`}
          >
            <AtSign className={`w-2.5 h-2.5 stroke-[3] ${isAll ? 'text-amber-300' : 'text-rose-400'}`} />
            <span>{taggedUser}</span>
          </button>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  // Helper function to render formatted message content with lines, lists, dividers, @mentions, URLs, or deleted notice
  const renderMessageContent = (content: string, isDeleted?: boolean) => {
    if (isDeleted || content.startsWith('This message was deleted')) {
      return (
        <div className="flex items-center gap-2 py-1.5 px-3 bg-zinc-950/70 border border-rose-900/40 rounded-xl text-zinc-400 italic text-xs font-medium my-1 shadow-inner">
          <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>{content || 'This message was deleted'}</span>
        </div>
      );
    }

    const lines = content.split('\n');

    if (lines.length > 1) {
      return (
        <div className="space-y-1.5 text-xs text-zinc-300 leading-relaxed break-words py-0.5">
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-0.5" />;

            // Divider: ━━━━━ or ─────
            if (/^[━─—=]{3,}$/.test(trimmed)) {
              return <div key={idx} className="my-1.5 h-px bg-zinc-800/80 w-full" />;
            }

            // Numbered item: 1. ... or 2. ...
            const numMatch = trimmed.match(/^([0-9]+)\.\s*(.*)/);
            if (numMatch) {
              const [, num, itemContent] = numMatch;
              return (
                <div key={idx} className="flex items-start gap-2 pl-0.5 py-0.5">
                  <span className="w-4 h-4 rounded-md bg-zinc-900 border border-zinc-800 text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {num}
                  </span>
                  <div className="flex-1 min-w-0">
                    {renderFormattedInline(itemContent)}
                  </div>
                </div>
              );
            }

            // Bullet item: • ... or - ...
            const bulletMatch = trimmed.match(/^([•\-*])\s*(.*)/);
            if (bulletMatch) {
              const [, , itemContent] = bulletMatch;
              return (
                <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    {renderFormattedInline(itemContent)}
                  </div>
                </div>
              );
            }

            return (
              <p key={idx} className="leading-relaxed">
                {renderFormattedInline(line)}
              </p>
            );
          })}
        </div>
      );
    }

    return (
      <p className="text-xs text-zinc-300 leading-relaxed break-words">
        {renderFormattedInline(content)}
      </p>
    );
  };

  // Chatters list for mention suggestions including @all tag
  const activeChannelObj = customChannels.find(c => c.id === activeChannel);
  const channelMembers = activeChannelObj?.members || [];
  const activeChatterUsernames: string[] = Array.from(
    new Set([
      'all',
      BOT_USER_NAME,
      'ViceSentinel',
      ...messages.map(m => m.user),
      ...channelMembers
    ])
  ).filter((u): u is string => typeof u === 'string' && u.trim().length > 0);

  const matchingMentions: string[] = mentionSearch !== null
    ? activeChatterUsernames.filter((u: string) => u.toLowerCase().includes(mentionSearch.toLowerCase()))
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live Community Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> 1,482 Players Online
              </span>
              {isModerator && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-rose-500/30 via-amber-500/30 to-rose-500/30 text-amber-200 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-amber-400" /> Moderator Powers Active
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Vice City Live Player Chat & Recruitment
            </h2>
            <p className="text-xs text-zinc-400">
              Connect with GTA VI players, recruit heist squads, tag players with <span className="text-rose-400 font-bold">@GamerTag</span>, and moderate discussions with real-time staff tools.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className={`bg-zinc-900 border rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-4 min-h-[580px] transition-all duration-300 ${
        isGameOverlayMode
          ? 'bg-zinc-950/80 backdrop-blur-md border-indigo-500/60 shadow-2xl shadow-indigo-950/50 ring-2 ring-indigo-500/30'
          : 'border-zinc-800'
      }`}>
        {/* Left Sidebar: Channels & Online Users */}
        <div className="bg-zinc-950/80 border-b lg:border-b-0 lg:border-r border-zinc-800 p-4 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 block">
              Chat Channels
            </span>

            <div className="flex lg:flex-col overflow-x-auto gap-1.5 pb-2 lg:pb-0 scrollbar-thin">
              <button
                onClick={() => setActiveChannel('general')}
                className={`text-left px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between shrink-0 whitespace-nowrap min-w-[140px] lg:min-w-0 ${
                  activeChannel === 'general'
                    ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>general-lounge</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  {(voiceRooms['general'] || []).length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-0.5" title={`${(voiceRooms['general'] || []).length} active in voice`}>
                      <Mic className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                      {(voiceRooms['general'] || []).length}
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">842</span>
                </div>
              </button>

              <button
                onClick={() => setActiveChannel('tuning')}
                className={`text-left px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between shrink-0 whitespace-nowrap min-w-[140px] lg:min-w-0 ${
                  activeChannel === 'tuning'
                    ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>vehicle-tuning</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  {(voiceRooms['tuning'] || []).length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-0.5" title={`${(voiceRooms['tuning'] || []).length} active in voice`}>
                      <Mic className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                      {(voiceRooms['tuning'] || []).length}
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">312</span>
                </div>
              </button>

              <button
                onClick={() => setActiveChannel('heists')}
                className={`text-left px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between shrink-0 whitespace-nowrap min-w-[140px] lg:min-w-0 ${
                  activeChannel === 'heists'
                    ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>heist-squads</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  {(voiceRooms['heists'] || []).length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-0.5" title={`${(voiceRooms['heists'] || []).length} active in voice`}>
                      <Mic className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                      {(voiceRooms['heists'] || []).length}
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">198</span>
                </div>
              </button>

              <button
                onClick={() => setActiveChannel('rp-servers')}
                className={`text-left px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between shrink-0 whitespace-nowrap min-w-[140px] lg:min-w-0 ${
                  activeChannel === 'rp-servers'
                    ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>rp-server-hub</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  {(voiceRooms['rp-servers'] || []).length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-0.5" title={`${(voiceRooms['rp-servers'] || []).length} active in voice`}>
                      <Mic className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                      {(voiceRooms['rp-servers'] || []).length}
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">130</span>
                </div>
              </button>
            </div>
          </div>

          {/* VIP Custom Communities Section */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-3">
            {(() => {
              const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
              const joinedCustomChannels = customChannels.filter((channel) => {
                const membersList = channel.members || [];
                const isMember = membersList.includes(activeUsername) || (currentUser?.uid && membersList.includes(currentUser.uid));
                const isCreator = channel.creatorName === activeUsername || (currentUser?.uid && channel.creatorId === currentUser.uid);
                const isSelected = activeChannel === channel.id;
                return isMember || isCreator || isModerator || isSelected;
              });

              return (
                <>
                  <div className="flex items-center justify-between px-1 gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" /> Joined Extra Hubs ({joinedCustomChannels.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsJoinChannelModalOpen(true)}
                        className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-[10px] font-bold border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer"
                        title="Enter an invite code or link to join an extra community channel"
                      >
                        <Key className="w-3 h-3 text-indigo-300" /> Join Code
                      </button>
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            if (onOpenAuth) onOpenAuth();
                            return;
                          }
                          if (!isVipUser && !isModerator) {
                            setVipLockModalTarget({
                              type: 'attachment',
                              title: '🔒 Private Communities Reserved for VIP Members',
                              message: 'Creating custom public or private channels with shareable invite links is an exclusive L2 VIP Member perk.'
                            });
                            return;
                          }
                          setIsCreateChannelModalOpen(true);
                        }}
                        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                        title="Create custom public or private VIP community channel"
                      >
                        <Plus className="w-3 h-3" /> Create Hub
                      </button>
                    </div>
                  </div>

                  <div className="flex lg:flex-col overflow-x-auto gap-2 pb-2 lg:pb-0 scrollbar-thin max-h-[240px] lg:overflow-y-auto pr-1">
                    {joinedCustomChannels.length === 0 ? (
                      <div className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 text-center space-y-2">
                        <p className="text-xs text-zinc-300 font-bold">No extra channels joined yet</p>
                        <p className="text-[10px] text-zinc-500 leading-tight">
                          You are in the 4 default channels. Use an invite link or code to join extra squad hubs!
                        </p>
                        <div className="flex items-center justify-center gap-1.5 pt-1">
                          <button
                            onClick={() => setIsJoinChannelModalOpen(true)}
                            className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Key className="w-3 h-3 text-indigo-300" />
                            <span>Join Hub with Code</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      joinedCustomChannels.map((channel) => {
                        const membersList = channel.members || [];
                        const requestsList = channel.pendingRequests || [];
                        const isMember = membersList.includes(activeUsername);
                        const isCreator = channel.creatorName === activeUsername || (currentUser?.uid && channel.creatorId === currentUser.uid);
                        const isPending = requestsList.some(r => r.username === activeUsername);
                        const isSelected = activeChannel === channel.id;

                        return (
                          <div
                            key={channel.id}
                            className={`rounded-xl p-2.5 transition border shrink-0 min-w-[200px] sm:min-w-[220px] lg:min-w-0 ${
                              isSelected
                                ? 'bg-amber-950/40 border-amber-500/50 text-white shadow-md shadow-amber-950/20'
                                : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <button
                                onClick={() => {
                                  if (channel.isPrivate && !isMember && !isCreator && !isModerator) {
                                    handleJoinOrRequestAccess(channel);
                                  } else {
                                    setActiveChannel(channel.id);
                                  }
                                }}
                                className="flex items-center gap-1.5 font-extrabold text-xs hover:text-amber-300 text-left truncate flex-1 cursor-pointer"
                              >
                                {channel.isPrivate ? (
                                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                ) : (
                                  <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                )}
                                <span className="truncate">#{channel.name}</span>
                                {(voiceRooms[channel.id] || []).length > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-0.5 shrink-0" title={`${(voiceRooms[channel.id] || []).length} active in voice`}>
                                    <Mic className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                                    {(voiceRooms[channel.id] || []).length}
                                  </span>
                                )}
                              </button>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleCopyShareLink(channel)}
                                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 rounded transition cursor-pointer"
                                  title="Copy Shareable Invite Link"
                                >
                                  <Share2 className="w-3 h-3" />
                                </button>

                                {(isCreator || isModerator) && (
                                  <button
                                    onClick={() => setManagingChannel(channel)}
                                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition cursor-pointer"
                                    title="Manage VIP Hub Settings & Member Requests"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="text-[10px] text-zinc-400 line-clamp-1 mb-1.5">{channel.description}</p>

                            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-800/50">
                              <span>By @{channel.creatorName}</span>

                              {isMember || isCreator ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <UserCheck className="w-3 h-3" /> Joined ({membersList.length})
                                  </span>
                                  {isMember && !isCreator && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLeaveChannel(channel.id);
                                      }}
                                      className="px-1.5 py-0.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded text-[9px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                                      title="Leave this channel"
                                    >
                                      <LogOut className="w-2.5 h-2.5" /> Leave
                                    </button>
                                  )}
                                </div>
                              ) : isPending ? (
                                <span className="text-amber-400 font-bold">⏳ Requested</span>
                              ) : channel.isPrivate ? (
                                <button
                                  onClick={() => handleJoinOrRequestAccess(channel)}
                                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-[10px] transition cursor-pointer"
                                >
                                  Request Access
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleJoinOrRequestAccess(channel)}
                                  className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-[10px] transition cursor-pointer"
                                >
                                  Join Hub
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Search Messages */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 block">
              Search Messages
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Active VIP Badge Box */}
          <div className="bg-gradient-to-br from-amber-950/40 to-zinc-900 border border-amber-500/30 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>VIP Member Perks</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              VIP Members receive an exclusive gold crown badge, high-priority chat messaging, custom channel creation, and 100% ad-free portal access.
            </p>
          </div>
        </div>

        {/* Right Section: Chat Feed & Input */}
        <div className="lg:col-span-3 flex flex-col p-3.5 sm:p-5 space-y-3 min-h-[580px]">
          {/* Top Bar of Channel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-rose-400" />
              <span className="font-extrabold text-white text-base">#{activeChannel}</span>
              <span className="text-xs text-zinc-500 hidden md:inline">• Live Vice City Community Feed</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Voice Comms Toggle & Control */}
              <button
                onClick={() => {
                  if (isVoiceConnected) {
                    setIsVoiceRoomModalOpen(true);
                  } else {
                    handleJoinVoiceChannel(activeChannel);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  isVoiceConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20 hover:bg-emerald-500/30'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
                title={isVoiceConnected ? "Open Voice Control Room" : "Connect to Vice Voice Comms"}
              >
                {isVoiceConnected ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Voice: #{activeVoiceChannel || activeChannel}</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Join Voice Comms</span>
                  </>
                )}
              </button>

              {/* YouTube Stream Toggle */}
              <button
                onClick={() => {
                  if (!isLiveStreamOpen) {
                    const perm = checkLiveAndHudPermission(activeChannel);
                    if (!perm.allowed) {
                      setReportSuccessToast(perm.message);
                      setTimeout(() => setReportSuccessToast(null), 4000);
                      return;
                    }
                  }
                  setIsLiveStreamOpen(!isLiveStreamOpen);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  isLiveStreamOpen
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
                title="Go Live / Watch YouTube Stream"
              >
                <Tv className="w-3.5 h-3.5 text-rose-400" />
                <span>{isLiveStreamOpen ? 'Hide Stream' : '🔴 Go Live'}</span>
              </button>

              {/* Game HUD Overlay Mode */}
              <button
                onClick={() => {
                  if (!isGameOverlayMode) {
                    const perm = checkLiveAndHudPermission(activeChannel);
                    if (!perm.allowed) {
                      setReportSuccessToast(perm.message);
                      setTimeout(() => setReportSuccessToast(null), 4000);
                      return;
                    }
                  }
                  setIsGameOverlayMode(!isGameOverlayMode);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  isGameOverlayMode
                    ? 'bg-indigo-500/30 text-indigo-200 border-indigo-500/50 shadow-md shadow-indigo-500/20'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                }`}
                title="Toggle Game HUD Overlay Mode (Transparent 80% opacity for playing in secondary window)"
              >
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isGameOverlayMode ? 'Exit Overlay' : '🎮 HUD Overlay'}</span>
              </button>

              {/* Leave Custom Channel Button */}
              {(() => {
                const activeCustomChan = customChannels.find(c => c.id === activeChannel);
                const activeUserTag = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
                const isMemberOfChan = activeCustomChan?.members.includes(activeUserTag);
                const isCreatorOfChan = activeCustomChan?.creatorName === activeUserTag || (currentUser?.uid && activeCustomChan?.creatorId === currentUser.uid);

                if (activeCustomChan && isMemberOfChan && !isCreatorOfChan) {
                  return (
                    <button
                      onClick={() => handleLeaveChannel(activeCustomChan.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border bg-rose-950/50 hover:bg-rose-900 text-rose-300 border-rose-500/40 cursor-pointer shadow-sm shadow-rose-950/30"
                      title="Leave this custom VIP channel"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Leave Hub</span>
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Custom Mic Permission Denied / Iframe Block Warning Banner inside Chat Interface */}
          {micPermissionState === 'denied' && (
            <div className="bg-amber-950/40 border-2 border-amber-500/50 rounded-2xl p-4 shadow-xl animate-fade-in space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl shrink-0 mt-0.5">
                    <MicOff className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>Microphone Restricted or Blocked by Browser Frame</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Notice
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      Safari / browser security may block microphone capture inside embedded preview frames. You can still join in <strong>Listen-Only</strong> mode to hear other players, or open the app in a standalone tab.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMicPermissionState('prompt')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0 cursor-pointer"
                  title="Dismiss warning"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-amber-500/20">
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Choose how you would like to participate:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMicPermissionState('prompt');
                      handleJoinVoiceChannel(activeChannel, true);
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Join as Listener</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const targetUrl = `${window.location.origin}/?popout=true&channel=${encodeURIComponent(activeChannel)}`;
                        window.open(targetUrl, '_blank');
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-950/50 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleJoinVoiceChannel(activeChannel)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Retry Mic</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Embedded YouTube / Twitch Stream Player Header Bar */}
          {isLiveStreamOpen && (
            <div className="bg-zinc-950 border border-rose-500/30 rounded-2xl p-4 space-y-3 shadow-xl animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    🔴 {streamInfo.title || 'GTA VI Vice City Channel Live Feed'}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono border border-rose-500/30 font-bold flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5 text-rose-400" />
                    Synced in #{activeChannel}
                  </span>
                  {streamInfo.streamerName && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 font-bold">
                      Streamer: @{streamInfo.streamerName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const shareUrl = streamInfo.streamType === 'twitch' 
                        ? `https://twitch.tv/${streamInfo.streamId}` 
                        : `https://youtu.be/${streamInfo.streamId}`;
                      const success = await copyToClipboard(shareUrl);
                      if (success) {
                        setReportSuccessToast('Copied Live Stream Link!');
                        setTimeout(() => setReportSuccessToast(null), 3000);
                      }
                    }}
                    className="text-[10px] text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/20 font-bold flex items-center gap-1 cursor-pointer transition"
                    title="Copy stream link to share with squad"
                  >
                    <Copy className="w-3 h-3 text-emerald-400" /> Share Stream
                  </button>
                  <button
                    onClick={() => setShowObsGuideModal(true)}
                    className="text-[10px] text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Video className="w-3 h-3 text-indigo-400" /> OBS Setup Guide
                  </button>
                  <button
                    onClick={() => setIsLiveStreamOpen(false)}
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition cursor-pointer"
                    title="Close Live Stream Player"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Presets Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-wider mr-1">Feed Presets:</span>
                <button
                  type="button"
                  onClick={() => handleSetChannelStream('tJbzMqJGH4k', 'GTA VI Official Broadcast')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold cursor-pointer transition whitespace-nowrap flex items-center gap-1"
                >
                  🎬 GTA VI Official Video
                </button>
                <button
                  type="button"
                  onClick={() => handleSetChannelStream('v_L7n8g7eG0', 'GTA VI Vice City 24/7 Live Stream')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold cursor-pointer transition whitespace-nowrap flex items-center gap-1"
                >
                  🏎️ Vice City 24/7 Gameplay
                </button>
                <button
                  type="button"
                  onClick={() => handleSetChannelStream('twitch:rockstargames', 'Twitch Rockstar Games Official Channel')}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 font-semibold cursor-pointer transition whitespace-nowrap flex items-center gap-1"
                >
                  💜 Twitch: rockstargames
                </button>
              </div>

              {/* YouTube / Twitch Iframe Embed */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-inner">
                {streamInfo.streamType === 'twitch' ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://player.twitch.tv/?channel=${streamInfo.streamId}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&autoplay=true&muted=true`}
                    title="Twitch Channel Live Stream"
                    allowFullScreen
                  />
                ) : (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${streamInfo.streamId || youtubeVideoId}?autoplay=1&mute=1&controls=1&rel=0`}
                    title="GTA VI YouTube Gameplay Stream"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>

              {/* Input Custom YouTube / Twitch Stream URL or ID */}
              <form onSubmit={handleApplyCustomYoutubeStream} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Paste YouTube Link / Video ID (e.g. QdBZY2fkU-0) or Twitch Channel (e.g. twitch.tv/rockstargames)..."
                  value={customYoutubeInput}
                  onChange={(e) => setCustomYoutubeInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/50"
                >
                  <Tv className="w-3.5 h-3.5 text-rose-200" />
                  <span>Go Live & Broadcast to #{activeChannel}</span>
                </button>
              </form>
            </div>
          )}

          {/* Chat Messages List Container */}
          <div className="relative flex-1 flex flex-col min-h-[360px] bg-zinc-950/40 p-3 sm:p-3.5 rounded-2xl border border-zinc-800/80 shadow-inner">
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto max-h-[520px] min-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-zinc-800 flex flex-col"
            >
              <div className="mt-auto space-y-3.5 flex flex-col justify-end min-w-0 w-full">
              {[...filteredMessages]
                .sort((a, b) => {
                  const dateA = parseToDate(a.timestamp)?.getTime() || 0;
                  const dateB = parseToDate(b.timestamp)?.getTime() || 0;
                  return dateA - dateB;
                })
                .map((msg, index, sortedArr) => {
                  const { dateLabel, timeLabel } = getChatMessageDateAndTime(msg.timestamp, !isMounted);
                  const prevMsg = index > 0 ? sortedArr[index - 1] : null;
                  const prevDateLabel = prevMsg ? getChatMessageDateAndTime(prevMsg.timestamp, !isMounted).dateLabel : null;
                  const showDateHeader = index === 0 || dateLabel !== prevDateLabel;

                  // Admin, Staff, Bot & Level checks
                  const isRealAdmin = msg.isAdmin || msg.userLevel === 'Admin' || msg.user === 'ViceCityMod_Tommy' || (currentUser?.displayName === msg.user && isAdminUser);
                  const isStaffMsg = msg.isMod || msg.userLevel === 'Staff' || (currentUser?.displayName === msg.user && isStaffUser);
                  const isBotMsg = msg.isBot || msg.user === BOT_USER_NAME || msg.userLevel === 'AI Bot';
                  const userLevelBadge = msg.userLevel || (isRealAdmin ? 'Admin' : isStaffMsg ? 'Staff' : isBotMsg ? 'AI Bot' : msg.isVip ? 'L2' : 'L1');

                  // Mention & Ownership check
                  const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer_2026';
                  const isMentioned = !!activeUsername && !msg.isDeleted && (
                    msg.content.toLowerCase().includes(`@${activeUsername.toLowerCase()}`) ||
                    msg.content.toLowerCase().includes('@all')
                  );
                  const isOwnMessage = (!!msg.id && mySentMessageIds.includes(msg.id)) ||
                    (!!activeUsername && msg.user.toLowerCase() === activeUsername.toLowerCase());
                  const canDeleteMsg = !msg.isDeleted && (isOwnMessage || (isModerator && !msg.isAdmin && msg.userLevel !== 'Admin'));

                return (
                  <React.Fragment key={msg.id}>
                    {showDateHeader && (
                      <div className="my-4 flex items-center justify-center">
                        <div className="flex items-center gap-3 w-full my-1">
                          <div className="h-[1px] bg-zinc-800/80 flex-1" />
                          <span className="px-3.5 py-1 text-[11px] font-bold text-zinc-300 bg-zinc-900 border border-zinc-800/80 rounded-full shadow-sm tracking-wide" suppressHydrationWarning>
                            {dateLabel}
                          </span>
                          <div className="h-[1px] bg-zinc-800/80 flex-1" />
                        </div>
                      </div>
                    )}

                    {firstUnreadId === msg.id && (
                      <div className="my-4 flex items-center justify-center select-none" id="unread-banner">
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-[1px] bg-rose-500/40 flex-1" />
                          <span className="px-3.5 py-1 text-[10px] font-black tracking-wider uppercase text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-full shadow-md shadow-rose-950/20 flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> New Messages Since Last Visit
                          </span>
                          <div className="h-[1px] bg-rose-500/40 flex-1" />
                        </div>
                      </div>
                    )}

                    <div id={`chat-msg-${msg.id}`} className={`flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl transition relative group min-w-0 overflow-hidden ${
                      msg.isDeleted
                        ? 'bg-zinc-950/30 border border-zinc-900/80 opacity-80'
                        : isRealAdmin
                        ? 'bg-gradient-to-r from-rose-950/40 via-zinc-950/90 to-amber-950/30 border border-amber-500/40 shadow-[0_0_15px_rgba(244,63,94,0.12)]'
                        : isBotMsg
                        ? 'bg-zinc-950/80 border border-zinc-800/90 border-l-4 border-l-cyan-500/90'
                        : isMentioned
                        ? 'bg-rose-950/40 border-l-4 border-l-rose-500 border-zinc-800 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                        : 'bg-zinc-950/50 border border-zinc-800/80 hover:border-zinc-700/80'
                    }`}>
                      
                      {/* Avatar with Animated Ring for Admin or Bot */}
                      {isRealAdmin ? (
                        <div className="relative shrink-0">
                          <img
                            src={msg.avatar}
                            alt={msg.user}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/90 ring-offset-2 ring-offset-zinc-950 animate-admin-glow"
                            onError={(e) => {
                              const preset = GTA6_AVATARS.find(a => a.url === msg.avatar);
                              if (preset?.fallbackSvgDataUri && e.currentTarget.src !== preset.fallbackSvgDataUri) {
                                e.currentTarget.src = preset.fallbackSvgDataUri;
                              } else if (GTA6_AVATARS[0].fallbackSvgDataUri && e.currentTarget.src !== GTA6_AVATARS[0].fallbackSvgDataUri) {
                                e.currentTarget.src = GTA6_AVATARS[0].fallbackSvgDataUri;
                              }
                            }}
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-rose-500 rounded-full border-2 border-zinc-950 flex items-center justify-center text-[8px] font-black text-white shadow-sm" title="Verified Admin">
                            <Crown className="w-2.5 h-2.5 text-amber-100" />
                          </span>
                        </div>
                      ) : isBotMsg ? (
                        <div className="relative shrink-0">
                          <img
                            src={msg.avatar}
                            alt={msg.user}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-cyan-700/60"
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-800 rounded-full border border-zinc-700 flex items-center justify-center text-[8px] font-bold text-cyan-300" title="ViceSentinel AI Bot">
                            <Bot className="w-2.5 h-2.5 text-cyan-300" />
                          </span>
                        </div>
                      ) : (
                        <img
                          src={msg.avatar}
                          alt={msg.user}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
                          onError={(e) => {
                            const preset = GTA6_AVATARS.find(a => a.url === msg.avatar);
                            if (preset?.fallbackSvgDataUri && e.currentTarget.src !== preset.fallbackSvgDataUri) {
                              e.currentTarget.src = preset.fallbackSvgDataUri;
                            } else if (GTA6_AVATARS[0].fallbackSvgDataUri && e.currentTarget.src !== GTA6_AVATARS[0].fallbackSvgDataUri) {
                              e.currentTarget.src = GTA6_AVATARS[0].fallbackSvgDataUri;
                            }
                          }}
                        />
                      )}

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Username */}
                            {isRealAdmin ? (
                              <span className="font-black text-xs bg-gradient-to-r from-amber-300 via-rose-300 to-amber-200 bg-clip-text text-transparent animate-text-shimmer drop-shadow-sm">
                                {msg.user}
                              </span>
                            ) : isBotMsg ? (
                              <span className="font-bold text-xs text-cyan-300">
                                {msg.user}
                              </span>
                            ) : (
                              <span className="font-bold text-xs text-white">{msg.user}</span>
                            )}

                            {/* Animated Admin Badge */}
                            {isRealAdmin && (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 animate-admin-gradient text-white shadow-md shadow-rose-600/30 flex items-center gap-1 border border-amber-300/40 tracking-wider">
                                <Crown className="w-2.5 h-2.5 text-amber-200" /> ADMIN
                              </span>
                            )}

                            {/* AI BOT Badge */}
                            {isBotMsg && (
                              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-zinc-900 text-cyan-300 flex items-center gap-1 border border-zinc-700/80 tracking-wider">
                                <Bot className="w-2.5 h-2.5 text-cyan-400" /> BOT
                              </span>
                            )}

                            {/* Staff Badge */}
                            {isStaffMsg && !isRealAdmin && !isBotMsg && (
                              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5 text-indigo-400" /> STAFF
                              </span>
                            )}

                            {/* VIP Badge */}
                            {msg.isVip && !isRealAdmin && !isBotMsg && (
                              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5" /> VIP
                              </span>
                            )}

                            {/* Mentioned You Indicator */}
                            {isMentioned && (
                              <span className="px-1.5 py-0.2 text-[8px] font-black uppercase bg-rose-500/30 text-rose-200 rounded border border-rose-500/50 flex items-center gap-1 animate-pulse">
                                <AtSign className="w-2.5 h-2.5 text-rose-300" /> Mentioned You
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono" suppressHydrationWarning>{timeLabel}</span>

                            {/* Tag Button */}
                            {!msg.isDeleted && (
                              <button
                                type="button"
                                onClick={() => handleTagUser(msg.user)}
                                className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-rose-300 rounded transition flex items-center gap-1 text-[10px] font-bold"
                                title={`Tag @${msg.user}`}
                              >
                                <AtSign className="w-3 h-3 text-rose-400" />
                                <span className="hidden sm:inline">Tag</span>
                              </button>
                            )}

                            {/* Report / Flag Button for Community Safety */}
                            {!msg.isDeleted && !isOwnMessage && (
                              <button
                                type="button"
                                onClick={() => setReportModalTarget({ messageId: msg.id, authorName: msg.user, text: msg.content, channelId: activeChannel || 'general' })}
                                className="p-1 hover:bg-amber-500/20 text-zinc-500 hover:text-amber-400 rounded transition flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                title="Report message for adult content, phishing, or harassment"
                              >
                                <Flag className="w-3 h-3 text-amber-400" />
                                <span className="hidden sm:inline">Report</span>
                              </button>
                            )}

                            {/* Delete Action for Message Author (any level) or Moderators */}
                            {canDeleteMsg && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmTarget({ messageId: msg.id, authorName: msg.user, isOwn: isOwnMessage })}
                                className="p-1 hover:bg-rose-600/20 text-zinc-500 hover:text-rose-400 rounded transition border border-transparent hover:border-rose-500/30 flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                title={isOwnMessage ? "Delete your message" : "Moderator Action: Delete message"}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            )}
                          </div>
                        </div>

                    {/* Content Rendering */}
                    {renderMessageContent(msg.content, msg.isDeleted)}

                    {/* Rich Attachment Card if any */}
                    {!msg.isDeleted && msg.attachment && (
                      msg.attachment.type === 'giftcard' ? (() => {
                        const vCode = (msg.attachment.actionData || msg.attachment.giftcardCode || '').toUpperCase();
                        const redeemedInfo = redeemedVouchersMap[vCode];
                        const isExpired = Boolean(msg.attachment.isClaimed || redeemedInfo?.isRedeemed);
                        const redeemerName = msg.attachment.claimedBy || redeemedInfo?.redeemedByUsername || 'a player';
                        const vcAmount = msg.attachment.giftcardVcValue || getVipVcGrantedNumber();

                        return (
                          <div className={`rounded-2xl p-3 sm:p-3.5 my-2.5 shadow-xl border transition-all ${
                            isExpired
                              ? 'bg-zinc-950/90 border-zinc-800 text-zinc-400 opacity-90'
                              : 'bg-gradient-to-r from-amber-950/70 via-zinc-900 to-rose-950/70 border-amber-500/50 hover:border-amber-400'
                          }`}>
                            {/* Top Row: Icon, Badge, Title, VC Value */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isExpired
                                    ? 'bg-zinc-800/80 border-zinc-700 text-zinc-500'
                                    : 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-inner'
                                }`}>
                                  <Gift className={`w-4 h-4 sm:w-5 sm:h-5 ${!isExpired ? 'animate-pulse' : ''}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded flex items-center gap-1 border ${
                                      isExpired
                                        ? 'bg-zinc-800/90 text-zinc-400 border-zinc-700'
                                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    }`}>
                                      {isExpired ? <Ban className="w-2.5 h-2.5 text-zinc-400" /> : <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
                                      {isExpired ? 'EXPIRED' : (msg.attachment.badge || 'Shark Card')}
                                    </span>
                                    <span className={`font-extrabold text-xs truncate ${isExpired ? 'text-zinc-400' : 'text-white'}`}>
                                      {msg.attachment.title}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <span className={`text-[11px] sm:text-xs font-black font-mono shrink-0 px-2 py-0.5 rounded-lg border ${
                                isExpired
                                  ? 'bg-zinc-900 text-zinc-500 border-zinc-800 line-through'
                                  : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                              }`}>
                                +{vcAmount.toLocaleString('en-US')} VC
                              </span>
                            </div>

                            {/* Code Container */}
                            <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 mb-2 font-mono text-xs overflow-x-auto scrollbar-thin ${
                              isExpired
                                ? 'bg-zinc-900/90 border-zinc-800 text-zinc-500'
                                : 'bg-zinc-950/90 border-amber-500/30 text-amber-300'
                            }`}>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto scrollbar-thin py-0.5">
                                <Key className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold shrink-0">Code:</span>
                                <span className={`font-mono font-bold tracking-wider whitespace-nowrap px-2 py-0.5 rounded-lg bg-zinc-900/90 border border-amber-500/30 text-xs ${isExpired ? 'line-through text-zinc-500' : 'text-amber-300'}`}>
                                  {vCode}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  copyToClipboard(vCode);
                                  setCopySuccessToast('Copied voucher code to clipboard!');
                                  setTimeout(() => setCopySuccessToast(null), 3000);
                                }}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition shrink-0 cursor-pointer text-[10px] flex items-center gap-1"
                                title="Copy voucher code"
                              >
                                <Copy className="w-3 h-3" />
                                <span className="hidden sm:inline">Copy</span>
                              </button>
                            </div>

                            {/* Claim Button / Expired Claimed Banner */}
                            {isExpired ? (
                              <div className="w-full py-2 px-3 bg-zinc-900/90 border border-zinc-800/90 rounded-xl text-[11px] font-bold text-zinc-400 flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Code Claimed by <span className="text-zinc-300 font-extrabold">@{redeemerName}</span></span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={claimingVoucherCode === vCode}
                                onClick={() => handleClaimChatVoucher(vCode, msg.id)}
                                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 via-amber-400 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-zinc-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                              >
                                {claimingVoucherCode === vCode ? (
                                  <span className="flex items-center gap-1.5">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Claiming Voucher...
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Claim Voucher (+{vcAmount.toLocaleString('en-US')} VC)
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })() : (
                      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/90 hover:border-indigo-500/40 rounded-xl p-3 my-2 shadow-lg transition-all group/att">
                        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1 w-full md:w-auto">
                            {/* Thumbnail photo or icon */}
                            {msg.attachment.imageUrl ? (
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 relative group-hover/att:border-indigo-500/50 transition">
                                <img src={msg.attachment.imageUrl} alt={msg.attachment.title} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                {msg.attachment.type === 'vehicle' && <Car className="w-5 h-5 text-rose-400" />}
                                {msg.attachment.type === 'weapon' && <Crosshair className="w-5 h-5 text-amber-400" />}
                                {msg.attachment.type === 'server' && <Globe className="w-5 h-5 text-emerald-400" />}
                                {msg.attachment.type === 'location' && <MapPin className="w-5 h-5 text-cyan-400" />}
                                {msg.attachment.type === 'business' && <DollarSign className="w-5 h-5 text-emerald-400" />}
                                {(!['vehicle', 'weapon', 'server', 'location', 'business'].includes(msg.attachment.type)) && <Paperclip className="w-5 h-5 text-indigo-400" />}
                              </div>
                            )}

                            {/* Details & Stat chips */}
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[9px] font-black uppercase rounded border ${
                                  msg.attachment.type === 'vehicle' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                                  msg.attachment.type === 'weapon' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                  msg.attachment.type === 'server' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                  msg.attachment.type === 'location' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                                  msg.attachment.type === 'business' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                }`}>
                                  {msg.attachment.badge || msg.attachment.type}
                                </span>
                                <span className="font-extrabold text-white text-xs truncate block">{msg.attachment.title}</span>
                              </div>
                              <span className="text-[11px] text-zinc-400 block truncate leading-tight">{msg.attachment.detail}</span>

                              {msg.attachment.stats && msg.attachment.stats.length > 0 && (
                                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none pb-0.5 max-w-full">
                                  {msg.attachment.stats.map((st, sIdx) => (
                                    <span key={sIdx} className="px-1.5 py-0.5 bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 rounded shrink-0 whitespace-nowrap">
                                      <span className="text-zinc-500">{st.label}:</span> {st.value}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap self-end md:self-center">
                            {msg.attachment.actionType === 'copy_connect' && msg.attachment.actionData && (
                              <button
                                type="button"
                                onClick={() => {
                                  copyToClipboard(msg.attachment!.actionData!);
                                  setCopySuccessToast('Copied F8 connect string to clipboard!');
                                  setTimeout(() => setCopySuccessToast(null), 3000);
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" /> Connect IP
                              </button>
                            )}

                            {msg.attachment.type === 'vehicle' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const vMatch = VEHICLES_DATA.find(v => v.id === msg.attachment?.actionData || v.name === msg.attachment?.title || msg.attachment?.title.includes(v.name));
                                  if (vMatch) {
                                    setInspectingVehicleModal(vMatch);
                                  } else {
                                    setViewingAttachment(msg.attachment!);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Car className="w-3 h-3" /> Inspect Specs
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setViewingAttachment(msg.attachment!)}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition shadow-md shadow-rose-600/20 flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> Full Specs
                            </button>
                          </div>
                        </div>
                      </div>
                      )
                    )}

                    {/* Reaction Buttons */}
                    {!msg.isDeleted && (
                      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none max-w-full pb-0.5">
                        {['👑', '🔥', '🏎️', '👍', '💰'].map(emoji => {
                          const isReactedByMe = (userReactions[msg.id] || []).includes(emoji);
                          const isCrown = emoji === '👑';
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={`px-2 py-0.5 rounded text-[11px] transition flex items-center gap-1 border cursor-pointer shrink-0 whitespace-nowrap ${
                                isCrown
                                  ? isReactedByMe
                                    ? 'bg-amber-500/25 text-amber-200 border-amber-400 font-extrabold shadow-md shadow-amber-500/20'
                                    : 'bg-amber-950/40 hover:bg-amber-500/20 text-amber-300 border-amber-500/40 hover:border-amber-400'
                                  : isReactedByMe
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold shadow-sm shadow-rose-500/10'
                                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                              title={
                                isCrown
                                  ? (isVipUser || isModerator)
                                    ? (isReactedByMe ? 'Remove VIP Crown Reaction' : '👑 Vote as VIP Member')
                                    : '👑 VIP Exclusive Reaction (VIP Members Only)'
                                  : isAuthenticated
                                  ? (isReactedByMe ? 'Remove reaction' : 'Add reaction')
                                  : 'Sign in to react'
                              }
                            >
                              <span>{emoji}</span>
                              {isCrown && (
                                <span className="text-[8px] font-black uppercase text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-400/30">
                                  VIP
                                </span>
                              )}
                              {msg.reactions[emoji] ? (
                                <span className={`font-mono text-[10px] ${isCrown ? 'text-amber-200 font-bold' : ''}`}>
                                  {msg.reactions[emoji]}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
              {isBotTyping && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 my-2 shrink-0">
                  <img src={BOT_AVATAR} alt={BOT_USER_NAME} className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0" />
                  <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ViceSentinel Bot is processing command & typing a reply...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Floating Down Arrow Button for New Messages */}
            {showScrollDownBtn && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-3 right-4 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-full shadow-2xl shadow-rose-600/40 flex items-center gap-1.5 animate-bounce transition z-30 border border-white/20 hover:scale-105 active:scale-95"
              >
                <ChevronDown className="w-4 h-4 stroke-[3]" />
                <span>New Messages {newMessagesCount > 0 ? `(${newMessagesCount})` : ''}</span>
              </button>
            )}
          </div>

          {/* Input Box Form / Auth Banner / Suspended Banner */}
          {!isAuthenticated ? (
            <div className="bg-gradient-to-r from-rose-950/80 via-zinc-900 to-indigo-950/80 border border-rose-500/30 rounded-xl p-3.5 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-rose-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Authentication Required to Join Chat or React</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                You are currently browsing as a guest. Sign in with your Vice City Central account to post live messages and react to community discussions.
              </p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-rose-600/20"
              >
                Sign In / Join Conversation
              </button>
            </div>
          ) : isAccountSuspended ? (
            <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-4 text-center space-y-1.5 animate-pulse">
              <div className="flex items-center justify-center gap-2 text-rose-200 font-black text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Account Suspended by Staff</span>
              </div>
              <p className="text-xs text-rose-300/80">
                Your Vice City account status is set to <strong>Suspended</strong> by staff. Live chat messaging and attachment features are restricted.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-zinc-800 relative">
              {/* Mention Suggestions Popup */}
              {mentionSearch !== null && matchingMentions.length > 0 && (
                <div className="absolute bottom-full left-12 mb-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 z-40 max-h-56 overflow-y-auto w-72 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-rose-400 px-2 py-1 flex items-center justify-between border-b border-zinc-800 pb-1">
                    <span className="flex items-center gap-1">
                      <AtSign className="w-3 h-3" /> Tag GamerTag / Channel
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">#{activeChannel}</span>
                  </div>
                  {matchingMentions.map(username => {
                    const isAllTag = username.toLowerCase() === 'all';
                    return (
                      <button
                        key={username}
                        type="button"
                        onClick={() => handleSelectMention(username)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between group cursor-pointer ${
                          isAllTag
                            ? 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30'
                            : 'hover:bg-rose-600/20 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <AtSign className={`w-3.5 h-3.5 ${isAllTag ? 'text-amber-400' : 'text-rose-400'} group-hover:scale-110 transition`} />
                          <span>@{username}</span>
                        </div>
                        {isAllTag ? (
                          <span className="text-[9px] font-extrabold uppercase bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/40">
                            Notify Channel
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-500 font-mono">Player</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {attachedItem && (
                <div className="bg-gradient-to-r from-indigo-950/90 via-zinc-900 to-indigo-950/90 border border-indigo-500/50 rounded-xl p-2.5 flex items-center justify-between text-xs text-indigo-200 shadow-xl animate-fade-in my-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {attachedItem.imageUrl ? (
                      <img src={attachedItem.imageUrl} alt={attachedItem.title} className="w-10 h-10 rounded-lg object-cover border border-indigo-500/30 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <Paperclip className="w-4 h-4 text-indigo-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 bg-indigo-500/30 text-indigo-200 text-[9px] font-black uppercase rounded border border-indigo-400/30">
                          {attachedItem.badge || attachedItem.type}
                        </span>
                        <span className="font-bold text-white block truncate">{attachedItem.title}</span>
                      </div>
                      <span className="text-[10px] text-indigo-300/90 block truncate">{attachedItem.detail}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenAttachModal}
                      className="px-2 py-1 bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 text-[10px] font-bold rounded-lg border border-indigo-500/30 transition cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachedItem(null)}
                      className="p-1 hover:bg-rose-900/60 rounded text-zinc-400 hover:text-rose-300 font-bold text-sm transition cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Validation & Report Notifications */}
              {contentValidationError && (
                <div className="bg-rose-950/90 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-200 flex items-center justify-between shadow-lg animate-fade-in my-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-semibold">{contentValidationError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContentValidationError(null)}
                    className="text-rose-400 hover:text-white font-bold ml-2 text-sm"
                  >
                    ×
                  </button>
                </div>
              )}

              {reportSuccessToast && (
                <div className="bg-emerald-950/90 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-200 flex items-center justify-between shadow-lg animate-fade-in my-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{reportSuccessToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportSuccessToast(null)}
                    className="text-emerald-400 hover:text-white font-bold ml-2 text-sm"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAttachModal}
                  className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                    attachedItem
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/20'
                      : (!isVipUser && !isModerator)
                      ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-400'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                  title={
                    (!isVipUser && !isModerator)
                      ? 'Buy VIP to attach vehicle specs, RP servers, or loadouts'
                      : 'Attach vehicle setup, RP server, or weapon loadout'
                  }
                >
                  <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold hidden sm:inline">
                    {attachedItem ? 'Change Attachment' : 'Attach Item'}
                  </span>
                  {!isVipUser && !isModerator && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase rounded border border-amber-400/30 flex items-center gap-0.5 ml-0.5 shrink-0">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      <span>Buy VIP</span>
                    </span>
                  )}
                </button>

                <div className="relative flex-1">
                  {/* GTA-THEMED EMOJI PICKER POPOVER */}
                  {isEmojiPickerOpen && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-full right-0 mb-2.5 w-72 sm:w-80 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Smile className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-black text-white font-mono uppercase tracking-wider">
                            GTA VI Vice City Emojis
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEmojiPickerOpen(false)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Category Tabs */}
                      <div className="flex items-center gap-1 pb-2 border-b border-zinc-800/80 mb-2 overflow-x-auto scrollbar-none">
                        {[
                          { id: 'gta', label: '🌴 Vice City' },
                          { id: 'reactions', label: '🔥 Reactions' },
                          { id: 'vehicles', label: '🏎️ Vehicles' },
                          { id: 'roles', label: '👥 Squad' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setEmojiCategory(cat.id as any)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition cursor-pointer border ${
                              emojiCategory === cat.id
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10'
                                : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      {/* Emoji Grid */}
                      <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                        {getGtaEmojiList(emojiCategory).map((item) => (
                          <button
                            key={item.emoji + item.name}
                            type="button"
                            onClick={() => {
                              setInputText((prev) => prev + item.emoji);
                              if (inputRef.current) inputRef.current.focus();
                            }}
                            className="p-1.5 text-base hover:bg-zinc-800/90 rounded-xl transition cursor-pointer flex items-center justify-center hover:scale-125 duration-150"
                            title={item.name}
                          >
                            {item.emoji}
                          </button>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>Click to insert into chat</span>
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <span>Vice City Vibes</span>
                          <span>🌴</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={`Message #${activeChannel}... (Type @ to tag a player)`}
                    value={inputText}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-16 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                  <div className="absolute right-2.5 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                      className={`p-1 rounded-lg transition cursor-pointer ${
                        isEmojiPickerOpen
                          ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                          : 'text-zinc-500 hover:text-amber-400'
                      }`}
                      title="GTA VI Emoji Picker"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!inputText.includes('@')) {
                          setInputText(prev => prev + '@');
                          setMentionSearch('');
                          if (inputRef.current) inputRef.current.focus();
                        }
                      }}
                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                      title="Insert @ tag"
                    >
                      <AtSign className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-rose-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* RICH ATTACHMENT SELECTION MODAL */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 relative max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Attach Asset to Chat
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold uppercase rounded border border-rose-500/30">
                      VIP Feature
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Share verified GTA VI vehicles, weapons, RP server links, POIs, or businesses directly in <span className="text-white font-bold">#{activeChannel}</span>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Nav Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0 border-b border-zinc-800/80">
              {[
                { id: 'vehicles', label: '🏎️ Vehicles', count: VEHICLES_DATA.length },
                { id: 'weapons', label: '🔫 Weapons', count: WEAPONS_DATA.length },
                { id: 'servers', label: '🌐 RP Servers', count: RP_SERVERS_DATA.length },
                { id: 'locations', label: '📍 Map POIs', count: MAP_LOCATIONS_DATA.length },
                { id: 'businesses', label: '💼 Businesses', count: BUSINESSES_DATA.length },
                { id: 'giftcards', label: '🎁 Shark Cards', count: myPurchasedVouchersForChat.filter(v => !v.isRedeemed).length || 'Pack' },
                { id: 'custom', label: '✏️ Custom Link', count: 'New' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setAttachTab(tab.id as any);
                    setAttachSearch('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    attachTab === tab.id
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                    attachTab === tab.id ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Bar for preset tabs */}
            {attachTab !== 'custom' && (
              <div className="relative shrink-0">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={attachSearch}
                  onChange={(e) => setAttachSearch(e.target.value)}
                  placeholder={`Search ${attachTab}...`}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>
            )}

            {/* Items Scroll Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[220px] max-h-[340px]">
              {/* Vehicles Tab */}
              {attachTab === 'vehicles' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {VEHICLES_DATA.filter(v =>
                    v.name.toLowerCase().includes(attachSearch.toLowerCase()) ||
                    v.brand.toLowerCase().includes(attachSearch.toLowerCase()) ||
                    v.category.toLowerCase().includes(attachSearch.toLowerCase())
                  ).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setAttachedItem({
                          type: 'vehicle',
                          title: `${v.brand} ${v.name}`,
                          detail: `${v.category} • Top Speed ${v.topSpeedMph} mph • MSRP $${v.price.toLocaleString('en-US')}`,
                          imageUrl: v.imageUrl,
                          badge: v.category,
                          id: v.id,
                          stats: [
                            { label: 'Top Speed', value: `${v.topSpeedMph} MPH` },
                            { label: 'Price', value: `$${v.price.toLocaleString('en-US')}` },
                            { label: 'Drivetrain', value: v.drivetrain }
                          ],
                          actionType: 'open_vehicle',
                          actionData: v.id
                        });
                        setIsAttachModalOpen(false);
                      }}
                      className="text-left bg-zinc-950 hover:bg-rose-950/30 border border-zinc-800/90 hover:border-rose-500/50 p-2.5 rounded-xl transition flex gap-3 group items-center cursor-pointer"
                    >
                      <img src={v.imageUrl} alt={v.name} className="w-16 h-12 object-cover rounded-lg border border-zinc-800 shrink-0" />
                      <div className="min-w-0 space-y-0.5 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-bold uppercase text-rose-400 bg-rose-500/10 px-1.5 rounded">
                            {v.category}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">${v.price.toLocaleString('en-US')}</span>
                        </div>
                        <p className="font-bold text-xs text-white group-hover:text-rose-300 truncate">{v.brand} {v.name}</p>
                        <p className="text-[10px] text-zinc-400">{v.topSpeedMph} mph • {v.drivetrain}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Weapons Tab */}
              {attachTab === 'weapons' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {WEAPONS_DATA.filter(w =>
                    w.name.toLowerCase().includes(attachSearch.toLowerCase()) ||
                    w.category.toLowerCase().includes(attachSearch.toLowerCase())
                  ).map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setAttachedItem({
                          type: 'weapon',
                          title: w.name,
                          detail: `${w.category} • Damage: ${w.damage}/100 • Fire Rate: ${w.fireRate}/100 • $${w.price.toLocaleString('en-US')}`,
                          imageUrl: w.imageUrl,
                          badge: w.category,
                          id: w.id,
                          stats: [
                            { label: 'Damage', value: `${w.damage}/100` },
                            { label: 'Fire Rate', value: `${w.fireRate}/100` },
                            { label: 'Accuracy', value: `${w.accuracy}/100` }
                          ],
                          actionType: 'open_weapon',
                          actionData: w.id
                        });
                        setIsAttachModalOpen(false);
                      }}
                      className="text-left bg-zinc-950 hover:bg-amber-950/30 border border-zinc-800/90 hover:border-amber-500/50 p-2.5 rounded-xl transition flex gap-3 group items-center cursor-pointer"
                    >
                      <img src={w.imageUrl} alt={w.name} className="w-16 h-12 object-cover rounded-lg border border-zinc-800 shrink-0" />
                      <div className="min-w-0 space-y-0.5 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-bold uppercase text-amber-400 bg-amber-500/10 px-1.5 rounded">
                            {w.category}
                          </span>
                          <span className="text-[10px] font-mono text-amber-300 font-bold">${w.price.toLocaleString('en-US')}</span>
                        </div>
                        <p className="font-bold text-xs text-white group-hover:text-amber-300 truncate">{w.name}</p>
                        <p className="text-[10px] text-zinc-400">Damage {w.damage} • {w.attachments.length} Attachments</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* RP Servers Tab */}
              {attachTab === 'servers' && (
                <div className="space-y-2">
                  {RP_SERVERS_DATA.filter(s =>
                    s.name.toLowerCase().includes(attachSearch.toLowerCase()) ||
                    (s.tags && s.tags.some(t => t.toLowerCase().includes(attachSearch.toLowerCase())))
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setAttachedItem({
                          type: 'server',
                          title: s.name,
                          detail: `${s.playerCount}/${s.maxPlayers} Online • ${s.region} • ${s.connectUrl}`,
                          imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
                          badge: s.tags[0] || 'RP Server',
                          id: s.id,
                          stats: [
                            { label: 'Online', value: `${s.playerCount}/${s.maxPlayers}` },
                            { label: 'Region', value: s.region },
                            { label: 'Framework', value: s.framework }
                          ],
                          actionType: 'copy_connect',
                          actionData: s.connectUrl
                        });
                        setIsAttachModalOpen(false);
                      }}
                      className="w-full text-left bg-zinc-950 hover:bg-emerald-950/30 border border-zinc-800/90 hover:border-emerald-500/50 p-3 rounded-xl transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold shrink-0">
                          <Globe className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase rounded border border-emerald-500/30">
                              {s.tags[0] || 'RP Server'}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">● {s.playerCount}/{s.maxPlayers}</span>
                          </div>
                          <p className="font-bold text-xs text-white group-hover:text-emerald-300 truncate">{s.name}</p>
                          <p className="text-[10px] font-mono text-zinc-400 truncate">{s.connectUrl}</p>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-bold group-hover:translate-x-0.5 transition shrink-0">Attach →</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Locations Tab */}
              {attachTab === 'locations' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {MAP_LOCATIONS_DATA.filter(l =>
                    l.title.toLowerCase().includes(attachSearch.toLowerCase()) ||
                    l.district.toLowerCase().includes(attachSearch.toLowerCase())
                  ).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setAttachedItem({
                          type: 'location',
                          title: l.title,
                          detail: `${l.district} • ${l.description}`,
                          imageUrl: l.imageUrl || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80',
                          badge: l.district,
                          id: l.id,
                          stats: [
                            { label: 'District', value: l.district },
                            { label: 'Type', value: l.category }
                          ],
                          actionType: 'open_map',
                          actionData: l.id
                        });
                        setIsAttachModalOpen(false);
                      }}
                      className="text-left bg-zinc-950 hover:bg-cyan-950/30 border border-zinc-800/90 hover:border-cyan-500/50 p-2.5 rounded-xl transition flex gap-3 group items-center cursor-pointer"
                    >
                      <img src={l.imageUrl || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80'} alt={l.title} className="w-14 h-12 object-cover rounded-lg border border-zinc-800 shrink-0" />
                      <div className="min-w-0 space-y-0.5 flex-1">
                        <span className="text-[9px] font-bold uppercase text-cyan-400 bg-cyan-500/10 px-1.5 rounded">
                          {l.district}
                        </span>
                        <p className="font-bold text-xs text-white group-hover:text-cyan-300 truncate">{l.title}</p>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">{l.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Businesses Tab */}
              {attachTab === 'businesses' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUSINESSES_DATA.filter(b =>
                    b.name.toLowerCase().includes(attachSearch.toLowerCase()) ||
                    b.location.toLowerCase().includes(attachSearch.toLowerCase()) ||
                    b.type.toLowerCase().includes(attachSearch.toLowerCase())
                  ).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setAttachedItem({
                          type: 'business',
                          title: b.name,
                          detail: `${b.location} • Price: $${b.purchasePrice.toLocaleString('en-US')} • Max Yield: $${b.maxDailyIncome.toLocaleString('en-US')}/day`,
                          imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
                          badge: b.type,
                          id: b.id,
                          stats: [
                            { label: 'Price', value: `$${b.purchasePrice.toLocaleString('en-US')}` },
                            { label: 'Daily Yield', value: `$${b.maxDailyIncome.toLocaleString('en-US')}` }
                          ],
                          actionType: 'open_business',
                          actionData: b.id
                        });
                        setIsAttachModalOpen(false);
                      }}
                      className="text-left bg-zinc-950 hover:bg-emerald-950/30 border border-zinc-800/90 hover:border-emerald-500/50 p-2.5 rounded-xl transition flex gap-3 group items-center cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold shrink-0">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0 space-y-0.5 flex-1">
                        <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-1.5 rounded">
                          {b.type}
                        </span>
                        <p className="font-bold text-xs text-white group-hover:text-emerald-300 truncate">{b.name}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">+${b.maxDailyIncome.toLocaleString('en-US')}/day</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Shark Cards Tab */}
              {attachTab === 'giftcards' && (
                <div className="space-y-4 text-xs">
                  {/* My Purchased Vouchers Section */}
                  {currentUser ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold text-amber-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Gift className="w-4 h-4 text-amber-400" /> My Purchased Unredeemed Vouchers</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{myPurchasedVouchersForChat.filter(v => !v.isRedeemed).length} Available</span>
                      </h4>

                      {isLoadingMyVouchersForChat ? (
                        <div className="p-4 text-center text-zinc-400 font-mono text-xs flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Loading your vouchers...
                        </div>
                      ) : myPurchasedVouchersForChat.filter(v => !v.isRedeemed).length === 0 ? (
                        <div className="p-4 text-center bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                          <p className="text-xs font-bold text-zinc-400">You don't have any unredeemed purchased vouchers on your account.</p>
                          <p className="text-[11px] text-zinc-500">Purchased Shark Cards from the Store tab will appear here so you can share them with community members.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {myPurchasedVouchersForChat.filter(v => !v.isRedeemed).map((v) => (
                            <button
                              key={v.id || v.code}
                              type="button"
                              onClick={() => {
                                setAttachedItem({
                                  type: 'giftcard',
                                  title: `🎁 ${v.tier || 'Shark Card Voucher'}`,
                                  detail: `Voucher Code: ${v.code} • +${v.cashValue.toLocaleString('en-US')} VC Balance`,
                                  badge: 'Shark Card',
                                  actionType: 'claim_giftcard',
                                  actionData: v.code,
                                  giftcardCode: v.code,
                                  giftcardVcValue: v.cashValue,
                                  giftcardTier: v.tier,
                                  giftcardVipDays: v.vipDaysGranted || 0
                                });
                                setIsAttachModalOpen(false);
                              }}
                              className="text-left bg-zinc-950 hover:bg-amber-950/30 border border-zinc-800 hover:border-amber-500/50 p-2.5 rounded-xl transition space-y-1 group cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white group-hover:text-amber-300 truncate">{v.tier}</span>
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">+{v.cashValue.toLocaleString('en-US')} VC</span>
                              </div>
                              <p className="font-mono text-[10px] text-amber-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 truncate">{v.code}</p>
                              <span className="text-[9px] text-zinc-500 block">Click to attach to chat →</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 text-xs flex items-center justify-between">
                      <span>Sign in to attach your purchased vouchers directly!</span>
                      <button onClick={onOpenAuth} className="text-rose-400 font-bold hover:underline">Sign In</button>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Link / Note Form */}
              {attachTab === 'custom' && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Custom Attachment Spec
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Asset Title *</label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g. Custom Ocean Drive Drag Setup v2"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={customBadge}
                        onChange={(e) => setCustomBadge(e.target.value)}
                        placeholder="e.g. Heist Spec / Custom Build / Guild Link"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Specification Details *</label>
                      <textarea
                        value={customDetail}
                        onChange={(e) => setCustomDetail(e.target.value)}
                        placeholder="e.g. Stage 3 Turbo • Nitrous • AWD Drivetrain • 185 mph top speed..."
                        rows={2}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Image URL (Optional)</label>
                      <input
                        type="text"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!customTitle.trim() || !customDetail.trim()}
                    onClick={() => {
                      setAttachedItem({
                        type: 'custom',
                        title: customTitle.trim(),
                        detail: customDetail.trim(),
                        badge: customBadge.trim() || 'Custom Spec',
                        imageUrl: customImageUrl.trim() || undefined,
                      });
                      setIsAttachModalOpen(false);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    Attach Custom Asset
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEWING ATTACHMENT FULL INSPECTION MODAL */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            {/* Header Banner Image if available */}
            {viewingAttachment.imageUrl ? (
              <div className="relative h-48 w-full bg-zinc-950 overflow-hidden">
                <img src={viewingAttachment.imageUrl} alt={viewingAttachment.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                <button
                  onClick={() => setViewingAttachment(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-950/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition z-10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase rounded border border-rose-500/30 backdrop-blur-md">
                    {viewingAttachment.badge || viewingAttachment.type}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1 drop-shadow-md">{viewingAttachment.title}</h3>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase rounded border border-indigo-500/30">
                    {viewingAttachment.badge || viewingAttachment.type}
                  </span>
                  <h3 className="text-sm font-bold text-white">{viewingAttachment.title}</h3>
                </div>
                <button
                  onClick={() => setViewingAttachment(null)}
                  className="text-zinc-500 hover:text-white text-lg font-bold cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-5 space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2.5 text-xs">
                <div>
                  <h4 className="font-extrabold text-white text-sm">{viewingAttachment.title}</h4>
                  <p className="text-zinc-400 leading-relaxed mt-0.5">{viewingAttachment.detail}</p>
                </div>

                {viewingAttachment.stats && viewingAttachment.stats.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
                    {viewingAttachment.stats.map((st, i) => (
                      <div key={i} className="bg-zinc-900 p-2 rounded-lg border border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 font-bold block uppercase">{st.label}</span>
                        <span className="text-xs font-mono font-extrabold text-rose-300">{st.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Vice City Central Community Asset
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {viewingAttachment.actionType === 'copy_connect' && viewingAttachment.actionData && (
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard(viewingAttachment.actionData!);
                      setCopySuccessToast('Copied F8 connect string to clipboard!');
                      setTimeout(() => setCopySuccessToast(null), 3000);
                    }}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" /> Copy F8 Connect Command
                  </button>
                )}

                {viewingAttachment.type === 'vehicle' && (
                  <button
                    type="button"
                    onClick={() => {
                      const vMatch = VEHICLES_DATA.find(v => v.id === viewingAttachment?.actionData || v.name === viewingAttachment?.title || viewingAttachment?.title.includes(v.name));
                      if (vMatch) {
                        setInspectingVehicleModal(vMatch);
                        setViewingAttachment(null);
                      }
                    }}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Car className="w-4 h-4" /> Inspect Vehicle Specs
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setViewingAttachment(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Copy Toast */}
      {copySuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/60 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copySuccessToast}</span>
        </div>
      )}

      {/* Floating Voucher Claim Toast */}
      {voucherClaimToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-bounce border ${
          voucherClaimToast.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200'
            : 'bg-rose-950/95 border-rose-500/60 text-rose-200'
        }`}>
          {voucherClaimToast.type === 'success' ? (
            <Sparkles className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{voucherClaimToast.message}</span>
        </div>
      )}

      {/* Vehicle Inspector Modal */}
      {inspectingVehicleModal && (
        <VehicleDetailModal
          vehicle={inspectingVehicleModal}
          onClose={() => setInspectingVehicleModal(null)}
          onCompare={() => {}}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-base font-bold text-white">
                {deleteConfirmTarget.isOwn ? 'Delete Your Message?' : 'Delete Community Message?'}
              </h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {deleteConfirmTarget.isOwn
                ? 'Are you sure you want to delete your message? It will be marked as deleted in the chat room.'
                : `Moderator Action: Are you sure you want to delete this message posted by ${deleteConfirmTarget.authorName}?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const { messageId, authorName, isOwn } = deleteConfirmTarget;
                  setDeleteConfirmTarget(null);
                  executeDeleteMessage(messageId, authorName, isOwn);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTERNAL LINK SAFETY INTERSTITIAL MODAL */}
      {externalLinkModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${externalLinkModalTarget.badgeColor}`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">External Link Safety Notice</h3>
                  <p className="text-[11px] text-zinc-400">You are about to leave Vice City Central</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExternalLinkModalTarget(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-zinc-400">Target Destination:</span>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border ${externalLinkModalTarget.badgeColor}`}>
                  {externalLinkModalTarget.categoryLabel}
                </span>
              </div>
              <p className="text-xs font-mono text-sky-400 break-all bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 select-all">
                {externalLinkModalTarget.fullUrl}
              </p>
            </div>

            {/* Safety Tips Checklist */}
            <div className="space-y-2 text-xs text-zinc-300 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Security Guidelines for Community Links:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-zinc-300 list-disc list-inside">
                <li><strong className="text-white">Never enter passwords:</strong> Vice City staff will never ask for your password or credentials on external sites.</li>
                <li><strong className="text-white">Avoid executable files:</strong> Do not download or run unexpected <code className="text-rose-300">.exe</code>, <code className="text-rose-300">.bat</code>, or <code className="text-rose-300">.scr</code> files.</li>
                <li><strong className="text-white">Beware of phishing scams:</strong> Report any site offering fake free Shark Cards, free GTA 6 keys, or Discord Nitro gifts.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setExternalLinkModalTarget(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Return to Safe Chat
              </button>
              <a
                href={externalLinkModalTarget.fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setExternalLinkModalTarget(null)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
              >
                <span>Proceed to External Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT MODAL */}
      {reportModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Flag className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Report Message to Moderators</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportModalTarget(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Help maintain a safe community. Reports are instantly queued for review by Vice City staff.
            </p>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Reported Message (by {reportModalTarget.authorName}):</span>
              <p className="text-xs text-zinc-300 italic line-clamp-2">"{reportModalTarget.text}"</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">Violation Reason:</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="adult">Adult / Explicit NSFW Content</option>
                <option value="phishing">Phishing Link / Scam / Fake Giveaway</option>
                <option value="spam">Spam / Unsolicited Promotion</option>
                <option value="harassment">Harassment / Hate Speech / Impersonation</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">Additional Details (Optional):</label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Explain why this content violates community safety guidelines..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 h-20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setReportModalTarget(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reportSubmitting}
                onClick={handleSendReport}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/30 disabled:opacity-50"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{reportSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIP LOCK MODAL */}
      {vipLockModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 shrink-0">
                  <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{vipLockModalTarget.title}</h3>
                  <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                    VIP Member Exclusive
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVipLockModalTarget(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
              {vipLockModalTarget.message}
            </p>

            <div className="bg-gradient-to-r from-amber-950/60 via-zinc-900 to-amber-950/60 p-3.5 rounded-xl border border-amber-500/30 space-y-2 text-xs">
              <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>VIP Member Perks:</span>
              </div>
              <ul className="text-[11px] text-zinc-300 space-y-1 list-disc list-inside">
                <li>Attach vehicle builds, RP server links & loadouts</li>
                <li>Vote with exclusive Gold Crown (👑) VIP reactions</li>
                <li>Display glowing VIP GamerTag badge in live chat</li>
                <li>Priority queue for community events & server listings</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setVipLockModalTarget(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={isUpgradingVip}
                onClick={handleUpgradeToVip}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/30 disabled:opacity-50"
              >
                <Crown className="w-4 h-4 fill-black" />
                <span>{isUpgradingVip ? 'Upgrading Account...' : '👑 Get VIP Access Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN CHANNEL BY CODE OR LINK MODAL */}
      {isJoinChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-indigo-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                  <Key className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Join Community Hub</h3>
                  <span className="text-[10px] font-mono text-zinc-400">Enter invite code or shareable URL</span>
                </div>
              </div>
              <button
                onClick={() => setIsJoinChannelModalOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Paste a share link or enter a 4-digit invite code (e.g. <span className="text-amber-300 font-mono font-bold">HUB-VIP-7709</span>) to join an extra community channel.
            </p>

            <form onSubmit={handleJoinChannelByCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">Invite Code or Link:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HUB-VIP-7709 or https://viceintel.app/chat?channel=..."
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                <span className="font-bold text-indigo-400 block flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" /> Default Channels vs Extra Channels:
                </span>
                <p>Everyone stays in the 4 default community channels. Extra custom channels are only listed once joined or invited!</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsJoinChannelModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-indigo-950/50 flex items-center gap-1.5"
                >
                  <Key className="w-4 h-4 text-indigo-200" />
                  <span>Join Extra Hub</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM VIP CHANNEL MODAL */}
      {isCreateChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 shrink-0">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Create Private or Public Community Hub</h3>
                  <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                    VIP Member Feature
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateChannelModalOpen(false)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">Hub Name:</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-mono">#</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ocean-drive-crew"
                    value={newChannelForm.name}
                    onChange={(e) => setNewChannelForm({ ...newChannelForm, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">Description:</label>
                <textarea
                  rows={2}
                  placeholder="What is this squad or crew about?"
                  value={newChannelForm.description}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="space-y-2 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                <label className="text-xs font-bold text-white block">Access Control:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewChannelForm({ ...newChannelForm, isPrivate: true })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                      newChannelForm.isPrivate
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Lock className="w-3.5 h-3.5 text-amber-400" /> Private Channel
                    </div>
                    <span className="text-[10px] text-zinc-400">Requires VIP creator approval to join.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewChannelForm({ ...newChannelForm, isPrivate: false })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                      !newChannelForm.isPrivate
                        ? 'bg-sky-950/40 border-sky-500 text-sky-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Globe className="w-3.5 h-3.5 text-sky-400" /> Public Channel
                    </div>
                    <span className="text-[10px] text-zinc-400">Open for all community players to join.</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateChannelModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/30 flex items-center gap-1.5"
                >
                  <Crown className="w-4 h-4 fill-black" />
                  <span>Launch Community Hub</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CUSTOM VIP CHANNEL MODAL (FOR CREATOR) */}
      {managingChannel && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Manage #{managingChannel.name}
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Creator Dashboard • {managingChannel.isPrivate ? '🔒 Private' : '🌐 Public'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingChannel(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Shareable Invite Link */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider block">
                Shareable Invite Link & Code
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://${window.location.host}/chat?channel=${managingChannel.id}&invite=${managingChannel.inviteCode}`}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 font-mono select-all"
                />
                <button
                  onClick={() => handleCopyShareLink(managingChannel)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedShareLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Pending Join Requests (For Private Channels) */}
            {managingChannel.isPrivate && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-amber-400" /> Pending Join Requests
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {(managingChannel.pendingRequests || []).length}
                  </span>
                </div>

                {(managingChannel.pendingRequests || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-center">
                    No active pending access requests.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(managingChannel.pendingRequests || []).map((req) => (
                      <div
                        key={req.userId}
                        className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <img src={req.avatar} alt={req.username} className="w-7 h-7 rounded-full object-cover border border-zinc-700" />
                          <div>
                            <span className="text-xs font-bold text-white block">@{req.username}</span>
                            <span className="text-[10px] text-zinc-500">{req.requestedAt}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApproveJoinRequest(managingChannel.id, req.username)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeclineJoinRequest(managingChannel.id, req.username)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold rounded-lg transition cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Current Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" /> Active Hub Members
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono font-bold">
                  {(managingChannel.members || []).length}
                </span>
              </div>

              {(managingChannel.members || []).length === 0 ? (
                <p className="text-xs text-zinc-500 italic bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-center">
                  No active members in this hub.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(managingChannel.members || []).map((m) => {
                    const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
                    const isCreatorMember = m === managingChannel.creatorName;
                    const isChannelAdminMember = (managingChannel.admins || []).includes(m);

                    const currentUserIsCreator = managingChannel.creatorName === activeUsername ||
                                                (currentUser?.uid && managingChannel.creatorId === currentUser.uid);
                    const currentUserIsChanAdmin = (managingChannel.admins || []).includes(activeUsername) ||
                                                  (currentUser?.uid && (managingChannel.admins || []).includes(currentUser.uid));
                    const canModerate = currentUserIsCreator || currentUserIsChanAdmin || isModerator || isAdminUser;
                    const canActOnUser = canModerate && !isCreatorMember && m !== activeUsername;

                    return (
                      <div
                        key={m}
                        className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 font-extrabold text-[10px] flex items-center justify-center border border-zinc-700 shrink-0">
                            {m.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-white font-mono">@{m}</span>
                          {isCreatorMember && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase">
                              Creator
                            </span>
                          )}
                          {isChannelAdminMember && !isCreatorMember && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black uppercase flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5 text-indigo-400" /> Admin
                            </span>
                          )}
                          {m === activeUsername && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[9px] font-bold">
                              You
                            </span>
                          )}
                        </div>

                        {canActOnUser && (
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <button
                              type="button"
                              onClick={() => handleToggleAdminPower(managingChannel.id, m)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer border ${
                                isChannelAdminMember
                                  ? 'bg-purple-950/60 hover:bg-purple-900 text-purple-300 border-purple-500/40'
                                  : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/40'
                              }`}
                              title={isChannelAdminMember ? `Revoke Channel Admin powers from @${m}` : `Grant Channel Admin powers to @${m}`}
                            >
                              <Shield className="w-3 h-3 text-indigo-400" />
                              <span>{isChannelAdminMember ? 'Revoke Admin' : 'Make Admin'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleKickMember(managingChannel.id, m)}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                              title={`Kick @${m} from channel`}
                            >
                              <UserX className="w-3 h-3 text-amber-400" />
                              <span>Kick</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBanMember(managingChannel.id, m)}
                              className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                              title={`Ban @${m} from channel`}
                            >
                              <ShieldAlert className="w-3 h-3 text-rose-400" />
                              <span>Ban</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Banned Users List */}
            {((managingChannel.bannedUsers || []).length > 0 ||
              managingChannel.creatorName === (currentUser?.displayName || currentUser?.email?.split('@')[0]) ||
              isModerator) && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <UserX className="w-4 h-4 text-rose-400" /> Banned Hub Users
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono font-bold border border-rose-500/30">
                    {(managingChannel.bannedUsers || []).length}
                  </span>
                </div>

                {(managingChannel.bannedUsers || []).length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                    No users currently banned from this hub.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {(managingChannel.bannedUsers || []).map((bannedUser) => {
                      const activeUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
                      const canModerate = managingChannel.creatorName === activeUsername ||
                                          (currentUser?.uid && managingChannel.creatorId === currentUser.uid) ||
                                          isModerator;

                      return (
                        <div
                          key={bannedUser}
                          className="bg-rose-950/20 p-2 rounded-xl border border-rose-500/30 flex items-center justify-between gap-2"
                        >
                          <span className="text-xs font-bold text-rose-300 font-mono">@{bannedUser}</span>
                          {canModerate && (
                            <button
                              type="button"
                              onClick={() => handleUnbanMember(managingChannel.id, bannedUser)}
                              className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-lg transition cursor-pointer"
                            >
                              Unban User
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Request Staff Deletion or Direct Delete */}
            {(() => {
              const currentActiveUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
              const canDeleteHubDirect = isAdminUser || isStaffUser || managingChannel.creatorName === currentActiveUsername || managingChannel.creatorId === (currentUser?.uid || '');

              return (
                <div className="bg-rose-950/30 border border-rose-500/40 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400" /> Channel Deletion Controls
                    </span>
                    <span className="text-[10px] text-zinc-400 italic">
                      {canDeleteHubDirect ? 'Authorized Manager' : 'Staff Authorization Required'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Deleting a channel permanently removes all messages, chat logs, and member permissions across Vice City servers.
                  </p>
                  {canDeleteHubDirect ? (
                    <button
                      type="button"
                      onClick={() => handleDirectDeleteChannel(managingChannel)}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Hub Permanently</span>
                    </button>
                  ) : managingChannel.deletionRequested ? (
                    <div className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/30 text-center">
                      ⏳ Deletion Request Pending Staff Review
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestStaffDeletion(managingChannel)}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Request Staff Deletion</span>
                    </button>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setManagingChannel(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OBS STUDIO RTMP SETUP GUIDE MODAL */}
      {showObsGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Video className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">OBS Studio YouTube Stream Setup</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowObsGuideModal(false)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Stream your GTA VI Vice City gameplay live to the community with ultra-low latency:
            </p>

            <div className="space-y-2.5 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-sans">1. RTMP Server URL:</span>
                <span className="text-emerald-400">rtmp://a.rtmp.youtube.com/live2</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-sans">2. Stream Key Format:</span>
                <span className="text-indigo-300">xxxx-xxxx-xxxx-xxxx-xxxx</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-sans">3. Recommended OBS Video Settings:</span>
                <span className="text-amber-300">1080p60 • Bitrate: 6000 Kbps • Encoder: NVENC / QuickSync</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Once you start streaming on YouTube, copy your live video link or video ID (e.g. <code className="text-rose-300">QdBZY2fkU-0</code>) into the "Stream Custom Video" box above to broadcast live inside Vice City Central!
            </p>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowObsGuideModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ULTRA-LOW CPU VOICE COMMS OVERLAY HUD */}
      {isVoiceConnected && activeVoiceChannel && (
        <div className="fixed bottom-4 left-4 z-40 bg-zinc-950/90 border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md max-w-xs w-full space-y-2 animate-bounce-subtle">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <button
                onClick={() => setIsVoiceRoomModalOpen(true)}
                className="text-xs font-extrabold text-white flex items-center gap-1 hover:text-emerald-300 transition cursor-pointer"
                title="Click to open Voice Room Roster & Settings"
              >
                🎙️ Vice Voice Comms • #{activeVoiceChannel}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                {(voiceRooms[activeVoiceChannel] || []).length} In Call
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30 font-semibold" title="Session Duration">
                ⏱️ {formatVoiceDuration(voiceDurationSec)}
              </span>
            </div>
          </div>

          {/* Sound Wave Equalizer animation */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-1">
              <div className="w-1 bg-emerald-400 h-3 animate-pulse rounded-full" />
              <div className="w-1 bg-emerald-400 h-5 animate-ping rounded-full" />
              <div className="w-1 bg-emerald-400 h-2 animate-pulse rounded-full" />
              <div className="w-1 bg-emerald-400 h-6 animate-ping rounded-full" />
              <div className="w-1 bg-emerald-400 h-3 animate-pulse rounded-full" />
              <span className="text-[10px] text-zinc-300 font-mono ml-2">
                {isMuted ? 'Microphone Muted' : 'Audio Live'}
              </span>
            </div>

            <button
              onClick={() => setIsVoiceRoomModalOpen(true)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-amber-400 transition cursor-pointer"
              title="Open Voice Room Control Center"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Voice Participants Avatars */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {(voiceRooms[activeVoiceChannel] || []).map((p) => (
              <div key={p.userId || p.username} className="relative shrink-0" title={`@${p.username}`}>
                <img
                  src={p.avatar}
                  alt={p.username}
                  className={`w-6 h-6 rounded-full object-cover border ${
                    p.isSpeaking
                      ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                      : p.isForceMuted
                      ? 'border-rose-500 opacity-50'
                      : 'border-zinc-700'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Microphone Permission Required Alert Banner */}
          {micPermissionState !== 'granted' && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs my-1">
              <div className="flex items-center justify-between gap-1.5 text-amber-300 font-extrabold text-[11px]">
                <div className="flex items-center gap-1.5">
                  <MicOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Microphone (Listen-Only Mode Active)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMicPermissionState('granted')}
                  className="text-zinc-400 hover:text-white text-[10px] cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                You are currently in listen-only mode. Click below to enable microphone or open in a standalone tab.
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => startMicCaptureAndVAD(activeVoiceChannel || 'general')}
                  disabled={micPermissionState === 'requesting'}
                  className="py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-3 h-3" />
                  <span>{micPermissionState === 'requesting' ? 'Requesting...' : 'Enable Mic'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const targetUrl = `${window.location.origin}/?popout=true&channel=${encodeURIComponent(activeVoiceChannel || activeChannel || 'general')}`;
                      window.open(targetUrl, '_blank');
                    }
                  }}
                  className="py-1 px-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open New Tab</span>
                </button>
              </div>
            </div>
          )}

          {/* Micro Mute / Deafen controls */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleMuteSelf}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  isMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                onClick={handleToggleDeafenSelf}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  isDeafened ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
                title={isDeafened ? 'Undeafen Audio' : 'Deafen Audio'}
              >
                {isDeafened ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>

            <button
              onClick={handleDisconnectVoice}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg transition cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* EXPANDED VOICE & VIDEO ROOM STAGE MODAL (SINGLE UNIFIED 90 FPS STAGE) */}
      {isVoiceRoomModalOpen && (() => {
        const currentVoiceChan = activeVoiceChannel || activeChannel;
        const currentParticipants = voiceRooms[currentVoiceChan] || [];
        const activeUserTag = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'ViceCityPlayer';
        const activeCustomChan = customChannels.find(c => c.id === currentVoiceChan);
        const isChanOwner = activeCustomChan?.creatorName === activeUserTag || (currentUser?.uid && activeCustomChan?.creatorId === currentUser.uid);
        const canMuteAll = isModerator || isChanOwner;

        return (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in overflow-hidden">
            <div
              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-[98vw] max-w-7xl h-[90vh] md:h-[92vh] flex flex-col shadow-2xl relative overflow-hidden"
            >
              
              {/* TOP HEADER DOCK */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-900/90 border-b border-zinc-800/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                    <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                        <span className="text-emerald-400 font-mono">#</span>
                        <span>{currentVoiceChan}</span>
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                        {currentParticipants.length} Connected
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30 flex items-center gap-1">
                        <span>⏱️</span>
                        <span>{formatVoiceDuration(voiceDurationSec)}</span>
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30 hidden md:inline-flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-400 animate-pulse" />
                        <span>90 FPS Ultra-Smooth • GPU Direct Passthrough</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Room Mute Toggle for Owner/Moderator */}
                  {canMuteAll && (() => {
                    const isRoomMuted = currentParticipants.some(
                      p => p.isForceMuted && p.username !== activeUserTag && p.userLevel !== 'Admin' && p.userLevel !== 'Staff'
                    );

                    return isRoomMuted ? (
                      <button
                        type="button"
                        onClick={() => handleServerUnmuteAll(currentVoiceChan)}
                        className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Server Unmute all participants"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Unmute Room</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleServerMuteAll(currentVoiceChan)}
                        className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Server Mute all participants"
                      >
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        <span className="hidden sm:inline">Mute Room</span>
                      </button>
                    );
                  })()}

                  {/* Open in New Tab Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const targetUrl = `${window.location.origin}/?popout=true&channel=${encodeURIComponent(currentVoiceChan)}`;
                        window.open(targetUrl, '_blank');
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-950/40"
                    title="Open Voice Call in New Standalone Tab (Full Mic & Hardware Access)"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Open in New Tab</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVoiceRoomModalOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer ml-1"
                    title="Minimize Call Stage"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* VOICE ROOM CONTROL CENTER & PARTICIPANT ROSTER */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-5 bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950">

                {/* 1. STUDIO-GRADE AUDIO PERFORMANCE & HARDWARE ENGINE CARD */}
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Left: Mic VAD Equalizer & Level Bar */}
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isMuted
                          ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
                          : micVolumeLevel > 10
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 ring-4 ring-emerald-500/20 scale-105'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                      }`}>
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </div>
                      {micVolumeLevel > 10 && !isMuted && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950 animate-ping" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-[180px] sm:min-w-[220px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-extrabold text-white flex items-center gap-1.5 font-mono">
                          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span>Mic Level</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">{isMuted ? 'Muted' : `${micVolumeLevel}%`}</span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-75 ${
                            isMuted ? 'bg-rose-500/50 w-0' : micVolumeLevel > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${isMuted ? 0 : micVolumeLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Middle: Noise Suppression & Audio Features Toggle */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !noiseSuppression;
                        setNoiseSuppression(next);
                        setVoiceToast(next ? '✨ Studio Noise Suppression Enabled' : '🔇 Raw Audio Mode Enabled');
                        setTimeout(() => setVoiceToast(null), 3000);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition cursor-pointer ${
                        noiseSuppression
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                      }`}
                      title="Toggle 48kHz WebAudio Studio Noise Suppression"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Noise Filter: {noiseSuppression ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Output Master Volume Slider */}
                    <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800">
                      <Volume2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isDeafened ? 0 : outputVolume}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setOutputVolume(val);
                          if (isDeafened && val > 0) setIsDeafened(false);
                        }}
                        className="w-20 sm:w-24 accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                        title="Master Headphone Volume"
                      />
                      <span className="text-[10px] font-mono text-zinc-400 min-w-[28px] text-right">{isDeafened ? 'Mute' : `${outputVolume}%`}</span>
                    </div>
                  </div>
                </div>

                {/* 2. PARTICIPANTS VOICE ROSTER GRID */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-extrabold text-zinc-300 tracking-wider uppercase flex items-center gap-2 font-mono">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Connected Channel Members ({currentParticipants.length})</span>
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      Studio 48kHz HD Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentParticipants.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-xs text-zinc-500 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
                        No other channel members connected
                      </div>
                    ) : (
                      currentParticipants.map((participant) => {
                        const isSelf = participant.username === activeUserTag;
                        const canModerateUser = (isModerator || isChanOwner) && !isSelf && participant.userLevel !== 'Admin';
                        const userVol = participantVolumes[participant.userId || participant.username] ?? 100;

                        return (
                          <div
                            key={participant.userId || participant.username}
                            className={`p-3.5 bg-zinc-900/90 border rounded-2xl flex flex-col justify-between gap-3 relative transition-all duration-200 group hover:border-zinc-700 shadow-md ${
                              participant.isSpeaking
                                ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-950/20'
                                : 'border-zinc-800/90'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0">
                                  <img
                                    src={participant.avatar}
                                    alt={participant.username}
                                    className={`w-11 h-11 rounded-full object-cover border-2 shadow ${
                                      participant.isSpeaking
                                        ? 'border-emerald-400 ring-4 ring-emerald-500/30 scale-105'
                                        : 'border-zinc-700'
                                    }`}
                                  />
                                  {participant.isSpeaking && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                    </span>
                                  )}
                                </div>

                                <div className="min-w-0 flex flex-col">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-extrabold text-white truncate font-mono">@{participant.username}</span>
                                    {isSelf && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 shrink-0">You</span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-extrabold border ${
                                      participant.userLevel === 'Admin'
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                        : participant.userLevel === 'Staff'
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                        : participant.userLevel === 'L2 VIP'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                    }`}>
                                      {participant.userLevel || 'User'}
                                    </span>

                                    <span className="text-[10px] text-zinc-400 font-mono">
                                      {participant.isMuted ? '🔇 Muted' : participant.isSpeaking ? '🎙️ Speaking' : '🎧 Connected'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Individual User Volume Control (Non-Self) */}
                              {!isSelf && (
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
                                    <Volume1 className="w-3 h-3 text-zinc-400" />
                                    <input
                                      type="range"
                                      min="0"
                                      max="200"
                                      value={userVol}
                                      onChange={(e) => {
                                        const v = Number(e.target.value);
                                        const pId = participant.userId || participant.username;
                                        setParticipantVolumes(prev => ({ ...prev, [pId]: v }));
                                        if (remoteAudioElementsRef.current[pId]) {
                                          remoteAudioElementsRef.current[pId].volume = Math.max(0, Math.min(1, (v / 100) * (outputVolume / 100)));
                                        }
                                      }}
                                      className="w-14 accent-emerald-500 cursor-pointer h-1 bg-zinc-800 rounded"
                                      title={`Adjust @${participant.username} volume`}
                                    />
                                    <span className="text-[9px] font-mono text-zinc-400 w-6 text-right">{userVol}%</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Moderation Toolbar for Staff/Owner */}
                            {canModerateUser && (
                              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleForceMuteParticipant(participant.username, currentVoiceChan); }}
                                  className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1 cursor-pointer transition"
                                  title={`Mute @${participant.username} for everyone`}
                                >
                                  <MicOff className="w-3 h-3 text-rose-400" />
                                  <span>Server Mute</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleKickParticipantFromVoice(participant.username, currentVoiceChan); }}
                                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 cursor-pointer transition"
                                  title={`Kick @${participant.username} from channel`}
                                >
                                  <UserMinus className="w-3 h-3 text-amber-400" />
                                  <span>Kick</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* STUDIO VOICE BOTTOM CONTROL DOCK */}
              <div className="px-4 py-3 bg-zinc-900/90 border-t border-zinc-800/80 shrink-0 flex items-center justify-between gap-4">
                {/* Left: Device Audio Status Info */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>48kHz HD Audio • Low Latency WebRTC Active</span>
                </div>

                {/* Center: Main Media Toggle Controls */}
                <div className="flex items-center gap-2 sm:gap-3 mx-auto">
                  {/* Mic Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleMuteSelf}
                    className={`p-3 rounded-full border transition-all cursor-pointer shadow-lg ${
                      isMuted
                        ? 'bg-rose-600/20 text-rose-300 border-rose-500/50 hover:bg-rose-600/30'
                        : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/30'
                    }`}
                    title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {isMuted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5 text-emerald-400" />}
                  </button>

                  {/* Deafen Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleDeafenSelf}
                    className={`p-3 rounded-full border transition-all cursor-pointer shadow-lg ${
                      isDeafened
                        ? 'bg-rose-600/20 text-rose-300 border-rose-500/50 hover:bg-rose-600/30'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                    }`}
                    title={isDeafened ? 'Undeafen Audio' : 'Deafen Audio'}
                  >
                    {isDeafened ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  {/* Disconnect Call Button */}
                  <button
                    type="button"
                    onClick={handleDisconnectVoice}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-full transition cursor-pointer shadow-xl shadow-rose-600/30 flex items-center gap-1.5 ml-2"
                    title="Disconnect from Call"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Leave Call</span>
                  </button>
                </div>

                {/* Right: Actions & Tools */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const targetUrl = `${window.location.origin}/?popout=true&channel=${encodeURIComponent(currentVoiceChan)}`;
                        window.open(targetUrl, '_blank');
                      }
                    }}
                    className="p-2 rounded-xl border border-indigo-800/60 bg-indigo-950/50 hover:bg-indigo-900 text-indigo-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-3"
                    title="Pop-out Voice Call to Standalone Window / Tab"
                  >
                    <ExternalLink className="w-4 h-4 text-indigo-400" />
                    <span className="hidden md:inline">Open in New Tab</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReconnectMediaStreams}
                    className="p-2 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                    title="Reconnect Audio Streams"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* VOICE TOAST NOTIFICATION BANNER */}
      {voiceToast && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-950 border border-amber-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <span className="text-xs font-bold font-mono">{voiceToast}</span>
        </div>
      )}

    </div>
  );
};
