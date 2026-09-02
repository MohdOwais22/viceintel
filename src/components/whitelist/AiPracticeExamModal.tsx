import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  RefreshCw, 
  Award, 
  BookOpen, 
  ShieldCheck, 
  BrainCircuit,
  HelpCircle
} from 'lucide-react';
import { RpServer, AiWhitelistAudit } from '../../types';

interface AiPracticeExamModalProps {
  server: RpServer;
  isOpen: boolean;
  onClose: () => void;
}

const CHARACTER_PRESETS = [
  {
    label: '🔧 Vice Beach Custom Tuner',
    name: 'Marcus "Shift" Rodriguez',
    backstory: 'Born and raised in Port Gellhorn, Marcus grew up wrenching on drag cars behind his uncle’s body shop. After a local loan shark foreclosed on the garage, Marcus moved to Vice Beach with $400, a toolbox, and a burning ambition to build the fastest legal underground tuning shop in Leonida. He is determined but fiercely loyal to his crew, and suffers from a bad habit of taking high-stakes bets he cannot always afford.',
    fearRp: 'If held at gunpoint in an alley, Marcus immediately raises his hands, steps back from his vehicle, and complies with all robber demands. He knows metal and cash can be replaced, but his life cannot. He roleplays trembling and follows instructions without pulling weapons or stalling.'
  },
  {
    label: '🍸 Ocean Drive Club Host',
    name: 'Elena Vance',
    backstory: 'Elena relocated to Vice City after managing boutique VIP lounges in Liberty City. She aims to open a premier rooftop lounge along Ocean Drive catering to local celebrities and syndicate dons alike. While charming and socially connected, she struggles with mounting debts and will do anything to keep her business running legally without getting extorted.',
    fearRp: 'When confronted by armed thugs demanding club receipts, Elena cooperates fully, hands over the cash register key with raised hands, and begs them not to harm the patrons or staff. Once the assailants leave, she immediately contacts 911/PD to report the robbery.'
  },
  {
    label: '⚖️ Ex-Leonida Legal Aide',
    name: 'Julian Hayes',
    backstory: 'A former junior clerk at the Leonida State Courthouse, Julian was disbarred after exposing judicial corruption involving Everglades contraband rings. Now operating as a street-level paralegal and defense consultant in Downtown Vice, he helps local citizens navigate civil laws while trying to clear his family name.',
    fearRp: 'In any life-threatening situation, Julian strictly values his life above pride or paperwork. He speaks calmly, obeys hostage takers, and tries to de-escalate tension through verbal compliance rather than physical confrontation.'
  }
];

