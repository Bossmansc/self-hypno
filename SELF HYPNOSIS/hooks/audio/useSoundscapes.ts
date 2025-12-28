import { useRef, useEffect, useCallback, useState } from 'react';
import { Settings } from '../../context/TranceContext';
import { SoundscapeType } from './types';

const FIRE_SOUND_URL = "https://upload.wikimedia.org/wikipedia/commons/e/e0/Fire_crackling.ogg";

interface SoundscapesProps {
  settings: Settings;
  isPlayingRef: React.MutableRefObject<boolean>;
  audioCtxRef: React.MutableRefObject<AudioContext | null>;
}

export const useSoundscapes = ({ settings, isPlayingRef, audioCtxRef }: SoundscapesProps) => {
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType>('none');
  const bgNodesRef = useRef<AudioNode[]>([]);
  const bgGainRef = useRef<GainNode | null>(null);
  const bgPannerRef = useRef<StereoPannerNode | null>(null);
  const realAudioRef = useRef<HTMLAudioElement | null>(null);
  const spatialIntervalRef = useRef<number | null>(null);

  const initNodes = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (!bgGainRef.current) {
      bgGainRef.current = ctx.createGain();
      try {
        bgPannerRef.current = ctx.createStereoPanner();
        bgPannerRef.current.connect(bgGainRef.current);
      } catch (e) {
        // Fallback for browsers without StereoPanner
        console.warn("StereoPanner not supported, using direct connect");
      }
      bgGainRef.current.connect(ctx.destination);
    }
  }, [audioCtxRef]);

  const startSpatialLoop = useCallback(() => {
    if (spatialIntervalRef.current) clearInterval(spatialIntervalRef.current);
    let angle = 0;
    spatialIntervalRef.current = window.setInterval(() => {
      if (bgPannerRef.current && isPlayingRef.current) {
        angle += 0.05;
        bgPannerRef.current.pan.value = Math.sin(angle) * 0.8;
      }
    }, 100);
  }, [isPlayingRef]);

  const stopSpatialLoop = useCallback(() => {
    if (spatialIntervalRef.current) {
      clearInterval(spatialIntervalRef.current);
      spatialIntervalRef.current = null;
    }
  }, []);

  const createPinkNoise = useCallback((ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.loop = true;
    return node;
  }, []);

  const createBrownNoise = useCallback((ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.loop = true;
    return node;
  }, []);

  const playSoundscape = useCallback((type: SoundscapeType) => {
    bgNodesRef.current.forEach(node => {
      try { (node as any).stop(); } catch(e){}
      node.disconnect();
    });
    bgNodesRef.current = [];
    
    if (realAudioRef.current) {
      realAudioRef.current.pause();
      realAudioRef.current.currentTime = 0;
    }

    setActiveSoundscape(type);
    
    if (!isPlayingRef.current || type === 'none') return;
    
    initNodes();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    // Connect to panner if available, else gain
    const dest = bgPannerRef.current || bgGainRef.current;
    if (!dest) return;

    if (type === 'fire') {
      if (!realAudioRef.current) {
        realAudioRef.current = new Audio(FIRE_SOUND_URL);
        realAudioRef.current.loop = true;
      } else {
        realAudioRef.current.src = FIRE_SOUND_URL;
      }
      realAudioRef.current.volume = settings.ambVol;
      realAudioRef.current.play().catch(e => console.log("Fire play blocked", e));
      return;
    }

    if (type === 'rain') {
      const pink = createPinkNoise(ctx);
      const pinkFilter = ctx.createBiquadFilter();
      pinkFilter.type = 'lowpass';
      pinkFilter.frequency.value = 800;
      const pinkGain = ctx.createGain();
      pinkGain.gain.value = 0.6;

      pink.connect(pinkFilter).connect(pinkGain).connect(dest);

      const brown = createBrownNoise(ctx);
      const brownFilter = ctx.createBiquadFilter();
      brownFilter.type = 'lowpass';
      brownFilter.frequency.value = 300;
      const brownGain = ctx.createGain();
      brownGain.gain.value = 0.4;

      brown.connect(brownFilter).connect(brownGain).connect(dest);

      pink.start();
      brown.start();
      bgNodesRef.current.push(pink, pinkFilter, pinkGain, brown, brownFilter, brownGain);
    } else if (type === 'wind') {
      const pink = createPinkNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 1;
      
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.1;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain).connect(filter.frequency);

      pink.connect(filter).connect(dest);

      pink.start();
      lfo.start();
      bgNodesRef.current.push(pink, filter, lfo, lfoGain);
      startSpatialLoop();
    } else if (type === 'om') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 110;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 150;
      
      osc.connect(filter);
      filter.connect(dest);
      
      osc.start();
      bgNodesRef.current.push(osc, filter);
      stopSpatialLoop();
      if (bgPannerRef.current) bgPannerRef.current.pan.value = 0;
    }
  }, [initNodes, createPinkNoise, createBrownNoise, startSpatialLoop, stopSpatialLoop, settings.ambVol, isPlayingRef, audioCtxRef]);

  const updateSoundscapeVolume = useCallback((volume: number) => {
    if (realAudioRef.current) {
      realAudioRef.current.volume = volume;
    }
    if (bgGainRef.current && audioCtxRef.current) {
      bgGainRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [audioCtxRef]);

  useEffect(() => {
    if (activeSoundscape !== 'none') {
      updateSoundscapeVolume(settings.ambVol);
    }
  }, [settings.ambVol, activeSoundscape, updateSoundscapeVolume]);

  useEffect(() => {
    return () => {
      bgNodesRef.current.forEach(node => {
        try { (node as any).stop(); } catch(e){}
        node.disconnect();
      });
      if (realAudioRef.current) realAudioRef.current.pause();
      if (spatialIntervalRef.current) clearInterval(spatialIntervalRef.current);
    };
  }, []);

  return {
    activeSoundscape,
    playSoundscape,
    updateSoundscapeVolume
  };
};
