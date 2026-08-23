"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Sparkles, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function JoyChat() {
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "La la la~ Halo teman! Namaku Joy! 🎶 Mau ngobrol soal tugas kepemimpinan, cara atur uang jajan, atau curhat soal public speaking? Aku siap dengerin!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          botPersonality: "Kamu bernama Joy, seorang asisten AI yang ceria, suka bernyanyi, dan ahli dalam bidang soft skill (kepemimpinan, public speaking, literasi finansial anak sekolah, dll). Selalu gunakan kata-kata yang memotivasi, gunakan emoji musik 🎵 sesekali, dan jangan bersikap kaku."
        })
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Aduh, suara Joy lagi habis nih (koneksi error). Coba lagi ya! 🎵" }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Waduh, koneksi ke panggung Joy terputus! 🎤 Coba lagi ya!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] text-slate-800 flex flex-col items-center">
      
      {/* Decorative bg elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-yellow-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 pt-6 h-screen flex flex-col pb-6">
        
        {/* Header */}
        <header className="flex items-center justify-between bg-white/80 backdrop-blur-xl border-2 border-white rounded-[2rem] p-4 shadow-sm mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/student/skill-up-hub" className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-300 shadow-sm relative">
                <img src="/images/joy_avatar.jpg" alt="Joy" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="font-black text-xl text-slate-800 leading-tight">Joy AI</h1>
                <p className="text-xs font-bold text-yellow-600 flex items-center gap-1">
                  <Music className="w-3 h-3" /> Siap bernyanyi & membantu!
                </p>
              </div>
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-yellow-400 opacity-70" />
        </header>

        {/* Chat Area */}
        <div className="flex-1 bg-white/60 backdrop-blur-md border-2 border-white rounded-[2rem] p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col">
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar pb-4">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div key={idx} className={cn("flex gap-3 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "")}>
                  
                  {/* Avatar */}
                  {!isUser && (
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-yellow-200 shadow-sm self-end mb-2">
                      <img src="/images/joy_avatar.jpg" alt="Joy" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn(
                    "p-4 rounded-3xl text-[15px] leading-relaxed relative shadow-sm",
                    isUser 
                      ? "bg-blue-500 text-white rounded-br-sm shadow-blue-200" 
                      : "bg-yellow-50 border-2 border-yellow-100 text-slate-700 rounded-bl-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-yellow-200 shadow-sm self-end mb-2 opacity-50">
                  <img src="/images/joy_avatar.jpg" alt="Joy" className="w-full h-full object-cover" />
                </div>
                <div className="p-4 rounded-3xl bg-yellow-50 border-2 border-yellow-100 text-slate-700 rounded-bl-sm flex gap-2 items-center h-12">
                   <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
                   <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="pt-4 mt-2 border-t-2 border-white shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                placeholder="Tanya Joy soal presentasi atau curhat yuk..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="w-full bg-white border-2 border-slate-200 text-slate-700 rounded-full px-6 py-4 pr-16 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all font-medium placeholder:text-slate-400 disabled:opacity-50"
              />
              <Button 
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 top-2 bottom-2 w-12 h-auto bg-blue-500 hover:bg-blue-600 text-white rounded-full p-0 flex items-center justify-center disabled:opacity-50 shadow-md transition-transform active:scale-95"
              >
                <Send className="w-5 h-5 ml-1" />
              </Button>
            </form>
          </div>
          
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
