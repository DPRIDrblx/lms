const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function patch() {
  const { data: schedules } = await supabase.from('center_schedules').select('*').is('attendance_code', null);
  
  if (!schedules || schedules.length === 0) {
    console.log("No old schedules found to patch.");
    return;
  }

  for (const s of schedules) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    await supabase.from('center_schedules').update({ attendance_code: code }).eq('id', s.id);
    console.log(`Patched schedule ${s.title} with code ${code}`);
  }
}

patch();
