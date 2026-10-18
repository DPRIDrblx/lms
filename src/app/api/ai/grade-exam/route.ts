import { NextRequest, NextResponse } from 'next/server';
import { askVikey, parseAiJsonResponse, getVikeyApiKey } from '@/lib/vikey';

export const maxDuration = 60; // Set max duration for AI Chat
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    if (!getVikeyApiKey()) {
      return NextResponse.json(
        { error: 'VIKEY_API_KEY belum dikonfigurasi di .env.local' },
        { status: 500 }
      );
    }

    const { quizTitle, questions, responses, studentName } = await req.json();

    // Format the questions and answers for AI
    let promptText = `Anda adalah asisten AI guru yang ahli. Anda bertugas mengoreksi jawaban essay dan memberikan analisis hasil belajar siswa.
Nama Siswa: ${studentName || 'Siswa'}
Nama Ujian: ${quizTitle}

Berikut adalah data soal dan jawaban siswa:
`;

    let hasEssay = false;
    let essayIds: string[] = [];

    questions.forEach((q: any, index: number) => {
      promptText += `\nSoal ${index + 1} (ID: ${q.id}) - Tipe: ${q.question_type}\n`;
      promptText += `Pertanyaan: ${q.question_text.replace(/<[^>]+>/g, '')}\n`;
      promptText += `Poin Maksimal: ${q.points}\n`;

      if (q.question_type === 'mcq' || q.question_type === 'complex_mcq') {
        const correctOpts = q.options?.filter((o: any) => o.is_correct).map((o: any) => o.text).join(', ');
        promptText += `Kunci Jawaban: ${correctOpts}\n`;
      } else if (q.question_type === 'matching') {
        const pairs = q.options?.map((o: any) => `${o.text} -> ${o.match_pair}`).join(', ');
        promptText += `Kunci Pasangan: ${pairs}\n`;
      } else if (q.question_type === 'essay') {
        hasEssay = true;
        essayIds.push(q.id);
        if (q.criteria?.minLength) promptText += `Minimal Karakter: ${q.criteria.minLength}\n`;
        if (q.criteria?.maxLength) promptText += `Maksimal Karakter: ${q.criteria.maxLength}\n`;
      }

      const ans = responses[q.id];
      let studentAnsText = "TIDAK DIJAWAB";
      if (ans) {
        if (typeof ans === 'string') studentAnsText = ans;
        else if (Array.isArray(ans)) studentAnsText = ans.join(', ');
        else if (typeof ans === 'object') studentAnsText = JSON.stringify(ans);
      }
      
      promptText += `Jawaban Siswa: ${studentAnsText}\n`;
      promptText += `-----------------------------------\n`;
    });

    promptText += `
Tugas Anda:
1. Analisis Kinerja Keseluruhan: Berikan analisis SANGAT SINGKAT (Maksimal 2 kalimat) untuk siswa. Anda WAJIB menyertakan struktur berikut di dalam teks Anda:
   - "🌟 Topik yang Sudah Dikuasai:" (Sebutkan 1 topik utama saja)
   - "📚 Materi yang Perlu Dipelajari Lagi:" (Sebutkan 1 kelemahan utama saja)
2. ${hasEssay ? "Koreksi Soal Essay: Berikan nilai (0 sampai Poin Maksimal) dan *feedback* 1 kalimat pendek untuk setiap essay." : ""}
3. Saran Belajar: Berikan HANYA 1 pertanyaan saran yang bisa ditanyakan ke AI. Hasilkan dalam format array of string (1 elemen).

Berikan jawaban HANYA dalam format JSON dengan struktur berikut (jangan tambahkan markdown \`\`\`json):
{
  "generalAnalysis": "Teks analisis kinerja...",
  "aiSuggestions": [
    "Berikan saya 1 contoh soal tentang Y beserta pembahasannya"
  ],
  "essayScores": {
    "question_id_disini": 10
  },
  "essayFeedback": {
    "question_id_disini": "Penjelasan mengapa nilai tersebut diberikan..."
  }
}
Pastikan ID soal yang ada di essayScores dan essayFeedback cocok dengan ID di atas. Jika tidak ada soal essay, biarkan objek essayScores dan essayFeedback kosong.`;

    const text = await askVikey({
      messages: [
        { role: 'system', content: 'Anda adalah asisten AI penilai ujian yang objektif dan mengembalikan format JSON valid.' },
        { role: 'user', content: promptText }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    // Parse JSON safely
    let parsedResult;
    try {
      parsedResult = parseAiJsonResponse(text);
    } catch (e) {
      console.error("Failed to parse Vikey response:", text);
      return NextResponse.json({ error: 'AI returned invalid JSON format' }, { status: 500 });
    }

    return NextResponse.json(parsedResult);

  } catch (error: any) {
    console.error('Error grading with AI:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
