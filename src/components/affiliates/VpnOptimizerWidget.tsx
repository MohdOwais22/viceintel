import React, { useState, useEffect } from 'react';
import { Wifi, ExternalLink, Radio } from 'lucide-react';
import { FTC_AFFILIATE_DISCLOSURE, getAffiliateRedirectUrl, AffiliatePartner } from '../../lib/affiliate-config';
import { isAdEnabledForPage, subscribeAdToggles } from '../../lib/adToggleStore';
import { getActiveAffiliatePartners, subscribeAffiliatesStore, initializeAffiliatesStore } from '../../lib/affiliateStore';

interface VpnOptimizerWidgetProps {
  serverName?: string;
  serverRegion?: string;
  ping?: number;
  placement?: string;
  userDiscordId?: string;
  compact?: boolean;
  className?: string;
}

export const VpnOptimizerWidget: React.FC<VpnOptimizerWidgetProps> = ({
  serverName = 'Vice City Official RP',
  serverRegion = 'NA East',
  ping = 68,
  placement = 'directory_card',
  userDiscordId,
  compact = false,
  className = ''
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('exitlag');
  const [adsVisible, setAdsVisible] = useState<boolean>(() => isAdEnabledForPage('rp_servers'));
  const [partners, setPartners] = useState<Record<string, AffiliatePartner>>(() => getActiveAffiliatePartners());

  useEffect(() => {
    initializeAffiliatesStore().then((map) => setPartners({ ...map }));

    const unsubToggles = subscribeAdToggles(() => {
      setAdsVisible(isAdEnabledForPage('rp_servers'));
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

  const activePartner = partners[selectedPartnerId] || partners.exitlag || {
    id: 'exitlag',
    name: 'ExitLag',
    targetUrl: 'https://www.exitlag.com/aff.php?aff=vicecitycentral',
    couponCode: 'VCC15',
    isActive: true
  };

  if (activePartner.isActive === false) {
    return null;
  }

  const redirectUrl = getAffiliateRedirectUrl(activePartner.id, placement, userDiscordId);

  return (
    <div
      className={`relative w-full max-w-full overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-zinc-950 via-zinc-900 to-cyan-950/20 p-4 sm:p-5 shadow-lg transition-all duration-300 hover:border-cyan-500/50 my-4 sm:my-6 min-h-[140px] grid grid-cols-1 ${className}`}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />

      {/* Header Badge & Top CTA */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            <Wifi className="h-3 w-3 animate-pulse text-cyan-400" />
            <span>Ping & Routing Optimizer</span>
          </div>

          <span className="hidden sm:inline text-[9px] font-semibold tracking-wide text-zinc-500" title={FTC_AFFILIATE_DISCLOSURE}>
            Sponsored
          </span>
        </div>

        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 rounded-md bg-cyan-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-black transition-all hover:bg-cyan-400 active:scale-95 cursor-pointer shadow-sm shrink-0"
        >
          <span>Lower Ping ({activePartner.name.split(' ')[0]})</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Connection Notice */}
      <div className="mb-3">
        <h4 className="text-xs font-bold text-zinc-200 sm:text-sm">
          High Ping or Routing Issues? Reduce latency & stabilize connection on <span className="text-cyan-400 font-extrabold">{serverName}</span>.
        </h4>
        {ping > 40 && (
          <p className="mt-1 text-[11px] text-zinc-400">
            Detected average response latency: <span className="font-semibold text-amber-400">{ping}ms ({serverRegion})</span>. Optimize your connection routes for competitive smoothness.
          </p>
        )}
      </div>

      {/* Partner Tabs */}
      {!compact && (
        <div className="mb-3 flex gap-2">
          {['exitlag', 'nordvpn'].map((pId) => {
            const pData = partners[pId];
            if (!pData || pData.isActive === false) return null;
            return (
              <button
                key={pId}
                onClick={() => setSelectedPartnerId(pId)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  selectedPartnerId === pId
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-extrabold'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <Radio className="h-3 w-3 text-cyan-400" />
                <span>{pData.name.split(' ')[0]}</span>
                {pData.discountBadge && (
                  <span className="text-[9px] text-emerald-400 font-normal">{pData.discountBadge}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-[9px] text-zinc-500">
        {FTC_AFFILIATE_DISCLOSURE}
      </div>
    </div>
  );
};
