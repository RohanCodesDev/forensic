export interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  isPrivate: boolean;
  accuracyNote?: string;
}

export interface SmtpHop {
  hopNumber: number;
  fromHost?: string;
  byHost?: string;
  ip: string | null;
  isPrivateIp: boolean;
  protocol?: string;
  timestamp?: string;
  delaySeconds?: number | null;
  geo?: GeoLocation | null;
}

export interface RouteAnalysis {
  hops: SmtpHop[];
  originatingIp: string | null;
  originatingHost: string | null;
  originatingGeo: GeoLocation | null;
  totalHops: number;
  totalDeliveryTimeSeconds: number | null;
  anomalies: string[];
}

export interface BrandImpersonationResult {
  matchedBrand: string;
  matchType: 'EXACT' | 'TYPOSQUAT' | 'KEYWORD' | null;
  distance?: number;
}

export interface DomainAnalysis {
  domain: string;
  isFreemail: boolean;
  brandImpersonation: BrandImpersonationResult | null;
  anomalies: string[];
}

export interface UrlAnalysisResult {
  url: string;
  isHttp: boolean;
  isShortener: boolean;
  isIPBased: boolean;
  isPunycode: boolean;
  isBaitAndSwitch: boolean;
  brandTarget: string | null;
  suspiciousKeywords: string[];
  riskScore: number;
}

export interface ThreatIndicator {
  value: string;
  type: 'IP' | 'DOMAIN' | 'URL';
  source: string;
  isMalicious: boolean;
  riskScore: number;
  categories: string[];
  lastSeen?: string;
}

export interface AttachmentPayload {
  filename: string;
  contentType?: string;
  size: number;
  isRisky: boolean;
  sha256?: string | null;
  // Phase 14: Malware scan results (populated by attachment.service.ts)
  isKnownMalware?: boolean;
  knownMalwareName?: string;
  vtDetections?: number;
  vtTotalEngines?: number;
  vtLink?: string;
  mimeTypeMismatch?: boolean;
  mimeTypeWarning?: string;
  highRiskMime?: boolean;
  threatScore?: number;
  verdict?: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  verdictReasons?: string[];
}

export interface NlpTrigger {
  category: string;
  phrase: string;
  context: string;
  weight: number;
}

export interface NlpAnalysis {
  intentScore: number;
  intentLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  becCategory: string | null;
  triggers: NlpTrigger[];
  summary: string;
}

export interface AiManipulationTechnique {
  technique: string;
  quote: string;
  explanation: string;
}

export interface AiAnalysis {
  aiConfidence: number; // 0-100
  aiSummary: string;
  manipulationTechniques: AiManipulationTechnique[];
  recommendedAction: string;
}

export interface RiskFactor {
  name: string;
  points: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface RiskEvaluation {
  score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  factors: RiskFactor[];
}

export interface FullAnalysisResult {
  threatLevel: string;
  riskEvaluation: RiskEvaluation;
  anomalies: string[];
  attachments: AttachmentPayload[];
  domainAnalysis: DomainAnalysis | null;
  urlAnalysis: UrlAnalysisResult[];
  routeAnalysis: RouteAnalysis | null;
  threatIntel: ThreatIndicator[];
  nlpAnalysis?: NlpAnalysis | null;
  aiAnalysis?: AiAnalysis | null;
}

export interface EmailEvidence {
  id: string;
  filename: string;
  sha256Hash?: string | null;
  from: string;
  to: string;
  cc?: string | null;
  subject: string;
  date?: string | null;
  messageId?: string | null;
  replyTo?: string | null;
  returnPath?: string | null;
  textBodySnippet?: string | null;
  htmlBodyExists?: boolean;
  attachmentCount?: number;
  receivedHeaders?: string[];
  spfResult?: string;
  dkimResult?: string;
  dmarcResult?: string;
  createdAt: string;
  analysis?: FullAnalysisResult;
}

export interface InvestigationSummary {
  id: string;
  filename: string;
  sha256Hash?: string | null;
  from: string;
  to: string;
  subject: string;
  date?: string | null;
  createdAt: string;
  spfResult?: string;
  dkimResult?: string;
  dmarcResult?: string;
  attachmentCount: number;
  analysisReport?: {
    threatLevel: string;
    riskScore: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    summary: string;
  } | null;
}

export interface BadgeInfo {
  title: string;
  description: string;
}

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
  confidenceScore: number;
  avgRiskScore: number;
  totalEmails: number;
  targetCount: number;
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

