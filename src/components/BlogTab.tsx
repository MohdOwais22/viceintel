'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  ThumbsUp,
  Clock,
  User,
  Tag,
  Share2,
  Check,
  ChevronRight,
  MapPin,
  Flame,
  MessageSquare,
  Send,
  Bookmark,
  Sparkles,
  ArrowLeft,
  Filter,
  X,
  Zap,
  SlidersHorizontal,
  Link2,
  ExternalLink,
  Globe,
  CheckCircle2,
  Eye,
  Play,
  Tv,
  Film,
  Video,
  PlayCircle
} from 'lucide-react';
import { BLOG_POSTS } from '../data/blogPosts';
import { BlogPost } from '../types';
import { InternalLinkOpportunity } from './marketing/agency/types';
import { SEED_INTERNAL_LINKS } from './marketing/agency/mockData';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { copyToClipboard } from '../lib/copyUtils';
import { updateArticleSeoMeta, updatePageSeoMeta } from '../lib/seoRouting';
import { sanitizeBlogImageUrl, resolveThematicBlogImage } from '../lib/blogImageResolver';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogTabProps {
  searchQuery?: string;
  currentUser?: FirebaseUser | null;
  initialSlug?: string;
  isAdmin?: boolean;
  isStaff?: boolean;
  onOpenAuth?: () => void;
  onNavigateToMap?: (x?: number, y?: number) => void;
  onNavigateTab?: (tab: string, targetId?: string) => void;
  onOpenAiAdvisor?: () => void;
}

interface ArticleComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  date: string;
  isVip?: boolean;
}

