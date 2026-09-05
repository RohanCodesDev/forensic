import React from "react";
import { BadgeInfo } from "../types/forensic";

interface AuthAuditCardProps {
  spfResult?: string;
  dkimResult?: string;
  dmarcResult?: string;
  onOpenBadge?: (badge: BadgeInfo) => void;
}

export default function AuthAuditCard({
  spfResult = "MISSING",
  dkimResult = "MISSING",
  dmarcResult = "MISSING",
  onOpenBadge
}: AuthAuditCardProps) {
  const protocols = [
    {
      name: "SPF Verification",
      status: spfResult,
      key: "SPF",
      description: "SPF (Sender Policy Framework) verifies whether the sending mail server IP is authorized by the domain owner in DNS records to prevent sender address forging."
    },
    {
      name: "DKIM Signature",
      status: dkimResult,
      key: "DKIM",
      description: "DKIM (DomainKeys Identified Mail) provides a cryptographic digital signature proving that email headers and content were not tampered with during transit."
    },
    {
      name: "DMARC Alignment",
      status: dmarcResult,
      key: "DMARC",
      description: "DMARC leverages SPF and DKIM to enforce strict domain alignment and specify handling policies (reject, quarantine, or none) for unauthorized spoofed messages."
    }
  ];

  return (
    <div className="bg-black border border-gray-800 p-4 md:p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 text-xs uppercase font-semibold tracking-wider flex items-center gap-2 font-mono">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Protocol Authentication Audit (SPF / DKIM / DMARC)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {protocols.map((proto, i) => {
          const isPass = proto.status === "PASS" || proto.status === "SIGNED";
          const isFail = ["FAIL", "SOFTFAIL", "HARDFAIL", "REJECT", "BADSIG", "PERMERROR"].includes(proto.status);

          return (
            <div
              key={i}
              className="bg-[#050505] border border-gray-800 p-4 rounded-md flex flex-col justify-between hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs font-mono uppercase">{proto.name}</span>
                {onOpenBadge && (
                  <button
                    onClick={() => onOpenBadge({ title: `${proto.key} AUTHENTICATION`, description: proto.description })}
                    className="text-[10px] text-gray-500 hover:text-white"
                  >
                    ⓘ
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <span
                  className={`font-mono text-sm font-bold px-3 py-1 rounded border ${
                    isPass
                      ? "bg-emerald-950/80 border-emerald-600/80 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      : isFail
                      ? "bg-rose-950/80 border-rose-600/80 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400"
                  }`}
                >
                  {proto.status}
                </span>
                <span className="text-xs text-gray-600 font-mono">
                  {isPass ? "✓ VALIDATED" : isFail ? "✕ INVALID" : "⚠ UNCHECKED"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
