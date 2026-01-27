import { useRef, useEffect, useState, useCallback } from 'react';
import { Settings } from '../../context/TranceContext';
import { useSoundscapes } from './useSoundscapes';
import { useEntrainment } from './useEntrainment';
import { useTTS } from './useTTS';
import { EntrainmentType } from './types';

interface AudioEngineProps {
  settings: Settings;
  activeScript?: string;
  onLineChange?: (index: number) => void;
  onComplete?: () => void;
  entrainmentType?: EntrainmentType;
}

export const useAudioEngine = ({
  settings,
  activeScript,
  onLineChange,
  onComplete,
  entrainmentType = 'BINAURAL'
}: AudioEngineProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFreq, setCurrentFreq] = useState(settings.binauralFreq);
  const isPlayingRef = useRef(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        try {
          audioCtxRef.current = new Ctx();
        } catch (e) {
          console.error("Failed to create AudioContext", e);
        }
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(e => console.warn("Audio resume failed", e));
    }
  }, []);

  const {
    activeSoundscape,
    playSoundscape,
    updateSoundscapeVolume
  } = useSoundscapes({ settings, isPlayingRef, audioCtxRef });

  const {
    initEntrainment,
    stopEntrainment
  } = useEntrainment({ settings, currentFreq, isPlayingRef, entrainmentType, audioCtxRef });

  const {
    play: playTTS,
    pause: pauseTTS,
    reset: resetTTS
  } = useTTS({
    settings,
    activeScript,
    onLineChange,
    onComplete: () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      resetTTS();
      if (onComplete) onComplete();
    },
    isPlayingRef,
    setIsPlaying 
  });

  // Sync settings
  useEffect(() => {
    setCurrentFreq(settings.binauralFreq);
  }, [settings.binauralFreq]);

  useEffect(() => {
    updateSoundscapeVolume(settings.ambVol);
  }, [settings.ambVol, updateSoundscapeVolume]);

  // Handle entrainment changes
  useEffect(() => {
    if (isPlayingRef.current) {
      initEntrainment(); 
    } else {
      stopEntrainment();
    }
  }, [settings.binauralEnabled, entrainmentType, isPlayingRef.current, initEntrainment, stopEntrainment]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      // STOP
      isPlayingRef.current = false;
      setIsPlaying(false);
      pauseTTS(); 
      playSoundscape('none');
      stopEntrainment();
    } else {
      // START
      initAudioContext();
      isPlayingRef.current = true;
      setIsPlaying(true);
      setCurrentFreq(settings.binauralFreq);
      playTTS();
      if (activeSoundscape !== 'none') {
        playSoundscape(activeSoundscape as any);
      }
      initEntrainment();
    }
  }, [playTTS, pauseTTS, playSoundscape, initAudioContext, activeSoundscape, initEntrainment, stopEntrainment, settings.binauralFreq]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      resetTTS(); 
      playSoundscape('none');
      stopEntrainment();
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close().catch(e => console.error(e));
        } catch(e) {}
        audioCtxRef.current = null;
      }
    };
  }, []); 

  return {
    isPlaying,
    activeSoundscape,
    currentFreq,
    togglePlay,
    playSoundscape
  };
};
