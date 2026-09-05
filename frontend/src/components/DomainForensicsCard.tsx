import React from "react";
import { DomainAnalysis } from "../types/forensic";

interface DomainForensicsCardProps {
  domainAnalysis: DomainAnalysis | null;
}

export default function DomainForensicsCard({ domainAnalysis }: DomainForensicsCardProps) {
  if (!domainAnalysis) return null;

  return (
    <div className="bg-black border border-gray-800 p-4 md:p-6 rounded-lg">
      <h3 className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-4 flex items-center gap-2 font-mono">
        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        Domain Forensics & Brand Impersonation
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#050505] border border-gray-800 p-4 rounded-md flex flex-col justify-between">
          <div>
            <span className="text-gray-500 text-xs font-mono uppercase block mb-1">Sender Domain Root</span>
            <span className="text-purple-400 font-mono text-sm break-all font-bold drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]">
              {domainAnalysis.domain || "N/A"}
            </span>
          </div>
          {domainAnalysis.isFreemail && (
            <div className="mt-3">
              <span className="text-xs bg-amber-950/50 border border-amber-800 text-amber-500 px-2 py-0.5 rounded font-mono">
                ⚠ FREEMAIL PROVIDER (GMAIL/YAHOO/ETC.)
              </span>
            </div>
          )}
        </div>

        <div className="bg-[#050505] border border-gray-800 p-4 rounded-md">
          <span className="text-gray-500 text-xs font-mono uppercase block mb-1">Brand Impersonation Target</span>
          {domainAnalysis.brandImpersonation?.matchType ? (
            <div className="flex flex-col gap-1.5 mt-2">
              <span className="text-rose-400 font-mono text-sm font-bold uppercase animate-pulse drop-shadow-[0_0_5px_rgba(244,63,94,0.4)]">
                TARGET: {domainAnalysis.brandImpersonation.matchedBrand}
              </span>
              <span className="text-xs text-rose-500/80 font-mono">
                TYPE: {domainAnalysis.brandImpersonation.matchType} 
                {domainAnalysis.brandImpersonation.matchType === "TYPOSQUAT" && ` (Levenshtein Distance: ${domainAnalysis.brandImpersonation.distance})`}
              </span>
            </div>
          ) : (
            <div className="mt-2 text-emerald-500 font-mono text-sm flex items-center gap-1.5">
              <span>✓</span> NO BRAND MATCHES / TYPOSQUATTING DETECTED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
