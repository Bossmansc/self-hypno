import React, { useState } from 'react';
import { useTrance } from '../context/TranceContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Search, Heart, Copy, Play, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Discovery() {
  const { navTo, communitySessions, playSession, remixSession, upvoteSession } = useTrance();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState('All');

  const filteredSessions = communitySessions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.author && s.author.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = activeTag === 'All' || s.category === activeTag;
    return matchesSearch && matchesTag;
  });

  const handleRemix = (session: any) => {
    remixSession(session);
    showToast('Session remixed! Opened in Editor.', 'success');
  };

  const handleUpvote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    upvoteSession(id);
  };

  const TAGS = ['All', 'Sleep', 'Calm', 'Focus', 'Custom'];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full bg-[#1a1a2e]"
    >
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4 bg-[#121212]/95 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
        <button onClick={() => navTo('DASHBOARD')} className="p-2 rounded-full hover:bg-white/10 transition text-slate-300">
          <ArrowLeft />
        </button>
        <h1 className="text-xl font-medium text-white">Community Feed</h1>
      </div>

      {/* Search & Filter */}
      <div className="p-5 pb-0">
        <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <input 
                type="text" 
                placeholder="Search scripts..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:bg-white/10 outline-none transition-colors"
            />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {TAGS.map(tag => (
                <button 
                    key={tag} 
                    onClick={() => setActiveTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTag === tag ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                    {tag}
                </button>
            ))}
        </div>
      </div>

      {/* Grid Feed */}
      <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 gap-4">
        {filteredSessions.map(session => (
            <motion.div 
                key={session.id}
                layout
                className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors cursor-pointer group"
                onClick={() => playSession(session.id)}
            >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-xl">
                            {session.icon}
                        </div>
                        <div>
                            <h3 className="font-medium text-white leading-tight">{session.title}</h3>
                            <p className="text-xs text-indigo-400">by {session.author || 'Anonymous'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => handleUpvote(e, session.id)} 
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-black/20"
                        >
                            <ThumbsUp size={14} /> {session.upvotes || 0}
                        </button>
                    </div>
                </div>
                
                <p className="text-sm text-slate-400 line-clamp-2 mb-4 font-light">
                    {session.script}
                </p>

                <div className="flex gap-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); playSession(session.id); }}
                        className="flex-1 py-2 bg-white text-black rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200"
                    >
                        <Play size={14} fill="black" /> Play
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleRemix(session); }}
                        className="flex-1 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-600/30"
                    >
                        <Copy size={14} /> Remix
                    </button>
                </div>
            </motion.div>
        ))}
        {filteredSessions.length === 0 && (
            <div className="text-center text-slate-500 mt-10">No sessions found.</div>
        )}
      </div>
    </motion.div>
  );
}
