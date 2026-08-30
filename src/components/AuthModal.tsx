'use client';
import React, { useState, useEffect } from 'react';
import {
  Crown,
  CheckCircle2,
  X,
  CreditCard,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Sparkles,
  Zap,
  Check,
  LogOut,
  LogIn,
  AlertCircle,
  HelpCircle,
  Bell,
  Newspaper,
  Car,
  Crosshair,
  AtSign,
  Key,
  CheckCheck,
  ChevronRight,
  ShieldAlert,
  Trash2,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Tag
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { GTA6_AVATARS, DEFAULT_GTA6_AVATAR, getSafePhotoURL } from '../data/avatars';
import { EmailVerificationStep } from './EmailVerificationStep';
import { PaymentMaintenanceNotice } from './PaymentMaintenanceNotice';
import { ENV } from '../lib/envConfig';
import { getVipPriceFormatted, getVipPriceText } from '../lib/vipConfig';
import { formatShortTimestamp } from '../lib/dateUtils';
import { isNotificationSoundMuted, toggleNotificationSound, playNotificationChime } from '../lib/soundUtils';
import { UserNotification, NotificationType, ActiveTab } from '../types';

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const DiscordIcon = () => (
  <svg className="w-4 h-4 shrink-0 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVipActive: boolean;
  onUpgradeToVip: () => void;
  onDowngradeVip?: () => void;
  currentUser: FirebaseUser | null;
  notifications?: UserNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onApproveJoinRequest?: (channelId: string, requesterName: string) => void;
  onDeclineJoinRequest?: (channelId: string, requesterName: string) => void;
  onNavigate?: (tab: ActiveTab, targetId?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isVipActive,
  onUpgradeToVip,
  onDowngradeVip,
  currentUser,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onApproveJoinRequest,
  onDeclineJoinRequest,
  onNavigate
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'checkout'>('login');
  const [profileTab, setProfileTab] = useState<'settings' | 'notifications'>('settings');
  const [notificationFilter, setNotificationFilter] = useState<'all' | NotificationType>('all');
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => isNotificationSoundMuted());

  useEffect(() => {
    const handleSoundToggle = (e: any) => {
      setIsSoundMuted(e.detail?.muted ?? isNotificationSoundMuted());
    };
    window.addEventListener('gtavi_sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('gtavi_sound_toggle', handleSoundToggle);
  }, []);

  const handleToggleSound = () => {
    const nextMuted = toggleNotificationSound();
    setIsSoundMuted(nextMuted);
    if (!nextMuted) {
      playNotificationChime(true);
    }
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Email format validation & 2-Step verification states
  const [regStep, setRegStep] = useState<'input' | 'code'>('input');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSentNotice, setCodeSentNotice] = useState<string | null>(null);
  const [devCodePreview, setDevCodePreview] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [paypalEmailInput, setPaypalEmailInput] = useState('');

  // Promo Coupon & Discount States
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number; discountSaved: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = couponCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const basePrice = 3.99;
      let percent = 0;
      let codeName = cleanCode;

      if (['VICE2026', 'VIP50', 'WELCOME50', 'VICE50'].includes(cleanCode)) {
        percent = 50;
      } else if (['FREEVIP', 'VIP100', 'VICE100', 'STAFF100', 'TEST100'].includes(cleanCode)) {
        percent = 100;
      } else if (['VICE20', 'VIP20', 'COMMUNITY20', 'VCC15'].includes(cleanCode)) {
        percent = 20;
      } else {
        const couponRef = doc(db, 'discount_coupons', cleanCode);
        const snap = await getDoc(couponRef);
        if (snap.exists() && snap.data().active !== false) {
          percent = Number(snap.data().discountValue) || 20;
          codeName = snap.data().code || cleanCode;
        } else {
          setCouponError('Invalid or expired coupon code.');
          setIsValidatingCoupon(false);
          return;
        }
      }

      const saved = Number(((basePrice * percent) / 100).toFixed(2));
      setAppliedCoupon({
        code: codeName,
        discountPercent: percent,
        discountSaved: saved
      });
      setCouponCodeInput('');
    } catch {
      setCouponError('Failed to validate promo code.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const getFinalVipPriceFormatted = () => {
    const base = 3.99;
    if (!appliedCoupon) return getVipPriceFormatted();
    const finalPrice = Math.max(0, base - appliedCoupon.discountSaved);
    return `$${finalPrice.toFixed(2)}/mo`;
  };

  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleCardCvcChange = (val: string) => {
    setCardCvc(val.replace(/\D/g, '').slice(0, 4));
  };

  const [gamerTag, setGamerTag] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_GTA6_AVATAR);
  const [gamerTagSaved, setGamerTagSaved] = useState(false);
  const [changesUsedThisYear, setChangesUsedThisYear] = useState<number>(0);

  useEffect(() => {
    if (currentUser) {
      if (mode === 'login' || mode === 'register') {
        setMode('checkout');
      }
      setGamerTag(currentUser.displayName || '');
      if (currentUser.photoURL) {
        setSelectedAvatar(currentUser.photoURL);
      } else {
        setSelectedAvatar(DEFAULT_GTA6_AVATAR);
      }
    } else {
      setMode('login');
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (currentUser) {
        setMode('checkout');
      } else {
        setMode('login');
      }

      // URL cleanup if any oauth params present
      if (typeof window !== 'undefined') {
        try {
          const params = new URLSearchParams(window.location.search);
          if (params.has('discordError') || params.has('discord_error')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('discordError');
            url.searchParams.delete('error_description');
            url.searchParams.delete('discord_error');
            url.searchParams.delete('error');
            window.history.replaceState({}, document.title, url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
          }
        } catch (err) {
          console.warn('Could not parse parameters from URL:', err);
        }
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSaveGamerTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const trimmedTag = gamerTag.trim();
    if (!trimmedTag) {
      setAuthError('GamerTag cannot be empty.');
      return;
    }

    if (/\s/.test(trimmedTag)) {
      setAuthError('❌ GamerTag / UserTag cannot contain spaces. Use underscores (_) or hyphens (-) instead.');
      return;
    }

    if (trimmedTag.toLowerCase().includes('admin')) {
      setAuthError('❌ GamerTag cannot contain the word "admin" for security and authenticity reasons.');
      return;
    }

    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const currentTag = currentUser.displayName || '';
      const isTagChanging = trimmedTag.toLowerCase() !== currentTag.toLowerCase();

      // 1. Check Uniqueness across userProfiles in Firestore
      if (isTagChanging) {
        try {
          const q = query(
            collection(db, 'userProfiles'),
            where('usernameLower', '==', trimmedTag.toLowerCase())
          );
          const snapshot = await getDocs(q);
          const duplicateDoc = snapshot.docs.find(d => d.id !== currentUser.uid);
          if (duplicateDoc) {
            setAuthError(`⚠️ GamerTag "${trimmedTag}" is already taken by another player! GamerTags must be unique.`);
            setIsAuthLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Uniqueness check query warning:', err);
        }
      }

      // 2. Enforce Max 2 Changes Per Year (365 days)
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      let history: Array<{ timestamp: number; tag: string }> = [];
      const localRaw = localStorage.getItem(`gtavi_tag_history_${currentUser.uid}`);
      if (localRaw) {
        try { history = JSON.parse(localRaw); } catch { history = []; }
      }

      try {
        const userSnap = await getDoc(doc(db, 'userProfiles', currentUser.uid));
        if (userSnap.exists() && Array.isArray(userSnap.data()?.changeHistory)) {
          const fsHistory = userSnap.data().changeHistory;
          if (fsHistory.length > history.length) {
            history = fsHistory;
          }
        }
      } catch (e) {
        console.warn('Could not read user profile doc:', e);
      }

      const recentChanges = history.filter(h => now - h.timestamp < ONE_YEAR_MS);

      if (isTagChanging && currentTag !== '') {
        if (recentChanges.length >= 2) {
          const oldestChange = recentChanges.reduce((min, h) => h.timestamp < min ? h.timestamp : min, recentChanges[0].timestamp);
          const nextDateStr = new Date(oldestChange + ONE_YEAR_MS).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          setAuthError(`❌ GamerTag change limit reached! You can only change your GamerTag 2 times per year. Next change available after ${nextDateStr}.`);
          setIsAuthLoading(false);
          return;
        }

        history.push({ timestamp: now, tag: trimmedTag });
        localStorage.setItem(`gtavi_tag_history_${currentUser.uid}`, JSON.stringify(history));
      }

      // Helper function to sync user profile document to Firestore
      const syncUserProfileToFirestore = async (
        uid: string,
        data: {
          username?: string;
          email?: string | null;
          avatar?: string;
          role?: string;
          isVip?: boolean;
          vipExpires?: string;
          status?: string;
        }
      ) => {
        try {
          const userDocRef = doc(db, 'userProfiles', uid);
          const existingSnap = await getDoc(userDocRef);
          const nowStr = new Date().toISOString();

          if (!existingSnap.exists()) {
            await setDoc(userDocRef, {
              uid,
              username: data.username || 'ViceCityPlayer_2026',
              usernameLower: (data.username || 'ViceCityPlayer_2026').toLowerCase(),
              email: data.email || '',
              avatar: data.avatar || DEFAULT_GTA6_AVATAR,
              role: data.role || (data.isVip ? 'VIP Member' : 'User'),
              isVip: data.isVip ?? false,
              status: data.status || 'Active',
              createdAt: nowStr,
              updatedAt: nowStr
            });
          } else {
            const updates: Record<string, any> = { updatedAt: nowStr };
            if (data.username) {
              updates.username = data.username;
              updates.usernameLower = data.username.toLowerCase();
            }
            if (data.email) updates.email = data.email;
            if (data.avatar) updates.avatar = data.avatar;
            if (data.role) updates.role = data.role;
            if (data.isVip !== undefined) updates.isVip = data.isVip;
            if (data.vipExpires !== undefined) updates.vipExpires = data.vipExpires;
            if (data.status) updates.status = data.status;

            await setDoc(userDocRef, updates, { merge: true });
          }
        } catch (err) {
          console.warn('Failed to sync user profile to Firestore:', err);
        }
      };

      // 3. Sync to Firestore userProfiles collection
      try {
        await syncUserProfileToFirestore(currentUser.uid, {
          username: trimmedTag,
          email: currentUser.email,
          avatar: selectedAvatar,
          isVip: isVipActive
        });
      } catch (err) {
        console.warn('Could not sync profile doc to Firestore:', err);
      }

      // 4. Update Auth Profile
      await updateProfile(currentUser, {
        displayName: trimmedTag,
        photoURL: getSafePhotoURL(selectedAvatar, trimmedTag)
      });

      const updatedRecent = history.filter(h => now - h.timestamp < ONE_YEAR_MS);
      setChangesUsedThisYear(updatedRecent.length);
      setGamerTagSaved(true);
      setTimeout(() => setGamerTagSaved(false), 3000);
    } catch (err: any) {
      console.error('Update Profile Error:', err);
      setAuthError('Failed to update Profile: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: any) {
      console.warn('Firebase Auth sign in notice:', err?.code || err?.message);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email') {
        setAuthError('Invalid email or password. If you do not have an account yet, click "Create one now" below or continue with Google.');
      } else {
        setAuthError(err.message || 'Failed to sign in.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRequestVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setCodeSentNotice(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setAuthError('GamerTag / Username is required.');
      return;
    }
    if (/\s/.test(cleanUsername)) {
      setAuthError('❌ GamerTag / UserTag cannot contain spaces. Use underscores (_) or hyphens (-) instead.');
      return;
    }

    if (cleanUsername.toLowerCase().includes('admin')) {
      setAuthError('❌ GamerTag / Username cannot contain the word "admin" for security and authenticity reasons.');
      return;
    }
    if (!email.trim()) {
      setAuthError('Email Address is required.');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setIsSendingCode(true);

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          username: cleanUsername
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error || 'Failed to validate email format or send verification code.');
        setIsSendingCode(false);
        return;
      }

      setCodeSentNotice(data.message || `🔑 A 6-digit verification code has been dispatched to ${email.trim()}`);
      if (data.code) {
        setDevCodePreview(data.code);
      }
      setRegStep('code');
    } catch (err: any) {
      console.error('Request Verification Code Error:', err);
      setAuthError('Network error while validating email format or dispatching verification code.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCodeAndRegister = async (codeOrEvent?: string | React.FormEvent) => {
    if (codeOrEvent && typeof codeOrEvent === 'object' && 'preventDefault' in codeOrEvent) {
      codeOrEvent.preventDefault();
    }
    setAuthError(null);

    const codeToVerify = typeof codeOrEvent === 'string' ? codeOrEvent : verificationCodeInput;

    if (!codeToVerify || codeToVerify.trim().length !== 6) {
      setAuthError('Please enter the complete 6-digit numeric verification code sent to your email.');
      return;
    }

    setIsVerifyingCode(true);

    try {
      // 1. Verify code on server
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: codeToVerify.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error || 'Invalid 6-digit verification code. Please check your email and try again.');
        setIsVerifyingCode(false);
        return;
      }

      // 2. Email is verified! Proceed with Firebase user creation
      const cleanUsername = username.trim();
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);

      if (cleanUsername && userCred.user) {
        await updateProfile(userCred.user, {
          displayName: cleanUsername,
          photoURL: getSafePhotoURL(DEFAULT_GTA6_AVATAR, cleanUsername)
        });

        // Sync verified profile document to Firestore userProfiles
        try {
          const userDocRef = doc(db, 'userProfiles', userCred.user.uid);
          await setDoc(userDocRef, {
            uid: userCred.user.uid,
            username: cleanUsername,
            usernameLower: cleanUsername.toLowerCase(),
            email: email.trim().toLowerCase(),
            emailVerified: true,
            verifiedAt: new Date().toISOString(),
            avatar: DEFAULT_GTA6_AVATAR,
            role: 'User',
            isVip: false,
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (fsErr) {
          console.warn('Failed to sync verified user profile to Firestore:', fsErr);
        }
      }

      // Reset registration state
      setRegStep('input');
      setVerificationCodeInput('');
      setDevCodePreview(null);
      setCodeSentNotice(null);
      onClose();
    } catch (err: any) {
      console.error('Firebase Register Error:', err);
      setAuthError(err.message || 'Failed to create verified account.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        const rawName = result.user.displayName || result.user.email?.split('@')[0] || 'ViceCityPlayer';
        let cleanName = rawName.replace(/\s+/g, '_');
        if (cleanName.toLowerCase().includes('admin')) {
          cleanName = cleanName.replace(/admin/gi, 'player');
        }
        setGamerTag(cleanName);

        // Ensure userProfile exists and has valid avatar and googlePhotoURL
        try {
          const userDocRef = doc(db, 'userProfiles', result.user.uid);
          const snap = await getDoc(userDocRef);
          const googlePhoto = result.user.photoURL || null;
          if (!snap.exists()) {
            await setDoc(userDocRef, {
              uid: result.user.uid,
              username: cleanName,
              usernameLower: cleanName.toLowerCase(),
              email: result.user.email || 'user@vicecity.app',
              avatar: googlePhoto || DEFAULT_GTA6_AVATAR,
              googlePhotoURL: googlePhoto,
              role: 'User',
              isAdmin: false,
              isStaff: false,
              clearanceLevel: 'Member',
              userLevel: 'Member',
              isVip: false,
              status: 'Active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          } else {
            // If exists, make sure googlePhotoURL is recorded in Firestore
            if (googlePhoto && !snap.data()?.googlePhotoURL) {
              await setDoc(userDocRef, {
                googlePhotoURL: googlePhoto,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          }
        } catch (fsErr) {
          console.warn('Firestore sync during Google sign-in note:', fsErr);
        }
      }
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const isPopupClosed = err.code === 'auth/popup-closed-by-user' || 
                            err.message?.includes('popup-closed-by-user') ||
                            err.toString()?.includes('popup-closed-by-user');
      if (!isPopupClosed) {
        setAuthError(err.message || 'Google authentication failed.');
      } else {
        setAuthError('Sign-in cancelled. The Google login window was closed.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setMode('login');
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('Payments are temporarily locked for system maintenance. We will get back soon!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-800/80 transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-950 via-zinc-900 to-indigo-950 p-6 border-b border-zinc-800 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-rose-400" /> Secure Auth
            </span>
            {isVipActive && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Crown className="w-3 h-3" /> VIP Active
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-white">
            {mode === 'login' ? 'Sign In to GTA VI Central' : mode === 'register' ? 'Create Vice City Account' : `VIP Membership Pass (${getVipPriceText('/mo')})`}
          </h3>
          <p className="text-xs text-zinc-400">
            {mode === 'login' || mode === 'register' ? 'Authenticated via encrypted cloud member portal.' : '100% Ad-Free Browsing, Gold VIP Badge & Priority Perks.'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 hover:scrollbar-thumb-rose-500 scrollbar-track-zinc-950">

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <div className="space-y-4">
              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="player@vicecity.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-zinc-400">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-zinc-600 focus:border-rose-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isAuthLoading ? 'Signing In...' : 'Sign In with Email'}</span>
                </button>
              </form>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-zinc-500"><span className="bg-zinc-900 px-2.5">Or Continue With</span></div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isAuthLoading}
                  className="w-full py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800/80 active:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold text-zinc-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs text-zinc-400 hover:text-white transition"
                >
                  Need an account? <span className="text-rose-400 font-bold underline">Create one now</span>
                </button>
              </div>
            </div>
          )}

          {/* REGISTER FORM WITH 2-STEP EMAIL VERIFICATION */}
          {mode === 'register' && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-950/80 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-rose-300 font-extrabold text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>2-Step Server Email Verification Active</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Step {regStep === 'input' ? '1 of 2' : '2 of 2'}
                </span>
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
              )}

              {codeSentNotice && regStep === 'code' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{codeSentNotice}</span>
                </div>
              )}

              {/* STEP 1: Enter User Info & Request Code */}
              {regStep === 'input' && (
                <form onSubmit={handleRequestVerificationCode} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Gamer Tag / Username</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="ViceCityPlayer_2026"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-zinc-400">Primary Email Address</label>
                      <span className="text-[10px] text-zinc-500">No temp/disposable emails</span>
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="player@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-zinc-400">Password</label>
                      <span className="text-[10px] text-zinc-500">Min. 6 characters</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white focus:border-rose-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition"
                        tabIndex={-1}
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingCode}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingCode ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin text-rose-200" />
                        <span>Validating Email & Generating Code...</span>
                      </span>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Send 6-Digit Verification Code</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Dedicated Email Verification Component */}
              {regStep === 'code' && (
                <EmailVerificationStep
                  email={email}
                  username={username}
                  devCodePreview={devCodePreview}
                  codeSentNotice={codeSentNotice}
                  onVerifySuccess={handleVerifyCodeAndRegister}
                  onResendCode={handleRequestVerificationCode}
                  onEditEmail={() => {
                    setRegStep('input');
                    setVerificationCodeInput('');
                    setAuthError(null);
                  }}
                  isVerifying={isVerifyingCode}
                  isResending={isSendingCode}
                  error={authError}
                  setError={setAuthError}
                />
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRegStep('input');
                    setAuthError(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-white transition"
                >
                  Already have an account? <span className="text-rose-400 font-bold underline">Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* CHECKOUT FORM */}
          {mode === 'checkout' && (
            <form onSubmit={handlePay} className="space-y-4">
              <PaymentMaintenanceNotice
                title="Payments Temporarily Locked"
                subtitle="VIP membership pass purchases are temporarily paused for system maintenance. We will get back soon!"
                compact={false}
              />

              {/* ITEM SUMMARY BANNER */}
              <div className="p-3.5 bg-zinc-950 border border-amber-500/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">VIP Membership Pass</span>
                  </div>
                  <div className="text-right">
                    {appliedCoupon ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono line-through text-zinc-500">{getVipPriceText('/mo')}</span>
                        <span className="text-xs font-mono font-extrabold text-emerald-400">{getFinalVipPriceFormatted()}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-mono font-extrabold text-amber-400">{getVipPriceText('/mo')}</span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  B2C Consumer Pass • 100% Ad-Free Browsing, Gold VIP Badge & Priority Voice Comms. Billed monthly, cancel anytime.
                </p>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`py-2 text-[11px] font-extrabold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedPaymentMethod === 'card'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Credit Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('paypal')}
                  className={`py-2 text-[11px] font-extrabold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedPaymentMethod === 'paypal'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>PayPal</span>
                </button>
              </div>

              {/* CREDIT CARD FIELDS */}
              {selectedPaymentMethod === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Card Number</label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">Expiration (MM/YY)</label>
                      <input
                        type="text"
                        required
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => handleCardExpiryChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white font-mono focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">CVC Code</label>
                      <input
                        type="text"
                        required
                        placeholder="888"
                        value={cardCvc}
                        onChange={(e) => handleCardCvcChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white font-mono focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PAYPAL FIELDS */}
              {selectedPaymentMethod === 'paypal' && (
                <div className="p-3.5 bg-zinc-950 border border-indigo-500/30 rounded-xl space-y-2">
                  <label className="text-[11px] font-bold text-indigo-300 block">PayPal Billing Email</label>
                  <input
                    type="email"
                    required
                    placeholder={currentUser?.email || "gamer@paypal.com"}
                    value={paypalEmailInput}
                    onChange={(e) => setPaypalEmailInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-zinc-400">1-Click Express Auto-Debit redirect enabled for instant VIP pass activation.</p>
                </div>
              )}

              {/* PROMO COUPON SPACE */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <label className="text-[11px] font-bold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-rose-400" />
                    <span>Have a Promo Coupon?</span>
                  </span>
                </label>

                {appliedCoupon ? (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-extrabold text-emerald-300 font-mono">CODE: {appliedCoupon.code}</div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          {appliedCoupon.discountPercent}% OFF • Saved -${appliedCoupon.discountSaved.toFixed(2)} USD
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline px-2 py-1 bg-rose-950/50 rounded cursor-pointer transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="ENTER PROMO COUPON CODE"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value);
                        if (couponError) setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono uppercase tracking-wider outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      disabled={isValidatingCoupon || !couponCodeInput.trim()}
                      onClick={handleApplyCoupon}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-rose-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-lg transition cursor-pointer"
                    >
                      {isValidatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}

                {couponError && (
                  <div className="text-[10px] text-rose-400 flex items-center gap-1 font-medium pt-0.5">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    <span>{couponError}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={true}
                  className="w-full py-3 bg-zinc-800 text-zinc-400 font-extrabold text-xs rounded-xl border border-zinc-700 transition flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Payments Temporarily Locked (Will Get Back Soon)</span>
                </button>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit Encrypted
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" /> Instant Auto-Activation
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

