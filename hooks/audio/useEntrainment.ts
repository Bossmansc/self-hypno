import { useRef, useCallback, useEffect } from 'react';
import { Settings } from '../../context/TranceContext';
import { EntrainmentType } from './types';

interface EntrainmentProps {
  settings: Settings;
  currentFreq: number;
  isPlayingRef: React.MutableRefObject<boolean>;
  entrainmentType: EntrainmentType;
  audioCtxRef: React.MutableRefObject<AudioContext | null>;
}

const BASE_CARRIER_FREQ = 200; 

export const useEntrainment = ({ settings, currentFreq, isPlayingRef, entrainmentType, audioCtxRef }: EntrainmentProps) => {
  const nodesRef = useRef<{
    l?: OscillatorNode;
    r?: OscillatorNode;
    isoOsc?: OscillatorNode;
    isoGain?: GainNode;
    lfo?: OscillatorNode;
    mainGain?: GainNode;
    type: EntrainmentType;
  } | null>(null);

  const stopEntrainment = useCallback(() => {
    if (nodesRef.current) {
      try {
        nodesRef.current.l?.stop();
        nodesRef.current.r?.stop();
        nodesRef.current.isoOsc?.stop();
        nodesRef.current.lfo?.stop();
      } catch(e) {}
      nodesRef.current.mainGain?.disconnect();
      nodesRef.current = null;
    }
  }, []);

  const initEntrainment = useCallback(() => {
    // 1. Validate
    if (!settings.binauralEnabled || !isPlayingRef.current || !audioCtxRef.current) {
      stopEntrainment();
      return;
    }

    // 2. Check if we need to rebuild (type changed or nodes missing)
    if (nodesRef.current && nodesRef.current.type !== entrainmentType) {
      stopEntrainment();
    }
    
    // If nodes exist and are correct type, we don't need to re-init
    if (nodesRef.current) return;

    const ctx = audioCtxRef.current;
    
    // 3. Create Graph
    // Use new binauralVol setting (fallback to 0.1 if undefined)
    const volume = Math.max(0.001, settings.binauralVol ?? 0.3); 
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(volume, ctx.currentTime);
    mainGain.connect(ctx.destination);

    if (entrainmentType === 'BINAURAL') {
      const oscL = ctx.createOscillator();
      oscL.type = 'sine'; 
      oscL.frequency.setValueAtTime(BASE_CARRIER_FREQ, ctx.currentTime);
      
      const panL = ctx.createStereoPanner();
      panL.pan.setValueAtTime(-1, ctx.currentTime);
      
      oscL.connect(panL);
      panL.connect(mainGain);

      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(BASE_CARRIER_FREQ + currentFreq, ctx.currentTime);
      
      const panR = ctx.createStereoPanner();
      panR.pan.setValueAtTime(1, ctx.currentTime);
      
      oscR.connect(panR);
      panR.connect(mainGain);

      oscL.start();
      oscR.start();
      
      nodesRef.current = { l: oscL, r: oscR, mainGain, type: 'BINAURAL' };

    } else if (entrainmentType === 'ISOCHRONIC') {
      const isoOsc = ctx.createOscillator();
      isoOsc.type = 'sine';
      isoOsc.frequency.setValueAtTime(BASE_CARRIER_FREQ, ctx.currentTime);
      
      const isoGain = ctx.createGain();
      isoGain.gain.value = 0; 

      const lfo = ctx.createOscillator();
      lfo.type = 'square'; 
      lfo.frequency.setValueAtTime(currentFreq, ctx.currentTime);
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.5;

      lfo.connect(lfoGain);
      lfoGain.connect(isoGain.gain);
      
      isoOsc.connect(isoGain);
      isoGain.connect(mainGain);
      
      isoOsc.start();
      lfo.start();
      
      nodesRef.current = { isoOsc, isoGain, lfo, mainGain, type: 'ISOCHRONIC' };
    }
  }, [settings.binauralEnabled, isPlayingRef, entrainmentType, audioCtxRef, stopEntrainment, settings.binauralVol, currentFreq]); 

  // 4. Smooth Frequency Update Effect
  useEffect(() => {
    if (nodesRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      if (nodesRef.current.type === 'BINAURAL') {
        nodesRef.current.r?.frequency.setTargetAtTime(BASE_CARRIER_FREQ + currentFreq, now, 0.1);
      } else if (nodesRef.current.type === 'ISOCHRONIC') {
        nodesRef.current.lfo?.frequency.setTargetAtTime(currentFreq, now, 0.1);
      }
    }
  }, [currentFreq, audioCtxRef]);

  // 5. Volume Update Effect - Watch settings.binauralVol
  useEffect(() => {
    if (nodesRef.current?.mainGain && audioCtxRef.current) {
      const volume = Math.max(0.001, settings.binauralVol ?? 0.3);
      nodesRef.current.mainGain.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.1);
    }
  }, [settings.binauralVol, audioCtxRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopEntrainment();
  }, [stopEntrainment]);

  return { initEntrainment, stopEntrainment };
};
