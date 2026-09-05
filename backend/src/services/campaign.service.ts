import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CampaignEmailSummary {
  id: string;
  filename: string;
  subject: string;
  from: string;
  to: string;
  date: string | null;
  createdAt: string;
  riskScore: number;
  threatLevel: string;
  severity: string;
  sha256Hash?: string | null;
}

export interface SharedIOC {
  type: 'IP' | 'DOMAIN' | 'URL' | 'SUBJECT_TEMPLATE' | 'THREAT_IOC';
  value: string;
  count: number;
  riskWeight: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface CampaignCluster {
  campaignId: string;
  name: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number; // 0 - 100
  avgRiskScore: number;
  totalEmails: number;
  targetCount: number; // distinct recipients
  firstSeen: string;
  lastSeen: string;
  sharedIocs: SharedIOC[];
  emails: CampaignEmailSummary[];
  investigativeSummary: string;
  recommendedAction: string;
}

export interface CampaignCorrelationResult {
  totalEmailsAnalyzed: number;
  totalCampaignsDetected: number;
  isolatedEmailsCount: number;
  campaigns: CampaignCluster[];
  topSharedInfrastructure: {
    ips: { value: string; count: number }[];
    domains: { value: string; count: number }[];
    urls: { value: string; count: number }[];
  };
}

const COMMON_FREEMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'mail.com',
  'gmx.com'
]);

