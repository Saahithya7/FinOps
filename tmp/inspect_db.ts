import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const sb = createClient(url, key);

async function inspectSchema() {
  const { data: auth, error: loginErr } = await sb.auth.signInWithPassword({
    email: 'admin@abcfinance.com',
    password: 'AdminPassword123!'
  });
  console.log('Admin login:', auth?.user?.id ? 'SUCCESS: ' + auth.user.id : 'FAILED: ' + loginErr?.message);

  const tables = [
    'profiles', 'organizations', 'memberships', 'customers',
    'transactions', 'risk_assessments', 'fraud_alerts', 'fraud_analysis',
    'manager_reviews', 'customer_risk_profiles', 'support_tickets',
    'admin_activity_logs', 'customer_verification_requests'
  ];

  for (const t of tables) {
    const { data, error } = await sb.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table [${t}]: ERROR -> ${error.message} (code: ${error.code})`);
    } else {
      console.log(`Table [${t}]: EXISTS, count sample: ${data?.length}, keys: ${data?.[0] ? Object.keys(data[0]).join(', ') : 'empty'}`);
    }
  }
}

inspectSchema().catch(console.error);
