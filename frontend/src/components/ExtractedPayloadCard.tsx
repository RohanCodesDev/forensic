import React, { useState } from "react";
import { EmailEvidence } from "../types/forensic";

interface ExtractedPayloadCardProps {
  evidence: EmailEvidence;
}

export default function ExtractedPayloadCard({ evidence }: ExtractedPayloadCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySha256 = () => {
    if (evidence.sha256Hash) {
      navigator.clipboard.writeText(evidence.sha256Hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Extracted Intelligence Payload
        </h2>

        {evidence.sha256Hash && (
          <div className="flex items-center gap-2 bg-black border border-gray-800 px-3 py-1 rounded-md">
            <span className="text-[10px] uppercase font-mono text-gray-500">SHA-256:</span>
            <span className="font-mono text-xs text-green-400 font-bold truncate max-w-[140px] sm:max-w-[220px]">
              {evidence.sha256Hash}
            </span>
            <button
              onClick={handleCopySha256}
              className="text-[10px] font-mono text-gray-400 hover:text-white px-1.5 py-0.5 bg-zinc-900 rounded border border-zinc-700 transition-colors"
              title="Copy full SHA-256 to clipboard"
            >
              {copied ? "COPIED ✓" : "COPY"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Origin (From)", val: evidence.from },
          { label: "Destination (To)", val: evidence.to },
          { label: "Subject", val: evidence.subject },
          { label: "Timestamp", val: evidence.date },
          { label: "Message-ID", val: evidence.messageId },
          { label: "Return-Path", val: evidence.returnPath }
        ].map((item, idx) => (
          <div key={idx} className="bg-black border border-gray-800 p-4 rounded-lg flex flex-col justify-between">
            <span className="text-gray-500 text-xs uppercase font-semibold block mb-2">{item.label}</span>
            <span className="text-green-500 font-mono text-sm break-all drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]">
              {item.val || "N/A"}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-black border border-gray-800 p-4 rounded-lg">
        <span className="text-gray-500 text-xs uppercase font-semibold block mb-3">Decrypted Body Snippet</span>
        <pre className="text-sm text-green-500 whitespace-pre-wrap font-mono overflow-y-auto max-h-64 p-4 bg-[#050505] rounded-md border border-gray-800 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent drop-shadow-[0_0_3px_rgba(34,197,94,0.2)]">
          {evidence.textBodySnippet || "No plain text body content."}
        </pre>
      </div>
    </div>
  );
}
