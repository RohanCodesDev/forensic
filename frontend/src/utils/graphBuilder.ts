import { FullAnalysisResult } from "../types/forensic";

export interface GraphNode {
  id: string;
  group: 'EMAIL' | 'DOMAIN' | 'IP' | 'THREAT' | 'URL';
  label: string;
  val: number; // Size of node
  color: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  color?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const buildThreatGraph = (
  evidence: any,
  analysis: FullAnalysisResult
): GraphData => {
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  const addNode = (node: GraphNode) => {
    if (!nodes.has(node.id)) {
      nodes.set(node.id, node);
    }
  };

  const addLink = (source: string, target: string, label: string, color = 'rgba(255,255,255,0.2)') => {
    links.push({ source, target, label, color });
  };

  // Helper to extract email address from 'Name <email@domain.com>'
  const extractEmail = (str: string) => {
    if (!str) return 'unknown';
    const match = str.match(/<([^>]+)>/);
    return match ? match[1].toLowerCase() : str.toLowerCase();
  };

  // 1. Root Node: The Sender Email
  const senderEmail = extractEmail(evidence.from);
  addNode({
    id: senderEmail,
    group: 'EMAIL',
    label: senderEmail,
    val: 8,
    color: '#3b82f6', // blue-500
  });

  // 2. Sender Domain
  const senderDomainPart = senderEmail.split('@')[1];
  if (senderDomainPart) {
    const isDomainMalicious = analysis.domainAnalysis?.brandImpersonation != null;
    addNode({
      id: senderDomainPart,
      group: 'DOMAIN',
      label: senderDomainPart,
      val: 6,
      color: isDomainMalicious ? '#f43f5e' : '#10b981', // rose-500 / emerald-500
    });
    addLink(senderEmail, senderDomainPart, 'USES_DOMAIN');
  }

  // 3. Routing Origin IP
  if (analysis.routeAnalysis?.originatingIp) {
    const originIp = analysis.routeAnalysis.originatingIp;
    
    // Check if origin IP is in threat intel
    const isIpMalicious = analysis.threatIntel?.some(t => t.value === originIp && t.isMalicious);
    
    addNode({
      id: originIp,
      group: 'IP',
      label: `Origin IP: ${originIp}`,
      val: 6,
      color: isIpMalicious ? '#f43f5e' : '#8b5cf6', // rose-500 / violet-500
    });
    addLink(senderEmail, originIp, 'ORIGINATED_FROM');

    // Link Threat Intel to Origin IP if found
    analysis.threatIntel?.forEach(threat => {
      if (threat.value === originIp) {
        const threatId = `threat-${threat.value}`;
        const desc = threat.categories && threat.categories.length > 0 ? threat.categories[0] : 'Malicious IP';
        addNode({
          id: threatId,
          group: 'THREAT',
          label: `${threat.source}: ${desc}`,
          val: 5,
          color: threat.isMalicious ? '#f43f5e' : '#f59e0b', // rose-500 / amber-500
        });
        addLink(originIp, threatId, 'FLAGGED_BY', threat.isMalicious ? 'rgba(244,63,94,0.5)' : 'rgba(245,158,11,0.5)');
      }
    });
  }

  // 4. Extracted URLs and their Domains
  if (analysis.urlAnalysis && analysis.urlAnalysis.length > 0) {
    // Only map up to 10 URLs to prevent graph clutter
    const urlsToGraph = analysis.urlAnalysis.slice(0, 10);
    
    urlsToGraph.forEach(urlData => {
      let hostname = urlData.url;
      try { hostname = new URL(urlData.url).hostname; } catch(e){}

      const isUrlRisky = urlData.riskScore >= 2;
      const urlColor = isUrlRisky ? '#f43f5e' : '#64748b'; // rose-500 / slate-500

      // Add URL Domain Node
      const domainNodeId = `domain-${hostname}`;
      addNode({
        id: domainNodeId,
        group: 'DOMAIN',
        label: hostname,
        val: 5,
        color: urlColor,
      });
      addLink(senderEmail, domainNodeId, 'CONTAINS_LINK');

      // Link Threat Intel to URL Domain if found
      analysis.threatIntel?.forEach(threat => {
        if (threat.value === hostname || threat.value === urlData.url) {
          const threatId = `threat-${threat.value}`;
          const desc = threat.categories && threat.categories.length > 0 ? threat.categories[0] : 'Malicious Domain';
          addNode({
            id: threatId,
            group: 'THREAT',
            label: `${threat.source}: ${desc}`,
            val: 4,
            color: threat.isMalicious ? '#f43f5e' : '#f59e0b',
          });
          addLink(domainNodeId, threatId, 'FLAGGED_BY', 'rgba(244,63,94,0.5)');
        }
      });
    });
  }

  return {
    nodes: Array.from(nodes.values()),
    links,
  };
};
