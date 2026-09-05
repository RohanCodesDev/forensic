import { useState, useEffect } from "react";
import Head from "next/head";
import { Lexend } from "next/font/google";
import Header from "../components/Header";
import EvidenceIngestion from "../components/EvidenceIngestion";
import InvestigationHistory from "../components/InvestigationHistory";
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
import { EmailEvidence, InvestigationSummary, BadgeInfo } from "../types/forensic";

const lexend = Lexend({ subsets: ["latin"] });

export default function Home() {
  const [activeTab, setActiveTab] = useState<"ingest" | "vault">("ingest");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<EmailEvidence | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);

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

  useEffect(() => {
    fetchInvestigations();
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
        fetchInvestigations(); // Refresh case list
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
        fetchInvestigations();
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
        />

        {activeTab === "ingest" ? (
          <EvidenceIngestion
            file={file}
            status={status}
            loading={loading}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
          />
        ) : (
          <InvestigationHistory
            investigations={investigations}
            loading={historyLoading}
            onSelectCase={handleSelectCase}
            onDeleteCase={handleDeleteCase}
            onRefresh={fetchInvestigations}
            currentActiveId={result?.id}
          />
        )}

        {/* ACTIVE INVESTIGATION REPORT VIEW */}
        {result && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Sticky Navigation Sidebar */}
            <aside className="hidden lg:block sticky top-8 w-64 shrink-0 space-y-2 border border-gray-800 bg-[#0a0a0a] p-4 rounded-xl shadow-2xl animate-fade-in">
              <h3 className="font-mono text-xs uppercase text-gray-500 font-bold mb-4 tracking-wider">Report Index</h3>
              {[
                { id: "section-risk", label: "Risk Engine" },
                { id: "section-ai", label: "AI Analyst" },
                { id: "section-nlp", label: "NLP Heuristics" },
                { id: "section-payload", label: "Message Payload" },
                { id: "section-attachments", label: "Attachments" },
                { id: "section-auth", label: "Authentication" },
                { id: "section-domain", label: "Domain Forensics" },
                { id: "section-graph", label: "Threat Graph" },
                { id: "section-threat", label: "Threat Intel" },
                { id: "section-url", label: "URL Analysis" },
                { id: "section-route", label: "Routing Hops" }
              ].map(sec => (
                <a 
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block text-sm font-mono text-gray-400 hover:text-indigo-400 hover:bg-indigo-950/30 px-3 py-2 rounded transition-colors"
                >
                  {sec.label}
                </a>
              ))}
            </aside>

            {/* Main Report Content */}
            <section className="flex-1 min-w-0 bg-[#0a0a0a] p-4 md:p-8 border border-gray-800 rounded-xl shadow-2xl space-y-6 animate-fade-in">
            {/* Header with quick close / case info */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Active Forensic Dossier: {result.filename}
                </span>
              </div>
              <button
                onClick={() => setResult(null)}
                className="text-xs font-mono text-gray-500 hover:text-white px-2 py-1 bg-zinc-900 border border-zinc-800 rounded transition-colors"
              >
                ✕ Close Report
              </button>
            </div>

            {/* Phase 10: Multi-Factor Risk Score Engine */}
            {result.analysis?.riskEvaluation && (
              <div id="section-risk">
                <RiskScoreGauge riskEvaluation={result.analysis.riskEvaluation} />
              </div>
            )}

            {/* Phase 12: True AI LLM Semantic Analysis */}
            {result.analysis?.aiAnalysis && (
              <div id="section-ai">
                <AiAnalystCard aiAnalysis={result.analysis.aiAnalysis} />
              </div>
            )}

            {/* Phase 11: NLP Social Engineering & BEC Heuristics */}
            {result.analysis?.nlpAnalysis && (
              <div id="section-nlp">
                <NlpAnalysisCard nlpAnalysis={result.analysis.nlpAnalysis} />
              </div>
            )}

            {/* Extracted Payload Headers & Decrypted Body */}
            <div id="section-payload">
              <ExtractedPayloadCard evidence={result} />
            </div>

            {/* Attachments Breakdown - always show if analysis exists */}
            {result.analysis && (
              <AttachmentPayloadCard attachments={result.analysis.attachments || []} />
            )}

            {/* Phase 4: Authentication Protocols (SPF / DKIM / DMARC) */}
            <div id="section-auth">
              <AuthAuditCard
                spfResult={result.spfResult}
                dkimResult={result.dkimResult}
                dmarcResult={result.dmarcResult}
                onOpenBadge={setSelectedBadge}
              />
            </div>

            {/* Phase 5: Domain Forensics & Typosquatting */}
            {result.analysis?.domainAnalysis && (
              <div id="section-domain">
                <DomainForensicsCard domainAnalysis={result.analysis.domainAnalysis} />
              </div>
            )}

            {/* Phase 8: Geographical Route Map */}
            {result.analysis?.routeAnalysis && (
              <GeoRouteMap 
                hops={result.analysis.routeAnalysis.hops}
              />
            )}

            {/* Phase 13: Interactive Threat Graph */}
            <div id="section-graph">
              <ThreatGraphCard evidence={result} />
            </div>

            {/* Phase 9: Global Threat Intelligence Feeds */}
            {result.analysis?.threatIntel && (
              <div id="section-threat">
                <ThreatIntelCard threatIntel={result.analysis.threatIntel} />
              </div>
            )}

            {/* Phase 6: Embedded Links & URL Analysis */}
            {result.analysis?.urlAnalysis && (
              <div id="section-url">
                <UrlAnalysisCard
                  urlAnalysis={result.analysis.urlAnalysis}
                  onOpenBadge={setSelectedBadge}
                />
              </div>
            )}

            {/* Phase 7 & 8: SMTP Route & Interactive Geolocation Map */}
            {result.analysis?.routeAnalysis && (
              <div id="section-route">
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
