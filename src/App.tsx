/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Sparkles, MessageCircle, BookOpen, History, BookMarked, Eye } from "lucide-react";
// @ts-ignore
import shanshuiBg from "./assets/images/shanshui_background_1784186219087.jpg";

// Component imports
import IntroScreen from "./components/IntroScreen";
import BaguaHall from "./components/BaguaHall";
import DivinationChamber from "./components/DivinationChamber";
import InterpretationScroll from "./components/InterpretationScroll";
import WisdomLibrary from "./components/WisdomLibrary";
import SageChat from "./components/SageChat";
import SacredJournal from "./components/SacredJournal";
import AudioController from "./components/AudioController";
import InkSplashOverlay from "./components/InkSplashOverlay";
import GoldDustParticles from "./components/GoldDustParticles";

// Types
import { DivinationSession, Trigram } from "./types";

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [currentTab, setCurrentTab] = useState<"altar" | "oracle" | "sage" | "library" | "journal">("altar");
  const [activeAtmosphere, setActiveAtmosphere] = useState<
    "temple" | "sky" | "earth" | "water" | "fire" | "thunder" | "wind" | "mountain" | "lake"
  >("temple");

  // Divination casting process state
  const [activeSession, setActiveSession] = useState<DivinationSession | null>(null);
  const [isCasting, setIsCasting] = useState(false);

  // Sage chat initial prompt context
  const [sageInitialPrompt, setSageInitialPrompt] = useState<string | null>(null);

  // Journal history state synchronizing with localStorage
  const [journalSessions, setJournalSessions] = useState<DivinationSession[]>([]);

  // Immersive Ink Splash transition states
  const [isSplashing, setIsSplashing] = useState(false);
  const [splashKey, setSplashKey] = useState(0);

  // Load journal sessions on start
  useEffect(() => {
    try {
      const stored = localStorage.getItem("iching_journal_timeline");
      if (stored) {
        setJournalSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to retrieve stored I Ching history:", e);
    }
  }, []);

  // Save journal whenever they update
  const saveSessionsToStorage = (updatedList: DivinationSession[]) => {
    setJournalSessions(updatedList);
    try {
      localStorage.setItem("iching_journal_timeline", JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Failed to commit I Ching timeline to local storage:", e);
    }
  };

  // Trigger tab change with immersive ink splash transition
  const triggerTabChange = (
    targetTab: "altar" | "oracle" | "sage" | "library" | "journal",
    options?: { isCasting?: boolean; activeSession?: DivinationSession | null }
  ) => {
    if (targetTab === currentTab && options?.isCasting === undefined && options?.activeSession === undefined) {
      return;
    }

    setSplashKey((prev) => prev + 1);
    setIsSplashing(true);

    setTimeout(() => {
      if (options) {
        if (options.isCasting !== undefined) setIsCasting(options.isCasting);
        if (options.activeSession !== undefined) setActiveSession(options.activeSession);
      } else {
        if (targetTab !== "oracle") {
          setIsCasting(false);
          setActiveSession(null);
        }
      }
      setCurrentTab(targetTab);
    }, 500);

    setTimeout(() => {
      setIsSplashing(false);
    }, 1400);
  };

  // Begin oracle divination ceremony
  const handleBeginDivination = () => {
    triggerTabChange("oracle", { isCasting: true, activeSession: null });
    setActiveAtmosphere("temple");
  };

  // Transfer divination context to Sage Chat
  const handleAskSage = (hexagramName: string, originalQuestion: string) => {
    setSageInitialPrompt(
      `Ta vừa gieo được quẻ "${hexagramName}" cho câu hỏi thỉnh ý: "${originalQuestion}". Xin Hiền Sĩ hãy giải nghĩa chi tiết và đưa ra lời khuyên sâu sắc cho ta.`
    );
    triggerTabChange("sage");
  };

  // Complete casting ceremony
  const handleCompleteCasting = (session: DivinationSession) => {
    setIsCasting(false);
    setActiveSession(session);
    
    // Auto-commit newly completed session to local journal list
    const updated = [session, ...journalSessions];
    saveSessionsToStorage(updated);
  };

  // Add or update session reflection notes
  const handleUpdateReflection = (sessionId: string, reflectionNotes: string) => {
    const updated = journalSessions.map((s) => {
      if (s.id === sessionId) {
        return { ...s, notes: reflectionNotes };
      }
      return s;
    });
    saveSessionsToStorage(updated);

    // Update active screen state if matching active scroll session
    if (activeSession && activeSession.id === sessionId) {
      setActiveSession({ ...activeSession, notes: reflectionNotes });
    }
  };

  // Delete a recorded session
  const handleDeleteSession = (sessionId: string) => {
    const updated = journalSessions.filter((s) => s.id !== sessionId);
    saveSessionsToStorage(updated);
    if (activeSession && activeSession.id === sessionId) {
      setActiveSession(null);
    }
  };

  // Return to Altar and reset casting state
  const handleRestartOracle = () => {
    triggerTabChange("altar", { isCasting: false, activeSession: null });
    setActiveAtmosphere("temple");
  };

  // Trigram details selection changes Altar atmosphere
  const handleTrigramAtmosphereSelection = (trigram: Trigram) => {
    const mapping: Record<string, typeof activeAtmosphere> = {
      qian: "sky",
      kun: "earth",
      kan: "water",
      li: "fire",
      zhen: "thunder",
      xun: "wind",
      gen: "mountain",
      dui: "lake",
    };
    setActiveAtmosphere(mapping[trigram.id] || "temple");
  };

  // Navigation menu definitions
  const menuItems = [
    { id: "altar", label: "Điện Bát Quái", icon: Compass },
    { id: "oracle", label: "Xin Quẻ Dịch", icon: Sparkles },
    { id: "sage", label: "Hỏi Hiền Nhân", icon: MessageCircle },
    { id: "library", label: "Cẩm Nang Quẻ", icon: BookMarked },
    { id: "journal", label: "Sử Ký Cá Nhân", icon: History },
  ];

  const atmosphereRealms: Record<string, string> = {
    temple: "Đền Thờ",
    sky: "Thiên (Trời)",
    earth: "Địa (Đất)",
    water: "Thủy (Nước)",
    fire: "Hỏa (Lửa)",
    thunder: "Lôi (Sấm)",
    wind: "Phong (Gió)",
    mountain: "Sơn (Núi)",
    lake: "Trạch (Đầm)",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] font-sans overflow-x-hidden selection:bg-[#D4AF37]/30 selection:text-white">
      
      {/* Immersive Ink Splash Transition Overlay */}
      <InkSplashOverlay isSplashing={isSplashing} key={splashKey} />

      <AnimatePresence mode="wait">
        {/* Cinematic gate entrance portal */}
        {!hasEntered ? (
          <IntroScreen key="intro" onEnter={() => setHasEntered(true)} />
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0 }}
            className="flex flex-col min-h-screen relative"
          >
            {/* Global Ambient Shanshui Background */}
            <div 
              className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 pointer-events-none mix-blend-lighten"
              style={{ backgroundImage: `url(${shanshuiBg})` }}
            />

            {/* Global Ambient Gold Dust Particles */}
            <GoldDustParticles />

            {/* Global Ambient synthesizer */}
            <AudioController atmosphere={activeAtmosphere} />

            {/* Top glassmorphic Navigation Header Bar */}
            <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-2.5">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                
                {/* Branding */}
                <div className="flex items-center gap-2.5 select-none">
                  <div className="h-7 w-7 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 flex items-center justify-center text-[#D4AF37] glow-gold-box-sm">
                    <span className="font-noto font-bold text-sm">易</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-cinzel text-[7px] tracking-[0.35em] text-[#D4AF37] glow-gold">THIÊN CỔ KINH THƯ</span>
                    <h1 className="font-cinzel text-xs md:text-sm font-bold tracking-widest text-white leading-tight">
                      KINH DỊCH
                    </h1>
                  </div>
                </div>

                {/* Horizontal Navigation rail on medium+ screens */}
                <nav className="hidden md:flex items-center gap-4 select-none">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        id={`nav-item-header-${item.id}`}
                        key={item.id}
                        onClick={() => {
                          triggerTabChange(item.id as any);
                        }}
                        className={`group px-4 py-1.5 text-xs font-cinzel tracking-[0.18em] uppercase flex items-center gap-2 transition-all duration-300 cursor-pointer rounded-lg border-t border-b-2 ${
                          isActive
                            ? "border-t-[#D4AF37]/10 border-b-[#D4AF37] text-[#D4AF37] font-bold glow-gold bg-black/60 shadow-[0_4px_16px_rgba(212,175,55,0.08)] scale-[1.02]"
                            : "border-transparent border-b-transparent text-white/70 hover:text-[#D4AF37] hover:bg-white/5"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 transition-all duration-300 group-hover:wood-emboss-icon" />
                        <span className="font-semibold">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Mobile ambient state label */}
                <div className="md:hidden text-[9px] font-cinzel text-[#D4AF37] tracking-widest uppercase select-none glow-gold">
                  Cõi hiện tại: {atmosphereRealms[activeAtmosphere] || activeAtmosphere}
                </div>

              </div>
            </header>

            {/* Main Application tab panels contents */}
            <main className="flex-1 flex flex-col relative z-10 pb-20 md:pb-6">
              <AnimatePresence mode="wait">
                
                {/* TAB 1: THE BAGUA ALTAR */}
                {currentTab === "altar" && (
                  <motion.div
                    key="tab-altar"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col"
                  >
                    <BaguaHall
                      activeAtmosphere={activeAtmosphere}
                      setAtmosphere={setActiveAtmosphere}
                      onSelectTrigram={handleTrigramAtmosphereSelection}
                      onEnterDivination={handleBeginDivination}
                    />
                  </motion.div>
                )}

                {/* TAB 2: THE DIVINATION ORACLE */}
                {currentTab === "oracle" && (
                  <motion.div
                    key="tab-oracle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col"
                  >
                    {isCasting ? (
                      <DivinationChamber
                        onComplete={handleCompleteCasting}
                        onCancel={handleRestartOracle}
                      />
                    ) : activeSession ? (
                      <InterpretationScroll
                        session={activeSession}
                        onSaveReflection={handleUpdateReflection}
                        onRestart={handleRestartOracle}
                        onAskSage={handleAskSage}
                      />
                    ) : (
                      /* Placeholder if they navigated to oracle directly without casting */
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
                        <Sparkles className="h-10 w-10 text-amber-500/70 animate-pulse mb-4" />
                        <h3 className="font-serif text-xl text-amber-100">Thỉnh Ý Quẻ Dịch</h3>
                        <p className="text-xs text-stone-500 mt-2 max-w-xs mb-6">
                          Bạn có muốn đặt câu hỏi để chiêm nghiệm về vận số, quyết định hay sự cân bằng tâm thức của mình không?
                        </p>
                        <button
                          id="btn-nav-commence-consult"
                          onClick={handleBeginDivination}
                          className="px-6 py-2.5 rounded-full border border-[#D4AF37]/40 hover:border-[#D4AF37] bg-black/40 text-[#D4AF37] hover:text-white transition-all font-serif text-xs uppercase tracking-widest cursor-pointer"
                        >
                          Bắt Đầu Nghi Thức Gieo Quẻ
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 3: THE SAGE COMPANION CHAT */}
                {currentTab === "sage" && (
                  <motion.div
                    key="tab-sage"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col"
                  >
                    <SageChat
                      initialPrompt={sageInitialPrompt}
                      onClearInitialPrompt={() => setSageInitialPrompt(null)}
                    />
                  </motion.div>
                )}

                {/* TAB 4: THE KNOWLEDGE SCROLLS */}
                {currentTab === "library" && (
                  <motion.div
                    key="tab-library"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col"
                  >
                    <WisdomLibrary />
                  </motion.div>
                )}

                {/* TAB 5: THE REFLECTION JOURNAL CHRONICLE */}
                {currentTab === "journal" && (
                  <motion.div
                    key="tab-journal"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col"
                  >
                    <SacredJournal
                      sessions={journalSessions}
                      onUpdateReflection={handleUpdateReflection}
                      onDeleteSession={handleDeleteSession}
                      onEnterDivination={handleBeginDivination}
                      onAskSage={handleAskSage}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
            </main>

            {/* Bottom Glassmorphic Navigation Bar on Mobile devices */}
            <nav className="md:hidden fixed bottom-5 inset-x-3 z-40 rounded-2xl border border-white/10 bg-[#0A0A0B]/95 p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_25px_rgba(212,175,55,0.18)] flex justify-around items-center select-none backdrop-blur-md">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    id={`nav-item-footer-${item.id}`}
                    key={item.id}
                    onClick={() => {
                      triggerTabChange(item.id as any);
                    }}
                    className={`group flex-1 flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
                      isActive 
                        ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 glow-gold-box-sm shadow-[inset_0_0_10px_rgba(212,175,55,0.08)] scale-110" 
                        : "text-stone-300/90 hover:text-white"
                    }`}
                  >
                    <Icon className="h-6 w-6 mb-1.5 transition-all duration-300 group-hover:scale-110 group-hover:text-[#D4AF37]" />
                    <span className="text-[9px] font-cinzel font-bold uppercase tracking-wider text-center leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
