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
