import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { subscribeQuotaExceeded } from '../lib/firestoreErrorHandler';

export const FirestoreQuotaBanner: React.FC = () => {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeQuotaExceeded((isExceeded) => {
      setQuotaExceeded(isExceeded);
    });
    return () => unsubscribe();
  }, []);

  if (!quotaExceeded) return null;

  return (
    <div 
      id="maintenance-warning-banner"
      className="bg-rose-500/10 border-b border-rose-500/30 text-rose-200 px-4 py-3 text-xs md:text-sm font-medium z-[9999] relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 animate-fadeIn"
    >
      <div className="flex items-start sm:items-center gap-2.5">
        <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
        <span className="font-bold uppercase tracking-wide">
          this feature is not accessible at this moment site is under maintenance
        </span>
      </div>
      <button
        onClick={() => setQuotaExceeded(false)}
        type="button"
        className="text-zinc-400 hover:text-zinc-200 text-[10px] font-bold uppercase tracking-wider cursor-pointer px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition"
      >
        Dismiss
      </button>
    </div>
  );
};
