import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { RpRuleDefinition, RpEventPlan } from '../../types/rpSuite';
import { 
  BookOpen, 
  Sparkles, 
  Copy, 
  Check, 
  Calendar, 
  Trophy, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  FileText, 
  Filter, 
  Search, 
  Loader2,
  Database,
  Info
} from 'lucide-react';

const DEFAULT_RULES: RpRuleDefinition[] = [
  {
    id: 'rule-failrp',
    title: 'Fail Roleplay (FailRP)',
    shortCode: 'FAILRP-101',
    category: 'Core Conduct',
    summary: 'Acting in a way that is unrealistic or breaks character immersion in the State of Leonida.',
    detailedExplanation: 'All players must prioritize realistic human reactions to serious danger, crime, and physical trauma. Driving sports cars off mountains and continuing without medical RP is strictly prohibited.',
    examplesGood: [
      'Pulling over immediately when boxed in by three armed officers.',
      'Roleplaying concussion or shock following a 100 MPH collision.'
    ],
    examplesBad: [
      'Jumping off a 4-story parking garage and running away immediately.',
      'Talking about Discord channels or real-world sports scores in local voice.'
    ],
    defaultPenalty: 'Formal Strike 1',
    enabled: true
  },
  {
    id: 'rule-fearrp',
    title: 'Value of Life (FearRP)',
    shortCode: 'FEARRP-102',
    category: 'Combat & Death',
    summary: 'Players must value their character’s life above all possessions when at a distinct disadvantage.',
    detailedExplanation: 'If you have a firearm directly pointed at your head and you do not currently have a weapon drawn, you MUST comply with reasonable demands.',
    examplesGood: [
      'Putting hands up and dropping cash when ambushed in an alleyway at gunpoint.'
    ],
    examplesBad: [
      'Pulling out a shotgun while two officers have assault rifles trained on your chest.'
    ],
    defaultPenalty: '24 Hour Suspension',
    enabled: true
  },
  {
    id: 'rule-rdm-vdm',
    title: 'Random Deathmatch / Vehicle Deathmatch (RDM / VDM)',
    shortCode: 'COMBAT-103',
    category: 'Combat & Death',
    summary: 'Attacking or ramming players with zero preceding verbal interaction or roleplay escalation.',
    detailedExplanation: 'Initiation must be clear and audible to all parties before any lethal force is deployed. Using vehicles as battering rams is prohibited except for authorized PIT maneuvers by trained law enforcement.',
    examplesGood: [
      'Verbal confrontation leading to demands before weapons are fired.',
      'Allowing the other party sufficient time (minimum 5 seconds) to comply.'
    ],
    examplesBad: [
      'Sniping random players on Ocean Drive beach without prior storyline.',
      'Running over a pedestrian group on the sidewalk at full speed.'
    ],
    defaultPenalty: '3-Day Ban',
    enabled: true
  },
  {
    id: 'rule-nlr',
    title: 'New Life Rule (NLR)',
    shortCode: 'NLR-104',
    category: 'Combat & Death',
    summary: 'Upon respawning at Ocean Drive Hospital, your character forgets all events leading to death.',
    detailedExplanation: 'You may not return to the area of your death for 30 minutes, nor may you seek revenge or share information about your attackers from that life.',
    examplesGood: [
      'Waking up at hospital with amnesia regarding the shootout.',
      'Avoiding the robbery scene until the 30-minute cooldown expires.'
    ],
    examplesBad: [
      'Respawning, grabbing another rifle, and driving straight back to the ongoing bank heist.'
    ],
    defaultPenalty: 'Formal Strike 1',
    enabled: true
  }
];

const DEFAULT_EVENTS: RpEventPlan[] = [
  {
    id: 'event-race-1',
    title: 'Ocean Drive Midnight Touge & Underground Meet',
    eventType: 'Street Race / Underground Meet',
    hostEntity: 'Vice Midnight Syndicate',
    locationName: 'Ocean Drive Beach Strip Carpark',
    district: 'Vice Beach',
    eventDate: '2026-09-05',
    eventTime: '22:00',
    timezone: 'EST (Leonida Standard)',
    prizePoolDesc: '$150,000 Cash + Custom Tuned Pfister Comet S2 Cabrio',
    entryFee: 5000,
    rulesNotes: 'No weapons inside the car meet zone. Police intervention allowed after 1st lap.',
    createdAt: Date.now()
  },
  {
    id: 'event-auction-2',
    title: 'Dynasty 8 Luxury Penthouse & Seized Supercar Auction',
    eventType: 'High-Stakes Auction',
    hostEntity: 'City of Vice Real Estate Board',
    locationName: 'MacArthur Bay Yacht Club',
    district: 'Downtown Vice',
    eventDate: '2026-09-08',
    eventTime: '20:00',
    timezone: 'EST',
    prizePoolDesc: 'Bidding starts at $500,000 for Starfish Island Estate',
    entryFee: 10000,
    rulesNotes: 'Formal attire required. Proof of funds verified at entrance.',
    createdAt: Date.now()
  }
];

