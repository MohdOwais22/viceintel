import { Request, Response } from 'express';
import { runDeepResourceAudit, ManifestFileInput } from '../../lib/studio-performance-engine';

export async function handleResourceAuditRoute(req: Request, res: Response) {
  try {
    const { files = [] }: { files: ManifestFileInput[] } = req.body || {};

    const targetFiles: ManifestFileInput[] = files.length > 0 ? files : [
      {
        filename: 'fxmanifest.lua',
        content: `fx_version 'cerulean'\ngame 'gta5'\nauthor 'Vice City Developer'\nclient_scripts {\n    'client/*.lua'\n}`
      },
      {
        filename: 'client/main.lua',
        content: `CreateThread(function()\n    while true do\n        Wait(0) -- Tick loop\n        local ped = PlayerPedId()\n    end\nend)`
      },
      {
        filename: 'stream/custom_hypercar.ytd',
        content: '-- custom_hypercar.ytd 19MB sample stream texture'
      }
    ];

    const auditResult = runDeepResourceAudit(targetFiles);

    return res.json({
      success: true,
      audit: auditResult,
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('Error in /api/tools/resource-audit:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to execute FiveM resource audit.'
    });
  }
}
