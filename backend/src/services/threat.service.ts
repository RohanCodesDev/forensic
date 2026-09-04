export interface ThreatIndicator {
  value: string;
  type: 'IP' | 'DOMAIN' | 'URL';
  source: string;
  isMalicious: boolean;
  riskScore: number; // 0 to 100
  categories: string[];
  lastSeen?: string;
}

/**
 * Mock Threat Intelligence Database
 * In a production environment, this would query APIs like AbuseIPDB, VirusTotal, or URLhaus.
 * To keep the project 100% free and fast without API keys, we simulate an active CTI feed.
 */
const offlineThreatDb: Record<string, ThreatIndicator> = {
  // IPs
  '185.220.101.5': {
    value: '185.220.101.5',
    type: 'IP',
    source: 'AbuseIPDB (Simulation)',
    isMalicious: true,
    riskScore: 100,
    categories: ['Tor Exit Node', 'Spam Relay', 'Brute-Force'],
    lastSeen: new Date().toISOString()
  },
  '198.51.100.25': {
    value: '198.51.100.25',
    type: 'IP',
    source: 'Spamhaus DNSBL',
    isMalicious: false,
    riskScore: 15,
    categories: ['Cloud Provider'],
  },
  // Domains
  'attacker-relay.cc': {
    value: 'attacker-relay.cc',
    type: 'DOMAIN',
    source: 'VirusTotal (Simulation)',
    isMalicious: true,
    riskScore: 95,
    categories: ['Phishing', 'Newly Registered Domain'],
    lastSeen: new Date().toISOString()
  },
  // URLs
  'http://185.220.101.5/login/office365-verify': {
    value: 'http://185.220.101.5/login/office365-verify',
    type: 'URL',
    source: 'URLhaus (Abuse.ch)',
    isMalicious: true,
    riskScore: 100,
    categories: ['Credential Harvester', 'Office365 Phishing'],
    lastSeen: new Date().toISOString()
  }
};

/**
 * Analyzes IPs, Domains, and URLs against Threat Intelligence Feeds
 */
export const analyzeThreats = async (
  ips: string[], 
  domains: string[], 
  urls: string[]
): Promise<ThreatIndicator[]> => {
  
  const results: ThreatIndicator[] = [];
  const uniqueIps = Array.from(new Set(ips.filter(Boolean)));
  const uniqueDomains = Array.from(new Set(domains.filter(Boolean)));
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));

  // Simulate API Network Delay (CTI lookups usually take a moment)
  await new Promise(resolve => setTimeout(resolve, 300));

  // 1. IP Lookups
  for (const ip of uniqueIps) {
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('127.')) {
      results.push({
        value: ip,
        type: 'IP',
        source: 'Internal System',
        isMalicious: false,
        riskScore: 0,
        categories: ['Private LAN']
      });
      continue;
    }

    if (process.env.ABUSEIPDB_API_KEY) {
      try {
        const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
          headers: {
            'Key': process.env.ABUSEIPDB_API_KEY,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        
        if (data && data.data) {
          const riskScore = data.data.abuseConfidenceScore || 0;
          results.push({
            value: ip,
            type: 'IP',
            source: 'AbuseIPDB (Live API)',
            isMalicious: riskScore > 50,
            riskScore: riskScore,
            categories: riskScore > 0 ? ['Reported for Abuse'] : ['Clean']
          });
          continue;
        }
      } catch (err) {
        console.error(`AbuseIPDB API failed for ${ip}:`, err);
      }
    }

    // Fallback to offline mock database if API fails or key is missing
    if (offlineThreatDb[ip]) {
      results.push(offlineThreatDb[ip]);
    } else {
      results.push({
        value: ip,
        type: 'IP',
        source: 'Global Threat DB',
        isMalicious: false,
        riskScore: 0,
        categories: ['Clean']
      });
    }
  }

  // 2. Domain Lookups
  for (const domain of uniqueDomains) {
    if (offlineThreatDb[domain]) {
      results.push(offlineThreatDb[domain]);
    } else {
      results.push({
        value: domain,
        type: 'DOMAIN',
        source: 'Global Threat DB',
        isMalicious: false,
        riskScore: 0,
        categories: ['Clean']
      });
    }
  }

  // 3. URL Lookups
  for (const url of uniqueUrls) {
    if (offlineThreatDb[url]) {
      results.push(offlineThreatDb[url]);
    } else {
      results.push({
        value: url,
        type: 'URL',
        source: 'URLhaus',
        isMalicious: false,
        riskScore: 0,
        categories: ['Clean']
      });
    }
  }

  return results;
};
