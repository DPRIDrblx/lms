const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
const envStr = fs.readFileSync(envPath, 'utf8');
const supabaseUrlMatch = envStr.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function run() {
  const { data, error } = await supabase.rpc('get_function_definition', { func_name: 'handle_new_user' });
  console.log(data, error);
}
run();
