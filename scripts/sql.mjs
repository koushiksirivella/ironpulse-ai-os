#!/usr/bin/env node
// Run a .sql file (or an inline query) against the linked Supabase project
// through the Management API. Credentials come from .env.supabase.local,
// which is gitignored and never printed.
//
//   node scripts/sql.mjs supabase/schema.sql
//   node scripts/sql.mjs --query "select count(*) from products;"

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function loadEnv() {
  const raw = readFileSync(join(ROOT, '.env.supabase.local'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  if (!env.SUPABASE_ACCESS_TOKEN) throw new Error('SUPABASE_ACCESS_TOKEN missing');
  if (!env.SUPABASE_PROJECT_REF) throw new Error('SUPABASE_PROJECT_REF missing');
  return env;
}

export async function runSql(query) {
  const env = loadEnv();

  // Preferred transport: a direct Postgres session through the pooler, using
  // the database password. It runs real DDL and needs no personal access
  // token — which matters, because a PAT can be revoked (leak, expiry) and
  // then every schema change is blocked behind the dashboard.
  //
  // The Management API stays as a fallback for the case where the pooler is
  // unreachable but api.supabase.com is not.
  if (env.SUPABASE_DB_PASSWORD) {
    try {
      return await runViaPostgres(query, env);
    } catch (err) {
      if (!env.SUPABASE_ACCESS_TOKEN) throw err;
      console.error(`direct connection failed (${err.message.slice(0, 80)}), trying Management API`);
    }
  }

  if (!env.SUPABASE_ACCESS_TOKEN) throw new Error('SUPABASE_ACCESS_TOKEN missing');

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${env.SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok || body?.message) {
    throw new Error(`SQL failed (${res.status}): ${body.message ?? text.slice(0, 300)}`);
  }
  return body;
}

/**
 * Run SQL over a direct Postgres session.
 *
 * Region is read from the project's own settings rather than assumed — a
 * project moved between regions would otherwise fail with a DNS error that
 * looks nothing like the actual cause.
 */
async function runViaPostgres(query, env) {
  const { default: pg } = await import('pg');
  const host = env.SUPABASE_DB_HOST || `aws-0-${env.SUPABASE_REGION || 'ap-south-1'}.pooler.supabase.com`;

  const client = new pg.Client({
    host,
    port: 5432, // session mode: transaction mode (6543) refuses some DDL
    user: `postgres.${env.SUPABASE_PROJECT_REF}`,
    password: env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  try {
    // Simple query protocol: one round trip, many statements, so a whole .sql
    // file runs as written instead of needing to be split on semicolons.
    const result = await client.query(query);
    const last = Array.isArray(result) ? result.filter((r) => r.rows?.length).pop() : result;
    return last?.rows ?? [];
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const args = process.argv.slice(2);
  const query =
    args[0] === '--query' ? args.slice(1).join(' ') : readFileSync(args[0], 'utf8');
  runSql(query)
    .then((rows) => {
      console.log(JSON.stringify(rows, null, 2));
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
