import React, { useState, useRef } from "react";
import InboxScannerModal from "./InboxScannerModal";
import AttackSimulatorModal from "./AttackSimulatorModal";

interface EvidenceIngestionProps {
  file: File | null;
  status: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  loading: boolean;
  onAutoScanComplete?: (results: any[]) => void;
  onEvidenceIngested?: (data: any, analysis: any) => void;
  apiUrl?: string;
}

export default function EvidenceIngestion({
  file,
  status: initialStatus,
  onFileChange,
  onUpload,
  loading,
  onAutoScanComplete,
  onEvidenceIngested,
  apiUrl = "",
}: EvidenceIngestionProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const hasError = status.includes("Error") || status.includes("Fatal");

  const handleSimulate = async (options: any) => {
    setStatus("injecting");
    try {
      const res = await fetch(`${apiUrl}/api/emails/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setStatus("success");
        if (onEvidenceIngested) onEvidenceIngested(json.data, json.analysis);
      } else {
        throw new Error(json.message || "Failed to simulate attack");
      }
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + (err.message || "Error connecting to simulator"));
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-950 shadow-xl">
      {/* Subtle top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      {showScannerModal && (
        <InboxScannerModal 
          onClose={() => setShowScannerModal(false)} 
          onScanComplete={(results) => {
            setShowScannerModal(false);
            if (onAutoScanComplete) {
              onAutoScanComplete(results);
            }
          }} 
        />
      )}

      {showSimulatorModal && (
        <AttackSimulatorModal
          onClose={() => setShowSimulatorModal(false)}
          onSimulate={handleSimulate}
        />
      )}

      <div className="p-6 sm:p-8 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight">Email Intake & Threat Upload</h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">Header parsing · SPF/DKIM/DMARC · Route tracing · AI analysis</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowScannerModal(true)}
              className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase bg-zinc-900 border border-zinc-800 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-zinc-800"
            >
              Scan Inbox
            </button>
            <button
              onClick={() => setShowSimulatorModal(true)}
              className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase bg-rose-950/20 border border-rose-900/50 text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-950/40"
            >
              Simulate
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-800/60" />

        {/* Upload Drop Zone */}
        <div className="relative group rounded-xl border border-dashed border-zinc-800 bg-black/40 hover:border-emerald-500/40 hover:bg-emerald-950/5 transition-all duration-300 p-10 sm:p-14 flex flex-col items-center justify-center gap-6 cursor-pointer">
          {/* Animated corner accents */}
          <span className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-zinc-700 group-hover:border-emerald-600/50 rounded-tl transition-colors duration-300" />
          <span className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-zinc-700 group-hover:border-emerald-600/50 rounded-tr transition-colors duration-300" />
          <span className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-zinc-700 group-hover:border-emerald-600/50 rounded-bl transition-colors duration-300" />
          <span className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-zinc-700 group-hover:border-emerald-600/50 rounded-br transition-colors duration-300" />

          {/* Upload icon */}
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-800/60 group-hover:bg-emerald-950/30 group-hover:shadow-[0_0_24px_rgba(52,211,153,0.12)] transition-all duration-300">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {/* Label */}
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-zinc-200 tracking-tight">
              Drop suspicious email file here
            </p>
            <p className="text-xs text-zinc-500 font-medium">
              .EML format &nbsp;·&nbsp; Max 5 MB &nbsp;·&nbsp; Automated threat inspection
            </p>
          </div>

          <input
            type="file"
            accept=".eml"
            onChange={onFileChange}
            className="file:mr-4 file:py-2 file:px-5 file:rounded-lg file:border file:border-zinc-700 file:text-xs file:font-semibold file:bg-zinc-900 file:text-zinc-200 hover:file:bg-zinc-800 hover:file:border-zinc-600 file:cursor-pointer file:transition-all cursor-pointer text-zinc-500 text-xs max-w-xs"
          />
        </div>

        {/* Selected File Preview */}
        {file && (
          <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100 truncate">{file.name}</p>
                <p className="text-[11px] text-zinc-500 font-medium">Ready for analysis</p>
              </div>
            </div>
            <span className="text-xs text-zinc-500 font-mono tabular-nums shrink-0 ml-4">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={onUpload}
          disabled={loading || !file}
          className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2.5 ${
            loading || !file
              ? "bg-zinc-900/60 text-zinc-600 border border-zinc-800 cursor-not-allowed"
              : "bg-emerald-400 hover:bg-emerald-300 text-zinc-950 border border-emerald-300/60 shadow-[0_0_24px_rgba(52,211,153,0.25)] hover:shadow-[0_0_32px_rgba(52,211,153,0.4)] cursor-pointer"
          }`}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Analyzing Email Threat & Route...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze Email Threat
            </>
          )}
        </button>

        {/* OR Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-zinc-800/60"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Or</span>
          <div className="flex-grow border-t border-zinc-800/60"></div>
        </div>

        {/* Auto Scan Button */}
        <button
          onClick={() => setShowScannerModal(true)}
          className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[inset_0_0_12px_rgba(99,102,241,0.1)] hover:shadow-[0_0_24px_rgba(99,102,241,0.2)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Connect & Auto-Scan Inbox (IMAP)
        </button>

        {/* Status message */}
        {status && (
          <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
            hasError
              ? "bg-red-950/20 border-red-900/50 text-red-400"
              : "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
          }`}>
            <span className="shrink-0 font-bold text-base leading-none mt-0.5">
              {hasError ? "✕" : "✓"}
            </span>
            <span className="leading-relaxed">{status}</span>
          </div>
        )}
      </div>
    </section>
  );
}
