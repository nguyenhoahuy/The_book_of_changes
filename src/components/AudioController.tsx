/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Bell, Wind, Music, Sparkles } from "lucide-react";

interface AudioControllerProps {
  atmosphere: "temple" | "sky" | "earth" | "water" | "fire" | "thunder" | "wind" | "mountain" | "lake";
}

export default function AudioController({ atmosphere }: AudioControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneOscsRef = useRef<OscillatorNode[]>([]);
  const droneGainRef = useRef<GainNode | null>(null);
  const windNodeRef = useRef<BiquadFilterNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // New audio layers for immersive ambient elements
  const fluteGainRef = useRef<GainNode | null>(null);
  const chimesGainRef = useRef<GainNode | null>(null);
  const waterGainRef = useRef<GainNode | null>(null);
  const waterNoiseGainRef = useRef<GainNode | null>(null);
  const fireGainRef = useRef<GainNode | null>(null);

  // Intervals for background procedural sound sequencers
  const fluteIntervalRef = useRef<any>(null);
  const chimesIntervalRef = useRef<any>(null);
  const waterIntervalRef = useRef<any>(null);
  const fireIntervalRef = useRef<any>(null);

  // Track last played frequency for fluid glide (portamento) on the bamboo flute
  const lastFluteFreqRef = useRef<number>(392.00);

  // Clean up all resources when component unmounts
  useEffect(() => {
    return () => {
      if (fluteIntervalRef.current) clearInterval(fluteIntervalRef.current);
      if (chimesIntervalRef.current) clearInterval(chimesIntervalRef.current);
      if (waterIntervalRef.current) clearInterval(waterIntervalRef.current);
      if (fireIntervalRef.current) clearInterval(fireIntervalRef.current);

      droneOscsRef.current.forEach((osc) => {
        try { osc.stop(); } catch (e) {}
      });

      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Initialize Audio Context and synths on user gesture
  const initAudio = () => {
    if (audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // --- Deep Drone Synthesizer ---
      // 3 fundamental resonant frequencies representing Heaven, Earth, and Man (Daoist Trinity)
      // Low F, C, F octaves (87.3Hz, 130.8Hz, 174.6Hz) for warm, serene base
      const frequencies = [87.31, 130.81, 174.61];
      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.08, ctx.currentTime);
      droneGain.connect(masterGain);
      droneGainRef.current = droneGain;

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = idx === 1 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Add subtle detuning sweep
        osc.detune.setValueAtTime(idx * 5 - 5, ctx.currentTime);
        
        // Slow LFO for drone volume movement
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.05 + idx * 0.02, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);
        
        oscGain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(droneGain);
        
        osc.start();
        lfo.start();
        droneOscsRef.current.push(osc);
      });

      // --- Wind Noise Generator ---
      // Synthesize wind using white noise filtered by a moving lowpass filter
      const bufferSize = ctx.sampleRate * 2; // 2 seconds
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "lowpass";
      windFilter.Q.setValueAtTime(4.0, ctx.currentTime);
      windFilter.frequency.setValueAtTime(300, ctx.currentTime);
      windNodeRef.current = windFilter;

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.04, ctx.currentTime);
      windGain.connect(masterGain);
      windGainRef.current = windGain;

      whiteNoise.connect(windFilter);
      windFilter.connect(windGain);
      whiteNoise.start();

      // Continuous Modulation of Wind Filter Frequency (for organic sweep)
      const windLFO = ctx.createOscillator();
      const windLFOGain = ctx.createGain();
      windLFO.frequency.setValueAtTime(0.08, ctx.currentTime); // very slow
      windLFOGain.gain.setValueAtTime(250, ctx.currentTime); // mod range 50hz to 550hz
      
      windLFO.connect(windLFOGain);
      windLFOGain.connect(windFilter.frequency);
      windLFO.start();

      // --- NEW MEDITATIVE AUDIO LAYERS INITIALIZATION ---
      
      // 1. Bamboo Flute Layer Gain
      const fluteGain = ctx.createGain();
      fluteGain.gain.setValueAtTime(0.65, ctx.currentTime);
      fluteGain.connect(masterGain);
      fluteGainRef.current = fluteGain;

      // 2. Wind Chimes Layer Gain
      const chimesGain = ctx.createGain();
      chimesGain.gain.setValueAtTime(0.55, ctx.currentTime);
      chimesGain.connect(masterGain);
      chimesGainRef.current = chimesGain;

      // 3. Flowing Water (Bubble pops) Gain
      const waterGain = ctx.createGain();
      waterGain.gain.setValueAtTime(0.5, ctx.currentTime);
      waterGain.connect(masterGain);
      waterGainRef.current = waterGain;

      // 4. Wood Fire Crackling Gain
      const fireGain = ctx.createGain();
      fireGain.gain.setValueAtTime(0.4, ctx.currentTime);
      fireGain.connect(masterGain);
      fireGainRef.current = fireGain;

      // 5. Continuous Streaming Water Bed Noise Generator
      const waterBufferSize = ctx.sampleRate * 2.5;
      const waterBuffer = ctx.createBuffer(1, waterBufferSize, ctx.sampleRate);
      const waterOutput = waterBuffer.getChannelData(0);
      for (let i = 0; i < waterBufferSize; i++) {
        waterOutput[i] = Math.random() * 2 - 1;
      }
      const waterNoiseSource = ctx.createBufferSource();
      waterNoiseSource.buffer = waterBuffer;
      waterNoiseSource.loop = true;

      const waterFilterNode = ctx.createBiquadFilter();
      waterFilterNode.type = "bandpass";
      waterFilterNode.frequency.setValueAtTime(450, ctx.currentTime);
      waterFilterNode.Q.setValueAtTime(1.2, ctx.currentTime);

      const waterNoiseGain = ctx.createGain();
      waterNoiseGain.gain.setValueAtTime(0, ctx.currentTime); // Default to silent, modulated on atmosphere update
      waterNoiseGain.connect(masterGain);

      waterNoiseSource.connect(waterFilterNode);
      waterFilterNode.connect(waterNoiseGain);
      waterNoiseSource.start();
      waterNoiseGainRef.current = waterNoiseGain;

      setIsPlaying(true);
      playBronzeChime(150); // Welcome chime
    } catch (e) {
      console.error("Failed to initialize Web Audio:", e);
    }
  };

  // Upgraded Bamboo Flute Synthesizer - breathy, soft, organic with pitch glide
  const playFluteNote = (freq: number, duration = 2.5) => {
    // Bamboo flute sound is disabled per user request
    return;
  };

  // Upgraded Wind Chimes Synthesizer - crisp, highly resonant and glass-metallic
  const playWindChime = (freq: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "suspended" || !chimesGainRef.current) return;

    try {
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const chimeGainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      // Instantaneous crisp impact
      chimeGainNode.gain.setValueAtTime(0, time);
      chimeGainNode.gain.linearRampToValueAtTime(0.07, time + 0.003);
      chimeGainNode.gain.exponentialRampToValueAtTime(0.0001, time + 3.2); // long airy ringing

      osc.connect(chimeGainNode);
      chimeGainNode.connect(chimesGainRef.current);
      osc.start(time);
      osc.stop(time + 3.4);

      // Crystalline tube harmonics
      const multipliers = [1.5, 2.0, 2.85, 3.65];
      multipliers.forEach((mult, idx) => {
        const harmOsc = ctx.createOscillator();
        const harmGain = ctx.createGain();

        harmOsc.type = "sine";
        harmOsc.frequency.setValueAtTime(freq * mult, time);

        harmGain.gain.setValueAtTime(0, time);
        harmGain.gain.linearRampToValueAtTime(0.035 / (idx + 1), time + 0.003);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.2 / (idx + 1));

        harmOsc.connect(harmGain);
        harmGain.connect(chimesGainRef.current!);
        harmOsc.start(time);
        harmOsc.stop(time + 2.6);
      });
    } catch (e) {
      // ignore
    }
  };

  // Upgraded Flowing Water Bubbles - organic, randomized pops sweeping upwards
  const playWaterBubble = () => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "suspended" || !waterGainRef.current) return;

    try {
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const bubbleGain = ctx.createGain();

      const startFreq = 250 + Math.random() * 550; // 250Hz - 800Hz
      const endFreq = startFreq * (1.6 + Math.random() * 0.4);

      osc.type = "sine";
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.06); // rapid sweep

      bubbleGain.gain.setValueAtTime(0, time);
      bubbleGain.gain.linearRampToValueAtTime(0.015, time + 0.004);
      bubbleGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

      osc.connect(bubbleGain);
      bubbleGain.connect(waterGainRef.current);
      osc.start(time);
      osc.stop(time + 0.08);
    } catch (e) {
      // ignore
    }
  };

  // Cozy Wood Fire Crackles synthesizer - high-passed noise pops
  const playFireCrackle = () => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "suspended" || !fireGainRef.current) return;

    try {
      const time = ctx.currentTime;
      
      const bufferSize = ctx.sampleRate * 0.006; // extremely brief snap
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(3200 + Math.random() * 3800, time);

      const popGain = ctx.createGain();
      popGain.gain.setValueAtTime(0.12 * Math.random(), time);

      source.connect(filter);
      filter.connect(popGain);
      popGain.connect(fireGainRef.current);

      source.start(time);
      source.stop(time + 0.015);
    } catch (e) {
      // ignore
    }
  };

  // Trigger Temple Bronze Chime Sound
  const playBronzeChime = (freq = 180) => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "suspended" || !masterGainRef.current) return;

    try {
      const time = ctx.currentTime;
      // Main strike oscillator (sine) + metallic harmonics (square/sine combinations)
      const osc = ctx.createOscillator();
      const strikeGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      // Deep bell body resonance
      strikeGain.gain.setValueAtTime(0.0, time);
      strikeGain.gain.linearRampToValueAtTime(0.35, time + 0.02);
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, time + 4.5); // long decay

      osc.connect(strikeGain);
      strikeGain.connect(masterGainRef.current);
      osc.start();
      osc.stop(time + 5);

      // Higher metallic bell harmonics
      const harmonics = [2.0, 3.12, 4.4, 5.8];
      harmonics.forEach((mult, i) => {
        const harmOsc = ctx.createOscillator();
        const harmGain = ctx.createGain();
        
        harmOsc.type = "triangle";
        harmOsc.frequency.setValueAtTime(freq * mult, time);
        
        harmGain.gain.setValueAtTime(0.0, time);
        harmGain.gain.linearRampToValueAtTime(0.12 / (i + 1), time + 0.01);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.0 / (i + 1)); // fast decay for high rings
        
        harmOsc.connect(harmGain);
        harmGain.connect(masterGainRef.current!);
        harmOsc.start();
        harmOsc.stop(time + 3);
      });
    } catch (e) {
      console.warn("Chime play error:", e);
    }
  };

  // Toggle Mute/Unmute
  const togglePlay = () => {
    if (!audioCtxRef.current) {
      initAudio();
      return;
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
      setIsPlaying(true);
      playBronzeChime(220);
    } else if (isPlaying) {
      audioCtxRef.current.suspend();
      setIsPlaying(false);
    } else {
      audioCtxRef.current.resume();
      setIsPlaying(true);
      playBronzeChime(220);
    }
  };

  // Adjust volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
  };

  // React to atmosphere updates to morph the audio environment (gains, wind, water bed, flutes)!
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !masterGainRef.current || !windGainRef.current || !droneGainRef.current) return;

    const waterNoiseGain = waterNoiseGainRef.current;
    const fluteGain = fluteGainRef.current;
    const chimesGain = chimesGainRef.current;
    const fireGain = fireGainRef.current;

    const time = ctx.currentTime;
    
    // Morph synth, wind, and new procedural channel gains depending on the active Trigram atmosphere
    switch (atmosphere) {
      case "water": // Rain, rushing river, high water bubbles
        windGainRef.current.gain.linearRampToValueAtTime(0.08, time + 2.0);
        droneGainRef.current.gain.linearRampToValueAtTime(0.04, time + 2.0);
        if (windNodeRef.current) {
          windNodeRef.current.Q.linearRampToValueAtTime(1.8, time + 2.0); // wider, stormier
        }
        if (waterNoiseGain) waterNoiseGain.gain.linearRampToValueAtTime(0.06, time + 2.0);
        if (fluteGain) fluteGain.gain.linearRampToValueAtTime(0.4, time + 2.0);
        if (chimesGain) chimesGain.gain.linearRampToValueAtTime(0.35, time + 2.0);
        if (fireGain) fireGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        break;

      case "lake": // Peaceful mountain lake, soft water streams, sweet flutes
        windGainRef.current.gain.linearRampToValueAtTime(0.02, time + 2.0);
        droneGainRef.current.gain.linearRampToValueAtTime(0.08, time + 2.0);
        if (windNodeRef.current) {
          windNodeRef.current.Q.linearRampToValueAtTime(4.0, time + 2.0);
        }
        if (waterNoiseGain) waterNoiseGain.gain.linearRampToValueAtTime(0.035, time + 2.0);
        if (fluteGain) fluteGain.gain.linearRampToValueAtTime(0.7, time + 2.0);
        if (chimesGain) chimesGain.gain.linearRampToValueAtTime(0.6, time + 2.0);
        if (fireGain) fireGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        break;

      case "fire": // Crackling warm fire, deep resonant drone, minimal wind
        windGainRef.current.gain.linearRampToValueAtTime(0.015, time + 2.0);
        droneGainRef.current.gain.linearRampToValueAtTime(0.12, time + 2.0);
        if (windNodeRef.current) {
          windNodeRef.current.Q.linearRampToValueAtTime(5.0, time + 2.0);
        }
        if (waterNoiseGain) waterNoiseGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        if (fluteGain) fluteGain.gain.linearRampToValueAtTime(0.45, time + 2.0);
        if (chimesGain) chimesGain.gain.linearRampToValueAtTime(0.3, time + 2.0);
        if (fireGain) fireGain.gain.linearRampToValueAtTime(0.45, time + 2.0);
        break;

      case "sky": // Heavenly high atmosphere, prominent chimes, airy drone
        windGainRef.current.gain.linearRampToValueAtTime(0.07, time + 2.0);
        droneGainRef.current.gain.linearRampToValueAtTime(0.06, time + 2.0);
        if (waterNoiseGain) waterNoiseGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        if (fluteGain) fluteGain.gain.linearRampToValueAtTime(0.65, time + 2.0);
        if (chimesGain) chimesGain.gain.linearRampToValueAtTime(0.8, time + 2.0); // Chimes are loud
        if (fireGain) fireGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        break;

      case "wind": // Gusty breezing wind, active wind chimes
        windGainRef.current.gain.linearRampToValueAtTime(0.09, time + 2.0);
        droneGainRef.current.gain.linearRampToValueAtTime(0.05, time + 2.0);
        if (windNodeRef.current) {
          windNodeRef.current.Q.linearRampToValueAtTime(5.5, time + 2.0); // Whistling breezes
        }
        if (waterNoiseGain) waterNoiseGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        if (fluteGain) fluteGain.gain.linearRampToValueAtTime(0.6, time + 2.0);
        if (chimesGain) chimesGain.gain.linearRampToValueAtTime(0.75, time + 2.0);
        if (fireGain) fireGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        break;

      case "earth": // Deep resonant ground, heavy base drone, minimal chimes/wind
        windGainRef.current.gain.linearRampToValueAtTime(0.01, time + 2.0);
        droneGainRef.current.gain.linearRampToValueAtTime(0.18, time + 2.0);
        if (waterNoiseGain) waterNoiseGain.gain.linearRampToValueAtTime(0.005, time + 2.0);
        if (fluteGain) fluteGain.gain.linearRampToValueAtTime(0.5, time + 2.0);
        if (chimesGain) chimesGain.gain.linearRampToValueAtTime(0.2, time + 2.0);
        if (fireGain) fireGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        break;

      case "thunder": // Highly charged air, dark howling wind, sparse high bells
        windGainRef.current.gain.linearRampToValueAtTime(0.10, time + 2.0);
        droneGainRef.current.gain.linearRampToValueAtTime(0.08, time + 2.0);
        if (waterNoiseGain) waterNoiseGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        if (fluteGain) fluteGain.gain.linearRampToValueAtTime(0.35, time + 2.0);
        if (chimesGain) chimesGain.gain.linearRampToValueAtTime(0.5, time + 2.0);
        if (fireGain) fireGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        break;

      case "mountain": // Quiet peak sanctuary, slow meditative flutes, periodic distant chime
        windGainRef.current.gain.linearRampToValueAtTime(0.03, time + 2.0);
        droneGainRef.current.gain.linearRampToValueAtTime(0.10, time + 2.0);
        if (waterNoiseGain) waterNoiseGain.gain.linearRampToValueAtTime(0.01, time + 2.0);
        if (fluteGain) fluteGain.gain.linearRampToValueAtTime(0.8, time + 2.0); // Flutes take center stage
        if (chimesGain) chimesGain.gain.linearRampToValueAtTime(0.5, time + 2.0);
        if (fireGain) fireGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        break;

      default: // Temple default peaceful ambience
        windGainRef.current.gain.linearRampToValueAtTime(0.03, time + 2.0);
        droneGainRef.current.gain.linearRampToValueAtTime(0.08, time + 2.0);
        if (windNodeRef.current) {
          windNodeRef.current.Q.linearRampToValueAtTime(4.0, time + 2.0);
        }
        if (waterNoiseGain) waterNoiseGain.gain.linearRampToValueAtTime(0.015, time + 2.0);
        if (fluteGain) fluteGain.gain.linearRampToValueAtTime(0.65, time + 2.0);
        if (chimesGain) chimesGain.gain.linearRampToValueAtTime(0.55, time + 2.0);
        if (fireGain) fireGain.gain.linearRampToValueAtTime(0.0, time + 2.0);
        break;
    }
  }, [atmosphere]);

  // Dynamically orchestrate background procedural sound sequencers based on play state and active atmosphere
  useEffect(() => {
    // Clear all existing intervals first
    if (fluteIntervalRef.current) clearInterval(fluteIntervalRef.current);
    if (chimesIntervalRef.current) clearInterval(chimesIntervalRef.current);
    if (waterIntervalRef.current) clearInterval(waterIntervalRef.current);
    if (fireIntervalRef.current) clearInterval(fireIntervalRef.current);

    if (!isPlaying || !audioCtxRef.current) return;

    // 1. Bamboo Flute (Sáo Trúc) sequencer removed per user request

    // 2. Wind Chimes (Chuông Gió) generator
    let chimePeriod = 6500; // default 6.5s
    if (["sky", "wind", "thunder"].includes(atmosphere)) {
      chimePeriod = 3200; // active wind chimes blowing in high skies
    } else if (["water", "lake"].includes(atmosphere)) {
      chimePeriod = 5500; // gentle waterfront chimes
    } else if (atmosphere === "earth") {
      chimePeriod = 11000; // very sparse
    }

    const triggerChimes = () => {
      // Trigger a cluster of 1 to 3 chimes closely spaced to sound like a natural wooden/metal chime set swinging
      const numChimes = 1 + Math.floor(Math.random() * 3);
      const chimeScale = [880.00, 987.77, 1174.66, 1318.51, 1567.98, 1760.00]; // high pentatonic set (A5 to A6)
      
      for (let i = 0; i < numChimes; i++) {
        setTimeout(() => {
          const randomPitch = chimeScale[Math.floor(Math.random() * chimeScale.length)];
          playWindChime(randomPitch);
        }, i * (120 + Math.random() * 320)); // organic strumming/clashing delay
      }
    };

    chimesIntervalRef.current = setInterval(() => {
      // 75% chance to trigger chimes on each interval ticks to sound more organic
      if (Math.random() < 0.75) {
        triggerChimes();
      }
    }, chimePeriod);

    // 3. Flowing Water (Suối Chảy) bubble pops sequencer
    if (["water", "lake"].includes(atmosphere)) {
      // Fast interval to simulate a detailed continuous sparkling water stream
      waterIntervalRef.current = setInterval(() => {
        if (Math.random() < 0.65) {
          playWaterBubble();
        }
      }, 80);
    } else if (["temple", "mountain"].includes(atmosphere)) {
      // A gentle, slow Zen stone water fountain (dripping occasionally)
      waterIntervalRef.current = setInterval(() => {
        if (Math.random() < 0.25) {
          playWaterBubble();
          setTimeout(playWaterBubble, 140);
          setTimeout(playWaterBubble, 300);
        }
      }, 3500);
    }

    // 4. Wood Fire Crackling sequencer
    if (atmosphere === "fire") {
      fireIntervalRef.current = setInterval(() => {
        const intensity = Math.random();
        if (intensity < 0.35) {
          playFireCrackle();
        }
        if (intensity < 0.08) {
          setTimeout(playFireCrackle, 40);
        }
      }, 35); // quick scheduling ticks
    }

    return () => {
      if (fluteIntervalRef.current) clearInterval(fluteIntervalRef.current);
      if (chimesIntervalRef.current) clearInterval(chimesIntervalRef.current);
      if (waterIntervalRef.current) clearInterval(waterIntervalRef.current);
      if (fireIntervalRef.current) clearInterval(fireIntervalRef.current);
    };
  }, [isPlaying, atmosphere]);

  return (
    <div
      id="ambient-audio-panel"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-white/5 bg-[#161618]/90 p-2.5 px-4 backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37]/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]"
    >
      <button
        id="btn-toggle-sound"
        onClick={togglePlay}
        className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
          isPlaying
            ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30"
            : "bg-black/30 text-stone-400 border border-white/5"
        }`}
        title={isPlaying ? "Mute Temple Ambience" : "Enter Soundscape"}
      >
        {isPlaying ? (
          <Volume2 className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
        ) : (
          <VolumeX className="h-4.5 w-4.5" />
        )}
        <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
      </button>

      <button
        id="btn-temple-bell"
        onClick={() => {
          if (!audioCtxRef.current) initAudio();
          else playBronzeChime(160);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-black/30 text-stone-300 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all duration-300"
        title="Ring Temple Bell"
      >
        <Bell className="h-4.5 w-4.5 hover:animate-bounce" />
      </button>

      {isPlaying && (
        <div className="flex items-center gap-2 animate-fade-in pl-1">
          <Music className="h-3.5 w-3.5 text-[#D4AF37]/60 animate-spin" style={{ animationDuration: "12s" }} />
          <input
            id="slider-sound-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 rounded-lg bg-white/10 accent-[#D4AF37] cursor-pointer"
            title="Volume"
          />
          <span className="text-[10px] font-cinzel text-[#D4AF37]/60 uppercase tracking-widest hidden md:inline">
            {atmosphere}
          </span>
        </div>
      )}

      {!audioCtxRef.current && (
        <button
          onClick={togglePlay}
          className="text-xs font-cinzel font-semibold text-[#D4AF37]/90 hover:text-[#D4AF37] animate-pulse pl-1 pr-1 border-b border-[#D4AF37]/30 tracking-widest uppercase cursor-pointer"
        >
          Activate Sound
        </button>
      )}
    </div>
  );
}
