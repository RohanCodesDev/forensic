import React, { useState, useEffect } from "react";

interface HeaderProps {
  activeTab: "ingest" | "vault" | "campaigns" | "cases" | "globe";
  setActiveTab: (tab: "ingest" | "vault" | "campaigns" | "cases" | "globe") => void;
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
      label: "Upload Email",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      activeClasses: "bg-emerald-950/60 text-emerald-100 border-emerald-800/60 shadow-[inset_0_1px_0_rgba(52,211,153,0.15)]",
      iconColor: "text-emerald-400",
    },
    {
      id: "vault" as const,
      label: vaultCount > 0 ? `Evidence Vault (${vaultCount})` : "Evidence Vault",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      activeClasses: "bg-sky-950/60 text-sky-100 border-sky-800/60 shadow-[inset_0_1px_0_rgba(56,189,248,0.15)]",
      iconColor: "text-sky-400",
    },
    {
      id: "campaigns" as const,
      label: campaignCount > 0 ? `Campaigns (${campaignCount})` : "Campaigns",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      activeClasses: "bg-purple-950/60 text-purple-100 border-purple-800/60 shadow-[inset_0_1px_0_rgba(168,85,247,0.15)]",
      iconColor: "text-purple-400",
    },
    {
      id: "cases" as const,
      label: "Cases",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      activeClasses: "bg-amber-950/60 text-amber-100 border-amber-800/60 shadow-[inset_0_1px_0_rgba(251,191,36,0.15)]",
      iconColor: "text-amber-400",
    },
    {
      id: "globe" as const,
      label: "Command Center",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      activeClasses: "bg-rose-950/60 text-rose-100 border-rose-800/60 shadow-[inset_0_1px_0_rgba(244,63,94,0.15)]",
      iconColor: "text-rose-400",
    },
  ];

  return (
    <header className="border-b border-zinc-800/50 pb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
      {/* Brand */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60">
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-60" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          </div>
          <div>
            <h1 className="font-bold text-zinc-100 text-base tracking-tight leading-none">
              Forensic Mail
            </h1>
            <p className="text-[11px] text-zinc-500 font-medium tracking-wide mt-0.5">
              AI Email Threat & Forensic Intelligence Platform
            </p>
          </div>
        </div>

        {/* Status strip */}
        <div className="flex flex-wrap items-center gap-2 pl-11">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            System Active
          </span>
          <span className="text-zinc-700 text-[10px]">·</span>
          <span className="text-zinc-500 text-[10px] font-medium">Secure Evidence Vault</span>
          <span className="text-zinc-700 text-[10px]">·</span>
          <span className="text-zinc-600 text-[10px] tabular-nums font-mono">{timeStr || "Synchronising..."}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center bg-zinc-900/60 border border-zinc-800/80 p-1 rounded-xl gap-1 backdrop-blur-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? `${tab.activeClasses}`
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 border-transparent"
              }`}
            >
              <span className={isActive ? tab.iconColor : "text-zinc-600"}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
