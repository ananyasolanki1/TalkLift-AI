import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function GET() {
    try {
        // This is not directly exposed in the high level SDK nicely for listing,
        // but we can try a direct fetch or just try a standard 'gemini-pro' to see if anything works.
        // Actually, let's just try to fallback to 'gemini-pro' which is usually available 
        // to see if the KEY is even valid for that.

        // But better: Use the model list endpoint manually if SDK doesn't support it easily?
        // The error message said: "Call ListModels to see the list..."
        // SDK doesn't expose listModels in the main class easily in v0.1.
        // Let's try to fetch it via REST.

        const key = process.env.GOOGLE_API_KEY;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
