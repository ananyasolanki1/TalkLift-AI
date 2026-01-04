"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from "clsx";
import ReactMarkdown from 'react-markdown';


interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    contextText: string;
}

export function ChatInterface({ contextText }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput("");
        setLoading(true);

        try {
            // Prepare history for API (all messages including the new one)
            const apiMessages = [...messages, newMsg];

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    context: contextText
                }),
            });
            const data = await res.json();

            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 overflow-hidden flex flex-col h-[500px]">

            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-slate-200">Chat about this text</h3>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-slate-500 mt-10">
                        <p>Ask a question about your speech or practice a conversation!</p>
                    </div>
                )}

                {messages.map((m, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "flex gap-3 max-w-[85%]",
                            m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            m.role === 'user' ? "bg-purple-600" : "bg-slate-600"
                        )}>
                            {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                        </div>
                        <div className={clsx(
                            "p-3 rounded-2xl text-sm leading-relaxed",
                            m.role === 'user' ? "bg-purple-500/20 text-purple-100 border border-purple-500/20 rounded-tr-sm" : "bg-slate-700/50 text-slate-200 border border-slate-600 rounded-tl-sm"
                        )}>
                            <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex gap-3 mr-auto max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-700/50 border border-slate-600 rounded-tl-sm flex items-center">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        disabled={loading}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="absolute right-2 p-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>

        </div>
    );
}
