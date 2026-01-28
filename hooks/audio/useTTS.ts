import { useRef, useCallback, useEffect } from 'react';
import { Settings } from '../../context/TranceContext';

type TTSActionType = 'SPEAK' | 'PAUSE' | 'IMPLICIT_PAUSE';

interface TTSAction {
  id: string;
  type: TTSActionType;
  text?: string;
  duration?: number;
  options?: { rate?: number; pitch?: number; volume?: number; pan?: number };
  originalIndex?: number;
}

interface TTSProps {
  settings: Settings;
  activeScript?: string;
  onLineChange?: (index: number) => void;
  onComplete?: () => void;
  isPlayingRef: React.MutableRefObject<boolean>;
  setIsPlaying: (playing: boolean) => void;
}

export const useTTS = ({
  settings,
  activeScript,
  onLineChange,
  onComplete,
  isPlayingRef,
  setIsPlaying
}: TTSProps) => {
  const actionQueueRef = useRef<TTSAction[]>([]);
  const currentActionIndexRef = useRef(0);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );
  const timeoutRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const lastScriptRef = useRef<string>('');
  
  const onLineChangeRef = useRef(onLineChange);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onLineChangeRef.current = onLineChange; }, [onLineChange]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ANDROID FIX: Keep the engine alive
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = window.setInterval(() => {
      if (synthRef.current && isPlayingRef.current) {
        if (synthRef.current.paused) {
          synthRef.current.resume();
        }
      }
    }, 2000); // Pulse every 2 seconds
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Initial Voice Loader
  useEffect(() => {
    if (!synthRef.current) return;
    const loadVoices = () => {
      synthRef.current?.getVoices();
    };
    loadVoices();
    // Aggressive polling for Android which is lazy
    const poller = setInterval(loadVoices, 500);
    setTimeout(() => clearInterval(poller), 5000);
    
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    return () => clearInterval(poller);
  }, []);

  const parseScript = useCallback((script: string): TTSAction[] => {
    const actions: TTSAction[] = [];
    // Split by sentence terminators but keep them
    const sentences = script.replace(/([.!?])\s+(?=[A-Z])/g, "$1|").split("|");
    
    let currentRate = 1.0;
    let currentPitch = 1.0;
    let currentVolume = 1.0;

    sentences.forEach((rawSentence, index) => {
      const sentence = rawSentence.trim();
      if (!sentence) return;

      // Check for pause tags or modifiers
      if (sentence.startsWith('[') && sentence.endsWith(']')) {
        const content = sentence.slice(1, -1).toUpperCase();
        if (content.includes('PAUSE')) {
          const seconds = parseInt(content.replace(/\D/g, '')) || 1;
          actions.push({ id: Math.random().toString(), type: 'PAUSE', duration: seconds, originalIndex: index });
        }
        return; 
      }

      // Strip tags for speaking but keep logic if needed later
      const cleanText = sentence.replace(/\[.*?\]/g, '').trim();
      if (cleanText) {
        actions.push({
          id: Math.random().toString(),
          type: 'SPEAK',
          text: cleanText,
          originalIndex: index,
          options: { rate: currentRate, pitch: currentPitch, volume: currentVolume }
        });
        actions.push({ id: `eos-${index}`, type: 'IMPLICIT_PAUSE', originalIndex: index });
      }
    });

    return actions;
  }, []);

  const pause = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stopHeartbeat();
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, [stopHeartbeat]);

  const reset = useCallback(() => {
    pause();
    currentActionIndexRef.current = 0;
    actionQueueRef.current = [];
    lastScriptRef.current = '';
  }, [pause]);

  const processorRef = useRef<() => void>(() => {});
  
  const speakUtterance = (action: TTSAction) => {
    if (!synthRef.current || !action.text) return;

    // ANDROID FIX: Cancel before speak clears buffers
    synthRef.current.cancel();

    const u = new SpeechSynthesisUtterance(action.text);
    
    // CRITICAL: Store ref to prevent Garbage Collection during playback
    currentUtteranceRef.current = u;

    // Voice Selection Logic
    const voices = synthRef.current.getVoices();
    let selectedVoice = null;

    if (settings.selectedVoiceURI) {
      selectedVoice = voices.find(v => v.voiceURI === settings.selectedVoiceURI);
    }
    
    // Fallback logic
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en-US')) || 
                      voices.find(v => v.lang.startsWith('en')) || 
                      voices[0];
    }

    if (selectedVoice) {
      u.voice = selectedVoice;
      u.lang = selectedVoice.lang;
    }

    // Apply Settings
    let pacing = 1.0;
    if (settings.binauralEnabled && settings.binauralFreq <= 8) {
      pacing = 0.9; // Slow down for trance
    }

    u.rate = (action.options?.rate || 1.0) * settings.speed * pacing;
    u.pitch = action.options?.pitch || 1.0;
    u.volume = (action.options?.volume || 1.0) * settings.voiceVol;

    u.onend = () => {
      if (isPlayingRef.current) {
        timeoutRef.current = window.setTimeout(processorRef.current, 10);
      }
    };

    u.onerror = (e) => {
      console.warn("TTS Error", e);
      // Skip to next if error
      if (isPlayingRef.current) {
        timeoutRef.current = window.setTimeout(processorRef.current, 50);
      }
    };

    try {
      synthRef.current.speak(u);
      // Force resume in case it started paused
      if (synthRef.current.paused) synthRef.current.resume();
    } catch (e) {
      console.error("TTS Speak Exception", e);
      timeoutRef.current = window.setTimeout(processorRef.current, 200);
    }
  };

  processorRef.current = () => {
    if (!isPlayingRef.current) return;

    const queue = actionQueueRef.current;
    const idx = currentActionIndexRef.current;

    if (idx >= queue.length) {
      reset();
      if (onCompleteRef.current) onCompleteRef.current();
      return;
    }

    const action = queue[idx];
    
    // Trigger line update
    if (action.originalIndex !== undefined && onLineChangeRef.current) {
      onLineChangeRef.current(action.originalIndex);
    }

    currentActionIndexRef.current++;

    if (action.type === 'PAUSE' || action.type === 'IMPLICIT_PAUSE') {
      const duration = action.type === 'PAUSE' 
        ? (action.duration || 1) * 1000 
        : settings.pause * 1000;
        
      if (duration > 0) {
        timeoutRef.current = window.setTimeout(processorRef.current, duration);
      } else {
        processorRef.current();
      }
    } else if (action.type === 'SPEAK') {
      speakUtterance(action);
    }
  };

  const play = useCallback(() => {
    if (!activeScript) return;
    
    if (activeScript !== lastScriptRef.current || actionQueueRef.current.length === 0) {
      reset(); 
      actionQueueRef.current = parseScript(activeScript);
      lastScriptRef.current = activeScript;
      currentActionIndexRef.current = 0;
    }

    if (isPlayingRef.current) {
      startHeartbeat();
      processorRef.current();
    }
  }, [activeScript, parseScript, reset, isPlayingRef, startHeartbeat]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    play,
    pause,
    reset
  };
};
