import React, { useState, useMemo } from "react";
import { EmailEvidence } from "../types/forensic";
import InfoTooltip from "./InfoTooltip";
import EmailViewer from "./EmailViewer";
import { parseEmailAddress, ParsedEmailPreview } from "../utils/emlParser";

interface ExtractedPayloadCardProps {
  evidence: EmailEvidence;
}

export default function ExtractedPayloadCard({ evidence }: ExtractedPayloadCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySha256 = () => {
    if (evidence.sha256Hash) {
      navigator.clipboard.writeText(evidence.sha256Hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Construct ParsedEmailPreview from evidence for EmailViewer
  const preview = useMemo<ParsedEmailPreview>(() => {
    const rawHeaders: { key: string; value: string }[] = [];
    if (evidence.receivedHeaders && Array.isArray(evidence.receivedHeaders)) {
      evidence.receivedHeaders.forEach((h, i) => {
        rawHeaders.push({ key: `Received-${i + 1}`, value: String(h) });
      });
    }
    if (evidence.returnPath) {
      rawHeaders.push({ key: "Return-Path", value: evidence.returnPath });
    }
    if (evidence.messageId) {
      rawHeaders.push({ key: "Message-ID", value: evidence.messageId });
    }
    if (evidence.spfResult) {
      rawHeaders.push({ key: "SPF-Result", value: evidence.spfResult });
    }
    if (evidence.dkimResult) {
      rawHeaders.push({ key: "DKIM-Result", value: evidence.dkimResult });
    }
    if (evidence.dmarcResult) {
      rawHeaders.push({ key: "DMARC-Result", value: evidence.dmarcResult });
    }

    const fromObj = parseEmailAddress(evidence.from || "Unknown Sender");
    const toObj = parseEmailAddress(evidence.to || "recipient@domain.com");
    const replyObj = evidence.replyTo ? parseEmailAddress(evidence.replyTo) : undefined;
    const ccObj = evidence.cc ? parseEmailAddress(evidence.cc) : undefined;

    const fromDomain = fromObj.address.split("@")[1]?.toLowerCase() || "";
    const replyDomain = replyObj?.address.split("@")[1]?.toLowerCase() || "";
    const senderMismatch = !!(replyDomain && fromDomain && replyDomain !== fromDomain);

    return {
      headers: {},
      rawHeaders,
      from: fromObj,
      to: toObj,
      cc: ccObj,
      replyTo: replyObj,
      returnPath: evidence.returnPath || undefined,
      subject: evidence.subject || "(No Subject)",
      date: evidence.date || "",
      formattedDate: evidence.date ? new Date(evidence.date).toLocaleString() : "",
      messageId: evidence.messageId || "",
      spfResult: evidence.spfResult,
      dkimResult: evidence.dkimResult,
      dmarcResult: evidence.dmarcResult,
      textBody: evidence.textBodySnippet || "",
      htmlBody: undefined,
      attachments: (evidence.analysis?.attachments || []).map((a) => ({
        filename: a.filename,
        contentType: a.contentType || "application/octet-stream",
        sizeEstimate: a.size,
      })),
      detectedUrls: (evidence.analysis?.urlAnalysis || []).map((u) => ({
        url: u.url,
        isHttp: u.isHttp,
        isShortener: u.isShortener,
        isIPBased: u.isIPBased,
        isPunycode: u.isPunycode,
      })),
      detectedUrgencyKeywords: (evidence.analysis?.nlpAnalysis?.triggers || []).map((t) => t.phrase),
      senderMismatch,
      mismatchReason: senderMismatch
        ? `From domain is '${fromDomain}' while replies are directed to '${replyDomain}'.`
        : undefined,
    };
  }, [evidence]);

  return (
    <div className="space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            Extracted Intelligence Payload
          </h2>
          <InfoTooltip
            title="Extracted Intelligence Payload"
            explanation="The raw structural details extracted from the email, including sender/recipient addresses, message IDs, transmission timestamps, and the decoded message text."
            align="left"
          />
        </div>

        {evidence.sha256Hash && (
          <div className="flex items-center gap-2 bg-black border border-zinc-800 px-3 py-1 rounded-md">
            <span className="text-[10px] uppercase font-mono text-zinc-500">SHA-256:</span>
            <span className="font-mono text-xs text-emerald-400 font-bold truncate max-w-[140px] sm:max-w-[220px]">
              {evidence.sha256Hash}
            </span>
            <button
              onClick={handleCopySha256}
              className="text-[10px] font-mono text-zinc-400 hover:text-white px-1.5 py-0.5 bg-zinc-900 rounded border border-zinc-700 transition-colors cursor-pointer"
              title="Copy full SHA-256 to clipboard"
            >
              {copied ? "COPIED ✓" : "COPY"}
            </button>
          </div>
        )}
      </div>

      {/* Interactive Dual-View Email Viewer */}
      <EmailViewer preview={preview} evidence={evidence} />
    </div>
  );
}
