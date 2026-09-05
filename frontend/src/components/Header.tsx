import React, { useState, useEffect } from "react";

interface HeaderProps {
  activeTab: "ingest" | "vault" | "campaigns";
  setActiveTab: (tab: "ingest" | "vault" | "campaigns") => void;
  vaultCount: number;
  campaignCount?: number;
}

export default function Header({ activeTab, setActiveTab, vaultCount, campaignCount = 0 }: HeaderProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-zinc-800/80 pb-4 mb-6 md:mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          <h1 className="text-base sm:text-lg font-mono font-bold tracking-wider text-zinc-100 flex items-center gap-2">
            <span>FORENSIC_MAIL</span>
            <span className="text-zinc-600">//</span>
            <span className="text-zinc-400 font-normal text-xs uppercase tracking-widest">
              CYBERCRIME INVESTIGATION WORKSTATION
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500">
          <span className="text-emerald-400 font-medium flex items-center gap-1.5">
            [STATUS: OPERATIONAL]
          </span>
          <span>::</span>
          <span>POSTGRESQL EVIDENCE VAULT</span>
          <span>::</span>
          <span className="text-zinc-400">{timeStr || "TELEMETRY SYNCHRONIZED"}</span>
        </div>
      </div>

      {/* Navigation Matrix */}
      <div className="flex flex-wrap items-center bg-zinc-950 border border-zinc-800 p-1 rounded gap-1 font-mono text-xs">
        <button
          onClick={() => setActiveTab("ingest")}
          className={`px-3 py-1.5 rounded transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "ingest"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <span className="text-emerald-400 font-bold">&gt;</span>
          [ INGESTION ]
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`px-3 py-1.5 rounded transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "vault"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <span className="text-blue-400 font-bold">&gt;</span>
          [ VAULT {vaultCount > 0 ? `(${vaultCount})` : ""} ]
        </button>

        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-3 py-1.5 rounded transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "campaigns"
              ? "bg-purple-950/70 text-purple-200 border border-purple-800 font-bold shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <span className="text-purple-400 font-bold">&gt;</span>
          [ CAMPAIGNS {campaignCount > 0 ? `(${campaignCount})` : ""} ]
        </button>
      </div>
    </header>
  );
}
