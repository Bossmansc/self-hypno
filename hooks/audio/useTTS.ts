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

const EMOTIONAL_TONES: Record<string, { rate: number, pitch: number, volume: number }> = {
  'CALM': { rate: 0.8, pitch: 0.9, volume: 0.8 },
  'AUTHORITATIVE': { rate: 1.0, pitch: 0.8, volume: 1.0 },
  'NURTURING': { rate: 0.85, pitch: 1.1, volume: 0.7 },
  'ENERGETIC': { rate: 1.2, pitch: 1.2, volume: 1.0 },
  'DEFAULT': { rate: 1.0, pitch: 1.0, volume: 1.0 }
};

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
  const lastScriptRef = useRef<string>('');
  
  const onLineChangeRef = useRef(onLineChange);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onLineChangeRef.current = onLineChange; }, [onLineChange]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Initial Voice Loader (Redundant mostly, but keeps synth warm)
  useEffect(() => {
    if (!synthRef.current) return;
    const loadVoices = () => {
      synthRef.current?.getVoices();
    };
    loadVoices();
    const interval = setInterval(loadVoices, 1000);
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    return () => clearInterval(interval);
  }, []);

  const parseScript = useCallback((script: string): TTSAction[] => {
    const actions: TTSAction[] = [];
    const sentences = script.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [script];
    
    let currentRate = 1.0;
    let currentPitch = 1.0;
    let currentVolume = 1.0;
    let currentPan = 0;

    sentences.forEach((rawSentence, index) => {
      const sentence = rawSentence.trim();
      if (!sentence) return;

      // Check for emotional tags
      const parts = sentence.split(/(\[.*?\])/);
      parts.forEach(part => {
        if (!part.trim()) return;

        if (part.startsWith('[') && part.endsWith(']')) {
          const content = part.slice(1, -1).toUpperCase();
          
          if (content.startsWith('PAUSE')) {
            const seconds = parseInt(content.replace('PAUSE', '').trim()) || 1;
            actions.push({ id: Math.random().toString(), type: 'PAUSE', duration: seconds, originalIndex: index });
            return;
          }

          // Modifier parsing
          if (content === 'SLOW') currentRate = 0.7;
          else if (content === 'FAST') currentRate = 1.3;
          else if (content === 'WHISPER') currentVolume = 0.3;
          else if (content === 'LOUD') currentVolume = 1.0;
          else if (content === 'UP') currentPitch = 1.3;
          else if (content === 'DOWN') currentPitch = 0.8;
          else if (content === 'LEFT') currentPan = -1;
          else if (content === 'RIGHT') currentPan = 1;
          else if (content === 'CENTER') currentPan = 0;
          else if (content === '/SLOW' || content === '/FAST') currentRate = 1.0;
          else if (content === '/WHISPER' || content === '/LOUD') currentVolume = 1.0;
          else if (content === '/UP' || content === '/DOWN') currentPitch = 1.0;
          else if (content === '/LEFT' || content === '/RIGHT') currentPan = 0;
          else if (EMOTIONAL_TONES[content]) {
            const tone = EMOTIONAL_TONES[content];
            currentRate = tone.rate;
            currentPitch = tone.pitch;
            currentVolume = tone.volume;
          } else if (['/CALM','/AUTHORITATIVE','/NURTURING','/ENERGETIC'].includes(content)) {
            const def = EMOTIONAL_TONES['DEFAULT'];
            currentRate = def.rate;
            currentPitch = def.pitch;
            currentVolume = def.volume;
          }
          return;
        }

        actions.push({
          id: Math.random().toString(),
          type: 'SPEAK',
          text: part,
          originalIndex: index,
          options: { rate: currentRate, pitch: currentPitch, volume: currentVolume, pan: currentPan }
        });
      });

      actions.push({ id: `eos-${index}`, type: 'IMPLICIT_PAUSE', originalIndex: index });
    });

    return actions;
  }, []);

  const triggerHaptic = useCallback((type: 'pulse' | 'wave' | 'emphasis') => {
    if (!navigator.vibrate) return;
    try {
      if (type === 'pulse') navigator.vibrate([50, 200, 50]);
    } catch(e) {}
  }, []);

  const pause = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (currentUtteranceRef.current && synthRef.current) {
      currentUtteranceRef.current.onend = null;
      currentUtteranceRef.current.onerror = null;
      currentUtteranceRef.current = null;
      synthRef.current.cancel();
      // Step back one to replay the interrupted sentence
      if (currentActionIndexRef.current > 0) {
        currentActionIndexRef.current--;
      }
    } else if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    currentActionIndexRef.current = 0;
    actionQueueRef.current = [];
    lastScriptRef.current = '';
  }, [pause]);

  const processorRef = useRef<() => void>(() => {});
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
    if (action.originalIndex !== undefined && onLineChangeRef.current) {
      onLineChangeRef.current(action.originalIndex);
    }

    currentActionIndexRef.current++;

    if (action.type === 'SPEAK') triggerHaptic('pulse');

    let pauseDuration = 0;
    if (action.type === 'PAUSE') {
      pauseDuration = (action.duration || 1) * 1000;
    } else if (action.type === 'IMPLICIT_PAUSE') {
      pauseDuration = settings.pause * 1000;
    }

    if (pauseDuration > 0) {
      timeoutRef.current = window.setTimeout(processorRef.current, pauseDuration);
    } else if (action.type === 'SPEAK' && action.text) {
      if (!synthRef.current) {
        // Retry if synth is missing (shouldn't happen)
        timeoutRef.current = window.setTimeout(processorRef.current, 100);
        return;
      }

      const u = new SpeechSynthesisUtterance(action.text);
      currentUtteranceRef.current = u;
      
      // -- VOICE SELECTION LOGIC --
      u.lang = 'en-US'; // Default fallback

      let voices = synthRef.current.getVoices();
      if (voices.length === 0 && window.speechSynthesis) {
         voices = window.speechSynthesis.getVoices(); 
      }

      let selected = null;

      // 1. Try exact match from settings
      if (settings.selectedVoiceURI) {
        selected = voices.find(v => v.voiceURI === settings.selectedVoiceURI);
        if (!selected) {
             const targetName = voices.find(v => settings.selectedVoiceURI?.includes(v.name));
             if (targetName) selected = targetName;
        }
      }

      // 2. Fallback: Try to find a good English voice if nothing selected
      // This is critical for Android WebViews where "default" might be silent
      if (!selected) {
         selected = voices.find(v => v.default) || 
                    voices.find(v => v.lang.startsWith('en-US')) ||
                    voices.find(v => v.lang.startsWith('en'));
      }

      if (selected) {
        u.voice = selected;
        u.lang = selected.lang; 
      }
      // -- END VOICE SELECTION --

      // Binaural Pacing Adjustment
      let pacing = 1.0;
      if (settings.binauralEnabled) {
        if (settings.binauralFreq <= 4) pacing = 0.8; // Deep trance slows down
        else if (settings.binauralFreq <= 8) pacing = 0.9; 
      }

      u.rate = (action.options?.rate || 1.0) * settings.speed * pacing;
      u.pitch = action.options?.pitch || 1.0;
      u.volume = (action.options?.volume || 1.0) * settings.voiceVol;

      const handleEnd = () => {
        currentUtteranceRef.current = null;
        if (isPlayingRef.current) {
          timeoutRef.current = window.setTimeout(processorRef.current, 10); 
        }
      };

      u.onend = handleEnd;
      u.onerror = (e) => {
        currentUtteranceRef.current = null;
        console.warn("TTS Error:", e);
        // Continue despite error
        if (isPlayingRef.current) {
          timeoutRef.current = window.setTimeout(processorRef.current, 100);
        }
      };

      try {
        synthRef.current.speak(u);
        if (synthRef.current.paused) synthRef.current.resume();
      } catch (e) {
        console.error("TTS Speak failed", e);
        timeoutRef.current = window.setTimeout(processorRef.current, 500);
      }
    } else {
      // Fallback for unknown types
      processorRef.current();
    }
  };

  const play = useCallback(() => {
    if (!activeScript) return;
    
    // If script changed or queue empty, re-parse
    if (activeScript !== lastScriptRef.current || actionQueueRef.current.length === 0) {
      reset(); 
      actionQueueRef.current = parseScript(activeScript);
      lastScriptRef.current = activeScript;
      currentActionIndexRef.current = 0;
    }

    if (isPlayingRef.current) {
      processorRef.current();
    }
  }, [activeScript, parseScript, reset, isPlayingRef]);

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
