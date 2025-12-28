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
  
  // Shared Audio Context Manager
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === 'suspended') {
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

  // Direct sync: Frequency is now fully controlled by the user slider (settings)
  // No more protocol engine overriding this.
  useEffect(() => {
    setCurrentFreq(settings.binauralFreq);
  }, [settings.binauralFreq]);

  // Volume updates
  useEffect(() => {
    updateSoundscapeVolume(settings.ambVol);
  }, [settings.ambVol, updateSoundscapeVolume]);

  // Handle Entrainment Lifecycle
  useEffect(() => {
    if (isPlayingRef.current) {
      initEntrainment(); 
    } else {
      stopEntrainment();
    }
  }, [settings.binauralEnabled, entrainmentType, isPlayingRef.current, initEntrainment, stopEntrainment]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      // Pause
      isPlayingRef.current = false;
      setIsPlaying(false);
      pauseTTS(); 
      playSoundscape('none');
      stopEntrainment();
    } else {
      // Play
      initAudioContext();
      isPlayingRef.current = true;
      setIsPlaying(true);
      
      // Sync frequency immediately on start
      setCurrentFreq(settings.binauralFreq);
      
      playTTS();
      
      if (activeSoundscape !== 'none') {
        playSoundscape(activeSoundscape as any);
      }
      initEntrainment();
    }
  }, [playTTS, pauseTTS, playSoundscape, initAudioContext, activeSoundscape, initEntrainment, stopEntrainment, settings.binauralFreq]);

  // Cleanup
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      resetTTS(); 
      playSoundscape('none');
      stopEntrainment();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(e => console.error(e));
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
