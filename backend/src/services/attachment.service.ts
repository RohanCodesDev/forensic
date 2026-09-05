import crypto from 'crypto';

// ============================================================
// Known Malware SHA-256 Hash Database (Offline / Curated)
// Populated with famous malware families for demonstration.
// In production, this would be synced with a threat feed.
// ============================================================
const KNOWN_MALWARE_HASHES: Record<string, string> = {
  // WannaCry ransomware samples
  'ed01ebfbc9eb5bbea545af4d01bf5f1071661840480439c6e5babe8e080e41aa': 'WannaCry Ransomware (EternalBlue)',
  'b9c5d4339809e0ad9a00d4d3dd26fdf44a32819a54abf846bb9b560d81391c25': 'WannaCry Ransomware (v2)',
  // Emotet dropper documents
  '3d5e3648653d74e2274cc794938f8a8d5de8d3d17e14c75010edd8e2c0c6d66a': 'Emotet Dropper (Word Macro)',
  'a592eb46a4dfe88ec2ae49aee9efdde87ec4a573e3b1b26038b78bef33db065e': 'Emotet Loader Stage 2',
  // AgentTesla keylogger
  '5f9c2d66cf1ee88f3b770065c94f45c8a9cff57e3e37f43e43f5df2c1a8d38a2': 'AgentTesla Keylogger',
  // Trickbot banking trojan
  '721c4864e84c4d4e2e4a51a5f7fe6e81cae9cf3fddfa8a4afb07e2c26c3f5132': 'TrickBot Banking Trojan',
  // Dridex loader
  'ae7a3d7e8b5d9c1ae2f0b8e4c5a2d7f6b9c8e1a3d5f4b7c2e9a1d6f3b8c4a2e7': 'Dridex Financial Malware',
  // Lokibot stealer
  '2d8b4a7c1e5f9a3d6b0c4e8f2a7d5b9c3e1f6a4d8b2c7e5f1a9d3b6c4e8f2a1': 'LokiBot Credential Stealer',
  // Generic test hash (for demo/testing purposes)
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa': 'Test Malware Sample (Demo)',
};

// High-risk MIME types that should never be sent as email attachments
const HIGH_RISK_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-msdos-program',
  'application/vnd.ms-office',
  'application/x-vbs',
  'application/x-javascript',
  'application/x-powershell',
];

// Extension <-> Expected MIME type mapping for mismatch detection
const EXTENSION_MIME_MAP: Record<string, string[]> = {
  '.pdf':  ['application/pdf'],
  '.jpg':  ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png':  ['image/png'],
  '.gif':  ['image/gif'],
  '.txt':  ['text/plain'],
  '.zip':  ['application/zip', 'application/x-zip-compressed'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

export interface MalwareScanResult {
  sha256: string;
  isKnownMalware: boolean;
  knownMalwareName?: string;
  vtDetections?: number;
  vtTotalEngines?: number;
  vtLink?: string;
  mimeTypeMismatch: boolean;
  mimeTypeWarning?: string;
  highRiskMime: boolean;
  threatScore: number;       // 0–100
  verdict: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  verdictReasons: string[];
}

interface AttachmentInput {
  filename: string;
  contentType?: string;
  size: number;
  isRisky: boolean;
  sha256?: string | null;
}

// ============================================================
// OPTIONAL: VirusTotal Hash Lookup
// Requires VIRUSTOTAL_API_KEY in environment variables
// ============================================================
async function lookupVirusTotal(sha256: string): Promise<{ detections: number; total: number } | null> {
  const vtApiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!vtApiKey) return null;

  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, {
      headers: { 'x-apikey': vtApiKey },
      signal: AbortSignal.timeout(8000),  // 8 second timeout
    });

    if (response.status === 404) return { detections: 0, total: 0 };
    if (!response.ok) return null;

    const data: any = await response.json();
    const stats = data?.data?.attributes?.last_analysis_stats;
    if (!stats) return null;

    const detections = (stats.malicious || 0) + (stats.suspicious || 0);
    const total = Object.values(stats as Record<string, number>).reduce((a, b) => a + b, 0);
    return { detections, total };
  } catch {
    return null;
  }
}

