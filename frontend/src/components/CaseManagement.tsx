import React, { useState, useEffect } from "react";
import { ForensicCase, AuditLog } from "../types/forensic";

interface CaseManagementProps {
  apiUrl: string;
}

export default function CaseManagement({ apiUrl }: CaseManagementProps) {
  const [cases, setCases] = useState<ForensicCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<ForensicCase | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({ name: "", description: "", priority: "MEDIUM" });

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/cases`);
      const json = await res.json();
      if (res.ok && json.data) {
        setCases(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [apiUrl]);

  const fetchCaseDetails = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/cases/${id}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setSelectedCase(json.data);
        setAuditLogs(json.data.auditLogs || []);
      }
    } catch (err) {
      console.error("Failed to fetch case details:", err);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCaseForm),
      });
      if (res.ok) {
        setIsCreating(false);
        setNewCaseForm({ name: "", description: "", priority: "MEDIUM" });
        fetchCases();
      }
    } catch (err) {
      console.error("Failed to create case:", err);
    }
  };

  const handleUpdateStatus = async (caseId: string, status: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchCases();
        if (selectedCase?.id === caseId) {
          fetchCaseDetails(caseId);
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (selectedCase) {
    return (
      <div className="bg-zinc-950 p-6 rounded border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3 font-mono">
            <span className="w-2 h-2 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
            <h2 className="text-lg font-bold text-zinc-100 uppercase">CASE FILE: {selectedCase.name}</h2>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border ${
              selectedCase.status === 'OPEN' ? 'border-amber-700/50 bg-amber-900/20 text-amber-400' :
              selectedCase.status === 'CLOSED' ? 'border-zinc-700 bg-zinc-900 text-zinc-500' :
              'border-red-700/50 bg-red-900/20 text-red-400'
            }`}>
              {selectedCase.status}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <select
              value={selectedCase.status}
              onChange={(e) => handleUpdateStatus(selectedCase.id, e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-300 rounded px-2 py-1 outline-none focus:border-amber-500"
            >
              <option value="OPEN">MARK OPEN</option>
              <option value="ESCALATED">ESCALATE</option>
              <option value="CLOSED">CLOSE CASE</option>
            </select>
            <button
              onClick={() => setSelectedCase(null)}
              className="px-3 py-1 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded transition-colors"
            >
              [ BACK TO VAULT ]
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded">
              <h3 className="text-xs font-mono text-zinc-500 uppercase mb-2">[ EVIDENCE LOCKER ]</h3>
              {selectedCase.emails && selectedCase.emails.length > 0 ? (
                <ul className="space-y-2">
                  {selectedCase.emails.map(email => (
                    <li key={email.id} className="text-sm font-mono flex items-center justify-between bg-black p-2 border border-zinc-800 rounded">
                      <span className="text-zinc-300 truncate max-w-[200px]" title={email.filename}>{email.filename}</span>
                      <span className="text-[10px] text-zinc-500">{email.sha256Hash?.substring(0, 16)}...</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs font-mono text-zinc-600 italic">No evidence assigned to this case yet.</p>
              )}
            </div>
            <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded">
              <h3 className="text-xs font-mono text-zinc-500 uppercase mb-2">[ CASE BRIEF ]</h3>
              <p className="text-sm text-zinc-400">{selectedCase.description || "No description provided."}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900/50 p-4 border border-zinc-800 rounded h-[400px] overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-mono text-amber-500 uppercase mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                [ CHAIN OF CUSTODY :: AUDIT LOG ]
              </h3>
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                {auditLogs.map((log, idx) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_4px_#09090b]"></div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded border border-zinc-800 bg-black">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-zinc-200 text-xs font-mono">{log.action}</div>
                        <time className="font-mono text-[9px] text-zinc-500">{new Date(log.timestamp).toLocaleString()}</time>
                      </div>
                      <div className="text-zinc-400 text-xs">
                        {log.email ? (
                          <div className="font-mono">
                            <span className="text-emerald-400">EVIDENCE:</span> {log.email.filename} <br/>
                            <span className="text-zinc-500 text-[10px]">SHA256: {log.email.sha256Hash}</span>
                          </div>
                        ) : (
                          <pre className="text-[10px] text-zinc-500 overflow-x-auto custom-scrollbar mt-1">{JSON.stringify(log.details, null, 2)}</pre>
                        )}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-600 mt-2 uppercase">BY: {log.performedBy}</div>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-xs font-mono text-zinc-600 italic pl-6">No audit records found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-zinc-950 p-4 border border-zinc-800 rounded">
        <h2 className="text-sm font-mono text-amber-500 font-bold uppercase tracking-wider flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          [ INCIDENT CASE VAULT ]
        </h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3 py-1.5 bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 border border-amber-800/50 rounded font-mono text-xs transition-colors"
        >
          {isCreating ? "[ CANCEL ]" : "[ + NEW CASE ]"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateCase} className="bg-zinc-950 p-4 border border-zinc-800 rounded space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">CASE NAME</label>
              <input
                type="text"
                required
                value={newCaseForm.name}
                onChange={e => setNewCaseForm({...newCaseForm, name: e.target.value})}
                className="w-full bg-black border border-zinc-800 rounded p-2 text-zinc-200 font-mono text-sm focus:border-amber-500 outline-none"
                placeholder="e.g. Q3 Spearphishing Campaign"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">PRIORITY</label>
              <select
                value={newCaseForm.priority}
                onChange={e => setNewCaseForm({...newCaseForm, priority: e.target.value})}
                className="w-full bg-black border border-zinc-800 rounded p-2 text-zinc-200 font-mono text-sm focus:border-amber-500 outline-none"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1">DESCRIPTION</label>
            <textarea
              value={newCaseForm.description}
              onChange={e => setNewCaseForm({...newCaseForm, description: e.target.value})}
              className="w-full bg-black border border-zinc-800 rounded p-2 text-zinc-200 font-mono text-sm focus:border-amber-500 outline-none min-h-[80px]"
              placeholder="Brief summary of the incident..."
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold font-mono text-sm rounded transition-colors">
              [ INITIALIZE CASE ]
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 font-mono text-zinc-500 animate-pulse">Loading Case Records...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => fetchCaseDetails(c.id)}
              className="bg-zinc-950 border border-zinc-800 hover:border-amber-700/50 rounded p-4 cursor-pointer transition-all hover:-translate-y-1 group flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-zinc-200 truncate pr-2 group-hover:text-amber-400 transition-colors">{c.name}</h3>
                <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-sm border ${
                  c.status === 'OPEN' ? 'border-amber-700/50 bg-amber-900/20 text-amber-400' :
                  c.status === 'CLOSED' ? 'border-zinc-700 bg-zinc-900 text-zinc-500' :
                  'border-red-700/50 bg-red-900/20 text-red-400'
                }`}>
                  {c.status}
                </span>
              </div>
              
              <div className="text-xs text-zinc-400 line-clamp-2 mb-4 flex-1">
                {c.description || "No description provided."}
              </div>

              <div className="flex justify-between items-end mt-auto pt-4 border-t border-zinc-800/50 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {c._count?.emails || 0} EVIDENCE LINKED
                </div>
                <div className="text-zinc-600">
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
          {cases.length === 0 && !isCreating && (
             <div className="col-span-full py-12 text-center font-mono text-zinc-500 border border-dashed border-zinc-800 rounded bg-zinc-950/50">
               NO ACTIVE CASES DETECTED. INITIALIZE A NEW CASE TO BEGIN.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
