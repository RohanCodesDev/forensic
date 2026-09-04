import React, { useEffect, useRef } from "react";

interface GeoLocation {
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

interface SmtpHop {
  hopNumber: number;
  fromHost?: string;
  byHost?: string;
  ip: string | null;
  isPrivateIp: boolean;
  timestamp?: string;
  delaySeconds?: number | null;
  geo?: GeoLocation | null;
}

interface GeoRouteMapProps {
  hops: SmtpHop[];
}

export default function GeoRouteMap({ hops }: GeoRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Dynamically import Leaflet to avoid SSR window errors
    import("leaflet").then((L) => {
      // Filter hops with valid coordinates
      const validGeoHops = hops.filter(
        (h) => h.geo && !h.isPrivateIp && h.geo.lat !== 0 && h.geo.lon !== 0
      );

      if (validGeoHops.length === 0) return;

      // Clean up previous map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current!, {
        zoomControl: true,
        attributionControl: false,
      });
      mapInstanceRef.current = map;

      // Add High-Performance Dark-Themed Tiles (100% Free, No Watermark, No API Key Required)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
          attribution: "Esri, HERE, Garmin, © OpenStreetMap contributors",
        }
      ).addTo(map);

      const latLngs: [number, number][] = [];

      validGeoHops.forEach((hop, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === validGeoHops.length - 1;
        const lat = hop.geo!.lat;
        const lon = hop.geo!.lon;
        latLngs.push([lat, lon]);

        // Custom HTML Marker Badge
        const markerColor = isFirst ? "#3b82f6" : isLast ? "#10b981" : "#a855f7";
        const markerBorder = isFirst ? "#60a5fa" : isLast ? "#34d399" : "#c084fc";

        const customIcon = L.divIcon({
          className: "custom-hop-marker",
          html: `
            <div style="
              background-color: ${markerColor};
              border: 2px solid ${markerBorder};
              color: white;
              font-family: monospace;
              font-size: 11px;
              font-weight: bold;
              width: 26px;
              height: 26px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 12px ${markerColor};
            ">
              ${hop.hopNumber}
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);

        // Rich Dark-themed Popup
        const popupContent = `
          <div style="
            background: #09090b;
            color: #e4e4e7;
            font-family: monospace;
            padding: 10px;
            border-radius: 8px;
            font-size: 11px;
            border: 1px solid #27272a;
            min-width: 200px;
          ">
            <div style="font-weight: bold; color: ${markerColor}; border-bottom: 1px solid #27272a; padding-bottom: 4px; margin-bottom: 6px;">
              ${isFirst ? "HOP " + hop.hopNumber + " (ORIGIN ENTRY)" : isLast ? "HOP " + hop.hopNumber + " (DESTINATION)" : "HOP " + hop.hopNumber + " (RELAY)"}
            </div>
            <div><strong>IP:</strong> <span style="color: #60a5fa;">${hop.ip}</span></div>
            <div><strong>Location:</strong> ${hop.geo!.city}, ${hop.geo!.country} (${hop.geo!.countryCode})</div>
            <div><strong>ISP/Org:</strong> ${hop.geo!.isp || hop.geo!.org}</div>
            <div><strong>Coordinates:</strong> [${lat.toFixed(4)}, ${lon.toFixed(4)}]</div>
            ${hop.delaySeconds !== null && hop.delaySeconds !== undefined ? `<div><strong>Latency:</strong> +${hop.delaySeconds}s</div>` : ""}
          </div>
        `;

        marker.bindPopup(popupContent);
      });

      // Draw Polyline connecting hops
      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: "#38bdf8",
          weight: 2.5,
          opacity: 0.85,
          dashArray: "6, 8",
        }).addTo(map);
      }

      // Fit map view to markers
      if (latLngs.length === 1) {
        map.setView(latLngs[0], 6);
      } else if (latLngs.length > 1) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hops]);

  const validGeoCount = hops.filter(
    (h) => h.geo && !h.isPrivateIp && h.geo.lat !== 0 && h.geo.lon !== 0
  ).length;

  if (validGeoCount === 0) {
    return (
      <div className="p-8 text-center bg-black border border-gray-800 rounded-lg text-gray-500 font-mono text-xs">
        No routable public IP hops with geographical coordinates found in this email trace.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Leaflet CSS Link */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div
        ref={mapContainerRef}
        className="w-full h-[250px] sm:h-[300px] md:h-[380px] rounded-lg border border-gray-800 shadow-2xl relative z-10 overflow-hidden"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-gray-400 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]"></span>
            <span>Origin Server</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]"></span>
            <span>Intermediate Relay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
            <span>Destination MX</span>
          </div>
        </div>
        <span className="text-gray-500 italic">
          *IP Geolocation indicates approximate server infrastructure, not physical person.
        </span>
      </div>
    </div>
  );
}
