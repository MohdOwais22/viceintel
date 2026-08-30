import React, { useState, useEffect } from 'react';
import { DollarSign, Save, RefreshCw, CheckCircle2, ShieldCheck, Zap, AlertCircle, Tag, Crown, Globe } from 'lucide-react';
import { usePricingConfig, updatePricingConfigInFirestore } from '../lib/vipConfig';
import { formatDateTime } from '../lib/dateUtils';

interface SystemPricingControlProps {
  currentUser?: any;
  userRole?: string;
  onPricingUpdated?: () => void;
}

export const SystemPricingControl: React.FC<SystemPricingControlProps> = ({
  currentUser,
  userRole = 'Admin',
  onPricingUpdated
}) => {
  const currentPricing = usePricingConfig();

  // ENV Pricing Variables (Section 7 of .env.example)
  const [vipPrice, setVipPrice] = useState<number>(currentPricing.vipPrice);
  const [vipVcValue, setVipVcValue] = useState<number>(currentPricing.vipVcValue || 19995);
  const [vcRatePerDollar, setVcRatePerDollar] = useState<number>(currentPricing.vcRatePerDollar || 5000);
  const [sponsorPrice12, setSponsorPrice12] = useState<number>(currentPricing.sponsorPrice12 || 12.00);
  const [sponsorPrice29, setSponsorPrice29] = useState<number>(currentPricing.sponsorPrice29 || 29.00);
  const [b2bSponsorPrice, setB2bSponsorPrice] = useState<number>(currentPricing.b2bSponsorPrice || 49.00);
  const [sponsorPrice99, setSponsorPrice99] = useState<number>(currentPricing.sponsorPrice99 || 99.00);
  const [sponsorPrice199, setSponsorPrice199] = useState<number>(currentPricing.sponsorPrice199 || 199.00);

  // Currency Symbol & Promo Tagline
  const [currencySymbol, setCurrencySymbol] = useState<string>(currentPricing.currencySymbol || '$');
  const [promoBadgeText, setPromoBadgeText] = useState<string>(currentPricing.promoBadgeText || 'SPECIAL COMMUNITY DISCOUNT');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [saveErrorNotice, setSaveErrorNotice] = useState<string | null>(null);

  // Sync inputs when hook updates
  useEffect(() => {
    setVipPrice(currentPricing.vipPrice);
    setVipVcValue(currentPricing.vipVcValue || 19995);
    setVcRatePerDollar(currentPricing.vcRatePerDollar || 5000);
    setSponsorPrice12(currentPricing.sponsorPrice12 || 12.00);
    setSponsorPrice29(currentPricing.sponsorPrice29 || 29.00);
    setB2bSponsorPrice(currentPricing.b2bSponsorPrice || 49.00);
    setSponsorPrice99(currentPricing.sponsorPrice99 || 99.00);
    setSponsorPrice199(currentPricing.sponsorPrice199 || 199.00);
    setCurrencySymbol(currentPricing.currencySymbol || '$');
    setPromoBadgeText(currentPricing.promoBadgeText || 'SPECIAL COMMUNITY DISCOUNT');
  }, [
    currentPricing.vipPrice,
    currentPricing.vipVcValue,
    currentPricing.vcRatePerDollar,
    currentPricing.sponsorPrice12,
    currentPricing.sponsorPrice29,
    currentPricing.b2bSponsorPrice,
    currentPricing.sponsorPrice99,
    currentPricing.sponsorPrice199,
    currentPricing.currencySymbol,
    currentPricing.promoBadgeText
  ]);

  const handleSavePricing = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccessNotice(null);
    setSaveErrorNotice(null);

    const actorName = currentUser?.displayName || currentUser?.email || (userRole === 'Admin' ? 'L4 Admin HQ' : 'L3 Staff Member');

    try {
      const updated = await updatePricingConfigInFirestore(
        {
          vipPrice: Number(vipPrice),
          vipVcValue: Math.min(100000, Math.max(1, Number(vipVcValue) || 19995)),
          vcRatePerDollar: Math.min(100000, Math.max(1, Number(vcRatePerDollar) || 5000)),
          sponsorPrice12: Number(sponsorPrice12),
          sponsorPrice29: Number(sponsorPrice29),
          b2bSponsorPrice: Number(b2bSponsorPrice),
          sponsorPrice99: Number(sponsorPrice99),
          sponsorPrice199: Number(sponsorPrice199),
          currencySymbol,
          promoBadgeText
        },
        actorName
      );

      setSaveSuccessNotice(
        `✅ System Pricing & VC Currency Matrix Deployed! VIP Pass: ${updated.currencySymbol}${updated.vipPrice.toFixed(2)}/mo (${updated.vipVcValue.toLocaleString()} VC) | Rate: ${updated.vcRatePerDollar.toLocaleString()} VC / $1.00 USD.`
      );

      if (onPricingUpdated) {
        onPricingUpdated();
      }
    } catch (err: any) {
      console.error('Failed to update system pricing:', err);
      setSaveErrorNotice(err?.message || 'Failed to persist pricing update to Firestore/Server API.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setVipPrice(3.99);
    setVipVcValue(19995);
    setVcRatePerDollar(5000);
    setSponsorPrice12(12.00);
    setSponsorPrice29(29.00);
    setB2bSponsorPrice(49.00);
    setSponsorPrice99(99.00);
    setSponsorPrice199(199.00);
    setCurrencySymbol('$');
    setPromoBadgeText('SPECIAL COMMUNITY DISCOUNT');
  };

  return (
    <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
              L4 ADMIN PRICING CONTROL
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400 animate-pulse" /> .env Variables Synchronized
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5 mt-1.5">
            <DollarSign className="w-6 h-6 text-amber-400" />
            Environment Variable Pricing Control HQ
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure the 6 core pricing tier variables defined in <code className="text-amber-300 font-mono bg-zinc-950 px-1 rounded">.env.example</code> (Section 7: Monetization & Payment Tier Pricing Configuration).
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefaults}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto border border-zinc-700/60"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
          Reset .env Defaults
        </button>
      </div>

      {/* Success / Error Notification Banners */}
      {saveSuccessNotice && (
        <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-xl p-4 text-emerald-200 text-xs font-medium flex items-start gap-3 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-emerald-300">{saveSuccessNotice}</p>
            <p className="text-[11px] text-emerald-400/80">
              Persisted to Firestore <code className="font-mono bg-emerald-900/60 px-1 rounded">systemConfig/pricing</code> and live Express server memory.
            </p>
          </div>
        </div>
      )}

      {saveErrorNotice && (
        <div className="bg-rose-950/70 border border-rose-500/50 rounded-xl p-4 text-rose-200 text-xs font-medium flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-300">Pricing Update Error</p>
            <p className="text-[11px] text-rose-400/80">{saveErrorNotice}</p>
          </div>
        </div>
      )}

      {/* Pricing Form strictly matching .env variables */}
      <form onSubmit={handleSavePricing} className="space-y-6 relative z-10">
        {/* SECTION 1: B2C VIP Pass (.env: VIP_PRICE) */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-2xl p-5 space-y-4 hover:border-amber-500/60 transition shadow-inner">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-extrabold text-white">B2C Consumer VIP Membership Pass</h3>
                <span className="text-[11px] font-mono text-amber-400/90 font-bold">
                  Variable: <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-amber-300">VIP_PRICE</code>
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
              Default: $3.99/mo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Monthly VIP Price ({currencySymbol}/mo)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 font-bold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.99"
                  max="999.00"
                  value={vipPrice}
                  onChange={(e) => setVipPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-8 pr-3 py-2.5 text-white font-extrabold text-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Presets</span>
              <div className="flex flex-wrap gap-1.5">
                {[1.99, 2.99, 3.99, 4.99, 9.99].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVipPrice(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                      vipPrice === preset
                        ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white'
                    }`}
                  >
                    ${preset.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: VC CURRENCY ADJUSTABLE SYSTEM (ADMIN CMS) */}
        <div className="bg-zinc-950/90 border border-yellow-500/40 rounded-2xl p-5 space-y-4 hover:border-yellow-500/70 transition shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 font-black text-sm">
                VC
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  Vice Cash (VC) Currency Exchange Rate & Conversion System
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-mono uppercase font-black">
                    ADMIN CMS
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Configure the VC reward granted per $3.99 VIP pass purchase and the base VC exchange rate per $1.00 USD across the entire platform.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded border border-yellow-500/30">
              Active Rate: {vcRatePerDollar.toLocaleString()} VC / $1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. VIP Pass VC Allocation */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-yellow-300 uppercase tracking-wider">
                VIP Pass VC Grant ({currencySymbol}{vipPrice.toFixed(2)} Pass)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={vipVcValue}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setVipVcValue(val > 100000 ? 100000 : val);
                  }}
                  className="w-full bg-zinc-950 border border-yellow-500/40 rounded-xl px-3.5 py-2.5 text-yellow-400 font-black text-lg font-mono focus:outline-none focus:border-yellow-400"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-500 font-mono">
                  VC (Max: 100,000)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Amount of Vice Cash granted immediately to subscribers when they purchase or redeem a VIP Membership Pass.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[5000, 10000, 19995, 25000, 50000, 100000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVipVcValue(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                      vipVcValue === preset
                        ? 'bg-yellow-400 text-black border-yellow-300 font-extrabold shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-yellow-500/40 hover:text-yellow-300'
                    }`}
                  >
                    {preset.toLocaleString()} VC
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Base Exchange Rate per $1 USD */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-yellow-300 uppercase tracking-wider">
                Base Exchange Rate (VC per {currencySymbol}1.00 USD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={vcRatePerDollar}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setVcRatePerDollar(val > 100000 ? 100000 : val);
                  }}
                  className="w-full bg-zinc-950 border border-yellow-500/40 rounded-xl px-3.5 py-2.5 text-yellow-400 font-black text-lg font-mono focus:outline-none focus:border-yellow-400"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-500 font-mono">
                  VC / $1 USD (Max: 100,000)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Global multiplier used for dynamic payment gateways, custom vouchers, and Shark Card packages.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[1000, 2500, 5000, 10000, 20000].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setVcRatePerDollar(rate)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                      vcRatePerDollar === rate
                        ? 'bg-yellow-400 text-black border-yellow-300 font-extrabold shadow-sm'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-yellow-500/40 hover:text-yellow-300'
                    }`}
                  >
                    {rate.toLocaleString()} VC / $1
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Conversion Rate Matrix Preview */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-yellow-400/90 block">
              ⚡ Live Conversion Matrix Preview
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              {[
                { label: 'VIP Pass', price: vipPrice, vc: vipVcValue },
                { label: 'Micro ($10)', price: 10, vc: Math.round(10 * vcRatePerDollar) },
                { label: 'Starter ($20)', price: 20, vc: Math.round(20 * vcRatePerDollar) },
                { label: 'Pro ($50)', price: 50, vc: Math.round(50 * vcRatePerDollar) },
                { label: 'Ultimate ($100)', price: 100, vc: Math.round(100 * vcRatePerDollar) }
              ].map((tier, idx) => (
                <div key={idx} className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 block">{tier.label}</span>
                  <span className="text-xs font-black text-yellow-400 font-mono block">
                    {Math.min(100000, tier.vc).toLocaleString()} VC
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono block">
                    {currencySymbol}{tier.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: B2B SPONSORSHIP TIERS FROM .ENV */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-rose-400" />
              B2B Sponsored RP Server Tiers Defined in .env
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">
              5 Configurable Environment Tiers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. PAYMENT_PRICE_12 */}
            <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl space-y-2.5 hover:border-zinc-700 transition">
              <div>
                <span className="text-[10px] font-bold text-zinc-300 block uppercase">Micro Sponsor</span>
                <code className="text-[9px] font-mono text-zinc-500 block">PAYMENT_PRICE_12</code>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-400 font-bold text-xs">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={sponsorPrice12}
                  onChange={(e) => setSponsorPrice12(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-6 pr-2 py-1.5 text-white font-extrabold text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
              <span className="text-[10px] text-zinc-500 block font-mono">Default: $12.00/mo</span>
            </div>

            {/* 2. PAYMENT_PRICE_29 */}
            <div className="bg-zinc-950/80 border border-rose-500/30 p-3.5 rounded-xl space-y-2.5 hover:border-rose-500/60 transition shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-rose-300 block uppercase">Starter Spot</span>
                <code className="text-[9px] font-mono text-rose-400/80 block">PAYMENT_PRICE_29</code>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-rose-400 font-bold text-xs">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={sponsorPrice29}
                  onChange={(e) => setSponsorPrice29(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-rose-500/50 rounded-lg pl-6 pr-2 py-1.5 text-white font-extrabold text-sm focus:outline-none focus:border-rose-400"
                />
              </div>
              <span className="text-[10px] text-rose-300/80 block font-mono">Default: $29.00/mo</span>
            </div>

            {/* 3. B2B_SPONSOR_PRICE / PAYMENT_PRICE_49 */}
            <div className="bg-zinc-950/80 border border-amber-500/40 p-3.5 rounded-xl space-y-2.5 hover:border-amber-500/70 transition shadow-md">
              <div>
                <span className="text-[10px] font-bold text-amber-300 block uppercase">Pro Sponsor</span>
                <code className="text-[9px] font-mono text-amber-400/80 block">B2B_SPONSOR_PRICE</code>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-amber-400 font-bold text-xs">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={b2bSponsorPrice}
                  onChange={(e) => setB2bSponsorPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-amber-500/60 rounded-lg pl-6 pr-2 py-1.5 text-white font-extrabold text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <span className="text-[10px] text-amber-300/80 block font-mono">Default: $49.00/mo</span>
            </div>

            {/* 4. PAYMENT_PRICE_99 */}
            <div className="bg-zinc-950/80 border border-emerald-500/30 p-3.5 rounded-xl space-y-2.5 hover:border-emerald-500/60 transition shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-emerald-300 block uppercase">Growth Sponsor</span>
                <code className="text-[9px] font-mono text-emerald-400/80 block">PAYMENT_PRICE_99</code>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-emerald-400 font-bold text-xs">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={sponsorPrice99}
                  onChange={(e) => setSponsorPrice99(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-emerald-500/50 rounded-lg pl-6 pr-2 py-1.5 text-white font-extrabold text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <span className="text-[10px] text-emerald-300/80 block font-mono">Default: $99.00/mo</span>
            </div>

            {/* 5. PAYMENT_PRICE_199 */}
            <div className="bg-zinc-950/80 border border-purple-500/30 p-3.5 rounded-xl space-y-2.5 hover:border-purple-500/60 transition shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-purple-300 block uppercase">Enterprise Dominator</span>
                <code className="text-[9px] font-mono text-purple-400/80 block">PAYMENT_PRICE_199</code>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-purple-400 font-bold text-xs">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={sponsorPrice199}
                  onChange={(e) => setSponsorPrice199(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-purple-500/50 rounded-lg pl-6 pr-2 py-1.5 text-white font-extrabold text-sm focus:outline-none focus:border-purple-400"
                />
              </div>
              <span className="text-[10px] text-purple-300/80 block font-mono">Default: $199.00/mo</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Currency & Promo Tagline Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Active Currency Symbol
            </label>
            <select
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="$">USD ($) — United States Dollar</option>
              <option value="€">EUR (€) — Euro Zone</option>
              <option value="£">GBP (£) — British Pound</option>
              <option value="CA$">CAD (CA$) — Canadian Dollar</option>
              <option value="A$">AUD (A$) — Australian Dollar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Promotional Banner Tagline / Badge
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-amber-400">
                <Tag className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={promoBadgeText}
                onChange={(e) => setPromoBadgeText(e.target.value)}
                placeholder="e.g. SPECIAL COMMUNITY DISCOUNT"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button & Security Signature */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Last modified by <strong className="text-zinc-200">{currentPricing.updatedBy || 'System Environment'}</strong>
              {currentPricing.updatedAt && ` on ${formatDateTime(currentPricing.updatedAt)}`}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold text-sm text-black bg-amber-400 hover:bg-amber-300 active:scale-95 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Saving .env Pricing Config...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-black" />
                <span>Save & Deploy .env Pricing Config</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
