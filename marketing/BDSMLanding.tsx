   import React from 'react';
   import { Lock, Shield, Zap } from 'lucide-react';
   
   export default function BDSMLanding() {
     return (
       <div className="min-h-screen bg-slate-950 text-white p-6">
         <div className="max-w-4xl mx-auto">
           <h1 className="text-4xl font-bold mb-6">Digital Domination Protocol</h1>
           <p className="text-xl text-slate-300 mb-8">Create custom surrender triggers. Safe. Private. Programmable.</p>
           
           <div className="grid md:grid-cols-3 gap-6 mb-12">
             <div className="bg-slate-900 p-6 rounded-2xl">
               <Lock className="w-12 h-12 text-pink-500 mb-4" />
               <h3 className="text-xl font-semibold mb-2">Total Privacy</h3>
               <p className="text-slate-400">Everything runs locally. No data stored. Your protocols stay yours.</p>
             </div>
             <div className="bg-slate-900 p-6 rounded-2xl">
               <Shield className="w-12 h-12 text-emerald-500 mb-4" />
               <h3 className="text-xl font-semibold mb-2">Safe Word Built-in</h3>
               <p className="text-slate-400">Every session includes emergency exit triggers and aftercare prompts.</p>
             </div>
             <div className="bg-slate-900 p-6 rounded-2xl">
               <Zap className="w-12 h-12 text-amber-500 mb-4" />
               <h3 className="text-xl font-semibold mb-2">Brainwave Entrainment</h3>
               <p className="text-slate-400">Binaural beats to deepen trance states for more effective conditioning.</p>
             </div>
           </div>
           
           <div className="bg-slate-900 rounded-2xl p-8 mb-8">
             <h2 className="text-2xl font-bold mb-4">Free Template: "The Velvet Rope"</h2>
             <p className="text-slate-300 mb-6">A complete surrender protocol with golden cord trigger and collarbone anchor.</p>
             <button className="bg-pink-600 hover:bg-pink-700 px-8 py-3 rounded-xl font-semibold text-lg">
               Get Free Template
             </button>
           </div>
         </div>
       </div>
     );
   }
   