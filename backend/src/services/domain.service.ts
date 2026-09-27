// backend/src/services/domain.service.ts
import whoiser from 'whoiser';

export const TARGET_BRANDS = [
  'paypal', 'apple', 'microsoft', 'google', 'amazon', 
  'netflix', 'chase', 'bankofamerica', 'wellsfargo', 'meta', 'facebook'
];

const FREEMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'
];

/**
 * Calculates the Levenshtein distance between two strings.
 * Used for fuzzy matching to detect typosquatting (e.g., paypa1 vs paypal).
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return track[str2.length][str1.length];
};

export interface DomainAnalysisResult {
  domain: string;
  isFreemail: boolean;
  brandImpersonation: {
    matchedBrand: string | null;
    matchType: 'EXACT' | 'TYPOSQUAT' | 'KEYWORD_STACKING' | null;
    distance: number;
  };
  anomalies: string[];
}

export const analyzeSenderDomain = async (emailAddress: string | null, displayName: string | null): Promise<DomainAnalysisResult | null> => {
  if (!emailAddress) return null;

  const parts = emailAddress.split('@');
  if (parts.length !== 2) return null;

  const domain = parts[1].toLowerCase().trim();
  const domainNoTld = domain.split('.')[0]; // e.g., paypa1.com -> paypa1
  
  const result: DomainAnalysisResult = {
    domain,
    isFreemail: FREEMAIL_PROVIDERS.includes(domain),
    brandImpersonation: {
      matchedBrand: null,
      matchType: null,
      distance: -1
    },
    anomalies: []
  };

  // 1. Detect Freemail Impersonation
  // If sender is using a freemail address but the display name claims to be a brand
  if (result.isFreemail && displayName) {
    const lowerDisplayName = displayName.toLowerCase();
    for (const brand of TARGET_BRANDS) {
      if (lowerDisplayName.includes(brand)) {
        result.anomalies.push(`FREEMAIL IMPERSONATION: Display name claims to be '${brand}', but email originates from a public free-mail provider (${domain}).`);
        result.brandImpersonation.matchedBrand = brand;
        result.brandImpersonation.matchType = 'EXACT';
        break; // Only trigger once
      }
    }
  }

  // 2. Detect Typosquatting & Lookalike Domains (Only if it's NOT a freemail provider)
  if (!result.isFreemail) {
    for (const brand of TARGET_BRANDS) {
      // Exact domain match (e.g., paypal.com)
      if (domainNoTld === brand) {
         // This is technically clean (it's the real brand), unless authentication failed (handled in Phase 4).
         continue; 
      }

      // Keyword Stacking (e.g., apple-security-login.com)
      if (domainNoTld.includes(brand)) {
        result.anomalies.push(`LOOKALIKE DOMAIN: Sender domain '${domain}' contains brand name '${brand}' combined with other keywords. Possible cousin domain attack.`);
        result.brandImpersonation.matchedBrand = brand;
        result.brandImpersonation.matchType = 'KEYWORD_STACKING';
        break;
      }

      // Typosquatting (e.g., paypa1.com)
      // Check Levenshtein distance. If distance is 1 or 2, it's highly suspicious.
      // But only if the domain length is similar to avoid false positives (e.g., 'a' vs 'apple')
      if (Math.abs(domainNoTld.length - brand.length) <= 2) {
        const distance = levenshteinDistance(domainNoTld, brand);
        // If it's a 1 or 2 character typo, flag it
        if (distance > 0 && distance <= 2) {
          result.anomalies.push(`TYPOSQUATTING: Sender domain '${domain}' is visually similar to target brand '${brand}' (Distance: ${distance}).`);
          result.brandImpersonation.matchedBrand = brand;
          result.brandImpersonation.matchType = 'TYPOSQUAT';
          result.brandImpersonation.distance = distance;
          break;
        }
      }
    }

    // 3. WHOIS Domain Age Check (If not freemail)
    try {
      const whois = await (whoiser as any)(domain, { follow: 1 });
      const firstServer: any = Object.values(whois)[0];
      if (firstServer && firstServer['Created Date']) {
        const createdDate = new Date(firstServer['Created Date'].toString());
        const ageDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (ageDays < 14) {
          result.anomalies.push(`NEWLY REGISTERED DOMAIN: Sender domain '${domain}' was registered only ${Math.floor(ageDays)} days ago. High risk of phishing/throwaway infrastructure.`);
        }
      }
    } catch (err) {
      console.log(`[domain.service] WHOIS lookup failed or timed out for ${domain}`);
    }
  }

  return result;
};
