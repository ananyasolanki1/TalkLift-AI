import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(request: Request) {
    try {
        const { text, mode } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json({ error: 'Missing GOOGLE_API_KEY on server' }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = "";
        if (mode === 'grammar') {
            prompt = `You are an expert English teacher focused ONLY on grammar. 
      Analyze the following text strictly for CLEAR GRAMMATICAL errors (spelling, punctuation, tense, subject-verb agreement).
      If the sentence is grammatically correct but "simple", DO NOT change it.
      
      Return the response in this JSON structure:
      {
        "correctedText": "The text with ONLY essential grammatical corrections applied",
        "mistakes": [
           { "original": "exact original snippet with error", "correction": "corrected snippet", "explanation": "Brief reason" }
        ]
      }
      If there are no mistakes, "mistakes" should be an empty array.
      
      Text to analyze: "${text}"`;
        } else if (mode === 'improve') {
            prompt = `You are a communications coach.
      Rewrite the following text to be "Professional but Natural" (Business Casual).
      It should sound articulate and confident, but NOT robotic, overly formal, or using obscure words.
      
      CRITICAL INSTRUCTIONS:
      1. "improvedText": The improved business-casual version.
      2. "tips": Provide exactly 3 short tips. 
         - **MUST cite specific examples** from the text.
         - Format: "Changed 'x' to 'y' to [benefit]".
         - MAX 12 words per tip.

      Return the response in this JSON structure:
      {
        "improvedText": "The improved version",
        "tips": ["Specific change 1", "Specific change 2", "Specific change 3"]
      }
      
      Text to improve: "${text}"`;
        } else if (mode === 'casual') {
            prompt = `You are a friendly conversation partner.
      Rewrite the following text to be "Natural, Clear, and Friendly".
      It should sound like easy, everyday conversational English.
      Avoid overly slangy or teenage-style casualness. Focus on simplicity and friendliness.
      
      CRITICAL INSTRUCTIONS:
      1. "improvedText": The natural and easy version.
      2. "tips": Provide exactly 3 short tips.
         - Format: "Made it clearer by [action]".
         - MAX 12 words per tip.

      Return the response in this JSON structure:
      {
        "improvedText": "The improved version",
        "tips": ["Tip 1", "Tip 2", "Tip 3"]
      }
      
      Text to rewrite: "${text}"`;
        } else {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResult = response.text();

        try {
            const cleanText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
            const json = JSON.parse(cleanText);
            return NextResponse.json(json);
        } catch (e) {
            return NextResponse.json({ error: "Failed to parse JSON explanation from AI" }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Analysis Error:', error);
        return NextResponse.json({ error: error.message || 'Error processing text' }, { status: 500 });
    }
}
