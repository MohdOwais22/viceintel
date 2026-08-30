'use client';
import React from 'react';
import { Printer, Copy, X, Check, FileText, Download } from 'lucide-react';
import { copyToClipboard } from '../lib/copyUtils';

export interface PrintReportData {
  title: string;
  subtitle: string;
  reportId: string;
  generatedAt: string;
  summaryItems: { label: string; value: string }[];
  sections: {
    heading: string;
    items: { name: string; detail?: string; cost?: string }[];
  }[];
  notes?: string;
}

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PrintReportData | null;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ isOpen, onClose, report }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    // 1. Try opening clean standalone print window first (bypass iframe sandbox limits)
    try {
      const printWindow = window.open('', '_blank', 'width=900,height=850');
      if (printWindow) {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${report.title} - ${report.subtitle}</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; color: #111827; margin: 0; padding: 28px; background: #fff; }
                .header { border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
                .title { font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0; }
                .subtitle { font-size: 13px; font-weight: 700; color: #be123c; margin-top: 4px; }
                .meta { text-align: right; font-size: 11px; font-family: monospace; color: #4b5563; }
                .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
                .grid-item span { display: block; }
                .grid-label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
                .grid-val { font-size: 13px; font-weight: 900; color: #111827; }
                .section { margin-bottom: 20px; }
                .sec-heading { font-size: 12px; font-weight: 900; color: #be123c; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }
                .sec-item { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
                .sec-item:last-child { border-bottom: none; }
                .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #d1d5db; font-size: 10px; color: #6b7280; font-family: monospace; display: flex; justify-content: space-between; }
                @media print {
                  body { padding: 0; }
                  @page { margin: 1.5cm; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <h1 class="title">${report.title}</h1>
                  <div class="subtitle">${report.subtitle}</div>
                </div>
                <div class="meta">
                  <div><strong>REPORT ID: ${report.reportId}</strong></div>
                  <div>Generated: ${report.generatedAt}</div>
                </div>
              </div>

              <div class="grid">
                ${report.summaryItems.map(item => `
                  <div class="grid-item">
                    <span class="grid-label">${item.label}</span>
                    <span class="grid-val">${item.value}</span>
                  </div>
                `).join('')}
              </div>

              ${report.sections.map(sec => `
                <div class="section">
                  <div class="sec-heading">${sec.heading}</div>
                  <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fafafa;">
                    ${sec.items.map(item => `
                      <div class="sec-item">
                        <div>
                          <strong>${item.name}</strong>
                          ${item.detail ? `<span style="color: #6b7280; margin-left: 6px;">(${item.detail})</span>` : ''}
                        </div>
                        <div><strong>${item.cost || ''}</strong></div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}

              <div class="footer">
                <span>GTA VI Central Official Database & Utility Suite</span>
                <span>https://gtavi-central.vicecity.app</span>
              </div>

              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 250);
                };
              </script>
            </body>
          </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        return;
      }
    } catch (err) {
      console.warn('Popup print window failed, falling back to window.print():', err);
    }

    // 2. Direct print fallback
    try {
      window.print();
    } catch (err) {
      console.warn('Direct window.print failed:', err);
    }
  };

  const handleCopyText = async () => {
    let text = `=== ${report.title.toUpperCase()} ===\n`;
    text += `${report.subtitle}\n`;
    text += `Report ID: ${report.reportId} | Generated: ${report.generatedAt}\n\n`;

    text += `--- SUMMARY ---\n`;
    report.summaryItems.forEach((item) => {
      text += `${item.label}: ${item.value}\n`;
    });
    text += `\n`;

    report.sections.forEach((sec) => {
      text += `--- ${sec.heading.toUpperCase()} ---\n`;
      sec.items.forEach((item) => {
        text += `• ${item.name}`;
        if (item.detail) text += ` (${item.detail})`;
        if (item.cost) text += ` - ${item.cost}`;
        text += `\n`;
      });
      text += `\n`;
    });

    if (report.notes) {
      text += `Notes: ${report.notes}\n`;
    }

    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Controls Bar (Hidden during actual print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Printer-Friendly PDF Report Preview</h3>
              <p className="text-xs text-zinc-400">Preview document before printing or saving as PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Copy plain text summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-extrabold rounded-lg text-xs transition flex items-center gap-1.5 shadow-lg shadow-rose-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-8 bg-white text-zinc-900 font-sans max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible printable-paper">
          
          {/* Header */}
          <div className="border-b-2 border-zinc-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
                  GTA VI Vice City Central
                </h1>
                <p className="text-sm font-bold text-rose-700">{report.subtitle}</p>
              </div>
              <div className="text-right text-xs font-mono text-zinc-600">
                <p className="font-bold">REPORT ID: {report.reportId}</p>
                <p>Generated: {report.generatedAt}</p>
              </div>
            </div>
          </div>

          {/* Key Summary Grid */}
          <div className="mb-6 bg-zinc-100 border border-zinc-300 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {report.summaryItems.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  {item.label}
                </span>
                <span className="text-sm font-black text-zinc-900">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {report.sections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-700 border-b border-zinc-200 pb-1">
                  {sec.heading}
                </h3>
                <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/50">
                  {sec.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="px-3 py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-zinc-900">{item.name}</span>
                        {item.detail && <span className="text-zinc-500 ml-2">({item.detail})</span>}
                      </div>
                      {item.cost && <span className="font-mono font-bold text-zinc-800">{item.cost}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-4 border-t border-zinc-300 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
            <span>GTA VI Central Official Database & Utility Suite</span>
            <span>https://gtavi-central.vicecity.app</span>
          </div>

        </div>

      </div>
    </div>
  );
};
