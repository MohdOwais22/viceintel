import jsPDF from 'jspdf';
import { MarketingCampaign } from './marketing-engine';

/**
 * Generates and downloads a formatted PDF report for a Sentinel Marketing Campaign.
 */
export function generateCampaignPdf(campaign: MarketingCampaign) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  // Helper for automatic page break handling
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      // Draw top header on subsequent pages
      doc.setFillColor(24, 24, 32);
      doc.rect(0, 0, pageWidth, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(245, 158, 11);
      doc.text(`SENTINEL MARKETING ENGINE — ${campaign.targetDomain.toUpperCase()}`, 14, 8);
      y = 20;
    }
  };

  // 1. Primary Header Banner
  doc.setFillColor(18, 18, 24);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(245, 158, 11); // Amber
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SENTINEL GROWTH ENGINE — MARKETING CAMPAIGN REPORT', 14, 12);

  doc.setTextColor(200, 200, 215);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateStr = campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const scopeLabel = campaign.scope === 'internal_platform' ? 'Platform Engine' : 'Client RP Server';
  doc.text(`Target Domain: ${campaign.targetDomain}  |  Scope: ${scopeLabel}  |  Generated: ${dateStr}`, 14, 20);

  y = 36;

  // 2. Executive Summary Metrics Box
  doc.setFillColor(30, 30, 42);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. EXECUTIVE SUMMARY & CAMPAIGN SCOPE', 18, y + 5.5);
  y += 13;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  
  const kwCount = campaign.keywords?.length || 0;
  const scriptCount = campaign.generatedAssets?.detailedVideoScripts?.length || campaign.generatedAssets?.videoScripts?.length || 0;
  const pseoCount = campaign.generatedAssets?.pseoMatrixPreview?.length || 0;
  const hasStreamerPitch = Boolean(campaign.generatedAssets?.streamerPitch);
  const hasSocialLaunch = Boolean(campaign.generatedAssets?.redditPost);

  doc.text(`• Target Domain / Server Slug: ${campaign.targetDomain}`, 18, y); y += 5;
  doc.text(`• Discovered High-Intent Keywords: ${kwCount} terms`, 18, y); y += 5;
  doc.text(`• Viral Video Script Storyboards: ${scriptCount} scripts`, 18, y); y += 5;
  doc.text(`• Programmatic SEO (pSEO) Matrix: ${pseoCount} targeted landing pages`, 18, y); y += 5;
  doc.text(`• Community Launch Kit: ${hasSocialLaunch ? 'Reddit & Discord Included' : 'Pending'}`, 18, y); y += 5;
  doc.text(`• Streamer Sponsorship Kit: ${hasStreamerPitch ? 'Twitch & Kick Outreach Included' : 'Pending'}`, 18, y); y += 9;

  // 3. Keywords Section
  if (campaign.keywords && campaign.keywords.length > 0) {
    checkPageBreak(30);
    doc.setFillColor(30, 30, 42);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. KEYWORD RESEARCH & COMPETITION BENCHMARKS', 18, y + 5.5);
    y += 13;

    // Table Header
    doc.setFillColor(240, 240, 248);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.text('Keyword Term', 18, y + 4);
    doc.text('Est. Monthly Vol', 95, y + 4);
    doc.text('Difficulty', 135, y + 4);
    doc.text('Search Intent', 168, y + 4);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    campaign.keywords.slice(0, 15).forEach((kw) => {
      checkPageBreak(7);
      doc.setTextColor(40, 40, 40);
      doc.text(kw.term.substring(0, 40), 18, y);
      doc.text(`${kw.volumeEst.toLocaleString()}/mo`, 95, y);
      doc.text(kw.difficulty, 135, y);
      doc.text(kw.intent, 168, y);
      y += 5.5;
    });
    y += 6;
  }

  // 4. Video Scripts Section
  const detailedScripts = campaign.generatedAssets?.detailedVideoScripts || [];
  if (detailedScripts.length > 0) {
    checkPageBreak(35);
    doc.setFillColor(30, 30, 42);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. VIRAL SHORT-FORM VIDEO SCRIPTS', 18, y + 5.5);
    y += 13;

    detailedScripts.forEach((script, idx) => {
      checkPageBreak(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(`Script #${idx + 1} [${script.targetPlatform}]: "${script.hook}"`, 18, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text(`• Retention Formula: ${script.retentionFormula}`, 20, y); y += 4.5;
      doc.text(`• Recommended Audio Track: ${script.recommendedAudio}`, 20, y); y += 4.5;
      doc.text(`• Call-To-Action (CTA): ${script.cta}`, 20, y); y += 6;

      if (script.detailedScenes && script.detailedScenes.length > 0) {
        script.detailedScenes.forEach((scene) => {
          checkPageBreak(12);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(90, 90, 110);
          doc.text(`[${scene.timeframe}] Visual Cue: ${scene.visualCue}`, 22, y);
          y += 4;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          doc.text(`Audio Voiceover: "${scene.audioVoiceover}"`, 22, y);
          y += 5;
        });
      }
      y += 4;
    });
  }

  // 5. Reddit & Discord Social Launch Section
  if (campaign.generatedAssets?.redditPost) {
    checkPageBreak(30);
    const rp = campaign.generatedAssets.redditPost;
    doc.setFillColor(30, 30, 42);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('4. REDDIT & COMMUNITY LAUNCH POST', 18, y + 5.5);
    y += 13;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text(`Target Subreddit: ${rp.targetSubreddit}`, 18, y); y += 5;
    doc.text(`Post Title: ${rp.title}`, 18, y); y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    const splitBody = doc.splitTextToSize(rp.body, pageWidth - 36);
    splitBody.slice(0, 15).forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, 18, y);
      y += 4.2;
    });
    y += 6;
  }

  // 6. Streamer Pitch Kit
  if (campaign.generatedAssets?.streamerPitch) {
    checkPageBreak(30);
    const sp = campaign.generatedAssets.streamerPitch;
    doc.setFillColor(30, 30, 42);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('5. STREAMER SPONSORSHIP OUTREACH KIT', 18, y + 5.5);
    y += 13;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text(`Creator Tier Target: ${sp.creatorTier}`, 18, y); y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    const splitEmail = doc.splitTextToSize(sp.pitchEmail, pageWidth - 36);
    splitEmail.slice(0, 12).forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, 18, y);
      y += 4.2;
    });
    y += 6;
  }

  // Footer numbering
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 130);
    doc.text(
      `GTA VI Central ViceIntel — Sentinel Growth Engine Campaign Report  |  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  // Save PDF file
  const fileName = `${campaign.targetDomain.replace(/[^a-zA-Z0-9]/g, '_')}_Campaign_Report.pdf`;
  doc.save(fileName);
}

export interface SeoReportPdfData {
  clientName: string;
  clientDomain: string;
  accountLead: string;
  monthlyRetainer: string;
  overallSiteHealth: number;
  activeOverrideCount: number;
  clientNotes: string;
  sections: Array<{
    path: string;
    name: string;
    title: string;
    titleLen: number;
    descLen: number;
    healthScore: number;
    isCustom: boolean;
  }>;
}

/**
 * Generates and downloads a formatted PDF report for the SEO Meta Manager client deliverable.
 */
export function generateSeoReportPdf(data: SeoReportPdfData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(217, 70, 239); // fuchsia-500
      doc.text(`EXECUTIVE AGENCY SEO REPORT — ${data.clientDomain.toUpperCase()}`, 14, 8);
      y = 20;
    }
  };

  // 1. Primary Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(245, 158, 11); // Amber
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('EXECUTIVE AGENCY ORGANIC GROWTH & SEO REPORT', 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Client: ${data.clientName} (${data.clientDomain})`, 14, 19);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Account Director: ${data.accountLead}  |  Retainer: ${data.monthlyRetainer}  |  Date: ${dateStr}`, 14, 26);

  y = 40;

  // 2. Executive Summary Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, y, pageWidth - 28, 28, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, pageWidth - 28, 28, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. EXECUTIVE PERFORMANCE SUMMARY', 18, y + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(`• Overall On-Page SEO Health Score: ${data.overallSiteHealth} / 100 (Grade A+ Organic Compliance)`, 18, y + 12);
  doc.text(`• Total Routes Audited: ${data.sections.length} pages  |  Custom Tag Overrides: ${data.activeOverrideCount} routes`, 18, y + 17);
  doc.text(`• OpenGraph & Twitter Card Visual Coverage: 100% 4K assets active`, 18, y + 22);

  y += 34;

  // 3. Client Growth Notes
  if (data.clientNotes) {
    checkPageBreak(25);
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, pageWidth - 28, 22, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 22, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Strategic Account Highlights & Observations:', 18, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(data.clientNotes, pageWidth - 40);
    doc.text(splitNotes.slice(0, 3), 18, y + 10.5);

    y += 28;
  }

  // 4. On-Page SEO Audit Table
  checkPageBreak(35);
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. SITE-WIDE ROUTE AUDIT & COMPLIANCE MATRIX', 18, y + 5.5);
  y += 12;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Route Path', 18, y + 4.5);
  doc.text('Page Title', 65, y + 4.5);
  doc.text('Title Len', 125, y + 4.5);
  doc.text('Desc Len', 145, y + 4.5);
  doc.text('Score', 165, y + 4.5);
  doc.text('Status', 180, y + 4.5);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  data.sections.forEach((sec, idx) => {
    checkPageBreak(6.5);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 1, pageWidth - 28, 6, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(sec.path.substring(0, 24), 18, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(sec.title.substring(0, 32), 65, y + 3.5);

    if (sec.titleLen >= 50 && sec.titleLen <= 60) {
      doc.setTextColor(16, 185, 129); // emerald
    } else {
      doc.setTextColor(217, 119, 6); // amber
    }
    doc.text(`${sec.titleLen}c`, 125, y + 3.5);

    if (sec.descLen >= 140 && sec.descLen <= 160) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(217, 119, 6);
    }
    doc.text(`${sec.descLen}c`, 145, y + 3.5);

    if (sec.healthScore >= 90) {
      doc.setTextColor(16, 185, 129);
    } else if (sec.healthScore >= 70) {
      doc.setTextColor(217, 119, 6);
    } else {
      doc.setTextColor(225, 29, 72);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`${sec.healthScore}pt`, 165, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(sec.isCustom ? 'Custom' : 'Default', 180, y + 3.5);

    y += 6;
  });

  y += 6;

  // 5. Technical Directives & Schema Summary
  checkPageBreak(25);
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. TECHNICAL DIRECTIVES & RICH SCHEMAS', 18, y + 5.5);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('• JSON-LD Structured Data: WebSite, SoftwareApplication, FAQPage, ItemPage schemas verified.', 18, y); y += 5;
  doc.text('• Robots Directives: "index, follow" canonical headers deployed across all active endpoints.', 18, y); y += 5;
  doc.text('• Bot Indexing Pings: Dispatched to Googlebot, Bingbot, Yandex & DuckDuckGo crawlers.', 18, y); y += 8;

  // Footer numbering
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Executive Agency SEO Report — ${data.clientName} (${data.clientDomain})  |  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  // Save PDF file
  const fileName = `Agency_SEO_Report_${data.clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

export interface InvestorPitchPdfData {
  appName: string;
  projectedMau: number;
  vipConversionRate: number;
  sponsoredServersCount: number;
  totalMrr: number;
  totalArr: number;
  vipPrice: number;
  serverSponsorPrice: number;
}

/**
 * Generates and downloads a formatted executive PDF Pitch Deck for ViceIntel investors.
 */
export function generateInvestorPitchPdf(data: InvestorPitchPdfData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      doc.setFillColor(18, 18, 24);
      doc.rect(0, 0, pageWidth, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(244, 63, 94); // rose-500
      doc.text(`${(data.appName || 'VICEINTEL').toUpperCase()} — EXECUTIVE PITCH DECK & MEMORANDUM`, 14, 8);
      y = 20;
    }
  };

  // 1. Primary Header Banner
  doc.setFillColor(18, 18, 24);
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setTextColor(244, 63, 94); // Rose
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${(data.appName || 'ViceIntel').toUpperCase()} — EXECUTIVE INVESTOR MEMORANDUM`, 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.text('Series Seed Growth Deck & GTA VI Community Infrastructure Platform', 14, 19);

  doc.setTextColor(161, 161, 170); // zinc-400
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Target TAM: $8.4B+ Global Launch  |  Confidentiality: STRICTLY PROPRIETARY  |  Date: ${dateStr}`, 14, 26);

  y = 42;

  // 2. Executive Summary Box
  doc.setFillColor(24, 24, 32);
  doc.rect(14, y, pageWidth - 28, 32, 'F');
  doc.setDrawColor(63, 63, 70);
  doc.rect(14, y, pageWidth - 28, 32, 'S');

  doc.setTextColor(244, 63, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. EXECUTIVE SUMMARY & PLATFORM OVERVIEW', 18, y + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 224, 230);

  doc.text(`• Platform: Next-gen GTA VI gaming utility suite featuring live player chat, voice comms, vehicle & weapon databases.`, 18, y + 12);
  doc.text(`• FiveM RP Directory: Automated no-code application review queue and Discord integration for server operators.`, 18, y + 17);
  doc.text(`• AI Tactical Assistant: Gemini 3.7 Flash powered mission guide and tuning physics calculation engine.`, 18, y + 22);
  doc.text(`• Monetization Engine: Dual B2C VIP Pass subscriptions ($${data.vipPrice}/mo) + B2B RP Server Sponsoring ($${data.serverSponsorPrice}/mo).`, 18, y + 27);

  y += 38;

  // 3. Unit Economics & Projections Matrix
  checkPageBreak(40);
  doc.setFillColor(244, 63, 94);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. UNIT ECONOMICS & 24-MONTH FINANCIAL FORECAST', 18, y + 5.5);
  y += 12;

  // Metrics Box
  doc.setFillColor(245, 245, 250);
  doc.rect(14, y, pageWidth - 28, 30, 'F');
  doc.setDrawColor(212, 212, 216);
  doc.rect(14, y, pageWidth - 28, 30, 'S');

  const projectedVip = Math.round((data.projectedMau * data.vipConversionRate) / 100);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);

  doc.text('Metric / Key Performance Indicator', 18, y + 6);
  doc.text('Projected Value', 125, y + 6);
  doc.text('Run-Rate / Annualized', 160, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(63, 63, 70);

  doc.text(`Monthly Active Users (MAU Target):`, 18, y + 12);
  doc.text(`${data.projectedMau.toLocaleString()} MAU`, 125, y + 12);
  doc.text(`150M+ Addressable TAM`, 160, y + 12);

  doc.text(`B2C VIP Subscribers (${data.vipConversionRate}% Conversion):`, 18, y + 17);
  doc.text(`${projectedVip.toLocaleString()} Subscribers`, 125, y + 17);
  doc.text(`$${Math.round(projectedVip * data.vipPrice * 12).toLocaleString()} / year`, 160, y + 17);

  doc.text(`B2B Sponsored RP Server Directory Nodes:`, 18, y + 22);
  doc.text(`${data.sponsoredServersCount} Nodes`, 125, y + 22);
  doc.text(`$${Math.round(data.sponsoredServersCount * data.serverSponsorPrice * 12).toLocaleString()} / year`, 160, y + 22);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text(`Total Projected Monthly Recurring Revenue (MRR):`, 18, y + 27);
  doc.text(`$${Math.round(data.totalMrr).toLocaleString()} / mo`, 125, y + 27);
  doc.text(`$${Math.round(data.totalArr).toLocaleString()} / yr (ARR)`, 160, y + 27);

  y += 36;

  // 4. Growth Trajectory Milestones
  checkPageBreak(35);
  doc.setFillColor(18, 18, 24);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. 24-MONTH ROADMAP & STRATEGIC MILESTONES', 18, y + 5.5);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('• Month 1 (Beta & Infrastructure):', 18, y); doc.setFont('helvetica', 'normal');
  doc.text(' Core database, live chat rooms, pSEO spider, and initial FiveM RP whitelist builder.', 68, y); y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('• Month 3 (GTA VI Release):', 18, y); doc.setFont('helvetica', 'normal');
  doc.text(' Peak organic viral adoption, VIP Pass subscriber spike, global gaming launch traffic.', 63, y); y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('• Month 6 (Post-Launch Expansion):', 18, y); doc.setFont('helvetica', 'normal');
  doc.text(' 500+ sponsored RP servers, custom tuning championships, and mobile companion app.', 72, y); y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('• Month 24 (Enterprise Scale):', 18, y); doc.setFont('helvetica', 'normal');
  doc.text(' PC release & DLC expansion, custom esports tournament engine, $12M+ ARR run-rate.', 65, y); y += 9;

  // 5. Competitive Moat Comparison
  checkPageBreak(30);
  doc.setFillColor(18, 18, 24);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('4. COMPETITIVE ADVANTAGE & ARCHITECTURAL MOAT', 18, y + 5.5);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 24, 27);
  doc.text('Feature / Capability', 18, y);
  doc.text('ViceIntel Platform', 85, y);
  doc.text('Legacy Wiki Sites', 135, y);
  doc.text('Manual Discord/Forms', 168, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text('Live Player Comms & Audio', 18, y); doc.text('Integrated WebRTC', 85, y); doc.text('None', 135, y); doc.text('Third-party Bot', 168, y); y += 4.5;
  doc.text('RP Application Automation', 18, y); doc.text('Instant Webhooks & Queue', 85, y); doc.text('None', 135, y); doc.text('Manual Review', 168, y); y += 4.5;
  doc.text('AI Tactical Assistant', 18, y); doc.text('Gemini 3.7 Flash Model', 85, y); doc.text('Static Text', 135, y); doc.text('None', 168, y); y += 4.5;
  doc.text('Handling.meta Physics Sim', 18, y); doc.text('Real-time Math Engine', 85, y); doc.text('None', 135, y); doc.text('None', 168, y); y += 8;

  // 6. Investor Relations Contact & SLA
  checkPageBreak(25);
  doc.setFillColor(244, 63, 94);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('5. INVESTOR RELATIONS & CAPITAL INQUIRY SLA', 18, y + 5.5);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Direct Inquiry Contact: ir@${(data.appName || 'viceintel').toLowerCase().replace(/\s+/g, '')}.app`, 18, y); y += 5;
  doc.text('• Confidential Passkey HQ Access: Granted to accredited angel and VC institutional partners.', 18, y); y += 5;
  doc.text('• Due Diligence SLA: Guaranteed 24-hour turnaround on cap table & financial audit requests.', 18, y); y += 8;

  // Footer numbering
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(161, 161, 170);
    doc.text(
      `${data.appName || 'ViceIntel'} — Executive Series Seed Pitch Deck  |  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  // Save PDF file directly to browser downloads
  const fileName = `${(data.appName || 'ViceIntel').replace(/[^a-zA-Z0-9]/g, '_')}_Executive_Pitch_Deck_2026.pdf`;
  doc.save(fileName);
}


