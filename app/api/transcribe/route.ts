import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json({ error: 'Missing GOOGLE_API_KEY on server' }, { status: 500 });
        }

        // Convert File to Base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Audio = buffer.toString('base64');

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: file.type || "audio/mp3",
                    data: base64Audio
                }
            },
            { text: "Transcribe this audio precisely into English text. Do not add any introductory or concluding remarks, just the transcription." }
        ]);

        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ text: text });
    } catch (error: any) {
        console.error('Transcription Error:', error);
        return NextResponse.json({ error: error.message || 'Error processing audio' }, { status: 500 });
    }
}
