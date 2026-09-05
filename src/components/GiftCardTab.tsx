'use client';

import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sendRtdbMessage } from '../lib/firebase/rtdbChatService';
import { safeFirestoreWrite } from '../lib/firebase/firestoreCircuitBreaker';
import { GiftCard, GiftCardTier } from '../types';
import { PaymentGatewayModal, PaymentItemPackage } from './PaymentGatewayModal';
import { usePricingConfig } from '../lib/vipConfig';
import { formatDate, formatDateTime } from '../lib/dateUtils';
import {
  Gift,
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Zap,
  Crown,
  History,
  Tag,
  DollarSign,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowRight,
  Calculator,
  Percent,
  Lock,
  ShoppingCart,
  CheckCircle,
  Wallet,
  QrCode,
  Smartphone,
  ShieldAlert,
  ExternalLink,
  MessageSquare,
  X
} from 'lucide-react';

interface GiftCardTabProps {
  currentUser: FirebaseUser | null;
  isVipActive: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  onOpenAuthModal: () => void;
  onNavigate: (tab: any, targetId?: string) => void;
}

export interface CardTierTemplate {
  id: string;
  tier: GiftCardTier;
  faceValue: number; // Dollar value before discount
  discountPercent: number; // Discount %
  payPrice: number; // Net dollar cost
  vcValue: number; // Granted vcBalance
  vipDays: number;
  bgGradient: string;
  borderColor: string;
  badgeBg: string;
  iconColor: string;
  popular?: boolean;
  desc: string;
}

// Exact business logic pricing tiers:
// Min Purchase: $20.00 = 19,995 VC Balance
// Base Rate: $20 = 19,995 VC (999.75 VC / $1)
// Max Purchase: $100.00 = 99,975 VC Balance
// Discount: $20 off on $100 purchase (Max 20% discount)
export const fontTiers: CardTierTemplate[] = [
  {
    id: 'starter-20',
    tier: '$20 Starter Pack',
    faceValue: 20,
    discountPercent: 0,
    payPrice: 20.00,
    vcValue: 19995,
    vipDays: 0,
    bgGradient: 'from-zinc-950 via-cyan-950 to-slate-950',
    borderColor: 'border-cyan-500/50 hover:border-cyan-400',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    iconColor: 'text-cyan-400',
    desc: 'Minimum purchase tier. Grants 19,995 VC Balance at standard rate.'
  },
  {
    id: 'crew-40',
    tier: '$40 Crew Pack',
    faceValue: 40,
    discountPercent: 5,
    payPrice: 38.00,
    vcValue: 39990,
    vipDays: 14,
    bgGradient: 'from-zinc-950 via-teal-950 to-emerald-950',
    borderColor: 'border-teal-500/50 hover:border-teal-400',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    iconColor: 'text-teal-400',
    desc: 'Save $2.00 (5% off). Includes 39,990 VC Balance + 14-Day VIP perk.'
  },
  {
    id: 'executive-60',
    tier: '$60 Executive Pack',
    faceValue: 60,
    discountPercent: 10,
    payPrice: 54.00,
    vcValue: 59985,
    vipDays: 30,
    bgGradient: 'from-zinc-950 via-indigo-950 to-slate-950',
    borderColor: 'border-indigo-500/50 hover:border-indigo-400',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    iconColor: 'text-indigo-400',
    desc: 'Save $6.00 (10% off). Includes 59,985 VC Balance + 30-Day VIP Pass.'
  },
  {
    id: 'cartel-100',
    tier: '$100 Max Empire Pack',
    faceValue: 100,
    discountPercent: 20,
    payPrice: 80.00, // $100 - $20 discount = $80 final price!
    vcValue: 99975,
    vipDays: 60,
    bgGradient: 'from-zinc-950 via-rose-950 to-amber-950',
    borderColor: 'border-rose-500/50 hover:border-rose-400',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    iconColor: 'text-rose-400',
    popular: true,
    desc: 'MAX $20 DISCOUNT (20% off). Pay $80 for $100 value = 99,975 VC Balance + 60-Day VIP Founder status!'
  }
];

