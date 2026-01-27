import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, HelpCircle, User, Lock, Play, Mic, Brain, Sparkles } from 'lucide-react';
import { useTrance } from '../context/TranceContext';
import { useToast } from '../context/ToastContext';
import SessionCard from '../components/SessionCard';
import Modal from '../components/Modal';

export default function Dashboard() {
  const { 
    sessions, 
    favorites, 
    navTo, 
    playSession, 
    toggleFavorite, 
    deleteSession, 
    editSession, 
    canAddSession,
    incrementPlayCount
  } = useTrance();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'ALL' | 'FAV' | 'CUSTOM'>('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [limitType, setLimitType] = useState<'STORAGE' | 'PLAY' | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'FAV') return favorites.includes(s.id);
    if (filter === 'CUSTOM') return s.category === 'Custom';
    return true;
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteSession(deleteId);
      showToast('Session deleted', 'info');
      setDeleteId(null);
    }
  };

  const handleCreate = () => {
    if (canAddSession()) {
      editSession(null);
    } else {
      setLimitType('STORAGE');
    }
  };

  const handlePlay = (id: string) => {
    if (incrementPlayCount()) {
      playSession(id);
    } else {
      setLimitType('PLAY');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col h-full bg-gradient-to-b from-[#1a1a2e] to-[#16213e]"
    >
      <div className="px-5 pt-12 pb-4 flex justify-between items-center bg-[#121212]/95 backdrop-blur-md sticky top-0 z-20 shadow-md shadow-black/20">
        <h1 className="text-2xl font-light tracking-wide text-white">TranceState</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowGuide(true)}
            className="p-2 rounded-full hover:bg-white/10 transition text-slate-300 relative group"
            title="Help & Guide"
          >
            <HelpCircle size={24} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
          </button>
          <button 
            onClick={() => navTo('PROFILE')}
            className="p-2 rounded-full hover:bg-white/10 transition text-slate-300"
            title="Profile"
          >
            <User size={24} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-5 pb-6 overflow-x-auto bg-[#121212]/95 border-b border-white/5 sticky top-[80px] z-20 scrollbar-hide">
        {(['ALL', 'FAV', 'CUSTOM'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === f 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                : 'bg-white/10 text-slate-400 hover:bg-white/20'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'FAV' ? 'Favorites' : 'My Creations'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <AnimatePresence mode='popLayout'>
          {filteredSessions.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-slate-500 mt-20"
            >
              No sessions found.
            </motion.div>
          ) : (
            filteredSessions.map(session => (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative group"
              >
                <SessionCard
                  session={session}
                  isFav={favorites.includes(session.id)}
                  onToggleFav={() => toggleFavorite(session.id)}
                  onPlay={() => handlePlay(session.id)}
                  onEdit={session.category === 'Custom' ? () => editSession(session.id) : undefined}
                  onDelete={session.category === 'Custom' ? () => setDeleteId(session.id) : undefined}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          boxShadow: ["0px 0px 0px rgba(79, 70, 229, 0.4)", "0px 0px 20px rgba(79, 70, 229, 0.8)", "0px 0px 0px rgba(79, 70, 229, 0.4)"] 
        }}
        transition={{ 
          boxShadow: { duration: 2, repeat: Infinity } 
        }}
        onClick={handleCreate}
        className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-black z-30"
      >
        <Plus size={28} />
      </motion.button>

      <Modal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        title="Delete Session?"
      >
        <div className="text-center">
          <p className="text-slate-400 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setDeleteId(null)}
              className="flex-1 py-3 rounded-full border border-slate-600 text-slate-300 hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 py-3 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold transition"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!limitType}
        onClose={() => setLimitType(null)}
        title={limitType === 'STORAGE' ? "Library Full" : "Sessions Depleted"}
      >
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Lock size={30} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {limitType === 'STORAGE' ? "Storage Limit Reached" : "Playback Limit Reached"}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            {limitType === 'STORAGE' 
              ? "You have reached the limit of 6 stored sessions (3 Default + 3 Custom). Delete an old session to create a new one, or upgrade for unlimited storage."
              : "You have used all 10 free playback credits. Upgrade to the Founder's Edition for unlimited lifetime access."
            }
          </p>
          <button 
            onClick={() => { setLimitType(null); navTo('UPGRADE'); }}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-bold shadow-lg shadow-indigo-900/50"
          >
            Unlock Unlimited Access
          </button>
        </div>
      </Modal>

      <Modal isOpen={showGuide} onClose={() => setShowGuide(false)} title="Feature Guide">
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          <GuideItem 
            icon={<Play size={20} className="text-indigo-400" />} 
            title="The Player" 
            desc="Experience advanced hypnosis sessions. Tap the 'Settings' gear inside the player to adjust voice speed, binaural beats, and background ambience mixing."
          />
          <GuideItem 
            icon={<Mic size={20} className="text-pink-400" />} 
            title="AI Script Generator" 
            desc="Tap the (+) button to create custom sessions. Select your goal, induction style, and voice type. The AI writes a personalized script for you."
          />
          <GuideItem 
            icon={<Brain size={20} className="text-teal-400" />} 
            title="Binaural Entrainment" 
            desc="Headphones recommended. We use precise frequencies to guide your brainwaves into deep relaxation (Theta), focus (Beta), or sleep (Delta)."
          />
          <GuideItem 
            icon={<Sparkles size={20} className="text-blue-400" />} 
            title="Profile & Anchors" 
            desc="Visit your Profile to set 'Anchors' (safe place, power color). The AI will weave these details into your custom scripts for deeper impact."
          />
          <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mt-4">
            <h4 className="font-bold text-indigo-300 text-sm mb-1">Quick Tip</h4>
            <p className="text-xs text-indigo-200/80">Use the 'Remix' feature in the editor to create variations of your favorite sessions.</p>
          </div>
          <button 
            onClick={() => setShowGuide(false)}
            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}

const GuideItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex gap-4 items-start p-3 hover:bg-white/5 rounded-xl transition-colors">
    <div className="mt-1 p-2 bg-white/5 rounded-lg shrink-0">{icon}</div>
    <div>
      <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);
