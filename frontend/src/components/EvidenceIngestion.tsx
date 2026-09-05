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
  loading
}: EvidenceIngestionProps) {
  return (
    <section className="bg-zinc-950 p-5 sm:p-6 border border-zinc-800 rounded relative">
      {/* Corner crosshairs */}
      <span className="absolute -top-1.5 -left-1.5 text-zinc-600 font-mono text-xs">+</span>
      <span className="absolute -top-1.5 -right-1.5 text-zinc-600 font-mono text-xs">+</span>
      <span className="absolute -bottom-1.5 -left-1.5 text-zinc-600 font-mono text-xs">+</span>
      <span className="absolute -bottom-1.5 -right-1.5 text-zinc-600 font-mono text-xs">+</span>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400"></span>
            <h2 className="text-xs sm:text-sm font-mono font-bold text-zinc-100 uppercase tracking-widest">
              [ EVIDENCE INGESTION // RFC-822 ARTIFACT PARSER ]
            </h2>
          </div>
          <span className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
            SHA-256 HASH VERIFICATION
          </span>
        </div>

        <div className="p-6 sm:p-8 border border-dashed border-zinc-800 hover:border-zinc-700 bg-black rounded transition-colors flex flex-col items-center justify-center">
          <div className="font-mono text-xs text-zinc-400 mb-1 text-center">
            SELECT EVIDENCE FILE (.EML) FOR FORENSIC EXTRACTION
          </div>
          <p className="font-mono text-[10px] text-zinc-600 mb-5">BUFFER LIMIT: 5.0 MB // STRICT RFC MIME VALIDATION</p>

          <input 
            type="file" 
            accept=".eml"
            onChange={onFileChange}
            className="mb-4 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-zinc-700 file:text-xs file:font-mono file:font-semibold file:bg-zinc-900 file:text-zinc-300 hover:file:bg-zinc-800 cursor-pointer text-zinc-500 text-xs font-mono max-w-sm"
          />

          {file && (
            <div className="w-full max-w-md flex items-center justify-between bg-zinc-950 border border-zinc-800 p-2.5 rounded text-xs font-mono text-zinc-300 mt-2">
              <span className="truncate flex items-center gap-2">
                <span className="text-emerald-400 font-bold">&gt;</span>
                <span className="text-zinc-200">{file.name}</span>
              </span>
              <span className="text-zinc-500 text-[11px] shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          <div className="w-full max-w-md mt-5">
            <button 
              onClick={onUpload}
              disabled={loading || !file}
              className={`w-full py-2.5 rounded uppercase font-mono text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loading || !file
                  ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                  : "bg-zinc-100 hover:bg-white text-black border border-zinc-300 shadow-sm"
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-pulse">PARSING RAW EVIDENCE BUFFER...</span>
                </>
              ) : (
                <>
                  <span>[ EXECUTE FORENSIC EXTRACTION ]</span>
                </>
              )}
            </button>
          </div>

          {status && (
            <div className={`mt-4 w-full max-w-md p-2.5 rounded border font-mono text-xs ${
              status.includes("Error") || status.includes("Fatal") 
                ? "bg-red-950/20 border-red-900/60 text-red-400" 
                : "bg-zinc-900 border-zinc-700 text-emerald-400"
            }`}>
              <p className="truncate">&gt; {status}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