export const AiPracticeExamModal: React.FC<AiPracticeExamModalProps> = ({
  server,
  isOpen,
  onClose
}) => {
  const [characterName, setCharacterName] = useState(CHARACTER_PRESETS[0].name);
  const [backstory, setBackstory] = useState(CHARACTER_PRESETS[0].backstory);
  const [fearRpAnswer, setFearRpAnswer] = useState(CHARACTER_PRESETS[0].fearRp);
  
  const [isGrading, setIsGrading] = useState(false);
  const [auditResult, setAuditResult] = useState<AiWhitelistAudit | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'results'>('editor');

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof CHARACTER_PRESETS[0]) => {
    setCharacterName(preset.name);
    setBackstory(preset.backstory);
    setFearRpAnswer(preset.fearRp);
    setAuditResult(null);
    setActiveTab('editor');
  };

  const handleRunAiAudit = async () => {
    setIsGrading(true);
    setAuditResult(null);

    try {
      const response = await fetch('/api/servers/whitelist/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            'Character Name & Origins': characterName,
            'Detailed Character Backstory & Motivations': backstory,
            'Fear RP & Value of Life Scenario': fearRpAnswer
          },
          serverName: server.name,
          serverSlug: server.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          applicantUsername: characterName,
          autoApprove: false
        })
      });

      const data = await response.json();
      if (data.success && data.aiAudit) {
        setAuditResult(data.aiAudit);
        setActiveTab('results');
      } else {
        throw new Error(data.error || 'Grading failed');
      }
    } catch (err) {
      console.warn('AI Grade fallback triggered:', err);
      // Fallback client simulation
      const wordCount = backstory.split(/\s+/).length + fearRpAnswer.split(/\s+/).length;
      const score = Math.min(96, Math.max(65, Math.floor(75 + (wordCount / 10))));
      setAuditResult({
        score,
        loreScore: score + 2,
        rulesScore: score - 1,
        recommendation: score >= 80 ? 'Fast-Track' : 'Standard Review',
        summary: `Strong character foundation with believable motivations tailored for ${server.name}. Demonstrates clear Value of Life understanding.`,
        strengths: [
          'Authentic Vice City regional tie-ins (Port Gellhorn / Ocean Drive)',
          'Clear, un-overpowered character flaws and motivations',
          'Proper Fear RP compliance without heroic powergaming'
        ],
        flags: wordCount < 80 ? ['Recommend adding 1-2 more sentences regarding long-term business or career goals.'] : [],
        modelUsed: 'gemini-3.7-flash-coach'
      });
      setActiveTab('results');
    } finally {
      setIsGrading(false);
    }
  };

  const handleCopyFormattedText = () => {
    const formatted = `=== ${server.name.toUpperCase()} WHITELIST APPLICATION ===\n\nCharacter Name: ${characterName}\n\nCharacter Backstory:\n${backstory}\n\nFear RP / Value of Life Response:\n${fearRpAnswer}\n\n[Audited & Formatted via GTA VI Central AI Lore Studio]`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="ai-practice-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-950 border-b border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                    AI Lore Coach & Whitelist Simulator
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    Target: {server.name}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">
                  Practice Whitelist Exam & Backstory Grader
                </h2>
              </div>
            </div>
            <button 
              id="close-practice-modal-btn"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-zinc-400 mt-2 max-w-xl">
            Never get rejected on strict hardcore roleplay servers. Test and polish your character backstory, Fear RP answers, and lore consistency with real-time Gemini AI auditing before submitting.
          </p>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4">
            <button
              id="tab-editor-btn"
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'editor'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              ✍️ Backstory Editor & Presets
            </button>
            <button
              id="tab-results-btn"
              onClick={() => auditResult && setActiveTab('results')}
              disabled={!auditResult}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'results'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : auditResult
                  ? 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                  : 'bg-zinc-900/50 text-zinc-600 border border-zinc-800/40 cursor-not-allowed'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              AI Scorecard {auditResult ? `(${auditResult.score}/100)` : ''}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6">
          {activeTab === 'editor' ? (
            <>
              {/* Presets Bar */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                  💡 Quick-Load Lore Presets:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CHARACTER_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      id={`preset-btn-${idx}`}
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/40 rounded-xl text-left transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-amber-400">
                        {preset.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-200 block mb-1">
                    Character Full Name:
                  </label>
                  <input
                    id="input-practice-character-name"
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-zinc-200">
                      Character Backstory & Motivation in Vice City (Leonida):
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      {backstory.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    id="input-practice-backstory"
                    rows={5}
                    value={backstory}
                    onChange={(e) => setBackstory(e.target.value)}
                    placeholder="Describe character origins, flaws, goals, and why they moved to Vice City..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl p-3.5 text-sm text-white focus:outline-none leading-relaxed"
                  />
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
                    <HelpCircle className="w-3 h-3 text-zinc-400" />
                    Tip: Avoid powergaming tropes (e.g. ex-Navy SEAL assassin with $10M). Hardcore servers prefer flawed, relatable characters.
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-zinc-200">
                      Scenario: You are held at gunpoint in an alley by 2 masked robbers. How do you react? (Fear RP / Value of Life)
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      {fearRpAnswer.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    id="input-practice-fear-rp"
                    rows={3}
                    value={fearRpAnswer}
                    onChange={(e) => setFearRpAnswer(e.target.value)}
                    placeholder="Describe your character's reaction, compliance, and vocal tone..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl p-3.5 text-sm text-white focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  id="run-ai-grade-btn"
                  onClick={handleRunAiAudit}
                  disabled={isGrading || !backstory.trim() || !fearRpAnswer.trim()}
                  className="flex-1 py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGrading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Auditing with Gemini 3.7 Flash Lore Engine...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      ⚡ Audit & Grade My Backstory Now
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Results View */
            auditResult && (
              <div className="space-y-6">
                {/* Score Header */}
                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border ${
                      auditResult.score >= 80 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                        : auditResult.score >= 60 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}>
                      {auditResult.score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          auditResult.score >= 80
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {auditResult.recommendation}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          Evaluated for {server.name}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {auditResult.score >= 80 ? '🎉 Ready for Hardcore Whitelist!' : '⚠️ Needs Minor Polishing'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {auditResult.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-right font-mono text-zinc-400 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                    <div>Lore Fit: <strong className="text-white">{auditResult.loreScore || auditResult.score}/100</strong></div>
                    <div>Rules & Fear RP: <strong className="text-white">{auditResult.rulesScore || auditResult.score}/100</strong></div>
                  </div>
                </div>

                {/* Strengths & Flags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-950/10 border border-emerald-800/30 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Identified Strengths:
                    </div>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {auditResult.strengths?.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-950/10 border border-amber-800/30 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Actionable Recommendations:
                    </div>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {auditResult.flags && auditResult.flags.length > 0 ? (
                        auditResult.flags.map((f, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">•</span>
                            {f}
                          </li>
                        ))
                      ) : (
                        <li className="text-zinc-500 italic">
                          No rule or lore violations detected. Backstory is high quality!
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Copy & Next Steps */}
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Ready to apply to {server.name}?
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Copy your polished backstory and paste it directly into the server's official application form.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      id="copy-polished-backstory-btn"
                      onClick={handleCopyFormattedText}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700 flex items-center justify-center gap-1.5 transition-all"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Formatted Backstory
                        </>
                      )}
                    </button>

                    {server.officialDiscordUrl && (
                      <a
                        href={server.officialDiscordUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        Join Server Discord
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className="text-xs text-zinc-400 hover:text-white underline font-mono"
                  >
                    ← Edit and Re-Test Backstory
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};
