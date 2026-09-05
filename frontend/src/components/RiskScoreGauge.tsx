import React from "react";
import { RiskEvaluation } from "../types/forensic";

interface RiskScoreGaugeProps {
  riskEvaluation: RiskEvaluation;
}

export default function RiskScoreGauge({ riskEvaluation }: RiskScoreGaugeProps) {
  const { score, severity, summary, factors } = riskEvaluation;

  const getSeverityClasses = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return {
          dial: "border-rose-500 text-rose-400 bg-rose-950/30 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
          badge: "bg-rose-950/80 border-rose-600 text-rose-300",
          bar: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]",
          factorBadge: "border-rose-800 text-rose-400 bg-rose-950/40"
        };
      case "HIGH":
        return {
          dial: "border-orange-500 text-orange-400 bg-orange-950/30 shadow-[0_0_15px_rgba(249,115,22,0.4)]",
          badge: "bg-orange-950/80 border-orange-600 text-orange-300",
          bar: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]",
          factorBadge: "border-orange-800 text-orange-400 bg-orange-950/40"
        };
      case "MEDIUM":
        return {
          dial: "border-amber-500 text-amber-400 bg-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
          badge: "bg-amber-950/80 border-amber-600 text-amber-300",
          bar: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]",
          factorBadge: "border-amber-800 text-amber-400 bg-amber-950/40"
        };
      default:
        return {
          dial: "border-emerald-500 text-emerald-400 bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.4)]",
          badge: "bg-emerald-950/80 border-emerald-600 text-emerald-300",
          bar: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]",
          factorBadge: "border-emerald-800 text-emerald-400 bg-emerald-950/40"
        };
    }
  };

  const style = getSeverityClasses(severity);

  return (
    <div className="bg-black border border-gray-800 rounded-xl p-4 md:p-6 shadow-2xl space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div className="flex items-center gap-4">
          <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-2 font-mono font-bold text-xl ${style.dial}`}>
            {score}
            <span className="text-[9px] font-normal text-gray-500 absolute -bottom-2 bg-black px-1 rounded">/100</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold font-mono">
                [PHASE 10] RISK SCORE ENGINE
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${style.badge}`}>
                {severity} SEVERITY
              </span>
            </div>
            <p className="text-xs text-gray-300 font-mono mt-1">
              {summary}
            </p>
          </div>
        </div>

        <div className="w-full md:w-48 bg-zinc-900 rounded-full h-3 border border-gray-800 overflow-hidden self-center">
          <div
            className={`h-full transition-all duration-1000 ${style.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>

      {/* Itemized Contributing Risk Factors */}
      {factors && factors.length > 0 ? (
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider block">
            Contributing Risk Factors ({factors.length}):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {factors.map((f, idx) => {
              const fStyle = getSeverityClasses(f.severity);
              return (
                <div key={idx} className="bg-[#050505] border border-gray-800 p-3 rounded-lg flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-200">{f.name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase ${fStyle.factorBadge}`}>
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">{f.description}</p>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-1 bg-zinc-900 border border-zinc-700 text-rose-400 rounded shrink-0">
                    +{f.points}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[#050505] border border-gray-800 rounded text-xs text-emerald-400 font-mono">
          ✓ Clean Audit: Zero malicious factors detected across headers, authentication, links, and threat feeds.
        </div>
      )}
    </div>
  );
}
