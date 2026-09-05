import React from "react";
import { InvestigationSummary } from "../types/forensic";

interface InvestigationHistoryProps {
  investigations: InvestigationSummary[];
  loading: boolean;
  onSelectCase: (id: string) => void;
  onDeleteCase: (id: string, e: React.MouseEvent) => void;
  onRefresh: () => void;
  currentActiveId?: string;
}

export default function InvestigationHistory({
  investigations,
  loading,
  onSelectCase,
  onDeleteCase,
  onRefresh,
  currentActiveId
}: InvestigationHistoryProps) {
  return (
    <section className="bg-zinc-950 p-5 sm:p-6 border border-zinc-800 rounded space-y-4 font-mono">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400"></span>
            <h2 className="text-xs sm:text-sm font-bold text-zinc-100 uppercase tracking-widest">
              [ FORENSIC CASE ARCHIVE // POSTGRESQL DATABASE ]
            </h2>
          </div>
          <p className="text-[11px] text-zinc-500">
            Cryptographically sealed investigation records ({investigations.length} files)
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>[ SYNC VAULT ]</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-500 text-xs">
          &gt; QUERYING POSTGRESQL ARCHIVE...
        </div>
      ) : investigations.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded">
          <p className="text-zinc-400 mb-1">&gt; NO PERSISTED INVESTIGATIONS FOUND</p>
          <p className="text-zinc-600 text-[11px]">Upload an .eml evidence payload in the Ingestion tab to create your first dossier.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {investigations.map((item) => {
            const isSelected = item.id === currentActiveId;
            const rep = item.analysisReport;
            const severity = rep?.severity || "LOW";
            const score = rep?.riskScore ?? 0;

            return (
              <div
                key={item.id}
                onClick={() => onSelectCase(item.id)}
                className={`p-3 rounded border transition-colors cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-zinc-900 border-zinc-500 text-white"
                    : "bg-black border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-zinc-200 truncate max-w-xs md:max-w-md">
                      {item.subject || item.filename}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      ({item.filename})
                    </span>
                    {isSelected && (
                      <span className="text-[9px] bg-zinc-800 border border-emerald-500 text-emerald-400 px-1 py-0.2 rounded font-bold">
                        [ACTIVE]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap">
                    <span>FROM: <span className="text-zinc-300">{item.from}</span></span>
                    <span className="text-zinc-700">|</span>
                    <span>SAVED: {new Date(item.createdAt).toISOString().replace("T", " ").substring(0, 16)}</span>
                    {item.sha256Hash && (
                      <>
                        <span className="text-zinc-700">|</span>
                        <span className="text-zinc-500">HASH: {item.sha256Hash.substring(0, 8)}...</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${
                      severity === "CRITICAL"
                        ? "border-red-800 text-red-400 bg-red-950/40"
                        : severity === "HIGH"
                        ? "border-orange-800 text-orange-400 bg-orange-950/40"
                        : severity === "MEDIUM"
                        ? "border-amber-800 text-amber-400 bg-amber-950/40"
                        : "border-emerald-800 text-emerald-400 bg-emerald-950/40"
                    }`}>
                      {score}/100 {severity}
                    </span>
                  </div>

                  <button
                    onClick={(e) => onDeleteCase(item.id, e)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-900 transition-colors"
                    title="Delete investigation record"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
