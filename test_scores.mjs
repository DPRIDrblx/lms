import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vemtrftyatnwizycpyow.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbXRyZnR5YXRud2l6eWNweW93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA3NTQzMywiZXhwIjoyMDkzNjUxNDMzfQ.ZXd8W4iz82IOGrnP2c6TjEZw57XptCnj-pGMpmNuEgU'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  const quizId = '09bbe1d7-d61f-4ab6-b3fa-c6af6736abed'
  
  console.log("Checking quiz responses...")
  const { data: responses, error: err1 } = await supabase.from('quiz_responses').select('*').eq('quiz_id', quizId)
  console.log("Responses count:", responses?.length, err1)
  
  if (responses && responses.length > 0) {
    const studentId = responses[0].student_id
    console.log("Found student:", studentId)
    
    console.log("Checking exam sessions...")
    const { data: sessions, error: err2 } = await supabase.from('exam_sessions').select('*').eq('quiz_id', quizId).eq('student_id', studentId)
    console.log("Sessions:", sessions, err2)
    
    console.log("Checking student_scores...")
    const { data: scores, error: err3 } = await supabase.from('student_scores').select('*').eq('target_id', quizId).eq('student_id', studentId)
    console.log("Scores:", scores, err3)
    
    // Simulate insertion
    console.log("Simulating insert to student_scores...")
    const { error: insertErr } = await supabase.from('student_scores').insert({
      student_id: studentId,
      target_id: quizId,
      target_type: "quiz",
      score: 100, // Maybe NaN was the issue? Let's test with 100 first
      is_graded: false,
      submission_url: JSON.stringify({ test: "test" }),
      graded_at: null
    })
    console.log("Insert result (score 100):", insertErr)
    
    const { error: insertErr2 } = await supabase.from('student_scores').insert({
      student_id: studentId,
      target_id: quizId,
      target_type: "quiz",
      score: NaN,
      is_graded: false,
      submission_url: JSON.stringify({ test: "test" }),
      graded_at: null
    })
    console.log("Insert result (score NaN):", insertErr2)
  }
}

main()
