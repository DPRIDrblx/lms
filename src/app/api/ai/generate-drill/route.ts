import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
export const maxDuration = 60; // Set max duration for AI Chat
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    if (!genAI) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { subject, topic, subtopics, questionCount = 5 } = body;

    if (!subject || !topic) {
      return NextResponse.json({ error: "Mata pelajaran dan topik wajib diisi" }, { status: 400 });
    }

    // Use a fast model suitable for structured JSON generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `Anda adalah seorang ahli pembuat soal ujian untuk siswa sekolah di Indonesia.
Tugas Anda adalah membuat soal pilihan ganda (4 opsi: A, B, C, D) berdasarkan parameter berikut:
- Mata Pelajaran: ${subject}
- Topik Utama: ${topic}
- Subtopik: ${subtopics && subtopics.length > 0 ? subtopics.join(', ') : 'Buat secara acak berdasarkan topik utama'}
- Jumlah Soal: ${questionCount}

Syarat Soal:
1. Soal harus menantang, mendidik, dan sesuai standar pendidikan Indonesia.
2. Setiap soal harus memiliki 4 pilihan (options).
3. Berikan jawaban yang benar (correctAnswer) berupa indeks array dari pilihan (0 untuk A, 1 untuk B, 2 untuk C, 3 untuk D).
4. Berikan pembahasan (explanation) yang jelas, mendidik, dan mudah dipahami siswa.
5. Cantumkan nama "subtopic" yang relevan untuk soal tersebut (berguna untuk evaluasi).

KEMBALIKAN HANYA ARRAY JSON TANPA MARKDOWN ATAU TEKS TAMBAHAN. 
Format yang diharapkan:
[
  {
    "question": "Pertanyaan...",
    "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    "correctAnswer": 0,
    "explanation": "Pembahasan rinci...",
    "subtopic": "Nama Subtopik"
  }
]
`;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    
    // Clean up potential markdown formatting from AI output
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let questions;
    try {
      questions = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse JSON from AI:", text);
      return NextResponse.json({ error: "Gagal memproses respons dari AI. Silakan coba lagi." }, { status: 500 });
    }

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("AI Drill Generate Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
