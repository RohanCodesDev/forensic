/**
 * PHASE 11 — NLP & Social Engineering / BEC Heuristics Engine
 * 
 * Pure TypeScript NLP engine that analyzes email body text for psychological
 * manipulation patterns used in phishing, BEC, and social engineering attacks.
 * 
 * No external AI API required. All analysis is rule-based lexicon matching
 * with weighted scoring — fast, offline-resilient, and 100% free.
 */

export interface NlpTrigger {
  category: string;        // e.g. 'URGENCY', 'BEC_AUTHORITY'
  phrase: string;          // exact matched keyword/phrase
  context: string;         // surrounding 80-char snippet for evidence
  weight: number;          // point contribution
}

export interface NlpAnalysis {
  intentScore: number;     // 0–100 aggregated manipulation score
  intentLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  becCategory: string | null; // Dominant attack category or null
  triggers: NlpTrigger[];     // All matched phrases with context
  summary: string;             // Human-readable executive summary
}

// ─── Lexicon Definitions ────────────────────────────────────────────────────

/**
 * Each entry: [phrase, weight, category]
 * Weight is the raw score contribution (summed, then normalized to 0-100).
 */
const LEXICON: [string, number, string][] = [

  // ── 1. URGENCY & FEAR MANUFACTURING ──────────────────────────────────────
  // Attackers create artificial time pressure to bypass rational decision-making
  ['urgent', 8, 'URGENCY'],
  ['immediately', 7, 'URGENCY'],
  ['right away', 9, 'URGENCY'],
  ['as soon as possible', 6, 'URGENCY'],
  ['asap', 6, 'URGENCY'],
  ['within 24 hours', 10, 'URGENCY'],
  ['within 48 hours', 9, 'URGENCY'],
  ['by end of day', 8, 'URGENCY'],
  ['by end of business', 8, 'URGENCY'],
  ['account will be suspended', 12, 'URGENCY'],
  ['account will be terminated', 12, 'URGENCY'],
  ['account has been compromised', 12, 'URGENCY'],
  ['your account has been locked', 12, 'URGENCY'],
  ['limited time', 7, 'URGENCY'],
  ['time-sensitive', 8, 'URGENCY'],
  ['act now', 9, 'URGENCY'],
  ['do not delay', 8, 'URGENCY'],
  ['failure to respond', 10, 'URGENCY'],
  ['final notice', 10, 'URGENCY'],
  ['last warning', 10, 'URGENCY'],
  ['overdue', 7, 'URGENCY'],
  ['deadline', 6, 'URGENCY'],
  ['expire', 7, 'URGENCY'],
  ['expired', 7, 'URGENCY'],

  // ── 2. AUTHORITY IMPERSONATION / CEO FRAUD ────────────────────────────────
  // Attacker poses as C-suite or management to invoke compliance
  ['ceo', 5, 'BEC_AUTHORITY'],
  ['chief executive', 6, 'BEC_AUTHORITY'],
  ['cfo', 5, 'BEC_AUTHORITY'],
  ['chief financial officer', 6, 'BEC_AUTHORITY'],
  ['managing director', 6, 'BEC_AUTHORITY'],
  ['on behalf of', 5, 'BEC_AUTHORITY'],
  ['per the request of', 7, 'BEC_AUTHORITY'],
  ['as instructed by', 7, 'BEC_AUTHORITY'],
  ['per management', 7, 'BEC_AUTHORITY'],
  ['executive team', 5, 'BEC_AUTHORITY'],
  ['board of directors', 6, 'BEC_AUTHORITY'],
  ['this is confidential', 8, 'BEC_AUTHORITY'],
  ['strictly confidential', 8, 'BEC_AUTHORITY'],
  ['do not discuss', 9, 'BEC_AUTHORITY'],
  ['keep this between us', 10, 'BEC_AUTHORITY'],
  ['do not forward', 8, 'BEC_AUTHORITY'],
  ['do not involve', 8, 'BEC_AUTHORITY'],
  ['my personal request', 8, 'BEC_AUTHORITY'],
  ['i am travelling', 5, 'BEC_AUTHORITY'],
  ['i am out of office', 5, 'BEC_AUTHORITY'],
  ['i am in a meeting', 5, 'BEC_AUTHORITY'],
  ['i cannot be reached by phone', 8, 'BEC_AUTHORITY'],
  ['respond only via email', 9, 'BEC_AUTHORITY'],

  // ── 3. FINANCIAL LURE / WIRE TRANSFER / BEC ──────────────────────────────
  // Direct financial fraud trigger phrases
  ['wire transfer', 12, 'WIRE_FRAUD'],
  ['bank transfer', 12, 'WIRE_FRAUD'],
  ['international transfer', 11, 'WIRE_FRAUD'],
  ['iban', 8, 'WIRE_FRAUD'],
  ['swift code', 8, 'WIRE_FRAUD'],
  ['routing number', 8, 'WIRE_FRAUD'],
  ['account number', 7, 'WIRE_FRAUD'],
  ['send payment', 10, 'WIRE_FRAUD'],
  ['process payment', 8, 'WIRE_FRAUD'],
  ['invoice attached', 7, 'WIRE_FRAUD'],
  ['outstanding invoice', 8, 'WIRE_FRAUD'],
  ['overdue payment', 8, 'WIRE_FRAUD'],
  ['gift card', 11, 'WIRE_FRAUD'],
  ['itunes card', 12, 'WIRE_FRAUD'],
  ['google play card', 12, 'WIRE_FRAUD'],
  ['amazon gift card', 12, 'WIRE_FRAUD'],
  ['purchase gift cards', 12, 'WIRE_FRAUD'],
  ['scratch card', 11, 'WIRE_FRAUD'],
  ['send the codes', 10, 'WIRE_FRAUD'],
  ['reimburse you later', 9, 'WIRE_FRAUD'],
  ['payroll', 6, 'WIRE_FRAUD'],
  ['direct deposit', 8, 'WIRE_FRAUD'],
  ['update banking information', 12, 'WIRE_FRAUD'],
  ['change bank details', 12, 'WIRE_FRAUD'],
  ['new bank account', 10, 'WIRE_FRAUD'],

  // ── 4. CREDENTIAL HARVESTING LURES ───────────────────────────────────────
  // Prompts to click a link and enter credentials
  ['verify your account', 10, 'CREDENTIAL_HARVEST'],
  ['verify your email', 9, 'CREDENTIAL_HARVEST'],
  ['confirm your identity', 9, 'CREDENTIAL_HARVEST'],
  ['update your password', 9, 'CREDENTIAL_HARVEST'],
  ['reset your password', 8, 'CREDENTIAL_HARVEST'],
  ['your password has expired', 10, 'CREDENTIAL_HARVEST'],
  ['login to continue', 9, 'CREDENTIAL_HARVEST'],
  ['sign in to verify', 9, 'CREDENTIAL_HARVEST'],
  ['click here to verify', 10, 'CREDENTIAL_HARVEST'],
  ['click here to confirm', 10, 'CREDENTIAL_HARVEST'],
  ['click the link below', 7, 'CREDENTIAL_HARVEST'],
  ['follow the link', 6, 'CREDENTIAL_HARVEST'],
  ['update your billing', 9, 'CREDENTIAL_HARVEST'],
  ['update payment information', 10, 'CREDENTIAL_HARVEST'],
  ['confirm your payment method', 9, 'CREDENTIAL_HARVEST'],
  ['unusual sign-in activity', 10, 'CREDENTIAL_HARVEST'],
  ['suspicious activity detected', 10, 'CREDENTIAL_HARVEST'],
  ['account will expire', 9, 'CREDENTIAL_HARVEST'],
  ['session has expired', 9, 'CREDENTIAL_HARVEST'],
  ['two-factor authentication', 5, 'CREDENTIAL_HARVEST'],
  ['enter your otp', 9, 'CREDENTIAL_HARVEST'],
  ['one-time password', 7, 'CREDENTIAL_HARVEST'],

  // ── 5. SECRECY / CONCEALMENT LANGUAGE ────────────────────────────────────
  // Prevents victim from consulting colleagues or verifying the request
  ['do not tell', 9, 'SECRECY'],
  ['do not mention', 9, 'SECRECY'],
  ['keep this private', 9, 'SECRECY'],
  ['keep this secret', 10, 'SECRECY'],
  ['between you and me', 9, 'SECRECY'],
  ['do not contact', 8, 'SECRECY'],
  ['do not call', 7, 'SECRECY'],
  ['do not verify', 9, 'SECRECY'],
  ['no need to verify', 9, 'SECRECY'],
  ['handle this discreetly', 10, 'SECRECY'],
  ['this is a surprise', 7, 'SECRECY'],
  ['avoid questions', 8, 'SECRECY'],

  // ── 6. REWARD & GREED LURES ──────────────────────────────────────────────
  // Prize, lottery, inheritance bait
  ['you have won', 10, 'PRIZE_SCAM'],
  ['you are a winner', 10, 'PRIZE_SCAM'],
  ['congratulations', 6, 'PRIZE_SCAM'],
  ['claim your prize', 10, 'PRIZE_SCAM'],
  ['lottery winner', 12, 'PRIZE_SCAM'],
  ['jackpot', 8, 'PRIZE_SCAM'],
  ['inheritance', 10, 'PRIZE_SCAM'],
  ['unclaimed funds', 10, 'PRIZE_SCAM'],
  ['next of kin', 10, 'PRIZE_SCAM'],
  ['million dollars', 10, 'PRIZE_SCAM'],
  ['million usd', 10, 'PRIZE_SCAM'],
  ['investment opportunity', 8, 'PRIZE_SCAM'],
  ['100% guaranteed', 10, 'PRIZE_SCAM'],
  ['risk-free', 8, 'PRIZE_SCAM'],
  ['no risk', 7, 'PRIZE_SCAM'],
  ['free money', 10, 'PRIZE_SCAM'],
  ['cash prize', 10, 'PRIZE_SCAM'],

  // ── 7. CONTENT EVASION SIGNALS ───────────────────────────────────────────
  // Linguistic patterns used to bypass spam filters
  ['dear valued customer', 5, 'SPAM_EVASION'],
  ['dear account holder', 5, 'SPAM_EVASION'],
  ['dear member', 4, 'SPAM_EVASION'],
  ['this is not spam', 10, 'SPAM_EVASION'],
  ['this is not a scam', 10, 'SPAM_EVASION'],
  ['100% legitimate', 8, 'SPAM_EVASION'],
  ['unsubscribe if you wish', 4, 'SPAM_EVASION'],
];

