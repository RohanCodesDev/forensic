import React, { useState } from 'react';
import { EmailEvidence } from '../types/forensic';

interface SoarPlaybookCardProps {
  evidence: EmailEvidence;
}

interface ActionState {
  status: 'IDLE' | 'EXECUTING' | 'SUCCESS';
  label: string;
}

export default function SoarPlaybookCard({ evidence }: SoarPlaybookCardProps) {
  const { analysis } = evidence;
  
  const targetIp = analysis?.routeAnalysis?.originatingIp;
  const targetDomain = analysis?.domainAnalysis?.domain;
  const targetMailbox = evidence.to;
  
  const [actions, setActions] = useState<Record<string, ActionState>>({
    blockIp: { status: 'IDLE', label: `Block IP on Firewall: ${targetIp || 'Unknown'}` },
    blockDomain: { status: 'IDLE', label: `Add Domain to Denylist: ${targetDomain || 'Unknown'}` },
    quarantine: { status: 'IDLE', label: `Quarantine Inbox: ${targetMailbox}` }
  });

  const handleAction = (key: string) => {
    setActions(prev => ({ ...prev, [key]: { ...prev[key], status: 'EXECUTING' } }));
    
    // Simulate SOAR integration delay
    setTimeout(() => {
      setActions(prev => ({ ...prev, [key]: { ...prev[key], status: 'SUCCESS' } }));
    }, 2000);
  };

  const getStatusIcon = (status: 'IDLE' | 'EXECUTING' | 'SUCCESS') => {
    switch (status) {
      case 'EXECUTING':
        return (
          <svg className="w-5 h-5 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'SUCCESS':
        return (
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        );
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
          <h3 className="text-zinc-100 font-semibold tracking-wide">SOAR Remediation Playbook</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
          Automated Response
        </span>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-zinc-400">
          Execute simulated playbook actions to neutralize the threat across the enterprise environment.
        </p>

        <div className="space-y-3">
          {/* Block IP Action */}
          <button 
            disabled={!targetIp || actions.blockIp.status !== 'IDLE'}
            onClick={() => handleAction('blockIp')}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${actions.blockIp.status === 'SUCCESS' ? 'bg-emerald-950/50' : 'bg-black/50'}`}>
                {getStatusIcon(actions.blockIp.status)}
              </div>
              <div>
                <div className="text-zinc-200 font-medium text-sm">{actions.blockIp.label}</div>
                <div className="text-zinc-500 text-xs mt-0.5 font-mono">Palo Alto Networks / Cisco ASA</div>
              </div>
            </div>
            {actions.blockIp.status === 'SUCCESS' && <span className="text-emerald-400 text-xs font-bold mr-2 uppercase">Isolated</span>}
          </button>

          {/* Block Domain Action */}
          <button 
            disabled={!targetDomain || actions.blockDomain.status !== 'IDLE'}
            onClick={() => handleAction('blockDomain')}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${actions.blockDomain.status === 'SUCCESS' ? 'bg-emerald-950/50' : 'bg-black/50'}`}>
                {getStatusIcon(actions.blockDomain.status)}
              </div>
              <div>
                <div className="text-zinc-200 font-medium text-sm">{actions.blockDomain.label}</div>
                <div className="text-zinc-500 text-xs mt-0.5 font-mono">Microsoft Exchange / Proofpoint</div>
              </div>
            </div>
            {actions.blockDomain.status === 'SUCCESS' && <span className="text-emerald-400 text-xs font-bold mr-2 uppercase">Blocked</span>}
          </button>

          {/* Quarantine Mailbox Action */}
          <button 
            disabled={actions.quarantine.status !== 'IDLE'}
            onClick={() => handleAction('quarantine')}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-rose-900/40 bg-rose-950/10 hover:bg-rose-950/20 hover:border-rose-800/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${actions.quarantine.status === 'SUCCESS' ? 'bg-rose-900/50' : 'bg-black/50'}`}>
                {getStatusIcon(actions.quarantine.status)}
              </div>
              <div>
                <div className="text-rose-200 font-medium text-sm">{actions.quarantine.label}</div>
                <div className="text-rose-400/70 text-xs mt-0.5 font-mono">Identity Provider (IdP) Lockout</div>
              </div>
            </div>
            {actions.quarantine.status === 'SUCCESS' && <span className="text-rose-400 text-xs font-bold mr-2 uppercase">Locked</span>}
          </button>
        </div>
        
        {analysis?.breachData?.isBreached && (
          <div className="mt-4 p-3 border border-orange-800 bg-orange-950/30 rounded-lg">
             <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <div>
                  <h4 className="text-orange-300 font-bold text-sm">Dark Web Intelligence Alert</h4>
                  <p className="text-orange-400/80 text-xs mt-1">Sender email has been exposed in {analysis.breachData.breachCount} known data breaches. Highest risk of Account Takeover (ATO) and BEC.</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
