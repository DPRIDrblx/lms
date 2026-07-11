require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });

const promptText = `Anda adalah AI Assistant yang membantu mengoreksi ujian.
Ujian: Test Quiz
Nama Siswa: Test Student

Soal 1: (Pilihan Ganda) What is 1+1? 10 poin.
Jawaban Siswa: 2

Tugas Anda:
1. Analisis Kinerja Keseluruhan: Berikan analisis singkat untuk siswa. Anda WAJIB menyertakan struktur berikut di dalam teks Anda:
   - "🌟 Topik yang Sudah Dikuasai:" (sebutkan materi/topik yang dijawab dengan baik)
   - "📚 Materi yang Perlu Dipelajari Lagi:" (sebutkan kelemahan jika ada, atau "Semua sudah baik" jika sempurna)
2. 
3. Saran Belajar: Berikan saran 1-2 pertanyaan yang bisa siswa tanyakan ke tutor AI (Mascot) untuk mendalami materi yang mereka kurang. Hasilkan dalam format array of string.

Berikan jawaban HANYA dalam format JSON dengan struktur berikut (jangan tambahkan markdown \`\`\`json):
{
  "generalAnalysis": "Teks analisis kinerja...",
  "aiSuggestions": [
    "Jelaskan lebih lanjut tentang konsep X dengan perumpamaan sederhana",
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

model.generateContent({
  contents: [{ role: 'user', parts: [{ text: promptText }] }],
  generationConfig: { responseMimeType: 'application/json' }
}).then(r => console.log(r.response.text())).catch(console.error);
