import React from "react";
import { UrlAnalysisResult, BadgeInfo } from "../types/forensic";

interface UrlAnalysisCardProps {
  urlAnalysis: UrlAnalysisResult[];
  onOpenBadge: (badge: BadgeInfo) => void;
}

export default function UrlAnalysisCard({ urlAnalysis, onOpenBadge }: UrlAnalysisCardProps) {
  if (!urlAnalysis || urlAnalysis.length === 0) return null;

  return (
    <div className="bg-black border border-gray-800 p-4 md:p-6 rounded-lg">
      <h3 className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-4 flex items-center gap-2 font-mono">
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Embedded Links & URL Risk Analysis ({urlAnalysis.length})
      </h3>

      <div className="space-y-3">
        {urlAnalysis.map((urlObj, index) => {
          const isRisky = urlObj.riskScore > 0;
          return (
            <div
              key={index}
              className={`bg-[#050505] border p-4 rounded-md flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
                isRisky ? "border-rose-900/50" : "border-gray-800"
              }`}
            >
              <div className="flex-1 overflow-hidden min-w-0">
                <span className={`block font-mono text-sm truncate ${isRisky ? "text-rose-400 font-bold" : "text-gray-400"}`}>
                  {urlObj.url}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {urlObj.isHttp && (
                  <button
                    onClick={() => onOpenBadge({
                      title: "HTTP (INSECURE)",
                      description: "This link uses unencrypted HTTP instead of HTTPS. Attackers use this to intercept credentials or data in transit, or simply because they set up a cheap, throwaway server."
                    })}
                    className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-1 rounded border border-zinc-700 font-mono hover:bg-zinc-800 transition-colors"
                  >
                    HTTP (INSECURE)
                  </button>
                )}

                {urlObj.isShortener && (
                  <button
                    onClick={() => onOpenBadge({
                      title: "SHORTENER DETECTED",
                      description: "This link uses a URL shortener (like bit.ly). Phishers use shorteners to mask their true malicious destination from both the victim and automated spam filters."
                    })}
                    className="text-[10px] bg-amber-950/50 text-amber-500 px-2 py-1 rounded border border-amber-800 font-mono hover:bg-amber-900/80 transition-colors"
                  >
                    SHORTENER
                  </button>
                )}

                {urlObj.isIPBased && (
                  <button
                    onClick={() => onOpenBadge({
                      title: "IP ROUTING",
                      description: "This link points directly to an IP address instead of a domain name. Legitimate companies almost never do this. It is a massive red flag indicating a temporary, malicious server."
                    })}
                    className="text-[10px] bg-rose-950/80 text-rose-400 px-2 py-1 rounded border border-rose-800 font-mono hover:bg-rose-900 transition-colors"
                  >
                    IP ROUTING
                  </button>
                )}

                {urlObj.isPunycode && (
                  <button
                    onClick={() => onOpenBadge({
                      title: "PUNYCODE HOMOGRAPH ATTACK",
                      description: "This link uses foreign character sets (like Cyrillic) to mimic English letters. It tricks your browser into displaying a fake domain that looks exactly like a real one."
                    })}
                    className="text-[10px] bg-red-950/80 text-red-400 px-2 py-1 rounded border border-red-800 font-mono animate-pulse hover:bg-red-900 transition-colors"
                  >
                    PUNYCODE HOMOGRAPH
                  </button>
                )}

                {urlObj.isBaitAndSwitch && (
                  <button
                    onClick={() => onOpenBadge({
                      title: "BAIT & SWITCH LINK",
                      description: "The visible text of this link doesn't match its actual destination. The attacker is trying to trick you into clicking what looks like a safe URL, but redirects you to a malicious site."
                    })}
                    className="text-[10px] bg-red-950/80 text-red-400 px-2 py-1 rounded border border-red-800 font-mono animate-pulse hover:bg-red-900 transition-colors"
                  >
                    BAIT & SWITCH LINK
                  </button>
                )}

                {urlObj.brandTarget && (
                  <button
                    onClick={() => onOpenBadge({
                      title: "BRAND IMPERSONATION",
                      description: `This URL contains the brand name '${urlObj.brandTarget}' in the path to trick you into thinking it's an official link, but the root domain belongs to someone else.`
                    })}
                    className="text-[10px] bg-purple-950/50 text-purple-400 px-2 py-1 rounded border border-purple-800 font-mono animate-pulse hover:bg-purple-900/80 transition-colors"
                  >
                    BRAND: {urlObj.brandTarget.toUpperCase()}
                  </button>
                )}

                {urlObj.suspiciousKeywords.length > 0 && (
                  <button
                    onClick={() => onOpenBadge({
                      title: "SUSPICIOUS KEYWORDS",
                      description: `This URL contains keywords often used in phishing attacks: ${urlObj.suspiciousKeywords.join(", ")}.`
                    })}
                    className="text-[10px] bg-orange-950/50 text-orange-400 px-2 py-1 rounded border border-orange-800 font-mono hover:bg-orange-900/80 transition-colors"
                  >
                    KEYWORDS: {urlObj.suspiciousKeywords.join(", ")}
                  </button>
                )}

                {!isRisky && (
                  <span className="text-[10px] bg-emerald-950/30 text-emerald-500 px-2 py-1 rounded border border-emerald-900 font-mono">
                    NEUTRAL
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
