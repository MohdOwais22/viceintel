import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Database, ExternalLink, Check, Copy, Tag } from 'lucide-react';
import { FTC_AFFILIATE_DISCLOSURE, getAffiliateRedirectUrl, AffiliatePartner } from '../../lib/affiliate-config';
import { isAdEnabledForPage, subscribeAdToggles } from '../../lib/adToggleStore';
import { getActiveAffiliatePartners, subscribeAffiliatesStore, initializeAffiliatesStore } from '../../lib/affiliateStore';

interface HostingPromoCardProps {
  headline?: string;
  subheadline?: string;
  placement?: string;
  userDiscordId?: string;
  serverSlug?: string;
  framework?: string;
  className?: string;
  compact?: boolean;
}

export const HostingPromoCard: React.FC<HostingPromoCardProps> = ({
  headline = 'Ready to Deploy Your Server Config?',
  subheadline = 'Official txAdmin & FiveM Server Hosting Partners',
  placement = 'config_builder',
  userDiscordId,
  framework = 'QBCore',
  className = '',
  compact = false
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('zap_hosting');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [adsVisible, setAdsVisible] = useState<boolean>(() => isAdEnabledForPage('config_builder'));
  const [partners, setPartners] = useState<Record<string, AffiliatePartner>>(() => getActiveAffiliatePartners());

  useEffect(() => {
    initializeAffiliatesStore().then((map) => setPartners({ ...map }));

    const unsubToggles = subscribeAdToggles(() => {
      setAdsVisible(isAdEnabledForPage('config_builder'));
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

  const activePartner = partners[selectedPartnerId] || partners.zap_hosting || {
    id: 'zap_hosting',
    name: 'ZAP-Hosting',
    targetUrl: 'https://zap-hosting.com/a/vicecitycentral',
    couponCode: 'VCC20',
    discountBadge: '20% OFF CODE: VCC20',
    isActive: true,
    description: 'Official FiveM txAdmin Server Hosting with automated DDoS mitigation.'
  };

  if (activePartner.isActive === false) {
    return null;
  }

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const redirectUrl = getAffiliateRedirectUrl(activePartner.id, placement, userDiscordId);

  return (
    <div
      className={`relative w-full max-w-full overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/20 p-4 sm:p-5 shadow-xl transition-all duration-300 hover:border-amber-500/50 my-4 sm:my-6 min-h-[160px] grid grid-cols-1 ${className}`}
    >
      {/* Background Accent Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />

      {/* Header Row with Badge, FTC tag, AND Deploy Button */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <Zap className="h-3 w-3 animate-pulse text-amber-400" />
            <span>Recommended {framework} Host</span>
          </div>

          <span className="hidden sm:inline text-[10px] font-semibold text-zinc-500" title={FTC_AFFILIATE_DISCLOSURE}>
            Sponsored
          </span>
        </div>

        {/* TOP HEADER CTA LINK */}
        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-black shadow-md transition-all hover:from-amber-400 hover:to-amber-500 active:scale-95 cursor-pointer shrink-0"
        >
          <span>Deploy on {activePartner.name.split(' ')[0]}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Main Headline & Subheadline */}
      <div className="mb-3">
        <h3 className="text-sm font-black text-white sm:text-base">{headline}</h3>
        <p className="mt-0.5 text-xs text-zinc-400">{subheadline}</p>
      </div>

      {/* Partner Selector Tabs & Features */}
      {!compact && (
        <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-lg bg-zinc-900/90 p-1 border border-zinc-800">
          {[
            { id: 'zap_hosting', defaultLabel: 'ZAP-Hosting', badge: 'Official 20% OFF' },
            { id: 'hostinger_vps', defaultLabel: 'Hostinger VPS', badge: 'NVMe 15% OFF' },
            { id: 'ovh_cloud', defaultLabel: 'OVHcloud', badge: 'Bare Metal' }
          ].map((item) => {
            const partnerData = partners[item.id];
            const name = partnerData?.name ? partnerData.name.split(' ')[0] : item.defaultLabel;
            const badge = partnerData?.discountBadge || item.badge;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedPartnerId(item.id)}
                className={`flex flex-col items-center justify-center rounded-md py-1.5 px-1 text-[11px] font-bold transition-all cursor-pointer ${
                  selectedPartnerId === item.id
                    ? 'bg-amber-500 text-black shadow font-extrabold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <span>{name}</span>
                <span
                  className={`text-[9px] uppercase font-mono truncate max-w-full ${
                    selectedPartnerId === item.id ? 'text-black/80 font-extrabold' : 'text-amber-400/80'
                  }`}
                >
                  {badge}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Compact Feature Pills */}
      <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-semibold text-zinc-300">
        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-zinc-300">
          <Zap className="h-3 w-3 text-amber-400 shrink-0" />
          <span>txAdmin Ready</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-zinc-300">
          <ShieldCheck className="h-3 w-3 text-cyan-400 shrink-0" />
          <span>DDoS Shielded</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-zinc-300">
          <Database className="h-3 w-3 text-emerald-400 shrink-0" />
          <span>MySQL Auto-Import</span>
        </span>
      </div>

      {/* Coupon Code & Primary Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
        {activePartner.couponCode ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-amber-500/50 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-300">
              <Tag className="h-3 w-3 text-amber-400" />
              <span>{activePartner.discountBadge || activePartner.couponCode}</span>
            </span>

            <button
              onClick={(e) => handleCopyCode(activePartner.couponCode!, e)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition cursor-pointer"
            >
              {copiedCode === activePartner.couponCode ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-400">
            {activePartner.description}
          </span>
        )}

        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-amber-400 active:scale-95 cursor-pointer shadow"
        >
          <span>Deploy Server Now</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-2 text-[9px] text-zinc-500">
        {FTC_AFFILIATE_DISCLOSURE}
      </div>
    </div>
  );
};
