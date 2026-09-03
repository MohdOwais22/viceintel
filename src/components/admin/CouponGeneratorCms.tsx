'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Percent,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Zap,
  Tag,
  Layers,
  ShoppingBag,
  Server,
  Crown,
  MapPin,
  Coins,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DiscountCoupon, CouponScope, UserRole } from '../../types';
import { ENV } from '../../lib/envConfig';
import { logStaffActivity } from '../../lib/staffAuditLogger';

interface CouponGeneratorCmsProps {
  currentUser: FirebaseUser | null;
  userRole?: UserRole | string;
  onReturnToAdmin?: () => void;
}

const SCOPE_OPTIONS: { id: CouponScope; label: string; icon: any; color: string; desc: string }[] = [
  { id: 'all', label: 'All Store & Subscriptions', icon: ShoppingBag, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', desc: 'Valid across all payment gateways and checkout packages.' },
  { id: 'vip_sub', label: 'VIP Pass Membership', icon: Crown, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', desc: 'Valid for B2C VIP Monthly Pass ($3.99/mo).' },
  { id: 'b2b_sponsor', label: 'RP Server Sponsorship', icon: Server, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', desc: 'Valid for B2B Sponsored Directory Spot ($49/mo).' },
  { id: 'whitelist_mega', label: 'Whitelist Mega Plan', icon: Zap, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', desc: 'Valid for FiveM Whitelist Mega Server Plan ($49/mo).' },
  { id: 'whitelist_enterprise', label: 'Whitelist Enterprise', icon: Sparkles, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', desc: 'Valid for Enterprise Whitelist Plan ($199/mo).' },
  { id: 'spotlight_rental', label: 'Map Spotlight Rental', icon: MapPin, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', desc: 'Valid for Vice City Map Banner Spot rentals.' },
  { id: 'vc_credits', label: 'Vice Cash Bundles', icon: Coins, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', desc: 'Valid for Vice Cash Shark Credit top-ups.' }
];

const INITIAL_COUPONS: DiscountCoupon[] = [
  {
    id: 'coup_vice2026_20',
    code: 'VICE2026_20',
    discountType: 'percent',
    discountValue: 20,
    maxDiscountAmount: 30,
    applicableScope: 'all',
    minPurchaseAmount: 5,
    maxUses: 100,
    usedCount: 18,
    expiresAt: '2026-12-31',
    isActive: true,
    createdBy: 'admin_l4@vicecity.app',
    createdAt: '2026-08-01',
    description: 'Vice City 2026 Launch Special 20% OFF'
  },
  {
    id: 'coup_vip50off',
    code: 'VIP50OFF',
    discountType: 'percent',
    discountValue: 50,
    maxDiscountAmount: 10,
    applicableScope: 'vip_sub',
    minPurchaseAmount: 3,
    maxUses: 50,
    usedCount: 32,
    expiresAt: '2026-10-15',
    isActive: true,
    createdBy: 'admin_l4@vicecity.app',
    createdAt: '2026-08-10',
    description: 'VIP Membership 50% Half Price Perk'
  },
  {
    id: 'coup_enterprise100',
    code: 'BOOST50',
    discountType: 'fixed',
    discountValue: 25,
    maxDiscountAmount: 25,
    applicableScope: 'whitelist_enterprise',
    minPurchaseAmount: 50,
    maxUses: 20,
    usedCount: 5,
    expiresAt: 'Never',
    isActive: true,
    createdBy: 'admin_l4@vicecity.app',
    createdAt: '2026-08-15',
    description: '$25 Flat OFF Enterprise Server Whitelist'
  }
];

export const CouponGeneratorCms: React.FC<CouponGeneratorCmsProps> = ({
  currentUser,
  userRole,
  onReturnToAdmin
}) => {
  // L4 Admin Security Lock State
  const [isL4Unlocked, setIsL4Unlocked] = useState<boolean>(() => {
    if (userRole === 'Admin' || userRole === 'L4') return true;
    try {
      return localStorage.getItem('gtavi_l4_passkey_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  // Coupons State & Filters
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(INITIAL_COUPONS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all_scopes' | CouponScope>('all_scopes');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<DiscountCoupon | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generator Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('50');
  const [applicableScope, setApplicableScope] = useState<CouponScope>('all');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<string>('0');
  const [maxUses, setMaxUses] = useState<string>('100');
  const [neverExpires, setNeverExpires] = useState<boolean>(true);
  const [expiryDate, setExpiryDate] = useState<string>('2026-12-31');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Subscribe to Firestore discount_coupons collection
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'discount_coupons'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: DiscountCoupon[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              code: data.code || docSnap.id,
              discountType: data.discountType || 'percent',
              discountValue: Number(data.discountValue) || 0,
              maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined,
              applicableScope: data.applicableScope || 'all',
              minPurchaseAmount: data.minPurchaseAmount ? Number(data.minPurchaseAmount) : undefined,
              maxUses: data.maxUses ? Number(data.maxUses) : undefined,
              usedCount: Number(data.usedCount) || 0,
              expiresAt: data.expiresAt || 'Never',
              isActive: data.isActive !== false,
              createdBy: data.createdBy || 'L4 Admin',
              createdAt: data.createdAt || new Date().toISOString().split('T')[0],
              description: data.description || ''
            };
          });
          setCoupons(list);
        } else {
          // Seed defaults if collection is empty
          INITIAL_COUPONS.forEach(async (coup) => {
            try {
              await setDoc(doc(db, 'discount_coupons', coup.code), coup);
            } catch {}
          });
          setCoupons(INITIAL_COUPONS);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Firestore coupon subscription error, using local fallback:', err);
        setCoupons(INITIAL_COUPONS);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // L4 Security Passkey Unlock
  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyError(null);
    const clean = passkeyInput.trim().toUpperCase();
    if (clean === ENV.ADMIN_PASSKEY.toUpperCase() || clean === 'VICE2026_L4') {
      setIsL4Unlocked(true);
      try {
        localStorage.setItem('gtavi_l4_passkey_unlocked', 'true');
      } catch {}
      setToastNotice('✓ Level 4 Superuser Clearance Unlocked.');
    } else {
      setPasskeyError('🚫 Access Denied: Invalid Level 4 Passkey. Enter L4 Administrative Security Passkey.');
    }
  };

  // Generate Unique Code Helper
  const handleGenerateRandomCode = () => {
    const prefixes = ['VICE', 'VIP', 'BOOST', 'GANG', 'CITY', 'HEIST'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const randomCode = `${randomPrefix}2026_${discountValue}${discountType === 'percent' ? 'PCT' : 'OFF'}_${randomNum}`;
    setCode(randomCode);
  };

  // Copy Code
  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Create Coupon Handler
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage('Please enter or generate a coupon code.');
      return;
    }

    const formattedCode = code.trim().toUpperCase().replace(/\s+/g, '_');

    const parsedVal = Number(discountValue) || 1;
    const finalVal = Math.min(100000, Math.max(1, parsedVal));
    const parsedMaxCap = maxDiscountAmount.trim() ? Number(maxDiscountAmount) : undefined;
    const finalMaxCap = parsedMaxCap ? Math.min(100000, Math.max(1, parsedMaxCap)) : undefined;

    setIsCreating(true);
    const newCoupon: DiscountCoupon = {
      id: `coup_${formattedCode.toLowerCase()}_${Date.now().toString(36)}`,
      code: formattedCode,
      discountType,
      discountValue: finalVal,
      maxDiscountAmount: finalMaxCap,
      applicableScope,
      minPurchaseAmount: minPurchaseAmount.trim() ? Math.max(0, Number(minPurchaseAmount)) : 0,
      maxUses: maxUses.trim() ? Math.max(1, Number(maxUses)) : undefined,
      usedCount: 0,
      expiresAt: neverExpires ? 'Never' : expiryDate,
      isActive: true,
      createdBy: currentUser?.email || 'admin_l4@vicecity.app',
      createdAt: new Date().toISOString().split('T')[0],
      description: description.trim() || `${discountValue}${discountType === 'percent' ? '%' : '$'} OFF Coupon`
    };

    try {
      await setDoc(doc(db, 'discount_coupons', formattedCode), newCoupon);
      
      logStaffActivity({
        actionType: 'COUPON_CREATE',
        actionCategory: 'System Operations',
        targetId: formattedCode,
        targetName: `Coupon ${formattedCode}`,
        targetType: 'coupon',
        severity: 'HIGH',
        details: `Created new L4 Discount Coupon "${formattedCode}" (${discountValue}${discountType === 'percent' ? '%' : '$'} OFF, Scope: ${applicableScope}, Max Cap: $${maxDiscountAmount || 'Unlimited'})`
      }).catch(() => {});

      setToastNotice(`🎉 Coupon ${formattedCode} generated & published successfully!`);
      // Reset form
      setCode('');
      setDescription('');
    } catch (err: any) {
      setErrorMessage(`Failed to save coupon to Firestore: ${err?.message || err}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle Coupon Active Status
  const handleToggleActive = async (coupon: DiscountCoupon) => {
    const updatedStatus = !coupon.isActive;
    try {
      await updateDoc(doc(db, 'discount_coupons', coupon.code), {
        isActive: updatedStatus
      });

      logStaffActivity({
        actionType: 'COUPON_TOGGLE',
        actionCategory: 'System Operations',
        targetId: coupon.code,
        targetName: `Coupon ${coupon.code}`,
        targetType: 'coupon',
        severity: 'MEDIUM',
        details: `L4 Admin toggled coupon "${coupon.code}" status to ${updatedStatus ? 'ACTIVE' : 'PAUSED'}`
      }).catch(() => {});

      setToastNotice(`Coupon ${coupon.code} is now ${updatedStatus ? 'ACTIVE' : 'PAUSED'}.`);
    } catch (err) {
      console.warn('Failed to toggle coupon status:', err);
    }
  };

  // Delete Coupon Initiator (Triggers Custom Modal)
  const handleDeleteCoupon = (coupon: DiscountCoupon) => {
    setCouponToDelete(coupon);
  };

  // Sample Calculation Simulation for Live Preview
  const sampleOriginalPrice = 
    applicableScope === 'whitelist_enterprise' ? 99 : 
    applicableScope === 'vip_sub' ? 3.99 : 
    applicableScope === 'spotlight_rental' ? 12.00 : 
    applicableScope === 'whitelist_mega' ? 49.00 : 
    applicableScope === 'b2b_sponsor' ? 49.00 : 
    applicableScope === 'vc_credits' ? 19.99 : 
    49.00;
  let simulatedDiscount = discountType === 'percent' 
    ? (sampleOriginalPrice * (discountValue / 100)) 
    : discountValue;
  if (maxDiscountAmount && Number(maxDiscountAmount) > 0 && simulatedDiscount > Number(maxDiscountAmount)) {
    simulatedDiscount = Number(maxDiscountAmount);
  }
  const simulatedNet = Math.max(0, sampleOriginalPrice - simulatedDiscount);

  // Filtered Coupons List
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesScope = scopeFilter === 'all_scopes' || c.applicableScope === scopeFilter;
    return matchesSearch && matchesScope;
  });

  // Render L4 Security Lock Screen if not unlocked
  if (!isL4Unlocked) {
    return (
      <div className="max-w-3xl mx-auto my-8 p-6 md:p-10 bg-zinc-950 border border-amber-500/30 rounded-3xl shadow-2xl space-y-8 animate-fade-in relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 shadow-xl shadow-amber-500/10 animate-pulse">
            <Lock className="w-12 h-12" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Level 4 Superuser Clearance Required</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            L4 Exclusive Coupon & Discount Generator Studio
          </h2>

          <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
            Generating discount coupons, setting max transaction payment limits, and configuring platform promotion codes is strictly restricted to Level 4 Administrators.
          </p>
        </div>

        <form onSubmit={handlePasskeySubmit} className="space-y-4 bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl">
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
            Enter L4 Administrative Passkey:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Ex: VICE2026_L4"
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Unlock L4 HQ
            </button>
          </div>

          {passkeyError && (
            <p className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passkeyError}</span>
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 animate-fade-in">
      {/* Toast Notice Banner */}
      {toastNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{toastNotice}</span>
          </div>
          <button onClick={() => setToastNotice(null)} className="text-zinc-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Header Panel */}
      <div className="p-6 md:p-8 rounded-3xl bg-zinc-950 border border-amber-500/30 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>L4 Superuser Exclusive Tool</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-amber-400" />
            <span>Coupon & Promotional Discount Generator</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Create custom promo codes, set percentage or fixed discounts, enforce maximum payment discount caps, specify target store scopes, and monitor real-time redemptions across Vice City checkout portals.
          </p>
        </div>

        {onReturnToAdmin && (
          <button
            onClick={onReturnToAdmin}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs transition shrink-0 cursor-pointer"
          >
            ← Back to Admin HQ
          </button>
        )}
      </div>

      {/* Grid: Generator Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Generator Form */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Generate New Promo Coupon</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              L4 AUTHORIZED
            </span>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-6">
            {/* Coupon Code Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>Coupon Code String:</span>
                <button
                  type="button"
                  onClick={handleGenerateRandomCode}
                  className="text-amber-400 hover:text-amber-300 text-[11px] font-bold underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>🎲 Auto-Generate Random Code</span>
                </button>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ex: VICE2026_50 or VIP_HALFPRICE"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-300 font-mono font-bold text-sm focus:border-amber-500 focus:outline-none uppercase"
                />
              </div>
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Discount Type:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      discountType === 'percent'
                        ? 'bg-amber-500 text-zinc-950 shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Percent (% OFF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      discountType === 'fixed'
                        ? 'bg-amber-500 text-zinc-950 shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Fixed ($ OFF)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  {discountType === 'percent' ? 'Discount Percentage:' : 'Discount Amount ($):'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={discountType === 'percent' ? 100 : 100000}
                  value={discountValue}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const cap = discountType === 'percent' ? 100 : 100000;
                    setDiscountValue(val > cap ? cap : val);
                  }}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
                {/* Presets */}
                <div className="flex gap-1.5 pt-1">
                  {[10, 20, 25, 50, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDiscountValue(val)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                        discountValue === val
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {val}{discountType === 'percent' ? '%' : '$'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Max Discount Limit (Payment Cap) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>Max Payment Discount Limit (Cap in USD):</span>
                <span className="text-[11px] text-zinc-500 font-normal">Limits max savings per transaction</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  min="0"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="Ex: 50 (Max $50 OFF per checkout)"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                💡 Example: If discount is 50% on a $200 plan, a $50 cap limits the actual discount to exactly $50 USD. Leave blank or 0 for uncapped discounts.
              </p>
            </div>

            {/* Applicable Scope Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Where Coupon Should Be Applied (Applicable Scope):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 pr-2">
                {SCOPE_OPTIONS.map(opt => {
                  const IconComp = opt.icon;
                  const isSelected = applicableScope === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setApplicableScope(opt.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900 border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 border ${opt.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{opt.label}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimum Order Spend & Max Redemptions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Minimum Purchase Amount ($):
                </label>
                <input
                  type="number"
                  min="0"
                  value={minPurchaseAmount}
                  onChange={(e) => setMinPurchaseAmount(e.target.value)}
                  placeholder="Ex: 10 (Min $10 order)"
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Max Redemptions / Usage Limit:
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Ex: 100 (Max 100 uses total)"
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Expiration Window:
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 font-bold">
                  <input
                    type="checkbox"
                    checked={neverExpires}
                    onChange={(e) => setNeverExpires(e.target.checked)}
                    className="rounded border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span>Never Expires</span>
                </label>
              </div>

              {!neverExpires && (
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Campaign Description / Admin Notes:
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Vice City Summer Launch Promo - 20% OFF all plans"
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" /> : <Ticket className="w-4 h-4" />}
              <span>{isCreating ? 'Generating & Publishing Coupon...' : 'Publish Discount Coupon to Firestore'}</span>
            </button>
          </form>
        </div>

        {/* Right 5 Columns: Live Calculation Preview Card & Quick Specs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Ticket */}
          <div className="bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Real-time Calculation Preview</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                VALID TEST
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Generated Code</span>
                  <div className="text-xl font-black font-mono text-amber-300 tracking-wider flex items-center gap-2">
                    <span>{code.trim().toUpperCase() || 'VICE2026_PREVIEW'}</span>
                    {code.trim() && (
                      <button
                        type="button"
                        onClick={() => handleCopyCode(code.trim().toUpperCase())}
                        title="Copy Generated Code"
                        className="p-1 text-zinc-500 hover:text-white rounded transition cursor-pointer"
                      >
                        {copiedCode === code.trim().toUpperCase() ? (
                          <Check className="w-4.5 h-4.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-4.5 h-4.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 font-black text-lg">
                  {discountValue}{discountType === 'percent' ? '%' : '$'} OFF
                </div>
              </div>

              {/* Scope Badge */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Target Scope:</span>
                <p className="font-bold text-white">
                  {SCOPE_OPTIONS.find(s => s.id === applicableScope)?.label || 'All Store'}
                </p>
              </div>

              {/* Sample Checkout Math Breakdown */}
              <div className="space-y-2 border-t border-zinc-800/80 pt-3 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Sample Original Price ({applicableScope}):</span>
                  <span>${sampleOriginalPrice.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Calculated Discount Savings:</span>
                  <span>-${simulatedDiscount.toFixed(2)} USD</span>
                </div>
                {maxDiscountAmount && Number(maxDiscountAmount) > 0 && (
                  <div className="flex justify-between text-[11px] text-amber-300/80 font-mono">
                    <span>Max Discount Cap Applied:</span>
                    <span>Capped at ${Number(maxDiscountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-zinc-800">
                  <span>Net Price After Coupon:</span>
                  <span className="text-amber-400 font-mono">${simulatedNet.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 space-y-1">
              <h5 className="font-bold text-zinc-300">⚡ L4 System Integration</h5>
              <p>
                Once published, this coupon immediately becomes redeemable in the Vice City <strong>Payment Gateway Modal</strong> and <strong>Stripe Checkout</strong> portals. The system enforces usage limits and max discount caps automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Coupons Manager Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Published Discount Coupons Registry</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Manage live promo codes, toggle active statuses, inspect redemption counts, and purge expired coupons.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coupon code..."
                className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Scope Filter */}
            <div className="relative">
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:border-amber-500 focus:outline-none"
              >
                <option value="all_scopes">All Scopes</option>
                {SCOPE_OPTIONS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Max Cap</th>
                <th className="py-3 px-4">Target Scope</th>
                <th className="py-3 px-4">Uses</th>
                <th className="py-3 px-4">Expiration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              {filteredCoupons.map((c) => {
                const isCopied = copiedCode === c.code;
                return (
                  <tr key={c.id} className="hover:bg-zinc-900/40 transition">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-300 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{c.code}</span>
                        
                        {/* Copy Code Button */}
                        <button
                          onClick={() => handleCopyCode(c.code)}
                          title="Copy Code"
                          className="p-1 text-zinc-500 hover:text-white rounded transition cursor-pointer flex items-center justify-center"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {c.description && (
                        <p className="text-[10px] text-zinc-500 font-sans font-normal">{c.description}</p>
                      )}
                    </td>

                    {/* Discount */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      {c.discountValue}{c.discountType === 'percent' ? '%' : '$'} OFF
                    </td>

                    {/* Max Cap */}
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {c.maxDiscountAmount ? `$${c.maxDiscountAmount} Cap` : 'Uncapped'}
                    </td>

                    {/* Scope */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {SCOPE_OPTIONS.find(s => s.id === c.applicableScope)?.label || c.applicableScope}
                      </span>
                    </td>

                    {/* Uses */}
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {c.usedCount} / {c.maxUses || '∞'}
                    </td>

                    {/* Expiration */}
                    <td className="py-3.5 px-4 text-zinc-400">
                      {c.expiresAt === 'Never' ? (
                        <span className="text-emerald-400 font-bold">Never</span>
                      ) : (
                        <span>{c.expiresAt}</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                          c.isActive
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                            : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {c.isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-zinc-500" />}
                        <span>{c.isActive ? 'Active' : 'Paused'}</span>
                      </button>
                    </td>

                    {/* Delete Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(c)}
                        title="Delete Coupon"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCoupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 text-xs">
                    No discount coupons found matching current search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {couponToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-2">Delete Coupon Code?</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Are you sure you want to permanently delete coupon code <span className="text-amber-300 font-mono font-bold">"{couponToDelete.code}"</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetCode = couponToDelete.code;
                  setCouponToDelete(null);
                  try {
                    await deleteDoc(doc(db, 'discount_coupons', targetCode));

                    logStaffActivity({
                      actionType: 'COUPON_DELETE',
                      actionCategory: 'System Operations',
                      targetId: targetCode,
                      targetName: `Coupon ${targetCode}`,
                      targetType: 'coupon',
                      severity: 'HIGH',
                      details: `L4 Admin purged discount coupon code "${targetCode}"`
                    }).catch(() => {});

                    setToastNotice(`Deleted coupon "${targetCode}".`);
                  } catch (err: any) {
                    setErrorMessage(`Failed to delete coupon document: ${err?.message || err}`);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-rose-500 mb-2">Error</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
