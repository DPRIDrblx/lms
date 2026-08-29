import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!genAI) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const { jenjang, mapel, topik, subtopik, tipeKuis } = await req.json();

    if (!jenjang || !mapel || !topik || !tipeKuis) {
      return NextResponse.json({ error: 'Data jenjang, mapel, topik, dan tipe kuis wajib diisi' }, { status: 400 });
    }

    const prompt = `Anda adalah asisten pembuat kuis cerdas untuk aplikasi bimbingan belajar.
Tugas Anda adalah membuat 1 buah soal kuis interaktif yang sangat menarik dan mendidik berdasarkan kriteria berikut:
- Jenjang: ${jenjang}
- Mata Pelajaran: ${mapel}
- Topik: ${topik}
- Subtopik: ${subtopik || 'Umum / Keseluruhan Topik'}
- Tipe Kuis: ${tipeKuis} (Fokuskan format soal pada tipe ini)

KEMBALIKAN HANYA FORMAT JSON TANPA MARKDOWN ATAU TEKS TAMBAHAN.
STRUKTUR JSON YANG DIHARAPKAN:
{
  "question": "Pertanyaan kuis...",
  "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
  "correctAnswer": ["Opsi Benar"], // Array berisi jawaban benar. Jika pilihan ganda biasa isinya 1. Jika pilihan ganda kompleks bisa lebih dari 1 opsi benar.
  "explanation": "Penjelasan detail kenapa jawaban tersebut benar."
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let quizData;
    try {
      // Remove any potential markdown code blocks if the AI misbehaves
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      quizData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json({ error: 'Gagal memproses format dari AI. Coba lagi.' }, { status: 500 });
    }

    return NextResponse.json(quizData);
  } catch (error: any) {
    console.error('AI Quiz Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghasilkan kuis dengan AI' },
      { status: 500 }
    );
  }
}
