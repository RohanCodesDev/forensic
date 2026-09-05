import React from "react";
import { AttachmentPayload } from "../types/forensic";

interface AttachmentPayloadCardProps {
  attachments: AttachmentPayload[];
}

export default function AttachmentPayloadCard({ attachments }: AttachmentPayloadCardProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="bg-black border border-gray-800 p-4 md:p-6 rounded-lg">
      <span className="text-gray-500 text-xs uppercase font-semibold block mb-3 font-mono">
        Attachment Payload Analysis ({attachments.length})
      </span>
      <div className="space-y-2">
        {attachments.map((att, idx) => (
          <div
            key={idx}
            className={`p-3 rounded border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 font-mono text-xs ${
              att.isRisky
                ? "bg-rose-950/30 border-rose-800 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                : "bg-[#050505] border-gray-800 text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-500">📄</span>
              <span className="font-semibold break-all">{att.filename}</span>
              <span className="text-gray-600">({(att.size / 1024).toFixed(1)} KB)</span>
              {att.sha256 && (
                <span className="text-[10px] text-gray-500 font-normal">
                  [SHA-256: {att.sha256.substring(0, 10)}...]
                </span>
              )}
            </div>

            {att.isRisky ? (
              <span className="bg-rose-950 border border-rose-700 text-rose-400 px-2 py-0.5 rounded font-bold animate-pulse">
                ⚠️ RISKY EXECUTABLE EXTENSION
              </span>
            ) : (
              <span className="text-gray-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px]">
                SAFE EXTENSION
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
