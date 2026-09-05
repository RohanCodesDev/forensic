import React, { useState } from "react";
import { CampaignCorrelationResult, CampaignCluster } from "../types/forensic";

interface CampaignMatrixProps {
  data: CampaignCorrelationResult | null;
  loading: boolean;
  onSelectCase: (id: string) => void;
  onRefresh: () => void;
}

export default function CampaignMatrixCard({
  data,
  loading,
  onSelectCase,
  onRefresh,
}: CampaignMatrixProps) {
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  const getSeverityStyle = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-950/80 text-red-400 border-red-800 shadow-[0_0_12px_rgba(239,68,68,0.3)]";
      case "HIGH":
        return "bg-orange-950/80 text-orange-400 border-orange-800 shadow-[0_0_10px_rgba(249,115,22,0.2)]";
      case "MEDIUM":
        return "bg-amber-950/80 text-amber-400 border-amber-800";
      default:
        return "bg-green-950/80 text-green-400 border-green-800";
    }
  };

  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 80) return "text-red-400 border-red-500/40 bg-red-950/30";
    if (confidence >= 60) return "text-orange-400 border-orange-500/40 bg-orange-950/30";
    return "text-yellow-400 border-yellow-500/40 bg-yellow-950/30";
  };

  const toggleCampaign = (id: string) => {
    setExpandedCampaignId(prev => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded p-8 text-center space-y-3 font-mono">
        <p className="text-xs text-zinc-300 font-bold animate-pulse">
          &gt; EXECUTING CROSS-IOC CLUSTERING & BIPARTITE CORRELATION GRAPH...
        </p>
        <p className="text-[11px] text-zinc-600">SCANNING SENDER DOMAINS // RELAYS // URL INFRASTRUCTURE</p>
      </div>
    );
  }

  if (!data || data.campaigns.length === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400"></span>
            <h2 className="text-xs sm:text-sm font-bold text-zinc-100 uppercase tracking-widest">
              [ THREAT CAMPAIGN MATRIX // INFRASTRUCTURE CORRELATION ]
            </h2>
          </div>
          <button
            onClick={onRefresh}
            className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-[11px] text-zinc-300 hover:text-white rounded transition-colors"
          >
            [ RE-SCAN DATABASE ]
          </button>
        </div>

        <div className="border border-dashed border-zinc-800 rounded p-8 text-center space-y-2 font-mono">
          <p className="text-xs text-zinc-300 font-bold uppercase">&gt; NO ACTIVE COORDINATED CAMPAIGNS DETECTED</p>
          <p className="text-[11px] text-zinc-600 max-w-md mx-auto">
            {data?.totalEmailsAnalyzed || 0} investigation records stored. Ingest multiple emails sharing originating relays, lookalike domains, or phishing URLs to generate automated clusters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono">
      {/* Top Level Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded">
          <p className="text-[10px] text-zinc-500 uppercase font-bold">[ ANALYZED EVIDENCE ]</p>
          <p className="text-xl font-bold text-zinc-100 mt-1">{data.totalEmailsAnalyzed}</p>
        </div>
        <div className="bg-zinc-950 border border-purple-900/60 p-3.5 rounded">
          <p className="text-[10px] text-purple-400 uppercase font-bold">[ ACTIVE CAMPAIGNS ]</p>
          <p className="text-xl font-bold text-purple-300 mt-1">{data.totalCampaignsDetected}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded">
          <p className="text-[10px] text-zinc-500 uppercase font-bold">[ ISOLATED INCIDENTS ]</p>
          <p className="text-xl font-bold text-zinc-400 mt-1">{data.isolatedEmailsCount}</p>
        </div>
        <div className="bg-zinc-950 border border-red-950/60 p-3.5 rounded">
          <p className="text-[10px] text-red-400 uppercase font-bold">[ LEAD THREAT RELAY ]</p>
          <p className="text-xs font-bold text-red-300 mt-2 truncate">
            {data.topSharedInfrastructure.ips[0]?.value || "N/A"}
          </p>
        </div>
      </div>

      {/* Main Campaign List */}
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 sm:p-6 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-purple-950/40 border border-purple-800/50 rounded-lg text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-mono font-bold text-white uppercase tracking-wider">
                Discovered Threat Campaigns ({data.campaigns.length})
              </h2>
              <p className="text-xs font-mono text-gray-500">
                Automated multi-mailbox attack cluster detection & infrastructure convergence
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-purple-800 text-xs font-mono text-gray-400 hover:text-purple-300 rounded transition-all flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Re-correlate
          </button>
        </div>

        {/* Campaign Cluster Cards */}
        <div className="space-y-4">
          {data.campaigns.map((cluster: CampaignCluster) => {
            const isExpanded = expandedCampaignId === cluster.campaignId;
            return (
              <div
                key={cluster.campaignId}
                className="border border-gray-800 bg-zinc-950/70 hover:border-gray-700 rounded-xl transition-all overflow-hidden"
              >
                {/* Cluster Header */}
                <div
                  onClick={() => toggleCampaign(cluster.campaignId)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/50 border border-purple-800/60 px-2 py-1 rounded">
                      {cluster.campaignId}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-mono font-bold text-white">
                          {cluster.name}
                        </h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-full font-bold ${getSeverityStyle(cluster.threatLevel)}`}>
                          {cluster.threatLevel}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 border rounded font-semibold ${getConfidenceStyle(cluster.confidenceScore)}`}>
                          {cluster.confidenceScore}% Confidence
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-400 mt-1">
                        {cluster.investigativeSummary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right font-mono text-xs hidden sm:block">
                      <p className="text-gray-400">
                        <span className="text-white font-bold">{cluster.totalEmails}</span> emails targeting{" "}
                        <span className="text-indigo-400 font-bold">{cluster.targetCount}</span> inbox(es)
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Avg Risk: <span className="text-red-400 font-bold">{cluster.avgRiskScore}/100</span>
                      </p>
                    </div>
                    <button className="text-gray-500 hover:text-white transition-colors">
                      <svg
                        className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-180 text-purple-400" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Campaign Deep-Dive */}
                {isExpanded && (
                  <div className="border-t border-gray-800 bg-[#0d0d0d] p-4 sm:p-6 space-y-6">
                    {/* Perimeter Action Recommendation */}
                    <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-lg flex items-start gap-3">
                      <span className="text-red-400 mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-mono font-bold text-red-300 uppercase tracking-wider">
                          Incident Response Recommendation
                        </h4>
                        <p className="text-xs font-mono text-gray-300 leading-relaxed">
                          {cluster.recommendedAction}
                        </p>
                      </div>
                    </div>

                    {/* Shared Indicators Matrix */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        Shared Attack Infrastructure ({cluster.sharedIocs.length} IOCs)
                      </h4>
                      <div className="border border-gray-800 rounded-lg overflow-x-auto">
                        <table className="w-full text-left font-mono text-xs">
                          <thead className="bg-zinc-900 border-b border-gray-800 text-gray-400">
                            <tr>
                              <th className="p-2.5">Indicator Type</th>
                              <th className="p-2.5">Shared Asset / Value</th>
                              <th className="p-2.5">Correlation Scope</th>
                              <th className="p-2.5">Severity</th>
                              <th className="p-2.5">Forensic Context</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {cluster.sharedIocs.map((ioc, idx) => (
                              <tr key={idx} className="hover:bg-zinc-900/50">
                                <td className="p-2.5 text-purple-400 font-bold">{ioc.type}</td>
                                <td className="p-2.5 font-mono text-white select-all">{ioc.value}</td>
                                <td className="p-2.5 text-gray-400">
                                  Observed across <span className="text-white font-bold">{ioc.count}</span> email(s)
                                </td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityStyle(ioc.riskWeight)}`}>
                                    {ioc.riskWeight}
                                  </span>
                                </td>
                                <td className="p-2.5 text-gray-400">{ioc.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Linked Emails in Campaign */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        Linked Investigation Records ({cluster.emails.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cluster.emails.map(email => (
                          <div
                            key={email.id}
                            className="bg-zinc-900/60 border border-gray-800 hover:border-indigo-800/60 p-3 rounded-lg flex flex-col justify-between gap-3 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs text-white font-bold truncate">
                                  {email.filename}
                                </span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border ${getSeverityStyle(email.severity)}`}>
                                  Score: {email.riskScore}/100
                                </span>
                              </div>
                              <p className="font-mono text-xs text-indigo-300 truncate">
                                Subj: {email.subject || "(No Subject)"}
                              </p>
                              <div className="text-[11px] font-mono text-gray-400 space-y-0.5">
                                <p className="truncate">From: <span className="text-gray-300">{email.from}</span></p>
                                <p className="truncate">Target: <span className="text-gray-300">{email.to}</span></p>
                              </div>
                            </div>

                            <button
                              onClick={() => onSelectCase(email.id)}
                              className="w-full text-center py-1.5 px-2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900/60 rounded text-xs font-mono text-indigo-300 hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                              <span>Inspect Full Forensic Dossier</span>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
