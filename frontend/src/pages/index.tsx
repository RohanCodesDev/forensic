import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useReactToPrint } from "react-to-print";
import Header from "../components/Header";
import EvidenceIngestion from "../components/EvidenceIngestion";
import InvestigationHistory from "../components/InvestigationHistory";
import CampaignMatrixCard from "../components/CampaignMatrixCard";
import RiskScoreGauge from "../components/RiskScoreGauge";
import ExtractedPayloadCard from "../components/ExtractedPayloadCard";
import AttachmentPayloadCard from "../components/AttachmentPayloadCard";
import AuthAuditCard from "../components/AuthAuditCard";
import DomainForensicsCard from "../components/DomainForensicsCard";
import UrlAnalysisCard from "../components/UrlAnalysisCard";
import ThreatIntelCard from "../components/ThreatIntelCard";
import SmtpRouteCard from "../components/SmtpRouteCard";
import AnomaliesAlert from "../components/AnomaliesAlert";
import BadgeModal from "../components/BadgeModal";
import NlpAnalysisCard from "../components/NlpAnalysisCard";
import AiAnalystCard from "../components/AiAnalystCard";
import ThreatGraphCard from "../components/ThreatGraphCard";
import GeoRouteMap from "../components/GeoRouteMap";
import CaseManagement from "../components/CaseManagement";
import GlobalThreatDashboard from "../components/GlobalThreatDashboard";
import { EmailEvidence, InvestigationSummary, BadgeInfo, CampaignCorrelationResult } from "../types/forensic";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"ingest" | "vault" | "campaigns" | "cases" | "globe">("ingest");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<EmailEvidence | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [campaignData, setCampaignData] = useState<CampaignCorrelationResult | null>(null);
  const [campaignLoading, setCampaignLoading] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);
  const [autoScanResults, setAutoScanResults] = useState<any[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>("section-risk");

  // Documentation-style ScrollSpy to highlight active section in sidebar index
  useEffect(() => {
    if (!result) return;

    const sectionIds = [
      "section-risk",
      "section-ai",
      "section-nlp",
      "section-payload",
      "section-attachments",
      "section-auth",
      "section-domain",
      "section-geo",
      "section-graph",
      "section-threat",
      "section-url",
      "section-route",
      "section-anomalies",
    ];

    const handleScroll = () => {
      const scrollPos = window.scrollY + 130;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSectionId(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [result]);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.pageYOffset - 85;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Phase 15: Print / Export PDF Ref
  const reportRef = useRef<HTMLElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: result ? `Forensic_Report_${result.filename}` : "Forensic_Report",
  });

  // Determine base API URL
  const getApiUrl = () => {
    const isLocalhost = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    return process.env.NEXT_PUBLIC_API_URL || (isLocalhost ? "http://localhost:8000" : "https://forensic-mauve.vercel.app");
  };

  const fetchInvestigations = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch(`${getApiUrl()}/api/emails`);
      const json = await res.json();
      if (res.ok && json.data) {
        setInvestigations(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch past investigations:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setCampaignLoading(true);
      const res = await fetch(`${getApiUrl()}/api/campaigns`);
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaignData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch campaign correlations:", err);
    } finally {
      setCampaignLoading(false);
    }
  };

  const refreshAllData = () => {
    fetchInvestigations();
    fetchCampaigns();
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setStatus("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Error: No evidence file provided.");
      return;
    }

    setLoading(true);
    setStatus("Parsing email structure & running threat intelligence checks...");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${getApiUrl()}/api/emails/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("Analysis complete — forensic report saved to Evidence Vault.");
        setResult({ ...data.data, analysis: data.analysis });
        refreshAllData(); // Refresh case list and campaign matrix
      } else {
        setStatus(`Error: ${data.message || "Upload failed"}`);
      }
    } catch {
      setStatus("Connection failed — ensure the backend server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = async (id: string) => {
    try {
      setStatus("Loading case from Evidence Vault...");
      const res = await fetch(`${getApiUrl()}/api/emails/${id}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setResult({ ...json.data, analysis: json.analysis });
        setStatus(`Active Case Loaded: ${json.data.filename}`);
        // Smooth scroll to report if active
        window.scrollTo({ top: 400, behavior: "smooth" });
      } else {
        setStatus(`Error: ${json.message || "Failed to load case"}`);
      }
    } catch {
      setStatus("Error: Failed to connect to server to fetch case.");
    }
  };

  const handleDeleteCase = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this case record from PostgreSQL?")) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/emails/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (result?.id === id) {
          setResult(null);
        }
        refreshAllData();
      }
    } catch (err) {
      console.error("Failed to delete case:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#030304] text-gray-300 font-[family-name:var(--font-lexend)] selection:bg-emerald-500/20 selection:text-emerald-100">
      <Head>
        <title>Forensic Mail | AI & Threat Intelligence Suite</title>
        <meta name="description" content="AI-Powered Email Threat Detection, Geolocation and Forensic Intelligence Platform" />
      </Head>

      {/* Sticky SaaS Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vaultCount={investigations.length}
        campaignCount={campaignData?.totalCampaignsDetected || 0}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-20 space-y-6 md:space-y-8 pt-6 sm:pt-8">
        {activeTab === "ingest" && (
          <div className="space-y-6">
            <EvidenceIngestion
              file={file}
              status={status}
              loading={loading}
              onFileChange={handleFileChange}
              onClearFile={() => {
                setFile(null);
                setResult(null);
                setStatus("");
              }}
              onUpload={handleUpload}
              onAutoScanComplete={(results) => {
                setAutoScanResults(results);
                refreshAllData();
              }}
              onEvidenceIngested={(data, analysis) => {
                setResult(data);
                setStatus("Analysis Complete.");
                refreshAllData();
              }}
              apiUrl={getApiUrl()}
            />

            {/* Render Auto Scan Results right on the screen */}
            {autoScanResults.length > 0 && (
              <section className="bg-zinc-950/80 border border-zinc-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100">Automated Scan Results</h3>
                    <p className="text-xs text-zinc-500 font-medium">Click on any result below to open its deep forensic report.</p>
                  </div>
                  <button 
                    onClick={() => setAutoScanResults([])}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700"
                  >
                    Clear Results
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {autoScanResults.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setResult({ ...item.data, analysis: item.analysis });
                        setTimeout(() => document.getElementById("section-risk")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                      }}
                      className="group cursor-pointer bg-black/40 border border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 rounded-xl p-4 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                          {item.data.filename}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                          item.analysis?.riskEvaluation?.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          item.analysis?.riskEvaluation?.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {item.analysis?.riskEvaluation?.severity || 'LOW'} RISK
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-zinc-200 truncate">
                        {item.data.subject || "No Subject"}
                      </div>
                      <div className="text-xs text-zinc-500 truncate mt-1">
                        From: {item.data.from}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800/60">
                        <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                          Score: {item.analysis?.riskEvaluation?.score || 0}/100
                        </span>
                        {(item.analysis?.anomalies?.length || 0) > 0 && (
                          <span className="text-[10px] text-rose-400 bg-rose-950/30 px-2 py-1 rounded border border-rose-900/50">
                            {item.analysis.anomalies.length} Anomalies
                          </span>
                        )}
                        <span className="ml-auto text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          VIEW REPORT
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === "vault" && (
          <InvestigationHistory
            investigations={investigations}
            loading={historyLoading}
            onSelectCase={handleSelectCase}
            onDeleteCase={handleDeleteCase}
            onRefresh={refreshAllData}
            currentActiveId={result?.id}
            apiUrl={getApiUrl()}
          />
        )}

        {activeTab === "campaigns" && (
          <CampaignMatrixCard
            data={campaignData}
            loading={campaignLoading}
            onSelectCase={handleSelectCase}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === "cases" && (
          <CaseManagement
            apiUrl={getApiUrl()}
          />
        )}

        {activeTab === "globe" && (
          <GlobalThreatDashboard 
            apiUrl={getApiUrl()}
          />
        )}


        {/* ACTIVE INVESTIGATION REPORT VIEW */}
        {result && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Sticky Navigation Sidebar (Documentation Style Index) */}
            <aside className="hidden lg:block sticky top-20 w-56 shrink-0 border border-zinc-800/80 bg-zinc-950/90 rounded-2xl p-3 space-y-1 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 mb-1.5">
                <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest font-mono">
                  Report Index
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              {[
                { id: "section-risk",        label: "Risk Score",     badge: "01" },
                { id: "section-ai",          label: "AI Analyst",     badge: "02" },
                { id: "section-nlp",         label: "NLP Engine",     badge: "03" },
                { id: "section-payload",     label: "Email Payload",  badge: "04" },
                { id: "section-attachments", label: "Attachments",    badge: "05" },
                { id: "section-auth",        label: "Auth Audit",     badge: "06" },
                { id: "section-domain",      label: "Domain Intel",   badge: "07" },
                { id: "section-geo",         label: "Route Map",      badge: "08" },
                { id: "section-graph",       label: "Threat Graph",   badge: "09" },
                { id: "section-threat",      label: "Threat Intel",   badge: "10" },
                { id: "section-url",         label: "URL Analysis",   badge: "11" },
                { id: "section-route",       label: "SMTP Route",     badge: "12" },
                { id: "section-anomalies",   label: "Anomalies",      badge: "13" },
              ].map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left text-[11px] px-3 py-2 rounded-lg transition-all duration-150 flex items-center justify-between group cursor-pointer border ${
                      isActive
                        ? "bg-emerald-950/60 text-emerald-300 font-bold border-emerald-700/80 shadow-[inset_0_1px_0_rgba(52,211,153,0.2)]"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-[9px] tabular-nums font-mono w-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-emerald-400 font-bold"
                            : "text-zinc-600 group-hover:text-zinc-400"
                        }`}
                      >
                        {sec.badge}
                      </span>
                      <span className="truncate">{sec.label}</span>
                    </div>

                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </aside>

            {/* Main Report Content */}
            <section ref={reportRef} className="flex-1 min-w-0 bg-zinc-950/80 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl print:p-0 print:border-none">

              {/* Report Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6 print:border-b-2 print:border-gray-600 print:mb-8">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-100 truncate tracking-tight">
                      {result.filename}
                    </p>
                    {result.sha256Hash && (
                      <p className="text-[10px] text-zinc-600 font-mono tabular-nums mt-0.5">
                        SHA-256: {result.sha256Hash.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 print-hidden shrink-0">
                  <button
                    onClick={() => handlePrint()}
                    className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Export PDF
                  </button>
                  <button
                    onClick={() => setResult(null)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 rounded-xl text-xs font-semibold transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </button>
                </div>
              </div>

            {/* Print Only Meta Header */}
            <div className="hidden print:block mb-8 pb-4 border-b border-gray-800 space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold font-sans tracking-tight text-white">Security Operations Center</h1>
                  <p className="text-sm font-mono text-gray-400 mt-1">Automated Threat Intelligence & Forensic Analysis</p>
                </div>
                <div className="text-right font-mono text-xs text-gray-500 space-y-1">
                  <p>Case ID: {result.id.substring(0, 8).toUpperCase()}</p>
                  <p>Generated: {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Phase 10: Multi-Factor Risk Score Engine */}
            {result.analysis?.riskEvaluation && (
              <div id="section-risk" className="scroll-mt-20">
                <RiskScoreGauge riskEvaluation={result.analysis.riskEvaluation} />
              </div>
            )}

            {/* Phase 12: True AI LLM Semantic Analysis */}
            <div id="section-ai" className="scroll-mt-20">
              <AiAnalystCard 
                aiAnalysis={result.analysis?.aiAnalysis} 
                emailId={result.id}
                apiUrl={getApiUrl()}
                onAiAnalysisUpdated={(newAnalysis) => {
                  if (result && result.analysis) {
                    setResult({
                      ...result,
                      analysis: {
                        ...result.analysis,
                        aiAnalysis: newAnalysis
                      }
                    });
                  }
                }}
              />
            </div>

            {/* Phase 11: NLP Social Engineering & BEC Heuristics */}
            {result.analysis?.nlpAnalysis && (
              <div id="section-nlp" className="scroll-mt-20">
                <NlpAnalysisCard nlpAnalysis={result.analysis.nlpAnalysis} />
              </div>
            )}

            {/* Extracted Payload Headers & Decrypted Body */}
            <div id="section-payload" className="scroll-mt-20">
              <ExtractedPayloadCard evidence={result} />
            </div>

            {/* Attachments Breakdown */}
            <div id="section-attachments" className="scroll-mt-20">
              <AttachmentPayloadCard attachments={result.analysis?.attachments || []} />
            </div>

            {/* Phase 4: Authentication Protocols (SPF / DKIM / DMARC) */}
            <div id="section-auth" className="scroll-mt-20">
              <AuthAuditCard
                spfResult={result.spfResult}
                dkimResult={result.dkimResult}
                dmarcResult={result.dmarcResult}
                onOpenBadge={setSelectedBadge}
              />
            </div>

            {/* Phase 5: Domain Forensics & Typosquatting */}
            {result.analysis?.domainAnalysis && (
              <div id="section-domain" className="scroll-mt-20">
                <DomainForensicsCard domainAnalysis={result.analysis.domainAnalysis} />
              </div>
            )}

            {/* Phase 8: Geographical Route Map */}
            {result.analysis?.routeAnalysis && (
              <div id="section-geo" className="scroll-mt-20">
                <GeoRouteMap 
                  hops={result.analysis.routeAnalysis.hops}
                />
              </div>
            )}

            {/* Phase 13: Interactive Threat Graph */}
            <div id="section-graph" className="scroll-mt-20">
              <ThreatGraphCard evidence={result} />
            </div>

            {/* Phase 9: Global Threat Intelligence Feeds */}
            {result.analysis?.threatIntel && (
              <div id="section-threat" className="scroll-mt-20">
                <ThreatIntelCard threatIntel={result.analysis.threatIntel} />
              </div>
            )}

            {/* Phase 6: Embedded Links & URL Analysis */}
            {result.analysis?.urlAnalysis && (
              <div id="section-url" className="scroll-mt-20">
                <UrlAnalysisCard
                  urlAnalysis={result.analysis.urlAnalysis}
                  onOpenBadge={setSelectedBadge}
                />
              </div>
            )}

            {/* Phase 7 & 8: SMTP Route & Interactive Geolocation Map */}
            {result.analysis?.routeAnalysis && (
              <div id="section-route" className="scroll-mt-20">
                <SmtpRouteCard
                  routeAnalysis={result.analysis.routeAnalysis}
                  rawReceivedHeaders={result.receivedHeaders}
                  onOpenBadge={setSelectedBadge}
                />
              </div>
            )}

            {/* Forensic Anomalies Alert Box */}
            {result.analysis?.anomalies && result.analysis.anomalies.length > 0 && (
              <div id="section-anomalies" className="scroll-mt-20">
                <AnomaliesAlert anomalies={result.analysis.anomalies} />
              </div>
            )}
          </section>
          </div>
        )}
      </main>

      {/* Educational Badge Modal */}
      <BadgeModal
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  );
}
