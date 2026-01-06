import React, { createContext, useContext, useEffect, useState } from 'react';

const DEFAULT_BACKEND_URL = "https://self-hypno-1.onrender.com";

export interface Session {
  id: string;
  title: string;
  icon: string;
  category: 'Sleep' | 'Calm' | 'Focus' | 'Custom';
  script: string;
  rating?: number;
  parentId?: string;
  createdAt?: number;
  author?: string;
  upvotes?: number;
  isPublic?: boolean;
}

export interface Settings {
  speed: number;
  voiceVol: number;
  pause: number;
  ambVol: number;
  binauralEnabled: boolean;
  binauralFreq: number;
  binauralVol: number; 
  breathingRate: number; 
  breathingEnabled: boolean; 
}

export type AIProvider = 'deepseek';

export interface UserAnchors {
  place: string;
  color: string;
  smell: string;
  success: string;
  safeObj: string;
}

export interface UserProfile {
  learningStyle: 'Visual' | 'Auditory' | 'Kinesthetic' | 'Digital';
  resistanceLevel: 'Suggestible' | 'Analytical' | 'Skeptical';
  anchors: UserAnchors;
}

interface TranceState {
  sessions: Session[];
  communitySessions: Session[];
  favorites: string[];
  currentScreen: 'DASHBOARD' | 'PLAYER' | 'EDITOR' | 'PROFILE' | 'DISCOVERY';
  activeSessionId: string | null;
  editingSessionId: string | null;
  settings: Settings;
  activeProvider: AIProvider;
  userProfile: UserProfile;
  backendUrl: string;
  navTo: (screen: 'DASHBOARD' | 'PLAYER' | 'EDITOR' | 'PROFILE' | 'DISCOVERY') => void;
  playSession: (id: string) => void;
  editSession: (id: string | null) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  setActiveProvider: (provider: AIProvider) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateUserAnchors: (anchors: Partial<UserAnchors>) => void;
  toggleFavorite: (id: string) => void;
  saveSession: (session: Session) => void;
  rateSession: (id: string, rating: number) => void; 
  deleteSession: (id: string) => void;
  publishSession: (id: string, authorName: string) => void;
  remixSession: (session: Session) => void;
  upvoteSession: (id: string) => void;
  resetData: () => void;
  importData: (data: string) => boolean;
  exportData: () => string;
}

const DEFAULT_SESSIONS: Session[] = [
  { id: '1', title: 'Deep Sleep', icon: '🌙', category: 'Sleep', script: "Relax your body. Let go of all tension. You are safe. Deep sleep is coming now." },
  { id: '2', title: 'Anxiety Relief', icon: '🌊', category: 'Calm', script: "Breathe in deeply. Hold it. Breathe out slowly. You are calm. You are in control." },
  { id: '3', title: 'Laser Focus', icon: '🧠', category: 'Focus', script: "Clear your mind. Focus on the task at hand. Distractions fade away. Your mind is sharp." }
];

const MOCK_COMMUNITY: Session[] = [
  { id: 'c1', title: 'Power Nap 20', icon: '⚡', category: 'Focus', script: 'A rapid recharge script...', author: 'SleepHacker', upvotes: 342, isPublic: true },
  { id: 'c2', title: 'Ego Dissolution', icon: '🌌', category: 'Custom', script: 'Drifting into the void...', author: 'Psychonaut', upvotes: 128, isPublic: true },
  { id: 'c3', title: 'Public Speaking', icon: '🎤', category: 'Calm', script: 'You stand tall. Your voice is steady...', author: 'CoachMike', upvotes: 89, isPublic: true },
];

const DEFAULT_SETTINGS: Settings = {
  speed: 0.9,
  voiceVol: 1.0,
  pause: 2,
  ambVol: 0.5,
  binauralEnabled: false,
  binauralFreq: 6,
  binauralVol: 0.3, 
  breathingRate: 6, 
  breathingEnabled: false
};

const DEFAULT_PROFILE: UserProfile = {
  learningStyle: 'Visual',
  resistanceLevel: 'Suggestible',
  anchors: { place: '', color: '', smell: '', success: '', safeObj: '' }
};

const TranceContext = createContext<TranceState | undefined>(undefined);

