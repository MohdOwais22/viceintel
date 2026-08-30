'use client';
import React from 'react';
import { SubdomainMode } from '../lib/subdomainRouter';

interface SubdomainBannerProps {
  mode: SubdomainMode;
  isSimulated: boolean;
  hostname: string;
  onExitSimulation?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const SubdomainBanner: React.FC<SubdomainBannerProps> = () => {
  // Subdomains removed as requested - all features operate unified on single domain
  return null;
};

