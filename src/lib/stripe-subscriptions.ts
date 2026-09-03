/**
 * 3-Tier SaaS Subscription & Automated Directory Deployment Engine
 * Starter ($29/mo), Pro ($49/mo), Mega-Server ($199/mo)
 * Manages Stripe Checkout sessions, customer billing portal, tier metadata, and directory rankings.
 */

import Stripe from 'stripe';

export type SubscriptionTier = 'starter' | 'pro' | 'mega';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  priceMonthly: number; // in USD
  priceFormatted: string;
  monthlyAppLimit: number | 'Unlimited';
  tierWeight: number; // For directory ranking sort: mega=300, pro=200, starter=100
  badge: string;
  badgeColor: string;
  description: string;
  highlight?: boolean;
  features: string[];
  stripePriceEnvVar: string;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter Tier',
    priceMonthly: 29,
    priceFormatted: '$29',
    monthlyAppLimit: 100,
    tierWeight: 100,
    badge: 'Standard Directory',
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Essential whitelist form builder with up to 100 applicants per month, standard subdomain, and standard directory listing.',
    features: [
      'Basic dynamic whitelist forms',
      'Standard subdomain (slug.viceintel.app)',
      'Up to 100 player applications / mo',
      'Standard directory listing placement',
      'Discord webhook submission alerts',
      'Staff review queue & applicant status ledger',
      'Custom server banner & connect commands'
    ],
    stripePriceEnvVar: 'STRIPE_PRICE_STARTER'
  },
  pro: {
    id: 'pro',
    name: 'Pro Tier',
    priceMonthly: 49,
    priceFormatted: '$49',
    monthlyAppLimit: 500,
    tierWeight: 200,
    badge: 'Verified Partner',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'Includes 1-Click Custom Domain + Auto TLS, Sentinel AI Growth Studio, automated AI Lore Grader, Discord role sync, and priority Page 1–2 directory ranking.',
    highlight: true,
    features: [
      '1-Click Custom Domain + Auto TLS (apply.yourcity.com)',
      'Sentinel AI Growth Studio (pSEO matrix & viral scripts)',
      'Gemini 3.7 AI automated lore & FearRP grader',
      'Automated Discord role sync on approval',
      'Priority Page 1–2 directory ranking (Weight 200)',
      'Official "Verified Partner" profile badge',
      'Up to 500 player applications / mo',
      'Applicant backstory AI synthesis & cheat detection',
      'Priority email & webhook notification dispatch'
    ],
    stripePriceEnvVar: 'STRIPE_PRICE_PRO'
  },
  mega: {
    id: 'mega',
    name: 'Mega-Server Tier',
    priceMonthly: 199,
    priceFormatted: '$199',
    monthlyAppLimit: 'Unlimited',
    tierWeight: 300,
    badge: 'Pinned Top 5 Spotlight',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Multi-Domain Custom SSL Gateway, Full Sentinel Marketing Studio Suite with streamer outreach, unlimited player volume, Lua exports, glowing directory cards, and Pinned Top 5 Spotlight.',
    features: [
      'Up to 5 Linked Server Communities',
      'Multi-Domain Custom SSL Gateway & Vanity Clusters',
      'Full Sentinel Marketing Studio (pSEO + Streamer Outreach)',
      'Unlimited player applications & reviews',
      'Pinned Top 5 Spotlight on Page 1 (Weight 300)',
      'Glowing neon VIP directory cards & featured map banner',
      'Full Lua / config generator export bundles (QB-Core / ESX / Qbox)',
      'Multi-server network clustering & staff roles',
      'Deep lore scenario generator & instant AI auto-decisions',
      'Dedicated 24/7 VIP Discord priority support'
    ],
    stripePriceEnvVar: 'STRIPE_PRICE_MEGA'
  }
};

/**
 * Normalizes tier strings (supporting legacy names like 'community', 'mega_server', 'enterprise')
 */
export function normalizeTier(rawTier?: string): SubscriptionTier {
  if (!rawTier) return 'starter';
  const lower = rawTier.toLowerCase().trim();
  if (lower === 'mega' || lower === 'mega_server' || lower === 'enterprise' || lower === 'top_spotlight') {
    return lower === 'enterprise' || lower === 'mega' ? 'mega' : 'pro';
  }
  if (lower === 'pro' || lower === 'b2b_spotlight_whitelist' || lower === 'verified_partner') {
    return 'pro';
  }
  return 'starter';
}

/**
 * Retrieves the tier ranking weight for directory sorting
 */
export function getTierWeight(tier?: string): number {
  const normalized = normalizeTier(tier);
  return SUBSCRIPTION_TIERS[normalized]?.tierWeight || 100;
}

