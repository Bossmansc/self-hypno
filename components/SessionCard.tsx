import React from 'react';
import { Heart, Edit2, Trash2, Upload } from 'lucide-react';
import { Session } from '../context/TranceContext';

interface Props {
  session: Session;
  isFav: boolean;
  onToggleFav: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onPlay: () => void;
}

export default function SessionCard({ session, isFav, onToggleFav, onEdit, onDelete, onPublish, onPlay }: Props) {
  return (
    <div className="group relative flex items-center bg-white/5 border border-white/5 rounded-2xl mb-4 overflow-hidden transition-all hover:bg-white/10">
      <div 
        className="flex-1 flex items-center p-4 sm:p-5 cursor-pointer min-w-0"
        onClick={onPlay}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl flex items-center justify-center text-xl sm:text-2xl mr-3 sm:mr-4 shrink-0 shadow-lg">
          {session.icon}
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-base sm:text-lg font-medium text-white truncate mb-0.5">{session.title}</h3>
          <p className="text-xs sm:text-sm text-slate-400 truncate">{session.script}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 pr-3 sm:pr-4 shrink-0 z-10">
        {onPublish && (
          <button 
            onClick={(e) => { e.stopPropagation(); onPublish(); }}
            className="p-2 rounded-full hover:bg-white/20 text-slate-400 hover:text-indigo-400 transition-colors"
            title="Publish to Community"
          >
            <Upload size={18} />
          </button>
        )}
        {onEdit && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 rounded-full hover:bg-white/20 text-slate-400 hover:text-white transition-colors"
          >
            <Edit2 size={18} />
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
          className={`p-2 rounded-full hover:bg-white/20 transition-colors ${isFav ? 'text-pink-500' : 'text-slate-400'}`}
        >
          <Heart size={18} fill={isFav ? "currentColor" : "none"} />
        </button>
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
