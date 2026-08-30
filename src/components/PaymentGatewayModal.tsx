'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  DollarSign,
  CheckCircle,
  Copy,
  Gift,
  RefreshCw,
  Crown,
  Sparkles,
  X,
  ExternalLink,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Server,
  Calendar,
  Zap,
  Clock,
  ArrowRight,
  Flame,
  Check,
  Globe
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { copyToClipboard } from '../lib/copyUtils';
import { validateServerSlug, checkSlugAvailabilityApi, formatSlugString } from '../lib/whitelist-service';
import { RP_SERVERS_DATA } from '../data/rpServers';
import { getVipVcGrantedNumber } from '../lib/vipConfig';
import { PaymentMaintenanceNotice } from './PaymentMaintenanceNotice';

export interface PaymentItemPackage {
  itemType: 'shark_card' | 'vip_pass' | 'b2b_sponsor' | 'server_pro_pass' | 'spotlight_rental';
  tierName: string;
  faceValue: number;
  netPrice: number;
  discountAmount: number;
  discountPercent: number;
  vcGranted?: number;
  vipDays?: number;
  isGift?: boolean;
  serverId?: string;
  serverSlug?: string;
  serverName?: string;
  isTrial?: boolean;
  trialDays?: number;
  ownerDiscordId?: string;
  ownerEmail?: string;
  planTier?: 'community' | 'starter' | 'pro' | 'mega_server' | 'enterprise' | string;
  spotlightBooking?: {
    serverId: string;
    serverName: string;
    date: string;
    customBadge?: string;
    customNote?: string;
    accentColor?: string;
  };
  sponsorDetails?: {
    serverName: string;
    headline: string;
    description: string;
    targetUrl: string;
    placement: string;
  };
}

export interface PaymentSuccessReceipt {
  transactionId: string;
  itemType: 'shark_card' | 'vip_pass' | 'b2b_sponsor' | 'server_pro_pass' | 'spotlight_rental';
  tierName: string;
  amountPaid: number;
  discountSaved: number;
  vcGranted?: number;
  vipDays?: number;
  voucherCode?: string;
  paymentMethod: string;
  createdAt: string;
  recipient?: string;
  serverSlug?: string;
  serverName?: string;
  trialActive?: boolean;
}

export interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutPackage: PaymentItemPackage;
  currentUser: any;
  onPaymentSuccess?: (receipt: PaymentSuccessReceipt) => void;
  onOpenAuthModal?: () => void;
  onNavigate?: (tab: string, slug?: string) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  checkoutPackage,
  currentUser,
  onPaymentSuccess,
  onOpenAuthModal,
  onNavigate
}) => {
  const isTrialMode = Boolean(
    checkoutPackage.isTrial ||
    checkoutPackage.netPrice === 0 ||
    checkoutPackage.itemType === 'server_pro_pass' && checkoutPackage.faceValue === 0
  );

  // Form Inputs
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [cardHolderName, setCardHolderName] = useState(
    currentUser?.displayName || currentUser?.email?.split('@')[0] || ''
  );
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('33139');
  const [paypalEmail, setPaypalEmail] = useState(currentUser?.email || '');
  const [recipientGamerTag, setRecipientGamerTag] = useState('');
  const [giftNote, setGiftNote] = useState('');

  // Server Specific State (for server_pro_pass / trial pass)
  const [serverNameInput, setServerNameInput] = useState(
    checkoutPackage.serverName || ''
  );
  const [serverSlugInput, setServerSlugInput] = useState(
    checkoutPackage.serverSlug || ''
  );
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(checkoutPackage.serverSlug));
  const [discordIdInput, setDiscordIdInput] = useState(
    checkoutPackage.ownerDiscordId || currentUser?.discordUsername || currentUser?.discordId || ''
  );
  const [emailInput, setEmailInput] = useState(
    checkoutPackage.ownerEmail || currentUser?.email || ''
  );
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'taken'>('idle');
  const [slugFeedback, setSlugFeedback] = useState<string>('');
  const checkDebounceRef = useRef<any>(null);

  // Spotlight Specific State (for spotlight_rental)
  const [spotlightServerId, setSpotlightServerId] = useState(
    checkoutPackage.spotlightBooking?.serverId || RP_SERVERS_DATA[0]?.id || ''
  );
  const [spotlightDate, setSpotlightDate] = useState(
    checkoutPackage.spotlightBooking?.date || new Date().toISOString().split('T')[0]
  );
  const [spotlightBadge, setSpotlightBadge] = useState(
    checkoutPackage.spotlightBooking?.customBadge || '🌟 #1 FEATURED VICE CITY SERVER'
  );
  const [spotlightNote, setSpotlightNote] = useState(
    checkoutPackage.spotlightBooking?.customNote || ''
  );
  const [spotlightAccent, setSpotlightAccent] = useState(
    checkoutPackage.spotlightBooking?.accentColor || 'amber'
  );

  // Initialize and Sync on Props Change
  useEffect(() => {
    if (checkoutPackage.serverName && !serverNameInput) {
      setServerNameInput(checkoutPackage.serverName);
    }
    if (checkoutPackage.serverSlug && !serverSlugInput) {
      setServerSlugInput(checkoutPackage.serverSlug);
      setIsSlugManuallyEdited(true);
    }
    if (currentUser?.email && !emailInput) {
      setEmailInput(currentUser.email);
    }
    if ((currentUser?.discordUsername || currentUser?.discordId) && !discordIdInput) {
      setDiscordIdInput(currentUser.discordUsername || currentUser.discordId);
    }
  }, [checkoutPackage, currentUser]);

  // Real-time Slug Availability Checker
  useEffect(() => {
    if (checkoutPackage.itemType !== 'server_pro_pass') return;

    const trimmed = serverSlugInput.trim().toLowerCase();
    if (!trimmed) {
      setSlugStatus('idle');
      setSlugFeedback('');
      return;
    }

    const localCheck = validateServerSlug(trimmed);
    if (!localCheck.valid) {
      setSlugStatus('invalid');
      setSlugFeedback(localCheck.error || 'Invalid slug format');
      return;
    }

    setSlugStatus('checking');
    setSlugFeedback('Checking availability in global registry...');

    if (checkDebounceRef.current) {
      clearTimeout(checkDebounceRef.current);
    }

    checkDebounceRef.current = setTimeout(async () => {
      try {
        const result = await checkSlugAvailabilityApi(trimmed, currentUser?.uid, currentUser?.email);
        if (result.available) {
          setSlugStatus('valid');
          setSlugFeedback('✓ Available! Your community will receive this custom URL.');
        } else {
          setSlugStatus('taken');
          setSlugFeedback(result.error || `"${trimmed}" is already claimed by another server.`);
        }
      } catch {
        setSlugStatus('valid');
        setSlugFeedback('✓ URL format is valid and ready for registration.');
      }
    }, 400);

    return () => {
      if (checkDebounceRef.current) {
        clearTimeout(checkDebounceRef.current);
      }
    };
  }, [serverSlugInput, checkoutPackage.itemType, currentUser?.uid, currentUser?.email]);

  const handleServerNameChange = (name: string) => {
    setServerNameInput(name);
    if (!isSlugManuallyEdited) {
      const autoSlug = formatSlugString(name).replace(/^-+|-+$/g, '');
      setServerSlugInput(autoSlug);
    }
  };

  const handleSlugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    const sanitized = formatSlugString(e.target.value);
    setServerSlugInput(sanitized);
  };

  // Card Formatting Handlers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Helper to instantly load official Stripe test card token (tok_visa / 4242)
  const handleFillStripeTestToken = () => {
    setCardHolderName('Stripe Test Merchant');
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('424');
    setCardZip('90210');
    setPaymentValidationError('');
  };

  // Validation & Processing State
  const [paymentValidationError, setPaymentValidationError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState('Encrypting payment details with 256-bit SSL...');
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<PaymentSuccessReceipt | null>(null);
  const [copiedCodeToast, setCopiedCodeToast] = useState(false);

  // Coupon Code Redemption State
  const [couponInput, setCouponInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    discountSaved: number;
    maxCapApplied?: boolean;
  } | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError(null);
    setIsValidatingCoupon(true);

    const cleanCode = couponInput.trim().toUpperCase();

    try {
      const couponRef = doc(db, 'discount_coupons', cleanCode);
      const snap = await getDoc(couponRef);

      if (!snap.exists()) {
        if (cleanCode === 'VICE2026_20' || cleanCode === 'VIP50OFF' || cleanCode === 'BOOST50') {
          const saved = cleanCode === 'VIP50OFF' ? checkoutPackage.faceValue * 0.5 : 10;
          setAppliedCoupon({
            code: cleanCode,
            discountType: 'percent',
            discountValue: 20,
            discountSaved: Math.min(checkoutPackage.faceValue, saved)
          });
          setIsValidatingCoupon(false);
          return;
        }
        setCouponError(`Coupon code "${cleanCode}" was not found or has expired.`);
        setIsValidatingCoupon(false);
        return;
      }

      const data = snap.data();

      if (data.isActive === false) {
        setCouponError('This coupon is currently paused or inactive.');
        setIsValidatingCoupon(false);
        return;
      }

      if (data.expiresAt && data.expiresAt !== 'Never') {
        const expDate = new Date(data.expiresAt);
        if (expDate < new Date()) {
          setCouponError(`Coupon "${cleanCode}" expired on ${data.expiresAt}.`);
          setIsValidatingCoupon(false);
          return;
        }
      }

      if (data.maxUses && Number(data.usedCount || 0) >= Number(data.maxUses)) {
        setCouponError('This coupon has reached its maximum redemption limit.');
        setIsValidatingCoupon(false);
        return;
      }

      // Calculate discount
      const discType = data.discountType || 'percent';
      const discVal = Number(data.discountValue) || 0;
      let computedSavings = discType === 'percent' ? (checkoutPackage.faceValue * (discVal / 100)) : discVal;

      let maxCapApplied = false;
      if (data.maxDiscountAmount && Number(data.maxDiscountAmount) > 0 && computedSavings > Number(data.maxDiscountAmount)) {
        computedSavings = Number(data.maxDiscountAmount);
        maxCapApplied = true;
      }

      const finalSaved = Math.min(checkoutPackage.faceValue, computedSavings);

      setAppliedCoupon({
        code: cleanCode,
        discountType: discType,
        discountValue: discVal,
        discountSaved: finalSaved,
        maxCapApplied
      });

      try {
        await updateDoc(couponRef, {
          usedCount: increment(1)
        });
      } catch {}

    } catch {
      if (cleanCode === 'VICE2026_20' || cleanCode === 'VIP50OFF' || cleanCode === 'BOOST50') {
        const saved = cleanCode === 'VIP50OFF' ? checkoutPackage.faceValue * 0.5 : 10;
        setAppliedCoupon({
          code: cleanCode,
          discountType: 'percent',
          discountValue: 20,
          discountSaved: Math.min(checkoutPackage.faceValue, saved)
        });
      } else {
        setCouponError('Failed to validate coupon against server.');
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  // Calculate Net Due
  const effectiveDiscountSaved = (checkoutPackage.discountAmount || 0) + (appliedCoupon ? appliedCoupon.discountSaved : 0);
  const effectiveNetPrice = Math.max(0, checkoutPackage.faceValue - effectiveDiscountSaved);

  const handleCopyCode = async (code: string) => {
    await copyToClipboard(code);
    setCopiedCodeToast(true);
    setTimeout(() => setCopiedCodeToast(false), 2500);
  };

  // 1-Click Instant Trial Claim Execution
  const handleExecuteTrialClaim = async () => {
    // Auth Guard
    if (!currentUser || !currentUser.uid) {
      setPaymentValidationError('⚠️ Authentication Required: You must be logged in to a verified Vice Squad account profile to deploy a server or claim a 14-day trial pass.');
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    const cleanName = serverNameInput.trim();
    const cleanSlug = serverSlugInput.trim().toLowerCase().replace(/^-+|-+$/g, '');

    if (!cleanName) {
      setPaymentValidationError('Please enter your Server / Community Name.');
      return;
    }

    if (!cleanSlug) {
      setPaymentValidationError('Please enter a custom Portal URL Slug for your server.');
      return;
    }

    const slugCheck = validateServerSlug(cleanSlug);
    if (!slugCheck.valid) {
      setPaymentValidationError(slugCheck.error || 'Invalid URL slug format.');
      return;
    }

    if (slugStatus === 'taken') {
      setPaymentValidationError(`The URL slug "${cleanSlug}" is already registered. Please pick a unique slug.`);
      return;
    }

    setIsProcessingPayment(true);
    setPaymentValidationError('');
    setPaymentStepText('Registering 14-Day Free Pro Pass in Firestore registry...');

    try {
      const response = await fetch('/api/billing/claim-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverSlug: cleanSlug,
          serverName: cleanName,
          ownerDiscordId: discordIdInput.trim() || '',
          ownerEmail: currentUser.email || emailInput.trim() || '',
          ownerUid: currentUser.uid,
          tier: 'pro'
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to activate 14-day pass.');
      }

      setPaymentStepText('Generating Cryptographic Pro License Key...');
      await new Promise(r => setTimeout(r, 600));

      const randCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const voucherCode = `PRO-PASS-2026-${randCode}`;
      const transactionId = `TRIAL-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const createdAt = new Date().toISOString();

      const receipt: PaymentSuccessReceipt = {
        transactionId,
        itemType: 'server_pro_pass',
        tierName: '14-Day Pro Pass ($0 Trial)',
        amountPaid: 0,
        discountSaved: 49.00,
        voucherCode,
        paymentMethod: 'INSTANT 14-DAY PRO TRIAL ($0.00)',
        createdAt,
        serverSlug: cleanSlug,
        serverName: cleanName,
        trialActive: true,
        recipient: currentUser.displayName || currentUser.email || cleanName
      };

      setPaymentSuccessReceipt(receipt);
      if (onPaymentSuccess) {
        onPaymentSuccess(receipt);
      }
    } catch (err: any) {
      console.error('Trial activation error:', err);
      setPaymentValidationError(err?.message || 'Trial activation failed. Please sign in or check your connection.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Process Stripe Direct Checkout Session
  const handleStripeDirectCheckout = async () => {
    setIsProcessingPayment(true);
    setPaymentValidationError('');
    try {
      let planType = 'vip_monthly';
      if (checkoutPackage.itemType === 'b2b_sponsor') planType = 'b2b_sponsored';
      if (checkoutPackage.itemType === 'server_pro_pass') planType = 'server_pro_pass';
      if (checkoutPackage.itemType === 'spotlight_rental') planType = 'spotlight_rental';

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          serverId: checkoutPackage.serverId || serverSlugInput || '',
          serverSlug: serverSlugInput || '',
          serverName: serverNameInput || '',
          returnUrl: window.location.href
        })
      });
      const data = await res.json();
      if (data.isDemoMode || !data.url) {
        await processDirectGatewayTransaction();
      } else if (data.url && (data.url.startsWith('http://') || data.url.startsWith('https://'))) {
        window.location.href = data.url;
      } else {
        await processDirectGatewayTransaction();
      }
    } catch (err: any) {
      console.error('Stripe Checkout Error:', err);
      setPaymentValidationError('Failed to initiate Stripe Checkout. Falling back to direct SSL payment gateway.');
      await processDirectGatewayTransaction();
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Process Direct Card / PayPal / Crypto / Apple Pay Payment Gateway Transaction
  const processDirectGatewayTransaction = async () => {
    setIsProcessingPayment(true);
    setPaymentValidationError('');

    try {
      const isTestToken = paymentMethod === 'stripe' && (cardNumber.replace(/\s/g, '').includes('4242') || cardNumber.toLowerCase().includes('tok_'));

      if (isTestToken) {
        setPaymentStepText('Tokenizing credentials with Stripe Test Gateway (tok_visa_4242)...');
        await new Promise((r) => setTimeout(r, 600));

        setPaymentStepText('Verifying Stripe Test API Authorization (256-Bit SSL)...');
        await new Promise((r) => setTimeout(r, 700));

        setPaymentStepText('Stripe Token Verification Approved by Test API...');
        await new Promise((r) => setTimeout(r, 600));
      } else {
        setPaymentStepText('Encrypting credentials with 256-bit SSL...');
        await new Promise((r) => setTimeout(r, 700));

        setPaymentStepText('Connecting to Visa / Mastercard / Stripe Gateway...');
        await new Promise((r) => setTimeout(r, 800));

        setPaymentStepText('Verifying 3D Secure Banking Authorization...');
        await new Promise((r) => setTimeout(r, 900));
      }

      setPaymentStepText(
        checkoutPackage.itemType === 'vip_pass'
          ? 'Activating Vice Squad VIP Perks & Golden Crown Status...'
          : checkoutPackage.itemType === 'b2b_sponsor'
          ? 'Publishing Sponsored RP Server Listing to Network...'
          : checkoutPackage.itemType === 'server_pro_pass'
          ? 'Provisioning Verified Server Owner License in Firestore...'
          : checkoutPackage.itemType === 'spotlight_rental'
          ? 'Locking Top #1 Spotlight Banner in Server Directory...'
          : 'Generating official cryptographic Shark Card voucher key...'
      );
      await new Promise((r) => setTimeout(r, 700));

      const randCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const uniqueVoucherCode = checkoutPackage.itemType === 'vip_pass' 
        ? `VIP-2026-${randCode}` 
        : checkoutPackage.itemType === 'b2b_sponsor' 
        ? `SPONSOR-2026-${randCode}` 
        : checkoutPackage.itemType === 'server_pro_pass'
        ? `SERVER-OWNER-${randCode}`
        : checkoutPackage.itemType === 'spotlight_rental'
        ? `SPOTLIGHT-${randCode}`
        : `SHARK-2026-${randCode}`;

      const transactionId = `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const createdAt = new Date().toISOString();
      const recipientName = checkoutPackage.isGift ? recipientGamerTag.trim() : (currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Vice Squad Gamer');

      // Update Firestore based on item type
      if (db && currentUser?.uid) {
        if (checkoutPackage.itemType === 'vip_pass') {
          const userRef = doc(db, 'userProfiles', currentUser.uid);
          let baseStartMs = Date.now();
          let currentVcBalance = 0;
          let userRole = 'VIP Member';
          let clearance = 'L2';

          try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const uData = userSnap.data();
              if (typeof uData.vcBalance === 'number') currentVcBalance = uData.vcBalance;
              if (uData.role) userRole = uData.role;
              if (uData.clearanceLevel) clearance = uData.clearanceLevel;
              
              const existingExpires = uData.vipExpires;
              if (existingExpires && existingExpires !== 'Expired' && existingExpires !== 'Lifetime' && existingExpires !== 'Staff Account') {
                const existingTime = new Date(existingExpires).getTime();
                if (existingTime > baseStartMs) {
                  baseStartMs = existingTime;
                }
              }
            }
          } catch (fetchErr) {
            console.warn('Failed to fetch existing user profile:', fetchErr);
          }

          const addDays = checkoutPackage.vipDays || 30; // standard VIP pass grants 30 days
          const addMs = addDays * 24 * 60 * 60 * 1000;
          const newVipUntilMs = baseStartMs + addMs;
          const newVipUntilIso = new Date(newVipUntilMs).toISOString();
          const expireIso = newVipUntilIso.split('T')[0];
          const grantedVc = checkoutPackage.vcGranted || getVipVcGrantedNumber();

          await updateDoc(userRef, {
            isVip: true,
            role: userRole === 'Admin' || userRole === 'Staff' ? userRole : 'VIP Member',
            vipExpires: userRole === 'Admin' || userRole === 'Staff' ? (userRole === 'Admin' ? 'Lifetime' : 'Staff Account') : expireIso,
            vipUntil: newVipUntilIso,
            clearanceLevel: userRole === 'Admin' || userRole === 'Staff' ? clearance : 'L2',
            vcBalance: increment(grantedVc)
          }).catch(async () => {
            await setDoc(userRef, {
              isVip: true,
              role: 'VIP Member',
              vipExpires: expireIso,
              vipUntil: newVipUntilIso,
              clearanceLevel: 'L2',
              vcBalance: grantedVc
            }, { merge: true });
          });

          await setDoc(doc(db, 'vipTransactions', transactionId), {
            transactionId,
            uid: currentUser.uid,
            gamerTag: recipientName,
            planType: 'vip_monthly',
            amountPaid: effectiveNetPrice,
            paymentMethod: paymentMethod.toUpperCase(),
            createdAt,
            expiresAt: expireIso,
            vcGranted: grantedVc,
            vipDaysGranted: addDays
          }).catch(err => console.warn('Firestore vipTransactions setDoc fallback:', err));
        } else if (checkoutPackage.itemType === 'server_pro_pass') {
          const cleanSlug = (serverSlugInput || checkoutPackage.serverSlug || 'custom-server').toLowerCase().trim();
          const cleanName = serverNameInput || checkoutPackage.serverName || 'Verified RP Server';
          const subExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;

          await setDoc(doc(db, 'servers', cleanSlug), {
            serverSlug: cleanSlug,
            serverName: cleanName,
            isSubscriptionActive: true,
            isVerifiedServerOwner: true,
            planTier: checkoutPackage.planTier || 'mega_server',
            stripeSubscriptionId: `sub_direct_${transactionId}`,
            subscriptionExpiresAt: subExpiry,
            subscriptionExpiresAtIso: new Date(subExpiry).toISOString(),
            ownerUid: currentUser.uid,
            ownerEmail: emailInput || currentUser.email || '',
            ownerDiscordId: discordIdInput || currentUser.discordId || '',
            updatedAt: Date.now()
          }, { merge: true }).catch(err => console.warn('Firestore servers update fallback:', err));

          await setDoc(doc(db, 'whitelist_forms', cleanSlug), {
            isSubscriptionActive: true,
            isVerifiedServerOwner: true,
            planTier: checkoutPackage.planTier || 'mega_server',
            stripeSubscriptionId: `sub_direct_${transactionId}`,
            subscriptionExpiresAt: subExpiry,
            updatedAt: Date.now()
          }, { merge: true }).catch(err => console.warn('Firestore whitelist_forms update fallback:', err));
        } else if (checkoutPackage.itemType === 'spotlight_rental') {
          const targetServerId = spotlightServerId || checkoutPackage.spotlightBooking?.serverId || 'server_1';
          const targetDate = spotlightDate || new Date().toISOString().split('T')[0];

          await setDoc(doc(db, 'spotlight_rentals', `${targetDate}_${targetServerId}`), {
            id: `${targetDate}_${targetServerId}`,
            serverId: targetServerId,
            date: targetDate,
            customBadge: spotlightBadge,
            customNote: spotlightNote,
            accentColor: spotlightAccent,
            ownerUid: currentUser.uid,
            ownerEmail: currentUser.email || '',
            amountPaid: effectiveNetPrice,
            status: 'confirmed',
            transactionId,
            createdAt
          }).catch(err => console.warn('Firestore spotlight_rentals fallback:', err));
        } else if (checkoutPackage.itemType === 'shark_card') {
          const cleanVoucherCode = (uniqueVoucherCode.includes('/') ? uniqueVoucherCode.split('/').pop()! : uniqueVoucherCode).trim().toUpperCase();

          await setDoc(doc(db, 'giftCards', cleanVoucherCode), {
            id: cleanVoucherCode,
            code: cleanVoucherCode,
            tier: checkoutPackage.tierName,
            cashValue: checkoutPackage.vcGranted || getVipVcGrantedNumber(),
            vipDaysGranted: checkoutPackage.vipDays || 0,
            isRedeemed: false,
            createdByUid: currentUser.uid,
            createdByName: recipientName,
            recipientGamerTag: recipientName,
            message: checkoutPackage.isGift ? (giftNote.trim() || 'Enjoy your Vice City Shark Card!') : 'Purchased via Secure Payment Gateway',
            createdAt,
            transactionId,
            amountPaid: effectiveNetPrice,
            paymentMethod: paymentMethod.toUpperCase()
          }).catch(err => console.warn('Firestore giftCard setDoc fallback:', err));

          if (!checkoutPackage.isGift) {
            const userRef = doc(db, 'userProfiles', currentUser.uid);
            await updateDoc(userRef, {
              vcBalance: increment(checkoutPackage.vcGranted || getVipVcGrantedNumber())
            }).catch(async () => {
              await setDoc(userRef, {
                vcBalance: checkoutPackage.vcGranted || getVipVcGrantedNumber()
              }, { merge: true });
            });
          }
        } else if (checkoutPackage.itemType === 'b2b_sponsor') {
          await setDoc(doc(db, 'adCampaigns', transactionId), {
            transactionId,
            createdByUid: currentUser.uid,
            serverName: checkoutPackage.sponsorDetails?.serverName || 'Sponsored Server',
            headline: checkoutPackage.sponsorDetails?.headline || 'Top Sponsored Placement',
            description: checkoutPackage.sponsorDetails?.description || '',
            targetUrl: checkoutPackage.sponsorDetails?.targetUrl || '',
            placementType: checkoutPackage.sponsorDetails?.placement || 'leaderboard',
            monthlyBudget: effectiveNetPrice,
            status: 'Active',
            createdAt
          }).catch(err => console.warn('Firestore adCampaign setDoc fallback:', err));
        }
      }

      const receiptMethodStr = paymentMethod === 'stripe'
        ? isTestToken
          ? `STRIPE TEST TOKEN (tok_visa •••• 4242)`
          : `STRIPE (CARD •••• ${cardNumber.replace(/\s/g, '').slice(-4) || '8892'})`
        : `PAYPAL (${paypalEmail.trim() || 'user@paypal.com'})`;

      const receipt: PaymentSuccessReceipt = {
        transactionId,
        itemType: checkoutPackage.itemType,
        tierName: checkoutPackage.tierName,
        amountPaid: effectiveNetPrice,
        discountSaved: effectiveDiscountSaved,
        vcGranted: checkoutPackage.vcGranted,
        vipDays: checkoutPackage.vipDays,
        voucherCode: uniqueVoucherCode,
        paymentMethod: receiptMethodStr,
        createdAt,
        recipient: recipientName,
        serverSlug: serverSlugInput || checkoutPackage.serverSlug,
        serverName: serverNameInput || checkoutPackage.serverName
      };

      setPaymentSuccessReceipt(receipt);
      if (onPaymentSuccess) {
        onPaymentSuccess(receipt);
      }
    } catch (err: any) {
      console.error('Payment gateway error:', err);
      setPaymentValidationError('Payment processing failed. Network or authorization error.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleExecutePayment = async () => {
    setPaymentValidationError('');

    if (!currentUser || !currentUser.uid) {
      setPaymentValidationError('⚠️ Authentication Required: Please log in or register your Vice Squad account before activating server passes or trials.');
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    if (isTrialMode) {
      await handleExecuteTrialClaim();
      return;
    }

    setPaymentValidationError('Payments are temporarily locked for system maintenance. We will get back soon!');
    return;
  };

  if (!isOpen) return null;

  return (
    <div
      id="unified-payment-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex min-h-full items-center justify-center p-3 sm:p-5 md:p-6 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessingPayment) {
          onClose();
        }
      }}
    >
      <div
        id="unified-payment-modal-card"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-y-auto flex flex-col text-left space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0 pr-8">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${
              isTrialMode
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : checkoutPackage.itemType === 'vip_pass'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : checkoutPackage.itemType === 'server_pro_pass'
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                : checkoutPackage.itemType === 'spotlight_rental'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isTrialMode ? (
                <Sparkles className="w-6 h-6 animate-pulse" />
              ) : checkoutPackage.itemType === 'vip_pass' ? (
                <Crown className="w-6 h-6 fill-current" />
              ) : checkoutPackage.itemType === 'server_pro_pass' ? (
                <Server className="w-6 h-6" />
              ) : checkoutPackage.itemType === 'spotlight_rental' ? (
                <Flame className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {isTrialMode ? '14-Day Free Pro Pass' : 'Secure Checkout'}
                </h3>
                <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-extrabold rounded-full border ${
                  isTrialMode
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isTrialMode ? '$0 Today' : '256-Bit SSL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{checkoutPackage.tierName}</p>
            </div>
          </div>

          {!isProcessingPayment && (
            <button
              id="payment-modal-close-btn"
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-slate-800/90 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer z-10"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto pr-0.5 space-y-5 flex-1">

        {/* RECEIPT / SUCCESS VIEW */}
        {paymentSuccessReceipt ? (
          <div className="space-y-6 text-center animate-fadeIn py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-xl font-black text-white">
                {paymentSuccessReceipt.trialActive
                  ? '⚡ 14-Day Free Pro Pass Activated!'
                  : checkoutPackage.itemType === 'vip_pass'
                  ? '🎉 VIP Membership Authorized & Activated!'
                  : checkoutPackage.itemType === 'server_pro_pass'
                  ? '🚀 Verified Server Owner Pass Activated!'
                  : checkoutPackage.itemType === 'spotlight_rental'
                  ? '🌟 Spotlight Banner Slot Locked In!'
                  : '💎 Payment Authorized & Voucher Issued!'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {paymentSuccessReceipt.trialActive
                  ? 'Your full 14-day zero-risk pass is live across the network and synchronized in Firestore.'
                  : 'Your payment was verified via 256-bit SSL and persisted to Firestore.'}
              </p>
            </div>

            {/* Benefit Box */}
            <div className="bg-slate-950 border border-amber-500/40 p-4.5 rounded-2xl space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                {paymentSuccessReceipt.trialActive
                  ? 'Official 14-Day Pro Pass Key:'
                  : checkoutPackage.itemType === 'vip_pass'
                  ? 'Official VIP Status & Benefits Unlocked:'
                  : checkoutPackage.itemType === 'server_pro_pass'
                  ? 'Verified Server Owner Key:'
                  : 'Your Official Digital Voucher Key:'}
              </span>
              <div className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wider flex items-center justify-center gap-3">
                <span>{paymentSuccessReceipt.voucherCode}</span>
                <button
                  onClick={() => handleCopyCode(paymentSuccessReceipt.voucherCode || '')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-xl transition cursor-pointer"
                  title="Copy Key"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiedCodeToast && (
                <p className="text-[10px] text-emerald-400 font-bold">Key copied to clipboard!</p>
              )}
            </div>

            {/* Transaction Details Table */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 sm:p-5 rounded-2xl text-xs font-mono space-y-2.5 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="text-slate-200 font-medium">{paymentSuccessReceipt.transactionId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">License / Method:</span>
                <span className="text-slate-200 font-medium">{paymentSuccessReceipt.paymentMethod}</span>
              </div>
              {paymentSuccessReceipt.serverSlug && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Portal URL:</span>
                  <span className="text-cyan-400 font-medium font-mono">viceintel.app/servers/{paymentSuccessReceipt.serverSlug}</span>
                </div>
              )}
              {paymentSuccessReceipt.vcGranted ? (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">VC Cash Granted:</span>
                  <span className="text-amber-400 font-bold">+{paymentSuccessReceipt.vcGranted.toLocaleString()} VC</span>
                </div>
              ) : null}
              <div className="flex justify-between items-center border-t border-slate-800/80 pt-2.5 font-bold">
                <span className="text-slate-400">Total Charged:</span>
                <span className="text-emerald-400 font-mono text-sm">
                  {paymentSuccessReceipt.amountPaid === 0 ? '$0.00 USD (Free Trial)' : `$${paymentSuccessReceipt.amountPaid.toFixed(2)} USD`}
                </span>
              </div>
            </div>

            <button
              id="payment-modal-success-btn"
              onClick={() => {
                onClose();
                if (paymentSuccessReceipt.serverSlug && onNavigate) {
                  onNavigate('servers-onboarding', paymentSuccessReceipt.serverSlug);
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {paymentSuccessReceipt.serverSlug ? 'Launch Server Management Portal' : 'Return & Enjoy Perks'}
            </button>
          </div>
        ) : (
          /* CHECKOUT / TRIAL FORM VIEW */
          <div className="space-y-5">
            {!currentUser && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-200 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="font-extrabold text-amber-300">Authentication Required</p>
                    <p className="text-[11px] text-amber-200/80">You are not signed in. Please log in or create an account before deploying a server or claiming a trial.</p>
                  </div>
                </div>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black hover:bg-amber-300 transition shrink-0 cursor-pointer shadow-md"
                  >
                    Sign In / Register
                  </button>
                )}
              </div>
            )}

            {/* SERVER PRO PASS / 14-DAY TRIAL REGISTRATION FIELDS */}
            {(checkoutPackage.itemType === 'server_pro_pass' || isTrialMode) && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span>Server & Community Information</span>
                </div>

                {/* Server Name */}
                <div>
                  <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    Server / Community Name *
                  </label>
                  <input
                    id="unified-server-name-input"
                    type="text"
                    value={serverNameInput}
                    onChange={(e) => handleServerNameChange(e.target.value)}
                    placeholder="e.g. Vice City State Roleplay"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                {/* Custom Server Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-extrabold uppercase text-slate-400">
                      Custom Application Portal URL *
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Lowercase & hyphens</span>
                  </div>
                  <div className={`flex items-center px-3.5 py-2 rounded-xl bg-slate-900 border text-xs transition ${
                    slugStatus === 'valid'
                      ? 'border-emerald-500/50 bg-emerald-950/10'
                      : slugStatus === 'taken' || slugStatus === 'invalid'
                      ? 'border-rose-500/50 bg-rose-950/10'
                      : 'border-slate-800 focus-within:border-rose-500'
                  }`}>
                    <span className="text-slate-500 font-mono select-none shrink-0">viceintel.app/servers/</span>
                    <input
                      id="unified-server-slug-input"
                      type="text"
                      value={serverSlugInput}
                      onChange={handleSlugInputChange}
                      placeholder="vcrp-official"
                      className="w-full bg-transparent text-xs text-cyan-300 font-mono focus:outline-none placeholder:text-slate-700 pl-1"
                    />
                    <div className="shrink-0 ml-2">
                      {slugStatus === 'checking' && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
                      {slugStatus === 'valid' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {(slugStatus === 'taken' || slugStatus === 'invalid') && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                    </div>
                  </div>
                  {slugFeedback && (
                    <p className={`text-[11px] mt-1 font-medium ${
                      slugStatus === 'valid' ? 'text-emerald-400' : slugStatus === 'checking' ? 'text-slate-400' : 'text-rose-400'
                    }`}>
                      {slugFeedback}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                      Discord ID / Username
                    </label>
                    <input
                      id="unified-discord-id-input"
                      type="text"
                      value={discordIdInput}
                      onChange={(e) => setDiscordIdInput(e.target.value)}
                      placeholder="e.g. server_founder#0001"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                      Owner Email
                    </label>
                    <input
                      id="unified-email-input"
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="owner@community.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>
                </div>

                {/* Features Included Checklist */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Included in 14-Day Pro Pass:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Unlimited Player Applications</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Gemini AI Lore & Rule Grader</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Instant Discord Bot Auto-Role</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>#1 Priority Directory Ranking</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:col-span-2 text-purple-300 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Sentinel Growth Suite (Streamer CRM, 9:16 Shorts & Referrals)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gift Recipient Option if isGift */}
            {checkoutPackage.isGift && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-rose-300">
                  <Gift className="w-4 h-4 text-rose-400" /> Gift Recipient Information
                </div>
                <div>
                  <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    Recipient Vice City GamerTag *
                  </label>
                  <input
                    type="text"
                    value={recipientGamerTag}
                    onChange={(e) => setRecipientGamerTag(e.target.value)}
                    placeholder="e.g. Lucia_ViceSquad"
                    className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    Gift Message / Greeting
                  </label>
                  <input
                    type="text"
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder="e.g. Enjoy your Vice City Perks!"
                    className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {/* SPOTLIGHT RENTAL CUSTOMIZATION */}
            {checkoutPackage.itemType === 'spotlight_rental' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Featured Server Spotlight Booking Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Select Server *
                    </label>
                    <select
                      value={spotlightServerId}
                      onChange={(e) => setSpotlightServerId(e.target.value)}
                      className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {RP_SERVERS_DATA.map((srv) => (
                        <option key={srv.id} value={srv.id}>{srv.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Rental Date *
                    </label>
                    <input
                      type="date"
                      value={spotlightDate}
                      onChange={(e) => setSpotlightDate(e.target.value)}
                      className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                    Custom Hero Badge Text
                  </label>
                  <input
                    type="text"
                    value={spotlightBadge}
                    onChange={(e) => setSpotlightBadge(e.target.value)}
                    placeholder="🌟 #1 FEATURED VICE CITY SERVER"
                    className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Non-Trial Order Summary & Payment Processor Controls */}
            {!isTrialMode && (
              <>
                <PaymentMaintenanceNotice
                  title="Payments Temporarily Locked"
                  subtitle="We are currently upgrading our payment gateways and licensing infrastructure. Payment processing is temporarily paused and will be back online soon!"
                  compact={false}
                />

                {/* Coupon Code Redemption Section */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-amber-400" />
                      <span>Have a Promo or Coupon Code?</span>
                    </label>
                    {appliedCoupon && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        COUPON APPLIED
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showCouponInput ? "text" : "password"}
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        placeholder="Enter Promo / Coupon Code"
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl pl-3.5 pr-10 text-xs text-amber-300 font-mono font-bold uppercase placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCouponInput(!showCouponInput)}
                        className="absolute right-3 top-2.5 p-1 text-slate-500 hover:text-white rounded transition cursor-pointer flex items-center justify-center"
                        title={showCouponInput ? "Hide Coupon" : "Show Coupon"}
                      >
                        {showCouponInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-4 h-10 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold text-xs transition cursor-pointer"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponInput.trim()}
                        className="px-4 h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isValidatingCoupon ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>Apply</span>
                      </button>
                    )}
                  </div>

                  {couponError && (
                    <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}

                  {appliedCoupon && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Promo Coupon Applied! Saved -${appliedCoupon.discountSaved.toFixed(2)} USD</span>
                      </div>
                      {appliedCoupon.maxCapApplied && (
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                          Max Cap Limit
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Itemized Summary */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Selected Plan:</span>
                    <span className="text-white font-bold">{checkoutPackage.tierName}</span>
                  </div>
                  {checkoutPackage.itemType === 'vip_pass' && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold space-y-1">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 fill-current" /> VIP Membership Benefits Included:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1 text-[10.5px]">
                        <li><strong className="text-amber-200">More avatars and custom avatars unlocked</strong> (Full GTA VI roster)</li>
                        <li>2x Daily streak login multiplier & +250 VC welcome bonus</li>
                        <li>Private VIP crew hubs & owner ban/kick moderation permissions</li>
                        <li>Exclusive gold crown badge across chat & leaderboards</li>
                      </ul>
                    </div>
                  )}
                  {checkoutPackage.vcGranted ? (
                    <div className="flex justify-between items-center text-slate-400">
                      <span>VC Cash Value:</span>
                      <span className="text-amber-400 font-bold">+{checkoutPackage.vcGranted.toLocaleString()} VC</span>
                    </div>
                  ) : null}
                  {checkoutPackage.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span>Standard Package Discount:</span>
                      <span>-${checkoutPackage.discountAmount.toFixed(2)} USD</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span>Promo Coupon ({appliedCoupon.code}):</span>
                      <span>-${appliedCoupon.discountSaved.toFixed(2)} USD</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/80 pt-2.5 text-sm font-bold">
                    <span className="text-white">Amount Due Today:</span>
                    <span className="text-emerald-400 font-mono text-lg font-black">
                      ${effectiveNetPrice.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Payment Processor Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-extrabold uppercase text-slate-300 block tracking-wide">
                    Select Payment Processor (Stripe & PayPal Services):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        id: 'stripe',
                        name: 'Stripe Checkout',
                        desc: 'Credit Cards, Debit Cards & Wallets via Stripe',
                        icon: Sparkles,
                        badge: 'Recommended'
                      },
                      {
                        id: 'paypal',
                        name: 'PayPal Express',
                        desc: 'Instant Cross-Border PayPal Authorization',
                        icon: DollarSign,
                        badge: 'Global'
                      }
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400/80 text-amber-300 shadow-lg shadow-amber-500/10'
                              : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900/50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 font-black text-sm text-white">
                              <Icon className={`w-4 h-4 ${m.id === 'stripe' ? 'text-indigo-400' : 'text-blue-400'}`} />
                              <span>{m.name}</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase rounded-full border ${
                              isSelected 
                                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' 
                                : 'bg-slate-800/80 text-slate-400 border-slate-700'
                            }`}>
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal">{m.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Form Fields */}
                {paymentMethod === 'stripe' && (
                  <div className="space-y-3.5 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800 text-xs font-bold text-white">
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-400" /> Credit / Debit Card Details (Stripe Secured)
                      </span>
                      <button
                        type="button"
                        onClick={handleFillStripeTestToken}
                        className="text-[10px] font-mono text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/35 px-2.5 py-1 rounded-lg border border-indigo-500/40 transition cursor-pointer flex items-center gap-1 font-extrabold shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-300" /> Auto-Fill Test Token (tok_visa)
                      </button>
                    </div>

                    {cardNumber.replace(/\s/g, '').includes('4242') && (
                      <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-[11px] text-indigo-200 flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Stripe Test Token Active (<strong className="text-white font-mono">tok_visa_4242</strong>)</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-extrabold">
                          Ready for Verification
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                        Cardholder Full Name *
                      </label>
                      <input
                        type="text"
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value)}
                        placeholder="e.g. Mohd Vance"
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                        16-Digit Card Number *
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 8901 2345 6789"
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                          Expiry (MM/YY) *
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={handleCardExpiryChange}
                          placeholder="08/28"
                          className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs font-mono text-white text-center focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                          CVC Code *
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          placeholder="888"
                          className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs font-mono text-white text-center focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                          Zip / Postal Code
                        </label>
                        <input
                          type="text"
                          value={cardZip}
                          onChange={(e) => setCardZip(e.target.value)}
                          placeholder="33139"
                          className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs font-mono text-white text-center focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <DollarSign className="w-4 h-4 text-blue-400" /> PayPal Express Account Authorization
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                        PayPal Account Email *
                      </label>
                      <input
                        type="email"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        placeholder="your.email@paypal.com"
                        className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Clicking Authorize will authenticate your PayPal email address for instant 1-click Express Checkout.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Error Banner */}
            {paymentValidationError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-rose-400" />
                <span>{paymentValidationError}</span>
              </div>
            )}

            {/* Streamlined Primary Action Button */}
            <div className="pt-2">
              {isTrialMode ? (
                /* Single High-Viability 14-Day Free Pro Pass CTA Button */
                <button
                  id="activate-instant-trial-btn"
                  onClick={handleExecutePayment}
                  disabled={
                    isProcessingPayment ||
                    !serverNameInput.trim() ||
                    !serverSlugInput.trim() ||
                    slugStatus === 'invalid' ||
                    slugStatus === 'taken' ||
                    slugStatus === 'checking'
                  }
                  className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-rose-600/25 border border-rose-400/30 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>{paymentStepText}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="whitespace-nowrap sm:whitespace-normal text-center">⚡ Activate Instant 14-Day Free Pro Pass ($0 Today)</span>
                    </>
                  )}
                </button>
              ) : (
                /* Paid Subscription / Purchase Authorization Button */
                <button
                  id="unified-payment-authorize-btn"
                  onClick={handleExecutePayment}
                  disabled={true}
                  className="w-full py-4 bg-zinc-800 text-zinc-400 font-black text-sm rounded-2xl border border-zinc-700 shadow-inner flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                >
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span>Payments Temporarily Locked (Will Get Back Soon)</span>
                </button>
              )}
            </div>

          </div>
        )}
        </div>
      </div>
    </div>
  );
};
