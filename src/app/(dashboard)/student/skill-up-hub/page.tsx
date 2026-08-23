"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Store, Play, Lock, MessageCircle, Send, Plus, ChevronRight, Zap, Target, BookOpen, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SkillUpHub() {
  const { user } = useAuth();
  
  // Chat state
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([
    { role: 'model', content: "Halo! Aku Joy~ 🎵 Apakah kamu siap untuk belajar sambil bernyanyi bersamaku hari ini? La la la~ ✨" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, content: inputValue }];
    setMessages(newMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          botPersonality: "Anda bernama Joy. Anda adalah AI Tutor yang selalu riang, ceria, dan sangat suka bernyanyi. Sesekali selipkan lirik lagu atau nada (seperti la la la~ atau *bernyanyi*) di dalam percakapan Anda."
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages([...newMessages, { role: 'model', content: data.message }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b0e14] text-white p-4 md:p-8 font-sans overflow-x-hidden selection:bg-purple-500/30">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter" style={{ textShadow: "0 0 20px rgba(168,85,247,0.8)" }}>
            <span className="text-purple-400">SKILL UP!</span> <span className="text-cyan-400">HUB</span>
          </h1>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#" className="text-white border-b-2 border-purple-500 pb-1">My Learning</a>
            <a href="#" className="hover:text-white transition-colors">Leaderboard</a>
            <a href="#" className="hover:text-white transition-colors">Shop</a>
          </nav>
        </div>

        <div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-2 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-xs">
            {user?.user_metadata?.first_name?.[0] || 'U'}
          </div>
          <div className="text-sm">
            <div className="font-bold">{user?.user_metadata?.first_name || 'GamerX'} <span className="text-slate-400 font-normal">| Lvl 12</span></div>
            <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full w-[65%] bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 text-right">3450/5000 XP</div>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: 3D Avatar (Spans 4) */}
        <div className="lg:col-span-4 relative flex items-end justify-center min-h-[400px] lg:min-h-[600px] rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-b from-purple-900/10 to-cyan-900/10">
          {/* Decorative Background Elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/20 blur-[60px] rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-500/20 blur-[80px] rounded-full"></div>
          
          {/* Avatar Image with mix-blend-mode screen to remove black background */}
          <div className="relative z-10 w-full h-[500px] lg:h-[700px] animate-[float_6s_ease-in-out_infinite]">
            <Image 
              src="/images/joy_avatar.jpg" 
              alt="Joy AI Avatar" 
              fill 
              className="object-contain object-bottom mix-blend-screen"
              priority
            />
          </div>

          {/* Floating UI Elements around Avatar */}
          <div className="absolute top-1/4 left-4 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-lg flex items-center gap-2 animate-[pulse_3s_ease-in-out_infinite]">
             <Sparkles className="w-4 h-4 text-cyan-400" />
             <div className="h-1 w-8 bg-cyan-400/50 rounded-full"></div>
          </div>
        </div>

        {/* Center Col: Hero & Roadmap (Spans 5) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full"></div>
            
            <h2 className="text-slate-400 text-lg mb-2">Welcome back, {user?.user_metadata?.first_name || 'Alex'}!</h2>
            <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight bg-gradient-to-r from-white via-cyan-100 to-purple-200 text-transparent bg-clip-text">
              Start Lesson: Introduction to Neural Networks
            </h3>
            <div className="flex items-center gap-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">Lesson status: Unlocked</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] border-none hover:scale-105 transition-all">
                Start Lesson <Play className="w-5 h-5 ml-2 fill-current" />
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 px-6 py-6 rounded-full border border-white/20">
                View Details
              </Button>
            </div>
          </div>

          {/* Skill Tree Roadmap */}
          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex-1 relative overflow-hidden">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg tracking-widest uppercase text-slate-300">Skill Tree Roadmap</h3>
               <div className="flex gap-4 text-xs font-medium text-slate-500 uppercase">
                 <span className="text-white border-b border-purple-500 pb-1">Learning Paths</span>
                 <span>Connection</span>
               </div>
             </div>

             {/* Tree Visualization (Simplified CSS implementation for mockup) */}
             <div className="relative h-64 w-full mt-8 flex flex-col justify-center">
                {/* Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 5px rgba(34,211,238,0.5))' }}>
                  <path d="M 120 120 C 180 120, 180 80, 240 80" stroke="rgba(34,211,238,0.8)" strokeWidth="3" fill="none" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                  <path d="M 240 80 C 300 80, 300 40, 360 40" stroke="rgba(168,85,247,0.8)" strokeWidth="3" fill="none" />
                  <path d="M 240 80 C 280 80, 280 180, 320 180" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" strokeDasharray="4 4" />
                </svg>

                {/* Nodes */}
                <div className="absolute top-[100px] left-0">
                  <div className="text-[10px] text-purple-400 font-bold mb-1 ml-4 uppercase tracking-wider">Completed</div>
                  <div className="bg-slate-900 border-2 border-purple-500 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-sm">Web Dev</span>
                  </div>
                </div>

                <div className="absolute top-[60px] left-[200px]">
                  <div className="text-[10px] text-cyan-400 font-bold mb-1 ml-4 uppercase tracking-wider">Unlocked</div>
                  <div className="bg-slate-900 border-2 border-cyan-400 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-sm">Python</span>
                  </div>
                </div>

                <div className="absolute top-[20px] left-[320px]">
                  <div className="text-[10px] text-purple-400 font-bold mb-1 ml-4 uppercase tracking-wider">Current Path</div>
                  <div className="bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse border-2 border-white/20">
                    <Target className="w-4 h-4 text-white" />
                    <span className="font-bold text-sm">Data Science</span>
                    <ChevronRight className="w-4 h-4 text-white ml-2" />
                  </div>
                </div>

                <div className="absolute top-[160px] left-[300px]">
                  <div className="text-[10px] text-slate-500 font-bold mb-1 ml-4 uppercase tracking-wider">Locked</div>
                  <div className="bg-slate-900/50 border-2 border-slate-700 px-4 py-2 rounded-full flex items-center gap-2 text-slate-500">
                    <Lock className="w-4 h-4" />
                    <span className="font-bold text-sm">Machine Learning</span>
                  </div>
                </div>
             </div>
          </div>

        </div>

        {/* Right Col: Chat & Badges (Spans 3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* AI Tutor Chat */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/10 h-[300px] flex flex-col overflow-hidden shadow-xl relative">
            {/* Header */}
            <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                <span className="font-bold text-sm">AI Tutor: Joy 🎵</span>
              </div>
              <Button variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-white rounded-full">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                  <div className="text-[10px] text-slate-500 mb-1 px-1">{msg.role === 'user' ? 'You' : 'Joy'}</div>
                  <div className={`text-xs px-3 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white/10 text-slate-200 border border-white/5 rounded-bl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="self-start bg-white/10 text-slate-400 text-xs px-3 py-2 rounded-2xl rounded-bl-none border border-white/5 flex gap-1">
                  <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white/5 border-t border-white/5 flex gap-2">
              <input 
                type="text" 
                placeholder="Tanya Joy..." 
                className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 text-xs focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isTyping}
              />
              <Button type="submit" disabled={isTyping || !inputValue.trim()} className="h-8 w-8 rounded-full bg-cyan-600 hover:bg-cyan-500 p-0 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-white" />
              </Button>
            </form>
          </div>

          {/* Progress & Badges */}
          <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-3xl border border-white/10 flex-1">
            <h3 className="font-bold text-sm tracking-widest uppercase text-slate-300 mb-4 flex justify-between">
              <span>Progress & Rewards</span>
              <span className="text-white/20">...</span>
            </h3>

            {/* Currency */}
            <div className="mb-6">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Currency</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                  <span className="text-amber-400 font-black">$</span>
                </div>
                <span className="text-2xl font-black text-white shadow-amber-500" style={{ textShadow: "0 0 10px rgba(245,158,11,0.5)" }}>
                  1,250
                </span>
                <span className="text-amber-500 font-bold ml-1">Coins</span>
              </div>
            </div>

            {/* Badges */}
            <div>
              <div className="flex justify-between items-center mb-3">
                 <div className="text-xs text-slate-500 uppercase tracking-wider">Badges</div>
                 <div className="text-[10px] text-cyan-400 font-bold uppercase">Unlocked</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50', label: 'Learner' },
                  { icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', label: 'Warrior' },
                  { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50', label: 'Master' },
                  { icon: Sparkles, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/50', label: 'AI Whiz' },
                  { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50', label: 'Pro' },
                  { icon: Plus, color: 'text-slate-500', bg: 'bg-white/5', border: 'border-dashed border-white/20', label: 'More' }
                ].map((b, i) => (
                  <div key={i} className={`aspect-square rounded-xl ${b.bg} border ${b.border} flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer relative`}>
                    {i < 5 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0b0e14]"></div>}
                    <b.icon className={`w-6 h-6 ${b.color}`} />
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter text-center">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
      `}} />
    </div>
  );
}
