import { analyzeSenderDomain } from './domain.service';
import { analyzeUrls } from './url.service';
import { analyzeSmtpRoute } from './route.service';
import { analyzeThreats } from './threat.service';
import { calculateRiskScore } from './risk.service';

/**
 * Master Orchestrator for all Forensic Analysis Services
 * It takes parsed email data and routes it through all specialized engines (Domain, URL, Route, CTI),
 * compiles the results, and calculates the final Multi-Factor Risk Score and Threat Level.
 */
export const runFullAnalysis = async (emailData: any, parsed: any, attachments: any[]) => {
  const anomalies: string[] = [];

  // Helper to safely extract just the email address part from "Name <email@domain.com>"
  const extractEmail = (fullText: string) => {
    const match = fullText.match(/<([^>]+)>/);
    return match ? match[1].trim().toLowerCase() : fullText.trim().toLowerCase();
  };

  const fromAddress = extractEmail(emailData.from);
  const replyToAddress = emailData.replyTo ? extractEmail(emailData.replyTo) : null;
  const returnPathAddress = emailData.returnPath ? extractEmail(emailData.returnPath) : null;

  // 1. From / Reply-To Mismatch
  if (replyToAddress && replyToAddress !== fromAddress) {
    anomalies.push(`REPLY-TO MISMATCH: Sender claims to be '${fromAddress}', but replies are redirected to '${replyToAddress}'.`);
  }

  // 2. Return-Path / From Mismatch
  if (returnPathAddress && returnPathAddress !== fromAddress) {
    anomalies.push(`RETURN-PATH MISMATCH: Sender claims to be '${fromAddress}', but technical bounces (the true sender) route to '${returnPathAddress}'.`);
  }

  // 3. Missing Message-ID
  if (!emailData.messageId || emailData.messageId.trim() === '') {
    anomalies.push(`MISSING MESSAGE-ID: Legitimate mail servers usually assign a unique Message-ID. The absence suggests a custom/malicious script.`);
  }

  // 4. SPF Authentication Anomalies
  if (['FAIL', 'SOFTFAIL', 'HARDFAIL'].includes(emailData.spfResult)) {
    anomalies.push(`SPF FAILURE (${emailData.spfResult}): The sending server's IP address is NOT authorized in the domain's DNS SPF record.`);
  }

  // 5. DKIM Authentication Anomalies
  if (['FAIL', 'BADSIG', 'PERMERROR'].includes(emailData.dkimResult)) {
    anomalies.push(`DKIM FAILURE (${emailData.dkimResult}): Cryptographic signature validation failed. Email content or headers may have been tampered with.`);
  }

  // 6. DMARC Authentication Anomalies
  if (['FAIL', 'REJECT'].includes(emailData.dmarcResult)) {
    anomalies.push(`DMARC FAILURE (${emailData.dmarcResult}): Domain alignment check failed. The email violates the sender domain's authentication policy.`);
  }

  // 7. Risky Attachments
  const riskyAtts = attachments.filter((a: any) => a.isRisky);
  if (riskyAtts.length > 0) {
    anomalies.push(`HIGH RISK ATTACHMENTS DETECTED: Contains ${riskyAtts.length} potentially executable/malicious attachment file(s): ${riskyAtts.map((a: any) => a.filename).join(', ')}.`);
  }

  // PHASE 5: Domain Analysis & Brand Impersonation
  const extractName = (fullText: string) => {
    const match = fullText.match(/^"?([^"<]+)"?\s*</);
    return match ? match[1].trim() : null;
  };
  const senderName = extractName(emailData.from);
  const domainAnalysis = analyzeSenderDomain(fromAddress, senderName);

  if (domainAnalysis && domainAnalysis.anomalies.length > 0) {
    anomalies.push(...domainAnalysis.anomalies);
  }

  // PHASE 6: URL Extraction & Risk Analysis
  const textSnippet = parsed.text || '';
  const htmlSnippet = parsed.html || (parsed.textAsHtml || '');
  const urlAnalysis = analyzeUrls(textSnippet, htmlSnippet);
  
  const riskyUrls = urlAnalysis.filter(u => u.riskScore >= 2);
  if (riskyUrls.length > 0) {
    anomalies.push(`SUSPICIOUS LINKS DETECTED: Found ${riskyUrls.length} high-risk URL(s) containing IP routing, shorteners, or brand impersonation.`);
  }

  // PHASE 7 & 8: SMTP Route, Hop & Geolocation Analysis
  const routeAnalysis = await analyzeSmtpRoute(emailData.receivedHeaders);
  if (routeAnalysis.anomalies.length > 0) {
    anomalies.push(...routeAnalysis.anomalies);
  }

  // PHASE 9: Threat Intelligence Integration
  const ipsToScan = routeAnalysis.hops.map(h => h.ip).filter(Boolean) as string[];
  const domainsToScan = [domainAnalysis?.domain || ''];
  const urlsToScan = urlAnalysis.map(u => u.url);

  const threatIntel = await analyzeThreats(ipsToScan, domainsToScan, urlsToScan);
  const maliciousThreats = threatIntel.filter(t => t.isMalicious);
  
  if (maliciousThreats.length > 0) {
    anomalies.push(`THREAT INTEL ALERT: Found ${maliciousThreats.length} indicator(s) of compromise (IOCs) across IPs/Domains/URLs.`);
  }

  // PHASE 10: Multi-Factor Rule-Based Risk Engine Evaluation
  const riskEvaluation = calculateRiskScore(
    emailData,
    domainAnalysis,
    urlAnalysis,
    routeAnalysis,
    threatIntel,
    attachments
  );

  // Maintain backward compatibility for threatLevel string
  const threatLevel = riskEvaluation.severity === 'LOW' ? 'CLEAN' : riskEvaluation.severity === 'MEDIUM' ? 'SUSPICIOUS' : 'HIGH_RISK';

  return {
    threatLevel,
    riskEvaluation,
    anomalies,
    attachments,
    domainAnalysis,
    urlAnalysis,
    routeAnalysis,
    threatIntel
  };
};
