import { NextResponse } from 'next/server';
import { askVikey, parseAiJsonResponse, getVikeyApiKey } from '@/lib/vikey';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!getVikeyApiKey()) {
      return NextResponse.json({ error: "VIKEY_API_KEY belum dikonfigurasi di .env.local" }, { status: 500 });
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

FITUR DIAGRAM/GAMBAR:
Jika suatu soal membutuhkan gambar/diagram visual (misalnya soal geometri, segitiga, grafik fungsi, balok, rangkaian listrik, atau bagan sains), sertakan elemen SVG bersih dan responsif langsung di dalam teks "question" (misal: <svg viewBox="0 0 300 180" class="mx-auto my-3" xmlns="http://www.w3.org/2000/svg">...</svg>). Pastikan ukuran dan teks pada SVG terlihat jelas.

KEMBALIKAN HANYA FORMAT JSON TANPA MARKDOWN ATAU TEKS TAMBAHAN.
STRUKTUR JSON YANG DIHARAPKAN:
{
  "title": "Judul Paket Soal (maks 3-4 kata)",
  "questions": [
    {
      "question": "Pertanyaan kuis (bisa menyertakan rumus KaTeX $...$ atau tag <svg>...</svg> jika butuh gambar)...",
      "difficulty": "mudah" | "sedang" | "sulit",
      "type": "mcq" | "complex_mcq",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correctAnswer": ["Opsi Benar"], // Array berisi opsi benar. Jika type='mcq' isinya 1. Jika 'complex_mcq' isinya lebih dari 1 opsi benar yang persis dengan teks di array options.
      "explanation": "Penjelasan detail kenapa jawaban tersebut benar."
    }
  ]
}`;

    const text = await askVikey({
      messages: [
        { role: 'system', content: 'Anda adalah asisten kurikulum akademik pembuat soal berformat JSON valid.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' }
    });

    let packageData;
    try {
      packageData = parseAiJsonResponse(text);
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
