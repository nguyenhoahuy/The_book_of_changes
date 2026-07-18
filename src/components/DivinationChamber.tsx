/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, HelpCircle, FileText, Send, RefreshCw, PenTool, Compass } from "lucide-react";
import { getHexagramByBinary, interpretToss, HEXAGRAMS_DB } from "../data/ichingData";
import { DivinationSession, Hexagram } from "../types";
// @ts-ignore
import shanshuiBg from "../assets/images/shanshui_background_1784186219087.jpg";

interface DivinationChamberProps {
  onComplete: (session: DivinationSession) => void;
  onCancel: () => void;
}

// Seedable PRNG helpers (cyrb128 hash + sfc32 PRNG)
function cyrb128(str: string): number[] {
  let h1 = 1779033703, h2 = 3024734711, h3 = 3362453659, h4 = 50249339;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export default function DivinationChamber({ onComplete, onCancel }: DivinationChamberProps) {
  const [step, setStep] = useState<"question" | "toss" | "result">("question");
  const [question, setQuestion] = useState("");
  const [method, setMethod] = useState<"coins" | "yarrow" | "numerology">("coins");

  // 8D Parallax Mouse Tracking State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Taiji Hover State
  const [isTaijiHovered, setIsTaijiHovered] = useState(false);

  // Dynamic list of 64 hexagrams for the outer-most ring
  const hexagramsList = Object.entries(HEXAGRAMS_DB).map(([num, hex]) => ({
    ...hex,
    number: parseInt(num),
  }));

  // Click ripple effects inside the bagua bowl
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // 8 Bagua Trigrams (Bát Quái) details for the interactive 8D holographic rings
  const trigrams = [
    { name: "Càn (Trời)", symbol: "☰", english: "Chien", description: "Sự Sáng Tạo, Khởi Đầu Mạnh Mẽ" },
    { name: "Đoài (Đầm)", symbol: "☱", english: "Tui", description: "Hân Hoan, Hồ Nước Tĩnh Lặng" },
    { name: "Ly (Lửa)", symbol: "☲", english: "Li", description: "Sáng Sủa, Sự Gắn Kết Lan Toả" },
    { name: "Chấn (Sấm)", symbol: "☳", english: "Chen", description: "Rung Động, Đánh Thức Sức Mạnh" },
    { name: "Tốn (Gió)", symbol: "☴", english: "Sun", description: "Dịu Dàng, Sự Thấu Suốt Uyển Chuyển" },
    { name: "Khảm (Nước)", symbol: "☵", english: "Kan", description: "Hiểm Trở, Dòng Chảy Sâu Sắc" },
    { name: "Cấn (Núi)", symbol: "☶", english: "Ken", description: "Ngưng Nghỉ, Sự Vững Chãi Yên Lặng" },
    { name: "Khôn (Đất)", symbol: "☷", english: "Kun", description: "Nhu Thuận, Nâng Đỡ Vạn Vật" }
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const addRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1200);
  };
  
  // Toss tracking
  const [tosses, setTosses] = useState<number[][]>([]);
  const [isTossing, setIsTossing] = useState(false);
  const [currentTossResult, setCurrentTossResult] = useState<number[] | null>(null);

  // Auto-Casting States for Observable Automated Sequence
  const [isAutoCasting, setIsAutoCasting] = useState(false);
  const [autoCastQueue, setAutoCastQueue] = useState<number[][]>([]);
  const [autoCastIndex, setAutoCastIndex] = useState(0);
  const [autoCastPhase, setAutoCastPhase] = useState<"idle" | "shuffling" | "revealed">("idle");

  // Xào & Chọn States for Interactive Ceremony
  const [shufflingState, setShufflingState] = useState<"idle" | "shuffling" | "selecting" | "revealed">("idle");
  const [selectedCoins, setSelectedCoins] = useState<boolean[]>([false, false, false]);
  const [currentRoundCoins, setCurrentRoundCoins] = useState<number[]>([2, 2, 2]); // 2 is Yin (Heads), 3 is Yang (Tails)
  const [hoveredHex, setHoveredHex] = useState<number | null>(null);

  // Animated positions for the 3 coins during toss (kept for backward compatibility/styling)
  const [coinStates, setCoinStates] = useState([
    { rotX: 0, rotY: 0, x: -60, y: 0, state: 2 }, // 2=Heads, 3=Tails
    { rotX: 0, rotY: 0, x: 0, y: -20, state: 2 },
    { rotX: 0, rotY: 0, x: 60, y: 0, state: 2 },
  ]);

  // Handle Question Submit
  const handleStartRitual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    if (method === "numerology") {
      // Meihua Spontaneous Number Method: generates full hexagram instantly based on letters & time
      generateSpontaneousReading();
    } else if (method === "yarrow") {
      // Yarrow Stalk method: simulates the classical 3-step filtering of 50 stalks (which has different probability)
      generateYarrowReading();
    } else {
      // Active interactive Coin tossing
      setStep("toss");
      setShufflingState("idle");
      setSelectedCoins([false, false, false]);
    }
  };

  // Observable Automated Sequence Hook
  React.useEffect(() => {
    if (!isAutoCasting || step !== "toss" || autoCastIndex >= 6) return;

    let timeoutId: NodeJS.Timeout;

    if (autoCastPhase === "idle") {
      // Wait a moment then transition to shuffling
      timeoutId = setTimeout(() => {
        setAutoCastPhase("shuffling");
        // Trigger temple bell
        const soundEl = document.getElementById("ambient-audio-panel");
        if (soundEl) {
          const ringBtn = soundEl.querySelector("#btn-temple-bell") as HTMLButtonElement;
          if (ringBtn) ringBtn.click();
        }
      }, 600);
    } else if (autoCastPhase === "shuffling") {
      // Let it shuffle for 2.2 seconds to simulate casting/sorting
      timeoutId = setTimeout(() => {
        setAutoCastPhase("revealed");
        // Trigger bell chime when the line result is revealed
        const soundEl = document.getElementById("ambient-audio-panel");
        if (soundEl) {
          const ringBtn = soundEl.querySelector("#btn-temple-bell") as HTMLButtonElement;
          if (ringBtn) ringBtn.click();
        }
      }, 2500);
    } else if (autoCastPhase === "revealed") {
      // Leave the result visible for 3 seconds so the viewer can observe
      timeoutId = setTimeout(() => {
        const nextToss = autoCastQueue[autoCastIndex];
        const nextTosses = [...tosses, nextToss];
        setTosses(nextTosses);

        if (autoCastIndex < 5) {
          // Go to next line
          setAutoCastIndex((prev) => prev + 1);
          setAutoCastPhase("idle");
        } else {
          // Complete!
          setIsAutoCasting(false);
          // Let it transition to the results screen gracefully
          finishReading(autoCastQueue);
        }
      }, 3000);
    }

    return () => clearTimeout(timeoutId);
  }, [isAutoCasting, step, autoCastIndex, autoCastPhase, autoCastQueue, tosses]);

  // Spontaneous reading based on characters & timestamp
  const generateSpontaneousReading = () => {
    // Generate seed from question, timestamp, and a random value for extra entropy
    const seedStr = question + "_" + new Date().getTime() + "_" + Math.random();
    const seed = cyrb128(seedStr);
    const randFunc = sfc32(seed[0], seed[1], seed[2], seed[3]);

    const generatedTosses: number[][] = [];
    for (let i = 0; i < 6; i++) {
      // Flip 3 coins using the seeded random function (Heads=2, Tails=3)
      const coin1 = randFunc() > 0.5 ? 3 : 2;
      const coin2 = randFunc() > 0.5 ? 3 : 2;
      const coin3 = randFunc() > 0.5 ? 3 : 2;
      generatedTosses.push([coin1, coin2, coin3]);
    }

    setAutoCastQueue(generatedTosses);
    setTosses([]);
    setStep("toss");
    setIsAutoCasting(true);
    setAutoCastIndex(0);
    setAutoCastPhase("idle");
  };

  // Simulating Yarrow Stalk probability
  const generateYarrowReading = () => {
    const generatedTosses: number[][] = [];
    for (let i = 0; i < 6; i++) {
      const rand = Math.random();
      let targetSum = 8; // Young Yin (static yin) - 5/16 probability
      if (rand < 0.0625) targetSum = 6; // Old Yin (changing yin) - 1/16 probability
      else if (rand < 0.375) targetSum = 7; // Young Yang (static yang) - 5/16 probability
      else if (rand < 0.5625) targetSum = 9; // Old Yang (changing yang) - 3/16 probability

      // Map sums to 2s and 3s
      if (targetSum === 6) generatedTosses.push([2, 2, 2]);
      else if (targetSum === 7) generatedTosses.push([3, 2, 2]);
      else if (targetSum === 8) generatedTosses.push([3, 3, 2]);
      else generatedTosses.push([3, 3, 3]);
    }

    setAutoCastQueue(generatedTosses);
    setTosses([]);
    setStep("toss");
    setIsAutoCasting(true);
    setAutoCastIndex(0);
    setAutoCastPhase("idle");
  };

  // Cast Interactive Bronze Coins (shuffling phase)
  const startInteractiveShuffle = () => {
    if (shufflingState === "shuffling" || tosses.length >= 6) return;
    setShufflingState("shuffling");
    setIsTossing(true);

    // Sound trigger (if parent supports bell chiming)
    const soundEl = document.getElementById("ambient-audio-panel");
    if (soundEl) {
      const ringBtn = soundEl.querySelector("#btn-temple-bell") as HTMLButtonElement;
      if (ringBtn) ringBtn.click();
    }

    // Randomize final values (2 for Yin/Heads, 3 for Tails/Yang)
    const result = [
      Math.random() > 0.5 ? 2 : 3,
      Math.random() > 0.5 ? 2 : 3,
      Math.random() > 0.5 ? 2 : 3,
    ];
    setCurrentRoundCoins(result);

    setTimeout(() => {
      setShufflingState("selecting");
      setSelectedCoins([false, false, false]);
      setIsTossing(false);
    }, 1800);
  };

  // Select a coin during interactive selection
  const handleSelectCoin = (index: number) => {
    if (shufflingState !== "selecting" || selectedCoins[index]) return;

    const nextSelected = [...selectedCoins];
    nextSelected[index] = true;
    setSelectedCoins(nextSelected);

    // Sound chime when a coin is flipped
    const soundEl = document.getElementById("ambient-audio-panel");
    if (soundEl) {
      const ringBtn = soundEl.querySelector("#btn-temple-bell") as HTMLButtonElement;
      if (ringBtn) ringBtn.click();
    }

    // If all three coins are selected, move to revealed phase after animation completes (1.6s)
    if (nextSelected.filter(Boolean).length === 3) {
      setTimeout(() => {
        setShufflingState("revealed");
      }, 1600);
    }
  };

  // Confirm coin reveal and draw the line
  const confirmAndDrawLine = () => {
    if (shufflingState !== "revealed") return;

    const nextTosses = [...tosses, currentRoundCoins];
    setTosses(nextTosses);
    setShufflingState("idle");
    setSelectedCoins([false, false, false]);

    // Resonance bell trigger
    const soundEl = document.getElementById("ambient-audio-panel");
    if (soundEl) {
      const ringBtn = soundEl.querySelector("#btn-temple-bell") as HTMLButtonElement;
      if (ringBtn) ringBtn.click();
    }

    if (nextTosses.length === 6) {
      setTimeout(() => {
        finishReading(nextTosses);
      }, 1200);
    }
  };

  const finishReading = (finalTosses: number[][]) => {
    // 1. Draw 6 lines bottom-to-top
    const primaryBinary: number[] = [];
    const changingLines: number[] = [];
    const transformedBinary: number[] = [];

    finalTosses.forEach((toss, index) => {
      const interp = interpretToss(toss);
      primaryBinary.push(interp.binaryValue);
      
      if (interp.isChanging) {
        changingLines.push(index + 1); // 1-indexed line position
        // Flip value for transformed hexagram
        transformedBinary.push(interp.binaryValue === 1 ? 0 : 1);
      } else {
        transformedBinary.push(interp.binaryValue);
      }
    });

    const primaryHex = getHexagramByBinary(primaryBinary);
    const hasChanges = changingLines.length > 0;
    const transformedHex = hasChanges ? getHexagramByBinary(transformedBinary) : null;

    const newSession: DivinationSession = {
      id: "session_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      question,
      method,
      tosses: finalTosses,
      primaryHexagram: primaryHex.number,
      changingLines,
      transformedHexagram: transformedHex ? transformedHex.number : null,
    };

    setStep("result");
    setTosses(finalTosses);
    
    // Callback to save to journal, etc.
    setTimeout(() => {
      onComplete(newSession);
    }, 4000);
  };

  // Convert array of tosses into current lines from bottom to top for visual representation
  const renderedLines = tosses.map((t, idx) => {
    const lineInterp = interpretToss(t);
    return {
      index: idx + 1,
      val: lineInterp.binaryValue,
      isChanging: lineInterp.isChanging,
    };
  });

  return (
    <div
      ref={containerRef}
      id="divination-chamber-ritual"
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-stone-texture text-[#E0E0E0] py-12 px-6"
      style={{ perspective: "1500px" }}
    >
      {/* Global Ambient Shanshui Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none mix-blend-lighten"
        style={{ backgroundImage: `url(${shanshuiBg})` }}
      />

      {/* Background ink calligraphic textures */}
      <div className="absolute top-10 left-10 text-[10vw] font-noto font-black text-stone-800/10 pointer-events-none select-none uppercase">
        卦
      </div>
      <div className="absolute bottom-10 right-10 text-[10vw] font-noto font-black text-stone-800/10 pointer-events-none select-none uppercase">
        卜
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        
        {/* STEP 1: FORMULATING QUESTION */}
        <AnimatePresence mode="wait">
          {step === "question" && (
            <motion.div
              id="ritual-form-container"
              key="question-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-xl rounded-2xl border border-white/5 bg-gradient-to-b from-[#161618] to-[#0A0A0B] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-md relative overflow-hidden"
            >
              {/* Subtle visual gold borders */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
              
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37] glow-gold-box-sm">
                  <PenTool className="h-5 w-5" />
                </div>
                <h3 className="font-cinzel text-3xl font-bold text-white tracking-widest leading-none">
                  Sớ Thỉnh Ý Quẻ
                </h3>
                <p className="text-[10px] font-cinzel tracking-widest text-stone-400 uppercase mt-2">
                  Bày tỏ lòng thành kính và tập trung tâm thức
                </p>
              </div>

              <form onSubmit={handleStartRitual} className="space-y-6">
                {/* Method selector */}
                <div>
                  <label className="block text-[10px] font-cinzel tracking-widest text-[#D4AF37] uppercase mb-3">
                    Phương Pháp Gieo Quẻ
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      id="btn-method-coins"
                      type="button"
                      onClick={() => setMethod("coins")}
                      className={`rounded-xl border p-3 py-4 text-center transition-all cursor-pointer ${
                        method === "coins"
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                          : "border-white/5 bg-black/40 text-stone-400 hover:border-[#D4AF37]/30"
                      }`}
                    >
                      <div className="text-sm font-cinzel font-medium mb-1">Gieo Đồng Xu</div>
                      <div className="text-[8px] font-cinzel text-stone-500">Tương tác trực tiếp</div>
                    </button>
                    <button
                      id="btn-method-yarrow"
                      type="button"
                      onClick={() => setMethod("yarrow")}
                      className={`rounded-xl border p-3 py-4 text-center transition-all cursor-pointer ${
                        method === "yarrow"
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                          : "border-white/5 bg-black/40 text-stone-400 hover:border-[#D4AF37]/30"
                      }`}
                    >
                      <div className="text-sm font-cinzel font-medium mb-1">Cỏ Thi Cổ</div>
                      <div className="text-[8px] font-cinzel text-stone-500">Thuật toán truyền thống</div>
                    </button>
                    <button
                      id="btn-method-meihua"
                      type="button"
                      onClick={() => setMethod("numerology")}
                      className={`rounded-xl border p-3 py-4 text-center transition-all cursor-pointer ${
                        method === "numerology"
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                          : "border-white/5 bg-black/40 text-stone-400 hover:border-[#D4AF37]/30"
                      }`}
                    >
                      <div className="text-sm font-cinzel font-medium mb-1">Mai Hoa Số</div>
                      <div className="text-[8px] font-cinzel text-stone-500">Lập quẻ tức thời</div>
                    </button>
                  </div>
                </div>

                {/* Input query field */}
                <div>
                  <label htmlFor="input-question" className="block text-[10px] font-cinzel tracking-widest text-[#D4AF37] uppercase mb-2">
                    Nhập Câu Hỏi / Điều Mà Bạn Muốn Thỉnh Ý Chiêm Nghiệm
                  </label>
                  <textarea
                    id="input-question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Tôi có nên tiến hành dự án mới này không? Điều cần chú ý để đạt được sự cân bằng là gì..."
                    required
                    rows={3}
                    className="w-full rounded-xl border border-white/5 bg-black/40 p-4 font-playfair text-sm text-[#E0E0E0] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-stone-600 transition-all resize-none shadow-inner"
                  />
                  <div className="text-[10px] text-stone-400 font-cinzel mt-2 italic">
                    Hãy súc tích. Đặt câu hỏi với lòng thành. Quẻ dịch phản chiếu chân thực chất lượng tâm thức của bạn.
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    id="btn-cancel-ritual"
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3.5 rounded-full border border-white/5 bg-black/40 text-stone-400 font-cinzel text-xs uppercase tracking-widest hover:border-white/20 hover:text-stone-300 transition-all cursor-pointer"
                  >
                    Trở Lại Điện Thờ
                  </button>
                  <button
                    id="btn-commence-ritual"
                    type="submit"
                    disabled={!question.trim()}
                    className="flex-1 py-3.5 rounded-full border border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37] font-cinzel text-xs uppercase tracking-widest hover:bg-[#D4AF37]/20 hover:text-white transition-all disabled:opacity-30 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Bắt Đầu Nghi Lễ
                    <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 2: ACTIVE COIN CASTING */}
          {step === "toss" && (
            <motion.div
              id="altar-casting-container"
              key="toss-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full flex flex-col md:flex-row gap-8 items-stretch"
            >
              {/* Inject keyframes into page */}
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes swirl-fast {
                  0% { transform: rotate(0deg) scale(0.95); }
                  50% { transform: rotate(180deg) scale(1.05); }
                  100% { transform: rotate(360deg) scale(0.95); }
                }
                @keyframes bowl-shake {
                  0%, 100% { transform: translate(0, 0) rotate(0deg); }
                  10% { transform: translate(-2px, -2px) rotate(-1deg); }
                  20% { transform: translate(2px, 1px) rotate(1deg); }
                  30% { transform: translate(-1px, 2px) rotate(-0.5deg); }
                  40% { transform: translate(1px, -1px) rotate(0.5deg); }
                  50% { transform: translate(-2px, 1px) rotate(-1deg); }
                  60% { transform: translate(2px, -2px) rotate(1deg); }
                  70% { transform: translate(-1px, -1px) rotate(-0.5deg); }
                  80% { transform: translate(1px, 2px) rotate(0.5deg); }
                  90% { transform: translate(-2px, -1px) rotate(-1deg); }
                }
                @keyframes energy-spin {
                  0% { transform: rotate(0deg) scale(0.7); opacity: 0.1; }
                  50% { opacity: 0.6; }
                  100% { transform: rotate(360deg) scale(1.2); opacity: 0; }
                }
                @keyframes spin-slow {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes spin-reverse-slow {
                  0% { transform: rotate(360deg); }
                  100% { transform: rotate(0deg); }
                }
                @keyframes float-gentle {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-8px); }
                }
                @keyframes pulse-gold-glow {
                  0%, 100% { box-shadow: 0 0 15px rgba(212,175,55,0.15), inset 0 0 20px rgba(0,0,0,0.8); border-color: rgba(212,175,55,0.2); }
                  50% { box-shadow: 0 0 35px rgba(212,175,55,0.45), inset 0 0 25px rgba(212,175,55,0.1); border-color: rgba(212,175,55,0.6); }
                }
                @keyframes ripple-expand {
                  0% { transform: scale(0.5); opacity: 1; }
                  100% { transform: scale(2.5); opacity: 0; }
                }
                @keyframes particle-drift {
                  0% { transform: translateY(100%) translateX(0); opacity: 0; }
                  50% { opacity: 0.4; }
                  100% { transform: translateY(-100%) translateX(15px); opacity: 0; }
                }
                .animate-swirl-fast {
                  animation: swirl-fast 0.6s infinite linear;
                }
                .animate-bowl-shake {
                  animation: bowl-shake 0.1s infinite;
                }
                .animate-energy-spin {
                  animation: energy-spin 1.5s infinite linear;
                }
                .animate-spin-slow {
                  animation: spin-slow 25s infinite linear;
                }
                .animate-spin-reverse-slow {
                  animation: spin-reverse-slow 35s infinite linear;
                }
                .animate-float-gentle {
                  animation: float-gentle 4s infinite ease-in-out;
                }
                .animate-pulse-gold-glow {
                  animation: pulse-gold-glow 3s infinite ease-in-out;
                }
                .animate-ripple-expand {
                  animation: ripple-expand 1.2s forwards cubic-bezier(0.1, 0.8, 0.3, 1);
                }
                .animate-particle-drift-1 {
                  animation: particle-drift 8s infinite linear;
                }
                .animate-particle-drift-2 {
                  animation: particle-drift 11s infinite linear;
                }
                .animate-particle-drift-3 {
                  animation: particle-drift 14s infinite linear;
                }
                /* 3D Coin Tumble and Collision Keyframes */
                @keyframes coin-3d-tumble-1 {
                  0% { transform: translate3d(-35px, -25px, 50px) rotateX(0deg) rotateY(0deg) rotateZ(0deg); box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                  20% { transform: translate3d(45px, -10px, -20px) rotateX(190deg) rotateY(340deg) rotateZ(95deg); box-shadow: 0 15px 30px rgba(212,175,55,0.7); filter: brightness(1.4); }
                  40% { transform: translate3d(-10px, 35px, 30px) rotateX(370deg) rotateY(190deg) rotateZ(280deg); box-shadow: 0 6px 15px rgba(0,0,0,0.6); }
                  60% { transform: translate3d(25px, -45px, -10px) rotateX(550deg) rotateY(560deg) rotateZ(190deg); box-shadow: 0 15px 30px rgba(212,175,55,0.7); filter: brightness(1.4); }
                  80% { transform: translate3d(-45px, 20px, 40px) rotateX(730deg) rotateY(370deg) rotateZ(375deg); box-shadow: 0 8px 18px rgba(0,0,0,0.5); }
                  100% { transform: translate3d(-35px, -25px, 50px) rotateX(1080deg) rotateY(720deg) rotateZ(720deg); box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                }
                @keyframes coin-3d-tumble-2 {
                  0% { transform: translate3d(25px, 35px, -30px) rotateX(0deg) rotateY(190deg) rotateZ(50deg); box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                  25% { transform: translate3d(-35px, -20px, 40px) rotateX(370deg) rotateY(10deg) rotateZ(190deg); box-shadow: 0 15px 30px rgba(212,175,55,0.7); filter: brightness(1.4); }
                  50% { transform: translate3d(15px, -35px, -15px) rotateX(190deg) rotateY(550deg) rotateZ(370deg); box-shadow: 0 6px 15px rgba(0,0,0,0.6); }
                  75% { transform: translate3d(-25px, 25px, 20px) rotateX(550deg) rotateY(190deg) rotateZ(100deg); box-shadow: 0 15px 30px rgba(212,175,55,0.7); filter: brightness(1.4); }
                  100% { transform: translate3d(25px, 35px, -30px) rotateX(720deg) rotateY(720deg) rotateZ(410deg); box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                }
                @keyframes coin-3d-tumble-3 {
                  0% { transform: translate3d(-15px, -45px, 15px) rotateX(190deg) rotateY(10deg) rotateZ(125deg); box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                  30% { transform: translate3d(35px, 15px, -40px) rotateX(10deg) rotateY(370deg) rotateZ(245deg); box-shadow: 0 15px 30px rgba(212,175,55,0.7); filter: brightness(1.4); }
                  60% { transform: translate3d(-10px, 25px, 50px) rotateX(550deg) rotateY(190deg) rotateZ(370deg); box-shadow: 0 6px 15px rgba(0,0,0,0.6); }
                  80% { transform: translate3d(45px, -25px, -25px) rotateX(190deg) rotateY(550deg) rotateZ(190deg); box-shadow: 0 15px 30px rgba(212,175,55,0.7); filter: brightness(1.4); }
                  100% { transform: translate3d(-15px, -45px, 15px) rotateX(900deg) rotateY(720deg) rotateZ(845deg); box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                }
                /* 3D Transform preservation */
                .preserve-3d {
                  transform-style: preserve-3d;
                }
                @keyframes spin-clockwise {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes spin-counter-clockwise {
                  0% { transform: rotate(360deg); }
                  100% { transform: rotate(0deg); }
                }
                .animate-spin-clockwise-60 {
                  animation: spin-clockwise 60s infinite linear;
                }
                .animate-spin-counter-clockwise-45 {
                  animation: spin-counter-clockwise 45s infinite linear;
                }
                .animate-spin-clockwise-30 {
                  animation: spin-clockwise 30s infinite linear;
                }
                .animate-spin-counter-clockwise-90 {
                  animation: spin-counter-clockwise 90s infinite linear;
                }
                /* Global Taiji Hover glow and drop shadows */
                .taiji-glow-active {
                  filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.8)) drop-shadow(0 0 30px rgba(212, 175, 55, 0.4)) !important;
                  text-shadow: 0 0 12px rgba(212, 175, 55, 0.85) !important;
                  border-color: rgba(212, 175, 55, 0.6) !important;
                  opacity: 1 !important;
                  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }
                .taiji-glow-active-text {
                  text-shadow: 0 0 15px rgba(212, 175, 55, 1), 0 0 30px rgba(212, 175, 55, 0.6) !important;
                  color: #FFF !important;
                  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }
                .taiji-glow-shimmer {
                  box-shadow: 0 0 45px rgba(212, 175, 55, 0.45), inset 0 0 30px rgba(212, 175, 55, 0.15) !important;
                  border-color: rgba(212, 175, 55, 0.7) !important;
                  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }
              `}} />

              {/* Altar Area with dynamic 8D Interactive / Automated Modes */}
              <div 
                className="flex-1 rounded-2xl border border-[#D4AF37]/10 bg-gradient-to-b from-[#18181b] to-[#08080a] p-6 flex flex-col items-center justify-between relative overflow-hidden min-h-[520px] shadow-[0_25px_60px_rgba(0,0,0,0.95)] transition-all duration-300 preserve-3d group animate-pulse-gold-glow"
                style={{
                  transform: `perspective(1200px) rotateX(${mousePos.y * -10}deg) rotateY(${mousePos.x * 10}deg) translateZ(15px)`,
                }}
              >
                {/* Floating gold dust overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(212,175,55,0.02)_1px,_transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                <div className="text-center z-10 w-full mb-4 border-b border-white/5 pb-3">
                  <div className="text-[10px] font-cinzel tracking-[0.2em] text-[#D4AF37] uppercase glow-gold">
                    {isAutoCasting ? "ĐÀN BÁT QUÁI - TỰ ĐỘNG KHỞI TẠO" : "ĐÀN GIEO QUẺ"}
                  </div>
                  <h4 className="font-cinzel text-lg text-white font-bold mt-1">
                    {isAutoCasting ? `Đang Tính Toán Hào ${autoCastIndex + 1} / 6` : `Lần Gieo Thứ ${tosses.length + 1} / 6`}
                  </h4>
                </div>

                {isAutoCasting ? (
                  /* ========================================================
                     BEAUTIFUL OFF-PLAY AUTOMATED OBSERVABLE RITUAL PLAYER
                     ======================================================== */
                  <div id="automated-ritual-player" className="relative flex-1 w-full flex flex-col items-center justify-center py-4 z-10">
                    
                    {/* Large Background Sacred Mandala */}
                    <div className="absolute h-60 w-60 rounded-full border border-dashed border-[#D4AF37]/15 flex items-center justify-center animate-spin" style={{ animationDuration: "60s" }}>
                      <div className="h-50 w-50 rounded-full border border-[#D4AF37]/5" />
                    </div>

                    <div className="relative w-full max-w-sm flex-1 flex flex-col items-center justify-center gap-6 min-h-[280px]">
                      
                      {/* 1. VISUAL METHOD PLAYER ACCORDING TO TECHNIQUE */}
                      {method === "yarrow" ? (
                        /* Yarrow Stalk Traditional Pile Divination Graphic */
                        <div className="relative h-40 w-full flex flex-col items-center justify-center">
                          <div className="absolute bottom-2 h-4 w-44 rounded-full bg-stone-950 border border-stone-800 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)]" />
                          
                          {/* Animated group of 50 yarrow stalks */}
                          <div className="relative h-28 w-48 flex items-end justify-center gap-0.5 overflow-hidden">
                            {autoCastPhase === "idle" && (
                              /* 50 stalks resting peacefully in the jar */
                              <div className="flex items-end justify-center gap-[1px]">
                                {Array.from({ length: 30 }).map((_, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ rotate: -8 + i * 0.5, height: 75 }}
                                    className="w-1 bg-amber-700/80 rounded-full origin-bottom shadow-sm"
                                  />
                                ))}
                              </div>
                            )}

                            {autoCastPhase === "shuffling" && (
                              /* Stalks swirling/dividing into two celestial piles representing Heaven and Earth */
                              <div className="w-full flex justify-between px-4">
                                {/* Pile Left (Heaven) */}
                                <div className="flex items-end gap-[1px] transform -rotate-6">
                                  {Array.from({ length: 15 }).map((_, i) => (
                                    <motion.div
                                      key={i}
                                      animate={{ 
                                        rotate: [-15, -5, -15],
                                        y: [0, -4, 0]
                                      }}
                                      transition={{ 
                                        repeat: Infinity,
                                        duration: 1.2,
                                        delay: i * 0.04
                                      }}
                                      className="w-1 bg-amber-600/90 rounded-full origin-bottom h-16"
                                    />
                                  ))}
                                </div>
                                
                                {/* 1 single stalk in the center representing humanity */}
                                <motion.div 
                                  animate={{ y: [-10, 0, -10] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                  className="w-1 h-20 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                                />

                                {/* Pile Right (Earth) */}
                                <div className="flex items-end gap-[1px] transform rotate-6">
                                  {Array.from({ length: 15 }).map((_, i) => (
                                    <motion.div
                                      key={i}
                                      animate={{ 
                                        rotate: [15, 5, 15],
                                        y: [0, -3, 0]
                                      }}
                                      transition={{ 
                                        repeat: Infinity,
                                        duration: 1.2,
                                        delay: i * 0.04 + 0.1
                                      }}
                                      className="w-1 bg-amber-800/90 rounded-full origin-bottom h-16"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {autoCastPhase === "revealed" && (
                              /* Grouped into exact mathematical leftovers from division */
                              <div className="w-full flex justify-center items-end gap-16">
                                <div className="flex items-end gap-[1px] transform -rotate-12">
                                  {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="w-1 bg-amber-500 rounded-full origin-bottom h-16" />
                                  ))}
                                </div>
                                <div className="w-1 h-22 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                                <div className="flex items-end gap-[1px] transform rotate-12">
                                  {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="w-1 bg-amber-500 rounded-full origin-bottom h-16" />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Numerology Bagua Mathematical Calculator Grid */
                        <div className="relative h-40 w-full flex items-center justify-center">
                          {/* Rotating central bronze medal disc */}
                          <motion.div
                            animate={autoCastPhase === "shuffling" ? { rotate: 360 } : { rotate: 0 }}
                            transition={autoCastPhase === "shuffling" ? { repeat: Infinity, duration: 8, ease: "linear" } : { duration: 0.5 }}
                            className={`h-32 w-32 rounded-full border-2 border-dashed border-[#D4AF37]/50 bg-gradient-to-b from-stone-900 to-black shadow-[inset_0_2px_15px_rgba(0,0,0,0.9)] p-1.5 flex items-center justify-center relative ${
                              autoCastPhase === "shuffling" ? "glow-gold-box-sm" : ""
                            }`}
                          >
                            <div className="absolute inset-2.5 rounded-full border border-white/5 opacity-20" />
                            <div className="h-20 w-20 rounded-full border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]/60 font-noto font-black text-3xl">
                              {autoCastPhase === "revealed" ? "卦" : "數"}
                            </div>

                            {/* Shimmering outer numbers for computation overlay */}
                            {autoCastPhase === "shuffling" && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="absolute -top-1 text-[7px] font-mono text-[#D4AF37]/40">CÀN {question.length}</span>
                                <span className="absolute -bottom-1 text-[7px] font-mono text-[#D4AF37]/40">KHÔN {new Date().getSeconds()}</span>
                                <span className="absolute -left-1 text-[7px] font-mono text-[#D4AF37]/40">HÀO {autoCastIndex + 1}</span>
                                <span className="absolute -right-1 text-[7px] font-mono text-[#D4AF37]/40">CHI {new Date().getMinutes()}</span>
                              </div>
                            )}
                          </motion.div>
                        </div>
                      )}

                      {/* 2. SUBTITLES & TECHNICAL EXPLANATIONS */}
                      <div className="text-center w-full min-h-[95px] flex flex-col justify-center items-center">
                        <AnimatePresence mode="wait">
                          {autoCastPhase === "idle" && (
                            <motion.div
                              key="idle"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="space-y-1"
                            >
                              <span className="text-[9px] font-cinzel text-stone-500 uppercase tracking-widest">
                                KHỞI THIÊN CHIẾU MỆNH
                              </span>
                              <p className="font-playfair text-xs text-stone-400 italic max-w-xs leading-relaxed">
                                {method === "yarrow"
                                  ? "Gom tụ 50 cọng cỏ thi thiêng. Chuẩn bị phân chia Lưỡng Nghi..."
                                  : "Chuẩn bị thắt nút dòng thời gian và giải mã ký tự sớ văn..."}
                              </p>
                            </motion.div>
                          )}

                          {autoCastPhase === "shuffling" && (
                            <motion.div
                              key="shuffling"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="space-y-1.5"
                            >
                              <div className="flex items-center justify-center gap-2 text-[10px] font-cinzel text-[#D4AF37] tracking-widest font-semibold uppercase animate-pulse">
                                <RefreshCw className="h-3 w-3 animate-spin text-[#D4AF37]" />
                                {method === "yarrow" ? "ĐANG BIẾN PHÁP CỎ THI..." : "ĐANG KHỞI LẬP SỐ KHÍ CÀN KHÔN..."}
                              </div>
                              <p className="font-playfair text-xs text-stone-300 italic max-w-xs leading-relaxed">
                                {method === "yarrow"
                                  ? "Thái Cực sinh Lưỡng Nghi. Phân cọng cỏ, trừ đi một cọng đại diện Nhân để tính dư số của Thiên, Địa..."
                                  : "Đang tính toán Thượng quái, Hạ quái và vận động chuyển dịch thời khắc theo lý thuyết số Mai Hoa..."}
                              </p>
                            </motion.div>
                          )}

                          {autoCastPhase === "revealed" && (
                            <motion.div
                              key="revealed"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="space-y-2 flex flex-col items-center"
                            >
                              {(() => {
                                const currentToss = autoCastQueue[autoCastIndex];
                                const sum = currentToss ? currentToss[0] + currentToss[1] + currentToss[2] : 7;
                                const isYang = sum === 7 || sum === 9;

                                return (
                                  <>
                                    <div className="flex flex-col items-center gap-1 animate-pulse">
                                      {isYang ? (
                                        <div className="h-2.5 w-32 bg-[#D4AF37] rounded-md shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
                                      ) : (
                                        <div className="w-32 flex justify-between gap-3">
                                          <div className="h-2.5 w-[45%] bg-[#D4AF37] rounded-md shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
                                          <div className="h-2.5 w-[45%] bg-[#D4AF37] rounded-md shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
                                        </div>
                                      )}
                                      
                                      <span className="text-[11px] font-cinzel text-green-400 font-bold uppercase tracking-widest mt-1">
                                        {sum === 6 && "✦ LÃO ÂM (ÂM BIẾN - HÀO ĐỘNG)"}
                                        {sum === 7 && "✦ THIẾU DƯƠNG (DƯƠNG TĨNH)"}
                                        {sum === 8 && "✦ THIẾU ÂM (ÂM TĨNH)"}
                                        {sum === 9 && "✦ LÃO DƯƠNG (DUƠNG BIẾN - HÀO ĐỘNG)"}
                                      </span>
                                    </div>
                                    <p className="font-playfair text-[11px] text-stone-400 italic max-w-xs leading-relaxed text-center">
                                      {sum === 6 && "Nước cực lạnh hóa đá, hào âm động biến chuyển lớn sắp khởi sinh."}
                                      {sum === 7 && "Năng lượng sáng tạo và cương nghị vững vàng, tiến trình vững chãi."}
                                      {sum === 8 && "Lòng tiếp nhận nhu thuận, thích ứng uyển chuyển với vạn vật."}
                                      {sum === 9 && "Mặt trời cực nóng hóa mưa, cực dương chuyển dịch hướng đến điều mới."}
                                    </p>
                                  </>
                                );
                              })()}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                    </div>

                    {/* Progress Dots Indicator */}
                    <div className="flex gap-2.5 mt-4 z-10 select-none">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                            idx === autoCastIndex
                              ? "bg-[#D4AF37] w-6 glow-gold"
                              : idx < autoCastIndex
                              ? "bg-green-500/70"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="mt-2 text-[9px] font-cinzel text-stone-500 uppercase tracking-widest">
                      Hệ thống tự động thực hiện • Đang dưới sự theo dõi của bạn
                    </div>
                  </div>
                ) : (
                  /* ========================================================
                     ORIGINAL HANDS-ON INTERACTIVE COINS TOSS VIEW
                     ======================================================== */
                  <>
                    {/* The Sacred Interactive Altar Bowl */}
                    <div className="relative flex-1 w-full flex flex-col items-center justify-center py-6 select-none overflow-visible">
                      
                      {/* 8D Floating Spiritual Embers & Cosmic Orbs */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        <div className="absolute bottom-4 left-[15%] h-1.5 w-1.5 rounded-full bg-[#D4AF37]/30 blur-[1px] animate-particle-drift-1" />
                        <div className="absolute bottom-16 left-[45%] h-2 w-2 rounded-full bg-[#D4AF37]/40 blur-[2px] animate-particle-drift-2" />
                        <div className="absolute bottom-8 left-[75%] h-1 w-1 rounded-full bg-white/30 blur-[1px] animate-particle-drift-3" />
                      </div>

                      {/* Unified Responsive Scaling Workspace Container */}
                      <div className="relative w-[500px] h-[500px] flex items-center justify-center scale-[0.66] xs:scale-[0.75] sm:scale-[0.88] md:scale-100 transition-transform duration-300 preserve-3d select-none">
                        
                        {/* VÒNG Ở GIỮA (Middle Ring): Bát Quái 8 Cung */}
                        <div 
                          className={`absolute w-[360px] h-[360px] rounded-full border border-[#D4AF37]/20 flex items-center justify-center animate-spin-counter-clockwise-45 pointer-events-none transition-all duration-700 ${
                            isTaijiHovered ? "taiji-glow-active" : ""
                          }`}
                        >
                          {/* Inner double border track */}
                          <div className="absolute inset-2.5 rounded-full border-2 border-double border-[#D4AF37]/10" />

                          {/* Render 8 trigrams with tags */}
                          {trigrams.map((t, idx) => {
                            const angle = idx * 45;
                            const baseName = t.name.split(" ")[0];
                            
                            // Safe and robust manual elements mapping
                            const elementsMap: Record<number, string> = {
                              0: "Kim",   // Càn
                              1: "Kim",   // Đoài
                              2: "Hỏa",   // Ly
                              3: "Mộc",   // Chấn
                              4: "Mộc",   // Tốn
                              5: "Thủy",  // Khảm
                              6: "Thổ",   // Cấn
                              7: "Thổ"    // Khôn
                            };
                            const vietnameseElement = elementsMap[idx] || "Thổ";
                            
                            const elementColor = 
                              vietnameseElement === "Hỏa" ? "text-red-500 bg-red-950/40 border-red-500/30" :
                              vietnameseElement === "Thủy" ? "text-blue-400 bg-blue-950/40 border-blue-500/30" :
                              vietnameseElement === "Mộc" ? "text-green-400 bg-green-950/40 border-green-500/30" :
                              vietnameseElement === "Kim" ? "text-amber-300 bg-amber-950/40 border-amber-500/30" :
                              "text-stone-400 bg-stone-900/50 border-stone-700/30";

                            return (
                              <div
                                key={idx}
                                style={{
                                  transform: `rotate(${angle}deg) translateY(-168px) rotate(-${angle}deg)`,
                                }}
                                className="absolute flex flex-col items-center justify-center select-none"
                              >
                                <div className={`flex flex-col items-center justify-center h-16 w-16 rounded-full border border-[#D4AF37]/30 bg-stone-950/90 shadow-[0_4px_12px_rgba(0,0,0,0.8)] p-1.5 transition-all duration-500 ${isTaijiHovered ? 'border-[#D4AF37] scale-105 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : ''}`}>
                                  <span className="text-stone-300 text-xs font-bold leading-none">{t.symbol}</span>
                                  <span className="text-[7.5px] font-cinzel font-semibold tracking-wider text-[#D4AF37] mt-0.5 leading-none uppercase">{baseName}</span>
                                  <span className={`text-[6px] px-1 py-[1px] rounded-full border mt-1 font-semibold leading-none ${elementColor}`}>{vietnameseElement}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 3. VÒNG TRONG (Inner Ring): Hai con cá Hắc Bạch */}
                        <div 
                          className={`absolute w-[240px] h-[240px] rounded-full flex items-center justify-center animate-spin-clockwise-30 pointer-events-none transition-all duration-700 ${
                            isTaijiHovered ? "taiji-glow-active" : ""
                          }`}
                        >
                          {/* Orbit guide track line */}
                          <div className="absolute inset-1 rounded-full border border-dashed border-[#D4AF37]/10" />

                          {/* CON CÁ ĐEN (YIN FISH - at 0 degrees) */}
                          <div 
                            style={{ transform: "rotate(0deg) translateY(-102px) rotate(90deg)" }}
                            className={`absolute transition-all duration-500 ${isTaijiHovered ? "scale-110 drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]" : ""}`}
                          >
                            <svg width="42" height="20" viewBox="0 0 42 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-180">
                              {/* Fish body - Yin Dark Obsidian color */}
                              <path d="M2 10C2 10 10 4 20 4C30 4 35 10 40 10C35 10 30 16 20 16C10 16 2 10 2 10Z" fill="#141416" stroke="#D4AF37" strokeWidth="1" />
                              {/* Golden spine line and whiskers */}
                              <circle cx="34" cy="7" r="1" fill="#FFD700" />
                              <circle cx="34" cy="13" r="1" fill="#FFD700" />
                              <line x1="12" y1="10" x2="28" y2="10" stroke="#FFD700" strokeWidth="1" strokeDasharray="2 2" />
                              {/* Fins */}
                              <path d="M15 4C12 2 10 3 10 3" stroke="#D4AF37" strokeWidth="1.2" />
                              <path d="M15 16C12 18 10 17 10 17" stroke="#D4AF37" strokeWidth="1.2" />
                              {/* Tail */}
                              <path d="M2 10C-1 8 -3 10 -4 10C-3 10 -1 12 2 10Z" fill="#D4AF37" opacity="0.8" />
                            </svg>
                          </div>

                          {/* CON CÁ TRẮNG (YANG FISH - at 180 degrees) */}
                          <div 
                            style={{ transform: "rotate(180deg) translateY(-102px) rotate(90deg)" }}
                            className={`absolute transition-all duration-500 ${isTaijiHovered ? "scale-110 drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]" : ""}`}
                          >
                            <svg width="42" height="20" viewBox="0 0 42 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {/* Fish body - Yang Alabaster Ivory White color */}
                              <path d="M2 10C2 10 10 4 20 4C30 4 35 10 40 10C35 10 30 16 20 16C10 16 2 10 2 10Z" fill="#FAF9F6" stroke="#D4AF37" strokeWidth="1" />
                              {/* Orange/Red koi spots */}
                              <circle cx="18" cy="8" r="2.5" fill="#E65100" />
                              <circle cx="26" cy="11" r="2" fill="#E65100" />
                              <circle cx="12" cy="10" r="1.5" fill="#E65100" />
                              {/* Eyes and details */}
                              <circle cx="34" cy="7" r="1" fill="#333" />
                              <circle cx="34" cy="13" r="1" fill="#333" />
                              {/* Fins */}
                              <path d="M15 4C12 2 10 3 10 3" stroke="#E65100" strokeWidth="1.2" />
                              <path d="M15 16C12 18 10 17 10 17" stroke="#E65100" strokeWidth="1.2" />
                              {/* Tail */}
                              <path d="M2 10C-1 8 -3 10 -4 10C-3 10 -1 12 2 10Z" fill="#E65100" opacity="0.8" />
                            </svg>
                          </div>
                        </div>

                        {/* 4. TÂM THÁI CỰC (Core Taiji): The Interactive Bowl Container */}
                        <div 
                          onMouseEnter={() => setIsTaijiHovered(true)}
                          onMouseLeave={() => setIsTaijiHovered(false)}
                          onClick={addRipple}
                          className={`relative h-[164px] w-[164px] rounded-full border border-[#D4AF37]/40 p-1 flex items-center justify-center transition-all duration-500 cursor-pointer overflow-visible z-10 ${
                            shufflingState === "shuffling" ? "animate-bowl-shake scale-105 border-[#D4AF37]" : "hover:border-[#D4AF37]/80 hover:scale-[1.02]"
                          } ${isTaijiHovered ? "taiji-glow-shimmer ring-4 ring-[#D4AF37]/15" : "shadow-[0_12px_45px_rgba(0,0,0,0.9)]"}`}
                        >
                          {/* High Gloss Yin-Yang classic background */}
                          <div className="absolute inset-0 rounded-full bg-[#141416] flex overflow-hidden pointer-events-none">
                            {/* Left black half and right white half */}
                            <div className="w-1/2 h-full bg-[#FAF9F6] relative">
                              {/* S-curve overlay via SVGs or overlapping circles */}
                              <div className="absolute top-0 left-full -ml-[41px] w-[82px] h-[82px] rounded-full bg-[#FAF9F6]" />
                            </div>
                            <div className="w-1/2 h-full bg-[#141416] relative">
                              <div className="absolute bottom-0 right-full -mr-[41px] w-[82px] h-[82px] rounded-full bg-[#141416]" />
                            </div>

                            {/* Centered Golden Metal S-divider Line */}
                            <svg className="absolute inset-0 w-full h-full text-[#D4AF37]/60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M50 0 C77.6 0 77.6 50 50 50 C22.4 50 22.4 100 50 100" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>

                            {/* Yin eye (Black eye inside White circle on top half) */}
                            <div className="absolute top-[20px] left-1/2 -ml-[21px] w-[42px] h-[42px] rounded-full bg-[#FAF9F6] border border-[#D4AF37]/30 flex items-center justify-center">
                              <div className="w-[12px] h-[12px] rounded-full bg-[#141416] border border-[#D4AF37]/60" />
                            </div>

                            {/* Yang eye (White eye inside Black circle on bottom half) */}
                            <div className="absolute bottom-[20px] left-1/2 -ml-[21px] w-[42px] h-[42px] rounded-full bg-[#141416] border border-[#D4AF37]/30 flex items-center justify-center">
                              <div className="w-[12px] h-[12px] rounded-full bg-[#FAF9F6] border border-[#D4AF37]/60" />
                            </div>

                            {/* Inner circular gold dashed guideline */}
                            <div className="absolute inset-2.5 rounded-full border border-dashed border-[#D4AF37]/15" />

                            {/* Rendering dynamic 8D ripple energy rings inside Taiji (masked) */}
                            {ripples.map((ripple) => (
                              <div
                                key={ripple.id}
                                style={{
                                  left: ripple.x,
                                  top: ripple.y,
                                }}
                                className="absolute h-10 w-10 -ml-5 -mt-5 rounded-full border border-[#D4AF37] bg-[#D4AF37]/5 pointer-events-none animate-ripple-expand shadow-[0_0_15px_rgba(212,175,55,0.4)] z-10"
                              />
                            ))}
                          </div>

                          {/* Golden swirl energy particles inside Taiji when shuffling */}
                          {shufflingState === "shuffling" && (
                            <div className="absolute inset-4 rounded-full border border-dashed border-[#D4AF37]/50 animate-energy-spin pointer-events-none z-10" />
                          )}

                          {/* Rendering State A: IDLE */}
                          {shufflingState === "idle" && (
                            <div className="flex flex-col items-center justify-center text-center p-3 z-10 bg-black/45 backdrop-blur-[2px] rounded-full w-[140px] h-[140px] border border-white/5 shadow-inner">
                              <Sparkles className="h-6 w-6 text-[#D4AF37] mb-1.5 animate-pulse" />
                              <p className="font-cinzel text-[10px] text-[#D4AF37] font-semibold uppercase leading-none tracking-wider">
                                Khởi Động
                              </p>
                              <p className="text-[7.5px] text-stone-300 mt-1.5 max-w-[110px] leading-tight font-playfair italic">
                                Tĩnh tâm và click vào Thái Cực để xào quẻ
                              </p>
                            </div>
                          )}

                          {/* Rendering State B: SHUFFLING */}
                          {shufflingState === "shuffling" && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                              {/* Mystical holographic Status text */}
                              <div className="absolute inset-3 rounded-full flex flex-col items-center justify-center text-center bg-black/60 backdrop-blur-[2px]">
                                <RefreshCw className="h-4 w-4 text-[#D4AF37] mb-1 animate-spin" />
                                <p className="font-cinzel text-[8px] text-[#D4AF37] tracking-widest uppercase leading-none">
                                  Đang Xào...
                                </p>
                              </div>

                              {/* 3D Tumbling & Colliding Coins inside Taiji */}
                              {[1, 2, 3].map((coinId) => {
                                return (
                                  <div
                                    key={coinId}
                                    className="absolute w-10 h-10 rounded-full border border-[#D4AF37]/80 bg-gradient-to-br from-[#FFD700] via-[#8B6508] to-black shadow-2xl flex items-center justify-center p-1 preserve-3d"
                                    style={{
                                      animation: `coin-3d-tumble-${coinId} 1.8s infinite ease-in-out`,
                                      transformStyle: "preserve-3d",
                                      backfaceVisibility: "hidden",
                                      WebkitBackfaceVisibility: "hidden"
                                    }}
                                  >
                                    <div className="w-2.5 h-2.5 bg-stone-950 border border-[#D4AF37]/50 rounded-sm" />
                                    <span className="absolute text-[7px] font-noto font-bold text-[#D4AF37] top-0.5">
                                      {coinId % 2 === 0 ? "陰" : "陽"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Rendering State C: SELECTING */}
                          {shufflingState === "selecting" && (
                            <div className="absolute inset-0 flex items-center justify-around px-1 z-10 bg-black/45 backdrop-blur-[2px] rounded-full overflow-visible">
                              {[0, 1, 2].map((index) => {
                                const isRevealed = selectedCoins[index];
                                return (
                                  <motion.div
                                    key={index}
                                    whileHover={!isRevealed ? { scale: 1.15, y: -5, z: 15 } : { scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSelectCoin(index)}
                                    className="relative cursor-pointer flex flex-col items-center gap-1 select-none overflow-visible"
                                    style={{
                                      perspective: "1000px",
                                      transformStyle: "preserve-3d",
                                    }}
                                  >
                                    <motion.div
                                      animate={isRevealed ? { 
                                        y: [0, -150, 0, -30, 0, -10, 0, -3, 0],
                                        rotateY: [0, 450, 900, 1170, 1260, 1265, 1258, 1260, 1260],
                                        rotateX: [0, 180, 360, 540, 680, 725, 715, 720, 720],
                                        scale: [1, 1.4, 1, 1.08, 1, 1.03, 1, 1.01, 1],
                                        z: [0, 80, 0, 15, 0, 5, 0, 1, 0]
                                      } : { 
                                        y: 0,
                                        rotateY: 0,
                                        rotateX: 0,
                                        scale: 1,
                                        z: 0
                                      }}
                                      transition={isRevealed ? {
                                        duration: 1.6,
                                        times: [0, 0.25, 0.45, 0.6, 0.72, 0.82, 0.9, 0.95, 1],
                                        ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeIn"]
                                      } : {
                                        type: "spring", stiffness: 110, damping: 12
                                      }}
                                      className="h-11 w-11 relative preserve-3d"
                                      style={{ transformStyle: "preserve-3d" }}
                                    >
                                      {/* FACE DOWN */}
                                      <div 
                                        className="absolute inset-0 rounded-full border border-dashed border-[#D4AF37]/80 bg-[#141416] flex items-center justify-center shadow-[0_4px_12px_rgba(212,175,55,0.2)]"
                                        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                                      >
                                        <span className="text-[7px] font-cinzel text-[#D4AF37]/80 font-bold">?</span>
                                      </div>

                                      {/* FACE UP */}
                                      <div 
                                        className="absolute inset-0 rounded-full border border-[#D4AF37] bg-gradient-to-br from-[#FFD700] via-[#8B6508] to-stone-950 flex items-center justify-center p-1 shadow-[0_5px_15px_rgba(0,0,0,0.85)]"
                                        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                                      >
                                        <div className="w-2.5 h-2.5 bg-[#0A0A0B] border border-[#D4AF37]/50 rounded-sm rotate-45" />
                                        <span className="absolute text-[8px] font-noto font-bold text-[#D4AF37] top-1">
                                          {currentRoundCoins[index] === 2 ? "陰" : "陽"}
                                        </span>
                                      </div>
                                    </motion.div>
                                    <span className="text-[5.5px] font-cinzel text-stone-300 uppercase tracking-wider leading-none">
                                      {isRevealed ? `${index + 1}` : `Chọn`}
                                    </span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}

                          {/* Rendering State D: REVEALED SUMMARY */}
                          {shufflingState === "revealed" && (
                            <div className="flex flex-col items-center justify-center text-center p-1 z-10 bg-black/60 backdrop-blur-[2.5px] rounded-full w-[140px] h-[140px] border border-white/10">
                              {/* Golden Glowing Sum indicator */}
                              <div className="h-8 w-8 rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 flex items-center justify-center mb-1 text-white text-xs font-cinzel font-bold glow-gold leading-none">
                                {currentRoundCoins[0] + currentRoundCoins[1] + currentRoundCoins[2]}
                              </div>

                              {/* Visual representation of current line in the bowl */}
                              {(() => {
                                const total = currentRoundCoins[0] + currentRoundCoins[1] + currentRoundCoins[2];
                                const isYang = total === 7 || total === 9;

                                return (
                                  <div className="flex flex-col items-center gap-1 w-full animate-pulse">
                                    {isYang ? (
                                      /* Yang line */
                                      <div className="h-1.5 w-20 bg-[#D4AF37] rounded-md shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                                    ) : (
                                      /* Yin line */
                                      <div className="w-20 flex justify-between gap-2.5">
                                        <div className="h-1.5 w-[45%] bg-[#D4AF37] rounded-md shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                                        <div className="h-1.5 w-[45%] bg-[#D4AF37] rounded-md shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                                      </div>
                                    )}
                                    
                                    <p className="text-[7.5px] font-cinzel text-[#D4AF37] font-bold uppercase tracking-wider leading-none mt-1">
                                      {total === 6 && "LÃO ÂM"}
                                      {total === 7 && "THIẾU DƯƠNG"}
                                      {total === 8 && "THIẾU ÂM"}
                                      {total === 9 && "LÃO DƯƠNG"}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Helper instructions below the bowl */}
                      <div className="text-center mt-3 max-w-xs px-2 min-h-[36px] flex items-center justify-center">
                        {shufflingState === "idle" && (
                          <p className="text-[9px] font-cinzel text-stone-400 uppercase tracking-widest animate-pulse">
                            Nhấp nút phía dưới để xào đồng xu
                          </p>
                        )}
                        {shufflingState === "shuffling" && (
                          <p className="text-[9px] font-cinzel text-[#D4AF37] uppercase tracking-widest">
                            Các đồng xu đang cộng hương linh khí tương sinh tương khắc...
                          </p>
                        )}
                        {shufflingState === "selecting" && (
                          <p className="text-[9px] font-cinzel text-[#D4AF37] uppercase tracking-widest animate-bounce">
                            {selectedCoins.filter(Boolean).length === 3 
                              ? "✦ LINH KHÍ ĐÃ TỤ - ĐANG BIẾN QUẺ ✦" 
                              : "✦ THÀNH TÂM NHẤP CHỌN TỪNG ĐỒNG XU ĐỂ GIẢI MÃ NHÂN QUẢ ✦"}
                          </p>
                        )}
                        {shufflingState === "revealed" && (
                          <p className="text-[9px] font-cinzel text-green-400 uppercase tracking-widest">
                            Năng lượng hào khí đã tụ hội thành công!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Toss triggers / CTAs */}
                    <div className="w-full flex flex-col items-center gap-3 z-10 pt-4 border-t border-white/5">
                      {shufflingState === "idle" && (
                        <motion.button
                          id="btn-toss-coins-action"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={startInteractiveShuffle}
                          className="w-full py-4 rounded-full border border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37] tracking-[0.3em] font-cinzel text-xs uppercase hover:bg-[#D4AF37]/20 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="h-4.5 w-4.5 text-[#D4AF37] animate-pulse glow-gold" />
                          Xào Đồng Xu Dịch Lý 🌀
                        </motion.button>
                      )}

                      {shufflingState === "shuffling" && (
                        <button
                          disabled
                          className="w-full py-4 rounded-full border border-stone-800 bg-stone-900/50 text-stone-500 tracking-[0.3em] font-cinzel text-xs uppercase flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Đang Xào Trộn Càn Khôn...
                        </button>
                      )}

                      {shufflingState === "selecting" && (
                        <button
                          disabled
                          className="w-full py-4 rounded-full border border-[#D4AF37]/30 bg-stone-950 text-[#D4AF37]/80 tracking-[0.2em] font-cinzel text-xs uppercase flex items-center justify-center gap-2 animate-pulse"
                        >
                          Vui lòng nhấp chọn 3 đồng xu trên đàn tế
                        </button>
                      )}

                      {shufflingState === "revealed" && (
                        <motion.button
                          id="btn-confirm-and-draw-line"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={confirmAndDrawLine}
                          className="w-full py-4 rounded-full border border-green-500 bg-green-950/20 text-green-400 hover:bg-green-900/40 tracking-[0.25em] font-cinzel text-xs uppercase transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="h-4 w-4 text-green-400" />
                          XÁC NHẬN VẼ HÀO LÊN SỚ
                        </motion.button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Side Hexagram Construction (Drawn bottom to top) */}
              <div 
                className="w-full md:w-80 rounded-2xl border border-[#D4AF37]/10 bg-gradient-to-b from-[#18181b] to-[#08080a] p-6 flex flex-col justify-between shadow-[0_25px_60px_rgba(0,0,0,0.95)] transition-all duration-300 preserve-3d group animate-pulse-gold-glow"
                style={{
                  transform: `perspective(1200px) rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 8}deg) translateZ(10px)`,
                }}
              >
                <div>
                  <h4 className="font-cinzel text-xs text-stone-300 tracking-widest mb-4 border-b border-white/5 pb-2 text-center uppercase">
                    Bản Đồ Vẽ Hào
                  </h4>

                  {/* 6 lines diagram representing the drawing process */}
                  <div className="flex flex-col-reverse gap-4.5 items-center justify-center py-6 min-h-[200px]">
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const line = renderedLines[index];
                      const isCurrent = tosses.length === index;

                      return (
                        <div key={index} className="w-full flex items-center justify-between gap-4">
                          <span className="text-[9px] font-cinzel text-stone-500">
                            H{index + 1}
                          </span>
                          
                          <div className="flex-1 flex justify-center">
                            {line ? (
                              line.val === 1 ? (
                                /* Yang Line (Continuous ───) */
                                <motion.div
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  className={`h-2.5 w-36 rounded-md shadow-md ${
                                    line.isChanging
                                      ? "bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.6)]"
                                      : "bg-white/70"
                                  }`}
                                />
                              ) : (
                                /* Yin Line (Divided ─ ─) */
                                <motion.div
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  className="w-36 flex justify-between gap-4"
                                >
                                  <div
                                    className={`h-2.5 w-[45%] rounded-md shadow-md ${
                                      line.isChanging
                                        ? "bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.6)]"
                                        : "bg-white/70"
                                    }`}
                                  />
                                  <div
                                    className={`h-2.5 w-[45%] rounded-md shadow-md ${
                                      line.isChanging
                                        ? "bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.6)]"
                                        : "bg-white/70"
                                    }`}
                                  />
                                </motion.div>
                              )
                            ) : (
                              /* Placeholder empty line */
                              <div
                                className={`h-1.5 w-36 rounded-full border border-dashed transition-all ${
                                  isCurrent
                                    ? "border-[#D4AF37]/60 bg-[#D4AF37]/5 animate-pulse scale-102"
                                    : "border-white/5 bg-black/40"
                                }`}
                              />
                            )}
                          </div>

                          <span className="text-[8px] font-cinzel text-stone-400 w-12 text-right">
                            {line ? (
                              line.isChanging ? (
                                <span className="text-[#D4AF37] font-cinzel tracking-wider glow-gold">BIẾN</span>
                              ) : (
                                <span className="text-stone-500 font-cinzel">TĨNH</span>
                              )
                            ) : isCurrent ? (
                              <span className="text-[#D4AF37]/80 animate-pulse uppercase tracking-widest text-[7px] font-cinzel">ĐANG VẼ</span>
                            ) : (
                              <span className="opacity-10">-</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 text-center">
                  <p className="text-[10px] font-cinzel text-stone-400 uppercase leading-relaxed max-w-xs mx-auto">
                    Chú ý: Quẻ Dịch được xây dựng từ dưới lên trên. Hào đầu tiên vẽ ở dưới đáy, hào cuối cùng vẽ ở trên đỉnh.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: CEREMONIAL PAUSE / REVEAL SCREEN */}
          {step === "result" && (
            <motion.div
              id="oracle-transition-screen"
              key="result-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.0 }}
              className="w-full max-w-xl text-center py-12 flex flex-col items-center"
            >
              <div className="h-16 w-16 mb-6 flex items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37] glow-gold-box-sm">
                <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
              
              <h2 className="font-cinzel text-3xl font-bold text-white tracking-[0.2em] mb-4">
                THE TEMPLE GROWS SILENT
              </h2>
              
              <div className="h-[1px] w-24 bg-[#D4AF37]/30 my-4" />
              
              <p className="font-playfair text-sm text-stone-300 italic max-w-md leading-relaxed">
                &ldquo;The lines are drawn. The bronze coins have fallen. The ripples in the sacred bowl are settling. The cosmic patterns are materializing into calligraphic scrolls...&rdquo;
              </p>
              
              {/* Pulsing loading progress spinner */}
              <div className="mt-8 flex items-center gap-3 text-xs font-cinzel text-[#D4AF37] tracking-[0.3em] glow-gold">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Manifesting Hexagram Oracle
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