export const TranceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>(DEFAULT_SESSIONS);
  const [communitySessions, setCommunitySessions] = useState<Session[]>(MOCK_COMMUNITY);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [currentScreen, setCurrentScreen] = useState<'DASHBOARD' | 'PLAYER' | 'EDITOR' | 'PROFILE' | 'DISCOVERY'>('DASHBOARD');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [activeProvider, setActiveProviderState] = useState<AIProvider>('deepseek');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const backendUrl = DEFAULT_BACKEND_URL;

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem('trance_sessions');
      const storedCommunity = localStorage.getItem('trance_community');
      const storedFavs = localStorage.getItem('trance_favs');
      // We ignore storedProvider to enforce deepseek
      const storedProfile = localStorage.getItem('trance_user_profile');
      const storedSettings = localStorage.getItem('trance_settings'); 
      
      if (storedSessions) {
        const parsed = JSON.parse(storedSessions);
        if(parsed.length === 0) setSessions(DEFAULT_SESSIONS);
        else setSessions(parsed);
      }
      if (storedCommunity) setCommunitySessions(JSON.parse(storedCommunity));
      else setCommunitySessions(MOCK_COMMUNITY);
      if (storedFavs) setFavorites(JSON.parse(storedFavs));
      // Force deepseek
      setActiveProviderState('deepseek'); 
      if (storedProfile) setUserProfile({ ...DEFAULT_PROFILE, ...JSON.parse(storedProfile) });
      if (storedSettings) setSettings(prev => ({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) })); 
    } catch (e) { console.error("Failed to load data", e); }
  }, []);

  useEffect(() => {
    localStorage.setItem('trance_sessions', JSON.stringify(sessions));
    localStorage.setItem('trance_community', JSON.stringify(communitySessions));
    localStorage.setItem('trance_favs', JSON.stringify(favorites));
    localStorage.setItem('trance_active_provider', 'deepseek');
    localStorage.setItem('trance_user_profile', JSON.stringify(userProfile));
    localStorage.setItem('trance_settings', JSON.stringify(settings)); 
  }, [sessions, communitySessions, favorites, activeProvider, userProfile, settings]);

  const navTo = (screen: any) => setCurrentScreen(screen);
  
  const playSession = (id: string) => { 
    const session = sessions.find(s => s.id === id) || communitySessions.find(s => s.id === id);
    if(session) {
      setActiveSessionId(id); 
      navTo('PLAYER'); 
    }
  };

  const editSession = (id: string | null) => { setEditingSessionId(id); navTo('EDITOR'); };
  const updateSettings = (partial: Partial<Settings>) => setSettings(prev => ({ ...prev, ...partial }));
  const setActiveProvider = (provider: AIProvider) => setActiveProviderState(provider);
  const updateUserProfile = (profile: Partial<UserProfile>) => setUserProfile(prev => ({ ...prev, ...profile }));
  const updateUserAnchors = (anchors: Partial<UserAnchors>) => setUserProfile(prev => ({ ...prev, anchors: { ...prev.anchors, ...anchors } }));
  
  const toggleFavorite = (id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  
  const saveSession = (newSession: Session) => {
    setSessions(prev => {
      const index = prev.findIndex(s => s.id === newSession.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...newSession };
        return updated;
      }
      return [...prev, { ...newSession, createdAt: Date.now() }];
    });
  };

  const rateSession = (id: string, rating: number) => setSessions(prev => prev.map(s => s.id === id ? { ...s, rating } : s));
  
  const deleteSession = (id: string) => { setSessions(prev => prev.filter(s => s.id !== id)); if (activeSessionId === id) setActiveSessionId(null); };
  
  const publishSession = (id: string, authorName: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    const publicCopy: Session = { ...session, id: `pub_${Date.now()}`, author: authorName, upvotes: 0, isPublic: true, parentId: session.id };
    setCommunitySessions(prev => [publicCopy, ...prev]);
  };

  const remixSession = (session: Session) => {
    const remix: Session = { ...session, id: `remix_${Date.now()}`, title: `${session.title} (Remix)`, author: undefined, isPublic: false, parentId: session.id, category: 'Custom' };
    setSessions(prev => [remix, ...prev]);
    setEditingSessionId(remix.id);
    navTo('EDITOR');
  };

  const upvoteSession = (id: string) => {
    setCommunitySessions(prev => prev.map(s => s.id === id ? { ...s, upvotes: (s.upvotes || 0) + 1 } : s));
  };

  const resetData = () => {
    setSessions(DEFAULT_SESSIONS);
    setFavorites([]);
    setSettings(DEFAULT_SETTINGS);
    setUserProfile(DEFAULT_PROFILE);
    setCommunitySessions(MOCK_COMMUNITY);
  };

  const exportData = () => JSON.stringify(sessions, null, 2);
  
  const importData = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      const dataToImport = Array.isArray(parsed) ? parsed : [parsed];
      const validSessions = dataToImport.filter(s => s.id && s.title && s.script);
      
      if (validSessions.length === 0) return false;

      setSessions(prev => {
        const newSessions = [...prev];
        validSessions.forEach(importedSession => {
          const index = newSessions.findIndex(s => s.id === importedSession.id);
          if (index >= 0) newSessions[index] = importedSession; 
          else newSessions.push(importedSession); 
        });
        return newSessions;
      });
      return true;
    } catch (e) { return false; }
  };

  return (
    <TranceContext.Provider value={{
      sessions, communitySessions, favorites, currentScreen, activeSessionId, editingSessionId, settings, 
      activeProvider, userProfile, backendUrl,
      navTo, playSession, editSession, updateSettings, 
      setActiveProvider, updateUserProfile, updateUserAnchors,
      toggleFavorite, saveSession, rateSession, deleteSession,
      publishSession, remixSession, upvoteSession,
      resetData, importData, exportData
    }}>
      {children}
    </TranceContext.Provider>
  );
};

export const useTrance = () => {
  const context = useContext(TranceContext);
  if (!context) throw new Error("useTrance must be used within TranceProvider");
  return context;
};
