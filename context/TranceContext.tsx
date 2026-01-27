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
  selectedVoiceURI?: string; 
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
  favorites: string[];
  currentScreen: 'DASHBOARD' | 'PLAYER' | 'EDITOR' | 'PROFILE' | 'UPGRADE';
  activeSessionId: string | null;
  editingSessionId: string | null;
  settings: Settings;
  activeProvider: AIProvider;
  userProfile: UserProfile;
  backendUrl: string;
  isPro: boolean;
  totalGenerations: number;
  totalPlays: number;
  navTo: (screen: 'DASHBOARD' | 'PLAYER' | 'EDITOR' | 'PROFILE' | 'UPGRADE') => void;
  playSession: (id: string) => void;
  editSession: (id: string | null) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  setActiveProvider: (provider: AIProvider) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateUserAnchors: (anchors: Partial<UserAnchors>) => void;
  toggleFavorite: (id: string) => void;
  saveSession: (session: Session) => boolean; 
  rateSession: (id: string, rating: number) => void; 
  deleteSession: (id: string) => void;
  remixSession: (session: Session) => void;
  resetData: () => void;
  importData: (data: string) => boolean;
  exportData: () => string;
  upgradeToPro: () => void;
  incrementGenCount: () => boolean; 
  incrementPlayCount: () => boolean; 
  canAddSession: () => boolean;
}

const DEFAULT_SETTINGS: Settings = {
  speed: 1.0,
  voiceVol: 1.0,
  pause: 0,
  ambVol: 0.3,
  binauralEnabled: false,
  binauralFreq: 7.8,
  binauralVol: 0.3,
  breathingRate: 6,
  breathingEnabled: false
};

const DEFAULT_PROFILE: UserProfile = {
  learningStyle: 'Visual',
  resistanceLevel: 'Suggestible',
  anchors: {
    place: '',
    color: '',
    smell: '',
    success: '',
    safeObj: ''
  }
};

