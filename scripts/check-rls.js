const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // I will use anon key to test RLS
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: user } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // I don't know the teacher email
  });
  
  // Just try to update with anon key without auth to see if RLS blocks it
  const { data, error } = await supabase.from('quizzes').update({
    allow_practice_mode: true
  }).eq('id', '40760f06-713b-4035-98d4-f0ce5124930a');
  console.log("Update Error:", error);
}

check();
