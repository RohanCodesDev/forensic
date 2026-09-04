import { useState } from "react";
import Head from "next/head";
import { Lexend } from "next/font/google";

const lexend = Lexend({ subsets: ["latin"] });

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<any>(null);

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
      const response = await fetch("http://localhost:8000/api/emails/upload", {
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
              [PHASE_2] :: MIME_DECODER_AND_EXTRACTION
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
    </div>
  );
}
