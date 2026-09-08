import React, { useState, useMemo } from "react";
import { ParsedEmailPreview, ExtractedUrlInfo } from "../utils/emlParser";
import { EmailEvidence } from "../types/forensic";
import InfoTooltip from "./InfoTooltip";

interface EmailViewerProps {
  preview: ParsedEmailPreview;
  evidence?: EmailEvidence | null;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export default function EmailViewer({
  preview,
  evidence,
  onAnalyze,
  isAnalyzing = false,
}: EmailViewerProps) {
  const [viewMode, setViewMode] = useState<"gmail" | "enhanced">("gmail");
  const [showDetailsDropdown, setShowDetailsDropdown] = useState(false);
  const [showRawHeaders, setShowRawHeaders] = useState(false);
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  // Derive initials for avatar
  const senderInitials = useMemo(() => {
    const name = preview.from.name || preview.from.address;
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name[0] || "U").toUpperCase();
  }, [preview.from]);

  // Derive auth statuses (prefer evidence if available)
  const spfStatus = (evidence?.spfResult || preview.spfResult || "NONE").toUpperCase();
  const dkimStatus = (evidence?.dkimResult || preview.dkimResult || "NONE").toUpperCase();
  const dmarcStatus = (evidence?.dmarcResult || preview.dmarcResult || "NONE").toUpperCase();

  const isAuthFailed =
    ["FAIL", "SOFTFAIL", "HARDFAIL", "REJECT", "PERMERROR"].includes(spfStatus) ||
    ["FAIL", "BADSIG"].includes(dkimStatus) ||
    ["FAIL", "REJECT"].includes(dmarcStatus);

  const hasSuspicion =
    isAuthFailed ||
    preview.senderMismatch ||
    preview.detectedUrls.some((u) => u.isIPBased || u.isPunycode || u.isShortener) ||
    preview.detectedUrgencyKeywords.length > 0;

