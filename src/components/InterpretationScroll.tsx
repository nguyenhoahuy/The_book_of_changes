/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Sparkles, FileText, CheckCircle, Flame, Save, RefreshCw, MessageCircle } from "lucide-react";
import { DivinationSession, AIInterpretation, Hexagram } from "../types";
import { getHexagramByNumber, TRIGRAMS } from "../data/ichingData";

interface InterpretationScrollProps {
  session: DivinationSession;
  onSaveReflection: (sessionId: string, reflection: string) => void;
  onRestart: () => void;
  onAskSage?: (hexagramName: string, question: string) => void;
}

export default function InterpretationScroll({
  session,
  onSaveReflection,
  onRestart,
  onAskSage,
}: InterpretationScrollProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<AIInterpretation | null>(null);
  const [activeTab, setActiveTab] = useState<"cast" | "insight" | "shift" | "virtue" | "contemplate">("cast");
  const [reflection, setReflection] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Retrieve full hexagram objects for rendering
  const primaryHex = getHexagramByNumber(session.primaryHexagram);
  const transformedHex = session.transformedHexagram ? getHexagramByNumber(session.transformedHexagram) : null;

  // Query server-side Gemini AI for the interpretation
  useEffect(() => {
    async function fetchInterpretation() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/iching/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: session.question,
            primaryHex,
            changingLines: session.changingLines,
            transformedHex,
          }),
        });

        if (!response.ok) {
          throw new Error("The temple connection was interrupted.");
        }

        const data = await response.json();
        setInterpretation(data);
      } catch (err: any) {
        console.error("Failed to fetch interpretation:", err);
        setError(err.message || "An unexpected error occurred in the spiritual link.");
      } finally {
        setLoading(false);
      }
    }

    fetchInterpretation();
  }, [session.id]);

  const handleSaveReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflection.trim()) return;
    onSaveReflection(session.id, reflection);
    setReflectionSaved(true);
  };

  // Trigram structures for display
  const primaryLower = TRIGRAMS[primaryHex.lowerTrigram] || TRIGRAMS.qian;
  const primaryUpper = TRIGRAMS[primaryHex.upperTrigram] || TRIGRAMS.qian;

  return (
    <div
      id="interpretation-scroll-container"
      className="relative flex min-h-screen w-full flex-col items-center justify-center bg-stone-texture text-[#E0E0E0] py-12 px-6"
    >
      <AnimatePresence mode="wait">
        
        {/* LOADING SCHOLARLY STATE */}
        {loading && (
          <motion.div
            id="scroll-drafting-loader"
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            <div className="h-14 w-14 mb-6 flex items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37] glow-gold-box-sm animate-spin" style={{ animationDuration: "10s" }}>
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-cinzel text-2xl font-bold text-white tracking-widest">
              Đang Dệt Sợi Tơ Tằm
            </h3>
            <p className="text-[10px] font-cinzel text-stone-400 uppercase tracking-widest mt-2">
              Đang mài nghiên mực, phóng bút thư họa sớ quẻ vàng
            </p>
            <div className="h-1 w-48 bg-stone-950 overflow-hidden rounded-full mt-6 relative">
              <div className="absolute top-0 bottom-0 bg-[#D4AF37] glow-gold-box-sm animate-pulse w-1/3 rounded-full" style={{ animationDuration: "1.5s" }} />
            </div>
            
            {/* Zen reflection snippets during loading */}
            <div className="mt-8 text-[11px] font-playfair text-stone-300 italic max-w-xs leading-relaxed">
              &ldquo;Nước chảy xuôi dòng, tùy duyên mà không chống cự. Bậc hiền triết ngắm bóng tối bao phủ, lòng hiểu thấu thái dương chắc chắn sẽ lại lên.&rdquo;
            </div>
          </motion.div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <motion.div
            id="scroll-error-state"
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center max-w-md p-8 border border-white/5 bg-gradient-to-b from-[#161618] to-[#0A0A0B] rounded-2xl"
          >
            <div className="text-[#D4AF37] glow-gold text-3xl font-noto mb-4">卦</div>
            <h3 className="font-cinzel text-xl text-stone-200">Điện Thờ Im Tiếng</h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              {error}
            </p>
            <button
              onClick={onRestart}
              className="mt-6 px-6 py-2 rounded-full border border-white/5 bg-black/40 hover:border-[#D4AF37]/30 text-stone-400 hover:text-[#D4AF37] transition-all font-cinzel text-xs uppercase cursor-pointer"
            >
              Thỉnh Ý Lại Lần Nữa
            </button>
          </motion.div>
        )}

        {/* COMPLETE IMMERSIVE SCROLL REVEAL */}
        {!loading && interpretation && (
          <motion.div
            id="parchment-scroll-layout"
            key="content"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="w-full max-w-4xl flex flex-col items-center animate-none"
          >
            
            {/* Scroll Cedars (Top Roller) */}
            <motion.div 
              initial={{ y: 15 }}
              animate={{ y: 0 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-[95%] h-5 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full border border-black shadow-md flex justify-between px-4 z-10"
            >
              <motion.div 
                initial={{ rotate: -180 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-5 w-2 rounded-full bg-[#D4AF37]/60 border border-[#D4AF37]/30 glow-gold" 
              />
              <motion.div 
                initial={{ rotate: 180 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-5 w-2 rounded-full bg-[#D4AF37]/60 border border-[#D4AF37]/30 glow-gold" 
              />
            </motion.div>

            {/* Scroll Parchment Body with elegant unfolding animation */}
            <motion.div
              initial={{ height: 0, minHeight: 0, paddingTop: 0, paddingBottom: 0, opacity: 0 }}
              animate={{ height: "auto", minHeight: "500px", paddingTop: "2.5rem", paddingBottom: "2.5rem", opacity: 1 }}
              transition={{ 
                height: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
                minHeight: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
                paddingTop: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
                paddingBottom: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.8, delay: 0.1 }
              }}
              className="w-[90%] ink-scroll text-[#E0E0E0] px-8 md:px-12 shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-x border-[#D4AF37]/30 flex flex-col justify-between relative rounded-sm overflow-hidden"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="relative w-full h-full flex-1 flex flex-col justify-between"
              >
              
              {/* Calligraphy Watermarks in Background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40vw] font-noto font-black text-[#D4AF37]/5 select-none pointer-events-none">
                道
              </div>

              {/* Red Ink Seal / Cinnabar Chop */}
              <div className="absolute top-8 right-8 h-14 w-14 border-2 border-[#B22222] rounded-sm flex items-center justify-center text-[#B22222] font-noto font-bold text-center text-xs p-1 select-none pointer-events-none transform rotate-3 shadow-[0_0_8px_rgba(178,34,34,0.15)]">
                易經<br />智慧
              </div>

              {/* Scroll Inner Header */}
              <div className="border-b border-white/5 pb-6 mb-8 relative z-10">
                <div className="text-[9px] font-cinzel tracking-[0.25em] text-[#D4AF37] uppercase mb-1.5 glow-gold">
                  SỚ THƯ KHẢI HUYỀN KINH DỊCH
                </div>
                
                <h3 className="font-cinzel text-xl md:text-3xl font-bold text-white tracking-widest mb-3 leading-snug">
                  &ldquo;{session.question}&rdquo;
                </h3>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-cinzel text-stone-400">
                  <span>Phép gieo: <strong className="font-semibold text-white uppercase">{session.method === "coins" ? "Gieo Đồng Xu" : session.method === "yarrow" ? "Cỏ Thi Cổ" : "Mai Hoa Số"}</strong></span>
                  <span>•</span>
                  <span>Thời gian: <strong className="font-semibold text-white">{new Date(session.timestamp).toLocaleDateString("vi-VN")}</strong></span>
                </div>
              </div>

              {/* Premium Calligraphic Scroll Tabs */}
              <div className="flex border-b border-white/5 overflow-x-auto gap-4 mb-8 pb-1 scrollbar-none relative z-10 select-none">
                {[
                  { id: "cast", label: "Quẻ Đã Gieo" },
                  { id: "insight", label: "Thông Điệp Vũ Trụ" },
                  { id: "shift", label: "Sự Biến Đổi (Hào Động)" },
                  { id: "virtue", label: "Lời Khuyên (Đạo Đức)" },
                  { id: "contemplate", label: "Chiêm Nghiệm" },
                ].map((tab) => (
                  <button
                    id={`scroll-tab-${tab.id}`}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 font-cinzel text-sm tracking-widest uppercase transition-all shrink-0 border-b-2 cursor-pointer ${
                      activeTab === tab.id
                        ? "border-[#D4AF37] text-[#D4AF37] font-bold scale-102 glow-gold"
                        : "border-transparent text-stone-500 hover:text-[#D4AF37]/80"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1 relative z-10 min-h-[250px] leading-relaxed font-playfair text-stone-300 text-sm md:text-base tracking-wide">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: THE CAST DIAGRAM */}
                  {activeTab === "cast" && (
                    <motion.div
                      id="scroll-tab-content-cast"
                      key="cast"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                    >
                      {/* Visual hexagram structure */}
                      <div className="flex flex-col items-center justify-center p-6 border border-white/5 rounded-2xl bg-black/45">
                        <div className="text-[10px] font-cinzel tracking-widest text-[#D4AF37] uppercase mb-4 glow-gold">
                          Cấu Trúc Quẻ Dịch Đã Gieo
                        </div>
                        
                        {/* Render Primary and Transformed Hexagram side by side */}
                        <div className="flex items-center gap-12">
                          {/* Primary */}
                          <div className="flex flex-col items-center">
                            <div className="flex flex-col-reverse gap-3.5 items-center mb-3">
                              {primaryHex.binary.map((lineVal, idx) => {
                                const isChanging = session.changingLines.includes(idx + 1);
                                return (
                                  <div key={idx} className="w-24">
                                    {lineVal === 1 ? (
                                      <div className={`h-2 rounded-full ${isChanging ? "bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" : "bg-white/70"}`} />
                                    ) : (
                                      <div className="flex justify-between w-full">
                                        <div className={`h-2 w-[42%] rounded-full ${isChanging ? "bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" : "bg-white/70"}`} />
                                        <div className={`h-2 w-[42%] rounded-full ${isChanging ? "bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" : "bg-white/70"}`} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-xs font-bold text-white font-cinzel text-center leading-relaxed">
                              Quẻ Chủ: {primaryHex.chinese}<br />
                              <span className="text-[10px] font-cinzel font-normal text-stone-400">{primaryHex.english}</span>
                            </span>
                          </div>

                          {/* Transformed if changes exist */}
                          {transformedHex && (
                            <div className="flex flex-col items-center">
                              <div className="flex flex-col-reverse gap-3.5 items-center mb-3">
                                {transformedHex.binary.map((lineVal, idx) => {
                                  return (
                                    <div key={idx} className="w-24">
                                      {lineVal === 1 ? (
                                        <div className="h-2 bg-white/70 rounded-full" />
                                      ) : (
                                        <div className="flex justify-between w-full">
                                          <div className="h-2 w-[42%] bg-white/70 rounded-full" />
                                          <div className="h-2 w-[42%] bg-white/70 rounded-full" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <span className="text-xs font-bold text-white font-cinzel text-center leading-relaxed">
                                Quẻ Biến: {transformedHex.chinese}<br />
                                <span className="text-[10px] font-cinzel font-normal text-stone-400">{transformedHex.english}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info breakdowns */}
                      <div className="space-y-4 text-stone-300 text-xs md:text-sm">
                        <div>
                          <span className="font-bold text-white block font-cinzel tracking-wider">
                            Quẻ Gốc: Quẻ số {primaryHex.number} - {primaryHex.vietnamese}
                          </span>
                          <span className="text-stone-400 font-playfair">
                            {primaryHex.meaning}
                          </span>
                        </div>
                        <div className="border-t border-white/5 pt-3">
                          <span className="font-bold text-white block font-cinzel tracking-wider">
                            Ngoại Quái (Quẻ Thượng)
                          </span>
                          <span className="text-stone-400 font-playfair">
                            <strong>{primaryUpper.vietnamese} ({primaryUpper.name})</strong> - Tượng quẻ: {primaryUpper.nature}. Hành: {primaryUpper.element === "Metal" ? "Kim" : primaryUpper.element === "Wood" ? "Mộc" : primaryUpper.element === "Water" ? "Thủy" : primaryUpper.element === "Fire" ? "Hỏa" : primaryUpper.element === "Earth" ? "Thổ" : primaryUpper.element}.
                          </span>
                        </div>
                        <div className="border-t border-white/5 pt-3">
                          <span className="font-bold text-white block font-cinzel tracking-wider">
                            Nội Quái (Quẻ Hạ)
                          </span>
                          <span className="text-stone-400 font-playfair">
                            <strong>{primaryLower.vietnamese} ({primaryLower.name})</strong> - Tượng quẻ: {primaryLower.nature}. Đức quẻ: {primaryLower.attribute}.
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: COSMIC INSIGHT */}
                  {activeTab === "insight" && (
                    <motion.div
                      id="scroll-tab-content-insight"
                      key="insight"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h4 className="font-cinzel font-bold text-[#D4AF37] uppercase tracking-widest text-xs mb-2 glow-gold">
                          Thông Điệp Tổng Quan
                        </h4>
                        <p className="text-stone-300 leading-relaxed italic font-playfair">
                          &ldquo;{interpretation.overview}&rdquo;
                        </p>
                      </div>

                      <div className="border-t border-white/5 pt-4">
                        <h4 className="font-cinzel font-bold text-[#D4AF37] uppercase tracking-widest text-xs mb-2 glow-gold">
                          Ý Nghĩa Chi Tiết Quẻ Chủ
                        </h4>
                        <p className="text-stone-300 leading-relaxed font-playfair">
                          {interpretation.primaryMeaning}
                        </p>
                      </div>

                      <div className="bg-black/40 p-4 border border-white/5 rounded-xl mt-4 text-xs italic text-[#D4AF37] font-playfair">
                        <strong>Lời Thoán Truyền Thống</strong>: {primaryHex.judgment}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: THE SHIFT (CHANGING LINES) */}
                  {activeTab === "shift" && (
                    <motion.div
                      id="scroll-tab-content-shift"
                      key="shift"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h4 className="font-cinzel font-bold text-[#D4AF37] uppercase tracking-widest text-xs mb-2 glow-gold">
                          Phân Tích Các Hào Động
                        </h4>
                        <p className="text-stone-300 leading-relaxed font-playfair">
                          {interpretation.changingLinesAnalysis}
                        </p>
                      </div>

                      {transformedHex ? (
                        <div className="border-t border-white/5 pt-4">
                          <h4 className="font-cinzel font-bold text-[#D4AF37] uppercase tracking-widest text-xs mb-2 glow-gold">
                            Xu Thế Biến Đổi: {transformedHex.vietnamese} ({transformedHex.chinese})
                          </h4>
                          <p className="text-stone-300 leading-relaxed mb-3 font-playfair">
                            {interpretation.transformedMeaning}
                          </p>
                          <div className="bg-black/40 p-4 border border-white/5 rounded-xl text-xs text-stone-400 font-playfair">
                            <strong>Lời Thoán Quẻ Biến</strong>: {transformedHex.judgment}
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-white/5 pt-4">
                          <h4 className="font-cinzel font-bold text-stone-400 uppercase tracking-widest text-xs mb-2">
                            Quẻ Tĩnh Không Có Hào Động
                          </h4>
                          <p className="text-stone-400 leading-relaxed italic font-playfair">
                            Quẻ thỉnh ý của bạn tĩnh lặng hoàn toàn, biểu thị trạng thái ổn định lâu dài, không có hào động biến đổi đột ngột. Hãy tập trung thấu triệt và áp dụng trọn vẹn đức hạnh tĩnh tại của quẻ {primaryHex.vietnamese} trước khi tìm kiếm sự thay đổi từ bên ngoài.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 4: PATH OF VIRTUE (GUIDANCE, WARNINGS) */}
                  {activeTab === "virtue" && (
                    <motion.div
                      id="scroll-tab-content-virtue"
                      key="virtue"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-white/5 bg-black/45 p-5">
                          <h4 className="font-cinzel font-bold text-emerald-400 uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Phẩm Hạnh Cần Nuôi Dưỡng (Điểm Cát)
                          </h4>
                          <p className="text-stone-300 text-xs md:text-sm leading-relaxed font-playfair">
                            {interpretation.guidance}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/5 bg-black/45 p-5">
                          <h4 className="font-cinzel font-bold text-rose-400 uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Sai Lầm Cần Tránh (Điểm Hung)
                          </h4>
                          <p className="text-stone-300 text-xs md:text-sm leading-relaxed font-playfair">
                            {interpretation.warnings}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5">
                        <h4 className="font-cinzel font-bold text-[#D4AF37] uppercase tracking-wider text-xs mb-2 glow-gold">
                          Cơ Hội Phát Triển Tâm Linh
                        </h4>
                        <p className="text-stone-300 text-xs md:text-sm leading-relaxed font-playfair">
                          {interpretation.opportunities}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 5: REFLECTION JOURNAL */}
                  {activeTab === "contemplate" && (
                    <motion.div
                      id="scroll-tab-content-contemplate"
                      key="contemplate"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div className="rounded-2xl border border-white/5 bg-black/45 p-5">
                        <h4 className="font-cinzel font-bold text-[#D4AF37] uppercase tracking-wider text-xs mb-3 glow-gold">
                          Câu Hỏi Gợi Ý Chiêm Nghiệm
                        </h4>
                        <ul className="space-y-3.5">
                          {interpretation.reflectionQuestions.map((q, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-stone-300 font-playfair">
                              <span className="font-cinzel text-[#D4AF37] font-bold glow-gold">{idx + 1}.</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Reflection Input Form */}
                      <form onSubmit={handleSaveReflectionSubmit} className="space-y-4">
                        <label htmlFor="input-reflection" className="block text-[10px] font-cinzel tracking-widest text-stone-400 uppercase">
                          Ghi chép lại những nhận thức sâu sắc, cảm ngộ cá nhân để lưu giữ vào Nhật Ký Hành Trình
                        </label>
                        <textarea
                          id="input-reflection"
                          value={reflection}
                          onChange={(e) => setReflection(e.target.value)}
                          disabled={reflectionSaved}
                          placeholder="Tôi cảm nhận quẻ dịch này nhắn nhủ tôi nên kiên nhẫn chờ đợi, lùi một bước để nhìn nhận rõ hơn..."
                          className="w-full rounded-xl border border-white/5 bg-black/40 p-4 font-playfair text-sm text-stone-300 focus:border-[#D4AF37] focus:outline-none placeholder-stone-500 transition-all shadow-inner resize-none h-24"
                        />
                        
                        <div className="flex justify-end">
                          {reflectionSaved ? (
                            <div className="flex items-center gap-2 text-xs font-cinzel text-emerald-400 font-medium glow-gold">
                              <CheckCircle className="h-4 w-4" />
                              Đã lưu thành công vào dòng nhật ký hành trình!
                            </div>
                          ) : (
                            <button
                              id="btn-save-journal-reflection"
                              type="submit"
                              disabled={!reflection.trim()}
                              className="px-6 py-2.5 rounded-full border border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37] hover:bg-[#D4AF37]/20 font-cinzel text-xs uppercase tracking-wider cursor-pointer disabled:opacity-30 flex items-center gap-2 transition-all"
                            >
                              <Save className="h-4 w-4" />
                              Lưu Chiêm Nghiệm Vào Nhật Ký
                            </button>
                          )}
                        </div>
                      </form>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Bottom Signature seal */}
              <div className="border-t border-white/5 pt-6 mt-8 flex justify-between items-center text-[10px] font-cinzel text-stone-500 uppercase tracking-widest select-none">
                <span>Đàn Bát Quái Biến Dịch</span>
                <span className="italic">Thành Tâm Đạt Đạo</span>
              </div>

              </motion.div>
            </motion.div>

            {/* Scroll Cedars (Bottom Roller with heavy physics settling spring bounce) */}
            <motion.div
              initial={{ y: -45 }}
              animate={{ y: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 75,
                damping: 14,
                delay: 0.05
              }}
              className="w-[95%] h-5 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-full border border-black shadow-md flex justify-between px-4 z-10 -mt-1"
            >
              <motion.div 
                initial={{ rotate: 180 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-5 w-2 rounded-full bg-[#D4AF37]/60 border border-[#D4AF37]/30 glow-gold" 
              />
              <motion.div 
                initial={{ rotate: -180 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-5 w-2 rounded-full bg-[#D4AF37]/60 border border-[#D4AF37]/30 glow-gold" 
              />
            </motion.div>

            {/* CTA action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-lg">
              <button
                id="btn-consult-anew"
                onClick={onRestart}
                className="flex-1 py-3 bg-black/40 hover:bg-black/60 border border-[#D4AF37]/35 text-stone-300 hover:text-[#D4AF37] transition-all font-cinzel text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer rounded-full shadow-md"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Thỉnh Ý Quẻ Mới
              </button>

              {onAskSage && (
                <button
                  id="btn-ask-sage-about-hexagram"
                  onClick={() => onAskSage(primaryHex.vietnamese, session.question)}
                  className="flex-1 py-3 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37] text-white hover:text-[#D4AF37]/10 transition-all font-cinzel text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer rounded-full shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                  style={{ color: '#D4AF37' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#D4AF37'; }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Hỏi Hiền Sĩ Về Quẻ Này
                </button>
              )}
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
