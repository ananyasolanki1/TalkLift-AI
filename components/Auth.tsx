"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Loader2, Mail, Lock, Sparkles, User } from 'lucide-react';
import { clsx } from 'clsx';

export function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-auto p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl"
        >
            <div className="text-center mb-8 space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-slate-400">
                    {isSignUp ? 'Join us to save your progress' : 'Log in to sync your history'}
                </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
                {isSignUp && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required={isSignUp}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                {message && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "text-sm font-medium text-center p-3 rounded-xl",
                            message.includes('Check') ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}
                    >
                        {message}
                    </motion.p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                            {isSignUp ? 'Sign Up' : 'Log In'}
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0f172a] px-2 text-slate-500 font-bold tracking-widest">Or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-white/5"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#EA4335"
                            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M16.04 18.013c-1.09.303-2.26.477-3.467.477-2.877 0-5.373-1.652-6.594-4.056l-4.026 3.115A11.964 11.964 0 0 0 12 24c3.055 0 5.782-1.145 7.91-3l-3.87-2.987Z"
                        />
                        <path
                            fill="#4285F4"
                            d="M19.91 21c2.055-2.018 3.313-4.882 3.313-7.909 0-.527-.054-1.055-.136-1.582H12v4.582h6.736c-.227 1.145-.872 2.1-1.736 2.873l3.91 3.036Z"
                        />
                        <path
                            fill="#34A853"
                            d="M1.24 17.35l4.026-3.115A7.054 7.054 0 0 1 4.909 12c0-.773.136-1.527.357-2.235L1.24 6.65A11.962 11.962 0 0 0 0 12c0 1.927.455 3.736 1.24 5.35Z"
                        />
                    </svg>
                    Continue with Google
                </button>
            </div>

            <div className="mt-8 text-center pt-6 border-t border-slate-800">
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-slate-400 hover:text-purple-400 text-sm font-medium transition-colors"
                >
                    {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                </button>
            </div>
        </motion.div>
    );
}