// Helper to extract hostname from URL safely
function extractHost(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `http://${urlStr}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

// Normalize email subject template (remove invoice numbers, dates, ticket IDs)
function normalizeSubjectTemplate(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/[0-9]{4,}/g, '{ID}')
    .replace(/#\s*[0-9A-Za-z_-]+/g, '{REF}')
    .replace(/\b(re|fwd|fw):\s*/gi, '')
    .trim();
}

// Disjoint Set (Union-Find) for graph clustering
class DisjointSet {
  parent: Map<string, string> = new Map();

  find(item: string): string {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
    }
    if (this.parent.get(item) !== item) {
      this.parent.set(item, this.find(this.parent.get(item)!));
    }
    return this.parent.get(item)!;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }
}

export async function analyzeCampaignCorrelations(): Promise<CampaignCorrelationResult> {
  const emails = await prisma.email.findMany({
    include: {
      analysisReport: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!emails || emails.length === 0) {
    return {
      totalEmailsAnalyzed: 0,
      totalCampaignsDetected: 0,
      isolatedEmailsCount: 0,
      campaigns: [],
      topSharedInfrastructure: { ips: [], domains: [], urls: [] }
    };
  }

  // Step 1: Extract IOC Features per Email
  interface EmailFeatures {
    email: typeof emails[0];
    originatingIp: string | null;
    transitIps: Set<string>;
    senderDomain: string | null;
    replyToDomain: string | null;
    urlHosts: Set<string>;
    threatIocs: Set<string>;
    subjectTemplate: string;
    becCategory: string | null;
  }

  const emailFeaturesMap = new Map<string, EmailFeatures>();
  const iocToEmailIds = new Map<string, Set<string>>();

  const registerIoc = (iocKey: string, emailId: string) => {
    if (!iocToEmailIds.has(iocKey)) {
      iocToEmailIds.set(iocKey, new Set());
    }
    iocToEmailIds.get(iocKey)!.add(emailId);
  };

  for (const item of emails) {
    const report = item.analysisReport;
    const transitIps = new Set<string>();
    const urlHosts = new Set<string>();
    const threatIocs = new Set<string>();

    let originatingIp: string | null = null;
    let senderDomain: string | null = null;
    let replyToDomain: string | null = null;

    // Extract sender domain
    const fromMatch = item.from.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (fromMatch) senderDomain = fromMatch[1].toLowerCase();

    // Extract Reply-To domain
    if (item.replyTo) {
      const replyMatch = item.replyTo.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (replyMatch) replyToDomain = replyMatch[1].toLowerCase();
    }

    // Extract Route & IP info
    if (report?.routeAnalysis) {
      const route: any = report.routeAnalysis;
      if (route.originatingIp && route.originatingIp !== '127.0.0.1' && !route.originatingIp.startsWith('192.168.') && !route.originatingIp.startsWith('10.')) {
        originatingIp = route.originatingIp;
      }
      if (Array.isArray(route.hops)) {
        for (const hop of route.hops) {
          if (hop.ip && !hop.isPrivateIp) {
            transitIps.add(hop.ip);
          }
        }
      }
    }

    // Extract URLs
    if (report?.urlAnalysis && Array.isArray(report.urlAnalysis)) {
      for (const u of report.urlAnalysis as any[]) {
        const host = extractHost(u.url);
        if (host) urlHosts.add(host);
      }
    }

    // Extract Threat Intel IOCs
    if (report?.threatIntel && Array.isArray(report.threatIntel)) {
      for (const t of report.threatIntel as any[]) {
        if (t.value) threatIocs.add(t.value.toLowerCase());
      }
    }

    const subjectTemplate = normalizeSubjectTemplate(item.subject || '');
    let becCategory: string | null = null;
    if (report?.nlpAnalysis && (report.nlpAnalysis as any).becCategory) {
      becCategory = (report.nlpAnalysis as any).becCategory;
    }

    emailFeaturesMap.set(item.id, {
      email: item,
      originatingIp,
      transitIps,
      senderDomain,
      replyToDomain,
      urlHosts,
      threatIocs,
      subjectTemplate,
      becCategory,
    });

    // Register IOCs for Bipartite linkage
    if (originatingIp) registerIoc(`IP:${originatingIp}`, item.id);
    for (const tip of transitIps) registerIoc(`TRANSIT_IP:${tip}`, item.id);
    
    // Only index non-common domains to avoid clustering unrelated emails just because both are from gmail.com
    if (senderDomain && !COMMON_FREEMAIL_DOMAINS.has(senderDomain)) {
      registerIoc(`DOMAIN:${senderDomain}`, item.id);
    }
    if (replyToDomain && !COMMON_FREEMAIL_DOMAINS.has(replyToDomain)) {
      registerIoc(`REPLY_DOMAIN:${replyToDomain}`, item.id);
    }
    for (const host of urlHosts) {
      registerIoc(`URL_HOST:${host}`, item.id);
    }
    for (const ti of threatIocs) {
      registerIoc(`THREAT_IOC:${ti}`, item.id);
    }
    if (subjectTemplate.length > 8) {
      registerIoc(`SUBJ:${subjectTemplate}`, item.id);
    }
  }

  // Step 2: Cluster emails sharing significant IOCs using DisjointSet
  const uf = new DisjointSet();
  for (const item of emails) {
    uf.find(item.id);
  }

  for (const [iocKey, emailIdSet] of iocToEmailIds.entries()) {
    if (emailIdSet.size > 1) {
      const emailIds = Array.from(emailIdSet);
      for (let i = 1; i < emailIds.length; i++) {
        uf.union(emailIds[0], emailIds[i]);
      }
    }
  }

  // Step 3: Group clusters
  const clusterGroups = new Map<string, string[]>();
  for (const item of emails) {
    const root = uf.find(item.id);
    if (!clusterGroups.has(root)) {
      clusterGroups.set(root, []);
    }
    clusterGroups.get(root)!.push(item.id);
  }

  const campaigns: CampaignCluster[] = [];
  let isolatedCount = 0;

  // Infrastructure frequency trackers
  const ipCounts = new Map<string, number>();
  const domainCounts = new Map<string, number>();
  const urlCounts = new Map<string, number>();

  let campaignIndex = 1;

  for (const [, emailIds] of clusterGroups.entries()) {
    if (emailIds.length === 1) {
      isolatedCount++;
      continue;
    }

    const clusterEmails = emailIds.map(id => emailFeaturesMap.get(id)!).filter(Boolean);
    const sharedIocsMap = new Map<string, { type: SharedIOC['type']; value: string; count: number }>();

    const recipients = new Set<string>();
    let totalRisk = 0;
    let maxSeverityWeight = 0;
    const severityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    let highestSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

    const timestamps: Date[] = [];

    // Find all overlapping IOCs inside this cluster
    for (const feat of clusterEmails) {
      const email = feat.email;
      recipients.add(email.to.toLowerCase());

      const score = email.analysisReport?.riskScore || 0;
      totalRisk += score;

      const sev = (email.analysisReport?.severity || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if ((severityOrder[sev] || 1) > maxSeverityWeight) {
        maxSeverityWeight = severityOrder[sev] || 1;
        highestSeverity = sev;
      }

      if (email.createdAt) timestamps.push(new Date(email.createdAt));
      if (email.date) {
        const d = new Date(email.date);
        if (!isNaN(d.getTime())) timestamps.push(d);
      }
    }

    // Identify which specific IOCs are shared across >= 2 emails in this cluster
    for (const [iocKey, emailIdSet] of iocToEmailIds.entries()) {
      const inCluster = Array.from(emailIdSet).filter(id => emailIds.includes(id));
      if (inCluster.length >= 2) {
        const [typePrefix, ...valParts] = iocKey.split(':');
        const val = valParts.join(':');

        let type: SharedIOC['type'] = 'DOMAIN';
        if (typePrefix.includes('IP')) {
          type = 'IP';
          ipCounts.set(val, (ipCounts.get(val) || 0) + inCluster.length);
        } else if (typePrefix.includes('DOMAIN')) {
          type = 'DOMAIN';
          domainCounts.set(val, (domainCounts.get(val) || 0) + inCluster.length);
        } else if (typePrefix.includes('URL')) {
          type = 'URL';
          urlCounts.set(val, (urlCounts.get(val) || 0) + inCluster.length);
        } else if (typePrefix.includes('SUBJ')) {
          type = 'SUBJECT_TEMPLATE';
        } else if (typePrefix.includes('THREAT')) {
          type = 'THREAT_IOC';
        }

        sharedIocsMap.set(val, {
          type,
          value: val,
          count: inCluster.length,
        });
      }
    }

    const sharedIocs: SharedIOC[] = Array.from(sharedIocsMap.values()).map(ioc => {
      let riskWeight: SharedIOC['riskWeight'] = 'MEDIUM';
      let description = `Shared infrastructure observed across ${ioc.count} analyzed emails`;

      if (ioc.type === 'THREAT_IOC' || ioc.type === 'URL') {
        riskWeight = 'CRITICAL';
        description = `Identical phishing/threat asset (${ioc.value}) referenced across ${ioc.count} emails`;
      } else if (ioc.type === 'IP') {
        riskWeight = 'HIGH';
        description = `Common originating or transit SMTP relay (${ioc.value}) delivering payloads to multiple inboxes`;
      } else if (ioc.type === 'DOMAIN') {
        riskWeight = 'HIGH';
        description = `Identical sender/lookalike infrastructure (${ioc.value}) used across multiple targets`;
      } else if (ioc.type === 'SUBJECT_TEMPLATE') {
        riskWeight = 'MEDIUM';
        description = `Templated social engineering subject pattern matching "${ioc.value}"`;
      }

      return {
        type: ioc.type,
        value: ioc.value,
        count: ioc.count,
        riskWeight,
        description,
      };
    });

    // Compute Correlation Confidence Score
    let confidence = 50; // Base score for having 2+ emails linked
    const hasSharedThreatIoc = sharedIocs.some(i => i.type === 'THREAT_IOC');
    const hasSharedUrl = sharedIocs.some(i => i.type === 'URL');
    const hasSharedIp = sharedIocs.some(i => i.type === 'IP');
    const hasSharedDomain = sharedIocs.some(i => i.type === 'DOMAIN');
    const hasSharedSubj = sharedIocs.some(i => i.type === 'SUBJECT_TEMPLATE');

    if (hasSharedThreatIoc) confidence += 25;
    if (hasSharedUrl) confidence += 20;
    if (hasSharedIp) confidence += 15;
    if (hasSharedDomain) confidence += 15;
    if (hasSharedSubj) confidence += 10;

    // Temporal check: if span is < 72 hours, increase confidence
    timestamps.sort((a, b) => a.getTime() - b.getTime());
    const firstSeenDate = timestamps.length > 0 ? timestamps[0] : new Date();
    const lastSeenDate = timestamps.length > 0 ? timestamps[timestamps.length - 1] : new Date();
    const spanHours = (lastSeenDate.getTime() - firstSeenDate.getTime()) / (1000 * 60 * 60);

    if (spanHours > 0 && spanHours <= 72) {
      confidence += 10;
    }

    confidence = Math.min(98, confidence);

    // Auto-generate Campaign Name
    const leadIoc = sharedIocs[0]?.value || 'Multi-Vector';
    const primaryType = sharedIocs[0]?.type || 'CLUSTER';
    const campaignName = `Operation [${primaryType}:${leadIoc.substring(0, 20)}]`;

    const avgRisk = Math.round(totalRisk / clusterEmails.length);

    const emailSummaries: CampaignEmailSummary[] = clusterEmails.map(feat => {
      const e = feat.email;
      return {
        id: e.id,
        filename: e.filename,
        subject: e.subject,
        from: e.from,
        to: e.to,
        date: e.date,
        createdAt: e.createdAt.toISOString(),
        riskScore: e.analysisReport?.riskScore || 0,
        threatLevel: e.analysisReport?.threatLevel || 'UNKNOWN',
        severity: e.analysisReport?.severity || 'LOW',
        sha256Hash: e.sha256Hash,
      };
    });

    const narrative = `Correlated attack campaign consisting of ${clusterEmails.length} suspicious emails targeting ${recipients.size} unique mailbox(es). Overlapping indicators include ${sharedIocs.map(i => `${i.type} (${i.value})`).slice(0, 3).join(', ')}.`;

    const recommendedAction = highestSeverity === 'CRITICAL' || highestSeverity === 'HIGH'
      ? `Immediately block shared IPs and domain IOCs (${sharedIocs.slice(0, 2).map(i => i.value).join(', ')}) at perimeter mail gateways and trigger incident containment for targeted recipients.`
      : `Monitor perimeter relays for additional emails matching identified subject templates and domain IOCs.`;

    campaigns.push({
      campaignId: `CMP-${String(campaignIndex++).padStart(3, '0')}`,
      name: campaignName,
      threatLevel: highestSeverity,
      confidenceScore: confidence,
      avgRiskScore: avgRisk,
      totalEmails: clusterEmails.length,
      targetCount: recipients.size,
      firstSeen: firstSeenDate.toISOString(),
      lastSeen: lastSeenDate.toISOString(),
      sharedIocs,
      emails: emailSummaries,
      investigativeSummary: narrative,
      recommendedAction,
    });
  }

  // Sort campaigns by avgRiskScore and confidenceScore descending
  campaigns.sort((a, b) => (b.avgRiskScore + b.confidenceScore) - (a.avgRiskScore + a.confidenceScore));

  const topIps = Array.from(ipCounts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topDomains = Array.from(domainCounts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topUrls = Array.from(urlCounts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalEmailsAnalyzed: emails.length,
    totalCampaignsDetected: campaigns.length,
    isolatedEmailsCount: isolatedCount,
    campaigns,
    topSharedInfrastructure: {
      ips: topIps,
      domains: topDomains,
      urls: topUrls,
    },
  };
}
