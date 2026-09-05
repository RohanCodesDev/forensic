import { NlpAnalysis } from './nlp.service';

export interface RiskFactor {
  name: string;
  points: number;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}


export interface RiskEvaluation {
  score: number; // 0 to 100
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  summary: string;
}

/**
 * Transparent Multi-Factor Risk Engine
 * Computes a weighted risk score (0-100) based on observed evidence across:
 * - Authentication (SPF, DKIM, DMARC)
 * - Header anomalies (Reply-To, Return-Path, Message-ID)
 * - Sender & Brand Impersonation (Typosquatting, Keyword stacking, Freemail abuse)
 * - URL risk vectors (IP links, Shorteners, Insecure HTTP, Path keywords)
 * - Routing anomalies (Private origin IP, Clock skews, Suspicious hops)
 * - Threat Intelligence IOC hits (AbuseIPDB reputation)
 * - Potentially dangerous executable attachments
 */
export const calculateRiskScore = (
  emailData: {
    spfResult?: string;
    dkimResult?: string;
    dmarcResult?: string;
    messageId?: string;
    from?: string;
    replyTo?: string | null;
    returnPath?: string | null;
  },
  domainAnalysis: any,
  urlAnalysis: any[],
  routeAnalysis: any,
  threatIntel: any[],
  attachments: any[],
  nlpAnalysis?: NlpAnalysis
): RiskEvaluation => {
  const factors: RiskFactor[] = [];

  // Helper to extract email
  const extractEmail = (fullText?: string | null) => {
    if (!fullText) return '';
    const match = fullText.match(/<([^>]+)>/);
    return match ? match[1].trim().toLowerCase() : fullText.trim().toLowerCase();
  };

  const fromAddr = extractEmail(emailData.from);
  const replyToAddr = extractEmail(emailData.replyTo);
  const returnPathAddr = extractEmail(emailData.returnPath);

  // 1. DMARC Evaluation (Highest weight for domain authentication)
  if (['FAIL', 'REJECT'].includes(emailData.dmarcResult || '')) {
    factors.push({
      name: 'DMARC Alignment Failure',
      points: 25,
      description: `DMARC failed (${emailData.dmarcResult}). The sending server is unauthorized or content failed cryptographic checks for domain '${fromAddr.split('@')[1] || 'sender'}'.`,
      severity: 'CRITICAL',
    });
  }

  // 2. SPF Evaluation
  if (['FAIL', 'HARDFAIL'].includes(emailData.spfResult || '')) {
    factors.push({
      name: 'SPF Verification Failed',
      points: 15,
      description: `Sending server IP is explicitly rejected in sender's SPF DNS policy (${emailData.spfResult}).`,
      severity: 'HIGH',
    });
  } else if (emailData.spfResult === 'SOFTFAIL') {
    factors.push({
      name: 'SPF Softfail Policy',
      points: 8,
      description: `Sending server IP is not listed in SPF record, but domain policy permits inspection (Softfail).`,
      severity: 'MEDIUM',
    });
  }

  // 3. DKIM Evaluation
  if (['FAIL', 'BADSIG', 'PERMERROR'].includes(emailData.dkimResult || '')) {
    factors.push({
      name: 'DKIM Cryptographic Signature Failure',
      points: 15,
      description: `DKIM digital signature is invalid (${emailData.dkimResult}). The email body or headers may have been modified in transit.`,
      severity: 'HIGH',
    });
  }

  // 4. Header Redirection Anomaly (Reply-To / Return-Path)
  if (replyToAddr && replyToAddr !== fromAddr) {
    factors.push({
      name: 'Reply-To Address Redirection',
      points: 15,
      description: `Replies are redirected away from '${fromAddr}' to '${replyToAddr}'. Classic phishing tactic to harvest victim responses.`,
      severity: 'HIGH',
    });
  }

  if (returnPathAddr && returnPathAddr !== fromAddr) {
    factors.push({
      name: 'Return-Path Address Mismatch',
      points: 10,
      description: `Technical bounce envelope '${returnPathAddr}' does not match visible sender '${fromAddr}'.`,
      severity: 'MEDIUM',
    });
  }

  // 5. Missing Standard Message-ID
  if (!emailData.messageId || emailData.messageId.trim() === '') {
    factors.push({
      name: 'Missing Message-ID Header',
      points: 10,
      description: 'The email lacks a standard unique Message-ID header, indicative of custom automated spam/phishing scripts.',
      severity: 'MEDIUM',
    });
  }

  // 6. Brand Impersonation & Typosquatting
  if (domainAnalysis?.brandImpersonation) {
    const { matchType, targetBrand, confidence } = domainAnalysis.brandImpersonation;
    if (matchType === 'TYPOSQUATTING' || matchType === 'KEYWORD_STACKING') {
      factors.push({
        name: `Brand Impersonation (${targetBrand})`,
        points: 25,
        description: `Sender domain employs ${matchType.toLowerCase().replace('_', ' ')} targeting ${targetBrand} (confidence: ${confidence}).`,
        severity: 'CRITICAL',
      });
    } else if (matchType === 'FREEMAIL_SPOOF') {
      factors.push({
        name: `Freemail Impersonation (${targetBrand})`,
        points: 18,
        description: `Display name claims to represent ${targetBrand} while sending from generic freemail provider (${domainAnalysis.domain}).`,
        severity: 'HIGH',
      });
    }
  }

  // 7. High-Risk Embedded URLs
  const riskyUrls = urlAnalysis?.filter((u) => u.riskScore >= 2) || [];
  if (riskyUrls.length > 0) {
    const maxPoints = Math.min(25, riskyUrls.length * 10);
    factors.push({
      name: 'Suspicious Hyperlinks Detected',
      points: maxPoints,
      description: `Found ${riskyUrls.length} high-risk URL(s) containing raw IP destinations, URL shorteners, or deceptive security keywords.`,
      severity: maxPoints >= 20 ? 'CRITICAL' : 'HIGH',
    });
  }

  // 8. Threat Intelligence Indicators (AbuseIPDB hits)
  const maliciousThreats = threatIntel?.filter((t) => t.isMalicious) || [];
  if (maliciousThreats.length > 0) {
    factors.push({
      name: 'Threat Intelligence IOC Hit',
      points: 30,
      description: `Global Threat Intelligence flagged ${maliciousThreats.length} observable(s) associated with active attacks or malicious abuse.`,
      severity: 'CRITICAL',
    });
  }

  // 9. SMTP Route Anomalies (Private IP origins, clock travel skews)
  if (routeAnalysis?.anomalies && routeAnalysis.anomalies.length > 0) {
    factors.push({
      name: 'SMTP Relay Route Inconsistencies',
      points: 10,
      description: `Detected ${routeAnalysis.anomalies.length} routing anomalies (e.g. private unroutable origin IP or relay delay skews).`,
      severity: 'MEDIUM',
    });
  }

  // 10. Dangerous Executable Attachments
  const riskyAtts = attachments?.filter((a) => a.isRisky) || [];
  if (riskyAtts.length > 0) {
    factors.push({
      name: 'Dangerous Executable Attachments',
      points: 25,
      description: `Contains ${riskyAtts.length} potentially dangerous attachment(s) with executable/script extensions (${riskyAtts.map((a: any) => a.filename).join(', ')}).`,
      severity: 'CRITICAL',
    });
  }

  // 11. NLP Social Engineering Intent Score
  if (nlpAnalysis && nlpAnalysis.intentScore > 0) {
    const { intentScore, intentLevel, becCategory, triggers } = nlpAnalysis;
    if (intentLevel === 'CRITICAL') {
      factors.push({
        name: 'CRITICAL Social Engineering Intent',
        points: 30,
        description: `NLP engine detected critical manipulation patterns (intent score: ${intentScore}/100). ${becCategory ? `Dominant attack category: ${becCategory}.` : ''} ${triggers.length} trigger phrase(s) matched.`,
        severity: 'CRITICAL',
      });
    } else if (intentLevel === 'HIGH') {
      factors.push({
        name: 'High-Risk Social Engineering Language',
        points: 20,
        description: `NLP engine detected high-risk psychological coercion patterns (intent score: ${intentScore}/100). ${becCategory ? `Attack pattern: ${becCategory}.` : ''} ${triggers.length} trigger phrase(s) matched.`,
        severity: 'HIGH',
      });
    } else if (intentLevel === 'MEDIUM') {
      factors.push({
        name: 'Suspicious Manipulation Language',
        points: 10,
        description: `NLP engine found moderate social engineering signals (intent score: ${intentScore}/100). ${triggers.length} trigger phrase(s) flagged for review.`,
        severity: 'MEDIUM',
      });
    }
  }

  // Calculate Raw Total and Cap at 100
  const rawScore = factors.reduce((sum, f) => sum + f.points, 0);
  const finalScore = Math.min(100, Math.max(0, rawScore));

  // Determine Severity Level Tier
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (finalScore >= 75) {
    severity = 'CRITICAL';
  } else if (finalScore >= 50) {
    severity = 'HIGH';
  } else if (finalScore >= 25) {
    severity = 'MEDIUM';
  } else {
    severity = 'LOW';
  }

  // Generate Executive Summary
  let summary = '';
  if (severity === 'CRITICAL') {
    summary = `CRITICAL THREAT: High confidence of malicious intent (${finalScore}/100). Major indicators include ${factors.slice(0, 2).map((f) => f.name).join(', ')}. Immediate quarantine recommended.`;
  } else if (severity === 'HIGH') {
    summary = `HIGH RISK: Significant forensic anomalies detected (${finalScore}/100). The email violates core authentication or sender integrity standards.`;
  } else if (severity === 'MEDIUM') {
    summary = `SUSPICIOUS: Minor or moderate risk factors observed (${finalScore}/100). Review the listed header and link anomalies before trusting.`;
  } else {
    summary = `LOW RISK: Email passed core authentication and reputation audits (${finalScore}/100). No severe structural threats detected.`;
  }

  return {
    score: finalScore,
    severity,
    factors,
    summary,
  };
};
