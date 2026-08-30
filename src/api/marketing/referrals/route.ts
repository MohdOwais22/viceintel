import { Request, Response } from 'express';
import { buildReferralLink, trackReferralConversionInFirestore } from '../../../lib/agency-marketing-engine';

export async function handleReferralsRoute(req: Request, res: Response) {
  try {
    if (req.method === 'POST') {
      const { serverSlug = 'vice-city-rp', vanityCode = 'VIP2026', discordId = 'user_123', conversionType = 'click' } = req.body || {};

      const success = await trackReferralConversionInFirestore({
        serverSlug,
        vanityCode,
        discordId,
        conversionType
      });

      const refUrl = buildReferralLink(serverSlug, discordId, vanityCode);

      return res.json({
        success,
        referralUrl: refUrl,
        serverSlug,
        vanityCode,
        discordId,
        conversionType
      });
    }

    const serverSlug = (req.query.serverSlug as string) || 'vice-city-rp';
    const userId = (req.query.userId as string) || 'user_123';
    const alias = req.query.alias as string;

    const link = buildReferralLink(serverSlug, userId, alias);

    return res.json({
      success: true,
      serverSlug,
      referralLink: link
    });
  } catch (err: any) {
    console.error('Error in /api/marketing/referrals:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to process referral request.' });
  }
}
