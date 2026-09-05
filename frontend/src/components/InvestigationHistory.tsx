import React, { useState, useEffect } from "react";
import { InvestigationSummary, ForensicCase } from "../types/forensic";

interface InvestigationHistoryProps {
  investigations: InvestigationSummary[];
  loading: boolean;
  onSelectCase: (id: string) => void;
  onDeleteCase: (id: string, e: React.MouseEvent) => void;
  onRefresh: () => void;
  currentActiveId?: string;
  apiUrl: string;
}

export default function InvestigationHistory({
  investigations,
  loading,
  onSelectCase,
  onDeleteCase,
  onRefresh,
  currentActiveId,
  apiUrl,
}: InvestigationHistoryProps) {
  const [cases, setCases] = useState<ForensicCase[]>([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/cases`);
        const json = await res.json();
        if (res.ok && json.data) {
          setCases(json.data.filter((c: ForensicCase) => c.status !== "CLOSED"));
        }
      } catch (err) {
        console.error("Failed to fetch cases for assignment:", err);
      }
    };
    fetchCases();
  }, [apiUrl]);

  const handleAssignToCase = async (
    emailId: string,
    caseId: string,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation();
    if (!caseId) return;
    try {
      const res = await fetch(`${apiUrl}/api/cases/${caseId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      if (res.ok) {
        alert("Evidence successfully linked to case.");
        onRefresh();
      } else {
        alert("Failed to assign evidence to case.");
      }
    } catch (err) {
      console.error("Failed to assign email to case:", err);
    }
  };

  const severityStyles: Record<string, string> = {
    CRITICAL: "border-red-800/70 text-red-400 bg-red-950/30",
    HIGH: "border-orange-800/70 text-orange-400 bg-orange-950/30",
    MEDIUM: "border-amber-800/70 text-amber-400 bg-amber-950/30",
    LOW: "border-emerald-800/70 text-emerald-400 bg-emerald-950/30",
  };

  return (
    <section className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 sm:p-6 space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
            <h2 className="font-bold text-zinc-100 text-xs sm:text-sm uppercase tracking-widest">
              Forensic Case Archive
              <span className="text-zinc-600 font-normal ml-2">// PostgreSQL Database</span>
            </h2>
          </div>
          <p className="text-[11px] text-zinc-500 pl-4">
            Cryptographically sealed records &nbsp;·&nbsp; {investigations.length} file{investigations.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-300 rounded-md text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span className="text-sky-400">↻</span>
          Sync Vault
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-10 text-center text-zinc-500 text-xs tracking-widest">
          ▶ Querying PostgreSQL Archive...
        </div>
      ) : investigations.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-zinc-800 rounded-lg space-y-1.5">
          <p className="text-zinc-400 text-xs">▶ No Persisted Investigations Found</p>
          <p className="text-zinc-600 text-[11px]">
            Upload an .eml evidence payload in the Ingestion tab to create your first dossier.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {investigations.map((item) => {
            const isSelected = item.id === currentActiveId;
            const severity = item.analysisReport?.severity || "LOW";
            const score = item.analysisReport?.riskScore ?? 0;

            return (
              <div
                key={item.id}
                onClick={() => onSelectCase(item.id)}
                className={`px-4 py-3 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-zinc-900 border-zinc-600 text-white shadow-sm"
                    : "bg-black/50 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/40"
                }`}
              >
                {/* Left: Info */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-200 truncate max-w-xs md:max-w-sm">
                      {item.subject || item.filename}
                    </span>
                    <span className="text-[10px] text-zinc-600">({item.filename})</span>
                    {isSelected && (
                      <span className="text-[9px] bg-zinc-800 border border-emerald-600/60 text-emerald-400 px-1.5 py-0.5 rounded font-bold tracking-widest">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 flex-wrap">
                    <span>
                      FROM: <span className="text-zinc-400">{item.from}</span>
                    </span>
                    <span className="text-zinc-700">·</span>
                    <span className="tabular-nums">
                      {new Date(item.createdAt).toISOString().replace("T", " ").substring(0, 16)}
                    </span>
                    {item.sha256Hash && (
                      <>
                        <span className="text-zinc-700">·</span>
                        <span className="text-zinc-600 tabular-nums">
                          {item.sha256Hash.substring(0, 8)}...
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {cases.length > 0 && (
                    <select
                      className="bg-zinc-950 border border-zinc-800 text-zinc-500 text-[10px] rounded-md px-2 py-1 focus:border-amber-600 outline-none hover:border-zinc-700 transition-colors cursor-pointer"
                      onChange={(e) => handleAssignToCase(item.id, e.target.value, e)}
                      onClick={(e) => e.stopPropagation()}
                      defaultValue=""
                    >
                      <option value="" disabled>Assign to Case...</option>
                      {cases.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold tracking-wider uppercase ${
                      severityStyles[severity] || severityStyles.LOW
                    }`}
                  >
                    {score}/{100} {severity}
                  </span>

                  <button
                    onClick={(e) => onDeleteCase(item.id, e)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 rounded-md hover:bg-zinc-900 transition-colors"
                    title="Delete investigation record"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
