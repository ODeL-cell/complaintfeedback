import React, { useState } from 'react';
import { Search, Loader2, Calendar, Clipboard, CheckCircle2, Circle, Clock, MessageSquare, ShieldAlert } from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';

interface TrackingSectionProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
}

export default function TrackingSection({ complaints, onSelectComplaint }: TrackingSectionProps) {
  const [refId, setRefId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchResult, setSearchResult] = useState<Complaint | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSearchResult(null);

    const match = complaints.find(
      (c) => c.referenceNumber.trim().toUpperCase() === refId.trim().toUpperCase()
    );

    if (match) {
      setSearchResult(match);
    } else {
      setErrorMsg('No complaint found with that reference number. Double check your receipt code.');
    }
  };

  const fillDemoRef = (demoRef: string) => {
    setRefId(demoRef);
    const match = complaints.find((c) => c.referenceNumber === demoRef);
    if (match) {
      setSearchResult(match);
      setErrorMsg('');
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      case 'Under Investigation':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Investigating
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
            <Circle className="w-3.5 h-3.5" /> Processing
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl max-w-6xl mx-auto my-6 border border-slate-800">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            Status Tracker Terminal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track investigation timelines and official responses securely.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 block w-full md:w-auto">Quick test templates:</span>
          <button
            onClick={() => fillDemoRef('MUT-2026-A109')}
            className="text-[11px] px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black rounded-lg border border-slate-700 transition"
          >
            A109 (Resolved)
          </button>
          <button
            onClick={() => fillDemoRef('MUT-2026-C044')}
            className="text-[11px] px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black rounded-lg border border-slate-700 transition"
          >
            C044 (Investigating)
          </button>
          <button
            onClick={() => fillDemoRef('MUT-2026-B320')}
            className="text-[11px] px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black rounded-lg border border-slate-700 transition"
          >
            B320 (Pending)
          </button>
        </div>
      </div>

      <div className="py-8">
        <form onSubmit={handleSearch} className="max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter Reference Code (e.g. MUT-2026-A109)"
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              className="w-full px-5 py-4 bg-slate-800/80 border-2 border-slate-700 rounded-2xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all uppercase"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-red-700 hover:bg-red-600 active:scale-95 text-xs font-black font-sans uppercase tracking-wider px-5 rounded-xl transition"
            >
              <div className="flex items-center gap-1">
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </div>
            </button>
          </div>
          {errorMsg && (
            <p className="text-red-400 text-xs mt-3 flex items-center gap-1.5 font-medium">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {errorMsg}
            </p>
          )}
        </form>

        {/* Search Results Display Area */}
        {searchResult && (
          <div className="mt-8 bg-slate-800/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/30 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] bg-red-700/80 text-yellow-400 tracking-widest uppercase font-black px-2.5 py-1 rounded">
                  {searchResult.category.toUpperCase()} ISSUE
                </span>
                <span className="text-xs font-mono font-bold text-slate-400 ml-3">
                  ID: {searchResult.referenceNumber}
                </span>
              </div>
              <div>{getStatusBadge(searchResult.status)}</div>
            </div>

            <h3 className="text-lg font-bold mb-2 font-sans text-slate-100">
              {searchResult.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl mb-6">
              {searchResult.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800">
              {/* Metadata details */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Filing Information
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-500">Student Identity:</span>
                    <span className="font-semibold text-slate-200">
                      {searchResult.isAnonymous ? 'Restricted / Anonymous' : searchResult.studentName}
                    </span>
                  </div>
                  {searchResult.studentId && !searchResult.isAnonymous && (
                    <div className="flex justify-between py-1 border-b border-slate-800/50">
                      <span className="text-slate-500">Registration No:</span>
                      <span className="font-mono font-medium text-slate-200">{searchResult.studentId}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-500">Urgency Assessment:</span>
                    <span className={`font-semibold uppercase tracking-wider text-[10px] px-2 rounded ${
                      searchResult.urgency === 'high' ? 'bg-red-950 text-red-400' :
                      searchResult.urgency === 'medium' ? 'bg-amber-950 text-amber-400' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {searchResult.urgency} Priority
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Date Logged:</span>
                    <span className="text-slate-300 font-mono">{searchResult.createdAt}</span>
                  </div>
                </div>
              </div>

              {/* Committee Timeline updates */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Official Timeline &amp; Resolutions
                </h4>
                
                <div className="space-y-4">
                  {searchResult.updates.map((upd, idx) => (
                    <div key={upd.id} className="relative flex gap-3 text-xs">
                      {/* Stem indicators */}
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-red-600 mt-1"></div>
                        {idx !== searchResult.updates.length - 1 && (
                          <div className="w-[1px] bg-slate-700 h-full my-1"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                          <span className="font-semibold font-mono">{upd.date}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {upd.status}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1 font-sans">{upd.message}</p>
                      </div>
                    </div>
                  ))}

                  {searchResult.updates.length === 0 && (
                    <p className="text-slate-500 italic text-center py-4">No progress notes registered yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
