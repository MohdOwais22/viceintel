import { Request, Response } from 'express';
import { runEconomySimulation, EconomySimInput } from '../../lib/server-suite-engine';

export async function handleEconomySimRoute(req: Request, res: Response) {
  try {
    const input: EconomySimInput = req.body || {
      avgHourlyLegalIncome: 12500,
      avgHourlyIllegalIncome: 24000,
      dailyTaxRate: 5.5,
      avgVehicleRepairCost: 750,
      dailyPropertyTax: 1200,
      activePlayerCount: 64,
      initialTotalCash: 2500000
    };

    const projection = runEconomySimulation(input);

    return res.json({
      success: true,
      input,
      projection,
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('Error in /api/tools/economy-sim:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to simulate economy.' });
  }
}
