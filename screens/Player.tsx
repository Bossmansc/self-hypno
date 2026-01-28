import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTrance } from '../context/TranceContext';
import { useAudioEngine } from '../hooks/audio/useAudioEngine';
import { ArrowDown, Settings as SettingsIcon, Play, Pause, CloudRain, Wind, Headphones, Speaker, MessageSquare } from 'lucide-react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';

const getBrainwaveInfo = (freq: number) => {
  if (freq < 4) return { name: 'Delta', state: 'Deep Sleep', color: '#4338ca', duration: 10, desc: "Restorative sleep, healing, detachment from awareness." };
  if (freq < 8) return { name: 'Theta', state: 'Meditation', color: '#7e22ce', duration: 7, desc: "Deep meditation, intuition, creativity, dreaming." };
  if (freq < 14) return { name: 'Alpha', state: 'Relaxed Focus', color: '#0d9488', duration: 4, desc: "Stress reduction, super-learning, flow state." };
  if (freq < 32) return { name: 'Beta', state: 'Active Thinking', color: '#ea580c', duration: 2, desc: "Alertness, concentration, cognitive processing." };
  return { name: 'Gamma', state: 'Peak Performance', color: '#dc2626', duration: 1, desc: "High-level information processing, insight." };
};

const SoundButton = ({ icon, active, onClick }: { icon: React.ReactNode; active: boolean; onClick: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
  >
    {icon}
  </motion.button>
);

const RangeControl = ({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  onChange, 
  formatValue, 
  leftLabel,
  rightLabel 
}: { 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  step: number; 
  onChange: (value: number) => void; 
  formatValue?: (value: number) => string;
  leftLabel?: string;
  rightLabel?: string;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-sm font-mono text-indigo-400">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
    />
    {(leftLabel || rightLabel) && (
      <div className="flex justify-between text-xs text-slate-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    )}
  </div>
);

export default function Player() {
  const { navTo, activeSessionId, sessions, settings, updateSettings } = useTrance();
  const session = sessions.find(s => s.id === activeSessionId);
  const [activeLine, setActiveLine] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [entType, setEntType] = useState<'BINAURAL' | 'ISOCHRONIC'>('BINAURAL');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const fetchVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices.sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name)));
        return true;
      }
      return false;
    };

    // Attempt to wake up Android TTS engine
    if (window.speechSynthesis.getVoices().length === 0) {
      try {
        const u = new SpeechSynthesisUtterance(''); 
        u.volume = 0; 
        window.speechSynthesis.speak(u);
      } catch (e) { console.error("TTS Wakeup failed", e); }
    }

    if (!fetchVoices()) {
      // Aggressive polling for Android
      const intervalId = setInterval(fetchVoices, 500);
      
      window.speechSynthesis.onvoiceschanged = () => {
        fetchVoices();
      };

      return () => {
        clearInterval(intervalId);
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      // Still listen for changes (e.g. language pack install)
      window.speechSynthesis.onvoiceschanged = fetchVoices;
    }
  }, []);

  const handleLineChange = useCallback((index: number) => {
    setActiveLine(index);
  }, []);

  const { isPlaying, activeSoundscape, togglePlay, playSoundscape, currentFreq } = useAudioEngine({
    settings,
    activeScript: session?.script,
    onLineChange: handleLineChange,
    entrainmentType: entType
  });

  useEffect(() => {
    if (activeLine >= 0) {
      const timer = setTimeout(() => {
        if (lineRefs.current[activeLine]) {
          lineRefs.current[activeLine]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeLine]);

  if (!session) return null;

  const scriptLines = session.script
    ? (session.script.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [session.script])
    : [];

  const currentBrainwave = getBrainwaveInfo(currentFreq);
  const breathDuration = 60 / settings.breathingRate; 

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e] z-50 transition-colors duration-[2000ms]"
      style={{ background: `linear-gradient(to bottom, #1a1a2e, ${currentBrainwave.color}20)` }}
    >
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex justify-between items-center bg-[#121212]/0 z-20 shrink-0">
        <button onClick={() => navTo('DASHBOARD')} className="p-2 rounded-full hover:bg-white/10 backdrop-blur-sm bg-black/20">
          <ArrowDown className="text-slate-300" />
        </button>
        <h2 className="text-lg font-medium text-white/80 max-w-[200px] truncate text-center">{session.title}</h2>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-white/10 backdrop-blur-sm bg-black/20 relative">
          <SettingsIcon className="text-slate-300" />
          {settings.binauralEnabled && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-[#1a1a2e]" />}
        </button>
      </div>

      {/* Visualizer & Text */}
      <div className="flex-1 flex flex-col items-center relative w-full overflow-hidden">
        <div className="h-[35%] w-full flex items-center justify-center relative shrink-0 z-0">
          {/* Animated Background Blob */}
          <motion.div 
            animate={isPlaying ? { 
              scale: [1, 1.2, 1], 
              opacity: [0.2, 0.4, 0.2] 
            } : { scale: 1, opacity: 0.2 }}
            transition={{ 
              duration: currentBrainwave.duration, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none"
            style={{ backgroundColor: currentBrainwave.color }}
          />
          
          {/* Rotating Ring */}
          {isPlaying && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute w-[240px] h-[240px] border border-dashed border-white/10 rounded-full pointer-events-none z-0"
            />
          )}

          {/* Breathing Guide */}
          {settings.breathingEnabled && isPlaying && (
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1], 
                opacity: [0.3, 0.6, 0.3],
                borderWidth: ["1px", "4px", "1px"]
              }}
              transition={{ 
                duration: breathDuration, 
                repeat: Infinity, 
                ease: "easeInOut",
                times: [0, 0.4, 1] 
              }}
              className="absolute w-48 h-48 rounded-full border border-white/30 z-0 pointer-events-none"
            />
          )}

          {/* Icon Container */}
          <motion.div 
            animate={isPlaying ? { 
              scale: [1, 1.05, 1], 
              borderColor: [`${currentBrainwave.color}40`, `${currentBrainwave.color}80`, `${currentBrainwave.color}40`]
            } : { scale: 1 }}
            transition={{ duration: currentBrainwave.duration, repeat: Infinity, ease: "easeInOut" }}
            className="w-40 h-40 rounded-full bg-black/20 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl z-10"
            style={{ boxShadow: `0 0 50px ${currentBrainwave.color}40` }}
          >
            <div className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{session.icon}</div>
          </motion.div>

          {/* Binaural Status */}
          {settings.binauralEnabled && isPlaying && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute bottom-4 flex flex-col items-center gap-1"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                {currentBrainwave.name} Wave
              </div>
              <div 
                className="text-lg font-light tracking-wide" 
                style={{ color: currentBrainwave.color }}
              >
                {currentFreq.toFixed(1)} Hz • {currentBrainwave.state}
              </div>
            </motion.div>
          )}
        </div>

        {/* Teleprompter */}
        <div ref={scrollContainerRef} className="flex-1 w-full max-w-2xl px-6 overflow-y-auto z-10 scrollbar-hide" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' }}>
          <div className="py-[50vh] flex flex-col gap-8 text-center"> 
            {scriptLines.map((line, i) => {
              const isActive = i === activeLine;
              return (
                <motion.p
                  key={i}
                  ref={(el) => (lineRefs.current[i] = el)}
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0.15, scale: isActive ? 1.1 : 0.95, filter: isActive ? 'blur(0px)' : 'blur(2px)', color: isActive ? '#ffffff' : '#94a3b8' }}
                  transition={{ duration: 0.5 }}
                  className="text-xl md:text-2xl font-light leading-relaxed cursor-pointer transition-colors min-h-[1.5em]"
                  onClick={() => setActiveLine(i)} 
                >
                  {line.replace(/\[.*?\]/g, '').trim()}
                </motion.p>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 pb-10 bg-[#121212]/90 backdrop-blur-xl border-t border-white/5 flex flex-col items-center gap-6 rounded-t-3xl z-30 shrink-0">
        <div className="flex gap-4">
          <SoundButton icon={<CloudRain size={20} />} active={activeSoundscape === 'rain'} onClick={() => playSoundscape('rain')} />
          <SoundButton icon={<span className="text-xl">🧘</span>} active={activeSoundscape === 'om'} onClick={() => playSoundscape('om')} />
          <SoundButton icon={<Wind size={20} />} active={activeSoundscape === 'wind'} onClick={() => playSoundscape('wind')} />
        </div>
        
        <motion.button whileTap={{ scale: 0.95 }} onClick={togglePlay} className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-shadow">
          {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-1" />}
        </motion.button>
      </div>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Audio & Entrainment">
        <div className="space-y-6">
          {/* Quick Toggles */}
          <div className="grid grid-cols-2 gap-3">
             <div onClick={() => updateSettings({ breathingEnabled: !settings.breathingEnabled })} className={`p-3 rounded-xl border cursor-pointer transition-all ${settings.breathingEnabled ? 'bg-indigo-500/10 border-indigo-500' : 'bg-white/5 border-white/5 opacity-70'}`}>
                <div className="flex justify-between mb-2">
                   <Wind size={20} className={settings.breathingEnabled ? "text-indigo-400" : "text-slate-400"} />
                   <div className={`w-3 h-3 rounded-full ${settings.breathingEnabled ? 'bg-indigo-500' : 'bg-slate-600'}`} />
                </div>
                <div className="text-sm font-medium text-white">Breathing</div>
                <div className="text-xs text-slate-500">{settings.breathingRate} BPM</div>
             </div>
             
             <div onClick={() => updateSettings({ binauralEnabled: !settings.binauralEnabled })} className={`p-3 rounded-xl border cursor-pointer transition-all ${settings.binauralEnabled ? 'bg-indigo-500/10 border-indigo-500' : 'bg-white/5 border-white/5 opacity-70'}`}>
                <div className="flex justify-between mb-2">
                   <Headphones size={20} className={settings.binauralEnabled ? "text-indigo-400" : "text-slate-400"} />
                   <div className={`w-3 h-3 rounded-full ${settings.binauralEnabled ? 'bg-indigo-500' : 'bg-slate-600'}`} />
                </div>
                <div className="text-sm font-medium text-white">Brainwaves</div>
                <div className="text-xs text-slate-500">{settings.binauralFreq} Hz</div>
             </div>
          </div>

          {/* Voice Selector */}
          <div className="pt-2 border-t border-white/5">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
               <MessageSquare size={12} /> AI Voice
             </label>
             <select 
               value={settings.selectedVoiceURI || ''} 
               onChange={(e) => updateSettings({ selectedVoiceURI: e.target.value })}
               className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none [&>option]:bg-[#1a1a2e] [&>option]:text-white"
             >
                <option value="" className="bg-[#1a1a2e] text-white">Default (System)</option>
                {availableVoices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-[#1a1a2e] text-white">
                    {v.name} ({v.lang})
                  </option>
                ))}
             </select>
          </div>

          {/* Brainwave Controls */}
          {settings.binauralEnabled && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-2 border-t border-white/5">
              <div className="flex gap-2 mb-4">
                <button onClick={() => setEntType('BINAURAL')} className={`flex-1 py-2 text-xs rounded-lg border flex items-center justify-center gap-2 ${entType === 'BINAURAL' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 text-slate-400 border-white/5'}`}>
                   <Headphones size={12} /> Binaural (Headphones)
                </button>
                <button onClick={() => setEntType('ISOCHRONIC')} className={`flex-1 py-2 text-xs rounded-lg border flex items-center justify-center gap-2 ${entType === 'ISOCHRONIC' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 text-slate-400 border-white/5'}`}>
                   <Speaker size={12} /> Isochronic (Speaker)
                </button>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: currentBrainwave.color }} />
                 <div className="flex justify-between items-end mb-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider opacity-70" style={{ color: currentBrainwave.color }}>{currentBrainwave.name} State</div>
                      <div className="text-xl font-light text-white">{currentBrainwave.state}</div>
                    </div>
                    <div className="text-3xl font-thin text-white">{settings.binauralFreq} <span className="text-xs font-normal text-slate-500">Hz</span></div>
                 </div>
                 <input
                    type="range"
                    min={0.5}
                    max={40}
                    step={0.5}
                    value={settings.binauralFreq}
                    onChange={(e) => updateSettings({ binauralFreq: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white mb-3"
                 />
                 <p className="text-xs text-slate-400 leading-relaxed">
                    {currentBrainwave.desc}
                 </p>
              </div>
            </motion.div>
          )}

          {/* Breathing Controls */}
          {settings.breathingEnabled && (
            <div className="pt-2 border-t border-white/5">
               <RangeControl label="Breathing Rate" value={settings.breathingRate} min={4} max={12} step={1} onChange={(v) => updateSettings({ breathingRate: v })} formatValue={(v) => `${v} BPM`} leftLabel="Relax (4)" rightLabel="Alert (12)" />
            </div>
          )}

          {/* Audio Mixer */}
          <div className="pt-2 border-t border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mixer</h3>
            <RangeControl label="Voice Volume" value={settings.voiceVol} min={0} max={1} step={0.1} onChange={(v) => updateSettings({ voiceVol: v })} formatValue={(v) => `${Math.round(v * 100)}%`} />
            
            {settings.binauralEnabled && (
              <RangeControl label="Brainwave Volume" value={settings.binauralVol ?? 0.3} min={0} max={1} step={0.05} onChange={(v) => updateSettings({ binauralVol: v })} formatValue={(v) => `${Math.round(v * 100)}%`} />
            )}

            <RangeControl label="Ambience Volume" value={settings.ambVol} min={0} max={1} step={0.1} onChange={(v) => updateSettings({ ambVol: v })} formatValue={(v) => `${Math.round(v * 100)}%`} />
            
            <RangeControl label="Voice Speed" value={settings.speed} min={0.5} max={1.5} step={0.1} onChange={(v) => updateSettings({ speed: v })} formatValue={(v) => `${v.toFixed(1)}x`} />
            
            <RangeControl 
              label="Sentence Pause" 
              value={settings.pause} 
              min={0} 
              max={5} 
              step={0.5} 
              onChange={(v) => updateSettings({ pause: v })} 
              formatValue={(v) => `${v}s`} 
            />
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