// ─── Category Priority for becCategory Resolution ───────────────────────────

const CATEGORY_PRIORITY: Record<string, number> = {
  WIRE_FRAUD: 6,
  CREDENTIAL_HARVEST: 5,
  BEC_AUTHORITY: 4,
  PRIZE_SCAM: 3,
  URGENCY: 2,
  SECRECY: 1,
  SPAM_EVASION: 0,
};

const BEC_CATEGORY_LABELS: Record<string, string> = {
  WIRE_FRAUD: 'WIRE_FRAUD / BEC',
  CREDENTIAL_HARVEST: 'CREDENTIAL_HARVESTING',
  BEC_AUTHORITY: 'CEO_FRAUD / AUTHORITY_IMPERSONATION',
  PRIZE_SCAM: 'PRIZE_SCAM / ADVANCE_FEE',
  URGENCY: 'URGENCY_MANIPULATION',
  SECRECY: 'CONCEALMENT_TACTICS',
  SPAM_EVASION: 'SPAM_EVASION',
};

// ─── Engine ─────────────────────────────────────────────────────────────────

/**
 * Extracts a short context snippet around a phrase match position.
 */
const extractContext = (text: string, index: number, phrase: string): string => {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + phrase.length + 40);
  let snippet = text.substring(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
};

