import React, { useState, useEffect } from "react";

interface HeaderProps {
  activeTab: "ingest" | "vault" | "campaigns" | "cases";
  setActiveTab: (tab: "ingest" | "vault" | "campaigns" | "cases") => void;
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

  const tabs = [
    {
      id: "ingest" as const,
      label: "INGESTION",
      accent: "text-emerald-400",
      active: "bg-zinc-800/80 text-zinc-100 border-zinc-700",
      dot: "bg-emerald-400",
    },
    {
      id: "vault" as const,
      label: `VAULT${vaultCount > 0 ? ` (${vaultCount})` : ""}`,
      accent: "text-sky-400",
      active: "bg-zinc-800/80 text-zinc-100 border-zinc-700",
      dot: "bg-sky-400",
    },
    {
      id: "campaigns" as const,
      label: `CAMPAIGNS${campaignCount > 0 ? ` (${campaignCount})` : ""}`,
      accent: "text-purple-400",
      active: "bg-purple-950/60 text-purple-100 border-purple-800/70",
      dot: "bg-purple-400",
    },
    {
      id: "cases" as const,
      label: "CASES",
      accent: "text-amber-400",
      active: "bg-amber-950/60 text-amber-100 border-amber-800/70",
      dot: "bg-amber-400",
    },
  ];

  return (
    <header className="border-b border-zinc-800/60 pb-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
      {/* Brand / Status */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] shrink-0" />
          <h1 className="font-mono font-bold tracking-wider text-zinc-100 text-sm sm:text-base flex items-center gap-2.5">
            <span>FORENSIC_MAIL</span>
            <span className="text-zinc-700 font-normal">//</span>
            <span className="text-zinc-500 font-normal text-[11px] uppercase tracking-widest hidden sm:inline">
              Cybercrime Investigation Workstation
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-600 pl-5">
          <span className="text-emerald-500 font-semibold tracking-wide">[STATUS: OPERATIONAL]</span>
          <span>::</span>
          <span>POSTGRESQL EVIDENCE VAULT</span>
          <span>::</span>
          <span className="text-zinc-500 tabular-nums">{timeStr || "TELEMETRY SYNCHRONIZED"}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center bg-zinc-950 border border-zinc-800/80 p-1 rounded-lg gap-0.5 font-mono text-[11px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md transition-all duration-150 flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? `${tab.active} font-bold shadow-sm`
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 border-transparent"
              }`}
            >
              <span className={`${tab.accent} font-bold text-[10px]`}>▶</span>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
