import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Share2,
  Download,
  Copy,
  Check,
  Trophy,
  Crown,
  Flame,
  Zap,
  Sparkles,
  Palette,
  Eye,
  X,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { ChallengeEntry } from '../../lib/tuning-challenges';
import { ENV } from '../../lib/envConfig';

export type CardTheme = 'sunset-neon' | 'midnight-gold' | 'ocean-drive' | 'stealth-carbon';
export type CardAspect = 'og' | 'square'; // 1200x630 (1.91:1) or 1080x1080 (1:1)

interface LeaderboardShareCardModalProps {
  entry: ChallengeEntry;
  rank: number;
  totalEntries?: number;
  challengeTitle?: string;
  vehicleName?: string;
  onClose: () => void;
}

export const LeaderboardShareCardModal: React.FC<LeaderboardShareCardModalProps> = ({
  entry,
  rank,
  totalEntries = 1,
  challengeTitle = 'Vice City Tuning Championship',
  vehicleName = 'Custom Handling Spec',
  onClose
}) => {
  const [theme, setTheme] = useState<CardTheme>('sunset-neon');
  const [aspect, setAspect] = useState<CardAspect>('og');
  const [customTagline, setCustomTagline] = useState<string>('Tuned for maximum Leonida performance.');
  const [highDpi, setHighDpi] = useState<boolean>(true);
  const [isCopiedText, setIsCopiedText] = useState<boolean>(false);
  const [isCopiedImage, setIsCopiedImage] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [copyImageSupported, setCopyImageSupported] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check clipboard image support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasClipboardItem = typeof ClipboardItem !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function';
      setCopyImageSupported(!!hasClipboardItem);
    }
  }, []);

  // Determine Rank Metadata
  const getRankInfo = (r: number) => {
    if (r === 1) return { label: 'CHAMPION', subtitle: '1ST PLACE GOLD', color: '#fbbf24', border: '#f59e0b', bg: '#78350f' };
    if (r === 2) return { label: 'RUNNER UP', subtitle: '2ND PLACE SILVER', color: '#e4e4e7', border: '#a1a1aa', bg: '#27272a' };
    if (r === 3) return { label: 'PODIUM', subtitle: '3RD PLACE BRONZE', color: '#f97316', border: '#ea580c', bg: '#431407' };
    return { label: `TOP ${Math.min(r, 100)}`, subtitle: `RANK #${r}`, color: '#f43f5e', border: '#e11d48', bg: '#4c0519' };
  };

  const rankInfo = getRankInfo(rank);

  // Canvas drawing function for 1200x630 OG card
  const drawCardToCanvas = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const scaleFactor = highDpi ? 2 : 1;

      const baseWidth = aspect === 'og' ? 1200 : 1080;
      const baseHeight = aspect === 'og' ? 630 : 1080;

      canvas.width = baseWidth * scaleFactor;
      canvas.height = baseHeight * scaleFactor;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      ctx.save();
      ctx.scale(scaleFactor, scaleFactor);

      const W = baseWidth;
      const H = baseHeight;

      // 1. Background Fill & Gradients based on selected theme
      if (theme === 'sunset-neon') {
        // Deep purple-to-midnight sunset
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#0d021f');
        bgGrad.addColorStop(0.5, '#16082e');
        bgGrad.addColorStop(1, '#05010a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Neon sunset glow orbs
        const glow1 = ctx.createRadialGradient(W * 0.85, H * 0.15, 20, W * 0.85, H * 0.15, 450);
        glow1.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
        glow1.addColorStop(0.5, 'rgba(217, 70, 239, 0.15)');
        glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, W, H);

        const glow2 = ctx.createRadialGradient(W * 0.15, H * 0.85, 30, W * 0.15, H * 0.85, 400);
        glow2.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
        glow2.addColorStop(0.6, 'rgba(59, 130, 246, 0.08)');
        glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, W, H);

        // Retro Synthwave Grid Floor
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.12)';
        ctx.lineWidth = 1;
        const gridYStart = H * 0.65;
        for (let y = gridYStart; y < H; y += 18) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        for (let x = 0; x < W; x += 45) {
          ctx.beginPath();
          ctx.moveTo(W / 2 + (x - W / 2) * 0.2, gridYStart);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
      } else if (theme === 'midnight-gold') {
        // Luxury Obsidian & Gold
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#0a0a0c');
        bgGrad.addColorStop(0.5, '#14120e');
        bgGrad.addColorStop(1, '#050507');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        const glowGold = ctx.createRadialGradient(W * 0.8, H * 0.2, 10, W * 0.8, H * 0.2, 500);
        glowGold.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
        glowGold.addColorStop(0.5, 'rgba(217, 119, 6, 0.1)');
        glowGold.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGold;
        ctx.fillRect(0, 0, W, H);

        // Gold grid accents
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < W; i += 50) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, H);
          ctx.stroke();
        }
      } else if (theme === 'ocean-drive') {
        // Biscayne Bay Turquoise & Electric Blue
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#021824');
        bgGrad.addColorStop(0.5, '#042738');
        bgGrad.addColorStop(1, '#020f18');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        const glowCyan = ctx.createRadialGradient(W * 0.2, H * 0.3, 20, W * 0.2, H * 0.3, 500);
        glowCyan.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        glowCyan.addColorStop(0.5, 'rgba(14, 165, 233, 0.12)');
        glowCyan.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowCyan;
        ctx.fillRect(0, 0, W, H);
      } else {
        // Stealth Carbon
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, W, H);

        // Diagonal carbon fiber lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 2;
        for (let i = -H; i < W + H; i += 12) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + H, H);
          ctx.stroke();
        }

        const glowRed = ctx.createRadialGradient(W * 0.85, H * 0.2, 10, W * 0.85, H * 0.2, 400);
        glowRed.addColorStop(0, 'rgba(225, 29, 72, 0.25)');
        glowRed.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowRed;
        ctx.fillRect(0, 0, W, H);
      }

      // 2. Card Frame & Corner Accents
      const pad = 36;
      ctx.strokeStyle = theme === 'midnight-gold'
        ? 'rgba(245, 158, 11, 0.3)'
        : theme === 'ocean-drive'
        ? 'rgba(6, 182, 212, 0.3)'
        : theme === 'sunset-neon'
        ? 'rgba(244, 63, 94, 0.35)'
        : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;

      // Rounded border rect
      ctx.beginPath();
      ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, 24);
      ctx.stroke();

      // Top Header Bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(pad + 8, pad + 8, W - (pad + 8) * 2, 64, 16);
      ctx.fill();

      // Header Brand Text
      ctx.fillStyle = theme === 'sunset-neon' ? '#f43f5e' : theme === 'midnight-gold' ? '#fbbf24' : '#38bdf8';
      ctx.font = '900 16px "Inter", sans-serif';
      const brandName = (ENV.APP_NAME || 'ViceIntel').toUpperCase();
      ctx.fillText(brandName, pad + 32, pad + 45);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px "Inter", sans-serif';
      const brandOffset = ctx.measureText(brandName).width + 16;
      ctx.fillText('• TUNING CHAMPIONSHIP SERIES', pad + 32 + brandOffset, pad + 45);

      // Verified Physics Badge (Top Right)
      const badgeX = W - pad - 260;
      const badgeY = pad + 24;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, 230, 32, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = '900 11px monospace';
      ctx.fillText('✓ VALIDATED HANDLING.META', badgeX + 16, badgeY + 20);

      // 3. Hero Section: Rank Pill & Build Title
      const contentY = pad + 110;

      // Rank Display Badge
      const isTop3 = rank <= 3;
      const rankColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#e4e4e7' : rank === 3 ? '#fb923c' : '#f43f5e';
      const rankBg = rank === 1 ? 'rgba(245, 158, 11, 0.2)' : rank === 2 ? 'rgba(228, 228, 231, 0.15)' : rank === 3 ? 'rgba(251, 146, 60, 0.15)' : 'rgba(244, 63, 94, 0.15)';
      const rankBorder = rank === 1 ? '#f59e0b' : rank === 2 ? '#a1a1aa' : rank === 3 ? '#ea580c' : '#e11d48';

      ctx.fillStyle = rankBg;
      ctx.strokeStyle = rankBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pad + 30, contentY, 220, 60, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = rankColor;
      ctx.font = '900 28px "Inter", sans-serif';
      ctx.fillText(`RANK #${rank}`, pad + 50, contentY + 41);

      // Subtitle next to rank
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '800 12px "Inter", sans-serif';
      ctx.fillText(rankInfo.subtitle, pad + 270, contentY + 26);

      ctx.fillStyle = '#71717a';
      ctx.font = '600 11px monospace';
      ctx.fillText(`EVENT: ${challengeTitle.toUpperCase()}`, pad + 270, contentY + 46);

      // Build Title (Big Headline)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px "Inter", sans-serif';
      // Truncate if too long
      let displayBuildTitle = entry.buildTitle || 'Custom Handling Spec';
      if (displayBuildTitle.length > 32) {
        displayBuildTitle = displayBuildTitle.substring(0, 30) + '...';
      }
      ctx.fillText(displayBuildTitle, pad + 30, contentY + 115);

      // Tuner & Vehicle Subtitle
      const authorFont = '700 16px "Inter", sans-serif';
      const vipFont = '900 11px "Inter", sans-serif';
      const baseFont = '500 14px "Inter", sans-serif';

      let sanitizedUserName = entry.userName || 'Anonymous';
      if (sanitizedUserName.length > 20) {
        sanitizedUserName = sanitizedUserName.substring(0, 18) + '...';
      }
      const authorText = `Tuned by @${sanitizedUserName}`;

      ctx.font = authorFont;
      ctx.fillStyle = '#e4e4e7';
      ctx.fillText(authorText, pad + 32, contentY + 145);
      
      // Calculate accurate position based on measured author text width
      const authorWidth = ctx.measureText(authorText).width;
      let currentSubtitleX = pad + 32 + authorWidth + 14;

      if (entry.isVip) {
        ctx.font = vipFont;
        const vipText = '👑 VIP TUNER';
        const vipWidth = ctx.measureText(vipText).width;

        // Draw styled badge container pill with safe spacing
        ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(currentSubtitleX, contentY + 128, vipWidth + 18, 24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.fillText(vipText, currentSubtitleX + 9, contentY + 145);
        currentSubtitleX += vipWidth + 18 + 14;
      }

      // Check remaining width to avoid colliding with score box
      const scoreBoxW = 340;
      const scoreBoxH = 130;
      const scoreBoxX = W - pad - scoreBoxW - 30;
      const scoreBoxY = contentY + 20;

      const maxSubtitleRight = scoreBoxX - 20;
      if (currentSubtitleX < maxSubtitleRight) {
        ctx.fillStyle = '#a1a1aa';
        ctx.font = baseFont;
        let baseVehicleText = `• Base: ${vehicleName}`;
        if (currentSubtitleX + ctx.measureText(baseVehicleText).width > maxSubtitleRight) {
          baseVehicleText = `• ${vehicleName}`;
        }
        ctx.fillText(baseVehicleText, currentSubtitleX, contentY + 145);
      }

      // 4. Primary Score Display Box (Right Column or Center-Right)

      // Score Box Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.strokeStyle = theme === 'sunset-neon' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 20);
      ctx.fill();
      ctx.stroke();

      // Metric Header
      ctx.fillStyle = '#9ca3af';
      ctx.font = '800 11px monospace';
      ctx.fillText('QUALIFYING METRIC SCORE', scoreBoxX + 24, scoreBoxY + 34);

      // Metric Big Number
      ctx.fillStyle = theme === 'sunset-neon' ? '#fb7185' : theme === 'midnight-gold' ? '#fde047' : '#38bdf8';
      ctx.font = '900 44px "Inter", monospace';
      ctx.fillText(entry.metricDisplay, scoreBoxX + 24, scoreBoxY + 84);

      // Score points
      ctx.fillStyle = '#6b7280';
      ctx.font = '700 12px monospace';
      ctx.fillText(`INDEX SCORE: ${entry.calculatedScore || 950} / 1000`, scoreBoxX + 24, scoreBoxY + 110);

      // 5. Four Telemetry Pills at Bottom
      const teleY = H - pad - 120;
      const colW = (W - pad * 2 - 60 - 36) / 4;

      const telemetryItems = [
        { label: '0-60 MPH', val: `${entry.telemetry.zeroToSixtySec || '2.84'}s` },
        { label: 'TOP SPEED', val: `${entry.telemetry.estimatedTopSpeedMph || '215'} MPH` },
        { label: '1/4 MILE', val: `${entry.telemetry.quarterMileSec || '10.2'}s` },
        { label: 'DRIVETRAIN', val: `${entry.handlingData.fDriveBiasFront > 0.4 ? 'AWD' : entry.handlingData.fDriveBiasFront === 0 ? 'RWD' : 'FWD'}` }
      ];

      telemetryItems.forEach((item, idx) => {
        const itemX = pad + 30 + idx * (colW + 12);
        ctx.fillStyle = 'rgba(24, 24, 27, 0.7)';
        ctx.strokeStyle = 'rgba(63, 63, 70, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(itemX, teleY, colW, 54, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#71717a';
        ctx.font = '800 9px monospace';
        ctx.fillText(item.label, itemX + 14, teleY + 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 16px "Inter", sans-serif';
        ctx.fillText(item.val, itemX + 14, teleY + 42);
      });

      // 6. Footer Stamp & Watermark
      const footerY = H - pad - 20;
      ctx.fillStyle = '#52525b';
      ctx.font = '600 11px monospace';
      ctx.fillText(`HASH: #${(ENV.APP_NAME || 'VICEINTEL').toUpperCase().replace(/[^A-Z0-9]/g, '')}-TC-${entry.id.substring(0, 8).toUpperCase()} • ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}`, pad + 30, footerY);

      ctx.fillStyle = theme === 'sunset-neon' ? '#f43f5e' : '#38bdf8';
      ctx.font = '700 12px "Inter", sans-serif';
      const cleanBaseDomain = (ENV.APP_URL || 'https://viceintel.app').replace(/^https?:\/\//, '').replace(/\/$/, '');
      const wmText = `${cleanBaseDomain}/challenges`;
      ctx.fillText(wmText, W - pad - 30 - ctx.measureText(wmText).width, footerY);

      ctx.restore();

      const dataUrl = canvas.toDataURL('image/png', 0.95);
      setPreviewDataUrl(dataUrl);
      resolve(dataUrl);
    });
  }, [entry, rank, rankInfo, theme, aspect, highDpi, challengeTitle, vehicleName]);

  // Re-render canvas whenever customization settings change
  useEffect(() => {
    drawCardToCanvas();
  }, [drawCardToCanvas]);

  // Download Generated PNG
  const handleDownload = async () => {
    setIsGenerating(true);
    const dataUrl = await drawCardToCanvas();
    const link = document.createElement('a');
    const safeTitle = (entry.buildTitle || 'build').replace(/[^a-zA-Z0-9]/g, '_');
    const safeBrand = (ENV.APP_NAME || 'ViceIntel').replace(/[^a-zA-Z0-9]/g, '');
    link.download = `${safeBrand}_Rank${rank}_${safeTitle}_TuningCard.png`;
    link.href = dataUrl;
    link.click();
    setIsGenerating(false);
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    try {
      setIsGenerating(true);
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGenerating(false);
          return;
        }
        try {
          if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]);
            setIsCopiedImage(true);
            setTimeout(() => setIsCopiedImage(false), 3000);
          } else {
            // Fallback: download
            handleDownload();
          }
        } catch (err) {
          console.warn('Clipboard image write failed, falling back to download:', err);
          handleDownload();
        } finally {
          setIsGenerating(false);
        }
      }, 'image/png');
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  // Copy Formatted Share Link & Text
  const handleCopyShareText = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ENV.APP_URL;
    const shareUrl = `${origin}?tab=challenges&entry=${entry.id}`;
    const text = `🏆 I ranked #${rank} with my "${entry.buildTitle}" in the ${ENV.APP_NAME} Tuning Championship (${entry.metricDisplay})!\n\nCheck out the handling leaderboard and test your setup: ${shareUrl}`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopiedText(true);
      setTimeout(() => setIsCopiedText(false), 3000);
    });
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ENV.APP_URL;
    const shareUrl = `${origin}?tab=challenges&entry=${entry.id}`;
    const title = `Rank #${rank} in ${ENV.APP_NAME} Tuning Championship — ${entry.buildTitle}`;
    const text = `Check out my #${rank} ranked build "${entry.buildTitle}" (${entry.metricDisplay}) on ${ENV.APP_NAME}!`;

    if (navigator.share) {
      try {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.toBlob(async (blob) => {
            if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'tuning_card.png', { type: 'image/png' })] })) {
              const safeBrand = (ENV.APP_NAME || 'ViceIntel').replace(/[^a-zA-Z0-9]/g, '');
              const file = new File([blob], `${safeBrand}_Rank${rank}_TuningCard.png`, { type: 'image/png' });
              await navigator.share({
                title,
                text,
                url: shareUrl,
                files: [file]
              });
            } else {
              await navigator.share({ title, text, url: shareUrl });
            }
          });
        } else {
          await navigator.share({ title, text, url: shareUrl });
        }
      } catch (err) {
        console.warn('Native share aborted or failed:', err);
      }
    } else {
      handleCopyShareText();
    }
  };

  // Social Intent Links
  const getTwitterShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ENV.APP_URL;
    const shareUrl = `${origin}?tab=challenges`;
    const text = `🏆 Ranked #${rank} in the ${ENV.APP_NAME} Tuning Championship with my "${entry.buildTitle}" (${entry.metricDisplay})!\n\nCan you beat my time?`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  };

  const getRedditShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ENV.APP_URL;
    const shareUrl = `${origin}?tab=challenges`;
    const title = `Rank #${rank} in the ${ENV.APP_NAME} Tuning Championship with my ${entry.buildTitle} (${entry.metricDisplay})`;
    return `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-4xl w-full p-4 sm:p-7 space-y-6 shadow-2xl relative my-auto">
        {/* Hidden Canvas Element for Rendering */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Share2 className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">Social Media Card Generator</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Rank #{rank} Podium Exclusive
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  OpenGraph (1200x630)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Generate and download high-resolution share cards for Twitter/X, Discord, and Instagram.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Live Preview Container */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" /> Live Preview
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {aspect === 'og' ? '1200 x 630 px (1.91:1 standard OG card)' : '1080 x 1080 px (1:1 square card)'}
            </span>
          </div>

          <div className="bg-zinc-900/90 p-3 sm:p-4 rounded-2xl border border-zinc-800/80 flex items-center justify-center overflow-hidden">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="OpenGraph Share Preview"
                className="rounded-xl shadow-2xl border border-zinc-800 max-h-[320px] w-auto object-contain hover:scale-[1.01] transition-transform"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-zinc-500 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-xs">Generating preview...</span>
              </div>
            )}
          </div>
        </div>

        {/* Customization Options Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/60 text-xs">
          {/* Theme Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-rose-400" /> Visual Theme
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'sunset-neon' as CardTheme, label: 'Sunset Neon' },
                { id: 'midnight-gold' as CardTheme, label: 'Midnight Gold' },
                { id: 'ocean-drive' as CardTheme, label: 'Ocean Drive' },
                { id: 'stealth-carbon' as CardTheme, label: 'Stealth Carbon' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition text-left cursor-pointer border ${
                    theme === t.id
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setAspect('og')}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  aspect === 'og'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                1.91:1 (Twitter/OG)
              </button>
              <button
                type="button"
                onClick={() => setAspect('square')}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  aspect === 'square'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                1:1 (Square Post)
              </button>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>Ultra HD Retina (2x):</span>
              <button
                type="button"
                onClick={() => setHighDpi(!highDpi)}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                  highDpi ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {highDpi ? 'Enabled (2400px)' : 'Disabled (1200px)'}
              </button>
            </div>
          </div>

          {/* Direct Social Links */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="font-bold text-zinc-300 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" /> 1-Click Share
            </label>
            <div className="flex flex-wrap gap-2">
              <a
                href={getTwitterShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl font-bold text-center transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>X / Twitter</span>
              </a>
              <a
                href={getRedditShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 rounded-xl font-bold text-center transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Reddit</span>
              </a>
            </div>
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3 h-3 text-rose-400" />
              <span>More Share Apps...</span>
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleCopyShareText}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-800 transition flex items-center gap-2 cursor-pointer"
          >
            {isCopiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            <span>{isCopiedText ? 'Link Copied to Clipboard!' : 'Copy Share Link'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            {copyImageSupported && (
              <button
                type="button"
                onClick={handleCopyImage}
                disabled={isGenerating}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCopiedImage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{isCopiedImage ? 'Image Copied!' : 'Copy Image to Clipboard'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-zinc-950 font-black text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Rendering HD PNG...' : 'Download OpenGraph PNG'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
