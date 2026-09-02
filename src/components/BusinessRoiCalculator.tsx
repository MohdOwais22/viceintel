'use client';
import React, { useState, useEffect } from 'react';
import { BUSINESSES_DATA } from '../data/businesses';
import { Business } from '../types';
import { getCachedBusinesses } from '../lib/offlineStorage';
import { BUSINESSES_UPDATED_EVENT } from '../lib/businessStore';
import { getCacheBustedImageUrl } from '../lib/imageCacheBuster';
import { DollarSign, TrendingUp, Clock, ShieldCheck, Zap, AlertCircle, Printer, Wrench } from 'lucide-react';
import { PrintReportModal, PrintReportData } from './PrintReportModal';

interface BusinessRoiCalculatorProps {
  onSwitchTab?: (tab: string) => void;
}

export const BusinessRoiCalculator: React.FC<BusinessRoiCalculatorProps> = ({ onSwitchTab }) => {
  const [businessesList, setBusinessesList] = useState<Business[]>(BUSINESSES_DATA);
  const [selectedBusiness, setSelectedBusiness] = useState<Business>(BUSINESSES_DATA[0]);
  const [includeUpgrades, setIncludeUpgrades] = useState<boolean>(true);
  const [playHoursPerDay, setPlayHoursPerDay] = useState<number>(4);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printReportData, setPrintReportData] = useState<PrintReportData | null>(null);

  useEffect(() => {
    getCachedBusinesses().then((data) => {
      if (data && data.length > 0) {
        setBusinessesList(data);
        if (!data.some(b => b.id === selectedBusiness.id)) {
          setSelectedBusiness(data[0]);
        }
      }
    });

    const handleBusinessesUpdated = (e: CustomEvent<Business[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBusinessesList(e.detail);
      }
    };

    window.addEventListener(BUSINESSES_UPDATED_EVENT as any, handleBusinessesUpdated);
    return () => {
      window.removeEventListener(BUSINESSES_UPDATED_EVENT as any, handleBusinessesUpdated);
    };
  }, []);

  useEffect(() => {
    if (businessesList.length > 0) {
      setSelectedBusiness((prev) => businessesList.find((b) => b.id === prev.id) || prev);
    }
  }, [businessesList]);

  const totalCapEx = selectedBusiness.purchasePrice + selectedBusiness.setupCost + (includeUpgrades ? selectedBusiness.maxUpgradesCost : 0);
  
  // Daily income scaling based on playing hours
  const dailyIncome = Math.min(selectedBusiness.maxDailyIncome, (selectedBusiness.maxDailyIncome / 12) * playHoursPerDay);
  const hourlyIncome = dailyIncome / (playHoursPerDay || 1);
  const breakEvenHours = Math.ceil(totalCapEx / (hourlyIncome || 1));
  const breakEvenDays = Math.ceil(totalCapEx / (dailyIncome || 1));

  const handleOpenPrintModal = () => {
    const reportData: PrintReportData = {
      title: 'GTA VI Vice City Central',
      subtitle: 'Commercial Property Capital Investment & ROI Analysis',
      reportId: `VCC-ROI-${selectedBusiness.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      generatedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      summaryItems: [
        { label: 'Commercial Asset', value: selectedBusiness.name },
        { label: 'Property Type', value: selectedBusiness.type },
        { label: 'Risk Rating', value: `${selectedBusiness.riskRating} Risk` },
        { label: 'Total CapEx Outlay', value: `$${totalCapEx.toLocaleString('en-US')}` },
        { label: 'Estimated Daily Yield', value: `$${Math.round(dailyIncome).toLocaleString('en-US')}` },
        { label: 'Estimated Hourly Yield', value: `$${Math.round(hourlyIncome).toLocaleString('en-US')}` },
        { label: 'Break-Even Horizon', value: `${breakEvenHours} Hours (~${breakEvenDays} Days)` },
        { label: 'Active Play Session', value: `${playHoursPerDay} hrs/day` },
      ],
      sections: [
        {
          heading: 'Capital Expenditure (CapEx) Breakdown',
          items: [
            { name: 'Base Property Purchase Price', detail: selectedBusiness.location, cost: `$${selectedBusiness.purchasePrice.toLocaleString('en-US')}` },
            { name: 'Commercial License & Setup Fee', cost: `$${selectedBusiness.setupCost.toLocaleString('en-US')}` },
            { name: 'Security, Staff & Equipment Upgrades', detail: includeUpgrades ? 'Full Upgrades Enabled' : 'Disabled', cost: includeUpgrades ? `$${selectedBusiness.maxUpgradesCost.toLocaleString('en-US')}` : '$0' },
            { name: 'Total Initial Outlay', detail: 'Sum of purchase, setup & upgrades', cost: `$${totalCapEx.toLocaleString('en-US')}` }
          ]
        },
        {
          heading: 'Income & ROI Projections',
          items: [
            { name: 'Maximum Potential Daily Income', detail: '100% active operational capacity', cost: `$${selectedBusiness.maxDailyIncome.toLocaleString('en-US')}` },
            { name: 'Estimated Playing Yield', detail: `${playHoursPerDay} active hours/day`, cost: `$${Math.round(dailyIncome).toLocaleString('en-US')} / day` },
            { name: 'Break-Even Operational Hours', detail: 'Time required to recover total CapEx investment', cost: `${breakEvenHours} In-Game Hours` },
            { name: 'Break-Even Calendar Days', detail: 'Based on your play schedule', cost: `~${breakEvenDays} Days` }
          ]
        }
      ],
      notes: 'Leonida commercial tax rates & raid risks may fluctuate based on Vice City Police Department heat level.'
    };

    setPrintReportData(reportData);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Unified Financial & Mod Calculator Switcher */}
      {onSwitchTab && (
        <div className="flex items-center gap-2 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl w-fit">
          <button
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Business Profit ROI</span>
          </button>
          <button
            onClick={() => onSwitchTab('mod-calculator')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Vehicle Mod & Upgrade Budget</span>
          </button>
        </div>
      )}

      {/* Printer-Friendly PDF Report Header (Only visible when printing or exporting PDF) */}
      <div className="print-report-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">GTA VI Vice City Central</h1>
            <p className="text-sm font-bold text-emerald-700">Commercial Property Capital Investment & ROI Analysis Report</p>
          </div>
          <div className="text-right text-xs text-gray-600 font-mono">
            <p suppressHydrationWarning>Generated: {new Date().toLocaleDateString('en-US')}</p>
            <p>Report ID: VCC-ROI-{selectedBusiness.id.toUpperCase()}</p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-300 grid grid-cols-4 gap-2 text-xs">
          <div><strong>Property:</strong> {selectedBusiness.name}</div>
          <div><strong>Type:</strong> {selectedBusiness.type}</div>
          <div><strong>Total CapEx:</strong> ${totalCapEx.toLocaleString('en-US')}</div>
          <div><strong>Break-Even:</strong> ~{breakEvenHours} Hours ({breakEvenDays} Days)</div>
        </div>
      </div>

      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 printable-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">GTA VI Vice City Business ROI & Break-Even Calculator</h2>
              <p className="text-xs text-zinc-400">Evaluate property capital expenditure, hourly income yields, and break-even timelines.</p>
            </div>
          </div>

          <button
            onClick={handleOpenPrintModal}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-medium rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto no-print"
            title="Generate Printer-Friendly PDF Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Business Selector & Config */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">1. Select Commercial Property</h3>

            <div className="grid grid-cols-1 gap-2.5">
              {businessesList.map((biz) => {
                const isSelected = selectedBusiness.id === biz.id;
                return (
                  <div
                    key={biz.id}
                    onClick={() => setSelectedBusiness(biz)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/60 text-white shadow-md shadow-emerald-950/20'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <img
                      src={getCacheBustedImageUrl(biz.imageUrl, (biz as any).imageVersion || (biz as any).updatedAt)}
                      alt={biz.name}
                      className="w-14 h-14 aspect-square rounded-lg object-cover object-center shrink-0 border border-zinc-800/80 bg-zinc-950"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{biz.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 uppercase font-mono shrink-0">
                          {biz.type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">{biz.location}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400 block">
                        ${biz.purchasePrice.toLocaleString('en-US')}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ~${(biz.maxDailyIncome / 1000).toFixed(0)}k/day
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Config Sliders & Toggles */}
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">Include Staff & Security Upgrades</span>
                <input
                  type="checkbox"
                  checked={includeUpgrades}
                  onChange={(e) => setIncludeUpgrades(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
                  <span>Daily Gameplay Hours: <strong className="text-emerald-400">{playHoursPerDay} hrs/day</strong></span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={playHoursPerDay}
                  onChange={(e) => setPlayHoursPerDay(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial ROI Breakdown Panel */}
        <div className="lg:col-span-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5">
          {/* Business Hero Image Banner */}
          <div className="relative h-44 md:h-48 w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group shrink-0">
            <img
              src={getCacheBustedImageUrl(selectedBusiness.imageUrl, (selectedBusiness as any).imageVersion || (selectedBusiness as any).updatedAt)}
              alt={selectedBusiness.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/90 text-zinc-950 shadow-md">
                {selectedBusiness.type}
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-900/80 text-zinc-300 border border-zinc-700/60 backdrop-blur-sm">
                Difficulty: {selectedBusiness.difficulty}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                  <span>📍 {selectedBusiness.location}</span>
                </p>
                <h3 className="text-xl font-black text-white drop-shadow-md">{selectedBusiness.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400 block font-mono">Max Daily Yield</span>
                <span className="text-sm font-black text-emerald-400 font-mono">${selectedBusiness.maxDailyIncome.toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">{selectedBusiness.description}</p>

          {/* Investment CapEx */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Property Purchase Price:</span>
              <span className="font-mono text-zinc-200">${selectedBusiness.purchasePrice.toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Setup & License Fees:</span>
              <span className="font-mono text-zinc-200">${selectedBusiness.setupCost.toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Equipment & Staff Upgrades:</span>
              <span className="font-mono text-zinc-200">
                {includeUpgrades ? `$${selectedBusiness.maxUpgradesCost.toLocaleString('en-US')}` : '$0 (Disabled)'}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-bold">
              <span className="text-zinc-200">Total Capital Investment (CapEx):</span>
              <span className="font-mono text-emerald-400">${totalCapEx.toLocaleString('en-US')}</span>
            </div>
          </div>

          {/* Key ROI Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Est. Hourly Income</span>
              </div>
              <p className="text-2xl font-black text-emerald-400">${Math.round(hourlyIncome).toLocaleString('en-US')}</p>
              <span className="text-[10px] text-zinc-500">Based on {playHoursPerDay} hrs/day</span>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Break-Even Timeline</span>
              </div>
              <p className="text-2xl font-black text-amber-400">{breakEvenHours} <span className="text-xs font-normal text-zinc-400">Hours</span></p>
              <span className="text-[10px] text-zinc-500">~{breakEvenDays} Calendar Days</span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Pro Tip:</strong> Upgrading business equipment increases product manufacturing rate by 35% and prevents police raids across Leonida.
            </p>
          </div>
        </div>
      </div>

      {/* Printer-Friendly PDF Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        report={printReportData}
      />
    </div>
  );
};
