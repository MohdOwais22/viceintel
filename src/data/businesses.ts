import { Business } from '../types';

export const BUSINESSES_DATA: Business[] = [
  {
    id: 'b1',
    slug: 'vice-beach-nightclub',
    name: 'Malibu Club Vice Beach',
    type: 'Nightclub',
    location: 'Ocean Drive, Vice Beach',
    purchasePrice: 2850000,
    maxDailyIncome: 120000,
    setupCost: 350000,
    maxUpgradesCost: 1850000,
    payoutFrequencyHours: 1,
    difficulty: 'Easy',
    description: 'Premier oceanfront nightlife venue that generates passive safe cash and serves as a hub for contraband warehousing.',
    imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'b2',
    slug: 'port-gellhorn-chop-shop',
    name: 'Port Gellhorn Salvage & Chop',
    type: 'Chop Shop',
    location: 'Port Gellhorn Industrial Zone',
    purchasePrice: 2100000,
    maxDailyIncome: 240000,
    setupCost: 200000,
    maxUpgradesCost: 1400000,
    payoutFrequencyHours: 4,
    difficulty: 'Medium',
    description: 'High-margin vehicle dismantling operation. Steal targeted luxury supercars across Leonida and break them down for parts.',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'b3',
    slug: 'starfish-island-warehouse',
    name: 'Starfish Imports Counterfeit Hub',
    type: 'Counterfeit Cash',
    location: 'Starfish Island Waterway',
    purchasePrice: 1950000,
    maxDailyIncome: 180000,
    setupCost: 150000,
    maxUpgradesCost: 1200000,
    payoutFrequencyHours: 2,
    difficulty: 'Medium',
    description: 'High-tech printing press producing high-grade counterfeit currencies for local Vice City syndicates.',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'b4',
    slug: 'everglades-acid-lab-rv',
    name: 'Everglades Brickade 6x6 Acid Lab',
    type: 'Acid Lab',
    location: 'Mobile RV Unit / Everglades',
    purchasePrice: 750000,
    maxDailyIncome: 310000,
    setupCost: 100000,
    maxUpgradesCost: 650000,
    payoutFrequencyHours: 3,
    difficulty: 'Hard',
    description: 'Armored mobile chemical lab offering the highest solo ROI per hour across the entire state of Leonida.',
    imageUrl: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=80'
  }
];