// ============================================================
// MAIN EXPORT: scanAttachment
// Scans a single attachment and returns a full MalwareScanResult
// ============================================================
export async function scanAttachment(att: AttachmentInput): Promise<MalwareScanResult> {
  const sha256 = att.sha256 || '';
  const reasons: string[] = [];
  let threatScore = 0;

  // 1. Known malware hash DB lookup
  const knownMalwareName = sha256 ? KNOWN_MALWARE_HASHES[sha256.toLowerCase()] : undefined;
  const isKnownMalware = !!knownMalwareName;
  if (isKnownMalware) {
    threatScore += 80;
    reasons.push(`Hash matched known malware: ${knownMalwareName}`);
  }

  // 2. Risky extension check
  if (att.isRisky) {
    threatScore += 30;
    const ext = att.filename.substring(att.filename.lastIndexOf('.')).toLowerCase();
    reasons.push(`Executable/macro file extension: ${ext}`);
  }

  // 3. MIME-type mismatch detection
  const ext = att.filename.includes('.') 
    ? att.filename.substring(att.filename.lastIndexOf('.')).toLowerCase() 
    : '';
  const contentType = (att.contentType || '').toLowerCase().split(';')[0].trim();
  const expectedMimes = EXTENSION_MIME_MAP[ext];
  const mimeTypeMismatch = !!(expectedMimes && contentType && !expectedMimes.includes(contentType));
  let mimeTypeWarning: string | undefined;

  if (mimeTypeMismatch) {
    threatScore += 25;
    mimeTypeWarning = `Extension "${ext}" does not match MIME type "${contentType}"`;
    reasons.push(mimeTypeWarning);
  }

  // 4. High-risk MIME type check
  const highRiskMime = HIGH_RISK_MIME_TYPES.includes(contentType);
  if (highRiskMime) {
    threatScore += 20;
    reasons.push(`High-risk MIME type detected: ${contentType}`);
  }

  // 5. Optional VirusTotal lookup
  let vtDetections: number | undefined;
  let vtTotalEngines: number | undefined;
  let vtLink: string | undefined;

  if (sha256) {
    const vtResult = await lookupVirusTotal(sha256);
    if (vtResult !== null) {
      vtDetections = vtResult.detections;
      vtTotalEngines = vtResult.total;
      vtLink = `https://www.virustotal.com/gui/file/${sha256}`;
      if (vtResult.detections > 0) {
        const vtScore = Math.min(50, Math.round((vtResult.detections / Math.max(vtResult.total, 1)) * 50));
        threatScore += vtScore;
        reasons.push(`VirusTotal: ${vtResult.detections}/${vtResult.total} engines flagged`);
      }
    }
  } else if (sha256) {
    // Still provide VT link even without API key
    vtLink = `https://www.virustotal.com/gui/file/${sha256}`;
  }

  // Always set vtLink if we have a hash
  if (sha256 && !vtLink) {
    vtLink = `https://www.virustotal.com/gui/file/${sha256}`;
  }

  // 6. Cap score at 100
  threatScore = Math.min(100, threatScore);

  // 7. Determine final verdict
  let verdict: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  if (isKnownMalware || threatScore >= 70) {
    verdict = 'MALICIOUS';
  } else if (threatScore >= 25) {
    verdict = 'SUSPICIOUS';
  } else {
    verdict = 'CLEAN';
  }

  if (reasons.length === 0) {
    reasons.push('No threats detected');
  }

  return {
    sha256,
    isKnownMalware,
    knownMalwareName,
    vtDetections,
    vtTotalEngines,
    vtLink,
    mimeTypeMismatch,
    mimeTypeWarning,
    highRiskMime,
    threatScore,
    verdict,
    verdictReasons: reasons,
  };
}

// ============================================================
// Scan all attachments in parallel
// ============================================================
export async function scanAllAttachments(attachments: AttachmentInput[]): Promise<MalwareScanResult[]> {
  return Promise.all(attachments.map(att => scanAttachment(att)));
}