export const GiftCardTab: React.FC<GiftCardTabProps> = ({
  currentUser,
  isVipActive,
  isAdmin,
  isStaff,
  onOpenAuthModal,
  onNavigate
}) => {
  const pricing = usePricingConfig();

  // Input State for Code Redemption
  const [inputCode, setInputCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionStatus, setRedemptionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: { vcAmount: number; vipDays: number; name: string };
  }>({ type: null, message: '' });

  // User Profile Credits (vcBalance) & Ledger
  const [userVcBalance, setUserVcBalance] = useState<number>(19995);
  const [claimedCodes, setClaimedCodes] = useState<string[]>([]);
  const [redemptionLogs, setRedemptionLogs] = useState<
    { code: string; name: string; vcAmount: number; vipDays: number; timestamp: string }[]
  >([]);
  
  // Real-time VIP Expiration tracking
  const [userVipExpires, setUserVipExpires] = useState<string>('');
  const [userVipUntil, setUserVipUntil] = useState<string>('');

  // User's Purchased Vouchers List
  const [myPurchasedVouchers, setMyPurchasedVouchers] = useState<GiftCard[]>([]);
  const [isLoadingMyVouchers, setIsLoadingMyVouchers] = useState(false);

  // Copy helper state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Community Chat Voucher Sharing State
  const [sharingVoucherModal, setSharingVoucherModal] = useState<GiftCard | null>(null);
  const [shareTargetChannel, setShareTargetChannel] = useState<string>('general');
  const [shareNote, setShareNote] = useState<string>('');
  const [isPostingShare, setIsPostingShare] = useState<boolean>(false);
  const [shareSuccessToast, setShareSuccessToast] = useState<string | null>(null);
  const [availableChannels, setAvailableChannels] = useState<{ id: string; name: string; isVip?: boolean }[]>([
    { id: 'general', name: '#general (Main Lounge)' },
    { id: 'tuning', name: '#tuning (Vehicle Builds)' },
    { id: 'heists', name: '#heists (Heist Crew)' },
    { id: 'rp-servers', name: '#rp-servers (FiveM Directory)' }
  ]);

  // Sync custom community channels from Firestore
  useEffect(() => {
    const q = query(collection(db, 'customChannels'), limit(10));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: { id: string; name: string; isVip?: boolean }[] = [
        { id: 'general', name: '#general (Main Lounge)' },
        { id: 'tuning', name: '#tuning (Vehicle Builds)' },
        { id: 'heists', name: '#heists (Heist Crew)' },
        { id: 'rp-servers', name: '#rp-servers (FiveM Directory)' }
      ];
      snapshot.forEach((d) => {
        const data = d.data();
        if (!data.isDeleted) {
          list.push({ id: d.id, name: `#${data.name || d.id} (Community Hub)`, isVip: data.isVipOnly });
        }
      });
      setAvailableChannels(list);
    });
    return () => unsub();
  }, []);

  const handlePostVoucherToChat = async () => {
    if (!sharingVoucherModal || !currentUser) return;
    setIsPostingShare(true);
    try {
      const currentUsername = currentUser.displayName || currentUser.email?.split('@')[0] || 'ViceCityGamer';
      const currentAvatar = currentUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=Lucia';

      await sendRtdbMessage({
        username: currentUsername,
        avatar: currentAvatar,
        text: shareNote.trim() || `🎁 Shared an official ${sharingVoucherModal.tier} Shark Card (+${sharingVoucherModal.cashValue.toLocaleString('en-US')} VC) with the community!`,
        channel: shareTargetChannel,
        timestamp: new Date().toISOString(),
        isVip: isVipActive,
        isMod: isStaff,
        isAdmin: isAdmin,
        userLevel: isAdmin ? 'Admin' : isStaff ? 'Staff' : isVipActive ? 'VIP Member' : 'Player',
        attachment: {
          type: 'giftcard',
          title: `🎁 ${sharingVoucherModal.tier}`,
          detail: `Voucher Code: ${sharingVoucherModal.code} • +${sharingVoucherModal.cashValue.toLocaleString('en-US')} VC Balance`,
          badge: 'Shark Card',
          actionType: 'claim_giftcard',
          actionData: sharingVoucherModal.code,
          giftcardCode: sharingVoucherModal.code,
          giftcardVcValue: sharingVoucherModal.cashValue,
          giftcardTier: sharingVoucherModal.tier,
          giftcardVipDays: sharingVoucherModal.vipDaysGranted || 0
        },
        reactions: {}
      });

      setShareSuccessToast(`Successfully posted voucher to #${shareTargetChannel}! Community members can now claim it in chat.`);
      setSharingVoucherModal(null);
      setShareNote('');
      setTimeout(() => setShareSuccessToast(null), 5000);
    } catch (err) {
      console.error('Failed to post voucher to chat:', err);
      alert('Error posting voucher to community chat channel.');
    } finally {
      setIsPostingShare(false);
    }
  };

  // Custom Gift Card Purchase Calculator ($20 to $100)
  const [customPurchaseAmount, setCustomPurchaseAmount] = useState<number>(20); // $20 min

  // PAYMENT GATEWAY MODAL STATE
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPackage, setCheckoutPackage] = useState<PaymentItemPackage>({
    itemType: 'shark_card',
    tierName: '$20 Starter Pack',
    faceValue: 20,
    netPrice: 20,
    discountAmount: 0,
    discountPercent: 0,
    vcGranted: 19995,
    vipDays: 0,
    isGift: false
  });

  // Gift Recipient Info (if checkoutPackage.isGift is true)
  const [recipientGamerTag, setRecipientGamerTag] = useState('');
  const [giftNote, setGiftNote] = useState('');

  // Payment Gateway Form Inputs
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'applepay' | 'crypto'>('card');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('33139');
  const [paymentValidationError, setPaymentValidationError] = useState('');

  // Processing Animation & Receipts
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState('Encrypting payment details...');
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<{
    voucherCode: string;
    transactionId: string;
    tierName: string;
    amountPaid: number;
    discountSaved: number;
    vcGranted: number;
    vipDays: number;
    paymentMethod: string;
    createdAt: string;
    recipient: string;
  } | null>(null);

  // Admin Custom Generator State (L4 Clearance)
  const [adminCustomVcAmount, setAdminCustomVcAmount] = useState<number>(19995);
  const [adminVipDays, setAdminVipDays] = useState<number>(30);
  const [adminRecipient, setAdminRecipient] = useState<string>('');
  const [adminCreatedCode, setAdminCreatedCode] = useState<string | null>(null);
  const [isAdminGenerating, setIsAdminGenerating] = useState(false);

  // Sync admin custom VC default with CMS pricing
  useEffect(() => {
    if (pricing.vipVcValue) {
      setAdminCustomVcAmount(pricing.vipVcValue);
    }
  }, [pricing.vipVcValue]);

  // Load User Profile Data & Claims from MongoDB
  const fetchUserProfile = async () => {
    if (!currentUser) return;
    try {
      const apiRes = await fetch(`/api/user/profile?uid=${encodeURIComponent(currentUser.uid)}`);
      if (apiRes.ok) {
        const payload = await apiRes.json();
        if (payload.success && payload.data) {
          const data = payload.data;
          if (typeof data.vcBalance === 'number') {
            setUserVcBalance(data.vcBalance);
          } else if (typeof data.credits === 'number') {
            setUserVcBalance(data.credits);
          }
          if (Array.isArray(data.claimedVouchers)) {
            setClaimedCodes(data.claimedVouchers);
          }
          if (Array.isArray(data.voucherLogs)) {
            setRedemptionLogs(data.voucherLogs);
          }
          if (data.vipExpires) {
            setUserVipExpires(data.vipExpires);
          } else {
            setUserVipExpires('');
          }
          if (data.vipUntil) {
            setUserVipUntil(typeof data.vipUntil === 'number' ? new Date(data.vipUntil).toISOString() : String(data.vipUntil));
          } else {
            setUserVipUntil('');
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch user profile for gift card tab:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserProfile();
    }
  }, [currentUser]);

  // Fetch User's Purchased Vouchers from Firestore
  const fetchMyPurchasedVouchers = async () => {
    if (!currentUser) return;
    setIsLoadingMyVouchers(true);
    try {
      const giftCardsRef = collection(db, 'giftCards');
      const q = query(giftCardsRef, where('createdByUid', '==', currentUser.uid));
      const querySnap = await getDocs(q);
      const vouchers: GiftCard[] = [];
      querySnap.forEach((d) => {
        vouchers.push(d.data() as GiftCard);
      });
      // Sort newest first
      vouchers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyPurchasedVouchers(vouchers);
    } catch (err) {
      console.error('Error fetching purchased vouchers:', err);
    } finally {
      setIsLoadingMyVouchers(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMyPurchasedVouchers();
    }
  }, [currentUser]);

  // Helper Math for Purchase Calculator
  // Min: $20, Max: $100
  // Rate: $20 = 19,995 VC Balance (999.75 VC per dollar)
  // Discount: 0% at $20 up to 20% max at $100 ($20 max discount!)
  const clampedAmount = Math.max(20, Math.min(100, customPurchaseAmount));
  const discountPercent = ((clampedAmount - 20) / (100 - 20)) * 20; // 0% at 20, 20% at 100
  const dollarDiscount = (clampedAmount * discountPercent) / 100;
  const netPayPrice = Math.max(0, clampedAmount - dollarDiscount);
  const calculatedVcBalance = Math.round(clampedAmount * (pricing.vcRatePerDollar || 5000));

  // Format Card Number Input (Add spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Card Expiry MM/YY
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // OPEN PAYMENT GATEWAY MODAL FOR SELECTED PACK
  const handleOpenCheckout = (
    tierName: string,
    faceValue: number,
    netPrice: number,
    discountAmount: number,
    discountPct: number,
    vcGranted: number,
    vipDays: number,
    isGift: boolean = false
  ) => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }

    setCheckoutPackage({
      itemType: 'shark_card',
      tierName,
      faceValue,
      netPrice,
      discountAmount,
      discountPercent: discountPct,
      vcGranted,
      vipDays,
      isGift
    });

    // Default cardholder name
    setCardHolderName(currentUser.displayName || '');
    setPaymentValidationError('');
    setPaymentSuccessReceipt(null);
    setShowCheckoutModal(true);
  };

  // EXECUTE PAYMENT GATEWAY CHECKOUT TRANSACTION
  const handleProcessPaymentGateway = async () => {
    setPaymentValidationError('');

    if (checkoutPackage.isGift && !recipientGamerTag.trim()) {
      setPaymentValidationError("Please enter recipient's Vice City GamerTag!");
      return;
    }

    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 15) {
        setPaymentValidationError('Please enter a valid 16-digit credit card number.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setPaymentValidationError('Please enter a valid card expiration date (MM/YY).');
        return;
      }
      if (!cardCvc || cardCvc.length < 3) {
        setPaymentValidationError('Please enter a valid 3 or 4-digit card security code (CVC).');
        return;
      }
      if (!cardHolderName.trim()) {
        setPaymentValidationError('Please enter cardholder name as printed on card.');
        return;
      }
    }

    setIsProcessingPayment(true);

    try {
      // Realistic Multi-Stage Gateway Verification Animation
      setPaymentStepText('Encrypting credentials with 256-bit SSL...');
      await new Promise((r) => setTimeout(r, 700));

      setPaymentStepText('Connecting to Visa / Mastercard Secure Gateway...');
      await new Promise((r) => setTimeout(r, 800));

      setPaymentStepText('Verifying 3D Secure Banking Authorization...');
      await new Promise((r) => setTimeout(r, 900));

      setPaymentStepText('Generating official cryptographic Shark Card voucher key...');
      await new Promise((r) => setTimeout(r, 600));

      // Generate Unique Cryptographic Voucher Code
      const randCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const uniqueVoucherCode = `SHARK-2026-${randCode}`;
      const transactionId = `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const createdAt = new Date().toISOString();

      const recipientName = checkoutPackage.isGift ? recipientGamerTag.trim() : (currentUser?.displayName || 'Self Purchase');

      const giftCardRecord: GiftCard = {
        id: uniqueVoucherCode,
        code: uniqueVoucherCode,
        tier: checkoutPackage.tierName,
        cashValue: checkoutPackage.vcGranted,
        vipDaysGranted: checkoutPackage.vipDays,
        isRedeemed: false,
        createdByUid: currentUser?.uid || 'anonymous',
        createdByName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Gamer',
        recipientGamerTag: recipientName,
        message: checkoutPackage.isGift ? (giftNote.trim() || 'Enjoy your Vice City Shark Card!') : 'Purchased via Secure Payment Gateway',
        createdAt: createdAt,
        transactionId: transactionId,
        amountPaid: checkoutPackage.netPrice,
        paymentMethod: paymentMethod.toUpperCase()
      };

      // Store securely in Firestore
      const cleanVoucherCode = (uniqueVoucherCode.includes('/') ? uniqueVoucherCode.split('/').pop()! : uniqueVoucherCode).trim().toUpperCase();
      await setDoc(doc(db, 'giftCards', cleanVoucherCode), giftCardRecord).catch(err => console.warn('Firestore giftCards setDoc fallback:', err));

      // Create Payment Receipt
      const receipt = {
        voucherCode: uniqueVoucherCode,
        transactionId: transactionId,
        tierName: checkoutPackage.tierName,
        amountPaid: checkoutPackage.netPrice,
        discountSaved: checkoutPackage.discountAmount,
        vcGranted: checkoutPackage.vcGranted,
        vipDays: checkoutPackage.vipDays,
        paymentMethod: paymentMethod.toUpperCase(),
        createdAt: createdAt,
        recipient: recipientName
      };

      setPaymentSuccessReceipt(receipt);
      
      // Refresh user's purchased vouchers list
      fetchMyPurchasedVouchers();
    } catch (err: any) {
      console.error('Payment gateway error:', err);
      setPaymentValidationError('Payment processing failed. Network or authorization error.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // HANDLE VOUCHER CODE REDEMPTION (VERIFIES FIRESTORE DATABASE RECORD)
  const handleRedeemCode = async (codeToRedeem?: string) => {
    const rawTargetCode = (codeToRedeem || inputCode).trim().toUpperCase();
    const targetCode = rawTargetCode.includes('/') ? rawTargetCode.split('/').pop()!.trim() : rawTargetCode;

    if (!targetCode) {
      setRedemptionStatus({
        type: 'error',
        message: 'Please enter a valid Shark Card voucher key.'
      });
      return;
    }

    if (!currentUser) {
      onOpenAuthModal();
      return;
    }

    setIsRedeeming(true);
    setRedemptionStatus({ type: null, message: '' });

    try {
      // 1. Check if user already claimed this code in local state array
      if (claimedCodes.includes(targetCode)) {
        setRedemptionStatus({
          type: 'error',
          message: `Voucher code ${targetCode} has already been claimed on your account!`
        });
        setIsRedeeming(false);
        return;
      }

      // 2. Query Firestore 'giftCards' collection for official record
      const giftCardDocRef = doc(db, 'giftCards', targetCode);
      const cardSnap = await getDoc(giftCardDocRef);

      if (!cardSnap.exists()) {
        setRedemptionStatus({
          type: 'error',
          message: `Voucher key "${targetCode}" is invalid or does not exist. Please check code spelling or purchase an official Vice City Shark Card above.`
        });
        setIsRedeeming(false);
        return;
      }

      const cardData = cardSnap.data() as GiftCard;

      if (cardData.isRedeemed) {
        setRedemptionStatus({
          type: 'error',
          message: `This voucher card was redeemed on ${cardData.redeemedAt ? new Date(cardData.redeemedAt).toLocaleDateString('en-US') : 'a previous date'} by ${cardData.redeemedByUsername || 'another gamer'}.`
        });
        setIsRedeeming(false);
        return;
      }

      const rewardVc = cardData.cashValue || 0;
      const rewardVipDays = cardData.vipDaysGranted || 0;
      const rewardName = `${cardData.tier} (${rewardVc.toLocaleString('en-US')} VC)`;

      // 3. Mark card as redeemed in Firestore
      await setDoc(
        giftCardDocRef,
        {
          isRedeemed: true,
          redeemedByUid: currentUser.uid,
          redeemedByUsername: currentUser.displayName || currentUser.email?.split('@')[0] || 'Gamer',
          redeemedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // 4. Update User Profile in Firestore
      const newVcBalance = userVcBalance + rewardVc;
      const now = Date.now();
      const updatedClaimed = [...claimedCodes, targetCode];

      const newLogItem = {
        code: targetCode,
        name: rewardName,
        vcAmount: rewardVc,
        vipDays: rewardVipDays,
        timestamp: new Date().toISOString()
      };

      const updatedLogs = [newLogItem, ...redemptionLogs];

      const updatePayload: any = {
        vcBalance: newVcBalance,
        claimedVouchers: updatedClaimed,
        voucherLogs: updatedLogs,
        updatedAt: new Date().toISOString()
      };

      if (rewardVipDays > 0) {
        const addMs = rewardVipDays * 24 * 60 * 60 * 1000;
        
        // Ensure we preserve special Lifetime or Staff Accounts, otherwise extend normal subscription expiration
        if (userVipExpires !== 'Lifetime' && userVipExpires !== 'Staff Account') {
          let baseStartMs = now;
          if (userVipExpires && userVipExpires !== 'Expired') {
            const currentExpiryTime = new Date(userVipExpires).getTime();
            if (currentExpiryTime > now) {
              baseStartMs = currentExpiryTime;
            }
          } else if (userVipUntil) {
            const currentExpiryTime = new Date(userVipUntil).getTime();
            if (currentExpiryTime > now) {
              baseStartMs = currentExpiryTime;
            }
          }
          
          const newVipUntilMs = baseStartMs + addMs;
          const newVipUntilIso = new Date(newVipUntilMs).toISOString();
          const newVipExpiresDateStr = newVipUntilIso.split('T')[0];
          
          updatePayload.isVip = true;
          updatePayload.role = 'VIP Member';
          updatePayload.clearanceLevel = 'L2';
          updatePayload.vipUntil = newVipUntilIso;
          updatePayload.vipExpires = newVipExpiresDateStr;
        } else {
          // Keep active VIP flags and role details
          updatePayload.isVip = true;
        }
      }

      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          ...updatePayload
        })
      });

      setUserVcBalance(newVcBalance);
      setClaimedCodes(updatedClaimed);
      setRedemptionLogs(updatedLogs);
      setInputCode('');

      setRedemptionStatus({
        type: 'success',
        message: `Successfully redeemed ${rewardName}! +${rewardVc.toLocaleString('en-US')} VC added to your balance.`,
        details: { vcAmount: rewardVc, vipDays: rewardVipDays, name: rewardName }
      });

      // Refresh purchased vouchers list
      fetchMyPurchasedVouchers();
    } catch (err: any) {
      console.error('Error redeeming voucher:', err);
      setRedemptionStatus({
        type: 'error',
        message: 'Network error processing voucher redemption. Please try again in a moment.'
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Staff / Admin Custom Code Issuer
  const handleAdminGenerateCode = async () => {
    if (!isAdmin && !isStaff) return;
    setIsAdminGenerating(true);

    try {
      const newCode = `STAFF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const rawAmount = Number(adminCustomVcAmount) || pricing.vipVcValue || 19995;
      const cappedVcAmount = Math.min(100000, Math.max(1, rawAmount));

      const cardData: GiftCard = {
        id: newCode,
        code: newCode,
        tier: 'Custom Voucher',
        cashValue: cappedVcAmount,
        vipDaysGranted: Math.min(3650, Math.max(0, Number(adminVipDays) || 0)),
        isRedeemed: false,
        createdByUid: currentUser?.uid || 'staff',
        createdByName: 'Staff / Admin Issuer',
        recipientGamerTag: adminRecipient.trim() || 'Community Event',
        message: 'Official Vice City Community Tournament Voucher',
        createdAt: new Date().toISOString()
      };

      const cleanNewCode = (newCode.includes('/') ? newCode.split('/').pop()! : newCode).trim().toUpperCase();
      await setDoc(doc(db, 'giftCards', cleanNewCode), cardData).catch(err => console.warn('Admin code setDoc error:', err));
      setAdminCreatedCode(newCode);
      setAdminCustomVcAmount(cappedVcAmount);
      fetchMyPurchasedVouchers();
    } catch (e) {
      console.error('Admin code generation failed:', e);
      alert('Failed to issue voucher code.');
    } finally {
      setIsAdminGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border-b border-zinc-800/80 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" /> Vice City Shark Cards & Vouchers
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-mono font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Secure Payment Gateway
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                In-Game <span className="text-amber-400">vcBalance</span> & <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-300 bg-clip-text text-transparent">VIP Shark Cards</span>
              </h1>

              <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
                Purchase Vice City Shark Cards starting at <strong className="text-white">$20 (19,995 VC)</strong> up to <strong className="text-white">$100 (99,975 VC)</strong> with up to <strong className="text-emerald-400">20% discount ($20 OFF)</strong> via SSL Encrypted Payment Gateway.
              </p>
            </div>

            {/* QUICK USER BALANCE CARD */}
            <div className="w-full lg:w-auto shrink-0 bg-zinc-900/90 border border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between lg:justify-start gap-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block mb-0.5">
                  Your Current vcBalance
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono flex items-center gap-1">
                  <span>{userVcBalance.toLocaleString('en-US')}</span>
                  <span className="text-xs text-amber-500 font-sans">VC</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    isVipActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {isVipActive ? <Crown className="w-3 h-3 text-amber-400" /> : <Tag className="w-3 h-3" />}
                    {isVipActive ? 'VIP Founder Active' : 'Standard Gamer Tier'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {claimedCodes.length} Vouchers Redeemed
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('profile')}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                Profile <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">

        {/* 2. REAL GIFT CARD PURCHASE & DISCOUNT CALCULATOR */}
        <section className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 border border-amber-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Production Payment Gateway System
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  Dynamic Shark Card Calculator <span className="text-amber-400">(Min $20 — Max $100)</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" /> Up to 20% Discount ($20 OFF Max)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* SLIDER & CONTROLS */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-extrabold uppercase text-zinc-300">
                    Select Custom Voucher Amount ($)
                  </label>
                  <span className="text-sm font-mono font-black text-amber-400">
                    ${clampedAmount}.00 USD
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={customPurchaseAmount}
                  onChange={(e) => setCustomPurchaseAmount(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                />

                <div className="flex justify-between text-[11px] text-zinc-500 font-mono mt-1">
                  <span>$20 (Min — 19,995 VC)</span>
                  <span>$60 (10% Off)</span>
                  <span className="text-amber-400 font-bold">$100 (Max — 20% Off [$20 OFF!])</span>
                </div>
              </div>

              {/* Preset Quick Buttons */}
              <div>
                <span className="text-[11px] font-extrabold uppercase text-zinc-500 block mb-2">
                  Quick Select Package Tiers:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[20, 40, 60, 100].map((amt) => {
                    const isSelected = clampedAmount === amt;
                    const disc = amt === 100 ? 20 : amt === 60 ? 10 : amt === 40 ? 5 : 0;
                    return (
                      <button
                        key={amt}
                        onClick={() => setCustomPurchaseAmount(amt)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-sm font-black font-mono">${amt} USD</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {disc > 0 ? `${disc}% OFF ($${((amt * disc) / 100).toFixed(0)} Saved)` : 'Standard Rate'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rate breakdown info */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Base VC Exchange Rate:</span>
                  <span className="font-mono text-zinc-200">$20 = 19,995 VC Balance</span>
                </div>
                <div className="flex justify-between">
                  <span>Minimum Transaction:</span>
                  <span className="font-mono text-zinc-200">$20.00 USD</span>
                </div>
                <div className="flex justify-between">
                  <span>Maximum Discount Tier:</span>
                  <span className="font-mono text-zinc-200">$100.00 USD (Pay $80)</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold border-t border-zinc-800 pt-2">
                  <span>Security Protocol:</span>
                  <span className="font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 256-bit SSL Encrypted Payment Gateway
                  </span>
                </div>
              </div>
            </div>

            {/* LIVE SUMMARY SIDEBAR */}
            <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-inner">
              <h3 className="text-sm font-extrabold uppercase text-zinc-300 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-amber-400" /> Order Summary
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Package Face Value:</span>
                  <span className="text-white font-bold">${clampedAmount}.00</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>vcBalance Credit:</span>
                  <span className="text-amber-400 font-black text-sm">
                    +{calculatedVcBalance.toLocaleString('en-US')} VC
                  </span>
                </div>

                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Discount ({discountPercent.toFixed(0)}% OFF):</span>
                  <span>-${dollarDiscount.toFixed(2)} USD</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>Gateway Fee:</span>
                  <span className="text-emerald-400 font-bold">$0.00 (Waived)</span>
                </div>

                <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-sm">
                  <span className="font-sans font-bold text-white">Final Net Price:</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    ${netPayPrice.toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() =>
                    handleOpenCheckout(
                      `$${clampedAmount} Custom Pack`,
                      clampedAmount,
                      netPayPrice,
                      dollarDiscount,
                      discountPercent,
                      calculatedVcBalance,
                      clampedAmount >= 100 ? 60 : clampedAmount >= 60 ? 30 : clampedAmount >= 40 ? 14 : 0,
                      false
                    )
                  }
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" /> Buy for Myself (${netPayPrice.toFixed(2)})
                </button>

                <button
                  onClick={() =>
                    handleOpenCheckout(
                      `$${clampedAmount} Custom Pack (Gift)`,
                      clampedAmount,
                      netPayPrice,
                      dollarDiscount,
                      discountPercent,
                      calculatedVcBalance,
                      clampedAmount >= 100 ? 60 : clampedAmount >= 60 ? 30 : clampedAmount >= 40 ? 14 : 0,
                      true
                    )
                  }
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-rose-300 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-rose-400" /> Purchase as Gift for Friend
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. INSTANT CODE REDEMPTION BOX */}
        <section className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Zap className="w-3.5 h-3.5 text-rose-400" /> Official Voucher Key Redemption
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Redeem Purchased Voucher Code
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Enter your official purchased Vice City Shark Card key below to credit your unified <span className="text-amber-400 font-bold">vcBalance</span> immediately.
              </p>
            </div>

            {/* Input & Action Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SHARK-2026-X9K2-M7P3"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl px-4 py-3.5 text-sm font-mono uppercase tracking-widest text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition shadow-inner"
                />
                {inputCode && (
                  <button
                    onClick={() => setInputCode('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white px-2 py-1 rounded bg-zinc-800"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                onClick={() => handleRedeemCode()}
                disabled={isRedeeming || !inputCode.trim()}
                className="px-6 py-3.5 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
              >
                {isRedeeming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying DB...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Claim Voucher
                  </>
                )}
              </button>
            </div>

            {/* Alert Status Banner */}
            {redemptionStatus.type && (
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 animate-fade-in ${
                  redemptionStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                }`}
              >
                {redemptionStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-extrabold">
                    {redemptionStatus.type === 'success' ? 'Voucher Code Redeemed!' : 'Redemption Failed'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">{redemptionStatus.message}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 4. OFFICIAL SHARK CARD CATALOG (NO SENSITIVE UNBOUGHT KEYS) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-rose-400" /> Official Vice City Shark Card Tiers
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Official digital Shark Cards with instant payment gateway processing and email/receipt delivery.
              </p>
            </div>

            <span className="text-xs text-zinc-500 font-mono">4 Store Tiers Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {fontTiers.map((card) => {
              const savings = card.faceValue - card.payPrice;

              return (
                <div
                  key={card.id}
                  className={`relative bg-gradient-to-br ${card.bgGradient} border ${card.borderColor} rounded-3xl p-5 shadow-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-rose-500/10 group`}
                >
                  {card.popular && (
                    <span className="absolute -top-3 right-4 px-3 py-0.5 text-[10px] font-black uppercase rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 shadow-md">
                      ★ Max $20 Discount
                    </span>
                  )}

                  <div className="space-y-4">
                    {/* Top Card Branding */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-zinc-900/80 border border-zinc-700/80 flex items-center justify-center text-white font-black text-sm">
                          VI
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                          Shark Card
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-lg border ${card.badgeBg}`}>
                        ${card.payPrice.toFixed(2)} USD
                      </span>
                    </div>

                    {/* Cash & Title */}
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">{card.tier}</h3>
                      <div className="text-2xl font-black text-amber-400 font-mono mt-1 flex items-center gap-1">
                        <span>{card.vcValue.toLocaleString('en-US')}</span>
                        <span className="text-xs text-amber-500 font-sans">VC</span>
                      </div>
                      {card.discountPercent > 0 && (
                        <p className="text-xs text-emerald-400 font-extrabold mt-0.5">
                          Save ${savings.toFixed(2)} ({card.discountPercent}% OFF)
                        </p>
                      )}
                      {card.vipDays > 0 && (
                        <p className="text-xs text-amber-300 font-extrabold mt-1 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5" /> + Includes {card.vipDays} Days VIP Status
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
                  </div>

                  {/* Purchase CTA Buttons */}
                  <div className="mt-6 pt-4 border-t border-zinc-800/80 space-y-2">
                    <button
                      onClick={() =>
                        handleOpenCheckout(
                          card.tier,
                          card.faceValue,
                          card.payPrice,
                          savings,
                          card.discountPercent,
                          card.vcValue,
                          card.vipDays,
                          false
                        )
                      }
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Buy Pack (${card.payPrice.toFixed(2)})
                    </button>

                    <button
                      onClick={() =>
                        handleOpenCheckout(
                          card.tier,
                          card.faceValue,
                          card.payPrice,
                          savings,
                          card.discountPercent,
                          card.vcValue,
                          card.vipDays,
                          true
                        )
                      }
                      className="w-full py-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-rose-300 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Buy as Gift for Friend
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. MY PURCHASED VOUCHERS LIST */}
        {currentUser && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">My Purchased Vouchers</h3>
                  <p className="text-xs text-zinc-400">
                    Official Shark Cards bought by your account ({currentUser.displayName || currentUser.email}).
                  </p>
                </div>
              </div>

              <button
                onClick={fetchMyPurchasedVouchers}
                disabled={isLoadingMyVouchers}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMyVouchers ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {myPurchasedVouchers.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/60 rounded-2xl border border-zinc-800/80 space-y-2">
                <ShoppingCart className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">You haven't purchased any Shark Card vouchers yet.</p>
                <p className="text-[11px] text-zinc-500">
                  Select a pack above to complete your first payment gateway purchase!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myPurchasedVouchers.map((voucher) => {
                  const isRedeemed = voucher.isRedeemed;
                  return (
                    <div
                      key={voucher.id}
                      className={`p-4 rounded-2xl border bg-zinc-950 space-y-3 ${
                        isRedeemed ? 'border-zinc-800 opacity-70' : 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{voucher.tier}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                            isRedeemed
                              ? 'bg-zinc-800 text-zinc-400'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {isRedeemed ? 'REDEEMED' : 'UNCLAIMED / ACTIVE'}
                        </span>
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl font-mono text-xs font-bold text-amber-300 flex items-center justify-between">
                        <span>{voucher.code}</span>
                        <button
                          onClick={() => handleCopyCode(voucher.code)}
                          className="p-1 hover:text-white"
                          title="Copy key"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-zinc-400 space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span>Value:</span>
                          <span className="text-amber-400 font-bold">+{voucher.cashValue.toLocaleString()} VC</span>
                        </div>
                        {voucher.recipientGamerTag && (
                          <div className="flex justify-between">
                            <span>Recipient:</span>
                            <span className="text-zinc-200">{voucher.recipientGamerTag}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-zinc-500 text-[10px]">
                          <span>Purchased:</span>
                          <span>{formatDate(voucher.createdAt)}</span>
                        </div>
                      </div>

                      {!isRedeemed && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => {
                              setInputCode(voucher.code);
                              handleRedeemCode(voucher.code);
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Redeem
                          </button>
                          <button
                            onClick={() => {
                              setSharingVoucherModal(voucher);
                              setShareNote(`🎁 Claim this ${voucher.tier} (+${voucher.cashValue.toLocaleString('en-US')} VC) for Vice City!`);
                            }}
                            className="w-full py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-zinc-950 font-black text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Drop to Chat
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 6. STAFF / ADMIN VOUCHER ISSUER (L4 MODERATION ACCESS) */}
        {(isAdmin || isStaff) && (
          <section className="bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-950 border border-indigo-500/40 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Staff & Admin Level 4 Clearance
                </span>
                <h3 className="text-xl font-black text-white">Community Tournament Voucher Issuer</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-extrabold uppercase text-zinc-400 block mb-1">
                  vcBalance Amount (VC) <span className="text-amber-400 text-[10px] font-normal">(Max: 100,000 VC)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={adminCustomVcAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAdminCustomVcAmount(val > 100000 ? 100000 : val);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-zinc-400 block mb-1">
                  VIP Pass Days
                </label>
                <input
                  type="number"
                  value={adminVipDays}
                  onChange={(e) => setAdminVipDays(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-amber-300"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase text-zinc-400 block mb-1">
                  Recipient / Event Label
                </label>
                <input
                  type="text"
                  value={adminRecipient}
                  onChange={(e) => setAdminRecipient(e.target.value)}
                  placeholder="e.g. Discord Heist Winner"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                onClick={handleAdminGenerateCode}
                disabled={isAdminGenerating}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                {isAdminGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Issuing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Issue Custom Code
                  </>
                )}
              </button>

              {adminCreatedCode && (
                <div className="flex items-center gap-2 bg-zinc-950 border border-indigo-500/40 px-4 py-2 rounded-xl text-xs font-mono font-black text-indigo-300">
                  <span>Issued: {adminCreatedCode}</span>
                  <button
                    onClick={() => handleCopyCode(adminCreatedCode)}
                    className="p-1 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 7. REDEMPTION TRANSACTION HISTORY LEDGER */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="text-lg font-black text-white">Redemption Transaction History</h3>
                <p className="text-xs text-zinc-400">
                  Live ledger of redeemed Shark Cards and VIP passes for account {currentUser?.displayName || 'Guest'}.
                </p>
              </div>
            </div>

            <span className="text-xs text-zinc-500 font-mono">
              {redemptionLogs.length} Records Logged
            </span>
          </div>

          {redemptionLogs.length === 0 ? (
            <div className="p-8 text-center bg-zinc-950/60 rounded-2xl border border-zinc-800/80 space-y-2">
              <Tag className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">No redeemed voucher logs found on this account yet.</p>
              <p className="text-[11px] text-zinc-500">
                Purchase an official Shark Card above to start building your Vice City empire!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider font-extrabold">
                    <th className="pb-3 px-3">Voucher Code</th>
                    <th className="pb-3 px-3">Package Name</th>
                    <th className="pb-3 px-3">vcBalance Gain</th>
                    <th className="pb-3 px-3">VIP Bonus</th>
                    <th className="pb-3 px-3">Redeemed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {redemptionLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/40 transition">
                      <td className="py-3 px-3 font-bold text-rose-300">{log.code}</td>
                      <td className="py-3 px-3 font-sans text-zinc-200">{log.name}</td>
                      <td className="py-3 px-3 text-amber-400 font-bold">
                        {log.vcAmount > 0 ? `+${log.vcAmount.toLocaleString('en-US')} VC` : '—'}
                      </td>
                      <td className="py-3 px-3 text-amber-300 font-bold">
                        {log.vipDays > 0 ? `+${log.vipDays} Days VIP` : '—'}
                      </td>
                      <td className="py-3 px-3 text-zinc-500 font-sans">
                        {formatDateTime(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* 8. SHARED PRODUCTION PAYMENT GATEWAY CHECKOUT MODAL */}
      <PaymentGatewayModal
        isOpen={showCheckoutModal}
        onClose={() => {
          setShowCheckoutModal(false);
          fetchMyPurchasedVouchers();
        }}
        checkoutPackage={checkoutPackage}
        currentUser={currentUser}
        onOpenAuthModal={onOpenAuthModal}
        onPaymentSuccess={() => {
          fetchMyPurchasedVouchers();
        }}
      />

      {/* Share Voucher to Community Chat Modal */}
      {sharingVoucherModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Post Voucher to Community Chat</h3>
                  <p className="text-xs text-zinc-400">{sharingVoucherModal.tier} (+{sharingVoucherModal.cashValue.toLocaleString()} VC)</p>
                </div>
              </div>
              <button
                onClick={() => setSharingVoucherModal(null)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold mb-1">Select Target Community Channel *</label>
                <select
                  value={shareTargetChannel}
                  onChange={(e) => setShareTargetChannel(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {availableChannels.map((chan) => (
                    <option key={chan.id} value={chan.id}>
                      {chan.name} {chan.isVip ? '(VIP Exclusive)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">Chat Message / Announcement Note</label>
                <textarea
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Dropping an official Shark Card for the Vice City crew! Claim fast in chat!"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-zinc-950 border border-amber-500/30 p-3 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-400">Attached Voucher Preview:</span>
                <p className="font-mono text-xs text-zinc-200 font-bold">{sharingVoucherModal.code}</p>
                <p className="text-[11px] text-zinc-400">Value: +{sharingVoucherModal.cashValue.toLocaleString()} VC Balance</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSharingVoucherModal(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePostVoucherToChat}
                disabled={isPostingShare}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-zinc-950 font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isPostingShare ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Share to Community
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Toast Notification */}
      {shareSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="space-y-0.5">
            <p>{shareSuccessToast}</p>
            <button
              onClick={() => {
                setShareSuccessToast(null);
                onNavigate('chat', shareTargetChannel);
              }}
              className="text-amber-400 underline hover:text-amber-300 text-[10px]"
            >
              Go to Community Chat (#{shareTargetChannel}) →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
