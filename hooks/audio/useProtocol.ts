import { useRef, useEffect } from 'react';
import { EntrainmentProtocol } from './types';

const PROTOCOLS = {
  'RELAX': { start: 12, end: 7.83, duration: 10 },
  'SLEEP': { start: 10, end: 2, duration: 15 },
  'FOCUS': { start: 14, end: 30, duration: 5 }
};

interface ProtocolProps {
  protocol: EntrainmentProtocol;
  setCurrentFreq: (freq: number) => void;
  isPlayingRef: React.MutableRefObject<boolean>;
}

export const useProtocol = ({ protocol, setCurrentFreq, isPlayingRef }: ProtocolProps) => {
  const protocolIntervalRef = useRef<number | null>(null);

  // Handle Protocol Lifecycle
  useEffect(() => {
    // 1. Cleanup any existing interval immediately on change or unmount
    if (protocolIntervalRef.current) {
      clearInterval(protocolIntervalRef.current);
      protocolIntervalRef.current = null;
    }

    // 2. If no active protocol, we are done. (Manual mode is handled in useAudioEngine)
    if (protocol === 'NONE' || !PROTOCOLS[protocol]) {
      return;
    }

    // 3. If playing, start the protocol
    if (isPlayingRef.current) {
      const p = PROTOCOLS[protocol];
      const steps = p.duration * 60; // 1 second updates
      const stepSize = (p.end - p.start) / steps;
      let currentStep = 0;

      // Set initial frequency immediately
      setCurrentFreq(p.start);

      // 4. Start Interval
      protocolIntervalRef.current = window.setInterval(() => {
        // Double check playing state inside interval
        if (!isPlayingRef.current) {
           if (protocolIntervalRef.current) clearInterval(protocolIntervalRef.current);
           return;
        }

        currentStep++;
        const newFreq = p.start + (stepSize * currentStep);
        setCurrentFreq(newFreq);

        // End of protocol
        if (currentStep >= steps) {
          if (protocolIntervalRef.current) {
            clearInterval(protocolIntervalRef.current);
            protocolIntervalRef.current = null;
          }
        }
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (protocolIntervalRef.current) {
        clearInterval(protocolIntervalRef.current);
        protocolIntervalRef.current = null;
      }
    };
  }, [protocol, isPlayingRef.current, setCurrentFreq]);

  // Return nothing, the hook manages the side effect completely
  return {};
};
