'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HandlingData,
  DEFAULT_HANDLING_PRESETS,
  generateHandlingMetaXML,
  parseHandlingMetaXML
} from '../../lib/handling-calculator';
import { VEHICLES_DATA } from '../../data/vehicles';
import {
  Sliders,
  Download,
  Copy,
  Check,
  Upload,
  Sparkles,
  Zap,
  Car,
  Layers,
  Activity,
  RotateCcw,
  Code,
  FileCode,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface HandlingSliderPanelProps {
  handlingData: HandlingData;
  onChange: (newData: HandlingData) => void;
  vehicleModel: string;
  onVehicleModelChange: (model: string) => void;
  onOpenSaveModal: () => void;
  isLoggedIn: boolean;
  initialTab?: 'quick' | 'engine' | 'tires' | 'suspension';
}

export const HandlingSliderPanel: React.FC<HandlingSliderPanelProps> = ({
  handlingData,
  onChange,
  vehicleModel,
  onVehicleModelChange,
  onOpenSaveModal,
  isLoggedIn,
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'engine' | 'tires' | 'suspension'>(initialTab || 'quick');

  // Sync active tab if initialTab changes from parent
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importXmlText, setImportXmlText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Update a single numeric field
  const handleFieldChange = (key: keyof HandlingData, val: number) => {
    onChange({
      ...handlingData,
      [key]: val
    });
  };

  // Load a quick preset
  const handleLoadPreset = (presetKey: string) => {
    const preset = DEFAULT_HANDLING_PRESETS[presetKey];
    if (preset) {
      onChange(preset.data);
      onVehicleModelChange(preset.vehicleModel);
    }
  };

  // Generate XML
  const xmlOutput = generateHandlingMetaXML(vehicleModel, handlingData);

  // Copy to clipboard
  const handleCopyXML = async () => {
    try {
      await navigator.clipboard.writeText(xmlOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy XML to clipboard:', err);
    }
  };

  // Download .meta file
  const handleDownloadXML = () => {
    const blob = new Blob([xmlOutput], { type: 'text/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(vehicleModel || 'handling').toLowerCase()}_handling.meta`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import / parse handling.meta XML
  const handleProcessImport = () => {
    setImportError(null);
    setImportSuccessMessage(null);

    const result = parseHandlingMetaXML(importXmlText);
    if (!result.success || !result.data) {
      setImportError(result.error || 'Failed to parse valid handling.meta parameters.');
      return;
    }

    const merged: HandlingData = {
      ...handlingData,
      ...result.data
    };

    onChange(merged);
    if (result.vehicleName) {
      onVehicleModelChange(result.vehicleName.toLowerCase());
    }

    setImportSuccessMessage('Successfully parsed and applied handling parameters!');
    setTimeout(() => {
      setIsImportModalOpen(false);
      setImportSuccessMessage(null);
      setImportXmlText('');
    }, 1200);
  };

  // File upload drag/drop handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportXmlText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-5 text-white">
      {/* Vehicle Preset & Model Selector Banner */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Car className="w-4 h-4" /> Base Vehicle Chassis
            </div>
            <h3 className="text-base font-black text-white mt-0.5">
              Target Model & Handling Archetype
            </h3>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md justify-start md:justify-end">
            {/* Vehicle Model Selector Dropdown */}
            <select
              value={vehicleModel}
              onChange={(e) => onVehicleModelChange(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-rose-500 w-full sm:w-64 max-w-full cursor-pointer truncate"
            >
              <optgroup label="GTA VI Database Vehicles">
                {VEHICLES_DATA.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {v.name} ({v.brand})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Custom FiveM Models">
                <option value="custom_supercar">Custom Supercar Spawn</option>
                <option value="custom_drift_car">Custom Drift Chassis</option>
                <option value="custom_police_interceptor">Police Interceptor</option>
              </optgroup>
            </select>

            {/* Import XML Button */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              title="Import or paste handling.meta XML"
            >
              <Upload className="w-3.5 h-3.5 text-rose-400" />
              <span>Import XML</span>
            </button>
          </div>
        </div>

        {/* Quick Presets One-Click Bar (Clean Structured Responsive Grid) */}
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> One-Click Tuning Presets:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(DEFAULT_HANDLING_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleLoadPreset(key)}
                className="px-3 py-2.5 bg-zinc-950/80 hover:bg-zinc-850 border border-zinc-800/90 hover:border-rose-500/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] group min-h-[42px]"
              >
                <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                  {preset.tag === 'drift'
                    ? '🏎️'
                    : preset.tag === 'race'
                    ? '🏁'
                    : preset.tag === 'drag'
                    ? '⚡'
                    : preset.tag === 'offroad'
                    ? '🌲'
                    : '🚗'}
                </span>
                <span className="truncate">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sliders Group Tabs (Quick Tuning / Engine / Tires / Suspension) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3 mb-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5 flex-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('quick')}
              className={`px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer text-center min-h-[38px] ${
                activeTab === 'quick'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">Stage 1 Quick</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('engine')}
              className={`px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer text-center min-h-[38px] ${
                activeTab === 'engine'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="whitespace-nowrap">Engine & Power</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tires')}
              className={`px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer text-center min-h-[38px] ${
                activeTab === 'tires'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span className="whitespace-nowrap">Tires & Grip</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('suspension')}
              className={`px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer text-center min-h-[38px] ${
                activeTab === 'suspension'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0 text-sky-400" />
              <span className="whitespace-nowrap">Suspension</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleLoadPreset('realistic-street')}
            title="Reset to default OEM spec"
            className="p-2.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 0. STAGE 1 QUICK TUNER TAB */}
        {activeTab === 'quick' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-rose-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Simple Intuitive Controls</span>
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                Auto-syncs 20+ physics parameters
              </span>
            </div>

            {/* Quick Acceleration / Engine Force Slider */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  <span>Engine Output & Acceleration</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('fInitialDriveForce', Math.max(0.1, Number((handlingData.fInitialDriveForce - 0.02).toFixed(3))))}
                    className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                    title="Nudge down"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-rose-400 min-w-[70px] text-center px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-500/20">
                    {Math.round((handlingData.fInitialDriveForce / 0.65) * 100)}% ({handlingData.fInitialDriveForce.toFixed(3)})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('fInitialDriveForce', Math.min(0.65, Number((handlingData.fInitialDriveForce + 0.02).toFixed(3))))}
                    className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                    title="Nudge up"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0.100"
                max="0.650"
                step="0.01"
                value={handlingData.fInitialDriveForce}
                onChange={(e) => handleFieldChange('fInitialDriveForce', parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-2.5 bg-zinc-800 rounded-lg touch-manipulation"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1 px-0.5">
                <span className={handlingData.fInitialDriveForce <= 0.22 ? 'text-rose-400 font-bold' : ''}>Cruiser</span>
                <span className={handlingData.fInitialDriveForce > 0.22 && handlingData.fInitialDriveForce <= 0.38 ? 'text-rose-400 font-bold' : ''}>Sports</span>
                <span className={handlingData.fInitialDriveForce > 0.38 && handlingData.fInitialDriveForce <= 0.52 ? 'text-rose-400 font-bold' : ''}>Hypercar</span>
                <span className={handlingData.fInitialDriveForce > 0.52 ? 'text-rose-400 font-bold' : ''}>Drag Rocket</span>
              </div>
            </div>

            {/* Quick Drivetrain Bias Slider */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Drivetrain Bias</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('fDriveBiasFront', Math.max(0, Number((handlingData.fDriveBiasFront - 0.05).toFixed(2))))}
                    className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                    title="Nudge Rear"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
                    {handlingData.fDriveBiasFront <= 0.05
                      ? '100% RWD'
                      : handlingData.fDriveBiasFront >= 0.95
                      ? '100% FWD'
                      : `${Math.round((1 - handlingData.fDriveBiasFront) * 100)}% Rear / ${Math.round(handlingData.fDriveBiasFront * 100)}% Front AWD`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('fDriveBiasFront', Math.min(1, Number((handlingData.fDriveBiasFront + 0.05).toFixed(2))))}
                    className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                    title="Nudge Front"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0.00"
                max="1.00"
                step="0.05"
                value={handlingData.fDriveBiasFront}
                onChange={(e) => handleFieldChange('fDriveBiasFront', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2.5 bg-zinc-800 rounded-lg touch-manipulation"
              />
              <div className="flex justify-between text-[10px] font-mono mt-1 px-0.5">
                <span className={handlingData.fDriveBiasFront <= 0.15 ? 'text-rose-400 font-bold underline' : 'text-zinc-500'}>RWD (Drift)</span>
                <span className={handlingData.fDriveBiasFront > 0.35 && handlingData.fDriveBiasFront < 0.65 ? 'text-cyan-400 font-bold underline' : 'text-zinc-500'}>50/50 AWD (Grip)</span>
                <span className={handlingData.fDriveBiasFront >= 0.85 ? 'text-emerald-400 font-bold underline' : 'text-zinc-500'}>FWD (Street)</span>
              </div>
            </div>

            {/* Quick Cornering Grip Slider */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cornering Grip & Tire Compound</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const maxVal = Math.max(1.2, Number((handlingData.fTractionCurveMax - 0.05).toFixed(2)));
                      onChange({
                        ...handlingData,
                        fTractionCurveMax: maxVal,
                        fTractionCurveMin: Math.max(0.8, Number((maxVal * 0.82).toFixed(2)))
                      });
                    }}
                    className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                    title="Nudge down"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-emerald-400 min-w-[50px] text-center px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20">
                    {handlingData.fTractionCurveMax.toFixed(2)}x
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const maxVal = Math.min(3.4, Number((handlingData.fTractionCurveMax + 0.05).toFixed(2)));
                      onChange({
                        ...handlingData,
                        fTractionCurveMax: maxVal,
                        fTractionCurveMin: Math.max(0.8, Number((maxVal * 0.82).toFixed(2)))
                      });
                    }}
                    className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                    title="Nudge up"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="1.20"
                max="3.40"
                step="0.05"
                value={handlingData.fTractionCurveMax}
                onChange={(e) => {
                  const maxVal = parseFloat(e.target.value);
                  onChange({
                    ...handlingData,
                    fTractionCurveMax: maxVal,
                    fTractionCurveMin: Math.max(0.8, Number((maxVal * 0.82).toFixed(2)))
                  });
                }}
                className="w-full accent-emerald-400 cursor-pointer h-2.5 bg-zinc-800 rounded-lg touch-manipulation"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1 px-0.5">
                <span className={handlingData.fTractionCurveMax <= 1.8 ? 'text-emerald-400 font-bold' : ''}>Low Grip / Slippery</span>
                <span className={handlingData.fTractionCurveMax > 1.8 && handlingData.fTractionCurveMax <= 2.6 ? 'text-emerald-400 font-bold' : ''}>Street Sport</span>
                <span className={handlingData.fTractionCurveMax > 2.6 ? 'text-emerald-400 font-bold' : ''}>Sticky Semi-Slicks</span>
              </div>
            </div>

            {/* Quick Drift & Slide Slide Multiplier */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Oversteer & Drift Slide Tendency</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('fTractionLossMult', Math.max(0.5, Number(((handlingData.fTractionLossMult ?? 1.0) - 0.05).toFixed(2))))}
                    className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                    title="Nudge down"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-rose-400 px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-500/20">
                    {((handlingData.fTractionLossMult ?? 1.0) < 0.9 ? 'Gliding Drift' : (handlingData.fTractionLossMult ?? 1.0) > 1.3 ? 'Fast Grip Snap' : 'Balanced')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('fTractionLossMult', Math.min(2.0, Number(((handlingData.fTractionLossMult ?? 1.0) + 0.05).toFixed(2))))}
                    className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                    title="Nudge up"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0.50"
                max="2.00"
                step="0.05"
                value={handlingData.fTractionLossMult ?? 1.0}
                onChange={(e) => handleFieldChange('fTractionLossMult', parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-2.5 bg-zinc-800 rounded-lg touch-manipulation"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1 px-0.5">
                <span className={(handlingData.fTractionLossMult ?? 1.0) < 0.9 ? 'text-rose-400 font-bold' : ''}>Extended Drift Slide</span>
                <span className={(handlingData.fTractionLossMult ?? 1.0) >= 0.9 && (handlingData.fTractionLossMult ?? 1.0) <= 1.3 ? 'text-zinc-200 font-bold' : ''}>Neutral</span>
                <span className={(handlingData.fTractionLossMult ?? 1.0) > 1.3 ? 'text-rose-400 font-bold' : ''}>Rapid Recovery</span>
              </div>
            </div>

            {/* Quick Suspension & Braking Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Brake Force */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Braking Power</span>
                  <span className="text-xs font-mono font-bold text-rose-400">{handlingData.fBrakeForce.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.40"
                  max="2.20"
                  step="0.05"
                  value={handlingData.fBrakeForce}
                  onChange={(e) => handleFieldChange('fBrakeForce', parseFloat(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-0.5">
                  <span>Standard</span>
                  <span>Carbon Ceramic</span>
                </div>
              </div>

              {/* Suspension Stiffness */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Suspension Stiffness</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{handlingData.fSuspensionForce.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="1.20"
                  max="4.50"
                  step="0.05"
                  value={handlingData.fSuspensionForce}
                  onChange={(e) => handleFieldChange('fSuspensionForce', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-0.5">
                  <span>Soft Offroad</span>
                  <span>Stiff Track</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. ENGINE & POWERTRAIN TAB */}
        {activeTab === 'engine' && (
          <div className="space-y-4">
            {/* fInitialDriveForce */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-bold text-white tracking-wide">fInitialDriveForce</span>
                  <span className="text-[11px] text-zinc-400 ml-2 font-mono">(Acceleration / Engine Force)</span>
                </div>
                <span className="text-sm font-mono font-bold text-rose-400">
                  {handlingData.fInitialDriveForce.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="0.100"
                max="0.650"
                step="0.005"
                value={handlingData.fInitialDriveForce}
                onChange={(e) => handleFieldChange('fInitialDriveForce', parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>0.100 (Economy)</span>
                <span>0.350 (Supercar)</span>
                <span>0.650 (Drag Rocket)</span>
              </div>
            </div>

            {/* fDriveBiasFront (AWD / RWD / FWD) */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-bold text-white tracking-wide">fDriveBiasFront</span>
                  <span className="text-[11px] text-zinc-400 ml-2 font-mono">
                    (0.0 = Pure RWD, 0.5 = 50/50 AWD, 1.0 = Pure FWD)
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {handlingData.fDriveBiasFront.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="1.00"
                step="0.05"
                value={handlingData.fDriveBiasFront}
                onChange={(e) => handleFieldChange('fDriveBiasFront', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span className="text-rose-400 font-bold">100% RWD (0.0)</span>
                <span className="text-cyan-400 font-bold">50/50 AWD (0.5)</span>
                <span className="text-emerald-400 font-bold">100% FWD (1.0)</span>
              </div>
            </div>

            {/* fInitialDragCoeff */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-bold text-white tracking-wide">fInitialDragCoeff</span>
                  <span className="text-[11px] text-zinc-400 ml-2 font-mono">(Air Resistance / Top Speed Cap)</span>
                </div>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {handlingData.fInitialDragCoeff.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="2.0"
                max="15.0"
                step="0.1"
                value={handlingData.fInitialDragCoeff}
                onChange={(e) => handleFieldChange('fInitialDragCoeff', parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>2.0 (Streamlined Hypercar)</span>
                <span>7.5 (Sports Coupe)</span>
                <span>15.0 (Heavy Off-Road SUV)</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. TIRES & TRACTION TAB */}
        {activeTab === 'tires' && (
          <div className="space-y-4">
            {/* fTractionCurveMax */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-bold text-white tracking-wide">fTractionCurveMax</span>
                  <span className="text-[11px] text-zinc-400 ml-2 font-mono">(Peak Cornering Grip)</span>
                </div>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {handlingData.fTractionCurveMax.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="1.20"
                max="3.40"
                step="0.05"
                value={handlingData.fTractionCurveMax}
                onChange={(e) => handleFieldChange('fTractionCurveMax', parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>1.20 (Low Grip / Slick)</span>
                <span>2.40 (Street Tire)</span>
                <span>3.40 (Race Slicks)</span>
              </div>
            </div>

            {/* fTractionCurveMin */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-bold text-white tracking-wide">fTractionCurveMin</span>
                  <span className="text-[11px] text-zinc-400 ml-2 font-mono">(Slide / Loss of Grip Threshold)</span>
                </div>
                <span className="text-sm font-mono font-bold text-rose-400">
                  {handlingData.fTractionCurveMin.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.80"
                max="3.00"
                step="0.05"
                value={handlingData.fTractionCurveMin}
                onChange={(e) => handleFieldChange('fTractionCurveMin', parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>0.80 (Easy Snap Oversteer)</span>
                <span>2.00 (Balanced Recovery)</span>
                <span>3.00 (Locked Rear Grip)</span>
              </div>
            </div>

            {/* fTractionLossMult */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-bold text-white tracking-wide">fTractionLossMult</span>
                  <span className="text-[11px] text-zinc-400 ml-2 font-mono">(Drift Angle Friction Deceleration)</span>
                </div>
                <span className="text-sm font-mono font-bold text-rose-400">
                  {(handlingData.fTractionLossMult ?? 1.0).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="2.20"
                step="0.05"
                value={handlingData.fTractionLossMult ?? 1.0}
                onChange={(e) => handleFieldChange('fTractionLossMult', parseFloat(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>0.50 (Long Gliding Drifts)</span>
                <span>1.00 (Standard)</span>
                <span>2.20 (Fast Slide Braking)</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. SUSPENSION & BRAKES TAB */}
        {activeTab === 'suspension' && (
          <div className="space-y-4">
            {/* fMass */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-bold text-white tracking-wide">fMass</span>
                  <span className="text-[11px] text-zinc-400 ml-2 font-mono">(Vehicle Curb Weight)</span>
                </div>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {handlingData.fMass} kg
                </span>
              </div>
              <input
                type="range"
                min="800"
                max="3500"
                step="25"
                value={handlingData.fMass}
                onChange={(e) => handleFieldChange('fMass', parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>800 kg (Track Featherweight)</span>
                <span>1500 kg (Sports Coupe)</span>
                <span>3500 kg (Armored Truck)</span>
              </div>
            </div>

            {/* fSuspensionForce */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-bold text-white tracking-wide">fSuspensionForce</span>
                  <span className="text-[11px] text-zinc-400 ml-2 font-mono">(Spring Stiffness / Anti-Roll)</span>
                </div>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {handlingData.fSuspensionForce.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="1.20"
                max="4.50"
                step="0.05"
                value={handlingData.fSuspensionForce}
                onChange={(e) => handleFieldChange('fSuspensionForce', parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>1.20 (Soft Off-Road / Baja)</span>
                <span>2.50 (Street Sport)</span>
                <span>4.50 (Stiff GT3 Track)</span>
              </div>
            </div>

            {/* fBrakeForce */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-xs font-bold text-white tracking-wide">fBrakeForce</span>
                  <span className="text-[11px] text-zinc-400 ml-2 font-mono">(Stopping Power Multiplier)</span>
                </div>
                <span className="text-sm font-mono font-bold text-rose-400">
                  {handlingData.fBrakeForce.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.40"
                max="2.20"
                step="0.05"
                value={handlingData.fBrakeForce}
                onChange={(e) => handleFieldChange('fBrakeForce', parseFloat(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                <span>0.40 (Sedan OEM)</span>
                <span>1.10 (Performance Brembo)</span>
                <span>2.20 (Carbon Ceramic GT)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated handling.meta XML Output Drawer */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-rose-400" />
            <div>
              <h4 className="text-sm font-black text-white">Live handling.meta XML Code</h4>
              <p className="text-xs text-zinc-400">
                Ready-to-use snippet for FiveM, GTA V, and GTA VI server resources
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyXML}
              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied XML!' : 'Copy XML'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadXML}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .meta</span>
            </button>
          </div>
        </div>

        {/* XML Code Viewer */}
        <div className="relative">
          <pre className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-rose-300 font-mono text-[11px] leading-relaxed max-h-[220px] overflow-y-auto select-all whitespace-pre-wrap">
            {xmlOutput}
          </pre>
        </div>

        {/* Publish to Community Marketplace Button */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            Publish your custom build to the community tuning marketplace to earn{' '}
            <strong className="text-rose-300">+50 VC balance</strong>.
          </div>

          <button
            type="button"
            onClick={onOpenSaveModal}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Publish Preset to Marketplace</span>
          </button>
        </div>
      </div>

      {/* Import / Upload handling.meta Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black text-white">Import handling.meta XML</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              Paste the XML code from any GTA V or FiveM <code className="text-rose-300">handling.meta</code> file, or upload a <code className="text-rose-300">.meta / .xml</code> file directly to parse values into the visual sliders.
            </p>

            {/* File Upload Drop Zone */}
            <div className="mb-4 p-4 border-2 border-dashed border-zinc-800 hover:border-rose-500/50 rounded-xl bg-zinc-900/40 text-center transition">
              <input
                type="file"
                accept=".xml,.meta,.txt"
                onChange={handleFileUpload}
                id="handling-file-input"
                className="hidden"
              />
              <label
                htmlFor="handling-file-input"
                className="cursor-pointer flex flex-col items-center gap-1.5"
              >
                <Upload className="w-6 h-6 text-rose-400" />
                <span className="text-xs font-bold text-white">Click to upload handling.meta file</span>
                <span className="text-[10px] text-zinc-500">Supports .meta, .xml, .txt</span>
              </label>
            </div>

            {/* XML Text Area */}
            <textarea
              rows={8}
              value={importXmlText}
              onChange={(e) => setImportXmlText(e.target.value)}
              placeholder='<CHandlingDataMgr>&#10;  <HandlingData>&#10;    <Item type="CHandlingData">&#10;      <fMass value="1500.000000" />&#10;      ...'
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-rose-500 leading-relaxed mb-3"
            />

            {/* Error / Success feedback */}
            {importError && (
              <div className="mb-3 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccessMessage && (
              <div className="mb-3 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{importSuccessMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                disabled={!importXmlText.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Parse & Apply XML to Sliders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
