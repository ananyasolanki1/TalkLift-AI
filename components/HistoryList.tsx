"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, ChevronDown, ChevronUp, FileText, Zap, User, FileDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateA4Report } from '@/lib/PdfGenerator';
import { formatPrettyDate } from '@/lib/utils';

interface HistoryItem {
    id: string;
    date: string;
    original_text: string;
    grammar_version?: string;
    professional_version?: string;
    casual_version?: string;
    // For local fallback compatibility
    originalText?: string;
    grammarVersion?: string;
    professionalVersion?: string;
    casualVersion?: string;
}

export function HistoryList() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            // 1. Load from Cloud if logged in
            let cloudData: HistoryItem[] = [];
            if (session) {
                const { data, error } = await supabase
                    .from('history')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    cloudData = data;
                }
            }

            // 2. Load from LocalStorage
            const localSaved = JSON.parse(localStorage.getItem('eng_improve_history') || '[]');

            // Merge (Cloud takes priority)
            setHistory([...cloudData, ...localSaved]);
        };
        loadHistory();
        window.addEventListener('history-updated', loadHistory);
        return () => window.removeEventListener('history-updated', loadHistory);
    }, []);

    const deleteItem = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Delete from Supabase if it's a UUID (Cloud item)
        if (id.includes('-')) {
            await supabase.from('history').delete().eq('id', id);
        }

        const updated = history.filter(item => item.id !== id);
        localStorage.setItem('eng_improve_history', JSON.stringify(updated.filter(i => !i.id.includes('-'))));
        setHistory(updated);
    };

    if (history.length === 0) return null;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 mt-20">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                    <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-100">Learning Journey</h2>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {history.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors cursor-pointer"
                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        >
                            <div className="p-5 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{formatPrettyDate(item.date)}</span>
                                    </div>
                                    <p className="text-slate-300 truncate font-medium">
                                        &quot;{item.original_text || item.originalText}&quot;
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={(e) => deleteItem(item.id, e)}
                                        className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-all rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {expandedId === item.id ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedId === item.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-5 pb-6 space-y-5 border-t border-slate-800/50 pt-5"
                                    >
                                        <div className="space-y-4">
                                            {/* Original */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase">
                                                    <User className="w-3 h-3" /> Transcribed
                                                </div>
                                                <p className="text-slate-200 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                                                    {item.original_text || item.originalText}
                                                </p>
                                            </div>

                                            {/* Professional */}
                                            {(item.professional_version || item.professionalVersion) && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase">
                                                        <Zap className="w-3 h-3" /> Professional Tone
                                                    </div>
                                                    <p className="text-purple-100 leading-relaxed bg-purple-500/5 p-3 rounded-lg border border-purple-500/20">
                                                        {item.professional_version || item.professionalVersion}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Casual */}
                                            {(item.casual_version || item.casualVersion) && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
                                                        <FileText className="w-3 h-3" /> Casual Tone
                                                    </div>
                                                    <p className="text-emerald-100 leading-relaxed bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
                                                        {item.casual_version || item.casualVersion}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Grammar */}
                                            {(item.grammar_version || item.grammarVersion) && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase">
                                                        <FileText className="w-3 h-3" /> Grammar Corrected
                                                    </div>
                                                    <p className="text-blue-100 leading-relaxed bg-blue-500/5 p-3 rounded-lg border border-blue-500/20 text-sm">
                                                        {item.grammar_version || item.grammarVersion}
                                                    </p>
                                                </div>
                                            )}

                                            {/* PDF Report Download */}
                                            <div className="pt-4 border-t border-slate-800/50 flex justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        generateA4Report({
                                                            originalText: item.original_text || item.originalText || "",
                                                            grammarResult: (item.grammar_version || item.grammarVersion) ? {
                                                                correctedText: item.grammar_version || item.grammarVersion || "",
                                                                mistakes: [] // We don't store full mistake breakdown in history yet
                                                            } : null,
                                                            professionalText: item.professional_version || item.professionalVersion || null,
                                                            casualText: item.casual_version || item.casualVersion || null,
                                                            date: item.date
                                                        });
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
                                                >
                                                    <FileDown className="w-4 h-4" />
                                                    Download PDF Report
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
