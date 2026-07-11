const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

  // Get the specific score
  const { data: score } = await supabase.from('student_scores').select('*').eq('id', 'd963d1b1-6c36-4c74-95a7-895c61300e04').single();
  if (!score) return console.log('Score not found');

  // Get questions
  const { data: questions } = await supabase.from('questions').select('*').eq('quiz_id', score.target_id);
  
  let promptText = `Anda adalah asisten AI guru yang ahli. Anda bertugas mengoreksi jawaban essay dan memberikan analisis hasil belajar siswa.
Nama Siswa: Siswa
Nama Ujian: Ujian Kesiapan Chapter 2

Berikut adalah data soal dan jawaban siswa:
`;
  
  let hasEssay = false;
  let essayIds = [];

  questions.forEach((q, index) => {
    promptText += `\nSoal ${index + 1} (ID: ${q.id}) - Tipe: ${q.question_type}\n`;
    promptText += `Pertanyaan: ${q.question_text.replace(/<[^>]+>/g, '')}\n`;
    promptText += `Poin Maksimal: ${q.points}\n`;

    if (q.question_type === 'mcq' || q.question_type === 'complex_mcq') {
      const correctOpts = q.options?.filter(o => o.is_correct).map(o => o.text).join(', ');
      promptText += `Kunci Jawaban: ${correctOpts}\n`;
    } else if (q.question_type === 'matching') {
      const pairs = q.options?.map(o => `${o.text} -> ${o.match_pair}`).join(', ');
      promptText += `Kunci Pasangan: ${pairs}\n`;
    } else if (q.question_type === 'essay') {
      hasEssay = true;
      essayIds.push(q.id);
    }

    const ansData = score.metadata.responses[q.id];
    let studentAnsText = 'TIDAK DIJAWAB';
    if (ansData) {
      if (typeof ansData === 'string') studentAnsText = ansData;
      else if (Array.isArray(ansData)) studentAnsText = ansData.join(', ');
      else if (typeof ansData === 'object' && ansData.answer) studentAnsText = ansData.answer;
      else if (typeof ansData === 'object') studentAnsText = JSON.stringify(ansData);
    }
    
    promptText += `Jawaban Siswa: ${studentAnsText}\n`;
    promptText += `-----------------------------------\n`;
  });

  promptText += `
Tugas Anda:
1. Analisis Kinerja Keseluruhan: Berikan analisis singkat untuk siswa. Anda WAJIB menyertakan struktur berikut di dalam teks Anda:
   - "🌟 Topik yang Sudah Dikuasai:" (sebutkan materi/topik yang dijawab dengan baik)
   - "📚 Materi yang Perlu Dipelajari Lagi:" (sebutkan kelemahan jika ada, atau "Semua sudah baik" jika sempurna)
2. Koreksi Soal Essay: Berikan nilai (0 sampai Poin Maksimal) dan *feedback* spesifik untuk setiap jawaban essay siswa.

Berikan jawaban HANYA dalam format JSON (tanpa markdown blok):
{
  "generalAnalysis": "Teks analisis kinerja...",
  "essayScores": {
    "question_id_disini": nilai_dalam_angka
  },
  "essayFeedback": {
    "question_id_disini": "Penjelasan mengapa nilai tersebut diberikan..."
  }
}`;

  console.log('Requesting Gemini...');
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const aiData = JSON.parse(result.response.text());
  console.log('AI output:', aiData);

  // Update score
  let totalScore = score.score;
  let newResponses = { ...score.metadata.responses };

  Object.keys(aiData.essayScores || {}).forEach(qId => {
    totalScore += Number(aiData.essayScores[qId]) || 0;
    if (typeof newResponses[qId] === 'string') {
      newResponses[qId] = { answer: newResponses[qId], ai_feedback: aiData.essayFeedback?.[qId], ai_score: aiData.essayScores[qId] };
    } else if (newResponses[qId]) {
      newResponses[qId].ai_feedback = aiData.essayFeedback?.[qId];
      newResponses[qId].ai_score = aiData.essayScores[qId];
    }
  });

  const newMetadata = {
    ...score.metadata,
    responses: newResponses,
    ai_analysis: aiData.generalAnalysis
  };

  await supabase.from('student_scores').update({
    score: totalScore,
    metadata: newMetadata,
    is_graded: true
  }).eq('id', score.id);
  
  console.log('Successfully updated score to', totalScore);
}
run();
