'use client';
import React, { useState, useEffect, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import {
  Vote,
  CheckCircle2,
  Lock,
  Sparkles,
  BarChart3,
  Users,
  Flame,
  Zap,
  Radio,
  Car,
  MapPin,
  Trophy,
  HelpCircle
} from 'lucide-react';

export interface PollOption {
  id: string;
  label: string;
  icon?: string;
  votes: number;
}

export interface PollData {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  totalVotes: number;
  options: Record<string, PollOption>;
  voters: Record<string, string>; // uid -> optionId
}

interface CommunityPollCardProps {
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  onOpenAuth: () => void;
}

const DEFAULT_POLLS: Record<string, PollData> = {
  'vehicle-class': {
    id: 'vehicle-class',
    title: 'Most Anticipated GTA VI Vehicle Class',
    subtitle: 'Which vehicle category are you dying to test on Ocean Drive first?',
    category: 'Vehicles',
    totalVotes: 342,
    options: {
      opt1: { id: 'opt1', label: '🏎️ Supercars & Hypercars (Grotti, Pegassi)', votes: 128 },
      opt2: { id: 'opt2', label: '🚙 Muscle Cars & Street Tuners (Vapid, Bravado)', votes: 94 },
      opt3: { id: 'opt3', label: '🚁 Choppers & Tactical Aircraft (Buckingham)', votes: 52 },
      opt4: { id: 'opt4', label: '🚤 High-Speed Yachts & Powerboats (Shitzu)', votes: 38 },
      opt5: { id: 'opt5', label: '🏍️ Vice City Biker Lowriders (Western)', votes: 30 }
    },
    voters: {}
  },
  'vice-district': {
    id: 'vice-district',
    title: 'Best Vice City District & Map Zone',
    subtitle: 'Which Leonida region are you exploring first on launch day?',
    category: 'Map & World',
    totalVotes: 289,
    options: {
      opt1: { id: 'opt1', label: '🌴 Ocean Drive & Vice Beach Neon Strip', votes: 115 },
      opt2: { id: 'opt2', label: '🏙️ Downtown Skyscrapers & Little Haiti', votes: 72 },
      opt3: { id: 'opt3', label: '🏰 Starfish Island Mansions & Luxury Docks', votes: 54 },
      opt4: { id: 'opt4', label: '🐊 Grassrivers Wetlands & Keys Marshes', votes: 48 }
    },
    voters: {}
  },
  'gameplay-feature': {
    id: 'gameplay-feature',
    title: 'Top Anticipated GTA VI Gameplay Mechanics',
    subtitle: 'Which feature are you most excited to experience with Jason & Lucia?',
    category: 'Gameplay',
    totalVotes: 412,
    options: {
      opt1: { id: 'opt1', label: '💰 Dual Protagonist Heist Coordination', votes: 168 },
      opt2: { id: 'opt2', label: '🏢 Nightclub & Business Empire Mechanics', votes: 104 },
      opt3: { id: 'opt3', label: '🏎️ Deep Custom Vehicle Tuning & Chop Shops', votes: 85 },
      opt4: { id: 'opt4', label: '📱 In-Game Social Media & Live Stream Feeds', votes: 55 }
    },
    voters: {}
  }
};

export const CommunityPollCard: React.FC<CommunityPollCardProps> = ({
  isAuthenticated,
  currentUser,
  onOpenAuth
}) => {
  const [activePollId, setActivePollId] = useState<string>('vehicle-class');
  const [pollData, setPollData] = useState<PollData>(DEFAULT_POLLS['vehicle-class']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteSuccessMsg, setVoteSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justVotedOptionId, setJustVotedOptionId] = useState<string | null>(null);
  const seededPollsRef = useRef<Set<string>>(new Set());

  // Subscribe to live Firestore updates for active poll
  useEffect(() => {
    setErrorMsg(null);
    setJustVotedOptionId(null);
    const pollRef = doc(db, 'communityPolls', activePollId);

    const unsubscribe = onSnapshot(
      pollRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as PollData;
          setPollData(data);
        } else {
          // Document does not exist yet; use default and seed it
          const initial = DEFAULT_POLLS[activePollId] || DEFAULT_POLLS['vehicle-class'];
          setPollData(initial);
          // Seed to Firestore in background once
          if (!seededPollsRef.current.has(activePollId)) {
            seededPollsRef.current.add(activePollId);
            setDoc(pollRef, {
              ...initial,
              updatedAt: new Date().toISOString()
            }).catch((err) => {
              console.warn('Could not seed initial poll data to Firestore:', err);
            });
          }
        }
      },
      (err) => {
        console.warn('Firestore poll listener error, falling back to cached state:', err);
        setPollData(DEFAULT_POLLS[activePollId] || DEFAULT_POLLS['vehicle-class']);
      }
    );

    return () => unsubscribe();
  }, [activePollId]);

  const userVotedOptionId = currentUser?.uid ? pollData.voters?.[currentUser.uid] : null;

  const handleVote = async (optionId: string) => {
    if (!isAuthenticated || !currentUser) {
      onOpenAuth();
      return;
    }

    if (userVotedOptionId === optionId) {
      return; // Already voted for this option
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const pollRef = doc(db, 'communityPolls', activePollId);

      const previousVoteOptionId = userVotedOptionId;
      const updatedVoters = { ...(pollData.voters || {}), [currentUser.uid]: optionId };

      const updatedOptions = { ...pollData.options };
      let newTotalVotes = pollData.totalVotes;

      // Deduct vote from previous option if user is switching vote
      if (previousVoteOptionId && updatedOptions[previousVoteOptionId]) {
        updatedOptions[previousVoteOptionId] = {
          ...updatedOptions[previousVoteOptionId],
          votes: Math.max(0, updatedOptions[previousVoteOptionId].votes - 1)
        };
      } else {
        // New voter
        newTotalVotes += 1;
      }

      // Add vote to new option
      if (updatedOptions[optionId]) {
        updatedOptions[optionId] = {
          ...updatedOptions[optionId],
          votes: (updatedOptions[optionId].votes || 0) + 1
        };
      }

      const updatePayload = {
        id: activePollId,
        title: pollData.title,
        subtitle: pollData.subtitle,
        category: pollData.category,
        totalVotes: newTotalVotes,
        options: updatedOptions,
        voters: updatedVoters,
        updatedAt: new Date().toISOString()
      };

      await setDoc(pollRef, updatePayload, { merge: true });

      setJustVotedOptionId(optionId);
      setVoteSuccessMsg('Your vote was registered in live Firestore!');
      setTimeout(() => setVoteSuccessMsg(null), 3500);
      setTimeout(() => setJustVotedOptionId(null), 1800);
    } catch (err: any) {
      console.error('Error submitting poll vote to Firestore:', err);
      setErrorMsg('Failed to sync vote to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVotes = Math.max(1, pollData.totalVotes || 0);

  return (
    <div className="bg-zinc-900/95 border border-zinc-800 hover:border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all relative overflow-hidden space-y-6">
      {/* Background Accent Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* HEADER BAR */}
      <div className="flex flex-col gap-3.5 border-b border-zinc-800/80 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
              <span>Live Firestore Poll</span>
            </span>
            <span className="text-xs text-zinc-500 font-mono">•</span>
            <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{pollData.totalVotes.toLocaleString('en-US')} Votes</span>
            </span>
          </div>

          {/* TOPIC SELECTOR TABS */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
            <button
              onClick={() => setActivePollId('vehicle-class')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activePollId === 'vehicle-class'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Vehicles</span>
            </button>
            <button
              onClick={() => setActivePollId('vice-district')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activePollId === 'vice-district'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setActivePollId('gameplay-feature')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activePollId === 'gameplay-feature'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gameplay</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 leading-tight">
            <Vote className="w-6 h-6 text-rose-400 shrink-0" />
            <span>{pollData.title}</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            {pollData.subtitle}
          </p>
        </div>
      </div>

      {/* FEEDBACK NOTIFICATION */}
      <AnimatePresence>
        {voteSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{voteSuccessMsg}</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POLL OPTIONS LIST */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePollId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {Object.values(pollData.options || {}).map((opt, idx) => {
              const voteCount = opt.votes || 0;
              const percentage = Math.round((voteCount / totalVotes) * 100);
              const isUserSelection = userVotedOptionId === opt.id;
              const isJustVoted = justVotedOptionId === opt.id;

              return (
                <motion.div
                  key={opt.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: isJustVoted ? [1, 1.03, 0.98, 1.01, 1] : 1
                  }}
                  transition={{
                    duration: isJustVoted ? 0.6 : 0.3,
                    delay: isJustVoted ? 0 : idx * 0.05
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVote(opt.id)}
                  className={`group relative rounded-2xl p-4 border transition-colors duration-200 cursor-pointer overflow-hidden ${
                    isUserSelection
                      ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-500/20'
                      : 'bg-zinc-950/80 hover:bg-zinc-950 border-zinc-800 hover:border-rose-500/50'
                  }`}
                >
                  {/* SUCCESS PULSE RING EFFECT */}
                  {isJustVoted && (
                    <motion.div
                      initial={{ opacity: 1, scale: 0.95 }}
                      animate={{ opacity: 0, scale: 1.04 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-2xl border-2 border-emerald-400 pointer-events-none z-20"
                    />
                  )}

                  {/* VOTE PROGRESS BAR FILL */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`absolute top-0 bottom-0 left-0 opacity-20 group-hover:opacity-30 ${
                      isUserSelection ? 'bg-rose-500' : 'bg-zinc-700'
                    }`}
                  />

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* CHECKMARK OR SELECTION CIRCLE */}
                      <motion.div
                        animate={
                          isJustVoted
                            ? { scale: [1, 1.3, 1], rotate: [0, 15, 0] }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.4 }}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isUserSelection
                            ? 'bg-rose-500 border-rose-400 text-white shadow-md shadow-rose-500/40'
                            : 'border-zinc-700 group-hover:border-rose-500/60 bg-zinc-900 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.div>

                      {/* OPTION LABEL */}
                      <span className={`text-sm font-black transition-colors ${
                        isUserSelection ? 'text-rose-200' : 'text-zinc-200 group-hover:text-white'
                      }`}>
                        {opt.label}
                      </span>
                    </div>

                    {/* VOTE STATS (PERCENTAGE & COUNT) */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-xs font-mono text-zinc-400">
                        {voteCount.toLocaleString('en-US')} votes
                      </span>
                      <motion.span
                        animate={isJustVoted ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                        className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border ${
                          isUserSelection
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                        }`}
                      >
                        {percentage}%
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FOOTER ACTIONS & AUTH INDICATOR */}
      <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Signed in as {currentUser?.displayName || 'Vice Squad Member'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400 font-mono">
              <Lock className="w-3.5 h-3.5" />
              <span>Sign in required to record your live vote</span>
            </div>
          )}
        </div>

        {!isAuthenticated && (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sign In to Vote</span>
          </button>
        )}
      </div>
    </div>
  );
};
