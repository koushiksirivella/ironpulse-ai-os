#!/usr/bin/env node
// Manage operator logins for the admin panel.
//
//   node scripts/operator.mjs list
//   node scripts/operator.mjs create you@example.com
//   node scripts/operator.mjs delete you@example.com
//
// The password is read from the OPERATOR_PASSWORD environment variable, or
// typed at a prompt. It is never taken as a command-line argument, because
// arguments land in shell history and in the process list.
//
// An operator can read every order for every gym. There is no tenant scoping
// on `authenticated` yet (see supabase/policies.sql) — one account, one
// person. Do not hand these out.
//
// This script needs the service role key. It fetches it from the Management
// API using the PAT in .env.supabase.local, holds it in memory, and never
// writes or prints it.

import { createInterface } from 'node:readline/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../engine/config.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function env() {
  const raw = readFileSync(join(ROOT, '.env.supabase.local'), 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

async function serviceKey() {
  const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF } = env();
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/api-keys?reveal=true`,
    { headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}` } }
  );
  if (!res.ok) throw new Error(`could not read project keys (${res.status})`);
  const keys = await res.json();
  const key = keys.find((k) => k.name === 'service_role')?.api_key;
  if (!key) throw new Error('no service_role key on this project');
  return key;
}

async function admin(path, init = {}) {
  const key = await serviceKey();
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.msg || body.error_description || body.message || `failed (${res.status})`);
  return body;
}

async function askPassword() {
  if (process.env.OPERATOR_PASSWORD) return process.env.OPERATOR_PASSWORD;
  if (!process.stdin.isTTY) {
    throw new Error('set OPERATOR_PASSWORD in the environment, or run this in a terminal');
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const pw = await rl.question('New password (at least 10 characters): ');
  rl.close();
  return pw;
}

const [command, email] = process.argv.slice(2);

try {
  if (command === 'list') {
    const { users } = await admin('users');
    if (!users.length) console.log('no operator accounts yet');
    for (const u of users) {
      console.log(`${u.email}  created ${u.created_at.slice(0, 10)}  last sign in ${u.last_sign_in_at?.slice(0, 10) ?? 'never'}`);
    }
  } else if (command === 'create') {
    if (!email) throw new Error('usage: node scripts/operator.mjs create you@example.com');
    const password = await askPassword();
    if (password.length < 10) throw new Error('use at least 10 characters — this account can read every order');
    await admin('users', {
      method: 'POST',
      // Confirmed immediately: there is no inbox flow for an operator account,
      // and an unconfirmed user cannot sign in.
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    console.log(`operator created: ${email}`);
    console.log('sign in at /admin/');
  } else if (command === 'delete') {
    if (!email) throw new Error('usage: node scripts/operator.mjs delete you@example.com');
    const { users } = await admin('users');
    const user = users.find((u) => u.email === email);
    if (!user) throw new Error(`no such operator: ${email}`);
    await admin(`users/${user.id}`, { method: 'DELETE' });
    console.log(`operator deleted: ${email}`);
  } else if (command === 'signup') {
    // The no-token path. Uses the PUBLIC signup endpoint with the anon key, so
    // it works when the personal access token is dead or absent.
    //
    // It creates an ACCOUNT, not an operator. The account can do nothing at all
    // until a row is added to public.operators — see
    // supabase/HARDEN-AND-BOOTSTRAP.sql. That separation is the whole fix.
    if (!email) throw new Error('usage: node scripts/operator.mjs signup you@example.com');
    const password = await askPassword();
    if (password.length < 10) throw new Error('use at least 10 characters');

    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.msg || body.error_description || `signup failed (${res.status})`);

    console.log(`account created: ${email}`);
    if (!body.access_token) {
      console.log('check your inbox and confirm the address before signing in');
    }
    console.log('\nNEXT, and it does not work until you do both:');
    console.log('  1. run supabase/HARDEN-AND-BOOTSTRAP.sql in the Supabase SQL editor');
    console.log(`     (put ${email} in the placeholder at the top)`);
    console.log('  2. Authentication > Sign In / Providers > Email > turn OFF "Allow new users"');
  } else {
    console.log('usage: node scripts/operator.mjs list | create <email> | delete <email> | signup <email>');
    console.log('  create  needs a working personal access token');
    console.log('  signup  works without one, but needs the SQL bootstrap afterwards');
    process.exit(1);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
