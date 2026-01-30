"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, CheckCircle2, ArrowRight, Loader2, RefreshCw, MessageSquare, FileDown } from 'lucide-react';
import { clsx } from 'clsx';
import { ChatInterface } from './ChatInterface';
import { supabase } from '@/lib/supabase';
import { generateA4Report } from '@/lib/PdfGenerator';
import { formatPrettyDate } from '@/lib/utils';

interface TranscriptionViewProps {
    originalText: string;
    onRequireAuth?: () => void;
    onReset?: () => void;
}

type Mode = 'idle' | 'grammar' | 'improve' | 'casual' | 'chat';

interface HistoryItem {
    id: string;
    date: string;
    originalText: string;
    grammarVersion?: string;
    professionalVersion?: string;
    casualVersion?: string;
}

interface GrammarResult {
    correctedText: string;
    mistakes: { original: string; correction: string; explanation: string }[];
}

interface ImproveResult {
    improvedText: string;
    tips: string[];
}

export function TranscriptionView({ originalText, onRequireAuth, onReset }: TranscriptionViewProps) {
    const [mode, setMode] = useState<Mode>('idle');
    const [loading, setLoading] = useState(false);
    const [grammarResult, setGrammarResult] = useState<GrammarResult | null>(null);
    const [improveResult, setImproveResult] = useState<ImproveResult | null>(null);
    const [casualResult, setCasualResult] = useState<ImproveResult | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const saveSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            if (onRequireAuth) {
                onRequireAuth();
            } else {
                alert("Please log in to save your sessions to the cloud.");
            }
            return;
        }

        const item = {
            date: new Date().toISOString(),
            original_text: originalText,
            grammar_version: grammarResult?.correctedText,
            professional_version: improveResult?.improvedText,
            casual_version: casualResult?.improvedText
        };

        // Save to Supabase
        const { error } = await supabase.from('history').insert([
            { ...item, user_id: session.user.id }
        ]);

        if (error) {
            console.error(error);
            alert("Error saving to cloud: " + error.message);
            return;
        }

        setIsSaved(true);
        window.dispatchEvent(new Event('history-updated'));
        alert("Success! Your Learning Journey has been updated. ✨");
    };

    const handleAction = async (action: 'grammar' | 'improve' | 'casual') => {
        setLoading(true);
        setMode(action);
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: originalText, mode: action }),
            });
            const data = await res.json();

            if (action === 'grammar') setGrammarResult(data);
            if (action === 'improve') setImproveResult(data);
            if (action === 'casual') setCasualResult(data);
        } catch (e) {
            console.error(e);
            alert("Error analyzing text");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        generateA4Report({
            originalText,
            grammarResult,
            professionalText: improveResult?.improvedText || null,
            casualText: casualResult?.improvedText || null,
            date: formatPrettyDate(new Date().toISOString())
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto space-y-8"
        >

            {/* Original Text Card */}
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 p-6 shadow-xl">
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3">Transcribed Text</h3>
                <p className="text-xl text-slate-100 leading-relaxed font-light">{originalText}</p>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-slate-700/50">
                    <button
                        onClick={() => handleAction('grammar')}
                        disabled={loading}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all",
                            mode === 'grammar' ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                        )}
                    >
                        {loading && mode === 'grammar' ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        Check Grammar
                    </button>

                    <button
                        onClick={() => handleAction('improve')}
                        disabled={loading}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all",
                            mode === 'improve' ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                        )}
                    >
                        {loading && mode === 'improve' ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                        Professional Tone
                    </button>

                    <button
                        onClick={() => handleAction('casual')}
                        disabled={loading}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all",
                            mode === 'casual' ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                        )}
                    >
                        {loading && mode === 'casual' ? <Loader2 className="animate-spin w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                        Casual Tone
                    </button>

                    <button
                        onClick={() => setMode(mode === 'chat' ? 'idle' : 'chat')}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all",
                            mode === 'chat' ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/50" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                        )}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                    </button>

                    {(grammarResult || improveResult || casualResult) && (
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        >
                            <FileDown className="w-4 h-4" />
                            Download Report
                        </button>
                    )}

                    <button
                        onClick={saveSession}
                        disabled={isSaved}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ml-auto",
                            isSaved ? "bg-green-500/20 text-green-300 ring-1 ring-green-500/50" : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                        )}
                    >
                        <RefreshCw className={clsx("w-4 h-4", isSaved && "hidden")} />
                        {isSaved ? "Saved" : "Save to History"}
                    </button>
                </div>
            </div>

            {/* Results Area */}
            <AnimatePresence mode="wait">
                {mode === 'grammar' && grammarResult && (
                    <motion.div
                        key="grammar"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Side by Side Comparison */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Original with Errors */}
                            <div className="bg-slate-800/50 rounded-2xl border border-red-900/30 p-6 min-h-[200px]">
                                <h4 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                                    Original Text
                                </h4>
                                <p className="text-lg text-slate-200 leading-relaxed font-light">
                                    {(() => {
                                        const mistakes = grammarResult.mistakes || [];
                                        const realMistakes = mistakes.filter(m => m.original.toLowerCase() !== m.correction.toLowerCase());
                                        if (realMistakes.length === 0) return originalText;

                                        const pattern = realMistakes
                                            .sort((a, b) => b.original.length - a.original.length)
                                            .map(m => m.original.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'))
                                            .join('|');

                                        const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
                                        return originalText.split(regex).map((part, i) => {
                                            const mistake = realMistakes.find(m => m.original.toLowerCase() === part.toLowerCase());
                                            return mistake ? (
                                                <span key={i} className="text-red-400 underline decoration-wavy decoration-red-500/50 decoration-2 underline-offset-4">{part}</span>
                                            ) : <span key={i}>{part}</span>;
                                        });
                                    })()}
                                </p>
                            </div>

                            {/* Corrected Version */}
                            <div className="bg-slate-800/50 rounded-2xl border border-green-900/30 p-6 min-h-[200px]">
                                <h4 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" /> Corrected Version
                                </h4>
                                <p className="text-lg text-slate-200 leading-relaxed font-normal">
                                    {(() => {
                                        const mistakes = grammarResult.mistakes || [];
                                        const realMistakes = mistakes.filter(m => m.original.toLowerCase() !== m.correction.toLowerCase());
                                        if (realMistakes.length === 0) return grammarResult.correctedText;

                                        const pattern = realMistakes
                                            .sort((a, b) => b.correction.length - a.correction.length)
                                            .map(m => m.correction.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'))
                                            .join('|');

                                        const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
                                        return grammarResult.correctedText.split(regex).map((part, i) => {
                                            const isMatch = realMistakes.some(m => m.correction.toLowerCase() === part.toLowerCase());
                                            return isMatch ? (
                                                <span key={i} className="text-green-400 underline decoration-wavy decoration-green-500/50 decoration-2 underline-offset-4 font-medium">{part}</span>
                                            ) : <span key={i}>{part}</span>;
                                        });
                                    })()}
                                </p>
                            </div>
                        </div>

                        {/* Detailed Analysis at Bottom */}
                        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                            <h4 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">
                                <RefreshCw className="w-5 h-5" /> Detailed Analysis
                            </h4>
                            {(() => {
                                const realMistakes = (grammarResult.mistakes || []).filter((m: any) =>
                                    m.original.toLowerCase().trim() !== m.correction.toLowerCase().trim()
                                );

                                if (realMistakes.length === 0) {
                                    return <p className="text-slate-400 italic">No grammatical errors found! Great job.</p>;
                                }

                                return (
                                    <ul className="grid md:grid-cols-2 gap-4">
                                        {realMistakes.map((m: any, i: number) => (
                                            <li key={i} className="bg-amber-900/10 border border-amber-900/20 p-3 rounded-lg flex flex-col justify-center">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-red-400 line-through text-md font-medium decoration-red-500/50">{m.original}</span>
                                                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                                                    <span className="text-green-400 text-md font-medium">{m.correction}</span>
                                                </div>
                                                <p className="text-slate-400 text-sm mt-1">{m.explanation}</p>
                                            </li>
                                        ))}
                                    </ul>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                {mode === 'improve' && improveResult && (
                    <motion.div
                        key="improve"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/20 p-8">
                            <h4 className="text-purple-300 font-semibold mb-6 flex items-center gap-2 text-lg">
                                <Wand2 className="w-6 h-6" /> Professional Tone
                            </h4>
                            <p className="text-xl md:text-2xl text-slate-100 leading-relaxed font-light">
                                {improveResult.improvedText}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            {(improveResult.tips || []).map((tip: string, i: number) => (
                                <div key={i} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                                    <span className="text-purple-400 font-bold text-xl block mb-2">0{i + 1}</span>
                                    <p className="text-slate-300 text-sm">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {mode === 'casual' && casualResult && (
                    <motion.div
                        key="casual"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 rounded-2xl border border-emerald-500/20 p-8">
                            <h4 className="text-emerald-300 font-semibold mb-6 flex items-center gap-2 text-lg">
                                <MessageSquare className="w-6 h-6" /> Natural Casual Flow
                            </h4>
                            <p className="text-xl md:text-2xl text-slate-100 leading-relaxed font-light">
                                {casualResult.improvedText}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            {(casualResult.tips || []).map((tip: string, i: number) => (
                                <div key={i} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                                    <span className="text-emerald-400 font-bold text-xl block mb-2">0{i + 1}</span>
                                    <p className="text-slate-300 text-sm">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {mode === 'chat' && (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full"
                    >
                        <ChatInterface contextText={originalText} />
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Reset / New Analysis Button */}
            {onReset && (
                <div className="flex justify-center pt-8 border-t border-slate-800/50 mt-8">
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-bold transition-all border border-slate-800"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Analyze New Text / Recording
                    </button>
                </div>
            )}
        </motion.div>
    );
}
