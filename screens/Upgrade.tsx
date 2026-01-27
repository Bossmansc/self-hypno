import React, { useEffect } from 'react';
import { useTrance } from '../context/TranceContext';
import { Shield, Zap, Star, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Upgrade() {
  const { navTo, upgradeToPro, isPro } = useTrance();

  useEffect(() => {
     const category = new URLSearchParams(window.location.search).get('category');
     if (category) {
       console.log('Marketing category:', category);
     }
   }, []);

  const handleUpgrade = () => {
    upgradeToPro();
    alert('Welcome to the Founder\'s Club! Pro features unlocked.');
    navTo('PROFILE');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-y-auto">
      {/* Header */}
      <div className="p-6 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10 border-b border-white/5">
        <button 
          onClick={() => navTo('PROFILE')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      <div className="p-6 max-w-3xl mx-auto w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
            Founder's Edition
          </h1>
          <p className="text-slate-400 text-lg">
            Unlock the full potential of your subconscious mind.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Free Tier */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 opacity-70">
            <h3 className="text-xl font-bold mb-4 text-slate-300">Free Tier</h3>
            <ul className="space-y-4 text-sm text-slate-400 mb-8">
              <li className="flex gap-3"><CheckCircle size={16} className="text-slate-500" /> 3 AI Script Generations</li>
              <li className="flex gap-3"><CheckCircle size={16} className="text-slate-500" /> 5 Saved Sessions</li>
              <li className="flex gap-3"><CheckCircle size={16} className="text-slate-500" /> Basic Binaural Beats</li>
            </ul>
            <button className="w-full py-3 rounded-xl border border-white/10 text-slate-400 cursor-default">
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="p-6 rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-purple-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
              LIMITED TIME
            </div>
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <Star className="text-amber-400 fill-amber-400" size={20} /> Lifetime
            </h3>
            <ul className="space-y-4 text-sm text-slate-300 mb-8">
              <li className="flex gap-3"><Zap size={16} className="text-amber-400" /> <strong>Unlimited</strong> AI Generations</li>
              <li className="flex gap-3"><Shield size={16} className="text-amber-400" /> <strong>Unlimited</strong> Storage</li>
              <li className="flex gap-3"><Star size={16} className="text-amber-400" /> Commercial Usage Rights</li>
              <li className="flex gap-3"><CheckCircle size={16} className="text-amber-400" /> Early Access to New Features</li>
            </ul>
            
            {isPro ? (
               <button className="w-full py-3 bg-green-600/20 text-green-400 border border-green-500/50 rounded-xl font-bold cursor-default">
                 Plan Active
               </button>
            ) : (
              <button 
                onClick={handleUpgrade}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-amber-900/20"
              >
                Get Lifetime Access - $29
              </button>
            )}
            <p className="text-center text-xs text-slate-500 mt-3">One-time payment. Own it forever.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
