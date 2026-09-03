import React, { useState, useRef } from 'react';
import { CharacterIdentityData } from '../../types/rpSuite';
import { 
  CreditCard, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  User, 
  Eye, 
  Calendar, 
  MapPin, 
  Award,
  RefreshCw,
  Share2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';

const DEFAULT_CHARACTER: CharacterIdentityData = {
  id: 'ID-2026-LEONIDA-98124',
  firstName: 'Jason',
  lastName: 'Duval',
  middleName: 'Thomas',
  dob: '1992-06-18',
  ssn: '884-21-9014',
  gender: 'M',
  height: `6' 1"`,
  weightLbs: 185,
  eyeColor: 'Hazel',
  hairColor: 'Brown',
  fingerprintId: 'LEO-FP-9902188-A',
  address: '1420 Ocean Drive, Apt 4B',
  city: 'Vice City',
  postalCode: '1042',
  donorStatus: true,
  portraitUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  signatureText: 'J. Duval',
  issueDate: '2025-01-10',
  expiryDate: '2029-01-10',
  endorsements: {
    drivers: true,
    commercial: false,
    motorcycle: true,
    aviation: false,
    maritime: true,
    ccwClass: 'Class 1 (Handgun / Concealed)'
  },
  occupation: 'Lead Heist Strategist / Mechanic',
  backstorySnippet: 'Former Everglades speed-boat runner turned high-stakes tactician in Vice City.',
  createdAt: Date.now()
};

export const IdentityCardGenerator: React.FC = () => {
  const [character, setCharacter] = useState<CharacterIdentityData>(DEFAULT_CHARACTER);
  const [cardTheme, setCardTheme] = useState<'leonida_standard' | 'vice_vip_gold' | 'tactical_ccw'>('leonida_standard');
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      let dataUrl = '';
      try {
        dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          pixelRatio: 2,
        });
      } catch (toPngErr) {
        console.warn('toPng failed, using html2canvas fallback:', toPngErr);
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          onclone: (clonedDoc) => {
            const styles = clonedDoc.querySelectorAll('style');
            styles.forEach((s) => {
              if (s.textContent && s.textContent.includes('oklch')) {
                s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, '#0f172a');
              }
            });
          }
        });
        dataUrl = canvas.toDataURL('image/png');
      }

      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `${character.firstName}_${character.lastName}_Leonida_ID.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyDiscordEmbed = () => {
    const markdown = `\`\`\`ansi
[1;36m========================================[0m
[1;33m       STATE OF LEONIDA DRIVER LICENSE  [0m
[1;36m========================================[0m
[1;37mNAME:[0m ${character.lastName.toUpperCase()}, ${character.firstName.toUpperCase()} ${character.middleName || ''}
[1;37mDOB:[0m ${character.dob} | [1;37mSEX:[0m ${character.gender} | [1;37mHT:[0m ${character.height} | [1;37mWT:[0m ${character.weightLbs} lbs
[1;37mEYES:[0m ${character.eyeColor} | [1;37mHAIR:[0m ${character.hairColor}
[1;37mADDRESS:[0m ${character.address}, ${character.city}, LE ${character.postalCode}
[1;37mLICENSE NO:[0m ${character.id}
[1;37mCLASS:[0m C - OPERATOR | [1;37mDONOR:[0m ${character.donorStatus ? 'YES' : 'NO'}
[1;37mFIREARM CCW:[0m ${character.endorsements.ccwClass}
[1;37mEXPIRES:[0m ${character.expiryDate}
\`\`\``;

    navigator.clipboard.writeText(markdown);
    setCopiedDiscord(true);
    setTimeout(() => setCopiedDiscord(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* HEADER BAR */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-black text-white">State of Leonida ID & Character Sheet Generator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate authentic skeuomorphic Driver's Licenses, CCW Permits, and Discord-ready RP character dossiers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyDiscordEmbed}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer shadow"
          >
            {copiedDiscord ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copiedDiscord ? 'Copied Discord Markdown!' : 'Copy Discord Format'}</span>
          </button>

          <button
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25 transition"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export High-Res PNG</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: VISUAL ID CARD PREVIEW (6 COLS ON XL) */}
        <div className="xl:col-span-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Card Theme Preset:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCardTheme('leonida_standard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  cardTheme === 'leonida_standard' ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Leonida Standard
              </button>
              <button
                type="button"
                onClick={() => setCardTheme('vice_vip_gold')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  cardTheme === 'vice_vip_gold' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                VIP Gold
              </button>
              <button
                type="button"
                onClick={() => setCardTheme('tactical_ccw')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  cardTheme === 'tactical_ccw' ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                CCW Tactical
              </button>
            </div>
          </div>

          {/* SKEUOMORPHIC DRIVER'S LICENSE CARD CONTAINER */}
          <div className="w-full overflow-x-auto p-1 flex justify-center">
            <div
              ref={cardRef}
              className={`w-full max-w-[440px] shrink-0 aspect-[1.586/1] rounded-2xl p-5 relative overflow-hidden shadow-2xl border transition-all ${
                cardTheme === 'leonida_standard'
                  ? 'bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 border-sky-500/40 text-slate-100'
                  : cardTheme === 'vice_vip_gold'
                  ? 'bg-gradient-to-br from-amber-950 via-yellow-950 to-slate-950 border-amber-500/60 text-amber-100'
                  : 'bg-gradient-to-br from-slate-950 via-zinc-900 to-rose-950 border-rose-500/40 text-slate-100'
              }`}
            >
              {/* Holographic Watermark Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />
              <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full border-8 border-white/5 pointer-events-none flex items-center justify-center font-black text-6xl text-white/5 font-serif select-none">
                LE
              </div>

              {/* Header Ribbon */}
              <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-sky-400">State of Leonida</div>
                  <div className="text-[16px] font-black tracking-tight leading-none text-white font-serif">DRIVER LICENSE</div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-white/70 block">CLASS: C</span>
                  <span className="text-[10px] font-mono font-black text-amber-300">USA • LE</span>
                </div>
              </div>

              {/* Main ID Body */}
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Mugshot / Avatar (4 cols) */}
                <div className="col-span-4 space-y-1 text-center">
                  <div className="w-full aspect-[3/4] rounded-xl bg-slate-950 border-2 border-white/30 overflow-hidden relative shadow-md">
                    <img
                      src={character.portraitUrl}
                      alt="Character Portrait"
                      className="w-full h-full object-cover"
                    />
                    {character.donorStatus && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[8px] flex items-center gap-0.5 shadow">
                        <span>DONOR</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-white/70 tracking-tighter truncate">
                    {character.id}
                  </div>
                </div>

                {/* Character Telemetry Info (8 cols) */}
                <div className="col-span-8 space-y-1 text-[11px]">
                  <div>
                    <span className="text-[8px] text-white/60 block uppercase font-bold">1. LN / 2. FN</span>
                    <div className="font-black text-white text-sm uppercase tracking-wide leading-tight truncate">
                      {character.lastName}, {character.firstName} {character.middleName || ''}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div>
                      <span className="text-[8px] text-white/60 block">3. DOB</span>
                      <span className="font-bold text-amber-300 font-mono">{character.dob}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-white/60 block">4. EXP</span>
                      <span className="font-bold text-rose-300 font-mono">{character.expiryDate}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] text-white/60 block">8. ADDRESS</span>
                    <span className="font-medium text-white/90 truncate block text-[10px]">
                      {character.address}, {character.city}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-[9px] font-mono border-t border-white/10 pt-1">
                    <div><span className="text-white/50 block text-[7px]">SEX</span>{character.gender}</div>
                    <div><span className="text-white/50 block text-[7px]">HGT</span>{character.height}</div>
                    <div><span className="text-white/50 block text-[7px]">WGT</span>{character.weightLbs}</div>
                    <div><span className="text-white/50 block text-[7px]">EYES</span>{character.eyeColor.slice(0,3)}</div>
                  </div>

                  {/* Firearm Endorsement Badge */}
                  {character.endorsements.ccwClass !== 'None' && (
                    <div className="mt-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[9px] font-bold text-amber-200 flex items-center justify-between">
                      <span>CCW FIREARM PERMIT</span>
                      <span className="font-mono text-[8px]">{character.endorsements.ccwClass.split(' ')[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Barcode Strip */}
              <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between">
                <div className="h-4 flex-1 bg-[repeating-linear-gradient(90deg,#fff,#fff_2px,transparent_2px,transparent_4px)] opacity-60 mr-4" />
                <span className="font-mono text-[8px] text-white/50 font-bold tracking-widest shrink-0">
                  LEONIDA DMV • SECURE ID
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: IDENTITY CONFIGURATOR (6 COLS ON XL) */}
        <div className="xl:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-5 h-5 text-cyan-400" />
              <h3 className="font-black text-white text-base">Character Bio & Demographics Editor</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="min-w-0">
                <label className="block text-slate-400 font-bold mb-1 truncate">First Name:</label>
                <input
                  type="text"
                  value={character.firstName}
                  onChange={(e) => setCharacter({ ...character, firstName: e.target.value })}
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-slate-400 font-bold mb-1 truncate">Middle Name:</label>
                <input
                  type="text"
                  value={character.middleName || ''}
                  onChange={(e) => setCharacter({ ...character, middleName: e.target.value })}
                  placeholder="Optional"
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-slate-400 font-bold mb-1 truncate">Last Name:</label>
                <input
                  type="text"
                  value={character.lastName}
                  onChange={(e) => setCharacter({ ...character, lastName: e.target.value })}
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="min-w-0">
                <label className="block text-slate-400 font-bold mb-1 truncate">Date of Birth:</label>
                <input
                  type="text"
                  value={character.dob}
                  onChange={(e) => setCharacter({ ...character, dob: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-slate-400 font-bold mb-1 truncate">Height:</label>
                <input
                  type="text"
                  value={character.height}
                  onChange={(e) => setCharacter({ ...character, height: e.target.value })}
                  placeholder="e.g. 6' 1&quot;"
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-slate-400 font-bold mb-1 truncate">Weight (Lbs):</label>
                <input
                  type="number"
                  value={character.weightLbs}
                  onChange={(e) => setCharacter({ ...character, weightLbs: parseInt(e.target.value) || 160 })}
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="min-w-0">
                <label className="block text-slate-400 font-bold mb-1 truncate">Address / Residence:</label>
                <input
                  type="text"
                  value={character.address}
                  onChange={(e) => setCharacter({ ...character, address: e.target.value })}
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-slate-400 font-bold mb-1 truncate">Portrait Image URL:</label>
                <input
                  type="text"
                  value={character.portraitUrl}
                  onChange={(e) => setCharacter({ ...character, portraitUrl: e.target.value })}
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-[11px] font-mono focus:outline-none focus:border-cyan-500 transition truncate"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="min-w-0">
                <label className="block text-slate-400 font-bold mb-1 truncate">CCW Firearm Endorsement:</label>
                <select
                  value={character.endorsements.ccwClass}
                  onChange={(e) => setCharacter({
                    ...character,
                    endorsements: { ...character.endorsements, ccwClass: e.target.value as any }
                  })}
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                >
                  <option>None</option>
                  <option>Class 1 (Handgun / Concealed)</option>
                  <option>Class 2 (Tactical Rifle)</option>
                  <option>Class 3 (Specialty Class / Collector)</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-slate-400 font-bold mb-1 truncate">Eye Color:</label>
                <input
                  type="text"
                  value={character.eyeColor}
                  onChange={(e) => setCharacter({ ...character, eyeColor: e.target.value as any })}
                  className="w-full min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Hazel, Blue, Brown..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={character.donorStatus}
                  onChange={(e) => setCharacter({ ...character, donorStatus: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="select-none">Organ Donor Status</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={character.endorsements.motorcycle}
                  onChange={(e) => setCharacter({
                    ...character,
                    endorsements: { ...character.endorsements, motorcycle: e.target.checked }
                  })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="select-none">Motorcycle Endorsement</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
