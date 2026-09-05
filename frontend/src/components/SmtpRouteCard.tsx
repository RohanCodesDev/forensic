import React from "react";
import dynamic from "next/dynamic";
import { RouteAnalysis, BadgeInfo } from "../types/forensic";

const GeoRouteMap = dynamic(() => import("./GeoRouteMap"), { ssr: false });

interface SmtpRouteCardProps {
  routeAnalysis: RouteAnalysis | null;
  rawReceivedHeaders?: string[];
  onOpenBadge: (badge: BadgeInfo) => void;
}

export default function SmtpRouteCard({
  routeAnalysis,
  rawReceivedHeaders,
  onOpenBadge
}: SmtpRouteCardProps) {
  if (!routeAnalysis) return null;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 p-4 md:p-6 rounded-lg space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-gray-800 pb-4 gap-4">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2 text-sm md:text-base font-mono">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            SMTP Relay Hop Chain & Global Route Map
          </h3>
          <p className="text-[10px] md:text-xs text-gray-500 font-mono mt-1">
            Chronological MTA relay hops & geographic infrastructure route
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="bg-blue-950/40 border border-blue-800/60 px-3 py-1.5 rounded-md text-xs font-mono">
            <span className="text-gray-400">Total Hops: </span>
            <span className="text-blue-400 font-bold">{routeAnalysis.totalHops}</span>
          </div>
          {routeAnalysis.totalDeliveryTimeSeconds !== null && (
            <div className="bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-md text-xs font-mono">
              <span className="text-gray-400">Transit Time: </span>
              <span className="text-emerald-400 font-bold">{routeAnalysis.totalDeliveryTimeSeconds}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Originating Public IP Card */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-900/60 p-4 rounded-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-mono font-bold">
              Identified Originating Server (Entry Point)
            </span>
            {routeAnalysis.originatingGeo && (
              <span className="text-[10px] bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded font-mono border border-blue-700">
                {routeAnalysis.originatingGeo.city}, {routeAnalysis.originatingGeo.country} ({routeAnalysis.originatingGeo.countryCode})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-mono font-bold text-white">
              {routeAnalysis.originatingIp || "None detected"}
            </span>
            {routeAnalysis.originatingHost && (
              <span className="text-xs text-gray-400 font-mono">
                ({routeAnalysis.originatingHost})
              </span>
            )}
          </div>
          {routeAnalysis.originatingGeo && (
            <p className="text-xs text-gray-400 font-mono">
              <span className="text-gray-500">ISP / AS: </span>
              <span className="text-gray-300">{routeAnalysis.originatingGeo.isp || routeAnalysis.originatingGeo.org}</span>
              <span className="text-gray-600"> • </span>
              <span className="text-gray-400">{routeAnalysis.originatingGeo.as}</span>
            </p>
          )}
        </div>
        <button 
          onClick={() => onOpenBadge({
            title: "ORIGINATING PUBLIC IP & GEOLOCATION", 
            description: "This is the very first public, internet-routable IP address recorded in the SMTP chain. Regardless of what name is displayed in the 'From:' field, this represents the actual host machine that injected the email into the public internet."
          })}
          className="text-xs bg-blue-900/50 hover:bg-blue-800 text-blue-300 px-3 py-1.5 rounded border border-blue-700 font-mono transition-colors shrink-0"
        >
          Forensic Significance ⓘ
        </button>
      </div>

      {/* Leaflet Map Route */}
      <div className="pt-2">
        <GeoRouteMap hops={routeAnalysis.hops} />
      </div>

      {/* Raw SMTP Relay Headers Inspector */}
      {rawReceivedHeaders && rawReceivedHeaders.length > 0 && (
        <details className="group border border-gray-800 bg-black rounded-lg overflow-hidden">
          <summary className="p-3.5 cursor-pointer flex items-center justify-between text-xs uppercase font-semibold text-gray-400 hover:text-white transition-colors">
            <span>Raw Received Header Infrastructure ({rawReceivedHeaders.length})</span>
            <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50 group-open:rotate-180 transition-transform">
              ▼ VIEW HEADERS
            </span>
          </summary>
          <div className="p-4 border-t border-gray-800 bg-[#050505] space-y-2 font-mono text-xs text-gray-400">
            {rawReceivedHeaders.map((hop, idx) => (
              <div key={idx} className="p-3 bg-black border border-gray-800/80 rounded break-all">
                <span className="text-emerald-500 font-bold mr-2">HOP #{idx + 1}:</span>
                {hop}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Interactive Hop Timeline */}
      <div className="space-y-3 pt-4 border-t border-gray-900 relative before:absolute before:inset-0 before:top-6 before:left-6 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-purple-700 before:to-emerald-500">
        {routeAnalysis.hops.map((hop, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === routeAnalysis.hops.length - 1;

          return (
            <div key={idx} className="relative pl-12">
              {/* Hop Marker Node */}
              <div className={`absolute left-4 -translate-x-1/2 top-4 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border ${
                isFirst 
                  ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_8px_rgba(59,130,246,0.8)]" 
                  : isLast 
                    ? "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    : "bg-purple-900 border-purple-500 text-gray-200"
              }`}>
                {hop.hopNumber}
              </div>

              <div className="bg-[#050505] border border-gray-800 hover:border-gray-700 p-4 rounded-md transition-colors space-y-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-white">
                      {isFirst ? "HOP 1 (ORIGIN ENTRY)" : isLast ? `HOP ${hop.hopNumber} (DESTINATION MX)` : `HOP ${hop.hopNumber} (RELAY)`}
                    </span>
                    {hop.protocol && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                        {hop.protocol}
                      </span>
                    )}
                    {hop.ip && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                        hop.isPrivateIp 
                          ? "bg-zinc-900 text-zinc-500 border-zinc-800" 
                          : "bg-blue-950/60 text-blue-300 border-blue-800"
                      }`}>
                        IP: {hop.ip} {hop.isPrivateIp ? "(LAN/Private)" : "(Public)"}
                      </span>
                    )}
                    {hop.geo && !hop.isPrivateIp && (
                      <span className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                        📍 {hop.geo.city}, {hop.geo.country}
                      </span>
                    )}
                  </div>
                  {hop.delaySeconds !== null && hop.delaySeconds !== undefined && (
                    <span className={`text-xs font-mono ${hop.delaySeconds < 0 ? "text-rose-400 font-bold animate-pulse" : "text-gray-400"}`}>
                      Hop Latency: {hop.delaySeconds >= 0 ? `+${hop.delaySeconds}s` : `${hop.delaySeconds}s (ANOMALY)`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-gray-400">
                  <div><span className="text-gray-500">From: </span><span className="text-gray-200">{hop.fromHost || "Not specified"}</span></div>
                  <div><span className="text-gray-500">By: </span><span className="text-gray-200">{hop.byHost || "Not specified"}</span></div>
                </div>

                {hop.geo && !hop.isPrivateIp && (
                  <div className="text-[11px] font-mono text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-1 bg-zinc-950/80 p-2 rounded border border-zinc-900">
                    <div><span className="text-gray-500">ISP/Org: </span><span className="text-gray-300">{hop.geo.isp || hop.geo.org}</span></div>
                    <div><span className="text-gray-500">ASN / Coords: </span><span className="text-gray-300">{hop.geo.as} [{hop.geo.lat.toFixed(2)}, {hop.geo.lon.toFixed(2)}]</span></div>
                  </div>
                )}

                {hop.timestamp && (
                  <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5 pt-1 border-t border-gray-900">
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{hop.timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
