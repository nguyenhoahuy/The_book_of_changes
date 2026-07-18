/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Compass, Volume2, SkipForward } from "lucide-react";
// @ts-ignore
import shanshuiBg from "../assets/images/shanshui_background_1784186219087.jpg";

interface IntroScreenProps {
  onEnter: () => void;
  key?: string;
}

type CinematicStage = "idle" | "darkness" | "particles" | "clouds" | "temple-appears" | "doors-opening" | "portal-fade";

export default function IntroScreen({ onEnter }: IntroScreenProps) {
  const [stage, setStage] = useState<CinematicStage>("idle");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Skip the cinematic and enter directly
  const handleSkip = () => {
    // Stop any audio
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
    }
    onEnter();
  };

  // Web Audio API: Synthesize the deep cinematic bell, chanting hum, and wind
  const playCinematicAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      setIsPlayingAudio(true);

      const time = ctx.currentTime;

      // 1. Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4, time);
      masterGain.connect(ctx.destination);

      // 2. DEEP BRONZE BELL (90Hz + metallic overtones)
      const bellFreq = 90;
      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(0, time);
      bellGain.gain.linearRampToValueAtTime(0.6, time + 0.05);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, time + 14.0);
      bellGain.connect(masterGain);

      // Fundamental
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(bellFreq, time);
      osc1.connect(bellGain);
      osc1.start(time);
      osc1.stop(time + 15);

      // Harmonics for rich metallic resonance
      const overtones = [1.98, 2.95, 4.1, 5.85, 8.2];
      overtones.forEach((mult, i) => {
        const oscH = ctx.createOscillator();
        oscH.type = "triangle";
        oscH.frequency.setValueAtTime(bellFreq * mult, time);

        const gainH = ctx.createGain();
        gainH.gain.setValueAtTime(0, time);
        gainH.gain.linearRampToValueAtTime(0.25 / (i + 1), time + 0.02);
        gainH.gain.exponentialRampToValueAtTime(0.0001, time + 8.0 / (i + 1));

        oscH.connect(gainH);
        gainH.connect(bellGain);
        oscH.start(time);
        oscH.stop(time + 10);
      });

      // Second bell strike a bit later to enhance depth
      setTimeout(() => {
        if (ctx.state === "closed") return;
        const subTime = ctx.currentTime;
        const bellGain2 = ctx.createGain();
        bellGain2.gain.setValueAtTime(0, subTime);
        bellGain2.gain.linearRampToValueAtTime(0.4, subTime + 0.05);
        bellGain2.gain.exponentialRampToValueAtTime(0.0001, subTime + 10.0);
        bellGain2.connect(masterGain);

        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(bellFreq * 1.5, subTime); // perfect fifth relation
        osc2.connect(bellGain2);
        osc2.start(subTime);
        osc2.stop(subTime + 11);
      }, 3500);

      // 3. WIND NOISE SWEEP
      const bufferSize = ctx.sampleRate * 5; // 5s buffer
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "lowpass";
      windFilter.Q.setValueAtTime(5.0, time);
      windFilter.frequency.setValueAtTime(120, time);
      windFilter.frequency.exponentialRampToValueAtTime(450, time + 4.0);
      windFilter.frequency.exponentialRampToValueAtTime(200, time + 9.0);

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0, time);
      windGain.gain.linearRampToValueAtTime(0.15, time + 2.5); // wind rises
      windGain.gain.exponentialRampToValueAtTime(0.001, time + 14.0);

      noiseNode.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(masterGain);
      noiseNode.start(time);
      noiseNode.stop(time + 15);

      // 4. ANCIENT MONK CHANTING HUM (Pulsating low detuned hum)
      const chantFrequencies = [55.0, 110.0, 165.0]; // Low A notes
      const chantGain = ctx.createGain();
      chantGain.gain.setValueAtTime(0, time);
      chantGain.gain.linearRampToValueAtTime(0.28, time + 3.0); // chants rise slowly
      chantGain.gain.exponentialRampToValueAtTime(0.0001, time + 14.5);
      chantGain.connect(masterGain);

      chantFrequencies.forEach((freq, idx) => {
        const chantOsc = ctx.createOscillator();
        chantOsc.type = "sawtooth"; // Rich in harmonics
        chantOsc.frequency.setValueAtTime(freq, time);

        // Lowpass filter to muffle the sawtooth, making it sound like a deep chesty hum
        const vocalFilter = ctx.createBiquadFilter();
        vocalFilter.type = "lowpass";
        vocalFilter.frequency.setValueAtTime(220, time); // cut off high sizzle
        vocalFilter.Q.setValueAtTime(3.0, time);

        // Slow LFO to simulate breathing/pulsating chant
        const breathLFO = ctx.createOscillator();
        const breathGain = ctx.createGain();
        breathLFO.frequency.setValueAtTime(0.35 + idx * 0.05, time); // slow breath
        breathGain.gain.setValueAtTime(0.08, time);
        
        breathLFO.connect(breathGain);
        
        const oscGainNode = ctx.createGain();
        oscGainNode.gain.setValueAtTime(0.12, time);
        breathGain.connect(oscGainNode.gain);

        chantOsc.connect(vocalFilter);
        vocalFilter.connect(oscGainNode);
        oscGainNode.connect(chantGain);

        chantOsc.start(time);
        breathLFO.start(time);
        chantOsc.stop(time + 15);
        breathLFO.stop(time + 15);
      });

    } catch (e) {
      console.warn("Failed to play Web Audio intro cinematic:", e);
    }
  };

  // Orchestrate the stage-by-stage cinematic sequence
  const startCinematic = () => {
    // 1. Immediately play procedural audio
    playCinematicAudio();
    
    // 2. Sequence transitions
    setStage("darkness");

    // After 2.2s: Golden particles start emerging
    setTimeout(() => {
      setStage("particles");
    }, 2200);

    // After 4.8s: Camera descends through clouds
    setTimeout(() => {
      setStage("clouds");
    }, 4800);

    // After 7.5s: Giant temple outline emerges
    setTimeout(() => {
      setStage("temple-appears");
    }, 7500);

    // After 10.5s: Massive bronze doors open
    setTimeout(() => {
      setStage("doors-opening");
    }, 10500);

    // After 13.2s: Entering portal flash
    setTimeout(() => {
      setStage("portal-fade");
    }, 13200);

    // After 14.5s: Transition fully inside Bagua Hall
    setTimeout(() => {
      onEnter();
    }, 14500);
  };

  return (
    <div
      id="intro-cinematic-container"
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#050506] text-white select-none"
    >
      <AnimatePresence mode="wait">
        {/* --- STAGE 0: IDLE ENTRY SCREEN --- */}
        {stage === "idle" && (
          <motion.div
            key="idle-view"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2 } }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 z-30"
          >
            {/* Drifting Clouds & Shimmering Shanshui Fog Layers */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 mix-blend-lighten pointer-events-none" 
              style={{ backgroundImage: `url(${shanshuiBg})` }} 
            />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=2000')] bg-cover opacity-5 mix-blend-overlay animate-pulse" style={{ animationDuration: "14s" }} />
            
            {/* Ambient Mountains */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none overflow-hidden opacity-30">
              <svg className="absolute bottom-0 w-full h-80 text-stone-900" viewBox="0 0 1440 320" fill="currentColor" preserveAspectRatio="none">
                <path d="M0,192L120,202.7C240,213,480,235,720,224C960,213,1200,171,1320,149.3L1440,128L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"></path>
              </svg>
            </div>

            {/* Glowing Daoist Gate outline in background */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none scale-75 md:scale-90">
              <svg width="400" height="300" viewBox="0 0 400 300" fill="none" className="text-[#D4AF37]">
                <path d="M50 80C120 40 280 40 350 80L340 100C280 70 120 70 60 100L50 80Z" fill="currentColor" />
                <rect x="90" y="100" width="220" height="15" fill="currentColor" opacity="0.8" />
                <rect x="120" y="115" width="160" height="150" fill="currentColor" opacity="0.3" />
                <line x1="130" y1="115" x2="130" y2="265" stroke="currentColor" strokeWidth="8" />
                <line x1="270" y1="115" x2="270" y2="265" stroke="currentColor" strokeWidth="8" />
              </svg>
            </div>

            {/* Calligraphy Watermarks */}
            <div className="absolute text-[30vw] md:text-[22vw] font-noto font-black text-stone-900/10 pointer-events-none select-none tracking-widest leading-none">
              易
            </div>

            {/* Content box */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-4">
              {/* Subtle badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 1.0 }}
                className="mb-6 flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/5 px-5 py-2 backdrop-blur-md"
              >
                <Compass className="h-4.5 w-4.5 text-[#D4AF37] animate-spin" style={{ animationDuration: "25s" }} />
                <span className="text-[10px] md:text-xs font-cinzel tracking-[0.35em] text-[#D4AF37] uppercase glow-gold">
                  ĐỆ NHẤT KỲ QUAN ĐẠO PHÁP • BÁT QUÁI ĐÀI
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 1.2 }}
                className="font-cinzel text-5xl md:text-8xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#D4AF37] to-[#B8962D] mb-4 select-none leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]"
              >
                ĐỀN BÁT QUÁI
              </motion.h1>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 1.0 }}
                className="text-xs md:text-sm font-cinzel tracking-[0.55em] text-[#D4AF37] mb-8 uppercase glow-gold"
              >
                「 THE BAGUA TEMPLE • PHÁP ĐÀI BIẾN DỊCH 」
              </motion.h2>

              <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mb-8" />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ delay: 0.9, duration: 1.2 }}
                className="font-playfair text-sm md:text-base text-stone-300 leading-relaxed tracking-wide mb-12 italic max-w-lg"
              >
                &ldquo;Vô cực sinh Thái cực, Thái cực sinh Lưỡng nghi. Tĩnh lặng hóa hơi thở, Âm Dương hòa quyện mở lối sáu mươi tư quẻ Kinh Dịch huyền vi.&rdquo;
              </motion.p>

              {/* Start Ritual button */}
              <motion.button
                id="btn-start-cinematic-ritual"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={startCinematic}
                className="group relative px-12 py-4.5 overflow-hidden rounded-full border border-[#D4AF37] bg-stone-950/80 text-[#D4AF37] tracking-[0.45em] font-cinzel text-xs uppercase transition-all duration-500 hover:bg-[#D4AF37]/15 hover:text-white hover:shadow-[0_0_40px_rgba(212,175,55,0.35)] cursor-pointer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/20 to-[#D4AF37]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  KHỞI HÀNH VÀO ĐỀN THỜ
                  <Sparkles className="h-4 w-4 text-[#D4AF37] group-hover:animate-ping" />
                </span>
              </motion.button>
            </div>

            {/* Bottom Credit */}
            <div className="absolute bottom-6 flex flex-col items-center opacity-30">
              <span className="text-[10px] font-cinzel tracking-[0.25em] text-stone-500 uppercase">
                Vận Hành Bởi Trí Tuệ Nhân Tạo Gemini AI • Phiên Bản Khải Huyền Kỳ Vĩ
              </span>
            </div>
          </motion.div>
        )}

        {/* --- CINEMATIC PLAYBACK OVERLAYS --- */}
        {stage !== "idle" && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black">
            
            {/* Skip cinematic button */}
            <button
              onClick={handleSkip}
              className="absolute top-6 right-6 z-[100] flex items-center gap-2 border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-full px-5 py-2 text-[10px] font-cinzel tracking-widest text-[#D4AF37] bg-black/60 backdrop-blur-md hover:bg-black/80 hover:text-white transition-all cursor-pointer shadow-lg"
            >
              Skip Intro
              <SkipForward className="h-3.5 w-3.5" />
            </button>

            {/* Sound indicator */}
            {isPlayingAudio && (
              <div className="absolute bottom-6 left-6 z-[100] flex items-center gap-2.5 bg-black/50 border border-white/5 p-2 rounded-full px-4 text-[9px] font-mono text-stone-400 tracking-wider">
                <Volume2 className="h-3.5 w-3.5 text-[#D4AF37] animate-pulse" />
                <span>SOUND ON: CHUÔNG & THIỀN CHÚ</span>
              </div>
            )}

            {/* --- SEQUENCE 1: COMPLETED DARKNESS & BELL --- */}
            {stage === "darkness" && (
              <motion.div
                key="stage-darkness"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
              >
                <motion.p
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: [0, 0.9, 0.9, 0], scale: 1 }}
                  transition={{ times: [0, 0.2, 0.8, 1], duration: 2.2 }}
                  className="font-playfair text-stone-400 italic text-base md:text-lg max-w-md"
                >
                  * Tiếng chuông đồng cổ ngân vang qua sương khói... *
                </motion.p>
              </motion.div>
            )}

            {/* --- SEQUENCE 2: GOLDEN DUST PARTICLES --- */}
            {stage === "particles" && (
              <motion.div
                key="stage-particles"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 overflow-hidden"
              >
                {/* Floating gold dust rise */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,_#D4AF37_1px,_transparent_1.5px)] bg-[size:28px_28px] opacity-25 animate-scroll-up" style={{ animationDuration: "6s" }} />
                
                {/* Ancient glowing Taoist runes floating */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                  <div className="text-stone-800 text-[18vw] font-noto opacity-10 font-bold select-none">乾 坤 震 巽 坎 離 艮 兌</div>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: [0, 0.85, 0.85, 0], y: 0 }}
                  transition={{ times: [0, 0.2, 0.8, 1], duration: 2.6 }}
                  className="font-playfair text-[#D4AF37] text-base md:text-xl tracking-wide font-medium italic z-10"
                >
                  &ldquo;Năng lượng khởi sinh từ cõi hư vô.&rdquo;
                </motion.p>
              </motion.div>
            )}

            {/* --- SEQUENCE 3: CAMERA DESCENDS THROUGH CLOUDS --- */}
            {stage === "clouds" && (
              <motion.div
                key="stage-clouds"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
              >
                {/* Cloud layer 1 (Expanding/Zooming out to simulate camera diving through) */}
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: [0, 0.85, 0.4, 0] }}
                  transition={{ duration: 2.7, ease: "easeIn" }}
                  className="absolute w-[180vw] h-[180vw] rounded-full bg-gradient-to-r from-stone-800/10 via-stone-700/20 to-stone-900/15 blur-[60px]"
                />

                {/* Cloud layer 2 (Faster, offset) */}
                <motion.div
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 3.2, opacity: [0, 0.9, 0.3, 0] }}
                  transition={{ delay: 0.4, duration: 2.3, ease: "easeIn" }}
                  className="absolute w-[160vw] h-[160vw] rounded-full bg-gradient-to-l from-stone-700/15 via-stone-600/25 to-stone-800/15 blur-[50px]"
                />

                {/* Flying Chinese scroll symbols */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(212,175,55,0.06)_1.5px,_transparent_1.5px)] bg-[size:40px_40px] opacity-70 animate-ping" style={{ animationDuration: "4s" }} />

                <motion.p
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: [0, 0.9, 0.9, 0], scale: 1 }}
                  transition={{ times: [0, 0.15, 0.85, 1], duration: 2.7 }}
                  className="font-cinzel text-stone-300 text-xs md:text-sm tracking-[0.45em] uppercase font-bold z-10"
                >
                  XUYÊN QUA MÂY NGÀN... HẠ CÁNH XUỐNG ĐỀN THỜ
                </motion.p>
              </motion.div>
            )}

            {/* --- SEQUENCE 4: SACRED TEMPLE EMERGES --- */}
            {stage === "temple-appears" && (
              <motion.div
                key="stage-temple"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900/40 to-black"
              >
                {/* Shimmering gold fog at bottom */}
                <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#D4AF37]/5 to-transparent blur-md pointer-events-none" />

                {/* Majestic glowing Temple Structure appears from mist */}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0, y: 30 }}
                  animate={{ scale: 1.05, opacity: 0.75, y: 0 }}
                  transition={{ duration: 3.0, ease: "easeOut" }}
                  className="relative flex items-center justify-center w-full max-w-xl h-80"
                >
                  {/* Subtle god rays shooting from behind temple */}
                  <div className="absolute inset-0 flex justify-center items-center opacity-30 mix-blend-screen pointer-events-none">
                    <div className="absolute w-[2px] h-[500px] bg-gradient-to-t from-[#D4AF37] to-transparent rotate-[20deg]" />
                    <div className="absolute w-[2px] h-[500px] bg-gradient-to-t from-[#D4AF37] to-transparent rotate-[40deg]" />
                    <div className="absolute w-[2px] h-[500px] bg-gradient-to-t from-[#D4AF37] to-transparent rotate-[-20deg]" />
                    <div className="absolute w-[2px] h-[500px] bg-gradient-to-t from-[#D4AF37] to-transparent rotate-[-40deg]" />
                    <div className="absolute w-[3px] h-[500px] bg-gradient-to-t from-[#D4AF37] to-transparent" />
                  </div>

                  {/* High quality Temple Palace silhouette SVG */}
                  <svg width="420" height="300" viewBox="0 0 500 350" fill="none" className="text-[#D4AF37] filter drop-shadow-[0_0_35px_rgba(212,175,55,0.45)]">
                    {/* Roof Tier 3 (Top) */}
                    <path d="M 200 80 C 230 45 270 45 300 80 L 290 98 C 270 85 230 85 210 98 Z" fill="currentColor" opacity="0.9" />
                    <path d="M 235 50 L 265 50 L 250 35 Z" fill="currentColor" />
                    <line x1="250" y1="50" x2="250" y2="80" stroke="currentColor" strokeWidth="3" />

                    {/* Roof Tier 2 (Middle) */}
                    <path d="M 120 140 C 180 90 320 90 380 140 L 360 165 C 310 145 190 145 140 165 Z" fill="currentColor" opacity="0.8" />
                    
                    {/* Columns and Pillars */}
                    <rect x="160" y="165" width="20" height="150" fill="currentColor" opacity="0.75" />
                    <rect x="320" y="165" width="20" height="150" fill="currentColor" opacity="0.75" />
                    <rect x="242" y="165" width="16" height="150" fill="currentColor" opacity="0.4" />
                    
                    {/* Base Platform */}
                    <rect x="80" y="300" width="340" height="25" rx="4" fill="currentColor" opacity="0.9" />
                    <rect x="60" y="325" width="380" height="15" rx="2" fill="currentColor" opacity="0.5" />
                    
                    {/* Hanging lanterns */}
                    <g opacity="0.8">
                      <line x1="110" y1="170" x2="110" y2="200" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="102" y="200" width="16" height="24" rx="4" fill="currentColor" />
                      <circle cx="110" cy="226" r="3" fill="#FFF" />
                    </g>
                    <g opacity="0.8">
                      <line x1="390" y1="170" x2="390" y2="200" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="382" y="200" width="16" height="24" rx="4" fill="currentColor" />
                      <circle cx="390" cy="226" r="3" fill="#FFF" />
                    </g>
                  </svg>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: [0, 0.9, 0.9, 0], y: 0 }}
                  transition={{ times: [0, 0.15, 0.85, 1], duration: 3.0 }}
                  className="font-cinzel text-[#D4AF37] text-sm md:text-base tracking-[0.4em] uppercase text-center max-w-md glow-gold z-10"
                >
                  ĐIỆN BÁT QUÁI NỔI LÊN GIỮA SƯƠNG KHÓI
                </motion.p>
              </motion.div>
            )}

            {/* --- SEQUENCE 5: BRONZE DOORS OPEN --- */}
            {stage === "doors-opening" && (
              <motion.div
                key="stage-doors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-stone-950 overflow-hidden"
              >
                {/* Background Golden Gateway glow */}
                <div className="absolute w-[250px] h-[400px] md:w-[350px] md:h-[550px] rounded-t-full bg-[#D4AF37]/25 filter blur-3xl scale-125" />
                <div className="absolute w-[180px] h-[320px] md:w-[260px] md:h-[420px] rounded-t-full bg-white/20 filter blur-xl animate-pulse" />

                {/* Left Door Plate */}
                <motion.div
                  initial={{ x: "0%" }}
                  animate={{ x: "-95%", transition: { delay: 0.5, duration: 2.2, ease: "easeInOut" } }}
                  className="absolute left-0 inset-y-0 w-1/2 bg-gradient-to-l from-stone-850 to-stone-950 border-r-4 border-[#D4AF37]/45 z-20 flex flex-col justify-center items-end shadow-[20px_0_40px_rgba(0,0,0,0.9)]"
                >
                  {/* Detailed Bronze Door Engraving Details */}
                  <div className="mr-8 w-40 md:w-56 h-80 border-2 border-[#D4AF37]/15 rounded-md flex flex-col justify-between p-4 text-[#D4AF37]/35 select-none font-noto">
                    <span className="text-xl md:text-3xl font-light">乾 坤</span>
                    <div className="w-full h-0.5 bg-[#D4AF37]/10" />
                    <span className="text-xs font-cinzel leading-relaxed [writing-mode:vertical-rl] tracking-widest uppercase">
                      THẦN THÁNH KHAI CƠ
                    </span>
                    <div className="w-full h-0.5 bg-[#D4AF37]/10" />
                    <span className="text-xl md:text-3xl font-light text-right">震 巽</span>
                  </div>
                </motion.div>

                {/* Right Door Plate */}
                <motion.div
                  initial={{ x: "0%" }}
                  animate={{ x: "95%", transition: { delay: 0.5, duration: 2.2, ease: "easeInOut" } }}
                  className="absolute right-0 inset-y-0 w-1/2 bg-gradient-to-r from-stone-850 to-stone-950 border-l-4 border-[#D4AF37]/45 z-20 flex flex-col justify-center items-start shadow-[-20px_0_40px_rgba(0,0,0,0.9)]"
                >
                  {/* Detailed Bronze Door Engraving Details */}
                  <div className="ml-8 w-40 md:w-56 h-80 border-2 border-[#D4AF37]/15 rounded-md flex flex-col justify-between p-4 text-[#D4AF37]/35 select-none font-noto">
                    <span className="text-xl md:text-3xl font-light">坎 離</span>
                    <div className="w-full h-0.5 bg-[#D4AF37]/10" />
                    <span className="text-xs font-cinzel leading-relaxed [writing-mode:vertical-rl] tracking-widest uppercase">
                      VẠN VẬT TUẦN HOÀN
                    </span>
                    <div className="w-full h-0.5 bg-[#D4AF37]/10" />
                    <span className="text-xl md:text-3xl font-light text-right">艮 兌</span>
                  </div>
                </motion.div>

                {/* Open door voice label */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0, 0.9, 0.9, 0], scale: 1 }}
                  transition={{ times: [0, 0.15, 0.85, 1], duration: 2.7 }}
                  className="font-cinzel text-white text-xs md:text-sm tracking-[0.35em] uppercase font-bold z-30 pointer-events-none text-center bg-black/50 px-6 py-3 rounded border border-white/5 shadow-2xl"
                >
                  CỬA ĐỒNG KHAI CHẨN... HƯỚNG VÀO CHÂN LÝ
                </motion.div>
              </motion.div>
            )}

            {/* --- SEQUENCE 6: PORTAL LIGHT FLASH FADE --- */}
            {stage === "portal-fade" && (
              <motion.div
                key="stage-portal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0 bg-gradient-to-b from-white via-amber-100 to-[#D4AF37] z-50 flex items-center justify-center"
              >
                <div className="animate-ping w-48 h-48 rounded-full bg-white opacity-40" />
              </motion.div>
            )}

          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scroll-up {
          0% { background-position: 0 0; }
          100% { background-position: 0 -168px; }
        }
        .animate-scroll-up {
          animation: scroll-up 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
