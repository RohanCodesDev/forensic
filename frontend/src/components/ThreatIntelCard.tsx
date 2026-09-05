import React from "react";
import { ThreatIndicator } from "../types/forensic";

interface ThreatIntelCardProps {
  threatIntel: ThreatIndicator[];
}

export default function ThreatIntelCard({ threatIntel }: ThreatIntelCardProps) {
  if (!threatIntel || threatIntel.length === 0) return null;

  return (
    <div className="bg-[#050505] border border-gray-800 p-4 md:p-6 rounded-lg space-y-4">
      <div className="border-b border-gray-800 pb-3 mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2 font-mono">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Global Threat Intelligence Feeds (CTI)
        </h3>
        <p className="text-xs text-gray-500 font-mono mt-1">
          Cross-referencing IPs, Domains, and URLs against AbuseIPDB, URLhaus, and VirusTotal IOC databases
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {threatIntel.map((threat, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-md border flex flex-col justify-between gap-2 ${
              threat.isMalicious
                ? "bg-rose-950/20 border-rose-900/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                : "bg-black border-gray-800"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`text-xs font-mono font-bold truncate ${threat.isMalicious ? "text-rose-400" : "text-gray-300"}`}>
                {threat.value}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0 ${
                  threat.type === "IP"
                    ? "bg-blue-900/50 text-blue-300"
                    : threat.type === "URL"
                    ? "bg-purple-900/50 text-purple-300"
                    : "bg-amber-900/50 text-amber-300"
                }`}
              >
                {threat.type}
              </span>
            </div>

            <div className="flex items-end justify-between gap-2 pt-2 border-t border-gray-900">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-gray-500 uppercase font-mono">{threat.source}</span>
                <span className="text-xs text-gray-400 truncate font-mono">
                  {threat.categories?.join(", ") || "Known entity"}
                </span>
              </div>
              {threat.isMalicious ? (
                <span className="text-xs bg-rose-900 text-rose-200 px-2 py-0.5 rounded font-bold font-mono animate-pulse shrink-0">
                  MALICIOUS
                </span>
              ) : (
                <span className="text-xs text-emerald-500 font-mono shrink-0">
                  CLEAN
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
