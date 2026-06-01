const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // We can execute SQL by calling an RPC if one exists, but usually we can't run raw DDL via REST API.
  // Wait, if there's no RPC for raw SQL, the JS client can't run ALTER TABLE directly.
  // Let's check if the column exists by selecting it.
  const { data, error } = await supabase.from('lessons').select('interactive_quiz_data').limit(1);
  if (error) {
    console.error("Error accessing interactive_quiz_data:", error.message);
  } else {
    console.log("Column exists. Data:", data);
  }
}

run();
