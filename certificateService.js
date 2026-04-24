import { supabase } from './supabase';

/* ═══════════════════════════════════════════════════════════════
   CERTIFICATE SERVICE — Supabase CRUD for CP12 certificates
   
   Table schema (certificates):
     id          TEXT PRIMARY KEY
     user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE
     data        JSONB NOT NULL          -- full certificate object
     status      TEXT DEFAULT 'draft'
     created_at  TIMESTAMPTZ DEFAULT NOW()
     updated_at  TIMESTAMPTZ DEFAULT NOW()
   
   RLS: users can only access their own rows.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Fetch all certificates for the current user.
 * Returns an array of certificate objects (the `data` JSONB column,
 * with `id` and `status` kept in sync from the row-level columns).
 */
export async function fetchCertificates() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Unwrap: each row's `data` JSONB is the certificate object
  return (data || []).map(row => ({
    ...row.data,
    id: row.id,               // ensure id consistency
    status: row.status,        // ensure status consistency
  }));
}

/**
 * Upsert (insert or update) a single certificate.
 * Accepts the full certificate object from app state.
 */
export async function upsertCertificate(cert) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const row = {
    id: String(cert.id),
    user_id: user.id,
    data: cert,
    status: cert.status || 'draft',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('certificates')
    .upsert(row, { onConflict: 'id' });

  if (error) throw error;
}

/**
 * Delete a single certificate by id.
 */
export async function deleteCertificate(certId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', String(certId))
    .eq('user_id', user.id);     // extra safety

  if (error) throw error;
}

/**
 * Migrate any certificates sitting in localStorage to Supabase.
 * Called once after the first successful auth.  Skips certs
 * that already exist in Supabase (by id).
 * Returns the number of certs migrated.
 */
export async function migrateLocalCertificates() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  // Check if migration already done for this user
  const migrationKey = `cp12_migrated_${user.id}`;
  if (localStorage.getItem(migrationKey) === 'true') return 0;

  let localCerts = [];
  try {
    const raw = localStorage.getItem('cp12_certs');
    localCerts = raw ? JSON.parse(raw) : [];
  } catch {
    return 0;
  }

  if (!localCerts.length) {
    localStorage.setItem(migrationKey, 'true');
    return 0;
  }

  // Fetch existing IDs in Supabase so we don't duplicate
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', user.id);

  const existingIds = new Set((existing || []).map(r => String(r.id)));

  const toInsert = localCerts
    .filter(c => !existingIds.has(String(c.id)))
    .map(c => ({
      id: String(c.id),
      user_id: user.id,
      data: c,
      status: c.status || 'draft',
      created_at: c.createdAt || new Date().toISOString(),
      updated_at: c.updatedAt || new Date().toISOString(),
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from('certificates')
      .insert(toInsert);

    if (error) throw error;
  }

  // Mark migration done — don't re-import on future logins
  localStorage.setItem(migrationKey, 'true');

  // Clean up localStorage certificates (keep other cp12_ keys intact)
  localStorage.removeItem('cp12_certs');

  return toInsert.length;
}
