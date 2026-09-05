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
import { EmailEvidence, InvestigationSummary, BadgeInfo, CampaignCorrelationResult } from "../types/forensic";

const lexend = Lexend({ subsets: ["latin"] });

export default function Home() {
  const [activeTab, setActiveTab] = useState<"ingest" | "vault" | "campaigns">("ingest");
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
    setStatus("Initiating cryptographic parser protocol & threat intelligence lookup...");
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
        setStatus("Success: Forensic analysis & database persistence complete.");
        setResult({ ...data.data, analysis: data.analysis });
        refreshAllData(); // Refresh case list and campaign matrix
      } else {
        setStatus(`Error: ${data.message || "Upload failed"}`);
      }
    } catch {
      setStatus("Fatal: Backend connection refused. Verify the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = async (id: string) => {
    try {
      setStatus("Retrieving case evidence from PostgreSQL vault...");
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
    <div className={`min-h-screen bg-black text-gray-300 p-4 sm:p-6 md:p-8 ${lexend.className} selection:bg-green-500 selection:text-black`}>
      <Head>
        <title>Forensic Mail | AI & Threat Intelligence Suite</title>
        <meta name="description" content="AI-Powered Email Threat Detection, Geolocation and Forensic Intelligence Platform" />
      </Head>

      <main className="max-w-7xl mx-auto space-y-6 md:space-y-8 pt-4 md:pt-8">
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

        {/* ACTIVE INVESTIGATION REPORT VIEW */}
        {result && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Sticky Navigation Sidebar */}
            <aside className="hidden lg:block sticky top-8 w-60 shrink-0 space-y-1.5 border border-zinc-800 bg-zinc-950 p-3 rounded">
              <div className="font-mono text-[10px] uppercase text-zinc-500 font-bold px-2 py-1 border-b border-zinc-900 mb-2">
                [ REPORT TELEMETRY INDEX ]
              </div>
              {[
                { id: "section-risk", label: "[01] RISK ENGINE" },
                { id: "section-ai", label: "[02] NEURAL ANALYST" },
                { id: "section-nlp", label: "[03] NLP HEURISTICS" },
                { id: "section-payload", label: "[04] RAW PAYLOAD" },
                { id: "section-attachments", label: "[05] ATTACHMENTS" },
                { id: "section-auth", label: "[06] AUTH AUDIT" },
                { id: "section-domain", label: "[07] DOMAIN INTEL" },
                { id: "section-graph", label: "[08] THREAT GRAPH" },
                { id: "section-threat", label: "[09] CTI FEEDS" },
                { id: "section-url", label: "[10] URL ANALYSIS" },
                { id: "section-route", label: "[11] SMTP ROUTING" }
              ].map(sec => (
                <button 
                  key={sec.id}
                  onClick={() => {
                    const el = document.getElementById(sec.id);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className="w-full text-left block text-xs font-mono text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 px-2.5 py-1.5 rounded transition-colors"
                >
                  {sec.label}
                </button>
              ))}
            </aside>

            {/* Main Report Content */}
            <section ref={reportRef} className="flex-1 min-w-0 bg-zinc-950 p-4 sm:p-6 border border-zinc-800 rounded space-y-5 print:p-0 print:border-none">
            
            {/* Header with quick close / case info */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 print:border-b-2 print:border-gray-600 print:mb-8">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-400"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  EVIDENCE DOSSIER: {result.filename}
                </span>
                {result.sha256Hash && (
                  <span className="text-[10px] text-zinc-500 hidden sm:inline">
                    [{result.sha256Hash.substring(0, 12)}...]
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 print-hidden font-mono text-xs">
                <button
                  onClick={() => handlePrint()}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  [ EXPORT PDF ]
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
                >
                  [ CLOSE ]
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
