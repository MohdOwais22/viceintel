import { VEHICLES_DATA } from '../data/vehicles';
import { RP_SERVERS_DATA } from '../data/rpServers';
import { BUSINESSES_DATA } from '../data/businesses';
import { MAP_LOCATIONS_DATA } from '../data/mapLocations';
import { WEAPONS_DATA } from '../data/weapons';

export interface ChatMessageServerItem {
  id: string;
  username: string;
  avatar: string;
  isVip: boolean;
  text: string;
  timestamp: string;
  channel: string;
  isDeleted?: boolean;
  deletedBy?: string;
  attachment?: any;
}

const globalForState = globalThis as unknown as {
  serverState?: {
    vehicles: any[];
    rpServers: any[];
    businesses: any[];
    mapLocations: any[];
    weapons: any[];
    communityBuilds: any[];
    chatMessages: ChatMessageServerItem[];
    users: any[];
    pendingApprovals: any[];
  };
};

export const state = globalForState.serverState || {
  vehicles: [...VEHICLES_DATA],
  rpServers: [...RP_SERVERS_DATA],
  businesses: [...BUSINESSES_DATA],
  mapLocations: [...MAP_LOCATIONS_DATA],
  weapons: [...WEAPONS_DATA],
  communityBuilds: [
    {
      id: 'b1',
      title: 'Grotti Cheetah Classic - Vice Beach Street Spec',
      vehicleName: 'Grotti Cheetah Classic',
      author: 'ViceRacer99',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
      category: 'Street Drag',
      performanceScore: 98,
      likes: 142,
      createdAt: '2 hours ago',
      tags: ['Stage 3 Turbo', 'Widebody Kit', 'Neons'],
      cost: '$850,000'
    },
    {
      id: 'b2',
      title: 'Bravado Buffalo EV - Police Interceptor Spec',
      vehicleName: 'Bravado Buffalo EV',
      author: 'HeistLeader_Lucia',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
      category: 'Pursuit / Off-Road',
      performanceScore: 95,
      likes: 89,
      createdAt: '5 hours ago',
      tags: ['Armor Plating', 'Siren Lights', 'Bulletproof Tires'],
      cost: '$1,250,000'
    }
  ],
  chatMessages: [
    {
      id: 'c1',
      username: 'ViceRacer99',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
      isVip: true,
      text: 'Anyone down for a drag race across Julia Tuttle Causeway on Vice Beach?',
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      channel: 'general'
    },
    {
      id: 'c2',
      username: 'HeistLeader_Lucia',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
      isVip: true,
      text: 'Port Gellhorn container heist lobby forming in 15 mins! Need 1 driver with high handling spec.',
      timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      channel: 'heists'
    }
  ],
  users: [
    {
      id: 'u1',
      username: 'ViceRacer99',
      email: 'viceracer99@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
      role: 'VIP Member',
      isVip: true,
      vipExpires: '2026-09-03',
      joinedDate: '2026-01-12',
      publishedBuildsCount: 4,
      status: 'Active'
    },
    {
      id: 'u2',
      username: 'HeistLeader_Lucia',
      email: 'lucia.vice@outlook.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
      role: 'Admin',
      isVip: true,
      vipExpires: 'Lifetime',
      joinedDate: '2025-11-01',
      publishedBuildsCount: 12,
      status: 'Active'
    }
  ],
  pendingApprovals: []
};

if (process.env.NODE_ENV !== 'production') globalForState.serverState = state;
