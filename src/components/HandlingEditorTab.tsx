'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  HandlingData,
  DEFAULT_HANDLING_PRESETS,
  VehicleTuningBuild,
  calculateCalculatedStats
} from '../lib/handling-calculator';
import { TunerVisualizer } from './tuning/TunerVisualizer';
import { HandlingSliderPanel } from './tuning/HandlingSliderPanel';
import { VEHICLES_DATA } from '../data/vehicles';
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import {
  Sliders,
  Sparkles,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Share2,
  CheckCircle,
  ShieldCheck,
  Zap,
  Car,
  Tag,
  Plus,
  RefreshCw,
  Award,
  Layers,
  FileCode,
  Gauge,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { hasL2Clearance } from '../lib/rbac';

interface HandlingEditorTabProps {
  userProfile?: UserProfile | null;
  onOpenAuthModal?: () => void;
  onSelectVehicle?: (slug: string) => void;
  isVipActive?: boolean;
}

// Initial Community Seed Presets in case Firestore is freshly provisioned
const SEED_COMMUNITY_BUILDS: VehicleTuningBuild[] = [
  {
    buildId: 'preset-seed-1',
    authorUid: 'staff_dev_vice',
    authorName: 'ViceSquad_Tuner',
    vehicleModel: 'declasse-drift-tampa',
    buildTitle: 'Ocean Drive Apex Drift Setup',
    tags: ['drift'],
    upvotesCount: 84,
    upvotedBy: [],
    dislikesCount: 2,
    dislikedBy: [],
    isVerifiedPreset: true,
    createdAt: Date.now() - 86400000 * 2,
    handlingData: DEFAULT_HANDLING_PRESETS['apex-drift'].data,
    notes: 'Maximized rear torque snap and progressive traction loss for sustained high-angle tandem drifts.'
  },
  {
    buildId: 'preset-seed-2',
    authorUid: 'staff_dev_vice',
    authorName: 'ViceSquad_Tuner',
    vehicleModel: 'pegassi-ignus-custom',
    buildTitle: 'Vice International Airport Time Attack',
    tags: ['race'],
    upvotesCount: 112,
    upvotedBy: [],
    dislikesCount: 1,
    dislikedBy: [],
    isVerifiedPreset: true,
    createdAt: Date.now() - 86400000 * 4,
    handlingData: DEFAULT_HANDLING_PRESETS['pro-race-grip'].data,
    notes: 'Optimized 32/68 AWD torque split with active downforce damping for razor-sharp apex grip.'
  },
  {
    buildId: 'preset-seed-3',
    authorUid: 'player_drag_don',
    authorName: 'PortGellhornRacer',
    vehicleModel: 'bravado-buffalo-evx',
    buildTitle: 'Port Gellhorn 1/4 Mile Drag Beast',
    tags: ['drag'],
    upvotesCount: 65,
    upvotedBy: [],
    dislikesCount: 3,
    dislikedBy: [],
    isVerifiedPreset: false,
    createdAt: Date.now() - 86400000 * 1,
    handlingData: DEFAULT_HANDLING_PRESETS['drag-strip-beast'].data,
    notes: 'Sub-2.0s 0-60 launch with stiffened rear compression dampers to eliminate launch squat.'
  },
  {
    buildId: 'preset-seed-4',
    authorUid: 'baja_crawler_leonida',
    authorName: 'SwampRat_Baja',
    vehicleModel: 'vapid-sandking-xl',
    buildTitle: 'Leonida Everglades Mud & Dunes Spec',
    tags: ['offroad'],
    upvotesCount: 47,
    upvotedBy: [],
    dislikesCount: 0,
    dislikedBy: [],
    isVerifiedPreset: false,
    createdAt: Date.now() - 86400000 * 3,
    handlingData: DEFAULT_HANDLING_PRESETS['baja-offroad'].data,
    notes: 'Locked 50/50 AWD with supple progressive spring dampers for crawling over Everglades roots and mud.'
  }
];

export const HandlingEditorTab: React.FC<HandlingEditorTabProps> = ({
  userProfile,
  onOpenAuthModal,
  onSelectVehicle,
  isVipActive = false
}) => {
  // Active Tuner View Mode (defaults to Stage 1 Quick Tuner)
  const [tunerMode, setTunerMode] = useState<'quick' | 'pro' | 'telemetry' | 'vault' | 'studio'>('quick');

  // VIP Clearance Check (Strictly labeled VIP, no L2)
  const isVipUser = Boolean(
    isVipActive ||
    userProfile?.isVip ||
    userProfile?.isAdmin ||
    userProfile?.isStaff ||
    hasL2Clearance(userProfile)
  );
  const [showVipModal, setShowVipModal] = useState<boolean>(false);

  // Active Tuner State
  const [vehicleModel, setVehicleModel] = useState<string>('pegassi-ignus-custom');
  const [handlingData, setHandlingData] = useState<HandlingData>(
    DEFAULT_HANDLING_PRESETS['pro-race-grip'].data
  );

  // Community Marketplace State
  const [communityBuilds, setCommunityBuilds] = useState<VehicleTuningBuild[]>(SEED_COMMUNITY_BUILDS);
  const [isLoadingBuilds, setIsLoadingBuilds] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [upvotedBuildIds, setUpvotedBuildIds] = useState<Set<string>>(new Set());
  const [dislikedBuildIds, setDislikedBuildIds] = useState<Set<string>>(new Set());
  const [autoModerationNotice, setAutoModerationNotice] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // Save / Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [publishTitle, setPublishTitle] = useState<string>('');
  const [publishTags, setPublishTags] = useState<('drift' | 'race' | 'drag' | 'offroad' | 'realistic')[]>(['race']);
  const [publishNotes, setPublishNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  // Sync Community Builds from Firestore
  useEffect(() => {
    try {
      const buildsRef = collection(db, 'vehicle_tuning_builds');
      const unsubscribe = onSnapshot(
        buildsRef,
        async (snapshot) => {
          if (!snapshot.empty) {
            const firestoreBuilds: VehicleTuningBuild[] = [];
            const userKey = userProfile?.id || (userProfile as any)?.uid || '';

            for (const docSnap of snapshot.docs) {
              const data = docSnap.data() as VehicleTuningBuild;
              const dislikes = data.dislikesCount || 0;

              // Automatic Deletion Rule: If more than 20 dislikes (>20), delete published setup automatically
              if (dislikes > 20) {
                try {
                  await deleteDoc(doc(db, 'vehicle_tuning_builds', docSnap.id));
                } catch (delErr) {
                  console.warn('Auto-moderation deletion failed for build:', docSnap.id, delErr);
                }
                continue; // Skip adding to displayed builds
              }

              firestoreBuilds.push({
                ...data,
                buildId: docSnap.id,
                dislikesCount: dislikes,
                dislikedBy: data.dislikedBy || [],
                upvotesCount: data.upvotesCount || 0,
                upvotedBy: data.upvotedBy || []
              });
            }

            // Combine with seeds without duplicates
            const seedFiltered = SEED_COMMUNITY_BUILDS.filter(
              (s) => !firestoreBuilds.some((fb) => fb.buildId === s.buildId)
            );

            // Strictly sort ONLY according to likes (descending)
            const allBuilds = [...firestoreBuilds, ...seedFiltered];
            allBuilds.sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0) || (b.createdAt || 0) - (a.createdAt || 0));

            // Sync user upvoted and disliked sets
            if (userKey) {
              const userUpvoted = new Set<string>();
              const userDisliked = new Set<string>();
              allBuilds.forEach((b) => {
                if (b.upvotedBy?.includes(userKey)) userUpvoted.add(b.buildId);
                if (b.dislikedBy?.includes(userKey)) userDisliked.add(b.buildId);
              });
              setUpvotedBuildIds(userUpvoted);
              setDislikedBuildIds(userDisliked);
            }

            setCommunityBuilds(allBuilds);
          } else {
            const sortedSeeds = [...SEED_COMMUNITY_BUILDS].sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
            setCommunityBuilds(sortedSeeds);
          }
          setIsLoadingBuilds(false);
        },
        (err) => {
          console.warn('Firestore tuning builds fetch failed, falling back to local presets:', err);
          const sortedSeeds = [...SEED_COMMUNITY_BUILDS].sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
          setCommunityBuilds(sortedSeeds);
          setIsLoadingBuilds(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firebase error initializing tuning builds listener:', err);
      const sortedSeeds = [...SEED_COMMUNITY_BUILDS].sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
      setCommunityBuilds(sortedSeeds);
      setIsLoadingBuilds(false);
    }
  }, [userProfile]);

  // Upvote a Build in Firestore (Sort stays updated strictly by likes)
  const handleUpvote = async (buildId: string) => {
    if (!userProfile) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    const userKey = userProfile.id || (userProfile as any)?.uid || 'guest_user';
    const targetBuild = communityBuilds.find((b) => b.buildId === buildId);
    if (!targetBuild) return;

    const isAlreadyUpvoted = upvotedBuildIds.has(buildId);
    const isAlreadyDisliked = dislikedBuildIds.has(buildId);

    if (isAlreadyUpvoted) {
      // Toggle off Upvote
      setUpvotedBuildIds((prev) => {
        const next = new Set(prev);
        next.delete(buildId);
        return next;
      });

      setCommunityBuilds((prev) =>
        prev
          .map((b) =>
            b.buildId === buildId
              ? {
                  ...b,
                  upvotesCount: Math.max(0, b.upvotesCount - 1),
                  upvotedBy: (b.upvotedBy || []).filter((u) => u !== userKey)
                }
              : b
          )
          .sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0) || (b.createdAt || 0) - (a.createdAt || 0))
      );

      try {
        const docRef = doc(db, 'vehicle_tuning_builds', buildId);
        await updateDoc(docRef, {
          upvotesCount: increment(-1),
          upvotedBy: arrayRemove(userKey)
        });
      } catch (err) {
        console.warn('Failed to update upvote in Firestore:', err);
      }
      return;
    }

    // Apply Upvote (and cancel dislike if previously disliked)
    setUpvotedBuildIds((prev) => new Set(prev).add(buildId));
    if (isAlreadyDisliked) {
      setDislikedBuildIds((prev) => {
        const next = new Set(prev);
        next.delete(buildId);
        return next;
      });
    }

    setCommunityBuilds((prev) =>
      prev
        .map((b) =>
          b.buildId === buildId
            ? {
                ...b,
                upvotesCount: b.upvotesCount + 1,
                upvotedBy: [...(b.upvotedBy || []), userKey],
                dislikesCount: isAlreadyDisliked ? Math.max(0, (b.dislikesCount || 0) - 1) : (b.dislikesCount || 0),
                dislikedBy: isAlreadyDisliked ? (b.dislikedBy || []).filter((u) => u !== userKey) : b.dislikedBy
              }
            : b
        )
        .sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0) || (b.createdAt || 0) - (a.createdAt || 0))
    );

    try {
      const docRef = doc(db, 'vehicle_tuning_builds', buildId);
      const updatePayload: any = {
        upvotesCount: increment(1),
        upvotedBy: arrayUnion(userKey)
      };
      if (isAlreadyDisliked) {
        updatePayload.dislikesCount = increment(-1);
        updatePayload.dislikedBy = arrayRemove(userKey);
      }
      await updateDoc(docRef, updatePayload);
    } catch (err) {
      console.warn('Failed to update upvote in Firestore:', err);
    }
  };

  // Dislike a Build in Firestore (Auto-deletes if dislikes > 20)
  const handleDislike = async (buildId: string) => {
    if (!userProfile) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    const userKey = userProfile.id || (userProfile as any)?.uid || 'guest_user';
    const targetBuild = communityBuilds.find((b) => b.buildId === buildId);
    if (!targetBuild) return;

    const isAlreadyDisliked = dislikedBuildIds.has(buildId);
    const isAlreadyUpvoted = upvotedBuildIds.has(buildId);

    if (isAlreadyDisliked) {
      // Toggle off Dislike
      setDislikedBuildIds((prev) => {
        const next = new Set(prev);
        next.delete(buildId);
        return next;
      });

      setCommunityBuilds((prev) =>
        prev.map((b) =>
          b.buildId === buildId
            ? {
                ...b,
                dislikesCount: Math.max(0, (b.dislikesCount || 0) - 1),
                dislikedBy: (b.dislikedBy || []).filter((u) => u !== userKey)
              }
            : b
        )
      );

      try {
        const docRef = doc(db, 'vehicle_tuning_builds', buildId);
        await updateDoc(docRef, {
          dislikesCount: increment(-1),
          dislikedBy: arrayRemove(userKey)
        });
      } catch (err) {
        console.warn('Failed to remove dislike in Firestore:', err);
      }
      return;
    }

    const currentDislikes = targetBuild.dislikesCount || 0;
    const newDislikes = currentDislikes + 1;

    // AUTOMATIC DELETION: If dislikes exceed 20 (> 20 dislikes)
    if (newDislikes > 20) {
      // Immediately remove from state and vote caches
      setCommunityBuilds((prev) => prev.filter((b) => b.buildId !== buildId));
      setUpvotedBuildIds((prev) => {
        const next = new Set(prev);
        next.delete(buildId);
        return next;
      });
      setDislikedBuildIds((prev) => {
        const next = new Set(prev);
        next.delete(buildId);
        return next;
      });

      setAutoModerationNotice(
        `Setup "${targetBuild.buildTitle}" was removed after exceeding community moderation flags.`
      );
      setTimeout(() => setAutoModerationNotice(null), 8000);

      try {
        const docRef = doc(db, 'vehicle_tuning_builds', buildId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Failed to delete build from Firestore:', err);
      }
      return;
    }

    // Normal Dislike Addition (and remove upvote if previously upvoted)
    setDislikedBuildIds((prev) => new Set(prev).add(buildId));
    if (isAlreadyUpvoted) {
      setUpvotedBuildIds((prev) => {
        const next = new Set(prev);
        next.delete(buildId);
        return next;
      });
    }

    setCommunityBuilds((prev) =>
      prev
        .map((b) =>
          b.buildId === buildId
            ? {
                ...b,
                dislikesCount: newDislikes,
                dislikedBy: [...(b.dislikedBy || []), userKey],
                upvotesCount: isAlreadyUpvoted ? Math.max(0, b.upvotesCount - 1) : b.upvotesCount,
                upvotedBy: isAlreadyUpvoted ? (b.upvotedBy || []).filter((u) => u !== userKey) : b.upvotedBy
              }
            : b
        )
        .sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0) || (b.createdAt || 0) - (a.createdAt || 0))
    );

    try {
      const docRef = doc(db, 'vehicle_tuning_builds', buildId);
      const updatePayload: any = {
        dislikesCount: increment(1),
        dislikedBy: arrayUnion(userKey)
      };
      if (isAlreadyUpvoted) {
        updatePayload.upvotesCount = increment(-1);
        updatePayload.upvotedBy = arrayRemove(userKey);
      }
      await updateDoc(docRef, updatePayload);
    } catch (err) {
      console.warn('Failed to update dislike in Firestore:', err);
    }
  };

  // Load Setup from Marketplace into the active Tuner
  const handleLoadBuildIntoTuner = (build: VehicleTuningBuild) => {
    setHandlingData(build.handlingData);
    setVehicleModel(build.vehicleModel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Publish Setup to Firestore
  const handlePublishBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (!publishTitle.trim()) {
      setPublishFeedback('Please provide a title for your tuning setup.');
      return;
    }

    setIsSubmitting(true);
    setPublishFeedback(null);

    const userId = userProfile.id || (userProfile as any).uid || 'vice_user';
    const newBuildId = `build-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newBuild: VehicleTuningBuild = {
      buildId: newBuildId,
      authorUid: userId,
      authorName: userProfile.username || 'Vice Racer',
      vehicleModel: vehicleModel,
      buildTitle: publishTitle.trim(),
      tags: publishTags,
      upvotesCount: 1,
      upvotedBy: [userId],
      dislikesCount: 0,
      dislikedBy: [],
      isVerifiedPreset: Boolean(userProfile.isVip || userProfile.isAdmin),
      createdAt: Date.now(),
      handlingData: handlingData,
      notes: publishNotes.trim() || undefined
    };

    try {
      // 1. Save build document to Firestore
      const docRef = doc(db, 'vehicle_tuning_builds', newBuildId);
      await setDoc(docRef, newBuild);

      // 2. Grant +50 VC balance bonus in userProfiles if user exists
      try {
        const userDocRef = doc(db, 'userProfiles', userId);
        await updateDoc(userDocRef, {
          vcBalance: increment(50)
        });
      } catch (vcErr) {
        console.warn('Could not increment VC balance bonus:', vcErr);
      }

      setCommunityBuilds((prev) =>
        [newBuild, ...prev].sort(
          (a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0) || (b.createdAt || 0) - (a.createdAt || 0)
        )
      );
      setUpvotedBuildIds((prev) => new Set(prev).add(newBuildId));
      setPublishFeedback('Build successfully published! +50 VC Bonus awarded to your profile.');

      setTimeout(() => {
        setIsPublishModalOpen(false);
        setPublishTitle('');
        setPublishNotes('');
        setPublishFeedback(null);
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      console.error('Error saving build to Firestore:', err);
      setPublishFeedback('Failed to publish build to Firestore. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Tag toggle helper for publish modal
  const togglePublishTag = (tag: 'drift' | 'race' | 'drag' | 'offroad' | 'realistic') => {
    setPublishTags((prev) =>
      prev.includes(tag) ? (prev.length > 1 ? prev.filter((t) => t !== tag) : prev) : [...prev, tag]
    );
  };

  // Filtered Community Builds (STRICTLY SORTED ONLY BY LIKES)
  const filteredBuilds = useMemo(() => {
    const filtered = communityBuilds.filter((b) => {
      // Exclude any build with more than 20 dislikes
      if ((b.dislikesCount || 0) > 20) return false;

      const matchesTag = selectedTag === 'all' || b.tags.includes(selectedTag as any);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.buildTitle.toLowerCase().includes(q) ||
        b.authorName.toLowerCase().includes(q) ||
        b.vehicleModel.toLowerCase().includes(q);
      return matchesTag && matchesSearch;
    });

    // Strictly sort ONLY according to likes (highest likes first)
    return filtered.sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0) || (b.createdAt || 0) - (a.createdAt || 0));
  }, [communityBuilds, selectedTag, searchQuery]);

  // Reset page to 1 on tag or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTag, searchQuery, pageSize]);

  // Calculate Pagination Slices
  const totalPages = Math.max(1, Math.ceil(filteredBuilds.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedBuilds = useMemo(() => {
    const startIdx = (validCurrentPage - 1) * pageSize;
    return filteredBuilds.slice(startIdx, startIdx + pageSize);
  }, [filteredBuilds, validCurrentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    const targetPage = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(targetPage);
    const element = document.getElementById('community-marketplace');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Find vehicle display name
  const vehicleDisplayName = useMemo(() => {
    const found = VEHICLES_DATA.find((v) => v.slug === vehicleModel);
    return found ? `${found.name} (${found.brand})` : vehicleModel.toUpperCase();
  }, [vehicleModel]);

  // Compute live vehicle telemetry stats for banner display
  const telemetryStats = useMemo(() => {
    return calculateCalculatedStats(handlingData);
  }, [handlingData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. CLEAN, WELCOMING HEADER MATCHING PLATFORM THEME */}
      <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-48 bg-rose-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-0 w-80 h-40 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Vehicle Physics & Handling
                </span>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full text-xs font-mono">
                  FiveM • GTA VI • handling.meta
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                handling.meta Visual Tuner & Telemetry
              </h1>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Fine-tune engine drive forces, traction curves, AWD/RWD torque bias, and suspension dampening with live 3D/2D telemetry visualizers and export production-ready XML code.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publish Build</span>
              </button>

              <a
                href="#community-marketplace"
                className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Community Setups</span>
              </a>
            </div>
          </div>

          {/* 3 Step Quick Guidance Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs shrink-0">
                1
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Select Vehicle & Archetype</div>
                <div className="text-zinc-400 text-[11px] mt-0.5">Pick base chassis or load a 1-click drift / grip preset.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                2
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Tune Sliders & Test 3D Run</div>
                <div className="text-zinc-400 text-[11px] mt-0.5">Adjust power, traction bias, and dampening in real time.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xs shrink-0">
                3
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Copy or Export handling.meta</div>
                <div className="text-zinc-400 text-[11px] mt-0.5">One-click copy or download XML file for your server.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TUNER WORKSPACE MODE SELECTOR */}
      <div className="space-y-4">
        <div className="bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 shadow-xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={() => setTunerMode('quick')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-center min-h-[42px] ${
                tunerMode === 'quick'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">Stage 1 Quick</span>
            </button>

            <button
              type="button"
              onClick={() => setTunerMode('pro')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-center min-h-[42px] ${
                tunerMode === 'pro'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Pro Parameters</span>
            </button>

            <button
              type="button"
              onClick={() => setTunerMode('telemetry')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-center min-h-[42px] ${
                tunerMode === 'telemetry'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">3D & Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => setTunerMode('vault')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-center min-h-[42px] ${
                tunerMode === 'vault'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Community Vault</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isVipUser) {
                  setShowVipModal(true);
                  return;
                }
                setTunerMode('studio');
              }}
              className={`col-span-2 sm:col-span-1 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-center min-h-[42px] ${
                tunerMode === 'studio'
                  ? 'bg-zinc-100 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
              }`}
            >
              {isVipUser ? (
                <Layers className="w-3.5 h-3.5 shrink-0 text-zinc-950" />
              ) : (
                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              )}
              <span className="whitespace-nowrap">Split Studio</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                VIP
              </span>
            </button>
          </div>
        </div>

        {/* LIVE VEHICLE TELEMETRY STATS RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 sm:p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Top Speed</span>
              <Gauge className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-rose-400 font-mono">
                {telemetryStats.estimatedTopSpeedMph} <span className="text-xs text-zinc-500 font-normal">MPH</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{telemetryStats.estimatedTopSpeedKph} km/h theoretical</div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 sm:p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <span>0-60 Sprint</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                {telemetryStats.zeroToSixtySec} <span className="text-xs text-zinc-500 font-normal">sec</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">1/4 Mile: {telemetryStats.quarterMileSec}s</div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 sm:p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Cornering Grip</span>
              <Activity className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-sky-400 font-mono">
                {telemetryStats.corneringGForce} <span className="text-xs text-zinc-500 font-normal">Lat G</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Peak Skidpad Traction</div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 sm:p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Drivetrain Bias</span>
              <Car className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-sky-300 font-mono truncate">
                {telemetryStats.driveBiasLabel}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{Math.round(handlingData.fDriveBiasFront * 100)}% F / {Math.round((1 - handlingData.fDriveBiasFront) * 100)}% R</div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 sm:p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Drift Tendency</span>
              <Flame className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-rose-400 font-mono flex items-center gap-1.5">
                <span>{telemetryStats.driftTendencyScore}/100</span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full border bg-zinc-950 border-zinc-800 text-zinc-300">
                  {telemetryStats.driftTendencyScore > 65 ? 'Oversteer' : telemetryStats.driftTendencyScore < 35 ? 'Understeer' : 'Neutral'}
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Braking: {telemetryStats.brakingDistanceFt} ft (60-0)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tuner Stage (Dependent on Active Mode) */}
      <div>
        {/* Quick Tuner Mode - Clean, Single-Column Focused View Without 3D Overhead */}
        {tunerMode === 'quick' && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-200 space-y-4">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="font-bold text-white">Stage 1 Quick Tuner Active:</span>
                <span className="text-zinc-400">Streamlined single-column macro sliders & 1-click presets.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isVipUser) {
                    setShowVipModal(true);
                    return;
                  }
                  setTunerMode('studio');
                }}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer text-[11px] self-start sm:self-auto"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Want side-by-side live 3D physics? Open Split Studio (VIP) →</span>
              </button>
            </div>

            <HandlingSliderPanel
              handlingData={handlingData}
              onChange={setHandlingData}
              vehicleModel={vehicleModel}
              onVehicleModelChange={setVehicleModel}
              onOpenSaveModal={() => setIsPublishModalOpen(true)}
              isLoggedIn={Boolean(userProfile)}
              initialTab="quick"
            />
          </div>
        )}

        {/* Pro Parameters Mode */}
        {tunerMode === 'pro' && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-200 space-y-4">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-bold text-white">Pro Parameter Engineering:</span>
                <span className="text-zinc-400">Directly tweak raw engine force, drivetrain bias, traction curves, and suspension.</span>
              </div>
            </div>
            <HandlingSliderPanel
              handlingData={handlingData}
              onChange={setHandlingData}
              vehicleModel={vehicleModel}
              onVehicleModelChange={setVehicleModel}
              onOpenSaveModal={() => setIsPublishModalOpen(true)}
              isLoggedIn={Boolean(userProfile)}
              initialTab="engine"
            />
          </div>
        )}

        {/* Telemetry & 3D Visualizer Mode */}
        {tunerMode === 'telemetry' && (
          <div className="max-w-6xl xl:max-w-7xl mx-auto animate-in fade-in duration-200 space-y-6">
            <TunerVisualizer
              handlingData={handlingData}
              vehicleModelName={vehicleDisplayName}
            />
          </div>
        )}

        {/* Community Vault Mode */}
        {tunerMode === 'vault' && (
          <div className="animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 mb-6 flex items-center justify-between">
              <span>Browse top-rated handling setups verified by community drivers and FiveM tuners.</span>
              <button
                type="button"
                onClick={() => setTunerMode('quick')}
                className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
              >
                ← Back to Quick Tuner
              </button>
            </div>
          </div>
        )}

        {/* Split Studio Mode (VIP Exclusive) - The DUAL-VIEW Split Bench */}
        {tunerMode === 'studio' && (
          isVipUser ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900/80 to-zinc-900/80 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    VIP WORKSPACE
                  </span>
                  <span className="font-bold text-white">Split Studio Dual-View Bench:</span>
                  <span className="text-zinc-400">Live 3D WebGL chassis physics on left, real-time parameter controls on right.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTunerMode('quick')}
                  className="text-zinc-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer text-[11px] self-start sm:self-auto"
                >
                  ← Switch back to Single-Column Quick Tuner
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Tuner Visualizer & 3D Stage */}
                <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-24 space-y-4">
                  <TunerVisualizer
                    handlingData={handlingData}
                    vehicleModelName={vehicleDisplayName}
                  />
                </div>

                {/* Right Column: Interactive Sliders & XML Generator */}
                <div className="lg:col-span-6 xl:col-span-6">
                  <HandlingSliderPanel
                    handlingData={handlingData}
                    onChange={setHandlingData}
                    vehicleModel={vehicleModel}
                    onVehicleModelChange={setVehicleModel}
                    onOpenSaveModal={() => setIsPublishModalOpen(true)}
                    isLoggedIn={Boolean(userProfile)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto p-8 bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-amber-500/40 rounded-3xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  VIP Feature
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Split Studio Workspace Locked</h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Split Studio is reserved exclusively for VIP members. Upgrade to VIP to run simultaneous 3D WebGL physics telemetry alongside live parameter sliders and automated XML compilation on one unified screen.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto">
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3">
                  <div className="text-amber-400 font-bold text-xs mb-1">Dual Stage</div>
                  <div className="text-[11px] text-zinc-400">Simultaneous 3D canvas and live tuning sliders.</div>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3">
                  <div className="text-amber-400 font-bold text-xs mb-1">Live Sync</div>
                  <div className="text-[11px] text-zinc-400">Instant suspension & weight transfer updates.</div>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3">
                  <div className="text-amber-400 font-bold text-xs mb-1">VIP Badge</div>
                  <div className="text-[11px] text-zinc-400">Exclusive badge on community shared presets.</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTunerMode('quick')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer border border-zinc-800"
                >
                  Return to Quick Tuner
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal?.()}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Unlock with VIP Pass</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Community Marketplace Section (Always visible in quick, vault, and studio modes) */}
      {(tunerMode === 'quick' || tunerMode === 'vault' || tunerMode === 'studio') && (
      <div id="community-marketplace" className="mt-12 pt-10 border-t border-zinc-800/80">
        {/* Auto Moderation Banner Notice if a build was deleted for >20 dislikes */}
        {autoModerationNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-start gap-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <strong className="font-bold text-white block">Auto-Moderation Triggered</strong>
              {autoModerationNotice}
            </div>
            <button
              type="button"
              onClick={() => setAutoModerationNotice(null)}
              className="text-rose-400 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
              <Award className="w-4 h-4" /> Community Tuning Vault
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                <Flame className="w-3 h-3 text-amber-400" />
                Featured Setups
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Top Community handling.meta Setups
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Explore and deploy high-performance handling setups shared and rated by the community for FiveM and GTA VI.
            </p>
          </div>

          {/* Search & Tag Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search setups or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            {/* Tag Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'drift', 'race', 'drag', 'offroad', 'realistic'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer shrink-0 ${
                    selectedTag === tag
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats & Pagination Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 px-1 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-200 font-bold">
              Showing {filteredBuilds.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0}–{Math.min(validCurrentPage * pageSize, filteredBuilds.length)} of {filteredBuilds.length} builds
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-rose-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Sort: Top Rated
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-zinc-500 text-[11px]">Per page:</span>
            {[6, 12, 24].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPageSize(size)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold cursor-pointer transition ${
                  pageSize === size
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Community Presets Grid (Paginated) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedBuilds.map((build) => {
            const isUpvoted = upvotedBuildIds.has(build.buildId);
            const isDisliked = dislikedBuildIds.has(build.buildId);
            const dislikes = build.dislikesCount || 0;

            return (
              <div
                key={build.buildId}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 shadow-lg flex flex-col justify-between transition group relative overflow-hidden"
              >
                <div>
                  {/* Top Badges & Author */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Array.isArray(build.tags) && build.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-rose-400 text-[10px] font-bold uppercase tracking-wider"
                        >
                          {t}
                        </span>
                      ))}
                      {build.isVerifiedPreset && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-400" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    {/* Voting Action Pill Group (Like + Dislike) */}
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shrink-0">
                      {/* Like Button */}
                      <button
                        type="button"
                        title={isUpvoted ? 'Remove upvote' : 'Upvote this setup'}
                        onClick={() => handleUpvote(build.buildId)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                          isUpvoted
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{build.upvotesCount || 0}</span>
                      </button>

                      {/* Dislike Button */}
                      <button
                        type="button"
                        title={isDisliked ? 'Remove downvote' : 'Downvote this setup'}
                        onClick={() => handleDislike(build.buildId)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                          isDisliked
                            ? 'bg-rose-600 text-white shadow-sm'
                            : dislikes > 0
                            ? 'hover:bg-zinc-800 text-zinc-400 hover:text-rose-400'
                            : 'hover:bg-zinc-800 text-zinc-500 hover:text-rose-400'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>{dislikes}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Vehicle */}
                  <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition line-clamp-1">
                    {build.buildTitle}
                  </h3>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{build.vehicleModel}</span>
                    <span>•</span>
                    <span className="text-zinc-500">by {build.authorName}</span>
                  </div>

                  {/* Notes */}
                  {build.notes && (
                    <p className="text-xs text-zinc-300/90 leading-relaxed mt-2.5 line-clamp-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800">
                      "{build.notes}"
                    </p>
                  )}

                  {/* Handling Quick Metric Pills */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800 text-center font-mono">
                    <div className="bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase">Mass</div>
                      <div className="text-xs font-bold text-amber-400">{build.handlingData.fMass}kg</div>
                    </div>
                    <div className="bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase">Force</div>
                      <div className="text-xs font-bold text-rose-400">{build.handlingData.fInitialDriveForce}</div>
                    </div>
                    <div className="bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase">Grip</div>
                      <div className="text-xs font-bold text-emerald-400">{build.handlingData.fTractionCurveMax}</div>
                    </div>
                  </div>
                </div>

                {/* Load into Tuner Button */}
                <div className="mt-4 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleLoadBuildIntoTuner(build)}
                    className="w-full py-2 bg-zinc-800 hover:bg-rose-600 hover:text-white text-zinc-200 font-bold text-xs rounded-lg border border-zinc-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Load Setup into Tuner</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search / Tag Results */}
        {filteredBuilds.length === 0 && (
          <div className="text-center py-16 bg-zinc-900/60 rounded-2xl border border-zinc-800 p-8">
            <Sliders className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-zinc-300">No tuning setups found</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              No builds match the current tag or search query. Be the first to publish a setup!
            </p>
          </div>
        )}

        {/* Pagination Navigation Controls */}
        {totalPages > 1 && (
          <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-400 font-mono">
              Page <span className="text-white font-bold">{validCurrentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => handlePageChange(1)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                disabled={validCurrentPage === 1}
                onClick={() => handlePageChange(validCurrentPage - 1)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numeric Page Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  return Math.abs(p - validCurrentPage) <= 1;
                })
                .map((pageNum, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && pageNum - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsisBefore && (
                        <span className="px-2 text-xs text-zinc-600 font-mono">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                          validCurrentPage === pageNum
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              {/* Next Page */}
              <button
                type="button"
                disabled={validCurrentPage === totalPages}
                onClick={() => handlePageChange(validCurrentPage + 1)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                disabled={validCurrentPage === totalPages}
                onClick={() => handlePageChange(totalPages)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Publish Build Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Publish Handling Setup</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!userProfile ? (
              <div className="text-center py-6">
                <Car className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">Sign In to Publish</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                  Log in with your GamerTag to publish presets to the community marketplace and earn{' '}
                  <strong className="text-rose-300">+50 VC balance</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsPublishModalOpen(false);
                    if (onOpenAuthModal) onOpenAuthModal();
                  }}
                  className="mt-5 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  Log In or Register GamerTag
                </button>
              </div>
            ) : (
              <form onSubmit={handlePublishBuild} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Setup Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Apex Drift Spec V2, Pro Drag Strip Setup"
                    value={publishTitle}
                    onChange={(e) => setPublishTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${vehicleDisplayName} (${vehicleModel})`}
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Archetype Tags (Select at least one)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['drift', 'race', 'drag', 'offroad', 'realistic'] as const).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => togglePublishTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                          publishTags.includes(tag)
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Tuner Notes & Tips (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe driving style, gear ratio recommendations, or track advice..."
                    value={publishNotes}
                    onChange={(e) => setPublishNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                {publishFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      publishFeedback.includes('successfully')
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {publishFeedback.includes('successfully') ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{publishFeedback}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl border border-zinc-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Publish Setup (+50 VC)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VIP Exclusive Feature Modal */}
      {showVipModal && (
        <div className="fixed inset-0 z-[2500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">VIP Exclusive Workspace</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      VIP
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">Split Studio Dual-View Physics Engine</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVipModal(false)}
                className="text-zinc-500 hover:text-white p-1 cursor-pointer transition rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-4">
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                The <span className="font-bold text-white">Split Studio</span> workspace is an exclusive VIP feature engineered for professional FiveM tuners and competitive drivers.
              </p>

              <div className="space-y-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 text-xs">
                <div className="flex items-center gap-2.5 text-zinc-200">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Simultaneous 3D WebGL physics telemetry & interactive sliders</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-200">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Real-time instant XML compiler with live diff preview</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-200">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Priority verification badge for community marketplace setups</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowVipModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVipModal(false);
                  onOpenAuthModal?.();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Unlock with VIP Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandlingEditorTab;
