require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const items = [
    {
      name: 'Mascot Topi Toga',
      description: 'Topi kelulusan keren untuk maskotmu. Buktikan kamu yang paling rajin!',
      price: 200,
      type: 'mascot_hat',
      css_value: 'GraduationCap',
      icon: 'GraduationCap'
    },
    {
      name: 'Mascot Kacamata Hitam',
      description: 'Bikin maskotmu kelihatan misterius dan cool di Leaderboard.',
      price: 150,
      type: 'mascot_glasses',
      css_value: 'Glasses',
      icon: 'Glasses'
    }
  ];

  for (const item of items) {
    const { data: existing } = await supabase.from('shop_items').select('id').eq('name', item.name);
    if (existing && existing.length > 0) {
      console.log('Item exists:', item.name);
    } else {
      const { error } = await supabase.from('shop_items').insert(item);
      if (error) console.error('Error inserting', item.name, error);
      else console.log('Inserted', item.name);
    }
  }
}
run();
