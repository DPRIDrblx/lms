import { NextResponse } from "next/server";
import { askVikey, getVikeyApiKey, VikeyMessage } from "@/lib/vikey";

export const maxDuration = 60; // Set max duration for AI Chat
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    if (!getVikeyApiKey()) {
      return NextResponse.json({ error: "VIKEY_API_KEY belum dikonfigurasi di .env.local" }, { status: 500 });
    }

    const body = await req.json();
    const { questionContext, context, messages = [], botPersonality } = body;

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

${botPersonality ? `INSTRUKSI KEPRIBADIAN KHUSUS:\n${botPersonality}` : ''}
`;

    const chatMessages: VikeyMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Append history and current user message
    messages.forEach((m: any) => {
      chatMessages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || ''
      });
    });

    const text = await askVikey({
      messages: chatMessages,
      temperature: 0.7
    });

    return NextResponse.json({ message: text });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
