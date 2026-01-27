import React, { useState, useRef, useEffect } from 'react';
import { Zap, Play, Square, Volume2 } from 'lucide-react';

export default function TriggerBuilder() {
  const [trigger, setTrigger] = useState('collarbone');
  const [sensation, setSensation] = useState('warmth');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const stopAudio = () => {
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch (e) {}
      oscRef.current.disconnect();
      oscRef.current = null;
    }
    setIsPlaying(false);
  };

  const playTriggerTone = () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Frequency based on sensation
    if (sensation === 'warmth') osc.frequency.setValueAtTime(110, ctx.currentTime); // Low resonance
    else if (sensation === 'tingle') osc.frequency.setValueAtTime(432, ctx.currentTime); // High clarity
    else if (sensation === 'weight') osc.frequency.setValueAtTime(60, ctx.currentTime); // Deep rumble

    osc.type = sensation === 'weight' ? 'sine' : 'triangle';
    
    // Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2); // 2 second burst

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 2);
    
    oscRef.current = osc;
    gainRef.current = gain;
    setIsPlaying(true);

    setTimeout(() => setIsPlaying(false), 2000);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Zap size={120} />
      </div>

      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-indigo-400">
          <Zap size={20} /> Trigger Architect
        </h3>
        <p className="text-slate-400 text-sm mb-6">Design and test a post-hypnotic anchor.</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location</label>
              <select className="w-full bg-slate-800 rounded-lg p-3 text-white border border-white/5 outline-none focus:border-indigo-500 transition-all" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
                <option value="collarbone">Touch Collarbone</option>
                <option value="wrist">Press Left Wrist</option>
                <option value="finger">Thumb & Finger Press</option>
                <option value="ear">Touch Right Ear</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sensation</label>
              <select className="w-full bg-slate-800 rounded-lg p-3 text-white border border-white/5 outline-none focus:border-indigo-500 transition-all" value={sensation} onChange={(e) => setSensation(e.target.value)}>
                <option value="warmth">Deep Warmth (110Hz)</option>
                <option value="tingle">Electric Tingle (432Hz)</option>
                <option value="weight">Heavy Relaxation (60Hz)</option>
              </select>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Script Preview</p>
              <code className="text-sm text-slate-300 block font-mono bg-black/20 p-3 rounded-lg border border-white/5">
                "When you <span className="text-indigo-400">{trigger}</span>, you will instantly feel a wave of <span className="text-indigo-400">{sensation}</span> wash over you..."
              </code>
            </div>
            
            <button 
              onClick={playTriggerTone}
              className={`mt-4 w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isPlaying ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'}`}
            >
              {isPlaying ? <Volume2 className="animate-pulse" /> : <Play size={18} fill="currentColor" />}
              {isPlaying ? 'Playing Tone...' : 'Test Trigger Anchor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
