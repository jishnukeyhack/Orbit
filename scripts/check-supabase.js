const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rcftkczrjfucbfowtjso.supabase.co';
const supabaseAnonKey = 'sb_publishable_fpWQs9p2klAmS4SlAkQzLw_BTnfvA9c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Testing Supabase Connection...');
  // Let's try to query a common table or look at metadata
  const { data: users, error: err } = await supabase.from('users').select('*').limit(1);
  console.log('Query result:', { users, err });
  
  // Let's check other tables
  const { data: messages, error: err2 } = await supabase.from('orbit_chat_messages').select('*').limit(1);
  console.log('orbit_chat_messages check:', { messages, err2 });

  const { data: goals, error: err3 } = await supabase.from('orbit_goals').select('*').limit(1);
  console.log('orbit_goals check:', { goals, err3 });
}

main().catch(console.error);
