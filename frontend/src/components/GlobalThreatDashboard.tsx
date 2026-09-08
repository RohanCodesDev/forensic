import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Next.js requires dynamic import with ssr: false for react-globe.gl because it uses the window object
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface GlobalThreatDashboardProps {
  apiUrl: string;
}

export default function GlobalThreatDashboard({ apiUrl }: GlobalThreatDashboardProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [arcs, setArcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const globeEl = useRef<any>(null);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/geo/threats`);
        const json = await res.json();
        if (res.ok && json.data) {
          setLocations(json.data.locations);
          setArcs(json.data.arcs);
        }
      } catch (err) {
        console.error("Failed to fetch geo threats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeoData();
  }, [apiUrl]);

  useEffect(() => {
    // Auto-rotate the globe slowly after it mounts
    if (!loading) {
      setTimeout(() => {
        if (globeEl.current && typeof globeEl.current.controls === 'function') {
          globeEl.current.controls().autoRotate = true;
          globeEl.current.controls().autoRotateSpeed = 0.5;
        }
        if (globeEl.current && typeof globeEl.current.pointOfView === 'function') {
          globeEl.current.pointOfView({ altitude: 2 }, 4000);
        }
      }, 500); // Give the WebGL canvas half a second to initialize methods on the ref
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[700px] w-full bg-zinc-950 border border-zinc-800/60 rounded-2xl">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-8 h-8 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-zinc-400 font-mono text-xs">INITIALIZING GLOBAL SAT-COM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[700px] bg-[#030304] border border-zinc-800/60 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
      
      {/* HUD Overlays */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Live Threat Intel Globe
        </h2>
        <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-wider">
          Tracking {locations.length} adversarial nodes & {arcs.length} attack vectors
        </p>
      </div>

      <div className="absolute bottom-6 right-6 z-10 bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-sm pointer-events-none">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Threat Severity Map</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span className="text-xs text-zinc-300">CRITICAL / HIGH RISK</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="text-xs text-zinc-300">SUSPICIOUS (Evasions)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-xs text-zinc-300">CLEAN / LEGITIMATE</span>
          </div>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none flex gap-6">
        <div className="bg-black/40 border border-rose-900/50 p-3 rounded-lg backdrop-blur-md">
          <div className="text-rose-400 font-mono text-[10px] tracking-widest uppercase">Targeted IPs</div>
          <div className="text-xl font-bold text-zinc-100 tabular-nums">
            {new Set(locations.filter(l => l.severity === 'HIGH').map(l => l.ip)).size}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-0">
        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="#030304"
          
          // Arcs (Attack Vectors)
          arcsData={arcs}
          arcStartLat={(d: any) => d.startLat}
          arcStartLng={(d: any) => d.startLng}
          arcEndLat={(d: any) => d.endLat}
          arcEndLng={(d: any) => d.endLng}
          arcColor={(d: any) => d.color}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2500}
          arcAltitudeAutoScale={0.3}

          // Points (Malicious / Suspicious Nodes)
          pointsData={locations}
          pointLat={(d: any) => d.lat}
          pointLng={(d: any) => d.lng}
          pointColor={(d: any) => 
            d.severity === 'HIGH' ? 'rgba(244, 63, 94, 0.9)' : 
            d.severity === 'MEDIUM' ? 'rgba(245, 158, 11, 0.9)' : 
            'rgba(16, 185, 129, 0.6)'
          }
          pointAltitude={0.01}
          pointRadius={(d: any) => d.severity === 'HIGH' ? 0.08 : 0.04}
          pointsMerge={true}

          // Rings (Pulse effect on locations)
          ringsData={locations.filter(l => l.severity === 'HIGH')}
          ringLat={(d: any) => d.lat}
          ringLng={(d: any) => d.lng}
          ringColor={() => 'rgba(244, 63, 94, 0.5)'}
          ringMaxRadius={2}
          ringPropagationSpeed={1}
          ringRepeatPeriod={1500}
          
          // HTML Tooltips
          htmlElementsData={locations}
          htmlElement={(d: any) => {
            const el = document.createElement('div');
            el.innerHTML = `
              <div style="background: rgba(0,0,0,0.8); border: 1px solid #333; padding: 6px 10px; border-radius: 6px; font-family: monospace; font-size: 10px; color: #fff; pointer-events: none;">
                <div style="color: ${d.severity === 'HIGH' ? '#f43f5e' : '#10b981'}; font-weight: bold;">${d.ip}</div>
                <div style="color: #888;">${d.city}, ${d.country}</div>
              </div>
            `;
            return el;
          }}
        />
      </div>
    </div>
  );
}
