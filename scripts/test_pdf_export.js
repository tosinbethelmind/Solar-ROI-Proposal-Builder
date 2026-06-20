import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Replace with your Supabase project URL and anon key (from .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  try {
    // 1️⃣ Insert a test lead
    const { data: lead, error: insertErr } = await supabase
      .from('leads')
      .insert({ name: 'Automation Test Lead', phone: '0800123456', status: 'new' })
      .single();
    if (insertErr) throw insertErr;
    console.log('✅ Lead created with id:', lead.id);

    // 2️⃣ Request PDF export
    const pdfRes = await fetch(`https://solar-roi-proposal-builder.vercel.app/api/admin/leads/export-pdf?leadId=${lead.id}`);
    if (!pdfRes.ok) {
      const txt = await pdfRes.text();
      throw new Error(`PDF request failed: ${pdfRes.status} ${txt}`);
    }
    const buf = await pdfRes.arrayBuffer();
    console.log('✅ PDF generated – size bytes:', buf.byteLength);
    process.exit(0);
  } catch (e) {
    console.error('❌ Test failed', e);
    process.exit(1);
  }
})();
