import React, { useState, useEffect } from 'react';
import { ShoppingBag, Key, Headphones, Tag, ExternalLink } from 'lucide-react';
import { FTC_AFFILIATE_DISCLOSURE, getAffiliateRedirectUrl, AffiliatePartner } from '../../lib/affiliate-config';
import { isAdEnabledForPage, subscribeAdToggles } from '../../lib/adToggleStore';
import { getActiveAffiliatePartners, subscribeAffiliatesStore, initializeAffiliatesStore } from '../../lib/affiliateStore';

interface GameDealsBoxProps {
  title?: string;
  category?: 'keys' | 'hardware' | 'both';
  placement?: string;
  userDiscordId?: string;
  className?: string;
}

export const GameDealsBox: React.FC<GameDealsBoxProps> = ({
  title = 'Featured Gear & Digital Game Deals',
  category = 'both',
  placement = 'wiki_page',
  userDiscordId,
  className = ''
}) => {
  const [adsVisible, setAdsVisible] = useState<boolean>(() => isAdEnabledForPage('seo_hub'));
  const [partners, setPartners] = useState<Record<string, AffiliatePartner>>(() => getActiveAffiliatePartners());

  useEffect(() => {
    initializeAffiliatesStore().then((map) => setPartners({ ...map }));

    const unsubToggles = subscribeAdToggles(() => {
      setAdsVisible(isAdEnabledForPage('seo_hub'));
    });

    const unsubAffiliates = subscribeAffiliatesStore(() => {
      setPartners({ ...getActiveAffiliatePartners() });
    });

    return () => {
      unsubToggles();
      unsubAffiliates();
    };
  }, []);

  if (!adsVisible) {
    return null;
  }

  const kinguinData = partners.kinguin || {
    id: 'kinguin',
    name: 'Kinguin Digital Keys',
    targetUrl: 'https://www.kinguin.net',
    couponCode: 'VCC5',
    discountBadge: 'BEST PRICE GUARANTEE',
    isActive: true,
    description: 'Verified digital activation keys with instant code delivery.'
  };

  const amazonData = partners.amazon_hardware || {
    id: 'amazon_hardware',
    name: 'Amazon Proximity Gear',
    targetUrl: 'https://www.amazon.com',
    discountBadge: 'PRIME ELIGIBLE',
    isActive: true,
    description: 'Studio broadcast microphones & noise-canceling headsets built for Leonida RP voice channels.'
  };

  const showKeys = (category === 'keys' || category === 'both') && kinguinData.isActive !== false;
  const showHardware = (category === 'hardware' || category === 'both') && amazonData.isActive !== false;

  if (!showKeys && !showHardware) {
    return null;
  }

  return (
    <div
      className={`relative w-full max-w-full overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950/20 p-4 sm:p-6 shadow-xl transition-all duration-300 hover:border-indigo-500/50 my-4 sm:my-6 md:my-8 min-h-[200px] grid grid-cols-1 ${className}`}
    >
      {/* Background Accent Glow */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Header & Disclosure Tag */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-400">
          <ShoppingBag className="h-3.5 w-3.5 text-indigo-400" />
          <span>Verified Deals & Gear</span>
        </div>

        <span className="text-[10px] font-semibold tracking-wide text-zinc-500" title={FTC_AFFILIATE_DISCLOSURE}>
          Sponsored / Affiliate Link
        </span>
      </div>

      <h3 className="mb-4 text-base font-black text-white sm:text-lg">{title}</h3>

      {/* Deal Cards Container */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {/* Digital Keys Deal */}
        {showKeys && (
          <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 transition hover:border-zinc-700">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                  <Key className="h-3 w-3" />
                  GTA VI Key / Cash Cards
                </span>
                <span className="text-[10px] font-extrabold text-emerald-400">BEST PRICE</span>
              </div>

              <h4 className="text-xs font-bold text-white sm:text-sm">
                Pre-Order GTA VI & Digital Keys
              </h4>
              <p className="mt-1 text-[11px] text-zinc-400">
                {kinguinData.description || 'Verified digital activation keys with instant code delivery.'}
              </p>
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-2.5">
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                <Tag className="h-3 w-3 text-amber-400" />
                <span>{kinguinData.couponCode ? `CODE: ${kinguinData.couponCode}` : (kinguinData.discountBadge || 'DISCOUNT AVAILABLE')}</span>
              </div>

              <a
                href={getAffiliateRedirectUrl(kinguinData.id, placement, userDiscordId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition cursor-pointer"
              >
                <span>View Key Deals</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Proximity VoIP Gear Deal */}
        {showHardware && (
          <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 transition hover:border-zinc-700">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-400">
                  <Headphones className="h-3 w-3" />
                  RP Voice Audio Gear
                </span>
                <span className="text-[10px] font-extrabold text-cyan-400">{amazonData.discountBadge || 'VERIFIED'}</span>
              </div>

              <h4 className="text-xs font-bold text-white sm:text-sm">
                Proximity Voice Mics & Headsets
              </h4>
              <p className="mt-1 text-[11px] text-zinc-400">
                {amazonData.description || 'Studio broadcast microphones & noise-canceling headsets built for Leonida RP voice channels.'}
              </p>
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-2.5">
              <span className="text-[10px] text-zinc-400 font-medium">Amazon Prime Shipping</span>

              <a
                href={getAffiliateRedirectUrl(amazonData.id, placement, userDiscordId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 transition cursor-pointer"
              >
                <span>View Gear Deals</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-[9px] text-zinc-500">
        {FTC_AFFILIATE_DISCLOSURE}
      </div>
    </div>
  );
};
