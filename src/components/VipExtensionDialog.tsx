import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, DollarSign, Percent, ShieldCheck, ChevronRight, Crown, Sparkles, Clock, Lock } from 'lucide-react';
import { getVipPriceNumber } from '../lib/vipConfig';
import { PaymentItemPackage } from './PaymentGatewayModal';
import { PaymentMaintenanceNotice } from './PaymentMaintenanceNotice';

interface VipExtensionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vipExpiresDate: string;
  currentUser: any;
  onConfirmExtension: (pkg: PaymentItemPackage) => void;
}

interface ExtensionOption {
  days: number;
  label: string;
  discountPercent: number;
  badge?: string;
}

export const VipExtensionDialog: React.FC<VipExtensionDialogProps> = ({
  isOpen,
  onClose,
  vipExpiresDate,
  currentUser,
  onConfirmExtension
}) => {
  const baseMonthlyPrice = getVipPriceNumber() || 3.99;
  const baseDailyRate = baseMonthlyPrice / 30;

  const extensionOptions: ExtensionOption[] = [
    { days: 30, label: '30 Days', discountPercent: 0, badge: 'Standard' },
    { days: 90, label: '90 Days (Quarterly)', discountPercent: 10, badge: 'Popular' },
    { days: 180, label: '180 Days (Semi-Annual)', discountPercent: 20, badge: 'Best Value' },
    { days: 365, label: '365 Days (Annual Pass)', discountPercent: 35, badge: 'Super Saver' }
  ];

  const [selectedOption, setSelectedOption] = useState<ExtensionOption>(extensionOptions[0]);
  const [newExpirationPreview, setNewExpirationPreview] = useState<string>('');

  const isUnlimited = vipExpiresDate === 'Lifetime' || vipExpiresDate === 'Staff Account';

  // Calculate costs
  const calculateCosts = (opt: ExtensionOption) => {
    const grossSubtotal = baseDailyRate * opt.days;
    const discountAmount = grossSubtotal * (opt.discountPercent / 100);
    const netTotal = grossSubtotal - discountAmount;
    const dailyEquivalent = netTotal / opt.days;

    return {
      grossSubtotal: Number(grossSubtotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      netTotal: Number(netTotal.toFixed(2)),
      dailyEquivalent: Number(dailyEquivalent.toFixed(3))
    };
  };

  const { grossSubtotal, discountAmount, netTotal, dailyEquivalent } = calculateCosts(selectedOption);

  // Compute live expiration preview
  useEffect(() => {
    if (isUnlimited) {
      setNewExpirationPreview(vipExpiresDate);
      return;
    }

    let startDate = new Date();
    const isVipExpired = !vipExpiresDate || vipExpiresDate === 'Expired' || vipExpiresDate === 'None';
    
    if (!isVipExpired) {
      const parsedDate = new Date(vipExpiresDate);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getTime() > Date.now()) {
        startDate = parsedDate;
      }
    }

    const futureDate = new Date(startDate.getTime() + selectedOption.days * 24 * 60 * 60 * 1000);
    setNewExpirationPreview(futureDate.toISOString().split('T')[0]);
  }, [selectedOption, vipExpiresDate, isUnlimited]);

  const handleProceed = () => {
    const customPackage: PaymentItemPackage = {
      itemType: 'vip_pass',
      tierName: `VIP Extension: ${selectedOption.label}`,
      faceValue: grossSubtotal,
      netPrice: netTotal,
      discountAmount: discountAmount,
      discountPercent: selectedOption.discountPercent,
      vipDays: selectedOption.days
    };
    onConfirmExtension(customPackage);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Prorated VIP Subscription Extension</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Append time securely to your active cloud profile</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <PaymentMaintenanceNotice
                title="Payments Temporarily Locked"
                subtitle="VIP subscription extensions and upgrades are temporarily paused for maintenance. We will get back soon!"
                compact={true}
              />

              {/* Expiration Status Row */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Current Subscription Status</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-300">
                      {isUnlimited ? 'Active Forever' : 'Expires on'}
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-mono font-extrabold rounded-md ${
                  isUnlimited 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'bg-zinc-800 text-white border border-zinc-700'
                }`}>
                  {vipExpiresDate || 'None'}
                </span>
              </div>

              {isUnlimited ? (
                <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-amber-300">Lifetime Account Clearance Active</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm mx-auto">
                    Your account has premium VIP status granted forever. You do not need to purchase extensions or append time to your subscription.
                  </p>
                </div>
              ) : (
                <>
                  {/* Step 1: Select Duration */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">1. Select Duration to Append</label>
                    <div className="grid grid-cols-2 gap-3">
                      {extensionOptions.map((opt) => {
                        const isSelected = selectedOption.days === opt.days;
                        return (
                          <button
                            key={opt.days}
                            onClick={() => setSelectedOption(opt)}
                            className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 transition duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                                : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start justify-between w-full">
                              <span className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-zinc-300'}`}>
                                {opt.label}
                              </span>
                              {opt.badge && (
                                <span className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                                  isSelected 
                                    ? 'bg-amber-500/20 text-amber-300' 
                                    : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 text-xs font-mono">
                              <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                ${(baseDailyRate * opt.days * (1 - opt.discountPercent / 100)).toFixed(2)}
                              </span>
                              {opt.discountPercent > 0 && (
                                <span className="text-[10px] text-emerald-400 font-extrabold ml-1.5">
                                  -{opt.discountPercent}% OFF
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Proration Breakdown Table */}
                  <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">2. Proration & Costs Breakdown</span>
                    
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Standard Subtotal</span>
                        <span>${grossSubtotal.toFixed(2)}</span>
                      </div>

                      {selectedOption.discountPercent > 0 && (
                        <div className="flex justify-between items-center text-emerald-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Percent className="w-3 h-3" /> Volume Proration Discount ({selectedOption.discountPercent}%)
                          </span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="h-px bg-zinc-800/80 my-2" />

                      <div className="flex justify-between items-center text-zinc-400">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-zinc-500" /> Prorated Daily Equivalent
                        </span>
                        <span className="text-white font-semibold">${dailyEquivalent.toFixed(3)} / day</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Net Charged Amount</span>
                        <span className="text-sm text-amber-400 font-black">${netTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Expiration Date Preview */}
                  <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-xl space-y-2.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">3. New Subscription Target Expiration</span>
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span>Extended Expiry Date</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-500 font-mono font-medium line-through">
                          {vipExpiresDate}
                        </span>
                        <ChevronRight className="w-3 h-3 text-zinc-600" />
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-black rounded-md text-xs uppercase tracking-wider">
                          {newExpirationPreview}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              {!isUnlimited && (
                <button
                  disabled={true}
                  className="px-5 py-2.5 bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl border border-zinc-700 flex items-center gap-1.5 cursor-not-allowed opacity-80"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Payments Temporarily Locked (Will Get Back Soon)</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
