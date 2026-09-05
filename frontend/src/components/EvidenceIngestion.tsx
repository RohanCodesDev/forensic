import React from "react";

interface EvidenceIngestionProps {
  file: File | null;
  status: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  loading: boolean;
}

export default function EvidenceIngestion({
  file,
  status,
  onFileChange,
  onUpload,
  loading,
}: EvidenceIngestionProps) {
  const hasError = status.includes("Error") || status.includes("Fatal");

  return (
    <section className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 sm:p-6 relative overflow-hidden">
      {/* Subtle corner crosshairs */}
      <span className="absolute top-2 left-2 text-zinc-800 font-mono text-[10px] leading-none select-none">+</span>
      <span className="absolute top-2 right-2 text-zinc-800 font-mono text-[10px] leading-none select-none">+</span>
      <span className="absolute bottom-2 left-2 text-zinc-800 font-mono text-[10px] leading-none select-none">+</span>
      <span className="absolute bottom-2 right-2 text-zinc-800 font-mono text-[10px] leading-none select-none">+</span>

      <div className="space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            <h2 className="font-mono font-bold text-zinc-100 text-xs sm:text-sm uppercase tracking-widest">
              Evidence Ingestion
              <span className="text-zinc-600 font-normal ml-2">// RFC-822 Artifact Parser</span>
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded tracking-wider">
            SHA-256 Hash Verification
          </span>
        </div>

        {/* Drop Zone */}
        <div className="p-8 sm:p-10 border border-dashed border-zinc-800 hover:border-zinc-700 bg-black/60 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center gap-4">
          <div className="text-center space-y-1">
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
              Select Evidence File (.EML) for Forensic Extraction
            </p>
            <p className="font-mono text-[10px] text-zinc-600">
              Buffer Limit: 5.0 MB &nbsp;·&nbsp; Strict RFC MIME Validation
            </p>
          </div>

          <input
            type="file"
            accept=".eml"
            onChange={onFileChange}
            className="file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border file:border-zinc-700 file:text-[11px] file:font-mono file:font-semibold file:bg-zinc-900 file:text-zinc-300 hover:file:bg-zinc-800 hover:file:border-zinc-600 file:cursor-pointer file:transition-colors cursor-pointer text-zinc-500 text-xs font-mono max-w-sm"
          />

          {file && (
            <div className="w-full max-w-md flex items-center justify-between bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg font-mono text-xs text-zinc-300">
              <span className="truncate flex items-center gap-2 min-w-0">
                <span className="text-emerald-400 font-bold shrink-0">▶</span>
                <span className="text-zinc-200 truncate">{file.name}</span>
              </span>
              <span className="text-zinc-500 text-[11px] shrink-0 ml-3 tabular-nums">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}

          <div className="w-full max-w-md">
            <button
              onClick={onUpload}
              disabled={loading || !file}
              className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                loading || !file
                  ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                  : "bg-zinc-100 hover:bg-white text-black border border-zinc-300 shadow-sm cursor-pointer hover:shadow-md"
              }`}
            >
              {loading ? (
                <span className="animate-pulse tracking-widest">Parsing Raw Evidence Buffer...</span>
              ) : (
                <span>[ Execute Forensic Extraction ]</span>
              )}
            </button>
          </div>

          {status && (
            <div
              className={`w-full max-w-md px-3 py-2.5 rounded-lg border font-mono text-[11px] ${
                hasError
                  ? "bg-red-950/20 border-red-900/50 text-red-400"
                  : "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
              }`}
            >
              <p className="flex items-start gap-2">
                <span className="shrink-0">{hasError ? "✗" : "▶"}</span>
                <span className="break-words">{status}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
