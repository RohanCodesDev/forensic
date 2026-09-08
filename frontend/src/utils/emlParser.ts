export interface ParsedEmailAddress {
  name: string;
  address: string;
  raw: string;
}

export interface ParsedAttachment {
  filename: string;
  contentType: string;
  sizeEstimate?: number;
}

export interface ExtractedUrlInfo {
  url: string;
  displayText?: string;
  isHttp: boolean;
  isShortener: boolean;
  isIPBased: boolean;
  isPunycode: boolean;
}

export interface ParsedEmailPreview {
  headers: Record<string, string>;
  rawHeaders: { key: string; value: string }[];
  from: ParsedEmailAddress;
  to: ParsedEmailAddress;
  cc?: ParsedEmailAddress;
  replyTo?: ParsedEmailAddress;
  returnPath?: string;
  subject: string;
  date: string;
  formattedDate: string;
  messageId: string;
  spfResult?: string;
  dkimResult?: string;
  dmarcResult?: string;
  textBody: string;
  htmlBody?: string;
  attachments: ParsedAttachment[];
  detectedUrls: ExtractedUrlInfo[];
  detectedUrgencyKeywords: string[];
  senderMismatch: boolean;
  mismatchReason?: string;
}

// Decode quoted-printable string
export function decodeQuotedPrintable(input: string): string {
  return input
    // Soft line breaks
    .replace(/=\r?\n/g, "")
    // Hex encoded characters =XX
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return _;
      }
    });
}

// Safe base64 decoding in browser
export function decodeBase64(input: string): string {
  try {
    const cleaned = input.replace(/\s/g, "");
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(cleaned), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    try {
      return atob(input.replace(/\s/g, ""));
    } catch {
      return input;
    }
  }
}

// Parse display name and email address from string e.g. "John Doe" <john@example.com>
export function parseEmailAddress(raw: string = ""): ParsedEmailAddress {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { name: "", address: "", raw: "" };
  }

  const match = trimmed.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+@[^>]+)>?$/);
  if (match) {
    const name = (match[1] || "").trim();
    const address = (match[2] || "").trim();
    return {
      name: name || address.split("@")[0],
      address,
      raw: trimmed,
    };
  }

  return {
    name: trimmed.includes("@") ? trimmed.split("@")[0] : trimmed,
    address: trimmed,
    raw: trimmed,
  };
}

