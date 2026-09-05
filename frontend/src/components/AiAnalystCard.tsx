import React, { useState } from "react";
import { AiAnalysis } from "../types/forensic";

interface AiAnalystCardProps {
  aiAnalysis?: AiAnalysis | null;
  emailId?: string;
  apiUrl?: string;
  onAiAnalysisUpdated?: (newAnalysis: AiAnalysis) => void;
}

export default function AiAnalystCard({
  aiAnalysis,
  emailId,
  apiUrl = "http://localhost:8000",
  onAiAnalysisUpdated,
}: AiAnalystCardProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunAiAnalysis = async () => {
    if (!emailId) return;
    try {
      setAnalyzing(true);
      setErrorMsg(null);
      const res = await fetch(`${apiUrl}/api/emails/${emailId}/ai-analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.aiAnalysis) {
        if (onAiAnalysisUpdated) {
          onAiAnalysisUpdated(data.aiAnalysis);
        }
      } else {
        setErrorMsg(data.message || "Neural inference protocol failed.");
      }
    } catch {
      setErrorMsg("ERR_CONNECTION_REFUSED: Telemetry link to backend lost.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!aiAnalysis) {
    return (
      <div className="rounded-xl border border-indigo-950/80 bg-[#070709] p-6 relative overflow-hidden shadow-[0_0_30px_rgba(79,70,229,0.08)] group">
        {/* Cyber HUD Corner Brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-indigo-500/70"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-indigo-500/70"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-indigo-500/70"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-indigo-500/70"></div>

        {/* Decorative Grid & Scanline */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-indigo-900/60 bg-indigo-950/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-mono text-sm tracking-wider text-white font-bold uppercase flex items-center gap-2">
                  NEURAL INTENT REASONING ENGINE
                  <span className="text-[10px] px-2 py-0.5 rounded border border-indigo-800/60 bg-indigo-950/40 text-indigo-300 font-mono">
                    GROQ :: QWEN-27B
                  </span>
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5 uppercase tracking-widest">
                  Deep Cognitive Threat Extraction & Adversarial Intent
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800 text-amber-300 font-semibold uppercase tracking-wider">
                STANDBY :: READY
              </span>
            </div>
          </div>
          
          <div className="bg-zinc-950/80 border border-indigo-900/30 rounded-xl p-6 sm:p-8 text-center space-y-5 backdrop-blur-sm">
            <div className="max-w-xl mx-auto space-y-2">
              <p className="font-mono text-xs text-gray-300 font-medium">
                Cognitive semantic telemetry is ready for execution on this evidence dossier.
              </p>
              <p className="font-mono text-[11px] text-gray-500">
                Dispatches adversarial prompt matrix to Groq Qwen-27B neural pipeline to extract psychological coercion vectors, spear-phishing intents, and authority spoofing markers.
              </p>
            </div>

            {errorMsg && (
              <div className="font-mono text-xs text-red-400 bg-red-950/50 border border-red-900/80 p-3 rounded-lg max-w-lg mx-auto flex items-center gap-2">
                <span className="text-red-500 font-bold">ERR:</span> {errorMsg}
              </div>
            )}

            <div>
              <button
                onClick={handleRunAiAnalysis}
                disabled={analyzing || !emailId}
                className="group relative px-6 py-3.5 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 hover:from-indigo-800 hover:via-purple-800 hover:to-indigo-900 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-lg border border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.5)] transition-all flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-indigo-300" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="animate-pulse">ENGAGING NEURAL INFERENCE MATRIX...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-indigo-300 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>⚡ INITIALIZE NEURAL FORENSIC INFERENCE</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-gray-600 pt-2">
              <span>LATENCY: ~220ms</span>
              <span>•</span>
              <span>ZERO LOG RETENTION</span>
              <span>•</span>
              <span>SOC TACTICAL ADVISORY</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { aiConfidence, aiSummary, manipulationTechniques, recommendedAction } = aiAnalysis;

  // Visuals based on AI confidence
  const isHighRisk = aiConfidence > 65;
  const isSuspicious = aiConfidence > 30 && aiConfidence <= 65;
  
  const getTheme = () => {
    if (isHighRisk) {
      return {
        bg: "bg-rose-950/20",
        border: "border-rose-900/60",
        glow: "shadow-[0_0_30px_rgba(225,29,72,0.15)]",
        text: "text-rose-400",
        accent: "bg-rose-500",
        icon: "text-rose-500",
        label: "CRITICAL COERCION DETECTED"
      };
    }
    if (isSuspicious) {
      return {
        bg: "bg-amber-950/20",
        border: "border-amber-900/60",
        glow: "shadow-[0_0_25px_rgba(217,119,6,0.12)]",
        text: "text-amber-400",
        accent: "bg-amber-500",
        icon: "text-amber-500",
        label: "SUSPICIOUS INTENT"
      };
    }
    return {
      bg: "bg-emerald-950/10",
      border: "border-emerald-900/40",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.1)]",
      text: "text-emerald-400",
      accent: "bg-emerald-500",
      icon: "text-emerald-500",
      label: "BENIGN INTENT"
    };
  };

  const theme = getTheme();

  return (
    <div className={`rounded-xl border ${theme.border} ${theme.bg} ${theme.glow} p-6 relative overflow-hidden transition-all duration-300`}>
      
      {/* Cyber HUD Corner Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-indigo-500/70"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-indigo-500/70"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-indigo-500/70"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-indigo-500/70"></div>

      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800d_1px,transparent_1px),linear-gradient(to_bottom,#8080800d_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40"></div>

      <div className="relative z-10 space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
          <div className="flex items-center gap-3">
            {/* Pulsing AI Indicator */}
            <div className="relative flex items-center justify-center w-10 h-10">
              <div className={`absolute inset-0 rounded-full ${theme.accent} animate-ping opacity-25`}></div>
              <div className={`relative z-10 w-9 h-9 rounded-lg border border-gray-700/80 bg-black flex items-center justify-center ${theme.icon} shadow-[0_0_12px_rgba(99,102,241,0.3)]`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
                  <path d="M9 14h.01"></path>
                  <path d="M15 14h.01"></path>
                </svg>
              </div>
            </div>
            
            <div>
              <h3 className="font-mono text-sm tracking-wider text-white font-bold uppercase flex items-center gap-2">
                COGNITIVE SOC THREAT TELEMETRY
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border border-gray-700 bg-black ${theme.text}`}>
                  GROQ :: QWEN-27B
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5 uppercase tracking-widest">Adversarial Psychological Intent Matrix</p>
            </div>
          </div>

          {/* Right side telemetry & re-evaluate */}
          <div className="flex items-center gap-4">
            {emailId && (
              <button
                onClick={handleRunAiAnalysis}
                disabled={analyzing}
                className="text-[11px] font-mono px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-indigo-700 text-gray-400 hover:text-indigo-300 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title="Re-run neural inference"
              >
                <svg className={`w-3.5 h-3.5 ${analyzing ? "animate-spin text-indigo-400" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{analyzing ? "RE-INFERRING..." : "RE-INFER"}</span>
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`text-xs font-mono font-bold uppercase ${theme.text}`}>{theme.label}</div>
                <div className="text-[10px] text-gray-500 font-mono">COGNITIVE CONFIDENCE</div>
              </div>
              <div className={`flex items-center justify-center w-14 h-14 rounded-xl border-2 ${theme.border} bg-black/90 font-mono text-lg font-bold ${theme.text} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                {aiConfidence}<span className="text-xs text-gray-500 font-normal">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-black/60 border border-gray-800/90 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3.5">
            <span className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-900/50 text-indigo-400 shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </span>
            <div className="space-y-1.5 flex-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold block">
                SOC Analyst Executive Synthesis
              </span>
              <p className="text-gray-200 text-sm leading-relaxed font-sans">{aiSummary}</p>
            </div>
          </div>
        </div>

        {/* Extracted Techniques */}
        {manipulationTechniques && manipulationTechniques.length > 0 && (
          <div className="space-y-3">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Extracted Social Engineering & Manipulation Vectors:
            </span>
            <div className="grid grid-cols-1 gap-3">
              {manipulationTechniques.map((tech, idx) => (
                <div key={idx} className="bg-zinc-950/80 border border-gray-800/90 hover:border-gray-700 p-4 rounded-lg transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="md:w-1/4 shrink-0">
                      <span className="font-mono text-xs font-bold text-white bg-zinc-900 border border-zinc-700/80 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                        {tech.technique}
                      </span>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="bg-black/60 border-l-2 border-indigo-500/80 p-2.5 rounded-r text-xs text-gray-300 font-mono italic">
                        <span className="text-[10px] text-gray-500 block uppercase not-italic font-bold mb-0.5">
                          [ INTERCEPTED PAYLOAD SNIPPET ]
                        </span>
                        "{tech.quote}"
                      </div>
                      <p className="text-xs text-gray-400 font-sans leading-relaxed">
                        <span className="text-indigo-400 font-mono font-bold mr-1.5">[ANALYSIS]:</span>
                        {tech.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Perimeter Directive:</span>
            <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-black border ${theme.border} ${theme.text} shadow-[0_0_12px_rgba(0,0,0,0.5)]`}>
              {recommendedAction}
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-600 uppercase">
            STATUS: ACTIVE INCIDENT ADVISORY
          </span>
        </div>

      </div>
    </div>
  );
}
