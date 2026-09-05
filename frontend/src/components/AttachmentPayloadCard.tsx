import React, { useState } from "react";
import { AttachmentPayload } from "../types/forensic";

interface AttachmentPayloadCardProps {
  attachments: AttachmentPayload[];
}

function VerdictBadge({ verdict }: { verdict?: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' }) {
  if (!verdict) {
    return (
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded border bg-zinc-900 border-zinc-700 text-gray-400">
        UNSCANNED
      </span>
    );
  }

  const styles = {
    CLEAN: "bg-emerald-950/40 border-emerald-700/60 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.2)]",
    SUSPICIOUS: "bg-amber-950/40 border-amber-600/60 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.2)]",
    MALICIOUS: "bg-rose-950/50 border-rose-600/60 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse",
  };

  const icons = { CLEAN: "✓", SUSPICIOUS: "⚠", MALICIOUS: "☠" };

  return (
    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded border ${styles[verdict]}`}>
      {icons[verdict]} {verdict}
    </span>
  );
}

function ThreatScoreBar({ score }: { score?: number }) {
  if (score === undefined) return null;
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? "#f43f5e" : pct >= 25 ? "#f59e0b" : "#34d399";
  const glow = pct >= 70
    ? "shadow-[0_0_8px_rgba(244,63,94,0.5)]"
    : pct >= 25
    ? "shadow-[0_0_8px_rgba(245,158,11,0.4)]"
    : "shadow-[0_0_8px_rgba(52,211,153,0.3)]";

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider w-20 shrink-0">Threat Score</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${glow}`}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold w-8 text-right" style={{ color }}>{pct}</span>
    </div>
  );
}

export default function AttachmentPayloadCard({ attachments }: AttachmentPayloadCardProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const maliciousCount = attachments.filter(a => a.verdict === 'MALICIOUS').length;
  const suspiciousCount = attachments.filter(a => a.verdict === 'SUSPICIOUS').length;

  return (
    <div className="bg-[#050505] border border-gray-800 rounded-xl p-4 md:p-6 space-y-4" id="section-attachments">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Attachment Malware Sandbox
        </h3>
        <div className="flex items-center gap-2">
          {maliciousCount > 0 && (
            <span className="text-[10px] font-mono bg-rose-950/40 border border-rose-700/50 text-rose-400 px-2 py-0.5 rounded animate-pulse">
              {maliciousCount} MALICIOUS
            </span>
          )}
          {suspiciousCount > 0 && (
            <span className="text-[10px] font-mono bg-amber-950/40 border border-amber-700/50 text-amber-400 px-2 py-0.5 rounded">
              {suspiciousCount} SUSPICIOUS
            </span>
          )}
          <span className="text-[10px] font-mono text-gray-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            {attachments.length} FILE{attachments.length > 1 ? 'S' : ''}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {attachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-10 h-10 text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-mono text-gray-600">No attachments found</p>
          <p className="text-xs font-mono text-gray-700 mt-1">This email was sent without file attachments</p>
        </div>
      ) : (
      <div className="space-y-3">
        {attachments.map((att, idx) => {
          const isOpen = expanded === idx;
          const borderColor =
            att.verdict === 'MALICIOUS' ? 'border-rose-800/60 bg-rose-950/10' :
            att.verdict === 'SUSPICIOUS' ? 'border-amber-800/40 bg-amber-950/5' :
            'border-gray-800 bg-black';

          return (
            <div key={idx} className={`border rounded-lg overflow-hidden transition-all ${borderColor}`}>
              {/* Row */}
              <button
                onClick={() => setExpanded(isOpen ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">
                    {att.verdict === 'MALICIOUS' ? '☠️' : att.verdict === 'SUSPICIOUS' ? '⚠️' : '📄'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-white truncate">{att.filename}</p>
                    <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                      {(att.size / 1024).toFixed(1)} KB
                      {att.contentType && <span> · {att.contentType}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <VerdictBadge verdict={att.verdict} />
                  <svg
                    className={`print-hidden w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Details */}
              <div className={`px-4 pb-4 space-y-4 border-t border-gray-800/60 pt-3 ${isOpen ? 'block' : 'hidden'} print:block`}>

                  {/* Threat Score Bar */}
                  <ThreatScoreBar score={att.threatScore} />

                  {/* Known Malware Alert */}
                  {att.isKnownMalware && att.knownMalwareName && (
                    <div className="flex items-start gap-2 bg-rose-950/30 border border-rose-700/40 rounded-md px-3 py-2">
                      <span className="text-rose-500 shrink-0 mt-0.5">☠</span>
                      <div>
                        <p className="text-xs font-mono font-bold text-rose-400">KNOWN MALWARE MATCH</p>
                        <p className="text-[11px] font-mono text-rose-300/80 mt-0.5">{att.knownMalwareName}</p>
                      </div>
                    </div>
                  )}

                  {/* MIME Mismatch Warning */}
                  {att.mimeTypeMismatch && att.mimeTypeWarning && (
                    <div className="flex items-start gap-2 bg-amber-950/20 border border-amber-700/30 rounded-md px-3 py-2">
                      <span className="text-amber-500 shrink-0">⚠</span>
                      <div>
                        <p className="text-xs font-mono font-bold text-amber-400">MIME TYPE MISMATCH</p>
                        <p className="text-[11px] font-mono text-amber-300/70 mt-0.5">{att.mimeTypeWarning}</p>
                      </div>
                    </div>
                  )}

                  {/* VirusTotal Section */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">VirusTotal Lookup</p>
                    {att.vtDetections !== undefined ? (
                      <div className="flex items-center justify-between bg-black border border-gray-800 rounded px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold ${att.vtDetections > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {att.vtDetections}/{att.vtTotalEngines} engines
                          </span>
                          <span className="text-[10px] text-gray-500">flagged this file</span>
                        </div>
                        {att.vtLink && (
                          <a
                            href={att.vtLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 hover:bg-indigo-900/20 px-2 py-1 rounded transition-colors"
                          >
                            🔎 View Report →
                          </a>
                        )}
                      </div>
                    ) : att.vtLink ? (
                      <div className="flex items-center justify-between bg-black border border-gray-800 rounded px-3 py-2">
                        <span className="text-[10px] font-mono text-gray-500">API Key not configured — manual lookup available</span>
                        <a
                          href={att.vtLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 hover:bg-indigo-900/20 px-2 py-1 rounded transition-colors"
                        >
                          🔎 Search VT →
                        </a>
                      </div>
                    ) : (
                      <div className="bg-black border border-gray-800 rounded px-3 py-2">
                        <span className="text-[10px] font-mono text-gray-600">No hash available for lookup</span>
                      </div>
                    )}
                  </div>

                  {/* SHA-256 Hash */}
                  {att.sha256 && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">SHA-256 Fingerprint</p>
                      <div className="bg-black border border-gray-800 rounded px-3 py-2">
                        <code className="text-[10px] font-mono text-green-500 break-all">{att.sha256}</code>
                      </div>
                    </div>
                  )}

                  {/* Verdict Reasons */}
                  {att.verdictReasons && att.verdictReasons.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Detection Rationale</p>
                      <ul className="space-y-1">
                        {att.verdictReasons.map((reason, ri) => (
                          <li key={ri} className="text-[11px] font-mono text-gray-400 flex items-start gap-2">
                            <span className="text-gray-600 shrink-0 mt-0.5">›</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
