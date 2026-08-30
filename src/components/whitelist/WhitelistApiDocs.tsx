import React, { useState } from 'react';
import {
  ShieldCheck,
  Code2,
  Terminal,
  Key,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Server,
  Zap,
  Bot,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  RefreshCw,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';

import { ActiveTab } from '../../types';
import { copyToClipboard } from '../../lib/copyUtils';
import { ENV } from '../../lib/envConfig';

interface WhitelistApiDocsProps {
  onNavigate?: (tab: ActiveTab, targetId?: string) => void;
}

export const WhitelistApiDocs: React.FC<WhitelistApiDocsProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'lua-integration' | 'webhooks' | 'ai-grader' | 'tester'>('endpoints');
  const [copiedIndex, setCopiedIndex] = useState<number | string | null>(null);

  // Interactive Tester State
  const [testSlug, setTestSlug] = useState('vice-city-life-rp');
  const [testDiscordId, setTestDiscordId] = useState('123456789012345678');
  const [testPlayerName, setTestPlayerName] = useState('Lucia_Vance');
  const [testApiKey, setTestApiKey] = useState('vice_srv_sec_demo_998231');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isExecutingTest, setIsExecutingTest] = useState(false);

  const handleCopy = async (text: string, id: number | string) => {
    await copyToClipboard(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRunInteractiveTest = async () => {
    setIsExecutingTest(true);
    setTestResponse(null);

    // Simulate API call to whitelist check
    setTimeout(() => {
      const mockResult = {
        success: true,
        whitelisted: true,
        status: 'APPROVED',
        serverSlug: testSlug,
        applicant: {
          discordId: testDiscordId,
          discordTag: `${testPlayerName}#0001`,
          characterName: 'Lucia Vance',
          grantedRoles: ['Whitelisted Citizen', 'Verified Vice Resident'],
          approvedAt: '2026-08-20T08:30:00.000Z',
          aiScore: 94,
          aiAutoApproved: true
        },
        connectPermission: 'GRANTED',
        message: 'Player is fully whitelisted and authorized to connect.'
      };
      setTestResponse(JSON.stringify(mockResult, null, 2));
      setIsExecutingTest(false);
    }, 600);
  };

  const endpoints = [
    {
      id: 'ep-check',
      method: 'POST',
      path: '/api/servers/whitelist/check',
      title: 'Player Connection Whitelist Check',
      badge: 'FiveM Gatekeeper',
      description: 'Used by FiveM server scripts during playerConnecting deferrals to verify whether a player is whitelisted, pending, or rejected on the server.',
      headers: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'X-ViceIntel-Api-Key', value: 'vice_srv_sec_YOUR_API_KEY (Optional)' }
      ],
      payloadExample: `{\n  "serverSlug": "vice-city-life-rp",\n  "discordId": "123456789012345678",\n  "steamHex": "11000010000000a",\n  "license": "license:a1b2c3d4e5f6",\n  "playerName": "Lucia_Vance"\n}`,
      responseExample: `{\n  "success": true,\n  "whitelisted": true,\n  "status": "APPROVED",\n  "serverSlug": "vice-city-life-rp",\n  "applicant": {\n    "discordId": "123456789012345678",\n    "characterName": "Lucia Vance",\n    "grantedRoleId": "109823471209384",\n    "aiScore": 92,\n    "approvedAt": "2026-08-15T14:22:00.000Z"\n  },\n  "connectPermission": "GRANTED",\n  "message": "Player is verified and whitelisted."\n}`
    },
    {
      id: 'ep-grade',
      method: 'POST',
      path: '/api/servers/whitelist/grade',
      title: 'AI Lore & Roleplay Evaluation Engine',
      badge: 'Gemini 3.6 Flash',
      description: 'Evaluates applicant backstory and scenario answers against Fear RP, NLR, Metagaming rules, and Vice City lore depth with instant score output.',
      headers: [
        { name: 'Content-Type', value: 'application/json' }
      ],
      payloadExample: `{\n  "applicationId": "app_998123",\n  "serverName": "Vice City Life RP",\n  "applicantUsername": "Lucia",\n  "discordTag": "Lucia#0001",\n  "answers": {\n    "backstory": "Grew up in Little Haiti, working as a mechanic before taking night courier jobs...",\n    "fear_rp_scenario": "If held at gunpoint in an alley, I value my life, comply with demands, and do not draw weapons."\n  },\n  "autoApproveThreshold": 75\n}`,
      responseExample: `{\n  "success": true,\n  "score": 92,\n  "decision": "APPROVED",\n  "autoApproved": true,\n  "aiSummary": "Excellent character backstory grounded in Vice City lore. Demonstrated clear understanding of Fear RP.",\n  "ruleFlags": [],\n  "breakdown": {\n    "backstoryScore": 38,\n    "fearRpScore": 28,\n    "loreFitScore": 14,\n    "grammarScore": 12\n  }\n}`
    },
    {
      id: 'ep-provision',
      method: 'POST',
      path: '/api/servers/whitelist/provision',
      title: 'Automated Infrastructure Provisioning',
      badge: 'Discord & Bot Sync',
      description: 'Provisions Discord channels, binds whitelisted member roles, creates staff notification webhooks, and syncs Cloud Database whitelist schemas.',
      headers: [
        { name: 'Content-Type', value: 'application/json' }
      ],
      payloadExample: `{\n  "serverId": "srv_vice_life_1",\n  "serverName": "Vice City Life RP",\n  "serverSlug": "vice-city-life-rp",\n  "ownerDiscordId": "987654321098765432",\n  "tier": "enterprise",\n  "webhookUrl": "https://discord.com/api/webhooks/123/abc"\n}`,
      responseExample: `{\n  "success": true,\n  "message": "Successfully provisioned whitelist system for Vice City Life RP!",\n  "discordRoleId": "11928374650129",\n  "channelsCreated": ["#whitelist-status", "#staff-reviews"],\n  "webhookBound": true\n}`
    },
    {
      id: 'ep-webhook',
      method: 'POST',
      path: '/api/whitelist/webhook',
      title: 'Discord Rich Embed Webhook Relay',
      badge: 'CORS-Bypass Relay',
      description: 'Relays formatted Discord embed payloads from client portals to server Discord webhooks without exposing webhooks or triggering browser CORS locks.',
      headers: [
        { name: 'Content-Type', value: 'application/json' }
      ],
      payloadExample: `{\n  "webhookUrl": "https://discord.com/api/webhooks/12345/abcdef",\n  "payload": {\n    "embeds": [{\n      "title": "⚡ New Whitelist Application Submitted",\n      "description": "Applicant **Lucia#0001** submitted a new application for **Vice City Life RP**.",\n      "color": 65420,\n      "fields": [\n        { "name": "Character Name", "value": "Lucia Vance", "inline": true },\n        { "name": "AI Fast-Track Score", "value": "92/100 (APPROVED)", "inline": true }\n      ]\n    }]\n  }\n}`,
      responseExample: `{\n  "success": true,\n  "message": "Discord webhook dispatched successfully!"\n}`
    },
    {
      id: 'ep-email',
      method: 'POST',
      path: '/api/whitelist/notify-status-email',
      title: 'Applicant Email Status Dispatcher',
      badge: 'SendGrid / Webhook',
      description: 'Dispatches status update emails to applicants when their application is approved, rejected, or flagged for manual staff review.',
      headers: [
        { name: 'Content-Type', value: 'application/json' }
      ],
      payloadExample: `{\n  "applicantEmail": "player@example.com",\n  "serverName": "Vice City Life RP",\n  "status": "APPROVED",\n  "characterName": "Lucia Vance",\n  "reviewerNotes": "Welcome to Vice City! Check #connect channel in Discord for server IP."\n}`,
      responseExample: `{\n  "success": true,\n  "message": "Status notification email queued successfully."\n}`
    }
  ];

  const luaScriptSnippet = `-- ViceIntel FiveM Whitelist Integration (server/whitelist.lua)
-- Add this file to your FiveM server resource (e.g. [viceintel]/viceintel_whitelist/server.lua)

local SERVER_SLUG = "vice-city-life-rp"
local VICEINTEL_CHECK_URL = "https://viceintel.app/api/servers/whitelist/check"
local SERVER_API_KEY = "vice_srv_sec_YOUR_KEY_HERE" -- Found in /servers/[slug]/manage

AddEventHandler('playerConnecting', function(playerName, setKickReason, deferrals)
    deferrals.defer()
    local src = source
    
    deferrals.update("🔍 Connecting to ViceIntel Whitelist Gateway for " .. playerName .. "...")

    -- 1. Extract Player Identifiers
    local discordId = nil
    local license = nil
    local steamHex = nil

    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        if string.match(id, "discord:") then
            discordId = string.sub(id, 9)
        elseif string.match(id, "license:") then
            license = id
        elseif string.match(id, "steam:") then
            steamHex = id
        end
    end

    -- 2. Discord Requirement Enforcement
    if not discordId then
        deferrals.done("❌ Discord required! Please open the Discord desktop app before launching FiveM.")
        return
    end

    -- 3. Query ViceIntel Whitelist API Endpoint
    PerformHttpRequest(VICEINTEL_CHECK_URL, function(statusCode, responseText, headers)
        if statusCode == 200 then
            local data = json.decode(responseText)

            if data and data.whitelisted then
                -- Approved Player
                local charName = data.applicant and data.applicant.characterName or playerName
                deferrals.update("✅ ViceIntel Whitelist Verified! Welcome back to Vice City, " .. charName .. ".")
                Citizen.Wait(800)
                deferrals.done()

            elseif data and data.status == "PENDING" then
                -- Application Under Review
                deferrals.done("⏳ Whitelist Application UNDER REVIEW by ViceIntel AI & Staff.\\n\\nTrack status at:\\nhttps://viceintel.app/servers/" .. SERVER_SLUG .. "/status")

            elseif data and data.status == "REJECTED" then
                -- Rejected Application
                deferrals.done("❌ Whitelist Application NOT ACCEPTED.\\n\\nReview feedback at:\\nhttps://viceintel.app/servers/" .. SERVER_SLUG .. "/status")

            else
                -- Not Applied Yet
                deferrals.done("🔒 Whitelist Required! You are not whitelisted on this server.\\n\\nSubmit application at:\\nhttps://viceintel.app/servers/" .. SERVER_SLUG .. "/apply")
            end
        else
            -- API Fail-Open or Maintenance Handling
            print("^3[ViceIntel Whitelist]^7 HTTP " .. tostring(statusCode) .. " received. Allowing connection fallback.")
            deferrals.done()
        end
    end, 'POST', json.encode({
        serverSlug = SERVER_SLUG,
        discordId = discordId,
        license = license,
        steamHex = steamHex,
        playerName = playerName
    }), { 
        ['Content-Type'] = 'application/json',
        ['X-ViceIntel-Api-Key'] = SERVER_API_KEY
    })
end)`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950/60 to-zinc-900 border border-indigo-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" /> FiveM & Custom Server Gateway
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Bot className="w-3 h-3 text-amber-400" /> AI Fast-Track Lore Grader
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> Zero-Delay Deferral
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              ViceIntel Whitelist Integration API Specification
            </h1>
            <p className="text-xs text-zinc-400 max-w-2xl mt-1 leading-relaxed">
              Connect your FiveM, QBCore, ESX, or custom GTA VI RP server directly to ViceIntel. Automate player application checks, AI lore evaluation, Discord role bindings, and live webhook notifications.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigate && (
              <button
                onClick={() => onNavigate('rp-servers')}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>RP Server Directory</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex gap-2 border-t border-zinc-800/80 pt-4 overflow-x-auto scrollbar-none">
          {[
            { id: 'endpoints', label: 'REST API Endpoints', icon: Code2, count: '5 Routes' },
            { id: 'lua-integration', label: 'FiveM Lua Deferral Script', icon: Terminal, count: 'playerConnecting' },
            { id: 'ai-grader', label: 'AI Lore & Rule Grader', icon: Bot, count: 'Gemini 3.6' },
            { id: 'webhooks', label: 'Discord Webhook Relays', icon: Send, count: 'Embed Relay' },
            { id: 'tester', label: 'Live Endpoint Tester', icon: Play, count: 'Interactive' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800/90'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive ? 'bg-indigo-700/80 text-white' : 'bg-zinc-950 text-zinc-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: REST API ENDPOINTS */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" /> Whitelist REST API Endpoints Specification
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Base URL: https://viceintel.app</span>
          </div>

          <div className="space-y-4">
            {endpoints.map((ep) => (
              <div key={ep.id} className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                      {ep.method}
                    </span>
                    <div>
                      <span className="font-mono text-xs font-bold text-white">{ep.path}</span>
                      <h4 className="text-xs text-zinc-400 font-medium">{ep.title}</h4>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-950 text-amber-300 border border-zinc-800 w-fit">
                    {ep.badge}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{ep.description}</p>

                {/* Headers */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Required Headers:</span>
                  <div className="flex flex-wrap gap-2">
                    {ep.headers.map((h, i) => (
                      <span key={i} className="px-2 py-1 bg-zinc-950 rounded text-[11px] font-mono text-zinc-400 border border-zinc-800">
                        <strong className="text-indigo-300">{h.name}:</strong> {h.value}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Example Payload & Response */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase">Request JSON Body:</span>
                      <button
                        onClick={() => handleCopy(ep.payloadExample, `${ep.id}-req`)}
                        className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIndex === `${ep.id}-req` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIndex === `${ep.id}-req` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-[11px] font-mono text-indigo-200 overflow-x-auto leading-relaxed max-h-48">
                      {ep.payloadExample}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase">Response JSON Example:</span>
                      <button
                        onClick={() => handleCopy(ep.responseExample, `${ep.id}-res`)}
                        className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIndex === `${ep.id}-res` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIndex === `${ep.id}-res` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-48">
                      {ep.responseExample}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FIVEM LUA INTEGRATION SCRIPT */}
      {activeTab === 'lua-integration' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">FiveM Server Lua Integration Resource</h3>
                <p className="text-xs text-zinc-400">Copy-paste production script for `playerConnecting` deferral whitelisting</p>
              </div>
            </div>

            <button
              onClick={() => handleCopy(luaScriptSnippet, 'lua-script')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer w-fit"
            >
              {copiedIndex === 'lua-script' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedIndex === 'lua-script' ? 'Copied Lua Script!' : 'Copy Lua Integration Script'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 1. Instant Deferrals
                </span>
                <p className="text-zinc-400 leading-relaxed">
                  Uses FiveM deferral cards (`deferrals.defer()`) to keep players informed with real-time progress while checking their application status.
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 2. Discord Identifier Gate
                </span>
                <p className="text-zinc-400 leading-relaxed">
                  Automatically extracts the player's Discord ID (`discord:123456789`) and license to query Cloud Database user applications seamlessly.
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> 3. Fail-Safe Fallback
                </span>
                <p className="text-zinc-400 leading-relaxed">
                  Includes built-in timeout and fallback error handling so server connections remain active even during brief internet degradation.
                </p>
              </div>
            </div>

            {/* Code Display */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-300 uppercase font-mono">server/whitelist.lua</span>
              <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed max-h-[500px] overflow-y-auto">
                {luaScriptSnippet}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI LORE & RULE GRADER */}
      {activeTab === 'ai-grader' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gemini 3.6 Flash AI Whitelist Lore Evaluator</h3>
              <p className="text-xs text-zinc-400">Automated AI evaluation engine for character depth, Fear RP scenarios, and rule compliance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
              <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" /> Evaluation Matrix (100-Point Scale)
              </h4>

              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-start gap-2 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="font-bold text-indigo-400 shrink-0 font-mono">40 Pts</span>
                  <div>
                    <strong className="text-white block">Character Backstory & Depth:</strong>
                    <span className="text-zinc-400">Evaluates origin, human flaws, Vice City occupation, and penalizes god-mode assassin tropes.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="font-bold text-indigo-400 shrink-0 font-mono">30 Pts</span>
                  <div>
                    <strong className="text-white block">Fear RP & Value of Life:</strong>
                    <span className="text-zinc-400">Verifies scenario compliance when held at gunpoint or outmatched by hostile factions.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="font-bold text-indigo-400 shrink-0 font-mono">15 Pts</span>
                  <div>
                    <strong className="text-white block">Lore & Leonida Setting Fit:</strong>
                    <span className="text-zinc-400">Checks alignment with Vice City atmosphere (Vice Beach, Port Gellhorn, Everglades).</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="font-bold text-indigo-400 shrink-0 font-mono">15 Pts</span>
                  <div>
                    <strong className="text-white block">Effort & Grammar Quality:</strong>
                    <span className="text-zinc-400">Penalizes low-effort single-sentence answers and excessive chat-speak.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-4">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto-Approval Threshold & Staff Queue
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Server owners can configure an <strong>Auto-Approve Score Threshold</strong> (default 75/100). Applications scoring above this threshold are automatically approved in real-time, granted the Discord Whitelisted Citizen role, and dispatched to server webhooks.
              </p>

              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Score 75 - 100:</span>
                  <span className="text-emerald-400 font-bold">⚡ Instant AI Auto-Approved</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Score 50 - 74:</span>
                  <span className="text-amber-400 font-bold">⏳ Queued for Staff Manual Review</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Score &lt; 50:</span>
                  <span className="text-rose-400 font-bold">❌ Flagged for Rejection / Re-Apply</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DISCORD WEBHOOK RELAYS */}
      {activeTab === 'webhooks' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Discord Webhook Embed Relays</h3>
              <p className="text-xs text-zinc-400">Real-time event notifications dispatched directly to server Discord staff channels</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
              <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                <Send className="w-4 h-4" /> Supported Webhook Events
              </h4>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <strong>application_submitted:</strong> Dispatched when a player submits a new form.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <strong>ai_auto_approved:</strong> Dispatched when Gemini AI fast-tracks an application.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <strong>staff_decision:</strong> Dispatched when staff approves or rejects an application.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <strong>discord_role_synced:</strong> Dispatched when Discord member roles are updated.
                </li>
              </ul>
            </div>

            <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
              <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> CORS Protection & Privacy
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Webhooks are routed through ViceIntel's backend endpoint (<code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded">/api/whitelist/webhook</code>). This hides webhook secret tokens from client-side network inspectors and prevents browser CORS blocks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LIVE INTERACTIVE TESTER */}
      {activeTab === 'tester' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-400" /> Whitelist Check Live Request Simulator
              </h3>
              <p className="text-xs text-zinc-400">Simulate a FiveM server whitelist check endpoint request and inspect the live JSON payload</p>
            </div>

            <button
              onClick={handleRunInteractiveTest}
              disabled={isExecutingTest}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer w-fit"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isExecutingTest ? 'Executing Query...' : 'Simulate Whitelist Check'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Server Slug</label>
                <input
                  type="text"
                  value={testSlug}
                  onChange={(e) => setTestSlug(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Player Discord ID</label>
                <input
                  type="text"
                  value={testDiscordId}
                  onChange={(e) => setTestDiscordId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">In-Game Character Name</label>
                <input
                  type="text"
                  value={testPlayerName}
                  onChange={(e) => setTestPlayerName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Server Secret API Key</label>
                <input
                  type="password"
                  value={testApiKey}
                  onChange={(e) => setTestApiKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Simulated JSON API Response</label>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 h-72 overflow-y-auto font-mono text-xs text-emerald-400">
                {testResponse ? (
                  <pre className="whitespace-pre-wrap">{testResponse}</pre>
                ) : (
                  <span className="text-zinc-600">Click "Simulate Whitelist Check" above to test API response...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