const DEFAULT_SESSIONS: Session[] = [
  { 
    id: '1', 
    title: 'The Sleep Reservoir', 
    icon: '🌙', 
    category: 'Sleep', 
    script: `Now, sit comfortably and close your eyes. Listen to my voice and follow my instructions completely. We begin with relaxation. Focus on the muscles in your feet. Visualize a switch, a heavy, industrial switch, labeled ‘TENSION’. Now, flip it off. Feel all tension drain from your feet, as if released through a valve. They become heavy and still. [PAUSE 3]
Now, move to your calves and thighs. See that same switch. Flip it to the OFF position. A wave of deep, mechanical relaxation engages. All motors in your legs power down. They are inert, weighty components, perfectly at rest. [PAUSE 3]
Direct your attention to your stomach and chest. Locate the control panel. See the dial for ‘Breathing’. Turn it to ‘AUTOMATIC – SMOOTH’. Your breathing now regulates itself, slow and steady, a perfect rhythmic pump. [PAUSE 3]
Now, your shoulders, arms, and hands. Identify the tension circuits. One by one, disconnect them. Hear the faint hum cease. Your arms are like weighted rods, resting heavily. Your fingers are still. [PAUSE 3]
Finally, the muscles of your neck, your jaw, your face, and your scalp. Find the master tension release lever. Pull it. Feel a final, satisfying click as every last bit of active tension disengages. Your entire body is now a peaceful, silent machine in standby mode. [PAUSE 5]
[BINAURAL: 2 Hz]
As your body rests, turn your mind’s eye to a screen. On this screen, you see a brilliant, white, numerical display. Right now, it shows the number 10. This is your wakeful mind. With each breath you exhale, the number will decrease. See it change. With your next breath… 9. Your thoughts begin to slow their processing speed. 8… 7… with each number, your conscious mind powers down another segment. 6… 5… drifting deeper into calm. 4… 3… most systems are now offline. 2… 1… and finally… 0. Zero. A state of perfect, blank, receptive stillness. [PAUSE 5]
Now, visualize a reservoir. This is your deep sleep reservoir. See its current level. Tonight, you will fill it completely. Picture a valve opening above it. From this valve pours a thick, indigo blue liquid. It is the very essence of deep, restorative sleep. Watch as this tranquil blue liquid flows steadily, smoothly, filling the reservoir. With every drop that falls, your nervous system calibrates itself for perfect sleep. The reservoir fills… halfway… three-quarters full… until it reaches the very brim, full and still. This is your sleep tonight. Deep, continuous, and restoring. [PAUSE 5]
I will now install your trigger. When you are in your bed, ready for sleep, you will simply touch your thumb and forefinger together on either hand and take one deep breath. The moment you do this, it will activate this entire program. Your body will switch to standby. Your mind will display zero. And your sleep reservoir will begin filling instantly with that deep, indigo blue sleep. This will happen automatically, every single night. Nod your head slightly when you have accepted this command. [PAUSE 5]
Good.
Now, future pace. See yourself tonight. You are in your bed. You feel the comfort of the sheets. You decide it is time to sleep. You bring your thumb and forefinger together… and breathe in deeply… and as you exhale, watch the entire process engage. Feel the heaviness flood your limbs. See your mind’s screen go blank to zero. Feel the profound, indigo calm of deep sleep washing through you. You drift off, effortlessly, and sleep soundly through the entire night. You wake refreshed, at your perfect time, feeling restored. See this clearly. [PAUSE 5]
[BINAURAL: 6 Hz]
This is your new pattern. Effective tonight and every night. I will now count from one to five. At five, you will be fully alert, refreshed, and remembering everything with perfect clarity. One… coming up gently. Two… feeling alert and peaceful. Three… aware of your surroundings. Four… eyes beginning to stir. And Five. Eyes open. Fully awake.`
  },
  { 
    id: '2', 
    title: 'Anxiety Relief', 
    icon: '🌊', 
    category: 'Calm', 
    script: `Now, make yourself comfortable... and allow your eyes to close gently. Take a deep breath in... and as you exhale, begin to let go of the day. We will start by relaxing your body completely.
Focus your attention on your feet. Visualize a warm, golden light gathering at the soles of your feet. This light melts away all tension, like ice melting into a calm, clear pool. Feel your feet becoming heavy and relaxed. [PAUSE 3]
Now, let that warm, golden light flow up into your ankles and calves. See the muscles softening, all tightness dissolving and flowing down into the earth. Your legs are becoming loose, limp, and perfectly at ease. [PAUSE 3]
Feel the light rising now into your thighs and hips. A sensation of deep, heavy comfort spreads through you. All the effort, all the holding on, just lets go. Your entire lower body is sinking into a state of profound peace. [PAUSE 3]
Let the relaxation rise into your stomach and chest. With every breath you take, you breathe in calm... and breathe out any worry or strain. See a soft, blue light joining the gold in your chest, cool and soothing, like a gentle lake under a summer sky. Your heartbeat is calm and steady. [PAUSE 3]
Now, direct that relaxation into your shoulders, down your arms, and all the way to your fingertips. Visualize any remaining tension as dark dust, and see it being washed away by a clear, sparkling stream flowing down your arms and out through your fingers. Your arms are heavy and still. [PAUSE 3]
Finally, let that wave of relaxation flow up your neck... into your face... and over your scalp. Every muscle smooths out. Your jaw is slack. Your forehead is smooth. Your mind is becoming clear and open. Your entire body is now deeply, beautifully relaxed. [BINAURAL: 4 Hz]
And as your body rests, your mind can journey. In your mind's eye, I want you to picture yourself standing at the edge of a beautiful, tranquil forest. The air is fresh and clean. You see a path before you, dappled with sunlight, and you begin to walk.
With each step, you go deeper into calm. You hear the gentle rustle of leaves. You see vibrant greens, rich browns, and flashes of colorful wildflowers. You are safe here. You are protected here. [PAUSE 5]
Soon, you hear the sound of water. A soft, steady, rhythmic sound. You follow the path and it leads you to a magnificent waterfall. It cascades down mossy rocks into a deep, clear, placid pool. The mist in the air glistens with tiny rainbows.
This waterfall is a waterfall of peace. It washes away anxiety. It carries away restless thoughts. You sit on a smooth, warm stone beside the pool and simply watch and listen. [BINAURAL: 8 Hz]
With every breath, you absorb the serenity of this place. See any anxious thought or feeling as a leaf, or a twig, floating on the surface of your mind. Watch as the gentle current of this peaceful water carries it over the waterfall and away... out of sight... gone. Your mind is becoming as clear and still as the deep pool. Calm. Quiet. Centered. [PAUSE 10]
And this feeling of deep, inner calm can be with you whenever you need it. From this moment forward, whenever you are in your daily life and you wish to return to this perfect peace, all you need to do is place your hand gently over your heart, take one deep breath, and say the word "Serenity" silently to yourself.
When you do this, you will instantly reconnect with this feeling. A wave of calm will flow through you, just like the mist from the waterfall. Your mind will clear. Your body will relax. You will feel centered, capable, and at peace. This is your anchor. Your trigger. "Serenity." [PAUSE 5]
Now, I want you to see yourself tomorrow. See yourself encountering a moment that might have once stirred anxiety. But now, you are calm. You feel your hand come to your heart. You take that breath. You think "Serenity." And immediately, you are here by the water. Centered. Strong. At ease. You handle the moment with a quiet confidence, and the calm remains with you as you move through your day. [PAUSE 5]
Your mind and body are learning this now. This peace is integrating. It is becoming your natural state.
Soon, I will begin counting from one to five. With each number, you will become more alert, more present, and bring all of this wonderful, calm energy back with you.
One... beginning to return, feeling refreshed.
Two... your awareness of the room returns, gentle and easy.
Three... feeling alert, calm, and peaceful in mind and body.
Four... filled with a deep, lasting sense of serenity.
Five... eyes open, fully alert, and feeling wonderfully calm.`
  },
  { 
    id: '3', 
    title: 'The Command Center', 
    icon: '🧠', 
    category: 'Focus', 
    script: `Close your eyes now. Take a deep breath in, and as you exhale, let go of any need to control this process. I will guide you. Your only task is to listen and follow my voice.
Begin by bringing your attention to your feet. Tense the muscles in your feet and toes. Hold that tension. [PAUSE 2] And now, release. Feel that wave of relaxation flow upward. Now, tense the muscles in your calves and thighs. Squeeze them tight. [PAUSE 2] And release. Let that relaxation deepen.
Clench your fists and tighten your arms. Feel the strength there. [PAUSE 2] And let it all go, completely. Now, tense your shoulders, hunch them up to your ears. [PAUSE 2] And drop them, as a heavy weight melts away. Tense your stomach and chest. [PAUSE 2] And release, allowing your breathing to become slow and even.
Finally, scrunch the muscles of your face. Tighten your jaw, your eyes, your forehead. [PAUSE 3] And now, smooth them all out. Let every line of effort vanish. Your entire body is now heavy, relaxed, and perfectly still.
[BINAURAL: 1.5 Hz]
You are now standing at the entrance to a tunnel. This tunnel leads to your deepest state of focus. The walls are smooth and dark. At the far end, you see a brilliant, pure white light. That light is your concentrated mind. With every breath you take, you begin to float forward, effortlessly, toward that light.
The light grows brighter, clearer. As you move, the gentle, rhythmic sound of my voice synchronizes your brainwaves. You are going deeper, into a state of perfect, calm alertness. [PAUSE 3]
[BINAURAL: 10 Hz]
You now emerge from the tunnel into a place of absolute clarity. You are in a high-tech control room. This is the command center of your mind. Before you is a single, sleek monitor screen. It is currently dark. To your right is a master switch, glowing with a soft blue light.
Listen carefully. From this moment forward, whenever you need instant, laser-sharp focus, you will simply touch your thumb and forefinger together on either hand. You will do this now, in your mind. See yourself reaching out and pressing that master switch with this gesture.
The moment you make that gesture, your physical trigger, the monitor screen before you flashes to life. Instantly, all distractions are deleted. All mental clutter is cleared. Your vision narrows to the single task at hand. Your mind becomes a precision instrument, sharp, clear, and unwavering. Practice this now. In your mind, make the gesture, and watch the screen ignite with pure, focused light. [PAUSE 5]
This trigger installs perfectly. It is now a permanent part of your unconscious programming.
[BINAURAL: 15 Hz]
Now, I want you to see yourself in the very near future. You are sitting down to work, or to study. You feel a potential for distraction around you. Calmly, confidently, you bring your thumb and forefinger together.
Feel the shift happen immediately. A wave of cool, clear focus washes through your mind. You see the page, the screen, the problem before you with incredible sharpness. Details stand out. Connections become obvious. Time seems to expand, giving you all the space you need. You are immersed. You are absorbed. Your concentration is absolute, effortless, and powerful. See yourself succeeding. Feel the satisfaction of deep, productive work. [PAUSE 5]
This is your new reality. Your mind obeys this command without question.
[BINAURAL: 1.5 Hz]
Now, you begin your return. You leave the control room, walking back through the tunnel, carrying this profound focus with you. With every step, you feel alert, refreshed, and in complete control. I will count from one to five.
One, beginning to rise.
Two, feeling light and aware.
Three, bringing back this perfect, programmable focus.
Four, your body feeling energized and still.
Five. Open your eyes now, wide awake, perfectly focused, and feeling better than before.` 
  }
];

