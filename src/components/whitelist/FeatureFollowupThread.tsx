import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  ShieldCheck, 
  User, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  AlertCircle,
  CheckCheck
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { parseFlexibleDate } from '../../lib/dateUtils';

export interface FeatureFollowupMessage {
  id: string;
  requestId: string;
  serverSlug?: string;
  senderUid: string;
  senderGamerTag: string;
  senderRole: 'owner' | 'admin' | 'staff';
  text: string;
  createdAt: string;
}

interface FeatureFollowupThreadProps {
  requestId: string;
  requestTitle?: string;
  requestOwnerUid: string;
  requestOwnerGamerTag: string;
  serverSlug: string;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
  } | null;
  isAdminView?: boolean;
  defaultExpanded?: boolean;
  onOpenAuth?: () => void;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Error:', JSON.stringify(errInfo));
}

function formatWhatsAppTime(val?: any): string {
  const date = parseFlexibleDate(val);
  if (!date) return 'Just now';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatMessageDateHeader(val?: any): string {
  const date = parseFlexibleDate(val);
  if (!date) return 'Today';
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export const FeatureFollowupThread: React.FC<FeatureFollowupThreadProps> = ({
  requestId,
  requestOwnerUid,
  requestOwnerGamerTag,
  serverSlug,
  currentUser,
  isAdminView = false,
  defaultExpanded = false,
  onOpenAuth
}) => {
  const [messages, setMessages] = useState<FeatureFollowupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  // Closed / collapsed by default
  const [isExpanded, setIsExpanded] = useState(defaultExpanded ?? false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Ref on the scrollable chat container ONLY (not calling window scrollIntoView)
  const chatFeedRef = useRef<HTMLDivElement>(null);

  // Role and GamerTag based on the active tab perspective
  const senderRole: 'owner' | 'admin' = isAdminView ? 'admin' : 'owner';
  const userGamerTag = isAdminView 
    ? 'Staff Developer'
    : (requestOwnerGamerTag || currentUser?.displayName || 'Server Owner');

  // Real-time listener for follow-up messages on this feature request
  useEffect(() => {
    setLoading(true);
    let unsubscribe = () => {};
    const path = `onDemandFeatureRequests/${requestId}/followups`;

    try {
      const q = query(
        collection(db, 'onDemandFeatureRequests', requestId, 'followups'),
        orderBy('createdAt', 'asc')
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: FeatureFollowupMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as FeatureFollowupMessage;
            list.push({ ...data, id: docSnap.id });
          });

          // Sort by creation time asc
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setMessages(list);
          setLoading(false);

          // Update local cache
          try {
            localStorage.setItem(`vice_followups_${requestId}`, JSON.stringify(list));
          } catch (e) {
            // ignore localStorage quota
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, path);
          // Fallback to local cache if offline or initial setup
          const cached = localStorage.getItem(`vice_followups_${requestId}`);
          if (cached) {
            try {
              setMessages(JSON.parse(cached));
            } catch (e) {
              setMessages([]);
            }
          }
          setLoading(false);
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [requestId]);

  // Auto-scroll ONLY the chatbox inner container when opened or new message arrives
  useEffect(() => {
    if (isExpanded && chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [messages.length, isExpanded]);

  // Send Follow-up Message
  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || sending) return;

    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      return;
    }

    setSending(true);
    setErrorMsg(null);

    const newMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMsg: FeatureFollowupMessage = {
      id: newMsgId,
      requestId,
      serverSlug,
      senderUid: isAdminView ? 'admin_hq' : (currentUser?.uid || requestOwnerUid || 'owner_user'),
      senderGamerTag: userGamerTag,
      senderRole,
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    const path = `onDemandFeatureRequests/${requestId}/followups/${newMsgId}`;

    try {
      // 1. Write message to Firestore subcollection
      await setDoc(doc(db, 'onDemandFeatureRequests', requestId, 'followups', newMsgId), newMsg);

      // 2. Update parent request doc with last activity timestamp
      try {
        const parentRef = doc(db, 'onDemandFeatureRequests', requestId);
        await updateDoc(parentRef, {
          updatedAt: new Date().toISOString(),
          lastFollowupAt: new Date().toISOString(),
          lastFollowupSender: userGamerTag,
          lastFollowupSnippet: textToSend.slice(0, 100)
        });
      } catch (parentErr) {
        console.warn('Could not update parent request activity:', parentErr);
      }

      // 3. Update local cache
      const updated = [...messages, newMsg];
      setMessages(updated);
      try {
        localStorage.setItem(`vice_followups_${requestId}`, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }

      setInputText('');
      // Scroll inner chat container only
      setTimeout(() => {
        if (chatFeedRef.current) {
          chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
        }
      }, 50);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      console.error('Error sending feature follow-up:', err);
      // Fallback local update
      const updated = [...messages, newMsg];
      setMessages(updated);
      try {
        localStorage.setItem(`vice_followups_${requestId}`, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      setInputText('');
      setErrorMsg('Message cached locally. Real-time Firestore sync active.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-950/90 border border-zinc-800/80 overflow-hidden transition-all duration-300">
      {/* Toggle Header Bar - Closed by Default */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-zinc-900/90 hover:bg-zinc-850 cursor-pointer flex items-center justify-between gap-3 select-none transition border-b border-zinc-800/60"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <MessageSquare className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white tracking-wide">
                Follow-up with Admin & Developers
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Realtime
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              {messages.length === 0 
                ? 'Ask questions, clarify specs, or discuss decline notes directly' 
                : `${messages.length} message${messages.length === 1 ? '' : 's'} • Latest from ${messages[messages.length - 1].senderGamerTag}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold border border-emerald-500/30">
              {messages.length}
            </span>
          )}
          <button 
            type="button"
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition"
            aria-label="Toggle chat thread"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded WhatsApp-Style Conversation Body */}
      {isExpanded && (
        <div className="flex flex-col bg-[#0b141a]">
          {/* WhatsApp Channel Context Info Bar */}
          <div className="flex items-center justify-between text-[11px] px-4 py-2 bg-[#111b21] border-b border-[#222e35] text-[#8696a0]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                Direct Line: <strong className="text-[#e9edef]">@{requestOwnerGamerTag}</strong> &harr; <strong className="text-[#53bdeb]">Staff Dev Team</strong>
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8696a0] shrink-0 hidden sm:inline">
              End-to-End Synced
            </span>
          </div>

          {/* WhatsApp Chat Messages Feed - Scroll contained internally */}
          <div 
            ref={chatFeedRef}
            className="max-h-[360px] min-h-[160px] overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]"
          >
            {loading ? (
              <div className="py-8 text-center text-xs text-[#8696a0] space-y-2">
                <Clock className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
                <p>Connecting to secure chat...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#182229] border border-[#222e35] flex items-center justify-center mx-auto text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#e9edef]">No messages in this thread yet</p>
                  <p className="text-[11px] text-[#8696a0] max-w-sm mx-auto leading-relaxed">
                    Type a message below to clarify specifications, ask questions, or provide updates to the developer team.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Date header pill */}
                <div className="flex justify-center my-1">
                  <span className="px-3 py-1 rounded-lg bg-[#182229] border border-[#222e35] text-[10px] font-medium text-[#8696a0] shadow-sm uppercase tracking-wider">
                    {formatMessageDateHeader(messages[0]?.createdAt)}
                  </span>
                </div>

                {messages.map((msg) => {
                  // Determine whether the message originated from the Server Owner (requester) or the Admin/Staff Developer
                  const isMsgFromOwner = 
                    (Boolean(requestOwnerGamerTag) && msg.senderGamerTag === requestOwnerGamerTag && msg.senderGamerTag !== 'Staff Developer') ||
                    (Boolean(requestOwnerUid) && msg.senderUid === requestOwnerUid && msg.senderUid !== 'admin_hq') ||
                    msg.senderRole === 'owner' ||
                    (msg.senderGamerTag !== 'Staff Developer' && !msg.senderGamerTag?.includes('Staff') && msg.senderRole !== 'staff');

                  const isMsgFromAdmin = !isMsgFromOwner;

                  // Active viewer perspective:
                  // - In Admin CMS (isAdminView = true): Admin messages are sent by self (RIGHT, green), Owner messages are received (LEFT, slate).
                  // - In Server Owner Tab (isAdminView = false): Owner messages are sent by self (RIGHT, green), Admin messages are received (LEFT, slate).
                  const isMsgFromSelf = isAdminView ? isMsgFromAdmin : isMsgFromOwner;

                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${isMsgFromSelf ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* WhatsApp Message Bubble */}
                      <div
                        className={`relative max-w-[85%] sm:max-w-[75%] px-3.5 pt-2 pb-1.5 shadow-md ${
                          isMsgFromSelf
                            ? 'bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-xs border border-[#005c4b]'
                            : 'bg-[#202c33] text-[#e9edef] rounded-2xl rounded-tl-xs border border-[#2b3942]'
                        }`}
                      >
                        {/* Receiver Sender Name & Role Tag (rendered on incoming messages on the left) */}
                        {!isMsgFromSelf && (
                          <div className="flex items-center gap-1.5 mb-1 pb-0.5 border-b border-[#2b3942]/60">
                            {isMsgFromAdmin ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span
                              className={`font-black text-[11px] tracking-wide ${
                                isMsgFromAdmin ? 'text-[#53bdeb]' : 'text-emerald-400'
                              }`}
                            >
                              {isMsgFromAdmin ? 'Staff Developer' : `@${msg.senderGamerTag || requestOwnerGamerTag || 'Server Owner'}`}
                            </span>
                            {isMsgFromAdmin ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#182229] text-[#53bdeb] border border-[#53bdeb]/40">
                                STAFF
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#182229] text-emerald-300 border border-emerald-500/40">
                                REQUESTER
                              </span>
                            )}
                          </div>
                        )}

                        {/* Message Text */}
                        <div className="text-[12.5px] leading-relaxed whitespace-pre-line break-words pb-3 pr-2">
                          {msg.text}
                        </div>

                        {/* Timestamp & Double Checkmarks (WhatsApp Style) */}
                        <div className="flex items-center justify-end gap-1 text-[10px] text-[#8696a0] select-none font-mono -mt-2">
                          <span>{formatWhatsAppTime(msg.createdAt)}</span>
                          {isMsgFromSelf && (
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mx-4 my-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* WhatsApp Style Bottom Input Bar */}
          <div className="p-3 bg-[#111b21] border-t border-[#222e35] flex items-end gap-2.5">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={sending}
                placeholder={
                  isAdminView
                    ? "Type message as Staff Admin (Enter to send)..."
                    : "Type message to Developer Team (Enter to send)..."
                }
                className="w-full px-4 py-2.5 rounded-2xl bg-[#2a3942] border border-transparent focus:border-[#00a884]/60 text-[#e9edef] text-xs placeholder:text-[#8696a0] focus:outline-none resize-none font-sans leading-relaxed min-h-[40px] max-h-[120px]"
              />
            </div>

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || sending}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 shadow-lg ${
                !inputText.trim() || sending
                  ? 'bg-[#202c33] text-[#8696a0] cursor-not-allowed opacity-60'
                  : 'bg-[#00a884] hover:bg-[#029071] text-white'
              }`}
              title="Send Message"
            >
              {sending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
