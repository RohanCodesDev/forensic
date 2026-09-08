import React, { useState, useEffect } from "react";


interface InboxScannerModalProps {
  onClose: () => void;
  onScanComplete: (results: any[]) => void;
}

export default function InboxScannerModal({ onClose, onScanComplete }: InboxScannerModalProps) {
  const [provider, setProvider] = useState("gmail");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [maxEmails, setMaxEmails] = useState("5");
  const [filterType, setFilterType] = useState("recent");
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const providers: Record<string, { host: string; port: string; name: string }> = {
    gmail: { host: "imap.gmail.com", port: "993", name: "Google Workspace / Gmail" },
    outlook: { host: "outlook.office365.com", port: "993", name: "Microsoft 365 / Outlook" },
    yahoo: { host: "imap.mail.yahoo.com", port: "993", name: "Yahoo Mail" },
  };

  const getApiUrl = () => {
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      // Use deployed backend URL if frontend is deployed, adjust as needed
      return `https://ps106-backend.onrender.com`;
    }
    return "http://localhost:8000";
  };

  // Load saved credentials from local storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("forensic_imap_config");
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          if (parsed.provider) setProvider(parsed.provider);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.password) setPassword(parsed.password);
          if (parsed.maxEmails) setMaxEmails(parsed.maxEmails);
          if (parsed.filterType) setFilterType(parsed.filterType);
        } catch (e) {
          // ignore parsing error
        }
      }
    }
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setStatus("scanning");
    setErrorMessage("");

    // Save to local storage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("forensic_imap_config", JSON.stringify({
        provider,
        email,
        password,
        maxEmails,
        filterType
      }));
    }

    try {
      const config = providers[provider];
      const res = await fetch(`${getApiUrl()}/api/inbox/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          host: config.host,
          port: config.port,
          secure: true,
          email,
          password,
          maxEmails,
          filterType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          onScanComplete(data.data);
        }, 1500);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to scan inbox.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage("Network error connecting to backend.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={status !== "scanning" ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight">Automated Inbox Scanner</h2>
              <p className="text-[11px] text-zinc-500 font-medium">Connect via secure IMAP integration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={status === "scanning"}
            className="text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleScan} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">Email Provider</label>
            <select 
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              disabled={status === "scanning"}
            >
              <option value="gmail">Google Workspace / Gmail</option>
              <option value="outlook">Microsoft 365 / Outlook</option>
              <option value="yahoo">Yahoo Mail</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="soc-analyst@company.com"
              className="w-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              required
              disabled={status === "scanning"}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>App Password</span>
              <span className="text-[10px] text-zinc-600 font-normal">Use an App Password, not your login</span>
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              required
              disabled={status === "scanning"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Scan Scope</label>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                disabled={status === "scanning"}
              >
                <option value="recent">Recent (Last 7 Days)</option>
                <option value="unread">Unread Only</option>
                <option value="all">Entire Inbox</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Max Emails</label>
              <select 
                value={maxEmails}
                onChange={(e) => setMaxEmails(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                disabled={status === "scanning"}
              >
                <option value="5">Fetch 5 items</option>
                <option value="10">Fetch 10 items</option>
                <option value="25">Fetch 25 items</option>
              </select>
            </div>
          </div>

          {/* Status Alert */}
          {status === "error" && (
            <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex gap-2 text-xs text-red-400">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {status === "success" && (
            <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg flex gap-2 text-xs text-emerald-400">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              <span>Scan complete! Reports saved to Vault.</span>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800/60">
            <button
              type="submit"
              disabled={status === "scanning" || !email || !password}
              className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                status === "scanning" || !email || !password
                  ? "bg-zinc-900/60 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                  : "bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]"
              }`}
            >
              {status === "scanning" ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Connecting to IMAP...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Scan Inbox Automatically
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
