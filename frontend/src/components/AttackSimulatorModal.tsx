import React, { useState } from "react";

interface AttackSimulatorModalProps {
  onClose: () => void;
  onSimulate: (options: any) => Promise<void>;
}

export default function AttackSimulatorModal({ onClose, onSimulate }: AttackSimulatorModalProps) {
  const [spoofedSender, setSpoofedSender] = useState(true);
  const [maliciousAttachment, setMaliciousAttachment] = useState(true);
  const [foreignRouting, setForeignRouting] = useState(true);
  const [socialEngineering, setSocialEngineering] = useState(true);
  const [status, setStatus] = useState<"idle" | "injecting">("idle");

  const handleInject = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("injecting");
    await onSimulate({ spoofedSender, maliciousAttachment, foreignRouting, socialEngineering });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-rose-900/50 rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.15)] w-full max-w-md overflow-hidden relative"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-rose-900/30 bg-rose-950/20 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            Attack Simulator
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Inject a highly realistic mock threat into your system</p>
        </div>

        {/* Body */}
        <form onSubmit={handleInject} className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={spoofedSender}
                onChange={(e) => setSpoofedSender(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-zinc-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-zinc-950 bg-zinc-900"
              />
              <div>
                <div className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">CEO Impersonation (Spoofed Sender)</div>
                <div className="text-xs text-zinc-500">Injects a forged From header mimicking the CEO to bypass basic filters.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={socialEngineering}
                onChange={(e) => setSocialEngineering(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-zinc-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-zinc-950 bg-zinc-900"
              />
              <div>
                <div className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">Business Email Compromise (NLP)</div>
                <div className="text-xs text-zinc-500">Generates high-urgency text demanding a wire transfer to trigger the AI heuristics.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={foreignRouting}
                onChange={(e) => setForeignRouting(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-zinc-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-zinc-950 bg-zinc-900"
              />
              <div>
                <div className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">Foreign Routing (Geo Map)</div>
                <div className="text-xs text-zinc-500">Traces the email origin through high-risk Russian infrastructure to light up the Globe.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={maliciousAttachment}
                onChange={(e) => setMaliciousAttachment(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-zinc-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-zinc-950 bg-zinc-900"
              />
              <div>
                <div className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">Malicious Attachment Payload</div>
                <div className="text-xs text-zinc-500">Attaches a fake executable designed to trigger the VirusTotal sandbox integration.</div>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "injecting"}
              className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(225,29,72,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "injecting" ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Injecting...
                </>
              ) : (
                "Inject Threat"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
