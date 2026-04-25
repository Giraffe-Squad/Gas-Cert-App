/* ═══════════════════════════════════════════════════════════════
   INVOICE SERVICE — Supabase CRUD for Invoices
   
   Supabase table setup — run this SQL in your Supabase SQL editor:
   
   CREATE TABLE invoices (
     id BIGINT PRIMARY KEY,
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     data JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can manage own invoices"
     ON invoices FOR ALL
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);
   
   CREATE INDEX idx_invoices_user ON invoices(user_id);
   ═══════════════════════════════════════════════════════════════ */
import { supabase } from './supabase';

export async function fetchInvoices() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(row => row.data);
}

export async function upsertInvoice(invoice) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('invoices')
    .upsert({
      id: invoice.id,
      user_id: user.id,
      data: invoice,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) throw error;
}

export async function deleteInvoice(invoiceId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function migrateLocalInvoices() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  try {
    const raw = localStorage.getItem('cp12_invoices');
    if (!raw) return 0;
    const local = JSON.parse(raw);
    if (!Array.isArray(local) || local.length === 0) return 0;

    // Check if already migrated
    const migKey = `cp12_inv_migrated_${user.id}`;
    if (localStorage.getItem(migKey)) return 0;

    let count = 0;
    for (const inv of local) {
      try {
        await upsertInvoice(inv);
        count++;
      } catch (e) {
        console.error('Failed to migrate invoice:', inv.id, e);
      }
    }

    if (count > 0) localStorage.setItem(migKey, 'true');
    return count;
  } catch {
    return 0;
  }
}
