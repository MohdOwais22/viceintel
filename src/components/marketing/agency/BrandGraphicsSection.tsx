import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Sparkles,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  Zap,
  Sliders,
  CheckCircle2,
  Code,
  Eye,
  Layers,
  Wand2,
  RefreshCw,
  Layout,
  ExternalLink,
  Trash2,
  Share2
} from 'lucide-react';
import { BrandGraphicBrief } from './types';
import { SEED_BRAND_GRAPHICS } from './mockData';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const PRESET_BACKGROUND_IMAGES = [
  {
    id: 'ocean-drive',
    name: 'Ocean Drive Twilight (Sports Coupe)',
    url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=80',
    primaryColor: '#FF007F',
    secondaryColor: '#00F0FF'
  },
  {
    id: 'key-biscayne',
    name: 'Key Biscayne Supercar (Hypercar Sunset)',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
    primaryColor: '#00F0FF',
    secondaryColor: '#FF8800'
  },
  {
    id: 'nightclub-skyline',
    name: 'Vice City Nightclub Neon Skyline',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
    primaryColor: '#9D00FF',
    secondaryColor: '#FF007F'
  },
  {
    id: 'everglades-bayou',
    name: 'Everglades Swamp Airboat Patrol',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    primaryColor: '#00FF88',
    secondaryColor: '#00E5FF'
  },
  {
    id: 'armored-vault',
    name: 'Downtown Bank Heist Vault',
    url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1600&q=80',
    primaryColor: '#FFD700',
    secondaryColor: '#FF2A4D'
  }
];

