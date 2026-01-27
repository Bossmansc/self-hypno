import React from 'react';
import TriggerBuilder from '../components/TriggerBuilder';
import { Download, FileText, Activity, Shield } from 'lucide-react';

export default function Resources() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center pt-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-200 to-indigo-500 bg-clip-text text-transparent">
            Hypnotic Tools
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Free utilities for exploring the subconscious mind. No account required.
          </p>
        </div>
        
        <TriggerBuilder />
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-4 text-pink-400">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">The Velvet Rope Protocol</h3>
            <p className="text-sm text-slate-400 mb-4">
              A complete script structure for safe, consensual surrender play. Includes pre-talk checklist and aftercare prompts.
            </p>
            <button className="text-xs font-bold uppercase tracking-wider text-pink-400 hover:text-pink-300 flex items-center gap-2">
              <Download size={14} /> Download PDF
            </button>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 text-emerald-400">
              <Activity size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Frequency Map</h3>
            <p className="text-sm text-slate-400 mb-4">
              Reference chart for binaural beats. Know exactly which Hz to use for deep trance (Theta) vs. active focus (Beta).
            </p>
            <button className="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
              <Activity size={14} /> View Chart
            </button>
          </div>
        </div>

        <div className="text-center pb-20">
          <p className="text-slate-500 text-sm mb-4">Want to generate full custom scripts with AI?</p>
          <a href="/" className="inline-block px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-300 text-sm font-medium transition-colors border border-white/5">
            Launch Full App
          </a>
        </div>
      </div>
    </div>
  );
}
