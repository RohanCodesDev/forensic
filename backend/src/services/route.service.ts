import { getIpGeolocation, GeoLocation } from './geo.service';

export interface SmtpHop {
  hopNumber: number;
  fromRaw: string;
  fromHost?: string;
  byHost?: string;
  ip: string | null;
  isPrivateIp: boolean;
  protocol?: string;
  id?: string;
  forRecipient?: string;
  timestamp: string | null;
  timestampDate: Date | null;
  delaySeconds: number | null; // Delay from previous chronological hop
  geo?: GeoLocation | null;
}

export interface RouteAnalysisResult {
  hops: SmtpHop[];
  totalHops: number;
  originatingIp: string | null;
  originatingHost: string | null;
  originatingGeo: GeoLocation | null;
  totalDeliveryTimeSeconds: number | null;
  anomalies: string[];
}

/**
 * Checks if an IPv4 address is in private / RFC 1918 / loopback space
 */
export const isPrivateIp = (ip: string): boolean => {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;

  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (Link Local)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 100.64.0.0/10 (Carrier Grade NAT)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

  return false;
};

/**
 * Extract IPv4 address from string
 */
const extractIp = (text: string): string | null => {
  // Matches IPv4 addresses inside brackets or standalone
  const match = text.match(/\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/);
  return match ? match[0] : null;
};

