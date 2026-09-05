import React, { useState } from "react";
import { NlpAnalysis } from "../types/forensic";

interface NlpAnalysisCardProps {
  nlpAnalysis: NlpAnalysis;
}

const CATEGORY_META: Record<string, { label: string; color: string; badge: string }> = {
  URGENCY:           { label: "Urgency / Fear",         color: "text-orange-400", badge: "bg-orange-950/60 border-orange-700 text-orange-300" },
  BEC_AUTHORITY:     { label: "Authority Impersonation", color: "text-red-400",    badge: "bg-red-950/60 border-red-700 text-red-300" },
  WIRE_FRAUD:        { label: "Wire Fraud / BEC",        color: "text-rose-400",   badge: "bg-rose-950/60 border-rose-700 text-rose-300" },
  CREDENTIAL_HARVEST:{ label: "Credential Harvesting",   color: "text-purple-400", badge: "bg-purple-950/60 border-purple-700 text-purple-300" },
  SECRECY:           { label: "Concealment Tactics",     color: "text-amber-400",  badge: "bg-amber-950/60 border-amber-700 text-amber-300" },
  PRIZE_SCAM:        { label: "Prize / Advance-Fee Scam",color: "text-yellow-400", badge: "bg-yellow-950/60 border-yellow-700 text-yellow-300" },
  SPAM_EVASION:      { label: "Spam Evasion Signal",     color: "text-zinc-400",   badge: "bg-zinc-900 border-zinc-700 text-zinc-300" },
};

const DEFAULT_META = { label: "Unknown", color: "text-gray-400", badge: "bg-zinc-900 border-zinc-700 text-zinc-300" };

export default function NlpAnalysisCard({ nlpAnalysis }: NlpAnalysisCardProps) {
  const [showAllTriggers, setShowAllTriggers] = useState(false);
  const { intentScore, intentLevel, becCategory, triggers, summary } = nlpAnalysis;

  const getSeverityStyle = (level: string) => {
    switch (level) {
      case "CRITICAL": return {
        dial: "border-rose-500 text-rose-400 bg-rose-950/30 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
        badge: "bg-rose-950/80 border-rose-600 text-rose-300",
        bar: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]",
        header: "border-rose-900/50 from-rose-950/20"
      };
      case "HIGH": return {
        dial: "border-orange-500 text-orange-400 bg-orange-950/30 shadow-[0_0_15px_rgba(249,115,22,0.4)]",
        badge: "bg-orange-950/80 border-orange-600 text-orange-300",
        bar: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]",
        header: "border-orange-900/50 from-orange-950/20"
      };
      case "MEDIUM": return {
        dial: "border-amber-500 text-amber-400 bg-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        badge: "bg-amber-950/80 border-amber-600 text-amber-300",
        bar: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]",
        header: "border-amber-900/50 from-amber-950/20"
      };
      default: return {
        dial: "border-emerald-500 text-emerald-400 bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        badge: "bg-emerald-950/80 border-emerald-600 text-emerald-300",
        bar: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]",
        header: "border-emerald-900/50 from-emerald-950/10"
      };
    }
  };

  const style = getSeverityStyle(intentLevel);
  const displayedTriggers = showAllTriggers ? triggers : triggers.slice(0, 6);

  // Group triggers by category for the category breakdown summary
  const categoryBreakdown = triggers.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`bg-black border rounded-xl p-4 md:p-6 shadow-2xl space-y-5 ${style.header} border-gray-800`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${style.header} to-transparent border-b border-gray-800 pb-4 -mx-4 md:-mx-6 px-4 md:px-6 pt-0`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-2 font-mono font-bold text-xl ${style.dial}`}>
              {intentScore}
              <span className="text-[9px] font-normal text-gray-500 absolute -bottom-2 bg-black px-1 rounded">/100</span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold font-mono">
                  [PHASE 11] NLP SOCIAL ENGINEERING ENGINE
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${style.badge}`}>
                  {intentLevel} INTENT
                </span>
              </div>
              {becCategory && (
                <div className="mt-1">
                  <span className="text-[11px] font-mono text-gray-300 uppercase tracking-wider">
                    Attack Category: <strong className="text-rose-300">{becCategory}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full md:w-48 bg-zinc-900 rounded-full h-3 border border-gray-800 overflow-hidden self-center shrink-0">
            <div
              className={`h-full transition-all duration-1000 ${style.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, intentScore))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className={`p-4 rounded-lg border font-mono text-xs leading-relaxed ${
        intentLevel === "LOW"
          ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-200/80"
          : "bg-zinc-950 border-gray-800 text-gray-300"
      }`}>
        <span className="text-gray-500 text-[10px] uppercase block mb-1">NLP Executive Summary</span>
        {summary}
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider block">
            Manipulation Category Breakdown:
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryBreakdown).map(([cat, count]) => {
              const meta = CATEGORY_META[cat] || DEFAULT_META;
              return (
                <div key={cat} className={`text-[10px] font-mono px-2.5 py-1 rounded border flex items-center gap-1.5 ${meta.badge}`}>
                  <span>{meta.label}</span>
                  <span className="bg-black/40 px-1 py-0.2 rounded font-bold">{count}×</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trigger Phrase Evidence Matrix */}
      {triggers.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">
              Triggered Phrases ({triggers.length} matched):
            </span>
            {triggers.length > 6 && (
              <button
                onClick={() => setShowAllTriggers(!showAllTriggers)}
                className="text-[10px] font-mono text-blue-400 hover:text-blue-300 bg-blue-950/30 border border-blue-900 px-2 py-0.5 rounded transition-colors"
              >
                {showAllTriggers ? "▲ COLLAPSE" : `▼ SHOW ALL (${triggers.length})`}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {displayedTriggers.map((trigger, idx) => {
              const meta = CATEGORY_META[trigger.category] || DEFAULT_META;
              return (
                <div
                  key={idx}
                  className="bg-[#050505] border border-gray-800/80 hover:border-gray-700 p-3 rounded-md transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-white bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
                          "{trigger.phrase}"
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-gray-500 break-all leading-relaxed">
                        <span className="text-gray-600">Context: </span>
                        <span className="text-gray-400 italic">{trigger.context}</span>
                      </p>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-1 bg-zinc-900 border border-zinc-700 text-orange-400 rounded shrink-0">
                      +{trigger.weight}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[#050505] border border-gray-800 rounded text-xs text-emerald-400 font-mono">
          ✓ Clean Language: No social engineering, BEC, or manipulation patterns detected in email body.
        </div>
      )}
    </div>
  );
}
