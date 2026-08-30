'use client';
import React, { useState } from 'react';
import { VEHICLES_DATA } from '../data/vehicles';
import { ModUpgradeOption, Vehicle, CommunityBuild } from '../types';
import { Wrench, DollarSign, Zap, Gauge, Shield, Plus, Check, RotateCcw, Share2, Printer, Sparkles, ThumbsUp, Search, Flame, ArrowUpDown, ChevronLeft, ChevronRight, Copy, Download, FileCode } from 'lucide-react';
import { PrintReportModal, PrintReportData } from './PrintReportModal';

interface ModBuilderCalculatorProps {
  onSwitchTab?: (tab: string) => void;
}

export const ModBuilderCalculator: React.FC<ModBuilderCalculatorProps> = ({ onSwitchTab }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(VEHICLES_DATA[0]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printReportData, setPrintReportData] = useState<PrintReportData | null>(null);
  const [cloneToast, setCloneToast] = useState<string | null>(null);

  const AVAILABLE_UPGRADES: ModUpgradeOption[] = [
    { id: 'u1', name: 'Race Engine Tuning (EMS Stage 4)', category: 'Engine', cost: 38500, topSpeedDelta: 6.5, accelDelta: 12, handlingDelta: 0, imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80' },
    { id: 'u2', name: 'Race Transmission (6-Speed Close Ratio)', category: 'Transmission', cost: 29500, topSpeedDelta: 2.0, accelDelta: 8, handlingDelta: 2, imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80' },
    { id: 'u3', name: 'Race Brakes (Ceramic Carbon Discs)', category: 'Brakes', cost: 35000, topSpeedDelta: 0, accelDelta: 0, handlingDelta: 10, imageUrl: 'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?auto=format&fit=crop&w=600&q=80' },
    { id: 'u4', name: 'Turbo Tuning (Twin Ball Bearing)', category: 'Turbo', cost: 48000, topSpeedDelta: 9.0, accelDelta: 18, handlingDelta: -2, imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80' },
    { id: 'u5', name: '100% Armor Plating', category: 'Armor', cost: 50000, topSpeedDelta: -1.5, accelDelta: -2, handlingDelta: 0, imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80' },
    { id: 'u6', name: 'Competition Lowered Suspension', category: 'Suspension', cost: 18500, topSpeedDelta: 1.0, accelDelta: 2, handlingDelta: 8, imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80' },
    { id: 'u7', name: 'Carbon Fiber Aero Kit & Wing', category: 'Cosmetics', cost: 42000, topSpeedDelta: 3.0, accelDelta: 1, handlingDelta: 7, imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=600&q=80' },
  ];

  const [appliedModIds, setAppliedModIds] = useState<string[]>(['u1', 'u4', 'u3']);
  const [buildTitle, setBuildTitle] = useState<string>('Vice City Drag Build');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Gallery Filters & Pagination State
  const [filterTab, setFilterTab] = useState<'all' | 'trending' | 'top-liked'>('all');
  const [gallerySearch, setGallerySearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'upvotes' | 'newest' | 'cost'>('upvotes');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Initial Community Builds Showcase
  const [communityBuilds, setCommunityBuilds] = useState<CommunityBuild[]>([
    {
      id: 'cb-1',
      author: 'LuciaOutlaw',
      title: 'Ocean Drive Expressway Monster',
      vehicleId: 'v1',
      vehicleName: 'Pegassi Ignus Custom',
      totalCost: 2886500,
      upvotes: 412,
      appliedModIds: ['u1', 'u2', 'u4', 'u7'],
      tags: ['Drag', 'Super', 'Max Top Speed'],
      createdAt: '2026-07-28',
      isTrending: true,
      description: 'Stage 4 EMS + Twin Turbo setup optimized for Vice City highway police escapes.'
    },
    {
      id: 'cb-2',
      author: 'ViceSquadRacer',
      title: 'Little Haiti Cornering King',
      vehicleId: 'v4',
      vehicleName: 'Bravado Buffalo EV Interceptor',
      totalCost: 1973500,
      upvotes: 388,
      appliedModIds: ['u3', 'u6', 'u5'],
      tags: ['Drift', 'Handling', 'Armor'],
      createdAt: '2026-07-29',
      isTrending: true,
      description: 'Ceramic Brakes and Competition Suspension for high-speed city alley cornering.'
    },
    {
      id: 'cb-3',
      author: 'JasonRunner',
      title: 'Port Gellhorn Heist Escaper',
      vehicleId: 'v3',
      vehicleName: 'Albany V-STR Spec VI',
      totalCost: 1603000,
      upvotes: 295,
      appliedModIds: ['u1', 'u5', 'u2'],
      tags: ['Armor', 'Muscle', 'Getaway'],
      createdAt: '2026-07-30',
      isTrending: true,
      description: 'Fully armored chassis with high torque transmission for clearing police roadblocks.'
    },
    {
      id: 'cb-4',
      author: 'GellhornDrifter',
      title: 'Turismo Italian Track Beast',
      vehicleId: 'v2',
      vehicleName: 'Grotti Turismo Omaggio',
      totalCost: 2980000,
      upvotes: 245,
      appliedModIds: ['u1', 'u3', 'u6', 'u7'],
      tags: ['Track', 'Super', 'Aero'],
      createdAt: '2026-07-25',
      isTrending: false,
      description: 'Balanced track build featuring carbon wings and lowered suspension for maximum grip.'
    },
    {
      id: 'cb-5',
      author: 'SouthBeachCruiser',
      title: 'Vice Beach Sunset Convertible',
      vehicleId: 'v5',
      vehicleName: 'Pfister Comet S2 Cabrio',
      totalCost: 1895500,
      upvotes: 210,
      appliedModIds: ['u1', 'u6', 'u7'],
      tags: ['Cruiser', 'Sports', 'Styling'],
      createdAt: '2026-07-26',
      isTrending: false,
      description: 'Clean aesthetic drop-top with Stage 4 engine mapping for fast coastal sprints.'
    },
    {
      id: 'cb-6',
      author: 'GladesCrawler',
      title: 'Everglades Mud Off-Road Crusher',
      vehicleId: 'v6',
      vehicleName: 'Karin Boor Everglades Edition',
      totalCost: 1398500,
      upvotes: 182,
      appliedModIds: ['u4', 'u5', 'u6'],
      tags: ['Off-Road', 'Armor', 'Mud'],
      createdAt: '2026-07-24',
      isTrending: false,
      description: 'Reinforced 4x4 with twin turbos built to haul stolen airboat cargo through swamps.'
    },
    {
      id: 'cb-7',
      author: 'SpeedDemon77',
      title: 'Freeway Lightning Hakuchou',
      vehicleId: 'v7',
      vehicleName: 'Shitzu Hakuchou Drag V2',
      totalCost: 1236000,
      upvotes: 350,
      appliedModIds: ['u1', 'u2', 'u4'],
      tags: ['Motorcycle', 'Drag', 'Top Speed'],
      createdAt: '2026-07-27',
      isTrending: true,
      description: 'Pure straight-line drag racing setup breaking 160 MPH on Vice City freeways.'
    },
    {
      id: 'cb-8',
      author: 'UndergroundKing',
      title: 'Stealth Blackout Ignus',
      vehicleId: 'v1',
      vehicleName: 'Pegassi Ignus Custom',
      totalCost: 2883000,
      upvotes: 165,
      appliedModIds: ['u3', 'u5', 'u6'],
      tags: ['Stealth', 'Super', 'Armor'],
      createdAt: '2026-07-22',
      isTrending: false,
      description: 'Heavy armor plating and ceramic brakes designed for high-heat cartel clashes.'
    },
    {
      id: 'cb-9',
      author: 'VicePoliceRival',
      title: 'Highway Pursuit Pursuit Breaker',
      vehicleId: 'v4',
      vehicleName: 'Bravado Buffalo EV Interceptor',
      totalCost: 2013500,
      upvotes: 310,
      appliedModIds: ['u1', 'u2', 'u3', 'u4', 'u6'],
      tags: ['Pursuit', 'EV', 'Interceptor'],
      createdAt: '2026-07-29',
      isTrending: true,
      description: 'All performance upgrades unlocked for max electric acceleration and pit maneuvers.'
    }
  ]);

  const toggleMod = (id: string) => {
    setAppliedModIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const resetBuild = () => {
    setAppliedModIds([]);
  };

  const selectedMods = AVAILABLE_UPGRADES.filter((mod) => appliedModIds.includes(mod.id));

  // Compute calculated metrics
  const totalModCost = selectedMods.reduce((sum, m) => sum + m.cost, 0);
  const totalBuildPrice = selectedVehicle.price + totalModCost;

  const handlePublishToCommunity = () => {
    const newBuild: CommunityBuild = {
      id: `cb-${Date.now()}`,
      author: 'ViceCityPlayer',
      title: buildTitle || `${selectedVehicle.name} Custom Build`,
      vehicleId: selectedVehicle.id,
      vehicleName: `${selectedVehicle.brand} ${selectedVehicle.name}`,
      totalCost: totalBuildPrice,
      upvotes: 1,
      appliedModIds: [...appliedModIds],
      tags: selectedMods.map((m) => m.category),
      createdAt: new Date().toISOString().split('T')[0],
      isTrending: true,
      description: `Custom build featuring ${selectedMods.length} performance upgrades (${selectedMods.map((m) => m.name).join(', ') || 'Stock'}).`
    };

    setCommunityBuilds([newBuild, ...communityBuilds]);
    setCloneToast(`Build "${newBuild.title}" published to Community Tuning Gallery!`);
    setTimeout(() => setCloneToast(null), 3500);
  };

  const handleUpvoteBuild = (id: string) => {
    setCommunityBuilds((prev) =>
      prev.map((b) => (b.id === id ? { ...b, upvotes: b.upvotes + 1 } : b))
    );
  };

  const handleCloneBuild = (build: CommunityBuild) => {
    // 1. Find target vehicle accurately
    let matchedVehicle = VEHICLES_DATA.find((v) => v.id === build.vehicleId);
    if (!matchedVehicle) {
      matchedVehicle = VEHICLES_DATA.find((v) =>
        `${v.brand} ${v.name}`.toLowerCase().includes(build.vehicleName.toLowerCase()) ||
        build.vehicleName.toLowerCase().includes(v.name.toLowerCase()) ||
        build.vehicleName.toLowerCase().includes(v.brand.toLowerCase())
      );
    }

    if (matchedVehicle) {
      setSelectedVehicle(matchedVehicle);
    }

    // 2. Load build title & mods
    setBuildTitle(`Clone of ${build.title}`);
    if (build.appliedModIds && build.appliedModIds.length > 0) {
      setAppliedModIds(build.appliedModIds);
    } else {
      setAppliedModIds(['u1', 'u4', 'u3']);
    }

    // 3. Show confirmation feedback and scroll smoothly to calculator
    setCloneToast(`Cloned "${build.title}" into your calculator!`);
    setTimeout(() => setCloneToast(null), 3500);

    const calcEl = document.getElementById('mod-calculator-panel');
    if (calcEl) {
      calcEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShareBuild = () => {
    const params = new URLSearchParams();
    params.set('v', selectedVehicle.id);
    if (appliedModIds.length > 0) {
      params.set('mods', appliedModIds.join(','));
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2500);
        })
        .catch(() => {
          fallbackCopyText(shareUrl);
        });
    } else {
      fallbackCopyText(shareUrl);
    }
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      alert(`Build Link: ${text}`);
    }
    document.body.removeChild(textArea);
  };

  const handleDownloadHandlingXml = () => {
    const modelName = (selectedVehicle.name || 'vehicle').toLowerCase().replace(/[^a-z0-9]/g, '');
    const handlingId = `HANDLING_${modelName.toUpperCase()}_CUSTOM`;

    const mass = Math.round(1400 - (handlingDelta * 5));
    const initialDriveMaxFlatVel = (parseFloat(finalTopSpeed) * 0.44704).toFixed(2);
    const initialDriveForce = (0.28 + (finalAccel * 0.003)).toFixed(3);
    const tractionCurveMax = (2.2 + (finalHandling * 0.015)).toFixed(3);
    const brakeForce = (0.8 + (appliedModIds.includes('u3') ? 0.4 : 0.0)).toFixed(2);

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<CHandlingDataMgr>
  <HandlingData>
    <Item type="CHandlingData">
      <handlingName>${handlingId}</handlingName>
      <fMass value="${mass}.000000" />
      <fInitialDragCoeff value="8.000000" />
      <fPercentSubmerged value="85.000000" />
      <vecCentreOfMassOffset x="0.000000" y="0.000000" z="-0.050000" />
      <vecInertiaMultiplier x="1.000000" y="1.200000" z="1.600000" />
      <fDriveBiasFront value="0.000000" />
      <nInitialDriveGears value="6" />
      <fInitialDriveForce value="${initialDriveForce}" />
      <fDriveInertia value="1.000000" />
      <fClutchChangeRateScaleUpShift value="1.500000" />
      <fClutchChangeRateScaleDownShift value="1.500000" />
      <fInitialDriveMaxFlatVel value="${initialDriveMaxFlatVel}" />
      <fBrakeForce value="${brakeForce}" />
      <fBrakeBiasFront value="0.600000" />
      <fHandBrakeForce value="0.800000" />
      <fSteeringLock value="38.000000" />
      <fTractionCurveMax value="${tractionCurveMax}" />
      <fTractionCurveMin value="2.000000" />
      <fTractionCurveLateral value="22.500000" />
      <fTractionSpringDeltaMax value="0.150000" />
      <fLowSpeedTractionLossMult value="1.000000" />
      <fCamberStiffnesss value="0.000000" />
      <fTractionBiasFront value="0.480000" />
      <fTractionLossMult value="1.000000" />
      <fSuspensionForce value="2.400000" />
      <fSuspensionCompDamp value="1.400000" />
      <fSuspensionReboundDamp value="2.000000" />
      <fSuspensionUpperLimit value="0.100000" />
      <fSuspensionLowerLimit value="-0.100000" />
      <fSuspensionRaise value="0.000000" />
      <fSuspensionBiasFront value="0.500000" />
      <fAntiRollBarForce value="0.800000" />
      <fAntiRollBarBiasFront value="0.500000" />
      <fRollCentreHeightFront value="0.250000" />
      <fRollCentreHeightRear value="0.250000" />
      <fCollisionDamageMult value="0.700000" />
      <fWeaponDamageMult value="1.000000" />
      <fDeformationDamageMult value="0.700000" />
      <fEngineDamageMult value="1.500000" />
      <fPetrolTankVolume value="65.000000" />
      <fOilVolume value="5.000000" />
      <strModelFlags>440010</strModelFlags>
      <strHandlingFlags>1</strHandlingFlags>
      <strDamageFlags>0</strDamageFlags>
      <AIHandling>AVERAGE</AIHandling>
      <SubHandlingData>
        <Item type="CCarHandlingData" />
      </SubHandlingData>
    </Item>
  </HandlingData>
</CHandlingDataMgr>`;

    const blob = new Blob([xmlContent], { type: 'text/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${modelName}_handling.meta`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCloneToast(`Exported ${modelName}_handling.meta configuration file!`);
    setTimeout(() => setCloneToast(null), 3500);
  };

  // Filter & Sort Logic for Community Builds
  const filteredBuilds = communityBuilds
    .filter((build) => {
      // Tab Filter
      if (filterTab === 'trending' && !build.isTrending && build.upvotes < 250) return false;
      if (filterTab === 'top-liked' && build.upvotes < 200) return false;

      // Search Query
      if (gallerySearch.trim()) {
        const query = gallerySearch.toLowerCase();
        const matchesTitle = build.title.toLowerCase().includes(query);
        const matchesVehicle = build.vehicleName.toLowerCase().includes(query);
        const matchesDesc = build.description.toLowerCase().includes(query);
        const matchesAuthor = build.author.toLowerCase().includes(query);
        if (!matchesTitle && !matchesVehicle && !matchesDesc && !matchesAuthor) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'cost') return b.totalCost - a.totalCost;
      return 0;
    });

  // Page Numbers Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredBuilds.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedBuilds = filteredBuilds.slice(startIndex, startIndex + itemsPerPage);

  const topSpeedDelta = selectedMods.reduce((sum, m) => sum + m.topSpeedDelta, 0);
  const accelDelta = selectedMods.reduce((sum, m) => sum + m.accelDelta, 0);
  const handlingDelta = selectedMods.reduce((sum, m) => sum + m.handlingDelta, 0);

  const finalTopSpeed = (selectedVehicle.topSpeedMph + topSpeedDelta).toFixed(1);
  const finalAccel = Math.min(100, Math.max(0, selectedVehicle.acceleration + accelDelta));
  const finalHandling = Math.min(100, Math.max(0, selectedVehicle.handling + handlingDelta));

  const handleOpenPrintModal = () => {
    const reportData: PrintReportData = {
      title: 'GTA VI Vice City Central',
      subtitle: 'Custom Vehicle Mod & Performance Build Specification',
      reportId: `VCC-MOD-${selectedVehicle.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      generatedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      summaryItems: [
        { label: 'Build Name', value: buildTitle },
        { label: 'Vehicle', value: `${selectedVehicle.brand} ${selectedVehicle.name}` },
        { label: 'Base MSRP', value: `$${selectedVehicle.price.toLocaleString('en-US')}` },
        { label: 'Total Modding Outlay', value: `$${totalModCost.toLocaleString('en-US')}` },
        { label: 'Total Investment', value: `$${totalBuildPrice.toLocaleString('en-US')}` },
        { label: 'Top Speed', value: `${finalTopSpeed} mph (${topSpeedDelta >= 0 ? '+' : ''}${topSpeedDelta.toFixed(1)})` },
        { label: 'Acceleration Rating', value: `${finalAccel}/100` },
        { label: 'Handling Index', value: `${finalHandling}/100` },
      ],
      sections: [
        {
          heading: 'Base Vehicle Specifications',
          items: [
            { name: `${selectedVehicle.brand} ${selectedVehicle.name}`, detail: `Category: ${selectedVehicle.category}`, cost: `$${selectedVehicle.price.toLocaleString('en-US')}` },
            { name: 'Stock Top Speed', detail: `${selectedVehicle.topSpeedMph} mph` },
            { name: 'Stock Acceleration', detail: `${selectedVehicle.acceleration}/100` },
            { name: 'Stock Handling', detail: `${selectedVehicle.handling}/100` },
          ]
        },
        {
          heading: `Installed Performance Upgrade Mods (${selectedMods.length})`,
          items: selectedMods.length > 0
            ? selectedMods.map(m => ({
                name: m.name,
                detail: `Category: ${m.category}`,
                cost: `$${m.cost.toLocaleString('en-US')}`
              }))
            : [{ name: 'No Performance Mods Installed', detail: 'Stock configuration' }]
        }
      ],
      notes: 'Estimated pricing based on Vice City Customs & Vice City Underground Garages.'
    };

    setPrintReportData(reportData);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6" id="mod-calculator-panel">
      {/* Unified Financial & Mod Calculator Switcher */}
      {onSwitchTab && (
        <div className="flex items-center gap-2 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl w-fit">
          <button
            onClick={() => onSwitchTab('roi-calculator')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Business Profit ROI</span>
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Vehicle Mod & Upgrade Budget</span>
          </button>
        </div>
      )}

      {/* Toast Banner on Clone / Publish Action */}
      {cloneToast && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-950/30 animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{cloneToast}</span>
          </div>
          <button onClick={() => setCloneToast(null)} className="text-zinc-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}
      {/* Printer-Friendly PDF Report Header (Only visible when printing or exporting PDF) */}
      <div className="print-report-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">GTA VI Vice City Central</h1>
            <p className="text-sm font-bold text-rose-700">Custom Vehicle Mod & Performance Build Specification Report</p>
          </div>
          <div className="text-right text-xs text-gray-600 font-mono">
            <p suppressHydrationWarning>Generated: {new Date().toLocaleDateString('en-US')}</p>
            <p>Report ID: VCC-MOD-{selectedVehicle.id.toUpperCase()}</p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-300 grid grid-cols-3 gap-2 text-xs">
          <div><strong>Build Title:</strong> {buildTitle}</div>
          <div><strong>Base Vehicle:</strong> {selectedVehicle.brand} {selectedVehicle.name}</div>
          <div><strong>Total Investment:</strong> ${totalBuildPrice.toLocaleString('en-US')}</div>
        </div>
      </div>

      {/* Title & Vehicle Selector */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 printable-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Interactive Vehicle Mod & Cost Calculator</h2>
              <p className="text-xs text-zinc-400">Build custom performance setups, estimate total Los Santos / Vice Customs costs, and save builds.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto no-print">
            <button
              onClick={handleOpenPrintModal}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-medium rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Generate Printer-Friendly PDF Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF Report</span>
            </button>

            <button
              onClick={resetBuild}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Mods</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Select Base Vehicle</label>
            <select
              value={selectedVehicle.id}
              onChange={(e) => {
                const found = VEHICLES_DATA.find((v) => v.id === e.target.value);
                if (found) setSelectedVehicle(found);
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            >
              {VEHICLES_DATA.filter((v) => v.isCustomizable).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.name} (${v.price.toLocaleString('en-US')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Custom Build Name</label>
            <input
              type="text"
              value={buildTitle}
              onChange={(e) => setBuildTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Selected Vehicle Visual Hero Preview Card */}
        <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 overflow-hidden">
          <div className="relative w-full md:w-64 h-40 md:h-32 rounded-lg bg-zinc-900 border border-zinc-800/80 overflow-hidden shrink-0">
            <img
              src={selectedVehicle.imageUrl}
              alt={selectedVehicle.name}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md">
                {selectedVehicle.category}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-700/60 backdrop-blur-sm">
                {selectedVehicle.drivetrain}
              </span>
            </div>
          </div>

          <div className="w-full flex-1 flex flex-col justify-between space-y-2 min-w-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">{selectedVehicle.brand} • {selectedVehicle.dealer}</span>
              </div>
              <h3 className="text-xl font-black text-white truncate">{selectedVehicle.name}</h3>
              <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{selectedVehicle.description}</p>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Base Stock MSRP:</span>
              <span className="text-rose-400 font-bold">${selectedVehicle.price.toLocaleString('en-US')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mod Selector Options */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <span>Available Performance Upgrades ({AVAILABLE_UPGRADES.length})</span>
              <span className="text-xs text-rose-400 font-mono">({appliedModIds.length} Active)</span>
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setAppliedModIds(AVAILABLE_UPGRADES.map(m => m.id))}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg transition cursor-pointer"
                title="Apply all performance tuning upgrades"
              >
                ⚡ Max Upgrade
              </button>
              <button
                onClick={() => setAppliedModIds([])}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition cursor-pointer"
                title="Reset all mods back to stock baseline"
              >
                🔄 Downgrade to Stock
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {AVAILABLE_UPGRADES.map((mod) => {
              const isApplied = appliedModIds.includes(mod.id);
              return (
                <div
                  key={mod.id}
                  onClick={() => toggleMod(mod.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isApplied
                      ? 'bg-rose-950/20 border-rose-500/60 text-white shadow-md shadow-rose-950/20'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isApplied ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {isApplied ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>

                    {mod.imageUrl && (
                      <img
                        src={mod.imageUrl}
                        alt={mod.name}
                        className="w-14 h-14 aspect-square rounded-lg object-cover object-center shrink-0 border border-zinc-800/80 bg-zinc-950"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{mod.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          {mod.category}
                        </span>
                      </div>
                      <div className="flex gap-3 text-[11px] text-zinc-400 mt-1">
                        {mod.topSpeedDelta !== 0 && (
                          <span className={mod.topSpeedDelta > 0 ? 'text-amber-400' : 'text-rose-400'}>
                            {mod.topSpeedDelta > 0 ? '+' : ''}{mod.topSpeedDelta} MPH
                          </span>
                        )}
                        {mod.accelDelta !== 0 && (
                          <span className={mod.accelDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {mod.accelDelta > 0 ? '+' : ''}{mod.accelDelta} Accel
                          </span>
                        )}
                        {mod.handlingDelta !== 0 && (
                          <span className={mod.handlingDelta > 0 ? 'text-cyan-400' : 'text-rose-400'}>
                            {mod.handlingDelta > 0 ? '+' : ''}{mod.handlingDelta} Handling
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black font-mono text-emerald-400">
                      +${mod.cost.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calculated Total & Stats Output Panel */}
        <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase text-rose-400 tracking-wider">Custom Build Summary</span>
            <h3 className="text-2xl font-black text-white mt-0.5">{buildTitle}</h3>
            <p className="text-xs text-zinc-400">{selectedVehicle.brand} {selectedVehicle.name}</p>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2.5 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Base Vehicle Price:</span>
              <span className="font-mono text-zinc-200">${selectedVehicle.price.toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Total Modding Upgrades ({selectedMods.length}):</span>
              <span className="font-mono text-amber-400">+${totalModCost.toLocaleString('en-US')}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-bold">
              <span className="text-zinc-200">Total Investment Cost:</span>
              <span className="font-mono text-emerald-400">${totalBuildPrice.toLocaleString('en-US')}</span>
            </div>
          </div>

          {/* Stat Boost Preview */}
          <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
            <h4 className="text-xs font-bold uppercase text-zinc-300 tracking-wider">Modified Spec Performance</h4>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Top Speed</span>
                  <span className="font-bold text-amber-400">{finalTopSpeed} MPH ({topSpeedDelta >= 0 ? '+' : ''}{topSpeedDelta.toFixed(1)})</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (Number(finalTopSpeed) / 180) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Acceleration Score</span>
                  <span className="font-bold text-rose-400">{finalAccel} / 100 ({accelDelta >= 0 ? '+' : ''}{accelDelta})</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${finalAccel}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Handling Score</span>
                  <span className="font-bold text-cyan-400">{finalHandling} / 100 ({handlingDelta >= 0 ? '+' : ''}{handlingDelta})</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${finalHandling}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleShareBuild}
              className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleDownloadHandlingXml}
              className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
              title="Download game-ready handling.meta XML for FiveM and custom servers"
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>handling.meta XML</span>
            </button>

            <button
              onClick={handlePublishToCommunity}
              className="sm:col-span-2 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Publish Build to Gallery</span>
            </button>
          </div>
        </div>
      </div>

      {/* Community Tuning Gallery & Garage Showcase */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <span>Community Tuning Gallery & Garage Showcase</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Browse top rated Vice City custom builds created by community players. Clone any setup directly into your calculator.
            </p>
          </div>

          <span className="text-xs text-rose-400 font-mono bg-rose-950/40 px-3 py-1 rounded-full border border-rose-800/40 self-start md:self-auto">
            {filteredBuilds.length} Builds Found ({communityBuilds.length} Total)
          </span>
        </div>

        {/* Filters, Search & Sort Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => { setFilterTab('all'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>All Builds</span>
              <span className="text-[10px] opacity-75">({communityBuilds.length})</span>
            </button>

            <button
              onClick={() => { setFilterTab('trending'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filterTab === 'trending'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Trending Builds</span>
            </button>

            <button
              onClick={() => { setFilterTab('top-liked'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filterTab === 'top-liked'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5 text-rose-300" />
              <span>Top Liked</span>
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by title or vehicle..."
                value={gallerySearch}
                onChange={(e) => { setGallerySearch(e.target.value); setCurrentPage(1); }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
              {gallerySearch && (
                <button
                  onClick={() => { setGallerySearch(''); setCurrentPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="upvotes" className="bg-zinc-900 text-white">Most Upvoted</option>
                <option value="newest" className="bg-zinc-900 text-white">Newest First</option>
                <option value="cost" className="bg-zinc-900 text-white">Highest Cost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {paginatedBuilds.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 text-center space-y-2">
            <p className="text-sm font-bold text-zinc-300">No community builds match your active filters.</p>
            <p className="text-xs text-zinc-500">Try clearing your search term or switching filter tabs.</p>
            <button
              onClick={() => { setFilterTab('all'); setGallerySearch(''); setCurrentPage(1); }}
              className="mt-2 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-lg transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedBuilds.map((build) => {
              const matchedVeh = VEHICLES_DATA.find((v) => v.id === build.vehicleId) || VEHICLES_DATA.find((v) => `${v.brand} ${v.name}`.toLowerCase().includes(build.vehicleName.toLowerCase()));
              const cardImg = matchedVeh?.imageUrl || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80';

              return (
                <div
                  key={build.id}
                  className="bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 rounded-xl overflow-hidden flex flex-col justify-between transition group shadow-sm hover:shadow-rose-950/20"
                >
                  <div>
                    {/* Vehicle Card Image Banner */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900 shrink-0">
                      <img
                        src={cardImg}
                        alt={build.vehicleName}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase font-mono text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60 backdrop-blur-sm truncate max-w-[180px]">
                          {build.vehicleName}
                        </span>
                        <button
                          onClick={() => handleUpvoteBuild(build.id)}
                          className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-zinc-950/80 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 backdrop-blur-sm transition cursor-pointer shrink-0"
                          title="Upvote this build"
                        >
                          <ThumbsUp className="w-3 h-3 text-amber-400" />
                          <span>{build.upvotes}</span>
                        </button>
                      </div>

                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-300 font-medium">by <strong className="text-white">{build.author}</strong></span>
                        {build.isTrending && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-400" /> Trending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="text-base font-black text-white group-hover:text-rose-400 transition leading-snug">
                        {build.title}
                      </h4>

                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {build.description}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {Array.isArray(build.tags) && build.tags.map((tag) => (
                          <span key={tag} className="text-[10px] font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 block font-mono">Build Cost</span>
                        <span className="text-sm font-black font-mono text-emerald-400">
                          ${build.totalCost.toLocaleString('en-US')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCloneBuild(build)}
                        className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-600 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Clone Build</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Page Numbers Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-zinc-400 font-mono text-center sm:text-left">
              Showing page <strong className="text-white">{validCurrentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({filteredBuilds.length} builds total)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition cursor-pointer border ${
                    pageNum === validCurrentPage
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
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
