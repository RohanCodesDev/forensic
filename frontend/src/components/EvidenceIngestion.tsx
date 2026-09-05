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
    <section className="bg-[#0a0a0a] p-4 md:p-8 border border-gray-800 rounded-xl shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Ingest Evidence Payload (.eml)
        </h2>
        <span className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
          SHA-256 Verified
        </span>
      </div>

      <div className="flex flex-col items-start justify-center p-4 md:p-8 border border-dashed border-gray-700 bg-black rounded-lg hover:border-green-500/50 transition-colors">
        <input 
          type="file" 
          accept=".eml"
          onChange={onFileChange}
          className="mb-6 file:mr-4 file:py-2.5 file:px-5 file:rounded-md file:border-0 file:text-xs file:font-mono file:font-semibold file:bg-gray-900 file:text-gray-300 hover:file:bg-gray-800 cursor-pointer text-gray-500 w-full focus:outline-none"
        />

        {file && (
          <div className="mb-4 w-full flex items-center justify-between bg-zinc-950 border border-zinc-800 p-3 rounded text-xs font-mono text-gray-300">
            <span className="truncate">Selected File: <strong className="text-green-400">{file.name}</strong></span>
            <span className="text-gray-500 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        <button 
          onClick={onUpload}
          disabled={loading || !file}
          className={`w-full py-3 rounded-md uppercase tracking-wider font-semibold font-mono text-sm border transition-all shadow-lg flex items-center justify-center gap-2 ${
            loading || !file
              ? "bg-gray-900/50 text-gray-600 border-gray-800 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800 border-gray-700 hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]"
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Executing Parser & Threat Engines...</span>
            </>
          ) : (
            <>
              <span>⚡ Execute Forensic Parsing Sequence</span>
            </>
          )}
        </button>

        {status && (
          <div className={`mt-5 w-full p-4 rounded-md border bg-black ${
            status.includes("Error") || status.includes("Fatal") 
              ? "border-red-900/60 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]" 
              : "border-green-900/60 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
          }`}>
            <p className="font-mono text-xs flex items-center gap-2">
              <span className="animate-pulse">_</span> {status}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
