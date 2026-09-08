import React, { useState, useRef, useEffect } from "react";
import InboxScannerModal from "./InboxScannerModal";
import AttackSimulatorModal from "./AttackSimulatorModal";
import InfoTooltip from "./InfoTooltip";
import EmailViewer from "./EmailViewer";
import { parseEmlText, ParsedEmailPreview } from "../utils/emlParser";

interface EvidenceIngestionProps {
  file: File | null;
  status: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  loading: boolean;
  onAutoScanComplete?: (results: any[]) => void;
  onEvidenceIngested?: (data: any, analysis: any) => void;
  onClearFile?: () => void;
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
  onClearFile,
  apiUrl = "",
}: EvidenceIngestionProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedEmailPreview | null>(null);
  const [parsingError, setParsingError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasError = status.includes("Error") || status.includes("Fatal");

  // Synchronize internal status with parent status
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  // Client-side instant parse of .eml file as soon as selected
  useEffect(() => {
    if (!file) {
      setParsedPreview(null);
      setParsingError(null);
      return;
    }

    let isMounted = true;
    file
      .text()
      .then((text) => {
        if (!isMounted) return;
        try {
          const parsed = parseEmlText(text);
          setParsedPreview(parsed);
          setParsingError(null);
        } catch (err: any) {
          console.error("Client EML parsing error:", err);
          setParsingError("Could not parse email headers locally.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error reading file text:", err);
        setParsingError("Error reading file contents.");
      });

    return () => {
      isMounted = false;
    };
  }, [file]);

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

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event("change", { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  return (
    <section className="space-y-6">
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

      {/* Side-by-Side Ingestion Area: Left = File Picker, Right = Email Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: FILE PICKER & INTAKE CONTROLS (5 cols)       */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 p-5 sm:p-6 shadow-xl space-y-5">
            {/* Subtle top highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-100 tracking-tight">
                    Email Intake
                  </h2>
                  <InfoTooltip
                    title="Email Evidence Ingestion"
                    explanation="Select an .eml file to immediately inspect its body, links, and headers in the preview on the right. Click Analyze to run deep AI and forensic intelligence."
                    align="left"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 font-medium pl-10.5">
                Inspect raw headers, links, and sender integrity.
              </p>
            </div>

            {/* Compact Drag & Drop File Picker */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-xl border transition-all duration-200 cursor-pointer p-4 flex flex-col items-center justify-center text-center gap-2.5 ${
                isDragOver
                  ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                  : file
                  ? "border-emerald-700/60 bg-emerald-950/10 hover:border-emerald-600"
                  : "border-dashed border-zinc-800 bg-black/40 hover:border-emerald-500/50 hover:bg-zinc-900/30"
              }`}
            >
              {/* Hidden HTML file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".eml"
                onChange={onFileChange}
                className="hidden"
              />

              {file ? (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between gap-2 bg-zinc-900/90 border border-zinc-700/80 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/80 shrink-0">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1" onClick={(e) => e.stopPropagation()}>
                    <span>Ready for analysis</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Change
                      </button>
                      {onClearFile && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <button
                            type="button"
                            onClick={onClearFile}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">
                      Drop .EML file or click to browse
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Standard RFC 2822 format · Max 5 MB
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Primary Action: Analyze Threat Button */}
            <button
              type="button"
              onClick={onUpload}
              disabled={loading || !file}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                loading || !file
                  ? "bg-zinc-900/60 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                  : "bg-emerald-400 hover:bg-emerald-300 text-zinc-950 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_28px_rgba(52,211,153,0.45)] cursor-pointer"
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Running Deep Forensics...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Analyze Email Threat</span>
                </>
              )}
            </button>

            {/* Auxiliary Tools: IMAP Scanner & Simulator */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono block">
                Additional Threat Feeds
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowScannerModal(true)}
                  className="px-3 py-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>IMAP Inbox</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSimulatorModal(true)}
                  className="px-3 py-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/50 text-rose-300 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Simulate Attack</span>
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {status && (
              <div
                className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium ${
                  hasError
                    ? "bg-red-950/30 border-red-900/60 text-red-300"
                    : "bg-emerald-950/30 border-emerald-900/50 text-emerald-300"
                }`}
              >
                <span className="shrink-0 font-bold text-sm leading-none mt-0.5">
                  {hasError ? "✕" : "✓"}
                </span>
                <span className="leading-relaxed">{status}</span>
              </div>
            )}

            {parsingError && (
              <div className="px-3.5 py-2 bg-amber-950/30 border border-amber-900/50 text-amber-300 text-xs rounded-xl">
                ⚠ {parsingError}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: LIVE EMAIL PREVIEW CARD (7 cols)            */}
        {/* ========================================================= */}
        <div className="lg:col-span-7">
          {parsedPreview ? (
            <EmailViewer
              preview={parsedPreview}
              onAnalyze={onUpload}
              isAnalyzing={loading}
            />
          ) : (
            /* Placeholder when no file is selected yet */
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-8 text-center space-y-4 shadow-xl min-h-[380px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <svg className="w-7 h-7 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="max-w-md space-y-1.5">
                <h3 className="text-sm font-bold text-zinc-200">
                  Live Email Renderer Ready
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Select or drop an <code className="text-emerald-400 font-mono text-[11px]">.eml</code> file on the left. The email will immediately render here with both:
                </p>
              </div>

              {/* View options pill indicator */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Simple View (like Gmail)
                </span>
                <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Enhanced View (Color-Coded)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
