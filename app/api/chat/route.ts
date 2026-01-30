import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(request: Request) {
    try {
        const { messages, context } = await request.json();

        if (!messages || !context) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

        // Construct the chat history with system context
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{
                        text: `You are a concise, direct, and structured AI English coach. 
          The user spoke the following text: "${context}". 
          
          Rules for your responses:
          1. Be extremely concise and to the point.
          2. Use bullet points or numbered lists if explaining multiple things.
          3. Avoid long introductions or conclusions.
          4. Focus on helping the user improve their communication.` }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I will help the user discuss their spoken text." }],
                },
                ...messages.slice(0, -1).map((m: any) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }))
            ],
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error('Chat Error Details:', error);
        return NextResponse.json({ error: error.message || 'Error processing chat' }, { status: 500 });
    }
}