  // Handle copy raw headers
  const handleCopyHeaders = () => {
    const text = preview.rawHeaders.map((h) => `${h.key}: ${h.value}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedHeaders(true);
    setTimeout(() => setCopiedHeaders(false), 2000);
  };

  // Handle copy body text
  const handleCopyBody = () => {
    navigator.clipboard.writeText(preview.textBody || "");
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  // Enhanced highlighted body text
  const renderEnhancedTextBody = () => {
    if (!preview.textBody) {
      return <div className="text-zinc-500 italic">No readable text body in this email.</div>;
    }

    let text = preview.textBody;
    // Replace urgency keywords with tagged highlights
    // Sort keywords by length desc so longer phrases match first
    const sortedKeywords = [...preview.detectedUrgencyKeywords].sort((a, b) => b.length - a.length);

    // Tokenize text into words / links / urgency terms
    const lines = text.split("\n");

    return (
      <div className="font-mono text-xs leading-relaxed space-y-2 whitespace-pre-wrap select-text">
        {lines.map((line, lIdx) => {
          // Check for URLs in line
          const words = line.split(/(\s+)/);
          return (
            <div key={lIdx}>
              {words.map((word, wIdx) => {
                // Check if word is a URL
                const isUrl = word.startsWith("http://") || word.startsWith("https://");
                if (isUrl) {
                  const urlObj = preview.detectedUrls.find((u) => word.includes(u.url)) || {
                    url: word,
                    isHttp: word.startsWith("http://"),
                    isIPBased: /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/.test(word),
                    isShortener: false,
                    isPunycode: word.includes("xn--"),
                  };

                  let badge = "CLEAN";
                  let badgeColor = "bg-emerald-950/80 text-emerald-400 border-emerald-800";
                  if (urlObj.isIPBased) {
                    badge = "IP LINK (HIGH RISK)";
                    badgeColor = "bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse";
                  } else if (urlObj.isPunycode) {
                    badge = "HOMOGRAPH (SPOOF)";
                    badgeColor = "bg-purple-950/80 text-purple-300 border-purple-800";
                  } else if (urlObj.isShortener) {
                    badge = "SHORTENER (SUSPICIOUS)";
                    badgeColor = "bg-amber-950/80 text-amber-300 border-amber-800";
                  } else if (urlObj.isHttp) {
                    badge = "INSECURE HTTP";
                    badgeColor = "bg-orange-950/80 text-orange-300 border-orange-800";
                  }

                  return (
                    <span key={wIdx} className="inline-flex items-center gap-1.5 mx-0.5 my-0.5">
                      <span className="underline font-bold text-sky-400 bg-sky-950/30 px-1 py-0.5 rounded border border-sky-800/60">
                        {word}
                      </span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded border font-mono tracking-wider font-semibold ${badgeColor}`}
                      >
                        {badge}
                      </span>
                    </span>
                  );
                }

                // Check for psychological urgency triggers
                const lowerWord = word.toLowerCase();
                const matchedKeyword = sortedKeywords.find((kw) =>
                  lowerWord.includes(kw.toLowerCase())
                );

                if (matchedKeyword) {
                  return (
                    <mark
                      key={wIdx}
                      className="bg-amber-400/20 text-amber-300 border border-amber-500/40 px-1 py-0.5 rounded font-semibold"
                      title="Psychological coercion / urgency heuristic flag"
                    >
                      {word}
                    </mark>
                  );
                }

                return <span key={wIdx}>{word}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">
      {/* Top Bar: Dual View Switcher + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-200">
            Email Inspector & Renderer
          </span>
          <InfoTooltip
            title="Email Rendering Engine"
            explanation="Allows you to inspect the incoming email in standard user view (Simple View like Gmail) or examine hidden headers, URL risks, and social-engineering keywords with cybersecurity color coding (Enhanced View)."
            align="left"
          />
        </div>

        {/* View Toggle Pill */}
        <div className="flex items-center bg-black/70 border border-zinc-800 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setViewMode("gmail")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              viewMode === "gmail"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            Simple View (Gmail)
          </button>

          <button
            type="button"
            onClick={() => setViewMode("enhanced")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              viewMode === "enhanced"
                ? "bg-indigo-950/80 text-indigo-200 shadow-sm border border-indigo-700/80"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Enhanced View (Color-Coded)
          </button>
        </div>

        {/* Action Button: Analyze if not analyzed */}
        {onAnalyze && !evidence && (
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(52,211,153,0.3)] cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Analyzing Threat...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Run Full Forensic Analysis</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* 1. SIMPLE VIEW (GMAIL REPLICA)                               */}
      {/* ============================================================ */}
      {viewMode === "gmail" && (
        <div className="p-6 md:p-8 space-y-6 bg-[#0c0c0e] font-sans">
          {/* Subject Line & Gmail Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-normal text-zinc-100 tracking-tight">
                {preview.subject}
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Inbox
              </span>
              {hasSuspicion && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-950/70 text-rose-400 border border-rose-800/60">
                  Suspicious
                </span>
              )}
            </div>

            {/* Simulated Gmail Actions */}
            <div className="flex items-center gap-2 text-zinc-400 print-hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Print email"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Star message"
              >
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Reply"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Authentic Gmail Security Warning Banner (if suspicious) */}
          {hasSuspicion && (
            <div className="bg-amber-950/30 border border-amber-700/60 rounded-xl p-4 flex items-start gap-3.5 shadow-md">
              <div className="w-8 h-8 rounded-lg bg-amber-900/40 border border-amber-700/70 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-amber-200">
                  Be careful with this message
                </div>
                <p className="text-amber-300/80 leading-relaxed font-sans">
                  Forensic Mail detected anomalies in this email. The sender domain, authentication
                  checks (SPF/DKIM), or embedded URLs contain high-risk threat indicators. Avoid
                  clicking links or disclosing sensitive credentials.
                </p>
              </div>
            </div>
          )}

          {/* Sender & Recipient Header Card */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              {/* Circular Avatar with Initials */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 select-none">
                {senderInitials}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-semibold text-sm text-zinc-100 truncate">
                    {preview.from.name || preview.from.address}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono truncate">
                    &lt;{preview.from.address}&gt;
                  </span>
                </div>

                {/* Recipient line with Expandable Details */}
                <div className="relative inline-block text-xs text-zinc-400">
                  <button
                    type="button"
                    onClick={() => setShowDetailsDropdown(!showDetailsDropdown)}
                    className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <span>to {preview.to.name || preview.to.address || "me"}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        showDetailsDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Gmail "Show Details" Dropdown Menu */}
                  {showDetailsDropdown && (
                    <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 p-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-40 space-y-2 text-xs font-sans">
                      <div className="grid grid-cols-[80px_1fr] gap-1.5">
                        <span className="text-zinc-500 text-right font-medium">from:</span>
                        <span className="text-zinc-200 font-mono break-all">{preview.from.raw}</span>

                        <span className="text-zinc-500 text-right font-medium">reply-to:</span>
                        <span className="text-zinc-200 font-mono break-all">
                          {preview.replyTo ? preview.replyTo.raw : preview.from.address}
                        </span>

                        <span className="text-zinc-500 text-right font-medium">to:</span>
                        <span className="text-zinc-200 font-mono break-all">{preview.to.raw}</span>

                        {preview.cc && (
                          <>
                            <span className="text-zinc-500 text-right font-medium">cc:</span>
                            <span className="text-zinc-200 font-mono break-all">{preview.cc.raw}</span>
                          </>
                        )}

                        <span className="text-zinc-500 text-right font-medium">date:</span>
                        <span className="text-zinc-200">{preview.formattedDate}</span>

                        <span className="text-zinc-500 text-right font-medium">subject:</span>
                        <span className="text-zinc-200">{preview.subject}</span>

                        <span className="text-zinc-500 text-right font-medium">security:</span>
                        <span className="text-zinc-200 flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAuthFailed ? "bg-rose-500" : "bg-emerald-400"
                            }`}
                          />
                          SPF: {spfStatus} · DKIM: {dkimStatus}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date & Time display */}
            <div className="text-xs text-zinc-500 whitespace-nowrap shrink-0">
              {preview.formattedDate}
            </div>
          </div>

          {/* Email Body Container (Clean Render) */}
          <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-6 text-zinc-200 min-h-[160px] shadow-inner">
            {preview.htmlBody ? (
              <div
                className="prose prose-invert max-w-none text-sm leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: preview.htmlBody }}
              />
            ) : (
              <div className="font-sans text-sm leading-relaxed whitespace-pre-wrap select-text text-zinc-300">
                {preview.textBody || "No message body content."}
              </div>
            )}
          </div>

          {/* Attachments (Gmail Chips) */}
          {preview.attachments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Attachments ({preview.attachments.length})
              </span>
              <div className="flex flex-wrap gap-3">
                {preview.attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-medium text-zinc-200 truncate max-w-[160px]">
                        {att.filename}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {att.sizeEstimate ? `${(att.sizeEstimate / 1024).toFixed(1)} KB` : att.contentType}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. ENHANCED VIEW (FORENSIC & COLOR-CODED)                     */}
      {/* ============================================================ */}
      {viewMode === "enhanced" && (
        <div className="p-6 md:p-8 space-y-6 bg-black font-mono">
          {/* Header Forensics Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                  // Header Forensics Matrix
                </span>
                <InfoTooltip
                  title="Header Forensics Matrix"
                  explanation="Examines the hidden routing tags of the email. Compares the sender address against Return-Path and Reply-To to identify spoofing attempts where replies are secretly stolen."
                />
              </div>

              {/* Copy actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyHeaders}
                  className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[10px] transition-colors"
                >
                  {copiedHeaders ? "COPIED HEADERS ✓" : "COPY HEADERS"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyBody}
                  className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[10px] transition-colors"
                >
                  {copiedBody ? "COPIED BODY ✓" : "COPY BODY"}
                </button>
              </div>
            </div>

            {/* Mismatch Spoofing Alert */}
            {preview.senderMismatch && (
              <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-3.5 flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mt-1 shrink-0" />
                <div className="space-y-0.5 text-xs text-rose-300">
                  <span className="font-bold uppercase tracking-wider text-rose-400">
                    CRITICAL SENDER SPOOF / MISMATCH:
                  </span>
                  <p className="text-[11px] leading-relaxed text-rose-300/90 font-sans">
                    {preview.mismatchReason}
                  </p>
                </div>
              </div>
            )}

            {/* Matrix Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* FROM */}
              <div className="bg-[#050505] border border-zinc-800 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] uppercase text-zinc-500 font-bold block">
                  Origin (From)
                </span>
                <span className="text-xs text-emerald-400 font-bold break-all block">
                  {preview.from.raw || "N/A"}
                </span>
              </div>

              {/* REPLY-TO */}
              <div
                className={`p-3.5 rounded-xl space-y-1 border ${
                  preview.replyTo && preview.replyTo.address !== preview.from.address
                    ? "bg-rose-950/20 border-rose-800/80"
                    : "bg-[#050505] border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold">Reply-To</span>
                  {preview.replyTo && preview.replyTo.address !== preview.from.address && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 font-bold">
                      MISMATCH
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-300 font-mono break-all block">
                  {preview.replyTo ? preview.replyTo.raw : "Same as From (Standard)"}
                </span>
              </div>

              {/* RETURN-PATH */}
              <div
                className={`p-3.5 rounded-xl space-y-1 border ${
                  preview.returnPath && !preview.returnPath.includes(preview.from.address)
                    ? "bg-amber-950/20 border-amber-800/80"
                    : "bg-[#050505] border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold">
                    Return-Path (Bounce)
                  </span>
                  {preview.returnPath && !preview.returnPath.includes(preview.from.address) && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700 text-amber-300 font-bold">
                      DEVIATION
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-300 font-mono break-all block">
                  {preview.returnPath || "N/A"}
                </span>
              </div>

              {/* TO */}
              <div className="bg-[#050505] border border-zinc-800 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] uppercase text-zinc-500 font-bold block">
                  Recipient (To)
                </span>
                <span className="text-xs text-zinc-300 break-all block">{preview.to.raw || "N/A"}</span>
              </div>

              {/* AUTH PROTOCOLS */}
              <div className="bg-[#050505] border border-zinc-800 p-3.5 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase text-zinc-500 font-bold block">
                  Cryptographic Auth
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                      spfStatus === "PASS"
                        ? "bg-emerald-950/60 border-emerald-700 text-emerald-400"
                        : "bg-rose-950/60 border-rose-700 text-rose-400"
                    }`}
                  >
                    SPF: {spfStatus}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                      dkimStatus === "SIGNED" || dkimStatus === "PASS"
                        ? "bg-emerald-950/60 border-emerald-700 text-emerald-400"
                        : "bg-zinc-900 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    DKIM: {dkimStatus}
                  </span>
                </div>
              </div>

              {/* MESSAGE-ID */}
              <div className="bg-[#050505] border border-zinc-800 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] uppercase text-zinc-500 font-bold block">
                  Message Tracking ID
                </span>
                <span className="text-[11px] text-zinc-400 truncate block">
                  {preview.messageId || "None Provided"}
                </span>
              </div>
            </div>
          </div>

          {/* Color-Coded Body Inspection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  // Heuristic & Link Color-Coded Body
                </span>
                <InfoTooltip
                  title="Color-Coded Body Inspection"
                  explanation="Highlights suspicious elements inside the email body: links pointing directly to IP addresses or disguised with link shorteners are flagged in red/amber, and coercive urgency phrases used by scammers are highlighted in gold."
                />
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Risky URL
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Urgency Coercion
                </span>
              </div>
            </div>

            <div className="bg-[#050505] border border-zinc-800/90 rounded-xl p-5 min-h-[160px] text-zinc-300">
              {renderEnhancedTextBody()}
            </div>
          </div>

          {/* Full Raw RFC 2822 Headers Drawer */}
          <div className="border border-zinc-800/80 rounded-xl bg-zinc-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRawHeaders(!showRawHeaders)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-900/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">&gt;</span>
                <span>RAW RFC 2822 TRANSMISSION HEADERS ({preview.rawHeaders.length} tags)</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {showRawHeaders ? "[- COLLAPSE]" : "[+ EXPAND RAW]"}
              </span>
            </button>

            {showRawHeaders && (
              <div className="p-4 bg-black border-t border-zinc-800/80 max-h-80 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 select-text">
                {preview.rawHeaders.map((h, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-cyan-400 font-semibold shrink-0">{h.key}:</span>
                    <span className="text-zinc-400 break-all">{h.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
