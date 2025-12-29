import React, { useState, useEffect } from 'react';
import { useTrance, UserProfile } from '../context/TranceContext';
import { useToast } from '../context/ToastContext';
import { X, Wand2, Save, ArrowLeft, RefreshCw, AlertTriangle, FileText, Check, LayoutTemplate, Activity, Split, BarChart2, Brain, Wind, Thermometer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCRIPT_TEMPLATES, CATEGORIES, ScriptTemplate } from '../data/templates';
import Modal from '../components/Modal';

const GOALS = ['Sleep Improvement', 'Anxiety Reduction', 'Confidence Boost', 'Focus Enhancement', 'Habit Change', 'Pain Management', 'Custom'];
const METAPHORS = ['Nature/Water', 'Mechanical', 'Journey', 'Body-awareness', 'Custom'];
const VOICES = ['Nurturing', 'Authoritative', 'Neutral', 'Coaching'];
const LENGTHS = ['5 min', '10 min', '15 min', '20 min'];
const ICONS = ['🧘', '🌙', '🧠', '🌿', '🔥', '🌊', '⭐', '👁️', '🔮', '💤'];
const NEGATIVE_WORDS = /\b(no|not|don't|can't|won't|never|pain|anxiety|fear|hurt|stop|quit)\b/gi;
const VISUAL_WORDS = /\b(see|look|vision|bright|color|picture|imagine|visualize|clear|light)\b/gi;
const AUDITORY_WORDS = /\b(hear|sound|listen|voice|music|quiet|loud|silence|tone)\b/gi;
const KINESTHETIC_WORDS = /\b(feel|touch|warm|cool|heavy|light|relax|soft|hard|smooth|drift)\b/gi;

interface ScriptConfig {
  goal: string;
  customGoal: string;
  intensity: number;
  metaphor: string;
  customMetaphor: string;
  voice: string;
  length: string;
  features: {
    trigger: boolean;
    binaural: boolean;
    pmr: boolean;
    future: boolean;
    olfactory: boolean; 
    thermal: boolean; 
  };
}

const INITIAL_CONFIG: ScriptConfig = {
  goal: 'Sleep Improvement',
  customGoal: '',
  intensity: 50,
  metaphor: 'Nature/Water',
  customMetaphor: '',
  voice: 'Nurturing',
  length: '10 min',
  features: { trigger: false, binaural: false, pmr: true, future: false, olfactory: false, thermal: false }
};

interface AnalysisResult {
  wordCount: number;
  readTime: number;
  negativeCount: number;
  visualCount: number;
  auditoryCount: number;
  kinestheticCount: number;
  score: number;
}

export default function Editor() {
  const { navTo, saveSession, sessions, editingSessionId, activeProvider, userProfile, backendUrl } = useTrance();
  const { showToast } = useToast();
  const [step, setStep] = useState<'BUILD' | 'TEMPLATES' | 'EDIT'>('BUILD');
  const [config, setConfig] = useState<ScriptConfig>(INITIAL_CONFIG);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🧘');
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  useEffect(() => {
    if (editingSessionId) {
      const session = sessions.find(s => s.id === editingSessionId);
      if (session) {
        setTitle(session.title);
        setScript(session.script);
        setIcon(session.icon);
        setStep('EDIT'); 
      }
    }
  }, [editingSessionId, sessions]);

  const handleConfigChange = (key: keyof ScriptConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleFeature = (key: keyof ScriptConfig['features']) => {
    setConfig(prev => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] }
    }));
  };

  const analyzeScript = () => {
    const text = script;
    const wordCount = text.trim().split(/\s+/).length;
    const negativeCount = (text.match(NEGATIVE_WORDS) || []).length;
    const visualCount = (text.match(VISUAL_WORDS) || []).length;
    const auditoryCount = (text.match(AUDITORY_WORDS) || []).length;
    const kinestheticCount = (text.match(KINESTHETIC_WORDS) || []).length;
    
    let score = 100;
    score -= (negativeCount * 5);
    score += Math.min(20, (visualCount + auditoryCount + kinestheticCount) / 2);
    score = Math.min(100, Math.max(0, score));

    setAnalysis({
      wordCount,
      readTime: Math.ceil(wordCount / 110),
      negativeCount,
      visualCount,
      auditoryCount,
      kinestheticCount,
      score
    });
    setShowAnalyzer(true);
  };

  const loadTemplate = (t: ScriptTemplate) => {
    setTitle(t.title);
    setScript(t.content);
    setStep('EDIT');
    showToast('Template loaded. Please fill in placeholders.', 'info');
  };

  const buildPrompt = () => {
    const finalGoal = config.goal === 'Custom' ? config.customGoal : config.goal;
    const finalMetaphor = config.metaphor === 'Custom' ? config.customMetaphor : config.metaphor;
    const minutes = parseInt(config.length);
    const targetWords = minutes * 110;
    const intensityLabel = config.intensity < 33 ? "Light" : config.intensity < 66 ? "Medium" : "Deep";

    let featuresList = [];
    if(config.features.pmr) featuresList.push("Begin with Progressive Muscle Relaxation");
    if(config.features.binaural) featuresList.push("Include [BINAURAL: X Hz] markers for audio engine");
    if(config.features.trigger) featuresList.push("Install post-hypnotic trigger");
    if(config.features.future) featuresList.push("Include future pacing");
    
    // Inject User Profile Anchors
    const anchors = userProfile.anchors;
    if(anchors.place) featuresList.push(`Safe Place: ${anchors.place}`);
    if(anchors.color) featuresList.push(`Power Color: ${anchors.color}`);
    if(anchors.smell && config.features.olfactory) featuresList.push(`Olfactory Cue: ${anchors.smell}`);
    if(anchors.safeObj) featuresList.push(`Protective Object: ${anchors.safeObj}`);
    
    // Inject Learning Style
    let styleInstruction = "";
    switch(userProfile.learningStyle) {
      case 'Visual': styleInstruction = "Use vivid visual imagery (colors, light, scenes)."; break;
      case 'Auditory': styleInstruction = "Focus on sounds, rhythm, and silence."; break;
      case 'Kinesthetic': styleInstruction = "Focus on physical sensations, weight, warmth, and texture."; break;
      case 'Digital': styleInstruction = "Use logical, structured, and cause-effect language."; break;
    }

    // Inject Resistance Level
    let resistanceInstruction = "";
    switch(userProfile.resistanceLevel) {
      case 'Suggestible': resistanceInstruction = "Use direct, authoritative suggestions."; break;
      case 'Analytical': resistanceInstruction = "Use confusion techniques or 'the conscious mind may drift while the unconscious listens'."; break;
      case 'Skeptical': resistanceInstruction = "Use permissive language ('You may find...', 'I wonder if...'). Avoid commands."; break;
    }

    const topSessions = sessions.filter(s => (s.rating || 0) >= 4).map(s => s.title).slice(0, 3);
    const memoryNote = topSessions.length > 0 ? `User responded well to these past sessions: ${topSessions.join(', ')}.` : "";

    return `Write a hypnosis script.
    **USER PROFILE:**
    - Learning Style: ${userProfile.learningStyle} (${styleInstruction})
    - Resistance: ${userProfile.resistanceLevel} (${resistanceInstruction})
    
    **SESSION CONTEXT:**
    - Goal: ${finalGoal}
    - Duration: ${minutes} min (~${targetWords} words)
    - Metaphor: ${finalMetaphor}
    - Voice: ${config.voice}
    - Depth: ${intensityLabel}
    - Required Elements: ${featuresList.join(', ')}
    
    **PERSONAL HISTORY:**
    ${memoryNote}
    
    **FORMATTING:**
    - Use [PAUSE X] tags for silence (e.g. [PAUSE 5]).
    - Write in present tense.
    - NO intro text, NO markdown code blocks. Just the raw script.`;
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    const userPrompt = buildPrompt();
    const systemPrompt = "You are an expert clinical hypnotherapist who adapts perfectly to user psychology.";

    try {
      // Force backend usage for production security
      const endpoint = `${backendUrl}/generate`;
      
      console.log(`Generating via Secure Backend: ${endpoint}`);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          provider: activeProvider, 
          // api_key is NOT sent. The backend uses its own environment variables.
          system_prompt: systemPrompt, 
          user_prompt: userPrompt 
        })
      });

      if(!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server Error: ${errorText}`);
      }
      
      const data = await res.json();
      const generatedText = data.content;

      if(!generatedText) throw new Error("Received empty response from AI");
      
      setScript(generatedText);
      if(!title) setTitle(`${config.goal} (${config.length})`);
      setStep('EDIT');
      showToast('Personalized script generated', 'success');

    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = (asVariation = false) => {
    if (!title.trim()) return showToast('Please enter a title', 'error');
    if (!script.trim()) return showToast('Please enter a script', 'error');

    let finalTitle = title;
    let finalId = editingSessionId || Date.now().toString();

    if (asVariation) {
      finalTitle = `${title} (Var B)`;
      finalId = Date.now().toString();
    }

    saveSession({
      id: finalId,
      title: finalTitle,
      script,
      icon,
      category: 'Custom',
      parentId: asVariation ? editingSessionId || undefined : undefined
    });

    showToast(asVariation ? 'Variation saved' : 'Session saved', 'success');
    navTo('DASHBOARD');
  };

  const wordCount = script.trim().split(/\s+/).length;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#1a1a2e] z-50 overflow-hidden">
      {/* HEADER */}
      <div className="px-5 pt-12 pb-4 flex justify-between items-center bg-[#121212]/95 backdrop-blur-md border-b border-white/5 z-20">
        <button onClick={() => step !== 'BUILD' ? setStep('BUILD') : navTo('DASHBOARD')} className="p-2 rounded-full hover:bg-white/10">
          {step !== 'BUILD' ? <ArrowLeft className="text-slate-300" /> : <X className="text-slate-300" />}
        </button>
        <div className="flex gap-2 bg-white/5 rounded-full p-1">
          <button onClick={() => setStep('BUILD')} className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${step === 'BUILD' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>AI BUILD</button>
          <button onClick={() => setStep('TEMPLATES')} className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${step === 'TEMPLATES' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>TEMPLATES</button>
          <button onClick={() => setStep('EDIT')} className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${step === 'EDIT' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>EDITOR</button>
        </div>
        <button onClick={() => handleSave(false)} className="p-2 rounded-full hover:bg-white/10 text-indigo-400">
          <Save size={20} />
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
        <AnimatePresence mode='wait'>
          
          {/* BUILD MODE */}
          {step === 'BUILD' && (
            <motion.div key="build" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-8 max-w-2xl mx-auto">
              
              <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="text-indigo-400" size={20} />
                  <div>
                    <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider">AI Personalization</div>
                    <div className="text-sm text-white">{userProfile.learningStyle} • {userProfile.resistanceLevel}</div>
                  </div>
                </div>
                <button onClick={() => navTo('PROFILE')} className="text-xs text-indigo-400 underline">Customize</button>
              </div>

              <Section title="1. Objective">
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map(g => (<SelectBtn key={g} label={g} selected={config.goal === g} onClick={() => handleConfigChange('goal', g)} />))}
                </div>
                {config.goal === 'Custom' && (
                  <input type="text" placeholder="Custom Goal..." value={config.customGoal} onChange={(e) => handleConfigChange('customGoal', e.target.value)} className="w-full mt-2 bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" />
                )}
              </Section>

              <Section title="2. Intensity">
                <input type="range" min="0" max="100" value={config.intensity} onChange={(e) => handleConfigChange('intensity', Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              </Section>

              <Section title="3. Style">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {METAPHORS.map(m => (<SelectBtn key={m} label={m} selected={config.metaphor === m} onClick={() => handleConfigChange('metaphor', m)} />))}
                </div>
                <div className="h-4" />
                <div className="flex gap-2">
                  {VOICES.map(v => (<SelectBtn key={v} label={v} selected={config.voice === v} onClick={() => handleConfigChange('voice', v)} />))}
                </div>
              </Section>

              <Section title="4. Duration">
                <div className="flex gap-2">
                   {LENGTHS.map(l => (<SelectBtn key={l} label={l} selected={config.length === l} onClick={() => handleConfigChange('length', l)} />))}
                </div>
              </Section>

              <Section title="5. Features & Sensory">
                <div className="space-y-3">
                  <Toggle label="Progressive Muscle Relaxation" checked={config.features.pmr} onChange={() => toggleFeature('pmr')} />
                  <Toggle label="Post-Hypnotic Trigger" checked={config.features.trigger} onChange={() => toggleFeature('trigger')} />
                  <Toggle label="Future Pacing" checked={config.features.future} onChange={() => toggleFeature('future')} />
                  <Toggle label="Binaural Markers" checked={config.features.binaural} onChange={() => toggleFeature('binaural')} />
                  
                  <div className="h-px bg-white/5 my-2" />
                  <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Sensory Boost</div>
                  
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleFeature('olfactory')}>
                    <span className={`text-sm flex items-center gap-2 ${config.features.olfactory?'text-white':'text-slate-400'}`}>
                      <Wind size={14} /> Olfactory Suggestions
                    </span>
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${config.features.olfactory?'bg-indigo-500':'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.features.olfactory?'left-6':'left-1'}`} /></div>
                  </div>

                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleFeature('thermal')}>
                    <span className={`text-sm flex items-center gap-2 ${config.features.thermal?'text-white':'text-slate-400'}`}>
                      <Thermometer size={14} /> Thermal Suggestions
                    </span>
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${config.features.thermal?'bg-indigo-500':'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.features.thermal?'left-6':'left-1'}`} /></div>
                  </div>
                </div>
              </Section>

              <div className="h-20" />
            </motion.div>
          )}

          {/* TEMPLATES MODE */}
          {step === 'TEMPLATES' && (
            <motion.div key="templates" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 max-w-2xl mx-auto">
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === c ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {SCRIPT_TEMPLATES.filter(t => t.category === selectedCategory).map(t => (
                  <div key={t.id} onClick={() => loadTemplate(t)} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer border border-white/5 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">{t.title}</h3>
                      <LayoutTemplate size={16} className="text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{t.content}</p>
                    <div className="flex gap-2 mt-3">
                      {t.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded bg-black/20 text-[10px] text-indigo-300">{tag}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* EDIT MODE */}
          {step === 'EDIT' && (
            <motion.div key="edit" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col h-full max-w-4xl mx-auto">
              <div className="p-4 grid grid-cols-[auto_1fr] gap-4 items-center bg-[#1a1a2e]">
                <div className="flex gap-2 overflow-x-auto max-w-[200px] scrollbar-hide p-1">
                  {ICONS.map(i => (
                    <button key={i} onClick={() => setIcon(i)} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 transition-all ${icon === i ? 'bg-indigo-600 shadow-lg' : 'bg-white/5 hover:bg-white/10'}`}>
                      {i}
                    </button>
                  ))}
                </div>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Session Title" className="w-full bg-transparent text-xl font-light text-white placeholder:text-slate-600 outline-none border-b border-white/10 focus:border-indigo-500 pb-2 transition-all" />
              </div>
              
              <div className="flex-1 relative">
                <textarea 
                  value={script} 
                  onChange={(e) => setScript(e.target.value)} 
                  className="w-full h-full bg-[#121212]/50 p-6 text-slate-300 text-lg font-light leading-relaxed resize-none outline-none focus:bg-[#121212]/80 transition-colors" 
                  placeholder="Your script goes here..." 
                />
              </div>

              {/* Toolbar */}
              <div className="p-4 bg-[#121212] border-t border-white/10 flex justify-between items-center">
                <div className="text-xs text-slate-500 font-mono">
                  {wordCount} words • ~{Math.ceil(wordCount / 110)} mins
                </div>
                <div className="flex gap-3">
                  <button onClick={analyzeScript} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
                    <Activity size={16} /> <span className="text-xs">Analyze</span>
                  </button>
                  {editingSessionId && (
                    <button onClick={() => handleSave(true)} className="p-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors flex items-center gap-2">
                      <Split size={16} /> <span className="text-xs">Save Variant</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* GENERATE BUTTON */}
      {step === 'BUILD' && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center px-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={generateWithAI}
            disabled={isGenerating}
            className={`w-full max-w-md py-4 rounded-xl font-bold shadow-xl shadow-indigo-900/50 flex items-center justify-center gap-3 transition-all ${isGenerating ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110'}`}
          >
            {isGenerating ? (
              <> <RefreshCw className="animate-spin" /> Generating... </>
            ) : (
              <> <Wand2 /> Generate Script </>
            )}
          </motion.button>
        </div>
      )}

      {/* ANALYSIS MODAL */}
      <Modal isOpen={showAnalyzer} onClose={() => setShowAnalyzer(false)} title="Script Analysis">
        {analysis && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#334155" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={analysis.score > 80 ? "#10b981" : analysis.score > 50 ? "#f59e0b" : "#ef4444"} strokeWidth="3" strokeDasharray={`${analysis.score}, 100`} />
                </svg>
                <span className="absolute text-xl font-bold text-white">{Math.round(analysis.score)}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Hypnotic Potency Score</h3>
                <p className="text-xs text-slate-400">Based on sensory language density and positive phrasing.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Visual Words" value={analysis.visualCount} color="text-pink-400" />
              <StatBox label="Auditory Words" value={analysis.auditoryCount} color="text-blue-400" />
              <StatBox label="Kinesthetic Words" value={analysis.kinestheticCount} color="text-emerald-400" />
              <StatBox label="Negative Words" value={analysis.negativeCount} color="text-red-400" alert={analysis.negativeCount > 3} />
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-xs text-slate-500 uppercase font-bold mb-2">Recommendations</div>
              <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                {analysis.negativeCount > 0 && <li>Replace negative words like "don't" or "pain" with positive frames.</li>}
                {(analysis.visualCount + analysis.auditoryCount + analysis.kinestheticCount) < 10 && <li>Add more sensory details to deepen immersion.</li>}
                {analysis.readTime > 20 && <li>Consider breaking this script into two sessions.</li>}
                {analysis.score > 90 && <li className="text-emerald-400">Excellent script structure!</li>}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const SelectBtn = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${selected ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'}`}>
    {label}
  </button>
);

const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
  <div onClick={onChange} className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-white/5">
    <span className={`text-sm ${checked ? 'text-white' : 'text-slate-400'}`}>{label}</span>
    <div className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-700'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </div>
  </div>
);

const StatBox = ({ label, value, color, alert }: any) => (
  <div className={`p-3 rounded-xl border ${alert ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5'}`}>
    <div className="text-xs text-slate-500">{label}</div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
);