export const analyzeSmtpRoute = async (receivedHeaders: string | string[]): Promise<RouteAnalysisResult> => {
  const anomalies: string[] = [];
  const rawArray = Array.isArray(receivedHeaders) 
    ? receivedHeaders 
    : (receivedHeaders ? [receivedHeaders] : []);

  if (rawArray.length === 0) {
    return {
      hops: [],
      totalHops: 0,
      originatingIp: null,
      originatingHost: null,
      originatingGeo: null,
      totalDeliveryTimeSeconds: null,
      anomalies: ['NO RECEIVED HEADERS: The email contains zero routing trace headers. It may have been fabricated or created offline.']
    };
  }

  // In standard SMTP, headers are prepended.
  // rawArray[0] is the FINAL hop (destination).
  // rawArray[rawArray.length - 1] is the FIRST hop (origin).
  // We reverse them to analyze chronologically from Hop 1 (Origin) to Hop N (Final).
  const chronologicalRaw = [...rawArray].reverse();

  const parsedHops: SmtpHop[] = [];
  let previousDate: Date | null = null;

  for (let index = 0; index < chronologicalRaw.length; index++) {
    const header = chronologicalRaw[index];
    // Normalise whitespace / newlines
    const cleanHeader = header.replace(/\s+/g, ' ').trim();

    // 1. Extract Date / Timestamp (typically follows the semicolon ;)
    const semicolonIndex = cleanHeader.lastIndexOf(';');
    let timestampStr: string | null = null;
    let timestampDate: Date | null = null;
    let headerBody = cleanHeader;

    if (semicolonIndex !== -1) {
      timestampStr = cleanHeader.substring(semicolonIndex + 1).trim();
      headerBody = cleanHeader.substring(0, semicolonIndex).trim();

      const parsedDate = new Date(timestampStr);
      if (!isNaN(parsedDate.getTime())) {
        timestampDate = parsedDate;
      }
    }

    // 2. Extract 'from' host and IP
    const fromMatch = headerBody.match(/from\s+([^\s]+)(?:\s+\(([^)]+)\))?/i);
    let fromHost = fromMatch ? fromMatch[1] : undefined;
    const fromParen = fromMatch && fromMatch[2] ? fromMatch[2] : '';

    // Search for IP in the from clause or parenthesized section
    const ip = extractIp(fromParen) || extractIp(headerBody);
    const isPrivate = ip ? isPrivateIp(ip) : false;

    // 3. Extract 'by' host
    const byMatch = headerBody.match(/by\s+([^\s]+)/i);
    const byHost = byMatch ? byMatch[1] : undefined;

    // 4. Extract protocol 'with'
    const withMatch = headerBody.match(/with\s+([^\s]+)/i);
    const protocol = withMatch ? withMatch[1] : undefined;

    // 5. Extract message id / queue id
    const idMatch = headerBody.match(/id\s+([^\s;]+)/i);
    const id = idMatch ? idMatch[1] : undefined;

    // 6. Extract 'for' recipient
    const forMatch = headerBody.match(/for\s+<([^>]+)>/i);
    const forRecipient = forMatch ? forMatch[1] : undefined;

    // 7. Compute Hop Delay (time between previous hop and this hop)
    let delaySeconds: number | null = null;
    if (timestampDate && previousDate) {
      const diffMs = timestampDate.getTime() - previousDate.getTime();
      delaySeconds = Math.round(diffMs / 1000);

      // Flag timestamp anomalies (Negative delay indicates clock manipulation or forged header)
      if (delaySeconds < -120) { // allow 2 minutes of minor clock drift
        anomalies.push(`TIMESTAMP REVERSAL at Hop ${index + 1}: Timestamp is ${Math.abs(delaySeconds)} seconds EARLIER than the preceding hop. This indicates forged headers or severe relay clock skew.`);
      } else if (delaySeconds > 86400) { // more than 24 hours
        anomalies.push(`EXCESSIVE ROUTE DELAY at Hop ${index + 1}: Message was delayed by ${Math.round(delaySeconds / 3600)} hours at server '${byHost || 'unknown'}'.`);
      }
    }

    if (timestampDate) {
      previousDate = timestampDate;
    }

    // Geolocation Resolution for this hop
    const geo = ip ? await getIpGeolocation(ip, isPrivate) : null;

    parsedHops.push({
      hopNumber: index + 1,
      fromRaw: cleanHeader,
      fromHost,
      byHost,
      ip,
      isPrivateIp: isPrivate,
      protocol,
      id,
      forRecipient,
      timestamp: timestampStr,
      timestampDate,
      delaySeconds,
      geo
    });
  }

  // Find the Originating IP (the first public IP in the chronological chain)
  let originatingIp: string | null = null;
  let originatingHost: string | null = null;
  let originatingGeo: GeoLocation | null = null;

  for (const hop of parsedHops) {
    if (hop.ip && !hop.isPrivateIp) {
      originatingIp = hop.ip;
      originatingHost = hop.fromHost || hop.byHost || 'Unknown Host';
      originatingGeo = hop.geo || null;
      break;
    }
  }

  // Fallback to first hop IP if all are private
  if (!originatingIp && parsedHops.length > 0 && parsedHops[0].ip) {
    originatingIp = parsedHops[0].ip;
    originatingHost = parsedHops[0].fromHost || 'Local Network';
    originatingGeo = parsedHops[0].geo || null;
  }

  // Compute Total Delivery Time
  let totalDeliveryTimeSeconds: number | null = null;
  const firstHopWithDate = parsedHops.find(h => h.timestampDate !== null);
  const lastHopWithDate = [...parsedHops].reverse().find(h => h.timestampDate !== null);

  if (firstHopWithDate && lastHopWithDate && firstHopWithDate !== lastHopWithDate) {
    if (firstHopWithDate.timestampDate && lastHopWithDate.timestampDate) {
      const diff = Math.round((lastHopWithDate.timestampDate.getTime() - firstHopWithDate.timestampDate.getTime()) / 1000);
      if (diff >= 0) {
        totalDeliveryTimeSeconds = diff;
      }
    }
  }

  // Check for suspicious hop count
  if (parsedHops.length > 10) {
    anomalies.push(`SUSPICIOUS RELAY CHAIN: Unusually high number of hops (${parsedHops.length}). Could indicate an open relay relay-loop or obfuscation attempt.`);
  }

  return {
    hops: parsedHops,
    totalHops: parsedHops.length,
    originatingIp,
    originatingHost,
    originatingGeo,
    totalDeliveryTimeSeconds,
    anomalies
  };
};
