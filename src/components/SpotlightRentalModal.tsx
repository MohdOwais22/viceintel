'use client';
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  DollarSign,
  Check,
  X,
  Lock,
  Crown,
  Server,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  ExternalLink,
  Flame,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { RpServer, SpotlightRentalBooking } from '../types';
import { RP_SERVERS_DATA } from '../data/rpServers';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, query, where, limit } from 'firebase/firestore';

interface SpotlightRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableServers?: RpServer[];
  currentUserId?: string;
  currentUserDiscordId?: string;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
  } | null;
  onOpenAuth?: () => void;
  onBookingSuccess?: (booking: SpotlightRentalBooking) => void;
}

export const SpotlightRentalModal: React.FC<SpotlightRentalModalProps> = ({
  isOpen,
  onClose,
  availableServers = RP_SERVERS_DATA,
  currentUserId,
  currentUserDiscordId,
  currentUser,
  onOpenAuth,
  onBookingSuccess
}) => {
  const userDiscordId = currentUserDiscordId || (typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_user_id') : null);
  const userDiscordUsername = (typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_username') : null);
  const userEmail = currentUser?.email?.toLowerCase();
  const userId = currentUser?.uid || currentUserId;
  const isL4Admin = Boolean((currentUser as any)?.isAdmin);

  // Filter available servers to ONLY those owned or claimed by the current logged-in server owner (unless L4 admin)
  const ownerServers = (availableServers || RP_SERVERS_DATA).filter((s) => {
    if (isL4Admin) return true; // L4 Admins can manage or rent spotlight for any server
    
    const matchesUid = Boolean(userId && (
      (s.ownerUid && s.ownerUid === userId) || 
      (s.claimedByUid && s.claimedByUid === userId) ||
      (s.ownerDiscordId && s.ownerDiscordId === userId)
    ));
    const matchesEmail = Boolean(userEmail && ((s.ownerUid && s.ownerUid.toLowerCase() === userEmail) || (s.claimedByUid && s.claimedByUid.toLowerCase() === userEmail)));
    const matchesDiscordId = Boolean(userDiscordId && ((s.ownerDiscordId && s.ownerDiscordId === userDiscordId) || (s.claimedByDiscordId && s.claimedByDiscordId === userDiscordId)));
    const matchesDiscordUsername = Boolean(userDiscordUsername && s.claimedByDiscordUsername && s.claimedByDiscordUsername.toLowerCase() === userDiscordUsername.toLowerCase());
    
    return matchesUid || matchesEmail || matchesDiscordId || matchesDiscordUsername;
  });

  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [customBadge, setCustomBadge] = useState('🌟 #1 FEATURED VICE CITY SERVER');
  const [customNote, setCustomNote] = useState('');
  const [accentColor, setAccentColor] = useState('amber');
  const [dailyRate, setDailyRate] = useState<number>(12.0);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<SpotlightRentalBooking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'customize' | 'checkout' | 'success'>('select');

  // Generate 30 days array starting today
  const today = new Date();
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const formatted = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    return { dateStr, formatted, isToday, dayNum: d.getDate(), month: d.toLocaleDateString('en-US', { month: 'short' }) };
  });

  // Fetch availability and real-time booked dates
  useEffect(() => {
    if (!isOpen) return;
    
    // Auto-clear previous reservation request inputs/states
    setSelectedServerId('');
    setSelectedDate('');
    setCustomBadge('🌟 #1 FEATURED VICE CITY SERVER');
    setCustomNote('');
    setAccentColor('amber');
    setPaymentSuccess(null);
    setErrorMessage(null);
    setStep('select');
    setLoadingAvailability(true);

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch from server API
    fetch('/api/spotlight-rentals/availability')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (typeof data.dailyRateUsd === 'number') setDailyRate(data.dailyRateUsd);
          if (Array.isArray(data.bookedDates)) {
            // Auto-clear past bookings from list
            const activeDates = data.bookedDates.filter((d: string) => d >= todayStr);
            setBookedDates(activeDates);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch rental availability API:', err))
      .finally(() => setLoadingAvailability(false));

    // 2. Real-time Firestore sync for pricing configuration & booked dates
    let unsubRentals: (() => void) | null = null;
    let unsubPricing: (() => void) | null = null;

    try {
      unsubPricing = onSnapshot(
        doc(db, 'system_config', 'spotlight_pricing'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && typeof data.dailyRateUsd === 'number' && data.dailyRateUsd > 0) {
              setDailyRate(data.dailyRateUsd);
            }
          }
        },
        (err) => console.warn('Pricing onSnapshot warning in modal:', err)
      );
    } catch (e) {
      // offline
    }

    try {
      const activeRentalsQ = query(collection(db, 'spotlight_rentals'), where('date', '>=', todayStr), limit(10));
      unsubRentals = onSnapshot(
        activeRentalsQ,
        (snapshot) => {
          const dates: string[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Auto-clear expired previous bookings by only keeping future/today ones
            if (data.status !== 'cancelled' && data.date && data.date >= todayStr) {
              dates.push(data.date);
            }
          });
          setBookedDates(dates);
        },
        (err) => console.warn('Firestore rentals snapshot notice:', err)
      );
    } catch (e) {
      // offline
    }

    return () => {
      if (unsubPricing) unsubPricing();
      if (unsubRentals) unsubRentals();
    };
  }, [isOpen]);

  // Default select first available date
  useEffect(() => {
    if (!selectedDate && dateOptions.length > 0) {
      const firstAvailable = dateOptions.find((d) => !bookedDates.includes(d.dateStr));
      if (firstAvailable) {
        setSelectedDate(firstAvailable.dateStr);
      }
    }
  }, [bookedDates, dateOptions, selectedDate]);

  if (!isOpen) return null;

  const currentServer = ownerServers.find((s) => s.id === selectedServerId);

  const handleBookSpotlight = async () => {
    if (!currentServer || !selectedDate) {
      setErrorMessage('Please select a valid server and reservation date.');
      return;
    }
    setIsProcessingPayment(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/spotlight-rentals/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          serverId: currentServer.id,
          serverSlug: (currentServer as any).slug || (currentServer as any).serverSlug || currentServer.id,
          serverName: currentServer.name,
          framework: currentServer.framework || 'QBCore',
          region: currentServer.region || 'NA',
          connectUrl: currentServer.connectUrl || '',
          description: currentServer.description || '',
          customBadge: customBadge.trim() || '🌟 #1 FEATURED VICE CITY SERVER',
          accentColor: accentColor || 'amber',
          pricePaid: dailyRate,
          ownerDiscordId: currentServer.ownerDiscordId || userDiscordId || '',
          ownerUid: userId || '',
          ownerEmail: userEmail || '',
          notes: customNote.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setPaymentSuccess(data.booking);
        if (onBookingSuccess) onBookingSuccess(data.booking);
        setStep('success');
      } else {
        setErrorMessage(data.error || 'Failed to complete spotlight rental reservation.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error processing reservation.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl shadow-amber-500/10 relative my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl border border-amber-500/30 text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> #1 Position Rental Service
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  ${dailyRate.toFixed(2)} / Day
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Rent Top Spotlight Position
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Server & Date Selection */}
        {step === 'select' && (
          <div className="space-y-4">
            {/* Value Proposition */}
            <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-indigo-500/10 rounded-xl border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" /> Instant Exposure to 50,000+ Daily RP Players
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  Your server is locked into the <strong>#1 Top Spotlight Banner</strong> with gold glow, live connect CTA, and instant AI Fast-Track for your reserved date.
                </p>
              </div>
            </div>

            {/* Select Server (Owned Servers Only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span>Select Your Server for Spotlight:</span>
                <span className="text-[11px] font-normal text-amber-400">
                  {isL4Admin ? 'Admin Mode (All Servers)' : 'Your Owned Servers Only'}
                </span>
              </label>

              {!currentUser && !userId && !userDiscordId ? (
                <div className="p-4 bg-zinc-950 rounded-xl border border-amber-500/30 text-xs text-amber-200 flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="font-bold text-white text-sm">Sign In Required</p>
                    <p className="text-zinc-400 mt-1">Please sign in to view your owned servers and reserve a Spotlight rental position.</p>
                  </div>
                  {onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => { onClose(); onOpenAuth(); }}
                      className="mt-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition cursor-pointer"
                    >
                      Sign In to Account
                    </button>
                  )}
                </div>
              ) : ownerServers.length > 0 ? (
                <select
                  value={selectedServerId}
                  onChange={(e) => {
                    setSelectedServerId(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
                >
                  <option value="" disabled className="text-zinc-500">
                    -- Select One of Your Owned Servers ({ownerServers.length} Available) --
                  </option>
                  {ownerServers.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} ({srv.framework} • {srv.region} • {srv.playerCount}/{srv.maxPlayers} players)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 flex flex-col items-center text-center gap-2">
                  <Info className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="font-bold text-white text-sm">No Owned Servers Found</p>
                    <p className="text-zinc-400 mt-1">
                      You do not currently own or manage any claimed servers. Only verified server owners can reserve the #1 Top Spotlight spot.
                    </p>
                  </div>
                  <p className="text-[11px] text-amber-400/90 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                    💡 Claim your server in the FiveM RP Directory using your Discord account or owner credentials to unlock Spotlight bookings.
                  </p>
                </div>
              )}
            </div>

            {/* Interactive 30-Day Date Picker Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Choose Available Date (Next 30 Days):</span>
                </label>
                <span className="text-[11px] text-zinc-400">
                  {bookedDates.length} date(s) currently reserved
                </span>
              </div>

              {loadingAvailability ? (
                <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-950 rounded-xl border border-zinc-800">
                  Checking real-time calendar availability...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1 bg-zinc-950 rounded-xl border border-zinc-800/80">
                  {dateOptions.map((item) => {
                    const isReserved = bookedDates.includes(item.dateStr);
                    const isSelected = selectedDate === item.dateStr;

                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        disabled={isReserved}
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isReserved
                            ? 'bg-zinc-900/40 border-zinc-800/50 text-zinc-600 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                            {item.formatted.split(',')[0]}
                          </span>
                          {isReserved ? (
                            <Lock className="w-3 h-3 text-rose-400" />
                          ) : isSelected ? (
                            <Check className="w-3.5 h-3.5 text-amber-400 font-bold" />
                          ) : item.isToday ? (
                            <span className="text-[9px] font-bold text-amber-400 uppercase">Today</span>
                          ) : null}
                        </div>

                        <div className="my-1">
                          <span className="text-sm font-black text-white">
                            {item.month} {item.dayNum}
                          </span>
                        </div>

                        <div className="text-[10px] font-mono">
                          {isReserved ? (
                            <span className="text-rose-400 font-bold">Reserved</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">${dailyRate.toFixed(0)}/day</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Customization Preview Box */}
            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-zinc-300">Custom Spotlight Highlight Badge:</label>
              <input
                type="text"
                value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value)}
                placeholder="e.g. 🌟 #1 FEATURED VICE CITY SERVER"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <div className="text-xs text-zinc-400">
                <span>Server: </span>
                <strong className="text-amber-300">
                  {currentServer ? currentServer.name : 'None Selected'}
                </strong>
                <span className="text-zinc-500"> • </span>
                <span>Date: </span>
                <strong className="text-amber-300 font-mono">
                  {selectedDate ? selectedDate : 'None'}
                </strong>
                <span className="text-zinc-500"> • </span>
                <strong className="text-emerald-400 font-mono">${dailyRate.toFixed(2)} USD</strong>
              </div>
              <button
                type="button"
                disabled={!selectedServerId || !selectedDate || bookedDates.includes(selectedDate)}
                onClick={() => {
                  if (!selectedServerId) {
                    setErrorMessage('Please select a server to feature before continuing.');
                    return;
                  }
                  setStep('checkout');
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <span>Continue to 1-Click Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Checkout & 1-Click Pay */}
        {step === 'checkout' && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-950 rounded-xl border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs font-bold text-zinc-400">Server Listing:</span>
                <span className="text-xs font-bold text-white">{currentServer?.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs font-bold text-zinc-400">Reserved Date:</span>
                <span className="text-xs font-mono font-bold text-amber-400">{selectedDate}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs font-bold text-zinc-400">Spotlight Duration:</span>
                <span className="text-xs font-bold text-zinc-200">24 Hours (00:00 - 23:59 UTC)</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs font-bold text-zinc-400">Custom Badge:</span>
                <span className="text-xs font-bold text-amber-300">{customBadge}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-sm">
                <span className="font-black text-white">Total Daily Rate:</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  ${dailyRate.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleBookSpotlight}
                disabled={isProcessingPayment}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Reserving Spotlight Position...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-zinc-950" />
                    <span>Authorize &amp; Lock Spotlight (${dailyRate.toFixed(2)} USD)</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back to Dates
              </button>
              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted 256-bit Booking Engine</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 'success' && paymentSuccess && (
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Top Position Successfully Rented!</h3>
              <p className="text-xs text-zinc-300 max-w-md mx-auto">
                <strong>{paymentSuccess.serverName}</strong> is officially scheduled for the #1 Top Spotlight Position on <strong>{paymentSuccess.date}</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-left text-xs font-mono space-y-1 max-w-md mx-auto">
              <div className="flex justify-between text-zinc-400">
                <span>Booking Reference:</span>
                <span className="text-zinc-200">{paymentSuccess.id}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Date Active:</span>
                <span className="text-amber-400 font-bold">{paymentSuccess.date}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Amount:</span>
                <span className="text-emerald-400 font-bold">${paymentSuccess.pricePaid.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Done & View in RP Directory
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
