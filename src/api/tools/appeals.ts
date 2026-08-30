import { Request, Response } from 'express';
import { evaluateBanAppealAI, BanAppeal } from '../../lib/server-suite-engine';

// In-memory store for instant demonstration & server state fallback
const inMemoryAppeals: BanAppeal[] = [];

export async function handleBanAppealsRoute(req: Request, res: Response) {
  try {
    const method = req.method;

    if (method === 'POST') {
      const { serverId = 'default-server', applicantDiscordId, banReason, defenseStatement, clipUrl } = req.body || {};

      if (!banReason || !defenseStatement) {
        return res.status(400).json({ success: false, error: 'Ban reason and defense statement are required.' });
      }

      // Evaluate appeal with Gemini AI
      const aiAudit = await evaluateBanAppealAI({
        serverId,
        applicantDiscordId: applicantDiscordId || 'AnonymousPlayer',
        banReason,
        defenseStatement,
        clipUrl
      });

      const newAppeal: BanAppeal = {
        id: `appeal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        serverId,
        applicantDiscordId: applicantDiscordId || 'AnonymousPlayer',
        banReason,
        clipUrl,
        defenseStatement,
        aiAudit,
        status: 'pending',
        createdAt: Date.now()
      };

      inMemoryAppeals.unshift(newAppeal);

      return res.json({
        success: true,
        appeal: newAppeal,
        message: 'Ban appeal submitted and evaluated by AI Administrator.'
      });
    }

    if (method === 'GET') {
      const { serverId } = req.query;
      const filtered = serverId ? inMemoryAppeals.filter((a) => a.serverId === String(serverId)) : inMemoryAppeals;
      return res.json({
        success: true,
        appeals: filtered,
        total: filtered.length
      });
    }

    if (method === 'PUT') {
      const { appealId, status, resolvedBy } = req.body || {};
      const target = inMemoryAppeals.find((a) => a.id === appealId);
      if (target) {
        target.status = status || 'resolved';
        target.resolvedBy = resolvedBy || 'Staff Admin';
        return res.json({ success: true, appeal: target });
      }
      return res.status(404).json({ success: false, error: 'Ban appeal not found.' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  } catch (err: any) {
    console.error('Error in /api/tools/appeals:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to process ban appeal.' });
  }
}
