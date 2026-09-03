'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  ChevronRight, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Zap,
  UserCheck,
  Shield,
  CreditCard,
  Bot,
  X
} from 'lucide-react';
import { ServerOwnerNotification } from '../../types';
import { markServerNotificationAsRead, markAllServerNotificationsAsRead } from '../../lib/server-notification-service';

interface ServerOwnerNotificationDropdownProps {
  serverSlug: string;
  notifications: ServerOwnerNotification[];
  onOpenCenter: () => void;
  onNavigateSection: (sectionKey: string) => void;
}

export const ServerOwnerNotificationDropdown: React.FC<ServerOwnerNotificationDropdownProps> = ({
  serverSlug,
  notifications,
  onOpenCenter,
  onNavigateSection
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllServerNotificationsAsRead(serverSlug, notifications.map(n => n.id));
  };

  const handleItemClick = (notif: ServerOwnerNotification) => {
    if (!notif.read) {
      markServerNotificationAsRead(notif.id, serverSlug);
    }
    setIsOpen(false);
    if (notif.actionSection) {
      onNavigateSection(notif.actionSection);
    } else {
      onOpenCenter();
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        id="btn-server-owner-bell"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-zinc-800 border-cyan-500/60 text-white ring-2 ring-cyan-500/20 shadow-lg'
            : 'bg-zinc-900 border-zinc-800 hover:border-cyan-500/40 text-zinc-300 hover:text-white'
        }`}
        title="Server Alerts & Sentinel Notifications"
      >
        <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${unreadCount > 0 ? 'text-cyan-400 animate-pulse' : 'text-zinc-400'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full ring-2 ring-zinc-950 shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop overlay to prevent visual clashing with underlying dashboard components */}
          <div 
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm transition-opacity" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            onClick={() => setIsOpen(false)} 
            aria-hidden="true"
          />

          <div 
            className="absolute right-0 top-full mt-2.5 w-[calc(100vw-2.5rem)] max-w-sm sm:w-96 bg-zinc-950 border-2 border-cyan-500/40 rounded-2xl shadow-2xl shadow-black z-50 overflow-hidden ring-1 ring-cyan-500/20"
            style={{ backgroundColor: '#090d16', maxHeight: 'calc(100vh - 120px)', opacity: 1 }}
          >
            {/* Dropdown Header */}
            <div 
              className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between"
              style={{ backgroundColor: '#111726' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">Server Alerts</span>
                {unreadCount > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {unreadCount} new
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-zinc-400">All caught up</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-zinc-300 hover:text-cyan-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mark read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick List */}
            <div 
              className="max-h-80 overflow-y-auto divide-y divide-zinc-800 overscroll-contain"
              style={{ backgroundColor: '#090d16' }}
            >
              {recentNotifications.length === 0 ? (
                <div className="p-8 text-center space-y-2" style={{ backgroundColor: '#090d16' }}>
                  <Bell className="w-6 h-6 mx-auto text-zinc-500" />
                  <p className="text-xs text-zinc-400">No recent server alerts.</p>
                </div>
              ) : (
                recentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    style={{ backgroundColor: !notif.read ? '#131b2e' : '#090d16' }}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 hover:brightness-125 ${
                      !notif.read ? 'border-l-4 border-cyan-400' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      notif.severity === 'critical' || notif.severity === 'error'
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                        : notif.severity === 'warning'
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                        : notif.severity === 'success'
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                        : 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                    }`}>
                      {notif.category === 'applications' ? (
                        <UserCheck className="w-4 h-4" />
                      ) : notif.category === 'staff' ? (
                        <Shield className="w-4 h-4" />
                      ) : notif.category === 'billing' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${!notif.read ? 'text-white font-black' : 'text-zinc-100 font-bold'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-zinc-400 shrink-0 flex items-center gap-0.5 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-[12px] text-zinc-300 line-clamp-2 leading-relaxed font-normal">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer View All Button */}
            <div 
              className="p-3 border-t border-zinc-800"
              style={{ backgroundColor: '#111726' }}
            >
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenCenter();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer"
              >
                <span>Open Sentinel Notification Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
