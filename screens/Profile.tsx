import React, { useState, useRef } from 'react';
import { useTrance, UserAnchors } from '../context/TranceContext';
import { useToast } from '../context/ToastContext';
import { X, Download, RotateCcw, FileUp, Brain, MapPin, Palette, Cpu } from 'lucide-react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';

export default function Profile() {
  const { navTo, resetData, importData, exportData, userProfile, updateUserProfile, updateUserAnchors, backendUrl } = useTrance();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeModal, setActiveModal] = useState<'NONE' | 'ASSESSMENT' | 'ANCHORS' | 'EXPORT' | 'SETTINGS'>('NONE');
  const [exportContent, setExportContent] = useState('');

  const handleAssessmentSave = (style: any, resistance: any) => {
    updateUserProfile({ learningStyle: style, resistanceLevel: resistance });
    showToast('Psychographic profile updated', 'success');
    setActiveModal('NONE');
  };

  const handleAnchorsSave = (newAnchors: UserAnchors) => {
    updateUserAnchors(newAnchors);
    showToast('Personal anchors saved', 'success');
    setActiveModal('NONE');
  };

  const handleExport = () => {
    const data = exportData();
    setExportContent(data);
    try {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trance_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      showToast('File downloaded', 'success');
    } catch (e) { }
    setActiveModal('EXPORT');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (importData(event.target?.result as string)) showToast('Imported', 'success');
      else showToast('Failed to parse', 'error');
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="fixed inset-0 flex flex-col bg-[#1a1a2e] z-50"
    >
      <div className="px-5 pt-12 pb-4 flex justify-between items-center bg-[#121212]/95 backdrop-blur-md">
        <button onClick={() => navTo('DASHBOARD')} className="p-2 rounded-full hover:bg-white/10">
          <X className="text-slate-300" />
        </button>
        <h1 className="text-xl text-white">Profile</h1>
        <div className="w-10"/>
      </div>

      <div className="p-6 flex flex-col items-center overflow-y-auto pb-20">
        {/* Header Card */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full bg-gradient-to-br from-indigo-900/40 to-purple-900/20 rounded-3xl p-8 mb-8 text-center border border-white/10">
          <h2 className="text-4xl font-thin text-white mb-2">{userProfile.learningStyle}</h2>
          <p className="text-indigo-200 font-light text-sm">{userProfile.resistanceLevel} Responder</p>
        </motion.div>

        <div className="w-full space-y-4">
          {/* AI Settings Section */}
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mb-2">System & Intelligence</div>
          
          <div className="bg-white/5 rounded-2xl border border-white/5 p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-white mb-2">
                <Cpu size={18} className="text-indigo-400" />
                <span className="font-medium">Active Intelligence</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-900/20 rounded-xl border border-indigo-500/30">
                <span className="text-sm text-indigo-200 font-bold">DeepSeek AI</span>
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] rounded uppercase tracking-wider font-bold">Connected</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Backend: <span className="font-mono text-slate-400">{backendUrl}</span>
              </p>
            </div>
          </div>

          {/* Personalization Section */}
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mt-4 mb-2">Personalization</div>
          
          <button onClick={() => setActiveModal('ASSESSMENT')} className="w-full py-4 bg-white/5 rounded-2xl text-white flex items-center px-6 gap-4 hover:bg-white/10 transition-all border border-white/5">
            <Brain className="text-pink-400" size={24} />
            <div className="text-left flex-1">
              <div className="font-medium">Psychographic Assessment</div>
              <div className="text-xs text-slate-400">Customize AI language patterns</div>
            </div>
          </button>

          <button onClick={() => setActiveModal('ANCHORS')} className="w-full py-4 bg-white/5 rounded-2xl text-white flex items-center px-6 gap-4 hover:bg-white/10 transition-all border border-white/5">
            <MapPin className="text-blue-400" size={24} />
            <div className="text-left flex-1">
              <div className="font-medium">Personal Anchors</div>
              <div className="text-xs text-slate-400">Safe place, colors, smells</div>
            </div>
          </button>

          {/* Data Section */}
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2 mt-6 mb-2">Data & Backup</div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button onClick={handleExport} className="w-full py-4 bg-white/5 rounded-2xl text-slate-300 hover:bg-white/10 flex flex-col items-center justify-center gap-2 border border-white/5">
              <Download size={20} /> <span className="text-xs">Backup</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-white/5 rounded-2xl text-slate-300 hover:bg-white/10 flex flex-col items-center justify-center gap-2 border border-white/5">
              <FileUp size={20} /> <span className="text-xs">Import</span>
            </button>
          </div>

          <button onClick={() => { if(confirm("Reset Everything?")) resetData(); }} className="w-full py-4 border border-red-500/20 text-red-400 rounded-2xl hover:bg-red-500/10 flex items-center justify-center gap-2 mt-4">
            <RotateCcw size={18} /> Reset App
          </button>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,.txt" className="hidden" />
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={activeModal === 'ASSESSMENT'} onClose={() => setActiveModal('NONE')} title="Psychographic Profile">
        <AssessmentForm initialStyle={userProfile.learningStyle} initialRes={userProfile.resistanceLevel} onSave={handleAssessmentSave} />
      </Modal>

      <Modal isOpen={activeModal === 'ANCHORS'} onClose={() => setActiveModal('NONE')} title="Personal Anchors">
        <AnchorsForm initialAnchors={userProfile.anchors} onSave={handleAnchorsSave} />
      </Modal>

      <Modal isOpen={activeModal === 'EXPORT'} onClose={() => setActiveModal('NONE')} title="Backup Data">
        <textarea readOnly value={exportContent} className="w-full h-40 bg-black/20 rounded-xl p-3 text-xs text-slate-300 mb-4 font-mono border border-white/10" />
        <button onClick={() => { navigator.clipboard.writeText(exportContent); showToast('Copied', 'success'); }} className="w-full py-3 bg-indigo-600 rounded-xl text-white">Copy Code</button>
      </Modal>
    </motion.div>
  );
}

