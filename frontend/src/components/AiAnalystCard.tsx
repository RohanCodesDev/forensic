import React from "react";
import { AiAnalysis } from "../types/forensic";

interface AiAnalystCardProps {
  aiAnalysis: AiAnalysis;
}

export default function AiAnalystCard({ aiAnalysis }: AiAnalystCardProps) {
  const { aiConfidence, aiSummary, manipulationTechniques, recommendedAction } = aiAnalysis;

  // Visuals based on AI confidence
  const isHighRisk = aiConfidence > 65;
  const isSuspicious = aiConfidence > 30 && aiConfidence <= 65;
  
  const getTheme = () => {
    if (isHighRisk) {
      return {
        bg: "bg-rose-950/20",
        border: "border-rose-900/50",
        glow: "shadow-[0_0_20px_rgba(225,29,72,0.15)]",
        text: "text-rose-400",
        accent: "bg-rose-500",
        icon: "text-rose-500",
        label: "CRITICAL THREAT"
      };
    }
    if (isSuspicious) {
      return {
        bg: "bg-amber-950/20",
        border: "border-amber-900/50",
        glow: "shadow-[0_0_20px_rgba(217,119,6,0.1)]",
        text: "text-amber-400",
        accent: "bg-amber-500",
        icon: "text-amber-500",
        label: "SUSPICIOUS"
      };
    }
    return {
      bg: "bg-emerald-950/10",
      border: "border-emerald-900/30",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
      text: "text-emerald-400",
      accent: "bg-emerald-500",
      icon: "text-emerald-500",
      label: "LOW RISK"
    };
  };

  const theme = getTheme();

  return (
    <div className={`rounded-xl border ${theme.border} ${theme.bg} ${theme.glow} p-6 relative overflow-hidden`}>
      
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none opacity-20"></div>

      <div className="relative z-10 space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            {/* Pulsing AI Indicator */}
            <div className="relative flex items-center justify-center w-10 h-10">
              <div className={`absolute inset-0 rounded-full ${theme.accent} animate-ping opacity-20`}></div>
              <div className={`relative z-10 w-8 h-8 rounded-full border border-gray-700 bg-black flex items-center justify-center ${theme.icon}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
                  <path d="M9 14h.01"></path>
                  <path d="M15 14h.01"></path>
                </svg>
              </div>
            </div>
            
            <div>
              <h3 className="font-mono text-sm tracking-widest text-gray-300 font-bold uppercase flex items-center gap-2">
                Virtual SOC Analyst 
                <span className={`text-[10px] px-2 py-0.5 rounded border border-gray-700 bg-black ${theme.text}`}>Powered by Groq LLM</span>
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-wide">Semantic Intent Analysis</p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-xs font-mono font-bold uppercase ${theme.text}`}>{theme.label}</div>
              <div className="text-[10px] text-gray-500 font-mono">AI Confidence</div>
            </div>
            <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 ${theme.border} bg-black font-mono text-lg font-bold ${theme.text}`}>
              {aiConfidence}<span className="text-xs text-gray-500">%</span>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="text-indigo-500 mt-1 shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 block mb-1">Analyst Summary</span>
              <p className="text-gray-300 text-sm leading-relaxed font-sans">{aiSummary}</p>
            </div>
          </div>
        </div>

        {/* Extracted Techniques */}
        {manipulationTechniques && manipulationTechniques.length > 0 && (
          <div>
            <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider block mb-3">
              Identified Social Engineering Tactics:
            </span>
            <div className="space-y-3">
              {manipulationTechniques.map((tech, idx) => (
                <div key={idx} className="bg-[#080808] border border-gray-800/80 p-4 rounded-md">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="md:w-1/3 shrink-0">
                      <span className="font-mono text-[11px] font-bold text-white bg-zinc-900 border border-zinc-700 px-2 py-1 rounded inline-block">
                        {tech.technique}
                      </span>
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-sm text-gray-300 font-serif italic border-l-2 border-gray-700 pl-3">
                        "{tech.quote}"
                      </p>
                      <p className="text-xs text-gray-500 font-sans leading-relaxed">
                        <span className="text-indigo-400/80 font-mono mr-1">AI Reasoning:</span>
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
        <div className="mt-4 flex items-center gap-3 pt-4 border-t border-gray-800">
          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Action Plan:</span>
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded bg-black border ${theme.border} ${theme.text}`}>
            {recommendedAction}
          </span>
        </div>

      </div>
    </div>
  );
}