export function parseEmlText(rawEml: string): ParsedEmailPreview {
  // Normalize line endings
  const normalized = rawEml.replace(/\r\n/g, "\n");

  // Find split between headers and body (first double newline)
  const headerSplitIndex = normalized.search(/\n\n/);
  const headerBlock = headerSplitIndex !== -1 ? normalized.substring(0, headerSplitIndex) : normalized;
  const bodyBlock = headerSplitIndex !== -1 ? normalized.substring(headerSplitIndex + 2) : "";

  // Parse headers with line folding (continuation lines starting with space or tab)
  const headerLines = headerBlock.split("\n");
  const unfoldedHeaders: string[] = [];

  for (const line of headerLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfoldedHeaders.length > 0) {
      unfoldedHeaders[unfoldedHeaders.length - 1] += " " + line.trim();
    } else if (line.trim().length > 0) {
      unfoldedHeaders.push(line);
    }
  }

  const headers: Record<string, string> = {};
  const rawHeaders: { key: string; value: string }[] = [];

  for (const headerLine of unfoldedHeaders) {
    const colonIdx = headerLine.indexOf(":");
    if (colonIdx !== -1) {
      const key = headerLine.substring(0, colonIdx).trim();
      const val = headerLine.substring(colonIdx + 1).trim();
      const lowerKey = key.toLowerCase();
      headers[lowerKey] = val;
      rawHeaders.push({ key, value: val });
    }
  }

  const from = parseEmailAddress(headers["from"] || "Unknown Sender");
  const to = parseEmailAddress(headers["to"] || "recipient@domain.com");
  const cc = headers["cc"] ? parseEmailAddress(headers["cc"]) : undefined;
  const replyTo = headers["reply-to"] ? parseEmailAddress(headers["reply-to"]) : undefined;
  const returnPath = headers["return-path"]?.replace(/[<>]/g, "") || undefined;
  const subject = headers["subject"] || "(No Subject)";
  const rawDate = headers["date"] || "";
  const messageId = headers["message-id"] || "";

  // Format date nicely
  let formattedDate = rawDate;
  if (rawDate) {
    try {
      const parsedD = new Date(rawDate);
      if (!isNaN(parsedD.getTime())) {
        formattedDate = parsedD.toLocaleString(undefined, {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch {
      // keep rawDate
    }
  }

  // Authentication inference if in headers
  let spfResult: string | undefined;
  let dkimResult: string | undefined;
  let dmarcResult: string | undefined;

  const authHeader = headers["authentication-results"] || "";
  if (authHeader) {
    const spfMatch = authHeader.match(/spf=([a-zA-Z0-9_-]+)/i);
    if (spfMatch) spfResult = spfMatch[1].toUpperCase();
    const dkimMatch = authHeader.match(/dkim=([a-zA-Z0-9_-]+)/i);
    if (dkimMatch) dkimResult = dkimMatch[1].toUpperCase();
    const dmarcMatch = authHeader.match(/dmarc=([a-zA-Z0-9_-]+)/i);
    if (dmarcMatch) dmarcResult = dmarcMatch[1].toUpperCase();
  }
  if (!spfResult && headers["received-spf"]) {
    const m = headers["received-spf"].match(/^(pass|fail|softfail|neutral|none)/i);
    if (m) spfResult = m[1].toUpperCase();
  }
  if (!dkimResult && headers["dkim-signature"]) {
    dkimResult = "SIGNED";
  }

  // Body extraction
  const contentType = headers["content-type"] || "text/plain";
  let textBody = "";
  let htmlBody: string | undefined = undefined;
  const attachments: ParsedAttachment[] = [];

  // Check for multipart
  const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/i);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = bodyBlock.split(new RegExp(`--${boundary}(?:--)?`));

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart || trimmedPart === "--") continue;

      const partSplit = trimmedPart.search(/\n\n/);
      const partHeadersStr = partSplit !== -1 ? trimmedPart.substring(0, partSplit) : "";
      let partContent = partSplit !== -1 ? trimmedPart.substring(partSplit + 2) : trimmedPart;

      const partHeaders: Record<string, string> = {};
      partHeadersStr.split("\n").forEach((l) => {
        const c = l.indexOf(":");
        if (c !== -1) {
          partHeaders[l.substring(0, c).trim().toLowerCase()] = l.substring(c + 1).trim();
        }
      });

      const partContentType = partHeaders["content-type"] || "text/plain";
      const partEncoding = (partHeaders["content-transfer-encoding"] || "").toLowerCase();
      const disposition = partHeaders["content-disposition"] || "";

      // Check if attachment
      const isAttachment =
        disposition.toLowerCase().includes("attachment") ||
        partHeadersStr.toLowerCase().includes("filename=") ||
        partContentType.toLowerCase().includes("name=");

      if (isAttachment) {
        let fn = "attachment";
        const fnMatch = (disposition + " " + partContentType).match(/(?:filename|name)="?([^";\r\n]+)"?/i);
        if (fnMatch) fn = fnMatch[1];
        attachments.push({
          filename: fn,
          contentType: partContentType.split(";")[0].trim(),
          sizeEstimate: Math.round((partContent.length * 3) / 4),
        });
        continue;
      }

      // Decode content
      if (partEncoding === "base64") {
        partContent = decodeBase64(partContent);
      } else if (partEncoding === "quoted-printable") {
        partContent = decodeQuotedPrintable(partContent);
      }

      if (partContentType.includes("text/html")) {
        htmlBody = partContent;
      } else if (partContentType.includes("text/plain")) {
        textBody = partContent;
      }
    }
  } else {
    // Single part
    let content = bodyBlock;
    const encoding = (headers["content-transfer-encoding"] || "").toLowerCase();
    if (encoding === "base64") {
      content = decodeBase64(content);
    } else if (encoding === "quoted-printable") {
      content = decodeQuotedPrintable(content);
    }

    if (contentType.includes("text/html")) {
      htmlBody = content;
      // Also derive plain text approximation
      textBody = content.replace(/<[^>]*>/g, " ").replace(/\s{2,}/g, " ").trim();
    } else {
      textBody = content;
    }
  }

  // Detect URLs in text and HTML
  const combinedContent = (textBody || "") + " " + (htmlBody || "");
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  const rawUrls = Array.from(new Set(combinedContent.match(urlRegex) || []));

  const shortenerDomains = ["bit.ly", "tinyurl.com", "t.co", "is.gd", "buff.ly", "ow.ly", "cutt.ly"];
  const detectedUrls: ExtractedUrlInfo[] = rawUrls.map((url) => {
    let hostname = "";
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = "";
    }
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const isShortener = shortenerDomains.some((d) => hostname.toLowerCase().includes(d));
    const isPunycode = hostname.toLowerCase().includes("xn--");
    const isHttp = url.startsWith("http://");

    return {
      url,
      isHttp,
      isShortener,
      isIPBased: isIP,
      isPunycode,
    };
  });

  // Detect urgency / psychological manipulation keywords
  const urgencyPatterns = [
    "action required",
    "account suspended",
    "account locked",
    "immediately",
    "verify your identity",
    "unusual activity",
    "unauthorized access",
    "wire transfer",
    "urgent",
    "critical security alert",
    "password expired",
    "suspended",
    "prevent suspension",
    "click here to login",
    "confirm payment",
    "immediate action",
    "24 hours",
    "final notice",
  ];

  const detectedUrgencyKeywords: string[] = [];
  const lowerBody = combinedContent.toLowerCase();
  for (const pattern of urgencyPatterns) {
    if (lowerBody.includes(pattern) || subject.toLowerCase().includes(pattern)) {
      detectedUrgencyKeywords.push(pattern);
    }
  }

  // Check sender mismatch: From domain vs Reply-To / Return-Path domain
  let senderMismatch = false;
  let mismatchReason: string | undefined = undefined;

  const getDomain = (emailStr: string) => {
    const parts = emailStr.split("@");
    return parts.length > 1 ? parts[1].toLowerCase().replace(/[>]/g, "").trim() : "";
  };

  const fromDomain = getDomain(from.address);
  const replyDomain = replyTo ? getDomain(replyTo.address) : "";
  const returnDomain = returnPath ? getDomain(returnPath) : "";

  if (replyDomain && fromDomain && replyDomain !== fromDomain) {
    senderMismatch = true;
    mismatchReason = `Sender address is '${fromDomain}' but Reply-To redirects responses to an entirely different domain '${replyDomain}'.`;
  } else if (returnDomain && fromDomain && returnDomain !== fromDomain && !returnDomain.includes(fromDomain)) {
    senderMismatch = true;
    mismatchReason = `Sender address is '${fromDomain}' but Return-Path points to '${returnDomain}'.`;
  }

  return {
    headers,
    rawHeaders,
    from,
    to,
    cc,
    replyTo,
    returnPath,
    subject,
    date: rawDate,
    formattedDate: formattedDate || rawDate,
    messageId,
    spfResult,
    dkimResult,
    dmarcResult,
    textBody: textBody.trim(),
    htmlBody,
    attachments,
    detectedUrls,
    detectedUrgencyKeywords,
    senderMismatch,
    mismatchReason,
  };
}
