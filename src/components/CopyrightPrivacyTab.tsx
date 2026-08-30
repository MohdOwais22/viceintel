'use client';

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  FileText,
  AlertTriangle,
  Mail,
  CheckCircle2,
  ExternalLink,
  Copy,
  Search,
  Scale,
  Database,
  EyeOff,
  UserCheck,
  CreditCard,
  Flame,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { copyToClipboard } from '../lib/copyUtils';
import { ENV } from '../lib/envConfig';

interface CopyrightPrivacyTabProps {
  initialSection?: string;
  onNavigate?: (tab: string) => void;
}

export const CopyrightPrivacyTab: React.FC<CopyrightPrivacyTabProps> = ({
  initialSection = 'trademark',
  onNavigate
}) => {
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // DMCA / Legal Inquiry Form State
  const [dmcaFullName, setDmcaFullName] = useState<string>('');
  const [dmcaCompany, setDmcaCompany] = useState<string>('');
  const [dmcaEmail, setDmcaEmail] = useState<string>('');
  const [dmcaCategory, setDmcaCategory] = useState<string>('copyright');
  const [dmcaDetails, setDmcaDetails] = useState<string>('');
  const [dmcaUrgent, setDmcaUrgent] = useState<boolean>(false);
  const [dmcaSubmittedTicket, setDmcaSubmittedTicket] = useState<string | null>(null);

  const sections = [
    { id: 'trademark', label: 'Trademark & IP Disclaimer', icon: Shield, badge: 'Crucial' },
    { id: 'fairuse', label: 'Fair Use & Non-Commercial Notice', icon: Scale, badge: 'Policy' },
    { id: 'dmca', label: 'DMCA Takedown Procedures', icon: FileText, badge: 'Legal' },
    { id: 'privacy', label: 'Privacy Policy & User Data', icon: Lock, badge: 'GDPR / CCPA' },
    { id: 'cookies', label: 'Cookies & Offline Storage', icon: Database, badge: 'Security' },
    { id: 'terms', label: 'Terms of Service & Conduct', icon: UserCheck, badge: 'Standards' },
    { id: 'vip-disclaimer', label: 'VIP Pass & Virtual Currency', icon: CreditCard, badge: 'Financial' },
    { id: 'inquiry-form', label: 'Submit Legal Inquiry', icon: Mail, badge: 'Direct Desk' }
  ];

  const handleCopyPageUrl = async () => {
    const url = window.location.origin + '/privacy';
    await copyToClipboard(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleDmcaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = `VICE-LEGAL-${Math.floor(100000 + Math.random() * 900000)}`;
    setDmcaSubmittedTicket(ticketId);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: 'Is ViceIntel endorsed or authorized by Rockstar Games or Take-Two Interactive?',
      a: 'No. ViceIntel is an entirely independent, non-commercial fan-created utility and knowledge base. We have no direct or indirect affiliation, sponsorship, endorsement, or commercial partnership with Rockstar Games, Rockstar North, Take-Two Interactive Software, Inc., or any of their parent or subsidiary entities.'
    },
    {
      q: 'Does ViceIntel distribute leaked game code, developer builds, or piracy cracks?',
      a: 'Strictly NO. ViceIntel explicitly prohibits the distribution, hosting, or linking of unauthorized binary builds, game source code, decrypted asset files, or piracy tools. All guides, weapon stats, vehicle handling metrics, and map markers are derived from public gameplay trailers, official newswires, community reverse-engineering research, and mathematical simulations.'
    },
    {
      q: 'How does ViceIntel handle player personal data and authentication?',
      a: 'We implement Google Firebase Authentication with industry-standard encryption. We collect only what is strictly necessary to maintain your player profile (GamerTag, optional avatar, email for authentication, and saved vehicle builds). We NEVER sell, lease, or monetize your personal information or distribute it to third-party data brokers.'
    },
    {
      q: 'Can Vice Credits (VC) or VIP Passes be exchanged for real money?',
      a: 'No. Vice Credits (VC) are purely virtual community utility points utilized within the companion portal for custom profile titles, leaderboard challenge entries, and badge unlocks. VC points hold zero real-world cash value, cannot be converted to fiat currency, and are non-transferable outside the applet.'
    },
    {
      q: 'How quickly does ViceIntel respond to DMCA copyright takedown notices?',
      a: 'Our designated legal compliance team reviews and processes formal DMCA notices or intellectual property inquiries within 24 to 48 business hours upon receipt of a complete statutory notice.'
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 pb-20 pt-4 font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden border-b border-zinc-800/80 bg-zinc-900/50 py-12 px-4 sm:px-6 lg:px-8">
        {/* Glow ambient effects */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-rose-400 uppercase bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Official Legal & Intellectual Property Center</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/80 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Last Updated: August 2026</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Compliance Status: Active
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Copyright, Trademark & Privacy Policy</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
              Transparency, intellectual property protection, non-commercial fan fair use doctrine, and rigorous data privacy compliance for the ViceIntel player utility suite.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800/60">
            {/* Search within legal text */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search legal clauses, DMCA, GDPR..."
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rose-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPageUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                title="Copy policy URL link"
              >
                {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copiedUrl ? 'Copied Link' : 'Share Policy'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveSection('inquiry-form');
                  const el = document.getElementById('inquiry-form');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white transition shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Legal Desk</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* STICKY SIDEBAR NAVIGATION */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-3 bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-2 pb-1">
              Table of Contents
            </div>
            <nav className="space-y-1">
              {sections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setActiveSection(sec.id);
                      const el = document.getElementById(sec.id);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition group cursor-pointer ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-black'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-rose-400'}`} />
                      <span className="truncate">{sec.label}</span>
                    </div>
                    {sec.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          isActive
                            ? 'bg-rose-700/80 text-rose-100'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                        }`}
                      >
                        {sec.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Summary Box */}
            <div className="pt-4 mt-4 border-t border-zinc-800/80 space-y-2">
              <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Emergency Compliance Desk</div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                For urgent trademark takedowns or statutory DMCA inquiries:
              </p>
              <div className="text-[11px] font-mono font-bold text-rose-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                legal@{ENV.APP_URL ? new URL(ENV.APP_URL).hostname : 'viceintel.app'}
              </div>
            </div>
          </div>

          {/* MAIN ARTICLES / SECTIONS COLUMN */}
          <div className="lg:col-span-3 space-y-10">
            {/* SECTION 1: TRADEMARK & INTELLECTUAL PROPERTY DISCLAIMER */}
            <section id="trademark" className="scroll-mt-24 space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />

                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      1. Trademark & Intellectual Property Rights Notice
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Affiliation Disclaimers & Proprietary Asset Acknowledgements
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 leading-relaxed font-sans space-y-2">
                  <div className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-300 text-[11px]">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Non-Commercial Fan Utility Acknowledgement</span>
                  </div>
                  <p>
                    <strong>{ENV.APP_NAME}</strong> (operating under <em>{ENV.APP_URL ? new URL(ENV.APP_URL).hostname : 'viceintel.app'}</em> and associated subdomains) is an independent, community-maintained, non-commercial fan encyclopedia and gaming utility portal.
                  </p>
                  <p className="font-semibold text-white">
                    This project is NOT sponsored by, authorized by, affiliated with, endorsed by, or in any way officially associated with Rockstar Games, Rockstar North, Take-Two Interactive Software, Inc., or any of their respective subsidiaries, parent corporations, or affiliates.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                  <p>
                    <strong>Grand Theft Auto</strong>, <strong>GTA</strong>, <strong>GTA VI</strong>, <strong>GTA 6</strong>, <strong>Vice City</strong>, <strong>Leonida</strong>, <strong>Rockstar Games</strong>, the <strong>Rockstar Games R* Logo</strong>, the <strong>Take-Two Interactive Logo</strong>, and all associated vehicle names, character likenesses, logos, fictional brand parodies, voice recordings, soundtrack artwork, and in-game imagery are registered trademarks, trade dress, or copyrights owned exclusively by <strong>Take-Two Interactive Software, Inc.</strong> and its licensors.
                  </p>
                  <p>
                    All in-game intellectual property referenced throughout this application—including vehicle designations (e.g., <em>Pegassi Ignus</em>, <em>Grotti Turismo</em>, <em>Banshee GTS</em>), weapons (e.g., <em>Tactical SMG</em>, <em>Heavy Sniper</em>), and geographic districts (e.g., <em>Ocean Beach</em>, <em>Grassriver</em>, <em>Biscayne Bay</em>)—are utilized strictly for identification, statistical cataloging, telemetry simulation, and comparative analysis purposes.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 2: FAIR USE & NON-COMMERCIAL STATUS */}
            <section id="fairuse" className="scroll-mt-24 space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      2. Fair Use Doctrine & Educational Purpose
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Application of 17 U.S.C. § 107 and Non-Infringing Community Scope
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                  <p>
                    The publication and mathematical presentation of vehicle physics telemetry, weapon damage-over-distance curves, time-to-kill (TTK) charts, real estate yield models, and interactive map coordinate visualizers constitute transformative non-commercial fan commentary, player education, and statistical research.
                  </p>
                  <p>
                    Under <strong>Section 107 of the United States Copyright Act (17 U.S.C. § 107)</strong> and reciprocal international fair dealing conventions:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                    <li>
                      <strong className="text-zinc-200">Transformative Purpose:</strong> Raw telemetry calculations, handling.meta curves, and business ROI formulas represent independently generated mathematical models and custom visualizers designed to assist players in understanding video game mechanics.
                    </li>
                    <li>
                      <strong className="text-zinc-200">No Asset Gatekeeping:</strong> ViceIntel does not sell, license, or charge for access to proprietary game files, raw texture packs, 3D meshes, or audio files.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Zero Piracy Policy:</strong> We strictly forbid the hosting, distribution, or promotion of cracked game executables, unauthorized ROMs, developer leaks, or bypassing of DRM (Digital Rights Management) technologies.
                    </li>
                    <li>
                      <strong className="text-zinc-200">No Market Substitution:</strong> This utility suite is a companion guide and cannot in any way substitute for the purchase or gameplay experience of the official Grand Theft Auto VI software published by Rockstar Games.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECTION 3: DMCA TAKEDOWN PROCEDURE */}
            <section id="dmca" className="scroll-mt-24 space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      3. DMCA Copyright Takedown Procedure
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Digital Millennium Copyright Act Compliance (17 U.S.C. § 512)
                    </p>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  ViceIntel respects the intellectual property rights of creators and copyright holders. In accordance with the Digital Millennium Copyright Act (DMCA), we maintain a swift notice-and-takedown procedure for any verified infringing material reported on our servers or user-generated community channels.
                </p>

                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800/80 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Statutory Requirements for Formal DMCA Notice
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    To file a valid copyright infringement notification with our designated agent, please provide written communication containing the following elements:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs text-zinc-300 font-sans">
                    <li>A physical or electronic signature of a person authorized to act on behalf of the owner of the copyrighted work.</li>
                    <li>Identification of the copyrighted work claimed to have been infringed.</li>
                    <li>Specific identification of the material claimed to be infringing, including direct URLs or database IDs.</li>
                    <li>Adequate contact information (full legal name, physical address, telephone number, and official email).</li>
                    <li>A statement that the complaining party has a good faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.</li>
                    <li>A statement, under penalty of perjury, that the information in the notification is accurate and that the complaining party is authorized to act on behalf of the owner.</li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white">Designated DMCA Compliance Agent</div>
                    <div className="text-xs font-mono text-zinc-400">ViceIntel Legal & Compliance Operations</div>
                    <div className="text-xs font-mono text-rose-400">Email: legal@viceintel.app</div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveSection('inquiry-form');
                      const el = document.getElementById('inquiry-form');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-rose-400" />
                    <span>Open Interactive DMCA Form</span>
                  </button>
                </div>
              </div>
            </section>

            {/* SECTION 4: PRIVACY POLICY & USER DATA */}
            <section id="privacy" className="scroll-mt-24 space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      4. Privacy Policy & Data Protection
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      GDPR, CCPA & Global Player Data Safeguards
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Data We Collect */}
                  <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                      <UserCheck className="w-4 h-4" />
                      <span>Data We Collect</span>
                    </div>
                    <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4 leading-relaxed">
                      <li>
                        <strong className="text-zinc-300">Account Credentials:</strong> Email address, unique GamerTag, and chosen GTA VI avatar icon via Firebase Auth.
                      </li>
                      <li>
                        <strong className="text-zinc-300">Player Submissions:</strong> Custom vehicle setups, handling.meta tuning presets, and public community chat messages.
                      </li>
                      <li>
                        <strong className="text-zinc-300">Discord OAuth Identity:</strong> Optional Discord ID and username for RP server whitelist synchronization.
                      </li>
                      <li>
                        <strong className="text-zinc-300">Technical Logs:</strong> Anonymized error diagnostics and bug report screenshots submitted voluntarily.
                      </li>
                    </ul>
                  </div>

                  {/* Data We NEVER Collect */}
                  <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                      <EyeOff className="w-4 h-4" />
                      <span>Data We NEVER Sell or Store</span>
                    </div>
                    <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4 leading-relaxed">
                      <li>
                        <strong className="text-zinc-300">No Raw Payment Data:</strong> Credit card numbers, CVVs, and banking details are processed directly by Stripe PCI-DSS Level 1 infrastructure.
                      </li>
                      <li>
                        <strong className="text-zinc-300">No Third-Party Data Selling:</strong> We do not sell, rent, or trade player email lists or habits to ad brokers or telemetry aggregators.
                      </li>
                      <li>
                        <strong className="text-zinc-300">No Invasive Cross-Site Tracking:</strong> We do not track your activity across unrelated websites.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 leading-relaxed pt-2">
                  <h4 className="font-bold text-white text-sm">Your Privacy Rights (GDPR & CCPA)</h4>
                  <p>
                    Regardless of your geographic jurisdiction, every player using ViceIntel possesses the following enforceable rights:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center space-y-1">
                      <span className="text-xs font-black text-white block">Right of Access</span>
                      <span className="text-[11px] text-zinc-400">Request a full copy of your stored profile and builds.</span>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center space-y-1">
                      <span className="text-xs font-black text-white block">Right to Rectify</span>
                      <span className="text-[11px] text-zinc-400">Update GamerTag and vehicle configuration data instantly.</span>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center space-y-1">
                      <span className="text-xs font-black text-white block">Right to Erasure</span>
                      <span className="text-[11px] text-zinc-400">Permanently delete your profile and chat history upon request.</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: COOKIES & LOCAL STORAGE */}
            <section id="cookies" className="scroll-mt-24 space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      5. Cookies, Local Storage & Offline Caching
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Service Worker Cache & Client-Side Persistence
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                  <p>
                    ViceIntel utilizes client-side storage technologies to deliver fast load times, offline availability, and persistent preferences:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                    <li>
                      <strong className="text-zinc-200">IndexedDB & LocalForage:</strong> Caches static vehicle databases, weapon TTK stats, and map points locally on your device for instant offline access through the Service Worker (`/sw.js`).
                    </li>
                    <li>
                      <strong className="text-zinc-200">LocalStorage:</strong> Stores active UI session preferences, dark mode states, and daily reward streak timestamps.
                    </li>
                    <li>
                      <strong className="text-zinc-200">Authentication Session Tokens:</strong> Secure, HTTPS-only cryptographic auth tokens managed by Firebase to preserve your signed-in state.
                    </li>
                  </ul>
                  <p className="text-zinc-400">
                    You can clear these stored cached datasets at any time using our built-in <strong>Offline Storage Manager</strong> or through your web browser settings.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 6: TERMS OF SERVICE & CODE OF CONDUCT */}
            <section id="terms" className="scroll-mt-24 space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      6. Terms of Service & Community Conduct
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Acceptable Use & Anti-Harassment Enforcement
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                  <p>
                    By accessing or interacting with ViceIntel features (including Community Chat, VIP Player Hubs, Voice Channels, and Whitelist Portals), you agree to abide by the following community standards:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                      <span className="font-bold text-rose-400 block">Prohibited Conduct:</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Harassment, hate speech, doxxing, distribution of malware, exploit execution scripts, or real-money fraud.
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                      <span className="font-bold text-emerald-400 block">Enforcement Powers:</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Moderators and Level 4 staff hold authority to kick, mute, or permanently ban accounts violating standards.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 7: VIP PASS & VIRTUAL CURRENCY DISCLAIMER */}
            <section id="vip-disclaimer" className="scroll-mt-24 space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      7. VIP Pass & Virtual Currency (VC) Terms
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Server Hosting Support, Non-Gambling & Virtual Credits
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                  <p>
                    <strong>VIP Membership Passes</strong> are voluntary micro-subscriptions designed to fund the independent server infrastructure, low-latency WebRTC bandwidth, Gemini AI compute quotas, and database upkeep required to maintain ViceIntel.
                  </p>
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-zinc-400">
                    <p>
                      <strong className="text-white">Virtual Currency (VC):</strong> Vice Credits awarded via daily sign-in streaks, championship leaderboards, or gift cards have <strong>no monetary value</strong>. They cannot be redeemed, refunded, or converted into fiat currency, cryptocurrency, or real-world goods.
                    </p>
                    <p>
                      <strong className="text-white">Refunds & Cancellations:</strong> VIP subscribers can cancel their membership anytime through Stripe billing management. All core databases, calculators, and maps remain 100% free and open to all players.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 8: INTERACTIVE LEGAL INQUIRY & DMCA SUBMISSION FORM */}
            <section id="inquiry-form" className="scroll-mt-24 space-y-4">
              <div className="bg-zinc-900/90 border border-rose-500/30 rounded-2xl p-6 sm:p-8 space-y-6 relative shadow-xl shadow-rose-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      8. Direct Legal & DMCA Inquiry Assistant
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Direct Ticket Transmission to Legal Compliance Team
                    </p>
                  </div>
                </div>

                {dmcaSubmittedTicket ? (
                  <div className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center space-y-3 animate-fadeIn">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-black text-white">Notice Successfully Transmitted</h4>
                    <p className="text-xs text-emerald-300/90 max-w-md mx-auto">
                      Your inquiry has been assigned case tracking number <strong className="font-mono text-white underline">{dmcaSubmittedTicket}</strong>. Our designated legal team will review and respond within 24–48 business hours.
                    </p>
                    <button
                      onClick={() => setDmcaSubmittedTicket(null)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 transition"
                    >
                      Submit Another Notice
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDmcaSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Full Legal Name / Authorized Representative *
                        </label>
                        <input
                          type="text"
                          required
                          value={dmcaFullName}
                          onChange={(e) => setDmcaFullName(e.target.value)}
                          placeholder="e.g. Jane Doe, Esq."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-rose-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Organization / Copyright Owner
                        </label>
                        <input
                          type="text"
                          value={dmcaCompany}
                          onChange={(e) => setDmcaCompany(e.target.value)}
                          placeholder="e.g. Take-Two Interactive / Self"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-rose-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Official Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={dmcaEmail}
                          onChange={(e) => setDmcaEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-rose-500 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Notice Category *
                        </label>
                        <select
                          value={dmcaCategory}
                          onChange={(e) => setDmcaCategory(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none"
                        >
                          <option value="copyright">Formal DMCA Copyright Takedown</option>
                          <option value="trademark">Trademark / Brand Policy Notice</option>
                          <option value="privacy">GDPR / CCPA User Data Deletion Request</option>
                          <option value="moderation">Chat or Whitelist Moderation Appeal</option>
                          <option value="general_legal">General Legal & Commercial Inquiry</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Detailed Statement & URLs of Allegedly Infringing Material *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={dmcaDetails}
                        onChange={(e) => setDmcaDetails(e.target.value)}
                        placeholder="Please specify exact URLs, database record IDs, statutory statement of authority, and specific remedies requested..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:border-rose-500 outline-none leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="urgentNotice"
                        checked={dmcaUrgent}
                        onChange={(e) => setDmcaUrgent(e.target.checked)}
                        className="rounded bg-zinc-950 border-zinc-800 text-rose-600"
                      />
                      <label htmlFor="urgentNotice" className="text-xs font-bold text-zinc-300 cursor-pointer">
                        Mark as Priority / Expedited Legal Notice
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Direct Desk: legal@viceintel.app
                      </span>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Transmit Formal Legal Notice</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            {/* FREQUENTLY ASKED LEGAL QUESTIONS */}
            <section className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Frequently Asked Legal Questions</h3>
              </div>

              <div className="space-y-2">
                {faqItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden transition"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs font-bold text-zinc-200 hover:text-white transition cursor-pointer"
                    >
                      <span>{item.q}</span>
                      {openFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {openFaq === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60"
                        >
                          {item.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