export const BlogTab: React.FC<BlogTabProps> = ({
  searchQuery = '',
  currentUser,
  initialSlug,
  isAdmin = false,
  isStaff = false,
  onOpenAuth,
  onNavigateToMap,
  onNavigateTab,
  onOpenAiAdvisor
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [internalLinks, setInternalLinks] = useState<InternalLinkOpportunity[]>(SEED_INTERNAL_LINKS);
  const [highlightedParaIdx, setHighlightedParaIdx] = useState<number | null>(null);
  const [activeVideoTimestamp, setActiveVideoTimestamp] = useState<number>(0);
  const [isTrailerPlaying, setIsTrailerPlaying] = useState<boolean>(true);

  // Live Firestore subscription for Internal Links
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, 'marketingInternalLinks'), (snap) => {
        if (!snap.empty) {
          const links: InternalLinkOpportunity[] = [];
          snap.forEach((d) => {
            const data = d.data();
            links.push({
              id: d.id,
              sourceTitle: data.sourceTitle || 'Untitled Source',
              sourceUrl: data.sourceUrl || '/',
              targetTitle: data.targetTitle || 'Untitled Target',
              targetUrl: data.targetUrl || '/',
              recommendedAnchorText: data.recommendedAnchorText || '',
              contextSentence: data.contextSentence || '',
              relevanceScore: typeof data.relevanceScore === 'number' ? data.relevanceScore : 90,
              priority: data.priority || 'Medium',
              applied: Boolean(data.applied),
              appliedAt: data.appliedAt,
              injectedMarkdown: data.injectedMarkdown,
              injectedHtml: data.injectedHtml
            });
          });
          setInternalLinks(links);
        }
      });
    } catch (e) {
      console.warn('Internal links sync notice:', e);
    }
    return () => unsub();
  }, []);

  // Live Firestore subscription for Zero-Code CMS published blog posts
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, 'blogPosts'), (snap) => {
        if (!snap.empty) {
          const fsBlogs: BlogPost[] = [];
          snap.forEach((doc) => {
            const data = doc.data();
            const title = data.title || 'Untitled Leak Report';
            const category = data.category || 'Map Leaks & Districts';
            const tags = data.tags || ['GTA6', 'ViceCity'];
            const content = Array.isArray(data.content) ? data.content : [data.content || 'Report content.'];
            const contentMarkdown = data.contentMarkdown || (Array.isArray(data.content) ? data.content.join('\n\n') : (data.content || ''));
            
            // Dynamic thematic image resolution if missing or generic
            let resolvedImage = sanitizeBlogImageUrl(data.imageUrl);
            if (!resolvedImage || resolvedImage.includes('photo-1542751371-adc38448a05e')) {
              const matched = resolveThematicBlogImage(title, tags, category);
              resolvedImage = matched.url;
            }

            fsBlogs.push({
              id: doc.id,
              slug: data.slug || doc.id,
              title,
              subtitle: data.subtitle || 'Game Intel',
              category,
              author: data.author || 'Vice City Staff',
              authorRole: data.authorRole || 'Official Contributor',
              authorAvatar: data.authorAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=ViceStaff',
              date: data.date || 'Recent',
              readTime: data.readTime || '3 min read',
              imageUrl: resolvedImage,
              likes: data.likes || 1,
              isFeatured: data.isFeatured ?? true,
              tags,
              excerpt: data.excerpt || 'Exclusive game report.',
              content,
              contentMarkdown,
              keyTakeaways: data.keyTakeaways || ['Staff Verified Report'],
              faqItems: data.faqItems || [],
              publishedFromMarketing: !!data.publishedFromMarketing
            });
          });

          // Merge static posts and live Firestore posts (Firestore posts take precedence if matching ID)
          setAllPosts((prev) => {
            const map = new Map<string, BlogPost>();
            BLOG_POSTS.forEach((p) => map.set(p.id, p));
            fsBlogs.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
      });
    } catch (e) {
      console.warn('Blog posts sync error:', e);
    }
    return () => unsub();
  }, []);

  // Synchronize activeArticle whenever allPosts updates from Firestore
  useEffect(() => {
    if (activeArticle) {
      const match = allPosts.find((p) => p.id === activeArticle.id || (p.slug && p.slug === activeArticle.slug));
      if (match) {
        // Compare if anything updated to prevent render loops
        const hasChanged =
          match.title !== activeArticle.title ||
          match.imageUrl !== activeArticle.imageUrl ||
          match.contentMarkdown !== activeArticle.contentMarkdown ||
          match.excerpt !== activeArticle.excerpt ||
          match.subtitle !== activeArticle.subtitle ||
          match.author !== activeArticle.author ||
          match.category !== activeArticle.category ||
          match.readTime !== activeArticle.readTime ||
          JSON.stringify(match.keyTakeaways) !== JSON.stringify(activeArticle.keyTakeaways) ||
          JSON.stringify(match.faqItems) !== JSON.stringify(activeArticle.faqItems) ||
          JSON.stringify(match.content) !== JSON.stringify(activeArticle.content);

        if (hasChanged) {
          setActiveArticle(match);
        }
      }
    }
  }, [allPosts, activeArticle]);
  const [likesMap, setLikesMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    BLOG_POSTS.forEach((post) => {
      initial[post.id] = post.likes;
    });
    return initial;
  });
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Article Comments State
  const [commentsMap, setCommentsMap] = useState<Record<string, ArticleComment[]>>({
    'post-1': [
      {
        id: 'c1',
        author: 'LeonidaRacer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Racer2026',
        text: 'Ocean Drive police response is definitely super aggressive compared to Port Gellhorn! Great map analysis.',
        date: '2 hours ago',
        isVip: true
      },
      {
        id: 'c2',
        author: 'VicePilot_88',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pilot88',
        text: 'The freight train tunnels in Port Gellhorn saved me 3 times today during 5-star chases.',
        date: '5 hours ago'
      }
    ]
  });
  const [commentInput, setCommentInput] = useState<string>('');

  // Auto-resolve blog article from initialSlug, URL path or query parameter on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const pathname = window.location.pathname.toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const postSlugFromPath = pathname.startsWith('/blog/') ? pathname.replace('/blog/', '') : null;
      const targetSlug = initialSlug || postSlugFromPath || searchParams.get('post') || searchParams.get('article') || searchParams.get('id');

      if (targetSlug) {
        const targetLower = targetSlug.toLowerCase();
        const match = allPosts.find((p) => (p.slug && p.slug.toLowerCase() === targetLower) || p.id.toLowerCase() === targetLower);
        if (match) {
          setActiveArticle(match);
        }
      }
    } catch (err) {
      console.debug('Blog URL parse notice:', err);
    }
  }, [allPosts, initialSlug]);

  // Update SEO metadata & URL pushState, and reset scroll to top when activeArticle changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    if (typeof document === 'undefined') return;

    if (activeArticle) {
      updateArticleSeoMeta({
        title: activeArticle.title,
        description: activeArticle.excerpt || activeArticle.subtitle || 'Vice City Intel Report',
        slug: activeArticle.slug || activeArticle.id,
        imageUrl: activeArticle.imageUrl,
        author: activeArticle.author || 'Vice City Staff',
        date: activeArticle.date,
        keywords: activeArticle.tags || ['GTA 6', 'Vice City', 'Blog'],
        isBlog: true
      });

      if (typeof window !== 'undefined') {
        try {
          const targetPath = `/blog/${activeArticle.slug || activeArticle.id}`;
          if (window.location.pathname !== targetPath) {
            window.history.pushState({ postId: activeArticle.id }, activeArticle.title, targetPath);
          }
        } catch (e) {
          // Fallback
        }
      }
    } else {
      updatePageSeoMeta('blog');
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/blog/')) {
        try {
          window.history.pushState({}, 'Vice City Intel Blog', '/blog');
        } catch (e) {
          // Fallback
        }
      }
    }
  }, [activeArticle]);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  // Collapsed by default when page opens as requested
  const [showTagCloud, setShowTagCloud] = useState<boolean>(false);

  // Compute tag frequencies dynamically across all posts
  const tagCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allPosts.forEach((post) => {
      (post.tags || []).forEach((t) => {
        const cleanTag = t.trim();
        if (cleanTag) {
          counts[cleanTag] = (counts[cleanTag] || 0) + 1;
        }
      });
    });
    return counts;
  }, [allPosts]);

  // Sorted list of tags by frequency then name
  const sortedTags = React.useMemo(() => {
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [tagCounts]);

  // Quick mechanic filter list
  const quickMechanicTags = [
    { name: 'Vehicle Database', icon: '🏎️' },
    { name: 'Comparison Matrix', icon: '⚖️' },
    { name: 'Mod Builder', icon: '🔧' },
    { name: 'ROI Calculator', icon: '💰' },
    { name: 'Interactive Map', icon: '🗺️' },
    { name: 'Weapons', icon: '💥' },
    { name: 'RP Server Directory', icon: '🎮' },
    { name: 'Community Chat', icon: '💬' },
    { name: 'Handling Editor', icon: '⚙️' },
    { name: 'Economy Balancer', icon: '📊' },
    { name: 'Tactical AI', icon: '🤖' },
    { name: 'pSEO Engine', icon: '🕷️' },
    { name: 'VIP Membership', icon: '⭐' },
    { name: 'Heist Prep', icon: '🧩' },
    { name: 'Stealth', icon: '🥷' }
  ];

  const effectiveSearch = localSearch || searchQuery;

  const categories = [
    'All',
    'Bookmarks 🔖',
    'Platform Features & Tools ⚡',
    'Vehicle Tuning Specs',
    'Map Leaks & Districts',
    'Heists & Businesses',
    'RP Server News',
    'Weapon Meta & TTK',
    'Economy & Modding'
  ];

  // Filtering
  const filteredPosts = allPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === 'Bookmarks 🔖'
        ? bookmarkedPosts.includes(post.id)
        : selectedCategory === 'All' || post.category === selectedCategory;

    const matchesTag =
      !selectedTag ||
      (post.tags || []).some((t) => t.toLowerCase() === selectedTag.toLowerCase());

    const q = effectiveSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.subtitle.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.author.toLowerCase().includes(q) ||
      (post.tags || []).some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesTag && matchesSearch;
  });

  const featuredPost = BLOG_POSTS.find((p) => p.isFeatured) || BLOG_POSTS[0];

  const handleLike = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isLiked = likedPosts.includes(postId);
    if (isLiked) {
      setLikedPosts((prev) => prev.filter((id) => id !== postId));
      setLikesMap((prev) => ({ ...prev, [postId]: (prev[postId] || 0) - 1 }));
    } else {
      setLikedPosts((prev) => [...prev, postId]);
      setLikesMap((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    }
  };

  const handleBookmark = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleCopyLink = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/#blog-${postId}`;
    await copyToClipboard(url);
    setCopiedLink(postId);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    if (!currentUser && onOpenAuth) {
      onOpenAuth();
      return;
    }

    const username = currentUser
      ? currentUser.displayName || currentUser.email?.split('@')[0] || 'ViceCityPlayer'
      : 'Guest User';

    const newComment: ArticleComment = {
      id: `comment-${Date.now()}`,
      author: username,
      avatar: currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      text: commentInput.trim(),
      date: 'Just now',
      isVip: true
    };

    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));
    setCommentInput('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-rose-950/40 to-indigo-950/40 border border-zinc-800 p-6 md:p-8">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vice City Intelligence & Map Articles</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
            Leonida State Intel, District Guides & Weapon Meta
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            In-depth analysis of Vice City districts, high-value heist routes, supercar telemetry benchmarks, and GTA VI map leaks verified by the community.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap border ${
                selectedCategory === cat
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search articles, tags, map locations..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* DYNAMIC GAME MECHANIC TAG CLOUD */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 space-y-3.5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Game Mechanic Tag Cloud
            </span>
            <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800">
              {sortedTags.length} Mechanics Logged
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Tag Filter (#{selectedTag})</span>
              </button>
            )}
            <button
              onClick={() => setShowTagCloud(!showTagCloud)}
              className="text-xs text-zinc-400 hover:text-white font-mono flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{showTagCloud ? 'Collapse Cloud' : 'Expand Cloud'}</span>
            </button>
          </div>
        </div>

        {/* Featured Mechanic Quick Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Featured Mechanics:
          </span>
          {quickMechanicTags.map(({ name, icon }) => {
            const isActive = selectedTag?.toLowerCase() === name.toLowerCase();
            const count = tagCounts[name] || 0;
            return (
              <button
                key={name}
                onClick={() => {
                  setSelectedTag(isActive ? null : name);
                  setActiveArticle(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  isActive
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20 ring-1 ring-rose-300'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span>{icon}</span>
                <span>{name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-black/40 text-white' : 'bg-zinc-950 text-zinc-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Expandable Full Tag Cloud */}
        {showTagCloud && (
          <div className="pt-2.5 border-t border-zinc-900 flex flex-wrap items-center gap-2 max-h-52 overflow-y-auto scrollbar-thin">
            {sortedTags.map(({ tag, count }) => {
              const isActive = selectedTag?.toLowerCase() === tag.toLowerCase();
              const isPopular = count >= 3;
              const isMedium = count === 2;

              return (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(isActive ? null : tag);
                    setActiveArticle(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1.5 border cursor-pointer ${
                    isActive
                      ? 'bg-rose-500 text-white border-rose-400 font-black shadow-md shadow-rose-500/20'
                      : isPopular
                      ? 'bg-zinc-900 text-rose-300 border-rose-500/30 hover:border-rose-500/50 font-bold'
                      : isMedium
                      ? 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-700 font-semibold'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 font-normal'
                  }`}
                >
                  <span>#{tag}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-black/40 text-white' : 'bg-zinc-950 text-zinc-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FULL READER MODE VIEW */}
      {activeArticle ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-10 space-y-8 animate-fade-in shadow-2xl">
          {/* Back Button */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <button
              onClick={() => setActiveArticle(null)}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-800 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-rose-400" />
              <span>Back to Articles</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleLike(activeArticle.id, e)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border ${
                  likedPosts.includes(activeArticle.id)
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${likedPosts.includes(activeArticle.id) ? 'fill-rose-400 text-rose-400' : ''}`} />
                <span>{likesMap[activeArticle.id] || activeArticle.likes}</span>
              </button>

              <button
                onClick={(e) => handleBookmark(activeArticle.id, e)}
                className={`p-2 rounded-xl text-xs transition border ${
                  bookmarkedPosts.includes(activeArticle.id)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                }`}
                title="Bookmark Article"
              >
                <Bookmark className={`w-4 h-4 ${bookmarkedPosts.includes(activeArticle.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>

              <button
                onClick={(e) => handleCopyLink(activeArticle.id, e)}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs rounded-xl border border-zinc-800 transition"
                title="Share Article Link"
              >
                {copiedLink === activeArticle.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-bold uppercase rounded-lg">
                {activeArticle.category}
              </span>
              <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {activeArticle.readTime}
              </span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400">{activeArticle.date}</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
              {activeArticle.title}
            </h1>
            <p className="text-base text-zinc-300 leading-relaxed font-medium">
              {activeArticle.subtitle}
            </p>

            {/* Author Profile Card */}
            <div className="flex items-center gap-3 pt-2">
              <img
                src={activeArticle.authorAvatar}
                alt={activeArticle.author}
                className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-900 object-cover"
              />
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>@{activeArticle.author}</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30">
                    Verified Author
                  </span>
                </h4>
                <p className="text-xs text-zinc-400">{activeArticle.authorRole}</p>
              </div>
            </div>
          </div>

          {/* OFFICIAL 27-MINUTE "AN EXTENDED LOOK" TRAILER VIDEO SHOWCASE & EXTERNAL LINKS */}
          {(activeArticle.youtubeEmbedId || activeArticle.videoUrl || activeArticle.title.toLowerCase().includes('extended look') || activeArticle.title.toLowerCase().includes('trailer')) && (
            <div className="bg-gradient-to-br from-zinc-950 via-rose-950/20 to-zinc-900 border border-rose-500/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <Tv className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>Grand Theft Auto VI: An Extended Look (27-Min Official Showcase)</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono uppercase font-bold border border-rose-500/40 animate-pulse">
                        LIVE
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Watch the full 27-minute official video trailer premiere on YouTube, stream on Netflix, or jump to timestamps below.
                    </p>
                  </div>
                </div>

                {/* External Streaming Platform Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={activeArticle.videoUrl || 'https://www.youtube.com/watch?v=tJbzMqJGH4k'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md hover:scale-105 active:scale-95"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Watch on YouTube</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  <a
                    href={activeArticle.netflixUrl || 'https://www.netflix.com/title/81742918'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-800/80 text-xs font-bold flex items-center gap-1.5 transition hover:scale-105 active:scale-95"
                  >
                    <Film className="w-3.5 h-3.5 text-red-400" />
                    <span>Stream on Netflix</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>

              {/* Responsive Embedded Player */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-inner">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeArticle.youtubeEmbedId || 'tJbzMqJGH4k'}?autoplay=0&rel=0&start=${activeVideoTimestamp}`}
                  title="GTA VI Extended Look Official Trailer Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Timestamp Jump Chips */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Interactive Trailer Timestamps & Chapter Skips</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: '00:00 - Introduction & Vice City Skyline', sec: 0 },
                    { label: '04:15 - Lucia & Jason Heist Prep', sec: 255 },
                    { label: '11:05 - RDR2 Negotiation Wheel', sec: 665 },
                    { label: '16:45 - Soft-Body Vehicle Damage', sec: 1005 },
                    { label: '22:30 - Vice Port Tuner Drift Races', sec: 1350 }
                  ].map((ts) => (
                    <button
                      key={ts.sec}
                      type="button"
                      onClick={() => setActiveVideoTimestamp(ts.sec)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono transition cursor-pointer border flex items-center gap-1.5 ${
                        activeVideoTimestamp === ts.sec
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-sm'
                          : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{ts.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Featured Header Image */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 max-h-[420px]">
            <img
              src={activeArticle.imageUrl}
              alt={activeArticle.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            {activeArticle.coordinates && (
              <div className="absolute bottom-4 left-4 bg-zinc-950/90 backdrop-blur-md border border-zinc-700/80 px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 font-bold">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Map Coordinates: {activeArticle.coordinates.district} ({activeArticle.coordinates.x}, {activeArticle.coordinates.y})</span>
              </div>
            )}
          </div>

          {/* Key Takeaways Box */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 md:p-6 space-y-3">
            <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Key Tactical Takeaways & Map Intelligence</span>
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeArticle.keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Body Content with React Markdown Rendering */}
          <div className="space-y-6 text-base text-zinc-300 leading-relaxed font-normal">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-8 mb-4 pb-2.5 border-b border-zinc-800 flex items-center gap-3">
                    <span className="w-2.5 h-6 rounded bg-gradient-to-b from-rose-500 to-amber-500 inline-block shrink-0" />
                    <span>{children}</span>
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-7 mb-3.5 flex items-center gap-2.5">
                    <span className="w-2 h-5 rounded bg-rose-500 inline-block shrink-0" />
                    <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">{children}</span>
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg sm:text-xl font-bold text-amber-300 tracking-tight mt-6 mb-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded bg-amber-400 inline-block shrink-0" />
                    <span>{children}</span>
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base font-bold text-zinc-100 mt-4 mb-2">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="text-zinc-300 leading-relaxed text-[15px] sm:text-base my-3.5 selection:bg-rose-500 selection:text-white font-normal">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-extrabold text-white bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60 shadow-xs">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-rose-300/90 font-medium">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="my-4 space-y-2 pl-2 sm:pl-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-4 space-y-2 pl-4 list-decimal list-inside text-zinc-300 font-medium">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2.5 text-zinc-300 text-[15px] sm:text-base leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0 shadow-xs" />
                    <div className="flex-1">{children}</div>
                  </li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/30 via-zinc-900 to-zinc-900 border-l-4 border-rose-500 text-zinc-200 shadow-md relative overflow-hidden">
                    <div className="italic text-[15px] leading-relaxed relative z-10 text-zinc-200">{children}</div>
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-6 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/70 shadow-lg scrollbar-thin">
                    <table className="w-full text-left text-sm border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-xs font-black uppercase text-rose-300 tracking-wider">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 font-extrabold">{children}</th>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">{children}</tbody>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-xs sm:text-sm">{children}</td>
                ),
                code: ({ inline, children }: any) => {
                  if (inline) {
                    return (
                      <code className="font-mono text-xs text-rose-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-semibold">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="my-4 rounded-xl bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                      <code>{children}</code>
                    </div>
                  );
                },
                a: ({ href, children }) => {
                  const isInternal = href && (href.startsWith('/') || href.includes('localhost') || href.includes('viceintel'));
                  return (
                    <a
                      href={href}
                      onClick={(e) => {
                        if (isInternal && href) {
                          e.preventDefault();
                          if (typeof window !== 'undefined') {
                            window.history.pushState({}, '', href);
                            window.dispatchEvent(new PopStateEvent('popstate'));
                          }
                          if (onNavigateTab) {
                            const clean = href.replace(/^\//, '');
                            if (clean.includes('challenges') || clean.includes('tuning-championship')) onNavigateTab('challenges');
                            else if (clean.includes('handling-editor')) onNavigateTab('handling-editor');
                            else if (clean.includes('roi-calculator')) onNavigateTab('roi-calculator');
                            else if (clean.includes('map')) onNavigateTab('map');
                            else if (clean.includes('rp-servers')) onNavigateTab('rp-servers');
                            else if (clean.includes('weapons')) onNavigateTab('weapons');
                            else if (clean.includes('vehicles')) onNavigateTab('vehicles');
                          }
                        }
                      }}
                      target={isInternal ? undefined : '_blank'}
                      rel={isInternal ? undefined : 'noopener noreferrer'}
                      className="text-rose-400 hover:text-rose-300 font-semibold underline decoration-rose-500/50 hover:decoration-rose-300 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{children}</span>
                    </a>
                  );
                }
              }}
            >
              {activeArticle.contentMarkdown ||
                (Array.isArray(activeArticle.content)
                  ? activeArticle.content.join('\n\n')
                  : String(activeArticle.content || ''))}
            </Markdown>
          </div>

          {/* Strategic FAQ Section if present */}
          {Array.isArray(activeArticle.faqItems) && activeArticle.faqItems.length > 0 && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-rose-400">
                <BookOpen className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black text-white">Frequently Asked Questions & Tactical Intel</h3>
              </div>
              <div className="space-y-3">
                {activeArticle.faqItems.map((faq, fIdx) => (
                  <div key={fIdx} className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-bold text-white flex items-start gap-2">
                      <span className="text-rose-400 font-mono font-black text-xs">Q:</span>
                      <span>{faq.question}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed pl-5">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Platform Tool Launcher Integration */}
          <div className="bg-gradient-to-r from-zinc-950 via-rose-950/20 to-indigo-950/20 border border-rose-500/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
                  Live Platform Feature Integrations
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                Interactive Tool
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Put this intelligence into practice immediately using our full suite of live calculators, telemetry analyzers, and interactive maps:
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* Map Button if coordinates or map tags */}
              {(activeArticle.coordinates || activeArticle.tags.some(t => t.toLowerCase().includes('map'))) && onNavigateToMap && (
                <button
                  onClick={() => onNavigateToMap(activeArticle.coordinates?.x, activeArticle.coordinates?.y)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Launch Interactive Map</span>
                </button>
              )}
              {/* Vehicles & Comparison Buttons */}
              {(activeArticle.tags.some(t => t.toLowerCase().includes('vehicle') || t.toLowerCase().includes('supercar') || t.toLowerCase().includes('speed') || t.toLowerCase().includes('tuning'))) && onNavigateTab && (
                <>
                  <button
                    onClick={() => onNavigateTab('vehicles')}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🏎️ Vehicle Database</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('comparison')}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>⚖️ Comparison Matrix</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('mod-calculator')}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🔧 Mod Builder</span>
                  </button>
                </>
              )}
              {/* ROI & Businesses */}
              {(activeArticle.tags.some(t => t.toLowerCase().includes('roi') || t.toLowerCase().includes('business') || t.toLowerCase().includes('heist'))) && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('roi-calculator')}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💰 Business ROI Calculator</span>
                </button>
              )}
              {/* Weapons */}
              {(activeArticle.tags.some(t => t.toLowerCase().includes('weapon') || t.toLowerCase().includes('ttk') || t.toLowerCase().includes('ammu-nation'))) && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('weapons')}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💥 Weapons Arsenal & TTK</span>
                </button>
              )}
              {/* RP Servers */}
              {(activeArticle.tags.some(t => t.toLowerCase().includes('rp') || t.toLowerCase().includes('fivem') || t.toLowerCase().includes('whitelist') || t.toLowerCase().includes('server'))) && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('rp-servers')}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🎮 RP Server Directory</span>
                </button>
              )}
              {/* Handling Editor */}
              {(activeArticle.tags.some(t => t.toLowerCase().includes('handling') || t.toLowerCase().includes('physics'))) && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('handling-editor')}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>⚙️ Handling Meta XML Tuner</span>
                </button>
              )}
              {/* Economy Balancer */}
              {(activeArticle.tags.some(t => t.toLowerCase().includes('economy') || t.toLowerCase().includes('inflation') || t.toLowerCase().includes('ledger'))) && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('economy-balancer')}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📊 Economy Balancer</span>
                </button>
              )}
              {/* Community Chat */}
              {(activeArticle.tags.some(t => t.toLowerCase().includes('chat') || t.toLowerCase().includes('voice') || t.toLowerCase().includes('comms') || t.toLowerCase().includes('hub'))) && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('chat')}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💬 Community Live Chat</span>
                </button>
              )}
              {/* AI Advisor Button */}
              {onOpenAiAdvisor && (
                <button
                  onClick={onOpenAiAdvisor}
                  className="px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/80 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🤖 Ask AI Tactical Copilot</span>
                </button>
              )}
            </div>
          </div>

          {/* Article Tags */}
          {Array.isArray(activeArticle.tags) && activeArticle.tags.length > 0 && (
            <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center gap-2">
              <Tag className="w-4 h-4 text-zinc-500" />
              {activeArticle.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag);
                    setActiveArticle(null);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    selectedTag?.toLowerCase() === tag.toLowerCase()
                      ? 'bg-rose-500 text-white border-rose-400 font-bold'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Discussion & Comments Section */}
          <div className="pt-8 border-t border-zinc-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-400" />
                <span>Community Discussion</span>
                <span className="text-xs font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800">
                  {(commentsMap[activeArticle.id] || []).length}
                </span>
              </h3>
            </div>

            {/* Comment Form */}
            <form onSubmit={(e) => handleAddComment(activeArticle.id, e)} className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder={
                    currentUser
                      ? "Share your tactical intel or feedback on this article..."
                      : "Sign in to join the discussion..."
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3 pt-2">
              {(commentsMap[activeArticle.id] || []).map((comment) => (
                <div key={comment.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={comment.avatar}
                        alt={comment.author}
                        className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
                      />
                      <span className="text-xs font-bold text-zinc-200">@{comment.author}</span>
                      {comment.isVip && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                          VIP
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{comment.date}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed pl-9">{comment.text}</p>
                </div>
              ))}
              {(commentsMap[activeArticle.id] || []).length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-6">
                  No comments yet. Be the first to share tactical insight!
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ARTICLES GRID & FEATURED HERO VIEW */
        <div className="space-y-8">
          {/* Featured Hero Article */}
          {selectedCategory === 'All' && !effectiveSearch && featuredPost && (
            <div
              onClick={() => setActiveArticle(featuredPost)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 transition-all duration-300 shadow-xl grid grid-cols-1 lg:grid-cols-12"
            >
              <div className="lg:col-span-7 relative min-h-[260px] lg:min-h-[360px]">
                <img
                  src={featuredPost.imageUrl}
                  alt={featuredPost.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-zinc-950" />
                <div className="absolute top-4 left-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-white" />
                  <span>Featured Intelligence</span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold uppercase text-[10px]">
                      {featuredPost.category}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400 font-mono text-[11px]">{featuredPost.readTime}</span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-rose-300 transition-colors leading-snug">
                    {featuredPost.title}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={featuredPost.authorAvatar}
                      alt={featuredPost.author}
                      className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-zinc-200">@{featuredPost.author}</p>
                      <p className="text-[10px] text-zinc-500">{featuredPost.date}</p>
                    </div>
                  </div>

                  <button className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-md shadow-rose-600/20">
                    <span>Read Full Intel</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Article Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-400" />
                <span>All Vice City Intel Articles</span>
                <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {filteredPosts.length} Articles
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => {
                const isLiked = likedPosts.includes(post.id);
                const isBookmarked = bookmarkedPosts.includes(post.id);
                return (
                  <div
                    key={post.id}
                    onClick={() => setActiveArticle(post)}
                    className="group bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-xl"
                  >
                    <div>
                      {/* Card Image */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900 shrink-0">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                        <div className="absolute top-3 left-3 bg-zinc-950/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-rose-300 border border-zinc-800 uppercase">
                          {post.category}
                        </div>

                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleBookmark(post.id, e)}
                            className={`p-1.5 rounded-lg backdrop-blur-md text-xs transition border ${
                              isBookmarked
                                ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                                : 'bg-zinc-950/80 text-zinc-400 hover:text-white border-zinc-800'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                          <span>{post.date}</span>
                          <span>{post.readTime}</span>
                        </div>

                        <h4 className="text-sm font-extrabold text-white group-hover:text-rose-300 transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h4>

                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {post.tags.slice(0, 4).map((tag) => (
                            <button
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag(selectedTag?.toLowerCase() === tag.toLowerCase() ? null : tag);
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                                selectedTag?.toLowerCase() === tag.toLowerCase()
                                  ? 'bg-rose-500 text-white border-rose-400 font-bold shadow-sm'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                              }`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.authorAvatar}
                          alt={post.author}
                          className="w-6 h-6 rounded-full border border-zinc-700 object-cover"
                        />
                        <span className="text-xs font-semibold text-zinc-300 truncate max-w-[100px]">@{post.author}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleLike(post.id, e)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 border ${
                            isLiked
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border-zinc-800'
                          }`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                          <span>{likesMap[post.id] || post.likes}</span>
                        </button>

                        <button
                          onClick={(e) => handleCopyLink(post.id, e)}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs rounded-lg transition border border-zinc-800"
                        >
                          {copiedLink === post.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-16 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-base font-bold text-zinc-300">No articles matched your filter criteria</h4>
                <p className="text-xs text-zinc-500">
                  {selectedTag ? `No articles currently tagged with #${selectedTag}` : 'Try adjusting your search terms or clearing category filters.'}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedTag(null);
                    setLocalSearch('');
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-rose-400 text-xs font-bold rounded-xl border border-zinc-800 transition cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
