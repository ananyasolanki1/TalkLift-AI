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
      model: "gemini-flash-lite-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    let prompt = "";
    if (mode === 'grammar') {
      prompt = `You are a Surgical English Grammar Coach. Your goal is 100% technical accuracy for Spoken English, catching both basic mistakes and subtle structural errors.
      
      CRITICAL INSTRUCTIONS:
      1. Correct: Spelling, Subject-Verb Agreement, Singular/Plural, Articles, Prepositions, Word Order, Tense Consistency, and Redundant Conjunctions.
      2. BE SURGICAL: Fix ONLY the specific erroneous word(s).
      3. GHOST RULE: NEVER include a mistake in the 'mistakes' array if the 'original' and 'correction' are identical or only differ by case. If there's no technical error, DO NOT add it to the list.
      4. DO NOT rewrite for style or to "tighten structure" if it's already grammatically correct.
      5. Word Order: If a word is slightly misplaced, correct only the placement.
      
      EXAMPLES:
      - Input: "As it is Republic Day, but I went to office"
        { "correctedText": "It was Republic Day, but I went to the office", "mistakes": [{ "original": "As it is", "correction": "It was", "explanation": "Redundant conjunction and tense" }, { "original": "to office", "correction": "to the office", "explanation": "Missing article" }] }
      - Input: "the extra pay out"
        { "correctedText": "the extra payout", "mistakes": [{ "original": "pay out", "correction": "payout", "explanation": "Incorrect noun form" }] }
      - Input: "We talked a lot, enjoyed."
        { "correctedText": "We talked a lot and enjoyed it.", "mistakes": [{ "original": "enjoyed.", "correction": "enjoyed it.", "explanation": "Incomplete verb structure" }] }
      - Input: "I had no managers today sitting in the back"
        { "correctedText": "I had no managers sitting in the back today", "mistakes": [{ "original": "today sitting in the back", "correction": "sitting in the back today", "explanation": "Word order" }] }
      - Input: "make that thing correct"
        { "correctedText": "correct it", "mistakes": [{ "original": "make that thing correct", "correction": "correct it", "explanation": "Awkward phrasing" }] }
      - Input: "the movie show at 10 am"
        { "correctedText": "the movie show at 10 am", "mistakes": [] }
      
      Return the response in this JSON structure:
      {
        "correctedText": "The text with pinpoint fixes applied",
        "mistakes": [
           { "original": "exact word/phrase with error", "correction": "fixed word/phrase", "explanation": "Brief reason" }
        ]
      }
      If no errors, return { "correctedText": "${text}", "mistakes": [] }.
      
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
