import crypto from 'crypto';
import { simpleParser, ParsedMail } from 'mailparser';

export interface IngestionResult {
  parsed: ParsedMail;
  sha256Hash: string;
  spfResult: string;
  dkimResult: string;
  dmarcResult: string;
  attachments: {
    filename: string;
    contentType: string;
    size: number;
    isRisky: boolean;
    sha256: string | null;
  }[];
  emailData: any;
}

export const parseRawEmail = async (buffer: Buffer): Promise<IngestionResult> => {
  // Cryptographic SHA-256 hash of the evidence file buffer for non-repudiation
  const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');

  // Parse the raw email buffer
  const parsed = await simpleParser(buffer);

  // Extract Authentication-Results header (with fallback to Received-SPF and DKIM-Signature)
  const authHeaderRaw = parsed.headers.get('authentication-results');
  const authHeaderStr = Array.isArray(authHeaderRaw) ? authHeaderRaw.join(' ') : String(authHeaderRaw || '');

  const parseAuthStatus = (protocol: string) => {
    const match = authHeaderStr.match(new RegExp(`${protocol}=([a-zA-Z0-9_-]+)`, 'i'));
    if (match) return match[1].toUpperCase();

    // Fallbacks
    if (protocol === 'spf') {
      const receivedSpf = parsed.headers.get('received-spf');
      if (receivedSpf) {
        const spfStr = Array.isArray(receivedSpf) ? receivedSpf.join(' ') : String(receivedSpf);
        const spfMatch = spfStr.match(/^(pass|fail|softfail|neutral|none|error)/i);
        if (spfMatch) return spfMatch[1].toUpperCase();
      }
    }

    if (protocol === 'dkim') {
      const dkimSig = parsed.headers.get('dkim-signature');
      if (dkimSig) return 'SIGNED';
    }

    return authHeaderStr ? 'NONE' : 'MISSING';
  };

  const spfResult = parseAuthStatus('spf');
  const dkimResult = parseAuthStatus('dkim');
  const dmarcResult = parseAuthStatus('dmarc');

  // Extract attachment details and flag risky extensions
  const riskyExtensions = ['.exe', '.scr', '.vbs', '.bat', '.cmd', '.js', '.ps1', '.iso', '.img', '.jar', '.hta', '.cpl', '.docm', '.xlsm'];
  const attachments = (parsed.attachments || []).map((att: any) => {
    const filename = att.filename || 'unnamed_attachment';
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const isRisky = riskyExtensions.includes(ext);
    
    // Hash attachment if content is available
    const attHash = att.content ? crypto.createHash('sha256').update(att.content).digest('hex') : null;

    return {
      filename,
      contentType: att.contentType,
      size: att.size,
      isRisky,
      sha256: attHash
    };
  });

  // Safely get received headers
  const receivedHeaderRaw = parsed.headers.get('received');
  const receivedHeaders = Array.isArray(receivedHeaderRaw) 
    ? receivedHeaderRaw 
    : (receivedHeaderRaw ? [receivedHeaderRaw] : []);

  const emailData = {
    sha256Hash,
    from: (parsed.from as any)?.text || '',
    to: (parsed.to as any)?.text || '',
    cc: (parsed.cc as any)?.text || '',
    subject: parsed.subject || '',
    date: parsed.date ? parsed.date.toISOString() : '',
    messageId: parsed.messageId || '',
    replyTo: (parsed.replyTo as any)?.text || '',
    returnPath: (parsed.headers.get('return-path') as any)?.text || (typeof parsed.headers.get('return-path') === 'string' ? parsed.headers.get('return-path') : ''),
    textBodySnippet: parsed.text ? parsed.text.substring(0, 500) + '...' : 'No text body',
    htmlBodyExists: !!parsed.html,
    attachmentCount: attachments.length,
    receivedHeaders: receivedHeaders as any,
    spfResult,
    dkimResult,
    dmarcResult
  };

  return {
    parsed,
    sha256Hash,
    spfResult,
    dkimResult,
    dmarcResult,
    attachments,
    emailData
  };
};
