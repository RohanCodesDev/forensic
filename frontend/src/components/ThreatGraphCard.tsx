import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FullAnalysisResult, EmailEvidence } from "../types/forensic";
import { buildThreatGraph, GraphData } from "../utils/graphBuilder";

// Dynamically import ForceGraph2D to prevent SSR canvas issues in Next.js
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-zinc-950 flex items-center justify-center border border-gray-800 rounded-lg">
      <div className="text-gray-500 font-mono text-xs flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-t-indigo-500 border-gray-800 rounded-full animate-spin"></div>
        INITIALIZING KINETIC THREAT GRAPH...
      </div>
    </div>
  )
});

interface ThreatGraphCardProps {
  evidence: EmailEvidence;
}

export default function ThreatGraphCard({ evidence }: ThreatGraphCardProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    if (evidence && evidence.analysis) {
      const data = buildThreatGraph(evidence, evidence.analysis);
      setGraphData(data);
    }
  }, [evidence]);

  // Handle responsive resizing
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 400 // Fixed height
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  if (!graphData || graphData.nodes.length === 0) {
    return null;
  }

  const maliciousNodesCount = graphData.nodes.filter(n => n.color === '#f43f5e').length;

  return (
    <div className="bg-[#050505] border border-gray-800 rounded-xl p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h3 className="font-mono text-sm tracking-widest text-gray-300 font-bold uppercase flex items-center gap-2">
            <svg className="text-indigo-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            Infrastructure Relationship Graph
          </h3>
          <p className="text-xs text-gray-500 font-mono mt-1">Force-directed mapping of email observables</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
            <span className="text-[10px] font-mono text-gray-400 uppercase">Malicious ({maliciousNodesCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-[10px] font-mono text-gray-400 uppercase">Email</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-mono text-gray-400 uppercase">Domain</span>
          </div>
        </div>
      </div>

      {/* Graph Canvas Container */}
      <div 
        ref={containerRef} 
        className="w-full bg-black border border-gray-800 rounded-lg overflow-hidden relative"
      >
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <span className="text-[9px] font-mono text-gray-600 uppercase bg-black/50 px-2 py-1 rounded border border-gray-800">
            Scroll to zoom • Drag to pan
          </span>
        </div>
        
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#000000"
          nodeLabel="label"
          nodeColor="color"
          nodeRelSize={6}
          linkColor={(link: any) => link.color || 'rgba(255,255,255,0.15)'}
          linkWidth={1.5}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={2}
          d3VelocityDecay={0.3} // Slightly more fluid
          // Custom node painting for labels
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px monospace`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(
              node.x - bckgDimensions[0] / 2, 
              node.y + node.val + 2, 
              bckgDimensions[0], 
              bckgDimensions[1]
            );

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.color;
            ctx.fillText(label, node.x, node.y + node.val + 2 + fontSize/2);
            
            // Draw Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Glow effect for malicious nodes
            if (node.color === '#f43f5e') {
               ctx.shadowColor = '#f43f5e';
               ctx.shadowBlur = 15;
               ctx.fill();
               ctx.shadowBlur = 0; // reset
            }
          }}
        />
      </div>
    </div>
  );
}
