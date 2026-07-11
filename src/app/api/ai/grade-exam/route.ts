import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 }
      );
    }

    const { quizTitle, questions, responses, studentName } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // Format the questions and answers for Gemini
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
1. Analisis Kinerja Keseluruhan: Berikan analisis singkat untuk siswa bernama ${studentName || 'Siswa'}. Sebutkan kekuatan dan kelemahannya berdasarkan jawabannya. Kalimatkan seperti laporan guru ke orang tua atau siswa secara langsung (misal: "Ananda sudah memahami materi A, namun kurang di bidang B dan perlu untuk mempelajari topik C").
2. ${hasEssay ? "Koreksi Soal Essay: Berikan nilai (0 sampai Poin Maksimal) dan *feedback* spesifik untuk setiap jawaban essay siswa." : ""}

Berikan jawaban HANYA dalam format JSON dengan struktur berikut (jangan tambahkan markdown \`\`\`json):
{
  "generalAnalysis": "Teks analisis kinerja...",
  "essayScores": {
    "question_id_disini": nilai_dalam_angka
  },
  "essayFeedback": {
    "question_id_disini": "Penjelasan mengapa nilai tersebut diberikan..."
  }
}
Pastikan ID soal yang ada di essayScores dan essayFeedback cocok dengan ID di atas. Jika tidak ada soal essay, biarkan objek essayScores dan essayFeedback kosong.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const response = await result.response;
    const text = response.text();
    
    // Parse JSON safely
    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json({ error: 'AI returned invalid JSON format' }, { status: 500 });
    }

    return NextResponse.json(parsedResult);

  } catch (error: any) {
    console.error('Error grading with Gemini:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
