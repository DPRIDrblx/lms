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

    const { jenjang, mapel, topik, subtopik, jumlahSoal, tipeSoal } = await req.json();

    if (!jenjang || !mapel || !topik || !jumlahSoal) {
      return NextResponse.json({ error: 'Data jenjang, mapel, topik, dan jumlah soal wajib diisi' }, { status: 400 });
    }

    const instructions = [
      tipeSoal?.includes('cek_konsep') ? "- Cek Konsep: Buat soal dengan tingkat kesulitan 'mudah' tipe 'mcq' (satu jawaban benar)." : "",
      tipeSoal?.includes('latihan_soal') ? "- Latihan Soal: Buat soal dengan tingkat kesulitan 'sedang' tipe 'mcq' (satu jawaban benar)." : "",
      tipeSoal?.includes('hots') ? "- HOTS: Buat soal dengan tingkat kesulitan 'sulit' tipe 'mcq' (satu jawaban benar)." : "",
      tipeSoal?.includes('complex_mcq') ? "- Pilihan Ganda Kompleks: Buat soal dengan tipe 'complex_mcq' (lebih dari satu jawaban benar) tingkat kesulitan bebas (mudah/sedang/sulit)." : ""
    ].filter(Boolean).join('\n');

    const prompt = `Anda adalah asisten pembuat kuis cerdas untuk aplikasi bimbingan belajar.
Tugas Anda adalah membuat paket soal berisi ${jumlahSoal} soal kuis berdasarkan kriteria berikut:
- Jenjang: ${jenjang}
- Mata Pelajaran: ${mapel}
- Topik: ${topik}
- Subtopik: ${subtopik || 'Umum / Keseluruhan Topik'}

Sertakan HANYA tipe soal dan tingkat kesulitan yang diminta berikut ini, dan bagi secara proporsional sesuai jumlah soal:
${instructions || "- Buat campuran soal pilihan ganda (mcq) mudah, sedang, sulit."}

KEMBALIKAN HANYA FORMAT JSON TANPA MARKDOWN ATAU TEKS TAMBAHAN.
STRUKTUR JSON YANG DIHARAPKAN:
{
  "title": "Judul Paket Soal (maks 3-4 kata)",
  "questions": [
    {
      "question": "Pertanyaan kuis...",
      "difficulty": "mudah" | "sedang" | "sulit",
      "type": "mcq" | "complex_mcq",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correctAnswer": ["Opsi Benar"], // Array berisi opsi benar. Jika type='mcq' isinya 1. Jika 'complex_mcq' isinya lebih dari 1 opsi benar yang persis dengan teks di array options.
      "explanation": "Penjelasan detail kenapa jawaban tersebut benar."
    }
  ]
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let packageData;
    try {
      // Remove any potential markdown code blocks if the AI misbehaves
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      packageData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json({ error: 'Gagal memproses format dari AI. Coba lagi.' }, { status: 500 });
    }

    return NextResponse.json(packageData);
  } catch (error: any) {
    console.error('AI Package Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghasilkan paket kuis dengan AI' },
      { status: 500 }
    );
  }
}
