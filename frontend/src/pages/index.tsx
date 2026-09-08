import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { Lexend } from "next/font/google";
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
import { EmailEvidence, InvestigationSummary, BadgeInfo, CampaignCorrelationResult } from "../types/forensic";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });

export default function Home() {
  const [activeTab, setActiveTab] = useState<"ingest" | "vault" | "campaigns" | "cases">("ingest");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<EmailEvidence | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [campaignData, setCampaignData] = useState<CampaignCorrelationResult | null>(null);
  const [campaignLoading, setCampaignLoading] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);

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
    <div className={`min-h-screen bg-[#030304] text-gray-300 ${lexend.variable} font-[family-name:var(--font-lexend)] selection:bg-emerald-500/20 selection:text-emerald-100`}>
      <Head>
        <title>Forensic Mail | AI & Threat Intelligence Suite</title>
        <meta name="description" content="AI-Powered Email Threat Detection, Geolocation and Forensic Intelligence Platform" />
      </Head>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-20 space-y-6 md:space-y-8 pt-7 md:pt-10">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          vaultCount={investigations.length}
          campaignCount={campaignData?.totalCampaignsDetected || 0}
        />

        {activeTab === "ingest" && (
          <EvidenceIngestion
            file={file}
            status={status}
            loading={loading}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
          />
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


        {/* ACTIVE INVESTIGATION REPORT VIEW */}
        {result && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Sticky Navigation Sidebar */}
            <aside className="hidden lg:block sticky top-8 w-52 shrink-0 border border-zinc-800/60 bg-zinc-950/80 rounded-2xl p-3 space-y-0.5 shadow-xl backdrop-blur-sm">
              <div className="text-[10px] uppercase text-zinc-600 font-bold px-3 py-2 border-b border-zinc-800/60 mb-1 tracking-widest">
                Report Sections
              </div>
              {[
                { id: "section-risk",        label: "Risk Score" },
                { id: "section-ai",          label: "AI Analyst" },
                { id: "section-nlp",         label: "NLP Engine" },
                { id: "section-payload",     label: "Email Payload" },
                { id: "section-attachments", label: "Attachments" },
                { id: "section-auth",        label: "Auth Audit" },
                { id: "section-domain",      label: "Domain Intel" },
                { id: "section-graph",       label: "Threat Graph" },
                { id: "section-threat",      label: "Threat Intel" },
                { id: "section-url",         label: "URL Analysis" },
                { id: "section-route",       label: "Route Map" },
              ].map((sec, idx) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    document.getElementById(sec.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="w-full text-left text-[11px] text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900/80 px-3 py-2 rounded-lg transition-all duration-150 flex items-center gap-2.5 group"
                >
                  <span className="text-[9px] text-zinc-700 group-hover:text-zinc-500 tabular-nums font-mono w-4 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="font-medium">{sec.label}</span>
                </button>
              ))}
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
              <div id="section-risk" className="scroll-mt-8">
                <RiskScoreGauge riskEvaluation={result.analysis.riskEvaluation} />
              </div>
            )}

            {/* Phase 12: True AI LLM Semantic Analysis */}
            <div id="section-ai" className="scroll-mt-8">
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
              <div id="section-nlp" className="scroll-mt-8">
                <NlpAnalysisCard nlpAnalysis={result.analysis.nlpAnalysis} />
              </div>
            )}

            {/* Extracted Payload Headers & Decrypted Body */}
            <div id="section-payload" className="scroll-mt-8">
              <ExtractedPayloadCard evidence={result} />
            </div>

            {/* Attachments Breakdown */}
            <div id="section-attachments" className="scroll-mt-8">
              <AttachmentPayloadCard attachments={result.analysis?.attachments || []} />
            </div>

            {/* Phase 4: Authentication Protocols (SPF / DKIM / DMARC) */}
            <div id="section-auth" className="scroll-mt-8">
              <AuthAuditCard
                spfResult={result.spfResult}
                dkimResult={result.dkimResult}
                dmarcResult={result.dmarcResult}
                onOpenBadge={setSelectedBadge}
              />
            </div>

            {/* Phase 5: Domain Forensics & Typosquatting */}
            {result.analysis?.domainAnalysis && (
              <div id="section-domain" className="scroll-mt-8">
                <DomainForensicsCard domainAnalysis={result.analysis.domainAnalysis} />
              </div>
            )}

            {/* Phase 8: Geographical Route Map */}
            {result.analysis?.routeAnalysis && (
              <div className="scroll-mt-8">
                <GeoRouteMap 
                  hops={result.analysis.routeAnalysis.hops}
                />
              </div>
            )}

            {/* Phase 13: Interactive Threat Graph */}
            <div id="section-graph" className="scroll-mt-8">
              <ThreatGraphCard evidence={result} />
            </div>

            {/* Phase 9: Global Threat Intelligence Feeds */}
            {result.analysis?.threatIntel && (
              <div id="section-threat" className="scroll-mt-8">
                <ThreatIntelCard threatIntel={result.analysis.threatIntel} />
              </div>
            )}

            {/* Phase 6: Embedded Links & URL Analysis */}
            {result.analysis?.urlAnalysis && (
              <div id="section-url" className="scroll-mt-8">
                <UrlAnalysisCard
                  urlAnalysis={result.analysis.urlAnalysis}
                  onOpenBadge={setSelectedBadge}
                />
              </div>
            )}

            {/* Phase 7 & 8: SMTP Route & Interactive Geolocation Map */}
            {result.analysis?.routeAnalysis && (
              <div id="section-route" className="scroll-mt-8">
                <SmtpRouteCard
                  routeAnalysis={result.analysis.routeAnalysis}
                  rawReceivedHeaders={result.receivedHeaders}
                  onOpenBadge={setSelectedBadge}
                />
              </div>
            )}

            {/* Forensic Anomalies Alert Box */}
            {result.analysis?.anomalies && result.analysis.anomalies.length > 0 && (
              <AnomaliesAlert anomalies={result.analysis.anomalies} />
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
