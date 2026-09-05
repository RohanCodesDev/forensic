import React from "react";

interface AnomaliesAlertProps {
  anomalies: string[];
}

export default function AnomaliesAlert({ anomalies }: AnomaliesAlertProps) {
  if (!anomalies || anomalies.length === 0) return null;

  return (
    <div className="border-l-4 border-amber-500 bg-amber-950/20 p-4 md:p-6 rounded-r-lg shadow-[0_0_15px_rgba(245,158,11,0.1)]">
      <h3 className="text-amber-500 font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 font-mono text-sm">
        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Forensic Anomalies & Discrepancies ({anomalies.length})
      </h3>
      <ul className="space-y-2.5">
        {anomalies.map((anomaly, index) => (
          <li
            key={index}
            className="text-amber-200/80 font-mono text-xs md:text-sm pl-4 relative before:content-['>'] before:absolute before:left-0 before:text-amber-500 leading-relaxed"
          >
            {anomaly}
          </li>
        ))}
      </ul>
    </div>
  );
}
