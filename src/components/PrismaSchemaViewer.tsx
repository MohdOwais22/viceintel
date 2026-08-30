'use client';
import React, { useState } from 'react';
import { PRISMA_SCHEMA_CODE } from '../data/architecturalSpecs';
import { Database, Copy, Check, FileCode2 } from 'lucide-react';
import { copyToClipboard } from '../lib/copyUtils';

export const PrismaSchemaViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(PRISMA_SCHEMA_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-rose-400" />
          <h4 className="text-sm font-bold text-white">Core Application Database Models</h4>
        </div>

        <button
          onClick={handleCopy}
          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg text-xs transition flex items-center gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Schema'}</span>
        </button>
      </div>

      <pre className="bg-zinc-900/90 text-zinc-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 scrollbar-thin border border-zinc-800 leading-relaxed">
        {PRISMA_SCHEMA_CODE}
      </pre>
    </div>
  );
};
