import type { Request, Response } from 'express';
import { runDeepResourceAudit, ManifestFileInput } from '../../../../src/lib/studio-performance-engine';

export async function POST(req: any) {
  try {
    let body = req.body;
    if (typeof req.json === 'function') {
      body = await req.json();
    }

    const files: ManifestFileInput[] = body?.files || [];
    if (!files || files.length === 0) {
      const defaultManifests: ManifestFileInput[] = [
        {
          filename: 'fxmanifest.lua',
          content: `fx_version 'cerulean'\ngame 'gta5'\ndescription 'Sample Core Resource'`
        },
        {
          filename: 'client/main.lua',
          content: `CreateThread(function()\n    while true do\n        Wait(0)\n        DrawMarker(1, 185.0, -920.0, 30.0, 0,0,0,0,0,0, 1.0,1.0,1.0, 255,0,0,200)\n    end\nend)`
        },
        {
          filename: 'stream/custom_vehicle.ytd',
          content: '-- custom_vehicle.ytd 18MB texture dictionary stream mock'
        }
      ];
      const audit = runDeepResourceAudit(defaultManifests);
      return new globalThis.Response(JSON.stringify({ success: true, audit }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const audit = runDeepResourceAudit(files);

    return new globalThis.Response(JSON.stringify({
      success: true,
      audit,
      timestamp: Date.now()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new globalThis.Response(JSON.stringify({
      success: false,
      error: error?.message || 'Resource audit processing failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Express Middleware Helper compatibility
export async function handleResourceAuditRoute(req: Request, res: Response) {
  try {
    const files: ManifestFileInput[] = req.body?.files || [];
    const audit = runDeepResourceAudit(files.length > 0 ? files : [
      {
        filename: 'fxmanifest.lua',
        content: `fx_version 'cerulean'\ngame 'gta5'`
      },
      {
        filename: 'client/main.lua',
        content: `CreateThread(function()\n    while true do\n        Wait(0)\n        DrawMarker(1, 185.0, -920.0, 30.0, 0,0,0,0,0,0, 1.0,1.0,1.0, 255,0,0,200)\n    end\nend)`
      }
    ]);
    return res.json({ success: true, audit });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