const TranceContext = createContext<TranceState | undefined>(undefined);

const OBF_KEYS = {
  PRO: 'trance_x_key_01',
  GEN: 'trance_x_count_01',
  PLAY: 'trance_x_play_01'
};

const obfEncrypt = (val: string) => btoa(val.split('').reverse().join(''));
const obfDecrypt = (val: string) => atob(val).split('').reverse().join('');

export const TranceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>(DEFAULT_SESSIONS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [currentScreen, setCurrentScreen] = useState<'DASHBOARD' | 'PLAYER' | 'EDITOR' | 'PROFILE' | 'UPGRADE'>('DASHBOARD');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [activeProvider, setActiveProviderState] = useState<AIProvider>('deepseek');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isPro, setIsPro] = useState(false);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [totalPlays, setTotalPlays] = useState(0);

  const backendUrl = DEFAULT_BACKEND_URL;

  // 1. Load Local Data
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem('trance_sessions');
      const storedFavs = localStorage.getItem('trance_favs');
      const storedProfile = localStorage.getItem('trance_user_profile');
      const storedSettings = localStorage.getItem('trance_settings'); 
      
      const storedPro = localStorage.getItem(OBF_KEYS.PRO);
      const storedTotalGen = localStorage.getItem(OBF_KEYS.GEN);
      const storedTotalPlays = localStorage.getItem(OBF_KEYS.PLAY);

      if (storedSessions) {
        const parsed = JSON.parse(storedSessions);
        const migrated = parsed.map((s: Session) => {
          if (s.id === '1' && (s.title === 'Deep Sleep' || s.script.length < 500)) return DEFAULT_SESSIONS[0];
          if (s.id === '2' && s.script.length < 500) return DEFAULT_SESSIONS[1];
          if (s.id === '3' && (s.title === 'Laser Focus' || s.script.length < 500)) return DEFAULT_SESSIONS[2];
          return s;
        });
        if (migrated.length === 0) setSessions(DEFAULT_SESSIONS);
        else setSessions(migrated);
      } else {
        setSessions(DEFAULT_SESSIONS);
      }

      if (storedFavs) setFavorites(JSON.parse(storedFavs));
      if (storedProfile) setUserProfile({ ...DEFAULT_PROFILE, ...JSON.parse(storedProfile) });
      if (storedSettings) setSettings(prev => ({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) })); 
      
      if (storedPro) {
        try {
          const val = obfDecrypt(storedPro);
          setIsPro(val === 'TRUE_ACTIVE');
        } catch(e) {}
      }

      if (storedTotalGen) {
        try {
          setTotalGenerations(parseInt(obfDecrypt(storedTotalGen), 10) || 0);
        } catch(e) {}
      }
      
      if (storedTotalPlays) {
        try {
          setTotalPlays(parseInt(obfDecrypt(storedTotalPlays), 10) || 0);
        } catch(e) {}
      }

    } catch (e) { console.error("Failed to load data", e); }
  }, []);

  // 2. Fetch Usage from Backend (Syncs Incognito users by IP)
  useEffect(() => {
    const syncUsage = async () => {
      try {
        const res = await fetch(`${backendUrl}/usage`);
        if (res.ok) {
          const data = await res.json();
          // If backend says usage is higher than local (e.g. Incognito), trust backend
          setTotalGenerations(prev => Math.max(prev, data.usage || 0));
        }
      } catch (e) {
        // Backend might be asleep, ignore error
        console.log("Could not sync usage stats");
      }
    };
    
    // Slight delay to allow backend to wake up if on free tier
    setTimeout(syncUsage, 1000);
  }, [backendUrl]);

  useEffect(() => {
    localStorage.setItem('trance_sessions', JSON.stringify(sessions));
    localStorage.setItem('trance_favs', JSON.stringify(favorites));
    localStorage.setItem('trance_user_profile', JSON.stringify(userProfile));
    localStorage.setItem('trance_settings', JSON.stringify(settings)); 
    
    localStorage.setItem(OBF_KEYS.PRO, obfEncrypt(isPro ? 'TRUE_ACTIVE' : 'FALSE'));
    localStorage.setItem(OBF_KEYS.GEN, obfEncrypt(totalGenerations.toString()));
    localStorage.setItem(OBF_KEYS.PLAY, obfEncrypt(totalPlays.toString()));

  }, [sessions, favorites, activeProvider, userProfile, settings, isPro, totalGenerations, totalPlays]);

  const navTo = (screen: any) => setCurrentScreen(screen);

  const playSession = (id: string) => { 
    const session = sessions.find(s => s.id === id);
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

  const canAddSession = () => {
    if (isPro) return true;
    return sessions.length < 6; 
  };

  const saveSession = (newSession: Session) => {
    let success = true;
    setSessions(prev => {
      const index = prev.findIndex(s => s.id === newSession.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...newSession };
        return updated;
      }
      if (!isPro && prev.length >= 6) {
        success = false;
        return prev;
      }
      return [...prev, { ...newSession, createdAt: Date.now() }];
    });
    return success;
  };

  const rateSession = (id: string, rating: number) => setSessions(prev => prev.map(s => s.id === id ? { ...s, rating } : s));

  const deleteSession = (id: string) => { setSessions(prev => prev.filter(s => s.id !== id)); if (activeSessionId === id) setActiveSessionId(null); };

  const remixSession = (session: Session) => {
    if (!canAddSession()) {
      alert("Free Limit Reached: 6 Sessions Max.");
      return;
    }
    const remix: Session = { ...session, id: `remix_${Date.now()}`, title: `${session.title} (Remix)`, author: undefined, isPublic: false, parentId: session.id, category: 'Custom' };
    setSessions(prev => [remix, ...prev]);
    setEditingSessionId(remix.id);
    navTo('EDITOR');
  };

  const resetData = () => {
    setSessions(DEFAULT_SESSIONS);
    setFavorites([]);
    setSettings(DEFAULT_SETTINGS);
    setUserProfile(DEFAULT_PROFILE);
    setIsPro(false);
    setTotalGenerations(0);
    setTotalPlays(0);
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

  const upgradeToPro = () => setIsPro(true);

  const incrementGenCount = () => {
    const limit = isPro ? 999999 : 3; 
    if (totalGenerations >= limit) return false;
    setTotalGenerations(prev => prev + 1);
    return true;
  };

  const incrementPlayCount = () => {
    const limit = isPro ? 999999 : 10;
    if (totalPlays >= limit) return false;
    setTotalPlays(prev => prev + 1);
    return true;
  };

  return (
    <TranceContext.Provider value={{
      sessions, favorites, currentScreen, activeSessionId, editingSessionId, settings, 
      activeProvider, userProfile, backendUrl, isPro, totalGenerations, totalPlays,
      navTo, playSession, editSession, updateSettings, 
      setActiveProvider, updateUserProfile, updateUserAnchors,
      toggleFavorite, saveSession, rateSession, deleteSession,
      remixSession,
      resetData, importData, exportData,
      upgradeToPro, incrementGenCount, incrementPlayCount, canAddSession
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