const AssessmentForm = ({ initialStyle, initialRes, onSave }: any) => {
  const [style, setStyle] = useState(initialStyle);
  const [res, setRes] = useState(initialRes);

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm text-slate-400 block mb-3">How do you prefer to relax?</label>
        <div className="grid grid-cols-2 gap-2">
          {['Visual', 'Auditory', 'Kinesthetic', 'Digital'].map(s => (
            <button key={s} onClick={() => setStyle(s)} className={`p-3 rounded-xl border text-sm text-left transition-all ${style === s ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400'}`}>
              <div className="font-bold">{s}</div>
              <div className="text-[10px] opacity-70">
                {s==='Visual' && 'Imagery & Scenes'}
                {s==='Auditory' && 'Sounds & Voice'}
                {s==='Kinesthetic' && 'Feeling & Touch'}
                {s==='Digital' && 'Logic & Facts'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-3">How do you process suggestions?</label>
        <div className="space-y-2">
          {['Suggestible', 'Analytical', 'Skeptical'].map(r => (
            <button key={r} onClick={() => setRes(r)} className={`w-full p-3 rounded-xl border text-sm flex justify-between items-center transition-all ${res === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400'}`}>
              <span>{r}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onSave(style, res)} className="w-full py-3 bg-indigo-600 rounded-xl text-white font-medium hover:bg-indigo-500">Save Profile</button>
    </div>
  );
};

const AnchorsForm = ({ initialAnchors, onSave }: any) => {
  const [anchors, setAnchors] = useState<UserAnchors>(initialAnchors);
  const handleChange = (k: keyof UserAnchors, v: string) => setAnchors(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 mb-2">The AI will weave these specific details into your scripts for deeper effect.</p>
      <Input label="Safe/Calm Place" value={anchors.place} onChange={v => handleChange('place', v)} placeholder="e.g. Grandma's Garden" icon={<MapPin size={14} />} />
      <Input label="Power Color" value={anchors.color} onChange={v => handleChange('color', v)} placeholder="e.g. Royal Blue" icon={<Palette size={14} />} />
      <Input label="Comforting Smell" value={anchors.smell} onChange={v => handleChange('smell', v)} placeholder="e.g. Lavender, Old Books" />
      <Input label="Success Memory" value={anchors.success} onChange={v => handleChange('success', v)} placeholder="e.g. Winning the race" />
      <Input label="Protective Object" value={anchors.safeObj} onChange={v => handleChange('safeObj', v)} placeholder="e.g. A heavy blanket" />
      
      <button onClick={() => onSave(anchors)} className="w-full py-3 bg-indigo-600 rounded-xl text-white font-medium hover:bg-indigo-500 mt-4">Save Anchors</button>
    </div>
  );
};

const Input = ({ label, value, onChange, placeholder, icon }: any) => (
  <div>
    <label className="text-xs text-slate-500 mb-1 flex items-center gap-1">{icon} {label}</label>
    <input className="w-full bg-black/20 rounded-lg p-3 text-sm text-white border border-white/5 focus:border-indigo-500 outline-none" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);