/**
 * Main NLP Analysis Engine.
 * @param textBody   Plain text body of the email (from mailparser `parsed.text`)
 * @param htmlBody   HTML body (from mailparser `parsed.html`) - used as fallback
 * @param subject    Email subject line
 */
export const analyzeNlp = (
  textBody: string,
  htmlBody: string,
  subject: string
): NlpAnalysis => {

  // Normalize & strip HTML tags from htmlBody for content analysis
  const stripHtml = (html: string): string =>
    html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ');

  // Build analysis corpus: combine plain text + HTML text + subject
  const corpus = [
    textBody || '',
    htmlBody ? stripHtml(htmlBody) : '',
    subject || ''
  ].join(' ').toLowerCase();

  const triggers: NlpTrigger[] = [];
  const categoryScores: Record<string, number> = {};
  let rawScore = 0;

  // Scan corpus against every lexicon entry
  for (const [phrase, weight, category] of LEXICON) {
    let searchStart = 0;
    while (true) {
      const idx = corpus.indexOf(phrase, searchStart);
      if (idx === -1) break;

      // Prevent duplicate triggers for same phrase (only count once)
      const alreadyAdded = triggers.some(t => t.phrase === phrase);
      if (!alreadyAdded) {
        triggers.push({
          category,
          phrase,
          context: extractContext(corpus, idx, phrase),
          weight,
        });
        rawScore += weight;
        categoryScores[category] = (categoryScores[category] || 0) + weight;
      }

      searchStart = idx + 1;
    }
  }

  // Normalize rawScore to 0-100 (max theoretical raw ≈ 300+ so cap meaningfully)
  const intentScore = Math.min(100, Math.round((rawScore / 80) * 100));

  // Determine intent level tier
  let intentLevel: NlpAnalysis['intentLevel'] = 'LOW';
  if (intentScore >= 70) intentLevel = 'CRITICAL';
  else if (intentScore >= 45) intentLevel = 'HIGH';
  else if (intentScore >= 20) intentLevel = 'MEDIUM';

  // Resolve dominant BEC category by priority
  let becCategory: string | null = null;
  if (Object.keys(categoryScores).length > 0) {
    const topCategory = Object.keys(categoryScores).sort(
      (a, b) => (CATEGORY_PRIORITY[b] || 0) - (CATEGORY_PRIORITY[a] || 0)
    )[0];
    if (intentScore >= 15) {
      becCategory = BEC_CATEGORY_LABELS[topCategory] || topCategory;
    }
  }

  // Generate executive summary
  let summary = '';
  const triggerCount = triggers.length;

  if (intentLevel === 'CRITICAL') {
    summary = `CRITICAL SOCIAL ENGINEERING: Email contains ${triggerCount} manipulation trigger(s) with a combined intent score of ${intentScore}/100. Dominant attack pattern: ${becCategory || 'Mixed'}. High confidence of deliberate psychological coercion — DO NOT COMPLY with any embedded requests.`;
  } else if (intentLevel === 'HIGH') {
    summary = `HIGH MANIPULATION RISK: Found ${triggerCount} psychological pressure trigger(s) (score: ${intentScore}/100). Pattern consistent with ${becCategory || 'social engineering'} attack. Verify all requests via an independent, trusted channel before acting.`;
  } else if (intentLevel === 'MEDIUM') {
    summary = `SUSPICIOUS LANGUAGE: Detected ${triggerCount} trigger phrase(s) suggesting possible manipulation (score: ${intentScore}/100). Exercise caution — independently verify the sender's identity before responding.`;
  } else {
    summary = `LOW MANIPULATION RISK: No significant social engineering patterns detected in email body (score: ${intentScore}/100). Language appears neutral and informational.`;
  }

  return {
    intentScore,
    intentLevel,
    becCategory,
    triggers,
    summary,
  };
};
