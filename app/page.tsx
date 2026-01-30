"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const AudioRecorder = dynamic(() => import("@/components/AudioRecorder").then(mod => mod.AudioRecorder), { ssr: false });
import { TranscriptionView } from "@/components/TranscriptionView";
import { HistoryList } from "@/components/HistoryList";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/components/Auth";
import { LogOut, Sparkles, Mic2, FileText, User, HelpCircle, CheckCircle2, Zap, Lock, Target, TrendingUp, FileDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { formatPrettyDate } from "@/lib/utils";

export default function Home() {
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'history'>('home');
  const [inputMode, setInputMode] = useState<'audio' | 'text'>('audio');
  const [manualText, setManualText] = useState("");
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAudioReady = async (audioEntity: Blob | File) => {
    setIsProcessing(true);
    setTranscribedText(""); // Clear previous

    const formData = new FormData();
    // Ensure we send a File object with a name and type
    if (audioEntity instanceof Blob && !(audioEntity instanceof File)) {
      formData.append("file", audioEntity, "recording.wav");
    } else {
      formData.append("file", audioEntity);
    }

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        setTranscribedText(data.text);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to transcribe audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-purple-500/30">

      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-6 md:py-10 flex flex-col items-center w-full">

        {/* Header - Centered */}
        <div className="w-full flex flex-col items-center mb-8 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-sm rotate-45" />
              </div>
              TalkLift AI
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent pb-2 leading-tight">
              Elevate Your <br className="hidden md:block" /> Spoken English
            </h1>
          </motion.div>

          {/* Top Right Auth/Logout - Fixed to extreme viewport corner */}
          <div className="fixed top-6 right-6 z-[60]">
            {session ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-md p-1.5 pr-3 rounded-2xl border border-slate-800 shadow-xl cursor-pointer hover:bg-slate-800/80 transition-all border-b-purple-500/30 group"
              >
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-purple-400 transition-colors">Talk Buddy</span>
                  <span className="text-xs text-slate-300 font-semibold">{session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <User className="w-5 h-5" />
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all shadow-lg shadow-purple-500/40 border border-purple-400/20"
              >
                Log In
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area - Always Visible */}
        <div className="w-full space-y-8">
          {currentView === 'home' ? (
            <>
              {/* Input Mode Toggle */}
              {!transcribedText && (
                <div className="flex justify-center mb-4">
                  <div className="flex p-1 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 shadow-lg">
                    <button
                      onClick={() => setInputMode('audio')}
                      className={twMerge(
                        "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                        inputMode === 'audio' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <Mic2 className="w-4 h-4" /> Voice
                    </button>
                    <button
                      onClick={() => setInputMode('text')}
                      className={twMerge(
                        "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
                        inputMode === 'text' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <FileText className="w-4 h-4" /> Text
                    </button>
                  </div>
                </div>
              )}

              {/* Recorder Section */}
              <div className={transcribedText ? "hidden" : "block"}>
                {inputMode === 'audio' ? (
                  <AudioRecorder key={resetKey} onAudioReady={handleAudioReady} isProcessing={isProcessing} />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl mx-auto space-y-4"
                  >
                    <div className="relative group">
                      <textarea
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder="Paste or type your English text here..."
                        className="w-full h-48 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 text-slate-200 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all resize-none placeholder:text-slate-600"
                      />
                      <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-1 rounded-md border border-slate-800">
                        {manualText.length} characters
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (manualText.trim()) {
                          setTranscribedText(manualText);
                        }
                      }}
                      disabled={!manualText.trim() || isProcessing}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-5 h-5 text-purple-300" />
                      Analyze Text
                    </button>
                  </motion.div>
                )}

                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 text-center"
                  >
                    <div className="inline-block relative">
                      <div className="w-12 h-12 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-slate-400 animate-pulse">Transcribing your audio...</p>
                  </motion.div>
                )}
              </div>

              {/* Progress Alert */}
              {!session && !transcribedText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-slate-500 text-xs font-medium"
                >
                  <label>Login to save your progress</label>
                </motion.div>
              )}

              {/* Transcription View */}
              {transcribedText && (
                <div className="mt-8">
                  <TranscriptionView
                    originalText={transcribedText}
                    onReset={() => {
                      setTranscribedText("");
                      setManualText("");
                      setResetKey(prev => prev + 1);
                    }}
                    onRequireAuth={() => setShowAuth(true)}
                  />
                </div>
              )}

              {/* Why Choose TalkLift AI section */}
              {!transcribedText && (
                <div className="w-full max-w-4xl mx-auto py-8 border-t border-slate-800/50 mt-8">
                  <div className="flex items-center gap-3 mb-8 justify-center">
                    <HelpCircle className="w-6 h-6 text-purple-400" />
                    <h2 className="text-2xl font-bold text-slate-200 tracking-tight">Why choose TalkLift AI?</h2>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      {
                        title: "Smart Grammar Fixes",
                        desc: "Clear, native-level explanations for every fix to help you learn faster.",
                        icon: CheckCircle2
                      },
                      {
                        title: "Built for Speech",
                        desc: "Optimized for natural talk. Turn voice into polished English instantly.",
                        icon: Mic2
                      },
                      {
                        title: "Session Reports",
                        desc: "Keep track of your wins with simple PDF summaries of your sessions.",
                        icon: FileDown
                      }
                    ].map((item, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-purple-500/30 transition-all group">
                        <item.icon className="w-6 h-6 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-bold text-slate-100 mb-2">{item.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Dedicated History View */
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setCurrentView('home')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold border border-slate-700 transition-all flex items-center gap-2"
                >
                  ← Back to Home
                </button>
              </div>
              <HistoryList />
            </motion.div>
          )}
        </div>

        {/* Profile Modal */}
        <AnimatePresence>
          {showProfile && session && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setShowProfile(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />

                <div className="flex flex-col items-center text-center space-y-4 mb-8 pt-4">
                  <div className="w-20 h-20 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <User className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {session.user.user_metadata?.full_name || 'Active Learner'}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium">{session.user.email}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Last Seen</span>
                    <span className="text-slate-200 text-sm font-medium">
                      {formatPrettyDate(new Date().toISOString())}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Member Since</span>
                    <span className="text-slate-200 text-sm font-medium">
                      {formatPrettyDate(session.user.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      setCurrentView('history');
                    }}
                    className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700"
                  >
                    View Saved Texts
                  </button>
                  <button
                    onClick={() => {
                      supabase.auth.signOut();
                      setShowProfile(false);
                    }}
                    className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold transition-all border border-red-500/20 hover:border-red-500"
                  >
                    Log Out
                  </button>
                </div>

                <button
                  onClick={() => setShowProfile(false)}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Auth Modal Overlay */}
        {showAuth && !session && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowAuth(false)}
            />
            <div className="relative w-full max-w-md">
              <Auth />
              <button
                onClick={() => setShowAuth(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