const CATEGORIES = [
  'All Categories',
  'Core Conduct',
  'Combat & Death',
  'Communication & Voice',
  'Crime & Economy',
  'Vehicle Realism',
  'Staff & General'
];

const PENALTIES = [
  'Verbal Warning',
  'Formal Strike 1',
  'Formal Strike 2',
  '24 Hour Suspension',
  '3-Day Ban',
  '7-Day Ban',
  'Permanent Exile'
];

export const RulesAndEventGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'events'>('rules');
  const [rules, setRules] = useState<RpRuleDefinition[]>(DEFAULT_RULES);
  const [events, setEvents] = useState<RpEventPlan[]>(DEFAULT_EVENTS);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isDbSynced, setIsDbSynced] = useState(false);

  // Copy States
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);
  const [copiedAllMarkdown, setCopiedAllMarkdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals State
  const [selectedRuleForModal, setSelectedRuleForModal] = useState<RpRuleDefinition | null>(null);
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deleteConfirmRuleId, setDeleteConfirmRuleId] = useState<string | null>(null);

  // Rule Form State
  const [formTitle, setFormTitle] = useState('');
  const [formShortCode, setFormShortCode] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Core Conduct');
  const [formSummary, setFormSummary] = useState('');
  const [formDetailedExplanation, setFormDetailedExplanation] = useState('');
  const [formExamplesGood, setFormExamplesGood] = useState<string[]>(['']);
  const [formExamplesBad, setFormExamplesBad] = useState<string[]>(['']);
  const [formDefaultPenalty, setFormDefaultPenalty] = useState<string>('Formal Strike 1');
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);

  // AI Rule Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<any>('Street Race / Underground Meet');
  const [newEventHost, setNewEventHost] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventPrize, setNewEventPrize] = useState('');
  const [newEventRules, setNewEventRules] = useState('');

  // Toast Notification Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-time Firestore Sync for Server Rules
  useEffect(() => {
    setIsLoadingRules(true);
    const rulesColRef = collection(db, 'server_rules');

    const unsubscribe = onSnapshot(
      rulesColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const fetchedRules: RpRuleDefinition[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || 'Untitled Rule',
              shortCode: data.shortCode || 'RULE-100',
              category: data.category || 'Core Conduct',
              summary: data.summary || '',
              detailedExplanation: data.detailedExplanation || '',
              examplesGood: Array.isArray(data.examplesGood) ? data.examplesGood : [],
              examplesBad: Array.isArray(data.examplesBad) ? data.examplesBad : [],
              defaultPenalty: data.defaultPenalty || 'Formal Strike 1',
              enabled: data.enabled !== false,
            };
          });

          // Sort by shortCode or title
          fetchedRules.sort((a, b) => a.shortCode.localeCompare(b.shortCode));
          setRules(fetchedRules);
          setIsDbSynced(true);
          setIsLoadingRules(false);
        } else {
          // If Firestore collection is empty, seed DEFAULT_RULES into Firestore
          setRules(DEFAULT_RULES);
          setIsLoadingRules(false);
          setIsDbSynced(true);

          DEFAULT_RULES.forEach(async (rule) => {
            try {
              await setDoc(doc(db, 'server_rules', rule.id), rule, { merge: true });
            } catch (err) {
              console.warn('Failed to seed default rule to Firestore:', err);
            }
          });
        }
      },
      (error) => {
        console.warn('Firestore server_rules subscription offline fallback:', error);
        setRules(DEFAULT_RULES);
        setIsLoadingRules(false);
        setIsDbSynced(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Open Form Modal for Creating New Rule
  const handleOpenCreateModal = () => {
    setEditingRuleId(null);
    setFormTitle('');
    setFormShortCode(`RULE-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory('Core Conduct');
    setFormSummary('');
    setFormDetailedExplanation('');
    setFormExamplesGood(['']);
    setFormExamplesBad(['']);
    setFormDefaultPenalty('Formal Strike 1');
    setAiPrompt('');
    setAiError(null);
    setIsRuleFormOpen(true);
  };

  // Open Form Modal for Editing Existing Rule
  const handleOpenEditModal = (rule: RpRuleDefinition, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRuleId(rule.id);
    setFormTitle(rule.title);
    setFormShortCode(rule.shortCode);
    setFormCategory(rule.category);
    setFormSummary(rule.summary);
    setFormDetailedExplanation(rule.detailedExplanation);
    setFormExamplesGood(rule.examplesGood.length > 0 ? [...rule.examplesGood] : ['']);
    setFormExamplesBad(rule.examplesBad.length > 0 ? [...rule.examplesBad] : ['']);
    setFormDefaultPenalty(rule.defaultPenalty);
    setAiPrompt('');
    setAiError(null);
    
    // Close detail modal if open
    if (selectedRuleForModal?.id === rule.id) {
      setSelectedRuleForModal(null);
    }
    
    setIsRuleFormOpen(true);
  };

  // Save Rule (Create or Update) to Firestore
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formShortCode.trim()) {
      showToast('Please provide a Rule Title and Short Code');
      return;
    }

    setIsSubmittingRule(true);
    const ruleId = editingRuleId || `rule-${Date.now()}`;
    
    const newRule: RpRuleDefinition = {
      id: ruleId,
      title: formTitle.trim(),
      shortCode: formShortCode.trim().toUpperCase(),
      category: formCategory as any,
      summary: formSummary.trim() || 'No summary provided.',
      detailedExplanation: formDetailedExplanation.trim() || 'Standard server enforcement rules apply.',
      examplesGood: formExamplesGood.filter((ex) => ex.trim().length > 0),
      examplesBad: formExamplesBad.filter((ex) => ex.trim().length > 0),
      defaultPenalty: formDefaultPenalty as any,
      enabled: true,
    };

    try {
      await setDoc(doc(db, 'server_rules', ruleId), newRule, { merge: true });
      showToast(editingRuleId ? `Rule "${newRule.shortCode}" updated in database!` : `New Rule "${newRule.shortCode}" uploaded to database!`);
      setIsRuleFormOpen(false);
    } catch (err) {
      console.error('Error saving rule to Firestore:', err);
      // Fallback local state update
      setRules((prev) => {
        const exists = prev.some((r) => r.id === ruleId);
        if (exists) {
          return prev.map((r) => (r.id === ruleId ? newRule : r));
        } else {
          return [newRule, ...prev];
        }
      });
      showToast(`Rule "${newRule.shortCode}" saved locally (database offline).`);
      setIsRuleFormOpen(false);
    } finally {
      setIsSubmittingRule(false);
    }
  };

  // Delete Rule from Firestore
  const handleDeleteRule = async (ruleId: string, ruleShortCode: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      await deleteDoc(doc(db, 'server_rules', ruleId));
      showToast(`Rule "${ruleShortCode}" deleted from database.`);
    } catch (err) {
      console.error('Error deleting rule from Firestore:', err);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      showToast(`Rule "${ruleShortCode}" removed locally.`);
    } finally {
      setDeleteConfirmRuleId(null);
      if (selectedRuleForModal?.id === ruleId) {
        setSelectedRuleForModal(null);
      }
    }
  };

  // AI Generator Function for Rules
  const handleGenerateRuleWithAi = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Please enter a concept prompt (e.g., Metagaming via Discord voice streams during cop chases)');
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    try {
      const systemInstruction = `You are an expert Vice City / FiveM Roleplay Server Rulebook Architect. Generate a complete, highly structured GTA VI RP server rule based on the user request. Respond ONLY with valid JSON with keys: title, shortCode, category (one of: Core Conduct, Combat & Death, Communication & Voice, Crime & Economy, Vehicle Realism, Staff & General), summary, detailedExplanation, examplesGood (array of strings), examplesBad (array of strings), defaultPenalty (one of: Verbal Warning, Formal Strike 1, Formal Strike 2, 24 Hour Suspension, 3-Day Ban, 7-Day Ban, Permanent Exile).`;

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a GTA 6 / FiveM server rule definition for: "${aiPrompt}". Return ONLY raw JSON without markdown formatting.`,
          topic: 'Server Rules Architecture'
        })
      });

      const data = await res.json();
      if (data.success && data.answer) {
        let parsed: any = null;
        try {
          // Remove potential backticks/json tags
          const cleanJson = data.answer.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanJson);
        } catch (pErr) {
          console.warn('JSON parse fallback for AI rule generator:', pErr);
        }

        if (parsed && parsed.title) {
          setFormTitle(parsed.title || formTitle);
          setFormShortCode(parsed.shortCode || formShortCode);
          if (parsed.category) setFormCategory(parsed.category);
          setFormSummary(parsed.summary || formSummary);
          setFormDetailedExplanation(parsed.detailedExplanation || formDetailedExplanation);
          if (Array.isArray(parsed.examplesGood) && parsed.examplesGood.length > 0) {
            setFormExamplesGood(parsed.examplesGood);
          }
          if (Array.isArray(parsed.examplesBad) && parsed.examplesBad.length > 0) {
            setFormExamplesBad(parsed.examplesBad);
          }
          if (parsed.defaultPenalty) setFormDefaultPenalty(parsed.defaultPenalty);
          showToast('AI Rule generated and pre-filled!');
        } else {
          // Fallback parsing from text response
          setFormTitle(aiPrompt.slice(0, 40));
          setFormSummary(`Rule regarding ${aiPrompt}. All players must adhere strictly to character immersion and server guidelines.`);
          setFormDetailedExplanation(data.answer.slice(0, 300));
          showToast('AI generated draft rule template!');
        }
      } else {
        setAiError('Unable to generate rule via AI backend. Please fill form manually.');
      }
    } catch (err) {
      console.error('AI rule generation error:', err);
      setAiError('Network error connecting to AI assistant.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Helper arrays for Good/Bad examples inputs
  const handleAddExampleGood = () => setFormExamplesGood([...formExamplesGood, '']);
  const handleRemoveExampleGood = (index: number) => {
    const updated = formExamplesGood.filter((_, i) => i !== index);
    setFormExamplesGood(updated.length > 0 ? updated : ['']);
  };
  const handleChangeExampleGood = (index: number, val: string) => {
    const updated = [...formExamplesGood];
    updated[index] = val;
    setFormExamplesGood(updated);
  };

  const handleAddExampleBad = () => setFormExamplesBad([...formExamplesBad, '']);
  const handleRemoveExampleBad = (index: number) => {
    const updated = formExamplesBad.filter((_, i) => i !== index);
    setFormExamplesBad(updated.length > 0 ? updated : ['']);
  };
  const handleChangeExampleBad = (index: number, val: string) => {
    const updated = [...formExamplesBad];
    updated[index] = val;
    setFormExamplesBad(updated);
  };

  // Copy Single Rule to Discord Markdown
  const handleCopyRuleDiscord = (rule: RpRuleDefinition, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const md = `**📜 [${rule.shortCode}] ${rule.title.toUpperCase()}**
> ${rule.summary}

**⚖️ Detailed Enforcement:**
${rule.detailedExplanation}

✅ **Compliant Example:**
${rule.examplesGood.map((e) => `• ${e}`).join('\n')}

❌ **Prohibited Violation:**
${rule.examplesBad.map((e) => `• ${e}`).join('\n')}

**🚨 Standard Penalty:** \`${rule.defaultPenalty}\``;

    navigator.clipboard.writeText(md);
    setCopiedRuleId(rule.id);
    showToast(`Discord Markdown for ${rule.shortCode} copied!`);
    setTimeout(() => setCopiedRuleId(null), 2000);
  };

  // Copy Full Rulebook
  const handleCopyFullHandbookMarkdown = () => {
    const fullMd = `# 📜 STATE OF LEONIDA ROLEPLAY SERVER RULEBOOK & GUIDELINES
Generated via Vice Intel RP Engine & Database

${rules
  .filter((r) => r.enabled)
  .map(
    (r) => `## [${r.shortCode}] ${r.title}
*Category: ${r.category} | Standard Penalty: ${r.defaultPenalty}*

> ${r.summary}

**Explanation:**
${r.detailedExplanation}

**Acceptable Behavior:**
${r.examplesGood.map((e) => `- ${e}`).join('\n')}

**Strictly Prohibited:**
${r.examplesBad.map((e) => `- ${e}`).join('\n')}
---`
  )
  .join('\n\n')}`;

    navigator.clipboard.writeText(fullMd);
    setCopiedAllMarkdown(true);
    showToast('Full Server Handbook Markdown copied to clipboard!');
    setTimeout(() => setCopiedAllMarkdown(false), 2000);
  };

  // Filter Rules
  const filteredRules = rules.filter((rule) => {
    const matchesCategory =
      selectedCategory === 'All Categories' || rule.category === selectedCategory;
    const matchesSearch =
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.detailedExplanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Event Creation
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventLocation) return;
    const item: RpEventPlan = {
      id: `event-${Date.now()}`,
      title: newEventTitle,
      eventType: newEventType,
      hostEntity: newEventHost || 'Community Event Committee',
      locationName: newEventLocation,
      district: 'Vice City Metro',
      eventDate: newEventDate || '2026-09-10',
      eventTime: newEventTime || '21:00',
      timezone: 'EST',
      prizePoolDesc: newEventPrize || 'Community Recognition & Trophy',
      rulesNotes: newEventRules || 'Standard community roleplay rules apply.',
      createdAt: Date.now(),
    };
    setEvents([item, ...events]);
    showToast(`Event "${item.title}" scheduled!`);
    setNewEventTitle('');
    setNewEventLocation('');
    setNewEventPrize('');
    setNewEventRules('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* TOAST FLOATING NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-2xl border border-indigo-400 flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-black text-white tracking-tight">
              No-Code Server Rules & Event Dispatch Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build clean RP server rulebooks, open detail modals, manage custom rules synced to database, and schedule high-stakes tournaments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Rule</span>
          </button>

          <button
            type="button"
            onClick={handleCopyFullHandbookMarkdown}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition"
          >
            {copiedAllMarkdown ? (
              <Check className="w-4 h-4 text-emerald-300" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copiedAllMarkdown ? 'Handbook Copied!' : 'Copy Handbook (Markdown)'}</span>
          </button>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === 'rules'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Server Rulebook Matrix ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === 'events'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Community Events & Tournament Dispatch ({events.length})</span>
        </button>
      </div>

      {/* VIEW 1: RULES MATRIX */}
      {activeTab === 'rules' && (
        <div className="space-y-5">
          {/* SEARCH & FILTER CONTROLS */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rule title, code, or keyword..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* CATEGORY PILLS */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition border ${
                    selectedCategory === cat
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* RULES GRID */}
          {isLoadingRules ? (
            <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-3xl flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-400 font-bold">Synchronizing rules matrix with Firestore database...</p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-3xl space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No rules matched your query</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try searching for a different keyword, clear your filter, or create a brand new custom server rule.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Rule</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredRules.map((rule) => {
                const isCopied = copiedRuleId === rule.id;
                return (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRuleForModal(rule)}
                    className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3.5 shadow-xl hover:border-indigo-500/50 transition cursor-pointer group relative"
                  >
                    {/* CARD HEADER */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px] border border-indigo-500/30">
                            {rule.shortCode}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{rule.category}</span>
                        </div>
                        <h3 className="font-black text-white text-base group-hover:text-indigo-300 transition">
                          {rule.title}
                        </h3>
                      </div>

                      {/* CARD ACTION BUTTONS */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRuleForModal(rule);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                          title="Open Full Rule Details Modal"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(rule, e)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                          title="Edit Rule"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmRuleId(rule.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                          title="Delete Rule from Database"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleCopyRuleDiscord(rule, e)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
                          title="Copy Discord Markdown"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* INLINE DELETE CONFIRMATION BAR */}
                    {deleteConfirmRuleId === rule.id && (
                      <div
                        className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-bold text-[11px]">Confirm delete from database?</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRule(rule.id, rule.shortCode, e)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px]"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmRuleId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SUMMARY SNIPPET */}
                    <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                      {rule.summary}
                    </p>

                    {/* PREVIEW OF COMPLIANT & PROHIBITED */}
                    <div className="space-y-2 text-xs">
                      {rule.examplesGood && rule.examplesGood.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-200">
                          <span className="font-bold block text-[10px] uppercase text-emerald-400 mb-0.5">
                            Compliant Conduct ({rule.examplesGood.length}):
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                            {rule.examplesGood.slice(0, 2).map((ex, i) => (
                              <li key={i} className="truncate">
                                {ex}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rule.examplesBad && rule.examplesBad.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-200">
                          <span className="font-bold block text-[10px] uppercase text-rose-400 mb-0.5">
                            Prohibited Behavior ({rule.examplesBad.length}):
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                            {rule.examplesBad.slice(0, 2).map((ex, i) => (
                              <li key={i} className="truncate">
                                {ex}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* FOOTER METRICS */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Click card to inspect modal</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/40">
                        {rule.defaultPenalty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: OPENABLE CARD DETAILS MODAL                     */}
      {/* ========================================================= */}
      {selectedRuleForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE X BUTTON */}
            <button
              onClick={() => setSelectedRuleForModal(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* MODAL HEADER */}
            <div className="space-y-2 border-b border-slate-800 pb-4 pr-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/40">
                  {selectedRuleForModal.shortCode}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 font-bold text-xs border border-slate-800">
                  {selectedRuleForModal.category}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">{selectedRuleForModal.title}</h2>
            </div>

            {/* SUMMARY HIGHLIGHT BOX */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed font-medium">
              <span className="font-bold uppercase text-[10px] text-indigo-400 block mb-1">
                Executive Overview / Rule Summary:
              </span>
              <p>{selectedRuleForModal.summary}</p>
            </div>

            {/* DETAILED ENFORCEMENT */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-300 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Detailed Enforcement Guidelines:</span>
              </h4>
              <p className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed font-normal">
                {selectedRuleForModal.detailedExplanation}
              </p>
            </div>

            {/* COMPLIANT & PROHIBITED COLUMNS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* COMPLIANT EXAMPLES */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 space-y-2">
                <span className="font-black uppercase text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Compliant Conduct:</span>
                </span>
                <ul className="space-y-1.5 text-xs">
                  {selectedRuleForModal.examplesGood.map((ex, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-0.5">•</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PROHIBITED BEHAVIORS */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-200 space-y-2">
                <span className="font-black uppercase text-[11px] text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>Prohibited Violations:</span>
                </span>
                <ul className="space-y-1.5 text-xs">
                  {selectedRuleForModal.examplesBad.map((ex, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold mt-0.5">•</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* PENALTY BAND */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Standard Disciplinary Action:</span>
              <span className="px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 font-black text-xs border border-rose-500/40">
                {selectedRuleForModal.defaultPenalty}
              </span>
            </div>

            {/* MODAL FOOTER ACTIONS */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyRuleDiscord(selectedRuleForModal)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-2 cursor-pointer transition"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Discord Markdown</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(selectedRuleForModal)}
                  className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-2 cursor-pointer transition"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Rule</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDeleteRule(selectedRuleForModal.id, selectedRuleForModal.shortCode);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-2 cursor-pointer transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Rule</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRuleForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CREATE / EDIT CUSTOM RULE FORM MODAL            */}
      {/* ========================================================= */}
      {isRuleFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE X BUTTON */}
            <button
              onClick={() => setIsRuleFormOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* FORM TITLE */}
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <span>{editingRuleId ? 'Edit Server Rule' : 'Create Custom Server Rule'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Define custom RP rule definitions, compliant behavior, and penalties to sync directly with your Firestore database.
              </p>
            </div>

            {/* AI SMART RULE GENERATOR BOX */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>AI Smart Rule Generator:</span>
                </label>
                <span className="text-[10px] text-indigo-400">Powered by Gemini AI</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Prohibit logging out while handcuffed or being transported by law enforcement"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
                <button
                  type="button"
                  onClick={handleGenerateRuleWithAi}
                  disabled={isAiGenerating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow"
                >
                  {isAiGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{isAiGenerating ? 'Generating...' : 'Auto-Draft with AI'}</span>
                </button>
              </div>

              {aiError && <p className="text-[11px] text-rose-400 font-semibold">{aiError}</p>}
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Rule Title:</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Combat Logging (CL)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Short Code:</label>
                  <input
                    type="text"
                    required
                    value={formShortCode}
                    onChange={(e) => setFormShortCode(e.target.value)}
                    placeholder="e.g. COMBAT-105"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="Core Conduct">Core Conduct</option>
                    <option value="Combat & Death">Combat & Death</option>
                    <option value="Communication & Voice">Communication & Voice</option>
                    <option value="Crime & Economy">Crime & Economy</option>
                    <option value="Vehicle Realism">Vehicle Realism</option>
                    <option value="Staff & General">Staff & General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Standard Disciplinary Action:</label>
                  <select
                    value={formDefaultPenalty}
                    onChange={(e) => setFormDefaultPenalty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  >
                    {PENALTIES.map((pen) => (
                      <option key={pen} value={pen}>
                        {pen}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Summary / Overview:</label>
                <input
                  type="text"
                  required
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="e.g. Quitting or disconnecting during active roleplay, police chancing, or hospital care."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Detailed Enforcement Explanation:</label>
                <textarea
                  rows={3}
                  required
                  value={formDetailedExplanation}
                  onChange={(e) => setFormDetailedExplanation(e.target.value)}
                  placeholder="Write the full rules and conditions surrounding this violation..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* DYNAMIC COMPLIANT EXAMPLES INPUTS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Compliant Conduct Examples:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddExampleGood}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Example
                  </button>
                </div>

                {formExamplesGood.map((ex, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={ex}
                      onChange={(e) => handleChangeExampleGood(idx, e.target.value)}
                      placeholder="e.g. Informing officers via local OOC if your game crashes and rejoining within 5 minutes."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                    {formExamplesGood.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExampleGood(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* DYNAMIC PROHIBITED EXAMPLES INPUTS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Prohibited Violation Examples:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddExampleBad}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Violation
                  </button>
                </div>

                {formExamplesBad.map((ex, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={ex}
                      onChange={(e) => handleChangeExampleBad(idx, e.target.value)}
                      placeholder="e.g. Pulling your power cord or closing FiveM while inside a police cruiser."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                    {formExamplesBad.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExampleBad(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* FORM FOOTER ACTIONS */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRuleFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRule}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25"
                >
                  {isSubmittingRule ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  <span>{editingRuleId ? 'Update Rule in Database' : 'Upload Rule to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: EVENTS & TOURNAMENTS */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* EVENTS LIST (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <span>Scheduled RP Community Events ({events.length})</span>
            </h2>

            <div className="space-y-3">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-xl"
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                        {ev.eventType}
                      </span>
                      <h3 className="text-base font-black text-white mt-1">{ev.title}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-400">{ev.eventDate}</div>
                      <div className="text-[10px] text-slate-500">
                        {ev.eventTime} {ev.timezone}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Host Entity:</span>
                      <span className="font-bold text-slate-200">{ev.hostEntity}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Location:</span>
                      <span className="font-bold text-cyan-300">{ev.locationName}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-amber-400 uppercase font-bold block">
                        Prize Pool / Stake:
                      </span>
                      <span className="font-bold text-white">{ev.prizePoolDesc}</span>
                    </div>
                    {ev.entryFee && (
                      <span className="px-2.5 py-1 rounded bg-slate-950 text-amber-300 font-mono font-bold text-xs border border-amber-500/40">
                        Entry: ${ev.entryFee.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 italic">{ev.rulesNotes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CREATE EVENT FORM (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Schedule New Server Event</h3>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Event Title:</label>
                  <input
                    type="text"
                    required
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g. Everglades Night Drag Shootout"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Event Category:</label>
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                    >
                      <option>Street Race / Underground Meet</option>
                      <option>High-Stakes Auction</option>
                      <option>Courtroom Trial</option>
                      <option>Music Festival / Beach Party</option>
                      <option>Organized Heist Event</option>
                      <option>Fight Night Championship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Host Entity:</label>
                    <input
                      type="text"
                      value={newEventHost}
                      onChange={(e) => setNewEventHost(e.target.value)}
                      placeholder="e.g. Ocean Drive Syndicate"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Date:</label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Time (EST):</label>
                    <input
                      type="time"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Location / Venue:</label>
                  <input
                    type="text"
                    required
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="e.g. Everglades Airstrip Hangar 4"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Prize Pool / Trophy Description:
                  </label>
                  <input
                    type="text"
                    value={newEventPrize}
                    onChange={(e) => setNewEventPrize(e.target.value)}
                    placeholder="e.g. $100,000 Cash + Championship Ring"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Special Event Rules & Notes:</label>
                  <textarea
                    rows={2}
                    value={newEventRules}
                    onChange={(e) => setNewEventRules(e.target.value)}
                    placeholder="e.g. Weapons cold upon entry, vehicle class restricted to AWD..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer shadow-lg shadow-indigo-600/25 transition"
                >
                  Broadcast & Publish Event
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
