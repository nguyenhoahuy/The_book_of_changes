/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Compass, Eye, Sparkles, Filter, X } from "lucide-react";
import { HEXAGRAMS_DB, TRIGRAMS, getHexagramByNumber } from "../data/ichingData";
import { Hexagram } from "../types";

export default function WisdomLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedTrigram, setSelectedTrigram] = useState<string | null>(null);
  const [selectedHexagram, setSelectedHexagram] = useState<Hexagram | null>(null);

  // Convert DB to searchable array with index number
  const hexagramsList = useMemo(() => {
    return Object.entries(HEXAGRAMS_DB).map(([number, data]) => {
      const num = parseInt(number, 10);
      const upperTri = TRIGRAMS[data.upperTrigram] || TRIGRAMS.qian;
      return {
        number: num,
        ...data,
        element: upperTri.element,
      };
    });
  }, []);

  // Filtered results
  const filteredHexagrams = useMemo(() => {
    return hexagramsList.filter((hex) => {
      const matchesSearch =
        hex.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hex.vietnamese.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hex.chinese.includes(searchQuery) ||
        hex.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hex.number.toString() === searchQuery.trim();

      const matchesElement = !selectedElement || hex.element === selectedElement;
      const matchesTrigram =
        !selectedTrigram ||
        hex.upperTrigram === selectedTrigram ||
        hex.lowerTrigram === selectedTrigram;

      return matchesSearch && matchesElement && matchesTrigram;
    });
  }, [hexagramsList, searchQuery, selectedElement, selectedTrigram]);

  return (
    <div
      id="wisdom-library-viewport"
      className="relative flex min-h-screen w-full flex-col bg-stone-texture text-[#E0E0E0] py-12 px-6"
    >
      {/* Background calligraphy overlay */}
      <div className="absolute top-1/2 left-10 text-[20vw] font-noto font-black text-stone-800/10 pointer-events-none select-none uppercase">
        經
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-10 select-none">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37] glow-gold-box-sm">
            <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: "30s" }} />
          </div>
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white tracking-widest leading-none">
            Cổ Thư Tra Cứu Kinh Dịch
          </h2>
          <p className="text-[10px] font-cinzel tracking-[0.3em] text-stone-400 uppercase mt-3">
            Bách Khoa Toàn Thư Sáu Mươi Tư Quẻ Dịch
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-[#161618] to-[#0A0A0B] p-5 shadow-xl mb-8 backdrop-blur-md space-y-4">
          
          {/* Search bar and clear */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-stone-500" />
              <input
                id="search-hexagrams"
                type="text"
                placeholder="Tìm kiếm theo tên quẻ, chữ Hán, số hiệu quẻ (vd: 1, 64) hoặc Pinyin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/5 bg-black/40 text-sm focus:border-[#D4AF37] focus:outline-none placeholder-stone-600 font-cinzel"
              />
            </div>
            
            <button
              id="btn-clear-filters"
              onClick={() => {
                setSearchQuery("");
                setSelectedElement(null);
                setSelectedTrigram(null);
              }}
              className="px-5 py-3 rounded-xl border border-white/5 bg-black/40 hover:border-[#D4AF37]/30 text-stone-400 hover:text-[#D4AF37] text-xs font-cinzel tracking-wider transition-all uppercase shrink-0 cursor-pointer"
            >
              Đặt Lại Bộ Lọc
            </button>
          </div>

          {/* Element filtering row */}
          <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
            <span className="text-[10px] font-cinzel tracking-widest text-stone-400 uppercase mr-2 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Ngũ Hành:
            </span>
            {[
              { id: "Metal", label: "Kim" },
              { id: "Wood", label: "Mộc" },
              { id: "Water", label: "Thủy" },
              { id: "Fire", label: "Hỏa" },
              { id: "Earth", label: "Thổ" },
            ].map((elemObj) => (
              <button
                id={`filter-element-${elemObj.id}`}
                key={elemObj.id}
                onClick={() => setSelectedElement(selectedElement === elemObj.id ? null : elemObj.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-cinzel transition-all cursor-pointer border ${
                  selectedElement === elemObj.id
                    ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                    : "border-white/5 bg-black/40 hover:border-white/20 text-stone-400 hover:text-white"
                }`}
              >
                {elemObj.label}
              </button>
            ))}
          </div>

          {/* Trigram filtering row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-cinzel tracking-widest text-stone-400 uppercase mr-2 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Quẻ Đơn (Bát Quái):
            </span>
            {Object.values(TRIGRAMS).map((tri) => (
              <button
                id={`filter-trigram-${tri.id}`}
                key={tri.id}
                onClick={() => setSelectedTrigram(selectedTrigram === tri.id ? null : tri.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-cinzel transition-all cursor-pointer border flex items-center gap-1 ${
                  selectedTrigram === tri.id
                    ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                    : "border-white/5 bg-black/40 hover:border-white/20 text-stone-400 hover:text-white"
                }`}
              >
                <span className="text-stone-500 font-normal">{tri.symbol}</span>
                <span>{tri.vietnamese}</span>
              </button>
            ))}
          </div>

        </div>

        {/* Results Counter */}
        <div className="mb-4 text-xs font-cinzel text-stone-400 uppercase tracking-widest flex items-center justify-between">
          <span>Đang hiển thị {filteredHexagrams.length} quẻ dịch</span>
          {filteredHexagrams.length === 0 && (
            <span className="text-[#D4AF37]/70">Không tìm thấy bản sớ thảo nào phù hợp.</span>
          )}
        </div>

        {/* Grid of Hexagrams */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
          {filteredHexagrams.map((hex) => {
            const isSelected = selectedHexagram?.number === hex.number;
            
            return (
              <motion.div
                id={`hexagram-card-${hex.number}`}
                key={hex.number}
                layoutId={`hex-card-${hex.number}`}
                onClick={() => setSelectedHexagram(hex)}
                className="group relative rounded-2xl border border-white/5 bg-[#161618]/30 p-4 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all duration-300 flex flex-col items-center justify-between min-h-[170px] text-center cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.06)]"
              >
                {/* Number Badge */}
                <span className="absolute top-2 left-3 font-cinzel text-[10px] text-stone-500 group-hover:text-[#D4AF37] transition-colors">
                  #{hex.number}
                </span>

                {/* Draw miniature representation */}
                <div className="flex flex-col-reverse gap-1 items-center justify-center my-4 h-12">
                  {hex.binary.map((lineVal, lIdx) => (
                    <div key={lIdx} className="w-14">
                      {lineVal === 1 ? (
                        <div className="h-1 bg-white/40 group-hover:bg-[#D4AF37] rounded-full transition-colors" />
                      ) : (
                        <div className="flex justify-between w-full">
                          <div className="h-1 w-[40%] bg-white/40 group-hover:bg-[#D4AF37] rounded-full transition-colors" />
                          <div className="h-1 w-[40%] bg-white/40 group-hover:bg-[#D4AF37] rounded-full transition-colors" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Calligraphic Details */}
                <div className="mt-2 w-full">
                  <div className="flex items-center justify-center gap-1.5 leading-none mb-1">
                    <span className="text-lg font-cinzel text-white group-hover:text-white">
                      {hex.vietnamese}
                    </span>
                    <span className="text-xs font-noto text-stone-500 font-semibold group-hover:text-[#D4AF37] glow-gold">
                      {hex.chinese}
                    </span>
                  </div>
                  <div className="text-[8px] font-cinzel tracking-wider uppercase text-stone-400">
                    {hex.english.split(" (")[0]}
                  </div>
                </div>

                {/* Highlight Glow underneath */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-stone-800 to-transparent group-hover:via-[#D4AF37]/30 transition-all duration-500" />
              </motion.div>
            );
          })}
        </div>

        {/* DETAILED HEXAGRAM DIALOG (MODAL OVERLAY) */}
        <AnimatePresence>
          {selectedHexagram && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                id="hexagram-detail-dialog"
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-2xl rounded-2xl border border-white/5 bg-gradient-to-b from-[#161618] to-[#0A0A0B] text-[#E0E0E0] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto relative"
              >
                {/* Traditional cinnabar chop mark */}
                <div className="absolute top-6 right-16 h-10 w-10 border border-[#B22222] rounded-sm flex items-center justify-center text-[#B22222] font-noto font-bold text-center text-[8px] p-0.5 select-none pointer-events-none transform rotate-6 shadow-[0_0_8px_rgba(178,34,34,0.15)]">
                  易經<br />智慧
                </div>

                {/* Close Button */}
                <button
                  id="btn-close-detail-dialog"
                  onClick={() => setSelectedHexagram(null)}
                  className="absolute top-6 right-6 p-2 rounded-full border border-white/5 hover:border-white/20 text-stone-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>

                 {/* Content Header */}
                <div className="border-b border-white/5 pb-5 mb-6">
                  <div className="text-[10px] font-cinzel tracking-widest text-[#D4AF37] uppercase mb-1 glow-gold">
                    CHI TIẾT QUẺ DỊCH #{selectedHexagram.number} • {selectedHexagram.pinyin}
                  </div>
                  
                  <div className="flex items-end gap-3.5 leading-none">
                    <h3 className="font-cinzel text-3xl font-bold text-white tracking-widest">
                      {selectedHexagram.vietnamese}
                    </h3>
                    <span className="text-2xl font-noto text-[#D4AF37] font-bold glow-gold">
                      {selectedHexagram.chinese}
                    </span>
                    <span className="text-xs font-cinzel text-stone-400 uppercase tracking-widest pb-1 border-b border-white/5">
                      Hành {selectedHexagram.element === "Metal" ? "Kim" : selectedHexagram.element === "Wood" ? "Mộc" : selectedHexagram.element === "Water" ? "Thủy" : selectedHexagram.element === "Fire" ? "Hỏa" : selectedHexagram.element === "Earth" ? "Thổ" : selectedHexagram.element}
                    </span>
                  </div>
                </div>

                {/* Body split: Left line diagram, Right text */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-6">
                  
                  {/* Left Column (Hexagram Binary lines) */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-black/45 border border-white/5 shadow-inner">
                    <div className="flex flex-col-reverse gap-3.5 items-center w-full">
                      {selectedHexagram.binary.map((lineVal, idx) => (
                        <div key={idx} className="w-full flex items-center justify-between gap-3">
                          <span className="text-[8px] font-cinzel text-stone-500">
                            Hào {idx + 1}
                          </span>
                          
                          <div className="flex-1">
                            {lineVal === 1 ? (
                              <div className="h-2 bg-white/70 rounded-full" />
                            ) : (
                              <div className="flex justify-between w-full">
                                <div className="h-2 w-[42%] bg-white/70 rounded-full" />
                                <div className="h-2 w-[42%] bg-white/70 rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="h-[1px] w-full bg-white/5 my-4" />
                    
                    <div className="text-[9px] font-cinzel text-stone-400 uppercase tracking-wider text-center">
                      Thượng Quái: {TRIGRAMS[selectedHexagram.upperTrigram]?.vietnamese} ({TRIGRAMS[selectedHexagram.upperTrigram]?.symbol})<br />
                      Hạ Quái: {TRIGRAMS[selectedHexagram.lowerTrigram]?.vietnamese} ({TRIGRAMS[selectedHexagram.lowerTrigram]?.symbol})
                    </div>
                  </div>

                  {/* Right Column (Texts) */}
                  <div className="md:col-span-8 space-y-5 font-playfair text-stone-300 text-sm leading-relaxed tracking-wide">
                    
                    <div>
                      <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[11px] mb-1 font-cinzel glow-gold">
                        Ý Nghĩa Tổng Quan
                      </h4>
                      <p className="text-white text-base font-semibold italic font-playfair">
                        &ldquo;{selectedHexagram.english}&rdquo;
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[11px] mb-1 font-cinzel glow-gold">
                        Lời Thoán (Thoán Từ)
                      </h4>
                      <p className="text-stone-300 text-xs md:text-sm bg-black/20 p-3 rounded-lg border-l-2 border-[#D4AF37] font-playfair">
                        {selectedHexagram.judgment}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[11px] mb-1 font-cinzel glow-gold">
                        Lời Tượng (Tượng Truyện)
                      </h4>
                      <p className="text-stone-300 text-xs md:text-sm font-playfair">
                        {selectedHexagram.imagesText}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[11px] mb-1 font-cinzel glow-gold">
                        Ý Nghĩa Triết Học & Chiêm Nghiệm
                      </h4>
                      <p className="text-stone-300 text-xs md:text-sm font-playfair">
                        {selectedHexagram.meaning}
                      </p>
                    </div>

                  </div>

                </div>

                {/* Footer Signature */}
                <div className="border-t border-white/5 pt-4 mt-6 text-center select-none">
                  <p className="text-[9px] font-cinzel text-stone-400 uppercase tracking-widest">
                    Kinh Dịch • Điện Thư Tri Thức Thái Cực
                  </p>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