let stripeInstance: Stripe | null = null;

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return false;
  if (
    key.includes('abcdefghijklmnopqrstuvwxyz') ||
    key.includes('1234567890') ||
    key.endsWith('wxyz') ||
    key === 'sk_test_12345' ||
    key.length < 20
  ) {
    return false;
  }
  return true;
}

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !isStripeConfigured()) {
      throw new Error('STRIPE_SECRET_KEY environment variable is missing or invalid.');
    }
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export interface CreateSubscriptionCheckoutParams {
  serverId: string;
  serverName: string;
  serverSlug: string;
  ownerDiscordId: string;
  ownerDiscordUsername?: string;
  ownerEmail?: string;
  tier: SubscriptionTier | string;
  returnUrl?: string;
  appBaseUrl: string;
}

export interface CreateSubscriptionCheckoutResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  isDemoMode?: boolean;
  message?: string;
  tier: SubscriptionTier;
  priceMonthly: number;
}

/**
 * Creates a Stripe Checkout Session attaching complete tier metadata and server IDs
 */
export async function createSubscriptionCheckoutSession(
  params: CreateSubscriptionCheckoutParams
): Promise<CreateSubscriptionCheckoutResult> {
  const {
    serverId,
    serverName,
    serverSlug,
    ownerDiscordId,
    ownerDiscordUsername = 'VerifiedServerOwner',
    ownerEmail,
    tier: rawTier,
    returnUrl,
    appBaseUrl
  } = params;

  const tier = normalizeTier(rawTier);
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const unitAmountCents = Math.round(tierConfig.priceMonthly * 100);

  const cleanAppBaseUrl = (appBaseUrl || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  // Fallback demo/simulation mode when Stripe API key is not live
  if (!isStripeConfigured()) {
    const mockSessionId = `demo_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const destinationUrl =
      returnUrl ||
      `${cleanAppBaseUrl}/servers/${encodeURIComponent(serverSlug)}/billing?paymentSuccess=true&session_id=${mockSessionId}&tier=${tier}&serverId=${encodeURIComponent(serverId)}`;

    return {
      success: true,
      sessionId: mockSessionId,
      isDemoMode: true,
      url: destinationUrl,
      tier,
      priceMonthly: tierConfig.priceMonthly,
      message: 'Direct SSL simulated checkout mode active.'
    };
  }

  try {
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: ownerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `GTA VI Vice City — ${tierConfig.name} ($${tierConfig.priceMonthly}/mo)`,
              description: `${tierConfig.description} (Server: ${serverName})`,
              images: [
                tier === 'mega'
                  ? 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80'
                  : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80'
              ]
            },
            unit_amount: unitAmountCents,
            recurring: { interval: 'month' }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      metadata: {
        type: 'b2b_server_subscription',
        serverId,
        serverName,
        serverSlug,
        ownerDiscordId,
        ownerDiscordUsername,
        tier,
        tierWeight: String(tierConfig.tierWeight),
        monthlyAppLimit: String(tierConfig.monthlyAppLimit)
      },
      subscription_data: {
        trial_period_days: (tier === 'pro' || tier === 'mega') ? 14 : undefined,
        metadata: {
          serverId,
          serverName,
          serverSlug,
          ownerDiscordId,
          ownerDiscordUsername,
          tier,
          hasTrial: 'true',
          trialDays: '14',
          tierWeight: String(tierConfig.tierWeight),
          monthlyAppLimit: String(tierConfig.monthlyAppLimit)
        }
      },
      success_url: `${cleanAppBaseUrl}/servers/${encodeURIComponent(serverSlug)}/billing?paymentSuccess=true&session_id={CHECKOUT_SESSION_ID}&tier=${tier}&serverId=${encodeURIComponent(serverId)}`,
      cancel_url: `${cleanAppBaseUrl}/servers/${encodeURIComponent(serverSlug)}/billing?paymentCanceled=true&tier=${tier}&serverId=${encodeURIComponent(serverId)}`
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url || undefined,
      tier,
      priceMonthly: tierConfig.priceMonthly
    };
  } catch (err: any) {
    console.error('[Stripe Subscriptions] Checkout Session Creation Exception:', err);
    return {
      success: false,
      isDemoMode: true,
      tier,
      priceMonthly: tierConfig.priceMonthly,
      url: returnUrl || `${cleanAppBaseUrl}/servers/${encodeURIComponent(serverSlug)}/billing?paymentSuccess=true&session_id=fallback_sess_${Date.now()}&tier=${tier}`,
      message: err?.message || 'Failed to initialize Stripe checkout'
    };
  }
}

/**
 * Creates a Stripe Customer Billing Portal Session
 */
export async function createCustomerBillingPortal(params: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const { stripeCustomerId, returnUrl } = params;

  if (!isStripeConfigured()) {
    return {
      success: true,
      url: returnUrl
    };
  }

  try {
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl
    });

    return {
      success: true,
      url: portalSession.url
    };
  } catch (err: any) {
    console.error('[Stripe Subscriptions] Customer Portal Exception:', err);
    return {
      success: false,
      error: err?.message || 'Failed to create customer billing portal session'
    };
  }
}