export const BrandGraphicsSection: React.FC = () => {
  const [briefs, setBriefs] = useState<BrandGraphicBrief[]>(SEED_BRAND_GRAPHICS);
  const [selectedBrief, setSelectedBrief] = useState<BrandGraphicBrief>(SEED_BRAND_GRAPHICS[0]);
  const [activeTab, setActiveTab] = useState<'canvas' | 'brief' | 'code'>('canvas');

  // Input states for new brief generator
  const [graphicTopic, setGraphicTopic] = useState<string>('Vice City Nightclub Neon Skyline');
  const [targetChannel, setTargetChannel] = useState<BrandGraphicBrief['channel']>('Hero Banner');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Live Canvas Customization states
  const [bannerTitle, setBannerTitle] = useState<string>(selectedBrief.title);
  const [bannerSubtitle, setBannerSubtitle] = useState<string>(
    'Side-by-Side Telemetry & Drag Race Dyno Charts'
  );
  const [badgeText, setBadgeText] = useState<string>('PLATFORM FEATURES & TOOLS ⚡');
  const [ctaText, setCtaText] = useState<string>('Explore Database ➔');
  const [bgPreset, setBgPreset] = useState(PRESET_BACKGROUND_IMAGES[0]);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.55);
  const [primaryGlow, setPrimaryGlow] = useState<string>('#FF007F');
  const [secondaryGlow, setSecondaryGlow] = useState<string>('#00F0FF');
  const [customBgUrl, setCustomBgUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update editor inputs when brief selection changes
  useEffect(() => {
    setBannerTitle(selectedBrief.title);
    setBannerSubtitle(selectedBrief.subtitle || selectedBrief.visualDescription || 'Vice City Intelligence Suite');
    setBadgeText(selectedBrief.badgeText || `${selectedBrief.channel.toUpperCase()} • ${selectedBrief.aspectRatio}`);
    setCtaText(selectedBrief.ctaText || 'Explore Database ➔');

    if (selectedBrief.imageUrl) {
      setCustomBgUrl(selectedBrief.imageUrl);
    } else {
      setCustomBgUrl('');
      const matched = PRESET_BACKGROUND_IMAGES.find(p => p.id === selectedBrief.id) || PRESET_BACKGROUND_IMAGES[0];
      setBgPreset(matched);
    }

    if (selectedBrief.colorPalette && selectedBrief.colorPalette.length >= 2) {
      setPrimaryGlow(selectedBrief.colorPalette[0].hex);
      setSecondaryGlow(selectedBrief.colorPalette[1].hex);
    }
  }, [selectedBrief]);

  // Subscribe to Firestore for persistence
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, 'marketingBannerBriefs'), (snap) => {
        if (!snap.empty) {
          const fetched: BrandGraphicBrief[] = [];
          snap.forEach((docSnap) => {
            fetched.push({ id: docSnap.id, ...docSnap.data() } as BrandGraphicBrief);
          });
          setBriefs(prev => {
            const combined = [...fetched];
            SEED_BRAND_GRAPHICS.forEach(seed => {
              if (!combined.some(b => b.id === seed.id)) {
                combined.push(seed);
              }
            });
            return combined;
          });
        }
      });
    } catch (err) {
      console.warn('Banner briefs Firestore listener notice:', err);
    }
    return () => unsub();
  }, []);

  // Helper to copy text to clipboard
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Generate new brief
  const handleGenerateBrief = async () => {
    if (!graphicTopic.trim()) return;
    setIsGenerating(true);

    let aspect: BrandGraphicBrief['aspectRatio'] = '16:9';
    let dims = '1920 x 1080 px';
    let presetImg = PRESET_BACKGROUND_IMAGES[1].url;

    if (targetChannel === 'Hero Banner') {
      aspect = '21:9';
      dims = '2560 x 1080 px';
      presetImg = PRESET_BACKGROUND_IMAGES[0].url;
    } else if (targetChannel === 'Snapmatic Square') {
      aspect = '1:1';
      dims = '1080 x 1080 px';
      presetImg = PRESET_BACKGROUND_IMAGES[2].url;
    } else if (targetChannel === 'Bleeter Wide') {
      aspect = '16:9';
      dims = '1200 x 630 px';
      presetImg = PRESET_BACKGROUND_IMAGES[3].url;
    } else if (targetChannel === 'Discord Header') {
      aspect = '16:9';
      dims = '1280 x 480 px';
      presetImg = PRESET_BACKGROUND_IMAGES[4].url;
    } else {
      aspect = '16:9';
      dims = '1920 x 1080 px';
      presetImg = PRESET_BACKGROUND_IMAGES[1].url;
    }

    const newBrief: BrandGraphicBrief = {
      id: `gfx-${Date.now()}`,
      title: `${graphicTopic} - ${targetChannel}`,
      channel: targetChannel,
      aspectRatio: aspect,
      dimensions: dims,
      visualDescription: `Cinematic graphic featuring ${graphicTopic} with atmospheric neon fog and Vice City specular lighting.`,
      imageUrl: presetImg,
      subtitle: `${graphicTopic} - Official GTA VI Asset Brief`,
      badgeText: `${targetChannel.toUpperCase()} • ${dims.split(' ')[0]}x${dims.split(' ')[2]}`,
      ctaText: 'Explore Content ➔',
      colorPalette: [
        { name: 'Neon Magenta', hex: '#FF007F' },
        { name: 'Cyan Glow', hex: '#00F0FF' },
        { name: 'Electric Violet', hex: '#8A2BE2' },
        { name: 'Midnight Asphalt', hex: '#090B10' }
      ],
      typographyNotes: 'Display Heavy Sans-Serif with sharp kerning and dual-tone neon outline glow.',
      aiGenerationPrompt: `8k photorealistic GTA 6 Vice City aesthetic, ${graphicTopic}, ultra-detailed neon reflections, volumetric haze, Ray Tracing Overdrive`,
      negativePrompt: 'blurry, cartoonish, low resolution, artifacts, distorted geometry, washed out colors',
      status: 'Ready',
      createdAt: new Date().toISOString()
    };

    setBriefs(prev => [newBrief, ...prev]);
    setSelectedBrief(newBrief);

    try {
      await setDoc(doc(db, 'marketingBannerBriefs', newBrief.id), newBrief);
    } catch (e) {
      console.warn('Firestore brief save notice:', e);
    }

    setIsGenerating(false);
    setNotice('✨ New AI Banner Brief created & saved!');
    setTimeout(() => setNotice(null), 4000);
  };

  // Render HTML5 Canvas for Banner Image Download
  const renderCanvasAndDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Parse exact target dimensions from selectedBrief.dimensions
    let width = 1920;
    let height = 1080;

    if (selectedBrief.dimensions) {
      const match = selectedBrief.dimensions.match(/(\d+)\s*x\s*(\d+)/i);
      if (match) {
        width = parseInt(match[1], 10);
        height = parseInt(match[2], 10);
      }
    }

    if (!width || !height || width <= 0 || height <= 0) {
      if (selectedBrief.channel === 'Hero Banner' || selectedBrief.aspectRatio === '21:9') {
        width = 2560; height = 1080;
      } else if (selectedBrief.channel === 'Snapmatic Square' || selectedBrief.aspectRatio === '1:1') {
        width = 1080; height = 1080;
      } else if (selectedBrief.channel === 'Discord Header') {
        width = 1280; height = 480;
      } else if (selectedBrief.channel === 'Bleeter Wide') {
        width = 1200; height = 630;
      } else {
        width = 1920; height = 1080;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const imgUrl = customBgUrl || bgPreset.url;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgUrl;

    const drawGraphic = () => {
      // Scale ratios relative to target canvas resolution
      const scale = Math.min(width / 1920, height / 1080);
      const paddingX = Math.max(36, Math.round(width * 0.05));
      const badgeFontSize = Math.max(14, Math.round(Math.min(30, height * 0.042)));
      const titleFontSize = Math.max(26, Math.round(Math.min(68, height * 0.075)));
      const subtitleFontSize = Math.max(14, Math.round(Math.min(30, height * 0.035)));
      const ctaFontSize = Math.max(14, Math.round(Math.min(28, height * 0.035)));

      // Background Cover Draw
      if (img.complete && img.naturalWidth > 0) {
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = width / height;
        let renderW = width;
        let renderH = height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > canvasAspect) {
          renderW = height * imgAspect;
          offsetX = (width - renderW) / 2;
        } else {
          renderH = width / imgAspect;
          offsetY = (height - renderH) / 2;
        }
        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
      } else {
        ctx.fillStyle = '#090B10';
        ctx.fillRect(0, 0, width, height);
      }

      // Dark Vignette
      ctx.fillStyle = `rgba(5, 7, 12, ${overlayOpacity})`;
      ctx.fillRect(0, 0, width, height);

      // Neon Linear Gradient Vignette
      const gradient = ctx.createLinearGradient(0, 0, width * 0.7, height);
      gradient.addColorStop(0, 'rgba(5, 7, 12, 0.95)');
      gradient.addColorStop(0.5, 'rgba(5, 7, 12, 0.6)');
      gradient.addColorStop(1, 'rgba(5, 7, 12, 0.2)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 1. Badge Pill
      ctx.font = `bold ${badgeFontSize}px sans-serif`;
      const badgeTextMetrics = ctx.measureText(badgeText);
      const badgePadH = Math.round(badgeFontSize * 0.8);
      const badgeHeight = Math.round(badgeFontSize * 1.8);
      const badgeY = Math.max(24, Math.round(height * 0.1));

      ctx.fillStyle = 'rgba(255, 0, 127, 0.25)';
      ctx.strokeStyle = primaryGlow;
      ctx.lineWidth = Math.max(2, Math.round(scale * 3));
      ctx.beginPath();
      ctx.roundRect(paddingX, badgeY, badgeTextMetrics.width + (badgePadH * 2), badgeHeight, Math.round(badgeHeight / 3));
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(badgeText, paddingX + badgePadH, badgeY + Math.round(badgeHeight * 0.68));

      // 2. Title Text
      let titleY = badgeY + badgeHeight + Math.round(height * 0.05);
      ctx.font = `900 ${titleFontSize}px sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = primaryGlow;
      ctx.shadowBlur = Math.round(20 * (width / 1920));

      const maxTitleW = width - (paddingX * 2) - 40;
      const words = bannerTitle.split(' ');
      let line = '';
      const lineGap = Math.round(titleFontSize * 1.15);

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTitleW && n > 0) {
          ctx.fillText(line, paddingX, titleY);
          line = words[n] + ' ';
          titleY += lineGap;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, paddingX, titleY);

      // 3. Subtitle Text
      ctx.shadowBlur = 0;
      let subtitleY = titleY + Math.round(subtitleFontSize * 1.4);
      ctx.font = `500 ${subtitleFontSize}px sans-serif`;
      ctx.fillStyle = 'rgba(228, 228, 231, 0.9)';

      const subWords = bannerSubtitle.split(' ');
      let subLine = '';
      const subLineGap = Math.round(subtitleFontSize * 1.3);

      for (let i = 0; i < subWords.length; i++) {
        const testSub = subLine + subWords[i] + ' ';
        if (ctx.measureText(testSub).width > maxTitleW && i > 0) {
          ctx.fillText(subLine, paddingX, subtitleY);
          subLine = subWords[i] + ' ';
          subtitleY += subLineGap;
        } else {
          subLine = testSub;
        }
      }
      ctx.fillText(subLine, paddingX, subtitleY);

      // 4. CTA Button
      const ctaY = subtitleY + Math.round(height * 0.05);
      ctx.font = `bold ${ctaFontSize}px sans-serif`;
      const ctaTextMetrics = ctx.measureText(ctaText);
      const ctaBtnW = ctaTextMetrics.width + Math.round(ctaFontSize * 2.2);
      const ctaBtnH = Math.round(ctaFontSize * 2.2);

      const btnGradient = ctx.createLinearGradient(paddingX, ctaY, paddingX + ctaBtnW, ctaY);
      btnGradient.addColorStop(0, primaryGlow);
      btnGradient.addColorStop(1, secondaryGlow);

      ctx.fillStyle = btnGradient;
      ctx.beginPath();
      ctx.roundRect(paddingX, ctaY, ctaBtnW, ctaBtnH, Math.round(ctaBtnH / 3));
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.fillText(ctaText, paddingX + Math.round(ctaFontSize * 1.1), ctaY + Math.round(ctaBtnH * 0.65));

      // Trigger Download PNG
      const link = document.createElement('a');
      link.download = `${selectedBrief.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${width}x${height}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setNotice(`🎉 High-Res PNG (${width}x${height}px) generated & downloaded!`);
      setTimeout(() => setNotice(null), 4000);
    };

    img.onload = drawGraphic;
    img.onerror = drawGraphic;

    if (img.complete) {
      drawGraphic();
    }
  };

  // Generate HTML/CSS Snippet
  const getHtmlCssSnippet = () => {
    return `<div class="relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl min-h-[360px] flex flex-col justify-end">
  <!-- Background Image with Gradient Overlay -->
  <div class="absolute inset-0 z-0">
    <img src="${customBgUrl || bgPreset.url}" alt="${bannerTitle}" class="w-full h-full object-cover object-center filter brightness-90" />
    <div class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"></div>
  </div>

  <!-- Content Layer -->
  <div class="relative z-10 space-y-4 max-w-2xl">
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md">
      ${badgeText}
    </span>
    <h2 class="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
      ${bannerTitle}
    </h2>
    <p class="text-sm text-zinc-300 font-medium">
      ${bannerSubtitle}
    </p>
    <a href="/vehicles" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black text-black transition-transform hover:scale-105 active:scale-95 shadow-lg" style="background: linear-gradient(135deg, ${primaryGlow}, ${secondaryGlow})">
      <span>${ctaText}</span>
    </a>
  </div>
</div>`;
  };

  return (
    <div className="space-y-6">
      {/* Purpose & Description Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/90 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <Wand2 className="w-5 h-5" />
            </span>
            <h3 className="text-base font-black text-white font-sans">
              AI Banner & Creative Asset Studio
            </h3>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-md">
              Live Canvas & AI Prompts
            </span>
          </div>
          <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
            Design, preview, customize, and render high-resolution GTA VI promotional banners, social cards, YouTube thumbnails, and web hero covers. Edit live canvas typography, colors, and background artwork or copy AI generation prompts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={renderCanvasAndDownload}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Render PNG Banner</span>
          </button>
        </div>
      </div>

      {/* Generator Input Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <Palette className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
            <input
              type="text"
              value={graphicTopic}
              onChange={(e) => setGraphicTopic(e.target.value)}
              placeholder="Enter visual theme (e.g. 'Ocean Drive Supercar Drag Race', 'Key Biscayne Smuggler Boat Launch')..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-700/80 focus:border-rose-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition shadow-inner font-medium"
            />
          </div>

          <select
            value={targetChannel}
            onChange={(e) => setTargetChannel(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-rose-500 cursor-pointer shadow-inner"
          >
            <option value="Hero Banner" className="bg-zinc-900 text-white font-medium py-1.5 px-2">Hero Banner (21:9 - 2560x1080)</option>
            <option value="YouTube Thumbnail" className="bg-zinc-900 text-white font-medium py-1.5 px-2">YouTube Thumbnail (16:9 - 1920x1080)</option>
            <option value="Snapmatic Square" className="bg-zinc-900 text-white font-medium py-1.5 px-2">Snapmatic Square (1:1 - 1080x1080)</option>
            <option value="Bleeter Wide" className="bg-zinc-900 text-white font-medium py-1.5 px-2">Bleeter Wide (16:9 - 1200x630)</option>
            <option value="Discord Header" className="bg-zinc-900 text-white font-medium py-1.5 px-2">Discord Header (16:9 - 1280x480)</option>
          </select>

          <button
            onClick={handleGenerateBrief}
            disabled={isGenerating || !graphicTopic.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 via-fuchsia-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 cursor-pointer shrink-0"
          >
            <Zap className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing Prompt...' : '⚡ Generate New Brief'}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Brief Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 px-1 flex items-center justify-between">
            <span>Graphic Briefs ({briefs.length})</span>
            <span className="text-[10px] text-zinc-500">Firestore Synced</span>
          </h4>
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {briefs.map(brief => (
              <div
                key={brief.id}
                onClick={() => setSelectedBrief(brief)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedBrief.id === brief.id
                    ? 'bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-950/30'
                    : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold border border-zinc-700">
                    {brief.channel}
                  </span>
                  <span className="text-rose-400 font-bold">{brief.aspectRatio}</span>
                </div>
                <h5 className="text-xs font-bold text-zinc-100 line-clamp-2">{brief.title}</h5>
                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1 font-mono">{brief.dimensions}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right 8 Columns: Studio Workbench & Inspector */}
        <div className="lg:col-span-8 space-y-6">
          {/* Sub-Tab Selector */}
          <div className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'canvas'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>1. Live Banner Canvas & Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('brief')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'brief'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>2. Art Direction & AI Prompts</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'code'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>3. HTML/CSS Code Embed</span>
            </button>
          </div>

          {/* TAB 1: Live Interactive Banner Studio Canvas */}
          {activeTab === 'canvas' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                      {selectedBrief.channel} • {selectedBrief.aspectRatio}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      Target: {selectedBrief.dimensions}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">{selectedBrief.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={renderCanvasAndDownload}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </button>
                </div>
              </div>

              {/* LIVE DISPLAY BANNER PREVIEW STAGE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span className="font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Live Canvas Render Preview
                  </span>
                  <span>Interactive Real-time Visual Stage</span>
                </div>

                <div className={`relative w-full rounded-2xl overflow-hidden border border-zinc-700/80 bg-zinc-950 p-6 sm:p-10 shadow-2xl flex flex-col justify-end group transition-all ${
                  selectedBrief.channel === 'Hero Banner' || selectedBrief.aspectRatio === '21:9'
                    ? 'aspect-[21/9] min-h-[260px] sm:min-h-[340px]'
                    : selectedBrief.channel === 'Snapmatic Square' || selectedBrief.aspectRatio === '1:1'
                    ? 'aspect-square max-w-xl mx-auto min-h-[300px]'
                    : selectedBrief.channel === 'Discord Header'
                    ? 'aspect-[1280/480] min-h-[200px] sm:min-h-[260px]'
                    : selectedBrief.channel === 'Bleeter Wide'
                    ? 'aspect-[1200/630] min-h-[220px] sm:min-h-[280px]'
                    : 'aspect-[16/9] min-h-[280px] sm:min-h-[360px]'
                }`}>
                  {/* Background Artwork */}
                  <img
                    src={customBgUrl || bgPreset.url}
                    alt={bannerTitle}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-105"
                  />

                  {/* Dark Vignette Overlay */}
                  <div
                    className="absolute inset-0 transition-opacity"
                    style={{ backgroundColor: `rgba(5, 7, 12, ${overlayOpacity})` }}
                  />

                  {/* Neon Directional Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />

                  {/* Ambient Glow Orbs */}
                  <div
                    className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
                    style={{ backgroundColor: primaryGlow }}
                  />
                  <div
                    className="absolute bottom-0 right-10 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: secondaryGlow }}
                  />

                  {/* Overlay Banner Typography Content */}
                  <div className="relative z-10 space-y-3 max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-rose-500/30 text-rose-200 border border-rose-500/50 backdrop-blur-md shadow-lg">
                      {badgeText}
                    </div>

                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                      {bannerTitle}
                    </h2>

                    <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed drop-shadow-sm">
                      {bannerSubtitle}
                    </p>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        className="px-6 py-3 rounded-xl text-xs sm:text-sm font-black text-black transition-transform hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2 cursor-pointer"
                        style={{
                          background: `linear-gradient(135deg, ${primaryGlow}, ${secondaryGlow})`
                        }}
                      >
                        <span>{ctaText}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE CUSTOMIZER CONTROLS */}
              <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Banner Studio Customization Controls</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Headline Title */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 font-bold">Headline Title</label>
                    <input
                      type="text"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>

                  {/* Subtitle / Tagline */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 font-bold">Subtitle / Description</label>
                    <input
                      type="text"
                      value={bannerSubtitle}
                      onChange={(e) => setBannerSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>

                  {/* Badge Text */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 font-bold">Badge Pill Text</label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>

                  {/* CTA Text */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 font-bold">Button CTA Text</label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                </div>

                {/* Artwork Preset Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-zinc-400 font-bold">
                    Background Artwork Presets
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {PRESET_BACKGROUND_IMAGES.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setBgPreset(preset);
                          setPrimaryGlow(preset.primaryColor);
                          setSecondaryGlow(preset.secondaryColor);
                          setCustomBgUrl('');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                          bgPreset.id === preset.id && !customBgUrl
                            ? 'bg-rose-500/20 border-rose-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        <span className="text-[11px] font-bold truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Background URL & Overlay Slider */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 font-bold">Custom Image URL</label>
                    <input
                      type="url"
                      value={customBgUrl}
                      onChange={(e) => setCustomBgUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400 font-bold">Dark Vignette Opacity</span>
                      <span className="text-rose-400 font-bold">{Math.round(overlayOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Hidden Canvas Element for PNG export */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* TAB 2: Art Direction & AI Prompts */}
          {activeTab === 'brief' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="border-b border-zinc-800 pb-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                    {selectedBrief.channel} • {selectedBrief.aspectRatio}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1.5">{selectedBrief.title}</h3>
                  <p className="text-xs text-zinc-400 font-mono">Target Canvas Size: {selectedBrief.dimensions}</p>
                </div>

                <button
                  onClick={() => handleCopy(selectedBrief.aiGenerationPrompt, 'prompt')}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                >
                  {copiedText === 'prompt' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy AI Prompt</span>
                </button>
              </div>

              {/* Visual Description */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                  Art Direction & Composition Guidelines
                </h4>
                <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-xs text-zinc-200 leading-relaxed">
                  {selectedBrief.visualDescription}
                </div>
              </div>

              {/* Color Palette Swatches */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                  Color Palette Swatches
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedBrief.colorPalette.map(color => (
                    <div
                      key={color.hex}
                      onClick={() => handleCopy(color.hex, color.hex)}
                      className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 cursor-pointer hover:border-zinc-700 transition"
                      title="Click to copy HEX code"
                    >
                      <div
                        className="w-full h-10 rounded-lg shadow-inner border border-white/10"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-200 text-[11px] truncate">{color.name}</span>
                        <span className="font-mono text-zinc-400 text-[10px]">
                          {copiedText === color.hex ? 'Copied!' : color.hex}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Prompts Box */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono uppercase text-emerald-400 font-bold">Positive AI Generation Prompt</span>
                    <button
                      onClick={() => handleCopy(selectedBrief.aiGenerationPrompt, 'pos')}
                      className="text-zinc-400 hover:text-white transition cursor-pointer text-[10px] font-bold"
                    >
                      {copiedText === 'pos' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-emerald-300/90 font-mono leading-relaxed select-all">
                    {selectedBrief.aiGenerationPrompt}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono uppercase text-rose-400 font-bold">Negative Prompt (Exclusions)</span>
                    <button
                      onClick={() => handleCopy(selectedBrief.negativePrompt, 'neg')}
                      className="text-zinc-400 hover:text-white transition cursor-pointer text-[10px] font-bold"
                    >
                      {copiedText === 'neg' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-rose-300/90 font-mono leading-relaxed select-all">
                    {selectedBrief.negativePrompt}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Developer Code Snippets & Embed */}
          {activeTab === 'code' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white">Embed Code & JSON Spec Exporter</h3>
                  <p className="text-xs text-zinc-400 font-mono">Production-ready Tailwind HTML component</p>
                </div>

                <button
                  onClick={() => handleCopy(getHtmlCssSnippet(), 'html')}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                >
                  {copiedText === 'html' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>Copy HTML Code</span>
                </button>
              </div>

              {/* Code Snippet Box */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                  Responsive Web Hero Banner Component
                </h4>
                <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-cyan-300 font-mono leading-relaxed overflow-x-auto max-h-[380px] select-all">
                  {getHtmlCssSnippet()}
                </pre>
              </div>

              {/* Full JSON Specification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono uppercase text-zinc-400 font-bold">Full Brief JSON Spec</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedBrief, null, 2), 'json')}
                    className="text-zinc-400 hover:text-white transition cursor-pointer text-[10px] font-bold"
                  >
                    {copiedText === 'json' ? 'Copied!' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 font-mono leading-relaxed overflow-x-auto max-h-[220px]">
                  {JSON.stringify(selectedBrief, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

