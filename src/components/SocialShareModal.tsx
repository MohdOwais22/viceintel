'use client';

import React, { useState } from 'react';
import {
  Share2,
  X,
  Copy,
  Check,
  Twitter,
  MessageSquare,
  Globe,
  Sparkles,
  Send,
  ExternalLink,
  Flame,
  Radio,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from '../types';
import { TAB_TITLES, TAB_TO_PATH } from '../lib/seoRouting';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: ActiveTab;
  customUrl?: string;
  customTitle?: string;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  activeTab = 'home',
  customUrl,
  customTitle
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentPath = TAB_TO_PATH[activeTab] || '/';
  const shareUrl = customUrl || (typeof window !== 'undefined' ? `${window.location.origin}${currentPath}` : `https://viceintel.app${currentPath}`);
  const pageTitle = customTitle || TAB_TITLES[activeTab] || 'ViceIntel — Vice City Master Utility Suite';
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`${pageTitle} — Check this out!`);

  const shareLinks = [
    {
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'hover:bg-zinc-800 text-zinc-100 border-zinc-700',
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=GTA6,GTA,ViceCity,ViceIntel`
    },
    {
      name: 'Reddit',
      icon: MessageSquare,
      color: 'hover:bg-orange-600/20 text-orange-400 border-orange-500/30',
      url: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'hover:bg-sky-600/20 text-sky-400 border-sky-500/30',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    },
    {
      name: 'WhatsApp',
      icon: Radio,
      color: 'hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`
    }
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Share ViceIntel</h3>
              <p className="text-xs text-zinc-400">Spread intel, builds & RP servers with the community</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Target Card Preview */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-2">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-pink-400" />
            <span>Target Page</span>
          </div>
          <p className="text-xs font-bold text-white leading-snug line-clamp-2">{pageTitle}</p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 truncate">
            <span className="truncate">{shareUrl}</span>
          </div>
        </div>

        {/* Copy Link Button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 truncate select-all">
            {shareUrl}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Social Platforms Grid */}
        <div className="space-y-2 pt-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
            Direct Share To Network
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {shareLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-2xl bg-zinc-950 border transition flex items-center gap-2.5 text-xs font-bold cursor-pointer ${item.color}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
