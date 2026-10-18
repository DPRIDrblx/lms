import { NextResponse } from "next/server";
import { askVikey, parseAiJsonResponse, getVikeyApiKey } from "@/lib/vikey";

export const maxDuration = 60; // Set max duration for AI Chat
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    if (!getVikeyApiKey()) {
      return NextResponse.json({ error: "VIKEY_API_KEY belum dikonfigurasi di .env.local" }, { status: 500 });
    }

    const { jenjang, mapel, topik, subtopik, materiLainnya, tujuanPembelajaran, metodePembelajaran } = await req.json();

    if (!jenjang || !mapel) {
      return NextResponse.json({ error: "Jenjang dan Mapel harus diisi" }, { status: 400 });
    }

    const subtopicsStr = Array.isArray(subtopik) ? subtopik.join(", ") : subtopik;
    const topicStr = topik === "Lainnya" ? materiLainnya : `${topik} - ${subtopicsStr}`;

    const prompt = `Anda adalah asisten kurikulum akademik jenius yang bertugas membuat Rencana Pembelajaran untuk Bimbingan Belajar.

Tolong buatkan materi untuk:
- Jenjang: ${jenjang}
- Mata Pelajaran: ${mapel}
- Topik / Subtopik: ${topicStr}
- Tujuan Pembelajaran: ${tujuanPembelajaran || 'Bebas sesuai standar kurikulum'}
- Metode Pembelajaran: ${metodePembelajaran || 'Diskusi & Latihan Soal'}

Tolong berikan balasan MURNI dalam format JSON (tanpa tag markdown \`\`\`json) dengan struktur persis seperti ini:
{
  "aktivitas": "Penjelasan detail mengenai rencana aktivitas kelas dari awal (pembukaan, pemanasan), inti (penjelasan konsep, latihan soal), sampai penutup (kesimpulan, kuis singkat). Buat cukup panjang dan praktikal.",
  "dialog": "Skrip dialog interaktif antara Tutor dan Siswa untuk memancing pemahaman (Socratic method). Sertakan 3-4 interaksi bolak-balik.",
  "papan_tulis": "Poin-poin penting, rumus, atau ringkasan materi yang harus ditulis tutor di papan tulis atau ditampilkan di slide presentasi (PPT)."
}

Pastikan isinya sangat berkualitas, sesuai dengan kurikulum nasional Indonesia untuk jenjang tersebut, dan bahasanya profesional namun mudah dipahami siswa.`;

    const text = await askVikey({
      messages: [
        { role: 'system', content: 'Anda adalah asisten kurikulum akademik yang menghasilkan rencana pembelajaran terstruktur dalam JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' }
    });
    
    try {
      const parsedData = parseAiJsonResponse(text);
      return NextResponse.json(parsedData);
    } catch (e) {
      console.error("Failed to parse AI response JSON:", text);
      return NextResponse.json({ error: "AI menghasilkan respons yang tidak valid." }, { status: 500 });
    }

  } catch (err: any) {
    console.error("Lesson Plan AI Error:", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
