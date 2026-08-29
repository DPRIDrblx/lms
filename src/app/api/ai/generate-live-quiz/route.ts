import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  try {
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

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: prompt,
      temperature: 0.7,
    });

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
      { error: 'Gagal menghasilkan kuis dengan AI' },
      { status: 500 }
    );
  }
}
