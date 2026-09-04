import { useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Lexend } from "next/font/google";

const GeoRouteMap = dynamic(() => import("../components/GeoRouteMap"), { ssr: false });

const lexend = Lexend({ subsets: ["latin"] });

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [selectedBadge, setSelectedBadge] = useState<{title: string, description: string} | null>(null);

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

    setStatus("Initiating parser protocol...");
    setResult(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Auto-detect local development vs deployed Vercel backend
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || (isLocalhost ? "http://localhost:8000" : "https://forensic-mauve.vercel.app");
      const response = await fetch(`${API_URL}/api/emails/upload`, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus("Success: Parsing complete.");
        setResult({ ...data.data, analysis: data.analysis });
      } else {
        setStatus(`Error: ${data.message || "Upload failed"}`);
      }
    } catch (error) {
      setStatus("Fatal: Connection refused.");
    }
  };

  return (
    <div className={`min-h-screen bg-black text-gray-300 p-8 ${lexend.className} selection:bg-green-500 selection:text-black`}>
      <Head>
        <title>Forensic Mail | Dashboard</title>
      </Head>

      <main className="max-w-5xl mx-auto space-y-10 pt-10">
        <header className="border-b border-gray-800 pb-6 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-wide text-white mb-1 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
              Forensic_Mail <span className="text-gray-600 font-light">||</span> SYSTEM.CORE
            </h1>
            <p className="text-gray-500 text-sm tracking-widest uppercase ml-6">
              [PHASE_8] :: IP_GEOLOCATION_AND_MAP_VISUALIZATION
            </p>
          </div>
        </header>

        <section className="bg-[#0a0a0a] p-8 border border-gray-800 rounded-xl shadow-2xl relative overflow-hidden">
          <h2 className="text-lg font-medium mb-6 text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Ingest Evidence
          </h2>
          
          <div className="flex flex-col items-start justify-center p-8 border border-dashed border-gray-700 bg-black rounded-lg hover:border-green-500/50 transition-colors">
            <input 
              type="file" 
              accept=".eml"
              onChange={handleFileChange}
              className="mb-8 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-gray-300 hover:file:bg-gray-800 cursor-pointer text-gray-500 w-full focus:outline-none"
            />
            
            <button 
              onClick={handleUpload}
              className="w-full py-3 bg-gray-900 text-white rounded-md uppercase tracking-wider font-semibold hover:bg-gray-800 border border-gray-700 hover:border-green-500/50 transition-all shadow-lg"
            >
              Execute Parsing Sequence
            </button>
            
            {status && (
              <div className={`mt-6 w-full p-4 rounded-md border bg-black ${status.includes("Error") || status.includes("Fatal") ? "border-red-900/50 text-red-400" : "border-green-900/50 text-green-500"}`}>
                <p className="font-mono text-sm flex items-center gap-2">
                  <span className="animate-pulse">_</span> {status}
                </p>
              </div>
            )}
          </div>
        </section>

        {result && (
          <section className="bg-[#0a0a0a] p-8 border border-gray-800 rounded-xl shadow-2xl animate-fade-in space-y-6">
            {/* THREAT SEVERITY BANNER */}
            <div className={`p-4 rounded-lg border flex items-center justify-between font-mono ${
              result.analysis?.threatLevel === "HIGH_RISK" 
                ? "bg-rose-950/40 border-rose-600/80 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                : result.analysis?.threatLevel === "SUSPICIOUS"
                ? "bg-amber-950/40 border-amber-600/80 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                : "bg-emerald-950/40 border-emerald-600/80 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            }`}>
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full animate-ping ${
                  result.analysis?.threatLevel === "HIGH_RISK" ? "bg-rose-500" : result.analysis?.threatLevel === "SUSPICIOUS" ? "bg-amber-500" : "bg-emerald-500"
                }`}></span>
                <span className="font-bold text-sm tracking-wider uppercase">
                  FORENSIC THREAT EVALUATION: {result.analysis?.threatLevel || "EVALUATING"}
                </span>
              </div>
              <span className="text-xs uppercase opacity-80 border px-2 py-0.5 rounded border-current font-semibold">
                {result.analysis?.anomalies?.length || 0} ANOMALIES DETECTED
              </span>
            </div>

            <h2 className="text-lg font-medium mb-2 text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Extracted Intelligence Payload
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Origin (From)", val: result.from },
                { label: "Destination (To)", val: result.to },
                { label: "Subject", val: result.subject },
                { label: "Timestamp", val: result.date },
                { label: "Message-ID", val: result.messageId },
                { label: "Return-Path", val: result.returnPath }
              ].map((item, idx) => (
                <div key={idx} className="bg-black border border-gray-800 p-4 rounded-lg flex flex-col justify-between">
                  <span className="text-gray-500 text-xs uppercase font-semibold block mb-2">{item.label}</span>
                  {/* The exact extracted data/code is purely neon green and monospace */}
                  <span className="text-green-500 font-mono text-sm break-all drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]">
                    {item.val || "N/A"}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-black border border-gray-800 p-4 rounded-lg">
              <span className="text-gray-500 text-xs uppercase font-semibold block mb-3">Decrypted Body Snippet</span>
              <pre className="text-sm text-green-500 whitespace-pre-wrap font-mono overflow-y-auto max-h-64 p-4 bg-[#050505] rounded-md border border-gray-800 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent drop-shadow-[0_0_3px_rgba(34,197,94,0.2)]">
                {result.textBodySnippet}
              </pre>
            </div>

            {/* ATTACHMENT BREAKDOWN */}
            {result.analysis?.attachments && result.analysis.attachments.length > 0 && (
              <div className="bg-black border border-gray-800 p-4 rounded-lg">
                <span className="text-gray-500 text-xs uppercase font-semibold block mb-3">
                  Attachment Payload Analysis ({result.analysis.attachments.length})
                </span>
                <div className="space-y-2">
                  {result.analysis.attachments.map((att: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded border flex items-center justify-between font-mono text-xs ${
                      att.isRisky ? "bg-rose-950/30 border-rose-800 text-rose-300" : "bg-[#050505] border-gray-800 text-gray-300"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📄</span>
                        <span className="font-semibold">{att.filename}</span>
                        <span className="text-gray-600">({(att.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      {att.isRisky ? (
                        <span className="bg-rose-950 border border-rose-700 text-rose-400 px-2 py-0.5 rounded font-bold animate-pulse">
                          ⚠️ RISKY EXTENSION
                        </span>
                      ) : (
                        <span className="text-gray-500">SAFE EXTENSION</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* SMTP RELAY HOPS INSPECTOR */}
            <details className="group border border-gray-800 bg-black rounded-lg overflow-hidden">
              <summary className="p-4 cursor-pointer flex items-center justify-between text-xs uppercase font-semibold text-gray-400 hover:text-white transition-colors">
                <span>Infrastructure Hops Detected ({result.receivedHeaders ? result.receivedHeaders.length : 0})</span>
                <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50 group-open:rotate-180 transition-transform">
                  ▼ VIEW HOPS
                </span>
              </summary>
              <div className="p-4 border-t border-gray-800 bg-[#050505] space-y-2 font-mono text-xs text-gray-400">
                {result.receivedHeaders && result.receivedHeaders.length > 0 ? (
                  result.receivedHeaders.map((hop: string, idx: number) => (
                    <div key={idx} className="p-3 bg-black border border-gray-800/80 rounded break-all">
                      <span className="text-emerald-500 font-bold mr-2">HOP #{idx + 1}:</span>
                      {hop}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No SMTP relay headers parsed.</p>
                )}
              </div>
            </details>

            {/* PHASE 4: Authentication Protocols (SPF / DKIM / DMARC) */}
            <div className="mt-6 bg-black border border-gray-800 p-6 rounded-lg">
              <h3 className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Protocol Authentication Audit (SPF / DKIM / DMARC)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "SPF Verification", status: result.spfResult || "MISSING" },
                  { name: "DKIM Signature", status: result.dkimResult || "MISSING" },
                  { name: "DMARC Alignment", status: result.dmarcResult || "MISSING" }
                ].map((proto, i) => {
                  const isPass = proto.status === "PASS";
                  const isFail = ["FAIL", "SOFTFAIL", "HARDFAIL", "REJECT", "BADSIG"].includes(proto.status);
                  
                  return (
                    <div key={i} className="bg-[#050505] border border-gray-800 p-4 rounded-md flex flex-col justify-between">
                      <span className="text-gray-500 text-xs font-mono uppercase mb-2">{proto.name}</span>
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-sm font-bold px-3 py-1 rounded border ${
                          isPass 
                            ? "bg-emerald-950/80 border-emerald-600/80 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            : isFail 
                            ? "bg-rose-950/80 border-rose-600/80 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                            : "bg-zinc-900 border-zinc-700 text-zinc-400"
                        }`}>
                          {proto.status}
                        </span>
                        <span className="text-xs text-gray-600 font-mono">
                          {isPass ? "✓ VALIDATED" : isFail ? "✕ INVALID" : "⚠ UNCHECKED"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PHASE 5: Domain Intelligence */}
            {result.analysis?.domainAnalysis && (
              <div className="mt-6 bg-black border border-gray-800 p-6 rounded-lg">
                <h3 className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                  Domain Forensics & Impersonation
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#050505] border border-gray-800 p-4 rounded-md">
                    <span className="text-gray-500 text-xs font-mono uppercase block mb-1">Sender Domain Root</span>
                    <span className="text-purple-400 font-mono text-sm break-all font-bold drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]">
                      {result.analysis.domainAnalysis.domain || "N/A"}
                    </span>
                    {result.analysis.domainAnalysis.isFreemail && (
                      <span className="ml-3 text-xs bg-amber-950/50 border border-amber-800 text-amber-500 px-2 py-0.5 rounded font-mono">
                        FREEMAIL PROVIDER
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-[#050505] border border-gray-800 p-4 rounded-md">
                    <span className="text-gray-500 text-xs font-mono uppercase block mb-1">Brand Impersonation Targets</span>
                    {result.analysis.domainAnalysis.brandImpersonation?.matchType ? (
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-rose-400 font-mono text-sm font-bold uppercase animate-pulse drop-shadow-[0_0_5px_rgba(244,63,94,0.4)]">
                          TARGET: {result.analysis.domainAnalysis.brandImpersonation.matchedBrand}
                        </span>
                        <span className="text-xs text-rose-500/80 font-mono">
                          TYPE: {result.analysis.domainAnalysis.brandImpersonation.matchType} 
                          {result.analysis.domainAnalysis.brandImpersonation.matchType === 'TYPOSQUAT' && ` (Levenshtein Distance: ${result.analysis.domainAnalysis.brandImpersonation.distance})`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-500 font-mono text-sm">NO BRAND MATCHES DETECTED</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PHASE 6: Embedded Links & URL Analysis */}
            {result.analysis?.urlAnalysis && result.analysis.urlAnalysis.length > 0 && (
              <div className="mt-6 bg-black border border-gray-800 p-6 rounded-lg">
                <h3 className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Embedded Links & URL Risk Analysis
                </h3>
                
                <div className="space-y-3">
                  {result.analysis.urlAnalysis.map((urlObj: any, index: number) => {
                    const isRisky = urlObj.riskScore > 0;
                    return (
                      <div key={index} className={`bg-[#050505] border p-4 rounded-md flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${isRisky ? 'border-rose-900/50' : 'border-gray-800'}`}>
                        <div className="flex-1 overflow-hidden">
                          <span className={`block font-mono text-sm truncate ${isRisky ? 'text-rose-400 font-bold' : 'text-gray-400'}`}>
                            {urlObj.url}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {urlObj.isHttp && (
                            <button onClick={() => setSelectedBadge({title: "HTTP (INSECURE)", description: "This link uses unencrypted HTTP instead of HTTPS. Attackers use this to intercept credentials or data in transit, or simply because they set up a cheap, throwaway server."})} className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-1 rounded border border-zinc-700 font-mono hover:bg-zinc-800 transition-colors">
                              HTTP (INSECURE)
                            </button>
                          )}
                          {urlObj.isShortener && (
                            <button onClick={() => setSelectedBadge({title: "SHORTENER DETECTED", description: "This link uses a URL shortener (like bit.ly). Phishers use shorteners to mask their true malicious destination from both the victim and automated spam filters."})} className="text-[10px] bg-amber-950/50 text-amber-500 px-2 py-1 rounded border border-amber-800 font-mono hover:bg-amber-900/80 transition-colors">
                              SHORTENER
                            </button>
                          )}
                          {urlObj.isIPBased && (
                            <button onClick={() => setSelectedBadge({title: "IP ROUTING", description: "This link points directly to an IP address instead of a domain name. Legitimate companies never do this. It is a massive red flag indicating a temporary, malicious server."})} className="text-[10px] bg-rose-950/80 text-rose-400 px-2 py-1 rounded border border-rose-800 font-mono hover:bg-rose-900 transition-colors">
                              IP ROUTING
                            </button>
                          )}
                          {urlObj.isPunycode && (
                            <button onClick={() => setSelectedBadge({title: "PUNYCODE HOMOGRAPH ATTACK", description: "This link uses foreign character sets (like Cyrillic) to mimic English letters. It tricks your browser into displaying a fake domain that looks exactly like a real one."})} className="text-[10px] bg-red-950/80 text-red-400 px-2 py-1 rounded border border-red-800 font-mono animate-pulse hover:bg-red-900 transition-colors">
                              PUNYCODE HOMOGRAPH
                            </button>
                          )}
                          {urlObj.isBaitAndSwitch && (
                            <button onClick={() => setSelectedBadge({title: "BAIT & SWITCH LINK", description: "The visible text of this link doesn't match its actual destination. The attacker is trying to trick you into clicking what looks like a safe URL, but redirects you to a malicious site."})} className="text-[10px] bg-red-950/80 text-red-400 px-2 py-1 rounded border border-red-800 font-mono animate-pulse hover:bg-red-900 transition-colors">
                              BAIT & SWITCH LINK
                            </button>
                          )}
                          {urlObj.brandTarget && (
                            <button onClick={() => setSelectedBadge({title: "BRAND IMPERSONATION", description: `This URL contains the brand name '${urlObj.brandTarget}' in the path to trick you into thinking it's an official link, but the root domain belongs to someone else.`})} className="text-[10px] bg-purple-950/50 text-purple-400 px-2 py-1 rounded border border-purple-800 font-mono animate-pulse hover:bg-purple-900/80 transition-colors">
                              BRAND: {urlObj.brandTarget.toUpperCase()}
                            </button>
                          )}
                          {urlObj.suspiciousKeywords.length > 0 && (
                            <button onClick={() => setSelectedBadge({title: "SUSPICIOUS KEYWORDS", description: `This URL contains keywords often used in phishing attacks: ${urlObj.suspiciousKeywords.join(', ')}.`})} className="text-[10px] bg-orange-950/50 text-orange-400 px-2 py-1 rounded border border-orange-800 font-mono hover:bg-orange-900/80 transition-colors">
                              KEYWORDS: {urlObj.suspiciousKeywords.join(', ')}
                            </button>
                          )}
                          {!isRisky && <span className="text-[10px] bg-emerald-950/30 text-emerald-500 px-2 py-1 rounded border border-emerald-900 font-mono">NEUTRAL</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PHASE 9: Threat Intelligence (CTI) */}
            {result.analysis && result.analysis.threatIntel && result.analysis.threatIntel.length > 0 && (
              <div className="bg-[#050505] border border-gray-800 p-6 rounded-lg space-y-4">
                <div className="border-b border-gray-800 pb-3 mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Global Threat Intelligence Feeds (CTI)
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">Cross-referencing IPs, Domains, and URLs against AbuseIPDB, URLhaus, and VirusTotal</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.analysis.threatIntel.map((threat: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-md border flex flex-col justify-between ${
                      threat.isMalicious ? 'bg-rose-950/20 border-rose-900/50' : 'bg-black border-gray-800'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-xs font-mono font-bold truncate pr-2 ${threat.isMalicious ? 'text-rose-400' : 'text-gray-300'}`}>
                          {threat.value}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0 ${
                          threat.type === 'IP' ? 'bg-blue-900/50 text-blue-300' : 
                          threat.type === 'URL' ? 'bg-purple-900/50 text-purple-300' : 
                          'bg-amber-900/50 text-amber-300'
                        }`}>
                          {threat.type}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase">{threat.source}</span>
                          <span className="text-xs text-gray-400 truncate w-32">{threat.categories.join(', ')}</span>
                        </div>
                        {threat.isMalicious ? (
                          <span className="text-xs bg-rose-900 text-rose-200 px-2 py-0.5 rounded font-bold animate-pulse">MALICIOUS</span>
                        ) : (
                          <span className="text-xs text-emerald-500">CLEAN</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHASE 7 & 8: SMTP Route & Interactive Geolocation Map */}
            {result.analysis && result.analysis.routeAnalysis && (
              <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-4 gap-2">
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      SMTP Relay Hop Chain & Global Route Map
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">Chronological MTA relay hops & geographic infrastructure map</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-950/40 border border-blue-800/60 px-3 py-1.5 rounded-md text-xs font-mono">
                      <span className="text-gray-400">Total Hops: </span>
                      <span className="text-blue-400 font-bold">{result.analysis.routeAnalysis.totalHops}</span>
                    </div>
                    {result.analysis.routeAnalysis.totalDeliveryTimeSeconds !== null && (
                      <div className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-md text-xs font-mono">
                        <span className="text-gray-400">Transit Time: </span>
                        <span className="text-emerald-400 font-bold">{result.analysis.routeAnalysis.totalDeliveryTimeSeconds}s</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Originating Public IP Card with Geo Details */}
                <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-900/60 p-4 rounded-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-blue-400 font-mono font-bold">
                        Identified Originating Server (Entry Point)
                      </span>
                      {result.analysis.routeAnalysis.originatingGeo && (
                        <span className="text-[10px] bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded font-mono border border-blue-700">
                          {result.analysis.routeAnalysis.originatingGeo.city}, {result.analysis.routeAnalysis.originatingGeo.country} ({result.analysis.routeAnalysis.originatingGeo.countryCode})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-mono font-bold text-white">
                        {result.analysis.routeAnalysis.originatingIp || "None detected"}
                      </span>
                      {result.analysis.routeAnalysis.originatingHost && (
                        <span className="text-xs text-gray-400 font-mono">
                          ({result.analysis.routeAnalysis.originatingHost})
                        </span>
                      )}
                    </div>
                    {result.analysis.routeAnalysis.originatingGeo && (
                      <p className="text-xs text-gray-400 font-mono">
                        <span className="text-gray-500">ISP / AS: </span>
                        <span className="text-gray-300">{result.analysis.routeAnalysis.originatingGeo.isp || result.analysis.routeAnalysis.originatingGeo.org}</span>
                        <span className="text-gray-600"> • </span>
                        <span className="text-gray-400">{result.analysis.routeAnalysis.originatingGeo.as}</span>
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedBadge({
                      title: "ORIGINATING PUBLIC IP & GEOLOCATION", 
                      description: "This is the very first public, internet-routable IP address recorded in the SMTP chain. Regardless of what name is displayed in the 'From:' field, this represents the actual host machine that injected the email into the public internet."
                    })}
                    className="text-xs bg-blue-900/50 hover:bg-blue-800 text-blue-300 px-3 py-1.5 rounded border border-blue-700 font-mono transition-colors shrink-0"
                  >
                    Forensic Significance ⓘ
                  </button>
                </div>

                {/* PHASE 8: Interactive Leaflet Map Route */}
                <div className="pt-2">
                  <GeoRouteMap hops={result.analysis.routeAnalysis.hops} />
                </div>

                {/* Interactive Hop Timeline */}
                <div className="space-y-3 pt-4 border-t border-gray-900 relative before:absolute before:inset-0 before:top-6 before:left-6 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-purple-700 before:to-emerald-500">
                  {result.analysis.routeAnalysis.hops.map((hop: any, idx: number) => {
                    const isFirst = idx === 0;
                    const isLast = idx === result.analysis.routeAnalysis.hops.length - 1;
                    return (
                      <div key={idx} className="relative pl-12">
                        {/* Hop Marker Node */}
                        <div className={`absolute left-4 -translate-x-1/2 top-4 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border ${
                          isFirst 
                            ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_8px_rgba(59,130,246,0.8)]' 
                            : isLast 
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                              : 'bg-purple-900 border-purple-500 text-gray-200'
                        }`}>
                          {hop.hopNumber}
                        </div>

                        <div className="bg-[#050505] border border-gray-800 hover:border-gray-700 p-4 rounded-md transition-colors space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-white">
                                {isFirst ? "HOP 1 (ORIGIN ENTRY)" : isLast ? `HOP ${hop.hopNumber} (DESTINATION MX)` : `HOP ${hop.hopNumber} (RELAY)`}
                              </span>
                              {hop.protocol && (
                                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                                  {hop.protocol}
                                </span>
                              )}
                              {hop.ip && (
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                                  hop.isPrivateIp 
                                    ? 'bg-zinc-900 text-zinc-500 border-zinc-800' 
                                    : 'bg-blue-950/60 text-blue-300 border-blue-800'
                                }`}>
                                  IP: {hop.ip} {hop.isPrivateIp ? '(LAN/Private)' : '(Public)'}
                                </span>
                              )}
                              {hop.geo && !hop.isPrivateIp && (
                                <span className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                                  📍 {hop.geo.city}, {hop.geo.country}
                                </span>
                              )}
                            </div>
                            {hop.delaySeconds !== null && (
                              <span className={`text-xs font-mono ${hop.delaySeconds < 0 ? 'text-rose-400 font-bold animate-pulse' : 'text-gray-400'}`}>
                                Hop Latency: {hop.delaySeconds >= 0 ? `+${hop.delaySeconds}s` : `${hop.delaySeconds}s (ANOMALY)`}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-gray-400">
                            <div><span className="text-gray-500">From: </span><span className="text-gray-200">{hop.fromHost || "Not specified"}</span></div>
                            <div><span className="text-gray-500">By: </span><span className="text-gray-200">{hop.byHost || "Not specified"}</span></div>
                          </div>

                          {hop.geo && !hop.isPrivateIp && (
                            <div className="text-[11px] font-mono text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-1 bg-zinc-950/80 p-2 rounded border border-zinc-900">
                              <div><span className="text-gray-500">ISP/Org: </span><span className="text-gray-300">{hop.geo.isp || hop.geo.org}</span></div>
                              <div><span className="text-gray-500">ASN / Coords: </span><span className="text-gray-300">{hop.geo.as} [{hop.geo.lat.toFixed(2)}, {hop.geo.lon.toFixed(2)}]</span></div>
                            </div>
                          )}

                          {hop.timestamp && (
                            <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5 pt-1 border-t border-gray-900">
                              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span>{hop.timestamp}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PHASE 3 & 4: Header Forensics Display */}
            {result.analysis && result.analysis.anomalies && result.analysis.anomalies.length > 0 && (
              <div className="mt-6 border-l-4 border-amber-500 bg-amber-950/20 p-6 rounded-r-lg shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <h3 className="text-amber-500 font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Forensic Anomalies Detected
                </h3>
                <ul className="space-y-3">
                  {result.analysis.anomalies.map((anomaly: string, index: number) => (
                    <li key={index} className="text-amber-200/80 font-mono text-sm pl-4 relative before:content-['>'] before:absolute before:left-0 before:text-amber-500">
                      {anomaly}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Interactive Badge Modal for Demo */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-gray-700 p-8 rounded-xl max-w-md w-full shadow-[0_0_30px_rgba(34,197,94,0.15)] relative">
            <button 
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-4">{selectedBadge.title}</h3>
            <p className="text-gray-300 leading-relaxed font-mono text-sm">
              {selectedBadge.description}
            </p>
            <button 
              onClick={() => setSelectedBadge(null)}
              className="mt-8 w-full py-2 bg-gray-900 text-white rounded font-mono text-sm hover:bg-gray-800 border border-gray-700 transition-colors"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
