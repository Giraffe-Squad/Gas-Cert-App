import { supabase } from './supabase';

/* ═══════════════════════════════════════════════════════════════
   CERTIFICATE SERVICE — Supabase CRUD for CP12 certificates
   
   Table schema (certificates):
     id          TEXT PRIMARY KEY
     user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE
     data        JSONB NOT NULL
     status      TEXT DEFAULT 'draft'
     created_at  TIMESTAMPTZ DEFAULT NOW()
     updated_at  TIMESTAMPTZ DEFAULT NOW()
   ═══════════════════════════════════════════════════════════════ */

/**
 * Fetch all certificates for the current user.
 */
export async function fetchCertificates() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[CertService] fetchCertificates error:', error);
    throw error;
  }

  return (data || []).map(row => ({
    ...row.data,
    id: row.id,
    status: row.status,
  }));
}

/**
 * Upsert (insert or update) a single certificate.
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

  if (error) {
    console.error('[CertService] upsertCertificate error:', error);
    throw error;
  }
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
    .eq('user_id', user.id);

  if (error) {
    console.error('[CertService] deleteCertificate error:', error);
    throw error;
  }
}

/**
 * Migrate any certificates sitting in localStorage to Supabase.
 * Called once after the first successful fetch proves the table works.
 * Returns the number of certs migrated.
 */
export async function migrateLocalCertificates() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

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

  const { data: existing, error: fetchErr } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', user.id);

  if (fetchErr) {
    console.error('[CertService] migration fetch error:', fetchErr);
    throw fetchErr;
  }

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

    if (error) {
      console.error('[CertService] migration insert error:', error);
      throw error;
    }
  }

  localStorage.setItem(migrationKey, 'true');
  localStorage.removeItem('cp12_certs');

  return toInsert.length;
}

/**
 * Reset the migration flag so it re-runs next login.
 */
export function resetMigrationFlag() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('cp12_migrated_')) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
}
