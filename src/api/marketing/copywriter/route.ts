import { Request, Response } from 'express';
import { generateMultiPlatformLaunchCopy } from '../../../lib/agency-marketing-engine';

export async function handleCopywriterRoute(req: Request, res: Response) {
  try {
    const { serverName = 'Vice City Roleplay', features, targetSubreddit = 'r/FiveMServers' } = req.body || {};

    const copyBundle = generateMultiPlatformLaunchCopy({
      serverName,
      features,
      targetSubreddit
    });

    return res.json({
      success: true,
      copyBundle,
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('Error in /api/marketing/copywriter:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate copywriting bundle.' });
  }
}
