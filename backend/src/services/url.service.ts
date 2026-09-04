// backend/src/services/url.service.ts
import { TARGET_BRANDS } from './domain.service';

const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'adf.ly'
];

const SUSPICIOUS_KEYWORDS = [
  'login', 'verify', 'update', 'secure', 'auth', 'account', 'banking', 'billing', 'confirm'
];

export interface AnalyzedUrl {
  url: string;
  domain: string;
  isIPBased: boolean;
  isShortener: boolean;
  isHttp: boolean;
  isPunycode: boolean;
  isBaitAndSwitch: boolean;
  suspiciousKeywords: string[];
  brandTarget: string | null;
  riskScore: number; // 0 = Safe, >0 = Risky
}

/**
 * Extracts all URLs from a given text (plain text or HTML).
 */
export const extractUrls = (text: string): string[] => {
  if (!text) return [];
  // Basic regex to match http and https URLs
  const urlRegex = /(https?:\/\/[^\s<"']+)/ig;
  const matches = text.match(urlRegex) || [];
  
  // Deduplicate
  return Array.from(new Set(matches));
};

/**
 * Specifically finds anchor tags where the visible text is a URL, 
 * but it points to a different underlying domain.
 */
export const extractBaitAndSwitchUrls = (html: string): string[] => {
  if (!html) return [];
  const results: string[] = [];
  const regex = /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/a>/ig;
  
  let match;
  while ((match = regex.exec(html)) !== null) {
    const hrefUrl = match[1];
    const visibleUrl = match[2];
    try {
      const hrefDomain = new URL(hrefUrl).hostname.toLowerCase().replace(/^www\./, '');
      const visibleDomain = new URL(visibleUrl).hostname.toLowerCase().replace(/^www\./, '');
      if (hrefDomain !== visibleDomain) {
        results.push(hrefUrl);
      }
    } catch (e) {
      // Ignored
    }
  }
  return results;
};

/**
 * Analyzes a URL for common phishing techniques.
 */
export const analyzeUrl = (urlString: string): AnalyzedUrl => {
  let urlObj: URL | null = null;
  const result: AnalyzedUrl = {
    url: urlString,
    domain: '',
    isIPBased: false,
    isShortener: false,
    isHttp: false,
    isPunycode: false,
    isBaitAndSwitch: false,
    suspiciousKeywords: [],
    brandTarget: null,
    riskScore: 0
  };

  try {
    urlObj = new URL(urlString);
  } catch (e) {
    // If it fails to parse, it might be heavily obfuscated, bump risk
    result.riskScore += 1;
    return result;
  }

  const hostname = urlObj.hostname.toLowerCase();
  result.domain = hostname;

  // 1. IP-Based Routing
  // Phishers often use raw IPs instead of domains (e.g., http://192.168.1.1/login)
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipRegex.test(hostname)) {
    result.isIPBased = true;
    result.riskScore += 2;
  }

  // 2. URL Shorteners
  // Phishers use shorteners to hide the true destination
  if (URL_SHORTENERS.includes(hostname)) {
    result.isShortener = true;
    result.riskScore += 1;
  }

  // 3. HTTP Downgrade
  if (urlObj.protocol === 'http:') {
    result.isHttp = true;
    result.riskScore += 1; // Not inherently malicious, but suspicious for logins
  }

  // 3b. Punycode (Homograph Attacks)
  if (hostname.startsWith('xn--') || hostname.includes('.xn--')) {
    result.isPunycode = true;
    result.riskScore += 3;
  }

  // 4. Suspicious Path/Subdomain Keywords
  const fullPath = (urlObj.hostname + urlObj.pathname).toLowerCase();
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (fullPath.includes(keyword)) {
      result.suspiciousKeywords.push(keyword);
    }
  }
  if (result.suspiciousKeywords.length > 0) {
    result.riskScore += 1;
  }

  // 5. Brand Impersonation in Path (e.g., bit.ly/paypal-login)
  for (const brand of TARGET_BRANDS) {
    // If the domain is exactly the brand (e.g. paypal.com), it's safe.
    // If the brand is just somewhere in the URL (e.g., my-fake-site.com/paypal), it's risky.
    const domainNoTld = hostname.split('.')[0];
    if (domainNoTld !== brand && fullPath.includes(brand)) {
      result.brandTarget = brand;
      result.riskScore += 2;
      break;
    }
  }

  return result;
};

export const analyzeUrls = (textSnippet: string, htmlSnippet: string): AnalyzedUrl[] => {
  const combinedText = `${textSnippet} \n ${htmlSnippet}`;
  const extracted = extractUrls(combinedText);
  const baitAndSwitchUrls = extractBaitAndSwitchUrls(htmlSnippet);

  return extracted.map(url => {
    const analysis = analyzeUrl(url);
    if (baitAndSwitchUrls.includes(url)) {
      analysis.isBaitAndSwitch = true;
      analysis.riskScore += 3;
    }
    return analysis;
  });
};
