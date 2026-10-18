import { NextResponse } from "next/server";
import { askVikey, parseAiJsonResponse, getVikeyApiKey } from "@/lib/vikey";

export const maxDuration = 60; // Set max duration for AI Chat

export async function POST(req: Request) {
  try {
    if (!getVikeyApiKey()) {
      return NextResponse.json({ error: "VIKEY_API_KEY belum dikonfigurasi di .env.local" }, { status: 500 });
    }

    const body = await req.json();
    const { jenjang = "Sekolah", subject, topic, subtopics, questionCount = 5 } = body;

    if (!subject || !topic) {
      return NextResponse.json({ error: "Mata pelajaran dan topik wajib diisi" }, { status: 400 });
    }

    const systemPrompt = `Anda adalah seorang ahli pembuat soal ujian untuk siswa sekolah di Indonesia.
Tugas Anda adalah membuat soal pilihan ganda (4 opsi: A, B, C, D) berdasarkan parameter berikut:
- Jenjang Pendidikan: ${jenjang}
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
6. Jika suatu soal membutuhkan ilustrasi/gambar matematika/sains (misal segitiga siku-siku, grafik fungsi, kubus, atau diagram), sertakan elemen SVG bersih (misal <svg viewBox="0 0 260 160" ...>...</svg>) langsung di dalam string "question".

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
]`;

    const text = await askVikey({
      messages: [
        { role: "system", content: "Anda adalah pembuat soal ujian pilihan ganda presisi berformat JSON." },
        { role: "user", content: systemPrompt }
      ],
      temperature: 0.6
    });

    let questions;
    try {
      questions = parseAiJsonResponse(text);
      if (!Array.isArray(questions) && questions.questions) {
        questions = questions.questions;
      }
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
