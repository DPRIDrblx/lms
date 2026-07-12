import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const maxDuration = 60; // Set max duration for AI Chat

export async function POST(req: Request) {
  try {
    if (!genAI) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { questionContext, context, messages } = body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    let promptInfo = '';
    if (questionContext) {
      promptInfo = `Informasi Soal:
- Pertanyaan: ${questionContext.text || 'Tidak tersedia'}
- Jawaban Siswa: ${questionContext.studentAnswer || 'Kosong'}
- Kunci Jawaban: ${questionContext.correctAnswer || 'Tidak ada'}
- Pembahasan Asli: ${questionContext.explanation || 'Tidak ada pembahasan'}`;
    } else if (context) {
      promptInfo = `Informasi Konteks:
${context}`;
    }

    const systemPrompt = `Anda adalah seorang tutor cerdas, ramah, dan empatik yang membantu siswa memahami materi pelajaran mereka.
    
${promptInfo}

Tugas Anda:
1. Jawablah pertanyaan siswa dengan bahasa yang santai, memotivasi, dan mudah dipahami.
2. Jelaskan konsepnya, bukan sekadar memberikan jawaban. Jika siswa salah, jelaskan MENGAPA mereka salah dan pancing mereka untuk berpikir.
3. Jangan pernah merendahkan siswa. Gunakan emoji yang mendukung.
4. Jawablah secara ringkas (maksimal 2-3 paragraf pendek) agar siswa tidak malas membaca.
`;

    const historyMsgs = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const chatSession = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Ini adalah instruksi rahasia untukmu:\n" + systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "Baik, saya mengerti. Saya siap membantu siswa." }]
        },
        ...historyMsgs
      ],
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chatSession.sendMessage(lastMessage);
    const text = result.response.text();

    return NextResponse.json({ message: text });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
