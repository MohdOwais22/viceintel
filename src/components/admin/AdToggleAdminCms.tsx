import React, { useState, useEffect } from 'react';
import {
  Tv,
  Globe,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Zap,
  ShieldAlert,
  Sparkles,
  Layers,
  Power,
  RefreshCw,
  Info,
  Link2
} from 'lucide-react';
import {
  DEFAULT_PAGE_AD_SETTINGS,
  PageAdSetting,
  getGlobalAdsEnabled,
  setGlobalAdsEnabled,
  getPageAdStateMap,
  setPageAdEnabled,
  setAllPagesAdEnabled,
  subscribeAdToggles
} from '../../lib/adToggleStore';
import { logStaffActivity } from '../../lib/staffAuditLogger';
import { AffiliateAdminCms } from './AffiliateAdminCms';

export const AdToggleAdminCms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ad_toggles' | 'affiliate_links'>('ad_toggles');
  const [globalEnabled, setGlobalEnabled] = useState<boolean>(() => getGlobalAdsEnabled());
  const [pageMap, setPageMap] = useState<Record<string, boolean>>(() => getPageAdStateMap());
  const [notice, setNotice] = useState<string | null>(null);

  const refreshState = () => {
    setGlobalEnabled(getGlobalAdsEnabled());
    setPageMap(getPageAdStateMap());
  };

  useEffect(() => {
    refreshState();
    const unsubscribe = subscribeAdToggles(() => {
      refreshState();
    });
    return unsubscribe;
  }, []);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleToggleGlobal = () => {
    const nextState = !globalEnabled;
    setGlobalAdsEnabled(nextState);
    showNotification(`Global ad display toggled ${nextState ? 'ON (Enabled Everywhere)' : 'OFF (Disabled Everywhere)'}!`);

    logStaffActivity({
      actionType: 'SYSTEM_CONFIG_CHANGE',
      actionCategory: 'System Operations',
      targetId: 'global_ads',
      targetName: 'Global Ad Display Switch',
      targetType: 'ad_monetization',
      severity: 'HIGH',
      details: `Staff toggled global ads ${nextState ? 'ENABLED' : 'DISABLED'} across all app pages.`
    }).catch(() => {});
  };

  const handleToggleSinglePage = (pageKey: string, pageName: string) => {
    const currentState = pageMap[pageKey] !== false;
    const nextState = !currentState;
    setPageAdEnabled(pageKey, nextState);
    showNotification(`Ads for "${pageName}" toggled ${nextState ? 'ON' : 'OFF'}!`);

    logStaffActivity({
      actionType: 'SYSTEM_CONFIG_CHANGE',
      actionCategory: 'System Operations',
      targetId: `page_ad_${pageKey}`,
      targetName: pageName,
      targetType: 'page_ad_toggle',
      severity: 'MEDIUM',
      details: `Staff toggled ads ${nextState ? 'ENABLED' : 'DISABLED'} on single page "${pageName}".`
    }).catch(() => {});
  };

  const handleBulkToggleAllPages = (enable: boolean) => {
    setAllPagesAdEnabled(enable);
    showNotification(`All single pages batch toggled ${enable ? 'ON' : 'OFF'}!`);

    logStaffActivity({
      actionType: 'SYSTEM_CONFIG_CHANGE',
      actionCategory: 'System Operations',
      targetId: 'all_pages_ad_toggle',
      targetName: 'All Application Pages',
      targetType: 'ad_monetization',
      severity: 'HIGH',
      details: `Staff batch toggled ads ${enable ? 'ENABLED' : 'DISABLED'} across all single pages simultaneously.`
    }).catch(() => {});
  };

  const enabledPagesCount = DEFAULT_PAGE_AD_SETTINGS.filter((p) => pageMap[p.key] !== false).length;

  return (
    <div className="space-y-6">
      {/* CMS Sub Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('ad_toggles')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'ad_toggles'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Page Ad Display Switches</span>
        </button>

        <button
          onClick={() => setActiveTab('affiliate_links')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'affiliate_links'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Affiliate Partners & Redirect Links</span>
        </button>
      </div>

      {activeTab === 'affiliate_links' ? (
        <AffiliateAdminCms />
      ) : (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/30 p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                <Tv className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Sponsorship Controls
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">Real-Time Event Propagation</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Ad & Affiliate Display Control Center
                </h3>
                <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                  Toggle promotional ad banners and affiliate promo cards globally or per single page. Changes take effect instantly without reloading or interrupting features.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleGlobal}
              className={`px-5 py-3 rounded-xl font-black text-xs transition-all duration-200 flex items-center gap-2.5 shadow-lg cursor-pointer ${
                globalEnabled
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{globalEnabled ? 'GLOBAL ADS: ENABLED' : 'GLOBAL ADS: DISABLED'}</span>
            </button>
          </div>

          {/* Action Notice */}
          {notice && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 flex items-center justify-between animate-fade-in shadow-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{notice}</span>
              </div>
              <button type="button" onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white text-xs">✕</button>
            </div>
          )}

          {/* Single Pages Status Box */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>Single Page Display Rules</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage individual ad visibility across views. Currently <span className="text-emerald-400 font-bold">{enabledPagesCount} of {DEFAULT_PAGE_AD_SETTINGS.length}</span> pages have ads enabled.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkToggleAllPages(true)}
                  className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enable All Pages</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkToggleAllPages(false)}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Disable All Pages</span>
                </button>
              </div>
            </div>

            {/* Page Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEFAULT_PAGE_AD_SETTINGS.map((page) => {
                const isEnabled = globalEnabled && pageMap[page.key] !== false;
                const isExplicitlyDisabled = pageMap[page.key] === false;

                return (
                  <div
                    key={page.key}
                    className={`p-4 rounded-xl border transition-all duration-200 space-y-3 ${
                      isEnabled
                        ? 'bg-zinc-950 border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-zinc-950/80 border-zinc-800 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-extrabold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 inline-block">
                          {page.category}
                        </span>
                        <h5 className="text-xs font-black text-white">{page.name}</h5>
                        <code className="text-[11px] text-zinc-500 font-mono block">{page.pathPattern}</code>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          isEnabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isExplicitlyDisabled
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {!globalEnabled ? 'GLOBAL OFF' : isEnabled ? 'ADS ON' : 'ADS OFF'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-400">Page Ad Display</span>

                      <button
                        type="button"
                        onClick={() => handleToggleSinglePage(page.key, page.name)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex items-start gap-3 text-xs text-zinc-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Ad toggle preferences are saved instantly to persistent browser storage and synchronized via custom runtime state events across all active open tabs. No dev server restart or app rebuilding is needed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
