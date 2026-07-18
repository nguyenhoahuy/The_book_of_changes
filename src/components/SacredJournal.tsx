/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, BookOpen, Trash2, Calendar, FileText, ChevronRight, Save, Sparkles, MessageCircle } from "lucide-react";
import { DivinationSession } from "../types";
import { getHexagramByNumber, TRIGRAMS } from "../data/ichingData";

interface SacredJournalProps {
  sessions: DivinationSession[];
  onUpdateReflection: (sessionId: string, reflection: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onEnterDivination: () => void;
  onAskSage?: (hexagramName: string, question: string) => void;
}

export default function SacredJournal({
  sessions,
  onUpdateReflection,
  onDeleteSession,
  onEnterDivination,
  onAskSage,
}: SacredJournalProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [tempReflection, setTempReflection] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleEditClick = (session: DivinationSession) => {
    setEditingSessionId(session.id);
    setTempReflection(session.notes || "");
  };

  const handleSaveClick = (sessionId: string) => {
    onUpdateReflection(sessionId, tempReflection);
    setEditingSessionId(null);
  };

  return (
    <div
      id="sacred-journal-viewport"
      className="relative flex min-h-screen w-full flex-col bg-stone-texture text-[#E0E0E0] py-12 px-6"
    >
      {/* Background ink brush splash */}
      <div className="absolute top-1/4 right-10 text-[18vw] font-noto font-black text-stone-800/10 pointer-events-none select-none uppercase">
        記
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-10 select-none">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37] glow-gold-box-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-white tracking-widest leading-none">
            Biên Niên Sử Thỉnh Ý
          </h2>
          <p className="text-[10px] font-cinzel tracking-[0.25em] text-stone-400 uppercase mt-3">
            Dòng Thời Gian Lưu Giữ Quẻ Dịch & Chiêm Nghiệm Cá Nhân
          </p>
        </div>

        {/* Empty State */}
        {sessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto my-12 py-12 border border-dashed border-[#D4AF37]/20 rounded-3xl bg-black/10 select-none">
            <Compass className="h-10 w-10 text-stone-600 animate-spin mb-4" style={{ animationDuration: "30s" }} />
            <h3 className="font-cinzel text-lg text-stone-200">Sổ Nhật Ký Đang Trống</h3>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed max-w-xs mb-6">
              Bạn chưa lưu giữ quẻ dịch thỉnh ý nào trên Đàn Thái Cực. Lịch sử gieo quẻ và các sớ thư giải quẻ từ AI sẽ hiện hữu tại đây sau khi bạn hoàn thành nghi thức gieo quẻ.
            </p>
            <button
              id="btn-journal-first-consult"
              onClick={onEnterDivination}
              className="px-6 py-2.5 rounded-full border border-[#D4AF37]/40 hover:border-[#D4AF37] bg-black/40 text-[#D4AF37] hover:text-white transition-all font-cinzel text-xs uppercase tracking-widest cursor-pointer"
            >
              Nghi Thức Gieo Quẻ Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {sessions.map((sess) => {
                const primaryHex = getHexagramByNumber(sess.primaryHexagram);
                const transformedHex = sess.transformedHexagram ? getHexagramByNumber(sess.transformedHexagram) : null;
                const isSelected = selectedSessionId === sess.id;

                return (
                  <motion.div
                    id={`journal-record-${sess.id}`}
                    key={sess.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl border border-white/5 bg-[#161618]/65 shadow-lg backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-white/10"
                  >
                    {/* Header Row */}
                    <div
                      id={`journal-record-header-${sess.id}`}
                      onClick={() => setSelectedSessionId(isSelected ? null : sess.id)}
                      className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1 h-9 w-9 rounded-full border border-white/5 bg-black/45 flex items-center justify-center text-stone-500 shrink-0 select-none">
                          <Calendar className="h-4.5 w-4.5 text-[#D4AF37]" />
                        </div>
                        
                        <div>
                          <div className="text-[10px] font-cinzel tracking-widest text-stone-400 uppercase flex items-center gap-1.5 select-none">
                            <span>{new Date(sess.timestamp).toLocaleDateString("vi-VN")}</span>
                            <span>•</span>
                            <span>Phương pháp: {sess.method === "coins" ? "Đồng Xu" : sess.method === "yarrow" ? "Cỏ Thi Cổ" : "Mai Hoa Số"}</span>
                          </div>
                          
                          <h4 className="font-playfair text-base md:text-lg italic font-semibold text-white mt-1 leading-snug">
                            &ldquo;{sess.question}&rdquo;
                          </h4>
                        </div>
                      </div>

                      {/* Display quick summary of hexagrams casted */}
                      <div className="flex items-center gap-6 justify-between md:justify-end select-none">
                        <div className="flex items-center gap-3">
                          <div className="text-right leading-none">
                            <span className="text-[10px] font-cinzel text-stone-400 block mb-1">Quẻ Chủ</span>
                            <span className="text-xs font-cinzel text-[#D4AF37] glow-gold">
                              {primaryHex.vietnamese} ({primaryHex.chinese})
                            </span>
                          </div>
                          
                          {transformedHex && (
                            <div className="text-right leading-none border-l border-white/5 pl-3">
                              <span className="text-[10px] font-cinzel text-stone-400 block mb-1">Quẻ Biến</span>
                              <span className="text-xs font-cinzel text-[#D4AF37] glow-gold">
                                {transformedHex.vietnamese} ({transformedHex.chinese})
                              </span>
                            </div>
                          )}
                        </div>

                        <ChevronRight className={`h-5 w-5 text-stone-600 transition-transform duration-300 ${isSelected ? "rotate-90 text-[#D4AF37]" : ""}`} />
                      </div>
                    </div>

                    {/* Detailed expanded panel */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          id={`journal-record-body-${sess.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="border-t border-white/5 bg-black/35 overflow-hidden"
                        >
                          <div className="p-6 space-y-6">
                            
                            {/* Inner Grid layout: Binary on Left, details on Right */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Left Mini lines panel */}
                              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center select-none">
                                <div className="flex flex-col-reverse gap-2 items-center w-28">
                                  {primaryHex.binary.map((lineVal, idx) => {
                                    const isChanging = sess.changingLines.includes(idx + 1);
                                    return (
                                      <div key={idx} className="w-full flex items-center justify-between gap-2 text-[8px] font-cinzel">
                                        <span className="text-stone-500">Hào {idx+1}</span>
                                        <div className="flex-1">
                                          {lineVal === 1 ? (
                                            <div className={`h-1.5 rounded-full ${isChanging ? "bg-[#D4AF37] glow-gold" : "bg-white/10"}`} />
                                          ) : (
                                            <div className="flex justify-between w-full">
                                              <div className={`h-1.5 w-[42%] rounded-full ${isChanging ? "bg-[#D4AF37] glow-gold" : "bg-white/10"}`} />
                                              <div className={`h-1.5 w-[42%] rounded-full ${isChanging ? "bg-[#D4AF37] glow-gold" : "bg-white/10"}`} />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <span className="text-[10px] font-cinzel text-stone-400 mt-3">
                                  Sơ Đồ Hào Quẻ Gốc
                                </span>
                              </div>

                              {/* Right details content */}
                              <div className="md:col-span-2 space-y-4 font-playfair text-sm leading-relaxed tracking-wide text-stone-300">
                                <div>
                                  <span className="block text-[10px] font-cinzel tracking-widest text-[#D4AF37]/80 uppercase mb-1">
                                    Năng Lượng Quẻ Chủ
                                  </span>
                                  <strong className="text-white font-cinzel text-base font-bold">
                                    Quẻ số {primaryHex.number} - {primaryHex.vietnamese}
                                  </strong>
                                  <p className="text-xs text-stone-300 mt-1 font-playfair">
                                    {primaryHex.meaning}
                                  </p>
                                </div>

                                {transformedHex && (
                                  <div className="border-t border-white/5 pt-3">
                                    <span className="block text-[10px] font-cinzel tracking-widest text-[#D4AF37]/80 uppercase mb-1">
                                      Con Đường Biến Quẻ
                                    </span>
                                    <strong className="text-white font-cinzel text-base font-bold">
                                      Quẻ số {transformedHex.number} - {transformedHex.vietnamese}
                                    </strong>
                                    <p className="text-xs text-stone-300 mt-1 font-playfair">
                                      {transformedHex.meaning}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Reflection notes section */}
                            <div className="border-t border-white/5 pt-5 space-y-3">
                              <span className="block text-[10px] font-cinzel tracking-widest text-[#D4AF37]/80 uppercase">
                                Chiêm Nghiệm & Nhận Thức Cá Nhân Của Bạn
                              </span>

                              {editingSessionId === sess.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    id={`input-edit-reflection-${sess.id}`}
                                    value={tempReflection}
                                    onChange={(e) => setTempReflection(e.target.value)}
                                    placeholder="Ghi lại chiêm nghiệm sâu sắc của bạn tại đây..."
                                    className="w-full rounded-2xl border border-white/5 bg-black/45 p-4 font-playfair text-sm text-stone-200 focus:border-[#D4AF37] focus:outline-none placeholder-stone-750 transition-all resize-none h-24"
                                  />
                                  <div className="flex justify-end gap-3 select-none">
                                    <button
                                      id={`btn-cancel-edit-${sess.id}`}
                                      onClick={() => setEditingSessionId(null)}
                                      className="px-4 py-2 rounded-full border border-white/5 hover:border-white/25 text-stone-400 text-xs font-cinzel uppercase cursor-pointer"
                                    >
                                      Hủy Bỏ
                                    </button>
                                    <button
                                      id={`btn-save-edit-${sess.id}`}
                                      onClick={() => handleSaveClick(sess.id)}
                                      className="px-5 py-2 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/45 text-[#D4AF37] hover:bg-[#D4AF37]/35 text-xs font-cinzel uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                                    >
                                      <Save className="h-3.5 w-3.5" />
                                      Lưu Ghi Chép
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-2xl border border-white/5 bg-black/45 p-4 text-xs md:text-sm font-playfair text-stone-300 relative group/notes">
                                  {sess.notes ? (
                                    <p className="italic leading-relaxed font-playfair text-stone-200">&ldquo;{sess.notes}&rdquo;</p>
                                  ) : (
                                    <p className="text-stone-500 italic font-playfair">Chưa có chiêm nghiệm nào được ghi lại cho lần thỉnh ý này.</p>
                                  )}
                                  
                                  <button
                                    id={`btn-edit-reflection-trigger-${sess.id}`}
                                    onClick={() => handleEditClick(sess)}
                                    className="absolute right-4 top-4 text-[10px] font-cinzel uppercase text-[#D4AF37]/70 hover:text-[#D4AF37] border-b border-[#D4AF37]/20 hover:border-[#D4AF37] cursor-pointer transition-colors"
                                  >
                                    {sess.notes ? "Sửa ghi chép" : "Thêm ghi chép"}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Delete & Ask Sage actions */}
                            <div className="border-t border-white/5 pt-4 flex justify-between items-center select-none">
                              {onAskSage ? (
                                <button
                                  id={`btn-journal-ask-sage-${sess.id}`}
                                  onClick={() => onAskSage(primaryHex.vietnamese, sess.question)}
                                  className="flex items-center gap-1.5 text-[10px] font-cinzel text-[#D4AF37] hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  Hỏi Hiền Sĩ Về Quẻ Này
                                </button>
                              ) : <div />}

                              <button
                                id={`btn-delete-session-${sess.id}`}
                                onClick={() => onDeleteSession(sess.id)}
                                className="flex items-center gap-1.5 text-[10px] font-cinzel text-stone-500 hover:text-red-400 uppercase tracking-wider transition-colors cursor-pointer"
                                title="Xóa bản ghi"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Xóa Khỏi Biên Niên Sử
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
