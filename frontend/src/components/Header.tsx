import React from "react";

interface HeaderProps {
  activeTab: "ingest" | "vault";
  setActiveTab: (tab: "ingest" | "vault") => void;
  vaultCount: number;
}

export default function Header({ activeTab, setActiveTab, vaultCount }: HeaderProps) {
  return (
    <header className="border-b border-gray-800 pb-4 md:pb-6 mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl md:text-3xl font-semibold tracking-wide text-white mb-1 flex items-center gap-3">
          <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse"></span>
          Forensic_Mail <span className="text-gray-600 font-light">||</span> SYSTEM.CORE
        </h1>
        <p className="text-gray-500 text-[10px] md:text-xs tracking-widest uppercase ml-0 md:ml-6 mt-1 font-mono">
          [AI & FORENSIC INTELLIGENCE SUITE] :: POSTGRESQL CASE VAULT ACTIVE
        </p>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center bg-black border border-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("ingest")}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "ingest"
              ? "bg-gray-800 text-white border border-gray-700 shadow-md font-bold"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          Live Ingestion
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "vault"
              ? "bg-gray-800 text-white border border-gray-700 shadow-md font-bold"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Case Vault
          {vaultCount > 0 && (
            <span className="bg-blue-950 border border-blue-800 text-blue-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {vaultCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
