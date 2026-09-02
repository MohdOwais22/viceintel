'use client';
import React from 'react';
import { ActiveTab } from '../types';
import { VEHICLES_DATA } from '../data/vehicles';
import { WEAPONS_DATA } from '../data/weapons';
import {
  Car,
  Crosshair,
  GitCompare,
  Wrench,
  DollarSign,
  MapPin,
  Server,
  Coins,
  Crown,
  MessageSquare,
  ShieldCheck,
  BookOpen,
  Newspaper,
  Lock,
  User
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdmin?: boolean;
  isStaff?: boolean;
  onOpenAuth?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isAdmin = false,
  isStaff = false,
  onOpenAuth
}) => {
  const isAuthorizedStaff = isAdmin || isStaff;

  const allTabs = [
    { id: 'vehicles' as ActiveTab, label: 'Vehicles DB', icon: Car, badge: `${VEHICLES_DATA.length} Vehicles` },
    { id: 'weapons' as ActiveTab, label: 'Weapons Spec', icon: Crosshair, badge: `${WEAPONS_DATA.length} Guns` },
    { id: 'comparison' as ActiveTab, label: '1v1 Compare', icon: GitCompare, badge: 'Dynamic' },
    { id: 'mod-calculator' as ActiveTab, label: 'Mod Cost Builder', icon: Wrench, badge: 'Utility' },
    { id: 'roi-calculator' as ActiveTab, label: 'Business ROI', icon: DollarSign, badge: 'Profit' },
    { id: 'map' as ActiveTab, label: 'Vice City Map', icon: MapPin, badge: 'Interactive' },
    { id: 'monetization' as ActiveTab, label: 'VIP Perks & Sponsorships', icon: Crown, badge: 'VIP $3.99' },
    { id: 'blog' as ActiveTab, label: 'Game Intel & Blog', icon: Newspaper, badge: 'Map Leaks' },
    { id: 'rp-servers' as ActiveTab, label: 'GTA 6 RP', icon: Server, badge: 'Directory' },
    { id: 'chat' as ActiveTab, label: 'Player Chat', icon: MessageSquare, badge: 'Live' },
    { id: 'profile' as ActiveTab, label: 'Player Profile', icon: User, badge: 'Pass & Tag' },
    { id: 'admin' as ActiveTab, label: 'Admin Panel', icon: ShieldCheck, badge: 'Admin', restricted: true },
    { id: 'docs' as ActiveTab, label: 'Docs & API', icon: BookOpen, badge: 'API Spec', restricted: true },
  ];

  // Hide restricted tabs for non-staff users
  const visibleTabs = allTabs.filter((tab) => !tab.restricted || isAuthorizedStaff);

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800/80 px-4 lg:px-8 py-2 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-max">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
              {tab.restricted && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Staff</span>
                </span>
              )}
              {!tab.restricted && tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-rose-500/25 text-rose-200' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

