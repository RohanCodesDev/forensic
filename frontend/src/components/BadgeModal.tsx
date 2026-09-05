import React from "react";
import { BadgeInfo } from "../types/forensic";

interface BadgeModalProps {
  badge: BadgeInfo | null;
  onClose: () => void;
}

export default function BadgeModal({ badge, onClose }: BadgeModalProps) {
  if (!badge) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0a0a0a] border border-gray-700 p-6 md:p-8 rounded-xl max-w-md w-full shadow-[0_0_30px_rgba(34,197,94,0.15)] relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white p-1 rounded hover:bg-zinc-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">Forensic Intelligence Note</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-3 border-b border-gray-800 pb-3 font-mono">
          {badge.title}
        </h3>

        <p className="text-gray-300 leading-relaxed font-mono text-xs md:text-sm">
          {badge.description}
        </p>

        <button 
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-gray-900 text-white rounded font-mono text-xs uppercase tracking-wider hover:bg-gray-800 border border-gray-700 transition-colors"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
}
