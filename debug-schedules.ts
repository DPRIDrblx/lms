import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Fetching center_schedules...");
  const { data, error } = await supabase
    .from("center_schedules")
    .select(`
      *,
      classes (name),
      profiles (full_name)
    `)
    .limit(5);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success. Rows:", data?.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
