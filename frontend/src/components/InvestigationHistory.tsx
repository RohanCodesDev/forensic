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
    <section className="bg-[#0a0a0a] p-4 md:p-8 border border-gray-800 rounded-xl shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Forensic Case Vault & Investigation Archive
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">
            Persisted evidence cases & cryptographic report records stored in PostgreSQL
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-gray-300 rounded font-mono text-xs flex items-center gap-2 transition-colors"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Records
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 font-mono text-sm flex flex-col items-center justify-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Querying PostgreSQL Archive...
        </div>
      ) : investigations.length === 0 ? (
        <div className="p-12 text-center text-gray-500 font-mono text-xs border border-dashed border-gray-800 rounded-lg">
          <p className="text-gray-400 mb-1">No past investigations found in the database.</p>
          <p className="text-gray-600">Upload a `.eml` file via Live Ingestion to create your first case report.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {investigations.map((item) => {
            const isSelected = item.id === currentActiveId;
            const rep = item.analysisReport;
            const severity = rep?.severity || "LOW";
            const score = rep?.riskScore ?? 0;

            return (
              <div
                key={item.id}
                onClick={() => onSelectCase(item.id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-zinc-950 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                    : "bg-black border-gray-800/90 hover:border-gray-700 hover:bg-[#050505]"
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-white truncate max-w-xs md:max-w-md">
                      {item.subject || item.filename}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      ({item.filename})
                    </span>
                    {isSelected && (
                      <span className="text-[9px] bg-green-950 border border-green-700 text-green-400 px-1.5 py-0.2 rounded font-mono font-bold">
                        ACTIVE CASE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-gray-400 flex-wrap">
                    <span>From: <strong className="text-gray-300">{item.from}</strong></span>
                    <span className="text-gray-600">•</span>
                    <span>Saved: {new Date(item.createdAt).toLocaleString()}</span>
                    {item.sha256Hash && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span className="text-[10px] text-gray-500 truncate max-w-[150px]">
                          SHA256: {item.sha256Hash.substring(0, 12)}...
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {rep ? (
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1 rounded border font-mono text-xs font-bold ${
                        severity === "CRITICAL"
                          ? "bg-rose-950/80 border-rose-600 text-rose-300"
                          : severity === "HIGH"
                          ? "bg-orange-950/80 border-orange-600 text-orange-300"
                          : severity === "MEDIUM"
                          ? "bg-amber-950/80 border-amber-600 text-amber-300"
                          : "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                      }`}>
                        {score}/100 {severity}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-500 bg-zinc-900 px-2 py-1 rounded">
                      UNSCORED
                    </span>
                  )}

                  <button
                    onClick={(e) => onDeleteCase(item.id, e)}
                    className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-950/30 rounded border border-transparent hover:border-rose-900/50 transition-colors"
                    title="Delete Case from Database"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
