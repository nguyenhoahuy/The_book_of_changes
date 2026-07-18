/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Compass, Sparkles, MessageCircle, RefreshCw, Eye } from "lucide-react";
import { Message } from "../types";

interface SageChatProps {
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export default function SageChat({ initialPrompt, onClearInitialPrompt }: SageChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Kính chào hiền hữu, người đang kiếm tìm thời cơ và sự cân bằng. Ta là Hiền Sĩ của Linh Điện Biến Dịch. Hãy mở rộng lòng mình, giãi bày những bế tắc hoặc lựa chọn đang làm xao động tâm trí bạn, chúng ta sẽ cùng nhau lần theo những vết mực của Vũ Trụ. Bạn muốn thỉnh ý về một mối nghi ngại cụ thể, hay muốn khai mở sâu sắc về bản chất của Ngũ Hành?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastTriggeredPromptRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    if (initialPrompt && initialPrompt !== lastTriggeredPromptRef.current) {
      lastTriggeredPromptRef.current = initialPrompt;
      triggerAutoMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  const triggerAutoMessage = async (text: string) => {
    setIsThinking(true);
    const welcomeMsg: Message = {
      id: "welcome",
      sender: "ai",
      text: "Kính chào hiền hữu, người đang kiếm tìm thời cơ và sự cân bằng. Ta là Hiền Sĩ của Linh Điện Biến Dịch. Hãy mở rộng lòng mình, giãi bày những bế tắc hoặc lựa chọn đang làm xao động tâm trí bạn, chúng ta sẽ cùng nhau lần theo những vết mực của Vũ Trụ. Bạn muốn thỉnh ý về một mối nghi ngại cụ thể, hay muốn khai mở sâu sắc về bản chất của Ngũ Hành?",
      timestamp: new Date().toISOString(),
    };

    const userMessage: Message = {
      id: "user_initial",
      sender: "user",
      text: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [welcomeMsg, userMessage];
    setMessages(updatedMessages);

    try {
      const response = await fetch("/api/iching/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Mối liên kết với điện thờ bị gián đoạn.");
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: "ai_" + Math.random().toString(36).substr(2, 9),
        sender: "ai",
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("Sage chat error:", err);
      const errorMessage: Message = {
        id: "err_" + Math.random().toString(36).substr(2, 9),
        sender: "ai",
        text: "Bậc hiền sĩ vẫn đang nhập định trong im lặng sâu thẳm. Có lẽ gió ngoài điện đang thổi quá mạnh. Xin bạn hãy thành tâm thỉnh ý lại sau giây lát.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handle send message to server API
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isThinking) return;

    const userMessage: Message = {
      id: "user_" + Math.random().toString(36).substr(2, 9),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/iching/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Mối liên kết với điện thờ bị gián đoạn.");
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: "ai_" + Math.random().toString(36).substr(2, 9),
        sender: "ai",
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("Sage chat error:", err);
      const errorMessage: Message = {
        id: "err_" + Math.random().toString(36).substr(2, 9),
        sender: "ai",
        text: "Bậc hiền sĩ vẫn đang nhập định trong im lặng sâu thẳm. Có lẽ gió ngoài điện đang thổi quá mạnh. Xin bạn hãy thành tâm thỉnh ý lại sau giây lát.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  // Pre-configured suggestive prompts
  const suggestions = [
    "Tôi đang đối mặt với quyết định sự nghiệp lớn. Tâm thế nào là đúng đắn lúc này?",
    "Giải nghĩa mối quan hệ tương giao giữa quẻ Cấn (Núi) và quẻ Đoài (Đầm hồ).",
    "Hành Kim hiển lộ như thế nào trong Kinh Dịch?",
    "Gợi ý cho tôi một câu hỏi phù hợp để gieo quẻ thỉnh ý lúc này.",
  ];

  return (
    <div
      id="sage-chat-viewport"
      className="relative flex min-h-screen w-full flex-col bg-stone-texture text-[#E0E0E0] py-12 px-6"
    >
      {/* Background Zen forest overlay */}
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=2000')] bg-cover opacity-5 pointer-events-none mix-blend-color-burn" />

      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between">
        
        {/* Header */}
        <div className="text-center mb-6 select-none border-b border-white/5 pb-4">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37] glow-gold-box-sm">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-white tracking-widest leading-none">
            Vấn Đáp Cùng Hiền Sĩ Kinh Dịch
          </h2>
          <p className="text-[10px] font-cinzel tracking-[0.25em] text-stone-400 uppercase mt-2.5">
            Cuộc đối thoại tâm giao, hòa hợp cùng bậc thầy Kinh Dịch và Ngũ Hành
          </p>
        </div>

        {/* Conversation timeline */}
        <div className="flex-1 rounded-2xl border border-white/5 bg-[#161618]/65 p-5 md:p-6 overflow-y-auto max-h-[55vh] min-h-[350px] shadow-2xl backdrop-blur-md mb-6 space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                id={`chat-message-${msg.id}`}
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Message bubble */}
                <div
                  className={`max-w-2xl rounded-2xl p-4 font-playfair text-sm md:text-base leading-relaxed shadow-lg relative ${
                    msg.sender === "user"
                      ? "bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-white rounded-tr-none"
                      : "bg-black/30 border border-white/5 text-stone-200 rounded-tl-none border-l-2 border-l-[#D4AF37]"
                  }`}
                >
                  {/* Subtle emitter tag */}
                  <span className="block text-[8px] font-cinzel tracking-widest text-[#D4AF37]/70 uppercase mb-1.5 glow-gold">
                    {msg.sender === "user" ? "Môn Sinh (Bạn)" : "Bậc Hiền Sĩ"}
                  </span>

                  {/* Render content split with paragraphs */}
                  <div className="space-y-3 whitespace-pre-wrap font-playfair text-stone-300">
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}

            {isThinking && (
              <motion.div
                id="chat-sage-thinking"
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl rounded-tl-none p-4 bg-black/35 border border-white/5 text-stone-400 font-cinzel text-sm flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#D4AF37]" />
                  <span className="animate-pulse tracking-widest text-[11px] uppercase">
                    Hiền sĩ đang gieo thẻ tre, chiêm nghiệm lời khuyên...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompts */}
        {messages.length === 1 && (
          <div className="mb-6 select-none animate-fade-in">
            <span className="block text-[9px] font-cinzel text-stone-400 tracking-widest uppercase mb-3 text-center">
              Hoặc khởi tâm thỉnh giáo theo các đề tài gợi ý:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-3xl mx-auto">
              {suggestions.map((s, idx) => (
                <button
                  id={`chat-suggestion-${idx}`}
                  key={idx}
                  onClick={() => handleSendMessage(undefined, s)}
                  className="p-3 text-left rounded-xl border border-white/5 hover:border-[#D4AF37]/30 bg-black/40 text-xs text-stone-400 hover:text-[#D4AF37] font-playfair transition-all cursor-pointer truncate"
                >
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="w-full relative max-w-3xl mx-auto select-none">
          <input
            id="input-chat-message"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isThinking}
            placeholder="Giãi bày những nghi ngại về hành trình, ngũ hành hoặc thời cơ với hiền sĩ..."
            className="w-full pl-5 pr-14 py-4 rounded-full border border-white/5 bg-black/40 text-stone-200 text-sm focus:border-[#D4AF37] focus:outline-none placeholder-stone-600 font-playfair shadow-inner"
          />
          <button
            id="btn-send-chat-message"
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-[#D4AF37]/25 border border-[#D4AF37]/45 text-[#D4AF37] hover:bg-[#D4AF37]/40 transition-all cursor-pointer disabled:opacity-25"
            title="Gửi câu hỏi"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
