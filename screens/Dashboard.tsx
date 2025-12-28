import React, { useState } from 'react';
import { useTrance } from '../context/TranceContext';
import { useToast } from '../context/ToastContext';
import SessionCard from '../components/SessionCard';
import { User, Plus, Globe, Upload } from 'lucide-react';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { sessions, favorites, navTo, playSession, toggleFavorite, deleteSession, editSession, publishSession } = useTrance();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'ALL' | 'FAV' | 'CUSTOM'>('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('Anonymous');

  const displayedSessions = sessions.filter(s => {
    if (filter === 'FAV') return favorites.includes(s.id);
    if (filter === 'CUSTOM') return s.category === 'Custom';
    return true;
  });

  const confirmDelete = () => {
    if (deleteId) {
      deleteSession(deleteId);
      showToast('Session deleted', 'info');
      setDeleteId(null);
    }
  };

  const confirmPublish = () => {
    if (publishId) {
      publishSession(publishId, authorName);
      showToast('Published to Community!', 'success');
      setPublishId(null);
      navTo('DISCOVERY');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col h-full bg-gradient-to-b from-[#1a1a2e] to-[#16213e]"
    >
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex justify-between items-center bg-[#121212]/95 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-2xl font-light tracking-wide text-white">TranceState</h1>
        <div className="flex gap-2">
            <button 
                onClick={() => navTo('DISCOVERY')}
                className="p-2 rounded-full hover:bg-white/10 transition text-indigo-400"
            >
                <Globe />
            </button>
            <button 
                onClick={() => navTo('PROFILE')}
                className="p-2 rounded-full hover:bg-white/10 transition text-slate-300"
            >
                <User />
            </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 px-5 pb-6 overflow-x-auto bg-[#121212]/95 border-b border-white/5 sticky top-[80px] z-20 scrollbar-hide">
        {['ALL', 'FAV', 'CUSTOM'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
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

      {/* List */}
      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <AnimatePresence mode='popLayout'>
          {displayedSessions.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-slate-500 mt-20"
            >
              No sessions found.
            </motion.div>
          ) : (
            displayedSessions.map(session => (
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
                  onPlay={() => playSession(session.id)}
                  onEdit={session.category === 'Custom' ? () => editSession(session.id) : undefined}
                  onDelete={session.category === 'Custom' ? () => setDeleteId(session.id) : undefined}
                  onPublish={session.category === 'Custom' ? () => setPublishId(session.id) : undefined}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => editSession(null)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-black z-30"
      >
        <Plus size={28} />
      </motion.button>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Session?">
        <div className="text-center">
          <p className="text-slate-400 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-full border border-slate-600 text-slate-300 hover:bg-white/5 transition">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 py-3 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold transition">Delete</button>
          </div>
        </div>
      </Modal>

      {/* Publish Modal */}
      <Modal isOpen={!!publishId} onClose={() => setPublishId(null)} title="Publish Session">
        <div className="space-y-4">
            <p className="text-slate-400 text-sm">Share this session with the global community. Anyone will be able to play and remix it.</p>
            <input 
                type="text" 
                value={authorName} 
                onChange={(e) => setAuthorName(e.target.value)} 
                placeholder="Author Name"
                className="w-full bg-black/20 rounded-xl p-3 text-white border border-white/10 focus:border-indigo-500 outline-none"
            />
            <button onClick={confirmPublish} className="w-full py-3 bg-indigo-600 rounded-xl text-white font-medium hover:bg-indigo-500">Publish Now</button>
        </div>
      </Modal>
    </motion.div>
  );
}
